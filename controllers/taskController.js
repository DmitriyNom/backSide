// // controllers/taskController.js
// const TaskService = require('../service/taskService');
// const ApiError = require('../error/ApiError');

// class TaskController {
//    /**
//     * Создать задание
//     * POST /api/tasks
//     * @body {exercise_id, user_id, custom_title, custom_description, metrics, priority, due_date, points_earned, order_index, media_ids}
//     */
//    async createTask(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const {
//             exercise_id,
//             user_id,
//             custom_title,
//             custom_description,
//             metrics,
//             priority,
//             due_date,
//             points_earned,
//             order_index,
//             media_ids
//          } = req.body;

//          if (!user_id) {
//             return next(ApiError.badRequest('Укажите спортсмена (user_id)'));
//          }

//          if (!metrics || Object.keys(metrics).length === 0) {
//             return next(ApiError.badRequest('Укажите метрики выполнения (metrics)'));
//          }

//          const task = await TaskService.createTask({
//             exercise_id: exercise_id || null,
//             user_id,
//             custom_title: custom_title || null,
//             custom_description: custom_description || null,
//             metrics,
//             priority: priority || 2,
//             due_date: due_date || null,
//             points_earned: points_earned || 0,
//             order_index: order_index || 0,
//             media_ids: media_ids || []
//          }, userId);

//          return res.status(201).json({
//             success: true,
//             message: 'Задание создано',
//             data: task
//          });
//       } catch (e) {
//          if (e.status === 403) return next(ApiError.forbidden(e.message));
//          if (e.status === 404) return next(ApiError.notFound(e.message));
//          if (e.status === 400) return next(ApiError.badRequest(e.message));
//          next(ApiError.internal(e.message));
//       }
//    }

//    /**
//     * Сохранить кастомное задание в библиотеку
//     * POST /api/tasks/:id/save-to-library
//     */
//    async saveToLibrary(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const { id } = req.params;

//          const task = await TaskService.saveCustomTaskToLibrary(id, userId);

//          return res.json({
//             success: true,
//             message: 'Задание сохранено в библиотеку упражнений',
//             data: task
//          });
//       } catch (e) {
//          if (e.status === 403) return next(ApiError.forbidden(e.message));
//          if (e.status === 404) return next(ApiError.notFound(e.message));
//          if (e.status === 400) return next(ApiError.badRequest(e.message));
//          next(ApiError.internal(e.message));
//       }
//    }

//    /**
//     * Получить мои задания
//     * GET /api/tasks?role=assignee&status=active&limit=50&offset=0
//     * @query role - assignee (получатель) или assigner (создатель)
//     * @query status - active, completed, archived
//     * @query limit - лимит
//     * @query offset - смещение
//     */
//    async getMyTasks(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const { role = 'assignee', status = null, limit = 50, offset = 0 } = req.query;

//          const result = await TaskService.getUserTasks(userId, role, status);

//          return res.json({
//             success: true,
//             data: result.rows,
//             total: result.count,
//             limit: parseInt(limit),
//             offset: parseInt(offset)
//          });
//       } catch (e) {
//          next(ApiError.internal(e.message));
//       }
//    }

//    /**
//     * Получить задание по ID
//     * GET /api/tasks/:id
//     */
//    async getTaskById(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const userRole = req.user.role;
//          const { id } = req.params;

//          const task = await TaskService.getTaskById(id, userId, userRole);

//          return res.json({
//             success: true,
//             data: task
//          });
//       } catch (e) {
//          if (e.message === 'Задание не найдено') {
//             return next(ApiError.notFound(e.message));
//          }
//          if (e.message === 'Нет доступа к этому заданию') {
//             return next(ApiError.forbidden(e.message));
//          }
//          next(ApiError.internal(e.message));
//       }
//    }

//    /**
//     * Завершить задание
//     * PUT /api/tasks/:id/complete
//     * @body {actual_metrics, felt_difficulty, comment}
//     */
//    async completeTask(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const { id } = req.params;
//          const { actual_metrics, felt_difficulty, comment } = req.body;

//          const task = await TaskService.completeTask(id, userId, {
//             actual_metrics: actual_metrics || {},
//             felt_difficulty: felt_difficulty || null,
//             comment: comment || null
//          });

