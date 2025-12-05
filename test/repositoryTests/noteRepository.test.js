// __tests__/NoteRepository.test.js
const NoteRepository = require('../../repository/noteRepository');
const { Note } = require('../../models/models');

jest.mock('../../models/models', () => ({
   Note: {
      create: jest.fn(),
      findAndCountAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
   },
}));

describe('NoteRepository', () => {
   afterEach(() => {
      jest.clearAllMocks();
   });

   describe('create', () => {
      it('должен создавать новую заметку', async () => {
         const noteData = { title: 'Test note' };
         const createdNote = { id: 1, ...noteData };
         Note.create.mockResolvedValue(createdNote);

         const result = await NoteRepository.create(noteData);

         expect(Note.create).toHaveBeenCalledWith(noteData);
         expect(result).toEqual(createdNote);
      });
   });

   describe('findAll', () => {
      it('должен возвращать список заметок с подсчетом', async () => {
         const mockResult = { count: 10, rows: [{ id: 1 }, { id: 2 }] };
         Note.findAndCountAll.mockResolvedValue(mockResult);

         const limit = 5;
         const offset = 0;
         const result = await NoteRepository.findAll(limit, offset);

         expect(Note.findAndCountAll).toHaveBeenCalledWith({ limit, offset });
         expect(result).toEqual(mockResult);
      });
   });

   describe('findOne', () => {
      it('должен находить заметку по id', async () => {
         const mockNote = { id: 1, title: 'Note 1' };
         Note.findOne.mockResolvedValue(mockNote);

         const result = await NoteRepository.findOne(1);

         expect(Note.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
         expect(result).toEqual(mockNote);
      });
   });

   describe('update', () => {
      it('должен обновлять заметку и возвращать результат', async () => {
         const noteData = { title: 'Updated title' };
         const id = 1;
         const mockUpdatedRows = [{ id, ...noteData }];
         Note.update.mockResolvedValue([1, mockUpdatedRows]);

         const result = await NoteRepository.update(noteData, id);

         expect(Note.update).toHaveBeenCalledWith(noteData, {
            where: { id },
            returning: true,
         });
         expect(result).toEqual([1, mockUpdatedRows]);
      });

      it('должен возвращать результат обновления, если заметка не найдена', async () => {
         const noteData = { title: 'Updated title' };
         const id = 99; // Предположим, что заметка с таким ID не существует
         Note.update.mockResolvedValue([0, []]);

         const result = await NoteRepository.update(noteData, id);

         expect(Note.update).toHaveBeenCalledWith(noteData, {
            where: { id },
            returning: true,
         });
         expect(result).toEqual([0, []]); // Ожидаем, что обновление не произошло
      });
   });
   describe('destroyById', () => {
      it('должен удалять заметку по id', async () => {
         Note.destroy.mockResolvedValue(1);

         const result = await NoteRepository.destroyById(1);

         expect(Note.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
         expect(result).toBe(1);
      });
   });
});
