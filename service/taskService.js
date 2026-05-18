// service/taskService.js
const { Task, Exercise, User, Media, ExerciseMedia, sequelize, friend: Friend, training_context: TrainingContext, note: Note } = require('../models');
const ApiError = require('../error/ApiError');
const { Op } = require('sequelize');
const TrainingContextService = require('./trainingContextService');

const TaskRepository = require('../repository/taskRepository');


console.log('✅ TaskRepository loaded:', typeof TaskRepository?.create);

class TaskService {
   // ========== ОСНОВНЫЕ МЕТОДЫ ==========

   /**
    * Создать задание
    */
   async createTask(data, userId) {

      console.log('🔍 1. TaskRepository.create exists:', typeof TaskRepository?.create);

      const transaction = await sequelize.transaction();

      try {
         const { user_id: targetUserId } = data;

         // 1. Проверка существования пользователя
         const targetUser = await User.findByPk(targetUserId);
         if (!targetUser) {
            throw ApiError.notFound('Пользователь не найден');
         }

         // 2. Если есть exercise_id — проверяем доступ к упражнению
         if (data.exercise_id) {
            const hasAccess = await this.checkExerciseAccess(data.exercise_id, userId);
            if (!hasAccess) {
               throw ApiError.forbidden('Нет прав на использование этого упражнения');
            }
         }

         // 3. Валидация: либо exercise_id, либо custom_title
         if (!data.exercise_id && !data.custom_title) {
            throw ApiError.badRequest('Укажите либо упражнение из библиотеки, либо название задания');
         }

         // Создаём taskData с базовыми полями
         const taskData = {
            exercise_id: data.exercise_id || null,
            user_id: targetUserId,
            assigned_by_user_id: userId,
            custom_title: data.custom_title || null,
            custom_description: data.custom_description || null,
            metrics: data.metrics,
            priority: data.priority || 2,
            due_date: data.due_date || null,
            points_earned: data.points_earned || 0,
            order_index: data.order_index || 0,
            status: 'active'
         };

         // 4. Если задание не себе — создаём или находим TrainingContext
         if (userId !== targetUserId) {
            const friendship = await Friend.findOne({
               where: {
                  [Op.or]: [
                     { user_id: userId, friend_id: targetUserId },
                     { user_id: targetUserId, friend_id: userId }
                  ],
                  status: 'accepted'
               }
            });

            if (!friendship) {
               throw ApiError.forbidden('Вы должны быть друзьями для создания заданий');
            }

            const sport = 'hockey';

            let context = await TrainingContext.findOne({
               where: {
                  trainer_id: userId,
                  trainee_id: targetUserId,
                  sport: sport,
                  status: 'active'
               }
            });

            if (!context) {
               context = await TrainingContextService.createContext(userId, friendship.id, {
                  sport: sport,
                  trainer_id: userId,
                  trainee_id: targetUserId
               });
            }

            taskData.context_id = context.id;
         }

         console.log('🔍 2. About to call TaskRepository.create with:', taskData);
         // 5. Создаём задание
         const task = await TaskRepository.create(taskData, transaction);


         console.log('🔍 3. Task created:', task?.id);

         // 6. Если есть медиа и задание кастомное — привязываем
         if (data.media_ids && data.media_ids.length > 0 && !data.exercise_id) {
            for (let i = 0; i < data.media_ids.length; i++) {
               await TaskRepository.addMedia(task.id, data.media_ids[i], i, transaction);
            }
         }

         // 7. Создаём Bridge-заметку для спортсмена
         await this.createBridgeNoteForTask(task, transaction);

         // 8. Если задание из библиотеки — увеличиваем usage_count
         if (data.exercise_id) {
            await Exercise.increment('usage_count', {
               by: 1,
               where: { id: data.exercise_id },
               transaction
            });
         }

         await transaction.commit();

         return await TaskRepository.findById(task.id);

      } catch (error) {
         await transaction.rollback();
         throw error;
      }
   }

