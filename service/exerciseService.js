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

      // return updatedRows[0].dataValues

      if (updatedRowsCount === 0) {
         throw new Error('Exercise not found or not updated'); // Вы можете выбросить ошибку, если ничего не обновлено
      }

      return updatedRows[0]; // Возвращаем сам объект, а не его dataValues
   }

   async deleteOneExercise(id) {
      try {
         const exercise = await this.getOneExercise(id);

         if (!exercise) {
            throw new Error('Record not found');
         }

         await exercise.destroy();
         console.log("Record deleted successfully");
      } catch (err) {
         console.error('Error deleting record: ', err);
         throw err; // Пробрасываем ошибку дальше
      }
   }

}

module.exports = new ExerciseService();