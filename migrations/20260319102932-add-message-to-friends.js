'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('friends', 'message', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Сообщение к запросу в друзья'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('friends', 'message');
  }
};