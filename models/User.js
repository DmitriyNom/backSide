// models/User.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const User = sequelize.define('User', {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true
      },
      userName: {
         type: DataTypes.STRING,
         unique: true,
         field: 'userName'  // поле в БД называется userName
      },
      firstName: {
         type: DataTypes.STRING,
         allowNull: true,
         field: 'firstName'
      },
      lastName: {
         type: DataTypes.STRING,
         allowNull: true,
         field: 'lastName'
      },
      email: {
         type: DataTypes.STRING,
         unique: true,
         field: 'email'
      },
      password: {
         type: DataTypes.STRING,
         allowNull: false,
         field: 'password'
      },
      role: {
         type: DataTypes.STRING,
         allowNull: true,
         validate: {
            isIn: [['trainee', 'trainer', 'skipped']]
         },
         field: 'role'
      },
      userAvatar: {
         type: DataTypes.STRING,
         validate: { isUrl: true },
         allowNull: true,
         field: 'userAvatar'
      },
      birthDate: {
         type: DataTypes.DATE,
         allowNull: true,
         field: 'birthDate'
      },
      sport_specialization: {
         type: DataTypes.STRING(100),
         allowNull: true,
         field: 'sport_specialization'  // snake_case в БД
      },
      training_level: {
         type: DataTypes.ENUM('beginner', 'amateur', 'advanced', 'professional'),
         allowNull: true,
         field: 'training_level'  // snake_case в БД
      },
      allow_connections: {
         type: DataTypes.BOOLEAN,
         defaultValue: true,
         field: 'allow_connections'  // snake_case в БД
      },
      height: {
         type: DataTypes.INTEGER,
         allowNull: true,
         field: 'height'
      },
      weight: {
         type: DataTypes.INTEGER,
         allowNull: true,
         field: 'weight'
      },
      position: {
         type: DataTypes.STRING,
         allowNull: true,
         field: 'position'
      },
      country: {
         type: DataTypes.STRING,
         allowNull: true,
         field: 'country'
      },
      city: {
         type: DataTypes.STRING,
         allowNull: true,
         field: 'city'
      },
      teamName: {
         type: DataTypes.STRING,
         allowNull: true,
         field: 'teamName'
      }
   }, {
      tableName: 'users',
      underscored: false,  // 👈 Отключаем автоматическое преобразование в snake_case
      timestamps: true,
      createdAt: 'createdAt',  // поле в БД называется createdAt
      updatedAt: 'updatedAt'   // поле в БД называется updatedAt
   });

   return User;
};