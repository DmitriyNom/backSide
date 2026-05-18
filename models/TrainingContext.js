const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const TrainingContext = sequelize.define('training_context', {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true
      },
      friend_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'friends',
            key: 'id'
         }
      },
      sport: {
         type: DataTypes.STRING(100),
         allowNull: false,
         comment: 'Вид спорта'
      },
      trainer_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      trainee_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      status: {
         type: DataTypes.ENUM('active', 'paused', 'ended'),
         defaultValue: 'active'
      },
      start_date: {
         type: DataTypes.DATE,
         defaultValue: DataTypes.NOW
      },
      end_date: {
         type: DataTypes.DATE,
         allowNull: true
      }
   }, {
      tableName: 'training_contexts',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
   });

   // ✅ АССОЦИАЦИИ (добавляем этот блок)
   TrainingContext.associate = function (models) {
      // Связь с User как тренер
      TrainingContext.belongsTo(models.User, {
         foreignKey: 'trainer_id',
         as: 'trainer'
      });

      // Связь с User как ученик
      TrainingContext.belongsTo(models.User, {
         foreignKey: 'trainee_id',
         as: 'trainee'
      });

      // Связь с Friend
      TrainingContext.belongsTo(models.Friend, {
         foreignKey: 'friend_id',
         as: 'friendship'
      });

      // Связь с Task (один ко многим)
      TrainingContext.hasMany(models.Task, {
         foreignKey: 'context_id',
         as: 'tasks'
      });
   };

   return TrainingContext;
};