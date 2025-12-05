const request = require('supertest');
const express = require('express');
const userRouter = require('../../routes/userRouter'); // Импортируем ваш userRouter

// Мокируем зависимости
jest.mock('../../controllers/userController', () => ({
   getUsers: jest.fn((req, res) => res.status(200).json([{ id: 1, name: 'User 1' }])),
   check: jest.fn((req, res) => res.status(200).json({ message: 'Authenticated' })),
   login: jest.fn((req, res) => res.status(200).json({ message: 'Login successful' })),
   registration: jest.fn((req, res) => res.status(201).json({ message: 'User  registered' })),
   updateUser: jest.fn((req, res) => res.status(200).json({ message: 'User  updated' })),
   deleteUser: jest.fn((req, res) => res.status(204).send()),
}));

jest.mock('../../middleware/AuthMiddleware', () => {
   return (req, res, next) => {
      next(); // Пропускаем middleware
   };
});


jest.mock('../../middleware/FileMiddleware', () => ({
   single: () => (req, res, next) => {
      next(); // Пропускаем middleware
   },
}));

const app = express();
app.use(express.json()); // Чтобы обрабатывать JSON в теле запроса
app.use('/user', userRouter); // Используем userRouter

describe('User  Router', () => {

   afterEach(() => {
      jest.clearAllMocks(); // Очищаем моки после каждого теста
   });

   it('should get all users', async () => {
      const response = await request(app).get('/user');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, name: 'User 1' }]);
   });

   it('should check authentication', async () => {
      const response = await request(app).get('/user/auth');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Authenticated');
   });

   it('should log in a user', async () => {
      const response = await request(app).post('/user/login').send({ username: 'user1', password: 'pass' });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
   });

   it('should register a new user', async () => {
      const response = await request(app).post('/user/regist').send({ username: 'user1', password: 'pass' });
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User  registered');
   });

   it('should update a user', async () => {
      const response = await request(app).put('/user/1').send({ name: 'Updated User' });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User  updated');
   });

   it('should delete a user', async () => {
      const response = await request(app).delete('/user/1');
      expect(response.status).toBe(204);
   });
});
