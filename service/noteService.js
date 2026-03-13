
// const ApiError = require('../error/ApiError');
// const NoteRepository = require('../repository/noteRepository');
// const UserRepository = require('../repository/userRepository');
// const UserConnectionRepository = require('../repository/userConnectionRepository');
// const { Sequelize } = require('sequelize');

// class NoteService {
//    // async createNote(note) {
//    //    // note уже содержит userId
//    //    return await NoteRepository.create(note);
//    // }

//    async createNote(noteData) {
//       const { note_type, assigned_to_user_id, user_id } = noteData;

//       // Валидация тренерских заданий
//       if (note_type === 'trainer_assignment') {
//          // Проверяем, что пользователь - тренер
//          const user = await UserRepository.findUserById(user_id);
//          if (!user || user.role !== 'trainer') {
//             throw ApiError.forbidden('Только тренеры могут создавать задания для других');
//          }

//          // Проверяем, что подопечный существует и связан с тренером
//          const connectionExists = await UserConnectionRepository.checkConnection(
//             user_id,
//             assigned_to_user_id
//          );

//          if (!connectionExists) {
//             throw ApiError.forbidden('Вы можете назначать задания только своим подопечным');
//          }
//       }

//       // Для self_assignment назначаем самому себе
//       if (note_type === 'self_assignment') {
//          noteData.assigned_to_user_id = user_id;
//       }

//       // Устанавливаем статус по умолчанию
//       if (!noteData.status) {
//          noteData.status = note_type === 'personal_note' ? 'active' : 'draft';
//       }

//       return await NoteRepository.create(noteData);
//    }
//    // async getAllNotes(userId, limit, offset) {
//    //    // фильтрация по userId
//    //    return await NoteRepository.findAll(userId, limit, offset);
//    // }

//    async getAllNotes(userId, limit, offset, filters = {}) {
//       // filters может содержать: note_type, status, planned_date, и т.д.
//       return await NoteRepository.findAll(userId, limit, offset, filters);
//    }

//    async getOneNote(id, userId) {
//       return await NoteRepository.findOne(id, userId);
//    }

//    async updateOneNote(note, id, userId) {
//       // сначала проверим, что заметка принадлежит пользователю
//       const existingNote = await this.getOneNote(id, userId);
//       if (!existingNote) {
//          throw ApiError.badRequest('Запись не найдена или нет доступа');
//       }

//       const [updatedRowsCount, updatedRows] = await NoteRepository.update(note, id, userId);
//       if (updatedRowsCount === 0) {
//          throw ApiError.badRequest('Запись не найдена для обновления');
//       }
//       return updatedRows[0]; // возвращаем обновлённый объект
//    }

//    async deleteOneNote(id, userId) {
//       const note = await this.getOneNote(id, userId);
//       if (!note) {
//          throw ApiError.badRequest('Запись не найдена или нет доступа');
//       }
//       const deletedCount = await NoteRepository.destroyById(id, userId);
//       if (deletedCount === 0) {
//          throw ApiError.badRequest('Не удалось удалить запись');
//       }
//       console.log('Record deleted successfully');
//       return true;  // Возвращаем true, если удалено успешно
//    }

//    async getUserAssignments(userId, limit, offset, filters = {}) {
//       const {
//          status,
//          note_type,
//          date_from,
//          date_to,
//          overdue = false
//       } = filters;

//       // Задания, где пользователь является исполнителем
//       const conditions = {
//          [Sequelize.Op.or]: [
//             { assigned_to_user_id: userId }, // задания от тренера
//             { user_id: userId, note_type: 'self_assignment' } // личные задания
//          ]
//       };

//       // Дополнительные фильтры
//       if (status) {
//          conditions.status = status;
//       }

//       if (note_type) {
//          conditions.note_type = note_type;
//       } else {
//          // По умолчанию только задания
//          conditions.note_type = ['self_assignment', 'trainer_assignment'];
//       }

