// const ApiError = require('../error/ApiError');
// const { sequelize } = require('../models');
// const FriendRepository = require('../repository/friendsRepository');
// const UserRepository = require('../repository/userRepository');
// const TrainingContextRepository = require('../repository/trainingContextRepository');
// const { Op } = require('sequelize');

// class FriendService {
//    // ============ ОСНОВНЫЕ МЕТОДЫ ============

//    /**
//     * Отправить запрос в друзья
//     * @param {number} senderId - ID отправителя
//     * @param {number} receiverId - ID получателя
//     * @param {string} message - Сообщение к запросу (опционально)
//     */
//    async sendFriendRequest(senderId, receiverId, message = '') {
//       console.log(`🟡 FriendService.sendFriendRequest: ${senderId} -> ${receiverId}`);

//       // 1. Проверяем существование пользователей
//       const [sender, receiver] = await Promise.all([
//          UserRepository.findUserById(senderId),
//          UserRepository.findUserById(receiverId)
//       ]);

//       if (!sender || !receiver) {
//          throw ApiError.notFound('Пользователь не найден');
//       }

//       // 2. Нельзя отправить запрос самому себе
//       if (senderId === receiverId) {
//          throw ApiError.badRequest('Нельзя отправить запрос самому себе');
//       }

//       // 3. Проверяем существующую дружбу
//       const existingFriendship = await FriendRepository.findFriendship(senderId, receiverId);

//       if (existingFriendship) {
//          if (existingFriendship.status === 'accepted') {
//             throw ApiError.badRequest('Вы уже друзья');
//          }
//          if (existingFriendship.status === 'pending') {
//             // Проверяем направление
//             if (existingFriendship.user_id === senderId) {
//                throw ApiError.badRequest('Вы уже отправили запрос этому пользователю');
//             } else {
//                throw ApiError.badRequest('Этот пользователь уже отправил вам запрос. Используйте respondToRequest для ответа');
//             }
//          }
//          if (existingFriendship.status === 'blocked') {
//             throw ApiError.forbidden('Невозможно отправить запрос');
//          }
//       }

//       // 4. Создаем новый запрос
//       const friendRequest = await FriendRepository.createFriendRequest({
//          user_id: senderId,
//          friend_id: receiverId,
//          message: message || `Запрос в друзья от ${sender.userName || 'пользователя'}`,
//          status: 'pending'
//       });

//       console.log(`✅ FriendService.sendFriendRequest: запрос создан, ID: ${friendRequest.id}`);

//       // Возвращаем с данными о пользователях
//       return await FriendRepository.getFriendRequestById(friendRequest.id);
//    }

//    /**
//     * Ответить на запрос в друзья
//     * @param {number} requestId - ID запроса
//     * @param {number} userId - ID пользователя (должен быть получателем)
//     * @param {string} action - 'accept' или 'reject'
//     */
//    async respondToRequest(requestId, userId, action) {
//       console.log(`🟡 FriendService.respondToRequest: request ${requestId}, user ${userId}, action ${action}`);

//       // 1. Находим запрос
//       const request = await FriendRepository.getFriendRequestById(requestId);
//       if (!request) {
//          throw ApiError.notFound('Запрос не найден');
//       }

//       // 2. Проверяем, что пользователь - получатель
//       if (request.friend_id !== userId) {
//          throw ApiError.forbidden('Вы можете отвечать только на входящие запросы');
//       }

//       // 3. Проверяем статус запроса
//       if (request.status !== 'pending') {
//          throw ApiError.badRequest(`Запрос уже ${this._getStatusText(request.status)}`);
//       }

//       // 4. Выполняем действие в транзакции
//       const result = await sequelize.transaction(async (transaction) => {
//          if (action === 'accept') {
//             // Принимаем запрос
//             await FriendRepository.updateRequestStatus(requestId, 'accepted', transaction);

//             // Возвращаем обновленный запрос
//             return {
//                success: true,
//                action: 'accept',
//                status: 'accepted',
//                friendship: await FriendRepository.getFriendRequestById(requestId, transaction)
//             };
//          } else {
//             // Отклоняем запрос
//             await FriendRepository.updateRequestStatus(requestId, 'rejected', transaction);

//             return {
//                success: true,
//                action: 'reject',
//                status: 'rejected',
//                friendship: null
//             };
//          }
//       });

//       console.log(`✅ FriendService.respondToRequest: запрос ${action}ed`);
//       return result;
//    }

//    /**
//     * Отменить исходящий запрос
//     * @param {number} requestId - ID запроса
//     * @param {number} userId - ID пользователя (должен быть отправителем)
//     */
//    async cancelRequest(requestId, userId) {
//       console.log(`🟡 FriendService.cancelRequest: request ${requestId}, user ${userId}`);

