import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pidFile = join(root, '.dev-server.pid');

if (!existsSync(pidFile)) {
  process.exit(0);
}

const pid = Number.parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
if (!Number.isInteger(pid) || pid <= 0) {
  try {
    unlinkSync(pidFile);
  } catch {
    // ignore
  }
  process.exit(0);
}

try {
  process.kill(pid, 'SIGTERM');
} catch (err) {
  if (!(err && typeof err === 'object' && 'code' in err && err.code === 'ESRCH')) {
    throw err;
  }
}

if (process.platform === 'win32') {
  spawnSync('taskkill', ['/PID', String(pid), '/F', '/T'], {
    stdio: 'ignore',
    shell: true,
  });
}

try {
  unlinkSync(pidFile);
} catch {
  // ignore
}
