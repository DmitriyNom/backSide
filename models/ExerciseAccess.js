// models/ExerciseAccess.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const ExerciseAccess = sequelize.define('ExerciseAccess', {
      // ========== ПЕРВИЧНЫЕ КЛЮЧИ ==========
      exercise_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'exercises',
            key: 'id'
         },
         primaryKey: true,
         comment: 'ID упражнения, к которому дается доступ'
      },

      user_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         },
         primaryKey: true,
         comment: 'ID пользователя, которому дается доступ'
      },

      // ========== УРОВЕНЬ ДОСТУПА ==========
      access_level: {
         type: DataTypes.ENUM('view', 'use', 'edit'),
         defaultValue: 'view',
         allowNull: false,
         validate: {
            isIn: {
               args: [['view', 'use', 'edit']],
               msg: 'access_level должен быть: view, use или edit'
            }
         },
         comment: 'Уровень доступа: view - только просмотр, use - использовать в тренировках, edit - редактировать'
      },

      // ========== КТО ДАЛ ДОСТУП ==========
      granted_by: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         },
         comment: 'ID пользователя, который предоставил доступ (обычно владелец упражнения)'
      },

      // ========== ОПЦИОНАЛЬНО: СРОК ДЕЙСТВИЯ ==========
      expires_at: {
         type: DataTypes.DATE,
         allowNull: true,
         validate: {
            isDate: true,
            isAfter: {
               args: new Date().toISOString(),
               msg: 'expires_at должно быть в будущем'
            }
         },
         comment: 'Дата истечения доступа (null = бессрочно)'
      },

      // ========== СТАТУС ==========
      status: {
         type: DataTypes.ENUM('active', 'revoked', 'expired'),
         defaultValue: 'active',
         allowNull: false,
         comment: 'Статус доступа: active - активен, revoked - отозван, expired - истек'
      },

      // ========== СИСТЕМНЫЕ ПОЛЯ ==========
      created_at: {
         type: DataTypes.DATE,
         defaultValue: DataTypes.NOW,
         allowNull: false,
         comment: 'Дата и время предоставления доступа'
      },

      updated_at: {
         type: DataTypes.DATE,
         defaultValue: DataTypes.NOW,
         allowNull: false,
         comment: 'Дата и время последнего обновления (изменение уровня, статуса)'
      }

   }, {
      tableName: 'exercise_access',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // ========== ИНДЕКСЫ ==========
      indexes: [
         {
            name: 'idx_exercise_access_exercise_id',
            fields: ['exercise_id'],
            using: 'btree',
            comment: 'Индекс для поиска всех пользователей с доступом к упражнению'
         },
         {
            name: 'idx_exercise_access_user_id',
            fields: ['user_id'],
            using: 'btree',
            comment: 'Индекс для поиска всех упражнений, доступных пользователю'
         },
         {
            name: 'idx_exercise_access_status',
            fields: ['status'],
            using: 'btree',
            comment: 'Индекс для фильтрации по статусу'
         },
         {
            name: 'idx_exercise_access_expires',
            fields: ['expires_at'],
            using: 'btree',
            comment: 'Индекс для поиска истекающих доступов'
         }
      ],

      // ========== ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ ==========
      hooks: {
         /**
          * При создании записи доступа, обновляем счетчик в Exercise
          */
         afterCreate: async (access, options) => {
            await sequelize.models.exercise.increment(
               'shared_count',  // новое поле в Exercise (добавим позже)
               { by: 1, where: { id: access.exercise_id } }
            );
         },

         /**
          * При удалении записи доступа, уменьшаем счетчик
          */
         afterDestroy: async (access, options) => {
            await sequelize.models.exercise.decrement(
               'shared_count',
               { by: 1, where: { id: access.exercise_id } }
            );
         }
      }
   });

   return ExerciseAccess;
};