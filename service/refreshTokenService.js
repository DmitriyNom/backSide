
const ApiError = require('../error/ApiError');
const RefreshTokenRepository = require('../repository/refreshTokenRepository')

class RefreshTokenService {
   async createToken(token, transaction) {
      // note уже содержит userId
      return await RefreshTokenRepository.create(token, transaction);
   }

   async getOneToken(token) {
      return await RefreshTokenRepository.getOneToken(token);
   }

   async deleteOneToken(token) {
      return await RefreshTokenRepository.deleteOneToken(token);
   }
}

module.exports = new RefreshTokenService();
