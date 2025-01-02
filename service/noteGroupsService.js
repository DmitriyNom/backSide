const { deleteOneGroup } = require('../controllers/noteGroupsController');
const ApiError = require('../error/ApiError');
const { NoteGroup } = require('../models/models')


class NoteGroupsService {



   async getAllNoteGroups(limit, offset) {

      return await NoteGroup.findAndCountAll({ limit, offset })

   }

   async getOneGroup(id) {
      const foundGroup = await NoteGroup.findOne(
         {
            where: { id }
         }
      )
      return foundGroup;
   }

   async createGroup(group) {
      return await NoteGroup.create(group)
   }

   async updateGroup(group, id) {
      const [updatedRowsCount, updatedRows] = await NoteGroup.update(
         { ...group },
         {
            where: { id },
            returning: true
         }
      )

      return updatedRows[0].dataValues
   }

   async deleteGroup(id) {
      await NoteGroup.destroy(
         {
            where: { id }
         }
      )
   }
}


module.exports = new NoteGroupsService();