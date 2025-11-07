import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/posts.dto';
import { Post } from '@prisma/client';
import { CheckSlugDto } from '../../shared/dto/slug.dto';
import { CheckSlugResponse } from '../../shared/interfaces/slug.interface';
import { ReqUser } from '../../shared/interfaces/request.interface';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  private static readonly resource: string = 'Post';
  private static readonly model = 'post';

  //#region CRUD
  async create(authorId: number, payload: CreatePostDto): Promise<Post> {
    const { slug, ...rest } = payload;

    const existingSlug = await this.prisma[PostsService.model].findFirst({
      where: { slug, authorId },
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
        authorId,
      },
    });
  }

  async getAll(): Promise<Post[]> {
    return this.prisma[PostsService.model].findMany();
  }

  async updateById(
    id: number,
    authorId: number,
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

    if (entity.authorId !== authorId) {
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

  async deleteById(id: number, user: ReqUser): Promise<Post> {
    const entity = await this.prisma[PostsService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${PostsService.resource} with ID ${id} not found`,
      );
    }

    const isUserAdmin = user.roles.some((role) => role.name === 'ADMIN');

    if (entity.authorId !== user.id && !isUserAdmin) {
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
