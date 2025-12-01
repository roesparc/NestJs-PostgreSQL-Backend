import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../../src/modules/users/dto/users.dto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient, Role, User } from 'src/generated/prisma/client';

export const testPassword = 'Test123!';

export async function createTestUser(
  prisma: PrismaClient,
  overrides?: Partial<CreateUserDto>,
): Promise<User> {
  const password = overrides?.password || testPassword;
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: overrides?.firstName || 'Test',
      lastName: overrides?.lastName || 'User',
      email: overrides?.email || 'test_user@example.com',
      username: overrides?.username || 'testuser',
      hash,
    },
  });

  return user;
}

export async function loginAs(
  app: INestApplication,
  user: User,
  password?: string,
) {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      identifier: user.username,
      password: password ?? testPassword,
    });

  return res.body.access_token;
}

export async function createAdminUser(
  prisma: PrismaClient,
): Promise<{ user: User; role: Role }> {
  const user = await createTestUser(prisma, {
    email: 'admin@example.com',
    username: 'adminuser',
  });

  const role = await prisma.role.create({
    data: { name: 'ADMIN' },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { roles: { connect: { id: role.id } } },
  });

  return { user, role };
}
