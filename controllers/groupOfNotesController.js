const ApiError = require('../error/ApiError');
const { userNote } = require("../models/models")
const countOffset = require('../utils/countOffset')
const GroupOfNotesService = require('../service/groupOfNotesService')



class GroupOfNotesController {

   async getAllGroupsOfNotes(req, res) {

      let { limit, page } = req.query;

      page = page || 1;
      limit = limit || 100;

      let offset = countOffset(page, limit)

      const groups = await GroupOfNotesService.getAllGroupsOfNotes(limit, offset)

      return res.json(groups)
   }

}

module.exports = new GroupOfNotesController();