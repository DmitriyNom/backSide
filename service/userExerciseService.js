const ApiError = require('../error/ApiError');
const { UserExercise } = require('../models/models')


class UserExerciseService {

   async getAllExercisesForUser(limit, offset) {

      const allExercisesForUser = await UserExercise.findAndCountAll({ limit, offset })

      return allExercisesForUser;
   }

}


module.exports = new UserExerciseService();