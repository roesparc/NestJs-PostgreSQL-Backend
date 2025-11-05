import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppLogger } from '../../common/logger/logger.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, AppLogger],
  exports: [UsersService],
})
export class UsersModule {}
