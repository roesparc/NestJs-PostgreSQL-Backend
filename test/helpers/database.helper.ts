import { PrismaClient } from 'src/generated/prisma/client';

export async function cleanDatabase(prisma: PrismaClient) {
  assertTestEnvironment();

  const tables = [
    { schema: 'content', table: 'posts' },
    { schema: 'content', table: 'projects' },
    { schema: 'auth', table: 'users' },
    { schema: 'auth', table: 'roles' },
  ];

  await Promise.all(
    tables.map(({ schema, table }) =>
      prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "${schema}"."${table}" RESTART IDENTITY CASCADE;`,
      ),
    ),
  );
}

function assertTestEnvironment() {
  const nodeEnv = process.env.NODE_ENV;
  const url = process.env.DATABASE_URL ?? '';

  if (nodeEnv !== 'test') {
    throw new Error(`ABORTING: tests attempted outside test environment.`);
  }

  if (!url.includes('/npb_test_db')) {
    throw new Error(
      `ABORTING: Database URL does not appear to be a test database: ${url}`,
    );
  }
}
