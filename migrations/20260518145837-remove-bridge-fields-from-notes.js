// migrations/YYYYMMDDHHMMSS-remove-bridge-fields-from-notes.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем существование колонок перед удалением
    const tableInfo = await queryInterface.describeTable('notes');

    // Удаляем bridge_type, если существует
    if (tableInfo.bridge_type) {
      await queryInterface.removeColumn('notes', 'bridge_type');
      console.log('✅ Колонка bridge_type удалена из таблицы notes');
    } else {
      console.log('ℹ️ Колонка bridge_type не найдена, пропускаем');
    }

    // Удаляем bridge_id, если существует
    if (tableInfo.bridge_id) {
      await queryInterface.removeColumn('notes', 'bridge_id');
      console.log('✅ Колонка bridge_id удалена из таблицы notes');
    } else {
      console.log('ℹ️ Колонка bridge_id не найдена, пропускаем');
    }

    // Удаляем bridge_metadata, если существует
    if (tableInfo.bridge_metadata) {
      await queryInterface.removeColumn('notes', 'bridge_metadata');
      console.log('✅ Колонка bridge_metadata удалена из таблицы notes');
    } else {
      console.log('ℹ️ Колонка bridge_metadata не найдена, пропускаем');
    }

    // Удаляем индекс, если существует
    try {
      await queryInterface.removeIndex('notes', 'idx_notes_bridge');
      console.log('✅ Индекс idx_notes_bridge удален');
    } catch (err) {
      console.log('ℹ️ Индекс idx_notes_bridge не найден, пропускаем');
    }
  },

  async down(queryInterface, Sequelize) {
    // Восстановление (на случай отката миграции)
    await queryInterface.addColumn('notes', 'bridge_type', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    await queryInterface.addColumn('notes', 'bridge_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('notes', 'bridge_metadata', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    await queryInterface.addIndex('notes', ['bridge_type', 'bridge_id'], {
      name: 'idx_notes_bridge'
    });

    console.log('✅ Миграция откачена: bridge-поля восстановлены');
  }
};