//          return res.json({
//             success: true,
//             message: 'Задание отмечено как выполненное',
//             data: task
//          });
//       } catch (e) {
//          if (e.message === 'Задание не найдено') {
//             return next(ApiError.notFound(e.message));
//          }
//          if (e.message === 'Только спортсмен, кому назначено задание, может отметить его выполнение') {
//             return next(ApiError.forbidden(e.message));
//          }
//          if (e.message === 'Задание уже выполнено') {
//             return next(ApiError.badRequest(e.message));
//          }
//          next(ApiError.internal(e.message));
//       }
//    }

//    /**
//     * Обновить задание
//     * PUT /api/tasks/:id
//     * @body {custom_title, custom_description, metrics, priority, due_date, points_earned, order_index, status}
//     */
//    async updateTask(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const userRole = req.user.role;
//          const { id } = req.params;
//          const {
//             custom_title,
//             custom_description,
//             metrics,
//             priority,
//             due_date,
//             points_earned,
//             order_index,
//             status
//          } = req.body;

//          const updateData = {};
//          if (custom_title !== undefined) updateData.custom_title = custom_title;
//          if (custom_description !== undefined) updateData.custom_description = custom_description;
//          if (metrics !== undefined) updateData.metrics = metrics;
//          if (priority !== undefined) updateData.priority = priority;
//          if (due_date !== undefined) updateData.due_date = due_date;
//          if (points_earned !== undefined) updateData.points_earned = points_earned;
//          if (order_index !== undefined) updateData.order_index = order_index;
//          if (status !== undefined) updateData.status = status;

//          const task = await TaskService.updateTask(id, updateData, userId, userRole);

//          return res.json({
//             success: true,
//             message: 'Задание обновлено',
//             data: task
//          });
//       } catch (e) {
//          if (e.message === 'Задание не найдено') {
//             return next(ApiError.notFound(e.message));
//          }
//          if (e.message === 'Только создатель задания может его редактировать') {
//             return next(ApiError.forbidden(e.message));
//          }
//          if (e.message === 'Нельзя редактировать выполненное задание') {
//             return next(ApiError.badRequest(e.message));
//          }
//          next(ApiError.internal(e.message));
//       }
//    }

//    /**
//     * Удалить задание
//     * DELETE /api/tasks/:id
//     */
//    async deleteTask(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const userRole = req.user.role;
//          const { id } = req.params;

//          await TaskService.deleteTask(id, userId, userRole);

//          return res.json({
//             success: true,
//             message: 'Задание удалено'
//          });
//       } catch (e) {
//          if (e.message === 'Задание не найдено') {
//             return next(ApiError.notFound(e.message));
//          }
//          if (e.message === 'Только создатель задания может его удалить') {
//             return next(ApiError.forbidden(e.message));
//          }
//          next(ApiError.internal(e.message));
//       }
//    }

//    /**
//     * Получить активные задания (для дашборда спортсмена)
//     * GET /api/tasks/active?limit=10
//     */
//    async getActiveTasks(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const { limit = 10 } = req.query;

//          const tasks = await TaskService.getActiveTasksForAthlete(userId, parseInt(limit));

//          return res.json({
//             success: true,
//             data: tasks
//          });
//       } catch (e) {
//          next(ApiError.internal(e.message));
//       }
//    }

//    /**
//     * Получить статистику по заданиям
//     * GET /api/tasks/stats
//     */
//    async getTaskStats(req, res, next) {
//       try {
//          const userId = req.user.id;

//          const stats = await TaskService.getTaskStats(userId);

//          return res.json({
//             success: true,
//             data: stats
//          });
//       } catch (e) {
//          next(ApiError.internal(e.message));
//       }
//    }

//    /**
//     * Получить задания с истекающим сроком
//     * GET /api/tasks/expiring?days=3
//     */
//    async getExpiringTasks(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const { days = 3 } = req.query;

//          const tasks = await TaskService.getExpiringTasks(userId, parseInt(days));

//          return res.json({
//             success: true,
//             data: tasks
//          });
//       } catch (e) {
//          next(ApiError.internal(e.message));
//       }
//    }

//    /**
//     * Получить список пользователей, для которых можно создавать задания
//     * GET /api/tasks/assignable-users
//     */
//    async getAssignableUsers(req, res, next) {
//       try {
//          const userId = req.user.id;

