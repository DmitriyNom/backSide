const { Exercise } = require('../models/legacy_models');

class ExerciseRepository {
   async createExercise(exercise) {
      // exercise должен содержать user_id
      return Exercise.create(exercise);
   }

   async getAllExercises(userId, limit, offset) {
      return Exercise.findAndCountAll({
         where: { user_id: userId },
         limit,
         offset,
         order: [['createdAt', 'DESC']],
      });
   }

   async getOneExercise(id, userId) {
      return Exercise.findOne({
         where: {
            id,
            user_id: userId,
         },
      });
   }

   async updateOneExercise(exercise, id, userId) {
      return Exercise.update(
         { ...exercise },
         {
            where: { id, user_id: userId },
            returning: true,
         }
      );
   }

   async deleteOneExercise(id, userId) {
      return Exercise.destroy({
         where: { id, user_id: userId },
         returning: true,
         plain: true,
      });
   }
}

module.exports = new ExerciseRepository();
