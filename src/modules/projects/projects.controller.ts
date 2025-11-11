import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { AppLogger } from '../../common/logger/logger.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  GetProjectsDto,
  UpdateProjectDto,
} from './dto/projects.dto';
import { IdParamDto } from '../../shared/dto/id-param.dto';
import type { RequestWithUser } from '../../shared/interfaces/request.interface';
import { CheckSlugDto } from '../../shared/dto/slug.dto';

@Controller('projects')
export class ProjectsController {
  constructor(
    private resourceService: ProjectsService,
    private logger: AppLogger,
  ) {}

  private static readonly resource: string = 'Project';

  //#region CRUD
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: `Create ${ProjectsController.resource}` })
  @ApiResponse({
    status: 201,
    description: `${ProjectsController.resource} created successfully`,
  })
  async create(
    @Request() req: RequestWithUser,
    @Body() payload: CreateProjectDto,
  ) {
    try {
      const entity = await this.resourceService.create(req.user.id, payload);

      this.logger.log({
        event: 'create',
        status: 'success',
        resource: ProjectsController.resource,
        userId: req.user.id,
        payload,
      });

      return entity;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'create',
        status: 'error',
        resource: ProjectsController.resource,
        userId: req.user.id,
        payload,
      });

      throw error;
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Get ${ProjectsController.resource}s with query params`,
  })
  @ApiResponse({
    status: 200,
    description: `List of ${ProjectsController.resource}s`,
  })
  async get(@Query() query: GetProjectsDto) {
    try {
      const entities = await this.resourceService.get(query);

      this.logger.log({
        event: 'get',
        status: 'success',
        resource: ProjectsController.resource,
      });

      return entities;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'get',
        status: 'error',
        resource: ProjectsController.resource,
      });

      throw error;
    }
  }

  @Patch('id/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Update ${ProjectsController.resource} by ID` })
  @ApiResponse({
    status: 200,
    description: `${ProjectsController.resource} updated successfully`,
  })
  @ApiResponse({
    status: 404,
    description: `${ProjectsController.resource} not found`,
  })
  async updateById(
    @Request() req: RequestWithUser,
    @Param() params: IdParamDto,
    @Body() payload: UpdateProjectDto,
  ) {
    try {
      const entity = await this.resourceService.updateById(
        params.id,
        req.user.id,
        payload,
      );

      this.logger.log({
        event: 'updateById',
        status: 'success',
        resource: ProjectsController.resource,
        id: params.id,
        userId: req.user.id,
        payload,
      });

      return entity;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'updateById',
        status: 'error',
        resource: ProjectsController.resource,
        id: params.id,
        userId: req.user.id,
        payload,
      });

      throw error;
    }
  }

  @Delete('id/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Delete ${ProjectsController.resource} by ID` })
  @ApiResponse({
    status: 200,
    description: `${ProjectsController.resource} deleted successfully`,
  })
  @ApiResponse({
    status: 404,
    description: `${ProjectsController.resource} not found`,
  })
  async deleteById(
    @Request() req: RequestWithUser,
    @Param() params: IdParamDto,
  ) {
    try {
      const entity = await this.resourceService.deleteById(params.id, req.user);

      this.logger.log({
        event: 'delete',
        status: 'success',
        resource: ProjectsController.resource,
        id: params.id,
        actorId: req.user.id,
      });

      return entity;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'delete',
        status: 'error',
        resource: ProjectsController.resource,
        id: params.id,
        actorId: req.user.id,
      });

      throw error;
    }
  }
  //#endregion

  //#region Extras
  @Get('check-slug')
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Check if ${ProjectsController.resource} slug is available`,
  })
  @ApiResponse({
    status: 200,
    description: 'Slug availability result',
  })
  async checkSlug(
    @Request() req: RequestWithUser,
    @Query() query: CheckSlugDto,
  ) {
    try {
      const result = await this.resourceService.checkSlug(req.user.id, query);

      this.logger.log({
        event: 'check-slug',
        status: 'success',
        resource: ProjectsController.resource,
        userId: req.user.id,
        query,
        result,
      });

      return result;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'check-slug',
        status: 'error',
        resource: ProjectsController.resource,
        userId: req.user.id,
        query,
      });

      throw error;
    }
  }
  //#endregion
}
