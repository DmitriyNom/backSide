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

}

module.exports = new NoteService();