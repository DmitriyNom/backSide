// models/TaskMedia.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const TaskMedia = sequelize.define('TaskMedia', {
      task_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         primaryKey: true,
         references: {
            model: 'tasks',
            key: 'id'
         },
         onDelete: 'CASCADE'
      },
      media_id: {
         type: DataTypes.UUID,
         allowNull: false,
         primaryKey: true,
         references: {
            model: 'media',
            key: 'id'
         },
         onDelete: 'CASCADE'
      },
      order_index: {
         type: DataTypes.INTEGER,
         defaultValue: 0,
         comment: 'Порядок отображения медиа'
      }
   }, {
      tableName: 'task_media',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
   });

   return TaskMedia;
};