//       // 1. Находим запрос
//       const request = await FriendRepository.getFriendRequestById(requestId);
//       if (!request) {
//          throw ApiError.notFound('Запрос не найден');
//       }

//       // 2. Проверяем, что пользователь - отправитель
//       if (request.user_id !== userId) {
//          throw ApiError.forbidden('Вы можете отменять только свои исходящие запросы');
//       }

//       // 3. Проверяем статус
//       if (request.status !== 'pending') {
//          throw ApiError.badRequest(`Нельзя отменить запрос со статусом "${request.status}"`);
//       }

//       // 4. Отменяем запрос
//       await FriendRepository.updateRequestStatus(requestId, 'cancelled');

//       console.log(`✅ FriendService.cancelRequest: запрос отменен`);
//       return {
//          success: true,
//          message: 'Запрос успешно отменен'
//       };
//    }

//    /**
//     * Получить список друзей пользователя
//     * @param {number} userId - ID пользователя
//     * @param {Object} options - Опции (limit, offset, search)
//     */
//    /**
//   * Получить список друзей пользователя
//   * @param {number} userId - ID пользователя
//   * @param {Object} options - Опции (limit, offset, search)
//   */
//    async getFriends(userId, options = {}) {
//       console.log(`🟡 FriendService.getFriends: user ${userId}, options:`, options);

//       const { limit = 50, offset = 0, search = '' } = options;

//       // Получаем друзей
//       const friends = await FriendRepository.getFriends(userId, {
//          limit: parseInt(limit),
//          offset: parseInt(offset),
//          search
//       });

//       // Обогащаем данными о контекстах тренировок
//       const enrichedFriends = await Promise.all(
//          friends.map(async (friend) => {
//             // Убираем вызов toJSON, так как friend уже объект
//             const friendData = friend;

//             // Получаем активные контексты тренировок с этим другом
//             const contexts = await TrainingContextRepository.getContextsByFriendId(
//                friendData.friendship_id, // Используем friendship_id вместо friendId
//                { status: 'active' }
//             );

//             return {
//                ...friendData,
//                training_contexts: contexts,
//                contexts_count: contexts.length
//             };
//          })
//       );

//       console.log(`✅ FriendService.getFriends: найдено ${enrichedFriends.length} друзей`);
//       return enrichedFriends;
//    }

//    /**
//     * Получить запросы в друзья
//     * @param {number} userId - ID пользователя
//     * @param {string} direction - 'incoming', 'outgoing' или 'all'
//     * @param {string} status - Статус запросов (по умолчанию 'pending')
//     */
//    async getFriendRequests(userId, direction = 'all', status = 'pending') {
//       console.log(`🟡 FriendService.getFriendRequests: user ${userId}, direction ${direction}, status ${status}`);

//       let requests = [];

//       if (direction === 'incoming' || direction === 'all') {
//          const incoming = await FriendRepository.getIncomingRequests(userId, status);
//          console.log(`📥 Incoming requests count: ${incoming.length}`);

//          // ✅ ИСПРАВЛЕНИЕ: убираем toJSON(), так как incoming уже массив объектов
//          requests = [...requests, ...incoming.map(req => ({
//             id: req.id,
//             user_id: req.user_id,
//             friend_id: req.friend_id,
//             message: req.message,
//             status: req.status,
//             created_at: req.created_at,
//             updated_at: req.updated_at,
//             acted_at: req.acted_at,
//             initiator: req.initiator,
//             recipient: req.recipient,
//             user: req.initiator || req.recipient,  // Определяем user для фронтенда
//             direction: 'incoming'
//          }))];
//       }

//       if (direction === 'outgoing' || direction === 'all') {
//          const outgoing = await FriendRepository.getOutgoingRequests(userId, status);
//          console.log(`📤 Outgoing requests count: ${outgoing.length}`);

//          // ✅ ИСПРАВЛЕНИЕ: убираем toJSON()
//          requests = [...requests, ...outgoing.map(req => ({
//             id: req.id,
//             user_id: req.user_id,
//             friend_id: req.friend_id,
//             message: req.message,
//             status: req.status,
//             created_at: req.created_at,
//             updated_at: req.updated_at,
//             acted_at: req.acted_at,
//             initiator: req.initiator,
//             recipient: req.recipient,
//             user: req.recipient || req.initiator,  // Для исходящих user = получатель
//             direction: 'outgoing'
//          }))];
//       }

//       // Сортируем по дате создания (новые сверху)
//       requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

//       console.log(`✅ FriendService.getFriendRequests: найдено ${requests.length} запросов`);
//       return requests;
//    }

