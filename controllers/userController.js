const ApiError = require('../error/ApiError');
const bcrypt = require('bcryptjs');
const UserService = require('../service/userService');
const RefreshTokenService = require('../service/refreshTokenService');
const sequelize = require('../db');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken, verifyAccessToken } = require('../utils/generateJwt');

class UserController {
   async getUsers(req, res) {
      const users = await UserService.getAllUsers();
      return res.json(users);
   }

   async getProfile(req, res, next) {
      const accessToken = req.cookies.accessToken;

      if (!accessToken) {
         return next(ApiError.unauthorized('Требуется токен доступа'));
      }

      try {
         const userData = verifyAccessToken(accessToken);
         const user = await UserService.findUserById(userData.id);

         if (!user) {
            return next(ApiError.notFound('Пользователь не найден'));
         }

         return res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            userName: user.userName,
            training_level: user.training_level,
            sport_specialization: user.sport_specialization,
            birthDate: user.birthDate,
            userAvatar: user.userAvatar,
            allow_connections: user.allow_connections
         });
      } catch (error) {
         return next(error);
      }
   }

   /**
    * Поиск пользователей
    */
   async searchUsers(req, res, next) {
      try {
         const userId = req.user.id;
         const { query, role = 'all', limit = 20, offset = 0 } = req.query;

         console.log(`🟡 UserController.searchUsers: query="${query}", role=${role}, userId=${userId}`);

         // Если запрос пустой или меньше 2 символов - возвращаем пустой результат
         if (!query || query.trim().length < 2) {
            return res.json({
               success: true,
               count: 0,
               data: []
            });
         }

         const users = await UserService.searchUsers({
            query: query.trim(),
            role: role !== 'all' ? role : null,
            excludeUserId: userId,
            limit: parseInt(limit),
            offset: parseInt(offset)
         });

         console.log(`✅ UserController.searchUsers: найдено ${users.length} пользователей`);

         return res.json({
            success: true,
            count: users.length,
            data: users
         });
      } catch (e) {
         console.error('🔴 Error in searchUsers:', e);
         next(e);
      }
   }

   /**
    * Получить пользователя по ID
    */
   async getUserById(req, res, next) {
      try {
         const { id } = req.params;
         const currentUserId = req.user.id;

         // Проверяем, что ID - число
         const userId = parseInt(id);
         if (isNaN(userId)) {
            return res.status(400).json({
               success: false,
               message: 'ID пользователя должен быть числом'
            });
         }

         const user = await UserService.getUserById(userId, currentUserId);

         if (!user) {
            return res.status(404).json({
               success: false,
               message: 'Пользователь не найден'
            });
         }

         return res.json({
            success: true,
            data: user
         });
      } catch (e) {
         console.error('🔴 Error in getUserById:', e);
         next(e);
      }
   }

   /**
    * Получить пользователей по списку ID (для массовых операций)
    */
   async getUsersByIds(req, res, next) {
      try {
         const { userIds } = req.body;
         const currentUserId = req.user.id;

         if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
               success: false,
               message: 'Необходимо передать массив userIds'
            });
         }

         const users = await UserService.getUsersByIds(userIds, currentUserId);

         return res.json({
            success: true,
            count: users.length,
            data: users
         });
      } catch (e) {
         console.error('🔴 Error in getUsersByIds:', e);
         next(e);
      }
   }

   async registration(req, res, next) {
      const { email, password, role, userName } = req.body;
      if (!email || !password) {
         return next(ApiError.badRequest('Некорректный email или password'));
      }

      try {
         const result = await sequelize.transaction(async (t) => {
            const candidate = await UserService.findUser(email);
            if (candidate) {
               throw ApiError.badRequest('Пользователь с таким email уже существует');
            }

            const candidateByUserName = await UserService.findUserByName(userName);
            if (candidateByUserName) {
               throw ApiError.badRequest('Пользователь с таким userName уже существует');
            }

            const hashPassword = await bcrypt.hash(password, 5);
            const user = await UserService.createUser({ email, role, password: hashPassword, userName }, t);

            const accessToken = generateAccessToken(user.id, user.email, user.role);
            const refreshToken = generateRefreshToken(user.id, user.email, user.role);

            const decodedRefresh = jwt.decode(refreshToken);
            const tokenData = {
               token: refreshToken,
               userId: user.id,
               expiresAt: new Date(decodedRefresh.exp * 1000),
            };

            await RefreshTokenService.createToken(tokenData, t);

            res.cookie('accessToken', accessToken, {
               httpOnly: true,
               secure: process.env.NODE_ENV === 'production',
               sameSite: 'Strict',
               maxAge: 60 * 60 * 1000,
            });

            res.cookie('refreshToken', refreshToken, {
               httpOnly: true,
               secure: process.env.NODE_ENV === 'production',
               sameSite: 'Strict',
               maxAge: 30 * 24 * 60 * 60 * 1000,
            });

            return { id: user.id, email: user.email, role: user.role, userName: user.userName };
         });

         return res.json(result);
      } catch (error) {
         return next(error);
      }
   }

   async login(req, res, next) {
      try {
         const { email, password } = req.body;
         const result = await sequelize.transaction(async (t) => {
            const user = await UserService.findUser(email);
            if (!user) {
               throw ApiError.unauthorized('Пользователь не найден');
            }

            const comparePassword = bcrypt.compareSync(password, user.password);
            if (!comparePassword) {
               throw ApiError.unauthorized('Указан неверный пароль');
            }

            const accessToken = generateAccessToken(user.id, user.email, user.role);
            const refreshToken = generateRefreshToken(user.id, user.email, user.role);

            const decodedRefresh = jwt.decode(refreshToken);
            const tokenData = {
               token: refreshToken,
               userId: user.id,
               expiresAt: new Date(decodedRefresh.exp * 1000),
            };

            await RefreshTokenService.createToken(tokenData, t);

            res.cookie('accessToken', accessToken, {
               httpOnly: true,
               secure: process.env.NODE_ENV === 'production',
               sameSite: 'Strict',
               maxAge: 60 * 60 * 1000,
            });

            res.cookie('refreshToken', refreshToken, {
               httpOnly: true,
               secure: process.env.NODE_ENV === 'production',
               sameSite: 'Strict',
               maxAge: 30 * 24 * 60 * 60 * 1000,
            });

            return { id: user.id, email: user.email, role: user.role, userName: user.userName };
         });

         return res.json(result);
      } catch (error) {
         return next(error);
      }
   }

   async check(req, res, next) {
      const token = generateAccessToken(req.user.id, req.user.email, req.user.role);
      return res.json({ token });
   }

   async refresh(req, res, next) {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
         return next(ApiError.unauthorized('Refresh токен не предоставлен'));
      }

      try {
         const tokenFromDb = await RefreshTokenService.getOneToken(refreshToken);
         if (!tokenFromDb) {
            return next(ApiError.forbidden('Некорректный refresh токен'));
         }

         const userData = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
         const result = await sequelize.transaction(async (t) => {
            await RefreshTokenService.deleteOneToken(refreshToken, t);

            const newRefreshToken = generateRefreshToken(userData.id, userData.email, userData.role);
            const decodedNew = jwt.decode(newRefreshToken);

            await RefreshTokenService.createToken({
               token: newRefreshToken,
               userId: userData.id,
               expiresAt: new Date(decodedNew.exp * 1000),
            }, t);

            const accessToken = generateAccessToken(userData.id, userData.email, userData.role);

            res.cookie('accessToken', accessToken, {
               httpOnly: true,
               secure: process.env.NODE_ENV === 'production',
               sameSite: 'Strict',
               maxAge: 60 * 60 * 1000,
            });

            res.cookie('refreshToken', newRefreshToken, {
               httpOnly: true,
               secure: process.env.NODE_ENV === 'production',
               sameSite: 'Strict',
               maxAge: 30 * 24 * 60 * 60 * 1000,
            });

            return { accessToken };
         });

         return res.json(result);
      } catch (e) {
         await RefreshTokenService.deleteOneToken(refreshToken);
         return next(ApiError.forbidden('Некорректный refresh токен'));
      }
   }

   async logout(req, res, next) {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
         return next(ApiError.badRequest('Refresh токен не предоставлен'));
      }

      try {
         await sequelize.transaction(async (t) => {
            await RefreshTokenService.deleteOneToken(refreshToken, t);
         });

         res.clearCookie('accessToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
         res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });

         return res.json({ message: 'Успешный выход из системы' });
      } catch (error) {
         return next(error);
      }
   }

   async updateUser(req, res, next) {
      try {
         const user = req.body;
         const { id } = req.params;

         if (req.file) {
            user.userAvatar = req.file.filename;
         }

         const oldUser = await UserService.findUserById(id);
         const oldRole = oldUser?.role;

         const updatedUser = await UserService.updateUser(user, id);

         const newRole = updatedUser.role;

         console.log('🟡 updateUser - старая роль:', oldRole, 'новая роль:', newRole);

         if (oldRole !== newRole) {
            console.log('🟢 Роль изменилась, перевыпускаем токены');

            const accessToken = generateAccessToken(updatedUser.id, updatedUser.email, updatedUser.role);
            const refreshToken = generateRefreshToken(updatedUser.id, updatedUser.email, updatedUser.role);

            const oldRefreshToken = req.cookies.refreshToken;
            if (oldRefreshToken) {
               await RefreshTokenService.deleteOneToken(oldRefreshToken);
            }

            const decodedRefresh = jwt.decode(refreshToken);
            await RefreshTokenService.createToken({
               token: refreshToken,
               userId: updatedUser.id,
               expiresAt: new Date(decodedRefresh.exp * 1000),
            });

            res.cookie('accessToken', accessToken, {
               httpOnly: true,
               secure: process.env.NODE_ENV === 'production',
               sameSite: 'Strict',
               maxAge: 60 * 60 * 1000,
            });

            res.cookie('refreshToken', refreshToken, {
               httpOnly: true,
               secure: process.env.NODE_ENV === 'production',
               sameSite: 'Strict',
               maxAge: 30 * 24 * 60 * 60 * 1000,
            });

            console.log('✅ Новые токены установлены с ролью:', updatedUser.role);
         }

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

   async updateOnboarding(req, res, next) {
      try {
         console.log('=====================================');
         console.log('🟡 updateOnboarding - ПОЛНЫЙ req.body:', JSON.stringify(req.body, null, 2));
         console.log('=====================================');

         const {
            role,
            training_level,
            sport_specialization,
            skipped,
            userName,
            birthDate,
            allow_connections
         } = req.body;

         const userId = req.user.id;

         console.log('🟡 updateOnboarding - полученные данные:', {
            userId,
            role,
            training_level,
            sport_specialization,
            skipped,
            userName,
            birthDate,
            allow_connections
         });

         const isSkipping = skipped === true;
         const hasValidRole = role && ['trainee', 'trainer', 'skipped'].includes(role);
         const hasTrainingData = training_level || sport_specialization;

         if (!hasValidRole && !hasTrainingData && !isSkipping) {
            return next(ApiError.badRequest('Необходимо передать роль (trainee, trainer или skipped) или данные для обучения'));
         }

         const result = await sequelize.transaction(async (t) => {
            const oldUser = await UserService.findUserById(userId);
            const oldRole = oldUser?.role;

            const user = await UserService.findUserById(userId);
            if (!user) {
               throw ApiError.notFound('Пользователь не найден');
            }

            const updateData = {};
            let message = '';

            if (role) {
               updateData.role = role;
               if (role === 'skipped') {
                  message = 'Onboarding пропущен';
                  console.log('🟢 Onboarding пропущен, устанавливаем role="skipped"');
               } else {
                  message = 'Данные onboarding успешно обновлены';
                  console.log(`🟢 Onboarding завершен, роль установлена: ${role}`);
               }
            }
            else if (isSkipping) {
               updateData.role = 'skipped';
               message = 'Onboarding пропущен';
               console.log('🟢 Onboarding пропущен через skipped:true');
            }

            if (training_level) updateData.training_level = training_level;
            if (sport_specialization) updateData.sport_specialization = sport_specialization;
            if (userName !== undefined) updateData.userName = userName;
            if (birthDate !== undefined) updateData.birthDate = birthDate;
            if (allow_connections !== undefined) updateData.allow_connections = allow_connections;

            console.log('🟡 updateOnboarding - updateData для сохранения:', updateData);

            const updatedUser = await UserService.updateUser(updateData, userId, t);

            const newRole = updatedUser.role;

            console.log('🟡 updateOnboarding - старая роль:', oldRole, 'новая роль:', newRole);

            if (oldRole !== newRole) {
               console.log('🟢 Онбординг изменил роль, перевыпускаем токены');

               const accessToken = generateAccessToken(updatedUser.id, updatedUser.email, updatedUser.role);
               const refreshToken = generateRefreshToken(updatedUser.id, updatedUser.email, updatedUser.role);

               const oldRefreshToken = req.cookies.refreshToken;
               if (oldRefreshToken) {
                  await RefreshTokenService.deleteOneToken(oldRefreshToken, t);
               }

               const decodedRefresh = jwt.decode(refreshToken);
               await RefreshTokenService.createToken({
                  token: refreshToken,
                  userId: updatedUser.id,
                  expiresAt: new Date(decodedRefresh.exp * 1000),
               }, t);

               res.cookie('accessToken', accessToken, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'Strict',
                  maxAge: 60 * 60 * 1000,
               });

               res.cookie('refreshToken', refreshToken, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'Strict',
                  maxAge: 30 * 24 * 60 * 60 * 1000,
               });

               console.log('✅ Новые токены установлены с ролью:', updatedUser.role);
            }

            return {
               id: updatedUser.id,
               email: updatedUser.email,
               role: updatedUser.role,
               userName: updatedUser.userName,
               birthDate: updatedUser.birthDate,
               allow_connections: updatedUser.allow_connections,
               training_level: updatedUser.training_level,
               sport_specialization: updatedUser.sport_specialization,
               message: message,
               skipped: updatedUser.role === 'skipped'
            };
         });

         return res.json(result);
      } catch (error) {
         console.error('🔴 Error in updateOnboarding:', error);
         return next(ApiError.internal('Ошибка при обновлении данных onboarding'));
      }
   }
}

module.exports = new UserController();