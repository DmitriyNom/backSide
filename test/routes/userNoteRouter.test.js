const request = require('supertest');
const express = require('express');
const userNoteRouter = require('../../routes/userNoteRouter'); // Импортируем ваш userNoteRouter

// Мокируем зависимости
jest.mock('../../controllers/userNoteController', () => ({
   getAllNotesForUser: jest.fn((req, res) => res.status(200).json([{ id: 1, note: 'Note 1' }])),
   addOneNoteForUser: jest.fn((req, res) => res.status(201).json({ message: 'Note added', note: req.body })),
}));

const app = express();
app.use(express.json()); // Чтобы обрабатывать JSON в теле запроса
app.use('/notes', userNoteRouter); // Используем userNoteRouter

describe('User  Note Router', () => {
   afterEach(() => {
      jest.clearAllMocks(); // Очищаем моки после каждого теста
   });

   it('should get all notes for user', async () => {
      const response = await request(app).get('/notes');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, note: 'Note 1' }]);
   });

   it('should add a new note for user', async () => {
      const newNote = { note: 'New Note' };
      const response = await request(app).post('/notes').send(newNote);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'Note added', note: newNote });
   });
});