//          const users = await TaskService.getAssignableUsers(userId);

//          return res.json({
//             success: true,
//             data: users
//          });
//       } catch (e) {
//          next(ApiError.internal(e.message));
//       }
//    }

//    /**
//     * Добавить медиа к кастомному заданию
//     * POST /api/tasks/:id/media
//     * @body {media_id}
//     */
//    async addMedia(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const userRole = req.user.role;
//          const { id } = req.params;
//          const { media_id } = req.body;

//          if (!media_id) {
//             return next(ApiError.badRequest('Укажите media_id'));
//          }

//          const result = await TaskService.addMediaToTask(id, media_id, userId, userRole);

//          return res.status(201).json({
//             success: true,
//             message: 'Медиа добавлено к заданию',
//             data: result
//          });
//       } catch (e) {
//          if (e.message === 'Задание не найдено') {
//             return next(ApiError.notFound(e.message));
//          }
//          if (e.message === 'Медиа не найдено') {
//             return next(ApiError.notFound(e.message));
//          }
//          if (e.status === 403) return next(ApiError.forbidden(e.message));
//          if (e.status === 400) return next(ApiError.badRequest(e.message));
//          next(ApiError.internal(e.message));
//       }
//    }

//    /**
//     * Удалить медиа из кастомного задания
//     * DELETE /api/tasks/:id/media/:mediaId
//     */
//    async removeMedia(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const userRole = req.user.role;
//          const { id, mediaId } = req.params;

//          await TaskService.removeMediaFromTask(id, mediaId, userId, userRole);

//          return res.json({
//             success: true,
//             message: 'Медиа удалено из задания'
//          });
//       } catch (e) {
//          if (e.message === 'Задание не найдено') {
//             return next(ApiError.notFound(e.message));
//          }
//          if (e.status === 403) return next(ApiError.forbidden(e.message));
//          if (e.status === 400) return next(ApiError.badRequest(e.message));
//          next(ApiError.internal(e.message));
//       }
//    }

//    /**
//     * Получить медиа задания
//     * GET /api/tasks/:id/media
//     */
//    async getTaskMedia(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const userRole = req.user.role;
//          const { id } = req.params;

//          const media = await TaskService.getTaskMedia(id, userId, userRole);

//          return res.json({
//             success: true,
//             data: media
//          });
//       } catch (e) {
//          if (e.message === 'Задание не найдено') {
//             return next(ApiError.notFound(e.message));
//          }
//          if (e.message === 'Нет доступа к этому заданию') {
//             return next(ApiError.forbidden(e.message));
//          }
//          next(ApiError.internal(e.message));
//       }
//    }
// }

// module.exports = new TaskController();

// controllers/taskController.js
const TaskService = require('../service/taskService');
const ApiError = require('../error/ApiError');

