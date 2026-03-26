// // models/ConnectionRequest.js
// const { DataTypes } = require('sequelize');

// module.exports = (sequelize) => {
//    const ConnectionRequest = sequelize.define('connection_request', {
//       id: {
//          type: DataTypes.INTEGER,
//          primaryKey: true,
//          autoIncrement: true
//       },
//       sender_id: {
//          type: DataTypes.INTEGER,
//          allowNull: false,
//          references: {
//             model: 'users',
//             key: 'id'
//          }
//       },
//       receiver_id: {
//          type: DataTypes.INTEGER,
//          allowNull: false,
//          references: {
//             model: 'users',
//             key: 'id'
//          }
//       },
//       sender_role: {
//          type: DataTypes.ENUM('trainer', 'trainee'),
//          allowNull: false,
//          comment: 'Роль отправителя на момент создания запроса'
//       },
//       status: {
//          type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled'),
//          defaultValue: 'pending'
//       },
//       message: {
//          type: DataTypes.TEXT,
//          allowNull: true
//       }
//    }, {
//       tableName: 'connection_requests',
//       underscored: true,
//       timestamps: true,
//       createdAt: 'created_at',
//       updatedAt: 'updated_at'
//    });

//    return ConnectionRequest;
// };


// models/ConnectionRequest.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
   const ConnectionRequest = sequelize.define('connection_request', {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true
      },
      sender_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      receiver_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'users',
            key: 'id'
         }
      },
      status: {
         type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled'),
         defaultValue: 'pending'
      },
      message: {
         type: DataTypes.TEXT,
         allowNull: true
      }
   }, {
      tableName: 'connection_requests',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
   });

   return ConnectionRequest;
};