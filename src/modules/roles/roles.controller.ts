import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AppLogger } from '../../common/logger/logger.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto';
import { RolesService } from './roles.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { IdParamDto } from '../../shared/dto/id-param.dto';

@Controller('roles')
export class RolesController {
  constructor(
    private resourceService: RolesService,
    private logger: AppLogger,
  ) {}

  private static readonly resource: string = 'Role';

  //#region CRUD
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: `Create ${RolesController.resource}` })
  @ApiResponse({
    status: 201,
    description: `${RolesController.resource} created successfully`,
  })
  async create(@Body() payload: CreateRoleDto) {
    try {
      const entity = await this.resourceService.create(payload);

      this.logger.log({
        event: 'create',
        status: 'success',
        resource: RolesController.resource,
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
        resource: RolesController.resource,
        payload,
      });

      throw error;
    }
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: `Get all ${RolesController.resource}s` })
  @ApiResponse({
    status: 200,
    description: `List of all ${RolesController.resource}s`,
  })
  async getAll() {
    try {
      const entities = await this.resourceService.getAll();

      this.logger.log({
        event: 'getAll',
        status: 'success',
        resource: RolesController.resource,
      });

      return entities;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'getAll',
        status: 'error',
        resource: RolesController.resource,
      });

      throw error;
    }
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('id/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Update ${RolesController.resource} by ID` })
  @ApiResponse({
    status: 200,
    description: `${RolesController.resource} updated successfully`,
  })
  @ApiResponse({
    status: 404,
    description: `${RolesController.resource} not found`,
  })
  async updateById(
    @Param() params: IdParamDto,
    @Body() payload: UpdateRoleDto,
  ) {
    try {
      const entity = await this.resourceService.updateById(params.id, payload);

      this.logger.log({
        event: 'updateById',
        status: 'success',
        resource: RolesController.resource,
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
        resource: RolesController.resource,
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
  @ApiOperation({ summary: `Delete ${RolesController.resource} by ID` })
  @ApiResponse({
    status: 200,
    description: `${RolesController.resource} deleted successfully`,
  })
  @ApiResponse({
    status: 404,
    description: `${RolesController.resource} not found`,
  })
  async deleteById(@Param() params: IdParamDto) {
    try {
      const entity = await this.resourceService.deleteById(params.id);

      this.logger.log({
        event: 'delete',
        status: 'success',
        resource: RolesController.resource,
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
        resource: RolesController.resource,
        id: params.id,
      });

      throw error;
    }
  }
  //#endregion
}
