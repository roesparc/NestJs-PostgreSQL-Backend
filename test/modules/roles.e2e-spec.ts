import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { cleanDatabase } from '../helpers/database.helper';
import { PrismaClient, Role, User } from '@prisma/client';
import {
  createAdminUser,
  createTestUser,
  loginAs,
} from '../helpers/user-auth.helper';

async function createTestRoles(
  prisma: PrismaClient,
  testUser: User,
): Promise<Role[]> {
  const roles = await Promise.all([
    prisma.role.create({
      data: { name: 'EDITOR' },
    }),
    prisma.role.create({
      data: { name: 'VIEWER' },
    }),
  ]);

  await prisma.user.update({
    where: { id: testUser.id },
    data: {
      roles: {
        connect: roles.map((role) => ({ id: role.id })),
      },
    },
  });

  return roles;
}

describe('Roles', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testUser: User;
  let testUserToken: string;
  let adminUser: User;
  let adminUserToken: string;

  let adminRole: Role;
  let testRoles: Role[];

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

    const [testUserRes, adminUserRes] = await Promise.all([
      createTestUser(prisma),
      createAdminUser(prisma),
    ]);

    testUser = testUserRes;
    adminUser = adminUserRes.user;
    adminRole = adminUserRes.role;

    const [testUserTokenRes, adminUserTokenRes, testRolesRes] =
      await Promise.all([
        loginAs(app, testUser),
        loginAs(app, adminUser),
        createTestRoles(prisma, testUser),
      ]);

    testUserToken = testUserTokenRes;
    adminUserToken = adminUserTokenRes;

    testRoles = testRolesRes;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('POST /roles', () => {
    it('should reject non-admin users requests', async () => {
      const dto = {
        name: 'MANAGER',
        description: 'Manages stuff',
      };

      await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(403);
    });

    it('should create a new role', async () => {
      const dto = {
        name: 'MANAGER',
        description: 'Manages stuff',
      };

      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send(dto)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          name: dto.name,
          description: dto.description,
        }),
      );
    });

    it('should fail when name is too short', async () => {
      const dto = {
        name: 'AB',
        description: 'Invalid',
      };

      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send(dto)
        .expect(400);

      expect(response.body.message).toContain(
        'name must be longer than or equal to 3 characters',
      );
    });

    it('should fail when name is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('name should not be empty');
      expect(response.body.message).toContain('name must be a string');
    });
  });

  describe('GET /roles', () => {
    it('should reject non-admin roles requests', async () => {
      await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);
    });

    it('should return list of roles', async () => {
      const res = await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
    });

    it('should return paginated roles', async () => {
      const res = await request(app.getHttpServer())
        .get('/roles?withPagination=true&page=1&pageSize=1')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(res.body.total).toBe(3);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(1);
      expect(res.body.pageCount).toBe(3);
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('should filter roles by id', async () => {
      const res = await request(app.getHttpServer())
        .get('/roles?id=' + adminRole.id)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(adminRole.id);
    });

    it('should filter by userId (roles with assigned role)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/roles?userId=${testUser.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: testRoles[0].id }),
          expect.objectContaining({ id: testRoles[1].id }),
        ]),
      );
    });

    it('should include users when includeUsers=true', async () => {
      const res = await request(app.getHttpServer())
        .get('/roles?includeUsers=true')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(res.body[0].users).toBeDefined();
    });

    it('should filter by term', async () => {
      const res = await request(app.getHttpServer())
        .get('/roles?term=admin')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('ADMIN');
    });

    it('should filter by createdAt range', async () => {
      const createdAtFrom = testRoles[0].createdAt.toISOString();
      const createdAtTo = testRoles[0].createdAt.toISOString();

      const res = await request(app.getHttpServer())
        .get(`/roles?createdAtFrom=${createdAtFrom}&createdAtTo=${createdAtTo}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: testRoles[0].id }),
        ]),
      );
    });

    it('should support sorting', async () => {
      const res = await request(app.getHttpServer())
        .get('/roles?sortBy=name&sortOrder=asc')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      const names = res.body.map((r: Role) => r.name);
      expect(names).toEqual(['ADMIN', 'EDITOR', 'VIEWER']);
    });

    it('should return empty array when filter matches no roles', async () => {
      const res = await request(app.getHttpServer())
        .get('/roles?term=doesnotexist')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(res.body.length).toBe(0);
    });

    it('should apply pagination and filters together', async () => {
      const res = await request(app.getHttpServer())
        .get('/roles?withPagination=true&page=1&pageSize=1&term=admin')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].name).toBe('ADMIN');
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const res = await request(app.getHttpServer())
        .get('/roles?withPagination=true&page=-1&pageSize=0')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(400);
    });

    it('should support selecting custom fields', async () => {
      const res = await request(app.getHttpServer())
        .get(`/roles?field=id&field=name`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).not.toHaveProperty('description');
    });
  });

  describe('PATCH /roles/id/:id', () => {
    it('should reject non-admin users requests', async () => {
      await request(app.getHttpServer())
        .patch(`/roles/id/${testRoles[0].id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);
    });

    it('should fail when name is too short', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/roles/id/${testRoles[0].id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({ name: 'AB' })
        .expect(400);

      expect(response.body.message).toContain(
        'name must be longer than or equal to 3 characters',
      );
    });

    it('should throw NotFound if role does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/roles/id/0`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({})
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /roles/id/:id', () => {
    it('should reject non-admin users requests', async () => {
      await request(app.getHttpServer())
        .delete(`/roles/id/${testRoles[0].id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);
    });

    it('should throw NotFound if role does not exist', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/roles/id/0`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({})
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should throw Forbidden when trying to delete ADMIN role', async () => {
      await request(app.getHttpServer())
        .delete(`/roles/id/${adminRole.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(403);
    });
  });
});
