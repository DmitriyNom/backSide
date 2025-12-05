const ApiError = require('../error/ApiError');
const ExerciseGroupService = require('../service/exerciseGroupService');

class ExerciseGroupController {
   async createExerciseGroup(req, res, next) {
      try {
         const user_id = req.user.id;
         const { group_name, group_description, label_color } = req.body;

         const exerciseGroup = await ExerciseGroupService.createExerciseGroup({
            group_name,
            group_description,
            label_color,
            user_id,
         });
         return res.json(exerciseGroup);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async getAllExerciseGroups(req, res, next) {
      try {
         const user_id = req.user.id;
         let { limit, page } = req.query;
         page = page || 1;
         limit = limit || 100;
         const offset = (page - 1) * limit;

         const exerciseGroups = await ExerciseGroupService.getAllExerciseGroups(user_id, limit, offset);
         return res.json(exerciseGroups);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async getOneExerciseGroup(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;

         const exerciseGroup = await ExerciseGroupService.getOneExerciseGroup(id, user_id);
         if (!exerciseGroup) {
            return res.status(404).json({ message: 'Группа упражнений не найдена' });
         }
         return res.json(exerciseGroup);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async updateOneExerciseGroup(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;
         const exerciseGroupData = req.body;

         const updatedExerciseGroup = await ExerciseGroupService.updateOneExerciseGroup(exerciseGroupData, id, user_id);
         if (!updatedExerciseGroup) {
            return res.status(404).json({ message: 'Группа упражнений не найдена или нет доступа' });
         }
         return res.json(updatedExerciseGroup);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async deleteOneExerciseGroup(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;

         const deleted = await ExerciseGroupService.deleteOneExerciseGroup(id, user_id);
         if (!deleted) {
            return res.status(404).json({ message: 'Группа упражнений не найдена или нет доступа' });
         }
         return res.json({ message: 'Группа упражнений удалена' });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }
}

module.exports = new ExerciseGroupController();
