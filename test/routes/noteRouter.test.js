// noteRouter.test.js
const request = require('supertest');
const express = require('express');
const noteRouter = require('../../routes/noteRouter'); // Укажите правильный путь к вашему роутеру

const app = express();
app.use(express.json()); // Для парсинга JSON-тел запросов
app.use('/notes', noteRouter); // Подключаем роутер

// Мокаем контроллеры
jest.mock('../../controllers/noteController', () => ({
   createNote: jest.fn((req, res) => {
      res.status(201).json({ message: 'Note created', note: req.body });
   }),
   getAllNotes: jest.fn((req, res) => {
      res.status(200).json([{ id: 1, content: 'Sample note' }]);
   }),
   getOneNote: jest.fn((req, res) => {
      const { id } = req.params;
      res.status(200).json({ id, content: 'Sample note' });
   }),
   updateOneNote: jest.fn((req, res) => {
      const { id } = req.params;
      res.status(200).json({ id, message: 'Note updated' });
   }),
   deleteOneNote: jest.fn((req, res) => {
      const { id } = req.params;
      res.status(204).send(); // No Content
   }),
}));

describe('Note Router', () => {
   it('should create a new note', async () => {
      const newNote = { content: 'This is a new note' };
      const response = await request(app)
         .post('/notes')
         .send(newNote);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
         message: 'Note created',
         note: newNote,
      });
   });

   it('should return all notes', async () => {
      const response = await request(app).get('/notes');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, content: 'Sample note' }]);
   });

   it('should return a single note by ID', async () => {
      const response = await request(app).get('/notes/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '1', content: 'Sample note' });
   });

   it('should update a note by ID', async () => {
      const updatedNote = { content: 'Updated content' };
      const response = await request(app)
         .put('/notes/1')
         .send(updatedNote);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
         id: '1',
         message: 'Note updated',
      });
   });

   it('should delete a note by ID', async () => {
      const response = await request(app)
         .delete('/notes/1');

      expect(response.status).toBe(204); // No Content
   });
});