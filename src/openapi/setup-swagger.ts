import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import { instrumentsResponseSchema } from '@/instruments/instruments-openapi-examples';
import {
  buyMarketOrderBody,
  orderResponseSchema,
} from '@/orders/orders-openapi-examples';
import { portfolioResponseSchema } from '@/portfolio/portfolio-openapi-examples';
import { errorResponseSchema } from '@/openapi/error-response.schema';

export function createSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('API Cocos')
    .setDescription(
      'Consulta de la cuenta, búsqueda de instrumentos y alta de órdenes. Los ejemplos usan la base de ejemplo: cuenta 1, PAMP (id 47) y la búsqueda pamp.\n\n[📄 schema.json — importar en Postman](/schema.json)',
    )
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Base local de los ejemplos')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    autoTagControllers: false,
    operationIdFactory: (_controllerKey: string, methodKey: string) =>
      methodKey,
  });
  document.components ??= {};
  document.components.schemas = {
    ...document.components.schemas,
    PortfolioResponse: portfolioResponseSchema,
    InstrumentsResponse: instrumentsResponseSchema,
    OrderResponse: orderResponseSchema,
    ErrorResponse: errorResponseSchema,
  };
  const orderBody = document.paths['/orders']?.post?.requestBody;
  if (orderBody !== undefined && !('$ref' in orderBody)) {
    const media = orderBody.content['application/json'];
    if (media !== undefined) {
      media.example = buyMarketOrderBody;
    }
  }
  return document;
}

export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup('swagger', app, () => createSwaggerDocument(app), {
    jsonDocumentUrl: 'schema.json',
    swaggerUrl: '/schema.json',
    explorer: true,
    raw: ['json'],
    customSiteTitle: 'API Cocos',
  });
}
