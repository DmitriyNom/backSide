const NoteService = require('../../service/noteService');
const NoteRepository = require('../../repository/noteRepository');
const ApiError = require('../../error/ApiError');

jest.mock('../../repository/noteRepository'); // Мокаем репозиторий

describe('NoteService', () => {
   afterEach(() => {
      jest.clearAllMocks(); // Очищаем моки после каждого теста
   });

   describe('createNote', () => {
      it('should create a new note', async () => {
         const mockNote = { title: 'Test Note' };
         NoteRepository.create.mockResolvedValue(mockNote); // Мокаем метод create

         const result = await NoteService.createNote(mockNote);
         expect(NoteRepository.create).toHaveBeenCalledWith(mockNote); // Проверяем вызов метода
         expect(result).toEqual(mockNote); // Проверяем результат
      });
   });

   describe('getAllNotes', () => {
      it('should return all notes with pagination', async () => {
         const mockNotes = { count: 2, rows: [{ id: 1, title: 'Note 1' }, { id: 2, title: 'Note 2' }] };
         NoteRepository.findAll.mockResolvedValue(mockNotes); // Мокаем метод findAll

         const result = await NoteService.getAllNotes(10, 0);
         expect(NoteRepository.findAll).toHaveBeenCalledWith(10, 0); // Проверяем параметры вызова
         expect(result).toEqual(mockNotes); // Проверяем результат
      });
   });

   describe('getOneNote', () => {
      it('should return a note by id', async () => {
         const mockNote = { id: 1, title: 'Test Note' };
         NoteRepository.findOne.mockResolvedValue(mockNote); // Мокаем метод findOne

         const result = await NoteService.getOneNote(1);
         expect(NoteRepository.findOne).toHaveBeenCalledWith(1); // Проверяем параметры вызова
         expect(result).toEqual(mockNote); // Проверяем результат
      });

      it('should return null if note not found', async () => {
         NoteRepository.findOne.mockResolvedValue(null); // Мокаем метод findOne, чтобы вернуть null

         const result = await NoteService.getOneNote(999);
         expect(result).toBeNull(); // Проверяем результат
      });
   });

   describe('updateOneNote', () => {
      it('should update a note by id', async () => {
         const mockNote = { title: 'Updated Note' };
         const mockUpdatedNote = { id: 1, title: 'Updated Note' };
         NoteRepository.update.mockResolvedValue([1, [mockUpdatedNote]]); // Мокаем метод update

         const result = await NoteService.updateOneNote(mockNote, 1);
         expect(NoteRepository.update).toHaveBeenCalledWith(mockNote, 1); // Проверяем параметры вызова
         expect(result).toEqual(mockUpdatedNote); // Проверяем результат
      });

      it('should throw an error if note not found for update', async () => {
         const mockNote = { title: 'Updated Note' };
         NoteRepository.update.mockResolvedValue([0, []]); // Мокаем метод update, чтобы вернуть 0 обновленных строк

         await expect(NoteService.updateOneNote(mockNote, 1)).rejects.toThrow(ApiError.badRequest('Запись не найдена для обновления'));
      });
   });

   describe('deleteOneNote', () => {
      it('should delete a note by id', async () => {
         const mockNote = { id: 1, title: 'Test Note' };
         NoteRepository.findOne.mockResolvedValue(mockNote); // Мокаем метод findOne
         NoteRepository.destroyById.mockResolvedValue(1); // Мокаем метод destroyById

         await NoteService.deleteOneNote(1);
         expect(NoteRepository.findOne).toHaveBeenCalledWith(1); // Проверяем вызов findOne
         expect(NoteRepository.destroyById).toHaveBeenCalledWith(1); // Проверяем вызов destroyById
      });

      it('should throw an error if note not found during delete', async () => {
         NoteRepository.findOne.mockResolvedValue(null); // Мокаем метод findOne, чтобы вернуть null

         await expect(NoteService.deleteOneNote(1)).rejects.toThrow(ApiError.badRequest('Запись не найдена'));
      });
   });
});
