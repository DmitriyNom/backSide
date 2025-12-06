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
      return await User.findOne({ where: { id } }); // ✅ ИСПРАВЛЕНО
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
}

module.exports = new UserRepository();