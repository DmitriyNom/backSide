// models/Media.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const Media = sequelize.define('Media', {
      id: {
         type: DataTypes.UUID,
         defaultValue: DataTypes.UUIDV4,
         primaryKey: true
      },
      user_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      original_filename: {
         type: DataTypes.STRING(500),
         allowNull: false
      },
      storage_url: {
         type: DataTypes.TEXT,
         allowNull: false
      },
      file_type: {
         type: DataTypes.ENUM('photo', 'video'),
         allowNull: false
      },
      mime_type: {
         type: DataTypes.STRING(100),
         allowNull: false
      },
      size: {
         type: DataTypes.INTEGER,
         allowNull: false
      },
      duration: {
         type: DataTypes.INTEGER,
         allowNull: true
      },
      thumbnail_url: {
         type: DataTypes.TEXT,
         allowNull: true
      },
      metadata: {
         type: DataTypes.JSONB,
         defaultValue: {}
      },
      privacy: {
         type: DataTypes.ENUM('private', 'public'),
         defaultValue: 'private'
      },
      allow_reshare: {
         type: DataTypes.BOOLEAN,
         defaultValue: true
      },
      source_type: {
         type: DataTypes.ENUM('original', 'shared'),
         defaultValue: 'original'
      },
      original_media_id: {
         type: DataTypes.UUID,
         allowNull: true,
         references: {
            model: 'media',
            key: 'id'
         }
      },
      shared_count: {
         type: DataTypes.INTEGER,
         defaultValue: 0
      },
      uploaded_at: {
         type: DataTypes.DATE,
         defaultValue: DataTypes.NOW
      },
      shared_with_friends: {
         type: DataTypes.BOOLEAN,
         defaultValue: false
      },
      shared_with_trainees: {
         type: DataTypes.BOOLEAN,
         defaultValue: false
      },
      default_access_level: {
         type: DataTypes.ENUM('view', 'download'),
         defaultValue: 'view'
      }
   }, {
      tableName: 'media',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
   });

   return Media;
};