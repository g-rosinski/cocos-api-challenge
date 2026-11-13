import { OrderEntity } from '@/modules/orders/domain/entities/order.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'order_idempotency_keys' })
export class OrderIdempotencyKeyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'idempotency_key', type: 'uuid' })
  idempotencyKey: string;

  @Column({ name: 'order_id', type: 'int' })
  orderId: number;

  @ManyToOne(() => OrderEntity, { eager: false })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @Column({ name: 'payload_hash', type: 'varchar', length: 64 })
  payloadHash: string;
}
