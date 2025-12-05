const httpMocks = require('node-mocks-http');
const jwt = require('jsonwebtoken');
const roleMiddleware = require('../../middleware/CheckRoleMiddleware'); // Укажите правильный путь к вашему middleware

describe('Role Middleware', () => {
   const SECRET_KEY = 'your_secret_key'; // Убедитесь, что это совпадает с вашим SECRET_KEY
   let req, res, next;

   beforeEach(() => {
      req = httpMocks.createRequest();
      res = httpMocks.createResponse();
      next = jest.fn();
      process.env.SECRET_KEY = SECRET_KEY; // Устанавливаем переменную окружения
   });

   it('should call next() if the user has the correct role', () => {
      const mockUser = { id: 1, username: 'testuser', role: 'admin' };
      const token = jwt.sign(mockUser, SECRET_KEY);
      req.headers.authorization = `Bearer ${token}`;

      const middleware = roleMiddleware('admin');

      middleware(req, res, next);

      expect(req.user).toMatchObject(mockUser); // Используем toMatchObject вместо toEqual
      expect(next).toHaveBeenCalled();
   });


   it('should return 403 if the user does not have the correct role', () => {
      const mockUser = { id: 1, username: 'testuser', role: 'user' };
      const token = jwt.sign(mockUser, SECRET_KEY); // Создаем валидный токен с ролью user
      req.headers.authorization = `Bearer ${token}`; // Устанавливаем заголовок с токеном

      const middleware = roleMiddleware('admin'); // Создаем middleware с требуемой ролью

      middleware(req, res, next); // Вызываем middleware

      expect(res.statusCode).toBe(403); // Проверяем статус ответа
      expect(JSON.parse(res._getData())).toEqual({ message: "Нет доступа" }); // Проверяем сообщение об ошибке
      expect(next).not.toHaveBeenCalled(); // Проверяем, что next не был вызван
   });

   it('should return 401 if no token is provided', () => {
      // Не устанавливаем заголовок authorization

      const middleware = roleMiddleware('admin');

      middleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ message: "Пользователь не авторизован" }); // Сообщение из catch блока
      expect(next).not.toHaveBeenCalled();
   });
   it('should return 401 if token is invalid', () => {
      req.headers.authorization = 'Bearer invalid_token'; // Устанавливаем недействительный токен

      const middleware = roleMiddleware('admin'); // Создаем middleware с требуемой ролью

      middleware(req, res, next); // Вызываем middleware с недействительным токеном

      expect(res.statusCode).toBe(401); // Проверяем статус ответа
      expect(JSON.parse(res._getData())).toEqual({ message: "Не авторизован" }); // Проверяем сообщение об ошибке
      expect(next).not.toHaveBeenCalled(); // Проверяем, что next не был вызван
   });

   it('should call next() for OPTIONS requests', () => {
      req.method = "OPTIONS"; // Устанавливаем метод запроса как OPTIONS

      const middleware = roleMiddleware('admin'); // Создаем middleware с требуемой ролью

      middleware(req, res, next); // Вызываем middleware

      expect(next).toHaveBeenCalled(); // Проверяем вызов функции next для OPTIONS запроса
   });
});