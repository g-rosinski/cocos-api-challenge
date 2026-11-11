import { DataSource } from 'typeorm';
import { createDatabaseOptions } from './database-options.js';

export const AppDataSource = new DataSource(createDatabaseOptions(process.env));
