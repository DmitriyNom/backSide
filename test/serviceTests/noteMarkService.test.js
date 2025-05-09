const NoteMarkService = require('../../service/noteMarkService');
const { NoteMark } = require('../../models/models');

jest.mock('../../models/models'); // Мокаем модель NoteMark

describe('NoteMarkService', () => {
   afterEach(() => {
      jest.clearAllMocks(); // Очищаем моки после каждого теста
   });

   describe('getAllMarksForNote', () => {
      it('should return all marks with pagination', async () => {
         const mockMarks = { count: 2, rows: [{ id: 1, name: 'Mark 1' }, { id: 2, name: 'Mark 2' }] };
         NoteMark.findAndCountAll.mockResolvedValue(mockMarks); // Мокаем метод findAndCountAll

         const result = await NoteMarkService.getAllMarksForNote(10, 0);
         expect(NoteMark.findAndCountAll).toHaveBeenCalledWith({ limit: 10, offset: 0 }); // Проверяем параметры вызова
         expect(result).toEqual(mockMarks); // Проверяем результат
      });
   });

   describe('getOneMark', () => {
      it('should return a mark by id', async () => {
         const mockMark = { id: 1, name: 'Test Mark' };
         NoteMark.findOne.mockResolvedValue(mockMark); // Мокаем метод findOne

         const result = await NoteMarkService.getOneMark(1);
         expect(NoteMark.findOne).toHaveBeenCalledWith({ where: { id: 1 } }); // Проверяем параметры вызова
         expect(result).toEqual(mockMark); // Проверяем результат
      });
   });

   describe('createMark', () => {
      it('should create a new mark', async () => {
         const mockMark = { name: 'New Mark' };
         NoteMark.create.mockResolvedValue(mockMark); // Мокаем метод create

         const result = await NoteMarkService.createMark(mockMark);
         expect(NoteMark.create).toHaveBeenCalledWith(mockMark); // Проверяем вызов метода
         expect(result).toEqual(mockMark); // Проверяем результат
      });
   });

   describe('updateMark', () => {
      it('should update a mark by id', async () => {
         const mockMark = { name: 'Updated Mark' };
         const mockUpdatedMark = { id: 1, name: 'Updated Mark' };
         NoteMark.update.mockResolvedValue([1, [mockUpdatedMark]]); // Мокаем метод update

         const result = await NoteMarkService.updateMark(mockMark, 1);
         expect(NoteMark.update).toHaveBeenCalledWith(mockMark, { where: { id: 1 }, returning: true }); // Проверяем параметры вызова
         expect(result).toEqual(mockUpdatedMark); // Проверяем результат
      });
   });

   describe('deleteOneMark', () => {
      it('should delete a mark by id', async () => {
         const mockMark = { id: 1, name: 'Test Mark', destroy: jest.fn() };
         NoteMark.findOne.mockResolvedValue(mockMark); // Мокаем метод findOne

         await NoteMarkService.deleteOneMark(1);
         expect(NoteMark.findOne).toHaveBeenCalledWith({ where: { id: 1 } }); // Проверяем вызов findOne
         expect(mockMark.destroy).toHaveBeenCalled(); // Проверяем, что destroy был вызван
      });

      it('should throw an error if mark not found', async () => {
         NoteMark.findOne.mockResolvedValue(null); // Мокаем метод findOne, чтобы вернуть null

         await expect(NoteMarkService.deleteOneMark(1)).rejects.toThrow('Record not found'); // Проверяем, что выбрасывается ошибка
      });
   });
});
