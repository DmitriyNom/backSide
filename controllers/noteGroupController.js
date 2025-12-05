const ApiError = require('../error/ApiError');
const NoteGroupService = require('../service/noteGroupService');

class NoteGroupController {
   async createNoteGroup(req, res, next) {
      try {
         const user_id = req.user.id;
         const { group_name, group_description, label_color } = req.body;

         const noteGroup = await NoteGroupService.createNoteGroup({
            group_name,
            group_description,
            label_color,
            user_id,
         });
         return res.json(noteGroup);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async getAllNoteGroups(req, res, next) {
      try {
         const user_id = req.user.id;
         let { limit, page } = req.query;
         page = page || 1;
         limit = limit || 100;
         const offset = (page - 1) * limit;

         const noteGroups = await NoteGroupService.getAllNoteGroups(user_id, limit, offset);
         return res.json(noteGroups);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async getOneNoteGroup(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;

         const noteGroup = await NoteGroupService.getOneNoteGroup(id, user_id);
         if (!noteGroup) {
            return res.status(404).json({ message: 'Группа заметок не найдена' });
         }
         return res.json(noteGroup);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async updateOneNoteGroup(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;
         const noteGroupData = req.body;

         const updatedNoteGroup = await NoteGroupService.updateOneNoteGroup(noteGroupData, id, user_id);
         if (!updatedNoteGroup) {
            return res.status(404).json({ message: 'Группа заметок не найдена или нет доступа' });
         }
         return res.json(updatedNoteGroup);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async deleteOneNoteGroup(req, res, next) {
      try {
         const user_id = req.user.id;
         const { id } = req.params;

         const deleted = await NoteGroupService.deleteOneNoteGroup(id, user_id);
         if (!deleted) {
            return res.status(404).json({ message: 'Группа заметок не найдена или нет доступа' });
         }
         return res.json({ message: 'Группа заметок удалена' });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }
}

module.exports = new NoteGroupController();
