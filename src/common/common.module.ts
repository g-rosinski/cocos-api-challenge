import { Module } from '@nestjs/common';
import { TypeOrmUserAccountLookup } from './accounts/typeorm-user-account-lookup.js';
import { USER_ACCOUNT_LOOKUP } from './accounts/user-account-lookup.js';
import { CorrelationMiddleware } from './correlation/correlation.middleware.js';
import { ApiExceptionFilter } from './filters/api-exception.filter.js';
import { CanonicalLogContext } from './logging/canonical-log-context.js';
import { CanonicalLogInterceptor } from './logging/canonical-log.interceptor.js';
import { UserIdMiddleware } from './middleware/user-id.middleware.js';
import { RequestSpanInterceptor } from '../observability/request-span.interceptor.js';

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