class TaskController {
   /**
    * Создать задание
    * POST /api/tasks
    * @body {exercise_id, user_id, custom_title, custom_description, metrics, priority, due_date, points_earned, order_index, media_ids}
    */
   async createTask(req, res, next) {
      try {
         const userId = req.user.id;
         const {
            exercise_id,
            user_id,
            custom_title,
            custom_description,
            metrics,
            priority,
            due_date,
            points_earned,
            order_index,
            media_ids
         } = req.body;

         if (!user_id) {
            return next(ApiError.badRequest('Укажите спортсмена (user_id)'));
         }

         if (!metrics || Object.keys(metrics).length === 0) {
            return next(ApiError.badRequest('Укажите метрики выполнения (metrics)'));
         }

         const task = await TaskService.createTask({
            exercise_id: exercise_id || null,
            user_id,
            custom_title: custom_title || null,
            custom_description: custom_description || null,
            metrics,
            priority: priority || 2,
            due_date: due_date || null,
            points_earned: points_earned || 0,
            order_index: order_index || 0,
            media_ids: media_ids || []
         }, userId);

         return res.status(201).json({
            success: true,
            message: 'Задание создано',
            data: task
         });
      } catch (e) {
         if (e.status === 403) return next(ApiError.forbidden(e.message));
         if (e.status === 404) return next(ApiError.notFound(e.message));
         if (e.status === 400) return next(ApiError.badRequest(e.message));
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Сохранить кастомное задание в библиотеку
    * POST /api/tasks/:id/save-to-library
    */
   async saveToLibrary(req, res, next) {
      try {
         const userId = req.user.id;
         const { id } = req.params;

         const task = await TaskService.saveCustomTaskToLibrary(id, userId);

         return res.json({
            success: true,
            message: 'Задание сохранено в библиотеку упражнений',
            data: task
         });
      } catch (e) {
         if (e.status === 403) return next(ApiError.forbidden(e.message));
         if (e.status === 404) return next(ApiError.notFound(e.message));
         if (e.status === 400) return next(ApiError.badRequest(e.message));
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Получить мои задания
    * GET /api/tasks?role=assignee&status=active&sortBy=created_at&sortOrder=desc&limit=50&offset=0
    * @query role - assignee (я выполняю) или assigner (я создал)
    * @query status - active, completed, archived
    * @query sortBy - created_at, due_date, title, priority
    * @query sortOrder - asc, desc
    * @query limit - лимит
    * @query offset - смещение
    */
   async getMyTasks(req, res, next) {
      try {
         const userId = req.user.id;
         const {
            role = 'assignee',
            status = null,
            sortBy = 'created_at',
            sortOrder = 'desc',
            limit = 50,
            offset = 0
         } = req.query;

         const result = await TaskService.getUserTasks(userId, role, status, sortBy, sortOrder);

         return res.json({
            success: true,
            data: result.rows,
            total: result.count,
            limit: parseInt(limit),
            offset: parseInt(offset)
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Получить задание по ID
    * GET /api/tasks/:id
    */
   async getTaskById(req, res, next) {
      try {
         const userId = req.user.id;
         const userRole = req.user.role;
         const { id } = req.params;

         const task = await TaskService.getTaskById(id, userId, userRole);

         return res.json({
            success: true,
            data: task
         });
      } catch (e) {
         if (e.message === 'Задание не найдено') {
            return next(ApiError.notFound(e.message));
         }
         if (e.message === 'Нет доступа к этому заданию') {
            return next(ApiError.forbidden(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Завершить задание
    * PUT /api/tasks/:id/complete
    * @body {actual_metrics, felt_difficulty, comment}
    */
   async completeTask(req, res, next) {
      try {
         const userId = req.user.id;
         const { id } = req.params;
         const { actual_metrics, felt_difficulty, comment } = req.body;

         const task = await TaskService.completeTask(id, userId, {
            actual_metrics: actual_metrics || {},
            felt_difficulty: felt_difficulty || null,
            comment: comment || null
         });

         return res.json({
            success: true,
            message: 'Задание отмечено как выполненное',
            data: task
         });
      } catch (e) {
         if (e.message === 'Задание не найдено') {
            return next(ApiError.notFound(e.message));
         }
         if (e.message === 'Только спортсмен, кому назначено задание, может отметить его выполнение') {
            return next(ApiError.forbidden(e.message));
         }
         if (e.message === 'Задание уже выполнено') {
            return next(ApiError.badRequest(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Обновить задание
    * PUT /api/tasks/:id
    * @body {custom_title, custom_description, metrics, priority, due_date, points_earned, order_index, status}
    */
   async updateTask(req, res, next) {
      try {
         const userId = req.user.id;
         const userRole = req.user.role;
         const { id } = req.params;
         const {
            custom_title,
            custom_description,
            metrics,
            priority,
            due_date,
            points_earned,
            order_index,
            status
         } = req.body;

         const updateData = {};
         if (custom_title !== undefined) updateData.custom_title = custom_title;
         if (custom_description !== undefined) updateData.custom_description = custom_description;
         if (metrics !== undefined) updateData.metrics = metrics;
         if (priority !== undefined) updateData.priority = priority;
         if (due_date !== undefined) updateData.due_date = due_date;
         if (points_earned !== undefined) updateData.points_earned = points_earned;
         if (order_index !== undefined) updateData.order_index = order_index;
         if (status !== undefined) updateData.status = status;

         const task = await TaskService.updateTask(id, updateData, userId, userRole);

         return res.json({
            success: true,
            message: 'Задание обновлено',
            data: task
         });
      } catch (e) {
         if (e.message === 'Задание не найдено') {
            return next(ApiError.notFound(e.message));
         }
         if (e.message === 'Только создатель задания может его редактировать') {
            return next(ApiError.forbidden(e.message));
         }
         if (e.message === 'Нельзя редактировать выполненное задание') {
            return next(ApiError.badRequest(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Удалить задание
    * DELETE /api/tasks/:id
    */
   async deleteTask(req, res, next) {
      try {
         const userId = req.user.id;
         const userRole = req.user.role;
         const { id } = req.params;

         await TaskService.deleteTask(id, userId, userRole);

         return res.json({
            success: true,
            message: 'Задание удалено'
         });
      } catch (e) {
         if (e.message === 'Задание не найдено') {
            return next(ApiError.notFound(e.message));
         }
         if (e.message === 'Только создатель задания может его удалить') {
            return next(ApiError.forbidden(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Получить активные задания (для дашборда спортсмена)
    * GET /api/tasks/active?limit=10
    */
   async getActiveTasks(req, res, next) {
      try {
         const userId = req.user.id;
         const { limit = 10 } = req.query;

         const tasks = await TaskService.getActiveTasksForAthlete(userId, parseInt(limit));

         return res.json({
            success: true,
            data: tasks
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Получить статистику по заданиям
    * GET /api/tasks/stats
    */
   async getTaskStats(req, res, next) {
      try {
         const userId = req.user.id;

         const stats = await TaskService.getTaskStats(userId);

         return res.json({
            success: true,
            data: stats
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Получить задания с истекающим сроком
    * GET /api/tasks/expiring?days=3
    */
   async getExpiringTasks(req, res, next) {
      try {
         const userId = req.user.id;
         const { days = 3 } = req.query;

         const tasks = await TaskService.getExpiringTasks(userId, parseInt(days));

         return res.json({
            success: true,
            data: tasks
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Получить список пользователей, для которых можно создавать задания
    * GET /api/tasks/assignable-users
    */
   async getAssignableUsers(req, res, next) {
      try {
         const userId = req.user.id;

         const users = await TaskService.getAssignableUsers(userId);

         return res.json({
            success: true,
            data: users
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Добавить медиа к кастомному заданию
    * POST /api/tasks/:id/media
    * @body {media_id}
    */
   async addMedia(req, res, next) {
      try {
         const userId = req.user.id;
         const userRole = req.user.role;
         const { id } = req.params;
         const { media_id } = req.body;

         if (!media_id) {
            return next(ApiError.badRequest('Укажите media_id'));
         }

         const result = await TaskService.addMediaToTask(id, media_id, userId, userRole);

         return res.status(201).json({
            success: true,
            message: 'Медиа добавлено к заданию',
            data: result
         });
      } catch (e) {
         if (e.message === 'Задание не найдено') {
            return next(ApiError.notFound(e.message));
         }
         if (e.message === 'Медиа не найдено') {
            return next(ApiError.notFound(e.message));
         }
         if (e.status === 403) return next(ApiError.forbidden(e.message));
         if (e.status === 400) return next(ApiError.badRequest(e.message));
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Удалить медиа из кастомного задания
    * DELETE /api/tasks/:id/media/:mediaId
    */
   async removeMedia(req, res, next) {
      try {
         const userId = req.user.id;
         const userRole = req.user.role;
         const { id, mediaId } = req.params;

         await TaskService.removeMediaFromTask(id, mediaId, userId, userRole);

         return res.json({
            success: true,
            message: 'Медиа удалено из задания'
         });
      } catch (e) {
         if (e.message === 'Задание не найдено') {
            return next(ApiError.notFound(e.message));
         }
         if (e.status === 403) return next(ApiError.forbidden(e.message));
         if (e.status === 400) return next(ApiError.badRequest(e.message));
         next(ApiError.internal(e.message));
      }
   }

   /**
    * Получить медиа задания
    * GET /api/tasks/:id/media
    */
   async getTaskMedia(req, res, next) {
      try {
         const userId = req.user.id;
         const userRole = req.user.role;
         const { id } = req.params;

         const media = await TaskService.getTaskMedia(id, userId, userRole);

         return res.json({
            success: true,
            data: media
         });
      } catch (e) {
         if (e.message === 'Задание не найдено') {
            return next(ApiError.notFound(e.message));
         }
         if (e.message === 'Нет доступа к этому заданию') {
            return next(ApiError.forbidden(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }
}

module.exports = new TaskController();