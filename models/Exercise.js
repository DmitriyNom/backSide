// models/Exercise.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const Exercise = sequelize.define('Exercise', {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true,
         comment: 'Уникальный идентификатор упражнения'
      },

      // Владелец
      user_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         },
         comment: 'ID пользователя, который создал упражнение (владелец)'
      },

      // Основная информация
      title: {
         type: DataTypes.STRING(255),
         allowNull: false,
         validate: {
            notEmpty: {
               msg: 'Название упражнения не может быть пустым'
            },
            len: {
               args: [1, 255],
               msg: 'Название должно быть от 1 до 255 символов'
            }
         },
         comment: 'Название упражнения'
      },

      description: {
         type: DataTypes.TEXT,
         allowNull: true,
         defaultValue: null,
         comment: 'Описание техники выполнения, методические указания'
      },

      // Права доступа
      is_public: {
         type: DataTypes.BOOLEAN,
         defaultValue: false,
         comment: 'Доступно ли упражнение всем пользователям (true) или только владельцу и тем, кому выдан доступ (false)'
      },

      // Копирование
      source_exercise_id: {
         type: DataTypes.INTEGER,
         allowNull: true,
         references: {
            model: 'exercises',
            key: 'id'
         },
         onDelete: 'SET NULL',
         comment: 'Ссылка на оригинальное упражнение, если это копия'
      },

      // Статистика
      usage_count: {
         type: DataTypes.INTEGER,
         defaultValue: 0,
         validate: {
            min: 0
         },
         comment: 'Сколько раз упражнение использовано в заданиях/тренировках'
      },

      copy_count: {
         type: DataTypes.INTEGER,
         defaultValue: 0,
         validate: {
            min: 0
         },
         comment: 'Сколько раз это упражнение скопировано другими пользователями'
      }

   }, {
      tableName: 'exercises',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // Индексы для оптимизации запросов
      indexes: [
         {
            fields: ['user_id'],
            name: 'idx_exercises_user_id'
         },
         {
            fields: ['is_public'],
            name: 'idx_exercises_is_public'
         },
         {
            fields: ['source_exercise_id'],
            name: 'idx_exercises_source'
         },
         {
            fields: ['created_at'],
            name: 'idx_exercises_created_at'
         }
      ]
   });

   return Exercise;
};