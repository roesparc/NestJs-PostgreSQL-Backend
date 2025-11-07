import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto';
import { Role } from '@prisma/client';
import { ReqUser } from '../../shared/interfaces/request.interface';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  private static readonly resource: string = 'Role';
  private static readonly model = 'role';

  //#region CRUD
  async create(payload: CreateRoleDto): Promise<Role> {
    return this.prisma[RolesService.model].create({
      data: payload,
    });
  }

  async getAll(): Promise<Role[]> {
    return this.prisma[RolesService.model].findMany();
  }

  async updateById(id: number, payload: UpdateRoleDto): Promise<Role> {
    const entity = await this.prisma[RolesService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${RolesService.resource} with ID ${id} not found`,
      );
    }

    return this.prisma[RolesService.model].update({
      where: { id },
      data: payload,
    });
  }

  async deleteById(id: number, user: ReqUser): Promise<Role> {
    const entity = await this.prisma[RolesService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${RolesService.resource} with ID ${id} not found`,
      );
    }

    const isUserAdmin = user.roles.some((role) => role.name === 'ADMIN');

    if (!isUserAdmin || entity.name === 'ADMIN') {
      throw new ForbiddenException(
        `You do not have permission to delete this ${RolesService.resource}`,
      );
    }

    return this.prisma[RolesService.model].delete({
      where: { id },
    });
  }
  //#endregion
}
