// 📁 migrations/XXXXXXXXXXXXXX-set-existing-users-role-null.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Устанавливаем role = NULL для всех существующих пользователей
    await queryInterface.sequelize.query(`
      UPDATE users SET role = NULL WHERE role IS NOT NULL
    `);

    console.log('✅ Существующим пользователям установлена role = NULL');
  },

  async down(queryInterface, Sequelize) {
    // Откат - устанавливаем роль обратно
    await queryInterface.sequelize.query(`
      UPDATE users SET role = 'trainee' WHERE role IS NULL
    `);
  }
};