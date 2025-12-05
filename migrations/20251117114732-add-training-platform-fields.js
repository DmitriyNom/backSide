// migrations/XXXXXXXXXXXX-add-training-platform-fields.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Добавляем новые поля к users
    await queryInterface.addColumn('users', 'public_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('users', 'sport_specialization', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'training_level', {
      type: Sequelize.ENUM('beginner', 'amateur', 'advanced', 'professional'),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'allow_connections', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    // 2. Обновляем поле role
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN role SET DEFAULT 'trainee'
    `);

    // 3. Конвертируем существующие роли
    await queryInterface.sequelize.query(`
      UPDATE users SET role = 'trainee' WHERE role = 'User'
    `);

    // 4. Генерируем public_id
    await queryInterface.sequelize.query(`
      UPDATE users SET public_id = 'user_' || id WHERE public_id IS NULL
    `);

    // 5. Создаем таблицу connection_requests
    await queryInterface.createTable('connection_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      trainee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      trainer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // 6. Добавляем индексы
    await queryInterface.addIndex('connection_requests', ['trainee_id', 'trainer_id']);
    await queryInterface.addIndex('connection_requests', ['trainer_id', 'status']);
  },

  async down(queryInterface, Sequelize) {
    // Откат в обратном порядке
    await queryInterface.dropTable('connection_requests');

    await queryInterface.removeColumn('users', 'public_id');
    await queryInterface.removeColumn('users', 'sport_specialization');
    await queryInterface.removeColumn('users', 'training_level');
    await queryInterface.removeColumn('users', 'allow_connections');

    // Возвращаем старые значения role
    await queryInterface.sequelize.query(`
      UPDATE users SET role = 'User' WHERE role IN ('trainee', 'trainer')
    `);
  }
};