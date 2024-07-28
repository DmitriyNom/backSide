const ApiError = require('../error/ApiError')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/models');

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

}

module.exports = new UserService()