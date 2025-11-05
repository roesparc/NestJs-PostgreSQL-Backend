import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import setupSwagger from './config/swagger.config';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './common/guards/jwt/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalGuards(new JwtAuthGuard(app.get(Reflector))); // enable auth guard for all endpoints by default
  app.useGlobalPipes(new ValidationPipe()); // enable validations from DTO's
  setupSwagger(app); // setup Swagger

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
