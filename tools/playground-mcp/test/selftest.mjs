// Automated verification for the makerjs-playground MCP server.
//
//   node test/selftest.mjs
//
// Exercises:
//   1. the headless render engine (valid model, kit + params, syntax error,
//      runtime error, not-a-model, multi-format export)
//   2. the shared code file (write / read round-trip)
//   3. the real MCP server over stdio (initialize, tools/list, tools/call)
//   4. the live playground web server (http reachability of the page and of
//      the mcp/current.js script)
//
// Exit code 0 = all pass, 1 = one or more failed.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { renderModel } from '../lib/render.mjs';
import { writeCode, readCode } from '../lib/state.mjs';
import {
  startPlayground, stopPlayground, playgroundUrl, MCP_SCRIPT_ID, MCP_CODE_URL_PATH,
} from '../lib/playgroundServer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(__dirname, '..', 'server.mjs');

let pass = 0, fail = 0;
const results = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; results.push({ name, status: 'PASS', detail }); console.log(`  PASS  ${name}${detail ? '  — ' + detail : ''}`); }
  else { fail++; results.push({ name, status: 'FAIL', detail }); console.log(`  FAIL  ${name}${detail ? '  — ' + detail : ''}`); }
}

// ---------------------------------------------------------------------------
console.log('\n[1] Headless render engine');

const smiley = `var makerjs = require('makerjs');
this.paths = {
  head: new makerjs.paths.Circle([0,0], 90),
  eye:  new makerjs.paths.Circle([25,25], 10),
  mouth:new makerjs.paths.Arc([0,0], 50, 225, 315)
};
this.notes = '# hi';`;
{
  const r = renderModel(smiley, { exports: ['svg', 'dxf', 'json'] });
  check('valid this.paths renders', r.ok && r.kind === 'model', `kind=${r.kind}`);
  check('extents are correct', r.ok && r.extents.width === 180 && r.extents.height === 180,
    r.ok ? `${r.extents.width}x${r.extents.height}` : 'n/a');
  check('path count = 3', r.ok && r.stats.pathCount === 3, r.ok ? `pathCount=${r.stats.pathCount}` : 'n/a');
  check('SVG export present', r.ok && /^<svg[\s>]/.test(r.outputs.svg.trim()));
  check('DXF export present', r.ok && typeof r.outputs.dxf === 'string' && r.outputs.dxf.includes('SECTION'));
  check('JSON export present', r.ok && typeof r.outputs.json === 'string');
}

const kit = `var makerjs = require('makerjs');
function widget(sides, radius, bone) {
  var poly = new makerjs.models.Polygon(sides, radius);
  var chain = makerjs.model.findSingleChain(poly);
  this.models = { poly: poly, bones: makerjs.chain.dogbone(chain, bone) };
}
widget.metaParameters = [
  { title:'sides',  type:'range', min:3, max:12, value:6 },
  { title:'radius', type:'range', min:10, max:100, value:50 },
  { title:'bone',   type:'range', min:0, max:10, value:5 }
];
module.exports = widget;`;
{
  const r = renderModel(kit, {});
  check('kit detected + constructed with defaults', r.ok && r.kind === 'kit', `usedParams=${JSON.stringify(r.usedParams)}`);
  check('kit metaParameters surfaced', r.ok && Array.isArray(r.metaParameters) && r.metaParameters.length === 3);
  const r2 = renderModel(kit, { params: [8, 80, 3] });
  check('kit honors explicit params', r2.ok && Math.round(r2.extents.width) === 160,
    r2.ok ? `width=${r2.extents.width.toFixed(1)}` : 'n/a');
}

{
  const r = renderModel('this.paths = { c: new makerjs.paths.Circle([0,0], 10 };');
  check('syntax error -> ok:false, phase compile', !r.ok && r.phase === 'compile', `name=${r.error.name}`);
  check('syntax error reports a line', !r.ok && r.error.line === 1, `line=${r.error.line}`);
}
{
  const r = renderModel(`var makerjs = require('makerjs');\nthis.paths = {};\nnope.doThing();`);
  check('runtime error -> ok:false, phase run', !r.ok && r.phase === 'run', `name=${r.error.name}`);
  check('runtime error reports line+column', !r.ok && r.error.line === 3 && typeof r.error.column === 'number',
    `${r.error.line}:${r.error.column}`);
}
{
  const r = renderModel('var x = 41 + 1;');
  check('not-a-model -> ok:false, phase resolve', !r.ok && r.phase === 'resolve', `name=${r.error.name}`);
}
{
  const r = renderModel(`require('left-pad');`);
  check('require() of non-makerjs module is blocked', !r.ok, `${r.error?.name}: ${r.error?.message?.slice(0, 60)}`);
}