   /**
    * Сохранить кастомное задание в библиотеку
    */
   async saveCustomTaskToLibrary(taskId, userId) {
      const transaction = await sequelize.transaction();

      try {
         const task = await TaskRepository.findById(taskId, transaction);
         if (!task) {
            throw ApiError.notFound('Задание не найдено');
         }

         if (task.exercise_id) {
            throw ApiError.badRequest('Это задание уже привязано к упражнению');
         }

         if (task.assigned_by_user_id !== userId) {
            throw ApiError.forbidden('Только создатель задания может сохранить его в библиотеку');
         }

         const exercise = await Exercise.create({
            user_id: userId,
            title: task.custom_title,
            description: task.custom_description,
            is_public: false,
            usage_count: 1
         }, { transaction });

         const mediaList = await TaskRepository.getMedia(taskId, transaction);
         for (let i = 0; i < mediaList.length; i++) {
            const tm = mediaList[i];
            await ExerciseMedia.create({
               exercise_id: exercise.id,
               media_id: tm.media_id,
               order_index: tm.order_index
            }, { transaction });
         }

         await TaskRepository.update(task.id, {
            exercise_id: exercise.id,
            custom_title: null,
            custom_description: null
         }, transaction);

         const { TaskMedia } = require('../models');
         await TaskMedia.destroy({ where: { task_id: task.id }, transaction });

         await transaction.commit();

         return await TaskRepository.findById(task.id);

      } catch (error) {
         await transaction.rollback();
         throw error;
      }
   }

   /**
    * Получить задания пользователя
    */
   async getUserTasks(userId, role = 'assignee', status = null) {
      return await TaskRepository.findAllForUser(userId, { role, status });
   }

   /**
    * Получить задание по ID с проверкой прав
    */
   async getTaskById(id, userId, userRole) {
      const task = await TaskRepository.findById(id);
      if (!task) {
         throw ApiError.notFound('Задание не найдено');
      }

      const isAssignee = task.user_id === userId;
      const isAssigner = task.assigned_by_user_id === userId;
      const isAdmin = userRole === 'admin';

      if (!isAssignee && !isAssigner && !isAdmin) {
         throw ApiError.forbidden('Нет доступа к этому заданию');
      }

      return task;
   }

   /**
    * Завершить задание (спортсмен)
    */
   async completeTask(id, userId, completionData) {
      const transaction = await sequelize.transaction();

      try {
         const task = await TaskRepository.findById(id, transaction);
         if (!task) {
            throw ApiError.notFound('Задание не найдено');
         }

         if (task.user_id !== userId) {
            throw ApiError.forbidden('Только спортсмен, кому назначено задание, может отметить его выполнение');
         }

         if (task.status === 'completed') {
            throw ApiError.badRequest('Задание уже выполнено');
         }

         const completionPercentage = this.calculateCompletionPercentage(
            task.metrics,
            completionData.actual_metrics || {}
         );

         const pointsEarned = this.calculatePoints(
            task.points_earned || 0,
            completionPercentage,
            completionData.felt_difficulty,
            task.due_date
         );

         await TaskRepository.updateCompletionPercentage(
            id,
            completionPercentage,
            completionData.actual_metrics || null,
            completionData.felt_difficulty || null,
            transaction
         );

         await TaskRepository.updateStatus(id, 'completed', new Date(), transaction);

         if (pointsEarned > 0) {
            await TaskRepository.update(id, { points_earned: pointsEarned }, transaction);
         }

         const updatedTask = await TaskRepository.findById(id, transaction);
         await this.updateBridgeNoteForTask(updatedTask, transaction);

         await transaction.commit();

         return await TaskRepository.findById(id);

      } catch (error) {
         await transaction.rollback();
         throw error;
      }
   }

   /**
    * Обновить задание
    */
   async updateTask(id, updateData, userId, userRole) {
      const task = await TaskRepository.findById(id);
      if (!task) {
         throw ApiError.notFound('Задание не найдено');
      }

      const isAssigner = task.assigned_by_user_id === userId;
      const isAdmin = userRole === 'admin';

      if (!isAssigner && !isAdmin) {
         throw ApiError.forbidden('Только создатель задания может его редактировать');
      }

      if (task.status === 'completed') {
         throw ApiError.badRequest('Нельзя редактировать выполненное задание');
      }

      const updatedTask = await TaskRepository.update(id, updateData);
      await this.updateBridgeNoteForTask(updatedTask);

      return updatedTask;
   }

