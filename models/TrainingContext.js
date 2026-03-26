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

   return TrainingContext;
};