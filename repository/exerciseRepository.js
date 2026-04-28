// backend/repository/exerciseRepository.js
const { Exercise } = require('../models/');
const { User, Tag, Media, ExerciseTag, ExerciseMedia, ExerciseAccess } = require('../models');
const { Sequelize, Op } = require('sequelize');

class ExerciseRepository {
   // ========== СТАРЫЕ МЕТОДЫ ==========

   async createExercise(exercise) {
      return Exercise.create(exercise);
   }

   async getAllExercises(userId, limit, offset) {
      return Exercise.findAndCountAll({
         where: { user_id: userId },
         limit,
         offset,
         order: [['createdAt', 'DESC']],
      });
   }

   async getOneExercise(id, userId) {
      return Exercise.findOne({
         where: {
            id,
            user_id: userId,
         },
      });
   }

   async updateOneExercise(exercise, id, userId) {
      return Exercise.update(
         { ...exercise },
         {
            where: { id, user_id: userId },
            returning: true,
         }
      );
   }

   async deleteOneExercise(id, userId) {
      return Exercise.destroy({
         where: { id, user_id: userId },
         returning: true,
         plain: true,
      });
   }

   // ========== НОВЫЕ МЕТОДЫ ==========

   async createExerciseWithDetails(data, tags = [], mediaIds = [], transaction = null) {
      const exercise = await Exercise.create({
         user_id: data.user_id,
         title: data.title,
         description: data.description || null,
         is_public: data.is_public || false,
         source_exercise_id: data.source_exercise_id || null,
         usage_count: 0,
         copy_count: 0,
         shared_count: 0
      }, { transaction });

      if (tags && tags.length > 0) {
         const tagRepository = require('./tagRepository');
         await tagRepository.updateExerciseTags(exercise.id, tags, transaction);
      }

      if (mediaIds && mediaIds.length > 0) {
         const mediaRecords = mediaIds.map((mediaId, index) => ({
            exercise_id: exercise.id,
            media_id: mediaId,
            order_index: index,
            created_at: new Date(),
            updated_at: new Date()
         }));
         await ExerciseMedia.bulkCreate(mediaRecords, { transaction });
      }

      return exercise;
   }

   /**
    * Найти упражнение по ID с деталями (теги, медиа, владелец)
    * ВОЗВРАЩАЕТ SEQUELIZE ИНСТАНС с добавленными полями в dataValues
    */
   async findExerciseByIdWithDetails(id) {
      try {
         // 1. Получаем базовое упражнение
         const exercise = await Exercise.findByPk(id);
         if (!exercise) return null;

         // 2. Получаем владельца
         const owner = await User.findByPk(exercise.user_id, {
            attributes: ['id', 'userName', 'email']
         });

         // 3. Получаем ID тегов через связующую таблицу
         const exerciseTags = await ExerciseTag.findAll({
            where: { exercise_id: id },
            attributes: ['tag_id']
         });

         const tagIds = exerciseTags.map(et => et.tag_id);
         let tags = [];
         if (tagIds.length > 0) {
            tags = await Tag.findAll({
               where: { id: tagIds },
               attributes: ['id', 'name', 'usage_count', 'created_at', 'updated_at']
            });
         }

         // 4. Получаем ID медиа через связующую таблицу
         const exerciseMediaItems = await ExerciseMedia.findAll({
            where: { exercise_id: id },
            attributes: ['media_id', 'order_index'],
            order: [['order_index', 'ASC']]
         });

         const mediaIds = exerciseMediaItems.map(em => em.media_id);
         let mediaItems = [];
         if (mediaIds.length > 0) {
            // ИСПРАВЛЕНО: правильные названия полей из таблицы media
            mediaItems = await Media.findAll({
               where: { id: mediaIds },
               attributes: ['id', 'original_filename', 'storage_url', 'file_type', 'mime_type', 'created_at']
            });
         }

         // Сортируем медиа по order_index и добавляем order_index в объект
         const media = exerciseMediaItems.map(em => {
            const mediaItem = mediaItems.find(m => m.id === em.media_id);
            if (!mediaItem) return null;
            return {
               id: mediaItem.id,
               original_filename: mediaItem.original_filename,
               storage_url: mediaItem.storage_url,
               file_type: mediaItem.file_type,
               mime_type: mediaItem.mime_type,
               created_at: mediaItem.created_at,
               order_index: em.order_index
            };
         }).filter(m => m !== null);

         // 5. Добавляем данные в dataValues (сохраняем как Sequelize инстанс)
         exercise.dataValues.owner = owner;
         exercise.dataValues.tags = tags;
         exercise.dataValues.media = media;

         return exercise;
      } catch (error) {
         console.error('Ошибка в findExerciseByIdWithDetails:', error.message);
         console.error('Stack:', error.stack);
         throw error;
      }
   }

