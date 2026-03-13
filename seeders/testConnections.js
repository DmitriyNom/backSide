// seeders/testConnections.js
const { User, UserConnection, Note } = require('../models');

async function seedTestConnections() {
   console.log('🌱 Создание тестовых данных для связей...');

   // 1. Создаем тестового тренера (с уже хэшированным паролем)
   const trainer = await User.create({
      userName: 'test_trainer',
      email: 'trainer@test.com',
      password: '$2b$05$AlreadyHashedPassword12345', // заглушка
      role: 'trainer',
      sport_specialization: 'Фитнес',
      training_level: 'professional'
   });

   // 2. Создаем тестового подопечного
   const trainee = await User.create({
      userName: 'test_trainee',
      email: 'trainee@test.com',
      password: '$2b$05$AlreadyHashedPassword67890',
      role: 'trainee',
      training_level: 'beginner'
   });

   // 3. Создаем связь тренер-подопечный
   await UserConnection.create({
      trainer_id: trainer.id,
      trainee_id: trainee.id
   });

   // 4. Создаем тестовые задания
   // Личная заметка
   await Note.create({
      user_id: trainee.id,
      note_name: 'Моя первая заметка',
      note_type: 'personal_note',
      status: 'active'
   });

   // Задание себе
   await Note.create({
      user_id: trainee.id,
      note_name: 'Пробежка 5км',
      note_type: 'self_assignment',
      status: 'active',
      planned_date: new Date(Date.now() + 86400000), // завтра
      difficulty_rating: 3
   });

   // Тренерское задание
   await Note.create({
      user_id: trainer.id,
      assigned_to_user_id: trainee.id,
      assigned_by_user_id: trainer.id,
      note_name: 'Приседания 100 раз',
      note_type: 'trainer_assignment',
      status: 'active',
      planned_date: new Date(Date.now() + 2 * 86400000), // послезавтра
      difficulty_rating: 4,
      note_description: 'Техничное выполнение'
   });

   console.log('✅ Тестовые данные созданы:');
   console.log(`   Тренер: ${trainer.userName} (id: ${trainer.id})`);
   console.log(`   Подопечный: ${trainee.userName} (id: ${trainee.id})`);
   console.log('🔑 Для входа используйте существующих пользователей');
}

// Запуск
if (require.main === module) {
   seedTestConnections()
      .then(() => {
         console.log('🎉 Seed завершен!');
         process.exit(0);
      })
      .catch(err => {
         console.error('❌ Ошибка seed:', err);
         process.exit(1);
      });
}

module.exports = seedTestConnections;