import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const targetDir = join(root, 'dist', 'database');
mkdirSync(targetDir, { recursive: true });
copyFileSync(join(root, 'database', 'seed.sql'), join(targetDir, 'seed.sql'));
