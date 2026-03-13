const { Group, GroupMember, User, Note } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../db');

class GroupRepository {
   // ===== Группы =====

   async create(groupData, transaction = null) {
      return await Group.create(groupData, { transaction });
   }

   async findById(id, options = {}) {
      return await Group.findByPk(id, options);
   }

   async findOne(where, options = {}) {
      return await Group.findOne({ where, ...options });
   }

   async findAll(where, options = {}) {
      return await Group.findAll({ where, ...options });
   }

   async update(id, updateData, transaction = null) {
      const group = await Group.findByPk(id);
      if (!group) return null;
      return await group.update(updateData, { transaction });
   }

   async delete(id, transaction = null) {
      const group = await Group.findByPk(id);
      if (!group) return false;
      await group.destroy({ transaction });
      return true;
   }

   async softDelete(id, transaction = null) {
      const group = await Group.findByPk(id);
      if (!group) return false;
      await group.update({ status: 'deleted' }, { transaction });
      return true;
   }

   // ===== Участники групп =====

   async addMember(memberData, transaction = null) {
      return await GroupMember.create(memberData, { transaction });
   }

   async findMember(groupId, userId, options = {}) {
      return await GroupMember.findOne({
         where: { group_id: groupId, user_id: userId },
         ...options
      });
   }

   async findAllMembers(groupId, options = {}) {
      return await GroupMember.findAll({
         where: { group_id: groupId },
         ...options
      });
   }

   async updateMember(groupId, userId, updateData, transaction = null) {
      const member = await GroupMember.findOne({
         where: { group_id: groupId, user_id: userId }
      });
      if (!member) return null;
      return await member.update(updateData, { transaction });
   }

   async removeMember(groupId, userId, transaction = null) {
      const member = await GroupMember.findOne({
         where: { group_id: groupId, user_id: userId }
      });
      if (!member) return false;
      await member.destroy({ transaction });
      return true;
   }

   async softRemoveMember(groupId, userId, transaction = null) {
      const member = await GroupMember.findOne({
         where: { group_id: groupId, user_id: userId }
      });
      if (!member) return false;
      await member.update({ status: 'inactive' }, { transaction });
      return true;
   }

   async countMembers(groupId, where = {}) {
      return await GroupMember.count({
         where: { group_id: groupId, ...where }
      });
   }

   // ===== Сложные запросы с включениями =====

   async getGroupWithDetails(groupId, userId = null) {
      const include = [
         {
            model: User,
            as: 'creator',
            attributes: ['id', 'userName', 'email', 'role', 'userAvatar']
         },
         {
            model: GroupMember,
            as: 'memberships',
            where: { status: 'active' },
            required: false,
            include: [{
               model: User,
               as: 'user',
               attributes: ['id', 'userName', 'email', 'role', 'userAvatar', 'sport_specialization', 'training_level']
            }]
         }
      ];

      // Если указан userId, добавляем информацию о его роли
      if (userId) {
         include.push({
            model: GroupMember,
            as: 'currentUserMembership',
            where: { user_id: userId },
            required: false,
            attributes: ['role', 'joined_at', 'status']
         });
      }

      return await Group.findByPk(groupId, { include });
   }

   async getUserGroups(userId, options = {}) {
      return await Group.findAll({
         where: { status: 'active' },
         include: [
            {
               model: User,
               as: 'members',
               where: { id: userId },
               through: {
                  where: { status: 'active' }
               },
               attributes: []
            },
            {
               model: User,
               as: 'creator',
               attributes: ['id', 'userName', 'email', 'role', 'userAvatar']
            },
            {
               model: GroupMember,
               as: 'memberships',
               where: { status: 'active' },
               required: false,
               include: [{
                  model: User,
                  as: 'user',
                  attributes: ['id', 'userName', 'email', 'role', 'userAvatar']
               }]
            }
         ],
         order: [['createdAt', 'DESC']],
         ...options
      });
   }

   async getGroupMembersWithDetails(groupId, where = {}) {
      return await GroupMember.findAll({
         where: { group_id: groupId, ...where },
         include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'userName', 'email', 'role', 'userAvatar', 'sport_specialization', 'training_level']
         }],
         order: [
            ['role', 'ASC'],
            [User, 'userName', 'ASC']
         ]
      });
   }

   // ===== Задания группы =====

   async getGroupAssignments(groupId, options = {}) {
      return await Note.findAll({
         where: { assigned_to_group_id: groupId },
         include: [
            {
               model: User,
               as: 'assignedBy',
               attributes: ['id', 'userName', 'userAvatar']
            },
            {
               model: User,
               as: 'assignedTo',
               attributes: ['id', 'userName', 'userAvatar']
            },
            {
               model: Group,
               as: 'assignedGroup',
               attributes: ['id', 'name']
            }
         ],
         order: [['planned_date', 'ASC'], ['createdAt', 'DESC']],
         ...options
      });
   }

   async createGroupAssignment(assignmentData, transaction = null) {
      return await Note.create(assignmentData, { transaction });
   }

   // ===== Статистика =====

   async getGroupStats(groupId) {
      const [membersByRole, assignmentsByStatus, assignmentsByType] = await Promise.all([
         GroupMember.findAll({
            where: { group_id: groupId, status: 'active' },
            attributes: [
               'role',
               [sequelize.fn('COUNT', sequelize.col('role')), 'count']
            ],
            group: ['role']
         }),
         Note.findAll({
            where: { assigned_to_group_id: groupId },
            attributes: [
               'status',
               [sequelize.fn('COUNT', sequelize.col('status')), 'count']
            ],
            group: ['status']
         }),
         Note.findAll({
            where: { assigned_to_group_id: groupId },
            attributes: [
               'note_type',
               [sequelize.fn('COUNT', sequelize.col('note_type')), 'count']
            ],
            group: ['note_type']
         })
      ]);

      return {
         membersByRole,
         assignmentsByStatus,
         assignmentsByType
      };
   }

   async getRecentActivities(groupId, limit = 5) {
      return await Note.findAll({
         where: { assigned_to_group_id: groupId },
         limit,
         order: [['createdAt', 'DESC']],
         include: [{
            model: User,
            as: 'assignedBy',
            attributes: ['id', 'userName']
         }]
      });
   }

   // ===== Транзакции =====

   async transaction(callback) {
      const transaction = await sequelize.transaction();
      try {
         const result = await callback(transaction);
         await transaction.commit();
         return result;
      } catch (error) {
         await transaction.rollback();
         throw error;
      }
   }

   // ===== Проверки прав =====

   async checkMembership(groupId, userId, options = {}) {
      return await GroupMember.findOne({
         where: { group_id: groupId, user_id: userId, ...options }
      });
   }

   async checkRole(groupId, userId, allowedRoles) {
      const member = await GroupMember.findOne({
         where: {
            group_id: groupId,
            user_id: userId,
            role: { [Op.in]: allowedRoles },
            status: 'active'
         }
      });
      return !!member;
   }

   async isAdmin(groupId, userId) {
      return await this.checkRole(groupId, userId, ['admin']);
   }

   async isCaptainOrAdmin(groupId, userId) {
      return await this.checkRole(groupId, userId, ['admin', 'captain']);
   }
}

module.exports = new GroupRepository();