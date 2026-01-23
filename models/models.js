const sequelize = require('../db');
const { DataTypes } = require('sequelize');

// const User = sequelize.define('user', {
//    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//    userName: { type: DataTypes.STRING, unique: true },
//    birthDate: { type: DataTypes.DATE, allowNull: true },
//    email: { type: DataTypes.STRING, unique: true },
//    password: { type: DataTypes.STRING, allowNull: false },
//    role: { type: DataTypes.STRING, defaultValue: "User" },
//    userAvatar: { type: DataTypes.STRING, validate: { isUrl: true }, allowNull: true }
// });


const User = sequelize.define('user', {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   userName: { type: DataTypes.STRING, unique: true },
   birthDate: { type: DataTypes.DATE, allowNull: true },
   email: { type: DataTypes.STRING, unique: true },
   password: { type: DataTypes.STRING, allowNull: false },
   role: {
      type: DataTypes.STRING, // ИЛИ DataTypes.VARCHAR(255)
      allowNull: true,
      validate: {
         isIn: [['trainee', 'trainer', 'skipped']] // Валидация на уровне модели
      }
   },
   userAvatar: {
      type: DataTypes.STRING,
      validate: { isUrl: true },
      allowNull: true
   },
   sport_specialization: {
      type: DataTypes.STRING(100),
      allowNull: true
   },
   training_level: {
      type: DataTypes.ENUM('beginner', 'amateur', 'advanced', 'professional'),
      allowNull: true
   },
   allow_connections: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
   }
});

// Добавляем новые ассоциации
const ConnectionRequest = sequelize.define('connection_request', {
   // определение модели...
});

User.hasMany(ConnectionRequest, {
   foreignKey: 'trainee_id',
   as: 'sentConnectionRequests'
});

User.hasMany(ConnectionRequest, {
   foreignKey: 'trainer_id',
   as: 'receivedConnectionRequests'
});

//-------------------------------------------------------------------------------------------------------------------------


const RefreshToken = sequelize.define('refreshToken', {
   id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
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
         model: User,
         key: 'id'
      }
   },
   expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
   },
}, {
   timestamps: true,
   createdAt: true,
   updatedAt: true,
   id: false,  // отключаем автоматическое добавление id

});

const ExerciseGroup = sequelize.define('exerciseGroup', {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   group_name: { type: DataTypes.STRING, allowNull: false },
   group_description: { type: DataTypes.STRING, allowNull: true },
   label_color: { type: DataTypes.STRING, allowNull: true, defaultValue: '#FFFFFF' },
   user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
         model: User,
         key: 'id'
      }
   }
});

const Exercise = sequelize.define('exercise', {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   exercise_name: { type: DataTypes.STRING, unique: true },
   exercise_description: { type: DataTypes.STRING, defaultValue: "Exercise description" },
   exercise_media: { type: DataTypes.STRING },
   user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
         model: User,
         key: 'id'
      }
   },
   exercise_group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
         model: ExerciseGroup,
         key: 'id'
      }
   }
});

const NoteGroup = sequelize.define('noteGroup', {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   group_name: { type: DataTypes.STRING, allowNull: false },
   group_description: { type: DataTypes.STRING, allowNull: true },
   label_color: { type: DataTypes.STRING, allowNull: true, defaultValue: '#FFFFFF' },
   user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
         model: User,
         key: 'id'
      }
   }
});

const Note = sequelize.define("note", {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
         model: User,
         key: 'id'
      }
   },
   note_group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
         model: NoteGroup,
         key: 'id'
      }
   },
   note_name: { type: DataTypes.STRING },
   note_description: { type: DataTypes.STRING, defaultValue: "A note without description" },
   note_priority: { type: DataTypes.INTEGER, defaultValue: 1 },
   note_expiration_date: { type: DataTypes.DATE, defaultValue: null },
   note_is_completed: { type: DataTypes.BOOLEAN, defaultValue: false },
   note_mark: { type: DataTypes.STRING }
});

