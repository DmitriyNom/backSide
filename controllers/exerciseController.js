const ApiError = require('../error/ApiError');
const ExerciseService = require('../service/exerciseService')
const countOffset = require('../utils/countOffset')


class ExerciseController {

   async createExercise(req, res) {
      const { name, description } = req.body
      const exercise = await ExerciseService.createExercise({ exercise_name: name, exercise_description: description })
      return res.json(exercise)
   }


   async getAllExercises(req, res) {

      let { limit, page } = req.query;

      page = page || 1;
      limit = limit || 100;

      let offset = countOffset(page, limit)

      const exercises = await ExerciseService.getAllExercises(limit, offset)
      return res.json(exercises)
   }

   async getOneExercise(req, res) {
      const { id } = req.params
      const exercise = await ExerciseService.getOneExercise(id)
      return res.json(exercise)
   }

   async deleteOneExercise(req, res) {
      const { id } = req.params
      const exercise = await ExerciseService.deleteOneExercise(id)
      return res.json(exercise)
   }
}

module.exports = new ExerciseController();