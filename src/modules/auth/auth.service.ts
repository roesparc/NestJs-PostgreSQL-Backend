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

  private async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(password, user.hash);

    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(username: string, password: string): Promise<Login> {
    const user = await this.validateUser(username, password);
    const payload: JwtPayload = { userId: user.id };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
