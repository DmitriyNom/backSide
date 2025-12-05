const { Note } = require('../models/models');

class NoteRepository {
   async create(note) {
      return await Note.create(note);
   }

   async findAll(userId, limit, offset) {
      return await Note.findAndCountAll({
         where: { user_id: userId },
         limit,
         offset,
         order: [['createdAt', 'DESC']],
      });
   }

   async findOne(id, userId) {
      return await Note.findOne({
         where: {
            id,
            user_id: userId,
         },
      });
   }

   async update(note, id, userId) {
      return await Note.update(
         { ...note },
         {
            where: { id, user_id: userId },
            returning: true,
         }
      );
   }


   async destroyById(id, userId) {
      // destroy возвращает число удалённых строк, не объект
      const deletedCount = await Note.destroy({
         where: { id, user_id: userId },
         // Убраны returning и plain — они не работают для destroy
      });
      return deletedCount;  // Возвращает число (0 или 1)
   }

}

module.exports = new NoteRepository();
