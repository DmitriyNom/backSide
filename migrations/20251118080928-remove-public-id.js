'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Удаляем поле public_id
    await queryInterface.removeColumn('users', 'public_id');

    // Удаляем другие ненужные поля если хотите
    // await queryInterface.removeColumn('users', 'sport_specialization');
    // await queryInterface.removeColumn('users', 'training_level');
    // await queryInterface.removeColumn('users', 'allow_connections');
  },

  async down(queryInterface, Sequelize) {
    // Восстанавливаем при откате
    await queryInterface.addColumn('users', 'public_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true
    });
  }
};