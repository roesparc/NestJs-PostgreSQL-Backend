export default async () => {
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
};
