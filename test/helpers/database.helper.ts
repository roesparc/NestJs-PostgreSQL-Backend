import { PrismaClient } from 'src/generated/prisma/client';

export async function cleanDatabase(prisma: PrismaClient) {
  // Order matters due to foreign key constraints
  await prisma.post.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
}
