import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { AppLogger } from '../../common/logger/logger.service';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private logger: AppLogger,
  ) {}

  private readonly resource: string = 'Auth';

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user and return JWT token' })
  @ApiResponse({ status: 200, description: 'Successful login' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
  async login(@Body() payload: LoginDto) {
    const { identifier, password } = payload;

    try {
      const login = await this.authService.login(identifier, password);

      this.logger.log({
        event: 'login',
        status: 'success',
        resource: this.resource,
        identifier,
      });

      return login;
    } catch (error: any) {
      this.logger.error({
        errorType: error.name,
        errorCode: error.status,
        errorMessage: error.message,

        event: 'login',
        status: 'error',
        resource: this.resource,
        identifier,
      });

      throw error;
    }
  }
}
