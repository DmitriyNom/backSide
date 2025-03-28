const { deleteOneExercise } = require('../controllers/exerciseController');
const ApiError = require('../error/ApiError');
const { Exercise } = require('../models/models');
const exerciseService = require('../service/exerciseService')

jest.mock('../models/models', () => ({
   Exercise: {
      findOne: jest.fn(),
      destroy: jest.fn(),
   },
}));

describe('ExerciseService', () => {
   describe('deleteOneExercise', () => {
      it('should delete an exercise by id', async () => {
         const id = 1;
         const foundExercise = { id: 1, name: 'Test Exercise' };
         Exercise.findOne.mockResolvedValue(foundExercise);

         await exerciseService.deleteOneExercise(id);

         expect(Exercise.findOne).toHaveBeenCalledWith({
            where: { id },
         });

         expect(Exercise.destroy).toHaveBeenCalledWith();
      });

      it('should throw an error if exercise is not found', async () => {
         const id = 1;
         Exercise.findOne.mockResolvedValue(null);

         await expect(exerciseService.deleteOneExercise(id)).rejects.toThrow('Record not found');
      });
   });
});