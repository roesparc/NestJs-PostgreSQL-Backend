import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/users.dto';
import { ReqUser } from '../../shared/interfaces/request.interface';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
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

  const mockAdminRole = { id: 1, name: 'ADMIN' };

  const mockRole = { id: 2, name: 'EDITOR' };

  const mockAdminReqUser = {
    id: 99,
    roles: [mockAdminRole],
  } as ReqUser;

  const mockReqUser = {
    id: 1,
    roles: [mockRole],
  } as ReqUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const dto: CreateUserDto = {
      firstName: 'test',
      lastName: 'user',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password',
    };

    it('should create a user successfully', async () => {
      prisma.user.findFirst = jest.fn().mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-value');
      prisma.user.create = jest.fn().mockResolvedValue(mockUser);

      const result = await service.create(dto);

      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw if username already exists', async () => {
      prisma.user.findFirst = jest
        .fn()
        .mockResolvedValue({ username: 'testuser' });

      await expect(service.create(dto)).rejects.toThrow(
        'Username is not available',
      );
    });

    it('should throw if email already exists', async () => {
      prisma.user.findFirst = jest
        .fn()
        .mockResolvedValue({ email: 'test@example.com' });

      await expect(service.create(dto)).rejects.toThrow(
        'Email is already in use',
      );
    });
  });

  describe('get', () => {
    const defaultFields = { sortBy: '', sortOrder: '', page: 1, pageSize: 1 };

    it('should return list of users', async () => {
      prisma.user.findMany = jest.fn().mockResolvedValue([mockUser]);

      const result = await service.get(defaultFields);

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should return paginated users', async () => {
      prisma.user.findMany = jest.fn().mockResolvedValue([mockUser]);
      prisma.user.count = jest.fn().mockResolvedValue(1);

      const result = await service.get({
        ...defaultFields,
        withPagination: true,
      });

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(prisma.user.count).toHaveBeenCalled();
      expect(result).toMatchObject({
        total: 1,
        page: 1,
        pageSize: 1,
        pageCount: 1,
        items: [mockUser],
      });
    });

    it('should filter users by id', async () => {
      prisma.user.findMany = jest.fn().mockResolvedValue([mockUser]);

      const result = await service.get({ ...defaultFields, id: [mockUser.id] });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: [mockUser.id] } },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockUser.id);
    });

    it('should filter by roleId (users with assigned role)', async () => {
      prisma.user.findMany = jest.fn().mockResolvedValue([mockUser]);

      const result = await service.get({
        ...defaultFields,
        roleId: [mockRole.id],
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            roles: { some: { id: { in: [mockRole.id] } } },
          },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should include roles when includeRoles=true', async () => {
      prisma.user.findMany = jest
        .fn()
        .mockResolvedValue([{ ...mockUser, roles: [mockRole] }]);

      const result = await service.get({
        ...defaultFields,
        includeRoles: true,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { roles: true },
        }),
      );
      expect(result[0].roles).toBeDefined();
    });

    it('should filter users by email', async () => {
      prisma.user.findMany = jest.fn().mockResolvedValue([mockUser]);

      const result = await service.get({
        ...defaultFields,
        email: mockUser.email,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: mockUser.email },
        }),
      );
      expect(result[0].email).toBe(mockUser.email);
    });

    it('should filter users by username', async () => {
      prisma.user.findMany = jest.fn().mockResolvedValue([mockUser]);

      const result = await service.get({
        ...defaultFields,
        username: mockUser.username,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { username: mockUser.username },
        }),
      );
      expect(result[0].username).toBe(mockUser.username);
    });

    it('should return empty array when no users match filters', async () => {
      prisma.user.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.get({
        ...defaultFields,
        username: 'doesnotexist',
      });

      expect(result).toEqual([]);
    });

    it('should apply pagination + filters', async () => {
      prisma.user.findMany = jest.fn().mockResolvedValue([mockUser]);
      prisma.user.count = jest.fn().mockResolvedValue(1);

      await service.get({
        ...defaultFields,
        withPagination: true,
        email: mockUser.email,
        page: 1,
        pageSize: 1,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: mockUser.email },
          skip: 0,
          take: 1,
        }),
      );
    });

    it('should throw 400 for invalid pagination parameters', async () => {
      await expect(
        service.get({
          ...defaultFields,
          withPagination: true,
          page: -1,
          pageSize: 0,
        }),
      ).rejects.toThrow();
    });

    it('should support sorting', async () => {
      const alice = { ...mockUser, firstName: 'Alice' };
      const john = { ...mockUser, firstName: 'John' };

      prisma.user.findMany = jest.fn().mockResolvedValue([alice, john]);

      await service.get({
        ...defaultFields,
        sortBy: 'firstName',
        sortOrder: 'asc',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { firstName: 'asc' },
        }),
      );
    });

    it('should return only active users', async () => {
      prisma.user.findMany = jest.fn().mockResolvedValue([mockUser]);

      await service.get({ ...defaultFields, isActive: true });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });

    it('should filter by term', async () => {
      prisma.user.findMany = jest.fn().mockResolvedValue([mockUser]);

      const result = await service.get({ ...defaultFields, term: 'john' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
              { username: { contains: 'john', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should filter by createdAt range', async () => {
      prisma.user.findMany = jest.fn().mockResolvedValue([mockUser]);

      const createdAtFrom = new Date().toISOString();
      const createdAtTo = new Date().toISOString();

      await service.get({
        ...defaultFields,
        createdAtFrom,
        createdAtTo,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
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

    it('should support selecting custom fields', async () => {
      prisma.user.findMany = jest
        .fn()
        .mockResolvedValue([{ id: 1, username: 'EDITOR' }]);

      const result = await service.get({
        ...defaultFields,
        field: ['id', 'username'],
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { id: true, username: true },
        }),
      );
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('username');
      expect(result[0]).not.toHaveProperty('email');
    });
  });

  describe('updateById', () => {
    it('should allow a user to update their own profile', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      prisma.user.update = jest.fn().mockResolvedValue(mockUser);

      const result = await service.updateById(mockReqUser, 1, {
        firstName: 'updated',
      });

      expect(result).toBeDefined();
    });

    it('should throw Forbidden if not owner or admin', async () => {
      mockReqUser.id = 2;

      prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      await expect(service.updateById(mockReqUser, 1, {})).rejects.toThrow(
        ForbiddenException,
      );

      mockReqUser.id = 1;
    });

    it('should update user if admin', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      prisma.user.update = jest.fn().mockResolvedValue(mockUser);

      const result = await service.updateById(mockAdminReqUser, 1, {
        firstName: 'updated',
      });

      expect(result).toBeDefined();
    });

    it('should throw NotFound if user does not exist', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.updateById(mockAdminReqUser, 1, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteById', () => {
    it('should delete user', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      prisma.user.delete = jest.fn().mockResolvedValue(mockUser);

      const result = await service.deleteById(1);

      expect(result).toBeDefined();
      expect(prisma.user.delete).toHaveBeenCalled();
    });

    it('should throw NotFound if not exists', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.deleteById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkUsername', () => {
    it('should return available = false when username exists', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      const result = await service.checkUsername('testuser');

      expect(result.isAvailable).toBe(false);
    });

    it('should return available = true when username does not exist', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.checkUsername('testuser');

      expect(result.isAvailable).toBe(true);
    });
  });

  describe('updatePassword', () => {
    const dto = { password: 'newpass' };

    it('should allow user to update their own password', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.update = jest.fn().mockResolvedValue(mockUser);

      const result = await service.updatePassword(mockReqUser, 1, dto);

      expect(result).toBeDefined();
    });

    it('should throw Forbidden if not owner', async () => {
      mockReqUser.id = 2;

      prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      await expect(service.updatePassword(mockReqUser, 1, dto)).rejects.toThrow(
        ForbiddenException,
      );

      mockReqUser.id = 1;
    });

    it('should throw NotFound if user not found', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.updatePassword(mockReqUser, 1, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assignRole', () => {
    it('should assign role successfully', async () => {
      prisma.user.findUnique = jest
        .fn()
        .mockResolvedValue({ ...mockUser, roles: [] });
      prisma.role.findUnique = jest.fn().mockResolvedValue(mockAdminRole);
      prisma.user.update = jest.fn().mockResolvedValue({
        ...mockUser,
        roles: [mockAdminRole],
      });

      const result = await service.assignRole({
        userId: 1,
        roleId: 1,
      });

      expect(result.roles).toEqual([mockAdminRole]);
    });

    it('should throw BadRequest if user already has role', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        roles: [mockAdminRole],
      });
      prisma.role.findUnique = jest.fn().mockResolvedValue(mockAdminRole);

      await expect(
        service.assignRole({ userId: 1, roleId: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFound if role not found', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      prisma.role.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.assignRole({ userId: 1, roleId: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFound if user not found', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);
      prisma.role.findUnique = jest.fn().mockResolvedValue(mockAdminRole);

      await expect(
        service.assignRole({ userId: 1, roleId: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeRole', () => {
    it('should remove role', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        roles: [mockAdminRole],
      });
      prisma.role.findUnique = jest.fn().mockResolvedValue(mockAdminRole);
      prisma.user.update = jest.fn().mockResolvedValue({
        ...mockUser,
        roles: [],
      });

      const result = await service.removeRole({
        userId: 1,
        roleId: 1,
      });

      expect(result.roles).toHaveLength(0);
    });

    it('should throw BadRequest if user does not have role', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        roles: [],
      });
      prisma.role.findUnique = jest.fn().mockResolvedValue(mockAdminRole);

      await expect(
        service.removeRole({ userId: 1, roleId: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFound if role not found', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        roles: [mockAdminRole],
      });
      prisma.role.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.removeRole({ userId: 1, roleId: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFound if user not found', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);
      prisma.role.findUnique = jest.fn().mockResolvedValue(mockAdminRole);

      await expect(
        service.removeRole({ userId: 1, roleId: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
