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
  UseGuards,
} from '@nestjs/common';
import { AppLogger } from '../../common/logger/logger.service';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { RequestWithUser } from '../../shared/interfaces/request.interface';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreateUserDto,
  GetUsersDto,
  UpdateUserDto,
  UpdateUserPasswordDto,
  UserRoleDto,
} from './dto/users.dto';
import { UsersService } from './users.service';
import { IdParamDto } from '../../shared/dto/id-param.dto';

@Controller('users')
export class UsersController {
  constructor(
    private resourceService: UsersService,
    private logger: AppLogger,
  ) {}

  private static readonly resource: string = 'User';

  //#region CRUD
  @Public()
  @Post()
  @ApiOperation({ summary: `Create ${UsersController.resource}` })
  @ApiResponse({
    status: 201,
    description: `${UsersController.resource} created successfully`,
  })
  async create(@Body() payload: CreateUserDto) {
    try {
      const entity = await this.resourceService.create(payload);

      this.logger.log({
        event: 'create',
        status: 'success',
        resource: UsersController.resource,
        actorId: entity.id,
      });

      return entity;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'create',
        status: 'error',
        resource: UsersController.resource,
        email: payload.email,
        username: payload.username,
      });

      throw error;
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: `Get ${UsersController.resource}s with query params`,
  })
  @ApiResponse({
    status: 200,
    description: `List of ${UsersController.resource}s`,
  })
  async get(@Request() req: RequestWithUser, @Query() query: GetUsersDto) {
    try {
      const entities = await this.resourceService.get(query);

      this.logger.log({
        event: 'get',
        status: 'success',
        resource: UsersController.resource,
        actorId: req.user.id,
      });

      return entities;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'get',
        status: 'error',
        resource: UsersController.resource,
        actorId: req.user.id,
      });

      throw error;
    }
  }

  @Patch('id/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Update ${UsersController.resource} by ID` })
  @ApiResponse({
    status: 200,
    description: `${UsersController.resource} updated successfully`,
  })
  @ApiResponse({
    status: 404,
    description: `${UsersController.resource} not found`,
  })
  async updateById(
    @Request() req: RequestWithUser,
    @Param() params: IdParamDto,
    @Body() payload: UpdateUserDto,
  ) {
    try {
      const entity = await this.resourceService.updateById(
        req.user,
        params.id,
        payload,
      );

      this.logger.log({
        event: 'updateById',
        status: 'success',
        resource: UsersController.resource,
        actorId: req.user.id,
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
        resource: UsersController.resource,
        actorId: req.user.id,
        id: params.id,
        payload,
      });

      throw error;
    }
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete('id/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Delete ${UsersController.resource} by ID` })
  @ApiResponse({
    status: 200,
    description: `${UsersController.resource} deleted successfully`,
  })
  @ApiResponse({
    status: 404,
    description: `${UsersController.resource} not found`,
  })
  async deleteById(
    @Request() req: RequestWithUser,
    @Param() params: IdParamDto,
  ) {
    try {
      const entity = await this.resourceService.deleteById(params.id);

      this.logger.log({
        event: 'delete',
        status: 'success',
        resource: UsersController.resource,
        actorId: req.user.id,
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
        resource: UsersController.resource,
        actorId: req.user.id,
        id: params.id,
      });

      throw error;
    }
  }
  //#endregion

  //#region Extras
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Current user data',
  })
  async getMe(@Request() req: RequestWithUser) {
    this.logger.log({
      event: 'getMe',
      status: 'success',
      resource: UsersController.resource,
      actorId: req.user.id,
    });

    return req.user;
  }

  @Patch('update-password/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Update ${UsersController.resource} password` })
  @ApiResponse({
    status: 200,
    description: `${UsersController.resource} password updated successfully`,
  })
  @ApiResponse({
    status: 404,
    description: `${UsersController.resource} not found`,
  })
  async updatePassword(
    @Request() req: RequestWithUser,
    @Param() params: IdParamDto,
    @Body() payload: UpdateUserPasswordDto,
  ) {
    try {
      const entity = await this.resourceService.updatePassword(
        req.user,
        params.id,
        payload,
      );

      this.logger.log({
        event: 'updatePassword',
        status: 'success',
        resource: UsersController.resource,
        actorId: req.user.id,
        id: params.id,
      });

      return entity;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'updatePassword',
        status: 'error',
        resource: UsersController.resource,
        actorId: req.user.id,
        id: params.id,
      });

      throw error;
    }
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('assign-role')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiResponse({
    status: 200,
    description: 'Role assigned to user successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'User already has passed role',
  })
  @ApiResponse({
    status: 404,
    description: 'User or role not found',
  })
  async assignRole(
    @Request() req: RequestWithUser,
    @Body() payload: UserRoleDto,
  ) {
    try {
      const entity = await this.resourceService.assignRole(payload);

      this.logger.log({
        event: 'assignRole',
        status: 'success',
        resource: UsersController.resource,
        actorId: req.user.id,
        payload,
      });

      return entity;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'assignRole',
        status: 'error',
        resource: UsersController.resource,
        actorId: req.user.id,
        payload,
      });

      throw error;
    }
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('remove-role')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiResponse({
    status: 200,
    description: 'Role removed from user successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'User does not have passed role',
  })
  @ApiResponse({
    status: 404,
    description: 'User or role not found',
  })
  async removeRole(
    @Request() req: RequestWithUser,
    @Body() payload: UserRoleDto,
  ) {
    try {
      const entity = await this.resourceService.removeRole(payload);

      this.logger.log({
        event: 'removeRole',
        status: 'success',
        resource: UsersController.resource,
        actorId: req.user.id,
        payload,
      });

      return entity;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'removeRole',
        status: 'error',
        resource: UsersController.resource,
        actorId: req.user.id,
        payload,
      });

      throw error;
    }
  }
  //#endregion
}
