// repositories/friendRepository.js
const db = require('../models');
const { Op } = require('sequelize');

class FriendRepository {
   constructor() {
      // Получаем модели из db с правильными именами
      this.Friend = db.friend;      // из лога: friend: ✅
      this.User = db.User;          // из лога: user: ✅
      this.ConnectionRequest = db.connection_request; // из лога: connection_request: ✅

      console.log('✅ FriendRepository initialized with:', {
         Friend: !!this.Friend,
         User: !!this.User,
         ConnectionRequest: !!this.ConnectionRequest
      });
   }

   // ============ БАЗОВЫЕ ОПЕРАЦИИ С ДРУЗЬЯМИ ============

   /**
    * Создать запись о дружбе (после принятия запроса)
    */
   async createFriendship(userId, friendId, status = 'accepted') {
      try {
         return await this.Friend.create({
            user_id: userId,
            friend_id: friendId,
            status,
            acted_at: new Date()
         });
      } catch (error) {
         console.error('Error in createFriendship:', error);
         throw error;
      }
   }

   /**
    * Проверить, являются ли пользователи друзьями
    */
   async areFriends(userId1, userId2) {
      try {
         const friendship = await this.Friend.findOne({
            where: {
               [Op.or]: [
                  { user_id: userId1, friend_id: userId2, status: 'accepted' },
                  { user_id: userId2, friend_id: userId1, status: 'accepted' }
               ]
            }
         });
         return !!friendship;
      } catch (error) {
         console.error('Error in areFriends:', error);
         return false;
      }
   }

   /**
    * Найти дружбу между пользователями (любой статус)
    */
   async findFriendship(userId1, userId2) {
      try {
         return await this.Friend.findOne({
            where: {
               [Op.or]: [
                  { user_id: userId1, friend_id: userId2 },
                  { user_id: userId2, friend_id: userId1 }
               ]
            }
         });
      } catch (error) {
         console.error('Error in findFriendship:', error);
         return null;
      }
   }

   /**
    * Получить всех друзей пользователя (со статусом accepted)
    */
   // В friendRepository.js
   async getFriends(userId, options = { limit: 50, offset: 0, search: '' }) {
      try {
         console.log(`FriendRepository.getFriends for user ${userId} with options:`, options);

         // Друзья, где пользователь - инициатор
         const asInitiator = await this.Friend.findAll({
            where: { user_id: userId, status: 'accepted' },
            include: [{
               model: this.User,
               as: 'recipient',
               attributes: ['id', 'userName', 'email', 'userAvatar', 'sport_specialization', 'training_level', 'role']
            }],
            limit: options.limit,
            offset: options.offset
         });

         // Друзья, где пользователь - получатель
         const asRecipient = await this.Friend.findAll({
            where: { friend_id: userId, status: 'accepted' },
            include: [{
               model: this.User,
               as: 'initiator',
               attributes: ['id', 'userName', 'email', 'userAvatar', 'sport_specialization', 'training_level', 'role']
            }],
            limit: options.limit,
            offset: options.offset
         });

         // Объединяем и форматируем
         const friends = [
            ...asInitiator.map(f => ({
               id: f.recipient.id,
               userName: f.recipient.userName,
               email: f.recipient.email,
               userAvatar: f.recipient.userAvatar,
               role: f.recipient.role,
               sport_specialization: f.recipient.sport_specialization,
               training_level: f.recipient.training_level,
               friendship_id: f.id,
               since: f.acted_at || f.created_at,
               initiated_by_me: true
            })),
            ...asRecipient.map(f => ({
               id: f.initiator.id,
               userName: f.initiator.userName,
               email: f.initiator.email,
               userAvatar: f.initiator.userAvatar,
               role: f.initiator.role,
               sport_specialization: f.initiator.sport_specialization,
               training_level: f.initiator.training_level,
               friendship_id: f.id,
               since: f.acted_at || f.created_at,
               initiated_by_me: false
            }))
         ];

         return friends;
      } catch (error) {
         console.error('Error in getFriends:', error);
         return [];
      }
   }

