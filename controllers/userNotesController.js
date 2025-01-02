const ApiError = require('../error/ApiError');
const { userNote } = require("../models/models")
const countOffset = require('../utils/countOffset')
const UserNotesService = require('../service/userNotesService')



class UserNotesController {

   async getAllNotesForUser(req, res) {

      let { limit, page } = req.query;

      page = page || 1;
      limit = limit || 100;

      let offset = countOffset(page, limit)

      const userNotes = await UserNotesService.getAllNotesForUser(limit, offset)
      return res.json(userNotes)
   }

}

module.exports = new UserNotesController();