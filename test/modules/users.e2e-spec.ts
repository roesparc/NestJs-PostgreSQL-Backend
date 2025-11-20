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
  });

  describe('GET /users', () => {
    it('should return list of users for authenticated user', async () => {
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('should filter users by email', async () => {
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .get('/users?email=' + testUser.email)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].email).toBe(testUser.email);
    });
  });

  describe('PATCH /users/id/:id', () => {
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
    it('should allow user to update their own password', async () => {
      const token = await loginAs(app, testUser);

      await request(app.getHttpServer())
        .patch(`/users/update-password/${testUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'NewPass123!' })
        .expect(200);
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
        .send({ password: 'HackPass!' })
        .expect(403);

      expect(res.body.message).toContain('permission');
    });

    it('should return 404 when user not found', async () => {
      const token = await loginAs(app, testUser);

      const res = await request(app.getHttpServer())
        .patch(`/users/update-password/999999`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'NewPass!' })
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  describe('PATCH /users/assign-role', () => {
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