   /**
    * Удалить дружбу
    */
   async removeFriendship(userId1, userId2) {
      try {
         return await this.Friend.destroy({
            where: {
               [Op.or]: [
                  { user_id: userId1, friend_id: userId2 },
                  { user_id: userId2, friend_id: userId1 }
               ]
            }
         });
      } catch (error) {
         console.error('Error in removeFriendship:', error);
         throw error;
      }
   }

   /**
    * Заблокировать пользователя
    */
   async blockUser(userId, userToBlockId) {
      try {
         // Сначала удаляем существующую дружбу/запрос
         await this.removeFriendship(userId, userToBlockId);

         // Создаем запись с статусом blocked
         return await this.Friend.create({
            user_id: userId,
            friend_id: userToBlockId,
            status: 'blocked',
            acted_at: new Date()
         });
      } catch (error) {
         console.error('Error in blockUser:', error);
         throw error;
      }
   }

   /**
    * Получить статус отношений между пользователями
    */
   async getFriendshipStatus(userId, targetUserId) {
      try {
         // 1. Проверяем дружбу
         const friendship = await this.findFriendship(userId, targetUserId);
         if (friendship) {
            return {
               status: friendship.status,
               friendship_id: friendship.id,
               direction: friendship.user_id === userId ? 'initiated' : 'received',
               acted_at: friendship.acted_at
            };
         }

         // 2. Проверяем запросы
         const request = await this.ConnectionRequest.findOne({
            where: {
               [Op.or]: [
                  { sender_id: userId, receiver_id: targetUserId },
                  { sender_id: targetUserId, receiver_id: userId }
               ]
            }
         });

         if (request) {
            return {
               status: request.status === 'pending' ? 'pending' : 'request_' + request.status,
               request_id: request.id,
               direction: request.sender_id === userId ? 'outgoing' : 'incoming'
            };
         }

         // 3. Нет отношений
         return {
            status: 'none',
            direction: null
         };
      } catch (error) {
         console.error('Error in getFriendshipStatus:', error);
         return { status: 'error', direction: null };
      }
   }

   /**
    * Получить ID всех друзей пользователя
    */
   async getFriendIds(userId) {
      try {
         const asInitiator = await this.Friend.findAll({
            where: { user_id: userId, status: 'accepted' },
            attributes: ['friend_id']
         });

         const asRecipient = await this.Friend.findAll({
            where: { friend_id: userId, status: 'accepted' },
            attributes: ['user_id']
         });

         const friendIds = [
            ...asInitiator.map(f => f.friend_id),
            ...asRecipient.map(f => f.user_id)
         ];

         return friendIds;
      } catch (error) {
         console.error('Error in getFriendIds:', error);
         return [];
      }
   }

   /**
    * Получить количество друзей
    */
   async countFriends(userId) {
      try {
         const friendIds = await this.getFriendIds(userId);
         return friendIds.length;
      } catch (error) {
         console.error('Error in countFriends:', error);
         return 0;
      }
   }

   // ============ МЕТОДЫ ДЛЯ РАБОТЫ С ЗАПРОСАМИ ============

   /**
    * Получить входящие запросы в друзья
    * @param {number} userId - ID пользователя
    * @param {string} status - Статус запросов (по умолчанию 'pending')
    */
   async getIncomingRequests(userId, status = 'pending') {
      try {
         console.log(`FriendRepository.getIncomingRequests for user ${userId}, status: ${status}`);

         const requests = await this.Friend.findAll({
            where: {
               friend_id: userId,
               status: status
            },
            include: [{
               model: this.User,
               as: 'initiator',
               attributes: ['id', 'userName', 'email', 'userAvatar', 'sport_specialization', 'training_level', 'role']
            }],
            order: [['created_at', 'DESC']]
         });

         return requests.map(req => ({
            id: req.id,
            user_id: req.user_id,
            friend_id: req.friend_id,
            status: req.status,
            message: req.message,
            created_at: req.created_at,
            acted_at: req.acted_at,
            user: req.initiator // отправитель запроса
         }));
      } catch (error) {
         console.error('Error in getIncomingRequests:', error);
         return [];
      }
   }

