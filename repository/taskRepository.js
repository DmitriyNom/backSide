// repository/taskRepository.js
const { Task, TaskMedia, Exercise, User, Media, sequelize } = require('../models');
const { Op } = require('sequelize');

class TaskRepository {
   /**
    * Создать задание
    */
   async create(taskData, transaction = null) {
      return await Task.create(taskData, { transaction });
   }

   /**
    * Массовое создание (для групповых назначений)
    */
   async bulkCreate(tasksData, transaction = null) {
      return await Task.bulkCreate(tasksData, { transaction });
   }

   /**
    * Найти задание по ID с полными данными
    */
   async findById(id, transaction = null) {
      return await Task.findByPk(id, {
         include: [
            {
               model: Exercise,
               as: 'exercise',
               attributes: ['id', 'title', 'description', 'is_public']
            },
            {
               model: User,
               as: 'assignee',
               attributes: ['id', 'userName', 'email', 'role']
            },
            {
               model: User,
               as: 'assigner',
               attributes: ['id', 'userName', 'email', 'role']
            },
            {
               model: Media,
               as: 'media',
               through: { attributes: ['order_index'] },
               attributes: ['id', 'storage_url', 'file_type', 'thumbnail_url', 'original_filename']
            }
         ],
         transaction
      });
   }

   /**
    * Получить задания для пользователя
    */
   async findAllForUser(userId, options = {}) {
      const {
         limit = 50,
         offset = 0,
         status = null,
         role = 'assignee',
         order = [['due_date', 'ASC'], ['priority', 'DESC']]
      } = options;

      const where = {};
      if (role === 'assignee') {
         where.user_id = userId;
      } else {
         where.assigned_by_user_id = userId;
      }

      if (status) {
         where.status = status;
      }

      return await Task.findAndCountAll({
         where,
         include: [
            {
               model: Exercise,
               as: 'exercise',
               attributes: ['id', 'title', 'description']
            },
            {
               model: User,
               as: 'assignee',
               attributes: ['id', 'userName']
            },
            {
               model: User,
               as: 'assigner',
               attributes: ['id', 'userName']
            }
         ],
         limit,
         offset,
         order,
         distinct: true
      });
   }

   /**
    * Получить задания по упражнению
    */
   async findByExerciseId(exerciseId, options = {}) {
      const { limit = 100, offset = 0, order = [['created_at', 'DESC']] } = options;
      return await Task.findAndCountAll({
         where: { exercise_id: exerciseId },
         include: [
            { model: User, as: 'assignee', attributes: ['id', 'userName'] },
            { model: User, as: 'assigner', attributes: ['id', 'userName'] }
         ],
         limit,
         offset,
         order
      });
   }

   /**
    * Получить активные задания спортсмена
    */
   async findActiveTasksForAthlete(userId, limit = 10) {
      return await Task.findAll({
         where: {
            user_id: userId,
            status: 'active'
         },
         include: [
            {
               model: Exercise,
               as: 'exercise',
               attributes: ['id', 'title']
            }
         ],
         order: [
            ['priority', 'DESC'],
            ['due_date', 'ASC'],
            ['created_at', 'ASC']
         ],
         limit
      });
   }

   /**
    * Обновить задание
    */
   async update(id, updateData, transaction = null) {
      const [updatedCount, updatedRows] = await Task.update(updateData, {
         where: { id },
         returning: true,
         transaction
      });
      return updatedRows[0];
   }

   /**
    * Обновить статус задания
    */
   async updateStatus(id, status, completedDate = null, transaction = null) {
      const updateData = { status };
      if (status === 'completed' && completedDate) {
         updateData.completed_at = completedDate;
      } else if (status === 'completed' && !completedDate) {
         updateData.completed_at = new Date();
      }
      return await this.update(id, updateData, transaction);
   }

   /**
    * Обновить процент выполнения
    */
   async updateCompletionPercentage(id, percentage, actualMetrics = null, feltDifficulty = null, transaction = null) {
      const updateData = { completion_percentage: percentage };
      if (actualMetrics) updateData.actual_metrics = actualMetrics;
      if (feltDifficulty) updateData.felt_difficulty = feltDifficulty;
      return await this.update(id, updateData, transaction);
   }

   /**
    * Удалить задание
    */
   async delete(id, transaction = null) {
      return await Task.destroy({ where: { id }, transaction });
   }

