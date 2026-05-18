// migrations/YYYYMMDDHHMMSS-add-context-id-to-tasks.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Добавляем колонку context_id
    await queryInterface.addColumn('tasks', 'context_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'training_contexts',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'Ссылка на тренировочный контекст (тренер, вид спорта)'
    });

    // 2. Добавляем индекс для оптимизации запросов
    await queryInterface.addIndex('tasks', ['context_id'], {
      name: 'idx_tasks_context_id',
      using: 'BTREE'
    });

    console.log('✅ Колонка context_id добавлена в таблицу tasks');
  },

  async down(queryInterface, Sequelize) {
    // 1. Удаляем индекс
    await queryInterface.removeIndex('tasks', 'idx_tasks_context_id');

    // 2. Удаляем колонку
    await queryInterface.removeColumn('tasks', 'context_id');

    console.log('⬇️ Миграция откачена: колонка context_id удалена');
  }
};