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
