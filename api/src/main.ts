import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Headers de seguridad estandar (anti-clickjacking, no-sniff, HSTS, etc.).
  app.use(helmet());

  // Limite alto para permitir logo/foto del local en base64
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.setGlobalPrefix('api');

  // CORS restringido por entorno: en produccion se define CORS_ORIGINS con la
  // lista de dominios permitidos (separados por coma). Si no se define, se
  // permite cualquier origen (util en desarrollo local).
  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API corriendo en http://localhost:${port}/api`);
}
bootstrap();
