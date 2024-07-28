const sequelize = require('../db');
const { DataTypes } = require('sequelize');

const User = sequelize.define('user', {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   userName: { type: DataTypes.STRING, unique: true },
   birthDate: { type: DataTypes.DATE, allowNull: true },
   email: { type: DataTypes.STRING, unique: true },
   password: { type: DataTypes.STRING, allowNull: false },
   role: { type: DataTypes.STRING, defaultValue: "User" }
})

const Exercise = sequelize.define('exercise', {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   exercise_name: { type: DataTypes.STRING, unique: true },
   exercise_description: { type: DataTypes.STRING, defaultValue: "Exercise description" }
})

const Note = sequelize.define("note", {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   notes_name: { type: DataTypes.STRING, unique: true, allowNull: false },
   notes_description: { type: DataTypes.STRING, defaultValue: "A note without description" },
   notes_priority: { type: DataTypes.INTEGER, defaultValue: 1 }
})



const UserExercise = sequelize.define("userExersice", {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
})

const UserNote = sequelize.define("userNote", {
   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
})

User.belongsToMany(Exercise, { through: UserExercise })
Exercise.belongsToMany(User, { through: UserExercise })

User.belongsToMany(Note, { through: UserNote })
Note.belongsToMany(User, { through: UserNote })



module.exports = {
   User,
   Exercise,
   UserExercise,
   Note,
   UserNote
}