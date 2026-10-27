// Headless Maker.js execution engine.
//
// Faithfully replicates how the Maker.js playground runs the code from its
// right-hand "JavaScript code editor" (see docs/playground/js/require-iframe.js):
//
//   var Fn = new Function('require','module','document','console','alert','playgroundRender', code);
//   var result = new Fn(...);           // called with `new`, so `this` is the model instance
//   return module.exports || result;
//
// then (docs/playground/js/playground.js -> processResult):
//   - typeof result === 'function'  -> it is a "kit" (constructor); construct with metaParameters
//   - makerjs.isModel(result)       -> use directly as an IModel
//
// This module adds measurement, chain analysis, multi-format export and
// structured error reporting (with line/column) on top of that.

import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const makerjs = require('makerjs');

export { makerjs };

const USER_FILENAME = 'playground-imodel.js';

// Modules the sandboxed code is allowed to require. 'makerjs' is the only one
// the playground itself guarantees; a few common companions are whitelisted.
const REQUIRE_WHITELIST = new Set(['makerjs', './../target/js/node.maker.js']);

function makeSandboxRequire(extraModules = {}) {
  return function sandboxRequire(id) {
    if (id === 'makerjs' || id === './../target/js/node.maker.js') return makerjs;
    if (id in extraModules) return extraModules[id];
    if (id in makerjs.models) return makerjs.models[id];
    throw new Error(
      `require('${id}') is not available in the playground sandbox. ` +
      `Allowed: 'makerjs'${Object.keys(extraModules).length ? ", " + Object.keys(extraModules).map(m => `'${m}'`).join(', ') : ''}.`
    );
  };
}

// Parse "at ... playground-imodel.js:LINE:COL" out of an error stack.
function locateInStack(stack) {
  if (!stack) return {};
  const fn = USER_FILENAME.replace(/\./g, '\\.');
  // runtime frame:  "... playground-imodel.js:LINE:COL"
  const withCol = new RegExp(`${fn}:(\\d+):(\\d+)`).exec(stack);
  if (withCol) return { line: Number(withCol[1]), column: Number(withCol[2]) };
  // syntax-error header:  "playground-imodel.js:LINE"
  const lineOnly = new RegExp(`${fn}:(\\d+)(?!\\d)`).exec(stack);
  if (lineOnly) return { line: Number(lineOnly[1]), column: null };
  return {};
}

function errPayload(err, phase) {
  const stack = err && err.stack ? String(err.stack) : '';
  const loc = locateInStack(stack);
  return {
    ok: false,
    phase,                                   // 'compile' | 'run' | 'resolve' | 'measure' | 'export'
    error: {
      name: (err && err.name) || 'Error',
      message: (err && err.message) || String(err),
      line: loc.line ?? null,
      column: loc.column ?? null,
      stack: stack.split('\n').slice(0, 8).join('\n'),
    },
  };
}

function summarizeModel(model) {
  let pathCount = 0;
  let modelCount = 0;
  makerjs.model.walk(model, {
    onPath: () => { pathCount++; },
    beforeChildWalk: () => { modelCount++; return true; },
  });
  let chainCount = 0;
  try {
    const chains = makerjs.model.findChains(model);
    chainCount = Array.isArray(chains) ? chains.length : 0;
  } catch { /* chain analysis is best-effort */ }
  return { pathCount, modelCount, chainCount };
}

/**
 * Execute playground IModel JavaScript headlessly.
 *
 * @param {string} code            The editor contents.
 * @param {object} [opts]
 * @param {any[]}  [opts.params]    Kit parameter values (when the code exports a constructor).
 * @param {string[]} [opts.exports] Any of: 'svg','dxf','json','pathdata','openjscad','stl'. Defaults to ['svg'].
 * @param {object} [opts.svgOptions] Passed through to makerjs.exporter.toSVG.
 * @param {object} [opts.extraModules] Extra module id -> object map for require().
 * @returns {object} structured result
 */
