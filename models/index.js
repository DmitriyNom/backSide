// // 'use strict';

// // const fs = require('fs');
// // const path = require('path');
// // const Sequelize = require('sequelize');
// // const process = require('process');
// // const basename = path.basename(__filename);
// // const env = process.env.NODE_ENV || 'development';
// // const config = require(__dirname + '/../config/config.json')[env];
// // const db = {};

// // let sequelize;
// // if (config.use_env_variable) {
// //   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// // } else {
// //   sequelize = new Sequelize(config.database, config.username, config.password, config);
// // }

// // fs
// //   .readdirSync(__dirname)
// //   .filter(file => {
// //     return (
// //       file.indexOf('.') !== 0 &&
// //       file !== basename &&
// //       file.slice(-3) === '.js' &&
// //       file.indexOf('.test.js') === -1
// //     );
// //   })
// //   .forEach(file => {
// //     const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
// //     db[model.name] = model;
// //   });

// // Object.keys(db).forEach(modelName => {
// //   if (db[modelName].associate) {
// //     db[modelName].associate(db);
// //   }
// // });

// // db.sequelize = sequelize;
// // db.Sequelize = Sequelize;

// // module.exports = db;

// 'use strict';

// const fs = require('fs');
// const path = require('path');
// const Sequelize = require('sequelize');
// const basename = path.basename(__filename);
// const env = process.env.NODE_ENV || 'development';
// const config = require(__dirname + '/../config/config.json')[env];
// const db = {};

// let sequelize;
// if (config.use_env_variable) {
//   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   sequelize = new Sequelize(config.database, config.username, config.password, config);
// }

// // Загружаем все модели из текущей папки
// fs
//   .readdirSync(__dirname)
//   .filter(file => {
//     return (
//       file.indexOf('.') !== 0 &&
//       file !== basename &&
//       file.slice(-3) === '.js' &&
//       file !== 'associations.js' && // Исключаем associations.js
//       file !== 'legacy_models.js'    // Исключаем старый файл
//     );
//   })
//   .forEach(file => {
//     const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
//     db[model.name] = model;
//     console.log(`✓ Loaded model: ${model.name}`);
//   });

// // Устанавливаем ассоциации
// try {
//   const setupAssociations = require('./associations');
//   if (typeof setupAssociations === 'function') {
//     setupAssociations(db);
//     console.log('✓ Associations setup completed');
//   }
// } catch (error) {
//   console.log('⚠ Associations not loaded:', error.message);
// }

// db.sequelize = sequelize;
// db.Sequelize = Sequelize;

// // Выводим список загруженных моделей
// console.log('\n=== Loaded models ===');
// Object.keys(db).forEach(key => {
//   if (key !== 'sequelize' && key !== 'Sequelize') {
//     console.log(`- ${key}`);
//   }
// });
// console.log('=====================\n');

// module.exports = db;


// models/associations.js

/**
 * ФАЙЛ ДЛЯ УСТАНОВКИ ВСЕХ АССОЦИАЦИЙ МЕЖДУ МОДЕЛЯМИ
 * Вызывается из index.js после загрузки всех моделей
//  * 
//  * @param {Object} db - объект со всеми загруженными моделями
//  */

// function setupAssociations(db) {
//   // ========== УЛУЧШЕННАЯ ПРОВЕРКА МОДЕЛЕЙ ==========
//   console.log('\n=== ПРОВЕРКА МОДЕЛЕЙ ===');
//   console.log('Доступные модели в db:', Object.keys(db));

//   // Маппинг имен: как мы ищем -> как модель называется в db
//   const modelMapping = {
//     'User': 'user',
//     'Group': 'group',
//     'GroupMember': 'group_member',
//     'Note': 'note',
//     'Exercise': 'exercise',
//     'ExerciseGroup': 'exerciseGroup',
//     'NoteGroup': 'noteGroup',
//     'RefreshToken': 'refreshToken',
//     'Media': 'media',
//     'ConnectionRequest': 'connection_request',
//     'MediaAccessGrant': 'media_access_grant',
//     'UserConnection': 'user_connection',
//     // НОВЫЕ МОДЕЛИ
//     'Friend': 'friend',
//     'TrainingContext': 'training_context'
//   };

//   // Проверяем каждую модель
//   Object.entries(modelMapping).forEach(([logName, dbName]) => {
//     console.log(`${logName}: ${db[dbName] ? '✅' : '❌'} (ищется как ${dbName})`);
//   });
//   console.log('========================\n');

