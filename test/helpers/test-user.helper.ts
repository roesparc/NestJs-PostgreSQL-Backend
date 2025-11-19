import { PrismaClient, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../../src/modules/users/dto/users.dto';

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
