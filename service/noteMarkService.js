const { deleteOneGroup } = require('../controllers/noteMarkController');
const ApiError = require('../error/ApiError');
const { NoteMark } = require('../models/models')


class NoteMarkService {



   async getAllMarksForNote(limit, offset) {

      return await NoteMark.findAndCountAll({ limit, offset })

   }

   async getOneMark(id) {
      const foundMark = await NoteMark.findOne(
         {
            where: { id }
         }
      )
      return foundMark;
   }

   async createMark(mark) {
      return await NoteMark.create(mark)
   }

   async updateMark(mark, id) {
      const [updatedRowsCount, updatedRows] = await NoteMark.update(
         { ...mark },
         {
            where: { id },
            returning: true
         }
      )

      return updatedRows[0].dataValues
   }

   async deleteMark(id) {
      await NoteMark.destroy(
         {
            where: { id }
         }
      )
   }
}


module.exports = new NoteMarkService();