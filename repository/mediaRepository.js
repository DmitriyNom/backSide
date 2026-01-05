// backend/repository/mediaRepository.js
const { Media, User } = require('../models/models');

class MediaRepository {
   async create(mediaData) {
      return await Media.create(mediaData);
   }

   async findById(id) {
      return await Media.findByPk(id);
   }

   async findByUser(userId, options = {}) {
      const { limit = 50, offset = 0, fileType } = options;

      const where = { user_id: userId };
      if (fileType) where.file_type = fileType;

      return await Media.findAll({
         where,
         limit,
         offset,
         order: [['created_at', 'DESC']],
         include: [{
            model: User,
            as: 'owner',
            attributes: ['id', 'userName', 'userAvatar']
         }]
      });
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

   async update(id, updateData) {
      const media = await this.findById(id);
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