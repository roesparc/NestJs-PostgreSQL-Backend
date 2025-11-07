import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/projects.dto';
import { Project } from '@prisma/client';
import { CheckSlugResponse } from '../../shared/interfaces/slug.interface';
import { CheckSlugDto } from '../../shared/dto/slug.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  private static readonly resource: string = 'Project';
  private static readonly model = 'project';

  //#region CRUD
  async create(userId: number, payload: CreateProjectDto): Promise<Project> {
    const { slug, techStack, ...rest } = payload;

    const existingSlug = await this.prisma[ProjectsService.model].findFirst({
      where: { slug, userId },
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
        userId,
        techStack: techStack ?? [],
      },
    });
  }

  async getAll(): Promise<Project[]> {
    return this.prisma[ProjectsService.model].findMany();
  }

  async updateById(
    id: number,
    userId: number,
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

    if (entity.userId !== userId) {
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

  async deleteById(id: number): Promise<Project> {
    const entity = await this.prisma[ProjectsService.model].findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException(
        `${ProjectsService.resource} with ID ${id} not found`,
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
