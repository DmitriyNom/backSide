const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
   // Пропускаем OPTIONS запросы
   if (req.method === "OPTIONS") {
      return next(); // Обязательно используйте return, чтобы избежать дальнейшего выполнения кода
   }

   try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
         return res.status(401).json({ message: "Пользователь не авторизован" });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
         return res.status(401).json({ message: "Пользователь не авторизован" });
      }

      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decoded; // Устанавливаем пользователя в req.user
      next(); // Вызываем next() для продолжения обработки запроса
   } catch (e) {
      return res.status(401).json({ message: "Пользователь не авторизован" });
   }
};

// const jwt = require('jsonwebtoken')

// module.exports = function (req, res, next) {
//    if (req.method === "OPTIONS") {
//       next()
//    }

//    try {
//       const token = req.headers.authorization.split(' ')[1]

//       if (!token) {
//          return res.status(401).json({ message: "Пользователь не авторизован" })
//       }
//       const decoded = jwt.verify(token, process.env.SECRET_KEY)
//       req.user = decoded
//       next()
//    } catch (e) {
//       res.status(401).json({ message: "Пользователь не авторизован" })
//    }
// };
