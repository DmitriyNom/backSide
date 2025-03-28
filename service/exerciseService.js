const { deleteOneExercise } = require('../controllers/exerciseController');
const ApiError = require('../error/ApiError');
const { Exercise } = require('../models/models')


class ExerciseService {

   async createExercise(exercise) {
      const createdExercise = await Exercise.create(exercise)
      return createdExercise
   }


   async getAllExercises(limit, offset) {

      const allExercises = await Exercise.findAndCountAll({ limit, offset })

      return allExercises
   }



   async getOneExercise(id) {
      const foundExercise = await Exercise.findOne(
         {
            where: { id }
         },
      )
      return foundExercise
   }



   async updateOneExercise(exercise, id) {

      const [updatedRowsCount, updatedRows] = await Exercise.update(
         { ...exercise },
         {
            where: { id },
            returning: true
         }
      )

      return updatedRows[0].dataValues

   }

   async deleteOneExercise(id) {

      await this.getOneExercise(id)
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
            console.log('Error deleting record: ', err)
         })
   }
}

module.exports = new ExerciseService();