   async getExercisesWithAccess(userId, options = {}) {
      const { limit = 50, offset = 0, sort = 'created_at', order = 'DESC', search = '' } = options;

      const accessibleExerciseIds = await this.getAccessibleExerciseIds(userId);

      if (accessibleExerciseIds.length === 0) {
         return { rows: [], count: 0 };
      }

      const where = {
         id: { [Op.in]: accessibleExerciseIds }
      };

      if (search) {
         where.title = { [Op.iLike]: `%${search}%` };
      }

      // Получаем упражнения
      const exercises = await Exercise.findAll({
         where,
         limit,
         offset,
         order: [[sort, order]]
      });

      // Загружаем детали для каждого упражнения и возвращаем Sequelize инстансы
      const exercisesWithDetails = await Promise.all(
         exercises.map(async (exercise) => {
            const owner = await User.findByPk(exercise.user_id, {
               attributes: ['id', 'userName', 'email']
            });

            // Получаем теги (только ID и названия)
            const exerciseTags = await ExerciseTag.findAll({
               where: { exercise_id: exercise.id },
               attributes: ['tag_id']
            });

            const tagIds = exerciseTags.map(et => et.tag_id);
            let tags = [];
            if (tagIds.length > 0) {
               tags = await Tag.findAll({
                  where: { id: tagIds },
                  attributes: ['id', 'name', 'usage_count']
               });
            }

            // Получаем первое медиа (для превью в списке)
            const exerciseMediaItems = await ExerciseMedia.findAll({
               where: { exercise_id: exercise.id },
               attributes: ['media_id', 'order_index'],
               limit: 1,
               order: [['order_index', 'ASC']]
            });

            let media = [];
            if (exerciseMediaItems.length > 0) {
               // ИСПРАВЛЕНО: правильные названия полей
               const mediaItem = await Media.findByPk(exerciseMediaItems[0].media_id, {
                  attributes: ['id', 'original_filename', 'storage_url', 'file_type']
               });
               if (mediaItem) {
                  media = [{
                     id: mediaItem.id,
                     original_filename: mediaItem.original_filename,
                     storage_url: mediaItem.storage_url,
                     file_type: mediaItem.file_type,
                     order_index: exerciseMediaItems[0].order_index
                  }];
               }
            }

            // Добавляем данные в dataValues (сохраняем как Sequelize инстанс)
            exercise.dataValues.owner = owner;
            exercise.dataValues.tags = tags;
            exercise.dataValues.media = media;

            return exercise;
         })
      );

      return {
         rows: exercisesWithDetails,
         count: exercisesWithDetails.length
      };
   }

   async getAccessibleExerciseIds(userId) {
      const myExercises = await Exercise.findAll({
         where: { user_id: userId },
         attributes: ['id']
      });

      const publicExercises = await Exercise.findAll({
         where: {
            user_id: { [Op.ne]: userId },
            is_public: true
         },
         attributes: ['id']
      });

      const accessedExercises = await ExerciseAccess.findAll({
         where: {
            user_id: userId,
            status: 'active',
            [Op.or]: [
               { expires_at: null },
               { expires_at: { [Op.gt]: new Date() } }
            ]
         },
         attributes: ['exercise_id']
      });

      const myIds = myExercises.map(e => e.id);
      const publicIds = publicExercises.map(e => e.id);
      const accessedIds = accessedExercises.map(a => a.exercise_id);

      return [...new Set([...myIds, ...publicIds, ...accessedIds])];
   }

   async updateExerciseWithDetails(id, data, tags = null, mediaIds = null, transaction = null) {
      await Exercise.update(data, { where: { id }, transaction });

      if (tags !== null) {
         const tagRepository = require('./tagRepository');
         await tagRepository.updateExerciseTags(id, tags, transaction);
      }

      if (mediaIds !== null) {
         await ExerciseMedia.destroy({ where: { exercise_id: id }, transaction });

         const mediaRecords = mediaIds.map((mediaId, index) => ({
            exercise_id: id,
            media_id: mediaId,
            order_index: index,
            created_at: new Date(),
            updated_at: new Date()
         }));
         await ExerciseMedia.bulkCreate(mediaRecords, { transaction });
      }

      return true;
   }

