const ApiError = require('../error/ApiError')
const bcrypt = require('bcrypt');
const { User } = require('../models/models');
const UserService = require('../service/userService')
const generateJwt = require('../utils/generateJwt')
const uuid = require('uuid')
// const path = require('path')


// const generateJwt = (id, email, role) => {
//    return jwt.sign(
//       { id, email, role },
//       process.env.SECRET_KEY,
//       { expiresIn: '24h' }
//    )
// }

class UserController {

   async registration(req, res, next) {

      const { email, password, role, userName } = req.body

      if (!email || !password) {
         return next(ApiError.badRequest('Некорректный email или password'))
      }

      const candidate = await UserService.findUser(email)

      if (candidate) {
         return next(ApiError.badRequest('Пользователь с таким email уже существует'))
      }

      const hashPassword = await bcrypt.hash(password, 5)
      // const user = await User.create({ email, role, password: hashPassword })
      const user = await UserService.createUser({ email, role, password: hashPassword, userName })

      const token = generateJwt(user.id, user.email, user.role)
      return res.json({ token })
   }

   async login(req, res, next) {
      const { email, password } = req.body;
      // const user = await User.findOne({ where: { email } })

      const user = await UserService.findUser(email)

      if (!user) {
         return next(ApiError.internal('Пользователь не найден'))
      }

      let comparePassword = bcrypt.compareSync(password, user.password)

      if (!comparePassword) {
         return next(ApiError.internal('Указан неверный пароль'))
      }

      const token = generateJwt(user.id, user.email, user.role)

      return res.json({ token })

   }

   async check(req, res, next) {
      const token = generateJwt(req.user.id, req.user.email, req.user.role)
      return res.json({ token })
   }

   async getUsers(req, res) {
      const users = await UserService.getAllUsers();
      return res.json(users)
   }

   // async updateUser(req, res, next) {
   //    try {
   //       const user = req.body
   //       const { userAvatar } = req.files
   //       const { id } = req.params

   //       let filename = uuid.v4() + '.jpg'

   //       if (userAvatar) {
   //          userAvatar.mv(path.resolve(__dirname, '..', 'static', filename))

   //          user.userAvatar = filename;
   //       }

   //       const updatedUser = await UserService.updateUser(user, id)

   //       return res.json(updatedUser)
   //    } catch (e) {
   //       next(ApiError.badRequest(e.message))
   //    }
   // }

   async updateUser(req, res, next) {
      try {
         const user = req.body;
         const { id } = req.params;

         if (req.file) {
            user.userAvatar = req.file.filename;
         }
         // } else {
         //    return next(ApiError.badRequest('Файл не найден.'));
         // }

         const updatedUser = await UserService.updateUser(user, id);
         return res.json(updatedUser);
      } catch (e) {
         next(ApiError.badRequest(e.message));
      }
   }

   async deleteUser(req, res) {
      const { id } = req.params;
      const deletedUser = await UserService.deleteUser(id);
      return res.json(deletedUser);
   }


   /*

   getUser
   updateUser
   deleteUser

   */

}

module.exports = new UserController()