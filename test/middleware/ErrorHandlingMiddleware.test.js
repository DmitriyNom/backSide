// // ErrorHandlingMiddleware.test.js
// const express = require('express');
// const request = require('supertest');
// const ApiError = require('../../error/ApiError'); // Убедитесь, что путь к ApiError правильный
// const errorHandler = require('../../middleware/ErrorHandlingMiddleware'); // Убедитесь, что путь к вашему middleware правильный

// const app = express();

// // Применяем парсер JSON и middleware обработки ошибок
// app.use(express.json());

// // Пример маршрута для тестирования
// app.get('/test', (req, res) => {
//    throw ApiError.badRequest('Тестовая ошибка'); // Генерируем ошибку для теста
// });

// // Подключаем middleware обработки ошибок в конце
// app.use(errorHandler);

// // Тесты
// describe('Error Handling Middleware', () => {
//    it('should return ApiError with correct status and message', async () => {
//       const response = await request(app).get('/test');

//       expect(response.status).toBe(400);
//       expect(response.body).toEqual({ message: 'Тестовая ошибка' });
//    });

//    it('should return 500 for unexpected errors', async () => {
//       app.get('/error', (req, res) => {
//          throw new Error('Непредвиденная ошибка'); // Генерируем непредвиденную ошибку
//       });

//       const response = await request(app).get('/error');

//       expect(response.status).toBe(500);
//       expect(response.body).toEqual({ message: 'Непредвиденная ошибка' });
//    });
// });

const express = require('express');
const request = require('supertest');
const ApiError = require('../../error/ApiError'); // Убедитесь, что путь к ApiError правильный
const errorHandler = require('../../middleware/ErrorHandlingMiddleware'); // Убедитесь, что путь к вашему middleware правильный

// Создаем простое Express-приложение для тестирования
const app = express();

// Применяем парсер JSON
app.use(express.json());

// Пример маршрута для генерации ApiError
app.get('/api-error', (req, res) => {
   throw ApiError.badRequest('Тестовая ошибка API');
});

// Пример маршрута для генерации непредвиденной ошибки
app.get('/unexpected-error', (req, res) => {
   throw new Error('Непредвиденная ошибка');
});

// Подключаем middleware обработки ошибок в конце
app.use(errorHandler);

// Тесты
describe('Error Handling Middleware', () => {
   it('should return ApiError with correct status and message', async () => {
      const response = await request(app).get('/api-error');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
         status: 'error',
         statusCode: 400,
         message: 'Тестовая ошибка API',
      });
   });

   it('should return 500 for unexpected errors', async () => {
      const response = await request(app).get('/unexpected-error');

      expect(response.status).toBe(500);
      expect(response.body).toEqual(expect.objectContaining({
         status: 'error',
         statusCode: 500,
         message: "Непредвиденная ошибка",
      }));
   });


   it('should not expose stack trace in production', async () => {
      process.env.NODE_ENV = 'production'; // Устанавливаем режим продакшена

      const response = await request(app).get('/unexpected-error');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
         status: 'error',
         statusCode: 500,
         message: "Непредвиденная ошибка",
      });

      delete process.env.NODE_ENV; // Удаляем переменную окружения после теста
   });
});