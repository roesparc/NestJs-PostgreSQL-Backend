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
  CreatePostDto,
  UpdatePostDto,
} from '../../src/modules/posts/dto/posts.dto';
import { Post, PrismaClient, User } from 'src/generated/prisma/client';

async function createTestPosts(
  prisma: PrismaClient,
  adminUser: User,
  testUser: User,
): Promise<Post[]> {
  return Promise.all([
    prisma.post.create({
      data: {
        title: 'Admin User Post',
        slug: 'admin-user-post',
        content: 'Admin post content',
        published: true,
        authorId: adminUser.id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Test User Post',
        slug: 'test-user-post',
        content: 'Test user content',
        authorId: testUser.id,
      },
    }),
  ]);
}

describe('Posts', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testUser: User;
  let adminUser: User;
  let testUserToken: string;
  let adminUserToken: string;

  let adminUserPost: Post;
  let testUserPost: Post;

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

    [testUserToken, adminUserToken, [adminUserPost, testUserPost]] =
      await Promise.all([
        loginAs(app, testUser),
        loginAs(app, adminUser),
        createTestPosts(prisma, adminUser, testUser),
      ]);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('POST /posts', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer()).post('/posts').expect(401);
    });

    it('should create a new post', async () => {
      const dto: CreatePostDto = {
        title: 'New Post',
        slug: 'new-post',
        content: 'Some interesting content',
        published: true,
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          ...dto,
          authorId: testUser.id,
        }),
      );
    });

    it('should reject if DTO validation fails', async () => {
      const dto: CreatePostDto = {
        title: 'a',
        slug: 'b',
        content: 'c',
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining(
            'title must be longer than or equal to 3 characters',
          ),
          expect.stringContaining(
            'slug must be longer than or equal to 3 characters',
          ),
          expect.stringContaining(
            'content must be longer than or equal to 3 characters',
          ),
        ]),
      );
    });

    it('should throw BadRequestException if slug already exists for user', async () => {
      const dto: CreatePostDto = {
        title: 'Duplicate Slug',
        slug: testUserPost.slug,
        content: 'duplicate content',
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(400);

      expect(response.body.message).toContain(
        `A Post with slug "${dto.slug}" already exists for this user.`,
      );
    });

    it('should allow same slug for different users', async () => {
      const dto: CreatePostDto = {
        title: 'Admin Duplicate Slug Allowed',
        slug: testUserPost.slug,
        content: 'Admin content',
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send(dto)
        .expect(201);

      expect(response.body.slug).toBe(dto.slug);
      expect(response.body.authorId).toBe(adminUser.id);
    });

    it('should default published to false if omitted', async () => {
      const dto: CreatePostDto = {
        title: 'Unpublished Post',
        slug: 'unpublished-post',
        content: 'Content without published flag',
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(201);

      expect(response.body.published).toBe(false);
    });

    it('should reject invalid payload', async () => {
      const dto: any = {
        title: '',
        slug: '',
        content: '',
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('title should not be empty'),
          expect.stringContaining('slug should not be empty'),
          expect.stringContaining('content should not be empty'),
        ]),
      );
    });
  });

  describe('GET /posts', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer()).get('/posts').expect(401);
    });

    it('should return list of posts', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should return paginated posts', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts?withPagination=true&page=1&pageSize=1')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(1);
      expect(response.body.pageCount).toBe(2);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should filter posts by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/posts?id=${adminUserPost.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(adminUserPost.id);
    });

    it('should filter by authorId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/posts?authorId=${testUser.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(testUserPost.id);
    });

    it('should include author when includeAuthor=true', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts?includeAuthor=true')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body[0].author).toBeDefined();
    });

    it('should filter by slug', async () => {
      const response = await request(app.getHttpServer())
        .get(`/posts?slug=${testUserPost.slug}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].slug).toBe(testUserPost.slug);
    });

    it('should filter by published status', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts?published=true')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].published).toBe(true);
    });

    it('should filter by term', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts?term=test')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Test User Post');
    });

    it('should filter by createdAt range', async () => {
      const createdAtFrom = adminUserPost.createdAt.toISOString();
      const createdAtTo = adminUserPost.createdAt.toISOString();

      const response = await request(app.getHttpServer())
        .get(`/posts?createdAtFrom=${createdAtFrom}&createdAtTo=${createdAtTo}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: adminUserPost.id }),
        ]),
      );
    });

    it('should support sorting', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts?sortBy=title&sortOrder=asc')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      const titles = response.body.map((p: Post) => p.title);
      expect(titles).toEqual(['Admin User Post', 'Test User Post']);
    });

    it('should return empty array when filter matches no posts', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts?term=doesnotexist')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.length).toBe(0);
    });

    it('should apply pagination and filters together', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts?withPagination=true&page=1&pageSize=1&term=test')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].title).toBe('Test User Post');
    });

    it('should return 400 for invalid pagination parameters', async () => {
      await request(app.getHttpServer())
        .get('/posts?withPagination=true&page=-1&pageSize=0')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(400);
    });

    it('should support selecting custom fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts?field=id&field=title')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).not.toHaveProperty('content');
    });
  });

  describe('PATCH /posts/id/:id', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .patch(`/posts/id/${testUserPost.id}`)
        .send({ title: 'Updated Title' })
        .expect(401);
    });

    it('should update a post successfully', async () => {
      const dto: UpdatePostDto = {
        title: 'Updated Post',
        slug: 'updated-post',
        content: 'Updated content',
        published: true,
      };

      const response = await request(app.getHttpServer())
        .patch(`/posts/id/${testUserPost.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining(dto));
    });

    it('should reject if DTO validation fails', async () => {
      const dto = {
        title: 'a',
        slug: 'b',
        content: 'c',
      };

      const response = await request(app.getHttpServer())
        .patch(`/posts/id/${testUserPost.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining(
            'title must be longer than or equal to 3 characters',
          ),
          expect.stringContaining(
            'slug must be longer than or equal to 3 characters',
          ),
          expect.stringContaining(
            'content must be longer than or equal to 3 characters',
          ),
        ]),
      );
    });

    it('should return 404 when post does not exist', async () => {
      const response = await request(app.getHttpServer())
        .patch('/posts/id/0')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: 'Missing Post' })
        .expect(404);

      expect(response.body.message).toContain('with ID 0 not found');
    });

    it('should prevent a user from updating another user post', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/posts/id/${adminUserPost.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(response.body.message).toContain(
        'You do not have permission to update this Post.',
      );
    });

    it('should reject a slug that already exists for the same user', async () => {
      const otherPost = await prisma.post.create({
        data: {
          title: 'Other Post',
          slug: 'other-post',
          content: 'other content',
          authorId: testUser.id,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/posts/id/${testUserPost.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ slug: otherPost.slug })
        .expect(400);

      expect(response.body.message).toContain(
        `A Post with slug "${otherPost.slug}" already exists for this user.`,
      );
    });

    it('should allow updating slug when unique for the user', async () => {
      const dto = { slug: 'unique-slug' };

      const response = await request(app.getHttpServer())
        .patch(`/posts/id/${testUserPost.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(dto)
        .expect(200);

      expect(response.body.slug).toBe(dto.slug);
    });

    it('should reject invalid published value', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/posts/id/${testUserPost.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ published: 'yes' })
        .expect(400);

      expect(response.body.message[0]).toContain(
        'published must be a boolean value',
      );
    });

    it('should only update fields provided', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/posts/id/${testUserPost.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: 'Partial Update' })
        .expect(200);

      expect(response.body.title).toBe('Partial Update');
      expect(response.body.slug).toBe(testUserPost.slug);
      expect(response.body.content).toBe(testUserPost.content);
    });
  });

  describe('DELETE /posts/id/:id', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .delete(`/posts/id/${testUserPost.id}`)
        .expect(401);
    });

    it('should return 404 if post does not exist', async () => {
      const missingId = 0;

      const response = await request(app.getHttpServer())
        .delete(`/posts/id/${missingId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404);

      expect(response.body.message).toContain(`${missingId} not found`);
    });

    it('should prevent non-owners from deleting a post unless admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/posts/id/${adminUserPost.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);

      expect(response.body.message).toContain(
        'You do not have permission to delete this',
      );
    });

    it('should allow post owner to delete their own post', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/posts/id/${testUserPost.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.id).toBe(testUserPost.id);

      const verifyDelete = await prisma.post.findUnique({
        where: { id: testUserPost.id },
      });

      expect(verifyDelete).toBeNull();
    });

    it('should allow admin to delete other user posts', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/posts/id/${testUserPost.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(response.body.id).toBe(testUserPost.id);

      const verifyDelete = await prisma.post.findUnique({
        where: { id: testUserPost.id },
      });

      expect(verifyDelete).toBeNull();
    });
  });

  describe('GET /posts/check-slug', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/posts/check-slug')
        .query({ slug: 'valid-slug' })
        .expect(401);
    });

    it('should reject if DTO validation fails', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/check-slug')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ slug: 'ab' })
        .expect(400);

      expect(response.body.message).toContain(
        'Slug must be at least 3 characters',
      );
    });

    it('should return isAvailable: false when slug already exists for the same user', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/check-slug')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ slug: testUserPost.slug })
        .expect(200);

      expect(response.body).toEqual({ isAvailable: false });
    });

    it('should return isAvailable: true when slug exists but belongs to another user', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/check-slug')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ slug: adminUserPost.slug })
        .expect(200);

      expect(response.body).toEqual({ isAvailable: true });
    });

    it('should return isAvailable: true when slug does not exist for any user', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/check-slug')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ slug: 'unique-slug-123' })
        .expect(200);

      expect(response.body).toEqual({ isAvailable: true });
    });
  });
});
