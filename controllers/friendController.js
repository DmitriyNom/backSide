// controllers/friendController.js
const ApiError = require('../error/ApiError');
const FriendService = require('../service/friendService');
const UserRepository = require('../repository/userRepository');

class FriendController {
   // ============ УПРАВЛЕНИЕ ЗАПРОСАМИ ============

   /**
    * Отправить запрос в друзья
    * POST /api/friends/request
    */
   async sendRequest(req, res, next) {
      try {
         const senderId = req.user.id;
         const { receiver_id, message } = req.body;

         // Валидация
         if (!receiver_id) {
            throw ApiError.badRequest('Не указан получатель');
         }

         // Проверяем, что получатель существует
         const receiver = await UserRepository.findUserById(receiver_id);
         if (!receiver) {
            throw ApiError.notFound('Пользователь не найден');
         }

         const request = await FriendService.sendFriendRequest(
            senderId,
            parseInt(receiver_id),
            message
         );

         return res.status(201).json({
            success: true,
            data: request,
            message: 'Запрос в друзья успешно отправлен'
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Ответить на запрос в друзья (принять/отклонить)
    * PUT /api/friends/request/:requestId
    */
   async respondToRequest(req, res, next) {
      try {
         const userId = req.user.id;
         const { requestId } = req.params;
         const { action } = req.body;

         if (!['accept', 'reject'].includes(action)) {
            throw ApiError.badRequest('Действие должно быть "accept" или "reject"');
         }

         const result = await FriendService.respondToRequest(
            parseInt(requestId),
            userId,
            action
         );

         return res.json({
            success: true,
            data: result,
            message: action === 'accept'
               ? 'Запрос принят, вы теперь друзья'
               : 'Запрос отклонен'
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Отменить исходящий запрос
    * DELETE /api/friends/request/:requestId
    */
   async cancelRequest(req, res, next) {
      try {
         const userId = req.user.id;
         const { requestId } = req.params;

         const result = await FriendService.cancelRequest(
            parseInt(requestId),
            userId
         );

         return res.json({
            success: true,
            message: result.message || 'Запрос успешно отменен'
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить запросы в друзья
    * GET /api/friends/requests
    */
   async getRequests(req, res, next) {
      try {
         const userId = req.user.id;
         const { direction = 'all', status = 'pending' } = req.query;

         // Валидация direction
         if (!['all', 'incoming', 'outgoing'].includes(direction)) {
            throw ApiError.badRequest('direction должен быть "all", "incoming" или "outgoing"');
         }

         const requests = await FriendService.getFriendRequests(
            userId,
            direction,
            status
         );

         return res.json({
            success: true,
            count: requests.length,
            data: requests
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить количество ожидающих запросов (для бейджа)
    * GET /api/friends/requests/count
    */
   async getPendingRequestsCount(req, res, next) {
      try {
         const userId = req.user.id;

         const [incoming, outgoing] = await Promise.all([
            FriendService.getFriendRequests(userId, 'incoming', 'pending'),
            FriendService.getFriendRequests(userId, 'outgoing', 'pending')
         ]);

         return res.json({
            success: true,
            data: {
               incoming: incoming.length,
               outgoing: outgoing.length,
               total: incoming.length + outgoing.length
            }
         });
      } catch (e) {
         next(e);
      }
   }

   // ============ УПРАВЛЕНИЕ ДРУЗЬЯМИ ============

   /**
    * Получить список друзей
    * GET /api/friends
    */
   async getFriends(req, res, next) {
      try {
         const userId = req.user.id;
         const { limit = 50, offset = 0, search } = req.query;

         const friends = await FriendService.getFriends(userId, {
            limit: parseInt(limit),
            offset: parseInt(offset),
            search
         });

         return res.json({
            success: true,
            count: friends.length,
            data: friends
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Удалить пользователя из друзей
    * DELETE /api/friends/:friendId
    */
   async removeFriend(req, res, next) {
      try {
         const userId = req.user.id;
         const { friendId } = req.params;

         if (!friendId) {
            throw ApiError.badRequest('Не указан друг');
         }

         const result = await FriendService.removeFriend(
            userId,
            parseInt(friendId)
         );

         return res.json({
            success: true,
            message: result.message || 'Пользователь удален из друзей'
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Проверить статус отношений с пользователем
    * GET /api/friends/status/:targetUserId
    */
   async getFriendStatus(req, res, next) {
      try {
         const userId = req.user.id;
         const { targetUserId } = req.params;

         if (!targetUserId) {
            throw ApiError.badRequest('Не указан целевой пользователь');
         }

         const status = await FriendService.getFriendStatus(
            userId,
            parseInt(targetUserId)
         );

         return res.json({
            success: true,
            data: status
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить статистику друзей
    * GET /api/friends/stats
    */
   async getFriendStats(req, res, next) {
      try {
         const userId = req.user.id;

         const stats = await FriendService.getFriendStats(userId);

         return res.json({
            success: true,
            data: stats
         });
      } catch (e) {
         next(e);
      }
   }

   // ============ ПОИСК И РЕКОМЕНДАЦИИ ============

   /**
    * Поиск по друзьям
    * GET /api/friends/search
    */
   async searchFriends(req, res, next) {
      try {
         const userId = req.user.id;
         const { q, limit = 20, offset = 0 } = req.query;

         if (!q || q.length < 2) {
            return res.json({
               success: true,
               count: 0,
               data: []
            });
         }

         const friends = await FriendService.searchFriends(userId, q, {
            limit: parseInt(limit),
            offset: parseInt(offset)
         });

         return res.json({
            success: true,
            count: friends.length,
            data: friends
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить общих друзей с пользователем
    * GET /api/friends/mutual/:targetUserId
    */
   async getMutualFriends(req, res, next) {
      try {
         const userId = req.user.id;
         const { targetUserId } = req.params;

         if (!targetUserId) {
            throw ApiError.badRequest('Не указан целевой пользователь');
         }

         const mutualFriends = await FriendService.getMutualFriends(
            userId,
            parseInt(targetUserId)
         );

         return res.json({
            success: true,
            count: mutualFriends.length,
            data: mutualFriends
         });
      } catch (e) {
         next(e);
      }
   }

   // ============ БЛОКИРОВКИ ============

   /**
    * Заблокировать пользователя
    * POST /api/friends/:userId/block
    */
   async blockUser(req, res, next) {
      try {
         const userId = req.user.id;
         const { userId: blockedUserId } = req.params;

         if (!blockedUserId) {
            throw ApiError.badRequest('Не указан пользователь для блокировки');
         }

         if (parseInt(blockedUserId) === userId) {
            throw ApiError.badRequest('Нельзя заблокировать самого себя');
         }

         const result = await FriendService.blockUser(
            userId,
            parseInt(blockedUserId)
         );

         return res.json({
            success: true,
            message: result.message || 'Пользователь заблокирован'
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Разблокировать пользователя
    * DELETE /api/friends/:userId/block
    */
   async unblockUser(req, res, next) {
      try {
         const userId = req.user.id;
         const { userId: unblockedUserId } = req.params;

         if (!unblockedUserId) {
            throw ApiError.badRequest('Не указан пользователь для разблокировки');
         }

         const result = await FriendService.unblockUser(
            userId,
            parseInt(unblockedUserId)
         );

         return res.json({
            success: true,
            message: result.message || 'Пользователь разблокирован'
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Получить список заблокированных пользователей
    * GET /api/friends/blocked
    */
   async getBlockedUsers(req, res, next) {
      try {
         const userId = req.user.id;

         // Используем существующий метод для получения запросов со статусом blocked
         const blockedRequests = await FriendService.getFriendRequests(userId, 'all', 'blocked');

         // Извлекаем информацию о заблокированных пользователях
         const blockedUsers = blockedRequests.map(req => {
            const blockedUser = req.user_id === userId ? req.recipient : req.initiator;
            return {
               ...blockedUser,
               block_date: req.acted_at || req.created_at,
               request_id: req.id
            };
         });

         return res.json({
            success: true,
            count: blockedUsers.length,
            data: blockedUsers
         });
      } catch (e) {
         next(e);
      }
   }

   // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

   /**
    * Получить список рекомендаций друзей
    * GET /api/friends/recommendations
    */
   async getRecommendations(req, res, next) {
      try {
         const userId = req.user.id;
         const { limit = 10 } = req.query;

         // Получаем ID уже существующих друзей
         const friends = await FriendService.getFriends(userId, { limit: 1000 });
         const friendIds = friends.map(f => f.id || f.friendId);

         // Получаем ID пользователей с активными запросами
         const pendingRequests = await FriendService.getFriendRequests(userId, 'all', 'pending');
         const pendingUserIds = pendingRequests.map(req =>
            req.user_id === userId ? req.friend_id : req.user_id
         );

         // Исключаем: себя, друзей, и тех с кем есть запросы
         const excludeIds = [userId, ...friendIds, ...pendingUserIds];

         // Ищем пользователей для рекомендаций (через userRepository)
         const UserRepository = require('../repository/userRepository');
         const { rows: recommendations } = await UserConnectionRepository?.searchTrainers?.({
            excludeIds,
            limit: parseInt(limit),
            offset: 0
         }) || { rows: [] };

         // Обогащаем статусом
         const enrichedRecommendations = await FriendService.enrichUsersWithFriendStatus(
            recommendations,
            userId
         );

         return res.json({
            success: true,
            count: enrichedRecommendations.length,
            data: enrichedRecommendations
         });
      } catch (e) {
         next(e);
      }
   }

   /**
    * Проверить, является ли пользователь другом
    * GET /api/friends/check/:targetUserId
    */
   async checkIsFriend(req, res, next) {
      try {
         const userId = req.user.id;
         const { targetUserId } = req.params;

         if (!targetUserId) {
            throw ApiError.badRequest('Не указан целевой пользователь');
         }

         const status = await FriendService.getFriendStatus(
            userId,
            parseInt(targetUserId)
         );

         return res.json({
            success: true,
            data: {
               is_friend: status.status === 'accepted',
               status: status.status,
               friendship_id: status.friendship_id
            }
         });
      } catch (e) {
         next(e);
      }
   }

   /**
 * Получить друзей пользователя по ID
 * GET /api/friends/user/:userId
 */
   async getUserFriends(req, res, next) {
      try {
         const { userId } = req.params;
         const { limit = 50, offset = 0, search } = req.query;

         if (!userId) {
            throw ApiError.badRequest('Не указан пользователь');
         }

         // Проверяем, что пользователь существует
         const user = await UserRepository.findUserById(parseInt(userId));
         if (!user) {
            throw ApiError.notFound('Пользователь не найден');
         }

         const friends = await FriendService.getUserFriends(
            parseInt(userId),
            {
               limit: parseInt(limit),
               offset: parseInt(offset),
               search
            }
         );

         // Обогащаем статусом дружбы с текущим пользователем (опционально)
         const currentUserId = req.user.id;
         const enrichedFriends = await FriendService.enrichUsersWithFriendStatus(
            friends,
            currentUserId
         );

         return res.json({
            success: true,
            count: friends.length,
            data: enrichedFriends
         });
      } catch (e) {
         next(e);
      }
   }
}

module.exports = new FriendController();