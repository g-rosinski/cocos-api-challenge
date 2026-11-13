import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const LOCAL_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  'host.docker.internal',
]);

const RESET_SQL = `
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO CURRENT_USER;
GRANT ALL ON SCHEMA public TO public;
`;

function databaseHostname(databaseUrl) {
  const normalized = databaseUrl.replace(/^postgres:\/\//, 'postgresql://');
  const parsed = new URL(normalized);
  return parsed.hostname.toLowerCase();
}

function allowsRemoteReset() {
  const value = process.env.DB_RESET_ALLOW_REMOTE?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

function assertResetAllowed(databaseUrl) {
  const host = databaseHostname(databaseUrl);
  if (LOCAL_HOSTS.has(host) || allowsRemoteReset()) {
    return host;
  }
  console.error(
    [
      `reset-database: el host "${host}" no es local.`,
      'Solo se permite en localhost, 127.0.0.1, ::1 o host.docker.internal.',
      'Para una base remota (Neon), definí DB_RESET_ALLOW_REMOTE=true.',
    ].join(' '),
  );
  process.exit(1);
}

function runNpmScript(scriptName) {
  const result = spawnSync('npm', ['run', scriptName], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function resetPublicSchema(databaseUrl) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(RESET_SQL);
  } finally {
    await client.end();
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl.length === 0) {
    console.error('reset-database: DATABASE_URL no está definida.');
    process.exit(1);
  }

  const host = assertResetAllowed(databaseUrl);
  console.log(`reset-database: vaciando schema public en ${host}...`);
  await resetPublicSchema(databaseUrl);
  console.log('reset-database: build...');
  runNpmScript('build');
  console.log('reset-database: bootstrap...');
  runNpmScript('db:bootstrap');
  console.log('reset-database: listo (seed + migraciones).');
}

try {
  await main();
} catch (error) {
  console.error(
    'reset-database: falló',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
}
