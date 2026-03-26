// repositories/UserRepository.js
const { User } = require('../models/legacy_models');
const { Op } = require('sequelize'); // 👈 ДОБАВЛЕНО

class UserRepository {
   async findUser(email) {
      return await User.findOne({ where: { email } });
   }

   async findUserByName(userName) {
      return await User.findOne({ where: { userName } });
   }

   async findUserById(id) {
      return await User.findOne({ where: { id } });
   }

   async getAllUsers() {
      return await User.findAll();
   }

   async createUser(user, transaction) {
      return await User.create(user, { transaction });
   }

   async updateUser(user, id, transaction = null) {
      const [updatedRowsCount, updatedRows] = await User.update(
         { ...user },
         {
            where: { id },
            returning: true,
            transaction
         }
      );

      console.log('🟡 UserRepository.updateUser - результат:');
      console.log('updatedRowsCount:', updatedRowsCount);
      console.log('updatedRows[0]:', updatedRows[0]);

      return [updatedRowsCount, updatedRows];
   }

   async deleteUser(id) {
      return await User.destroy({ where: { id } });
   }

   // 👇 НОВЫЙ МЕТОД
   async searchUsers({ query, role = null, excludeUserId = null, limit = 20, offset = 0 }) {
      console.log(`🟡 UserRepository.searchUsers: query="${query}", role=${role}, excludeUserId=${excludeUserId}`);

      try {
         const whereConditions = {
            [Op.or]: [
               { userName: { [Op.iLike]: `%${query}%` } },
               { email: { [Op.iLike]: `%${query}%` } }
            ]
         };

         if (role) {
            whereConditions.role = role;
         }

         if (excludeUserId) {
            whereConditions.id = { [Op.ne]: excludeUserId };
         }

         const users = await User.findAll({
            where: whereConditions,
            attributes: [
               'id',
               'userName',
               'email',
               'userAvatar',
               'role',
               'training_level',
               'sport_specialization',
               'birthDate',
               'allow_connections'
            ],
            limit,
            offset,
            order: [['userName', 'ASC']]
         });

         console.log(`✅ UserRepository.searchUsers: найдено ${users.length} пользователей`);
         return users;
      } catch (error) {
         console.error('🔴 Error in UserRepository.searchUsers:', error);
         throw error;
      }
   }
}

module.exports = new UserRepository();