//    /**
//     * Удалить пользователя из друзей
//     * @param {number} userId - ID пользователя
//     * @param {number} friendId - ID друга
//     */
//    async removeFriend(userId, friendId) {
//       console.log(`🟡 FriendService.removeFriend: user ${userId} -> friend ${friendId}`);

//       // 1. Проверяем существование дружбы
//       const friendship = await FriendRepository.findFriendship(userId, friendId, 'accepted');

//       if (!friendship) {
//          throw ApiError.notFound('Дружба не найдена');
//       }

//       // 2. Проверяем связанные контексты тренировок
//       const activeContexts = await TrainingContextRepository.getContextsBetweenUsers(
//          userId,
//          friendId,
//          { status: 'active' }
//       );

//       if (activeContexts.length > 0) {
//          // Если есть активные контексты, предлагаем их завершить
//          const contextSports = activeContexts.map(ctx => ctx.sport).join(', ');
//          throw ApiError.badRequest(
//             `Невозможно удалить друга, пока есть активные контексты тренировок: ${contextSports}. ` +
//             'Сначала завершите контексты тренировок.'
//          );
//       }

//       // 3. Удаляем дружбу
//       await sequelize.transaction(async (transaction) => {
//          // Получаем ID записи о дружбе
//          const friendRecord = await FriendRepository.findFriendship(userId, friendId);
//          if (friendRecord) {
//             // Если это принятая дружба - меняем статус на 'rejected' (soft delete)
//             await FriendRepository.updateRequestStatus(friendRecord.id, 'rejected', transaction);
//          }
//       });

//       console.log(`✅ FriendService.removeFriend: дружба удалена`);
//       return {
//          success: true,
//          message: 'Пользователь удален из друзей'
//       };
//    }

//    /**
//     * Проверить статус отношений с пользователем
//     * @param {number} userId - ID пользователя
//     * @param {number} targetUserId - ID целевого пользователя
//     */
//    async getFriendStatus(userId, targetUserId) {
//       console.log(`🟡 FriendService.getFriendStatus: ${userId} -> ${targetUserId}`);

//       // 1. Проверяем существование дружбы
//       const friendship = await FriendRepository.findFriendship(userId, targetUserId);

//       if (!friendship) {
//          return {
//             status: 'none',
//             direction: null,
//             can_send_request: true
//          };
//       }

//       // 2. Определяем направление и статус
//       let direction = null;
//       if (friendship.user_id === userId) {
//          direction = 'outgoing';
//       } else if (friendship.friend_id === userId) {
//          direction = 'incoming';
//       }

//       // 3. Проверяем возможность отправить запрос
//       const canSendRequest = friendship.status === 'rejected' ||
//          friendship.status === 'cancelled' ||
//          (friendship.status === 'pending' && direction === 'incoming');

//       // 4. Получаем контексты тренировок, если есть
//       let trainingContexts = [];
//       if (friendship.status === 'accepted') {
//          trainingContexts = await TrainingContextRepository.getContextsByFriendId(
//             friendship.id,
//             { status: 'active' }
//          );
//       }

//       return {
//          status: friendship.status,
//          direction,
//          friendship_id: friendship.id,
//          can_send_request: canSendRequest,
//          training_contexts: trainingContexts,
//          acted_at: friendship.acted_at,
//          created_at: friendship.created_at
//       };
//    }

//    /**
//     * Получить статистику друзей
//     * @param {number} userId - ID пользователя
//     */
//    async getFriendStats(userId) {
//       console.log(`🟡 FriendService.getFriendStats: user ${userId}`);

//       const stats = {
//          total_friends: 0,
//          incoming_requests: 0,
//          outgoing_requests: 0,
//          mutual_friends_count: 0,
//          friends_with_contexts: 0
//       };

//       // 1. Считаем друзей
//       const friends = await FriendRepository.getFriends(userId, { limit: 1000 });
//       stats.total_friends = friends.length;

//       // 2. Считаем запросы
//       const [incoming, outgoing] = await Promise.all([
//          FriendRepository.getIncomingRequests(userId, 'pending'),
//          FriendRepository.getOutgoingRequests(userId, 'pending')
//       ]);

//       stats.incoming_requests = incoming.length;
//       stats.outgoing_requests = outgoing.length;

//       // 3. Друзья с контекстами
//       const friendIds = friends.map(f => f.friendId || f.id);
//       for (const friendId of friendIds) {
//          const friendship = await FriendRepository.findFriendship(userId, friendId);
//          if (friendship) {
//             const contexts = await TrainingContextRepository.getContextsByFriendId(
//                friendship.id,
//                { status: 'active' }
//             );
//             if (contexts.length > 0) {
//                stats.friends_with_contexts++;
//             }
//          }
//       }

