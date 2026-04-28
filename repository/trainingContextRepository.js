// repositories/trainingContextRepository.js
const { training_context: TrainingContext, user: User } = require('../models');
const { Op } = require('sequelize');

class TrainingContextRepository {
   // ============ БАЗОВЫЕ ОПЕРАЦИИ ============

   async create(data) {
      try {
         return await TrainingContext.create({
            friend_id: data.friend_id,
            sport: data.sport,
            trainer_id: data.trainer_id,
            trainee_id: data.trainee_id,
            status: data.status || 'active',
            start_date: data.start_date || new Date(),
            end_date: data.end_date || null
         });
      } catch (error) {
         console.error('Error in TrainingContextRepository.create:', error);
         throw error;
      }
   }

   async findById(id) {
      try {
         return await TrainingContext.findByPk(id, {
            include: [
               { model: User, as: 'trainer', attributes: ['id', 'userName', 'userAvatar'] },
               { model: User, as: 'trainee', attributes: ['id', 'userName', 'userAvatar'] }
            ]
         });
      } catch (error) {
         console.error('Error in TrainingContextRepository.findById:', error);
         return null;
      }
   }

   // ============ ПОЛУЧЕНИЕ КОНТЕКСТОВ ============

   async getByFriendId(friendId) {
      try {
         return await TrainingContext.findAll({
            where: { friend_id: friendId },
            include: [
               { model: User, as: 'trainer', attributes: ['id', 'userName', 'userAvatar'] },
               { model: User, as: 'trainee', attributes: ['id', 'userName', 'userAvatar'] }
            ],
            order: [['created_at', 'DESC']]
         });
      } catch (error) {
         console.error('Error in TrainingContextRepository.getByFriendId:', error);
         return [];
      }
   }

   async getActiveByFriendId(friendId) {
      try {
         return await TrainingContext.findAll({
            where: {
               friend_id: friendId,
               status: 'active'
            },
            include: [
               { model: User, as: 'trainer', attributes: ['id', 'userName', 'userAvatar'] },
               { model: User, as: 'trainee', attributes: ['id', 'userName', 'userAvatar'] }
            ]
         });
      } catch (error) {
         console.error('Error in TrainingContextRepository.getActiveByFriendId:', error);
         return [];
      }
   }

   async getAsTrainer(userId, status = 'active') {
      try {
         return await TrainingContext.findAll({
            where: {
               trainer_id: userId,
               status
            },
            include: [
               { model: User, as: 'trainee', attributes: ['id', 'userName', 'userAvatar', 'training_level'] }
            ],
            order: [['created_at', 'DESC']]
         });
      } catch (error) {
         console.error('Error in TrainingContextRepository.getAsTrainer:', error);
         return [];
      }
   }

   async getAsTrainee(userId, status = 'active') {
      try {
         return await TrainingContext.findAll({
            where: {
               trainee_id: userId,
               status
            },
            include: [
               { model: User, as: 'trainer', attributes: ['id', 'userName', 'userAvatar', 'sport_specialization'] }
            ],
            order: [['created_at', 'DESC']]
         });
      } catch (error) {
         console.error('Error in TrainingContextRepository.getAsTrainee:', error);
         return [];
      }
   }

   async getAllUserContexts(userId) {
      try {
         return await TrainingContext.findAll({
            where: {
               [Op.or]: [
                  { trainer_id: userId },
                  { trainee_id: userId }
               ]
            },
            include: [
               { model: User, as: 'trainer', attributes: ['id', 'userName', 'userAvatar'] },
               { model: User, as: 'trainee', attributes: ['id', 'userName', 'userAvatar'] }
            ],
            order: [['created_at', 'DESC']]
         });
      } catch (error) {
         console.error('Error in TrainingContextRepository.getAllUserContexts:', error);
         return [];
      }
   }

   // ============ ОБНОВЛЕНИЕ СТАТУСА ============

   async updateStatus(id, status, endDate = null) {
      try {
         const updateData = { status };
         if (endDate) {
            updateData.end_date = endDate;
         }

         return await TrainingContext.update(updateData, {
            where: { id }
         });
      } catch (error) {
         console.error('Error in TrainingContextRepository.updateStatus:', error);
         throw error;
      }
   }

   async endContext(id) {
      return await this.updateStatus(id, 'ended', new Date());
   }

   // ============ ПРОВЕРКИ ============

   async exists(friendId, sport) {
      try {
         const context = await TrainingContext.findOne({
            where: {
               friend_id: friendId,
               sport,
               status: 'active'
            }
         });
         return !!context;
      } catch (error) {
         console.error('Error in TrainingContextRepository.exists:', error);
         return false;
      }
   }

   // ============ СТАТИСТИКА ============

   async countByUser(userId) {
      try {
         const asTrainer = await TrainingContext.count({
            where: { trainer_id: userId }
         });

         const asTrainee = await TrainingContext.count({
            where: { trainee_id: userId }
         });

         return {
            total: asTrainer + asTrainee,
            as_trainer: asTrainer,
            as_trainee: asTrainee
         };
      } catch (error) {
         console.error('Error in TrainingContextRepository.countByUser:', error);
         return { total: 0, as_trainer: 0, as_trainee: 0 };
      }
   }

   // repositories/trainingContextRepository.js

   /**
    * Получить контексты по ID дружбы (алиас для getByFriendId)
    * @param {number} friendshipId - ID из таблицы friends
    * @param {Object} options - { status }
    */
   // repositories/trainingContextRepository.js

   async getContextsByFriendId(friendshipId, options = {}) {
      try {
         const where = { friend_id: friendshipId };
         if (options.status) {
            where.status = options.status;
         }

         const contexts = await TrainingContext.findAll({
            where,
            include: [
               { model: User, as: 'trainer', attributes: ['id', 'userName', 'userAvatar'] },
               { model: User, as: 'trainee', attributes: ['id', 'userName', 'userAvatar'] }
            ]
         });

         return contexts;
      } catch (error) {
         console.error('Error in TrainingContextRepository.getContextsByFriendId:', error);
         return [];
      }
   }
}

module.exports = new TrainingContextRepository();