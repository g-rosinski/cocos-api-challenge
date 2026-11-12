import { numericMoneyTransformer } from '@/database/numeric-money.transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'instrumentid', type: 'int' })
  instrumentId: number;

  @Column({ name: 'userid', type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  size: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericMoneyTransformer,
  })
  price: number;

  @Column({ type: 'varchar', length: 10 })
  type: string;

  @Column({ type: 'varchar', length: 10 })
  side: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'timestamp' })
  datetime: Date;
}
