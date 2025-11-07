import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CheckPostSlugDto,
  CreatePostDto,
  UpdatePostDto,
} from './dto/posts.dto';
import { Post } from '@prisma/client';
import { CheckSlugResponse } from 'src/shared/interfaces/slug.interface';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  private static readonly resource: string = 'Post';
  private static readonly model = 'post';

  //#region CRUD
  async create(payload: CreatePostDto): Promise<Post> {
    const { slug, authorId, ...rest } = payload;

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

  async updateById(id: number, payload: UpdatePostDto): Promise<Post> {
    const entity = await this.prisma[PostsService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${PostsService.resource} with ID ${id} not found`,
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

  async deleteById(id: number): Promise<Post> {
    const entity = await this.prisma[PostsService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${PostsService.resource} with ID ${id} not found`,
      );
    }

    return this.prisma[PostsService.model].delete({
      where: { id },
    });
  }
  //#endregion

  //#region Extras
  async checkSlug(payload: CheckPostSlugDto): Promise<CheckSlugResponse> {
    const { slug, authorId } = payload;

    const existing = await this.prisma[PostsService.model].findFirst({
      where: { slug, authorId },
    });

    return { isAvailable: !existing };
  }
  //#endregion
}