//       // 4. Общие друзья (можно добавить позже, если потребуется)
//       // stats.mutual_friends_count = await this._getMutualFriendsCount(userId);

//       console.log(`✅ FriendService.getFriendStats:`, stats);
//       return stats;
//    }

//    /**
//     * Поиск по друзьям
//     * @param {number} userId - ID пользователя
//     * @param {string} query - Поисковый запрос
//     * @param {Object} options - Опции (limit, offset)
//     */
//    async searchFriends(userId, query, options = {}) {
//       console.log(`🟡 FriendService.searchFriends: user ${userId}, query "${query}"`);

//       const { limit = 20, offset = 0 } = options;

//       if (!query || query.trim().length < 2) {
//          return [];
//       }

//       const friends = await FriendRepository.searchFriends(userId, query, {
//          limit: parseInt(limit),
//          offset: parseInt(offset)
//       });

//       // Обогащаем контекстами
//       const enrichedFriends = await Promise.all(
//          friends.map(async (friend) => {
//             const contexts = await TrainingContextRepository.getContextsBetweenUsers(
//                userId,
//                friend.id,
//                { status: 'active' }
//             );
//             return {
//                ...friend.toJSON(),
//                training_contexts: contexts
//             };
//          })
//       );

//       console.log(`✅ FriendService.searchFriends: найдено ${enrichedFriends.length} совпадений`);
//       return enrichedFriends;
//    }

//    /**
//     * Получить общих друзей
//     * @param {number} userId - ID пользователя
//     * @param {number} targetUserId - ID целевого пользователя
//     */
//    async getMutualFriends(userId, targetUserId) {
//       console.log(`🟡 FriendService.getMutualFriends: ${userId} & ${targetUserId}`);

//       // Получаем друзей первого пользователя
//       const userFriends = await FriendRepository.getFriends(userId, { limit: 1000 });
//       const userFriendIds = new Set(userFriends.map(f => f.friendId || f.id));

//       // Получаем друзей второго пользователя
//       const targetFriends = await FriendRepository.getFriends(targetUserId, { limit: 1000 });

//       // Находим пересечение
//       const mutualFriendIds = targetFriends
//          .map(f => f.friendId || f.id)
//          .filter(id => userFriendIds.has(id));

//       if (mutualFriendIds.length === 0) {
//          return [];
//       }

//       // Получаем полные данные об общих друзьях
//       const mutualFriends = await UserRepository.findUsersByIds(mutualFriendIds);

//       console.log(`✅ FriendService.getMutualFriends: найдено ${mutualFriends.length} общих друзей`);
//       return mutualFriends;
//    }

//    /**
//     * Заблокировать пользователя
//     * @param {number} userId - ID пользователя
//     * @param {number} blockedUserId - ID блокируемого пользователя
//     */
//    async blockUser(userId, blockedUserId) {
//       console.log(`🟡 FriendService.blockUser: ${userId} блокирует ${blockedUserId}`);

//       if (userId === blockedUserId) {
//          throw ApiError.badRequest('Нельзя заблокировать самого себя');
//       }

//       // Проверяем существование дружбы
//       let friendship = await FriendRepository.findFriendship(userId, blockedUserId);

//       if (friendship) {
//          // Обновляем существующую запись
//          await FriendRepository.updateRequestStatus(friendship.id, 'blocked');
//       } else {
//          // Создаем новую запись о блокировке
//          friendship = await FriendRepository.createFriendRequest({
//             user_id: userId,
//             friend_id: blockedUserId,
//             status: 'blocked',
//             message: 'Пользователь заблокирован'
//          });
//       }

//       console.log(`✅ FriendService.blockUser: пользователь заблокирован`);
//       return {
//          success: true,
//          message: 'Пользователь заблокирован'
//       };
//    }

//    /**
//     * Разблокировать пользователя
//     * @param {number} userId - ID пользователя
//     * @param {number} unblockedUserId - ID разблокируемого пользователя
//     */
//    async unblockUser(userId, unblockedUserId) {
//       console.log(`🟡 FriendService.unblockUser: ${userId} разблокирует ${unblockedUserId}`);

//       const friendship = await FriendRepository.findFriendship(userId, unblockedUserId, 'blocked');

//       if (!friendship) {
//          throw ApiError.notFound('Блокировка не найдена');
//       }

//       // Удаляем запись о блокировке (или меняем статус на rejected)
//       await FriendRepository.updateRequestStatus(friendship.id, 'rejected');

//       console.log(`✅ FriendService.unblockUser: пользователь разблокирован`);
//       return {
//          success: true,
//          message: 'Пользователь разблокирован'
//       };
//    }

//    // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

