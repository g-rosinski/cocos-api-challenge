import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchIndexesAndIdempotency1731340800000 implements MigrationInterface {
  name = 'AddSearchIndexesAndIdempotency1731340800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(`CREATE INDEX instruments_ticker_trgm
  ON instruments USING gin (ticker gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX instruments_name_trgm
  ON instruments USING gin (name gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX orders_instrument_type_idx
  ON orders (instrumentid, type)`);
    await queryRunner.query(`CREATE INDEX orders_user_status_idx
  ON orders (userid, status)`);
    await queryRunner.query(`CREATE INDEX marketdata_instrument_date_idx
  ON marketdata (instrumentid, date DESC)`);
    await queryRunner.query(`CREATE TABLE order_idempotency_keys (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  idempotency_key UUID NOT NULL,
  order_id INT NOT NULL REFERENCES orders(id),
  payload_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT uk_user_key UNIQUE (user_id, idempotency_key)
)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS order_idempotency_keys`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS marketdata_instrument_date_idx`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS orders_user_status_idx`);
    await queryRunner.query(`DROP INDEX IF EXISTS orders_instrument_type_idx`);
    await queryRunner.query(`DROP INDEX IF EXISTS instruments_name_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS instruments_ticker_trgm`);
  }
}
