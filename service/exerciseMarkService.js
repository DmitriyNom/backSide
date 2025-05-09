const ApiError = require('../error/ApiError');
const { ExerciseMark, Exercise } = require('../models/models');
const { deleteMark } = require('./noteMarkService');


class ExerciseMarkService {


   async getAllMarks(limit, offset) {

      const allMarks = await ExerciseMark.findAndCountAll({ limit, offset })

      return allMarks;
   }

   async getOneMark(id) {
      const foundExMark = await ExerciseMark.findOne(
         {
            where: { id }
         }
      )

      return foundExMark
   }

   async createOneMark(mark) {
      const createdMark = await ExerciseMark.create(mark)
      return createdMark
   }

   async updateOneMark(mark, id) {
      const [updatedRowsCount, updatedRows] = await ExerciseMark.update(
         { ...mark },
         {
            where: { id },
            returning: true
         }
      )

      return updatedRows[0].dataValues
   }

   async deleteOneMark(id) {
      await this.getOneMark(id)
         .then(value => {
            if (value) {
               return value.destroy();

            } else {
               throw new Error('Record not found')
            }
         })
         .then(() => {
            console.log("Record deleted successfully")
         })
         .catch(err => {
            throw (err)
         })
   }

}


module.exports = new ExerciseMarkService();