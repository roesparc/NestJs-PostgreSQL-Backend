import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { cleanDatabase } from '../helpers/database.helper';
import { createTestUser, testPassword } from '../helpers/user-auth.helper';
import { User } from 'src/generated/prisma/client';

describe('Auth', () => {
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

  describe('POST /auth/login', () => {
    it('should login with valid username and password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: testUser.username,
          password: testPassword,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('should login with valid email and password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: testUser.email,
          password: testPassword,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
    });

    it('should reject invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: testUser.username,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should reject inactive user', async () => {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: testUser.username,
          password: testPassword,
        })
        .expect(401);

      expect(response.body.message).toBe('User account is disabled');
    });

    it('should handle case-sensitive username', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: testUser.username.toUpperCase(),
          password: testPassword,
        })
        .expect(401);
    });

    it('should return valid JWT token that can be decoded', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: testUser.username,
          password: testPassword,
        })
        .expect(201);

      const token = response.body.access_token;

      // Decode without verifying (just to check structure)
      const decoded = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString(),
      );

      expect(decoded).toHaveProperty('userId');
      expect(decoded.userId).toBe(testUser.id);
    });
  });
});
