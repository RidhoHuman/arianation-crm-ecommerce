const userService = require('../src/services/userService');
const knex = require('../src/config/knex');

describe('userService', () => {
  beforeEach(async () => {
    // Clear user table before each test
    await knex('user').delete();
  });

  describe('create()', () => {
    test('should create a user successfully and return user object without password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedpassword123',
        fullName: 'Test User',
        phone: '08123456789',
        role: 'CUSTOMER',
        isActive: true,
      };

      const createdUser = await userService.create(userData);

      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBeDefined();
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.fullName).toBe(userData.fullName);
      expect(createdUser.password).toBeUndefined(); // Password must not be returned

      // Verify db entry
      const dbUser = await knex('user').where('id', createdUser.id).first();
      expect(dbUser).toBeDefined();
      expect(dbUser.email).toBe(userData.email);
      expect(dbUser.password).toBe(userData.password);
    });
  });

  describe('findById() and findByEmail()', () => {
    test('should retrieve user by ID and email', async () => {
      const id = 'cuid12345';
      await knex('user').insert({
        id,
        email: 'find@example.com',
        password: 'pass',
        fullName: 'Find Me',
        role: 'CUSTOMER',
        isActive: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const userById = await userService.findById(id);
      expect(userById).toBeDefined();
      expect(userById.email).toBe('find@example.com');

      const userByEmail = await userService.findByEmail('find@example.com');
      expect(userByEmail).toBeDefined();
      expect(userByEmail.id).toBe(id);
    });

    test('should return null if user not found', async () => {
      const user = await userService.findById('non-existent-id');
      expect(user).toBeNull();

      const userByEmail = await userService.findByEmail('nonexistent@email.com');
      expect(userByEmail).toBeNull();
    });
  });

  describe('findMany() and count()', () => {
    beforeEach(async () => {
      await knex('user').insert([
        {
          id: 'user1',
          email: 'user1@example.com',
          password: 'pw1',
          fullName: 'Alice Smith',
          role: 'CUSTOMER',
          isActive: 1,
          createdAt: new Date(Date.now() - 10000),
          updatedAt: new Date(),
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          password: 'pw2',
          fullName: 'Bob Johnson',
          role: 'ADMIN',
          isActive: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    test('should return all users and count correctly', async () => {
      const users = await userService.findMany();
      expect(users.length).toBe(2);

      const total = await userService.count();
      expect(total).toBe(2);
    });

    test('should filter by role', async () => {
      const admins = await userService.findMany({ role: 'ADMIN' });
      expect(admins.length).toBe(1);
      expect(admins[0].id).toBe('user2');

      const total = await userService.count({ role: 'ADMIN' });
      expect(total).toBe(1);
    });

    test('should filter by isActive status', async () => {
      const activeUsers = await userService.findMany({ isActive: true });
      expect(activeUsers.length).toBe(1);
      expect(activeUsers[0].id).toBe('user1');

      const total = await userService.count({ isActive: false });
      expect(total).toBe(1);
    });

    test('should search by name or email', async () => {
      const searchRes = await userService.findMany({ search: 'Alice' });
      expect(searchRes.length).toBe(1);
      expect(searchRes[0].id).toBe('user1');

      const searchRes2 = await userService.findMany({ search: 'user2@' });
      expect(searchRes2.length).toBe(1);
      expect(searchRes2[0].id).toBe('user2');
    });
  });

  describe('update()', () => {
    test('should update user fields successfully', async () => {
      const id = 'user-to-update';
      await knex('user').insert({
        id,
        email: 'original@example.com',
        password: 'pw',
        fullName: 'Original Name',
        role: 'CUSTOMER',
        isActive: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedUser = await userService.update(id, { fullName: 'New Name' });
      expect(updatedUser.fullName).toBe('New Name');

      const dbUser = await knex('user').where('id', id).first();
      expect(dbUser.fullName).toBe('New Name');
    });
  });

  describe('delete()', () => {
    test('should delete user successfully', async () => {
      const id = 'user-to-delete';
      await knex('user').insert({
        id,
        email: 'delete@example.com',
        password: 'pw',
        fullName: 'To Delete',
        role: 'CUSTOMER',
        isActive: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const deleted = await userService.delete(id);
      expect(deleted).toBe(true);

      const dbUser = await knex('user').where('id', id).first();
      expect(dbUser).toBeUndefined();
    });
  });

  describe('updatePassword(), verifyEmail(), deactivate(), activate()', () => {
    const id = 'user-status-test';

    beforeEach(async () => {
      await knex('user').insert({
        id,
        email: 'status@example.com',
        password: 'pw',
        fullName: 'Status Test',
        role: 'CUSTOMER',
        isActive: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    test('updatePassword should hash or update password directly in database', async () => {
      await userService.updatePassword(id, 'new-hashed-pw');
      const dbUser = await knex('user').where('id', id).first();
      expect(dbUser.password).toBe('new-hashed-pw');
    });

    test('deactivate and activate should toggle isActive status', async () => {
      await userService.deactivate(id);
      let dbUser = await knex('user').where('id', id).first();
      expect(dbUser.isActive === 1 || dbUser.isActive === true).toBe(false);

      await userService.activate(id);
      dbUser = await knex('user').where('id', id).first();
      expect(dbUser.isActive === 1 || dbUser.isActive === true).toBe(true);
    });
  });
});
