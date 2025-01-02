const ApiError = require('../error/ApiError');
const { GroupOfNotes } = require('../models/models')


class GroupOfNotesService {



   async getAllGroupsOfNotes(limit, offset) {

      const allGroupsOfNotes = await GroupOfNotes.findAndCountAll({ limit, offset })

      return allGroupsOfNotes;
   }

}


module.exports = new GroupOfNotesService();