   /**
    * Получить исходящие запросы в друзья
    * @param {number} userId - ID пользователя
    * @param {string} status - Статус запросов (по умолчанию 'pending')
    */
   async getOutgoingRequests(userId, status = 'pending') {
      try {
         console.log(`FriendRepository.getOutgoingRequests for user ${userId}, status: ${status}`);

         const requests = await this.Friend.findAll({
            where: {
               user_id: userId,
               status: status
            },
            include: [{
               model: this.User,
               as: 'recipient',
               attributes: ['id', 'userName', 'email', 'userAvatar', 'sport_specialization', 'training_level', 'role']
            }],
            order: [['created_at', 'DESC']]
         });

         return requests.map(req => ({
            id: req.id,
            user_id: req.user_id,
            friend_id: req.friend_id,
            status: req.status,
            message: req.message,
            created_at: req.created_at,
            acted_at: req.acted_at,
            user: req.recipient // получатель запроса
         }));
      } catch (error) {
         console.error('Error in getOutgoingRequests:', error);
         return [];
      }
   }

   /**
    * Получить запрос по ID
    * @param {number} requestId - ID запроса
    * @param {object} transaction - Опционально транзакция
    */
   async getFriendRequestById(requestId, transaction = null) {
      try {
         const request = await this.Friend.findByPk(requestId, {
            include: [
               {
                  model: this.User,
                  as: 'initiator',
                  attributes: ['id', 'userName', 'email', 'userAvatar', 'role']
               },
               {
                  model: this.User,
                  as: 'recipient',
                  attributes: ['id', 'userName', 'email', 'userAvatar', 'role']
               }
            ],
            transaction
         });

         return request;
      } catch (error) {
         console.error('Error in getFriendRequestById:', error);
         return null;
      }
   }

   /**
    * Создать запрос в друзья
    * @param {object} data - Данные запроса { user_id, friend_id, message, status }
    */
   async createFriendRequest(data) {
      try {
         return await this.Friend.create({
            user_id: data.user_id,
            friend_id: data.friend_id,
            status: data.status || 'pending',
            message: data.message || '',
            acted_at: data.status !== 'pending' ? new Date() : null
         });
      } catch (error) {
         console.error('Error in createFriendRequest:', error);
         throw error;
      }
   }

   /**
    * Обновить статус запроса
    * @param {number} requestId - ID запроса
    * @param {string} status - Новый статус
    * @param {object} transaction - Опционально транзакция
    */
   async updateRequestStatus(requestId, status, transaction = null) {
      try {
         const updateData = {
            status,
            acted_at: new Date()
         };

         const [updated] = await this.Friend.update(updateData, {
            where: { id: requestId },
            transaction,
            returning: true
         });

         return updated;
      } catch (error) {
         console.error('Error in updateRequestStatus:', error);
         throw error;
      }
   }

   /**
    * Поиск по друзьям
    * @param {number} userId - ID пользователя
    * @param {string} query - Поисковый запрос
    * @param {object} options - Опции { limit, offset }
    */
   async searchFriends(userId, query, options = { limit: 20, offset: 0 }) {
      try {
         // Получаем всех друзей
         const allFriends = await this.getFriends(userId, { limit: 1000, offset: 0 });

         // Фильтруем по имени или email
         const searchLower = query.toLowerCase();
         const filtered = allFriends.filter(friend =>
            friend.userName?.toLowerCase().includes(searchLower) ||
            friend.email?.toLowerCase().includes(searchLower)
         );

         // Применяем пагинацию
         const paginated = filtered.slice(options.offset, options.offset + options.limit);

         return paginated;
      } catch (error) {
         console.error('Error in searchFriends:', error);
         return [];
      }
   }
}

module.exports = new FriendRepository();