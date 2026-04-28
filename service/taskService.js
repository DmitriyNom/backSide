// service/taskService.js
const { Task, Exercise, User, Media, Note, ExerciseMedia, TrainingContext, Friend, sequelize } = require('../models');
const TaskRepository = require('../repository/taskRepository');
const ApiError = require('../error/ApiError');

class TaskService {
   // ========== ОСНОВНЫЕ МЕТОДЫ ==========

   /**
    * Создать задание
    */
   async createTask(data, userId) {
      const transaction = await sequelize.transaction();

      try {
         const { user_id: targetUserId } = data;

         // 1. Проверка существования пользователя
         const targetUser = await User.findByPk(targetUserId);
         if (!targetUser) {
            throw ApiError.notFound('Пользователь не найден');
         }

         // 2. Проверка права на создание задания
         const canAssign = await this.canAssignTask(userId, targetUserId);

         if (!canAssign && userId !== targetUserId) {
            throw ApiError.forbidden('У вас нет прав для создания заданий этому пользователю');
         }

         // 3. Если есть exercise_id — проверяем доступ к упражнению
         if (data.exercise_id) {
            const hasAccess = await this.checkExerciseAccess(data.exercise_id, userId);
            if (!hasAccess) {
               throw ApiError.forbidden('Нет прав на использование этого упражнения');
            }
         }

         // 4. Валидация: либо exercise_id, либо custom_title
         if (!data.exercise_id && !data.custom_title) {
            throw ApiError.badRequest('Укажите либо упражнение из библиотеки, либо название задания');
         }

         // 5. Создаём задание
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

         const task = await TaskRepository.create(taskData, transaction);

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

         // Проверка: задание должно быть кастомным
         if (task.exercise_id) {
            throw ApiError.badRequest('Это задание уже привязано к упражнению');
         }

         // Проверка прав: только создатель задания
         if (task.assigned_by_user_id !== userId) {
            throw ApiError.forbidden('Только создатель задания может сохранить его в библиотеку');
         }

         // Создаём новое упражнение
         const exercise = await Exercise.create({
            user_id: userId,
            title: task.custom_title,
            description: task.custom_description,
            is_public: false,
            usage_count: 1
         }, { transaction });

         // Копируем медиа из TaskMedia в ExerciseMedia
         const mediaList = await TaskRepository.getMedia(taskId, transaction);
         for (let i = 0; i < mediaList.length; i++) {
            const tm = mediaList[i];
            await ExerciseMedia.create({
               exercise_id: exercise.id,
               media_id: tm.media_id,
               order_index: tm.order_index
            }, { transaction });
         }

         // Обновляем задание
         await TaskRepository.update(task.id, {
            exercise_id: exercise.id,
            custom_title: null,
            custom_description: null
         }, transaction);

         // Удаляем временные связи TaskMedia
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

         // Рассчитываем процент выполнения
         const completionPercentage = this.calculateCompletionPercentage(
            task.metrics,
            completionData.actual_metrics || {}
         );

         // Рассчитываем начисленные баллы
         const pointsEarned = this.calculatePoints(
            task.points_earned || 0,
            completionPercentage,
            completionData.felt_difficulty,
            task.due_date
         );

         // Обновляем задание
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

         // Обновляем Bridge-заметку
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
    * Обновить задание (тренер/создатель)
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

      // Нельзя редактировать выполненное задание
      if (task.status === 'completed') {
         throw ApiError.badRequest('Нельзя редактировать выполненное задание');
      }

      const updatedTask = await TaskRepository.update(id, updateData);

      // Обновляем Bridge-заметку
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

      // Удаляем Bridge-заметку
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

      // 2. Проверка на админа
      const currentUser = await User.findByPk(userId, { attributes: ['role'] });
      const isAdmin = currentUser?.role === 'admin';

      if (isAdmin) {
         const allUsers = await User.findAll({
            attributes: ['id', 'userName', 'email', 'role'],
            limit: 100
         });
         allUsers.forEach(u => {
            if (u.id !== userId) {
               users.push({
                  ...u.toJSON(),
                  relation_type: 'admin',
                  relation_name: 'Все пользователи (Admin)'
               });
            }
         });
         return users;
      }

      // 3. Тренируемые спортсмены (через TrainingContext)
      const trainees = await TaskRepository.getTraineesByTrainer(userId);
      trainees.forEach(t => {
         users.push({
            id: t.id,
            userName: t.userName,
            email: t.email,
            role: t.role,
            relation_type: 'trainee',
            relation_name: `Подопечный (${t.sport})`,
            context_id: t.context_id
         });
      });

      return users;
   }

   // ========== МЕТОДЫ ДЛЯ РАБОТЫ С МЕДИА ==========

   /**
    * Добавить медиа к кастомному заданию
    */
   async addMediaToTask(taskId, mediaId, userId, userRole) {
      const task = await TaskRepository.findById(taskId);
      if (!task) {
         throw ApiError.notFound('Задание не найдено');
      }

      // Только создатель задания может добавлять медиа
      const isAssigner = task.assigned_by_user_id === userId;
      const isAdmin = userRole === 'admin';

      if (!isAssigner && !isAdmin) {
         throw ApiError.forbidden('Только создатель задания может добавлять медиа');
      }

      // Только для кастомных заданий
      if (task.exercise_id) {
         throw ApiError.badRequest('Медиа можно добавлять только к кастомным заданиям');
      }

      // Проверяем существование медиа
      const media = await Media.findByPk(mediaId);
      if (!media) {
         throw ApiError.notFound('Медиа не найдено');
      }

      const existingMedia = await TaskRepository.getMedia(taskId);
      const orderIndex = existingMedia.length;

      return await TaskRepository.addMedia(taskId, mediaId, orderIndex);
   }

   /**
    * Удалить медиа из кастомного задания
    */
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

   /**
    * Получить медиа задания
    */
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
    */
   async canAssignTask(assignerId, targetUserId) {
      // 1. Админ может всё
      const assigner = await User.findByPk(assignerId, { attributes: ['role'] });
      if (assigner?.role === 'admin') return true;

      // 2. Сам себе может
      if (assignerId === targetUserId) return true;

      // 3. Проверка активного TrainingContext (как тренер)
      return await TaskRepository.hasActiveTrainingContext(assignerId, targetUserId);
   }

   /**
    * Проверка доступа к упражнению
    */
   async checkExerciseAccess(exerciseId, userId) {
      const exercise = await Exercise.findByPk(exerciseId);
      if (!exercise) return false;

      // Своё упражнение или публичное
      if (exercise.user_id === userId || exercise.is_public) return true;

      // Проверка доступа через ExerciseAccess
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

   /**
    * Рассчитать процент выполнения
    */
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

   /**
    * Рассчитать начисляемые баллы
    */
   calculatePoints(basePoints, completionPercentage, feltDifficulty, dueDate) {
      let points = Math.round(basePoints * (completionPercentage / 100));

      // Бонус за высокую сложность
      if (feltDifficulty && feltDifficulty >= 8) {
         points += Math.round(basePoints * 0.1);
      }

      // Бонус за досрочное выполнение
      if (dueDate && new Date() < new Date(dueDate)) {
         points += Math.round(basePoints * 0.15);
      }

      return Math.min(points, basePoints * 1.5);
   }

   // ========== РАБОТА С BRIDGE-ЗАМЕТКАМИ ==========

   /**
    * Создать Bridge-заметку для задания
    */
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

   /**
    * Обновить Bridge-заметку
    */
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

   /**
    * Удалить Bridge-заметку
    */
   async deleteBridgeNoteForTask(task) {
      await Note.destroy({
         where: { bridge_type: 'task', bridge_id: task.id }
      });
   }

   // ========== ФОРМАТТЕРЫ ==========

   /**
    * Форматировать метрики для отображения
    */
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

   /**
    * Форматировать описание задания
    */
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