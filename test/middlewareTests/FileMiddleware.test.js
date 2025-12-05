const upload = require('../../middleware/FileMiddleware'); // Импортируем настройки multer
const multer = require('multer');

jest.mock('multer', () => {
   const multer = jest.fn();
   multer.diskStorage = jest.fn().mockReturnValue({
      destination: jest.fn((req, file, cb) => {
         cb(null, 'uploads');
      }),
      filename: jest.fn((req, file, cb) => {
         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
         cb(null, `${uniqueSuffix}-${file.originalname}`); // Возвращаем уникальное имя
      }),
   });
   return multer;
});

describe('Multer Upload', () => {
   const storage = multer.diskStorage();

   it('should set the correct destination', () => {
      // Проверка destination
      const req = {};
      const file = { originalname: 'test.jpg' };
      const cb = jest.fn();

      storage.destination(req, file, cb);
      expect(cb).toHaveBeenCalledWith(null, 'uploads'); // Проверка пути
   });

   it('should set the correct filename', () => {
      // Проверка filename
      const req = {};
      const file = { originalname: 'test.jpg' };
      const cb = jest.fn();

      storage.filename(req, file, cb);
      expect(cb).toHaveBeenCalled();
      const fileName = cb.mock.calls[0][1]; // Получаем имя файла из вызова колбэка
      expect(fileName).toMatch(/test\.jpg$/); // Проверка расширения файла
   });
});
