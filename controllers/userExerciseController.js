const ApiError = require('../error/ApiError');
const { userNote } = require("../models/models")
const countOffset = require('../utils/countOffset')
const UserExerciseService = require('../service/userExerciseService')



class UserExerciseController {

   async getAllExercisesForUser(req, res) {

      let { limit, page } = req.query;

      page = page || 1;
      limit = limit || 100;

      let offset = countOffset(page, limit)

      const userExercises = await UserExerciseService.getAllExercisesForUser(limit, offset)

      return res.json(userExercises)
   }

}

module.exports = new UserExerciseController();