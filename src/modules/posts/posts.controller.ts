import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AppLogger } from '../../common/logger/logger.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IdParamDto } from '../../shared/dto/id-param.dto';
import { PostsService } from './posts.service';
import {
  CheckPostSlugDto,
  CreatePostDto,
  UpdatePostDto,
} from './dto/posts.dto';

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
  async create(@Body() payload: CreatePostDto) {
    try {
      const entity = await this.resourceService.create(payload);

      this.logger.log({
        event: 'create',
        status: 'success',
        resource: PostsController.resource,
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
        payload,
      });

      throw error;
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: `Get all ${PostsController.resource}s` })
  @ApiResponse({
    status: 200,
    description: `List of all ${PostsController.resource}s`,
  })
  async getAll() {
    try {
      const entities = await this.resourceService.getAll();

      this.logger.log({
        event: 'getAll',
        status: 'success',
        resource: PostsController.resource,
      });

      return entities;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'getAll',
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
    @Param() params: IdParamDto,
    @Body() payload: UpdatePostDto,
  ) {
    try {
      const entity = await this.resourceService.updateById(params.id, payload);

      this.logger.log({
        event: 'updateById',
        status: 'success',
        resource: PostsController.resource,
        id: params.id,
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
  async deleteById(@Param() params: IdParamDto) {
    try {
      const entity = await this.resourceService.deleteById(params.id);

      this.logger.log({
        event: 'delete',
        status: 'success',
        resource: PostsController.resource,
        id: params.id,
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
  async checkSlug(@Query() query: CheckPostSlugDto) {
    try {
      const result = await this.resourceService.checkSlug(query);

      this.logger.log({
        event: 'check-slug',
        status: 'success',
        resource: PostsController.resource,
        payload: query,
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
        payload: query,
      });

      throw error;
    }
  }
}
