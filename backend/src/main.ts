import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  // Ensure required upload directories exist before the app starts
  const uploadDirs = [
    './uploads/profile',
    './uploads/verification-documents',
    './uploads/images',
    './uploads/avatars',
    './uploads/pdfs',
    './uploads/docs',
    './uploads/videos',
  ];
  for (const dir of uploadDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // Serve static files from the uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://servelink-frontend-rho.vercel.app',
].filter(Boolean);

app.enableCors({
  origin: (origin, callback) => {
    // Allow server-to-server requests / tools without an Origin header
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('❌ CORS blocked origin:', origin);
    console.log('✅ Allowed origins:', allowedOrigins);

    return callback(new Error(`CORS blocked: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With',
  ],
});
  app.useWebSocketAdapter(new IoAdapter(app));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      // Add detailed error messages for debugging
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => ({
          field: error.property,
          constraints: error.constraints,
          value: error.value,
        }));
        console.log('Validation errors:', JSON.stringify(messages, null, 2));
        return new BadRequestException({
          message: errors.map((e) => Object.values(e.constraints || {}).join(', ')).filter(Boolean),
          errors: messages,
        });
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('ServeLink Community API')
    .setDescription('Teacher Community Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);

  console.log(`🚀 Swagger: http://localhost:${process.env.PORT || 3000}/api`);
}

bootstrap();
