import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { clerkPlugin } from '@clerk/fastify';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { BadRequestException } from './common/exceptions/common.exceptions';
import { ErrorCode } from './common/exceptions/error-codes.enum';

async function bootstrap() {
  process.env.CLERK_API_KEY = process.env.CLERK_SECRET_KEY;

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(clerkPlugin, {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const validationErrors = errors.reduce((acc, error) => {
          acc[error.property] = Object.values(error.constraints || {}).join(', ');

          return acc;
        }, {});

        return new BadRequestException(
          'Validation failed',
          ErrorCode.UNPROCESSABLE_ENTITY,
          { validationErrors },
        );
      },
    }),
  );

  const port = process.env.PORT ?? 8080;

  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
