const NoteService = require('../../service/noteService');
const { Note } = require('../../models/models');

jest.mock('../../models/models'); // Мокаем модель Note

describe('NoteService', () => {
   afterEach(() => {
      jest.clearAllMocks(); // Очищаем моки после каждого теста
   });

   describe('createNote', () => {
      it('should create a new note', async () => {
         const mockNote = { title: 'Test Note' };
         Note.create.mockResolvedValue(mockNote); // Мокаем метод create

         const result = await NoteService.createNote(mockNote);
         expect(Note.create).toHaveBeenCalledWith(mockNote); // Проверяем вызов метода
         expect(result).toEqual(mockNote); // Проверяем результат
      });
   });

   describe('getAllNotes', () => {
      it('should return all notes with pagination', async () => {
         const mockNotes = { count: 2, rows: [{ id: 1, title: 'Note 1' }, { id: 2, title: 'Note 2' }] };
         Note.findAndCountAll.mockResolvedValue(mockNotes); // Мокаем метод findAndCountAll

         const result = await NoteService.getAllNotes(10, 0);
         expect(Note.findAndCountAll).toHaveBeenCalledWith({ limit: 10, offset: 0 }); // Проверяем параметры вызова
         expect(result).toEqual(mockNotes); // Проверяем результат
      });
   });

   describe('getOneNote', () => {
      it('should return a note by id', async () => {
         const mockNote = { id: 1, title: 'Test Note' };
         Note.findOne.mockResolvedValue(mockNote); // Мокаем метод findOne

         const result = await NoteService.getOneNote(1);
         expect(Note.findOne).toHaveBeenCalledWith({ where: { id: 1 } }); // Проверяем параметры вызова
         expect(result).toEqual(mockNote); // Проверяем результат
      });
   });

   describe('updateOneNote', () => {
      it('should update a note by id', async () => {
         const mockNote = { title: 'Updated Note' };
         const mockUpdatedNote = { id: 1, title: 'Updated Note' };
         Note.update.mockResolvedValue([1, [mockUpdatedNote]]); // Мокаем метод update

         const result = await NoteService.updateOneNote(mockNote, 1);
         expect(Note.update).toHaveBeenCalledWith(mockNote, { where: { id: 1 }, returning: true }); // Проверяем параметры вызова
         expect(result).toEqual(mockUpdatedNote.dataValues); // Проверяем результат
      });
   });

   describe('deleteOneNote', () => {
      it('should delete a note by id', async () => {
         const mockNote = { id: 1, title: 'Test Note', destroy: jest.fn() };
         Note.findOne.mockResolvedValue(mockNote); // Мокаем метод findOne
         Note.destroy.mockResolvedValue(1); // Мокаем метод destroy

         const result = await NoteService.deleteOneNote(1);
         expect(Note.findOne).toHaveBeenCalledWith({ where: { id: 1 } }); // Проверяем вызов findOne
         expect(mockNote.destroy).toHaveBeenCalled(); // Проверяем вызов destroy
      });
   });

   it('should throw an error if note not found during delete', async () => {
      Note.findOne.mockResolvedValue(null); // Мокаем метод findOne, чтобы вернуть null

      await expect(NoteService.deleteOneNote(1)).rejects.toThrow(); // Проверяем, что выбрасывается ошибка
   });
});
