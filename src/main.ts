import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/filters/api-exception.filter.js';
import { CanonicalLogInterceptor } from './common/logging/canonical-log.interceptor.js';
import { setupSwagger } from './openapi/setup-swagger.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(app.get(ApiExceptionFilter));
  app.useGlobalInterceptors(app.get(CanonicalLogInterceptor));
  setupSwagger(app);
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`API process started on port ${port}`, 'Bootstrap');
}

await bootstrap();
