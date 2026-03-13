// models/UserConnection.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const UserConnection = sequelize.define('user_connection', {
      trainer_id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      trainee_id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      connected_at: {
         type: DataTypes.DATE,
         defaultValue: DataTypes.NOW
      }
   }, {
      tableName: 'user_connections',
      underscored: true,
      timestamps: false
   });

   return UserConnection;
};