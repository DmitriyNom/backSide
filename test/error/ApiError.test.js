const ApiError = require('../../error/ApiError');

describe('ApiError', () => {
   it('should create an instance of ApiError with correct properties', () => {
      const error = new ApiError(400, 'Bad Request');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(400);
      expect(error.message).toBe('Bad Request');
   });

   it('should create a badRequest error with correct properties', () => {
      const error = ApiError.badRequest('Invalid data');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(400);
      expect(error.message).toBe('Invalid data');
   });

   it('should create an internal error with correct properties', () => {
      const error = ApiError.internal('Internal Server Error');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(500);
      expect(error.message).toBe('Internal Server Error');
   });

   it('should create a forbidden error with correct properties', () => {
      const error = ApiError.forbidden('Access Denied');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(403);
      expect(error.message).toBe('Access Denied');
   });

   it('should create a notFound error with correct properties', () => {
      const error = ApiError.notFound('Resource Not Found');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(404);
      expect(error.message).toBe('Resource Not Found');
   });
});
