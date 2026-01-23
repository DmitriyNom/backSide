// routes/fileUploadRouter.js
const Router = require('express');
const router = new Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const authMiddleware = require('../middleware/AuthMiddleware');

// Настройка multer
const storage = multer.diskStorage({
   destination: async (req, file, cb) => {
      try {
         console.log('📍 Загрузка файла. Публичный?', req.headers['x-is-public']);
         console.log('📍 Имя файла из заголовков:', req.headers['x-file-name']);

         const isPublic = req.headers['x-is-public'] === 'true';
         const fileName = decodeURIComponent(req.headers['x-file-name'] || '');

         // Базовые директории
         let targetDir = path.join(__dirname, '..', 'uploads');
         if (isPublic) {
            targetDir = path.join(__dirname, '..', 'public', 'uploads');
         }

         console.log('📍 Базовая директория:', targetDir);

         if (fileName) {
            // Полный путь к файлу
            const fullPath = path.join(targetDir, fileName);
            // Директория файла (без имени файла)
            const dirPath = path.dirname(fullPath);

            console.log('📍 Полный путь к файлу:', fullPath);
            console.log('📍 Директория для сохранения:', dirPath);

            // Создаем директории если их нет
            await fs.mkdir(dirPath, { recursive: true });

            cb(null, dirPath);
         } else {
            // Резервный вариант - сохраняем в базовую директорию
            console.log('📍 Сохраняем в базовую директорию:', targetDir);
            await fs.mkdir(targetDir, { recursive: true });
            cb(null, targetDir);
         }
      } catch (error) {
         console.error('❌ Ошибка в destination:', error);
         cb(error);
      }
   },
   filename: (req, file, cb) => {
      const fileName = decodeURIComponent(req.headers['x-file-name'] || '');
      if (fileName) {
         const basename = path.basename(fileName);
         console.log('📍 Имя файла для сохранения:', basename);
         cb(null, basename);
      } else {
         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
         const ext = path.extname(file.originalname);
         const newFilename = uniqueSuffix + ext;
         console.log('📍 Генерируемое имя файла:', newFilename);
         cb(null, newFilename);
      }
   }
});

const upload = multer({
   storage,
   limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// Роут для прямой загрузки (требует авторизации)
router.post('/upload-direct',
   authMiddleware,
   upload.single('file'),
   (req, res) => {
      console.log('✅ Файл загружен успешно:', {
         filename: req.file.filename,
         path: req.file.path,
         size: req.file.size
      });

      if (!req.file) {
         return res.status(400).json({ error: 'Файл не загружен' });
      }

      // Возвращаем полный путь
      const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);
      const urlPath = relativePath.replace(/\\/g, '/'); // Заменяем обратные слеши

      res.json({
         success: true,
         filename: req.file.filename,
         originalName: req.file.originalname,
         size: req.file.size,
         mimeType: req.file.mimetype,
         path: `/${urlPath}`, // Относительный путь
         url: `http://localhost:5000/${urlPath}` // Полный URL
      });
   }
);

// Роут для получения файла (публичный) - УЛУЧШЕННАЯ ВЕРСИЯ
router.get('/*', (req, res) => {
   const filePath = req.path; // Получаем полный путь запроса
   console.log('📥 Запрос файла по пути:', filePath);

   // Определяем базовую директорию
   let baseDir;
   if (filePath.startsWith('/public/uploads/')) {
      baseDir = path.join(__dirname, '..');
   } else if (filePath.startsWith('/uploads/')) {
      baseDir = path.join(__dirname, '..');
   } else {
      return res.status(404).json({ error: 'Неверный путь к файлу' });
   }

   const fullPath = path.join(baseDir, filePath);
   console.log('📥 Полный путь на диске:', fullPath);

   res.sendFile(fullPath, (err) => {
      if (err) {
         console.error('❌ Ошибка отправки файла:', err.message);
         res.status(404).json({
            error: 'Файл не найден',
            requestedPath: filePath,
            fullPath: fullPath
         });
      } else {
         console.log('✅ Файл отправлен успешно');
      }
   });
});

module.exports = router;