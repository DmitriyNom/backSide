const NoteController = require('../../controllers/noteController');
const NoteService = require('../../service/noteService');
const ApiError = require('../../error/ApiError');

jest.mock('../../service/noteService'); // Мокируем NoteService

describe('NoteController', () => {
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

   it('should create a note', async () => {
      const req = mockReq({ note_name: 'Test Note', note_description: 'This is a test note' });
      const res = mockRes();

      NoteService.createNote.mockResolvedValue({ id: 1, note_name: 'Test Note' });

      await NoteController.createNote(req, res);

      expect(NoteService.createNote).toHaveBeenCalledWith({
         note_name: 'Test Note',
         note_description: 'This is a test note',
         note_priority: undefined,
         note_mark: undefined,
      });
      expect(res.json).toHaveBeenCalledWith({ id: 1, note_name: 'Test Note' });
   });

   it('should get all notes', async () => {
      const req = mockReq({}, {}, { limit: 10, page: 1 });
      const res = mockRes();

      NoteService.getAllNotes.mockResolvedValue([{ id: 1, note_name: 'Test Note' }]);

      await NoteController.getAllNotes(req, res);

      expect(NoteService.getAllNotes).toHaveBeenCalledWith(10, 0); // Проверяем, что offset = 0
      expect(res.json).toHaveBeenCalledWith([{ id: 1, note_name: 'Test Note' }]);
   });

   it('should get one note', async () => {
      const req = mockReq({}, { id: 1 });
      const res = mockRes();

      NoteService.getOneNote.mockResolvedValue({ id: 1, note_name: 'Test Note' });

      await NoteController.getOneNote(req, res);

      expect(NoteService.getOneNote).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ id: 1, note_name: 'Test Note' });
   });

   it('should update a note', async () => {
      const req = mockReq({ note_name: 'Updated Note' }, { id: 1 });
      const res = mockRes();

      NoteService.updateOneNote.mockResolvedValue({ id: 1, note_name: 'Updated Note' });

      await NoteController.updateOneNote(req, res);

      expect(NoteService.updateOneNote).toHaveBeenCalledWith(
         { note_name: 'Updated Note' },
         1
      );
      expect(res.json).toHaveBeenCalledWith({ id: 1, note_name: 'Updated Note' });
   });

   it('should delete a note', async () => {
      const req = mockReq({}, { id: 1 });
      const res = mockRes();

      NoteService.deleteOneNote.mockResolvedValue({ message: 'Note deleted' });

      await NoteController.deleteOneNote(req, res);

      expect(NoteService.deleteOneNote).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ message: 'Note deleted' });
   });
});
