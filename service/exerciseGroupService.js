const ApiError = require('../error/ApiError');
const ExerciseGroupRepository = require('../repository/exerciseGroupRepository');

class ExerciseGroupService {
   async createExerciseGroup(exerciseGroup) {
      // exerciseGroup уже содержит user_id
      return await ExerciseGroupRepository.create(exerciseGroup);
   }

   async getAllExerciseGroups(user_id, limit, offset) {
      // фильтрация по user_id
      return await ExerciseGroupRepository.findAll(user_id, limit, offset);
   }

   async getOneExerciseGroup(id, user_id) {
      return await ExerciseGroupRepository.findOne(id, user_id);
   }

   async updateOneExerciseGroup(exerciseGroup, id, user_id) {
      // сначала проверим, что группа принадлежит пользователю
      const existingGroup = await this.getOneExerciseGroup(id, user_id);
      if (!existingGroup) {
         throw ApiError.badRequest('Запись не найдена или нет доступа');
      }

      const [updatedRowsCount, updatedRows] = await ExerciseGroupRepository.update(exerciseGroup, id, user_id);
      if (updatedRowsCount === 0) {
         throw ApiError.badRequest('Запись не найдена для обновления');
      }
      return updatedRows[0]; // возвращаем обновлённый объект
   }

   async deleteOneExerciseGroup(id, user_id) {
      const group = await this.getOneExerciseGroup(id, user_id);
      if (!group) {
         throw ApiError.badRequest('Запись не найдена или нет доступа');
      }
      const deletedGroup = await ExerciseGroupRepository.destroyById(id, user_id);
      console.log('Record deleted successfully');
      return deletedGroup;
   }
}

module.exports = new ExerciseGroupService();
