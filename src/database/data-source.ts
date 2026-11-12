import { DataSource } from 'typeorm';
import { createDatabaseOptions } from '@/database/database-options';

export const AppDataSource = new DataSource(createDatabaseOptions(process.env));