   /**
    * Удалить задание
    */
   async deleteTask(id, userId, userRole) {
      const task = await TaskRepository.findById(id);
      if (!task) {
         throw ApiError.notFound('Задание не найдено');
      }

      const isAssigner = task.assigned_by_user_id === userId;
      const isAdmin = userRole === 'admin';

      if (!isAssigner && !isAdmin) {
         throw ApiError.forbidden('Только создатель задания может его удалить');
      }

      await this.deleteBridgeNoteForTask(task);
      return await TaskRepository.delete(id);
   }

   /**
    * Получить активные задания спортсмена (для дашборда)
    */
   async getActiveTasksForAthlete(userId, limit = 10) {
      return await TaskRepository.findActiveTasksForAthlete(userId, limit);
   }

   /**
    * Получить статистику по заданиям
    */
   async getTaskStats(userId) {
      return await TaskRepository.getUserTaskStats(userId);
   }

   /**
    * Получить задания с истекающим сроком
    */
   async getExpiringTasks(userId, daysThreshold = 3) {
      return await TaskRepository.findExpiringTasks(userId, daysThreshold);
   }

   /**
    * Получить список пользователей, для которых можно создавать задания
    */
   async getAssignableUsers(userId) {
      const users = [];

      try {
         // 1. Сам себя
         const self = await User.findByPk(userId, {
            attributes: ['id', 'userName', 'email', 'role']
         });
         if (self) {
            users.push({
               ...self.toJSON(),
               relation_type: 'self',
               relation_name: 'Себе'
            });
         }

         // 2. Получаем всех друзей
         const friendships = await Friend.findAll({
            where: {
               [Op.or]: [
                  { user_id: userId, status: 'accepted' },
                  { friend_id: userId, status: 'accepted' }
               ]
            }
         });

         // 3. Собираем ID друзей
         const friendIds = [];
         for (const friendship of friendships) {
            let friendId;
            if (friendship.user_id === userId) {
               friendId = friendship.friend_id;
            } else {
               friendId = friendship.user_id;
            }
            friendIds.push(friendId);
         }

         // 4. Получаем пользователей по ID
         if (friendIds.length > 0) {
            const friends = await User.findAll({
               where: { id: friendIds },
               attributes: ['id', 'userName', 'email', 'role']
            });

            friends.forEach(friend => {
               users.push({
                  id: friend.id,
                  userName: friend.userName,
                  email: friend.email,
                  role: friend.role,
                  relation_type: 'friend',
                  relation_name: 'Друг'
               });
            });
         }

         console.log('✅ getAssignableUsers returning:', users.length, 'users');
         return users;

      } catch (error) {
         console.error('❌ getAssignableUsers error:', error);
         throw ApiError.internal('Ошибка получения списка пользователей');
      }
   }

   // ========== МЕТОДЫ ДЛЯ РАБОТЫ С МЕДИА ==========

   async addMediaToTask(taskId, mediaId, userId, userRole) {
      const task = await TaskRepository.findById(taskId);
      if (!task) {
         throw ApiError.notFound('Задание не найдено');
      }

      const isAssigner = task.assigned_by_user_id === userId;
      const isAdmin = userRole === 'admin';

      if (!isAssigner && !isAdmin) {
         throw ApiError.forbidden('Только создатель задания может добавлять медиа');
      }

      if (task.exercise_id) {
         throw ApiError.badRequest('Медиа можно добавлять только к кастомным заданиям');
      }

      const media = await Media.findByPk(mediaId);
      if (!media) {
         throw ApiError.notFound('Медиа не найдено');
      }

      const existingMedia = await TaskRepository.getMedia(taskId);
      const orderIndex = existingMedia.length;

      return await TaskRepository.addMedia(taskId, mediaId, orderIndex);
   }

