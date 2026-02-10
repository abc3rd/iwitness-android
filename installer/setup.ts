#!/usr/bin/env node
// ============================================================
// UCrash iWitness — Cross-Platform Installer
// Compile to .exe with: npx pkg setup.js --targets node22-win-x64
// ============================================================

import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { homedir, platform, arch } from 'os';
import * as readline from 'readline';

const IS_WIN = platform() === 'win32';
const IS_MAC = platform() === 'darwin';
const HOME = homedir();
const DEFAULT_DIR = join(HOME, 'ucrash-iwitness');
const DESKTOP = IS_WIN
  ? join(HOME, 'Desktop')
  : IS_MAC
    ? join(HOME, 'Desktop')
    : join(HOME, 'Desktop');

// ---- Colors ----
const c = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

function log(msg: string) { console.log(msg); }
function ok(msg: string) { log(`  ${c.green('[OK]')} ${msg}`); }
function info(msg: string) { log(`  ${c.blue('[*]')} ${msg}`); }
function warn(msg: string) { log(`  ${c.yellow('[!]')} ${msg}`); }
function err(msg: string) { log(`  ${c.red('[ERROR]')} ${msg}`); }

function run(cmd: string, opts: { cwd?: string; silent?: boolean } = {}): string {
  try {
    return execSync(cmd, {
      cwd: opts.cwd,
      stdio: opts.silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      timeout: 300000, // 5 min timeout
    }) || '';
  } catch (e) {
    if (!opts.silent) throw e;
    return '';
  }
}

function commandExists(cmd: string): boolean {
  try {
    const check = IS_WIN ? `where ${cmd}` : `which ${cmd}`;
    execSync(check, { stdio: 'pipe' });
    return true;
  } catch { return false; }
}

