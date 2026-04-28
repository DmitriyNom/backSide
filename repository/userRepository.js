// repositories/UserRepository.js
const { User } = require('../models');
const { Op } = require('sequelize');

class UserRepository {
   constructor() {
      console.log('✅ UserRepository initialized, User model exists:', !!User);
      if (!User) {
         console.error('❌ CRITICAL: User model is undefined!');
      }
   }

   async findUser(email) {
      try {
         return await User.findOne({
            where: { email },
            attributes: ['id', 'userName', 'email', 'password', 'role', 'userAvatar', 'training_level', 'sport_specialization', 'birthDate', 'allow_connections']
         });
      } catch (error) {
         console.error('🔴 Error in findUser:', error);
         throw error;
      }
   }

   async findUserByName(userName) {
      try {
         return await User.findOne({
            where: { userName },
            attributes: ['id', 'userName', 'email', 'password', 'role', 'userAvatar', 'training_level', 'sport_specialization', 'birthDate', 'allow_connections']
         });
      } catch (error) {
         console.error('🔴 Error in findUserByName:', error);
         throw error;
      }
   }

   async findUserById(id) {
      try {
         return await User.findOne({
            where: { id },
            attributes: ['id', 'userName', 'email', 'role', 'userAvatar', 'training_level', 'sport_specialization', 'birthDate', 'allow_connections']
         });
      } catch (error) {
         console.error('🔴 Error in findUserById:', error);
         throw error;
      }
   }

   async getAllUsers() {
      try {
         return await User.findAll({
            attributes: ['id', 'userName', 'email', 'role', 'userAvatar', 'training_level', 'sport_specialization', 'birthDate', 'allow_connections']
         });
      } catch (error) {
         console.error('🔴 Error in getAllUsers:', error);
         throw error;
      }
   }

   async createUser(user, transaction) {
      try {
         return await User.create(user, { transaction });
      } catch (error) {
         console.error('🔴 Error in createUser:', error);
         throw error;
      }
   }

   async updateUser(user, id, transaction = null) {
      try {
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
         if (updatedRows && updatedRows[0]) {
            console.log('updatedRows[0]:', updatedRows[0].toJSON ? updatedRows[0].toJSON() : updatedRows[0]);
         }

         return [updatedRowsCount, updatedRows];
      } catch (error) {
         console.error('🔴 Error in updateUser:', error);
         throw error;
      }
   }

   async deleteUser(id) {
      try {
         return await User.destroy({ where: { id } });
      } catch (error) {
         console.error('🔴 Error in deleteUser:', error);
         throw error;
      }
   }

   /**
    * Поиск пользователей по запросу
    */
   async searchUsers({ query, role = null, excludeUserId = null, limit = 20, offset = 0 }) {
      console.log(`🟡 UserRepository.searchUsers: query="${query}", role=${role}, excludeUserId=${excludeUserId}`);

      try {
         if (!query || query.trim().length < 2) {
            console.log('🟡 Поисковый запрос слишком короткий');
            return [];
         }

         const whereConditions = {
            [Op.or]: [
               { userName: { [Op.iLike]: `%${query}%` } },
               { email: { [Op.iLike]: `%${query}%` } },
               { firstName: { [Op.iLike]: `%${query}%` } },
               { lastName: { [Op.iLike]: `%${query}%` } }
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
               'id', 'userName', 'firstName', 'lastName', 'email', 'userAvatar', 'role',
               'training_level', 'sport_specialization', 'birthDate', 'allow_connections',
               'height', 'weight', 'position', 'country', 'city', 'teamName'
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['userName', 'ASC']]
         });

         console.log(`✅ UserRepository.searchUsers: найдено ${users.length} пользователей`);
         return users;
      } catch (error) {
         console.error('🔴 Error in UserRepository.searchUsers:', error);
         throw error;
      }
   }

   /**
    * Найти пользователя по ID
    */
   async findById(userId) {
      try {
         if (!userId) {
            console.error('❌ findById: userId is required');
            return null;
         }

         const id = parseInt(userId);
         if (isNaN(id)) {
            console.error('❌ findById: invalid userId:', userId);
            return null;
         }

         const user = await User.findByPk(id, {
            attributes: [
               'id', 'userName', 'firstName', 'lastName', 'email', 'userAvatar', 'role',
               'training_level', 'sport_specialization', 'birthDate', 'allow_connections',
               'height', 'weight', 'position', 'country', 'city', 'teamName'
            ]
         });

         if (!user) {
            console.log(`🟡 Пользователь с ID ${id} не найден`);
         }

         return user;
      } catch (error) {
         console.error('🔴 Error in findById:', error);
         throw error;
      }
   }

   /**
    * Найти пользователей по списку ID
    */
   async findByIds(userIds) {
      try {
         if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            console.log('🟡 findByIds: пустой массив userIds');
            return [];
         }

         const users = await User.findAll({
            where: {
               id: userIds
            },
            attributes: [
               'id', 'userName', 'firstName', 'lastName', 'email', 'userAvatar', 'role',
               'training_level', 'sport_specialization', 'birthDate', 'allow_connections'
            ]
         });

         console.log(`✅ findByIds: найдено ${users.length} пользователей из ${userIds.length} запрошенных`);
         return users;
      } catch (error) {
         console.error('🔴 Error in findByIds:', error);
         throw error;
      }
   }

   /**
    * Найти пользователей по роли
    */
   async findByRole(role, options = { limit: 50, offset: 0 }) {
      try {
         if (!role) {
            console.error('❌ findByRole: role is required');
            return [];
         }

         const users = await User.findAll({
            where: { role },
            attributes: [
               'id', 'userName', 'firstName', 'lastName', 'email', 'userAvatar', 'role',
               'training_level', 'sport_specialization', 'birthDate'
            ],
            limit: options.limit,
            offset: options.offset,
            order: [['userName', 'ASC']]
         });

         console.log(`✅ findByRole: найдено ${users.length} пользователей с ролью ${role}`);
         return users;
      } catch (error) {
         console.error('🔴 Error in findByRole:', error);
         throw error;
      }
   }

   /**
    * Получить статистику по пользователям
    */
   async getStats() {
      try {
         const totalUsers = await User.count();
         const trainers = await User.count({ where: { role: 'trainer' } });
         const trainees = await User.count({ where: { role: 'trainee' } });
         const skipped = await User.count({ where: { role: 'skipped' } });

         return {
            total: totalUsers,
            trainers,
            trainees,
            skipped
         };
      } catch (error) {
         console.error('🔴 Error in getStats:', error);
         throw error;
      }
   }
}

module.exports = new UserRepository();