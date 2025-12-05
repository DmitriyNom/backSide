// 📁 migrations/XXXXXXXXXXXXXX-update-user-role-allow-null.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Изменяем поле role чтобы allowNull: true и убираем defaultValue
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('trainee', 'trainer'),
      allowNull: true,
      defaultValue: null // Явно убираем значение по умолчанию
    });

    console.log('✅ Миграция: поле role обновлено - allowNull: true');
  },

  async down(queryInterface, Sequelize) {
    // Откат миграции (если нужно)
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('trainee', 'trainer'),
      allowNull: false,
      defaultValue: 'trainee' // или какое было значение
    });
  }
};