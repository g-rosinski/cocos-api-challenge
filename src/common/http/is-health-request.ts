import type { Request } from 'express';

export function isHealthRequest(request: Request): boolean {
  return request.method === 'GET' && request.path === '/health';
}