//    /**
//     * Получить текстовое описание статуса
//     * @private
//     */
//    _getStatusText(status) {
//       const statusMap = {
//          'pending': 'в ожидании',
//          'accepted': 'принят',
//          'rejected': 'отклонен',
//          'cancelled': 'отменен',
//          'blocked': 'заблокирован'
//       };
//       return statusMap[status] || status;
//    }

//    /**
//     * Проверить, может ли пользователь выполнять действие с другом
//     * @private
//     */
//    async _canPerformAction(userId, friendId, requiredStatus = 'accepted') {
//       const friendship = await FriendRepository.findFriendship(userId, friendId, requiredStatus);
//       return !!friendship;
//    }

//    /**
//     * Обогатить список пользователей статусом дружбы
//     * @param {Array} users - массив пользователей
//     * @param {number} currentUserId - ID текущего пользователя
//     */
//    async enrichUsersWithFriendStatus(users, currentUserId) {
//       if (!users || users.length === 0) return users;

//       const enriched = await Promise.all(
//          users.map(async (user) => {
//             const userData = user.toJSON ? user.toJSON() : user;
//             const status = await this.getFriendStatus(currentUserId, userData.id);
//             return {
//                ...userData,
//                friend_status: status
//             };
//          })
//       );

//       return enriched;
//    }
// }

// module.exports = new FriendService();

const ApiError = require('../error/ApiError');
const { sequelize } = require('../models');
const FriendRepository = require('../repository/friendsRepository');
const UserRepository = require('../repository/userRepository');
const TrainingContextRepository = require('../repository/trainingContextRepository');
const { Op } = require('sequelize');

class FriendService {
   // ============ ОСНОВНЫЕ МЕТОДЫ ============

   /**
    * Отправить запрос в друзья
    * @param {number} senderId - ID отправителя
    * @param {number} receiverId - ID получателя
    * @param {string} message - Сообщение к запросу (опционально)
    */
   /**
    * Отправить запрос в друзья
    * @param {number} senderId - ID отправителя
    * @param {number} receiverId - ID получателя
    * @param {string} message - Сообщение к запросу (опционально)
    */
   async sendFriendRequest(senderId, receiverId, message = '') {
      console.log(`🟡 FriendService.sendFriendRequest: ${senderId} -> ${receiverId}`);

      const [sender, receiver] = await Promise.all([
         UserRepository.findUserById(senderId),
         UserRepository.findUserById(receiverId)
      ]);

      if (!sender || !receiver) {
         throw ApiError.notFound('Пользователь не найден');
      }

      if (senderId === receiverId) {
         throw ApiError.badRequest('Нельзя отправить запрос самому себе');
      }

      const existingFriendship = await FriendRepository.findFriendship(senderId, receiverId);

      if (existingFriendship) {
         // Если уже друзья
         if (existingFriendship.status === 'accepted') {
            throw ApiError.badRequest('Вы уже друзья');
         }

         // Если уже есть исходящий запрос (ожидание)
         if (existingFriendship.status === 'pending' && existingFriendship.user_id === senderId) {
            throw ApiError.badRequest('Вы уже отправили запрос этому пользователю');
         }

         // Если уже есть входящий запрос (ожидание)
         if (existingFriendship.status === 'pending' && existingFriendship.friend_id === senderId) {
            throw ApiError.badRequest('Этот пользователь уже отправил вам запрос');
         }

         // ✅ ИСПРАВЛЕНИЕ: если запрос был отклонен или отменен - УДАЛЯЕМ старую запись и создаем НОВУЮ
         if (existingFriendship.status === 'rejected' || existingFriendship.status === 'cancelled') {
            console.log(`🔄 Удаляем старый запрос ${existingFriendship.id} со статуса ${existingFriendship.status} и создаем новый с правильным направлением`);

            // Удаляем старую запись
            await FriendRepository.deleteRequest(existingFriendship.id);

            // Создаем новую запись с правильным направлением (отправитель -> получатель)
            const friendRequest = await FriendRepository.createFriendRequest({
               user_id: senderId,
               friend_id: receiverId,
               message: message || `Запрос в друзья от ${sender.userName || 'пользователя'}`,
               status: 'pending'
            });

            console.log(`✅ FriendService.sendFriendRequest: создан новый запрос, ID: ${friendRequest.id}`);
            return await FriendRepository.getFriendRequestById(friendRequest.id);
         }

         if (existingFriendship.status === 'blocked') {
            throw ApiError.forbidden('Невозможно отправить запрос');
         }
      }

      // Создаем новый запрос (если нет существующей записи)
      const friendRequest = await FriendRepository.createFriendRequest({
         user_id: senderId,
         friend_id: receiverId,
         message: message || `Запрос в друзья от ${sender.userName || 'пользователя'}`,
         status: 'pending'
      });

      console.log(`✅ FriendService.sendFriendRequest: запрос создан, ID: ${friendRequest.id}`);

      return await FriendRepository.getFriendRequestById(friendRequest.id);
   }

