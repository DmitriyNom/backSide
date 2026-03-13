// models/Exercise.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const Exercise = sequelize.define('exercise', {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true
      },
      exercise_name: {
         type: DataTypes.STRING,
         unique: true
      },
      exercise_description: {
         type: DataTypes.STRING,
         defaultValue: "Exercise description"
      },
      exercise_media: {
         type: DataTypes.STRING
      },
      user_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      exercise_group_id: {
         type: DataTypes.INTEGER,
         allowNull: true,
         references: {
            model: 'exercise_groups',
            key: 'id'
         }
      }
   }, {
      tableName: 'exercises',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
   });

   return Exercise;
};