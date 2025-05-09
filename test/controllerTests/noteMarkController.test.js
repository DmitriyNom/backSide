const NoteMarkController = require('../../controllers/noteMarkController');
const NoteMarkService = require('../../service/noteMarkService');
const countOffset = require('../../utils/countOffset');

jest.mock('../../service/noteMarkService'); // Мокируем NoteMarkService

describe('NoteMarkController', () => {
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

   it('should create one mark for note', async () => {
      const req = mockReq({ nt_mark_title: 'New Note Mark', nt_mark_description: 'Description of new note mark', nt_mark_priority: 'High' });
      const res = mockRes();

      NoteMarkService.createMark.mockResolvedValue({ id: 1, nt_mark_title: 'New Note Mark' });

      await NoteMarkController.createOneMarkForNote(req, res);

      expect(NoteMarkService.createMark).toHaveBeenCalledWith({
         nt_mark_title: 'New Note Mark',
         nt_mark_description: 'Description of new note mark',
         nt_mark_priority: 'High',
      });
      expect(res.json).toHaveBeenCalledWith({ id: 1, nt_mark_title: 'New Note Mark' });
   });

   it('should get all marks for note', async () => {
      const req = mockReq({}, {}, { limit: 10, page: 1 });
      const res = mockRes();

      NoteMarkService.getAllMarksForNote.mockResolvedValue([{ id: 1, nt_mark_title: 'Test Note Mark' }]);

      await NoteMarkController.getAllMarksForNote(req, res);

      expect(NoteMarkService.getAllMarksForNote).toHaveBeenCalledWith(10, 0); // Проверяем, что offset = 0
      expect(res.json).toHaveBeenCalledWith([{ id: 1, nt_mark_title: 'Test Note Mark' }]);
   });

   it('should get one mark for note', async () => {
      const req = mockReq({}, { id: 1 });
      const res = mockRes();

      NoteMarkService.getOneMark.mockResolvedValue({ id: 1, nt_mark_title: 'Test Note Mark' });

      await NoteMarkController.getOneMarkForNote(req, res);

      expect(NoteMarkService.getOneMark).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ id: 1, nt_mark_title: 'Test Note Mark' });
   });

   it('should update one mark for note', async () => {
      const req = mockReq({ nt_mark_title: 'Updated Note Mark' }, { id: 1 });
      const res = mockRes();

      NoteMarkService.updateMark.mockResolvedValue({ id: 1, nt_mark_title: 'Updated Note Mark' });

      await NoteMarkController.updateOneMarkForNote(req, res);

      expect(NoteMarkService.updateMark).toHaveBeenCalledWith(
         { nt_mark_title: 'Updated Note Mark' },
         1
      );
      expect(res.json).toHaveBeenCalledWith({ id: 1, nt_mark_title: 'Updated Note Mark' });
   });

   it('should delete one mark for note', async () => {
      const req = mockReq({}, { id: 1 });
      const res = mockRes();

      await NoteMarkController.deleteOneMarkForNote(req, res);

      expect(NoteMarkService.deleteOneMark).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith("The mark has been deleted");
   });
});
