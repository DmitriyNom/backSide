// migration content
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('exercises', 'shared_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Сколько пользователей имеют доступ к упражнению'
    });

    await queryInterface.addIndex('exercises', ['shared_count'], {
      name: 'idx_exercises_shared_count'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('exercises', 'idx_exercises_shared_count');
    await queryInterface.removeColumn('exercises', 'shared_count');
  }
};