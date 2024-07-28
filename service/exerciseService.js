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

}

module.exports = new ExerciseService();