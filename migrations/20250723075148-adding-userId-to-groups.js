'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем колонку user_id в таблицу exerciseGroups
    await queryInterface.addColumn('"exerciseGroups"', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // Добавляем внешний ключ для exerciseGroups.user_id -> users.id
    await queryInterface.addConstraint('"exerciseGroups"', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_exerciseGroups_user_id',
      references: {
        table: '"users"',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Добавляем колонку user_id в таблицу noteGroups
    await queryInterface.addColumn('"noteGroups"', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // Добавляем внешний ключ для noteGroups.user_id -> users.id
    await queryInterface.addConstraint('"noteGroups"', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_noteGroups_user_id',
      references: {
        table: '"users"',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем внешний ключ и колонку user_id из exerciseGroups
    await queryInterface.removeConstraint('"exerciseGroups"', 'fk_exerciseGroups_user_id');
    await queryInterface.removeColumn('"exerciseGroups"', 'user_id');

    // Удаляем внешний ключ и колонку user_id из noteGroups
    await queryInterface.removeConstraint('"noteGroups"', 'fk_noteGroups_user_id');
    await queryInterface.removeColumn('"noteGroups"', 'user_id');
  }
};
