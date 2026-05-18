// models/Task.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const Task = sequelize.define('Task', {
      id: {
         type: DataTypes.INTEGER,
         autoIncrement: true,
         primaryKey: true
      },
      exercise_id: {
         type: DataTypes.INTEGER,
         allowNull: true,
         references: {
            model: 'exercises',
            key: 'id'
         },
         onDelete: 'SET NULL',
         comment: 'NULL = кастомное задание без привязки к библиотеке'
      },
      user_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         },
         onDelete: 'CASCADE',
         comment: 'Кому назначено (спортсмен)'
      },
      assigned_by_user_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         },
         onDelete: 'CASCADE',
         comment: 'Кто назначил (тренер)'
      },
      context_id: {
         type: DataTypes.INTEGER,
         allowNull: true,
         references: {
            model: 'training_contexts',
            key: 'id'
         },
         onDelete: 'SET NULL',
         comment: 'Ссылка на тренировочный контекст (тренер, вид спорта)'
      },
      custom_title: {
         type: DataTypes.STRING(255),
         allowNull: true,
         comment: 'Заполняется, если exercise_id = NULL'
      },
      custom_description: {
         type: DataTypes.TEXT,
         allowNull: true,
         comment: 'Заполняется, если exercise_id = NULL'
      },
      metrics: {
         type: DataTypes.JSONB,
         allowNull: false,
         defaultValue: {},
         comment: 'Плановые метрики выполнения'
      },
      priority: {
         type: DataTypes.INTEGER,
         allowNull: false,
         defaultValue: 2,
         validate: { min: 1, max: 3 },
         comment: '1=низкий, 2=средний, 3=высокий'
      },
      due_date: {
         type: DataTypes.DATE,
         allowNull: true,
         comment: 'Срок выполнения'
      },
      actual_metrics: {
         type: DataTypes.JSONB,
         allowNull: true,
         comment: 'Фактические метрики (заполняет спортсмен)'
      },
      felt_difficulty: {
         type: DataTypes.INTEGER,
         allowNull: true,
         validate: { min: 1, max: 10 },
         comment: 'Субъективная сложность 1-10'
      },
      completion_percentage: {
         type: DataTypes.INTEGER,
         allowNull: true,
         validate: { min: 0, max: 100 },
         comment: 'Рассчитывается системой'
      },
      status: {
         type: DataTypes.ENUM('active', 'completed', 'archived'),
         defaultValue: 'active',
         comment: 'active=активно, completed=выполнено, archived=в архиве'
      },
      completed_at: {
         type: DataTypes.DATE,
         allowNull: true,
         comment: 'Дата выполнения'
      },
      points_earned: {
         type: DataTypes.INTEGER,
         defaultValue: 0,
         comment: 'Начисленные баллы за выполнение'
      },
      order_index: {
         type: DataTypes.INTEGER,
         defaultValue: 0,
         comment: 'Для сортировки в тренировках (ЭТАП 6)'
      }
   }, {
      tableName: 'tasks',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
   });

   return Task;
};