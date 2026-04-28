// migrations/XXXXXXXXXXXXXX-recreate-exercises-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Удаляем старые foreign keys (если есть)
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS exercise_media DROP CONSTRAINT IF EXISTS exercise_media_exercise_id_fkey;
    `);

    // 2. Удаляем старую таблицу exercises
    await queryInterface.dropTable('exercises');

    // 3. Создаем новую таблицу exercises
    await queryInterface.createTable('exercises', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      source_exercise_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'exercises',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      copy_count: {
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

    // 4. Добавляем индексы
    await queryInterface.addIndex('exercises', ['user_id'], {
      name: 'idx_exercises_user_id'
    });
    await queryInterface.addIndex('exercises', ['is_public'], {
      name: 'idx_exercises_is_public'
    });
    await queryInterface.addIndex('exercises', ['source_exercise_id'], {
      name: 'idx_exercises_source'
    });
    await queryInterface.addIndex('exercises', ['created_at'], {
      name: 'idx_exercises_created_at'
    });

    // 5. Восстанавливаем foreign key для exercise_media
    await queryInterface.sequelize.query(`
      ALTER TABLE exercise_media 
      ADD CONSTRAINT exercise_media_exercise_id_fkey 
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Откат миграции
    await queryInterface.sequelize.query(`
      ALTER TABLE exercise_media DROP CONSTRAINT IF EXISTS exercise_media_exercise_id_fkey;
    `);
    await queryInterface.dropTable('exercises');
    await queryInterface.createTable('exercises', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      exercise_name: {
        type: Sequelize.STRING(255),
        unique: true
      },
      exercise_description: {
        type: Sequelize.STRING(255),
        defaultValue: "Exercise description"
      },
      exercise_media: {
        type: Sequelize.STRING(255)
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' }
      },
      exercise_group_id: {
        type: Sequelize.INTEGER,
        references: { model: 'exerciseGroups', key: 'id' }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  }
};