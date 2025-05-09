const request = require('supertest');
const express = require('express');
const userExerciseRouter = require('../../routes/userExerciseRouter'); // Импортируем ваш userExerciseRouter

// Мокируем зависимости
jest.mock('../../controllers/userExerciseController', () => ({
   getAllExercisesForUser: jest.fn((req, res) => res.status(200).json([{ id: 1, exercise: 'Exercise 1' }])),
   addOneExerciseForUser: jest.fn((req, res) => res.status(201).json({ message: 'Exercise added', exercise: req.body })),
}));

const app = express();
app.use(express.json()); // Чтобы обрабатывать JSON в теле запроса
app.use('/exercises', userExerciseRouter); // Используем userExerciseRouter

describe('User  Exercise Router', () => {
   afterEach(() => {
      jest.clearAllMocks(); // Очищаем моки после каждого теста
   });

   it('should get all exercises for user', async () => {
      const response = await request(app).get('/exercises');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, exercise: 'Exercise 1' }]);
   });

   it('should add a new exercise for user', async () => {
      const newExercise = { exercise: 'New Exercise' };
      const response = await request(app).post('/exercises').send(newExercise);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'Exercise added', exercise: newExercise });
   });
});
