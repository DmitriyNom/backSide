const jwt = require('jsonwebtoken');
const ApiError = require('../error/ApiError');

module.exports = function (req, res, next) {
   // Пропускаем preflight-запросы
   if (req.method === "OPTIONS") {
      return next();
   }

   const token = req.cookies.accessToken;

   // Если токен не найден
   if (!token) {
      return next(ApiError.unauthorized("Пользователь не авторизован"));
   }

   try {
      // Проверяем валидность токена
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
      next();
   } catch (e) {
      console.error("JWT Error:", e);
      if (e.name === 'TokenExpiredError') {
         return next(ApiError.unauthorized("Срок действия токена истек"));
      }
      return next(ApiError.unauthorized("Пользователь не авторизован"));
   }
};
