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
import { IdParamDto } from '../../shared/dto/id-param.dto';
import { PostsService } from './posts.service';
import { CreatePostDto, GetPostsDto, UpdatePostDto } from './dto/posts.dto';
import type { RequestWithUser } from '../../shared/interfaces/request.interface';
import { CheckSlugDto } from '../../shared/dto/slug.dto';

@Controller('posts')
export class PostsController {
  constructor(
    private resourceService: PostsService,
    private logger: AppLogger,
  ) {}

  private static readonly resource: string = 'Post';

  //#region CRUD
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: `Create ${PostsController.resource}` })
  @ApiResponse({
    status: 201,
    description: `${PostsController.resource} created successfully`,
  })
  async create(
    @Request() req: RequestWithUser,
    @Body() payload: CreatePostDto,
  ) {
    try {
      const entity = await this.resourceService.create(req.user.id, payload);

      this.logger.log({
        event: 'create',
        status: 'success',
        resource: PostsController.resource,
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
        resource: PostsController.resource,
        userId: req.user.id,
        payload,
      });

      throw error;
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Get ${PostsController.resource}s with query params`,
  })
  @ApiResponse({
    status: 200,
    description: `List of ${PostsController.resource}s`,
  })
  async get(@Query() query: GetPostsDto) {
    try {
      const entities = await this.resourceService.get(query);

      this.logger.log({
        event: 'get',
        status: 'success',
        resource: PostsController.resource,
      });

      return entities;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'get',
        status: 'error',
        resource: PostsController.resource,
      });

      throw error;
    }
  }

  @Patch('id/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Update ${PostsController.resource} by ID` })
  @ApiResponse({
    status: 200,
    description: `${PostsController.resource} updated successfully`,
  })
  @ApiResponse({
    status: 404,
    description: `${PostsController.resource} not found`,
  })
  async updateById(
    @Request() req: RequestWithUser,
    @Param() params: IdParamDto,
    @Body() payload: UpdatePostDto,
  ) {
    try {
      const entity = await this.resourceService.updateById(
        req.user.id,
        params.id,
        payload,
      );

      this.logger.log({
        event: 'updateById',
        status: 'success',
        resource: PostsController.resource,
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
        resource: PostsController.resource,
        id: params.id,
        userId: req.user.id,
        payload,
      });

      throw error;
    }
  }

  @Delete('id/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Delete ${PostsController.resource} by ID` })
  @ApiResponse({
    status: 200,
    description: `${PostsController.resource} deleted successfully`,
  })
  @ApiResponse({
    status: 404,
    description: `${PostsController.resource} not found`,
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
        resource: PostsController.resource,
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
        resource: PostsController.resource,
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
    summary: `Check if ${PostsController.resource} slug is available`,
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
        resource: PostsController.resource,
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
        resource: PostsController.resource,
        userId: req.user.id,
        query,
      });

      throw error;
    }
  }
  //#endregion
}