//       // Фильтр по датам
//       const dateFilter = {};
//       if (date_from) {
//          dateFilter[Sequelize.Op.gte] = date_from;
//       }
//       if (date_to) {
//          dateFilter[Sequelize.Op.lte] = date_to;
//       }

//       if (date_from || date_to) {
//          conditions.planned_date = dateFilter;
//       }

//       // Просроченные задания
//       if (overdue) {
//          conditions.status = 'active';
//          conditions.planned_date = {
//             [Sequelize.Op.lt]: new Date()
//          };
//       }

//       return await NoteRepository.findWithConditions(conditions, limit, offset);
//    }
// }

// module.exports = new NoteService();


const ApiError = require('../error/ApiError');
const NoteRepository = require('../repository/noteRepository');
const UserRepository = require('../repository/userRepository');
const UserConnectionRepository = require('../repository/userConnectionRepository');
const { Sequelize } = require('sequelize');

class NoteService {
   async createNote(noteData) {
      const { note_type, assigned_to_user_id, user_id } = noteData;

      // Валидация тренерских заданий
      if (note_type === 'trainer_assignment') {
         // Проверяем, что пользователь - тренер
         const user = await UserRepository.findUserById(user_id);
         if (!user || user.role !== 'trainer') {
            throw ApiError.forbidden('Только тренеры могут создавать задания для других');
         }

         // Проверяем, что подопечный существует и связан с тренером
         const connectionExists = await UserConnectionRepository.checkConnection(
            user_id,
            assigned_to_user_id
         );

         if (!connectionExists) {
            throw ApiError.forbidden('Вы можете назначать задания только своим подопечным');
         }
      }

      // Для self_assignment назначаем самому себе
      if (note_type === 'self_assignment') {
         noteData.assigned_to_user_id = user_id;
      }

      // Устанавливаем статус по умолчанию
      if (!noteData.status) {
         noteData.status = note_type === 'personal_note' ? 'active' : 'draft';
      }

      return await NoteRepository.create(noteData);
   }

   async getAllNotes(userId, limit, offset, filters = {}) {
      // filters может содержать: note_type, status, planned_date, и т.д.
      return await NoteRepository.findAll(userId, limit, offset, filters);
   }

   async getOneNote(id, userId) {
      return await NoteRepository.findOne(id, userId);
   }

   async updateOneNote(note, id, userId) {
      // сначала проверим, что заметка принадлежит пользователю
      const existingNote = await this.getOneNote(id, userId);
      if (!existingNote) {
         throw ApiError.badRequest('Запись не найдена или нет доступа');
      }

      const [updatedRowsCount, updatedRows] = await NoteRepository.update(note, id, userId);
      if (updatedRowsCount === 0) {
         throw ApiError.badRequest('Запись не найдена для обновления');
      }
      return updatedRows[0]; // возвращаем обновлённый объект
   }

   async deleteOneNote(id, userId) {
      const note = await this.getOneNote(id, userId);
      if (!note) {
         throw ApiError.badRequest('Запись не найдена или нет доступа');
      }
      const deletedCount = await NoteRepository.destroyById(id, userId);
      if (deletedCount === 0) {
         throw ApiError.badRequest('Не удалось удалить запись');
      }
      console.log('Record deleted successfully');
      return true;  // Возвращаем true, если удалено успешно
   }

