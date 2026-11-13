import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'instruments' })
export class InstrumentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  ticker: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  type: string;
}
