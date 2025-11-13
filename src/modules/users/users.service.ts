import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  CreateUserDto,
  GetUsersDto,
  UpdateUserDto,
  UpdateUserPasswordDto,
  UserRoleDto,
} from './dto/users.dto';
import { UserProfile, UserWithoutHash } from './interfaces/users.interface';
import { PaginatedResponse } from '../../shared/interfaces/paginated-response.interface';
import { ReqUser } from '../../shared/interfaces/request.interface';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private static readonly resource: string = 'User';
  private static readonly model = 'user';

  //#region CRUD
  async create(payload: CreateUserDto): Promise<UserWithoutHash> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: payload.username }, { email: payload.email }],
      },
    });

    if (existingUser) {
      if (existingUser.username === payload.username)
        throw new BadRequestException('Username is not available');

      if (existingUser.email === payload.email)
        throw new BadRequestException('Email is already in use');
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    return this.prisma[UsersService.model].create({
      data: {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        username: payload.username,
        hash: hashedPassword,
      },
      omit: { hash: true },
    });
  }

  async get(
    query: GetUsersDto,
  ): Promise<UserWithoutHash[] | PaginatedResponse<UserWithoutHash>> {
    //#region Filters
    const where: any = {};

    if (query.id?.length) where.id = { in: query.id };
    if (query.username) where.username = query.username;
    if (query.email) where.email = query.email;
    if (query.isActive !== undefined) where.is_active = query.isActive;

    if (query.roleId?.length) {
      where.roles = {
        some: {
          id: { in: query.roleId },
        },
      };
    }

    if (query.term) {
      where.OR = [
        { first_name: { contains: query.term, mode: 'insensitive' } },
        { last_name: { contains: query.term, mode: 'insensitive' } },
        { email: { contains: query.term, mode: 'insensitive' } },
        { username: { contains: query.term, mode: 'insensitive' } },
      ];
    }

    if (query.createdAtFrom || query.createdAtTo) {
      where.createdAt = {};
      if (query.createdAtFrom)
        where.createdAt.gte = new Date(query.createdAtFrom);
      if (query.createdAtTo) where.createdAt.lte = new Date(query.createdAtTo);
    }
    //#endregion

    //#region Select & Include
    let select: any;
    let include: any;

    if (query.field?.length) {
      select = {};
      for (const field of query.field) select[field] = true;
      if (query.includeRoles) select.roles = true;
    } else {
      include = {};
      if (query.includeRoles) include.roles = true;
    }
    //#endregion

    if (query.withPagination) {
      const [items, total] = await Promise.all([
        this.prisma[UsersService.model].findMany({
          where,
          orderBy: { [query.sortBy]: query.sortOrder },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          ...(select ? { select } : include ? { include } : {}),
        }),

        this.prisma[UsersService.model].count({ where }),
      ]);

      return {
        total,
        page: query.page,
        pageSize: query.pageSize,
        pageCount: Math.ceil(total / query.pageSize),
        items,
      };
    } else {
      return this.prisma[UsersService.model].findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...(select ? { select } : include ? { include } : {}),
      });
    }
  }

  async updateById(
    reqUser: ReqUser,
    id: number,
    payload: UpdateUserDto,
  ): Promise<UserWithoutHash> {
    const entity = await this.prisma[UsersService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${UsersService.resource} with ID ${id} not found`,
      );
    }

    const isUserAdmin = reqUser.roles.some((r) => r.name === 'ADMIN');

    if (reqUser.id !== entity.id && !isUserAdmin) {
      throw new ForbiddenException(
        `You do not have permission to update this ${UsersService.resource}`,
      );
    }

    return this.prisma[UsersService.model].update({
      where: { id },
      data: payload,
      omit: { hash: true },
    });
  }

  async deleteById(id: number): Promise<UserWithoutHash> {
    const entity = await this.prisma[UsersService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${UsersService.resource} with ID ${id} not found`,
      );
    }

    return this.prisma[UsersService.model].delete({
      where: { id },
      omit: { hash: true },
    });
  }
  //#endregion

  //#region Extras
  async checkUsername(username: string): Promise<{ isAvailable: boolean }> {
    const existing = await this.prisma.user.findUnique({ where: { username } });
    return { isAvailable: !existing };
  }

  async updatePassword(
    reqUser: ReqUser,
    id: number,
    payload: UpdateUserPasswordDto,
  ): Promise<UserWithoutHash> {
    const entity = await this.prisma[UsersService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${UsersService.resource} with ID ${id} not found`,
      );
    }

    if (reqUser.id !== entity.id) {
      throw new ForbiddenException(
        `You do not have permission to update password of this ${UsersService.resource}`,
      );
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    return this.prisma[UsersService.model].update({
      where: { id },
      data: { hash: hashedPassword },
      omit: { hash: true },
    });
  }

  async assignRole(payload: UserRoleDto): Promise<UserProfile> {
    const [user, role] = await Promise.all([
      this.prisma[UsersService.model].findUnique({
        where: { id: payload.userId },
        include: { roles: true },
      }),
      this.prisma.role.findUnique({ where: { id: payload.roleId } }),
    ]);

    if (!user) {
      throw new NotFoundException(
        `${UsersService.resource} with ID ${payload.userId} not found`,
      );
    }

    if (!role) {
      throw new NotFoundException(`Role with ID ${payload.roleId} not found`);
    }

    const hasRole = user.roles.some((r) => r.id === payload.roleId);

    if (hasRole) {
      throw new BadRequestException(
        `${UsersService.resource} already has role ${role.name}`,
      );
    }

    return this.prisma[UsersService.model].update({
      where: { id: payload.userId },
      data: {
        roles: {
          connect: { id: role.id },
        },
      },
      include: {
        roles: true,
      },
      omit: { hash: true },
    });
  }

  async removeRole(payload: UserRoleDto): Promise<UserProfile> {
    const [user, role] = await Promise.all([
      this.prisma[UsersService.model].findUnique({
        where: { id: payload.userId },
        include: { roles: true },
      }),
      this.prisma.role.findUnique({ where: { id: payload.roleId } }),
    ]);

    if (!user) {
      throw new NotFoundException(
        `${UsersService.resource} with ID ${payload.userId} not found`,
      );
    }

    if (!role) {
      throw new NotFoundException(`Role with ID ${payload.roleId} not found`);
    }

    const hasRole = user.roles.some((r) => r.id === payload.roleId);

    if (!hasRole) {
      throw new BadRequestException(
        `${UsersService.resource} does not have role ${role.name}`,
      );
    }

    return this.prisma[UsersService.model].update({
      where: { id: payload.userId },
      data: {
        roles: {
          disconnect: { id: payload.roleId },
        },
      },
      include: {
        roles: true,
      },
      omit: { hash: true },
    });
  }
  //#endregion
}