// ---------------------------------------------------------------------------
console.log('\n[2] Shared code file round-trip');
{
  const marker = `// selftest ${Date.now()}\nvar makerjs = require('makerjs');\nthis.paths = { c: new makerjs.paths.Circle([0,0], 5) };\n`;
  const w = await writeCode(marker);
  const back = await readCode();
  check('writeCode then readCode returns same bytes', back === marker, `${w.bytes} bytes`);
}

// ---------------------------------------------------------------------------
console.log('\n[3] MCP server over stdio');
{
  const transport = new StdioClientTransport({ command: process.execPath, args: [SERVER] });
  const client = new Client({ name: 'selftest', version: '1.0.0' });
  await client.connect(transport);

  const tools = (await client.listTools()).tools;
  const names = tools.map(t => t.name).sort();
  const expected = ['get_example', 'get_playground_code', 'list_examples', 'list_models',
    'makerjs_api', 'playground_start', 'playground_status', 'playground_stop',
    'render_model', 'set_playground_code'];
  check('tools/list returns all 10 tools', expected.every(n => names.includes(n)), names.join(','));

  const rc = await client.callTool({ name: 'render_model', arguments: { code: smiley } });
  const rcObj = JSON.parse(rc.content[0].text);
  check('tools/call render_model works', rcObj.ok === true && rcObj.stats.pathCount === 3);

  const lm = await client.callTool({ name: 'list_models', arguments: {} });
  const lmObj = JSON.parse(lm.content[0].text);
  check('tools/call list_models returns builtins', lmObj.count >= 20, `count=${lmObj.count}`);

  const api = await client.callTool({ name: 'makerjs_api', arguments: {} });
  const apiObj = JSON.parse(api.content[0].text);
  check('tools/call makerjs_api returns namespaces', !!apiObj.namespaces.exporter && !!apiObj.namespaces.model);

  const badWrite = await client.callTool({
    name: 'set_playground_code',
    arguments: { code: 'this.paths = { c: new makerjs.paths.Circle([0,0] };' },
  });
  const bwObj = JSON.parse(badWrite.content[0].text);
  check('set_playground_code refuses broken code', bwObj.written === false);

  const goodWrite = await client.callTool({
    name: 'set_playground_code',
    arguments: { code: smiley },
  });
  const gwObj = JSON.parse(goodWrite.content[0].text);
  check('set_playground_code writes valid code', gwObj.written === true && gwObj.mcpUrl.includes(MCP_SCRIPT_ID));

  const getCode = await client.callTool({ name: 'get_playground_code', arguments: {} });
  const gcObj = JSON.parse(getCode.content[0].text);
  check('get_playground_code reads it back', gcObj.code === smiley);

  await client.close();
}

// ---------------------------------------------------------------------------
console.log('\n[4] Live playground web server');
let started;
try {
  started = await startPlayground({});
  check('playground_start reports a URL', !!started.url, started.url || JSON.stringify(started));

  const page = await fetch(playgroundUrl(started.port));
  const html = await page.text();
  check('GET /docs/playground/ -> 200 + Maker.js Playground',
    page.status === 200 && html.includes('Maker.js Playground'), `status=${page.status}`);

  const scriptRes = await fetch(`http://localhost:${started.port}${MCP_CODE_URL_PATH}`);
  const scriptTxt = await scriptRes.text();
  check(`GET ${MCP_CODE_URL_PATH} -> 200 + our code`,
    scriptRes.status === 200 && scriptTxt.includes("require('makerjs')"), `status=${scriptRes.status}`);

  // the ?script= URL the playground actually uses must resolve to that same file
  const viaScriptParam = await fetch(
    `http://localhost:${started.port}/docs/playground/../demos/js/${MCP_SCRIPT_ID}.js`);
  check('?script=mcp/current resolves to the code file', viaScriptParam.status === 200,
    `status=${viaScriptParam.status}`);
} finally {
  const stopped = stopPlayground();
  check('playground_stop stops the managed server', stopped.stopped === true || stopped.reason?.includes('external'),
    JSON.stringify(stopped));
}

// ---------------------------------------------------------------------------
console.log(`\n──────────────────────────────────────────`);
console.log(`RESULT: ${pass} passed, ${fail} failed`);
console.log(`──────────────────────────────────────────\n`);
// Let stdio pipes / child handles finish closing before exiting (Windows libuv).
process.exitCode = fail === 0 ? 0 : 1;
setTimeout(() => process.exit(process.exitCode), 1500).unref();
