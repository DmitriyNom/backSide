// noteMarkRouter.test.js
const request = require('supertest');
const express = require('express');
const noteMarkRouter = require('../../routes/noteMarkRouter'); // Укажите правильный путь к вашему роутеру

const app = express();
app.use(express.json()); // Для парсинга JSON-тел запросов
app.use('/marks', noteMarkRouter); // Подключаем роутер

// Мокаем контроллеры
jest.mock('../../controllers/noteMarkController', () => ({
   getAllMarksForNote: jest.fn((req, res) => {
      res.status(200).json([{ id: 1, content: 'Sample mark for note' }]);
   }),
   getOneMarkForNote: jest.fn((req, res) => {
      const { id } = req.params;
      res.status(200).json({ id, content: 'Sample mark for note' });
   }),
   createOneMarkForNote: jest.fn((req, res) => {
      const mark = req.body;
      res.status(201).json({ message: 'Mark created', mark });
   }),
   updateOneMarkForNote: jest.fn((req, res) => {
      const { id } = req.params;
      res.status(200).json({ id, message: 'Mark updated' });
   }),
   deleteOneMarkForNote: jest.fn((req, res) => {
      const { id } = req.params;
      res.status(204).send(); // No Content
   }),
}));

describe('Note Mark Router', () => {
   it('should return all marks for a note', async () => {
      const response = await request(app).get('/marks');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, content: 'Sample mark for note' }]);
   });

   it('should return a single mark by ID', async () => {
      const response = await request(app).get('/marks/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '1', content: 'Sample mark for note' });
   });

   it('should create a new mark for a note', async () => {
      const newMark = { content: 'This is a new mark' };
      const response = await request(app)
         .post('/marks')
         .send(newMark);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
         message: 'Mark created',
         mark: newMark,
      });
   });

   it('should update a mark by ID', async () => {
      const updatedMark = { content: 'Updated content' };
      const response = await request(app)
         .put('/marks/1')
         .send(updatedMark);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
         id: '1',
         message: 'Mark updated',
      });
   });

   it('should delete a mark by ID', async () => {
      const response = await request(app)
         .delete('/marks/1');

      expect(response.status).toBe(204); // No Content
   });
});