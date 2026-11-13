import { DataSource } from 'typeorm';
import { createDatabaseOptions } from '@/database/typeorm/database-options';

export const AppDataSource = new DataSource(createDatabaseOptions(process.env));
