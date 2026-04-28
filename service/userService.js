const ApiError = require('../error/ApiError');
const path = require('path');
const fs = require('fs');
const UserRepository = require('../repository/userRepository');

class UserService {
   async findUser(email) {
      return await UserRepository.findUser(email);
   }

   async findUserById(id) {
      return await UserRepository.findUserById(id);
   }

   async findUserByName(name) {
      return await UserRepository.findUserByName(name);
   }

   async getAllUsers() {
      return await UserRepository.getAllUsers();
   }

   async createUser(user, transaction) {
      return await UserRepository.createUser(user, transaction);
   }

   /**
    * Поиск пользователей по запросу
    * @param {Object} params - параметры поиска
    * @param {string} params.query - поисковый запрос
    * @param {string|null} params.role - фильтр по роли (trainer/trainee/null)
    * @param {number} params.excludeUserId - ID пользователя, которого нужно исключить
    * @param {number} params.limit - лимит результатов
    * @param {number} params.offset - смещение
    * @returns {Promise<Array>} - массив пользователей
    */
   async searchUsers({ query, role = null, excludeUserId = null, limit = 20, offset = 0 }) {
      console.log(`🟡 UserService.searchUsers: query="${query}", role=${role}, excludeUserId=${excludeUserId}`);

      try {
         if (!query || query.trim().length < 2) {
            console.log('🟡 Поисковый запрос слишком короткий');
            return [];
         }

         const users = await UserRepository.searchUsers({
            query: query.trim(),
            role,
            excludeUserId,
            limit: parseInt(limit),
            offset: parseInt(offset)
         });

         console.log(`✅ UserService.searchUsers: найдено ${users.length} пользователей`);
         return users;
      } catch (error) {
         console.error('🔴 Error in UserService.searchUsers:', error);
         throw error;
      }
   }

   /**
    * Получить пользователя по ID
    * @param {number} userId - ID пользователя
    * @param {number} currentUserId - ID текущего пользователя (для проверки прав)
    * @returns {Promise<Object|null>} - пользователь или null
    */
   async getUserById(userId, currentUserId) {
      try {
         const id = parseInt(userId);
         if (isNaN(id)) {
            console.error('❌ getUserById: invalid userId:', userId);
            return null;
         }

         const user = await UserRepository.findById(id);
         return user;
      } catch (error) {
         console.error('🔴 Error in getUserById:', error);
         throw error;
      }
   }

   /**
    * Получить пользователей по списку ID
    * @param {Array<number>} userIds - массив ID пользователей
    * @param {number} currentUserId - ID текущего пользователя
    * @returns {Promise<Array>} - массив пользователей
    */
   async getUsersByIds(userIds, currentUserId) {
      try {
         if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            console.log('🟡 getUsersByIds: пустой массив userIds');
            return [];
         }

         const users = await UserRepository.findByIds(userIds);
         return users;
      } catch (error) {
         console.error('🔴 Error in getUsersByIds:', error);
         throw error;
      }
   }

   /**
    * Обновление пользователя
    * @param {Object} user - данные для обновления
    * @param {number} id - ID пользователя
    * @param {Object} transaction - транзакция Sequelize (опционально)
    * @returns {Promise<Object>} - обновленный пользователь
    */
   async updateUser(user, id, transaction = null) {
      if (!user || typeof user !== 'object') {
         throw new Error('Некорректные данные для обновления пользователя.');
      }

      console.log('🟡 UserService.updateUser - входные данные:');
      console.log('Пользователь ID:', id);
      console.log('Данные для обновления:', JSON.stringify(user, null, 2));

      const existingUser = await UserRepository.findUserById(id);
      if (!existingUser) {
         console.error('🔴 Пользователь не найден, ID:', id);
         throw ApiError.notFound('Пользователь с таким id не найден.');
      }

      console.log('🟡 UserService.updateUser - текущие данные в БД:');
      console.log('userName:', existingUser.userName);
      console.log('birthDate:', existingUser.birthDate);

      // Обработка аватара (если есть)
      if (user.userAvatar && existingUser.userAvatar) {
         const oldFilePath = path.join(__dirname, '..', 'uploads', existingUser.userAvatar);
         try {
            await fs.promises.unlink(oldFilePath);
         } catch (error) {
            console.warn('Не удалось удалить старый аватар:', error);
         }
      }

      try {
         const [updatedRowsCount, updatedRows] = await UserRepository.updateUser(user, id, transaction);

         console.log('🟡 UserService.updateUser - результат обновления:');
         console.log('updatedRowsCount:', updatedRowsCount);

         if (updatedRowsCount === 0) {
            console.error('🔴 Обновление не затронуло ни одной строки');
            throw new Error('Пользователь не был обновлен');
         }

         const updatedUser = updatedRows[0];
         const result = updatedUser.get ? updatedUser.get({ plain: true }) : updatedUser;

         console.log('🟡 UserService.updateUser - возвращаем данные:');
         console.log('userName:', result.userName);
         console.log('birthDate:', result.birthDate);

         return result;
      } catch (error) {
         console.error('🔴 Ошибка при обновлении пользователя:', error);
         throw new Error(`Не удалось обновить пользователя: ${error.message}`);
      }
   }

   async deleteUser(id) {
      return await UserRepository.deleteUser(id);
   }
}

module.exports = new UserService();