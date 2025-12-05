// const UserService = require('../../service/userService'); // Укажите правильный путь
// const { User } = require('../../models/models');
// const ApiError = require('../../error/ApiError');
// const fs = require('fs');
// const path = require('path');

// jest.mock('../../models/models'); // Мокируем модель User
// jest.mock('fs'); // Мокируем файловую систему

// describe('User Service', () => {
//    afterEach(() => {
//       jest.clearAllMocks(); // Очищаем мокированные функции после каждого теста
//    });

//    test('findUser  should return a user if found', async () => {
//       const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
//       User.findOne.mockResolvedValue(mockUser); // Мокаем метод findOne

//       const user = await UserService.findUser('test@example.com');
//       expect(user).toEqual(mockUser);
//       expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
//    });

//    test('getAllUsers should return all users', async () => {
//       const mockUsers = [{ id: 1, email: 'test@example.com' }, { id: 2, email: 'another@example.com' }];
//       User.findAll.mockResolvedValue(mockUsers); // Мокаем метод findAll

//       const users = await UserService.getAllUsers();
//       expect(users).toEqual(mockUsers);
//    });

//    test('createUser  should create a new user', async () => {
//       const newUser = { email: 'new@example.com', password: 'password' };
//       User.create.mockResolvedValue(newUser); // Мокаем метод create

//       const user = await UserService.createUser(newUser);
//       expect(user).toEqual(newUser);
//    });


//    test('deleteUser  should delete a user', async () => {
//       User.destroy.mockResolvedValue(1); // Мокаем метод destroy

//       const result = await UserService.deleteUser(1);
//       expect(result).toBe(1);
//       expect(User.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
//    });

//    test('updateUser  should update user and delete old avatar', async () => {
//       const existingUser = { id: 1, email: 'test@example.com', userAvatar: 'oldAvatar.jpg' };
//       const updatedUserData = { email: 'updated@example.com', userAvatar: 'newAvatar.jpg' };
//       User.findOne.mockResolvedValue(existingUser); // Мокаем существующего пользователя
//       User.update.mockResolvedValue([1, [{ ...existingUser, ...updatedUserData }]]); // Мокаем обновление

//       // Мокаем функцию unlink для удаления файла
//       fs.unlink.mockResolvedValue();

//       const updatedUser = await UserService.updateUser(updatedUserData, 1);

//       expect(updatedUser).toEqual({ ...existingUser, ...updatedUserData });
//       expect(User.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
//       expect(User.update).toHaveBeenCalledWith(
//          { ...updatedUserData },
//          { where: { id: 1 }, returning: true }
//       );
//       expect(fs.unlink).toHaveBeenCalledWith(path.join(__dirname, '..', '..', 'uploads', 'oldAvatar.jpg'));
//    });

//    test('updateUser  should throw an error if user not found', async () => {
//       User.findOne.mockResolvedValue(null); // Мокаем несуществующего пользователя

//       await expect(UserService.updateUser({}, 1)).rejects.toThrow(ApiError.notFound('Пользователь с таким id не найден.'));
//    });

//    test('updateUser  should throw an error if data is invalid', async () => {
//       await expect(UserService.updateUser(null, 1)).rejects.toThrow('Некорректные данные для обновления пользователя.');
//    });

//    test('updateUser  should throw an error if update fails', async () => {
//       const existingUser = { id: 1, email: 'test@example.com', userAvatar: 'oldAvatar.jpg' };
//       User.findOne.mockResolvedValue(existingUser); // Мокаем существующего пользователя
//       User.update.mockResolvedValue([0, []]); // Ничего не обновлено

//       await expect(UserService.updateUser({ email: 'updated@example.com' }, 1)).rejects.toThrow('Не удалось обновить пользователя из-за внутренней ошибки.');
//    });
// });

// __tests__/User Service.test.js
const UserService = require('../../service/userService');
const UserRepository = require('../../repository/userRepository');
const ApiError = require('../../error/ApiError');
const fs = require('fs');
const path = require('path');

jest.mock('../../repository/userRepository');

describe('User Service', () => {
   afterEach(() => {
      jest.clearAllMocks();
   });

   describe('findUser ', () => {
      it('должен находить пользователя по email', async () => {
         const email = 'test@example.com';
         const mockUser = { id: 1, email };
         UserRepository.findUser.mockResolvedValue(mockUser);

         const user = await UserService.findUser(email);
         expect(UserRepository.findUser).toHaveBeenCalledWith(email);
         expect(user).toEqual(mockUser);
      });
   });

   describe('getAllUsers', () => {
      it('должен возвращать всех пользователей', async () => {
         const mockUsers = [{ id: 1, email: 'test@example.com' }];
         UserRepository.getAllUsers.mockResolvedValue(mockUsers);

         const users = await UserService.getAllUsers();
         expect(UserRepository.getAllUsers).toHaveBeenCalled();
         expect(users).toEqual(mockUsers);
      });
   });

   describe('createUser ', () => {
      it('должен создавать нового пользователя', async () => {
         const newUser = { email: 'newuser@example.com' };
         const mockCreatedUser = { id: 2, ...newUser };
         UserRepository.createUser.mockResolvedValue(mockCreatedUser);

         const user = await UserService.createUser(newUser);
         expect(UserRepository.createUser).toHaveBeenCalledWith(newUser);
         expect(user).toEqual(mockCreatedUser);
      });
   });

   describe('updateUser ', () => {
      it('должен обновлять пользователя по id', async () => {
         const id = 1;
         const updatedData = { email: 'updated@example.com' };
         const mockExistingUser = { id, userAvatar: 'oldAvatar.png' };
         const mockUpdatedRows = [1, [{ id, ...updatedData }]];

         UserRepository.findUserById.mockResolvedValue(mockExistingUser);
         UserRepository.updateUser.mockResolvedValue(mockUpdatedRows);
         jest.spyOn(fs.promises, 'unlink').mockResolvedValue(); // Мокаем unlink

         const result = await UserService.updateUser(updatedData, id);
         expect(UserRepository.findUserById).toHaveBeenCalledWith(id);
         expect(UserRepository.updateUser).toHaveBeenCalledWith(updatedData, id);
         expect(result).toEqual(mockUpdatedRows[1][0]);
         expect(fs.promises.unlink).toHaveBeenCalledWith(path.join(__dirname, '..', '..', 'uploads', mockExistingUser.userAvatar));
      });

      it('должен выбрасывать ошибку, если пользователь не найден', async () => {
         const id = 1;
         const updatedData = { email: 'updated@example.com' };
         UserRepository.findUserById.mockResolvedValue(null);

         await expect(UserService.updateUser(updatedData, id)).rejects.toThrow(ApiError.notFound('Пользователь с таким id не найден.'));
      });

      it('должен выбрасывать ошибку при некорректных данных', async () => {
         const id = 1;

         await expect(UserService.updateUser(null, id)).rejects.toThrow('Некорректные данные для обновления пользователя.');
      });
   });

   describe('deleteUser ', () => {
      it('должен удалять пользователя по id', async () => {
         const id = 1;
         UserRepository.deleteUser.mockResolvedValue(1); // Предполагаем, что один пользователь был удален

         const result = await UserService.deleteUser(id);
         expect(UserRepository.deleteUser).toHaveBeenCalledWith(id);
         expect(result).toBe(1);
      });
   });
});
