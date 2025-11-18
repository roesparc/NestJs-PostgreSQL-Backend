import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockUser: User = {
    id: 1,
    first_name: 'test',
    last_name: 'user',
    username: 'testuser',
    email: 'test@example.com',
    hash: 'hashed-password',
    is_active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, PrismaService, JwtService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validateUser', () => {
    it('should validate a user successfully', async () => {
      prisma.user.findFirst = jest.fn().mockResolvedValue(mockUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const user = await authService['validateUser']('john', 'password');

      expect(user).toBeDefined();
      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password',
        'hashed-password',
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        authService['validateUser']('john', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is disabled', async () => {
      mockUser.is_active = false;

      prisma.user.findFirst = jest.fn().mockResolvedValue(mockUser);

      await expect(
        authService['validateUser']('john', 'password'),
      ).rejects.toThrow('User account is disabled');

      mockUser.is_active = true;
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      prisma.user.findFirst = jest.fn().mockResolvedValue(mockUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService['validateUser']('john', 'password'),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('login', () => {
    it('should return an access token during login', async () => {
      jest.spyOn<any, any>(authService, 'validateUser').mockResolvedValue({
        id: 1,
      });

      jwt.sign = jest.fn().mockReturnValue('signed-jwt');

      const result = await authService.login('john', 'password');

      expect(authService['validateUser']).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith({ userId: 1 });
      expect(result).toEqual({ access_token: 'signed-jwt' });
    });
  });
});
