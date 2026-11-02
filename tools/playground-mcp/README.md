# makerjs-playground MCP server

An [MCP](https://modelcontextprotocol.io) server that gives an AI agent (e.g. Claude Code)
a fast **edit → render → inspect → fix** loop for **Maker.js "IModel" JavaScript** — the
code in the right-hand editor of the [Maker.js playground](https://maker.js.org/playground/).

## Why

Iterating on playground code normally means: type code in a browser, click *Run*, eyeball
the SVG, guess what broke. This server lets the agent do the same loop headlessly and
deterministically (real `makerjs` in Node, structured errors with line/column), then push
a finished drawing into the live browser playground for a human to look at.

## Install

```sh
cd tools/playground-mcp
npm install
npm run selftest      # 27 checks, exits 0 on success
```

## Register with Claude Code

`.mcp.json` (already in the repo root and in the parent working dir):

```json
{
  "mcpServers": {
    "makerjs-playground": {
      "command": "node",
      "args": ["tools/playground-mcp/server.mjs"],
      "env": { "PLAYGROUND_PORT": "8020" }
    }
  }
}
```

Then in Claude Code: `/mcp` to confirm `makerjs-playground` is connected.

## Tools

| Tool | What it does |
|---|---|
| `render_model` | Run IModel JS headlessly. Returns `{ok, kind, extents, stats:{pathCount,modelCount,chainCount}, console, outputs:{svg,…}}` or `{ok:false, phase, error:{name,message,line,column,stack}}`. Params: `code`, `params?`, `exports?` (`svg dxf json pathdata openjscad stl`), `svgOptions?`. **The inner dev loop — no browser involved.** |
| `set_playground_code` | Validate via render, then write to `docs/demos/js/mcp/current.js`. Returns `mcpUrl`. Refuses broken code unless `force:true`. |
| `get_playground_code` | Read that file back. |
| `playground_start` / `playground_stop` / `playground_status` | Manage a static `http-server` (`-c-1`, no cache) for the repo. |
| `list_models` | Every `makerjs.models.*` constructor + its `metaParameters` + defaults. |
| `list_examples` / `get_example` | Browse / fetch `docs/demos/js/*.js` as reference. |
| `makerjs_api` | Shallow index of the `makerjs` module (namespaces, member names, arity). |

## Browser sync

`set_playground_code` writes `docs/demos/js/mcp/current.js`. Open

```
http://localhost:8020/docs/playground/?script=mcp/current
```

The playground fetches that file into the editor and runs it. Reload the page after each
`set_playground_code` to see the update (the server sends `Cache-Control` off, so a plain
reload is enough).

## IModel code shape

```js
var makerjs = require('makerjs');

// (a) constructor style — `this` is the model
this.paths  = { c: new makerjs.paths.Circle([0,0], 25) };
this.models = { r: new makerjs.models.Rectangle(50, 20) };
this.notes  = '# markdown notes';
```

or

```js
var makerjs = require('makerjs');
function widget(w, h) { this.paths = makerjs.model.originate({ /* … */ }); }
widget.metaParameters = [
  { title: 'width',  type: 'range', min: 10, max: 100, value: 50 },
  { title: 'height', type: 'range', min: 10, max: 100, value: 20 }
];
module.exports = widget;      // a "kit" — render_model constructs it from metaParameters (or your `params`)
```

`require()` only resolves `'makerjs'` (and built-in model names).

## Layout

```
tools/playground-mcp/
  server.mjs              MCP server (stdio), 10 tools
  lib/render.mjs          headless Maker.js execution + measure + export + error locating
  lib/playgroundServer.mjs http-server child-process control
  lib/state.mjs           shared code file + demo browsing
  test/selftest.mjs       27-check automated verification
docs/demos/js/mcp/current.js   the code the browser playground loads via ?script=mcp/current
```
