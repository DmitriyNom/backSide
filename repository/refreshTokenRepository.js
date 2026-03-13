const { RefreshToken } = require('../models/legacy_models');

class RefreshTokenRepository {
   async create(token, transaction) {
      return await RefreshToken.create(token, { transaction });
   }

   async getOneToken(token) {
      return await RefreshToken.findOne({ where: { token: token } });
   }

   async deleteOneToken(token) {
      return await RefreshToken.destroy({ where: { token: token } });
   }
}

module.exports = new RefreshTokenRepository();
