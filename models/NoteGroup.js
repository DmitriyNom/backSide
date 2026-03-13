// models/NoteGroup.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const NoteGroup = sequelize.define('noteGroup', {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true
      },
      group_name: {
         type: DataTypes.STRING,
         allowNull: false
      },
      group_description: {
         type: DataTypes.STRING,
         allowNull: true
      },
      label_color: {
         type: DataTypes.STRING,
         allowNull: true,
         defaultValue: '#FFFFFF'
      },
      user_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         }
      }
   }, {
      tableName: 'note_groups',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
   });

   return NoteGroup;
};