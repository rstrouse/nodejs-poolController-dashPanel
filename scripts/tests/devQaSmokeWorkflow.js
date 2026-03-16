#!/usr/bin/env node
'use strict';

const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const APP_ENTRY = path.join(ROOT_DIR, 'dist', 'app.js');

const HOST = process.env.SMOKE_HOST || '127.0.0.1';
const PORT = Number(process.env.SMOKE_PORT || 5150);
const SMOKE_PATH = '/browserSmoke.html';
const SMOKE_URL = process.env.SMOKE_URL || `http://localhost:${PORT}${SMOKE_PATH}`;
const STARTUP_TIMEOUT_MS = Number(process.env.SMOKE_STARTUP_TIMEOUT_MS || 30000);
const POLL_INTERVAL_MS = Number(process.env.SMOKE_POLL_MS || 400);
const SHOULD_OPEN_BROWSER = process.env.SMOKE_NO_OPEN !== '1';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function probeSmokePage() {
  return new Promise((resolve) => {
    const req = http.get(
      {
        host: HOST,
        port: PORT,
        path: SMOKE_PATH,
        timeout: 2000
      },
      (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServerReady() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < STARTUP_TIMEOUT_MS) {
    if (await probeSmokePage()) return;
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for ${SMOKE_URL}`);
}

function openBrowser(url) {
  const opts = { stdio: 'ignore', detached: true };
  if (process.platform === 'darwin') {
    spawn('open', [url], opts).unref();
    return true;
  }
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], opts).unref();
    return true;
  }
  if (process.platform === 'linux') {
    spawn('xdg-open', [url], opts).unref();
    return true;
  }
  return false;
}

async function main() {
  const appProc = spawn(process.execPath, [APP_ENTRY], {
    cwd: ROOT_DIR,
    env: process.env,
    stdio: 'inherit'
  });

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    appProc.kill(signal);
    setTimeout(() => {
      if (!appProc.killed) appProc.kill('SIGKILL');
    }, 2000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  appProc.on('exit', (code, signal) => {
    if (!shuttingDown) {
      if (signal) {
        console.error(`[qa:smoke] App exited on signal ${signal}.`);
        process.exit(1);
      }
      process.exit(code || 0);
      return;
    }
    process.exit(0);
  });

  try {
    await waitForServerReady();
    console.log(`[qa:smoke] Smoke page ready at ${SMOKE_URL}`);
    if (SHOULD_OPEN_BROWSER) {
      if (openBrowser(SMOKE_URL)) {
        console.log('[qa:smoke] Opened browser smoke page. Press Ctrl+C to stop the app.');
      } else {
        console.log('[qa:smoke] Auto-open unsupported on this platform. Open the URL manually.');
      }
    } else {
      console.log('[qa:smoke] Browser auto-open disabled (SMOKE_NO_OPEN=1).');
    }
  } catch (err) {
    console.error(`[qa:smoke] ${err.message}`);
    shutdown('SIGTERM');
  }
}

main().catch((err) => {
  console.error(`[qa:smoke] Unexpected error: ${err.message}`);
  process.exit(1);
});
