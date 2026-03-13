// // const { Note } = require('../models/models');

// // class NoteRepository {
// //    async create(note) {
// //       return await Note.create(note);
// //    }

// //    async findAll(userId, limit, offset) {
// //       return await Note.findAndCountAll({
// //          where: { user_id: userId },
// //          limit,
// //          offset,
// //          order: [['createdAt', 'DESC']],
// //       });
// //    }

// //    async findOne(id, userId) {
// //       return await Note.findOne({
// //          where: {
// //             id,
// //             user_id: userId,
// //          },
// //       });
// //    }

// //    async update(note, id, userId) {
// //       return await Note.update(
// //          { ...note },
// //          {
// //             where: { id, user_id: userId },
// //             returning: true,
// //          }
// //       );
// //    }


// //    async destroyById(id, userId) {
// //       // destroy возвращает число удалённых строк, не объект
// //       const deletedCount = await Note.destroy({
// //          where: { id, user_id: userId },
// //          // Убраны returning и plain — они не работают для destroy
// //       });
// //       return deletedCount;  // Возвращает число (0 или 1)
// //    }

// // }

// // repository/noteRepository.js
// const db = require('../models');
// const { Op } = require('sequelize');

// const Note = db.note;
// const User = db.user;
// const Media = db.media;

// console.log('NoteRepository: модели загружены?', {
//    Note: !!Note,
//    User: !!User,
//    Media: !!Media
// });

// class NoteRepository {
//    async create(note) {
//       if (!Note) throw new Error('Модель Note не инициализирована');
//       return await Note.create(note);
//    }

//    async findAll(userId, limit, offset, filters = {}) {
//       if (!Note) throw new Error('Модель Note не инициализирована');

//       const where = { user_id: userId };

//       if (filters.note_type) {
//          if (Array.isArray(filters.note_type)) {
//             where.note_type = { [Op.in]: filters.note_type };
//          } else {
//             where.note_type = filters.note_type;
//          }
//       }

//       if (filters.status) {
//          where.status = filters.status;
//       }

//       if (filters.planned_date) {
//          where.planned_date = filters.planned_date;
//       }

//       const include = [];

//       if (User) {
//          include.push({
//             model: User,
//             as: 'owner',
//             attributes: ['id', 'userName', 'userAvatar']
//          });
//       }

//       if (User && (filters.note_type === 'trainer_assignment' ||
//          (Array.isArray(filters.note_type) &&
//             filters.note_type.includes('trainer_assignment')))) {
//          include.push({
//             model: User,
//             as: 'assignedBy',
//             attributes: ['id', 'userName', 'userAvatar']
//          });
//       }

//       try {
//          const result = await Note.findAndCountAll({
//             where,
//             limit,
//             offset,
//             order: [['createdAt', 'DESC']], // Исправлено: createdAt вместо created_at
//             include: include.length > 0 ? include : undefined,
//             distinct: true
//          });

//          return {
//             count: result.count || 0,
//             rows: result.rows || []
//          };
//       } catch (error) {
//          console.error('Ошибка в NoteRepository.findAll:', error);
//          throw error;
//       }
//    }

//    async findWithConditions(conditions, limit, offset) {
//       if (!Note) throw new Error('Модель Note не инициализирована');

//       const include = [];

//       if (User) {
//          include.push({
//             model: User,
//             as: 'owner',
//             attributes: ['id', 'userName', 'userAvatar']
//          });

//          include.push({
//             model: User,
//             as: 'assignedBy',
//             attributes: ['id', 'userName', 'userAvatar']
//          });
//       }

//       if (Media) {
//          include.push({
//             model: Media,
//             as: 'media',
//             attributes: ['id', 'storage_url', 'file_type', 'thumbnail_url'],
//             through: { attributes: [] }
//          });
//       }

//       try {
//          const result = await Note.findAndCountAll({
//             where: conditions,
//             limit,
//             offset,
//             order: [['planned_date', 'ASC'], ['planned_time', 'ASC']],
//             include: include.length > 0 ? include : undefined,
//             distinct: true
//          });

//          return {
//             count: result.count || 0,
//             rows: result.rows || []
//          };
//       } catch (error) {
//          console.error('Ошибка в NoteRepository.findWithConditions:', error);
//          throw error;
//       }
//    }

//    async findOne(id, userId) {
//       if (!Note) throw new Error('Модель Note не инициализирована');

//       const include = [];

//       if (User) {
//          include.push({
//             model: User,
//             as: 'owner',
//             attributes: ['id', 'userName', 'userAvatar']
//          });

//          include.push({
//             model: User,
//             as: 'assignedBy',
//             attributes: ['id', 'userName', 'userAvatar']
//          });
//       }

