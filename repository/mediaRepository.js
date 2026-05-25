// // backend/repository/mediaRepository.js
// const { Media, User } = require('../models/legacy_models');

// class MediaRepository {
//    async create(mediaData) {
//       return await Media.create(mediaData);
//    }

//    async findById(id) {
//       return await Media.findByPk(id);
//    }

//    async findByUser(userId, options = {}) {
//       const { limit = 50, offset = 0, fileType } = options;

//       const where = { user_id: userId };
//       if (fileType) where.file_type = fileType;

//       return await Media.findAll({
//          where,
//          limit,
//          offset,
//          order: [['created_at', 'DESC']],
//          include: [{
//             model: User,
//             as: 'owner',
//             attributes: ['id', 'userName', 'userAvatar']
//          }]
//       });
//    }

//    async findByIdAndUser(id, userId) {
//       return await Media.findOne({
//          where: { id, user_id: userId }
//       });
//    }

//    async findByStorageUrl(storageUrl) {
//       return await Media.findAll({
//          where: { storage_url: storageUrl }
//       });
//    }

//    // Метод для обновления медиа с проверкой прав доступа
//    async updateByIdAndUser(id, userId, updateData) {
//       const media = await Media.findOne({
//          where: { id, user_id: userId }
//       });

//       if (!media) {
//          throw new Error('Media not found or access denied');
//       }

//       return await media.update(updateData);
//    }

//    // Старый метод для обратной совместимости (без проверки пользователя)
//    async update(id, updateData) {
//       const media = await Media.findByPk(id);
//       if (!media) return null;

//       return await media.update(updateData);
//    }

//    async incrementShareCount(id) {
//       const media = await this.findById(id);
//       if (!media) return null;

//       return await media.increment('shared_count');
//    }

//    async delete(id) {
//       const media = await this.findById(id);
//       if (!media) return null;

//       await media.destroy();
//       return true;
//    }

//    async countByStorageUrl(storageUrl) {
//       return await Media.count({
//          where: { storage_url: storageUrl }
//       });
//    }
// }

// module.exports = new MediaRepository();

// backend/repository/mediaRepository.js
const { Media, User, sequelize } = require('../models/');

class MediaRepository {
   async create(mediaData) {
      return await Media.create(mediaData);
   }

   async findById(id) {
      return await Media.findByPk(id);
   }

   /**
    * Получить медиа пользователя с пагинацией и сортировкой
    * @param {number} userId - ID пользователя
    * @param {Object} options - Опции
    * @param {number} options.limit - Лимит записей
    * @param {number} options.offset - Смещение
    * @param {string} options.fileType - Фильтр по типу ('photo', 'video')
    * @param {string} options.sortBy - Поле сортировки ('created_at', 'original_filename', 'file_type', 'size')
    * @param {string} options.sortOrder - Направление ('asc', 'desc')
    * @returns {Promise<{rows: Array, count: number}>}
    */
   async findByUser(userId, options = {}) {
      const {
         limit = 50,
         offset = 0,
         fileType,
         sortBy = 'created_at',
         sortOrder = 'desc'
      } = options;

      // WHERE условия
      const where = { user_id: userId };
      if (fileType) {
         where.file_type = fileType;
      }

      // Построение ORDER BY
      const order = this._buildOrderBy(sortBy, sortOrder);

      // Используем findAndCountAll для пагинации
      return await Media.findAndCountAll({
         where,
         limit,
         offset,
         order,
         distinct: true,
         include: [{
            model: User,
            as: 'owner',
            attributes: ['id', 'userName', 'userAvatar']
         }]
      });
   }

   /**
    * Построение ORDER BY в зависимости от поля сортировки
    * @private
    */
   _buildOrderBy(sortBy, sortOrder) {
      const direction = sortOrder.toUpperCase();

      switch (sortBy) {
         case 'created_at':
            return [['created_at', direction]];
         case 'original_filename':
            return [[sequelize.literal(`original_filename ${direction}`)]];
         case 'file_type':
            return [[sequelize.literal(`file_type ${direction}`)]];
         case 'size':
            return [[sequelize.literal(`size ${direction}`)]];
         default:
            return [['created_at', 'DESC']];
      }
   }

   async findByIdAndUser(id, userId) {
      return await Media.findOne({
         where: { id, user_id: userId }
      });
   }

   async findByStorageUrl(storageUrl) {
      return await Media.findAll({
         where: { storage_url: storageUrl }
      });
   }

   // Метод для обновления медиа с проверкой прав доступа
   async updateByIdAndUser(id, userId, updateData) {
      const media = await Media.findOne({
         where: { id, user_id: userId }
      });

      if (!media) {
         throw new Error('Media not found or access denied');
      }

      return await media.update(updateData);
   }

   // Старый метод для обратной совместимости (без проверки пользователя)
   async update(id, updateData) {
      const media = await Media.findByPk(id);
      if (!media) return null;

      return await media.update(updateData);
   }

   async incrementShareCount(id) {
      const media = await this.findById(id);
      if (!media) return null;

      return await media.increment('shared_count');
   }

   async delete(id) {
      const media = await this.findById(id);
      if (!media) return null;

      await media.destroy();
      return true;
   }

   async countByStorageUrl(storageUrl) {
      return await Media.count({
         where: { storage_url: storageUrl }
      });
   }
}

module.exports = new MediaRepository();