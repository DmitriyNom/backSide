const { NoteGroup } = require('../models/legacy_models');

class NoteGroupRepository {
   async create(noteGroup) {
      return await NoteGroup.create(noteGroup);
   }

   async findAll(user_id, limit, offset) {
      return await NoteGroup.findAndCountAll({
         where: { user_id },
         limit,
         offset,
         order: [['createdAt', 'DESC']],
      });
   }

   async findOne(id, user_id) {
      return await NoteGroup.findOne({
         where: {
            id,
            user_id,
         },
      });
   }

   async update(noteGroup, id, user_id) {
      return await NoteGroup.update(
         { ...noteGroup },
         {
            where: { id, user_id },
            returning: true,
         }
      );
   }

   async destroyById(id, user_id) {
      const deletedCount = await NoteGroup.destroy({
         where: { id, user_id },
         returning: true,
         plain: true,
      });
      return deletedCount; // количество удалённых записей (PostgreSQL)
   }
}

module.exports = new NoteGroupRepository();
