// migrations/XXXXXXXXXXXXXX-create-tasks-table.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Создаём ENUM для статуса
    await queryInterface.sequelize.query(`
         CREATE TYPE enum_tasks_status AS ENUM ('active', 'completed', 'archived');
      `);

    // Таблица tasks
    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      exercise_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'exercises',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assigned_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      custom_title: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      custom_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metrics: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      actual_metrics: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      felt_difficulty: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      completion_percentage: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'archived'),
        defaultValue: 'active'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      points_earned: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      order_index: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Индексы
    await queryInterface.addIndex('tasks', ['user_id']);
    await queryInterface.addIndex('tasks', ['assigned_by_user_id']);
    await queryInterface.addIndex('tasks', ['exercise_id']);
    await queryInterface.addIndex('tasks', ['status']);
    await queryInterface.addIndex('tasks', ['due_date']);
    await queryInterface.addIndex('tasks', ['user_id', 'status']);

    // Таблица task_media
    await queryInterface.createTable('task_media', {
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
      },
      media_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
      },
      order_index: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('task_media', ['task_id']);
    await queryInterface.addIndex('task_media', ['media_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('task_media');
    await queryInterface.dropTable('tasks');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS enum_tasks_status;`);
  }
};