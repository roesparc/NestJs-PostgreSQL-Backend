import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { Post, User } from '@prisma/client';
import { ReqUser } from '../../shared/interfaces/request.interface';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto/posts.dto';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: PrismaService;

  const mockUser: User = {
    id: 1,
    firstName: 'test',
    lastName: 'user',
    username: 'testuser',
    email: 'test@example.com',
    hash: 'hashed-password',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRole = { id: 1, name: 'EDITOR' };

  const mockAdminRole = { id: 99, name: 'ADMIN' };

  const mockReqUser = {
    id: 1,
    roles: [mockRole],
  } as ReqUser;

  const mockAdminReqUser = {
    id: 99,
    roles: [mockAdminRole],
  } as ReqUser;

  const mockPost: Post = {
    id: 1,
    title: 'Test Post',
    slug: 'test-post',
    content: 'This is a test post.',
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostsService, PrismaService],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const dto: CreatePostDto = {
      title: 'Test Post',
      slug: 'test-post',
      content: 'This is a test post.',
    };

    it('should create a post successfully', async () => {
      prisma.post.findFirst = jest.fn().mockResolvedValue(null);
      prisma.post.create = jest.fn().mockResolvedValue(mockPost);

      const result = await service.create(mockReqUser, dto);

      expect(prisma.post.findFirst).toHaveBeenCalledWith({
        where: { slug: dto.slug, authorId: mockReqUser.id },
      });

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          authorId: mockReqUser.id,
        },
      });

      expect(result).toEqual(mockPost);
    });

    it('should throw BadRequestException if slug already exists for user', async () => {
      prisma.post.findFirst = jest.fn().mockResolvedValue(mockPost);
      prisma.post.create = jest.fn().mockResolvedValue(null);

      await expect(service.create(mockReqUser, dto)).rejects.toThrow(
        `A Post with slug "${dto.slug}" already exists for this user.`,
      );

      expect(prisma.post.create).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    const defaultFields = {
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      pageSize: 1,
    };

    it('should return list of posts', async () => {
      prisma.post.findMany = jest.fn().mockResolvedValue([mockPost]);

      const result = await service.get(defaultFields);

      expect(prisma.post.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should return paginated posts', async () => {
      prisma.post.findMany = jest.fn().mockResolvedValue([mockPost]);
      prisma.post.count = jest.fn().mockResolvedValue(1);

      const result = await service.get({
        ...defaultFields,
        withPagination: true,
      });

      expect(prisma.post.findMany).toHaveBeenCalled();
      expect(prisma.post.count).toHaveBeenCalled();
      expect(result).toMatchObject({
        total: 1,
        page: 1,
        pageSize: 1,
        pageCount: 1,
        items: [mockPost],
      });
    });

    it('should filter by id', async () => {
      prisma.post.findMany = jest.fn().mockResolvedValue([mockPost]);

      const result = await service.get({
        ...defaultFields,
        id: [mockPost.id],
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: [mockPost.id] } },
        }),
      );
      expect(result[0].id).toBe(mockPost.id);
    });

    it('should filter by authorId (posts assigned to a user)', async () => {
      prisma.post.findMany = jest.fn().mockResolvedValue([mockPost]);

      const result = await service.get({
        ...defaultFields,
        authorId: [mockUser.id],
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            authorId: { in: [mockUser.id] },
          },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should include author when includeAuthor=true', async () => {
      prisma.post.findMany = jest
        .fn()
        .mockResolvedValue([{ ...mockPost, author: mockUser }]);

      const result = await service.get({
        ...defaultFields,
        includeAuthor: true,
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { author: true },
        }),
      );
      expect(result[0].author).toBeDefined();
    });

    it('should filter by slug', async () => {
      prisma.post.findMany = jest.fn().mockResolvedValue([mockPost]);

      const slug = 'test-slug';

      await service.get({ ...defaultFields, slug });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            slug,
          },
        }),
      );
    });

    it('should filter by published status', async () => {
      prisma.post.findMany = jest.fn().mockResolvedValue([mockPost]);

      const published = true;

      await service.get({ ...defaultFields, published });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            published,
          },
        }),
      );
    });

    it('should filter by term', async () => {
      prisma.post.findMany = jest.fn().mockResolvedValue([mockPost]);

      const term = 'test';

      await service.get({ ...defaultFields, term });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ title: { contains: term, mode: 'insensitive' } }],
          },
        }),
      );
    });

    it('should filter by createdAt range', async () => {
      prisma.post.findMany = jest.fn().mockResolvedValue([mockPost]);

      const createdAtFrom = new Date().toISOString();
      const createdAtTo = new Date().toISOString();

      await service.get({
        ...defaultFields,
        createdAtFrom,
        createdAtTo,
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: new Date(createdAtFrom),
              lte: new Date(createdAtTo),
            },
          },
        }),
      );
    });

    it('should return empty array when no posts match filters', async () => {
      prisma.post.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.get({
        ...defaultFields,
        term: 'doesnotexist',
      });

      expect(result).toEqual([]);
    });

    it('should support selecting custom fields', async () => {
      prisma.post.findMany = jest.fn().mockResolvedValue([mockPost]);

      await service.get({
        ...defaultFields,
        field: ['id', 'title'],
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { id: true, title: true },
        }),
      );
    });

    it('should support sorting', async () => {
      prisma.post.findMany = jest.fn().mockResolvedValue([mockPost]);

      await service.get({
        ...defaultFields,
        sortBy: 'title',
        sortOrder: 'asc',
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: 'asc' },
        }),
      );
    });

    it('should apply pagination + filters', async () => {
      prisma.post.findMany = jest.fn().mockResolvedValue([mockPost]);
      prisma.post.count = jest.fn().mockResolvedValue(1);

      const term = 'test';

      await service.get({
        ...defaultFields,
        withPagination: true,
        term,
        page: 1,
        pageSize: 10,
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ title: { contains: term, mode: 'insensitive' } }],
          },
          skip: 0,
          take: 10,
        }),
      );
    });
  });

  describe('updateById', () => {
    const id = 1;

    it('should update a post successfully', async () => {
      const dto: UpdatePostDto = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      const updatedPost = { ...mockPost, ...dto };

      prisma.post.findUnique = jest.fn().mockResolvedValue(mockPost);
      prisma.post.findFirst = jest.fn().mockResolvedValue(null);
      prisma.post.update = jest.fn().mockResolvedValue(updatedPost);

      const result = await service.updateById(mockReqUser, id, dto);

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id },
      });

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          ...dto,
          slug: mockPost.slug,
        },
      });

      expect(result).toEqual(updatedPost);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      prisma.post.findUnique = jest.fn().mockResolvedValue(null);
      prisma.post.update = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateById(mockReqUser, id, { title: 'something' }),
      ).rejects.toThrow(`Post with ID ${id} not found`);

      expect(prisma.post.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      prisma.post.findUnique = jest.fn().mockResolvedValue({
        ...mockPost,
        authorId: 0,
      });
      prisma.post.update = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateById(mockReqUser, id, { title: 'New Title' }),
      ).rejects.toThrow(`You do not have permission to update this Post.`);

      expect(prisma.post.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when changing slug to one that already exists', async () => {
      const dto = { slug: 'existing-slug' };

      prisma.post.findUnique = jest.fn().mockResolvedValue(mockPost);
      prisma.post.findFirst = jest.fn().mockResolvedValue(mockPost);
      prisma.post.update = jest.fn().mockResolvedValue(null);

      await expect(service.updateById(mockReqUser, id, dto)).rejects.toThrow(
        `A Post with slug "${dto.slug}" already exists for this user.`,
      );

      expect(prisma.post.update).not.toHaveBeenCalled();
    });

    it('should allow slug change when unique', async () => {
      const dto = { slug: 'unique-slug' };

      prisma.post.findUnique = jest.fn().mockResolvedValue(mockPost);
      prisma.post.findFirst = jest.fn().mockResolvedValue(null);
      prisma.post.update = jest.fn().mockResolvedValue({
        ...mockPost,
        slug: dto.slug,
      });

      const result = await service.updateById(mockReqUser, id, dto);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          slug: dto.slug,
        },
      });

      expect(result.slug).toBe(dto.slug);
    });
  });

  describe('deleteById', () => {
    const id = 1;

    it('should delete a post successfully when user is owner', async () => {
      prisma.post.findUnique = jest.fn().mockResolvedValue(mockPost);
      prisma.post.delete = jest.fn().mockResolvedValue(mockPost);

      const result = await service.deleteById(mockReqUser, id);

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id },
      });

      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id },
      });

      expect(result).toEqual(mockPost);
    });

    it('should throw NotFoundException if post does not exist', async () => {
      prisma.post.findUnique = jest.fn().mockResolvedValue(null);
      prisma.post.delete = jest.fn().mockResolvedValue(null);

      await expect(service.deleteById(mockReqUser, id)).rejects.toThrow(
        `Post with ID ${id} not found`,
      );

      expect(prisma.post.delete).not.toHaveBeenCalled();
    });

    it('should delete post when user is ADMIN even if not owner', async () => {
      prisma.post.findUnique = jest.fn().mockResolvedValue(mockPost);
      prisma.post.delete = jest.fn().mockResolvedValue(mockPost);

      const result = await service.deleteById(mockAdminReqUser, id);

      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id },
      });

      expect(result).toEqual(mockPost);
    });

    it('should throw ForbiddenException if user is not owner and not ADMIN', async () => {
      const otherUser = {
        id: 99,
        roles: [mockRole],
      } as ReqUser;

      prisma.post.findUnique = jest.fn().mockResolvedValue(mockPost);
      prisma.post.delete = jest.fn().mockResolvedValue(null);

      await expect(service.deleteById(otherUser, id)).rejects.toThrow(
        `You do not have permission to delete this Post`,
      );

      expect(prisma.post.delete).not.toHaveBeenCalled();
    });
  });

  describe('checkSlug', () => {
    const authorId = 1;
    const query = { slug: 'test-post' };

    it('should return isAvailable: true when slug does not exist', async () => {
      prisma.post.findFirst = jest.fn().mockResolvedValue(null);

      const result = await service.checkSlug(authorId, query);

      expect(prisma.post.findFirst).toHaveBeenCalledWith({
        where: { slug: query.slug, authorId },
      });

      expect(result).toEqual({ isAvailable: true });
    });

    it('should return isAvailable: false when slug already exists', async () => {
      prisma.post.findFirst = jest.fn().mockResolvedValue(mockPost);

      const result = await service.checkSlug(authorId, query);

      expect(result).toEqual({ isAvailable: false });
    });
  });
});
