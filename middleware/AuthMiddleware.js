
// const jwt = require('jsonwebtoken');
// const ApiError = require('../error/ApiError');

// module.exports = function (req, res, next) {
//    // Пропускаем preflight-запросы
//    if (req.method === "OPTIONS") {
//       return next();
//    }

//    const authHeader = req.headers.authorization;

//    // Проверяем наличие заголовка Authorization
//    if (!authHeader) {
//       return next(ApiError.unauthorized("Пользователь не авторизован"));
//    }

//    // Проверяем формат заголовка
//    const parts = authHeader.split(' ');
//    if (parts.length !== 2 || parts[0] !== 'Bearer') {
//       return next(ApiError.unauthorized("Пользователь не авторизован"));
//    }

//    const token = parts[1];

//    try {
//       // Проверяем валидность токена
//       const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//       req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
//       next();
//    } catch (e) {
//       // Логируем ошибку для отладки (опционально)
//       console.error("JWT Error:", e);

//       // Обработка истечения срока действия токена
//       if (e.name === 'TokenExpiredError') {
//          return next(ApiError.unauthorized("Срок действия токена истек"));
//       }

//       return next(ApiError.unauthorized("Пользователь не авторизован"));
//    }
// };

const jwt = require('jsonwebtoken');
const ApiError = require('../error/ApiError');

module.exports = function (req, res, next) {
   // Пропускаем preflight-запросы
   if (req.method === "OPTIONS") {
      return next();
   }

   let token;

   // Проверяем токен в заголовке Authorization
   const authHeader = req.headers.authorization;
   if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
         token = parts[1];
      }
   }

   // Если токен не найден в заголовке, пробуем взять из cookie
   if (!token && req.cookies) {
      token = req.cookies.accessToken;
   }

   // Если токен не найден вообще
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
