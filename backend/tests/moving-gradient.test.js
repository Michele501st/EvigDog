/**
 * @file moving-gradient.test.js
 * @description Unit tests for the Moving Gradient shader module (`frontend/js/moving-gradient.js`),
 * covering happy-path DOM mounting/initialization and fallback edge cases when WebGL2 is unavailable.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', '..', 'frontend', 'js', 'moving-gradient.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

function createMockEnv(webglAvailable = false) {
  const canvases = [];
  const windowObj = {
    devicePixelRatio: 1,
    addEventListener: () => {},
  };
  const documentObj = {
    readyState: 'complete',
    addEventListener: () => {},
    querySelectorAll: () => canvases,
  };
  const context = vm.createContext({
    window: windowObj,
    document: documentObj,
    performance: { now: () => 1000 },
    requestAnimationFrame: () => 1,
    console,
    Math,
    Float32Array,
    Uint32Array,
    Uint16Array,
    Object,
  });

  vm.runInContext(scriptCode, context);
  return { windowObj, canvases };
}

test('MovingGradient exports initMovingGradientCanvas, mountAllMovingGradients and GOLD_PALETTE (Happy Path)', () => {
  const { windowObj } = createMockEnv(false);
  assert.ok(windowObj.EvigMovingGradient, 'EvigMovingGradient should be attached to window');
  assert.equal(typeof windowObj.EvigMovingGradient.initMovingGradientCanvas, 'function');
  assert.equal(typeof windowObj.EvigMovingGradient.mountAllMovingGradients, 'function');
  assert.ok(Array.isArray(windowObj.EvigMovingGradient.GOLD_PALETTE), 'GOLD_PALETTE should be an array');
  assert.equal(windowObj.EvigMovingGradient.GOLD_PALETTE.length, 5, 'GOLD_PALETTE should have 5 stops');
});

test('initMovingGradientCanvas applies CSS linear-gradient fallback when WebGL2 is unavailable and prevents double init (Edge Case)', () => {
  const { windowObj } = createMockEnv(false);
  const mockCanvas = {
    dataset: {},
    style: {},
    getContext: () => null,
  };

  // Edge case 1: null canvas does not throw
  assert.doesNotThrow(() => {
    windowObj.EvigMovingGradient.initMovingGradientCanvas(null);
  });

  // Happy/Edge case 2: WebGL2 unavailable falls back to CSS gradient and sets initialized flag
  windowObj.EvigMovingGradient.initMovingGradientCanvas(mockCanvas);
  assert.equal(mockCanvas.dataset.gradientInitialized, 'true');
  assert.ok(
    mockCanvas.style.background.includes('linear-gradient'),
    'Should set fallback linear-gradient when WebGL2 is unavailable'
  );
});

