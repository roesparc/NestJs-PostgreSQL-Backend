import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { cleanDatabase } from '../helpers/database.helper';
import {
  createAdminUser,
  createTestUser,
  loginAs,
  testPassword,
} from '../helpers/user-auth.helper';
import { User } from '@prisma/client';

describe('Users', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUser: User;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    testUser = await createTestUser(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'Pass123!',
      };

      const res = await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(Number),
        email: 'john@example.com',
        username: 'johndoe',
      });

      expect(res.body).not.toHaveProperty('hash');
    });

    it('should reject duplicate username', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          firstName: 'Dup',
          lastName: 'User',
          email: 'another@example.com',
          username: testUser.username,
          password: testPassword,
        })
        .expect(400);
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          firstName: 'Dup',
          lastName: 'User',
          email: testUser.email,
          username: 'somenewuser',
          password: testPassword,
        })
        .expect(400);
    });

    it('should reject when required fields are missing', async () => {
      const payload = {
        lastName: 'Doe',
      };

      const res = await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('firstName should not be empty'),
          expect.stringContaining('email should not be empty'),
          expect.stringContaining('username should not be empty'),
          expect.stringContaining('password should not be empty'),
        ]),
      );
    });

    it('should reject invalid email format', async () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'notanemail',
        username: 'johndoe123',
        password: 'Pass123!',
      };

      const res = await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('email must be an email'),
        ]),
      );
    });

    it('should reject password shorter than 8 characters', async () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe123',
        password: 'Pass1!',
      };

      const res = await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining(
            'password must be longer than or equal to 8 characters',
          ),
        ]),
      );
    });

    it('should reject password without required complexity', async () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe123',
        password: 'password123',
      };

      const res = await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining(
            'Password must include at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
          ),
        ]),
      );
    });

    it('should reject username shorter than 3 characters', async () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'jo',
        password: 'Pass123!',
      };

      const res = await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining(
            'username must be longer than or equal to 3 characters',
          ),
        ]),
      );
    });

    it('should reject first name shorter than 3 characters', async () => {
      const payload = {
        firstName: 'Al',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe123',
        password: 'Pass123!',
      };

      const res = await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining(
            'firstName must be longer than or equal to 3 characters',
          ),
        ]),
      );
    });
  });

  describe('GET /users', () => {
    const extraUser = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
    };

    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/users').expect(401);

      expect(res.body.message).toContain('Unauthorized');
    });

    it('should return list of users', async () => {
      await createTestUser(prisma, extraUser);

      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).not.toHaveProperty('hash');
    });

    it('should return paginated users', async () => {
      await createTestUser(prisma, extraUser);

      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users?withPagination=true&page=1&pageSize=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.total).toBe(2);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(1);
      expect(res.body.pageCount).toBe(2);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items[0]).not.toHaveProperty('hash');
    });

    it('should filter users by id', async () => {
      await createTestUser(prisma, extraUser);

      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users?id=' + testUser.id)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(testUser.id);
    });

    it('should filter by roleId (users with assigned role)', async () => {
      const { user: adminUser, role: adminRole } =
        await createAdminUser(prisma);

      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users?roleId=' + adminRole.id)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(adminUser.id);
    });

    it('should include roles when includeRoles=true', async () => {
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users?includeRoles=true')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body[0].roles).toBeDefined();
    });

    it('should allow filtering by email', async () => {
      await createTestUser(prisma, extraUser);

      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users?email=john@example.com')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].email).toBe('john@example.com');
    });

    it('should allow filtering by username', async () => {
      await createTestUser(prisma, extraUser);

      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users?username=johndoe')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].username).toBe('johndoe');
    });

    it('should return empty array when filter matches no users', async () => {
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users?username=doesnotexist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should apply pagination and filters together', async () => {
      await createTestUser(prisma, extraUser);

      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get(
          '/users?withPagination=true&page=1&pageSize=1&email=john@example.com',
        )
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].email).toBe('john@example.com');
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users?withPagination=true&page=-1&pageSize=0')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body.message).toBeDefined();
    });

    it('should support sorting', async () => {
      await createTestUser(prisma, extraUser);
      await createTestUser(prisma, {
        firstName: 'Alice',
        email: 'a@example.com',
        username: 'alice',
      });

      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users?sortBy=firstName&sortOrder=asc')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const names = res.body.map((u) => u.firstName);
      expect(names).toEqual(['Alice', 'John', 'Test']);
    });

    it('should return only active users', async () => {
      const inactiveUser = await createTestUser(prisma, extraUser);
      await prisma.user.update({
        where: { id: inactiveUser.id },
        data: { isActive: false },
      });

      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users?isActive=true')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.some((u) => u.id === inactiveUser.id)).toBe(false);
    });

    it('should filter by term', async () => {
      await createTestUser(prisma, extraUser);

      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users?term=john')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].firstName).toBe('John');
    });

    it('should filter by createdAt range', async () => {
      const newUser = await createTestUser(prisma, extraUser);

      const createdAtFrom = newUser.createdAt.toISOString();
      const createdAtTo = newUser.createdAt.toISOString();

      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get(`/users?createdAtFrom=${createdAtFrom}&createdAtTo=${createdAtTo}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(newUser.id);
    });

    it('should support selecting custom fields', async () => {
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get(`/users?field=id&field=username`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('username');
      expect(res.body[0]).not.toHaveProperty('email');
    });
  });

  describe('PATCH /users/id/:id', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/id/${testUser.id}`)
        .send({ firstName: 'X' })
        .expect(401);

      expect(res.body.message).toContain('Unauthorized');
    });

    it('should allow a user to update their own profile', async () => {
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .patch(`/users/id/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Updated' })
        .expect(200);

      expect(res.body.firstName).toBe('Updated');
    });

    it('should forbid non-admin from updating another user', async () => {
      const otherUser = await createTestUser(prisma, {
        email: 'other@example.com',
        username: 'otheruser',
      });
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .patch(`/users/id/${otherUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Hack' })
        .expect(403);

      expect(res.body.message).toContain('permission');
    });

    it('should allow ADMIN to update another user', async () => {
      const { user: admin } = await createAdminUser(prisma);
      const token = await loginAs(app, admin);

      const res = await request(app.getHttpServer())
        .patch(`/users/id/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'AdminUpdated' })
        .expect(200);

      expect(res.body.firstName).toBe('AdminUpdated');
    });

    it('should return 404 when user not found', async () => {
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .patch(`/users/id/999999`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Nobody' })
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  describe('DELETE /users/id/:id', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/users/id/${testUser.id}`)
        .expect(401);

      expect(res.body.message).toContain('Unauthorized');
    });

    it('should allow ADMIN to delete a user', async () => {
      const { user: admin } = await createAdminUser(prisma);
      const token = await loginAs(app, admin);

      const res = await request(app.getHttpServer())
        .delete(`/users/id/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(testUser.id);
    });

    it('should return 404 when user not found', async () => {
      const { user: admin } = await createAdminUser(prisma);
      const token = await loginAs(app, admin);

      await request(app.getHttpServer())
        .delete(`/users/id/999999`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('GET /users/me', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .expect(401);

      expect(res.body.message).toContain('Unauthorized');
    });

    it('should return currently authenticated user', async () => {
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(testUser.id);
      expect(res.body.email).toBe(testUser.email);
    });
  });

  describe('GET /users/check-username/:username', () => {
    it('should return available = false when username exists', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/check-username/${testUser.username}`)
        .expect(200);

      expect(res.body).toEqual({ isAvailable: false });
    });

    it('should return available = true when username does not exist', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/check-username/someNewUsername`)
        .expect(200);

      expect(res.body).toEqual({ isAvailable: true });
    });
  });

  describe('PATCH /users/update-password/:id', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/update-password/${testUser.id}`)
        .expect(401);

      expect(res.body.message).toContain('Unauthorized');
    });

    it('should allow user to update their own password', async () => {
      const token = await loginAs(app, testUser);

      await request(app.getHttpServer())
        .patch(`/users/update-password/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'NewPass123!' })
        .expect(200);
    });

    it('should reject password shorter than 8 characters', async () => {
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .patch(`/users/update-password/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'Pass1!' })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining(
            'password must be longer than or equal to 8 characters',
          ),
        ]),
      );
    });

    it('should reject password without required complexity', async () => {
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .patch(`/users/update-password/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'password123' })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining(
            'Password must include at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
          ),
        ]),
      );
    });

    it("should forbid user from updating another user's password", async () => {
      const otherUser = await createTestUser(prisma, {
        email: 'other@example.com',
        username: 'otheruser',
      });
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .patch(`/users/update-password/${otherUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'HackPass123!' })
        .expect(403);

      expect(res.body.message).toContain('permission');
    });

    it('should return 404 when user not found', async () => {
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .patch(`/users/update-password/999999`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'NewPass123!' })
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  describe('PATCH /users/assign-role', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/assign-role')
        .send({ userId: testUser.id, roleId: 1 })
        .expect(401);

      expect(res.body.message).toContain('Unauthorized');
    });

    it('should assign a role to a user', async () => {
      const { user: admin } = await createAdminUser(prisma);
      const token = await loginAs(app, admin);

      const role = await prisma.role.create({
        data: { name: 'EDITOR' },
      });

      const res = await request(app.getHttpServer())
        .patch('/users/assign-role')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: testUser.id, roleId: role.id })
        .expect(200);

      expect(res.body.roles.some((r) => r.id === role.id)).toBe(true);
    });

    it('should return 400 if user already has the role', async () => {
      const { user: admin, role } = await createAdminUser(prisma);
      const token = await loginAs(app, admin);

      const res = await request(app.getHttpServer())
        .patch('/users/assign-role')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: admin.id, roleId: role.id })
        .expect(400);

      expect(res.body.message).toContain('already has role');
    });

    it('should return 404 if role not found', async () => {
      const { user: admin } = await createAdminUser(prisma);
      const token = await loginAs(app, admin);

      await request(app.getHttpServer())
        .patch('/users/assign-role')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: testUser.id, roleId: 999999 })
        .expect(404);
    });

    it('should return 404 if user not found', async () => {
      const { user: admin } = await createAdminUser(prisma);
      const token = await loginAs(app, admin);

      const role = await prisma.role.create({
        data: { name: 'TEMP' },
      });

      await request(app.getHttpServer())
        .patch('/users/assign-role')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: 999999, roleId: role.id })
        .expect(404);
    });
  });

  describe('PATCH /users/remove-role', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/remove-role')
        .send({ userId: testUser.id, roleId: 1 })
        .expect(401);

      expect(res.body.message).toContain('Unauthorized');
    });

    it('should remove a role from a user', async () => {
      const { user: admin, role } = await createAdminUser(prisma);
      const token = await loginAs(app, admin);

      const res = await request(app.getHttpServer())
        .patch('/users/remove-role')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: admin.id, roleId: role.id })
        .expect(200);

      expect(res.body.roles.some((r) => r.id === role.id)).toBe(false);
    });

    it('should return 400 if user does not have the role', async () => {
      const { user: admin } = await createAdminUser(prisma);
      const token = await loginAs(app, admin);

      const role = await prisma.role.create({
        data: { name: 'EDITOR' },
      });

      const res = await request(app.getHttpServer())
        .patch('/users/remove-role')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: admin.id, roleId: role.id })
        .expect(400);

      expect(res.body.message).toContain('does not have role');
    });

    it('should return 404 when role not found', async () => {
      const { user: admin } = await createAdminUser(prisma);
      const token = await loginAs(app, admin);

      await request(app.getHttpServer())
        .patch('/users/remove-role')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: admin.id, roleId: 999999 })
        .expect(404);
    });

    it('should return 404 when user not found', async () => {
      const { user: admin, role } = await createAdminUser(prisma);
      const token = await loginAs(app, admin);

      await request(app.getHttpServer())
        .patch('/users/remove-role')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: 999999, roleId: role.id })
        .expect(404);
    });
  });
});