   /**
    * Ответить на запрос в друзья
    * @param {number} requestId - ID запроса
    * @param {number} userId - ID пользователя (должен быть получателем)
    * @param {string} action - 'accept' или 'reject'
    */
   async respondToRequest(requestId, userId, action) {
      console.log(`🟡 FriendService.respondToRequest: request ${requestId}, user ${userId}, action ${action}`);

      const request = await FriendRepository.getFriendRequestById(requestId);
      if (!request) {
         throw ApiError.notFound('Запрос не найден');
      }

      if (request.friend_id !== userId) {
         throw ApiError.forbidden('Вы можете отвечать только на входящие запросы');
      }

      if (request.status !== 'pending') {
         throw ApiError.badRequest(`Запрос уже ${this._getStatusText(request.status)}`);
      }

      const result = await sequelize.transaction(async (transaction) => {
         if (action === 'accept') {
            await FriendRepository.updateRequestStatus(requestId, 'accepted', transaction);
            return {
               success: true,
               action: 'accept',
               status: 'accepted',
               friendship: await FriendRepository.getFriendRequestById(requestId, transaction)
            };
         } else {
            await FriendRepository.updateRequestStatus(requestId, 'rejected', transaction);
            return {
               success: true,
               action: 'reject',
               status: 'rejected',
               friendship: null
            };
         }
      });

      console.log(`✅ FriendService.respondToRequest: запрос ${action}ed`);
      return result;
   }

   /**
    * Отменить исходящий запрос
    * @param {number} requestId - ID запроса
    * @param {number} userId - ID пользователя (должен быть отправителем)
    */
   async cancelRequest(requestId, userId) {
      console.log(`🟡 FriendService.cancelRequest: request ${requestId}, user ${userId}`);

      const request = await FriendRepository.getFriendRequestById(requestId);
      if (!request) {
         throw ApiError.notFound('Запрос не найден');
      }

      if (request.user_id !== userId) {
         throw ApiError.forbidden('Вы можете отменять только свои исходящие запросы');
      }

      if (request.status !== 'pending') {
         throw ApiError.badRequest(`Нельзя отменить запрос со статусом "${request.status}"`);
      }

      await FriendRepository.updateRequestStatus(requestId, 'cancelled');

      console.log(`✅ FriendService.cancelRequest: запрос отменен`);
      return {
         success: true,
         message: 'Запрос успешно отменен'
      };
   }

   /**
    * Получить список друзей пользователя
    * @param {number} userId - ID пользователя
    * @param {Object} options - Опции (limit, offset, search)
    */
   async getFriends(userId, options = {}) {
      console.log(`🟡 FriendService.getFriends: user ${userId}, options:`, options);

      const { limit = 50, offset = 0, search = '' } = options;

      const friends = await FriendRepository.getFriends(userId, {
         limit: parseInt(limit),
         offset: parseInt(offset),
         search
      });

      const enrichedFriends = await Promise.all(
         friends.map(async (friend) => {
            const contexts = await TrainingContextRepository.getContextsByFriendId(
               friend.friendship_id,
               { status: 'active' }
            );

            return {
               ...friend,
               training_contexts: contexts,
               contexts_count: contexts.length
            };
         })
      );

      console.log(`✅ FriendService.getFriends: найдено ${enrichedFriends.length} друзей`);
      return enrichedFriends;
   }

   /**
    * Получить запросы в друзья
    * @param {number} userId - ID пользователя
    * @param {string} direction - 'incoming', 'outgoing' или 'all'
    * @param {string} status - Статус запросов (по умолчанию 'pending')
    */
   async getFriendRequests(userId, direction = 'all', status = 'pending') {
      console.log(`🟡 FriendService.getFriendRequests: user ${userId}, direction ${direction}, status ${status}`);

      let requests = [];

      if (direction === 'incoming' || direction === 'all') {
         const incoming = await FriendRepository.getIncomingRequests(userId, status);
         console.log(`📥 Incoming from repository: ${incoming.length} запросов`);

         // ✅ Сохраняем все поля, добавляем только direction
         requests = [...requests, ...incoming.map(req => ({
            ...req,
            direction: 'incoming'
         }))];
      }

      if (direction === 'outgoing' || direction === 'all') {
         const outgoing = await FriendRepository.getOutgoingRequests(userId, status);
         console.log(`📤 Outgoing from repository: ${outgoing.length} запросов`);

         // ✅ Сохраняем все поля, добавляем только direction
         requests = [...requests, ...outgoing.map(req => ({
            ...req,
            direction: 'outgoing'
         }))];
      }

      requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      console.log(`✅ FriendService.getFriendRequests: найдено ${requests.length} запросов`);
      return requests;
   }

