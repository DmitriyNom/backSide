const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt');
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

   async updateOnboarding(req, res, next) {
      try {
         console.log('=====================================');
         console.log('🟡 updateOnboarding - ПОЛНЫЙ req.body:', JSON.stringify(req.body, null, 2));
         console.log('=====================================');

         // ✅ ДОБАВЬ ВСЕ ПОЛЯ В ДЕСТРУКТУРИЗАЦИЮ!
         const {
            role,
            training_level,
            sport_specialization,
            skipped,
            userName,           // ✅ ДОБАВЬ
            birthDate,          // ✅ ДОБАВЬ
            allow_connections   // ✅ ДОБАВЬ
         } = req.body;

         const userId = req.user.id;

         console.log('🟡 updateOnboarding - полученные данные:', {
            userId,
            role,
            training_level,
            sport_specialization,
            skipped,
            userName,           // Теперь будет определено
            birthDate,          // Теперь будет определено
            allow_connections   // Теперь будет определено
         });

         // ✅ УПРОЩЕННАЯ ВАЛИДАЦИЯ - разрешаем 'skipped' как роль
         const isSkipping = skipped === true;
         const hasValidRole = role && ['trainee', 'trainer', 'skipped'].includes(role);
         const hasTrainingData = training_level || sport_specialization;

         if (!hasValidRole && !hasTrainingData && !isSkipping) {
            return next(ApiError.badRequest('Необходимо передать роль (trainee, trainer или skipped) или данные для обучения'));
         }

         const result = await sequelize.transaction(async (t) => {
            const user = await UserService.findUserById(userId);
            if (!user) {
               throw ApiError.notFound('Пользователь не найден');
            }

            const updateData = {};
            let message = '';

            // ✅ ПРИОРИТЕТ 1: Если передана роль (включая 'skipped')
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
            // ✅ ПРИОРИТЕТ 2: Если передано skipped: true (для обратной совместимости)
            else if (isSkipping) {
               updateData.role = 'skipped';
               message = 'Onboarding пропущен';
               console.log('🟢 Onboarding пропущен через skipped:true');
            }

            // Добавляем дополнительные данные, если переданы
            if (training_level) updateData.training_level = training_level;
            if (sport_specialization) updateData.sport_specialization = sport_specialization;
            if (userName !== undefined) updateData.userName = userName;
            if (birthDate !== undefined) updateData.birthDate = birthDate;
            if (allow_connections !== undefined) updateData.allow_connections = allow_connections;

            console.log('🟡 updateOnboarding - updateData для сохранения:', updateData);

            // Обновляем пользователя
            const updatedUser = await UserService.updateUser(updateData, userId, t);

            console.log('🟡 updateOnboarding - результат updateUser:');
            console.log('userName:', updatedUser.userName);
            console.log('birthDate:', updatedUser.birthDate);
            console.log('allow_connections:', updatedUser.allow_connections);
            console.log('Полный объект:', JSON.stringify(updatedUser, null, 2));

            return {
               id: updatedUser.id,
               email: updatedUser.email,
               role: updatedUser.role,
               userName: updatedUser.userName,
               birthDate: updatedUser.birthDate,  // ✅ ДОБАВЬ В ОТВЕТ
               allow_connections: updatedUser.allow_connections,  // ✅ ДОБАВЬ В ОТВЕТ
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