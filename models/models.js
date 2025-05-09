const sequelize = require('../db');
const { DataTypes } = require('sequelize');

const User = sequelize.define('user', {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   userName: { type: DataTypes.STRING, unique: true },
   firstName: { type: DataTypes.STRING, allowNull: true },
   lastName: { type: DataTypes.STRING, allowNull: true },
   birthDate: { type: DataTypes.DATE, allowNull: true },
   email: { type: DataTypes.STRING, unique: true },
   password: { type: DataTypes.STRING, allowNull: false },
   role: { type: DataTypes.STRING, defaultValue: "User" },
   height: { type: DataTypes.INTEGER, allowNull: true },
   weight: { type: DataTypes.INTEGER, allowNull: true },
   position: { type: DataTypes.STRING },
   country: { type: DataTypes.STRING },
   city: { type: DataTypes.STRING },
   teamName: { type: DataTypes.STRING },
   userAvatar: { type: DataTypes.STRING, validate: { isUrl: true }, allowNull: true }
})

const Exercise = sequelize.define('exercise', {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   exercise_name: { type: DataTypes.STRING, unique: true },
   exercise_description: { type: DataTypes.STRING, defaultValue: "Exercise description" },
   // exercise_mark: { type: DataTypes.STRING, allowNull: false },
   exercise_media: { type: DataTypes.STRING } //Добавить обязательное заполнение
})

const ExerciseMark = sequelize.define('exerciseMark', {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   ex_mark_title: { type: DataTypes.STRING, unique: true },
   ex_mark_description: { type: DataTypes.STRING, defaultValue: "A mark without description" },
})

const Note = sequelize.define("note", {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   note_name: { type: DataTypes.STRING },
   note_description: { type: DataTypes.STRING, defaultValue: "A note without description" },
   note_priority: { type: DataTypes.INTEGER, defaultValue: 1 },
   note_expiration_date: { type: DataTypes.DATE, defaultValue: null },
   note_is_completed: { type: DataTypes.BOOLEAN, defaultValue: false },
   note_mark: { type: DataTypes.STRING }
})

const NoteMark = sequelize.define("noteMark", {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   nt_mark_title: { type: DataTypes.STRING, unique: true },
   nt_mark_description: { type: DataTypes.STRING, defaultValue: "A mark without description" },
   nt_mark_priority: { type: DataTypes.INTEGER, defaultValue: 1 },
})



const UserExercise = sequelize.define("userExercise", {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
})

const UserNote = sequelize.define("userNote", {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
})

// const GroupOfNotes = sequelize.define("groupOfNotes", {
//    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
// })

User.belongsToMany(Exercise, { through: UserExercise })
Exercise.belongsToMany(User, { through: UserExercise })

User.belongsToMany(Note, { through: UserNote })
Note.belongsToMany(User, { through: UserNote })

// Note.belongsTo(NoteGroup, { through: GroupOfNotes })
// NoteGroup.belongsTo(Note, { through: GroupOfNotes })


module.exports = {
   User,
   Exercise,
   UserExercise,
   Note,
   UserNote,
   NoteMark,
   ExerciseMark
   // GroupOfNotes
}