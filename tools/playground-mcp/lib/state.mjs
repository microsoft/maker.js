// Reads/writes the shared playground code file and browses bundled demo sources.

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT, MCP_CODE_FILE } from './playgroundServer.mjs';

const DEMOS_DIR = path.join(REPO_ROOT, 'docs', 'demos', 'js');

export const STARTER_CODE = `var makerjs = require('makerjs');

// Maker.js playground IModel. Assign this.paths / this.models / this.notes,
// or set module.exports to a constructor function with .metaParameters.
this.paths = {
    head: new makerjs.paths.Circle([0, 0], 90),
    eye: new makerjs.paths.Circle([25, 25], 10),
    mouth: new makerjs.paths.Arc([0, 0], 50, 225, 315),
    wink: new makerjs.paths.Line([-35, 20], [-15, 20])
};
this.notes = '# Maker.js playground (MCP)\\nEdited by an AI agent via the makerjs-playground MCP server.';
`;

export function ensureCodeFile() {
  fs.mkdirSync(path.dirname(MCP_CODE_FILE), { recursive: true });
  if (!fs.existsSync(MCP_CODE_FILE)) {
    fs.writeFileSync(MCP_CODE_FILE, STARTER_CODE, 'utf8');
  }
}

export async function readCode() {
  try {
    return await fsp.readFile(MCP_CODE_FILE, 'utf8');
  } catch {
    return null;
  }
}

export async function writeCode(code) {
  await fsp.mkdir(path.dirname(MCP_CODE_FILE), { recursive: true });
  await fsp.writeFile(MCP_CODE_FILE, String(code), 'utf8');
  return { file: MCP_CODE_FILE, bytes: Buffer.byteLength(String(code), 'utf8') };
}

export async function listExamples() {
  let names;
  try {
    names = (await fsp.readdir(DEMOS_DIR)).filter(f => f.endsWith('.js'));
  } catch {
    return [];
  }
  const out = [];
  for (const f of names.sort()) {
    let firstMeaningfulLine = '';
    try {
      const src = await fsp.readFile(path.join(DEMOS_DIR, f), 'utf8');
      firstMeaningfulLine =
        src.split('\n').map(l => l.trim())
          .find(l => l && !l.startsWith('//') && l !== "var makerjs = require('makerjs');") || '';
    } catch { /* ignore */ }
    out.push({ name: f.replace(/\.js$/, ''), file: `docs/demos/js/${f}`, peek: firstMeaningfulLine.slice(0, 120) });
  }
  return out;
}

export async function getExample(name) {
  const clean = String(name).replace(/[^a-zA-Z0-9_-]/g, '');
  const file = path.join(DEMOS_DIR, `${clean}.js`);
  try {
    const src = await fsp.readFile(file, 'utf8');
    return { name: clean, file: `docs/demos/js/${clean}.js`, source: src };
  } catch {
    return { name: clean, error: `No demo named "${clean}". Use list_examples to see options.` };
  }
}
