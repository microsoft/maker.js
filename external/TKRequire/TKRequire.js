/**
 * Minimal node.js compatible require() for the browser.
 *
 * For documentation, see Github:
 *   https://github.com/trausti/TKRequire.js
 *
 * Heavily based on StackOverflow answers by Lucio M. Tato and  Ilya Kharlamov in thread:
 * http://stackoverflow.com/questions/6971583/node-style-require-for-in-browser-javascript
 *
 * MIT license.
 */

function require(url) {
  if (url.toLowerCase().substr(-3)!=='.js') {
    url+='.js';  // To allow loading without js suffix.
  }
  if (!require.cache) {
    require.cache=[];  // Init cache.
  }

  if (!require.relativePath) {
    require.relativePath = '';
    //console.log("TKRequire: initializing relativePath");
  }
  var originalPath = require.relativePath;
  if ("http" === url.substr(0, 4)) {
    // If full href is given, extract relative path, if any.
    var baseDir = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    var scriptDir = url.substring(0, url.lastIndexOf('/'));
    if (0 == url.indexOf(baseDir)) {
      require.relativePath = scriptDir.substring(baseDir.length + 1) + '/';
      //console.log("TKRequire: extractiong relative path" + require.relativePath);
    }
  } else if ("./" === url.substr(0, 2)) {
    require.relativePath = require.relativePath + url.substring(2, url.lastIndexOf('/') + 1);
    //console.log("TKRequire: Extending Path : " + require.relativePath);
  }
  var scriptName = url.substring(url.lastIndexOf('/') + 1);
  //console.log("TKRequire: scriptName :" + scriptName);

  var exports = require.cache[url];  // Get from cache.
  if (!exports) {  // Not cached.
    try {
      exports = {};
      var X = new XMLHttpRequest();
      var fullOrRelativePath = "";
      if ("http" === url.substr(0, 4)) {
        fullOrRelativePath = url;
      } else {
        fullOrRelativePath = "./" + require.relativePath + scriptName;
      };
      //console.log("TKRequire: including: " + fullOrRelativePath);
      X.open("GET", fullOrRelativePath, false); // Synchrounous load.
      X.send();
      if (X.status && X.status !== 200) {
        throw new Error(X.statusText);
      }
      var source = X.responseText;
      // Fix (if saved form for Chrome Dev Tools)
      if (source.substr(0, 10)==="(function(") {
        var moduleStart = source.indexOf('{');
        var moduleEnd = source.lastIndexOf('})');
        var CDTcomment = source.indexOf('//@ ');
        if (CDTcomment >- 1 && CDTcomment < moduleStart + 6) {
          moduleStart = source.indexOf('\n', CDTcomment);
        }
        source = source.slice(moduleStart + 1, moduleEnd - 1);
      }
      // Fix, add comment to show source on Chrome Dev Tools
      source = "//@ sourceURL=" + window.location.origin + url + "\n" + source;
      //------
      var module = { id: url, uri: url, exports: exports }; // According to node.js modules
      // Create a Fn with module code, and 3 params: require, exports & module
      var anonFn = new Function("require", "exports", "module", source);
      anonFn(require, exports, module);  // Call the Fn, Execute the module
      require.cache[url] = exports = module.exports;  // Cache obj exported by module.
    } catch (err) {
      throw new Error("Error loading module " + url + ": " + err);
    }
  }
  // Restore the relative path.
  require.relativePath = originalPath;

  return exports; // Require returns object exported by module
}