   /**
    * Удалить все задания по упражнению
    */
   async deleteByExerciseId(exerciseId, transaction = null) {
      return await Task.destroy({ where: { exercise_id: exerciseId }, transaction });
   }

   /**
    * Добавить медиа к кастомному заданию
    */
   async addMedia(taskId, mediaId, orderIndex = 0, transaction = null) {
      return await TaskMedia.create({
         task_id: taskId,
         media_id: mediaId,
         order_index: orderIndex
      }, { transaction });
   }

   /**
    * Удалить медиа из кастомного задания
    */
   async removeMedia(taskId, mediaId, transaction = null) {
      return await TaskMedia.destroy({
         where: { task_id: taskId, media_id: mediaId },
         transaction
      });
   }

   /**
    * Получить медиа задания
    */
   async getMedia(taskId, transaction = null) {
      return await TaskMedia.findAll({
         where: { task_id: taskId },
         include: [
            { model: Media, as: 'media' }
         ],
         order: [['order_index', 'ASC']],
         transaction
      });
   }

   /**
    * Обновить порядок медиа
    */
   async updateMediaOrder(taskId, mediaOrders, transaction = null) {
      const promises = mediaOrders.map(({ media_id, order_index }) => {
         return TaskMedia.update(
            { order_index },
            { where: { task_id: taskId, media_id }, transaction }
         );
      });
      return await Promise.all(promises);
   }

   /**
    * Обновить порядок заданий (для тренировок, ЭТАП 6)
    */
   async updateOrder(taskIdsWithOrder, transaction = null) {
      const promises = taskIdsWithOrder.map(({ id, order_index }) => {
         return Task.update(
            { order_index },
            { where: { id }, transaction }
         );
      });
      return await Promise.all(promises);
   }

   /**
    * Получить статистику по заданиям пользователя
    */
   async getUserTaskStats(userId) {
      const stats = await Task.findAll({
         where: { user_id: userId },
         attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
         ],
         group: ['status']
      });

      const result = { active: 0, completed: 0, archived: 0 };
      stats.forEach(stat => {
         result[stat.status] = parseInt(stat.dataValues.count);
      });

      return result;
   }

   /**
    * Получить задания с истекающим сроком
    */
   async findExpiringTasks(userId, daysThreshold = 3) {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

      return await Task.findAll({
         where: {
            user_id: userId,
            status: 'active',
            due_date: {
               [Op.not]: null,
               [Op.between]: [new Date(), thresholdDate]
            }
         },
         include: [
            { model: Exercise, as: 'exercise', attributes: ['id', 'title'] }
         ],
         order: [['due_date', 'ASC']]
      });
   }

   // ========== НОВЫЕ МЕТОДЫ ДЛЯ ПРОВЕРКИ ПРАВ ==========

   /**
    * Получить список спортсменов, которых тренирует пользователь
    * @param {number} trainerId - ID тренера
    * @returns {Promise<Array>}
    */
   async getTraineesByTrainer(trainerId) {
      const { TrainingContext, User, Friend } = require('../models');

      const contexts = await TrainingContext.findAll({
         where: {
            trainer_id: trainerId,
            status: 'active'
         },
         include: [
            {
               model: User,
               as: 'trainee',
               attributes: ['id', 'userName', 'email', 'role']
            },
            {
               model: Friend,
               as: 'friendship',
               where: { status: 'accepted' },
               required: true,
               attributes: ['id', 'status']
            }
         ],
         attributes: ['id', 'sport', 'start_date']
      });

      return contexts.map(ctx => ({
         id: ctx.trainee.id,
         userName: ctx.trainee.userName,
         email: ctx.trainee.email,
         role: ctx.trainee.role,
         context_id: ctx.id,
         sport: ctx.sport,
         start_date: ctx.start_date
      }));
   }

   /**
    * Проверить, есть ли активный тренировочный контекст
    * @param {number} trainerId - ID тренера
    * @param {number} traineeId - ID спортсмена
    * @returns {Promise<boolean>}
    */
   async hasActiveTrainingContext(trainerId, traineeId) {
      const { TrainingContext, Friend } = require('../models');

      const context = await TrainingContext.findOne({
         where: {
            trainer_id: trainerId,
            trainee_id: traineeId,
            status: 'active'
         },
         include: [{
            model: Friend,
            as: 'friendship',
            where: { status: 'accepted' },
            required: true
         }]
      });

      return !!context;
   }
}

module.exports = new TaskRepository();