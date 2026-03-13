// models/MediaAccessGrant.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const MediaAccessGrant = sequelize.define('media_access_grant', {
      id: {
         type: DataTypes.UUID,
         defaultValue: DataTypes.UUIDV4,
         primaryKey: true
      },
      media_id: {
         type: DataTypes.UUID,
         allowNull: false,
         references: {
            model: 'media',
            key: 'id'
         }
      },
      grantor_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      grantee_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      access_level: {
         type: DataTypes.ENUM('view', 'download', 'comment'),
         defaultValue: 'view'
      },
      expires_at: {
         type: DataTypes.DATE,
         allowNull: true
      },
      status: {
         type: DataTypes.ENUM('active', 'revoked', 'expired'),
         defaultValue: 'active'
      }
   }, {
      tableName: 'media_access_grants',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
   });

   return MediaAccessGrant;
};