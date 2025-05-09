const ExerciseMarkService = require('../../service/exerciseMarkService');
const { ExerciseMark } = require('../../models/models');

// Мокаем модель ExerciseMark
jest.mock('../../models/models', () => ({
   ExerciseMark: {
      findAndCountAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
   }
}));

describe('ExerciseMarkService', () => {
   afterEach(() => {
      jest.clearAllMocks();
   });

   test('getAllMarks should return all marks', async () => {
      const mockMarks = { count: 2, rows: [{ id: 1 }, { id: 2 }] };
      ExerciseMark.findAndCountAll.mockResolvedValue(mockMarks);

      const result = await ExerciseMarkService.getAllMarks(10, 0);
      expect(result).toEqual(mockMarks);
      expect(ExerciseMark.findAndCountAll).toHaveBeenCalledWith({ limit: 10, offset: 0 });
   });

   test('getOneMark should return a specific mark', async () => {
      const mockMark = { id: 1 };
      ExerciseMark.findOne.mockResolvedValue(mockMark);

      const result = await ExerciseMarkService.getOneMark(1);
      expect(result).toEqual(mockMark);
      expect(ExerciseMark.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
   });

   test('createOneMark should create a new mark', async () => {
      const newMark = { value: 5 };
      const createdMark = { id: 1, ...newMark };
      ExerciseMark.create.mockResolvedValue(createdMark);

      const result = await ExerciseMarkService.createOneMark(newMark);
      expect(result).toEqual(createdMark);
      expect(ExerciseMark.create).toHaveBeenCalledWith(newMark);
   });

   test('updateOneMark should update an existing mark', async () => {
      const updatedMark = { value: 10 };
      const updatedRecord = { dataValues: { id: 1, ...updatedMark } };
      ExerciseMark.update.mockResolvedValue([1, [updatedRecord]]);

      const result = await ExerciseMarkService.updateOneMark(updatedMark, 1);
      expect(result).toEqual(updatedRecord.dataValues);
      expect(ExerciseMark.update).toHaveBeenCalledWith(updatedMark, { where: { id: 1 }, returning: true });
   });

   test('deleteOneMark should delete a mark', async () => {
      const mockMark = { id: 1, destroy: jest.fn() };
      ExerciseMark.findOne.mockResolvedValue(mockMark);

      await ExerciseMarkService.deleteOneMark(1);
      expect(mockMark.destroy).toHaveBeenCalled();
      expect(ExerciseMark.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
   });

   test('deleteOneMark should throw an error if mark not found', async () => {
      ExerciseMark.findOne.mockResolvedValue(null);

      await expect(ExerciseMarkService.deleteOneMark(1)).rejects.toThrow('Record not found');
   });
});
