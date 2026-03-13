require('dotenv').config();
const express = require("express");
const sequelize = require('./db');
const models = require("./models");
const cors = require('cors');
const router = require('./routes/index');
const errorHandler = require('./middleware/ErrorHandlingMiddleware');
const path = require('path');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors({
   origin: 'http://localhost:3000',
   credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ========== СТАТИЧЕСКИЕ МАРШРУТЫ ДЛЯ ФАЙЛОВ ==========

// 1. Старые пути для обратной совместимости (оставить временно)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 2. НОВЫЕ ПУТИ ДЛЯ МЕДИА (добавить эти строки)
app.use('/media/private', express.static(path.join(__dirname, 'uploads/media/private')));
app.use('/media/public', express.static(path.join(__dirname, 'uploads/media/public')));

// ========== МАРШРУТЫ API ==========
app.use('/api', router);

// ========== ОБРАБОТКА ОШИБОК ==========
app.use(errorHandler);

const start = async () => {
   try {
      await sequelize.authenticate();
      await sequelize.sync();
      app.listen(PORT, () => { console.log(`Server started at ${PORT}`) });
   } catch (e) {
      console.log(e);
   }
};

start();