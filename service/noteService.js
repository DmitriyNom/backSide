
const ApiError = require('../error/ApiError');
const NoteRepository = require('../repository/noteRepository');

class NoteService {
   async createNote(note) {
      // note уже содержит userId
      return await NoteRepository.create(note);
   }

   async getAllNotes(userId, limit, offset) {
      // фильтрация по userId
      return await NoteRepository.findAll(userId, limit, offset);
   }

   async getOneNote(id, userId) {
      return await NoteRepository.findOne(id, userId);
   }

   async updateOneNote(note, id, userId) {
      // сначала проверим, что заметка принадлежит пользователю
      const existingNote = await this.getOneNote(id, userId);
      if (!existingNote) {
         throw ApiError.badRequest('Запись не найдена или нет доступа');
      }

      const [updatedRowsCount, updatedRows] = await NoteRepository.update(note, id, userId);
      if (updatedRowsCount === 0) {
         throw ApiError.badRequest('Запись не найдена для обновления');
      }
      return updatedRows[0]; // возвращаем обновлённый объект
   }

   async deleteOneNote(id, userId) {
      const note = await this.getOneNote(id, userId);
      if (!note) {
         throw ApiError.badRequest('Запись не найдена или нет доступа');
      }
      const deletedCount = await NoteRepository.destroyById(id, userId);
      if (deletedCount === 0) {
         throw ApiError.badRequest('Не удалось удалить запись');
      }
      console.log('Record deleted successfully');
      return true;  // Возвращаем true, если удалено успешно
   }
}

module.exports = new NoteService();
