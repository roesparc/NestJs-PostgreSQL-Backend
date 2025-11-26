import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { Project, User } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { ReqUser } from '../../shared/interfaces/request.interface';
import { CreateProjectDto } from './dto/projects.dto';

describe('ProjectsService', () => {
  let service: ProjectsService;
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

  const mockProject: Project = {
    id: 1,
    title: 'Test Project',
    slug: 'test-project',
    description: 'A simple test project.',
    repoUrl: 'https://github.com/example/test-project',
    demoUrl: 'https://test-project.example.com',
    techStack: ['NestJS', 'TypeScript', 'PostgreSQL'],
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService, PrismaService],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const dto: CreateProjectDto = {
      title: 'Test Project',
      slug: 'test-project',
      techStack: ['NestJS', 'TypeScript', 'PostgreSQL'],
    };

    it('should create a project successfully', async () => {
      prisma.project.findFirst = jest.fn().mockResolvedValue(null);
      prisma.project.create = jest.fn().mockResolvedValue(mockProject);

      const result = await service.create(mockReqUser, dto);

      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { slug: dto.slug, userId: mockReqUser.id },
      });

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          userId: mockReqUser.id,
        },
      });

      expect(result).toEqual(mockProject);
    });

    it('should throw BadRequestException if slug already exists for user', async () => {
      prisma.project.findFirst = jest.fn().mockResolvedValue(mockProject);
      prisma.project.create = jest.fn().mockResolvedValue(null);

      await expect(service.create(mockReqUser, dto)).rejects.toThrow(
        `A project with slug "${dto.slug}" already exists for this user.`,
      );

      expect(prisma.project.create).not.toHaveBeenCalled();
    });

    it('should default techStack to empty array if omitted', async () => {
      prisma.project.findFirst = jest.fn().mockResolvedValue(null);
      prisma.project.create = jest.fn().mockResolvedValue(mockProject);

      const { techStack, ...rest } = dto;

      await service.create(mockReqUser, rest);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          userId: mockReqUser.id,
          techStack: [],
        },
      });
    });
  });

  describe('get', () => {
    const defaultFields = {
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      pageSize: 1,
    };

    it('should return list of projects', async () => {
      prisma.project.findMany = jest.fn().mockResolvedValue([mockProject]);

      const result = await service.get(defaultFields);

      expect(prisma.project.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should return paginated projects', async () => {
      prisma.project.findMany = jest.fn().mockResolvedValue([mockProject]);
      prisma.project.count = jest.fn().mockResolvedValue(1);

      const result = await service.get({
        ...defaultFields,
        withPagination: true,
      });

      expect(prisma.project.findMany).toHaveBeenCalled();
      expect(prisma.project.count).toHaveBeenCalled();
      expect(result).toMatchObject({
        total: 1,
        page: 1,
        pageSize: 1,
        pageCount: 1,
        items: [mockProject],
      });
    });

    it('should filter by id', async () => {
      prisma.project.findMany = jest.fn().mockResolvedValue([mockProject]);

      const result = await service.get({
        ...defaultFields,
        id: [mockProject.id],
      });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: [mockProject.id] } },
        }),
      );
      expect(result[0].id).toBe(mockProject.id);
    });

    it('should filter by userId (projects assigned to a user)', async () => {
      prisma.project.findMany = jest.fn().mockResolvedValue([mockProject]);

      const result = await service.get({
        ...defaultFields,
        userId: [mockUser.id],
      });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: { in: [mockUser.id] },
          },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should include user when includeUser=true', async () => {
      prisma.project.findMany = jest
        .fn()
        .mockResolvedValue([{ ...mockProject, user: mockUser }]);

      const result = await service.get({
        ...defaultFields,
        includeUser: true,
      });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { user: true },
        }),
      );
      expect(result[0].user).toBeDefined();
    });

    it('should filter by slug', async () => {
      prisma.project.findMany = jest.fn().mockResolvedValue([mockProject]);

      const slug = 'test-slug';

      await service.get({ ...defaultFields, slug });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            slug,
          },
        }),
      );
    });

    it('should filter by featured status', async () => {
      prisma.project.findMany = jest.fn().mockResolvedValue([mockProject]);

      const featured = true;

      await service.get({ ...defaultFields, featured });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            featured,
          },
        }),
      );
    });

    it('should filter by tech stack', async () => {
      prisma.project.findMany = jest.fn().mockResolvedValue([mockProject]);

      const techStack = ['NestJS', 'TypeScript'];

      await service.get({ ...defaultFields, techStack });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            techStack: { hasSome: techStack },
          },
        }),
      );
    });

    it('should filter by term', async () => {
      prisma.project.findMany = jest.fn().mockResolvedValue([mockProject]);

      const term = 'test';

      await service.get({ ...defaultFields, term });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
              { repoUrl: { contains: term, mode: 'insensitive' } },
              { demoUrl: { contains: term, mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should filter by createdAt range', async () => {
      prisma.project.findMany = jest.fn().mockResolvedValue([mockProject]);

      const createdAtFrom = new Date().toISOString();
      const createdAtTo = new Date().toISOString();

      await service.get({
        ...defaultFields,
        createdAtFrom,
        createdAtTo,
      });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
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

    it('should return empty array when no projects match filters', async () => {
      prisma.project.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.get({
        ...defaultFields,
        term: 'doesnotexist',
      });

      expect(result).toEqual([]);
    });

    it('should support selecting custom fields', async () => {
      prisma.project.findMany = jest.fn().mockResolvedValue([mockProject]);

      await service.get({
        ...defaultFields,
        field: ['id', 'title'],
      });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { id: true, title: true },
        }),
      );
    });

    it('should support sorting', async () => {
      prisma.project.findMany = jest.fn().mockResolvedValue([mockProject]);

      await service.get({
        ...defaultFields,
        sortBy: 'title',
        sortOrder: 'asc',
      });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: 'asc' },
        }),
      );
    });

    it('should apply pagination + filters', async () => {
      prisma.project.findMany = jest.fn().mockResolvedValue([mockProject]);
      prisma.project.count = jest.fn().mockResolvedValue(1);

      const term = 'test';

      await service.get({
        ...defaultFields,
        withPagination: true,
        term,
        page: 1,
        pageSize: 10,
      });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
              { repoUrl: { contains: term, mode: 'insensitive' } },
              { demoUrl: { contains: term, mode: 'insensitive' } },
            ],
          },
          skip: 0,
          take: 10,
        }),
      );
    });
  });

  describe('updateById', () => {
    const id = 1;

    it('should update a project successfully', async () => {
      const dto = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const updatedProject = { ...mockProject, ...dto };

      prisma.project.findUnique = jest.fn().mockResolvedValue(mockProject);
      prisma.project.findFirst = jest.fn().mockResolvedValue(null);
      prisma.project.update = jest.fn().mockResolvedValue(updatedProject);

      const result = await service.updateById(mockReqUser, id, dto);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id },
      });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          ...dto,
          slug: mockProject.slug,
          techStack: mockProject.techStack,
        },
      });

      expect(result).toEqual(updatedProject);
    });

    it('should throw NotFoundException if project does not exist', async () => {
      prisma.project.findUnique = jest.fn().mockResolvedValue(null);
      prisma.project.update = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateById(mockReqUser, id, { title: 'New Title' }),
      ).rejects.toThrow(`Project with ID ${id} not found`);

      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      prisma.project.findUnique = jest.fn().mockResolvedValue({
        ...mockProject,
        userId: 0,
      });
      prisma.project.update = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateById(mockReqUser, id, { title: 'New Title' }),
      ).rejects.toThrow(`You do not have permission to update this Project.`);

      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if slug is changed and already exists', async () => {
      const dto = { slug: 'new-slug' };

      prisma.project.findUnique = jest.fn().mockResolvedValue(mockProject);
      prisma.project.findFirst = jest.fn().mockResolvedValue(mockProject);
      prisma.project.update = jest.fn().mockResolvedValue(null);

      await expect(service.updateById(mockReqUser, id, dto)).rejects.toThrow(
        `A project with slug "${dto.slug}" already exists for this user.`,
      );

      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should allow slug change when slug is unique', async () => {
      const dto = { slug: 'unique-slug' };

      prisma.project.findUnique = jest.fn().mockResolvedValue(mockProject);
      prisma.project.findFirst = jest.fn().mockResolvedValue(null);
      prisma.project.update = jest.fn().mockResolvedValue(mockProject);

      const result = await service.updateById(mockReqUser, id, dto);

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          slug: dto.slug,
          techStack: mockProject.techStack,
        },
      });
    });

    it('should update techStack when provided', async () => {
      const dto = { techStack: ['Node', 'React'] };

      prisma.project.findUnique = jest.fn().mockResolvedValue(mockProject);
      prisma.project.findFirst = jest.fn().mockResolvedValue(null);
      prisma.project.update = jest.fn().mockResolvedValue({
        ...mockProject,
        techStack: dto.techStack,
      });

      const result = await service.updateById(mockReqUser, id, dto);

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          slug: mockProject.slug,
          techStack: dto.techStack,
        },
      });

      expect(result.techStack).toEqual(dto.techStack);
    });
  });

  describe('deleteById', () => {
    const id = 1;

    it('should delete a project successfully when user is owner', async () => {
      prisma.project.findUnique = jest.fn().mockResolvedValue(mockProject);
      prisma.project.delete = jest.fn().mockResolvedValue(mockProject);

      const result = await service.deleteById(mockReqUser, id);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id },
      });

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id },
      });

      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project does not exist', async () => {
      prisma.project.findUnique = jest.fn().mockResolvedValue(null);
      prisma.project.delete = jest.fn().mockResolvedValue(null);

      await expect(service.deleteById(mockReqUser, id)).rejects.toThrow(
        `Project with ID ${id} not found`,
      );

      expect(prisma.project.delete).not.toHaveBeenCalled();
    });

    it('should delete project when user is ADMIN even if not owner', async () => {
      prisma.project.findUnique = jest.fn().mockResolvedValue(mockProject);
      prisma.project.delete = jest.fn().mockResolvedValue(mockProject);

      const result = await service.deleteById(mockAdminReqUser, id);

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id },
      });

      expect(result).toEqual(mockProject);
    });

    it('should throw ForbiddenException if user is not owner and not ADMIN', async () => {
      const otherUser = {
        id: 99,
        roles: [mockRole],
      } as ReqUser;

      prisma.project.findUnique = jest.fn().mockResolvedValue(mockProject);
      prisma.project.delete = jest.fn().mockResolvedValue(null);

      await expect(service.deleteById(otherUser, id)).rejects.toThrow(
        `You do not have permission to delete this Project`,
      );

      expect(prisma.project.delete).not.toHaveBeenCalled();
    });
  });

  describe('checkSlug', () => {
    const userId = 1;
    const query = { slug: 'test-project' };

    it('should return isAvailable: true when slug does not exist', async () => {
      prisma.project.findFirst = jest.fn().mockResolvedValue(null);

      const result = await service.checkSlug(userId, query);

      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { slug: query.slug, userId },
      });

      expect(result).toEqual({ isAvailable: true });
    });

    it('should return isAvailable: false when slug already exists', async () => {
      prisma.project.findFirst = jest.fn().mockResolvedValue(mockProject);

      const result = await service.checkSlug(userId, query);

      expect(result).toEqual({ isAvailable: false });
    });
  });
});
