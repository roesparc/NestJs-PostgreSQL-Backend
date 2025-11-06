import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestWithUser } from 'src/shared/interfaces/request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) return true;

    const request: RequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { roles: true },
    });

    if (!dbUser) return false;

    return dbUser.roles.some((role) => roles.includes(role.name));
  }
}
