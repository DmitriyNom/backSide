const ExerciseRepository = require('../../repository/exerciseRepository');
const { Exercise } = require('../../models/models');

jest.mock('../../models/models');

describe('ExerciseRepository', () => {
   const exercise = { name: 'Упражнение 1' };

   afterEach(() => {
      jest.clearAllMocks();
   });

   it('должен создать упражнение', async () => {
      Exercise.create.mockResolvedValue(exercise);

      const result = await ExerciseRepository.createExercise(exercise);
      expect(result).toEqual(exercise);
      expect(Exercise.create).toHaveBeenCalledWith(exercise);
   });

   it('должен вернуть все упражнения', async () => {
      const exercises = [{ name: 'Упражнение 1' }, { name: 'Упражнение 2' }];
      Exercise.findAndCountAll.mockResolvedValue({ count: 2, rows: exercises });

      const result = await ExerciseRepository.getAllExercises(10, 0);
      expect(result).toEqual({ count: 2, rows: exercises });
      expect(Exercise.findAndCountAll).toHaveBeenCalledWith({ limit: 10, offset: 0 });
   });

   it('должен вернуть одно упражнение', async () => {
      Exercise.findOne.mockResolvedValue(exercise);

      const result = await ExerciseRepository.getOneExercise(1);
      expect(result).toEqual(exercise);
      expect(Exercise.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
   });

   it('должен обновить упражнение', async () => {
      const updatedExercise = { name: 'Упражнение 1 обновлено' };
      Exercise.update.mockResolvedValue([1, [updatedExercise]]);

      const result = await ExerciseRepository.updateOneExercise(updatedExercise, 1);
      expect(result).toEqual([1, [updatedExercise]]);
      expect(Exercise.update).toHaveBeenCalledWith(updatedExercise, { where: { id: 1 }, returning: true });
   });

   it('должен удалить упражнение', async () => {
      Exercise.destroy.mockResolvedValue(1);

      const result = await ExerciseRepository.deleteOneExercise(1);
      expect(result).toBe(1);
      expect(Exercise.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
   });
});
