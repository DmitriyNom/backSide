// const ApiError = require('../error/ApiError');
// const NoteService = require('../service/noteService');
// const countOffset = require('../utils/countOffset');

// class NoteController {
//    // async createNote(req, res, next) {
//    //    console.log('req.body в createNote:', req.body);  // Лог: что приходит от фронта
//    //    console.log('req.user.id:', req.user?.id);  // Лог: user_id
//    //    try {
//    //       const user_id = req.user.id;
//    //       // 👇 ДОБАВЛЯЕМ НОВЫЕ ПОЛЯ
//    //       const {
//    //          note_name,
//    //          note_description,
//    //          note_priority,
//    //          note_mark,
//    //          note_expiration_date,  // 👈 Добавляем
//    //          note_is_completed      // 👈 Добавляем
//    //       } = req.body;

//    //       console.log('Извлеченные данные:', {
//    //          note_name,
//    //          note_description,
//    //          note_priority,
//    //          note_mark,
//    //          note_expiration_date,  // 👈 Проверяем что пришло
//    //          note_is_completed      // 👈 Проверяем что пришло
//    //       });

//    //       // 👇 ПЕРЕДАЕМ ВСЕ ПОЛЯ В СЕРВИС
//    //       const note = await NoteService.createNote({
//    //          note_name,
//    //          note_description,
//    //          note_priority,
//    //          note_mark,
//    //          note_expiration_date,  // 👈 Передаем
//    //          note_is_completed,     // 👈 Передаем
//    //          user_id
//    //       });

//    //       console.log('Созданная заметка:', note);  // Лог: результат
//    //       return res.json(note);
//    //    } catch (e) {
//    //       console.error('Ошибка в createNote:', e);  // Лог: ошибка
//    //       next(ApiError.internal(e.message));
//    //    }
//    // }

//    async createNote(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const {
//             note_name,
//             note_description,
//             note_priority,
//             note_mark,
//             note_expiration_date,
//             note_is_completed,
//             note_type = 'personal_note',           // Новое поле
//             assigned_to_user_id,                   // Новое поле  
//             planned_date,                          // Новое поле
//             planned_time,                          // Новое поле
//             duration_minutes,                      // Новое поле
//             difficulty_rating,                     // Новое поле
//             metadata = {}                          // Новое поле
//          } = req.body;

//          // Логика для назначения заданий
//          let assignedByUserId = null;

//          if (note_type === 'trainer_assignment') {
//             // Для тренерских заданий: проверка прав будет в сервисе
//             assignedByUserId = userId;
//          } else if (note_type === 'self_assignment') {
//             // Для заданий себе: назначаем самому себе
//             assigned_to_user_id = userId;
//          }

//          const note = await NoteService.createNote({
//             user_id: userId,
//             note_name,
//             note_description,
//             note_priority,
//             note_mark,
//             note_expiration_date,
//             note_is_completed,
//             note_type,
//             assigned_to_user_id,
//             assigned_by_user_id: assignedByUserId,
//             planned_date,
//             planned_time,
//             duration_minutes,
//             difficulty_rating,
//             metadata
//          });

//          return res.json(note);
//       } catch (e) {
//          next(ApiError.internal(e.message));
//       }
//    }


//    // async getAllNotes(req, res, next) {
//    //    try {
//    //       const userId = req.user.id;
//    //       let { limit, page } = req.query;
//    //       page = parseInt(page) || 1;
//    //       limit = parseInt(limit) || 10;  // Изменено с 100 на 10, чтобы соответствовать клиенту (меньше нагрузки)
//    //       const offset = countOffset(page, limit);

//    //       const { count: totalCount, rows: notes } = await NoteService.getAllNotes(userId, limit, offset);
//    //       const totalPages = Math.ceil(totalCount / limit);

//    //       return res.json({
//    //          notes,  // Массив заметок
//    //          totalPages,
//    //          currentPage: page,
//    //          totalCount,
//    //       });
//    //    } catch (e) {
//    //       next(ApiError.internal(e.message));
//    //    }
//    // }