//   // Получаем модели по правильным именам
//   const User = db.user;
//   const Group = db.group;
//   const GroupMember = db.group_member;
//   const Note = db.note;
//   const Exercise = db.exercise;
//   const ExerciseGroup = db.exerciseGroup;
//   const NoteGroup = db.noteGroup;
//   const RefreshToken = db.refreshToken;
//   const Media = db.media;
//   const ConnectionRequest = db.connection_request;
//   const MediaAccessGrant = db.media_access_grant;
//   const UserConnection = db.user_connection;
//   // НОВЫЕ МОДЕЛИ
//   const Friend = db.friend;
//   const TrainingContext = db.training_context;

//   // Проверяем, что все необходимые модели загружены
//   const requiredModels = {
//     User, Group, GroupMember, Note, Exercise,
//     ExerciseGroup, NoteGroup, RefreshToken, Media,
//     ConnectionRequest, MediaAccessGrant, UserConnection
//     // Friend и TrainingContext не обязательны пока
//   };

//   const missingModels = Object.entries(requiredModels)
//     .filter(([name, model]) => !model)
//     .map(([name]) => name);

//   if (missingModels.length > 0) {
//     console.error('❌ Отсутствуют модели:', missingModels.join(', '));
//     console.log('Ассоциации не будут установлены');
//     return;
//   }

//   try {
//     // ==================== СВЯЗИ ДЛЯ USER ====================
//     User.hasMany(Exercise, { foreignKey: 'user_id', onDelete: 'CASCADE' });
//     User.hasMany(ExerciseGroup, { foreignKey: 'user_id', onDelete: 'CASCADE' });
//     User.hasMany(Note, { foreignKey: 'user_id', onDelete: 'CASCADE' });
//     User.hasMany(Note, { foreignKey: 'assigned_to_user_id', as: 'assignedTasks' });
//     User.hasMany(Note, { foreignKey: 'assigned_by_user_id', as: 'createdTasksForOthers' });
//     User.hasMany(NoteGroup, { foreignKey: 'user_id', onDelete: 'CASCADE' });
//     User.hasMany(RefreshToken, { foreignKey: 'userId' });
//     User.hasMany(Media, { foreignKey: 'user_id', as: 'media', onDelete: 'CASCADE' });
//     User.hasMany(MediaAccessGrant, { foreignKey: 'grantor_id', as: 'grantedAccesses' });
//     User.hasMany(MediaAccessGrant, { foreignKey: 'grantee_id', as: 'receivedAccesses' });
//     User.hasMany(ConnectionRequest, { foreignKey: 'sender_id', as: 'sentRequests' });
//     User.hasMany(ConnectionRequest, { foreignKey: 'receiver_id', as: 'receivedRequests' });

//     // ==================== СВЯЗИ ДЛЯ GROUP ====================
//     Group.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'creator' });
//     User.hasMany(Group, { foreignKey: 'created_by_user_id', as: 'createdGroups' });

//     Group.belongsToMany(User, {
//       through: GroupMember,
//       foreignKey: 'group_id',
//       otherKey: 'user_id',
//       as: 'members'
//     });

//     User.belongsToMany(Group, {
//       through: GroupMember,
//       foreignKey: 'user_id',
//       otherKey: 'group_id',
//       as: 'groups'
//     });

//     // ==================== СВЯЗИ ДЛЯ GROUP_MEMBER ====================
//     Group.hasMany(GroupMember, { foreignKey: 'group_id', as: 'memberships', onDelete: 'CASCADE' });
//     GroupMember.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });
//     User.hasMany(GroupMember, { foreignKey: 'user_id', as: 'groupMemberships', onDelete: 'CASCADE' });
//     GroupMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
//     GroupMember.belongsTo(User, { foreignKey: 'joined_by_user_id', as: 'inviter' });

//     // ==================== СВЯЗИ ДЛЯ NOTE ====================
//     Note.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
//     Note.belongsTo(User, { foreignKey: 'assigned_by_user_id', as: 'assignedBy' });
//     Note.belongsTo(User, { foreignKey: 'assigned_to_user_id', as: 'assignedTo' });
//     Note.belongsTo(Group, { foreignKey: 'assigned_to_group_id', as: 'assignedGroup' });
//     Note.belongsTo(NoteGroup, { foreignKey: 'note_group_id' });

//     // Проверяем существование таблицы note_media перед созданием связи
//     try {
//       Note.belongsToMany(Media, {
//         through: 'note_media',
//         foreignKey: 'note_id',
//         otherKey: 'media_id',
//         as: 'media'
//       });
//     } catch (e) {
//       console.log('⚠ Таблица note_media не существует или не настроена');
//     }

