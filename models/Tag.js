// models/Tag.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const Tag = sequelize.define('Tag', {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true,
         comment: 'Уникальный идентификатор тега'
      },

      name: {
         type: DataTypes.STRING(100),
         allowNull: false,
         unique: true,
         validate: {
            notEmpty: {
               msg: 'Название тега не может быть пустым'
            },
            len: {
               args: [1, 100],
               msg: 'Название тега должно быть от 1 до 100 символов'
            },
            // Опционально: проверка на недопустимые символы
            is: {
               args: /^[a-zA-Zа-яА-Я0-9\s\-_]+$/,
               msg: 'Тег может содержать только буквы, цифры, пробелы, дефис и подчеркивание'
            }
         },
         comment: 'Название тега (например: "хоккей", "ведение", "силовая")'
      },

      usage_count: {
         type: DataTypes.INTEGER,
         defaultValue: 0,
         validate: {
            min: 0
         },
         comment: 'Сколько раз этот тег использован в упражнениях (для сортировки по популярности)'
      },

      created_at: {
         type: DataTypes.DATE,
         defaultValue: DataTypes.NOW,
         comment: 'Дата создания тега'
      },

      updated_at: {
         type: DataTypes.DATE,
         defaultValue: DataTypes.NOW,
         comment: 'Дата последнего обновления'
      }

   }, {
      tableName: 'tags',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // Индексы для оптимизации
      indexes: [
         {
            fields: ['name'],
            unique: true,
            name: 'idx_tags_name_unique'
         },
         {
            fields: ['usage_count'],
            name: 'idx_tags_usage_count'
         }
      ]
   });

   return Tag;
};