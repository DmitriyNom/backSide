


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