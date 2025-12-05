const ApiError = require('../error/ApiError');
const ExerciseService = require('../service/exerciseService');
const countOffset = require('../utils/countOffset');

class ExerciseController {

   async createExercise(req, res, next) {
      try {
         const user_id = req.user.id;
         const { exercise_name, exercise_description } = req.body;

         const exercise = await ExerciseService.createExercise({ exercise_name, exercise_description, user_id });
         return res.status(201).json(exercise);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async getAllExercises(req, res, next) {
      try {
         const user_id = req.user.id;
         let { limit, page } = req.query;
         page = page || 1;
         limit = limit || 100;
         const offset = countOffset(page, limit);

         const exercises = await ExerciseService.getAllExercises(user_id, limit, offset);
         return res.json(exercises);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async getOneExercise(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;

         const exercise = await ExerciseService.getOneExercise(id, user_id);
         if (!exercise) {
            return res.status(404).json({ message: 'Упражнение не найдено' });
         }
         return res.json(exercise);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async updateOneExercise(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;
         const exerciseData = req.body;

         const updatedExercise = await ExerciseService.updateOneExercise(exerciseData, id, user_id);
         if (!updatedExercise) {
            return res.status(404).json({ message: 'Упражнение не найдено или нет доступа' });
         }
         return res.json(updatedExercise);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async deleteOneExercise(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;

         const deleted = await ExerciseService.deleteOneExercise(id, user_id);
         if (!deleted) {
            return res.status(404).json({ message: 'Упражнение не найдено или нет доступа' });
         }
         return res.json({ message: 'Упражнение удалено' });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }
}

module.exports = new ExerciseController();
