// authMiddleware.test.js
const jwt = require('jsonwebtoken');
const httpMocks = require('node-mocks-http'); // Для создания мока запроса и ответа
const authMiddleware = require('../../middleware/AuthMiddleware'); // Укажите правильный путь к вашему middleware

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
   let req, res, next;

   beforeEach(() => {
      req = httpMocks.createRequest();
      res = httpMocks.createResponse();
      next = jest.fn(); // Мокаем функцию next
   });

   it('should call next() if the request method is OPTIONS', () => {
      req.method = 'OPTIONS';
      authMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
   });

   // Тест для случая, когда токен не предоставлен
   it('should return 401 if no token is provided', async () => {
      const req = httpMocks.createRequest({
         method: 'GET',
         url: '/api/protected',
         headers: {
            Authorization: '',
         },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ message: "Пользователь не авторизован" }); // Изменено здесь
      expect(next).not.toHaveBeenCalled();
   });

   // Тест для случая, когда токен недействителен
   it('should return 401 if token is invalid', async () => {
      const req = httpMocks.createRequest({
         method: 'GET',
         url: '/api/protected',
         headers: {
            Authorization: 'Bearer invalid_token',
         },
      });

      const res = httpMocks.createResponse();
      const next = jest.fn();

      // Мокаем jwt.verify так, чтобы он выбрасывал ошибку
      jwt.verify.mockImplementation((token, secret, callback) => {
         callback(new Error('Invalid token'), null);
      });

      await authMiddleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ message: "Пользователь не авторизован" });
      expect(next).not.toHaveBeenCalled();
   });

   it('should call next() and set req.user if token is valid', () => {
      const mockUser = { id: 1, username: 'testuser' };
      const token = jwt.sign(mockUser, process.env.SECRET_KEY); // Создаем валидный токен
      req.headers.authorization = `Bearer ${token}`; // Устанавливаем заголовок с токеном

      jwt.verify.mockImplementation((token, secret) => {
         return mockUser; // Возвращаем мок пользователя при валидации токена
      });

      authMiddleware(req, res, next);

      expect(req.user).toEqual(mockUser); // Проверяем, что пользователь установлен в req.user
      expect(next).toHaveBeenCalled(); // Проверяем вызов функции next
   });
});