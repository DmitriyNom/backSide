const SequelizeMock = require('sequelize-mock');
const {
   User,
   Exercise,
   ExerciseMark,
   Note,
   NoteMark,
   UserExercise,
   UserNote,
} = require('../../models/models');

const DBMock = new SequelizeMock();

// Моки для User
const UserMock = DBMock.define('user', {
   id: 1,
   userName: 'testUser ',
   firstName: 'Test',
   lastName: 'User ',
   email: 'test@example.com',
   password: 'hashedpassword',
});

UserMock.create = jest.fn((userData) => {
   if (userData.email === 'test@example.com') {
      return Promise.reject(new Error('Validation error: email must be unique'));
   }
   return Promise.resolve({
      id: 2, // Новый ID для нового пользователя
      ...userData,
   });
});

// Моки для Exercise
const ExerciseMock = DBMock.define('exercise', {
   id: 1,
   exercise_name: 'Push Up',
   exercise_description: 'A basic exercise',
});

// Моки для ExerciseMark
const ExerciseMarkMock = DBMock.define('exerciseMark', {
   id: 1,
   ex_mark_title: 'Excellent',
});

// Моки для Note
const NoteMock = DBMock.define('note', {
   id: 1,
   note_name: 'Test Note',
   note_description: 'This is a test note',
});

// Моки для NoteMark
const NoteMarkMock = DBMock.define('noteMark', {
   id: 1,
   nt_mark_title: 'Important',
});

// Моки для UserExercise
const UserExerciseMock = DBMock.define('userExercise', {
   id: 1,
});

// Моки для UserNote
const UserNoteMock = DBMock.define('userNote', {
   id: 1,
});

describe('Models Tests', () => {
   describe('User  Model', () => {
      beforeEach(() => {
         jest.clearAllMocks(); // Очистка моков перед каждым тестом
      });

      it('should create a user instance with the correct attributes', async () => {
         const user = await UserMock.create({
            userName: 'newUser  ',
            email: 'new@example.com',
            password: 'hashedpassword',
         });

         expect(user).toBeDefined();
         expect(user.userName).toBe('newUser  ');
         expect(user.email).toBe('new@example.com');
      });

      it('should throw an error when creating a user with duplicate email', async () => {
         await expect(UserMock.create({
            userName: 'duplicateUser  ',
            email: 'test@example.com', // Дубликат
            password: 'hashedpassword',
         })).rejects.toThrow('Validation error: email must be unique');
      });
   });


   describe('Exercise Model', () => {
      it('should create an exercise instance with the correct attributes', async () => {
         const exercise = await ExerciseMock.create({
            exercise_name: 'Push Up',
            exercise_description: 'A basic exercise',
         });

         expect(exercise).toBeDefined();
         expect(exercise.exercise_name).toBe('Push Up');
      });
   });

   describe('ExerciseMark Model', () => {
      it('should create an exercise mark instance with the correct attributes', async () => {
         const mark = await ExerciseMarkMock.create({
            ex_mark_title: 'Excellent',
         });

         expect(mark).toBeDefined();
         expect(mark.ex_mark_title).toBe('Excellent');
      });
   });

   describe('Note Model', () => {
      it('should create a note instance with the correct attributes', async () => {
         const note = await NoteMock.create({
            note_name: 'Test Note',
            note_description: 'This is a test note',
         });

         expect(note).toBeDefined();
         expect(note.note_name).toBe('Test Note');
      });
   });

   describe('NoteMark Model', () => {
      it('should create a note mark instance with the correct attributes', async () => {
         const mark = await NoteMarkMock.create({
            nt_mark_title: 'Important',
         });

         expect(mark).toBeDefined();
         expect(mark.nt_mark_title).toBe('Important');
      });
   });

   describe('User Exercise Model', () => {
      it('should create a user exercise instance', async () => {
         const userExercise = await UserExerciseMock.create({});
         expect(userExercise).toBeDefined();
      });
   });

   describe('User Note Model', () => {
      it('should create a user note instance', async () => {
         const userNote = await UserNoteMock.create({});
         expect(userNote).toBeDefined();
      });
   });
});
