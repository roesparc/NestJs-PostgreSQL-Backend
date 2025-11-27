import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto, GetPostsDto, UpdatePostDto } from './dto/posts.dto';
import { Post, Prisma } from '@prisma/client';
import { CheckSlugDto } from '../../shared/dto/slug.dto';
import { CheckSlugResponse } from '../../shared/interfaces/slug.interface';
import { ReqUser } from '../../shared/interfaces/request.interface';
import { PaginatedResponse } from '../../shared/interfaces/paginated-response.interface';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  private static readonly resource: string = 'Post';
  private static readonly model = 'post';

  //#region CRUD
  async create(reqUser: ReqUser, payload: CreatePostDto): Promise<Post> {
    const { slug, ...rest } = payload;

    const existingSlug = await this.prisma[PostsService.model].findFirst({
      where: { slug, authorId: reqUser.id },
    });

    if (existingSlug) {
      throw new BadRequestException(
        `A Post with slug "${slug}" already exists for this user.`,
      );
    }

    return this.prisma[PostsService.model].create({
      data: {
        ...rest,
        slug,
        authorId: reqUser.id,
      },
    });
  }

  async get(query: GetPostsDto): Promise<Post[] | PaginatedResponse<Post>> {
    //#region Filters
    const where: Prisma.PostWhereInput = {};

    if (query.id?.length) where.id = { in: query.id };
    if (query.authorId?.length) where.authorId = { in: query.authorId };
    if (query.slug) where.slug = query.slug;
    if (query.published !== undefined) where.published = query.published;

    // Term filter
    if (query.term) {
      where.OR = [{ title: { contains: query.term, mode: 'insensitive' } }];
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
    let select: Prisma.PostSelect | undefined;
    let include: Prisma.PostInclude | undefined;
    let omit: Prisma.PostOmit | undefined;

    if (query.field?.length) {
      select = {};
      for (const field of query.field) select[field] = true;
      if (query.includeAuthor) select.author = true;
    } else {
      include = {};
      omit = {};
      if (query.includeAuthor) include.author = true;
    }
    //#endregion

    if (query.withPagination) {
      const [items, total] = await Promise.all([
        this.prisma[PostsService.model].findMany({
          where,
          orderBy: { [query.sortBy]: query.sortOrder },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          ...(select && { select }),
          ...(include && { include }),
          ...(omit && { omit }),
        }),

        this.prisma[PostsService.model].count({ where }),
      ]);

      return {
        total,
        page: query.page,
        pageSize: query.pageSize,
        pageCount: Math.ceil(total / query.pageSize),
        items,
      };
    } else {
      return this.prisma[PostsService.model].findMany({
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
    payload: UpdatePostDto,
  ): Promise<Post> {
    const entity = await this.prisma[PostsService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${PostsService.resource} with ID ${id} not found`,
      );
    }

    if (reqUser.id !== entity.authorId) {
      throw new ForbiddenException(
        `You do not have permission to update this ${PostsService.resource}.`,
      );
    }

    const { slug, ...rest } = payload;

    if (slug && slug !== entity.slug) {
      const existingSlug = await this.prisma[PostsService.model].findFirst({
        where: { slug, authorId: entity.authorId },
      });

      if (existingSlug) {
        throw new BadRequestException(
          `A Post with slug "${slug}" already exists for this user.`,
        );
      }
    }

    return this.prisma[PostsService.model].update({
      where: { id },
      data: {
        ...rest,
        slug: slug ?? entity.slug,
      },
    });
  }

  async deleteById(reqUser: ReqUser, id: number): Promise<Post> {
    const entity = await this.prisma[PostsService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${PostsService.resource} with ID ${id} not found`,
      );
    }

    const isUserAdmin = reqUser.roles.some((r) => r.name === 'ADMIN');

    if (reqUser.id !== entity.authorId && !isUserAdmin) {
      throw new ForbiddenException(
        `You do not have permission to delete this ${PostsService.resource}`,
      );
    }

    return this.prisma[PostsService.model].delete({
      where: { id },
    });
  }
  //#endregion

  //#region Extras
  async checkSlug(
    authorId: number,
    query: CheckSlugDto,
  ): Promise<CheckSlugResponse> {
    const { slug } = query;

    const existing = await this.prisma[PostsService.model].findFirst({
      where: { slug, authorId },
    });

    return { isAvailable: !existing };
  }
  //#endregion
}
