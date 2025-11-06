import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserWithoutHash } from '../../../modules/users/interfaces/users.interface';
import { JwtPayload } from '../../../modules/auth/interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new UnauthorizedException(
        'JWT_SECRET environment variable is not defined.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  // This method is automatically called by Passport after the JWT token is verified.
  // It ensures the user still exists and is active, and returns the user object
  // (without the password hash) to be assigned to `req.user`.
  async validate(payload: JwtPayload): Promise<UserWithoutHash> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      omit: { hash: true },
    });

    if (!user) throw new UnauthorizedException('User not found');

    if (!user.is_active)
      throw new UnauthorizedException('User account is disabled');

    return user;
  }
}
