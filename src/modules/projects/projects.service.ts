import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProjectDto,
  GetProjectsDto,
  UpdateProjectDto,
} from './dto/projects.dto';
import { Prisma, Project } from '@prisma/client';
import { CheckSlugResponse } from '../../shared/interfaces/slug.interface';
import { CheckSlugDto } from '../../shared/dto/slug.dto';
import { ReqUser } from '../../shared/interfaces/request.interface';
import { PaginatedResponse } from '../../shared/interfaces/paginated-response.interface';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  private static readonly resource: string = 'Project';
  private static readonly model = 'project';

  //#region CRUD
  async create(reqUser: ReqUser, payload: CreateProjectDto): Promise<Project> {
    const { slug, techStack, ...rest } = payload;

    const existingSlug = await this.prisma[ProjectsService.model].findFirst({
      where: { slug, userId: reqUser.id },
    });

    if (existingSlug) {
      throw new BadRequestException(
        `A project with slug "${slug}" already exists for this user.`,
      );
    }

    return this.prisma[ProjectsService.model].create({
      data: {
        ...rest,
        slug,
        userId: reqUser.id,
        techStack: techStack ?? [],
      },
    });
  }

  async get(
    query: GetProjectsDto,
  ): Promise<Project[] | PaginatedResponse<Project>> {
    //#region Filters
    const where: Prisma.ProjectWhereInput = {};

    if (query.id?.length) where.id = { in: query.id };
    if (query.userId?.length) where.userId = { in: query.userId };
    if (query.slug) where.slug = query.slug;
    if (query.featured !== undefined) where.featured = query.featured;
    if (query.techStack?.length) where.techStack = { hasSome: query.techStack };

    // Term filter
    if (query.term) {
      where.OR = [
        { title: { contains: query.term, mode: 'insensitive' } },
        { description: { contains: query.term, mode: 'insensitive' } },
        { repoUrl: { contains: query.term, mode: 'insensitive' } },
        { demoUrl: { contains: query.term, mode: 'insensitive' } },
      ];
    }

    // Date range filter
    if (query.createdAtFrom || query.createdAtTo) {
      where.createdAt = {};

      if (query.createdAtFrom)
        where.createdAt.gte = new Date(query.createdAtFrom);

      if (query.createdAtTo) where.createdAt.lte = new Date(query.createdAtTo);
    }
    //#endregion

    //#region Select & Include
    let select: Prisma.ProjectSelect | undefined;
    let include: Prisma.ProjectInclude | undefined;
    let omit: Prisma.ProjectOmit | undefined;

    if (query.field?.length) {
      select = {};
      for (const field of query.field) select[field] = true;
      if (query.includeUser) select.user = true;
    } else {
      include = {};
      omit = {};
      if (query.includeUser) include.user = true;
    }
    //#endregion

    if (query.withPagination) {
      const [items, total] = await Promise.all([
        this.prisma[ProjectsService.model].findMany({
          where,
          orderBy: { [query.sortBy]: query.sortOrder },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          ...(select && { select }),
          ...(include && { include }),
          ...(omit && { omit }),
        }),

        this.prisma[ProjectsService.model].count({ where }),
      ]);

      return {
        total,
        page: query.page,
        pageSize: query.pageSize,
        pageCount: Math.ceil(total / query.pageSize),
        items,
      };
    } else {
      return this.prisma[ProjectsService.model].findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...(select && { select }),
        ...(include && { include }),
        ...(omit && { omit }),
      });
    }
  }

  async updateById(
    reqUser: ReqUser,
    id: number,
    payload: UpdateProjectDto,
  ): Promise<Project> {
    const entity = await this.prisma[ProjectsService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${ProjectsService.resource} with ID ${id} not found`,
      );
    }

    if (reqUser.id !== entity.userId) {
      throw new ForbiddenException(
        `You do not have permission to update this ${ProjectsService.resource}.`,
      );
    }

    const { slug, techStack, ...rest } = payload;

    if (slug && slug !== entity.slug) {
      const existingSlug = await this.prisma[ProjectsService.model].findFirst({
        where: { slug, userId: entity.userId },
      });

      if (existingSlug) {
        throw new BadRequestException(
          `A project with slug "${slug}" already exists for this user.`,
        );
      }
    }

    return this.prisma[ProjectsService.model].update({
      where: { id },
      data: {
        ...rest,
        slug: slug ?? entity.slug,
        techStack: techStack ?? entity.techStack ?? [],
      },
    });
  }

  async deleteById(reqUser: ReqUser, id: number): Promise<Project> {
    const entity = await this.prisma[ProjectsService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${ProjectsService.resource} with ID ${id} not found`,
      );
    }

    const isUserAdmin = reqUser.roles.some((r) => r.name === 'ADMIN');

    if (reqUser.id !== entity.userId && !isUserAdmin) {
      throw new ForbiddenException(
        `You do not have permission to delete this ${ProjectsService.resource}`,
      );
    }

    return this.prisma[ProjectsService.model].delete({
      where: { id },
    });
  }
  //#endregion

  //#region Extras
  async checkSlug(
    userId: number,
    query: CheckSlugDto,
  ): Promise<CheckSlugResponse> {
    const { slug } = query;

    const existing = await this.prisma[ProjectsService.model].findFirst({
      where: { slug, userId },
    });

    return { isAvailable: !existing };
  }
  //#endregion
}
