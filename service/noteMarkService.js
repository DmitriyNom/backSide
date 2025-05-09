const { deleteOneGroup } = require('../controllers/noteMarkController');
const ApiError = require('../error/ApiError');
const { NoteMark } = require('../models/models')


class NoteMarkService {



   async getAllMarksForNote(limit, offset) {

      return await NoteMark.findAndCountAll({ limit, offset })

   }

   async getOneMark(id) {
      const foundMark = await NoteMark.findOne(
         {
            where: { id }
         }
      )
      return foundMark;
   }

   async createMark(mark) {
      return await NoteMark.create(mark)
   }

   // async updateMark(mark, id) {
   //    const [updatedRowsCount, updatedRows] = await NoteMark.update(
   //       { ...mark },
   //       {
   //          where: { id },
   //          returning: true
   //       }
   //    )

   //    return updatedRows[0].dataValues
   // }

   async updateMark(mark, id) {

      const [updatedRowsCount, updatedRows] = await NoteMark.update(
         { ...mark },
         {
            where: { id },
            returning: true
         }
      )

      // return updatedRows[0].dataValues

      if (updatedRowsCount === 0) {
         throw new Error('Exercise not found or not updated'); // Вы можете выбросить ошибку, если ничего не обновлено
      }

      return updatedRows[0]; // Возвращаем сам объект, а не его dataValues
   }


   // async deleteMark(id) {
   //    await NoteMark.destroy(
   //       {
   //          where: { id }
   //       }
   //    )
   // }

   async deleteOneMark(id) {
      try {
         const mark = await this.getOneMark(id);

         if (!mark) {
            throw new Error('Record not found');
         }

         await mark.destroy();
         console.log("Record deleted successfully");
      } catch (err) {
         console.error('Error deleting record: ', err);
         throw err; // Пробрасываем ошибку дальше
      }
   }

}


module.exports = new NoteMarkService();