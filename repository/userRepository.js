// repositories/UserRepository.js
const { User } = require('../models/models');

class UserRepository {
   async findUser(email) {
      return await User.findOne({ where: { email } });
   }

   async findUserByName(userName) {
      return await User.findOne({ where: { userName } });
   }

   async findUserById(id) {
      return await User.findOne({ where: id })
   }

   async getAllUsers() {
      return await User.findAll();
   }

   async createUser(user, transaction) {
      return await User.create(user, { transaction });
   }

   async updateUser(user, id, transaction = null) {
      return User.update(
         { ...user },
         {
            where: { id },
            returning: true,
            transaction // ДОБАВЛЯЕМ ПОДДЕРЖКУ ТРАНЗАКЦИЙ
         }
      );
   }

   async deleteUser(id) {
      return await User.destroy({ where: { id } });
   }

   async findUserById(id) {
      return await User.findOne({ where: { id } });
   }
}

module.exports = new UserRepository();
