// models/Group.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const Group = sequelize.define('group', {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true
      },
      name: {
         type: DataTypes.STRING(200),
         allowNull: false
      },
      description: {
         type: DataTypes.TEXT,
         allowNull: true
      },
      created_by_user_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      group_type: {
         type: DataTypes.ENUM('training', 'pair', 'project', 'competition'),
         defaultValue: 'training'
      },
      settings: {
         type: DataTypes.JSONB,
         defaultValue: {}
      },
      status: {
         type: DataTypes.ENUM('active', 'archived', 'deleted'),
         defaultValue: 'active'
      },
      metadata: {
         type: DataTypes.JSONB,
         defaultValue: {}
      }
   }, {
      tableName: 'groups',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
   });

   return Group;
};