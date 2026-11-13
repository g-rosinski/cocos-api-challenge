import { getMetadataArgsStorage } from 'typeorm';
import { OrderEntity } from '@/modules/orders/domain/entities/order.entity';
import { OrderIdempotencyKeyEntity } from '@/modules/orders/domain/entities/order-idempotency-key.entity';

describe('OrderIdempotencyKeyEntity', () => {
  it('relates each key row to a stored order', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (item) =>
        item.target === OrderIdempotencyKeyEntity &&
        item.propertyName === 'order',
    );
    expect(relation).toBeDefined();
    const relatedType = relation?.type;
    if (typeof relatedType === 'function') {
      expect(relatedType()).toBe(OrderEntity);
    }
  });
});
