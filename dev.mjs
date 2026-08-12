import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Kill any process occupying the given ports before starting
function freePort(port) {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const pids = [...new Set(
      result.split('\n')
        .map(line => line.trim().split(/\s+/).pop())
        .filter(pid => pid && /^\d+$/.test(pid) && pid !== '0')
    )];
    for (const pid of pids) {
      try { execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' }); } catch (_) {}
    }
  } catch (_) {}
}

console.log('Cleaning up ports 3000 and 4000...');
freePort(3000);
freePort(4000);

const api = spawn(process.execPath, [fileURLToPath(new URL('./node_modules/tsx/dist/cli.mjs', import.meta.url)), 'watch', 'server.ts'], { stdio: 'inherit' });
const web = spawn(process.execPath, [fileURLToPath(new URL('./node_modules/vite/bin/vite.js', import.meta.url)), '--port=3000', '--host=0.0.0.0', '--strictPort'], { stdio: 'inherit' });

const killProcess = (proc) => {
  if (proc.pid) {
    try {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } catch (_) {
      try { proc.kill('SIGKILL'); } catch (_) {}
    }
  }
};

const stop = () => {
  killProcess(api);
  killProcess(web);
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