//     Group.hasMany(Note, { foreignKey: 'assigned_to_group_id', as: 'groupNotes' });

//     // ==================== СВЯЗИ ДЛЯ NOTE_GROUP ====================
//     NoteGroup.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
//     NoteGroup.hasMany(Note, { foreignKey: 'note_group_id', onDelete: 'SET NULL' });

//     // ==================== СВЯЗИ ДЛЯ EXERCISE ====================
//     Exercise.belongsTo(User, { foreignKey: 'user_id' });
//     Exercise.belongsTo(ExerciseGroup, { foreignKey: 'exercise_group_id' });

//     try {
//       Exercise.belongsToMany(Media, {
//         through: 'exercise_media',
//         foreignKey: 'exercise_id',
//         otherKey: 'media_id',
//         as: 'media'
//       });
//     } catch (e) {
//       console.log('⚠ Таблица exercise_media не существует или не настроена');
//     }

//     // ==================== СВЯЗИ ДЛЯ EXERCISE_GROUP ====================
//     ExerciseGroup.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
//     ExerciseGroup.hasMany(Exercise, { foreignKey: 'exercise_group_id', onDelete: 'SET NULL' });

//     // ==================== СВЯЗИ ДЛЯ REFRESH_TOKEN ====================
//     RefreshToken.belongsTo(User, { foreignKey: 'userId' });

//     // ==================== СВЯЗИ ДЛЯ MEDIA ====================
//     Media.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
//     Media.belongsTo(Media, { foreignKey: 'original_media_id', as: 'originalMedia', onDelete: 'SET NULL' });
//     Media.hasMany(Media, { foreignKey: 'original_media_id', as: 'sharedCopies' });

//     try {
//       Media.belongsToMany(Exercise, {
//         through: 'exercise_media',
//         foreignKey: 'media_id',
//         otherKey: 'exercise_id',
//         as: 'exercises'
//       });
//     } catch (e) { }

//     try {
//       Media.belongsToMany(Note, {
//         through: 'note_media',
//         foreignKey: 'media_id',
//         otherKey: 'note_id',
//         as: 'notes'
//       });
//     } catch (e) { }

//     Media.hasMany(MediaAccessGrant, { foreignKey: 'media_id', as: 'accessGrants', onDelete: 'CASCADE' });

//     // ==================== СВЯЗИ ДЛЯ MEDIA_ACCESS_GRANT ====================
//     MediaAccessGrant.belongsTo(Media, { foreignKey: 'media_id', as: 'media' });
//     MediaAccessGrant.belongsTo(User, { foreignKey: 'grantor_id', as: 'grantor' });
//     MediaAccessGrant.belongsTo(User, { foreignKey: 'grantee_id', as: 'grantee' });

//     // ==================== СВЯЗИ ДЛЯ CONNECTION_REQUEST ====================
//     ConnectionRequest.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
//     ConnectionRequest.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

//     // ==================== СВЯЗИ ДЛЯ USER_CONNECTION ====================
//     User.belongsToMany(User, {
//       through: UserConnection,
//       as: 'trainers',
//       foreignKey: 'trainee_id',
//       otherKey: 'trainer_id'
//     });

//     User.belongsToMany(User, {
//       through: UserConnection,
//       as: 'trainees',
//       foreignKey: 'trainer_id',
//       otherKey: 'trainee_id'
//     });

//     // ==================== НОВЫЕ СВЯЗИ ДЛЯ FRIEND ====================
//     if (Friend) {
//       // Связи для User -> Friend
//       User.hasMany(Friend, { foreignKey: 'user_id', as: 'initiated_friends' });
//       User.hasMany(Friend, { foreignKey: 'friend_id', as: 'received_friends' });

//       // Связи для Friend -> User
//       Friend.belongsTo(User, { foreignKey: 'user_id', as: 'initiator' });
//       Friend.belongsTo(User, { foreignKey: 'friend_id', as: 'recipient' });

//       console.log('✓ Friend associations added');
//     }

//     // ==================== НОВЫЕ СВЯЗИ ДЛЯ TRAINING_CONTEXT ====================
//     if (TrainingContext && Friend) {
//       // Связи с Friend
//       TrainingContext.belongsTo(Friend, { foreignKey: 'friend_id', as: 'friendship' });

//       // Связи с User (тренер и ученик)
//       TrainingContext.belongsTo(User, { foreignKey: 'trainer_id', as: 'trainer' });
//       TrainingContext.belongsTo(User, { foreignKey: 'trainee_id', as: 'trainee' });

