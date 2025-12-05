const SequelizeMock = require('sequelize-mock');
const {
   User,
   Exercise,
   ExerciseMark,
   Note,
   NoteMark,
   UserExercise,
   UserNote,
   DiaryEntries,
   Sleep,
   Nutrition,
   Workout,
   Mood,
   Hydration
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

// Моки для DiaryEntries
const DiaryEntriesMock = DBMock.define('diaryEntries', {
   entry_id: 1,
   user_id: 1,
   entry_date: new Date(),
   entry_time: '08:00:00',
   entry_notes: 'Test entry notes'
});

// Моки для Sleep
const SleepMock = DBMock.define('sleep', {
   sleep_id: 1,
   entry_id: 1,
   sleep_duration: '08:00:00',
   sleep_quality: 5,
   awakenings: 0
});

// Моки для Nutrition
const NutritionMock = DBMock.define('nutrition', {
   nutrition_id: 1,
   entry_id: 1,
   meal_count: 3,
   calories: 1500,
   macros: { protein: 30, carbs: 50, fats: 20 },
   suplements: 'Vitamin D'
});

// Моки для Workout
const WorkoutMock = DBMock.define('workout', {
   workout_id: 1,
   entry_id: 1,
   workout_type: 'Cardio',
   duration: '01:00:00',
   intensity: 7
});

// Моки для Mood
const MoodMock = DBMock.define('mood', {
   mood_id: 1,
   entry_id: 1,
   mood_rating: 8,
   emotions: 'Happy'
});

// Моки для Hydration
const HydrationMock = DBMock.define('hydration', {
   hydration_id: 1,
   entry_id: 1,
   water_intake: 2.5,
   sports_drinks: 0.5,
   other_drinks: 0.2
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

   describe('DiaryEntries Model', () => {
      beforeEach(() => {
         jest.clearAllMocks(); // Очистка моков перед каждым тестом
      });

      it('should create a diary entry instance with the correct attributes', async () => {
         const entry = await DiaryEntriesMock.create({
            user_id: 1,
            entry_date: new Date(),
            entry_time: '08:00:00',
            entry_notes: 'Test entry notes'
         });

         expect(entry).toBeDefined();
         expect(entry.user_id).toBe(1);
         expect(entry.entry_notes).toBe('Test entry notes');
      });
   });

   describe('Sleep Model', () => {
      it('should create a sleep instance with the correct attributes', async () => {
         const sleep = await SleepMock.create({
            entry_id: 1,
            sleep_duration: '08:00:00',
            sleep_quality: 5,
            awakenings: 0
         });

         expect(sleep).toBeDefined();
         expect(sleep.sleep_quality).toBe(5);
      });
   });

   describe('Nutrition Model', () => {
      it('should create a nutrition instance with the correct attributes', async () => {
         const nutrition = await NutritionMock.create({
            entry_id: 1,
            meal_count: 3,
            calories: 1500,
            macros: { protein: 30, carbs: 50, fats: 20 },
            suplements: 'Vitamin D'
         });

         expect(nutrition).toBeDefined();
         expect(nutrition.calories).toBe(1500);
      });
   });

   describe('Workout Model', () => {
      it('should create a workout instance with the correct attributes', async () => {
         const workout = await WorkoutMock.create({
            entry_id: 1,
            workout_type: 'Cardio',
            duration: '01:00:00',
            intensity: 7
         });

         expect(workout).toBeDefined();
         expect(workout.workout_type).toBe('Cardio');
      });
   });

   describe('Mood Model', () => {
      it('should create a mood instance with the correct attributes', async () => {
         const mood = await MoodMock.create({
            entry_id: 1,
            mood_rating: 8,
            emotions: 'Happy'
         });

         expect(mood).toBeDefined();
         expect(mood.mood_rating).toBe(8);
      });
   });

   it('should create a hydration instance with the correct attributes', async () => {
      const hydration = await HydrationMock.create({
         entry_id: 1,
         water_intake: 2.5,
         sports_drinks: 0.5,
         other_drinks: 0.2
      });

      expect(hydration).toBeDefined();
      expect(hydration.water_intake).toBe(2.5);
      expect(hydration.sports_drinks).toBe(0.5);
      expect(hydration.other_drinks).toBe(0.2);
   });

});
