// models/associations.js

/**
 * ФАЙЛ ДЛЯ УСТАНОВКИ ВСЕХ АССОЦИАЦИЙ МЕЖДУ МОДЕЛЯМИ
 * Вызывается из index.js после загрузки всех моделей
 * 
 * @param {Object} db - объект со всеми загруженными моделями
 */

function setupAssociations(db) {
   // ========== УЛУЧШЕННАЯ ПРОВЕРКА МОДЕЛЕЙ ==========
   console.log('\n=== ПРОВЕРКА МОДЕЛЕЙ ===');
   console.log('Доступные модели в db:', Object.keys(db));

   // Маппинг имен: как мы ищем -> как модель называется в db
   const modelMapping = {
      'User': 'user',
      'Group': 'group',
      'GroupMember': 'group_member',
      'Note': 'note',
      'Exercise': 'exercise',
      'ExerciseGroup': 'exerciseGroup',
      'NoteGroup': 'noteGroup',
      'RefreshToken': 'refreshToken',
      'Media': 'media',
      'ConnectionRequest': 'connection_request',
      'MediaAccessGrant': 'media_access_grant',
      'UserConnection': 'user_connection'
   };

   // Проверяем каждую модель
   Object.entries(modelMapping).forEach(([logName, dbName]) => {
      console.log(`${logName}: ${db[dbName] ? '✅' : '❌'} (ищется как ${dbName})`);
   });
   console.log('========================\n');

   // Получаем модели по правильным именам
   const User = db.user;
   const Group = db.group;
   const GroupMember = db.group_member;
   const Note = db.note;
   const Exercise = db.exercise;
   const ExerciseGroup = db.exerciseGroup;
   const NoteGroup = db.noteGroup;
   const RefreshToken = db.refreshToken;
   const Media = db.media;
   const ConnectionRequest = db.connection_request;
   const MediaAccessGrant = db.media_access_grant;
   const UserConnection = db.user_connection;

   // Проверяем, что все необходимые модели загружены
   const requiredModels = {
      User, Group, GroupMember, Note, Exercise,
      ExerciseGroup, NoteGroup, RefreshToken, Media,
      ConnectionRequest, MediaAccessGrant, UserConnection
   };

   const missingModels = Object.entries(requiredModels)
      .filter(([name, model]) => !model)
      .map(([name]) => name);

   if (missingModels.length > 0) {
      console.error('❌ Отсутствуют модели:', missingModels.join(', '));
      console.log('Ассоциации не будут установлены');
      return;
   }

   try {
      // ==================== СВЯЗИ ДЛЯ USER ====================
      User.hasMany(Exercise, { foreignKey: 'user_id', onDelete: 'CASCADE' });
      User.hasMany(ExerciseGroup, { foreignKey: 'user_id', onDelete: 'CASCADE' });
      User.hasMany(Note, { foreignKey: 'user_id', onDelete: 'CASCADE' });
      User.hasMany(Note, { foreignKey: 'assigned_to_user_id', as: 'assignedTasks' });
      User.hasMany(Note, { foreignKey: 'assigned_by_user_id', as: 'createdTasksForOthers' });
      User.hasMany(NoteGroup, { foreignKey: 'user_id', onDelete: 'CASCADE' });
      User.hasMany(RefreshToken, { foreignKey: 'userId' });
      User.hasMany(Media, { foreignKey: 'user_id', as: 'media', onDelete: 'CASCADE' });
      User.hasMany(MediaAccessGrant, { foreignKey: 'grantor_id', as: 'grantedAccesses' });
      User.hasMany(MediaAccessGrant, { foreignKey: 'grantee_id', as: 'receivedAccesses' });
      User.hasMany(ConnectionRequest, { foreignKey: 'sender_id', as: 'sentRequests' });
      User.hasMany(ConnectionRequest, { foreignKey: 'receiver_id', as: 'receivedRequests' });

      // ==================== СВЯЗИ ДЛЯ GROUP ====================
      Group.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'creator' });
      User.hasMany(Group, { foreignKey: 'created_by_user_id', as: 'createdGroups' });

      Group.belongsToMany(User, {
         through: GroupMember,
         foreignKey: 'group_id',
         otherKey: 'user_id',
         as: 'members'
      });

      User.belongsToMany(Group, {
         through: GroupMember,
         foreignKey: 'user_id',
         otherKey: 'group_id',
         as: 'groups'
      });

      // ==================== СВЯЗИ ДЛЯ GROUP_MEMBER ====================
      Group.hasMany(GroupMember, { foreignKey: 'group_id', as: 'memberships', onDelete: 'CASCADE' });
      GroupMember.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });
      User.hasMany(GroupMember, { foreignKey: 'user_id', as: 'groupMemberships', onDelete: 'CASCADE' });
      GroupMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
      GroupMember.belongsTo(User, { foreignKey: 'joined_by_user_id', as: 'inviter' });

      // ==================== СВЯЗИ ДЛЯ NOTE ====================
      Note.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
      Note.belongsTo(User, { foreignKey: 'assigned_by_user_id', as: 'assignedBy' });
      Note.belongsTo(User, { foreignKey: 'assigned_to_user_id', as: 'assignedTo' });
      Note.belongsTo(Group, { foreignKey: 'assigned_to_group_id', as: 'assignedGroup' });
      Note.belongsTo(NoteGroup, { foreignKey: 'note_group_id' });

      // Проверяем существование таблицы note_media перед созданием связи
      try {
         Note.belongsToMany(Media, {
            through: 'note_media',
            foreignKey: 'note_id',
            otherKey: 'media_id',
            as: 'media'
         });
      } catch (e) {
         console.log('⚠ Таблица note_media не существует или не настроена');
      }

      Group.hasMany(Note, { foreignKey: 'assigned_to_group_id', as: 'groupNotes' });

      // ==================== СВЯЗИ ДЛЯ NOTE_GROUP ====================
      NoteGroup.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
      NoteGroup.hasMany(Note, { foreignKey: 'note_group_id', onDelete: 'SET NULL' });

      // ==================== СВЯЗИ ДЛЯ EXERCISE ====================
      Exercise.belongsTo(User, { foreignKey: 'user_id' });
      Exercise.belongsTo(ExerciseGroup, { foreignKey: 'exercise_group_id' });

      try {
         Exercise.belongsToMany(Media, {
            through: 'exercise_media',
            foreignKey: 'exercise_id',
            otherKey: 'media_id',
            as: 'media'
         });
      } catch (e) {
         console.log('⚠ Таблица exercise_media не существует или не настроена');
      }

      // ==================== СВЯЗИ ДЛЯ EXERCISE_GROUP ====================
      ExerciseGroup.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
      ExerciseGroup.hasMany(Exercise, { foreignKey: 'exercise_group_id', onDelete: 'SET NULL' });

      // ==================== СВЯЗИ ДЛЯ REFRESH_TOKEN ====================
      RefreshToken.belongsTo(User, { foreignKey: 'userId' });

      // ==================== СВЯЗИ ДЛЯ MEDIA ====================
      Media.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
      Media.belongsTo(Media, { foreignKey: 'original_media_id', as: 'originalMedia', onDelete: 'SET NULL' });
      Media.hasMany(Media, { foreignKey: 'original_media_id', as: 'sharedCopies' });

      try {
         Media.belongsToMany(Exercise, {
            through: 'exercise_media',
            foreignKey: 'media_id',
            otherKey: 'exercise_id',
            as: 'exercises'
         });
      } catch (e) { }

      try {
         Media.belongsToMany(Note, {
            through: 'note_media',
            foreignKey: 'media_id',
            otherKey: 'note_id',
            as: 'notes'
         });
      } catch (e) { }

      Media.hasMany(MediaAccessGrant, { foreignKey: 'media_id', as: 'accessGrants', onDelete: 'CASCADE' });

      // ==================== СВЯЗИ ДЛЯ MEDIA_ACCESS_GRANT ====================
      MediaAccessGrant.belongsTo(Media, { foreignKey: 'media_id', as: 'media' });
      MediaAccessGrant.belongsTo(User, { foreignKey: 'grantor_id', as: 'grantor' });
      MediaAccessGrant.belongsTo(User, { foreignKey: 'grantee_id', as: 'grantee' });

      // ==================== СВЯЗИ ДЛЯ CONNECTION_REQUEST ====================
      ConnectionRequest.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
      ConnectionRequest.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

      // ==================== СВЯЗИ ДЛЯ USER_CONNECTION ====================
      User.belongsToMany(User, {
         through: UserConnection,
         as: 'trainers',
         foreignKey: 'trainee_id',
         otherKey: 'trainer_id'
      });

      User.belongsToMany(User, {
         through: UserConnection,
         as: 'trainees',
         foreignKey: 'trainer_id',
         otherKey: 'trainee_id'
      });

      console.log('✓ Все ассоциации успешно установлены');
   } catch (error) {
      console.error('❌ Ошибка при установке ассоциаций:', error.message);
   }
}

module.exports = setupAssociations;