// ==================== MEDIA MODEL ====================
const Media = sequelize.define('media', {
   id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
   },
   user_id: {
      type: DataTypes.INTEGER,  // У вас используется INTEGER для User.id
      allowNull: false,
      references: {
         model: User,
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
         model: 'media',  // Самоссылающаяся связь
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
         model: Media,
         key: 'id'
      }
   },
   grantor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
         model: User,
         key: 'id'
      }
   },
   grantee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
         model: User,
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

// Ассоциации для Media
User.hasMany(Media, {
   foreignKey: 'user_id',
   onDelete: 'CASCADE',
   as: 'media'
});
Media.belongsTo(User, {
   foreignKey: 'user_id',
   as: 'owner'
});

// Самоссылающаяся связь для репостов
Media.belongsTo(Media, {
   foreignKey: 'original_media_id',
   as: 'originalMedia',
   onDelete: 'SET NULL'
});
Media.hasMany(Media, {
   foreignKey: 'original_media_id',
   as: 'sharedCopies'
});

// Ассоциации


Media.belongsToMany(Exercise, {
   through: 'exercise_media',
   foreignKey: 'media_id',
   otherKey: 'exercise_id',
   as: 'exercises'
});
Exercise.belongsToMany(Media, {
   through: 'exercise_media',
   foreignKey: 'exercise_id',
   otherKey: 'media_id',
   as: 'media'
});


Media.belongsToMany(Note, {
   through: 'note_media',
   foreignKey: 'media_id',
   otherKey: 'note_id',
   as: 'notes'
});
Note.belongsToMany(Media, {
   through: 'note_media',
   foreignKey: 'note_id',
   otherKey: 'media_id',
   as: 'media'
});

User.hasMany(Exercise, {
   foreignKey: 'user_id',
   onDelete: 'CASCADE',
});
Exercise.belongsTo(User, {
   foreignKey: 'user_id'
});

ExerciseGroup.belongsTo(User, {
   foreignKey: 'user_id',
   onDelete: 'CASCADE',
});
User.hasMany(ExerciseGroup, {
   foreignKey: 'user_id',
   onDelete: 'CASCADE',
});

ExerciseGroup.hasMany(Exercise, {
   foreignKey: 'exercise_group_id',
   onDelete: 'SET NULL'
});
Exercise.belongsTo(ExerciseGroup, {
   foreignKey: 'exercise_group_id'
});

User.hasMany(Note, {
   foreignKey: 'user_id',
   onDelete: 'CASCADE',
});
Note.belongsTo(User, {
   foreignKey: 'user_id'
});

NoteGroup.belongsTo(User, {
   foreignKey: 'user_id',
   onDelete: 'CASCADE',
});
User.hasMany(NoteGroup, {
   foreignKey: 'user_id',
   onDelete: 'CASCADE',
});

User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

NoteGroup.hasMany(Note, {
   foreignKey: 'note_group_id',
   onDelete: 'SET NULL'
});
Note.belongsTo(NoteGroup, {
   foreignKey: 'note_group_id'
});

Media.hasMany(MediaAccessGrant, {
   foreignKey: 'media_id',
   as: 'accessGrants',
   onDelete: 'CASCADE'
});

MediaAccessGrant.belongsTo(Media, {
   foreignKey: 'media_id',
   as: 'media'
});

User.hasMany(MediaAccessGrant, {
   foreignKey: 'grantor_id',
   as: 'grantedAccesses'
});

MediaAccessGrant.belongsTo(User, {
   foreignKey: 'grantor_id',
   as: 'grantor'
});

User.hasMany(MediaAccessGrant, {
   foreignKey: 'grantee_id',
   as: 'receivedAccesses'
});

MediaAccessGrant.belongsTo(User, {
   foreignKey: 'grantee_id',
   as: 'grantee'
});

module.exports = {
   User,
   Exercise,
   ExerciseGroup,
   Note,
   NoteGroup,
   RefreshToken,
   Media,
   ConnectionRequest,
   MediaAccessGrant
}
