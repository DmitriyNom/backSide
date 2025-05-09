const ExerciseController = require('../../controllers/exerciseController');
const ExerciseService = require('../../service/exerciseService');
const ApiError = require('../../error/ApiError');

jest.mock('../../service/exerciseService'); // Мокируем ExerciseService

describe('ExerciseController', () => {
   const mockRes = () => {
      const res = {};
      res.json = jest.fn().mockReturnValue(res);
      return res;
   };

   const mockReq = (body = {}, params = {}, query = {}) => ({
      body,
      params,
      query,
   });

   afterEach(() => {
      jest.clearAllMocks(); // Очищаем моки после каждого теста
   });

   it('should create an exercise', async () => {
      const req = mockReq({ exercise_name: 'Push Up', exercise_description: 'A basic exercise' });
      const res = mockRes();

      ExerciseService.createExercise.mockResolvedValue({ id: 1, exercise_name: 'Push Up' });

      await ExerciseController.createExercise(req, res);

      expect(ExerciseService.createExercise).toHaveBeenCalledWith({
         exercise_name: 'Push Up',
         exercise_description: 'A basic exercise',
         exercise_mark: undefined,
      });
      expect(res.json).toHaveBeenCalledWith({ id: 1, exercise_name: 'Push Up' });
   });

   it('should get all exercises', async () => {
      const req = mockReq({}, {}, { limit: 10, page: 1 });
      const res = mockRes();

      ExerciseService.getAllExercises.mockResolvedValue([{ id: 1, exercise_name: 'Push Up' }]);

      await ExerciseController.getAllExercises(req, res);

      expect(ExerciseService.getAllExercises).toHaveBeenCalledWith(10, 0); // Проверяем, что offset = 0
      expect(res.json).toHaveBeenCalledWith([{ id: 1, exercise_name: 'Push Up' }]);
   });

   it('should get one exercise', async () => {
      const req = mockReq({}, { id: 1 });
      const res = mockRes();

      ExerciseService.getOneExercise.mockResolvedValue({ id: 1, exercise_name: 'Push Up' });

      await ExerciseController.getOneExercise(req, res);

      expect(ExerciseService.getOneExercise).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ id: 1, exercise_name: 'Push Up' });
   });

   it('should update an exercise', async () => {
      const req = mockReq({ exercise_name: 'Push Up Updated' }, { id: 1 });
      const res = mockRes();

      ExerciseService.updateOneExercise.mockResolvedValue({ id: 1, exercise_name: 'Push Up Updated' });

      await ExerciseController.updateOneExercise(req, res);

      expect(ExerciseService.updateOneExercise).toHaveBeenCalledWith(
         { exercise_name: 'Push Up Updated' },
         1
      );
      expect(res.json).toHaveBeenCalledWith({ id: 1, exercise_name: 'Push Up Updated' });
   });

   it('should delete an exercise', async () => {
      const req = mockReq({}, { id: 1 });
      const res = mockRes();

      ExerciseService.deleteOneExercise.mockResolvedValue({ message: 'Exercise deleted' });

      await ExerciseController.deleteOneExercise(req, res);

      expect(ExerciseService.deleteOneExercise).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ message: 'Exercise deleted' });
   });
});
