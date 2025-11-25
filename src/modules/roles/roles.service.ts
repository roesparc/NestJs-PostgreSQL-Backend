import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto, GetRolesDto, UpdateRoleDto } from './dto/roles.dto';
import { Role } from '@prisma/client';
import { PaginatedResponse } from '../../shared/interfaces/paginated-response.interface';

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

  async get(query: GetRolesDto): Promise<Role[] | PaginatedResponse<Role>> {
    //#region Filters
    const where: any = {};

    if (query.id?.length) where.id = { in: query.id };

    if (query.userId?.length) {
      where.users = {
        some: {
          id: { in: query.userId },
        },
      };
    }

    if (query.term) {
      where.OR = [{ name: { contains: query.term, mode: 'insensitive' } }];
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
    let omit: any;

    if (query.field?.length) {
      select = {};
      for (const field of query.field) select[field] = true;
      if (query.includeUsers) select.users = true;
    } else {
      include = {};
      omit = {};
      if (query.includeUsers) include.users = true;
    }
    //#endregion

    if (query.withPagination) {
      const [items, total] = await Promise.all([
        this.prisma[RolesService.model].findMany({
          where,
          orderBy: { [query.sortBy]: query.sortOrder },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          ...(select && { select }),
          ...(include && { include }),
          ...(omit && { omit }),
        }),

        this.prisma[RolesService.model].count({ where }),
      ]);

      return {
        total,
        page: query.page,
        pageSize: query.pageSize,
        pageCount: Math.ceil(total / query.pageSize),
        items,
      };
    } else {
      return this.prisma[RolesService.model].findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...(select && { select }),
        ...(include && { include }),
        ...(omit && { omit }),
      });
    }
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

  async deleteById(id: number): Promise<Role> {
    const entity = await this.prisma[RolesService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${RolesService.resource} with ID ${id} not found`,
      );
    }

    if (entity.name === 'ADMIN') {
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
