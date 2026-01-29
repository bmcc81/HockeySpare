import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI }); // /v1/...

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('HockeySpare API')
    .setDescription('Backend for HockeySpare')
    .setVersion('1.0.0')
    // .addBearerAuth() // later, when you add auth
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Swagger JSON will be available at:
  // http://localhost:3000/docs-json
  // and with prefix/versioning:
  // http://localhost:3000/api/v1/docs-json (if you mount docs under version)
  await app.listen(3000);
}
bootstrap();
