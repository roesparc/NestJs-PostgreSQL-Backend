import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Role, User } from '@prisma/client';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: PrismaService;

  const mockRole: Role = {
    id: 1,
    name: 'EDITOR',
    description: 'Editor role',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminRole: Role = {
    id: 99,
    name: 'ADMIN',
    description: 'System administrator',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesService, PrismaService],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const dto = {
      name: 'MANAGER',
      description: 'Manages stuff',
    };

    it('should create a role successfully', async () => {
      prisma.role.create = jest.fn().mockResolvedValue(mockRole);

      const result = await service.create(dto);

      expect(prisma.role.create).toHaveBeenCalledWith({
        data: dto,
      });
      expect(result).toEqual(mockRole);
    });
  });

  describe('get', () => {
    const defaultFields = {
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      pageSize: 1,
    };

    it('should return list of roles', async () => {
      prisma.role.findMany = jest.fn().mockResolvedValue([mockRole]);

      const result = await service.get(defaultFields);

      expect(prisma.role.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should return paginated roles', async () => {
      prisma.role.findMany = jest.fn().mockResolvedValue([mockRole]);
      prisma.role.count = jest.fn().mockResolvedValue(1);

      const result = await service.get({
        ...defaultFields,
        withPagination: true,
      });

      expect(prisma.role.findMany).toHaveBeenCalled();
      expect(prisma.role.count).toHaveBeenCalled();
      expect(result).toMatchObject({
        total: 1,
        page: 1,
        pageSize: 1,
        pageCount: 1,
        items: [mockRole],
      });
    });

    it('should filter by id', async () => {
      prisma.role.findMany = jest.fn().mockResolvedValue([mockRole]);

      const result = await service.get({
        ...defaultFields,
        id: [mockRole.id],
      });

      expect(prisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: [mockRole.id] } },
        }),
      );
      expect(result[0].id).toBe(mockRole.id);
    });

    it('should filter by userId (roles assigned to a user)', async () => {
      prisma.role.findMany = jest.fn().mockResolvedValue([mockRole]);

      const result = await service.get({
        ...defaultFields,
        userId: [mockUser.id],
      });

      expect(prisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            users: { some: { id: { in: [mockUser.id] } } },
          },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should include users when includeUsers=true', async () => {
      prisma.role.findMany = jest
        .fn()
        .mockResolvedValue([{ ...mockRole, users: [mockUser] }]);

      const result = await service.get({
        ...defaultFields,
        includeUsers: true,
      });

      expect(prisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { users: true },
        }),
      );
      expect(result[0].users).toBeDefined();
    });

    it('should filter by term', async () => {
      prisma.role.findMany = jest.fn().mockResolvedValue([mockRole]);

      const term = 'edit';

      await service.get({ ...defaultFields, term });

      expect(prisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ name: { contains: term, mode: 'insensitive' } }],
          },
        }),
      );
    });

    it('should filter by createdAt range', async () => {
      prisma.role.findMany = jest.fn().mockResolvedValue([mockRole]);

      const createdAtFrom = new Date().toISOString();
      const createdAtTo = new Date().toISOString();

      await service.get({
        ...defaultFields,
        createdAtFrom,
        createdAtTo,
      });

      expect(prisma.role.findMany).toHaveBeenCalledWith(
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

    it('should return empty array when no roles match filters', async () => {
      prisma.role.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.get({
        ...defaultFields,
        term: 'doesnotexist',
      });

      expect(result).toEqual([]);
    });

    it('should support selecting custom fields', async () => {
      prisma.role.findMany = jest
        .fn()
        .mockResolvedValue([{ id: 1, name: 'EDITOR' }]);

      const result = await service.get({
        ...defaultFields,
        field: ['id', 'name'],
      });

      expect(prisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { id: true, name: true },
        }),
      );
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).not.toHaveProperty('description');
    });

    it('should support sorting', async () => {
      prisma.role.findMany = jest.fn().mockResolvedValue([mockRole]);

      await service.get({
        ...defaultFields,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(prisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('should apply pagination + filters', async () => {
      prisma.role.findMany = jest.fn().mockResolvedValue([mockRole]);
      prisma.role.count = jest.fn().mockResolvedValue(1);

      await service.get({
        ...defaultFields,
        withPagination: true,
        term: 'edit',
        page: 1,
        pageSize: 10,
      });

      expect(prisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ name: { contains: 'edit', mode: 'insensitive' } }],
          },
          skip: 0,
          take: 10,
        }),
      );
    });
  });

  describe('updateById', () => {
    it('should update a role successfully', async () => {
      const updated = { ...mockRole, name: 'UPDATE' };

      prisma.role.findUnique = jest.fn().mockResolvedValue(mockRole);
      prisma.role.update = jest.fn().mockResolvedValue(updated);

      const result = await service.updateById(mockRole.id, {
        name: 'UPDATE',
      });

      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: mockRole.id },
      });

      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: mockRole.id },
        data: { name: 'UPDATE' },
      });

      expect(result).toEqual(updated);
    });

    it('should throw NotFound if role does not exist', async () => {
      prisma.role.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.updateById(1, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteById', () => {
    it('should delete a role successfully', async () => {
      prisma.role.findUnique = jest.fn().mockResolvedValue(mockRole);
      prisma.role.delete = jest.fn().mockResolvedValue(mockRole);

      const result = await service.deleteById(mockRole.id);

      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: mockRole.id },
      });

      expect(prisma.role.delete).toHaveBeenCalledWith({
        where: { id: mockRole.id },
      });

      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      prisma.role.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.deleteById(999)).rejects.toThrow(
        `Role with ID 999 not found`,
      );
    });

    it('should throw ForbiddenException if role is ADMIN', async () => {
      prisma.role.findUnique = jest.fn().mockResolvedValue(mockAdminRole);

      await expect(service.deleteById(mockAdminRole.id)).rejects.toThrow(
        `You do not have permission to delete this Role`,
      );
    });
  });
});
