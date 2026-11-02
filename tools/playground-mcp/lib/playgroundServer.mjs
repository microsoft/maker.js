// Controls a static http-server child process that serves the Maker.js repo so
// the playground is reachable at  http://localhost:<port>/docs/playground/
//
// Caching is disabled (-c-1) so that code written by set_playground_code shows
// up on a simple browser reload.

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// tools/playground-mcp/lib -> repo root
export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
export const PLAYGROUND_PATH = '/docs/playground/';
// The playground resolves ?script=<id> against MakerJsPlayground.relativePath,
// which docs/playground/index.html sets to '../demos/js/'. So script id
// 'mcp/current' -> docs/demos/js/mcp/current.js  (served at /docs/demos/js/mcp/current.js).
export const MCP_SCRIPT_ID = 'mcp/current';
export const MCP_CODE_FILE = path.join(REPO_ROOT, 'docs', 'demos', 'js', 'mcp', 'current.js');
export const MCP_CODE_URL_PATH = '/docs/demos/js/mcp/current.js';

const DEFAULT_PORT = Number(process.env.PLAYGROUND_PORT || 8020);

let child = null;
let currentPort = null;
let startedAt = null;
let lastStdout = '';

function httpServerBin() {
  // resolve the JS entrypoint so we can run it with the current node (Windows-safe)
  return require.resolve('http-server/bin/http-server');
}

export function playgroundUrl(port = currentPort || DEFAULT_PORT, scriptId) {
  const base = `http://localhost:${port}${PLAYGROUND_PATH}`;
  // script ids are simple path-like tokens (e.g. "mcp/current"); keep "/" readable
  return scriptId ? `${base}?script=${encodeURIComponent(scriptId).replace(/%2F/gi, '/')}` : base;
}

export async function isPortAlive(port) {
  try {
    const res = await fetch(`http://localhost:${port}${PLAYGROUND_PATH}`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function startPlayground({ port = DEFAULT_PORT } = {}) {
  if (child && !child.killed) {
    return {
      alreadyRunning: true,
      pid: child.pid,
      port: currentPort,
      url: playgroundUrl(currentPort),
      mcpUrl: playgroundUrl(currentPort, MCP_SCRIPT_ID),
    };
  }

  // Someone else may already be serving it.
  if (await isPortAlive(port)) {
    currentPort = port;
    startedAt = Date.now();
    return {
      alreadyRunning: true,
      external: true,
      port,
      url: playgroundUrl(port),
      mcpUrl: playgroundUrl(port, MCP_SCRIPT_ID),
    };
  }

  const args = [httpServerBin(), REPO_ROOT, '-p', String(port), '-c-1', '--silent'];
  child = spawn(process.execPath, args, {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  currentPort = port;
  startedAt = Date.now();
  lastStdout = '';
  child.stdout.on('data', d => { lastStdout = (lastStdout + d).slice(-2000); });
  child.stderr.on('data', d => { lastStdout = (lastStdout + d).slice(-2000); });
  child.on('exit', () => { child = null; currentPort = null; startedAt = null; });

  // wait for it to answer
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (await isPortAlive(port)) {
      return {
        started: true,
        pid: child.pid,
        port,
        url: playgroundUrl(port),
        mcpUrl: playgroundUrl(port, MCP_SCRIPT_ID),
        serves: REPO_ROOT,
      };
    }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`http-server did not come up on port ${port} within 8s. Output:\n${lastStdout}`);
}

export function stopPlayground() {
  if (!child || child.killed) return { stopped: false, reason: 'not running (or started externally)' };
  const pid = child.pid;
  child.kill();
  child = null;
  currentPort = null;
  startedAt = null;
  return { stopped: true, pid };
}

export async function playgroundStatus() {
  const managed = !!(child && !child.killed);
  const port = currentPort || DEFAULT_PORT;
  const alive = await isPortAlive(port);
  return {
    running: alive,
    managedByThisServer: managed,
    pid: managed ? child.pid : null,
    port,
    uptimeSeconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : null,
    url: playgroundUrl(port),
    mcpUrl: playgroundUrl(port, MCP_SCRIPT_ID),
    repoRoot: REPO_ROOT,
  };
}
