require('dotenv').config();
const express = require("express");
const sequelize = require('./db');
const models = require("./models/models");
const cors = require('cors');
// const fileUpload = require('express-fileupload');
const router = require('./routes/index');
const errorHandler = require('./middleware/ErrorHandlingMiddleware');
const path = require('path');
const cookieParser = require('cookie-parser'); // Импортируем cookie-parser

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors({
   origin: 'http://localhost:3000', // адрес вашего фронтенда
   credentials: true,               // разрешить передачу cookie
}));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'uploads')));
// app.use(fileUpload({}))
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Добавляем cookie-parser здесь
app.use('/api', router);
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