   async getUserAssignments(userId, limit, offset, filters = {}) {
      const {
         status,
         note_type,
         date_from,
         date_to,
         overdue = false
      } = filters;

      // Задания, где пользователь является исполнителем
      const conditions = {
         [Sequelize.Op.or]: [
            { assigned_to_user_id: userId }, // задания от тренера
            { user_id: userId, note_type: 'self_assignment' } // личные задания
         ]
      };

      // Дополнительные фильтры
      if (status) {
         conditions.status = status;
      }

      if (note_type) {
         conditions.note_type = note_type;
      } else {
         // По умолчанию только задания
         conditions.note_type = ['self_assignment', 'trainer_assignment'];
      }

      // Фильтр по датам
      const dateFilter = {};
      if (date_from) {
         dateFilter[Sequelize.Op.gte] = date_from;
      }
      if (date_to) {
         dateFilter[Sequelize.Op.lte] = date_to;
      }

      if (date_from || date_to) {
         conditions.planned_date = dateFilter;
      }

      // Просроченные задания
      if (overdue) {
         conditions.status = 'active';
         conditions.planned_date = {
            [Sequelize.Op.lt]: new Date()
         };
      }

      return await NoteRepository.findWithConditions(conditions, limit, offset);
   }

   // ========== НОВЫЕ МЕТОДЫ ==========

