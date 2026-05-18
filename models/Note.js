// models/Note.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const Note = sequelize.define("note", {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true
      },
      user_id: {
         type: DataTypes.INTEGER,
         allowNull: true, // В БД "YES"
         references: {
            model: 'users',
            key: 'id'
         }
      },
      note_group_id: {
         type: DataTypes.INTEGER,
         allowNull: true,
         references: {
            model: 'note_groups',
            key: 'id'
         }
      },
      note_name: {
         type: DataTypes.STRING,
         allowNull: true
      },
      note_description: {
         type: DataTypes.STRING,
         defaultValue: "A note without description",
         allowNull: true
      },
      note_priority: {
         type: DataTypes.INTEGER,
         defaultValue: 1,
         allowNull: true
      },
      note_expiration_date: {
         type: DataTypes.DATE,
         defaultValue: null,
         allowNull: true
      },
      note_is_completed: {
         type: DataTypes.BOOLEAN,
         defaultValue: false,
         allowNull: true
      },
      note_mark: {
         type: DataTypes.STRING,
         allowNull: true
      },
      note_type: {
         type: DataTypes.STRING, // В БД character varying, не ENUM
         defaultValue: 'personal_note',
         allowNull: true
      },
      assigned_to_user_id: {
         type: DataTypes.INTEGER,
         allowNull: true,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      assigned_to_group_id: {
         type: DataTypes.INTEGER,
         allowNull: true,
         references: {
            model: 'groups',
            key: 'id'
         }
      },
      assigned_by_user_id: {
         type: DataTypes.INTEGER,
         allowNull: true,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      planned_date: {
         type: DataTypes.DATEONLY,
         allowNull: true
      },
      planned_time: {
         type: DataTypes.TIME,
         allowNull: true
      },
      duration_minutes: {
         type: DataTypes.INTEGER,
         allowNull: true,
         validate: {
            min: 1
         }
      },
      status: {
         type: DataTypes.STRING, // В БД character varying
         defaultValue: 'active',
         allowNull: true
      },
      difficulty_rating: {
         type: DataTypes.INTEGER,
         allowNull: true,
         validate: {
            min: 1,
            max: 5
         }
      },
      submitted_at: {
         type: DataTypes.DATE,
         allowNull: true
      },
      reviewed_at: {
         type: DataTypes.DATE,
         allowNull: true
      },
      review_comment: {
         type: DataTypes.TEXT,
         allowNull: true
      },
      review_rating: {
         type: DataTypes.INTEGER,
         allowNull: true,
         validate: {
            min: 1,
            max: 5
         }
      },
      metadata: {
         type: DataTypes.JSONB,
         defaultValue: {},
         allowNull: true
      },

      bridge_type: {
         type: DataTypes.STRING(50),
         allowNull: true
      },
      bridge_id: {
         type: DataTypes.INTEGER,
         allowNull: true
      },
      bridge_metadata: {
         type: DataTypes.JSONB,
         allowNull: true
      }

   }, {
      tableName: 'notes',
      underscored: false,
      timestamps: true,
      createdAt: 'createdAt', // Точно как в БД
      updatedAt: 'updatedAt'  // Точно как в БД
   });

   return Note;
};