//       if (Media) {
//          include.push({
//             model: Media,
//             as: 'media',
//             attributes: ['id', 'storage_url', 'file_type', 'thumbnail_url'],
//             through: { attributes: [] }
//          });
//       }

//       return await Note.findOne({
//          where: { id, user_id: userId },
//          include: include.length > 0 ? include : undefined
//       });
//    }

//    async update(note, id, userId) {
//       if (!Note) throw new Error('Модель Note не инициализирована');

//       const [updatedRowsCount, updatedRows] = await Note.update(
//          { ...note },
//          {
//             where: { id, user_id: userId },
//             returning: true,
//          }
//       );
//       return [updatedRowsCount, updatedRows];
//    }

//    async destroyById(id, userId) {
//       if (!Note) throw new Error('Модель Note не инициализирована');

//       const deletedCount = await Note.destroy({
//          where: { id, user_id: userId },
//       });
//       return deletedCount;
//    }
// }

// module.exports = new NoteRepository();

// repository/noteRepository.js
const db = require('../models');
const { Op } = require('sequelize');

const Note = db.note;
const User = db.user;
const Media = db.media;

console.log('NoteRepository: модели загружены?', {
   Note: !!Note,
   User: !!User,
   Media: !!Media
});

class NoteRepository {
   async create(note) {
      if (!Note) throw new Error('Модель Note не инициализирована');
      return await Note.create(note);
   }

   async findAll(userId, limit, offset, filters = {}) {
      if (!Note) throw new Error('Модель Note не инициализирована');

      const where = { user_id: userId };

      if (filters.note_type) {
         if (Array.isArray(filters.note_type)) {
            where.note_type = { [Op.in]: filters.note_type };
         } else {
            where.note_type = filters.note_type;
         }
      }

      if (filters.status) {
         where.status = filters.status;
      }

      if (filters.planned_date) {
         where.planned_date = filters.planned_date;
      }

      const include = [];

      if (User) {
         include.push({
            model: User,
            as: 'owner',
            attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
         });

         include.push({
            model: User,
            as: 'assignedBy',
            attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
         });

         include.push({
            model: User,
            as: 'assignedTo',
            attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
         });
      }

      if (Media) {
         include.push({
            model: Media,
            as: 'media',
            attributes: ['id', 'storage_url', 'file_type', 'thumbnail_url'],
            through: { attributes: [] }
         });
      }

      try {
         const result = await Note.findAndCountAll({
            where,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            include: include.length > 0 ? include : undefined,
            distinct: true
         });

         return {
            count: result.count || 0,
            rows: result.rows || []
         };
      } catch (error) {
         console.error('Ошибка в NoteRepository.findAll:', error);
         throw error;
      }
   }

   // НОВЫЙ МЕТОД: найти задание по ID (без проверки userId)
   async findById(id) {
      if (!Note) throw new Error('Модель Note не инициализирована');

      const include = [];

      if (User) {
         include.push({
            model: User,
            as: 'owner',
            attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
         });

         include.push({
            model: User,
            as: 'assignedBy',
            attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
         });

         include.push({
            model: User,
            as: 'assignedTo',
            attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
         });
      }

      return await Note.findByPk(id, {
         include: include.length > 0 ? include : undefined
      });
   }

   // УЛУЧШЕННЫЙ МЕТОД: findWithConditions с поддержкой include
   async findWithConditions(conditions, limit, offset, includes = []) {
      if (!Note) throw new Error('Модель Note не инициализирована');

      // Базовые include всегда добавляем
      const include = [];

      if (User) {
         // Добавляем только если они не конфликтуют с переданными includes
         if (!includes.some(inc => inc.as === 'owner')) {
            include.push({
               model: User,
               as: 'owner',
               attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
            });
         }

         if (!includes.some(inc => inc.as === 'assignedBy')) {
            include.push({
               model: User,
               as: 'assignedBy',
               attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
            });
         }

         if (!includes.some(inc => inc.as === 'assignedTo')) {
            include.push({
               model: User,
               as: 'assignedTo',
               attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
            });
         }
      }

      if (Media && !includes.some(inc => inc.as === 'media')) {
         include.push({
            model: Media,
            as: 'media',
            attributes: ['id', 'storage_url', 'file_type', 'thumbnail_url'],
            through: { attributes: [] }
         });
      }

      // Объединяем с переданными includes
      const allIncludes = [...include, ...includes];

      try {
         const result = await Note.findAndCountAll({
            where: conditions,
            limit,
            offset,
            order: [['planned_date', 'ASC'], ['planned_time', 'ASC']],
            include: allIncludes.length > 0 ? allIncludes : undefined,
            distinct: true
         });

         return {
            count: result.count || 0,
            rows: result.rows || []
         };
      } catch (error) {
         console.error('Ошибка в NoteRepository.findWithConditions:', error);
         throw error;
      }
   }

