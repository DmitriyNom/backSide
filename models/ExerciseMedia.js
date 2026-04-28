// models/ExerciseMedia.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const ExerciseMedia = sequelize.define('ExerciseMedia', {
      // ========== ПЕРВИЧНЫЕ КЛЮЧИ ==========
      exercise_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'exercises',
            key: 'id'
         },
         primaryKey: true,
         comment: 'ID упражнения, к которому прикреплено медиа'
      },

      media_id: {
         type: DataTypes.UUID,
         allowNull: false,
         references: {
            model: 'media',
            key: 'id'
         },
         primaryKey: true,
         comment: 'UUID медиафайла из таблицы media'
      },

      // ========== ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ ==========
      order_index: {
         type: DataTypes.INTEGER,
         defaultValue: 0,
         allowNull: false,
         validate: {
            min: {
               args: [0],
               msg: 'order_index не может быть отрицательным'
            },
            isInt: {
               msg: 'order_index должен быть целым числом'
            }
         },
         comment: 'Порядок отображения медиа в упражнении (0, 1, 2...). Используется для сортировки.'
      },

      // ========== СИСТЕМНЫЕ ПОЛЯ ==========
      created_at: {
         type: DataTypes.DATE,
         defaultValue: DataTypes.NOW,
         allowNull: false,
         comment: 'Дата и время прикрепления медиа к упражнению'
      }

   }, {
      // ========== НАСТРОЙКИ ТАБЛИЦЫ ==========
      tableName: 'exercise_media',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // ========== ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ ==========
      indexes: [
         {
            name: 'idx_exercise_media_exercise_id',
            fields: ['exercise_id'],
            using: 'btree',
            comment: 'Индекс для быстрого поиска всех медиа упражнения'
         },
         {
            name: 'idx_exercise_media_media_id',
            fields: ['media_id'],
            using: 'btree',
            comment: 'Индекс для быстрого поиска упражнений, использующих медиа'
         },
         {
            name: 'idx_exercise_media_order',
            fields: ['exercise_id', 'order_index'],
            using: 'btree',
            comment: 'Составной индекс для сортировки медиа в упражнении'
         }
      ],

      // ========== ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ ==========
      freezeTableName: true,  // Запрещаем изменение имени таблицы
      paranoid: false,        // Нет soft delete для связующей таблицы
      version: false          // Отключаем версионирование
   });

   return ExerciseMedia;
};