const groupRepository = require('../repository/groupRepository');
const { User, Group, GroupMember } = require('../models');
const ApiError = require('../error/ApiError');

class GroupService {
   // ===== Создание группы =====

   async createGroup(groupData, userId) {
      return await groupRepository.transaction(async (transaction) => {
         // Создаем группу
         const group = await groupRepository.create({
            ...groupData,
            created_by_user_id: userId,
            status: 'active'
         }, transaction);

         // Добавляем создателя как администратора
         await groupRepository.addMember({
            group_id: group.id,
            user_id: userId,
            role: 'admin',
            joined_by_user_id: userId,
            status: 'active'
         }, transaction);

         // Возвращаем группу с деталями
         return await groupRepository.getGroupWithDetails(group.id, userId);
      });
   }

   // ===== Получение групп пользователя =====

   async getUserGroups(userId) {
      const groups = await groupRepository.getUserGroups(userId);

      // Добавляем роль текущего пользователя в каждой группе
      const groupsWithRole = await Promise.all(groups.map(async (group) => {
         const membership = await groupRepository.findMember(group.id, userId, {
            attributes: ['role']
         });

         return {
            ...group.toJSON(),
            user_role: membership ? membership.role : null
         };
      }));

      return groupsWithRole;
   }

   // ===== Получение группы по ID =====

   async getGroupById(groupId, userId) {
      const group = await groupRepository.getGroupWithDetails(groupId, userId);

      if (!group) {
         throw ApiError.notFound('Группа не найдена');
      }

      // Проверяем доступ
      const isMember = group.memberships?.some(m => m.user_id === userId);
      const isCreator = group.created_by_user_id === userId;

      if (!isMember && !isCreator) {
         throw ApiError.forbidden('У вас нет доступа к этой группе');
      }

      // Получаем роль пользователя
      let userRole = null;
      if (isCreator) {
         userRole = 'admin';
      } else {
         const membership = await groupRepository.findMember(groupId, userId);
         userRole = membership?.role;
      }

      return {
         ...group.toJSON(),
         user_role: userRole
      };
   }

   // ===== Обновление группы =====

   async updateGroup(groupId, userId, updateData) {
      // Проверяем существование группы
      const group = await groupRepository.findById(groupId);
      if (!group) {
         throw ApiError.notFound('Группа не найдена');
      }

      // Проверяем права (только admin)
      const isAdmin = await groupRepository.isAdmin(groupId, userId);
      const isCreator = group.created_by_user_id === userId;

      if (!isAdmin && !isCreator) {
         throw ApiError.forbidden('У вас нет прав на обновление группы');
      }

      // Обновляем группу
      const updated = await groupRepository.update(groupId, updateData);
      if (!updated) {
         throw ApiError.internal('Ошибка при обновлении группы');
      }

      return await groupRepository.getGroupWithDetails(groupId, userId);
   }

   // ===== Удаление группы (soft delete) =====

   async deleteGroup(groupId, userId) {
      const group = await groupRepository.findById(groupId);
      if (!group) {
         throw ApiError.notFound('Группа не найдена');
      }

      // Проверяем права (только admin)
      const isAdmin = await groupRepository.isAdmin(groupId, userId);
      const isCreator = group.created_by_user_id === userId;

      if (!isAdmin && !isCreator) {
         throw ApiError.forbidden('У вас нет прав на удаление группы');
      }

      const deleted = await groupRepository.softDelete(groupId);
      if (!deleted) {
         throw ApiError.internal('Ошибка при удалении группы');
      }

      return { message: 'Группа успешно удалена' };
   }

   // ===== Управление участниками =====

   async getGroupMembers(groupId, userId) {
      // Проверяем доступ к группе
      await this.checkGroupAccess(groupId, userId);

      return await groupRepository.getGroupMembersWithDetails(groupId, { status: 'active' });
   }