//    async getAllNotes(req, res, next) {
//       try {
//          const userId = req.user.id;
//          let {
//             limit,
//             page,
//             note_type,      // Новый параметр фильтра
//             status,         // Новый параметр фильтра
//             planned_date,   // Новый параметр фильтра
//             show_assignments_only // Флаг: только задания
//          } = req.query;

//          page = parseInt(page) || 1;
//          limit = parseInt(limit) || 10;
//          const offset = countOffset(page, limit);

//          // Формируем фильтры
//          const filters = {};

//          if (note_type) {
//             filters.note_type = note_type;
//          }

//          if (status) {
//             filters.status = status;
//          }

//          if (planned_date) {
//             filters.planned_date = planned_date;
//          }

//          // Если запрошены только задания
//          if (show_assignments_only === 'true') {
//             filters.note_type = ['self_assignment', 'trainer_assignment'];
//          }

//          const { count: totalCount, rows: notes } =
//             await NoteService.getAllNotes(userId, limit, offset, filters);

//          return res.json({
//             notes,
//             totalPages: Math.ceil(totalCount / limit),
//             currentPage: page,
//             totalCount,
//          });
//       } catch (e) {
//          next(ApiError.internal(e.message));
//       }
//    }

//    async getOneNote(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const { id } = req.params;

//          const note = await NoteService.getOneNote(id, userId);
//          if (!note) {
//             return res.status(404).json({ message: 'Заметка не найдена' });
//          }
//          return res.json(note);
//       } catch (e) {
//          next(ApiError.internal(e.message));
//       }
//    }

//    async updateOneNote(req, res, next) {
//       console.log('req.body в updateOneNote:', req.body);  // Что приходит
//       console.log('req.params.id:', req.params.id);  // ID заметки
//       console.log('req.user.id:', req.user.id);  // user_id
//       try {
//          const userId = req.user.id;
//          const { id } = req.params;
//          const noteData = req.body;

//          console.log('Данные для обновления:', noteData);

//          const updatedNote = await NoteService.updateOneNote(noteData, id, userId);
//          console.log('Обновлённая заметка:', updatedNote);  // Результат обновления
//          if (!updatedNote) {
//             return res.status(404).json({ message: 'Заметка не найдена или нет доступа' });
//          }
//          return res.json(updatedNote);
//       } catch (e) {
//          console.error('Ошибка в updateOneNote:', e);  // Детали ошибки
//          next(ApiError.internal(e.message));
//       }
//    }


//    async deleteOneNote(req, res, next) {
//       try {
//          const userId = req.user.id;
//          const { id } = req.params;

//          const deleted = await NoteService.deleteOneNote(id, userId);
//          if (!deleted) {
//             return res.status(404).json({ message: 'Заметка не найдена или нет доступа' });
//          }
//          return res.json({ message: 'Заметка удалена' });
//       } catch (e) {
//          next(ApiError.internal(e.message));
//       }
//    }

//    async getUserAssignments(req, res, next) {
//       try {
//          const userId = req.user.id;
//          let {
//             limit,
//             page,
//             status,
//             note_type,
//             date_from,    // фильтр по дате "от"
//             date_to,      // фильтр по дате "до"
//             overdue       // только просроченные
//          } = req.query;

//          page = parseInt(page) || 1;
//          limit = parseInt(limit) || 10;
//          const offset = countOffset(page, limit);

//          const { count: totalCount, rows: assignments } =
//             await NoteService.getUserAssignments(userId, limit, offset, {
//                status,
//                note_type,
//                date_from,
//                date_to,
//                overdue: overdue === 'true'
//             });

//          return res.json({
//             assignments,
//             totalPages: Math.ceil(totalCount / limit),
//             currentPage: page,
//             totalCount,
//          });
//       } catch (e) {
//          next(ApiError.internal(e.message));
//       }
//    }
// }



// module.exports = new NoteController();


const ApiError = require('../error/ApiError');
const NoteService = require('../service/noteService');
const countOffset = require('../utils/countOffset');

