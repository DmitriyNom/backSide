// exerciseRouter.test.js
const request = require('supertest');
const express = require('express');
const exerciseRouter = require('../../routes/exerciseRouter'); // Укажите правильный путь к вашему роутеру

const app = express();
app.use(express.json()); // Для парсинга JSON-тел запросов
app.use('/exercises', exerciseRouter); // Подключаем роутер

// Мокаем контроллеры
jest.mock('../../controllers/exerciseController', () => ({
   getAllExercises: jest.fn((req, res) => {
      res.status(200).json([{ id: 1, name: 'Push Up' }]);
   }),
   getOneExercise: jest.fn((req, res) => {
      const { id } = req.params;
      res.status(200).json({ id, name: 'Push Up' });
   }),
   createExercise: jest.fn((req, res) => {
      const exercise = req.body;
      res.status(201).json({ message: 'Exercise created', exercise });
   }),
   updateOneExercise: jest.fn((req, res) => {
      const { id } = req.params;
      res.status(200).json({ id, message: 'Exercise updated' });
   }),
   deleteOneExercise: jest.fn((req, res) => {
      const { id } = req.params;
      res.status(204).send(); // No Content
   }),
}));

describe('Exercise Router', () => {
   it('should return all exercises', async () => {
      const response = await request(app).get('/exercises');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, name: 'Push Up' }]);
   });

   it('should return a single exercise by ID', async () => {
      const response = await request(app).get('/exercises/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '1', name: 'Push Up' });
   });

   it('should create a new exercise', async () => {
      const newExercise = { name: 'Squat' };
      const response = await request(app)
         .post('/exercises')
         .send(newExercise);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
         message: 'Exercise created',
         exercise: newExercise,
      });
   });

   it('should update an exercise by ID', async () => {
      const updatedExercise = { name: 'Updated Push Up' };
      const response = await request(app)
         .put('/exercises/1')
         .send(updatedExercise);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
         id: '1',
         message: 'Exercise updated',
      });
   });

   it('should delete an exercise by ID', async () => {
      const response = await request(app)
         .delete('/exercises/1');

      expect(response.status).toBe(204); // No Content
   });
});