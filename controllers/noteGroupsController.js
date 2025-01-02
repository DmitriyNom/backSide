const ApiError = require('../error/ApiError');
const { userNote } = require("../models/models")
const countOffset = require('../utils/countOffset')
const NoteGroupsService = require('../service/noteGroupsService')



class NoteGroupsController {

   async getAllGroupsForNotes(req, res) {

      let { limit, page } = req.query;

      page = page || 1;
      limit = limit || 100;

      let offset = countOffset(page, limit)

      const noteGroups = await NoteGroupsService.getAllNoteGroups(limit, offset)

      return res.json(noteGroups)
   }

   async getOneGroupForNotes(req, res) {
      const { id } = req.params
      const group = await NoteGroupsService.getOneGroup(id)
      return res.json(group)
   }

   async createOneGroupForNote(req, res) {
      const { title, description, priority } = req.body;
      const newGroup = await NoteGroupsService.createGroup({
         group_title: title,
         group_description: description,
         group_priority: priority
      })

      return res.json(newGroup)
   }

   async updateOneGroupForNote(req, res) {
      const group = req.body
      const { id } = req.params


      const updatedGroup = await NoteGroupsService.updateGroup(group, id)

      return res.json(updatedGroup)
   }

   async deleteOneGroupForNote(req, res) {
      const { id } = req.params;
      await NoteGroupsService.deleteGroup(id);
      return res.json("The group has been deleted");
   }

}

module.exports = new NoteGroupsController();