// __tests__/User Repository.test.js
const UserRepository = require('../../repository/userRepository');
const { User } = require('../../models/models');

jest.mock('../../models/models', () => ({
   User: {
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
   },
}));

describe('User Repository', () => {
   afterEach(() => {
      jest.clearAllMocks();
   });

   describe('findUser ', () => {
      it('должен находить пользователя по email', async () => {
         const email = 'test@example.com';
         const mockUser = { id: 1, email };
         User.findOne.mockResolvedValue(mockUser);

         const user = await UserRepository.findUser(email);
         expect(User.findOne).toHaveBeenCalledWith({ where: { email } });
         expect(user).toEqual(mockUser);
      });
   });

   describe('getAllUsers', () => {
      it('должен возвращать всех пользователей', async () => {
         const mockUsers = [{ id: 1, email: 'test@example.com' }];
         User.findAll.mockResolvedValue(mockUsers);

         const users = await UserRepository.getAllUsers();
         expect(User.findAll).toHaveBeenCalled();
         expect(users).toEqual(mockUsers);
      });
   });

   describe('createUser ', () => {
      it('должен создавать нового пользователя', async () => {
         const newUser = { email: 'newuser@example.com' };
         const mockCreatedUser = { id: 2, ...newUser };
         User.create.mockResolvedValue(mockCreatedUser);

         const user = await UserRepository.createUser(newUser);
         expect(User.create).toHaveBeenCalledWith(newUser);
         expect(user).toEqual(mockCreatedUser);
      });
   });

   describe('updateUser ', () => {
      it('должен обновлять пользователя по id', async () => {
         const id = 1;
         const updatedData = { email: 'updated@example.com' };
         const mockUpdatedRows = [1, [{ id, ...updatedData }]];
         User.update.mockResolvedValue(mockUpdatedRows);

         const result = await UserRepository.updateUser(updatedData, id);
         expect(User.update).toHaveBeenCalledWith(
            { ...updatedData },
            {
               where: { id },
               returning: true,
            }
         );
         expect(result).toEqual(mockUpdatedRows);
      });
   });

   describe('deleteUser ', () => {
      it('должен удалять пользователя по id', async () => {
         const id = 1;
         User.destroy.mockResolvedValue(1); // Предполагаем, что один пользователь был удален

         const result = await UserRepository.deleteUser(id);
         expect(User.destroy).toHaveBeenCalledWith({ where: { id } });
         expect(result).toBe(1);
      });
   });

   describe('findUser ById', () => {
      it('должен находить пользователя по id', async () => {
         const id = 1;
         const mockUser = { id, email: 'test@example.com' };
         User.findOne.mockResolvedValue(mockUser);

         const user = await UserRepository.findUserById(id);
         expect(User.findOne).toHaveBeenCalledWith({ where: { id } });
         expect(user).toEqual(mockUser);
      });
   });
});
