const ApiError = require('../error/ApiError');
const ExerciseRepository = require('../repository/exerciseRepository');

class ExerciseService {
   async createExercise(exercise) {
      // exercise уже содержит userId (user_id)
      return await ExerciseRepository.createExercise(exercise);
   }

   async getAllExercises(userId, limit, offset) {
      // фильтрация по userId
      return await ExerciseRepository.getAllExercises(userId, limit, offset);
   }

   async getOneExercise(id, userId) {
      return await ExerciseRepository.getOneExercise(id, userId);
   }

   async updateOneExercise(exercise, id, userId) {
      // сначала проверим, что упражнение принадлежит пользователю
      const existingExercise = await this.getOneExercise(id, userId);
      if (!existingExercise) {
         throw ApiError.badRequest('Упражнение не найдено или нет доступа');
      }

      const [updatedRowsCount, updatedRows] = await ExerciseRepository.updateOneExercise(exercise, id, userId);
      if (updatedRowsCount === 0) {
         throw ApiError.badRequest('Упражнение не найдено для обновления');
      }
      return updatedRows[0]; // возвращаем обновлённый объект
   }

   async deleteOneExercise(id, userId) {
      const exercise = await this.getOneExercise(id, userId);
      if (!exercise) {
         throw ApiError.badRequest('Упражнение не найдено или нет доступа');
      }
      const deletedExercise = await ExerciseRepository.deleteOneExercise(id, userId);
      console.log('Запись удалена');
      return deletedExercise;
   }
}

module.exports = new ExerciseService();
