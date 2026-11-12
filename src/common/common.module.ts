import { Module } from '@nestjs/common';
import { TypeOrmUserAccountLookup } from '@/common/accounts/typeorm-user-account-lookup';
import { USER_ACCOUNT_LOOKUP } from '@/common/accounts/user-account-lookup';
import { CorrelationMiddleware } from '@/common/correlation/correlation.middleware';
import { ApiExceptionFilter } from '@/common/filters/api-exception.filter';
import { CanonicalLogContext } from '@/common/logging/canonical-log-context';
import { CanonicalLogInterceptor } from '@/common/logging/canonical-log.interceptor';
import { UserIdMiddleware } from '@/common/middleware/user-id.middleware';
import { RequestSpanInterceptor } from '@/observability/request-span.interceptor';

@Module({
  providers: [
    CorrelationMiddleware,
    UserIdMiddleware,
    ApiExceptionFilter,
    CanonicalLogContext,
    CanonicalLogInterceptor,
    RequestSpanInterceptor,
    TypeOrmUserAccountLookup,
    {
      provide: USER_ACCOUNT_LOOKUP,
      useExisting: TypeOrmUserAccountLookup,
    },
  ],
  exports: [
    CorrelationMiddleware,
    UserIdMiddleware,
    ApiExceptionFilter,
    CanonicalLogContext,
    CanonicalLogInterceptor,
    RequestSpanInterceptor,
    USER_ACCOUNT_LOOKUP,
    TypeOrmUserAccountLookup,
  ],
})
export class CommonModule {}
