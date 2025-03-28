const ApiError = require('../error/ApiError');
const { userNote } = require("../models/models")
const countOffset = require('../utils/countOffset')
const NoteMarkService = require('../service/noteMarkService')



class NoteMarkController {

   async createOneMarkForNote(req, res) {
      const { nt_mark_title, nt_mark_description, nt_mark_priority } = req.body;
      const newMark = await NoteMarkService.createMark({
         nt_mark_title,
         nt_mark_description,
         nt_mark_priority
      })

      return res.json(newMark)
   }

   async getAllMarksForNote(req, res) {

      let { limit, page } = req.query;

      page = page || 1;
      limit = limit || 100;

      let offset = countOffset(page, limit)

      const noteMarks = await NoteMarkService.getAllMarksForNote(limit, offset)

      return res.json(noteMarks)
   }

   async getOneMarkForNote(req, res) {
      const { id } = req.params
      const mark = await NoteMarkService.getOneMark(id)
      return res.json(mark)
   }

   async updateOneMarkForNote(req, res) {
      const mark = req.body
      const { id } = req.params


      const updatedMark = await NoteMarkService.updateMark(mark, id)

      return res.json(updatedMark)
   }

   async deleteOneMarkForNote(req, res) {
      const { id } = req.params;
      await NoteMarkService.deleteMark(id);
      return res.json("The mark has been deleted");
   }

}

module.exports = new NoteMarkController();