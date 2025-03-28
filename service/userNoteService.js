const ApiError = require('../error/ApiError');
const { UserNote } = require('../models/models')


class UserNotesService {

   // async createNote(note) {
   //    const createdNote = await Note.create(note)
   //    return createdNote
   // }


   async getAllNotesForUser(limit, offset) {

      const allNotesForUser = await UserNote.findAndCountAll({ limit, offset })

      return allNotesForUser;
   }

   async createUserNote(userId, noteId) {
      return await UserNote.create(userId, noteId)
   }

   // async getOneNote(id) {
   //    const foundNote = await Note.findOne(
   //       {
   //          where: { id }
   //       },
   //    )
   //    return foundNote
   // }

   // async deleteOneNote(id) {
   //    await this.getOneNote(id)
   //       .then((result) => {
   //          Note.destroy({ where: { id } })
   //          return result;
   //       })
   // }
}


module.exports = new UserNotesService();