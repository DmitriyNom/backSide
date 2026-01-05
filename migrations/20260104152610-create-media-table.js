'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('media', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
      original_filename: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      storage_url: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      file_type: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      thumbnail_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      privacy: {
        type: Sequelize.STRING(10),
        defaultValue: 'private'
      },
      allow_reshare: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      source_type: {
        type: Sequelize.STRING(10),
        defaultValue: 'original'
      },
      original_media_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'media',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      shared_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      uploaded_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
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

    // Создаем индексы
    await queryInterface.addIndex('media', ['user_id']);
    await queryInterface.addIndex('media', ['privacy']);
    await queryInterface.addIndex('media', ['file_type']);
    await queryInterface.addIndex('media', ['created_at']);
    await queryInterface.addIndex('media', ['original_media_id']);

    // Частичный индекс для публичных медиа
    await queryInterface.addIndex('media', ['privacy'], {
      where: { privacy: 'public' }
    });

    // Добавляем CHECK constraints для валидации (опционально)
    await queryInterface.sequelize.query(`
      ALTER TABLE media 
      ADD CONSTRAINT check_file_type 
      CHECK (file_type IN ('photo', 'video'));
      
      ALTER TABLE media 
      ADD CONSTRAINT check_privacy 
      CHECK (privacy IN ('private', 'public'));
      
      ALTER TABLE media 
      ADD CONSTRAINT check_source_type 
      CHECK (source_type IN ('original', 'shared'));
    `);
  },

  async down(queryInterface, Sequelize) {
    // Удаляем CHECK constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE media DROP CONSTRAINT IF EXISTS check_file_type;
      ALTER TABLE media DROP CONSTRAINT IF EXISTS check_privacy;
      ALTER TABLE media DROP CONSTRAINT IF EXISTS check_source_type;
    `);

    await queryInterface.dropTable('media');
  }
};