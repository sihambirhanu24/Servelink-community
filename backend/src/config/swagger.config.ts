import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('ServeLink Community API')
  .setDescription('Community Module API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();