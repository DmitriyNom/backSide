// models/GroupMember.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const GroupMember = sequelize.define('group_member', {
      group_id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         references: {
            model: 'groups',
            key: 'id'
         }
      },
      user_id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      role: {
         type: DataTypes.ENUM('admin', 'captain', 'member'),
         defaultValue: 'member'
      },
      joined_at: {
         type: DataTypes.DATE,
         defaultValue: DataTypes.NOW
      },
      joined_by_user_id: {
         type: DataTypes.INTEGER,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      status: {
         type: DataTypes.ENUM('active', 'inactive', 'banned'),
         defaultValue: 'active'
      },
      metadata: {
         type: DataTypes.JSONB,
         defaultValue: {}
      }
   }, {
      tableName: 'group_members',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
   });

   return GroupMember;
};