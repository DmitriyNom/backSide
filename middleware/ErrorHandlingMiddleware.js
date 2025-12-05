const ApiError = require('../error/ApiError');

module.exports = function (err, req, res, next) {
   // Логируем ошибку для отладки
   console.error(err);

   // Проверяем, является ли ошибка экземпляром ApiError
   if (err instanceof ApiError) {
      return res.status(err.status).json({
         status: 'error',
         statusCode: err.status,
         message: err.message,
      });
   }

   // Обработка непредвиденных ошибок
   return res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: "Непредвиденная ошибка",
   });
}