//       // Обратные связи от User
//       User.hasMany(TrainingContext, { foreignKey: 'trainer_id', as: 'trainings_as_trainer' });
//       User.hasMany(TrainingContext, { foreignKey: 'trainee_id', as: 'trainings_as_trainee' });

//       console.log('✓ TrainingContext associations added');
//     }

//     console.log('✓ Все ассоциации успешно установлены');
//   } catch (error) {
//     console.error('❌ Ошибка при установке ассоциаций:', error.message);
//   }
// }

// module.exports = setupAssociations;


'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

console.log('\n🚀 ===== НАЧАЛО ЗАГРУЗКИ MODELS/INDEX.JS =====');
console.log('📁 Директория models:', __dirname);
console.log('🔧 Environment:', env);
console.log('📊 База данных:', config.database);

let sequelize;
if (config.use_env_variable) {
  console.log('🔗 Используем переменную окружения:', config.use_env_variable);
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  console.log('🔗 Подключаемся к БД:', config.database);
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Загружаем все модели из текущей папки
console.log('\n📋 Чтение файлов из папки models:');
const allFiles = fs.readdirSync(__dirname);
console.log('Все файлы в папке:', allFiles);

const modelFiles = allFiles.filter(file => {
  return (
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.slice(-3) === '.js' &&
    file !== 'associations.js' &&
    file !== 'legacy_models.js'
  );
});

console.log('📋 Файлы моделей для загрузки:', modelFiles);

if (modelFiles.length === 0) {
  console.error('❌ НЕ НАЙДЕНО ФАЙЛОВ МОДЕЛЕЙ!');
} else {
  modelFiles.forEach(file => {
    console.log(`\n   🔄 Загрузка файла: ${file}`);
    try {
      const modelPath = path.join(__dirname, file);
      console.log(`   📍 Путь: ${modelPath}`);

      const modelInit = require(modelPath);
      console.log(`   ✅ Файл загружен, тип: ${typeof modelInit}`);

      if (typeof modelInit !== 'function') {
        console.error(`   ❌ Модель не является функцией! Фактический тип: ${typeof modelInit}`);
        return;
      }

      const model = modelInit(sequelize, Sequelize.DataTypes);
      console.log(`   ✅ Модель инициализирована, имя: ${model.name}`);

      db[model.name] = model;
      console.log(`   ✅ Модель ${model.name} добавлена в db под ключом "${model.name}"`);
    } catch (error) {
      console.error(`   ❌ ОШИБКА при загрузке ${file}:`, error.message);
      console.error('   Стек ошибки:', error.stack);
    }
  });
}

console.log('\n📦 Модели ПОСЛЕ загрузки (до ассоциаций):');
const modelKeys = Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize');
if (modelKeys.length === 0) {
  console.error('❌ НЕТ ЗАГРУЖЕННЫХ МОДЕЛЕЙ!');
} else {
  modelKeys.forEach(key => {
    console.log(`   - ${key}: ${db[key] ? '✅' : '❌'}`);
  });
}

// Устанавливаем ассоциации
console.log('\n🔄 Установка ассоциаций...');
try {
  const setupAssociationsPath = path.join(__dirname, 'associations.js');
  console.log('📍 Путь к associations.js:', setupAssociationsPath);

  if (fs.existsSync(setupAssociationsPath)) {
    const setupAssociations = require(setupAssociationsPath);
    console.log(`✅ associations.js загружен, тип: ${typeof setupAssociations}`);

    if (typeof setupAssociations === 'function') {
      setupAssociations(db);
      console.log('✅ Ассоциации установлены');
    } else {
      console.error('❌ associations.js не экспортирует функцию!');
    }
  } else {
    console.error('❌ Файл associations.js не найден!');
  }
} catch (error) {
  console.error('❌ Ошибка при установке ассоциаций:', error.message);
  console.error('Стек ошибки:', error.stack);
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log('\n📦 ФИНАЛЬНЫЙ СПИСОК МОДЕЛЕЙ В db:');
const finalModelKeys = Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize');
if (finalModelKeys.length === 0) {
  console.error('❌ ИТОГО: 0 моделей загружено!');
} else {
  finalModelKeys.forEach(key => {
    console.log(`   ✅ ${key}`);
  });
  console.log(`\n✅ ИТОГО: ${finalModelKeys.length} моделей загружено`);
}

console.log('🚀 ===== КОНЕЦ ЗАГРУЗКИ MODELS/INDEX.JS =====\n');

module.exports = db;