import type { INestApplication } from '@nestjs/common';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { createSwaggerDocument } from '@/openapi/setup-swagger';

describe('createSwaggerDocument edge cases', () => {
  const app = {} as INestApplication;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not touch the order body when it is a schema reference', () => {
    const document = {
      paths: {
        '/orders': {
          post: {
            requestBody: { $ref: '#/components/requestBodies/Order' },
          },
        },
      },
      components: { schemas: {} },
    } as unknown as OpenAPIObject;
    vi.spyOn(SwaggerModule, 'createDocument').mockReturnValue(document);

    const result = createSwaggerDocument(app);

    expect(result.paths['/orders']?.post?.requestBody).toEqual({
      $ref: '#/components/requestBodies/Order',
    });
  });

  it('skips the default example when the post body has no json media', () => {
    const document = {
      paths: {
        '/orders': {
          post: {
            requestBody: { content: {} },
          },
        },
      },
      components: { schemas: {} },
    } as unknown as OpenAPIObject;
    vi.spyOn(SwaggerModule, 'createDocument').mockReturnValue(document);

    expect(() => createSwaggerDocument(app)).not.toThrow();
  });

  it('does not fail when the orders path is missing', () => {
    const document = {
      paths: { '/portfolio': { get: {} } },
      components: { schemas: {} },
    } as unknown as OpenAPIObject;
    vi.spyOn(SwaggerModule, 'createDocument').mockReturnValue(document);

    expect(() => createSwaggerDocument(app)).not.toThrow();
    expect(document.components?.schemas).toMatchObject({
      PortfolioResponse: expect.any(Object),
    });
  });
});
