// const jwt = require('jsonwebtoken')

// module.exports = function (role) {
//    return function (req, res, next) {
//       if (req.method === "OPTIONS") {
//          next()
//       }
//       try {
//          const token = req.headers.authorization.split(' ')[1]

//          if (!token) {
//             return res.status(401).json({ message: "Пользователь не авторизован" })
//          }

//          const decoded = jwt.verify(token, process.env.SECRET_KEY)

//          if (decoded.role !== role) {
//             return res.status(403).json({ message: "Нет доступа" })
//          }

//          req.user = decoded;

//          next()

//       } catch (e) {
//          res.status(401).json({ message: "Не авторизован" })
//       }
//    };
// }

const jwt = require('jsonwebtoken');

module.exports = function (role) {
   return function (req, res, next) {
      if (req.method === "OPTIONS") {
         return next();
      }

      try {
         // Проверяем наличие заголовка Authorization
         if (!req.headers.authorization) {
            return res.status(401).json({ message: "Пользователь не авторизован" });
         }

         const token = req.headers.authorization.split(' ')[1];

         // Проверяем наличие токена
         if (!token) {
            return res.status(401).json({ message: "Пользователь не авторизован" });
         }

         // Проверяем токен
         const decoded = jwt.verify(token, process.env.SECRET_KEY);

         // Проверяем роль пользователя
         if (decoded.role !== role) {
            return res.status(403).json({ message: "Нет доступа" });
         }

         req.user = decoded; // Устанавливаем пользователя в req.user

         next(); // Переходим к следующему middleware

      } catch (e) {
         res.status(401).json({ message: "Не авторизован" });
      }
   };
}