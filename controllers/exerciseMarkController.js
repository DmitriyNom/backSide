const ApiError = require('../error/ApiError');
const countOffset = require('../utils/countOffset')
const ExerciseMarkService = require('../service/exerciseMarkService');
const { deleteMark } = require('../service/noteMarkService');



class ExerciseMarkController {

   async getAllMarks(req, res) {

      let { limit, page } = req.query;

      page = page || 1;
      limit = limit || 100;

      let offset = countOffset(page, limit)

      const marks = await ExerciseMarkService.getAllMarks(limit, offset)

      return res.json(marks)
   }

   async getOneMark(req, res) {
      const { id } = req.params
      const exMark = await ExerciseMarkService.getOneMark(id)
      return res.json(exMark)
   }

   async createOneMark(req, res) {
      const { ex_mark_title, ex_mark_description } = req.body
      const exerciseMark = await ExerciseMarkService.createOneMark({ ex_mark_title, ex_mark_description })
      return res.json(exerciseMark)
   }

   async updateOneMark(req, res) {
      const exMark = req.body;
      const { id } = req.params;

      const updatedMark = await ExerciseMarkService.updateOneMark(exMark, id)

      return res.json(updatedMark)
   }

   async deleteOneMark(req, res) {
      const { id } = req.params
      const exMark = await ExerciseMarkService.deleteOneMark(id)
      return res.json(exMark)
   }

}

module.exports = new ExerciseMarkController();