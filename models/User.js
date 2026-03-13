// models/User.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const User = sequelize.define('user', {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true
      },
      userName: {
         type: DataTypes.STRING,
         unique: true,
         field: 'userName' // Явно указываем имя поля в БД
      },
      birthDate: {
         type: DataTypes.DATE,
         allowNull: true,
         field: 'birthDate'
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
      sport_specialization: {
         type: DataTypes.STRING(100),
         allowNull: true,
         field: 'sport_specialization'
      },
      training_level: {
         type: DataTypes.ENUM('beginner', 'amateur', 'advanced', 'professional'),
         allowNull: true,
         field: 'training_level'
      },
      allow_connections: {
         type: DataTypes.BOOLEAN,
         defaultValue: true,
         field: 'allow_connections'
      }
   }, {
      tableName: 'users',
      underscored: true, // Оставляем true для полей типа sport_specialization
      timestamps: true,
      createdAt: 'createdAt', // Исправляем: в БД createdAt, а не created_at
      updatedAt: 'updatedAt'  // Исправляем: в БД updatedAt, а не updated_at
   });

   return User;
};