   async findOne(id, userId) {
      if (!Note) throw new Error('Модель Note не инициализирована');

      const include = [];

      if (User) {
         include.push({
            model: User,
            as: 'owner',
            attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
         });

         include.push({
            model: User,
            as: 'assignedBy',
            attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
         });

         include.push({
            model: User,
            as: 'assignedTo',
            attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
         });
      }

      if (Media) {
         include.push({
            model: Media,
            as: 'media',
            attributes: ['id', 'storage_url', 'file_type', 'thumbnail_url'],
            through: { attributes: [] }
         });
      }

      return await Note.findOne({
         where: { id, user_id: userId },
         include: include.length > 0 ? include : undefined
      });
   }

   async update(note, id, userId) {
      if (!Note) throw new Error('Модель Note не инициализирована');

      const [updatedRowsCount, updatedRows] = await Note.update(
         { ...note },
         {
            where: { id, user_id: userId },
            returning: true,
         }
      );
      return [updatedRowsCount, updatedRows];
   }

   async destroyById(id, userId) {
      if (!Note) throw new Error('Модель Note не инициализирована');

      const deletedCount = await Note.destroy({
         where: { id, user_id: userId },
      });
      return deletedCount;
   }

   // ========== НОВЫЕ МЕТОДЫ ДЛЯ СТАТИСТИКИ ==========

   // Статистика по статусам для заданий
   async getStatusStats(userId, field) {
      if (!Note) throw new Error('Модель Note не инициализирована');

      try {
         const stats = await Note.findAll({
            where: {
               [field]: userId,
               note_type: {
                  [Op.in]: ['self_assignment', 'trainer_assignment']
               }
            },
            attributes: [
               'status',
               [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']
            ],
            group: ['status']
         });

         return stats.reduce((acc, item) => {
            acc[item.status] = parseInt(item.dataValues.count);
            return acc;
         }, {});
      } catch (error) {
         console.error('Ошибка в NoteRepository.getStatusStats:', error);
         return {};
      }
   }

   // Количество просроченных заданий
   async getOverdueCount(userId) {
      if (!Note) throw new Error('Модель Note не инициализирована');

      try {
         const count = await Note.count({
            where: {
               assigned_to_user_id: userId,
               status: {
                  [Op.in]: ['active', 'in_progress']
               },
               planned_date: {
                  [Op.lt]: new Date()
               }
            }
         });
         return count;
      } catch (error) {
         console.error('Ошибка в NoteRepository.getOverdueCount:', error);
         return 0;
      }
   }

   // Средняя оценка выполненных заданий
   async getAverageRating(userId) {
      if (!Note) throw new Error('Модель Note не инициализирована');

      try {
         const result = await Note.findOne({
            where: {
               assigned_to_user_id: userId,
               review_rating: {
                  [Op.ne]: null
               }
            },
            attributes: [
               [Sequelize.fn('AVG', Sequelize.col('review_rating')), 'averageRating']
            ]
         });

         return result && result.dataValues.averageRating
            ? parseFloat(result.dataValues.averageRating)
            : null;
      } catch (error) {
         console.error('Ошибка в NoteRepository.getAverageRating:', error);
         return null;
      }
   }

   // Получить задания с фильтром по полю и статусам
   async findByFieldAndStatus(field, userId, statuses, limit, offset) {
      if (!Note) throw new Error('Модель Note не инициализирована');

      const where = {
         [field]: userId,
         note_type: {
            [Op.in]: ['self_assignment', 'trainer_assignment']
         }
      };

      if (statuses) {
         where.status = Array.isArray(statuses)
            ? { [Op.in]: statuses }
            : statuses;
      }

      const include = [];

      if (User) {
         include.push({
            model: User,
            as: 'assignedBy',
            attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
         });

         include.push({
            model: User,
            as: 'assignedTo',
            attributes: ['id', 'userName', 'firstName', 'lastName', 'userAvatar']
         });
      }

      try {
         const result = await Note.findAndCountAll({
            where,
            limit,
            offset,
            order: [['planned_date', 'ASC'], ['createdAt', 'DESC']],
            include: include.length > 0 ? include : undefined,
            distinct: true
         });

         return {
            count: result.count || 0,
            rows: result.rows || []
         };
      } catch (error) {
         console.error('Ошибка в NoteRepository.findByFieldAndStatus:', error);
         throw error;
      }
   }
}

module.exports = new NoteRepository();