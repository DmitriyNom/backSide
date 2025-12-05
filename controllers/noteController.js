const ApiError = require('../error/ApiError');
const NoteService = require('../service/noteService');
const countOffset = require('../utils/countOffset');

class NoteController {
   async createNote(req, res, next) {
      console.log('req.body в createNote:', req.body);  // Лог: что приходит от фронта
      console.log('req.user.id:', req.user?.id);  // Лог: user_id
      try {
         const user_id = req.user.id;
         // 👇 ДОБАВЛЯЕМ НОВЫЕ ПОЛЯ
         const {
            note_name,
            note_description,
            note_priority,
            note_mark,
            note_expiration_date,  // 👈 Добавляем
            note_is_completed      // 👈 Добавляем
         } = req.body;

         console.log('Извлеченные данные:', {
            note_name,
            note_description,
            note_priority,
            note_mark,
            note_expiration_date,  // 👈 Проверяем что пришло
            note_is_completed      // 👈 Проверяем что пришло
         });

         // 👇 ПЕРЕДАЕМ ВСЕ ПОЛЯ В СЕРВИС
         const note = await NoteService.createNote({
            note_name,
            note_description,
            note_priority,
            note_mark,
            note_expiration_date,  // 👈 Передаем
            note_is_completed,     // 👈 Передаем
            user_id
         });

         console.log('Созданная заметка:', note);  // Лог: результат
         return res.json(note);
      } catch (e) {
         console.error('Ошибка в createNote:', e);  // Лог: ошибка
         next(ApiError.internal(e.message));
      }
   }




   async getAllNotes(req, res, next) {
      try {
         const userId = req.user.id;
         let { limit, page } = req.query;
         page = parseInt(page) || 1;
         limit = parseInt(limit) || 10;  // Изменено с 100 на 10, чтобы соответствовать клиенту (меньше нагрузки)
         const offset = countOffset(page, limit);

         const { count: totalCount, rows: notes } = await NoteService.getAllNotes(userId, limit, offset);
         const totalPages = Math.ceil(totalCount / limit);

         return res.json({
            notes,  // Массив заметок
            totalPages,
            currentPage: page,
            totalCount,
         });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async getOneNote(req, res, next) {
      try {
         const userId = req.user.id;
         const { id } = req.params;

         const note = await NoteService.getOneNote(id, userId);
         if (!note) {
            return res.status(404).json({ message: 'Заметка не найдена' });
         }
         return res.json(note);
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }

   async updateOneNote(req, res, next) {
      console.log('req.body в updateOneNote:', req.body);  // Что приходит
      console.log('req.params.id:', req.params.id);  // ID заметки
      console.log('req.user.id:', req.user.id);  // user_id
      try {
         const userId = req.user.id;
         const { id } = req.params;
         const noteData = req.body;

         console.log('Данные для обновления:', noteData);

         const updatedNote = await NoteService.updateOneNote(noteData, id, userId);
         console.log('Обновлённая заметка:', updatedNote);  // Результат обновления
         if (!updatedNote) {
            return res.status(404).json({ message: 'Заметка не найдена или нет доступа' });
         }
         return res.json(updatedNote);
      } catch (e) {
         console.error('Ошибка в updateOneNote:', e);  // Детали ошибки
         next(ApiError.internal(e.message));
      }
   }


   async deleteOneNote(req, res, next) {
      try {
         const userId = req.user.id;
         const { id } = req.params;

         const deleted = await NoteService.deleteOneNote(id, userId);
         if (!deleted) {
            return res.status(404).json({ message: 'Заметка не найдена или нет доступа' });
         }
         return res.json({ message: 'Заметка удалена' });
      } catch (e) {
         next(ApiError.internal(e.message));
      }
   }
}

module.exports = new NoteController();
