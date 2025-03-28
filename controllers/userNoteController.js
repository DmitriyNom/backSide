const ApiError = require('../error/ApiError');
const { userNote } = require("../models/models")
const countOffset = require('../utils/countOffset')
const UserNoteService = require('../service/userNoteService')



class UserNoteController {

   async getAllNotesForUser(req, res) {

      let { limit, page } = req.query;

      page = page || 1;
      limit = limit || 100;

      let offset = countOffset(page, limit)

      const userNotes = await UserNoteService.getAllNotesForUser(limit, offset)
      return res.json(userNotes)
   }

   async addOneNoteForUser(req, res) {

      const { userId, noteId } = req.body
      const userNote = await UserNoteService.createUserNote({ userId, noteId })
      return res.json(userNote)

   }


}

module.exports = new UserNoteController();