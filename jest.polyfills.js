/* =========================================================
   TEAQUEST — JEST POLYFILLS
   ---------------------------------------------------------
   Runs BEFORE the test framework and before any test module
   is loaded. jsdom does not provide the WHATWG encoding APIs,
   and `require("jsdom")` fails without them.
   ========================================================= */

const { TextEncoder, TextDecoder } = require("util");

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}

if (typeof global.structuredClone === "undefined") {
  global.structuredClone = (value) =>
    value === undefined ? value : JSON.parse(JSON.stringify(value));
}

/* jsdom's XHR implementation calls setImmediate, which the jsdom
   test environment does not provide. Without it, any request made
   from a jsdom window throws instead of resolving. */
if (typeof global.setImmediate === "undefined") {
  global.setImmediate = (callback, ...args) =>
    setTimeout(callback, 0, ...args);
}

if (typeof global.clearImmediate === "undefined") {
  global.clearImmediate = (handle) => clearTimeout(handle);
}
