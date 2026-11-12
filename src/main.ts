import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ApiExceptionFilter } from '@/common/filters/api-exception.filter';
import { CanonicalLogInterceptor } from '@/common/logging/canonical-log.interceptor';
import { setupSwagger } from '@/openapi/setup-swagger';
import { RequestSpanInterceptor } from '@/observability/request-span.interceptor';
import { startTracing } from '@/observability/start-tracing';

async function bootstrap(): Promise<void> {
  startTracing();
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(app.get(ApiExceptionFilter));
  app.useGlobalInterceptors(
    app.get(RequestSpanInterceptor),
    app.get(CanonicalLogInterceptor),
  );
  setupSwagger(app);
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`API process started on port ${port}`, 'Bootstrap');
}

await bootstrap();
