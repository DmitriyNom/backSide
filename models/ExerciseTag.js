// models/ExerciseTag.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const ExerciseTag = sequelize.define('ExerciseTag', {
      exercise_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'exercises',
            key: 'id'
         },
         primaryKey: true,
         comment: 'ID упражнения'
      },

      tag_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'tags',
            key: 'id'
         },
         primaryKey: true,
         comment: 'ID тега'
      },

      created_at: {
         type: DataTypes.DATE,
         defaultValue: DataTypes.NOW,
         comment: 'Дата связывания упражнения с тегом'
      }

   }, {
      tableName: 'exercise_tags',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,  // Не нужна updated_at для связующей таблицы

      indexes: [
         {
            fields: ['exercise_id'],
            name: 'idx_exercise_tags_exercise_id'
         },
         {
            fields: ['tag_id'],
            name: 'idx_exercise_tags_tag_id'
         },
         {
            fields: ['exercise_id', 'tag_id'],
            unique: true,
            name: 'idx_exercise_tags_unique'
         }
      ]
   });

   return ExerciseTag;
};