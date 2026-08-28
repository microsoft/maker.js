#!/usr/bin/env node
// makerjs-playground MCP server
// ----------------------------------------------------------------------------
// Gives an AI agent a fast edit -> render -> inspect -> fix loop for Maker.js
// "IModel" JavaScript (the code in the Maker.js playground's right-hand editor).
//
// Transport: stdio.  Start manually with `node server.mjs`, or let Claude Code
// launch it from .mcp.json.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { renderModel, listModels, makerjsApi, makerjs } from './lib/render.mjs';
import {
  startPlayground, stopPlayground, playgroundStatus, playgroundUrl,
  MCP_SCRIPT_ID, MCP_CODE_FILE,
} from './lib/playgroundServer.mjs';
import {
  ensureCodeFile, readCode, writeCode, listExamples, getExample,
} from './lib/state.mjs';

ensureCodeFile();

const server = new McpServer(
  { name: 'makerjs-playground', version: '1.0.0' },
  {
    instructions:
      'Self-develop and self-debug Maker.js playground IModel JavaScript.\n' +
      'Typical loop: write code -> render_model (headless, returns extents/stats/SVG or a ' +
      'structured error with line/column) -> fix -> repeat. When it looks right, call ' +
      'set_playground_code to push it into the live browser playground ' +
      '(playground_start first; open the returned mcpUrl and reload to see changes).\n' +
      'Code shape: assign this.paths / this.models / this.notes, OR set module.exports to a ' +
      'constructor function with a .metaParameters array. require() only resolves "makerjs".',
  },
);

const json = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });
const text = (s) => ({ content: [{ type: 'text', text: s }] });

// --- render_model -----------------------------------------------------------
server.registerTool(
  'render_model',
  {
    title: 'Render Maker.js IModel code (headless)',
    description:
      'Execute playground IModel JavaScript in a headless Maker.js sandbox and return ' +
      'bounding-box extents, path/model/chain counts, captured console output, and the ' +
      'requested exports (SVG by default). On failure returns {ok:false, phase, error:{name,message,line,column,stack}}. ' +
      'This does NOT touch the browser playground - use it as the fast inner dev loop.',
    inputSchema: {
      code: z.string().describe('The IModel JavaScript (playground editor contents).'),
      params: z.array(z.any()).optional()
        .describe('Kit parameter values, in metaParameters order, when the code exports a constructor.'),
      exports: z.array(z.enum(['svg', 'dxf', 'json', 'pathdata', 'openjscad', 'stl'])).optional()
        .describe('Which export formats to return. Default ["svg"].'),
      svgOptions: z.record(z.any()).optional().describe('Options forwarded to makerjs.exporter.toSVG.'),
    },
  },
  async ({ code, params, exports, svgOptions }) => {
    const result = renderModel(code, { params, exports, svgOptions });
    return json(result);
  },
);

// --- set_playground_code --------------------------------------------------
server.registerTool(
  'set_playground_code',
  {
    title: 'Push code into the live browser playground',
    description:
      `Validate code with a headless render (unless force=true), then write it to ${'`docs/playground/mcp/current.js`'} ` +
      'so the browser playground shows it at the returned mcpUrl (reload the page to pick up changes). ' +
      'Refuses to write broken code unless force=true.',
    inputSchema: {
      code: z.string().describe('The IModel JavaScript to publish to the playground.'),
      params: z.array(z.any()).optional().describe('Kit parameter values used for the validation render.'),
      force: z.boolean().optional().describe('Write even if the validation render fails. Default false.'),
    },
  },
  async ({ code, params, force }) => {
    const render = renderModel(code, { params, exports: ['svg'] });
    if (!render.ok && !force) {
      return json({ written: false, reason: 'validation render failed; pass force:true to write anyway', render });
    }
    const w = await writeCode(code);
    const st = await playgroundStatus();
    return json({
      written: true,
      file: w.file,
      bytes: w.bytes,
      scriptId: MCP_SCRIPT_ID,
      mcpUrl: playgroundUrl(st.port, MCP_SCRIPT_ID),
      playgroundRunning: st.running,
      hint: st.running
        ? 'Open mcpUrl (or reload it) in the browser to see the change.'
        : 'Call playground_start, then open mcpUrl.',
      render: render.ok
        ? { ok: true, kind: render.kind, extents: render.extents, stats: render.stats, emptyModel: render.emptyModel }
        : render,
    });
  },
);

// --- get_playground_code ------------------------------------------------
server.registerTool(
  'get_playground_code',
  {
    title: 'Read the current playground code',
    description: `Return the contents of ${'`docs/playground/mcp/current.js`'} (what set_playground_code last wrote).`,
    inputSchema: {},
  },
  async () => {
    const code = await readCode();
    return json({ file: MCP_CODE_FILE, code });
  },
);

// --- playground_start / stop / status ---------------------------------
server.registerTool(
  'playground_start',
  {
    title: 'Start the local playground web server',
    description:
      'Start a static http-server for the Maker.js repo (caching disabled) so the playground is ' +
      'reachable in a browser. Idempotent - returns the existing server if one is already up.',
    inputSchema: {
      port: z.number().int().positive().optional().describe('Port. Default 8020 (or $PLAYGROUND_PORT).'),
    },
  },
  async ({ port }) => json(await startPlayground({ port })),
);

server.registerTool(
  'playground_stop',
  {
    title: 'Stop the local playground web server',
    description: 'Stop the http-server child process started by playground_start.',
    inputSchema: {},
  },
  async () => json(stopPlayground()),
);

server.registerTool(
  'playground_status',
  {
    title: 'Playground web server status',
    description: 'Report whether the playground web server is running, its port, URL, and the mcp script URL.',
    inputSchema: {},
  },
  async () => json(await playgroundStatus()),
);

// --- list_models --------------------------------------------------------
server.registerTool(
  'list_models',
  {
    title: 'List built-in Maker.js models',
    description:
      'List every constructor under makerjs.models.* with its metaParameters and default parameter values - ' +
      'the building blocks available inside IModel code.',
    inputSchema: {},
  },
  async () => json({ version: makerjs.version, count: listModels().length, models: listModels() }),
);

// --- list_examples / get_example -------------------------------------
server.registerTool(
  'list_examples',
  {
    title: 'List bundled playground demo scripts',
    description: 'List the demo IModel scripts in docs/demos/js/ (name + one-line peek) to use as reference or starting points.',
    inputSchema: {},
  },
  async () => json(await listExamples()),
);

server.registerTool(
  'get_example',
  {
    title: 'Get a bundled demo script source',
    description: 'Return the full source of a demo from docs/demos/js/ by name (without .js).',
    inputSchema: { name: z.string().describe('Demo name, e.g. "dogbone-polygon".') },
  },
  async ({ name }) => json(await getExample(name)),
);

// --- makerjs_api -------------------------------------------------------
server.registerTool(
  'makerjs_api',
  {
    title: 'Maker.js API index',
    description:
      'Return a shallow index of the makerjs module: namespaces (paths, model, chain, measure, exporter, layout, ...) ' +
      'with member names and function arity, plus the list of built-in models.',
    inputSchema: {},
  },
  async () => json(makerjsApi()),
);

// --- boot -------------------------------------------------------------
const transport = new StdioServerTransport();
await server.connect(transport);
// stderr is safe for logging on stdio transport
console.error(`[makerjs-playground] MCP server ready. code file: ${MCP_CODE_FILE}`);
