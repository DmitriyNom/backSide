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

      console.log('🟡 UserService.updateUser - входные данные:');
      console.log('Пользователь ID:', id);
      console.log('Данные для обновления:', JSON.stringify(user, null, 2));
      console.log('Транзакция:', !!transaction);

      // Проверяем существование пользователя
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
         // Выполняем обновление
         const [updatedRowsCount, updatedRows] = await UserRepository.updateUser(user, id, transaction);

         console.log('🟡 UserService.updateUser - результат обновления:');
         console.log('updatedRowsCount:', updatedRowsCount);
         console.log('updatedRows[0]:', updatedRows[0]);

         if (updatedRowsCount === 0) {
            console.error('🔴 Обновление не затронуло ни одной строки');
            throw new Error('Пользователь не был обновлен');
         }

         // ✅ ВОЗВРАЩАЕМ ОБНОВЛЕННЫЕ ДАННЫЕ ИЗ updatedRows
         // Sequelize возвращает массив экземпляров
         const updatedUser = updatedRows[0];

         // Преобразуем в простой объект для избежания проблем с Sequelize
         const result = updatedUser.get ? updatedUser.get({ plain: true }) : updatedUser;

         console.log('🟡 UserService.updateUser - возвращаем данные:');
         console.log('userName в результате:', result.userName);
         console.log('birthDate в результате:', result.birthDate);
         console.log('Полный результат:', JSON.stringify(result, null, 2));

         return result;

      } catch (error) {
         console.error('🔴 Ошибка при обновлении пользователя:', error);
         console.error('Стек ошибки:', error.stack);
         throw new Error(`Не удалось обновить пользователя: ${error.message}`);
      }
   }

   async deleteUser(id) {
      const result = await UserRepository.deleteUser(id);
      return result;
   }
}

module.exports = new UserService();