   async removeMediaFromTask(taskId, mediaId, userId, userRole) {
      const task = await TaskRepository.findById(taskId);
      if (!task) {
         throw ApiError.notFound('Задание не найдено');
      }

      const isAssigner = task.assigned_by_user_id === userId;
      const isAdmin = userRole === 'admin';

      if (!isAssigner && !isAdmin) {
         throw ApiError.forbidden('Только создатель задания может удалять медиа');
      }

      if (task.exercise_id) {
         throw ApiError.badRequest('Медиа можно удалять только из кастомных заданий');
      }

      return await TaskRepository.removeMedia(taskId, mediaId);
   }

   async getTaskMedia(taskId, userId, userRole) {
      const task = await TaskRepository.findById(taskId);
      if (!task) {
         throw ApiError.notFound('Задание не найдено');
      }

      const isAssignee = task.user_id === userId;
      const isAssigner = task.assigned_by_user_id === userId;
      const isAdmin = userRole === 'admin';

      if (!isAssignee && !isAssigner && !isAdmin) {
         throw ApiError.forbidden('Нет доступа к этому заданию');
      }

      return await TaskRepository.getMedia(taskId);
   }

   // ========== ПРОВЕРКИ ПРАВ ==========

   /**
    * Проверка, может ли пользователь создавать задания для другого
    * Упрощено: только себе можно без проверок
    * Для других проверка дружбы выполняется в createTask
    */
   async canAssignTask(assignerId, targetUserId) {
      // Только себе можно создавать задания без дополнительных проверок
      return assignerId === targetUserId;
   }

   /**
    * Проверка доступа к упражнению
    */
   async checkExerciseAccess(exerciseId, userId) {
      const exercise = await Exercise.findByPk(exerciseId);
      if (!exercise) return false;

      if (exercise.user_id === userId || exercise.is_public) return true;

      const { ExerciseAccess } = require('../models');
      const access = await ExerciseAccess.findOne({
         where: {
            exercise_id: exerciseId,
            user_id: userId,
            status: 'active'
         }
      });

      return !!access;
   }

   // ========== РАСЧЁТ МЕТРИК ==========

   calculateCompletionPercentage(plannedMetrics, actualMetrics) {
      if (!actualMetrics || Object.keys(actualMetrics).length === 0) return 0;

      const type = plannedMetrics.type || actualMetrics.type;

      switch (type) {
         case 'sets_reps':
            return this.calculateSetsRepsCompletion(plannedMetrics, actualMetrics);
         case 'duration':
            return this.calculateDurationCompletion(plannedMetrics, actualMetrics);
         case 'weight':
            return this.calculateWeightCompletion(plannedMetrics, actualMetrics);
         case 'interval':
            return this.calculateIntervalCompletion(plannedMetrics, actualMetrics);
         default:
            return actualMetrics.completed ? 100 : 0;
      }
   }

   calculateSetsRepsCompletion(planned, actual) {
      const plannedSets = planned.sets || 1;
      const actualSets = actual.sets || 0;

      let repsScore = 0;
      if (actual.reps && Array.isArray(actual.reps)) {
         const plannedRepsTotal = plannedSets * (planned.reps || 0);
         const actualRepsTotal = actual.reps.reduce((sum, r) => sum + r, 0);
         repsScore = Math.min(1, actualRepsTotal / plannedRepsTotal);
      } else if (actual.reps_total) {
         const plannedRepsTotal = plannedSets * (planned.reps || 0);
         repsScore = Math.min(1, actual.reps_total / plannedRepsTotal);
      }

      const setsScore = Math.min(1, actualSets / plannedSets);
      const weightScore = actual.weight_kg && planned.weight_kg
         ? Math.min(1, actual.weight_kg / planned.weight_kg)
         : 1;

      return Math.round((setsScore * 0.3 + repsScore * 0.5 + weightScore * 0.2) * 100);
   }

   calculateDurationCompletion(planned, actual) {
      const plannedDuration = planned.duration_seconds || (planned.duration_minutes * 60) || 0;
      const actualDuration = actual.duration_seconds || (actual.duration_minutes * 60) || 0;

      if (plannedDuration === 0) return actualDuration > 0 ? 100 : 0;
      return Math.min(100, Math.round((actualDuration / plannedDuration) * 100));
   }

