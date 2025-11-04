import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  //#region Roles
  await prisma.role.createMany({
    data: [
      { name: 'ADMIN', description: 'Administrator with full access' },
      { name: 'EDITOR', description: 'Can edit content' },
      { name: 'VIEWER', description: 'Read-only access' },
    ],

    skipDuplicates: true,
  });
  //#endregion

  //#region Users
  const users = [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      username: 'alice',
      password: 'alicejohnson123',
      roles: ['ADMIN'],
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      username: 'bob',
      password: 'bobsmith123',
      roles: ['EDITOR'],
    },
    {
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      username: 'charlie',
      password: 'charliedavis123',
      roles: ['VIEWER'],
    },
    {
      name: 'Diana Green',
      email: 'diana@example.com',
      username: 'diana',
      password: 'dianagreen123',
      roles: ['EDITOR', 'VIEWER'],
    },
  ];

  const createdUsers: User[] = [];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        username: user.username,
        hash: passwordHash,
        roles: {
          connect: user.roles.map((role) => ({ name: role })),
        },
      },
    });

    createdUsers.push(created);
  }
  //#endregion

  const [alice, bob, charlie, diana] = createdUsers;

  //#region Projects
  await prisma.project.createMany({
    data: [
      {
        title: 'Portfolio Website',
        slug: 'portfolio-website',
        description:
          'A personal portfolio built with Next.js and Tailwind CSS.',
        repoUrl: 'https://github.com/alice/portfolio',
        demoUrl: 'https://alice.dev',
        techStack: ['Next.js', 'Tailwind', 'Prisma', 'PostgreSQL'],
        featured: true,
        userId: alice.id,
      },
      {
        title: 'Blog API',
        slug: 'blog-api',
        description: 'A RESTful API for managing blog posts using NestJS.',
        repoUrl: 'https://github.com/bob/blog-api',
        techStack: ['NestJS', 'TypeScript', 'PostgreSQL'],
        featured: false,
        userId: bob.id,
      },
      {
        title: 'E-Commerce Dashboard',
        slug: 'ecommerce-dashboard',
        description:
          'Admin dashboard for managing products, orders, and analytics.',
        repoUrl: 'https://github.com/diana/ecommerce-dashboard',
        demoUrl: 'https://dashboard.diana.dev',
        techStack: ['React', 'Next.js', 'Supabase', 'Prisma'],
        featured: true,
        userId: diana.id,
      },
      {
        title: 'Open Source CLI Tool',
        slug: 'oss-cli-tool',
        description:
          'A CLI tool that automates project scaffolding using Node.js.',
        repoUrl: 'https://github.com/charlie/oss-cli-tool',
        techStack: ['Node.js', 'Commander.js'],
        featured: false,
        userId: charlie.id,
      },
    ],

    skipDuplicates: true,
  });
  //#endregion

  //#region Posts
  await prisma.post.createMany({
    data: [
      {
        title: 'Hello World',
        slug: 'hello-world',
        content: 'This is my first post!',
        published: true,
        authorId: alice.id,
      },
      {
        title: 'Advanced Prisma Tips',
        slug: 'advanced-prisma-tips',
        content: 'Let’s explore some advanced Prisma features.',
        published: false,
        authorId: bob.id,
      },
      {
        title: 'How I built my E-Commerce Dashboard',
        slug: 'ecommerce-dashboard-build',
        content:
          'In this article, I’ll explain how I built my dashboard using React and Prisma.',
        published: true,
        authorId: diana.id,
      },
      {
        title: 'Open Source Contributions 101',
        slug: 'open-source-101',
        content:
          'A beginner-friendly guide to contributing to open source projects.',
        published: true,
        authorId: charlie.id,
      },
      {
        title: 'Getting Started with Next.js 15',
        slug: 'nextjs-15-intro',
        content:
          'Learn the basics of Next.js 15 and how to set up your first project.',
        published: true,
        authorId: alice.id,
      },
    ],

    skipDuplicates: true,
  });
  //#endregion

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
