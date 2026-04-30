process.env.TZ = 'America/Asuncion';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './prisma/exeptions/prisma-exception.filter';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { randomUUID } from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((e) =>
          Object.values(e.constraints ?? {}),
        );
        return new BadRequestException({
          status: 'error',
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: messages.join(', '),
          },
          meta: {
            trace_id: randomUUID(),
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version ?? '1.0.0',
          },
        });
      },
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
