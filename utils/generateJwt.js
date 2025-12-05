// const jwt = require('jsonwebtoken');

// module.exports = function generateJwt(id, email, role) {
//    return jwt.sign(
//       { id, email, role },
//       process.env.SECRET_KEY,
//       { expiresIn: '24h' }
//    )
// }

const jwt = require('jsonwebtoken');

function generateAccessToken(id, email, role) {
   return jwt.sign(
      { id, email, role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' } // короткий срок
   );
}

function generateRefreshToken(id, email, role) {
   return jwt.sign(
      { id, email, role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' } // долгий срок
   );
}

function verifyAccessToken(token) {
   return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
}

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken };
