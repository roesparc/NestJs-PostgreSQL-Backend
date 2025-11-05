import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export default function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('NESTJS BACKEND')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth() // adds JWT authentication for endpoints
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Custom CSS
  const customCss = `
    .swagger-ui .opblock.opblock-post {
      border-color: #a0771dff;
      background: rgba(160, 119, 29, 0.1);
    }
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #a0771dff;
    }
    
    .swagger-ui .opblock.opblock-get {
      border-color: #0e9119ff;
      background: rgba(14, 145, 25, 0.1);
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #0e9119ff;
    }
    
    .swagger-ui .opblock.opblock-put {
      border-color: #1e64ceff;
      background: rgba(30, 100, 206, 0.1);
    }
    .swagger-ui .opblock.opblock-put .opblock-summary-method {
      background: #1e64ceff;
    }
    
    .swagger-ui .opblock.opblock-delete {
      border-color: #c22a1aff;
      background: rgba(194, 42, 26, 0.1);
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: #c22a1aff;
    }
    
    .swagger-ui .opblock.opblock-patch {
      border-color: #8e44ad;
      background: rgba(142, 68, 173, 0.1);
    }
    .swagger-ui .opblock.opblock-patch .opblock-summary-method {
      background: #8e44ad;
    }
  `;

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // keeps JWT token between reloads
    },
    customCss,
  });
}
