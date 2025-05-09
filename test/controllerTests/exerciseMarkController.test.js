const ExerciseMarkController = require('../../controllers/exerciseMarkController');
const ExerciseMarkService = require('../../service/exerciseMarkService');
const countOffset = require('../../utils/countOffset');

jest.mock('../../service/exerciseMarkService'); // Мокируем ExerciseMarkService

describe('ExerciseMarkController', () => {
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

   it('should get all marks', async () => {
      const req = mockReq({}, {}, { limit: 10, page: 1 });
      const res = mockRes();

      ExerciseMarkService.getAllMarks.mockResolvedValue([{ id: 1, ex_mark_title: 'Test Mark' }]);

      await ExerciseMarkController.getAllMarks(req, res);

      expect(ExerciseMarkService.getAllMarks).toHaveBeenCalledWith(10, 0); // Проверяем, что offset = 0
      expect(res.json).toHaveBeenCalledWith([{ id: 1, ex_mark_title: 'Test Mark' }]);
   });

   it('should get one mark', async () => {
      const req = mockReq({}, { id: 1 });
      const res = mockRes();

      ExerciseMarkService.getOneMark.mockResolvedValue({ id: 1, ex_mark_title: 'Test Mark' });

      await ExerciseMarkController.getOneMark(req, res);

      expect(ExerciseMarkService.getOneMark).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ id: 1, ex_mark_title: 'Test Mark' });
   });

   it('should create one mark', async () => {
      const req = mockReq({ ex_mark_title: 'New Mark', ex_mark_description: 'Description of new mark' });
      const res = mockRes();

      ExerciseMarkService.createOneMark.mockResolvedValue({ id: 1, ex_mark_title: 'New Mark' });

      await ExerciseMarkController.createOneMark(req, res);

      expect(ExerciseMarkService.createOneMark).toHaveBeenCalledWith({
         ex_mark_title: 'New Mark',
         ex_mark_description: 'Description of new mark',
      });
      expect(res.json).toHaveBeenCalledWith({ id: 1, ex_mark_title: 'New Mark' });
   });

   it('should update one mark', async () => {
      const req = mockReq({ ex_mark_title: 'Updated Mark' }, { id: 1 });
      const res = mockRes();

      ExerciseMarkService.updateOneMark.mockResolvedValue({ id: 1, ex_mark_title: 'Updated Mark' });

      await ExerciseMarkController.updateOneMark(req, res);

      expect(ExerciseMarkService.updateOneMark).toHaveBeenCalledWith(
         { ex_mark_title: 'Updated Mark' },
         1
      );
      expect(res.json).toHaveBeenCalledWith({ id: 1, ex_mark_title: 'Updated Mark' });
   });

   it('should delete one mark', async () => {
      const req = mockReq({}, { id: 1 });
      const res = mockRes();

      ExerciseMarkService.deleteOneMark.mockResolvedValue({ message: 'Mark deleted' });

      await ExerciseMarkController.deleteOneMark(req, res);

      expect(ExerciseMarkService.deleteOneMark).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ message: 'Mark deleted' });
   });
});
