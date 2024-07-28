module.exports = function countOffset(page, limit) {
   return page * limit - limit;
}