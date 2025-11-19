import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload, Login } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async validateUser(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive)
      throw new UnauthorizedException('User account is disabled');

    const passwordValid = await bcrypt.compare(password, user.hash);

    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(identifier: string, password: string): Promise<Login> {
    const user = await this.validateUser(identifier, password);
    const payload: JwtPayload = { userId: user.id };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
