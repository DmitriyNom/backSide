// backend/repository/tagRepository.js
const { Tag, ExerciseTag } = require('../models');
const { Sequelize } = require('sequelize');

class TagRepository {
   constructor() {
      this.model = Tag;
      this.exerciseTagModel = ExerciseTag;
   }

   /**
    * Найти тег по ID
    * @param {number} id - ID тега
    * @returns {Promise<Tag|null>}
    */
   async findById(id) {
      return await this.model.findByPk(id);
   }

   /**
    * Найти тег по имени (точное совпадение)
    * @param {string} name - имя тега
    * @returns {Promise<Tag|null>}
    */
   async findByName(name) {
      return await this.model.findOne({
         where: { name: name.trim() }
      });
   }

   /**
    * Найти или создать тег по имени
    * @param {string} name - имя тега
    * @param {object} transaction - опционально, транзакция Sequelize
    * @returns {Promise<{tag: Tag, created: boolean}>}
    */
   async findOrCreateByName(name, transaction = null) {
      const [tag, created] = await this.model.findOrCreate({
         where: { name: name.trim() },
         defaults: {
            name: name.trim(),
            usage_count: 0
         },
         transaction
      });
      return { tag, created };
   }

   /**
    * Массовое создание тегов (findOrCreate для массива)
    * @param {string[]} names - массив имен тегов
    * @param {object} transaction - опционально, транзакция
    * @returns {Promise<Tag[]>} - массив тегов
    */
   async batchFindOrCreate(names, transaction = null) {
      if (!names || names.length === 0) return [];

      const tags = [];
      for (const name of names) {
         const { tag } = await this.findOrCreateByName(name, transaction);
         tags.push(tag);
      }
      return tags;
   }

   /**
    * Увеличить счетчик использования тега
    * @param {number} tagId - ID тега
    * @param {object} transaction - опционально, транзакция
    * @returns {Promise<void>}
    */
   async incrementUsageCount(tagId, transaction = null) {
      await this.model.increment(
         'usage_count',
         {
            by: 1,
            where: { id: tagId },
            transaction
         }
      );
   }

   /**
    * Уменьшить счетчик использования тега
    * @param {number} tagId - ID тега
    * @param {object} transaction - опционально, транзакция
    * @returns {Promise<void>}
    */
   async decrementUsageCount(tagId, transaction = null) {
      await this.model.decrement(
         'usage_count',
         {
            by: 1,
            where: { id: tagId },
            transaction
         }
      );
   }

   /**
    * Получить популярные теги (сортировка по usage_count DESC)
    * @param {number} limit - лимит (по умолчанию 20)
    * @returns {Promise<Tag[]>}
    */
   async getPopularTags(limit = 20) {
      return await this.model.findAll({
         where: {
            usage_count: {
               [Sequelize.Op.gt]: 0
            }
         },
         order: [['usage_count', 'DESC'], ['name', 'ASC']],
         limit
      });
   }

   /**
    * Получить все теги (с сортировкой по имени)
    * @returns {Promise<Tag[]>}
    */
   async getAllTags() {
      return await this.model.findAll({
         order: [['name', 'ASC']]
      });
   }

   /**
    * Привязать теги к упражнению
    * @param {number} exerciseId - ID упражнения
    * @param {number[]} tagIds - массив ID тегов
    * @param {object} transaction - опционально, транзакция
    * @returns {Promise<void>}
    */
   async attachTagsToExercise(exerciseId, tagIds, transaction = null) {
      if (!tagIds || tagIds.length === 0) return;

      const records = tagIds.map(tagId => ({
         exercise_id: exerciseId,
         tag_id: tagId,
         created_at: new Date()
      }));

      await this.exerciseTagModel.bulkCreate(records, {
         transaction,
         ignoreDuplicates: true // Игнорировать дубликаты
      });

      // Увеличиваем usage_count для каждого тега
      for (const tagId of tagIds) {
         await this.incrementUsageCount(tagId, transaction);
      }
   }

   /**
    * Удалить все связи тегов с упражнением
    * @param {number} exerciseId - ID упражнения
    * @param {object} transaction - опционально, транзакция
    * @returns {Promise<void>}
    */
   async detachAllTagsFromExercise(exerciseId, transaction = null) {
      // Получаем все теги упражнения перед удалением
      const exerciseTags = await this.exerciseTagModel.findAll({
         where: { exercise_id: exerciseId },
         transaction
      });

      // Уменьшаем usage_count для каждого тега
      for (const et of exerciseTags) {
         await this.decrementUsageCount(et.tag_id, transaction);
      }

      // Удаляем связи
      await this.exerciseTagModel.destroy({
         where: { exercise_id: exerciseId },
         transaction
      });
   }

   /**
    * Обновить теги упражнения (замена существующих на новые)
    * @param {number} exerciseId - ID упражнения
    * @param {string[]} tagNames - массив имен тегов
    * @param {object} transaction - опционально, транзакция
    * @returns {Promise<Tag[]>} - массив новых тегов
    */
   async updateExerciseTags(exerciseId, tagNames, transaction = null) {
      // 1. Получаем или создаем теги
      const tags = await this.batchFindOrCreate(tagNames, transaction);
      const newTagIds = tags.map(t => t.id);

      // 2. Удаляем старые связи
      await this.detachAllTagsFromExercise(exerciseId, transaction);

      // 3. Привязываем новые теги
      await this.attachTagsToExercise(exerciseId, newTagIds, transaction);

      return tags;
   }

   /**
    * Получить теги для конкретного упражнения
    * @param {number} exerciseId - ID упражнения
    * @returns {Promise<Tag[]>}
    */
   async getTagsByExerciseId(exerciseId) {
      const exerciseTags = await this.exerciseTagModel.findAll({
         where: { exercise_id: exerciseId },
         include: [{
            model: this.model,
            as: 'tag'
         }]
      });

      return exerciseTags.map(et => et.tag).filter(t => t);
   }

   /**
    * Удалить тег (только если usage_count = 0)
    * @param {number} tagId - ID тега
    * @returns {Promise<boolean>} - true если удален, false если не удален (есть использования)
    */
   async deleteTagIfUnused(tagId) {
      const tag = await this.findById(tagId);
      if (!tag) return false;

      if (tag.usage_count === 0) {
         await tag.destroy();
         return true;
      }
      return false;
   }

   /**
    * Очистить неиспользуемые теги (usage_count = 0)
    * @returns {Promise<number>} - количество удаленных тегов
    */
   async cleanupUnusedTags() {
      const deleted = await this.model.destroy({
         where: {
            usage_count: 0
         }
      });
      return deleted;
   }
}

module.exports = new TagRepository();