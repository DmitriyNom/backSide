const ApiError = require('../error/ApiError');
const { Note } = require("../models/models")
const NoteService = require('../service/noteService')
const countOffset = require('../utils/countOffset')



class NoteController {

   async createNote(req, res) {
      const { name, description, priority } = req.body
      const note = await NoteService.createNote({ notes_name: name, notes_description: description, notes_priority: priority })
      return res.json(note)
   }


   async getAllNotes(req, res) {

      let { limit, page } = req.query;

      page = page || 1;
      limit = limit || 100;

      let offset = countOffset(page, limit)

      const notes = await NoteService.getAllNotes(limit, offset)
      return res.json(notes)
   }

   async getOneNote(req, res) {
      const { id } = req.params
      const note = await NoteService.getOneNote(id)
      return res.json(note)
   }

   async deleteOneNote(req, res) {
      const { id } = req.params;
      const note = await NoteService.deleteOneNote(id);
      return res.json(note);
   }

}

module.exports = new NoteController();