const jwt = require('jsonwebtoken');
const ApiError = require('../error/ApiError');

module.exports = function (req, res, next) {
   if (req.method === "OPTIONS") {
      return next();
   }

   try {
      // Refresh токен обычно передают в теле запроса или в cookie,
      // но если хотите в заголовке — можно так же, как и access токен
      const authHeader = req.headers.authorization;
      if (!authHeader) {
         return next(ApiError.unauthorized("Пользователь не авторизован"));
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
         return next(ApiError.unauthorized("Пользователь не авторизован"));
      }

      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      req.user = { id: decoded.id };
      next();
   } catch (e) {
      return next(ApiError.unauthorized("Пользователь не авторизован"));
   }
};
