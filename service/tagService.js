// backend/service/tagService.js
const ApiError = require('../error/ApiError');
const TagRepository = require('../repository/tagRepository');

class TagService {
   /**
    * Получить теги упражнения
    * @param {number} exerciseId - ID упражнения
    * @returns {Promise<Tag[]>}
    */
   async getTagsByExerciseId(exerciseId) {
      if (!exerciseId) {
         throw ApiError.badRequest('ID упражнения обязателен');
      }
      return await TagRepository.getTagsByExerciseId(exerciseId);
   }

   /**
    * Обновить теги упражнения (замена существующих на новые)
    * @param {number} exerciseId - ID упражнения
    * @param {string[]} tagNames - массив имен тегов
    * @param {object} transaction - транзакция (опционально)
    * @returns {Promise<Tag[]>}
    */
   async updateExerciseTags(exerciseId, tagNames, transaction = null) {
      if (!exerciseId) {
         throw ApiError.badRequest('ID упражнения обязателен');
      }

      if (!tagNames || !Array.isArray(tagNames)) {
         throw ApiError.badRequest('Теги должны быть переданы массивом');
      }

      // Очищаем и фильтруем теги
      const cleanedTags = tagNames
         .filter(tag => tag && typeof tag === 'string' && tag.trim())
         .map(tag => tag.trim().toLowerCase());

      // Убираем дубликаты
      const uniqueTags = [...new Set(cleanedTags)];

      // Валидация длины тегов
      for (const tag of uniqueTags) {
         if (tag.length > 100) {
            throw ApiError.badRequest(`Тег "${tag}" превышает максимальную длину в 100 символов`);
         }
         if (!/^[a-zA-Zа-яА-Я0-9\s\-_]+$/.test(tag)) {
            throw ApiError.badRequest(`Тег "${tag}" содержит недопустимые символы`);
         }
      }

      return await TagRepository.updateExerciseTags(exerciseId, uniqueTags, transaction);
   }

   /**
    * Получить популярные теги
    * @param {number} limit - лимит (по умолчанию 20)
    * @returns {Promise<Tag[]>}
    */
   async getPopularTags(limit = 20) {
      const parsedLimit = parseInt(limit);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
         throw ApiError.badRequest('Лимит должен быть положительным числом');
      }
      return await TagRepository.getPopularTags(Math.min(parsedLimit, 100));
   }

   /**
    * Получить все теги
    * @returns {Promise<Tag[]>}
    */
   async getAllTags() {
      return await TagRepository.getAllTags();
   }

   /**
    * Найти или создать тег
    * @param {string} name - название тега
    * @returns {Promise<{tag: Tag, created: boolean}>}
    */
   async findOrCreateTag(name) {
      if (!name || typeof name !== 'string' || name.trim() === '') {
         throw ApiError.badRequest('Название тега не может быть пустым');
      }

      const trimmedName = name.trim().toLowerCase();

      if (trimmedName.length > 100) {
         throw ApiError.badRequest('Название тега не может превышать 100 символов');
      }

      if (!/^[a-zA-Zа-яА-Я0-9\s\-_]+$/.test(trimmedName)) {
         throw ApiError.badRequest('Тег может содержать только буквы, цифры, пробелы, дефис и подчеркивание');
      }

      const { tag, created } = await TagRepository.findOrCreateByName(trimmedName);
      return { tag, created };
   }

   /**
    * Увеличить счетчик использования тега
    * @param {number} tagId - ID тега
    * @param {object} transaction - транзакция (опционально)
    * @returns {Promise<void>}
    */
   async incrementUsageCount(tagId, transaction = null) {
      if (!tagId) {
         throw ApiError.badRequest('ID тега обязателен');
      }
      await TagRepository.incrementUsageCount(tagId, transaction);
   }

   /**
    * Уменьшить счетчик использования тега
    * @param {number} tagId - ID тега
    * @param {object} transaction - транзакция (опционально)
    * @returns {Promise<void>}
    */
   async decrementUsageCount(tagId, transaction = null) {
      if (!tagId) {
         throw ApiError.badRequest('ID тега обязателен');
      }
      await TagRepository.decrementUsageCount(tagId, transaction);
   }

   /**
    * Удалить тег (только если usage_count = 0)
    * @param {number} tagId - ID тега
    * @returns {Promise<{success: boolean, message: string}>}
    */
   async deleteTagIfUnused(tagId) {
      if (!tagId) {
         throw ApiError.badRequest('ID тега обязателен');
      }

      const tag = await TagRepository.findById(tagId);
      if (!tag) {
         throw ApiError.notFound('Тег не найден');
      }

      if (tag.usage_count > 0) {
         throw ApiError.badRequest(`Невозможно удалить тег "${tag.name}", так как он используется в ${tag.usage_count} упражнениях`);
      }

      await tag.destroy();
      return { success: true, message: `Тег "${tag.name}" успешно удален` };
   }

   /**
    * Очистить все неиспользуемые теги
    * @returns {Promise<{success: boolean, message: string, deletedCount: number}>}
    */
   async cleanupUnusedTags() {
      const deletedCount = await TagRepository.cleanupUnusedTags();
      return {
         success: true,
         message: `Удалено ${deletedCount} неиспользуемых тегов`,
         deletedCount
      };
   }

   /**
    * Поиск тегов по имени (частичное совпадение)
    * @param {string} query - поисковый запрос
    * @param {number} limit - лимит (по умолчанию 20)
    * @returns {Promise<Tag[]>}
    */
   async searchTags(query, limit = 20) {
      const parsedLimit = parseInt(limit);
      const finalLimit = isNaN(parsedLimit) ? 20 : Math.min(parsedLimit, 50);

      let allTags = await TagRepository.getAllTags();

      if (query && query.trim()) {
         const searchQuery = query.trim().toLowerCase();
         allTags = allTags.filter(tag =>
            tag.name.toLowerCase().includes(searchQuery)
         );
      }

      return allTags.slice(0, finalLimit);
   }

   /**
    * Получить тег по ID
    * @param {number} id - ID тега
    * @returns {Promise<Tag|null>}
    */
   async getTagById(id) {
      if (!id) {
         throw ApiError.badRequest('ID тега обязателен');
      }
      const tag = await TagRepository.findById(id);
      if (!tag) {
         throw ApiError.notFound('Тег не найден');
      }
      return tag;
   }

   /**
    * Получить тег по имени
    * @param {string} name - имя тега
    * @returns {Promise<Tag|null>}
    */
   async getTagByName(name) {
      if (!name) {
         throw ApiError.badRequest('Имя тега обязательно');
      }
      const tag = await TagRepository.findByName(name.trim().toLowerCase());
      if (!tag) {
         throw ApiError.notFound('Тег не найден');
      }
      return tag;
   }

   /**
    * Массовое получение тегов по именам
    * @param {string[]} names - массив имен тегов
    * @returns {Promise<Tag[]>}
    */
   async getTagsByNames(names) {
      if (!names || !Array.isArray(names)) {
         return [];
      }

      const tags = [];
      for (const name of names) {
         try {
            const { tag } = await this.findOrCreateTag(name);
            tags.push(tag);
         } catch (error) {
            // Пропускаем некорректные теги
            console.log(`Пропущен некорректный тег: ${name}`);
         }
      }
      return tags;
   }
}

module.exports = new TagService();