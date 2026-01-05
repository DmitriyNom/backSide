// const { Sequelize } = require('sequelize');

// const { Sequelize } = require('sequelize');
// const config = require('./config/config.json')[process.env.NODE_ENV || 'development'];

// module.exports = new Sequelize(
//    config.database,
//    config.username,
//    config.password,
//    {
//       dialect: config.dialect,
//       host: config.host,
//       port: config.port
//    }
// );


const { Sequelize } = require('sequelize');
const config = require('./config/config.json')[process.env.NODE_ENV || 'development'];

// Используем переменные окружения если они есть, иначе config из файла
const dbConfig = {
   database: process.env.DB_NAME || config.database,
   username: process.env.DB_USER || config.username,
   password: process.env.DB_PASSWORD || config.password,
   host: process.env.DB_HOST || config.host,
   port: process.env.DB_PORT || config.port,
   dialect: config.dialect
};

// Для Docker используем host из переменных окружения
if (process.env.NODE_ENV === 'development' && process.env.DB_HOST) {
   dbConfig.host = process.env.DB_HOST;
}

module.exports = new Sequelize(
   dbConfig.database,
   dbConfig.username,
   dbConfig.password,
   {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect
   }
);
