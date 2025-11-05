import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserPasswordDto,
  UserRoleDto,
} from './dto/users.dto';
import { UserProfile, UserWithoutHash } from './interfaces/users.interface';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private static readonly resource: string = 'User';
  private static readonly model = 'user';

  //#region CRUD
  async create(payload: CreateUserDto): Promise<UserWithoutHash> {
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

  async getAll(): Promise<UserWithoutHash[]> {
    return this.prisma[UsersService.model].findMany({
      omit: { hash: true },
    });
  }

  async updateById(
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
  async getById(id: number): Promise<UserWithoutHash> {
    const entity = await this.prisma[UsersService.model].findUnique({
      where: { id },
      omit: { hash: true },
    });

    if (!entity) {
      throw new NotFoundException(
        `${UsersService.resource} with ID ${id} not found`,
      );
    }

    return entity;
  }

  async getByUsername(username: string): Promise<UserWithoutHash> {
    const entity = await this.prisma[UsersService.model].findUnique({
      where: { username },
      omit: { hash: true },
    });

    if (!entity) {
      throw new NotFoundException(
        `${UsersService.resource} with username ${username} not found`,
      );
    }

    return entity;
  }

  async getMe(id: number): Promise<UserProfile> {
    const entity = await this.prisma[UsersService.model].findUnique({
      where: { id },
      include: {
        roles: true,
      },
      omit: { hash: true },
    });

    if (!entity) {
      throw new NotFoundException(
        `${UsersService.resource} with ID ${id} not found`,
      );
    }

    return entity;
  }

  async updatePassword(
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
