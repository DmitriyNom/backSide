// const ExerciseService = require('../../service/exerciseService'); // Путь к вашему ExerciseService
// const { Exercise } = require('../../models/models');

// jest.mock('../../models/models'); // Мокируем модель Exercise

// describe('ExerciseService', () => {
//    describe('createExercise', () => {
//       it('should create a new exercise', async () => {
//          const mockExerciseData = { name: 'Push Up' };
//          const mockCreatedExercise = { id: 1, ...mockExerciseData };
//          Exercise.create.mockResolvedValue(mockCreatedExercise); // Мокаем метод create

//          const result = await ExerciseService.createExercise(mockExerciseData);

//          expect(result).toEqual(mockCreatedExercise); // Проверяем, что результат совпадает с мок-данными
//          expect(Exercise.create).toHaveBeenCalledWith(mockExerciseData); // Проверяем, что метод create был вызван с правильными данными
//       });
//    });

//    describe('getAllExercises', () => {
//       it('should return all exercises with pagination', async () => {
//          const mockExercises = [{ id: 1, name: 'Push Up' }, { id: 2, name: 'Squat' }];
//          const mockCount = 2;
//          Exercise.findAndCountAll.mockResolvedValue({ rows: mockExercises, count: mockCount }); // Мокаем метод findAndCountAll

//          const result = await ExerciseService.getAllExercises(10, 0);

//          expect(result).toEqual({ rows: mockExercises, count: mockCount }); // Проверяем, что результат совпадает с мок-данными
//          expect(Exercise.findAndCountAll).toHaveBeenCalledWith({ limit: 10, offset: 0 }); // Проверяем параметры вызова
//       });
//    });

//    describe('getOneExercise', () => {
//       it('should return one exercise by id', async () => {
//          const mockExercise = { id: 1, name: 'Push Up' };
//          Exercise.findOne.mockResolvedValue(mockExercise); // Мокаем метод findOne

//          const result = await ExerciseService.getOneExercise(1);

//          expect(result).toEqual(mockExercise); // Проверяем, что результат совпадает с мок-данными
//          expect(Exercise.findOne).toHaveBeenCalledWith({ where: { id: 1 } }); // Проверяем параметры вызова
//       });

//       it('should return null if exercise not found', async () => {
//          Exercise.findOne.mockResolvedValue(null); // Мокаем метод findOne, чтобы вернуть null

//          const result = await ExerciseService.getOneExercise(1);

//          expect(result).toBeNull(); // Проверяем, что результат null
//       });
//    });

//    describe('updateOneExercise', () => {
//       it('should update an exercise by id', async () => {
//          const mockExerciseData = { name: 'Push Up Updated' };
//          const mockUpdatedExercise = { id: 1, ...mockExerciseData };
//          Exercise.update.mockResolvedValue([1, [mockUpdatedExercise]]); // Мокаем метод update

//          const result = await ExerciseService.updateOneExercise(mockExerciseData, 1);

//          expect(result).toEqual(mockUpdatedExercise); // Проверяем, что результат совпадает с мок-данными
//          expect(Exercise.update).toHaveBeenCalledWith(mockExerciseData, { where: { id: 1 }, returning: true }); // Проверяем параметры вызова
//       });
//    });

//    describe('deleteOneExercise', () => {
//       it('should delete an exercise by id', async () => {
//          const mockExercise = { id: 1, name: 'Push Up', destroy: jest.fn() }; // Создаем мок для упражнения
//          Exercise.findOne.mockResolvedValue(mockExercise); // Мокаем метод findOne, чтобы вернуть мок упражнения

//          await ExerciseService.deleteOneExercise(1); // Вызываем метод удаления

//          expect(Exercise.findOne).toHaveBeenCalledWith({ where: { id: 1 } }); // Проверяем параметры вызова
//          expect(mockExercise.destroy).toHaveBeenCalled(); // Проверяем, что метод destroy был вызван
//       });

//       it('should throw an error if exercise not found', async () => {
//          Exercise.findOne.mockResolvedValue(null); // Мокаем метод findOne, чтобы вернуть null

//          await expect(ExerciseService.deleteOneExercise(1)).rejects.toThrow('Record not found'); // Проверяем, что выбрасывается ошибка
//       });
//    });
// })
const ApiError = require('../../error/ApiError');
const ExerciseService = require('../../service/exerciseService');
const ExerciseRepository = require('../../repository/exerciseRepository');

jest.mock('../../repository/exerciseRepository');

describe('ExerciseService', () => {
   const exercise = { name: 'Упражнение 1' };

   afterEach(() => {
      jest.clearAllMocks();
   });

   it('должен создать упражнение', async () => {
      ExerciseRepository.createExercise.mockResolvedValue(exercise);

      const result = await ExerciseService.createExercise(exercise);
      expect(result).toEqual(exercise);
      expect(ExerciseRepository.createExercise).toHaveBeenCalledWith(exercise);
   });

   it('должен вернуть все упражнения', async () => {
      const exercises = [{ name: 'Упражнение 1' }, { name: 'Упражнение 2' }];
      ExerciseRepository.getAllExercises.mockResolvedValue({ count: 2, rows: exercises });

      const result = await ExerciseService.getAllExercises(10, 0);
      expect(result).toEqual({ count: 2, rows: exercises });
      expect(ExerciseRepository.getAllExercises).toHaveBeenCalledWith(10, 0);
   });

   it('должен вернуть одно упражнение', async () => {
      ExerciseRepository.getOneExercise.mockResolvedValue(exercise);

      const result = await ExerciseService.getOneExercise(1);
      expect(result).toEqual(exercise);
      expect(ExerciseRepository.getOneExercise).toHaveBeenCalledWith(1);
   });

   it('должен обновить упражнение', async () => {
      const updatedExercise = { name: 'Упражнение 1 обновлено' };
      ExerciseRepository.updateOneExercise.mockResolvedValue([1, [updatedExercise]]);

      const result = await ExerciseService.updateOneExercise(updatedExercise, 1);
      expect(result).toEqual(updatedExercise);
      expect(ExerciseRepository.updateOneExercise).toHaveBeenCalledWith(updatedExercise, 1);
   });
   it('должен выбросить ошибку, если упражнение не обновлено', async () => {
      ExerciseRepository.updateOneExercise.mockResolvedValue([0, []]);

      await expect(ExerciseService.updateOneExercise({}, 1)).rejects.toThrow(ApiError);
      await expect(ExerciseService.updateOneExercise({}, 1)).rejects.toThrow(expect.objectContaining({
         message: 'Упражнение не найдено',
         status: 400,
      }));
   });

   it('должен удалить упражнение', async () => {
      ExerciseRepository.getOneExercise.mockResolvedValue(exercise);
      ExerciseRepository.deleteOneExercise.mockResolvedValue(1);

      const result = await ExerciseService.deleteOneExercise(1);
      expect(result).toBe("Record deleted successfully");
      expect(ExerciseRepository.getOneExercise).toHaveBeenCalledWith(1);
      expect(ExerciseRepository.deleteOneExercise).toHaveBeenCalledWith(1);
   });

   it('должен выбросить ошибку, если упражнение не найдено для удаления', async () => {
      ExerciseRepository.getOneExercise.mockResolvedValue(null);

      await expect(ExerciseService.deleteOneExercise(1)).rejects.toThrow(ApiError);
      await expect(ExerciseService.deleteOneExercise(1)).rejects.toThrow(expect.objectContaining({
         message: 'Упражнение не найдено',
         status: 400,
      }));
   });
});
