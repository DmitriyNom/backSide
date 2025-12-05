const ApiError = require('../error/ApiError');
const NoteGroupRepository = require('../repository/noteGroupRepository');

class NoteGroupService {
   async createNoteGroup(noteGroup) {
      // noteGroup уже содержит user_id
      return await NoteGroupRepository.create(noteGroup);
   }

   async getAllNoteGroups(user_id, limit, offset) {
      // фильтрация по user_id
      return await NoteGroupRepository.findAll(user_id, limit, offset);
   }

   async getOneNoteGroup(id, user_id) {
      return await NoteGroupRepository.findOne(id, user_id);
   }

   async updateOneNoteGroup(noteGroup, id, user_id) {
      // сначала проверим, что группа принадлежит пользователю
      const existingGroup = await this.getOneNoteGroup(id, user_id);
      if (!existingGroup) {
         throw ApiError.badRequest('Запись не найдена или нет доступа');
      }

      const [updatedRowsCount, updatedRows] = await NoteGroupRepository.update(noteGroup, id, user_id);
      if (updatedRowsCount === 0) {
         throw ApiError.badRequest('Запись не найдена для обновления');
      }
      return updatedRows[0]; // возвращаем обновлённый объект
   }

   async deleteOneNoteGroup(id, user_id) {
      const group = await this.getOneNoteGroup(id, user_id);
      if (!group) {
         throw ApiError.badRequest('Запись не найдена или нет доступа');
      }
      const deletedGroup = await NoteGroupRepository.destroyById(id, user_id);
      console.log('Record deleted successfully');
      return deletedGroup;
   }
}

module.exports = new NoteGroupService();