   calculateWeightCompletion(planned, actual) {
      const plannedWeight = planned.weight_kg || 0;
      const actualWeight = actual.weight_kg || 0;

      if (plannedWeight === 0) return actualWeight > 0 ? 100 : 0;
      return Math.min(100, Math.round((actualWeight / plannedWeight) * 100));
   }

   calculateIntervalCompletion(planned, actual) {
      const plannedIntervals = planned.intervals || 1;
      const actualIntervals = actual.intervals_completed || actual.sets || 0;

      return Math.min(100, Math.round((actualIntervals / plannedIntervals) * 100));
   }

   calculatePoints(basePoints, completionPercentage, feltDifficulty, dueDate) {
      let points = Math.round(basePoints * (completionPercentage / 100));

      if (feltDifficulty && feltDifficulty >= 8) {
         points += Math.round(basePoints * 0.1);
      }

      if (dueDate && new Date() < new Date(dueDate)) {
         points += Math.round(basePoints * 0.15);
      }

      return Math.min(points, basePoints * 1.5);
   }

   // ========== РАБОТА С BRIDGE-ЗАМЕТКАМИ ==========

   async createBridgeNoteForTask(task, transaction = null) {
      const exercise = task.exercise_id
         ? await Exercise.findByPk(task.exercise_id, { transaction })
         : null;

      const title = exercise?.title || task.custom_title;
      const description = exercise?.description || task.custom_description;

      await Note.create({
         user_id: task.user_id,
         note_name: `📋 Задание: ${title}`,
         note_description: this.formatTaskDescription(task, description),
         bridge_type: 'task',
         bridge_id: task.id,
         bridge_metadata: {
            preview: {
               title: title,
               subtitle: this.formatTaskMetrics(task.metrics),
               status: task.status,
               due_date: task.due_date,
               priority: task.priority,
               assigner_id: task.assigned_by_user_id
            },
            actions: {
               primary: {
                  label: 'Выполнить',
                  action: 'complete_task',
                  url: `/tasks/${task.id}/execute`
               },
               secondary: {
                  label: 'Подробнее',
                  action: 'view_task',
                  url: `/tasks/${task.id}`
               }
            }
         }
      }, { transaction });
   }

   async updateBridgeNoteForTask(task, transaction = null) {
      const note = await Note.findOne({
         where: { bridge_type: 'task', bridge_id: task.id },
         transaction
      });

      if (note) {
         const metadata = note.bridge_metadata || {};
         if (metadata.preview) {
            metadata.preview.status = task.status;
            if (task.completed_at) {
               metadata.preview.completed_at = task.completed_at;
            }
         }

         await note.update({
            status: task.status === 'completed' ? 'completed' : 'active',
            bridge_metadata: metadata
         }, { transaction });
      }
   }

   async deleteBridgeNoteForTask(task) {
      await Note.destroy({
         where: { bridge_type: 'task', bridge_id: task.id }
      });
   }

   // ========== ФОРМАТТЕРЫ ==========

   formatTaskMetrics(metrics) {
      switch (metrics.type) {
         case 'sets_reps':
            return `${metrics.sets}×${metrics.reps} повторов`;
         case 'duration':
            const minutes = Math.floor((metrics.duration_seconds || 0) / 60);
            return `${minutes} минут`;
         case 'weight':
            return `${metrics.weight_kg} кг, ${metrics.sets}×${metrics.reps}`;
         case 'interval':
            return `${metrics.intervals} интервалов по ${metrics.work_seconds}с`;
         default:
            return 'Выполнить';
      }
   }

   formatTaskDescription(task, exerciseDescription) {
      let desc = exerciseDescription || '';
      if (task.custom_description) {
         desc = task.custom_description;
      }

      const metricsDesc = this.formatTaskMetrics(task.metrics);
      return `${desc}\n\n🎯 Задача: ${metricsDesc}`.trim();
   }
}

module.exports = new TaskService();