   async addMember(groupId, newUserId, role, addedByUserId) {
      // Проверяем права (admin или captain)
      const canAdd = await groupRepository.isCaptainOrAdmin(groupId, addedByUserId);
      const group = await groupRepository.findById(groupId);

      if (!canAdd && group.created_by_user_id !== addedByUserId) {
         throw ApiError.forbidden('У вас нет прав на добавление участников');
      }

      // Проверяем существование пользователя
      const user = await User.findByPk(newUserId);
      if (!user) {
         throw ApiError.notFound('Пользователь не найден');
      }

      // Добавляем или обновляем участника
      const [member, created] = await groupRepository.transaction(async (transaction) => {
         let member = await groupRepository.findMember(groupId, newUserId);

         if (member) {
            // Обновляем существующего
            member = await groupRepository.updateMember(groupId, newUserId, {
               status: 'active',
               role: role || member.role,
               joined_by_user_id: addedByUserId
            }, transaction);
         } else {
            // Создаем нового
            member = await groupRepository.addMember({
               group_id: groupId,
               user_id: newUserId,
               role: role || 'member',
               joined_by_user_id: addedByUserId,
               status: 'active'
            }, transaction);
         }

         return [member, !created];
      });

      // Возвращаем с деталями пользователя
      return await groupRepository.findMember(groupId, newUserId, {
         include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'userName', 'email', 'role', 'userAvatar']
         }]
      });
   }

   async updateMemberRole(groupId, targetUserId, newRole, currentUserId) {
      // Проверяем права (только admin)
      const isAdmin = await groupRepository.isAdmin(groupId, currentUserId);
      const group = await groupRepository.findById(groupId);

      if (!isAdmin && group.created_by_user_id !== currentUserId) {
         throw ApiError.forbidden('У вас нет прав на изменение ролей');
      }

      // Находим участника
      const member = await groupRepository.findMember(groupId, targetUserId);
      if (!member) {
         throw ApiError.notFound('Участник не найден');
      }

      // Нельзя изменить роль админа (кроме самого себя)
      if (member.role === 'admin' && member.user_id !== currentUserId) {
         throw ApiError.forbidden('Нельзя изменить роль администратора');
      }

      // Обновляем роль
      const updated = await groupRepository.updateMember(groupId, targetUserId, { role: newRole });
      if (!updated) {
         throw ApiError.internal('Ошибка при изменении роли');
      }

      // Возвращаем обновленного участника
      return await groupRepository.findMember(groupId, targetUserId, {
         include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'userName', 'email', 'role', 'userAvatar']
         }]
      });
   }

   async removeMember(groupId, targetUserId, currentUserId) {
      // Проверяем права
      const isAdmin = await groupRepository.isAdmin(groupId, currentUserId);
      const group = await groupRepository.findById(groupId);
      const isSelfRemoval = parseInt(targetUserId) === currentUserId;

      if (!isSelfRemoval && !isAdmin && group.created_by_user_id !== currentUserId) {
         throw ApiError.forbidden('У вас нет прав на удаление участников');
      }

      // Находим участника
      const member = await groupRepository.findMember(groupId, targetUserId);
      if (!member) {
         throw ApiError.notFound('Участник не найден');
      }

      // Проверяем, не последний ли это админ
      if (member.role === 'admin' && !isSelfRemoval) {
         const adminCount = await groupRepository.countMembers(groupId, {
            role: 'admin',
            status: 'active'
         });

         if (adminCount <= 1) {
            throw ApiError.forbidden('Нельзя удалить последнего администратора');
         }
      }

      // Soft delete
      const removed = await groupRepository.softRemoveMember(groupId, targetUserId);
      if (!removed) {
         throw ApiError.internal('Ошибка при удалении участника');
      }

      return { message: 'Участник удален из группы' };
   }

   // ===== Задания группы =====

   async getGroupAssignments(groupId, userId) {
      // Проверяем доступ к группе
      await this.checkGroupAccess(groupId, userId);

      return await groupRepository.getGroupAssignments(groupId);
   }

   async createGroupAssignment(groupId, userId, assignmentData) {
      // Проверяем права на создание задания
      await this.checkAssignmentPermissions(groupId, userId);

      // Создаем задание
      const assignment = await groupRepository.createGroupAssignment({
         ...assignmentData,
         user_id: userId,
         assigned_by_user_id: userId,
         assigned_to_group_id: groupId,
         note_type: assignmentData.note_type || 'group_assignment',
         status: 'active'
      });

      // Возвращаем с включениями
      return await groupRepository.getGroupAssignments(groupId, {
         where: { id: assignment.id },
         limit: 1
      }).then(results => results[0]);
   }

   // ===== Статистика =====

   async getGroupStats(groupId, userId) {
      // Проверяем доступ к группе
      await this.checkGroupAccess(groupId, userId);

      const [stats, totalMembers, recentActivities] = await Promise.all([
         groupRepository.getGroupStats(groupId),
         groupRepository.countMembers(groupId, { status: 'active' }),
         groupRepository.getRecentActivities(groupId)
      ]);

      // Форматируем статистику
      const membersByRole = stats.membersByRole.reduce((acc, item) => {
         acc[item.role] = parseInt(item.dataValues.count);
         return acc;
      }, {});

      const assignmentsByStatus = stats.assignmentsByStatus.reduce((acc, item) => {
         acc[item.status] = parseInt(item.dataValues.count);
         return acc;
      }, {});

      const assignmentsByType = stats.assignmentsByType.reduce((acc, item) => {
         acc[item.note_type] = parseInt(item.dataValues.count);
         return acc;
      }, {});

      return {
         totalMembers,
         membersByRole,
         assignments: {
            byStatus: assignmentsByStatus,
            byType: assignmentsByType,
            total: Object.values(assignmentsByStatus).reduce((a, b) => a + b, 0)
         },
         recentActivities
      };
   }

   // ===== Вспомогательные методы =====

   async checkGroupAccess(groupId, userId) {
      const member = await groupRepository.checkMembership(groupId, userId, {
         status: 'active'
      });

      const group = await groupRepository.findById(groupId);

      if (!member && group?.created_by_user_id !== userId) {
         throw ApiError.forbidden('У вас нет доступа к этой группе');
      }

      return true;
   }

   async checkAssignmentPermissions(groupId, userId) {
      const member = await groupRepository.findMember(groupId, userId, {
         include: [{
            model: Group,
            as: 'group'
         }]
      });

      if (!member) {
         throw ApiError.forbidden('У вас нет доступа к этой группе');
      }

      const group = member.group;
      const settings = group.settings;
      let canCreate = false;

      switch (member.role) {
         case 'admin':
            canCreate = true;
            break;
         case 'captain':
            canCreate = settings.captainCanAssignToGroup || settings.captainCanAssignToMembers;
            break;
         case 'member':
            canCreate = settings.membersCanAssignToGroup || settings.membersCanAssignToEachOther;
            break;
      }

      if (!canCreate) {
         throw ApiError.forbidden('У вас нет прав на создание заданий в этой группе');
      }

      return true;
   }

   // Получение настроек группы по умолчанию для типа
   getDefaultSettings(groupType) {
      const defaults = {
         training: {
            membersCanAssignToEachOther: false,
            membersCanAssignToGroup: false,
            captainCanAssignToMembers: true,
            captainCanAssignToGroup: true,
            maxPeerTaskDifficulty: 3,
            peerTasksReviewedBy: 'admin',
            groupTasksReviewedBy: 'trainer',
            notifyOnNewTasks: true,
            notifyOnSubmissions: true
         },
         pair: {
            membersCanAssignToEachOther: true,
            membersCanAssignToGroup: true,
            captainCanAssignToMembers: false,
            maxPeerTaskDifficulty: 5,
            peerTasksReviewedBy: 'creator',
            groupTasksReviewedBy: 'creator',
            notifyOnNewTasks: true,
            notifyOnSubmissions: true
         },
         project: {
            membersCanAssignToEachOther: true,
            membersCanAssignToGroup: true,
            captainCanAssignToMembers: true,
            maxPeerTaskDifficulty: 4,
            peerTasksReviewedBy: 'captain',
            groupTasksReviewedBy: 'captain',
            notifyOnNewTasks: true,
            notifyOnSubmissions: true
         },
         competition: {
            membersCanAssignToEachOther: false,
            membersCanAssignToGroup: false,
            captainCanAssignToMembers: true,
            captainCanAssignToGroup: true,
            maxPeerTaskDifficulty: 5,
            peerTasksReviewedBy: 'admin',
            groupTasksReviewedBy: 'admin',
            notifyOnNewTasks: true,
            notifyOnSubmissions: true
         }
      };

      return defaults[groupType] || defaults.training;
   }
}

module.exports = new GroupService();