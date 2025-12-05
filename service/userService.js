const ApiError = require('../error/ApiError');
const path = require('path');
const fs = require('fs');
const UserRepository = require('../repository/userRepository');

class UserService {
   async findUser(email) {
      return await UserRepository.findUser(email);
   }

   async findUserById(id) {
      return await UserRepository.findUserById(id)
   }

   async findUserByName(name) {
      return await UserRepository.findUserByName(name)
   }

   async getAllUsers() {
      return await UserRepository.getAllUsers();
   }

   async createUser(user, transaction) {
      return await UserRepository.createUser(user, transaction);
   }

   async updateUser(user, id, transaction = null) {
      if (!user || typeof user !== 'object') {
         throw new Error('Некорректные данные для обновления пользователя.');
      }

      const existingUser = await UserRepository.findUserById(id);
      if (!existingUser) {
         throw ApiError.notFound('Пользователь с таким id не найден.');
      }

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

         if (updatedRowsCount === 0) {
            throw new Error('Пользователь не был обновлен');
         }

         // Получаем обновленного пользователя
         const updatedUser = await UserRepository.findUserById(id);
         return updatedUser;
      } catch (error) {
         console.error('Ошибка при обновлении пользователя:', error);
         throw new Error('Не удалось обновить пользователя из-за внутренней ошибки.');
      }
   }


   async deleteUser(id) {
      const result = await UserRepository.deleteUser(id);
      return result;
   }
}

module.exports = new UserService();