   // Получить задания, назначенные мне
   async getAssignedToMe(userId, limit, offset, filters = {}) {
      const { status, note_type, include_overdue = false } = filters;

      const conditions = {
         assigned_to_user_id: userId,
         note_type: {
            [Sequelize.Op.in]: ['self_assignment', 'trainer_assignment']
         }
      };

      // Фильтр по статусу
      if (status) {
         if (status === 'overdue') {
            // Для просроченных - особая логика
            conditions.status = {
               [Sequelize.Op.in]: ['active', 'in_progress']
            };
            conditions.planned_date = {
               [Sequelize.Op.lt]: new Date()
            };
         } else {
            conditions.status = status;
         }
      }

      // Фильтр по типу
      if (note_type) {
         conditions.note_type = note_type;
      }

      return await NoteRepository.findWithConditions(conditions, limit, offset, [
         { association: 'assignedBy', attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar'] }
      ]);
   }

   // Получить задания, созданные мной
   async getAssignedByMe(userId, limit, offset, filters = {}) {
      const { status, note_type } = filters;

      const conditions = {
         assigned_by_user_id: userId,
         note_type: 'trainer_assignment'
      };

      if (status) {
         conditions.status = status;
      }

      if (note_type) {
         conditions.note_type = note_type;
      }

      return await NoteRepository.findWithConditions(conditions, limit, offset, [
         { association: 'assignedTo', attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar'] }
      ]);
   }

   // Получить просроченные задания
   async getOverdueAssignments(userId, limit, offset) {
      const conditions = {
         assigned_to_user_id: userId,
         status: {
            [Sequelize.Op.in]: ['active', 'in_progress']
         },
         planned_date: {
            [Sequelize.Op.lt]: new Date()
         }
      };

      return await NoteRepository.findWithConditions(conditions, limit, offset, [
         { association: 'assignedBy', attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar'] }
      ]);
   }

   // Вспомогательная функция для проверки прав на задание
   async _canModifyAssignment(noteId, userId) {
      const note = await NoteRepository.findById(noteId);
      if (!note) {
         throw ApiError.badRequest('Задание не найдено');
      }

      // Исполнитель может менять статус
      if (note.assigned_to_user_id === userId) return note;
      // Создатель может менять статус (для тренерских заданий)
      if (note.assigned_by_user_id === userId) return note;
      // Владелец заметки
      if (note.user_id === userId) return note;

      throw ApiError.forbidden('Нет прав для выполнения этого действия');
   }

   // Начать выполнение задания
   async startAssignment(noteId, userId) {
      const note = await this._canModifyAssignment(noteId, userId);

      // Проверка статуса
      if (note.status !== 'active') {
         throw ApiError.badRequest(`Нельзя начать задание со статусом "${note.status}"`);
      }

      // Обновляем статус
      const [updatedRowsCount, updatedRows] = await NoteRepository.update(
         { status: 'in_progress' },
         noteId,
         userId
      );

      if (updatedRowsCount === 0) {
         throw ApiError.badRequest('Не удалось обновить задание');
      }

      return updatedRows[0];
   }

   // Отправить задание на проверку
   async submitAssignment(noteId, userId, data = {}) {
      const { submissionComment, mediaIds } = data;
      const note = await this._canModifyAssignment(noteId, userId);

      // Проверка статуса
      if (!['active', 'in_progress'].includes(note.status)) {
         throw ApiError.badRequest(`Нельзя отправить задание со статусом "${note.status}"`);
      }

      let updateData = {};

      // Для личных заданий - сразу завершаем
      if (note.note_type === 'self_assignment') {
         updateData = {
            status: 'completed',
            reviewed_at: new Date()
         };
      } else {
         updateData = {
            status: 'submitted',
            submitted_at: new Date()
         };

         // Сохраняем метаданные, если есть
         if (submissionComment || mediaIds) {
            updateData.metadata = {
               ...note.metadata,
               submissionComment,
               submittedMediaIds: mediaIds,
               submittedAt: new Date().toISOString()
            };
         }
      }

      const [updatedRowsCount, updatedRows] = await NoteRepository.update(
         updateData,
         noteId,
         userId
      );

      if (updatedRowsCount === 0) {
         throw ApiError.badRequest('Не удалось обновить задание');
      }

      return updatedRows[0];
   }

   // Проверить задание
   async reviewAssignment(noteId, userId, data = {}) {
      const { reviewComment, reviewRating } = data;
      const note = await NoteRepository.findById(noteId);

      if (!note) {
         throw ApiError.badRequest('Задание не найдено');
      }

      // Только создатель может проверять (для trainer_assignment)
      if (note.assigned_by_user_id !== userId) {
         throw ApiError.forbidden('Только создатель задания может проверять его');
      }

      // Проверка статуса
      if (note.status !== 'submitted') {
         throw ApiError.badRequest(`Можно проверять только задания со статусом "submitted", текущий статус: "${note.status}"`);
      }

      const updateData = {
         status: 'reviewed',
         reviewed_at: new Date(),
         review_comment: reviewComment || null,
         review_rating: reviewRating || null
      };

      const [updatedRowsCount, updatedRows] = await NoteRepository.update(
         updateData,
         noteId,
         userId
      );

      if (updatedRowsCount === 0) {
         throw ApiError.badRequest('Не удалось обновить задание');
      }

      return updatedRows[0];
   }

   // Завершить задание
   async completeAssignment(noteId, userId) {
      const note = await this._canModifyAssignment(noteId, userId);

      // Проверка возможности завершения в зависимости от типа
      if (note.note_type === 'self_assignment') {
         if (!['active', 'in_progress'].includes(note.status)) {
            throw ApiError.badRequest(`Личное задание можно завершить только из статусов "active" или "in_progress"`);
         }
      } else {
         if (note.status !== 'reviewed') {
            throw ApiError.badRequest(`Задание можно завершить только после проверки (статус "reviewed")`);
         }
      }

      const updateData = {
         status: 'completed'
      };

      if (!note.reviewed_at) {
         updateData.reviewed_at = new Date();
      }

      const [updatedRowsCount, updatedRows] = await NoteRepository.update(
         updateData,
         noteId,
         userId
      );

      if (updatedRowsCount === 0) {
         throw ApiError.badRequest('Не удалось обновить задание');
      }

      return updatedRows[0];
   }

   // Получить статистику по заданиям
   async getAssignmentStatistics(userId) {
      // Статистика по назначенным мне заданиям
      const assignedToMeStats = await NoteRepository.getStatusStats(userId, 'assigned_to_user_id');

      // Статистика по созданным мной заданиям
      const assignedByMeStats = await NoteRepository.getStatusStats(userId, 'assigned_by_user_id');

      // Просроченные
      const overdueCount = await NoteRepository.getOverdueCount(userId);

      // Средняя оценка
      const averageRating = await NoteRepository.getAverageRating(userId);

      return {
         assignedToMe: assignedToMeStats,
         assignedByMe: assignedByMeStats,
         overdue: overdueCount,
         averageRating
      };
   }
}

module.exports = new NoteService();