   /**
    * Удалить пользователя из друзей
    * @param {number} userId - ID пользователя
    * @param {number} friendId - ID друга
    */
   async removeFriend(userId, friendId) {
      console.log(`🟡 FriendService.removeFriend: user ${userId} -> friend ${friendId}`);

      const friendship = await FriendRepository.findFriendship(userId, friendId, 'accepted');

      if (!friendship) {
         throw ApiError.notFound('Дружба не найдена');
      }

      const activeContexts = await TrainingContextRepository.getContextsBetweenUsers(
         userId,
         friendId,
         { status: 'active' }
      );

      if (activeContexts.length > 0) {
         const contextSports = activeContexts.map(ctx => ctx.sport).join(', ');
         throw ApiError.badRequest(
            `Невозможно удалить друга, пока есть активные контексты тренировок: ${contextSports}. ` +
            'Сначала завершите контексты тренировок.'
         );
      }

      await sequelize.transaction(async (transaction) => {
         const friendRecord = await FriendRepository.findFriendship(userId, friendId);
         if (friendRecord) {
            await FriendRepository.updateRequestStatus(friendRecord.id, 'rejected', transaction);
         }
      });

      console.log(`✅ FriendService.removeFriend: дружба удалена`);
      return {
         success: true,
         message: 'Пользователь удален из друзей'
      };
   }

   /**
    * Проверить статус отношений с пользователем
    * @param {number} userId - ID пользователя
    * @param {number} targetUserId - ID целевого пользователя
    */
   async getFriendStatus(userId, targetUserId) {
      console.log(`🟡 FriendService.getFriendStatus: ${userId} -> ${targetUserId}`);

      const friendship = await FriendRepository.findFriendship(userId, targetUserId);

      if (!friendship) {
         return {
            status: 'none',
            direction: null,
            can_send_request: true
         };
      }

      let direction = null;
      if (friendship.user_id === userId) {
         direction = 'outgoing';
      } else if (friendship.friend_id === userId) {
         direction = 'incoming';
      }

      const canSendRequest = friendship.status === 'rejected' ||
         friendship.status === 'cancelled' ||
         (friendship.status === 'pending' && direction === 'incoming');

      let trainingContexts = [];
      if (friendship.status === 'accepted') {
         trainingContexts = await TrainingContextRepository.getContextsByFriendId(
            friendship.id,
            { status: 'active' }
         );
      }

      return {
         status: friendship.status,
         direction,
         friendship_id: friendship.id,
         can_send_request: canSendRequest,
         training_contexts: trainingContexts,
         acted_at: friendship.acted_at,
         created_at: friendship.created_at
      };
   }

   /**
    * Получить статистику друзей
    * @param {number} userId - ID пользователя
    */
   async getFriendStats(userId) {
      console.log(`🟡 FriendService.getFriendStats: user ${userId}`);

      const stats = {
         total_friends: 0,
         incoming_requests: 0,
         outgoing_requests: 0,
         mutual_friends_count: 0,
         friends_with_contexts: 0
      };

      const friends = await FriendRepository.getFriends(userId, { limit: 1000 });
      stats.total_friends = friends.length;

      const [incoming, outgoing] = await Promise.all([
         FriendRepository.getIncomingRequests(userId, 'pending'),
         FriendRepository.getOutgoingRequests(userId, 'pending')
      ]);

      stats.incoming_requests = incoming.length;
      stats.outgoing_requests = outgoing.length;

      const friendIds = friends.map(f => f.friendId || f.id);
      for (const friendId of friendIds) {
         const friendship = await FriendRepository.findFriendship(userId, friendId);
         if (friendship) {
            const contexts = await TrainingContextRepository.getContextsByFriendId(
               friendship.id,
               { status: 'active' }
            );
            if (contexts.length > 0) {
               stats.friends_with_contexts++;
            }
         }
      }

      console.log(`✅ FriendService.getFriendStats:`, stats);
      return stats;
   }

   /**
    * Поиск по друзьям
    * @param {number} userId - ID пользователя
    * @param {string} query - Поисковый запрос
    * @param {Object} options - Опции (limit, offset)
    */
   async searchFriends(userId, query, options = {}) {
      console.log(`🟡 FriendService.searchFriends: user ${userId}, query "${query}"`);

      const { limit = 20, offset = 0 } = options;

      if (!query || query.trim().length < 2) {
         return [];
      }

      const friends = await FriendRepository.searchFriends(userId, query, {
         limit: parseInt(limit),
         offset: parseInt(offset)
      });

      const enrichedFriends = await Promise.all(
         friends.map(async (friend) => {
            const contexts = await TrainingContextRepository.getContextsBetweenUsers(
               userId,
               friend.id,
               { status: 'active' }
            );
            return {
               ...friend,
               training_contexts: contexts
            };
         })
      );

      console.log(`✅ FriendService.searchFriends: найдено ${enrichedFriends.length} совпадений`);
      return enrichedFriends;
   }

