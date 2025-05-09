const ApiError = require('../error/ApiError');
const { Note } = require('../models/models')


class NoteService {

   async createNote(note) {
      const createdNote = await Note.create(note)
      return createdNote
   }


   async getAllNotes(limit, offset) {

      const allNotes = await Note.findAndCountAll({ limit, offset })

      return allNotes
   }

   async getOneNote(id) {
      const foundNote = await Note.findOne(
         {
            where: { id }
         },
      )
      return foundNote
   }

   async updateOneNote(note, id) {
      const [updatedRowsCount, updatedRows] = await Note.update(
         { ...note },
         {
            where: { id },
            returning: true
         }
      )

      return updatedRows[0].dataValues
   }

   // async deleteOneNote(id) {
   //    await this.getOneNote(id)
   //       .then((result) => {
   //          Note.destroy({ where: { id } })
   //          return result;
   //       })
   // }

   async deleteOneNote(id) {
      try {
         const note = await this.getOneNote(id);

         if (!note) {
            throw new Error('Record not found');
         }

         await note.destroy();
         console.log("Record deleted successfully");
      } catch (err) {
         console.error('Error deleting record: ', err);
         throw err; // Пробрасываем ошибку дальше
      }
   }

}


module.exports = new NoteService();