/**
 * ФАЙЛ ДЛЯ УСТАНОВКИ ВСЕХ АССОЦИАЦИЙ МЕЖДУ МОДЕЛЯМИ
 * Вызывается из index.js после загрузки всех моделей
 * 
 * @param {Object} db - объект со всеми загруженными моделями
 */

function setupAssociations(db) {
   console.log('\n🔄 ===== НАЧАЛО SETUP_ASSOCIATIONS =====');
   console.log('📦 Полученные модели:', Object.keys(db));

   // ========== УЛУЧШЕННАЯ ПРОВЕРКА МОДЕЛЕЙ ==========
   console.log('\n=== ПРОВЕРКА МОДЕЛЕЙ ===');
   console.log('Доступные модели в db:', Object.keys(db));

   // Маппинг имен: как мы ищем -> как модель называется в db
   const modelMapping = {
      'User': 'User',
      'Group': 'group',
      'GroupMember': 'group_member',
      'Note': 'note',
      'Exercise': 'Exercise',
      'ExerciseGroup': 'ExerciseGroup',
      'NoteGroup': 'noteGroup',
      'RefreshToken': 'refreshToken',
      'Media': 'Media',
      'MediaAccessGrant': 'media_access_grant',
      'Friend': 'friend',
      'TrainingContext': 'training_context',
      'Tag': 'Tag',
      'ExerciseTag': 'ExerciseTag',
      'ExerciseMedia': 'ExerciseMedia',
      'ExerciseAccess': 'ExerciseAccess',
      'Task': 'Task',
      'TaskMedia': 'TaskMedia'
   };

   // Проверяем каждую модель
   Object.entries(modelMapping).forEach(([logName, dbName]) => {
      console.log(`${logName}: ${db[dbName] ? '✅' : '❌'} (ищется как ${dbName})`);
   });
   console.log('========================\n');

   // Получаем модели по правильным именам (с учетом регистра)
   const User = db.User;
   const Group = db.group;
   const GroupMember = db.group_member;
   const Note = db.note;
   const Exercise = db.Exercise;
   const ExerciseGroup = db.ExerciseGroup;
   const NoteGroup = db.noteGroup;
   const RefreshToken = db.refreshToken;
   const Media = db.Media;
   const MediaAccessGrant = db.media_access_grant;
   const Friend = db.friend;
   const TrainingContext = db.training_context;
   const Tag = db.Tag;
   const ExerciseTag = db.ExerciseTag;
   const ExerciseMedia = db.ExerciseMedia;
   const ExerciseAccess = db.ExerciseAccess;
   // НОВЫЕ МОДЕЛИ
   const Task = db.Task;
   const TaskMedia = db.TaskMedia;

   // Проверяем, что все необходимые модели загружены
   const requiredModels = {
      User, Group, GroupMember, Note, Exercise,
      ExerciseGroup, NoteGroup, RefreshToken, Media,
      MediaAccessGrant,
      Tag, ExerciseTag, ExerciseMedia, ExerciseAccess
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

      // НОВЫЕ СВЯЗИ: пользователь может выдавать доступ к упражнениям
      User.hasMany(ExerciseAccess, { foreignKey: 'granted_by', as: 'grantedExerciseAccess' });
      User.hasMany(ExerciseAccess, { foreignKey: 'user_id', as: 'receivedExerciseAccess' });

      // ==================== НОВЫЕ СВЯЗИ ДЛЯ USER → TASK (ЭТАП 5) ====================
      if (Task) {
         // Задания, где пользователь — спортсмен (кому назначено)
         User.hasMany(Task, {
            foreignKey: 'user_id',
            as: 'assigned_tasks',
            onDelete: 'CASCADE'
         });

         // Задания, где пользователь — тренер (кто назначил)
         User.hasMany(Task, {
            foreignKey: 'assigned_by_user_id',
            as: 'created_tasks',
            onDelete: 'CASCADE'
         });
         console.log('✅ User → Task associations added');
      } else {
         console.log('⚠ Task не загружена, пропускаем ассоциации User→Task');
      }

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

      // ==================== ОБНОВЛЕННЫЕ СВЯЗИ ДЛЯ EXERCISE ====================
      // Основные связи
      Exercise.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
      Exercise.belongsTo(Exercise, { foreignKey: 'source_exercise_id', as: 'source' });
      Exercise.hasMany(Exercise, { foreignKey: 'source_exercise_id', as: 'copies' });

      // ❌ ЛЕГАСИ-СВЯЗЬ УДАЛЕНА: Exercise.belongsTo(ExerciseGroup, { foreignKey: 'exercise_group_id', as: 'group' });

      // ==================== НОВЫЕ СВЯЗИ ДЛЯ EXERCISE → TASK (ЭТАП 5) ====================
      if (Task) {
         // У упражнения может быть много заданий
         Exercise.hasMany(Task, {
            foreignKey: 'exercise_id',
            as: 'tasks',
            onDelete: 'SET NULL'
         });
         console.log('✅ Exercise → Task associations added');
      }

      // Связь с медиа через exercise_media
      if (ExerciseMedia && Media) {
         Exercise.belongsToMany(Media, {
            through: ExerciseMedia,
            foreignKey: 'exercise_id',
            otherKey: 'media_id',
            as: 'media'
         });

         Media.belongsToMany(Exercise, {
            through: ExerciseMedia,
            foreignKey: 'media_id',
            otherKey: 'exercise_id',
            as: 'exercises'
         });

         // ✅ ПРЯМЫЕ СВЯЗИ ДЛЯ ExerciseMedia
         ExerciseMedia.belongsTo(Media, {
            foreignKey: 'media_id',
            as: 'media'
         });

         ExerciseMedia.belongsTo(Exercise, {
            foreignKey: 'exercise_id',
            as: 'exercise'
         });

         Media.hasMany(ExerciseMedia, {
            foreignKey: 'media_id',
            as: 'exerciseMedia'
         });

         Exercise.hasMany(ExerciseMedia, {
            foreignKey: 'exercise_id',
            as: 'exerciseMedia'
         });

         console.log('✅ ExerciseMedia associations added');
      } else {
         console.log('⚠ ExerciseMedia или Media не загружены');
      }

      // Связь с тегами через exercise_tags
      if (Tag && ExerciseTag) {
         Exercise.belongsToMany(Tag, {
            through: ExerciseTag,
            foreignKey: 'exercise_id',
            otherKey: 'tag_id',
            as: 'tags'
         });

         Tag.belongsToMany(Exercise, {
            through: ExerciseTag,
            foreignKey: 'tag_id',
            otherKey: 'exercise_id',
            as: 'exercises'
         });

         // ✅ ПРЯМЫЕ СВЯЗИ ДЛЯ ExerciseTag (ИСПРАВЛЯЕТ ОШИБКУ)
         ExerciseTag.belongsTo(Tag, {
            foreignKey: 'tag_id',
            as: 'tag'
         });

         ExerciseTag.belongsTo(Exercise, {
            foreignKey: 'exercise_id',
            as: 'exercise'
         });

         Tag.hasMany(ExerciseTag, {
            foreignKey: 'tag_id',
            as: 'exerciseTags'
         });

         Exercise.hasMany(ExerciseTag, {
            foreignKey: 'exercise_id',
            as: 'exerciseTags'
         });

         console.log('✅ ExerciseTag associations added');
      } else {
         console.log('⚠ Tag или ExerciseTag не загружены');
      }

      // Связь с доступом через exercise_access
      if (ExerciseAccess) {
         Exercise.hasMany(ExerciseAccess, {
            foreignKey: 'exercise_id',
            as: 'accessGrants',
            onDelete: 'CASCADE'
         });
         ExerciseAccess.belongsTo(Exercise, { foreignKey: 'exercise_id', as: 'exercise' });
         ExerciseAccess.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
         ExerciseAccess.belongsTo(User, { foreignKey: 'granted_by', as: 'grantor' });

         console.log('✅ ExerciseAccess associations added');
      } else {
         console.log('⚠ ExerciseAccess не загружена');
      }

      // ==================== СВЯЗИ ДЛЯ EXERCISE_GROUP ====================
      // Только базовые связи для ExerciseGroup (без связи с Exercise)
      ExerciseGroup.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
      // ❌ УДАЛЕНО: ExerciseGroup.hasMany(Exercise, { foreignKey: 'exercise_group_id', onDelete: 'SET NULL' });

      // ==================== СВЯЗИ ДЛЯ REFRESH_TOKEN ====================
      RefreshToken.belongsTo(User, { foreignKey: 'userId' });

      // ==================== СВЯЗИ ДЛЯ MEDIA ====================
      Media.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
      Media.belongsTo(Media, { foreignKey: 'original_media_id', as: 'originalMedia', onDelete: 'SET NULL' });
      Media.hasMany(Media, { foreignKey: 'original_media_id', as: 'sharedCopies' });

      // Связи с упражнениями уже установлены выше через ExerciseMedia
      // Связи с заметками
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




      // ==================== СВЯЗИ ДЛЯ FRIEND ====================
      if (Friend) {
         console.log('🟢 Устанавливаем ассоциации для Friend');

         User.hasMany(Friend, { foreignKey: 'user_id', as: 'initiated_friends' });
         User.hasMany(Friend, { foreignKey: 'friend_id', as: 'received_friends' });

         Friend.belongsTo(User, { foreignKey: 'user_id', as: 'initiator' });
         Friend.belongsTo(User, { foreignKey: 'friend_id', as: 'recipient' });

         console.log('✓ Friend associations added');
      } else {
         console.log('🟡 Friend модель не загружена, пропускаем ассоциации');
      }

      // ==================== СВЯЗИ ДЛЯ TRAINING_CONTEXT ====================
      if (TrainingContext) {
         console.log('🟢 Устанавливаем ассоциации для TrainingContext');

         if (Friend) {
            TrainingContext.belongsTo(Friend, { foreignKey: 'friend_id', as: 'friendship' });
         }

         TrainingContext.belongsTo(User, { foreignKey: 'trainer_id', as: 'trainer' });
         TrainingContext.belongsTo(User, { foreignKey: 'trainee_id', as: 'trainee' });

         User.hasMany(TrainingContext, { foreignKey: 'trainer_id', as: 'trainings_as_trainer' });
         User.hasMany(TrainingContext, { foreignKey: 'trainee_id', as: 'trainings_as_trainee' });

         console.log('✓ TrainingContext associations added');
      }

      // ==================== НОВЫЕ СВЯЗИ ДЛЯ TASK (ЭТАП 5) ====================
      if (Task && User) {
         // Задание принадлежит спортсмену (кому назначено)
         Task.belongsTo(User, {
            foreignKey: 'user_id',
            as: 'assignee'
         });

         // Задание принадлежит тренеру (кто назначил)
         Task.belongsTo(User, {
            foreignKey: 'assigned_by_user_id',
            as: 'assigner'
         });
         console.log('✅ Task → User associations added');
      }

      if (Task && Exercise) {
         // Задание может быть связано с упражнением (опционально)
         Task.belongsTo(Exercise, {
            foreignKey: 'exercise_id',
            as: 'exercise'
         });
         console.log('✅ Task → Exercise associations added');
      }

      // ==================== НОВЫЕ СВЯЗИ ДЛЯ TASK_MEDIA (ЭТАП 5) ====================
      if (Task && TaskMedia && Media) {
         // Связь Task → TaskMedia (один ко многим)
         Task.hasMany(TaskMedia, {
            foreignKey: 'task_id',
            as: 'task_media_items',
            onDelete: 'CASCADE'
         });

         // Связь TaskMedia → Task
         TaskMedia.belongsTo(Task, {
            foreignKey: 'task_id',
            as: 'task'
         });

         // Связь TaskMedia → Media
         TaskMedia.belongsTo(Media, {
            foreignKey: 'media_id',
            as: 'media'
         });

         // Связь Media → TaskMedia
         Media.hasMany(TaskMedia, {
            foreignKey: 'media_id',
            as: 'task_media_items',
            onDelete: 'CASCADE'
         });

         // Связь Task → Media (через TaskMedia)
         Task.belongsToMany(Media, {
            through: TaskMedia,
            foreignKey: 'task_id',
            otherKey: 'media_id',
            as: 'media'
         });

         // Связь Media → Task (через TaskMedia)
         Media.belongsToMany(Task, {
            through: TaskMedia,
            foreignKey: 'media_id',
            otherKey: 'task_id',
            as: 'tasks'
         });

         console.log('✅ TaskMedia associations added');
      } else {
         console.log('⚠ Task, TaskMedia или Media не загружены для ассоциаций');
      }

      console.log('\n✅ Все ассоциации успешно установлены');
   } catch (error) {
      console.error('❌ Ошибка при установке ассоциаций:', error.message);
      console.error('Стек ошибки:', error.stack);
   }

   console.log('🔄 ===== КОНЕЦ SETUP_ASSOCIATIONS =====\n');
}

module.exports = setupAssociations;