   async deleteExerciseWithRelations(id, transaction = null) {
      const exerciseTags = await ExerciseTag.findAll({
         where: { exercise_id: id },
         transaction
      });

      const tagRepository = require('./tagRepository');
      for (const et of exerciseTags) {
         await tagRepository.decrementUsageCount(et.tag_id, transaction);
      }

      const deleted = await Exercise.destroy({
         where: { id },
         transaction,
         force: true
      });

      return deleted > 0;
   }

   async copyExerciseWithDetails(sourceId, newUserId, transaction = null) {
      const sourceExercise = await this.findExerciseByIdWithDetails(sourceId);
      if (!sourceExercise) throw new Error('Исходное упражнение не найдено');

      const newExercise = await Exercise.create({
         user_id: newUserId,
         title: `${sourceExercise.title} (копия)`,
         description: sourceExercise.description,
         is_public: false,
         source_exercise_id: sourceId,
         usage_count: 0,
         copy_count: 0,
         shared_count: 0
      }, { transaction });

      await this.incrementCopyCount(sourceId, transaction);

      if (sourceExercise.tags && sourceExercise.tags.length > 0) {
         const tagRecords = sourceExercise.tags.map(tag => ({
            exercise_id: newExercise.id,
            tag_id: tag.id,
            created_at: new Date()
         }));
         await ExerciseTag.bulkCreate(tagRecords, { transaction, ignoreDuplicates: true });
      }

      if (sourceExercise.media && sourceExercise.media.length > 0) {
         const mediaRecords = sourceExercise.media.map((media, index) => ({
            exercise_id: newExercise.id,
            media_id: media.id,
            order_index: media.order_index || index,
            created_at: new Date(),
            updated_at: new Date()
         }));
         await ExerciseMedia.bulkCreate(mediaRecords, { transaction, ignoreDuplicates: true });
      }

      return newExercise;
   }

   async incrementCopyCount(id, transaction = null) {
      await Exercise.increment('copy_count', {
         by: 1,
         where: { id },
         transaction
      });
   }

   async incrementUsageCount(id, transaction = null) {
      await Exercise.increment('usage_count', {
         by: 1,
         where: { id },
         transaction
      });
   }

   async canEditExercise(exerciseId, userId) {
      const exercise = await Exercise.findOne({
         where: { id: exerciseId }
      });

      if (!exercise) return false;
      if (exercise.user_id === userId) return true;

      return false;
   }

   async canUseExercise(exerciseId, userId) {
      const exercise = await Exercise.findOne({
         where: {
            id: exerciseId,
            [Op.or]: [
               { user_id: userId },
               { is_public: true }
            ]
         }
      });

      return !!exercise;
   }

   async getExerciseMedia(exerciseId) {
      const exerciseMedia = await ExerciseMedia.findAll({
         where: { exercise_id: exerciseId },
         order: [['order_index', 'ASC']],
         include: [{
            model: Media,
            as: 'media'
         }]
      });

      return exerciseMedia.map(em => ({
         ...em.media.toJSON(),
         order_index: em.order_index
      }));
   }

   async searchExercises(userId, query, tagIds = [], options = {}) {
      const { limit = 50, offset = 0 } = options;

      const where = {
         [Op.or]: [
            { user_id: userId },
            { is_public: true }
         ]
      };

      if (query && query.trim()) {
         where[Op.or] = [
            ...(where[Op.or] || []),
            { title: { [Op.iLike]: `%${query}%` } },
            { description: { [Op.iLike]: `%${query}%` } }
         ];
      }

      const include = [];

      if (tagIds && tagIds.length > 0) {
         include.push({
            model: Tag,
            as: 'tags',
            where: { id: tagIds },
            through: { attributes: [] }
         });
      } else {
         include.push({
            model: Tag,
            as: 'tags',
            through: { attributes: [] },
            required: false
         });
      }

      const result = await Exercise.findAndCountAll({
         where,
         include,
         limit,
         offset,
         distinct: true,
         order: [['created_at', 'DESC']]
      });

      return {
         rows: result.rows,
         count: result.count
      };
   }
}

module.exports = new ExerciseRepository();