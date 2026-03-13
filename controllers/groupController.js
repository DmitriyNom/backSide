// controllers/groupController.js
const groupService = require('../service/groupService');
const { validationResult } = require('express-validator');
const ApiError = require('../error/ApiError');

class GroupController {
   // Создание группы
   async createGroup(req, res, next) {
      try {
         // 1. Валидация (проверка запроса)
         const errors = validationResult(req);
         if (!errors.isEmpty()) {
            return next(ApiError.badRequest('Ошибка валидации', errors.array()));
         }

         // 2. Вызов сервиса (делегирование)
         const group = await groupService.createGroup(req.body, req.user.id);

         // 3. Ответ (только HTTP)
         res.status(201).json(group);
      } catch (error) {
         next(error); // Передаем ошибку в middleware
      }
   }

   // Получение групп пользователя
   async getMyGroups(req, res, next) {
      try {
         const groups = await groupService.getUserGroups(req.user.id);
         res.json(groups);
      } catch (error) {
         next(error);
      }
   }

   // Получение группы по ID
   async getGroupById(req, res, next) {
      try {
         const group = await groupService.getGroupById(req.params.id, req.user.id);
         res.json(group);
      } catch (error) {
         next(error);
      }
   }

   // Обновление группы
   async updateGroup(req, res, next) {
      try {
         const group = await groupService.updateGroup(
            req.params.id,
            req.user.id,
            req.body
         );
         res.json(group);
      } catch (error) {
         next(error);
      }
   }

   // Удаление группы
   async deleteGroup(req, res, next) {
      try {
         const result = await groupService.deleteGroup(req.params.id, req.user.id);
         res.json(result);
      } catch (error) {
         next(error);
      }
   }

   // Получение участников группы
   async getGroupMembers(req, res, next) {
      try {
         const members = await groupService.getGroupMembers(req.params.id, req.user.id);
         res.json(members);
      } catch (error) {
         next(error);
      }
   }

   // Добавление участника
   async addMember(req, res, next) {
      try {
         const { userId, role } = req.body;

         // Валидация
         if (!userId) {
            return next(ApiError.badRequest('userId обязателен'));
         }

         const member = await groupService.addMember(
            req.params.id,
            userId,
            role,
            req.user.id
         );

         res.status(201).json(member);
      } catch (error) {
         next(error);
      }
   }

   // Изменение роли участника
   async updateMemberRole(req, res, next) {
      try {
         const { role } = req.body;

         if (!role) {
            return next(ApiError.badRequest('role обязателен'));
         }

         const member = await groupService.updateMemberRole(
            req.params.id,
            req.params.userId,
            role,
            req.user.id
         );

         res.json(member);
      } catch (error) {
         next(error);
      }
   }

   // Удаление участника
   async removeMember(req, res, next) {
      try {
         const result = await groupService.removeMember(
            req.params.id,
            req.params.userId,
            req.user.id
         );

         res.json(result);
      } catch (error) {
         next(error);
      }
   }

   // Получение заданий группы
   async getGroupAssignments(req, res, next) {
      try {
         const assignments = await groupService.getGroupAssignments(
            req.params.id,
            req.user.id
         );
         res.json(assignments);
      } catch (error) {
         next(error);
      }
   }

   // Создание задания для группы
   async createGroupAssignment(req, res, next) {
      try {
         const assignment = await groupService.createGroupAssignment(
            req.params.id,
            req.user.id,
            req.body
         );
         res.status(201).json(assignment);
      } catch (error) {
         next(error);
      }
   }

   // Статистика группы
   async getGroupStats(req, res, next) {
      try {
         const stats = await groupService.getGroupStats(req.params.id, req.user.id);
         res.json(stats);
      } catch (error) {
         next(error);
      }
   }
}

module.exports = new GroupController();