export function renderModel(code, opts = {}) {
  const wantExports = (opts.exports && opts.exports.length ? opts.exports : ['svg']).map(s => s.toLowerCase());
  const logs = [];
  const mockConsole = {
    log: (...a) => logs.push(a.map(fmt).join(' ')),
    warn: (...a) => logs.push('WARN: ' + a.map(fmt).join(' ')),
    error: (...a) => logs.push('ERROR: ' + a.map(fmt).join(' ')),
    info: (...a) => logs.push(a.map(fmt).join(' ')),
  };
  const moduleObj = { exports: null };
  const mockDocument = { write: () => {} };

  // ---- compile -----------------------------------------------------------
  let fn;
  try {
    fn = vm.compileFunction(
      String(code),
      ['require', 'module', 'document', 'console', 'alert', 'playgroundRender'],
      { filename: USER_FILENAME },
    );
  } catch (err) {
    return errPayload(err, 'compile');
  }

  // ---- run -------------------------------------------------------------
  let result;
  try {
    const instance = Reflect.construct(fn, [
      makeSandboxRequire(opts.extraModules || {}),
      moduleObj,
      mockDocument,
      mockConsole,
      () => {},
      () => {},
    ]);
    result = moduleObj.exports || instance;
  } catch (err) {
    return { ...errPayload(err, 'run'), console: logs };
  }

  // ---- resolve model (kit vs IModel) --------------------------------
  let model;
  let kind;
  let usedParams = null;
  let metaParameters = null;
  try {
    if (typeof result === 'function') {
      kind = 'kit';
      metaParameters = result.metaParameters || null;
      usedParams = Array.isArray(opts.params) && opts.params.length
        ? opts.params
        : makerjs.kit.getParameterValues(result);
      model = makerjs.kit.construct(result, usedParams);
    } else if (makerjs.isModel(result)) {
      kind = 'model';
      model = result;
    } else {
      return {
        ok: false,
        phase: 'resolve',
        error: {
          name: 'NotAModel',
          message:
            'Code did not produce a Maker.js model. Assign this.paths / this.models / this.notes, ' +
            'or set module.exports to a model object or a constructor function.',
          line: null, column: null, stack: '',
        },
        console: logs,
        resultType: typeof result,
      };
    }
  } catch (err) {
    return { ...errPayload(err, 'resolve'), console: logs };
  }

  // ---- measure ------------------------------------------------------
  let extents = null;
  try {
    const e = makerjs.measure.modelExtents(model);
    if (e) {
      extents = {
        low: e.low, high: e.high,
        width: e.high[0] - e.low[0],
        height: e.high[1] - e.low[1],
        center: e.center,
// eslint-disable-next-line
      };
    }
  } catch (err) {
    return { ...errPayload(err, 'measure'), console: logs };
  }

  const stats = summarizeModel(model);
  const emptyModel = !extents || (stats.pathCount === 0);

  // ---- export -----------------------------------------------------
  const outputs = {};
  try {
    for (const fmt of wantExports) {
      switch (fmt) {
        case 'svg':
          outputs.svg = makerjs.exporter.toSVG(model, opts.svgOptions || {});
          break;
        case 'dxf':
          outputs.dxf = makerjs.exporter.toDXF(model);
          break;
        case 'json':
          outputs.json = makerjs.exporter.toJson(model);
          break;
        case 'pathdata':
          outputs.pathdata = makerjs.exporter.toSVGPathData(model);
          break;
        case 'openjscad':
          outputs.openjscad = makerjs.exporter.toJscadScript(model);
          break;
        case 'stl':
          outputs.stl = makerjs.exporter.toJscadSTL
            ? makerjs.exporter.toJscadSTL(makerjs.exporter.toJscadCSG(model))
            : undefined;
          break;
        default:
          // ignore unknown format
          break;
      }
    }
  } catch (err) {
    return { ...errPayload(err, 'export'), console: logs, kind };
  }

  return {
    ok: true,
    kind,                       // 'model' | 'kit'
    metaParameters,             // kit meta params, if any
    usedParams,                 // params actually used to construct a kit
    extents,                    // { low, high, width, height, center }
    stats,                      // { pathCount, modelCount, chainCount }
    emptyModel,                 // true if it rendered but has no measurable geometry
    console: logs,              // captured console.* output, as strings
    outputs,                    // { svg, dxf, json, pathdata, openjscad, ... }
  };
}

function fmt(v) {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
}

// List built-in makerjs.models.* with their metaParameters (agent API reference).
export function listModels() {
  const out = [];
  for (const name of Object.keys(makerjs.models).sort()) {
    const ctor = makerjs.models[name];
    out.push({
      name,
      metaParameters: ctor.metaParameters || null,
      defaultParams: (() => { try { return makerjs.kit.getParameterValues(ctor); } catch { return null; } })(),
    });
  }
  return out;
}

// Shallow signature index of the makerjs module (namespaces + members).
export function makerjsApi() {
  const NS = ['angle', 'point', 'path', 'paths', 'model', 'measure', 'exporter',
    'importer', 'solvers', 'chain', 'kit', 'layout', 'units'];
  const api = { version: makerjs.version, namespaces: {} };
  for (const ns of NS) {
    const obj = makerjs[ns];
    if (!obj) continue;
    api.namespaces[ns] = Object.keys(obj)
      .filter(k => typeof obj[k] === 'function' || typeof obj[k] === 'object')
      .map(k => {
        const member = obj[k];
        if (typeof member === 'function') {
          const arity = member.length;
          return { name: k, kind: 'function', arity };
        }
        return { name: k, kind: 'object' };
      });
  }
  api.models = Object.keys(makerjs.models).sort();
  return api;
}
