// migrations/XXXXXXXXXXXXXX-create-tags-and-exercise-access.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // =====================================================
    // 1. Создаем таблицу tags
    // =====================================================
    await queryInterface.createTable('tags', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      usage_count: {
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

    // Индексы для tags
    await queryInterface.addIndex('tags', ['name'], {
      unique: true,
      name: 'idx_tags_name_unique'
    });
    await queryInterface.addIndex('tags', ['usage_count'], {
      name: 'idx_tags_usage_count'
    });

    // =====================================================
    // 2. Создаем таблицу exercise_tags (связь many-to-many)
    // =====================================================
    await queryInterface.createTable('exercise_tags', {
      exercise_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'exercises',
          key: 'id'
        },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      tag_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tags',
          key: 'id'
        },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Индексы для exercise_tags
    await queryInterface.addIndex('exercise_tags', ['exercise_id'], {
      name: 'idx_exercise_tags_exercise_id'
    });
    await queryInterface.addIndex('exercise_tags', ['tag_id'], {
      name: 'idx_exercise_tags_tag_id'
    });

    // =====================================================
    // 3. Создаем таблицу exercise_access (управление доступом)
    // =====================================================
    await queryInterface.createTable('exercise_access', {
      exercise_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'exercises',
          key: 'id'
        },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      access_level: {
        type: Sequelize.ENUM('view', 'use', 'edit'),
        allowNull: false,
        defaultValue: 'view'
      },
      granted_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'revoked', 'expired'),
        allowNull: false,
        defaultValue: 'active'
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

    // Индексы для exercise_access
    await queryInterface.addIndex('exercise_access', ['exercise_id'], {
      name: 'idx_exercise_access_exercise_id'
    });
    await queryInterface.addIndex('exercise_access', ['user_id'], {
      name: 'idx_exercise_access_user_id'
    });
    await queryInterface.addIndex('exercise_access', ['status'], {
      name: 'idx_exercise_access_status'
    });
    await queryInterface.addIndex('exercise_access', ['expires_at'], {
      name: 'idx_exercise_access_expires'
    });

    // Комментарии к таблицам (опционально)
    await queryInterface.sequelize.query(`
      COMMENT ON TABLE tags IS 'Теги для упражнений';
      COMMENT ON TABLE exercise_tags IS 'Связь упражнений с тегами';
      COMMENT ON TABLE exercise_access IS 'Управление доступом к упражнениям для конкретных пользователей';
    `).catch(() => { });
  },

  async down(queryInterface, Sequelize) {
    // Удаляем таблицы в обратном порядке
    await queryInterface.dropTable('exercise_access');
    await queryInterface.dropTable('exercise_tags');
    await queryInterface.dropTable('tags');

    // Удаляем ENUM типы
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS enum_exercise_access_access_level;`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS enum_exercise_access_status;`);
  }
};