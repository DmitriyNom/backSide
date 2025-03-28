const ApiError = require('../error/ApiError');
const ExerciseService = require('../service/exerciseService')
const countOffset = require('../utils/countOffset')


class ExerciseController {

   async createExercise(req, res) {
      const { exercise_name, exercise_description, exercise_mark } = req.body
      const exercise = await ExerciseService.createExercise({ exercise_name, exercise_description, exercise_mark })
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

   async updateOneExercise(req, res) {
      const exercise = req.body;
      const { id } = req.params

      const updatedExercise = await ExerciseService.updateOneExercise(exercise, id)

      console.log("updatedExercise:" + updatedExercise)

      return res.json(updatedExercise)
   }


   async deleteOneExercise(req, res) {
      const { id } = req.params
      const exercise = await ExerciseService.deleteOneExercise(id)
      return res.json(exercise)
   }
}

module.exports = new ExerciseController();