   /**
    * Получить общих друзей
    * @param {number} userId - ID пользователя
    * @param {number} targetUserId - ID целевого пользователя
    */
   async getMutualFriends(userId, targetUserId) {
      console.log(`🟡 FriendService.getMutualFriends: ${userId} & ${targetUserId}`);

      const userFriends = await FriendRepository.getFriends(userId, { limit: 1000 });
      const userFriendIds = new Set(userFriends.map(f => f.friendId || f.id));

      const targetFriends = await FriendRepository.getFriends(targetUserId, { limit: 1000 });

      const mutualFriendIds = targetFriends
         .map(f => f.friendId || f.id)
         .filter(id => userFriendIds.has(id));

      if (mutualFriendIds.length === 0) {
         return [];
      }

      const mutualFriends = await UserRepository.findUsersByIds(mutualFriendIds);

      console.log(`✅ FriendService.getMutualFriends: найдено ${mutualFriends.length} общих друзей`);
      return mutualFriends;
   }

   /**
    * Заблокировать пользователя
    * @param {number} userId - ID пользователя
    * @param {number} blockedUserId - ID блокируемого пользователя
    */
   async blockUser(userId, blockedUserId) {
      console.log(`🟡 FriendService.blockUser: ${userId} блокирует ${blockedUserId}`);

      if (userId === blockedUserId) {
         throw ApiError.badRequest('Нельзя заблокировать самого себя');
      }

      let friendship = await FriendRepository.findFriendship(userId, blockedUserId);

      if (friendship) {
         await FriendRepository.updateRequestStatus(friendship.id, 'blocked');
      } else {
         friendship = await FriendRepository.createFriendRequest({
            user_id: userId,
            friend_id: blockedUserId,
            status: 'blocked',
            message: 'Пользователь заблокирован'
         });
      }

      console.log(`✅ FriendService.blockUser: пользователь заблокирован`);
      return {
         success: true,
         message: 'Пользователь заблокирован'
      };
   }

   /**
    * Разблокировать пользователя
    * @param {number} userId - ID пользователя
    * @param {number} unblockedUserId - ID разблокируемого пользователя
    */
   async unblockUser(userId, unblockedUserId) {
      console.log(`🟡 FriendService.unblockUser: ${userId} разблокирует ${unblockedUserId}`);

      const friendship = await FriendRepository.findFriendship(userId, unblockedUserId, 'blocked');

      if (!friendship) {
         throw ApiError.notFound('Блокировка не найдена');
      }

      await FriendRepository.updateRequestStatus(friendship.id, 'rejected');

      console.log(`✅ FriendService.unblockUser: пользователь разблокирован`);
      return {
         success: true,
         message: 'Пользователь разблокирован'
      };
   }

   // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

   _getStatusText(status) {
      const statusMap = {
         'pending': 'в ожидании',
         'accepted': 'принят',
         'rejected': 'отклонен',
         'cancelled': 'отменен',
         'blocked': 'заблокирован'
      };
      return statusMap[status] || status;
   }

   async _canPerformAction(userId, friendId, requiredStatus = 'accepted') {
      const friendship = await FriendRepository.findFriendship(userId, friendId, requiredStatus);
      return !!friendship;
   }

   async enrichUsersWithFriendStatus(users, currentUserId) {
      if (!users || users.length === 0) return users;

      const enriched = await Promise.all(
         users.map(async (user) => {
            const userData = user.toJSON ? user.toJSON() : user;
            const status = await this.getFriendStatus(currentUserId, userData.id);
            return {
               ...userData,
               friend_status: status
            };
         })
      );

      return enriched;
   }

   /**
 * Получить друзей пользователя по ID (для просмотра чужого профиля)
 * @param {number} userId - ID пользователя, чьих друзей получаем
 * @param {Object} options - Опции (limit, offset, search)
 */
   async getUserFriends(userId, options = {}) {
      console.log(`🟡 FriendService.getUserFriends: user ${userId}, options:`, options);

      const { limit = 50, offset = 0, search = '' } = options;

      const friends = await FriendRepository.getFriends(userId, {
         limit: parseInt(limit),
         offset: parseInt(offset),
         search
      });

      return friends;
   }
}

module.exports = new FriendService();