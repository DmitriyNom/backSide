const { ExerciseGroup } = require('../models/legacy_models');

class ExerciseGroupRepository {
   async create(exerciseGroup) {
      return await ExerciseGroup.create(exerciseGroup);
   }

   async findAll(user_id, limit, offset) {
      return await ExerciseGroup.findAndCountAll({
         where: { user_id },
         limit,
         offset,
         order: [['createdAt', 'DESC']],
      });
   }

   async findOne(id, user_id) {
      return await ExerciseGroup.findOne({
         where: {
            id,
            user_id,
         },
      });
   }

   async update(exerciseGroup, id, user_id) {
      return await ExerciseGroup.update(
         { ...exerciseGroup },
         {
            where: { id, user_id },
            returning: true,
         }
      );
   }

   async destroyById(id, user_id) {
      const deletedCount = await ExerciseGroup.destroy({
         where: { id, user_id },
         returning: true,
         plain: true,
      });
      return deletedCount; // количество удалённых записей (PostgreSQL)
   }
}

module.exports = new ExerciseGroupRepository();
