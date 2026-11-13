import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pidFile = join(root, '.dev-server.pid');
const inspect = process.argv.includes('--inspect-brk');

function killPid(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return;
  }
  try {
    process.kill(pid, 'SIGTERM');
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ESRCH') {
      return;
    }
  }
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/F', '/T'], {
      stdio: 'ignore',
      shell: true,
    });
  }
}

function stopRecordedDevServer() {
  if (!existsSync(pidFile)) {
    return;
  }
  const pid = Number.parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
  killPid(pid);
  try {
    unlinkSync(pidFile);
  } catch {
    // ignore
  }
}

function runTscAlias() {
  const result = spawnSync('npx', ['tsc-alias', '-p', 'tsconfig.build.json'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

stopRecordedDevServer();
runTscAlias();

const nodeArgs = ['--env-file=.env'];
if (inspect) {
  nodeArgs.push('--inspect-brk');
}
nodeArgs.push('dist/main.js');

const child = spawn('node', nodeArgs, {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

writeFileSync(pidFile, String(child.pid));

function shutdown(signal) {
  killPid(child.pid);
  try {
    unlinkSync(pidFile);
  } catch {
    // ignore
  }
  process.exit(signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

child.on('exit', (code, signal) => {
  try {
    unlinkSync(pidFile);
  } catch {
    // ignore
  }
  if (signal) {
    process.exit(0);
    return;
  }
  process.exit(code ?? 0);
});
