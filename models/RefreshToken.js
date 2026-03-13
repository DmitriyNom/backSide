// models/RefreshToken.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const RefreshToken = sequelize.define('refreshToken', {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true
      },
      token: {
         type: DataTypes.STRING,
         allowNull: false,
         unique: true,
      },
      userId: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      expiresAt: {
         type: DataTypes.DATE,
         allowNull: false,
      }
   }, {
      tableName: 'refresh_tokens',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
   });

   return RefreshToken;
};