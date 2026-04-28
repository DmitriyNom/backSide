// migrations/XXXXXXXXXXXXXX-add-order-index-to-exercise-media.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем колонку order_index
    await queryInterface.addColumn('exercise_media', 'order_index', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // Добавляем индекс для сортировки
    await queryInterface.addIndex('exercise_media', ['exercise_id', 'order_index'], {
      name: 'idx_exercise_media_order'
    });

    // Добавляем комментарий (опционально, если БД поддерживает)
    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN exercise_media.order_index IS 'Порядок отображения медиа в упражнении (0, 1, 2...)'
    `).catch(() => { }); // игнорируем ошибку, если комментарии не поддерживаются
  },

  async down(queryInterface, Sequelize) {
    // Удаляем индекс
    await queryInterface.removeIndex('exercise_media', 'idx_exercise_media_order');

    // Удаляем колонку
    await queryInterface.removeColumn('exercise_media', 'order_index');
  }
};