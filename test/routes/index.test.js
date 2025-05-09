const request = require('supertest');
const express = require('express');
const router = require('../../routes'); // Импортируем ваш маршрутизатор

// Функция для создания мокированного маршрутизатора
const createMockRouter = (message) => {
   const mockRouter = express.Router();
   mockRouter.get('/', (req, res) => res.status(200).json({ message }));
   return mockRouter;
};

// Мокируем подмаршруты
jest.mock('../../routes/userRouter', () => createMockRouter('User  route'));
jest.mock('../../routes/exerciseRouter', () => createMockRouter('Exercise route'));
jest.mock('../../routes/noteRouter', () => createMockRouter('Note route'));
jest.mock('../../routes/userNoteRouter', () => createMockRouter('User  Note route'));
jest.mock('../../routes/userExerciseRouter', () => createMockRouter('User  Exercise route'));
jest.mock('../../routes/noteMarkRouter', () => createMockRouter('Note Mark route'));
jest.mock('../../routes/exerciseMarkRouter', () => createMockRouter('Exercise Mark route'));

const app = express();
app.use(router); // Используем маршрутизатор в приложении

describe('Router', () => {
   it('should use the user router', async () => {
      const response = await request(app).get('/user');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User  route');
   });

   it('should use the exercise router', async () => {
      const response = await request(app).get('/exercise');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Exercise route');
   });

   it('should use the note router', async () => {
      const response = await request(app).get('/note');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Note route');
   });

   it('should use the userNote router', async () => {
      const response = await request(app).get('/userNote');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User  Note route');
   });

   it('should use the userExercise router', async () => {
      const response = await request(app).get('/userExercise');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User  Exercise route');
   });

   it('should use the noteMark router', async () => {
      const response = await request(app).get('/noteMark');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Note Mark route');
   });

   it('should use the exerciseMark router', async () => {
      const response = await request(app).get('/exerciseMark');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Exercise Mark route');
   });
});
