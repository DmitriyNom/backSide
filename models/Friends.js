const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const Friend = sequelize.define('friend', {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true
      },
      user_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      friend_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      status: {
         type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'blocked'),
         defaultValue: 'pending'
      },
      message: {  // ✅ НОВОЕ ПОЛЕ
         type: DataTypes.TEXT,
         allowNull: true,
         comment: 'Сообщение к запросу в друзья'
      },
      acted_at: {
         type: DataTypes.DATE,
         allowNull: true,
         comment: 'Когда был последний action (accept/reject/block)'
      }
   }, {
      tableName: 'friends',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
   });

   return Friend;
};