function copyDirRecursive(src: string, dest: string) {
  if (!existsSync(src)) return;
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

  for (const entry of readdirSync(src)) {
    // Skip node_modules, .git, dist, android/app/build
    if (['node_modules', '.git', 'dist', 'build', '.firebase'].includes(entry)) continue;

    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

// ---- Step Functions ----

function printBanner() {
  log('');
  log(c.blue('  ╔══════════════════════════════════════════════════════╗'));
  log(c.blue('  ║                                                      ║'));
  log(c.blue('  ║   ') + c.bold('UCrash iWitness') + c.blue('                                 ║'));
  log(c.blue('  ║   ') + 'Smart Viral Affiliate Scan & Share Super-App' + c.blue('   ║'));
  log(c.blue('  ║   ') + 'UCrash + LegendaryLeads + UCP Fusion' + c.blue('            ║'));
  log(c.blue('  ║                                                      ║'));
  log(c.blue('  ╚══════════════════════════════════════════════════════╝'));
  log('');
}

function checkPrereqs(): { node: boolean; git: boolean; docker: boolean } {
  log(c.bold('\n  Step 1 of 6 — Checking Prerequisites\n'));

  const node = commandExists('node');
  const git = commandExists('git');
  const docker = commandExists('docker');

  if (node) {
    const ver = run('node --version', { silent: true }).trim();
    ok(`Node.js ${ver}`);
  } else {
    err('Node.js NOT found — required');
  }

  if (git) {
    ok('Git found');
  } else {
    warn('Git not found — needed for cloning');
  }

  if (docker) {
    ok('Docker found (optional — for database)');
  } else {
    info('Docker not found — you can install it later for the database');
  }

  return { node, git, docker };
}

function setupProject(installDir: string) {
  log(c.bold(`\n  Step 2 of 6 — Setting Up Project\n`));

  if (!existsSync(installDir)) {
    mkdirSync(installDir, { recursive: true });
    ok(`Created directory: ${installDir}`);
  }

  // Find source — check if we're inside the project or if installer is standalone
  const scriptDir = dirname(resolve(__filename));
  const possibleSources = [
    join(scriptDir, '..'),    // installer/ is inside project
    scriptDir,                // installer is the project
    process.cwd(),            // current directory
  ];

  let sourceFound = false;
  for (const src of possibleSources) {
    if (existsSync(join(src, 'package.json')) && existsSync(join(src, 'src', 'App.tsx'))) {
      info(`Copying project from: ${src}`);
      copyDirRecursive(src, installDir);
      sourceFound = true;
      ok('Project files copied.');
      break;
    }
  }

  if (!sourceFound) {
    info('Project files not found locally. Cloning from GitHub...');
    run(`git clone https://github.com/abc3rd/iwitness-android.git "${installDir}"`, { silent: false });
    ok('Repository cloned.');
  }
}

function installDeps(installDir: string) {
  log(c.bold('\n  Step 3 of 6 — Installing Dependencies\n'));

  info('Installing frontend dependencies...');
  run('npm install --legacy-peer-deps', { cwd: installDir });
  ok('Frontend dependencies installed.');

  const backendDir = join(installDir, 'backend');
  if (existsSync(join(backendDir, 'package.json'))) {
    info('Installing backend dependencies...');
    run('npm install --legacy-peer-deps', { cwd: backendDir });
    ok('Backend dependencies installed.');
  }
}

function setupEnv(installDir: string) {
  log(c.bold('\n  Step 4 of 6 — Environment Configuration\n'));

  const envExample = join(installDir, 'backend', '.env.example');
  const envFile = join(installDir, 'backend', '.env');

  if (existsSync(envExample) && !existsSync(envFile)) {
    copyFileSync(envExample, envFile);
    ok('Created backend/.env from template.');
    warn('Edit backend/.env with your real API keys before going live.');
  } else if (existsSync(envFile)) {
    ok('Backend .env already exists.');
  }
}

function buildProject(installDir: string) {
  log(c.bold('\n  Step 5 of 6 — Building\n'));

  info('Building frontend...');
  try {
    run('npm run build', { cwd: installDir });
    ok('Frontend built to dist/');
  } catch {
    warn('Frontend build had issues — dev server will still work.');
  }
}

function createLaunchers(installDir: string) {
  log(c.bold('\n  Step 6 of 6 — Creating Desktop Launchers\n'));

  if (IS_WIN) {
    // Windows .bat launcher
    const startBat = `@echo off
title UCrash iWitness
color 0A
echo Starting UCrash iWitness...
echo.
cd /d "${installDir}"
start "UCrash-Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "UCrash-Frontend" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
start http://localhost:5173
echo.
echo UCrash iWitness is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo.
echo Press any key to stop servers...
pause >nul
taskkill /f /fi "WINDOWTITLE eq UCrash-Backend*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq UCrash-Frontend*" >nul 2>&1
`;
    const batPath = join(DESKTOP, 'UCrash iWitness.bat');
    writeFileSync(batPath, startBat, 'utf-8');
    ok(`Desktop launcher: ${batPath}`);

    // Also create a VBS wrapper to hide the cmd window (optional nicer UX)
    const vbsContent = `Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "${batPath}" & chr(34), 1, False
`;
    const vbsPath = join(DESKTOP, 'UCrash iWitness.vbs');
    writeFileSync(vbsPath, vbsContent, 'utf-8');

  } else if (IS_MAC) {
    // macOS .command launcher
    const commandContent = `#!/bin/bash
cd "${installDir}"
cd backend && npm run dev &
sleep 2
cd "${installDir}" && npm run dev &
sleep 3
open http://localhost:5173
echo ""
echo "UCrash iWitness is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop."
wait
`;
    const cmdPath = join(DESKTOP, 'UCrash-iWitness.command');
    writeFileSync(cmdPath, commandContent, { mode: 0o755 });
    ok(`Desktop launcher: ${cmdPath}`);

  } else {
    // Linux .desktop entry
    const desktopEntry = `[Desktop Entry]
Version=1.0
Type=Application
Name=UCrash iWitness
Comment=Smart Viral Affiliate Scan & Share Super-App
Exec=bash -c "cd ${installDir} && cd backend && npm run dev & sleep 2 && cd ${installDir} && npm run dev & sleep 3 && xdg-open http://localhost:5173 && wait"
Terminal=true
Categories=Development;
`;
    const desktopPath = join(DESKTOP, 'UCrash-iWitness.desktop');
    writeFileSync(desktopPath, desktopEntry, { mode: 0o755 });
    ok(`Desktop launcher: ${desktopPath}`);
  }

  // Also create start/stop scripts in the install dir
  if (IS_WIN) {
    writeFileSync(join(installDir, 'start.bat'),
      `@echo off\ncd /d "${installDir}"\nstart cmd /k "cd backend && npm run dev"\ntimeout /t 2 /nobreak >nul\nstart cmd /k "npm run dev"\ntimeout /t 4 /nobreak >nul\nstart http://localhost:5173\n`,
      'utf-8');
    writeFileSync(join(installDir, 'stop.bat'),
      `@echo off\ntaskkill /f /im node.exe >nul 2>&1\necho Servers stopped.\npause\n`,
      'utf-8');
  } else {
    writeFileSync(join(installDir, 'start.sh'),
      `#!/bin/bash\ncd "$(dirname "$0")"\ncd backend && npm run dev &\nsleep 2\ncd "$(dirname "$0")" && npm run dev &\nsleep 3\n${IS_MAC ? 'open' : 'xdg-open'} http://localhost:5173\nwait\n`,
      { mode: 0o755 });
    writeFileSync(join(installDir, 'stop.sh'),
      `#!/bin/bash\npkill -f "tsx watch" 2>/dev/null\npkill -f "vite" 2>/dev/null\necho "Servers stopped."\n`,
      { mode: 0o755 });
  }

  ok('Start/stop scripts created in install directory.');
}

// ---- Main ----
async function main() {
  printBanner();

  const prereqs = checkPrereqs();

  if (!prereqs.node) {
    err('Node.js is required. Please install it from https://nodejs.org/');
    log('');
    if (IS_WIN) {
      log('  Download: https://nodejs.org/dist/v22.12.0/node-v22.12.0-x64.msi');
    } else if (IS_MAC) {
      log('  Run: brew install node');
    } else {
      log('  Run: curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt install nodejs');
    }
    process.exit(1);
  }

  log('');
  const installDir = (await ask(`  Install location [${DEFAULT_DIR}]: `)) || DEFAULT_DIR;

  setupProject(installDir);
  installDeps(installDir);
  setupEnv(installDir);
  buildProject(installDir);
  createLaunchers(installDir);

  log('');
  log(c.green('  ╔══════════════════════════════════════════════════════╗'));
  log(c.green('  ║         INSTALLATION COMPLETE!                       ║'));
  log(c.green('  ╚══════════════════════════════════════════════════════╝'));
  log('');
  log(`  ${c.bold('Install location:')} ${installDir}`);
  log('');
  log(`  ${c.bold('To start:')} Double-click "UCrash iWitness" on your Desktop`);
  log('');
  log(`  ${c.bold('URLs:')}`);
  log(`    Frontend: ${c.blue('http://localhost:5173')}`);
  log(`    Backend:  ${c.blue('http://localhost:3001')}`);
  log('');
  log(`  ${c.yellow('NEXT STEPS:')}`);
  log(`    1. Edit ${join(installDir, 'backend', '.env')} with your API keys`);
  log(`    2. Set up PostgreSQL database`);
  log(`       Option A: docker-compose up postgres redis`);
  log(`       Option B: Use Supabase (cloud)`);
  log('');

  await ask('  Press Enter to exit...');
}

main().catch((e) => {
  err(e.message);
  process.exit(1);
});
