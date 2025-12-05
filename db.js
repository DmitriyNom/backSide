// const { Sequelize } = require('sequelize');

// module.exports = new Sequelize(
//    process.env.DB_NAME,
//    process.env.DB_USER,
//    process.env.DB_PASSWORD,
//    {
//       dialect: 'postgres',
//       host: process.env.DB_HOST,
//       port: process.env.DB_PORT
//    }
// )

const { Sequelize } = require('sequelize');
const config = require('./config/config.json')[process.env.NODE_ENV || 'development'];

module.exports = new Sequelize(
   config.database,
   config.username,
   config.password,
   {
      dialect: config.dialect,
      host: config.host,
      port: config.port
   }
);