class NoteController {
   async createNote(req, res, next) {
      try {
         const userId = req.user.id;
         const {
            note_name,
            note_description,
            note_priority,
            note_mark,
            note_expiration_date,
            note_is_completed,
            note_type = 'personal_note',
            assigned_to_user_id,
            planned_date,
            planned_time,
            duration_minutes,
            difficulty_rating,
            metadata = {}
         } = req.body;

         // Логика для назначения заданий
         let assignedByUserId = null;
         let finalAssignedToUserId = assigned_to_user_id;

         if (note_type === 'trainer_assignment') {
            // Для тренерских заданий: проверка прав будет в сервисе
            assignedByUserId = userId;
         } else if (note_type === 'self_assignment') {
            // Для заданий себе: назначаем самому себе
            finalAssignedToUserId = userId;
         }

         const note = await NoteService.createNote({
            user_id: userId,
            note_name,
            note_description,
            note_priority,
            note_mark,
            note_expiration_date,
            note_is_completed,
            note_type,
            assigned_to_user_id: finalAssignedToUserId,
            assigned_by_user_id: assignedByUserId,
            planned_date,
            planned_time,
            duration_minutes,
            difficulty_rating,
            metadata,
            status: note_type === 'personal_note' ? null : 'active' // Для заданий сразу active
         });

         return res.json(note);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async getAllNotes(req, res, next) {
      try {
         const userId = req.user.id;
         let {
            limit,
            page,
            note_type,
            status,
            planned_date,
            show_assignments_only
         } = req.query;

         page = parseInt(page) || 1;
         limit = parseInt(limit) || 10;
         const offset = countOffset(page, limit);

         // Формируем фильтры
         const filters = {};

         if (note_type) {
            filters.note_type = note_type;
         }

         if (status) {
            filters.status = status;
         }

         if (planned_date) {
            filters.planned_date = planned_date;
         }

         // Если запрошены только задания
         if (show_assignments_only === 'true') {
            filters.note_type = ['self_assignment', 'trainer_assignment'];
         }

         const { count: totalCount, rows: notes } =
            await NoteService.getAllNotes(userId, limit, offset, filters);

         return res.json({
            notes,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount,
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async getOneNote(req, res, next) {
      try {
         const userId = req.user.id;
         const { id } = req.params;

         const note = await NoteService.getOneNote(id, userId);
         if (!note) {
            return res.status(404).json({ message: 'Заметка не найдена' });
         }
         return res.json(note);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async updateOneNote(req, res, next) {
      console.log('req.body в updateOneNote:', req.body);
      console.log('req.params.id:', req.params.id);
      console.log('req.user.id:', req.user.id);
      try {
         const userId = req.user.id;
         const { id } = req.params;
         const noteData = req.body;

         console.log('Данные для обновления:', noteData);

         const updatedNote = await NoteService.updateOneNote(noteData, id, userId);
         console.log('Обновлённая заметка:', updatedNote);
         if (!updatedNote) {
            return res.status(404).json({ message: 'Заметка не найдена или нет доступа' });
         }
         return res.json(updatedNote);
      } catch (e) {
         console.error('Ошибка в updateOneNote:', e);
         next(ApiError.internal(e.message));
      }
   }

   async deleteOneNote(req, res, next) {
      try {
         const userId = req.user.id;
         const { id } = req.params;

         const deleted = await NoteService.deleteOneNote(id, userId);
         if (!deleted) {
            return res.status(404).json({ message: 'Заметка не найдена или нет доступа' });
         }
         return res.json({ message: 'Заметка удалена' });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async getUserAssignments(req, res, next) {
      try {
         const userId = req.user.id;
         let {
            limit,
            page,
            status,
            note_type,
            date_from,
            date_to,
            overdue
         } = req.query;

         page = parseInt(page) || 1;
         limit = parseInt(limit) || 10;
         const offset = countOffset(page, limit);

         const { count: totalCount, rows: assignments } =
            await NoteService.getUserAssignments(userId, limit, offset, {
               status,
               note_type,
               date_from,
               date_to,
               overdue: overdue === 'true'
            });

         return res.json({
            assignments,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount,
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   // ========== НОВЫЕ МЕТОДЫ ДЛЯ УПРАВЛЕНИЯ ЗАДАНИЯМИ ==========

   // Получить задания, назначенные мне
   async getAssignedToMe(req, res, next) {
      try {
         const userId = req.user.id;
         let {
            limit,
            page,
            status,
            note_type,
            include_overdue
         } = req.query;

         page = parseInt(page) || 1;
         limit = parseInt(limit) || 10;
         const offset = countOffset(page, limit);

         const { count: totalCount, rows: assignments } =
            await NoteService.getAssignedToMe(userId, limit, offset, {
               status,
               note_type,
               include_overdue: include_overdue === 'true'
            });

         return res.json({
            success: true,
            assignments,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount,
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   // Получить задания, созданные мной (для тренеров)
   async getAssignedByMe(req, res, next) {
      try {
         const userId = req.user.id;
         let {
            limit,
            page,
            status,
            note_type
         } = req.query;

         page = parseInt(page) || 1;
         limit = parseInt(limit) || 10;
         const offset = countOffset(page, limit);

         const { count: totalCount, rows: assignments } =
            await NoteService.getAssignedByMe(userId, limit, offset, {
               status,
               note_type
            });

         return res.json({
            success: true,
            assignments,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount,
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   // Получить просроченные задания
   async getOverdueAssignments(req, res, next) {
      try {
         const userId = req.user.id;
         let { limit, page } = req.query;

         page = parseInt(page) || 1;
         limit = parseInt(limit) || 10;
         const offset = countOffset(page, limit);

         const { count: totalCount, rows: assignments } =
            await NoteService.getOverdueAssignments(userId, limit, offset);

         return res.json({
            success: true,
            assignments,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount,
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   // Начать выполнение задания
   async startAssignment(req, res, next) {
      try {
         const userId = req.user.id;
         const { id } = req.params;

         const assignment = await NoteService.startAssignment(id, userId);

         return res.json({
            success: true,
            message: 'Задание начато',
            data: assignment
         });
      } catch (e) {
         if (e.message.includes('не найдено') || e.message.includes('Нет прав')) {
            return next(ApiError.badRequest(e.message));
         }
         if (e.message.includes('Нельзя начать')) {
            return next(ApiError.badRequest(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   // Отправить задание на проверку
   async submitAssignment(req, res, next) {
      try {
         const userId = req.user.id;
         const { id } = req.params;
         const { submissionComment, mediaIds } = req.body;

         const assignment = await NoteService.submitAssignment(id, userId, {
            submissionComment,
            mediaIds
         });

         const message = assignment.note_type === 'self_assignment'
            ? 'Задание выполнено'
            : 'Задание отправлено на проверку';

         return res.json({
            success: true,
            message,
            data: assignment
         });
      } catch (e) {
         if (e.message.includes('не найдено') || e.message.includes('Нет прав')) {
            return next(ApiError.badRequest(e.message));
         }
         if (e.message.includes('Нельзя отправить')) {
            return next(ApiError.badRequest(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   // Проверить задание
   async reviewAssignment(req, res, next) {
      try {
         const userId = req.user.id;
         const { id } = req.params;
         const { reviewComment, reviewRating } = req.body;

         const assignment = await NoteService.reviewAssignment(id, userId, {
            reviewComment,
            reviewRating
         });

         return res.json({
            success: true,
            message: 'Задание проверено',
            data: assignment
         });
      } catch (e) {
         if (e.message.includes('не найдено') || e.message.includes('Только создатель')) {
            return next(ApiError.badRequest(e.message));
         }
         if (e.message.includes('Можно проверять только')) {
            return next(ApiError.badRequest(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   // Завершить задание
   async completeAssignment(req, res, next) {
      try {
         const userId = req.user.id;
         const { id } = req.params;

         const assignment = await NoteService.completeAssignment(id, userId);

         return res.json({
            success: true,
            message: 'Задание завершено',
            data: assignment
         });
      } catch (e) {
         if (e.message.includes('не найдено') || e.message.includes('Нет прав')) {
            return next(ApiError.badRequest(e.message));
         }
         if (e.message.includes('можно завершить только')) {
            return next(ApiError.badRequest(e.message));
         }
         next(ApiError.internal(e.message));
      }
   }

   // Получить статистику по заданиям
   async getAssignmentStatistics(req, res, next) {
      try {
         const userId = req.user.id;

         const statistics = await NoteService.getAssignmentStatistics(userId);

         return res.json({
            success: true,
            data: statistics
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }
}

module.exports = new NoteController();