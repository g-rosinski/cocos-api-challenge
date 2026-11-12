import { Module } from '@nestjs/common';
import { CorrelationMiddleware } from '@/common/middleware/correlation.middleware';
import { ApiExceptionFilter } from '@/common/errors/api-exception.filter';
import { CanonicalLogContext } from '@/common/logging/canonical-log/canonical-log-context';
import { CanonicalLogInterceptor } from '@/common/logging/canonical-log/canonical-log.interceptor';
import { UserIdMiddleware } from '@/common/middleware/user-id.middleware';
import { RequestSpanInterceptor } from '@/observability/request-span.interceptor';
import { UsersModule } from '@/modules/users/users.module';
import { USER_LOOKUP } from '@/modules/users/application/ports/user-lookup.port';

@Module({
  imports: [UsersModule],
  providers: [
    CorrelationMiddleware,
    UserIdMiddleware,
    ApiExceptionFilter,
    CanonicalLogContext,
    CanonicalLogInterceptor,
    RequestSpanInterceptor,
  ],
  exports: [
    UsersModule,
    CorrelationMiddleware,
    UserIdMiddleware,
    ApiExceptionFilter,
    CanonicalLogContext,
    CanonicalLogInterceptor,
    RequestSpanInterceptor,
    USER_LOOKUP,
  ],
})
export class CommonModule {}
