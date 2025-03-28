const ApiError = require('../error/ApiError');
const { UserExercise } = require('../models/models')


class UserExerciseService {

   async getAllExercisesForUser(limit, offset) {

      const allExercisesForUser = await UserExercise.findAndCountAll({ limit, offset })

      return allExercisesForUser;
   }

   async createUserExercise(userId, exerciseId) {
      //добавить проверку на наличие юзера и упражнения с этим ид
      return await UserExercise.create(userId, exerciseId)
   }

}


module.exports = new UserExerciseService();