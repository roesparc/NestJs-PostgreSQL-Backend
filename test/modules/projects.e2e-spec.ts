import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { cleanDatabase } from '../helpers/database.helper';
import {
  createAdminUser,
  createTestUser,
  loginAs,
} from '../helpers/user-auth.helper';
import {
  CreateProjectDto,
  UpdateProjectDto,
} from '../../src/modules/projects/dto/projects.dto';
import { PrismaClient, Project, User } from 'src/generated/prisma/client';

async function createTestProjects(
  prisma: PrismaClient,
  adminUser: User,
  testUser: User,
): Promise<Project[]> {
  return Promise.all([
    prisma.project.create({
      data: {
        title: 'Admin User Project',
        slug: 'admin-user-project',
        userId: adminUser.id,
        techStack: ['NestJS', 'TypeScript'],
        featured: true,
      },
    }),

    prisma.project.create({
      data: {
        title: 'Test User Project',
        slug: 'test-user-project',
        userId: testUser.id,
      },
    }),
  ]);
}

describe('Projects', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testUser: User;
  let testUserToken: string;
  let adminUser: User;
  let adminUserToken: string;

  let testUserProject: Project;
  let adminUserProject: Project;

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

    [testUser, { user: adminUser }] = await Promise.all([
      createTestUser(prisma),
      createAdminUser(prisma),
    ]);

    [testUserToken, adminUserToken, [adminUserProject, testUserProject]] =
      await Promise.all([
        loginAs(app, testUser),
        loginAs(app, adminUser),
        createTestProjects(prisma, adminUser, testUser),
      ]);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('POST /projects', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer()).post('/projects').expect(401);
    });

    it('should create a new project', async () => {
      const dto: CreateProjectDto = {
        title: 'Test Project',
        slug: 'test-project',
        description: 'test description',
        repoUrl: 'https://github.com/example/repo',
        demoUrl: 'https://example.com/demo',
        techStack: ['NestJS', 'TypeScript'],
        featured: false,
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          ...dto,
          userId: testUser.id,
        }),
      );
    });

    it('should reject if DTO validation fails', async () => {
      const dto: CreateProjectDto = {
        title: 'a',
        slug: 'b',
      };

      const res = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining(
            'title must be longer than or equal to 3 characters',
          ),
          expect.stringContaining(
            'slug must be longer than or equal to 3 characters',
          ),
        ]),
      );
    });

    it('should throw BadRequestException if slug already exists for user', async () => {
      const dto: CreateProjectDto = {
        title: 'Duplicate Slug',
        slug: 'test-user-project',
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(400);

      expect(response.body.message).toContain(
        `A project with slug "${dto.slug}" already exists for this user.`,
      );
    });

    it('should allow same slug for different users', async () => {
      const dto: CreateProjectDto = {
        title: 'Admin Duplicate Slug Allowed',
        slug: testUserProject.slug,
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send(dto)
        .expect(201);

      expect(response.body.slug).toBe(dto.slug);
      expect(response.body.userId).toBe(adminUser.id);
    });

    it('should reject invalid payload', async () => {
      const dto: any = {
        title: '',
        slug: '',
      };

      const res = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(400);

      expect(res.body.message).toContain('title should not be empty');
      expect(res.body.message).toContain('slug should not be empty');
    });

    it('should default techStack to empty array if omitted', async () => {
      const dto: CreateProjectDto = {
        title: 'No Tech Stack',
        slug: 'no-tech-stack',
      };

      const res = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(201);

      expect(res.body.techStack).toEqual([]);
    });

    it('should reject techStack when not array of strings', async () => {
      const dto: any = {
        title: 'Bad Tech Stack',
        slug: 'bad-tech-stack',
        techStack: [123, true],
      };

      const res = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(400);

      expect(res.body.message[0]).toContain(
        'each value in techStack must be a string',
      );
    });
  });

  describe('GET /projects', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer()).get('/projects').expect(401);
    });

    it('should return list of projects', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('should return paginated projects', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?withPagination=true&page=1&pageSize=1')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body.total).toBe(2);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(1);
      expect(res.body.pageCount).toBe(2);
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('should filter projects by id', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?id=' + adminUserProject.id)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(adminUserProject.id);
    });

    it('should filter by userId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/projects?userId=${testUser.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body[0]).toEqual(
        expect.objectContaining({ id: testUserProject!.id }),
      );
    });

    it('should include user when includeUser=true', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?includeUser=true')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body[0].user).toBeDefined();
    });

    it('should filter by slug', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?slug=test-user-project')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].slug).toBe('test-user-project');
    });

    it('should filter by featured status', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?featured=true')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].featured).toBe(true);
    });

    it('should filter by techStack', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?techStack=NestJS&techStack=TypeScript')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].techStack).toEqual(['NestJS', 'TypeScript']);
    });

    it('should filter by term', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?term=test')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Test User Project');
    });

    it('should filter by createdAt range', async () => {
      const createdAtFrom = adminUserProject.createdAt.toISOString();
      const createdAtTo = adminUserProject.createdAt.toISOString();

      const res = await request(app.getHttpServer())
        .get(
          `/projects?createdAtFrom=${createdAtFrom}&createdAtTo=${createdAtTo}`,
        )
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: adminUserProject.id }),
        ]),
      );
    });

    it('should support sorting', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?sortBy=title&sortOrder=asc')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      const names = res.body.map((p: Project) => p.title);
      expect(names).toEqual(['Admin User Project', 'Test User Project']);
    });

    it('should return empty array when filter matches no projects', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?term=doesnotexist')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body.length).toBe(0);
    });

    it('should apply pagination and filters together', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?withPagination=true&page=1&pageSize=1&term=test')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].title).toBe('Test User Project');
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?withPagination=true&page=-1&pageSize=0')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(400);
    });

    it('should support selecting custom fields', async () => {
      const res = await request(app.getHttpServer())
        .get(`/projects?field=id&field=title`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).not.toHaveProperty('description');
    });
  });

  describe('PATCH /projects/id/:id', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .patch(`/projects/id/${adminUserProject.id}`)
        .send({ title: 'Updated Title' })
        .expect(401);
    });

    it('should update a project successfully', async () => {
      const dto: UpdateProjectDto = {
        title: 'Test Project Updated',
        slug: 'test-project-updated',
        description: 'test description updated',
        repoUrl: 'https://github.com/example/repo-updated',
        demoUrl: 'https://example.com/demo-updated',
        techStack: ['NestJS'],
        featured: false,
      };

      const res = await request(app.getHttpServer())
        .patch(`/projects/id/${testUserProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(200);

      expect(res.body).toEqual(expect.objectContaining(dto));
    });

    it('should reject if DTO validation fails', async () => {
      const dto: CreateProjectDto = {
        title: 'a',
        slug: 'b',
      };

      const res = await request(app.getHttpServer())
        .patch(`/projects/id/${testUserProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining(
            'title must be longer than or equal to 3 characters',
          ),
          expect.stringContaining(
            'slug must be longer than or equal to 3 characters',
          ),
        ]),
      );
    });

    it('should return 404 when project does not exist', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/projects/id/0`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: 'New Title' })
        .expect(404);

      expect(res.body.message).toContain(`with ID 0 not found`);
    });

    it('should prevent a user from updating another user project', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/projects/id/${adminUserProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(res.body.message).toContain(
        'You do not have permission to update',
      );
    });

    it('should reject a slug that already exists for the same user', async () => {
      const otherUserProject = await prisma.project.create({
        data: {
          title: 'Other Project',
          slug: 'other-project',
          userId: testUser.id,
        },
      });

      const dto = { slug: otherUserProject.slug };

      const res = await request(app.getHttpServer())
        .patch(`/projects/id/${testUserProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(400);

      expect(res.body.message).toContain(
        `A project with slug "${dto.slug}" already exists for this user.`,
      );
    });

    it('should allow updating slug when unique for the user', async () => {
      const dto = { slug: 'unique-new-slug' };

      const res = await request(app.getHttpServer())
        .patch(`/projects/id/${testUserProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(200);

      expect(res.body.slug).toBe(dto.slug);
    });

    it('should reject invalid techStack entries', async () => {
      const dto: any = { techStack: [123, true] };

      const res = await request(app.getHttpServer())
        .patch(`/projects/id/${testUserProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(400);

      expect(res.body.message[0]).toContain(
        'each value in techStack must be a string',
      );
    });

    it('should not modify fields not provided', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/projects/id/${testUserProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: 'New Title' })
        .expect(200);

      expect(res.body.title).toBe('New Title');
      expect(res.body.slug).toBe(testUserProject.slug);
      expect(res.body.description).toBe(testUserProject.description);
      expect(res.body.techStack).toStrictEqual(testUserProject.techStack);
    });
  });

  describe('DELETE /projects/id/:id', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .delete(`/projects/id/${adminUserProject.id}`)
        .expect(401);
    });

    it('should return 404 if project does not exist', async () => {
      const missingId = 0;

      const res = await request(app.getHttpServer())
        .delete(`/projects/id/${missingId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404);

      expect(res.body.message).toContain(`${missingId} not found`);
    });

    it('should prevent non-owners from deleting a project unless admin', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/projects/id/${adminUserProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);

      expect(res.body.message).toContain(
        'You do not have permission to delete this',
      );
    });

    it('should allow project owner to delete their own project', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/projects/id/${testUserProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body.id).toBe(testUserProject.id);

      const verifyDelete = await prisma.project.findUnique({
        where: { id: testUserProject.id },
      });

      expect(verifyDelete).toBeNull();
    });

    it('should allow admin to delete other user projects', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/projects/id/${testUserProject.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(res.body.id).toBe(testUserProject.id);

      const verifyDelete = await prisma.project.findUnique({
        where: { id: testUserProject.id },
      });

      expect(verifyDelete).toBeNull();
    });
  });

  describe('GET /projects/check-slug', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/projects/check-slug')
        .query({ slug: 'valid-slug' })
        .expect(401);
    });

    it('should reject if DTO validation fails', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects/check-slug')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ slug: 'ab' })
        .expect(400);

      expect(res.body.message).toContain('Slug must be at least 3 characters');
    });

    it('should return isAvailable: false when slug already exists for the same user', async () => {
      const existingSlug = testUserProject.slug;

      const res = await request(app.getHttpServer())
        .get('/projects/check-slug')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ slug: existingSlug })
        .expect(200);

      expect(res.body).toEqual({ isAvailable: false });
    });

    it('should return isAvailable: true when slug exists but belongs to another user', async () => {
      const otherUserSlug = adminUserProject.slug;

      const res = await request(app.getHttpServer())
        .get('/projects/check-slug')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ slug: otherUserSlug })
        .expect(200);

      expect(res.body).toEqual({ isAvailable: true });
    });

    it('should return isAvailable: true when slug does not exist for any user', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects/check-slug')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ slug: 'unique-slug-123' })
        .expect(200);

      expect(res.body).toEqual({ isAvailable: true });
    });
  });
});
