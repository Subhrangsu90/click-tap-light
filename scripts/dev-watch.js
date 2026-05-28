const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const electronPath = require('electron');
const watchTargets = ['src', 'build', 'package.json'].map((item) => path.join(root, item));

let electronProcess;
let restartTimer;
let shuttingDown = false;

function log(message) {
  console.log(`[dev-watch] ${message}`);
}

function startElectron() {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  electronProcess = spawn(electronPath, ['.'], {
    cwd: root,
    env,
    stdio: 'inherit',
    windowsHide: false
  });

  electronProcess.on('exit', (code, signal) => {
    if (!shuttingDown) log(`Electron exited (${signal || code}). Waiting for changes...`);
    electronProcess = null;
  });
}

function stopElectron(callback) {
  if (!electronProcess || electronProcess.killed) {
    callback();
    return;
  }

  const pid = electronProcess.pid;
  const killer = process.platform === 'win32'
    ? spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' })
    : null;

  if (killer) {
    killer.on('exit', callback);
    return;
  }

  electronProcess.once('exit', callback);
  electronProcess.kill('SIGTERM');
}

function scheduleRestart(fileName) {
  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    log(`Restarting after change${fileName ? `: ${fileName}` : ''}`);
    stopElectron(startElectron);
  }, 180);
}

function watchTarget(target) {
  if (!fs.existsSync(target)) return;

  fs.watch(target, { recursive: fs.statSync(target).isDirectory() }, (_eventType, fileName) => {
    if (fileName && String(fileName).includes('node_modules')) return;
    scheduleRestart(fileName);
  });
}

process.on('SIGINT', () => {
  shuttingDown = true;
  stopElectron(() => process.exit(0));
});

process.on('SIGTERM', () => {
  shuttingDown = true;
  stopElectron(() => process.exit(0));
});

for (const target of watchTargets) watchTarget(target);

log('Watching src, build, and package.json');
startElectron();
