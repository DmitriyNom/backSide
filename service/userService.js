const ApiError = require('../error/ApiError')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/models');
const path = require('path')
const fs = require('fs')

const generateJwt = (id, email, role) => {
   return jwt.sign(
      { id, email, role },
      process.env.SECRET_KEY,
      { expiresIn: '24h' }
   )
}

class UserService {

   async findUser(email) {
      return await User.findOne({ where: { email } })

   }

   async getAllUsers() {
      return await User.findAll()

   }

   async createUser(user) {
      return await User.create(user)
   }


   async updateUser(user, id) {
      const existingUser = await User.findOne({ where: { id } });
      if (!existingUser) {
         throw ApiError.notFound('Пользователь с таким id не найден.');
      }

      // Удаляем старый файл, если он существует
      if (existingUser.userAvatar) {
         const oldFilePath = path.join(__dirname, '..', 'uploads', existingUser.userAvatar);
         fs.unlink(oldFilePath, (err) => {
            if (err) {
               console.error('Ошибка при удалении старого файла:', err);
            }
         });
      }

      const [updatedRowsCount, updatedRows] = await User.update(
         { ...user },
         {
            where: { id },
            returning: true
         }
      )

      return updatedRows[0].dataValues
   }

   // async deleteUser(id) {
   //    await this.getOneUser(id)
   //       .then((result) => {
   //          User.destroy({ where: { id } })
   //          return result;
   //       })
   // }

   async deleteUser(id) {
      let result = await User.destroy({ where: { id } })
      return result
   }

}

module.exports = new UserService()