import { numericMoneyTransformer } from '@/database/numeric-money.transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'marketdata' })
export class MarketDataEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'instrumentid', type: 'int' })
  instrumentId: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericMoneyTransformer,
  })
  close: number;

  @Column({ type: 'date' })
  date: string;
}
