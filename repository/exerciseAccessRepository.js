// backend/repository/exerciseAccessRepository.js
const { ExerciseAccess, Exercise, User } = require('../models');
const { Sequelize, Op } = require('sequelize');

class ExerciseAccessRepository {
   constructor() {
      this.model = ExerciseAccess;
   }

   /**
    * Выдать доступ пользователю к упражнению
    * @param {Object} data - данные доступа
    * @param {number} data.exercise_id - ID упражнения
    * @param {number} data.user_id - ID пользователя
    * @param {number} data.granted_by - ID кто выдал доступ
    * @param {string} data.access_level - уровень доступа (view/use/edit)
    * @param {Date} data.expires_at - дата истечения (опционально)
    * @param {object} transaction - транзакция
    * @returns {Promise<ExerciseAccess>}
    */
   async grantAccess(data, transaction = null) {
      const [access, created] = await this.model.findOrCreate({
         where: {
            exercise_id: data.exercise_id,
            user_id: data.user_id
         },
         defaults: {
            exercise_id: data.exercise_id,
            user_id: data.user_id,
            granted_by: data.granted_by,
            access_level: data.access_level || 'view',
            expires_at: data.expires_at || null,
            status: 'active'
         },
         transaction
      });

      // Если запись уже существовала, обновляем
      if (!created) {
         await access.update({
            granted_by: data.granted_by,
            access_level: data.access_level || access.access_level,
            expires_at: data.expires_at !== undefined ? data.expires_at : access.expires_at,
            status: 'active',
            updated_at: new Date()
         }, { transaction });
      }

      return access;
   }

   /**
    * Отозвать доступ (установить статус 'revoked')
    * @param {number} exerciseId - ID упражнения
    * @param {number} userId - ID пользователя
    * @param {object} transaction - транзакция
    * @returns {Promise<boolean>} - true если обновлено
    */
   async revokeAccess(exerciseId, userId, transaction = null) {
      const [updated] = await this.model.update(
         {
            status: 'revoked',
            updated_at: new Date()
         },
         {
            where: {
               exercise_id: exerciseId,
               user_id: userId,
               status: 'active'
            },
            transaction
         }
      );
      return updated > 0;
   }

   /**
    * Проверить доступ пользователя к упражнению
    * @param {number} exerciseId - ID упражнения
    * @param {number} userId - ID пользователя
    * @returns {Promise<Object|null>} - объект доступа или null
    */
   async checkAccess(exerciseId, userId) {
      const access = await this.model.findOne({
         where: {
            exercise_id: exerciseId,
            user_id: userId,
            status: 'active',
            [Op.or]: [
               { expires_at: null },
               { expires_at: { [Op.gt]: new Date() } }
            ]
         }
      });
      return access;
   }

   /**
    * Проверить уровень доступа
    * @param {number} exerciseId - ID упражнения
    * @param {number} userId - ID пользователя
    * @param {string} requiredLevel - требуемый уровень (view/use/edit)
    * @returns {Promise<boolean>}
    */
   async hasAccessLevel(exerciseId, userId, requiredLevel) {
      const access = await this.checkAccess(exerciseId, userId);
      if (!access) return false;

      const levels = { 'view': 1, 'use': 2, 'edit': 3 };
      return levels[access.access_level] >= levels[requiredLevel];
   }

   /**
    * Получить список пользователей с доступом к упражнению
    * @param {number} exerciseId - ID упражнения
    * @param {Object} options - опции (limit, offset, status)
    * @returns {Promise<{rows: Array, count: number}>}
    */
   async getUsersWithAccess(exerciseId, options = {}) {
      const { limit = 100, offset = 0, status = 'active' } = options;

      const where = { exercise_id: exerciseId };
      if (status) where.status = status;

      const result = await this.model.findAndCountAll({
         where,
         include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'avatar_url']
         }, {
            model: User,
            as: 'grantor',
            attributes: ['id', 'name', 'email']
         }],
         limit,
         offset,
         order: [['created_at', 'DESC']]
      });

      return {
         rows: result.rows,
         count: result.count
      };
   }

   /**
    * Получить все упражнения, доступные пользователю (шаред)
    * @param {number} userId - ID пользователя
    * @param {Object} options - опции (limit, offset, access_level)
    * @returns {Promise<{rows: Array, count: number}>}
    */
   async getExercisesSharedWithUser(userId, options = {}) {
      const { limit = 50, offset = 0, access_level = null } = options;

      const where = {
         user_id: userId,
         status: 'active',
         [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
         ]
      };

      if (access_level) {
         where.access_level = access_level;
      }

      const result = await this.model.findAndCountAll({
         where,
         include: [{
            model: Exercise,
            as: 'exercise',
            include: [{
               model: User,
               as: 'owner',
               attributes: ['id', 'name', 'email']
            }]
         }],
         limit,
         offset,
         order: [['created_at', 'DESC']]
      });

      return {
         rows: result.rows,
         count: result.count
      };
   }

   /**
    * Обновить статусы истекших доступов
    * @param {object} transaction - транзакция
    * @returns {Promise<number>} - количество обновленных записей
    */
   async updateExpiredAccess(transaction = null) {
      const [updated] = await this.model.update(
         {
            status: 'expired',
            updated_at: new Date()
         },
         {
            where: {
               status: 'active',
               expires_at: { [Op.ne]: null },
               expires_at: { [Op.lt]: new Date() }
            },
            transaction
         }
      );
      return updated;
   }

   /**
    * Удалить все записи доступа для упражнения (при удалении упражнения)
    * @param {number} exerciseId - ID упражнения
    * @param {object} transaction - транзакция
    * @returns {Promise<number>} - количество удаленных записей
    */
   async deleteAllAccessForExercise(exerciseId, transaction = null) {
      const deleted = await this.model.destroy({
         where: { exercise_id: exerciseId },
         transaction
      });
      return deleted;
   }

   /**
    * Получить уровень доступа пользователя (упрощенная версия)
    * @param {number} exerciseId - ID упражнения
    * @param {number} userId - ID пользователя
    * @returns {Promise<string|null>} - уровень доступа или null
    */
   async getUserAccessLevel(exerciseId, userId) {
      const access = await this.checkAccess(exerciseId, userId);
      return access ? access.access_level : null;
   }

   /**
    * Обновить уровень доступа
    * @param {number} exerciseId - ID упражнения
    * @param {number} userId - ID пользователя
    * @param {string} accessLevel - новый уровень доступа
    * @param {object} transaction - транзакция
    * @returns {Promise<boolean>}
    */
   async updateAccessLevel(exerciseId, userId, accessLevel, transaction = null) {
      const [updated] = await this.model.update(
         {
            access_level: accessLevel,
            updated_at: new Date()
         },
         {
            where: {
               exercise_id: exerciseId,
               user_id: userId,
               status: 'active'
            },
            transaction
         }
      );
      return updated > 0;
   }
}

module.exports = new ExerciseAccessRepository();