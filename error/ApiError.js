// class ApiError extends Error {
//    constructor(status, message) {
//       super();
//       this.status = status
//       this.message = message
//    }

//    static badRequest(message) {
//       return new ApiError(404, message)
//    }

//    static internal(message) {
//       return new ApiError(500, message)
//    }

//    static forbidden(message) {
//       return new ApiError(403, message)
//    }

//    static notFound(message) {
//       return new ApiError(404, message)
//    }
// }

// module.exports = ApiError;

// ApiError.js
class ApiError extends Error {
   constructor(status, message) {
      super(message); // Передаем сообщение в родительский класс
      this.status = status;
   }

   static badRequest(message) {
      return new ApiError(400, message); // Исправлено на 400
   }

   static internal(message) {
      return new ApiError(500, message);
   }

   static forbidden(message) {
      return new ApiError(403, message);
   }

   static notFound(message) {
      return new ApiError(404, message);
   }
}

module.exports = ApiError;