// repository/noteRepository.js
const db = require('../models');
const { Op, Sequelize } = require('sequelize');

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

   async findAll(userId, limit, offset, filters = {}, sortBy = 'createdAt', sortOrder = 'desc') {
      console.log('📝 NoteRepository.findAll:', { sortBy, sortOrder });
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

      // Построение ORDER BY
      const order = this._buildOrderBy(sortBy, sortOrder);
      console.log('📝 ORDER BY:', JSON.stringify(order));

      try {
         const result = await Note.findAndCountAll({
            where,
            limit,
            offset,
            order,
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

   /**
    * Построение ORDER BY
    * @private
    */
   _buildOrderBy(sortBy, sortOrder) {
      const direction = sortOrder.toUpperCase();

      switch (sortBy) {
         case 'createdAt':
            return [['createdAt', direction]];
         case 'note_name':
            return [[Sequelize.literal(`LOWER("note"."note_name") ${direction}`)]];
         case 'note_priority':
            return [['note_priority', direction]];
         case 'planned_date':
            // Для заданий (self_assignment, trainer_assignment)
            return [
               [Sequelize.literal(`"note"."planned_date" ${direction} NULLS LAST`)],
               ['createdAt', 'DESC']
            ];
         case 'note_expiration_date':
            // 🔧 НОВЫЙ КЕЙС: для личных заметок сортировка по дедлайну
            return [
               [Sequelize.literal(`"note"."note_expiration_date" ${direction} NULLS LAST`)],
               ['createdAt', 'DESC']
            ];
         case 'status':
            return [['status', direction]];
         default:
            return [['createdAt', 'DESC']];
      }
   }

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

   async findWithConditions(conditions, limit, offset, includes = []) {
      if (!Note) throw new Error('Модель Note не инициализирована');

      const include = [];

      if (User) {
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

   // ========== МЕТОДЫ ДЛЯ СТАТИСТИКИ ==========

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