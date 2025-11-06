import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AppLogger } from "../../common/logger/logger.service";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";

@Module({
  imports: [PrismaModule],
  controllers: [RolesController],
  providers: [RolesService, AppLogger],
  exports: [RolesService],
})
export class RolesModule {}
