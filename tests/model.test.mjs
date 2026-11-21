import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, normalize, derive, configurationHash, configurationFromHash, cutListCsv } from '../model.js';
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, actual + ' != ' + expected);
test('default clear dimensions, quantities and total material lengths', () => {
  const d = derive(DEFAULTS);
  near(d.innerL, 949.2); near(d.innerW, 599.2); near(d.wallH, 399.2);
  assert.equal(d.tubes.reduce((n, p) => n + p.qty, 0), 16);
  assert.equal(d.panels.reduce((n, p) => n + p.qty, 0), 5);
  near(d.tubeLength, 11.7);
  near(d.panels[2].length, 580.2);
});
test('36 inch rails use only the selected end deduction', () => {
  const config = {length: 36 * 2.54, width: 24 * 2.54, height: 20 * 2.54};
  near(derive(config).tubeLength * 1000 / 25.4, 440);
  near(derive({...config, railInset: 25.4}).tubes[0].length / 25.4, 34);
});
test('bare frame and optional floor remove all relevant panel material', () => {
  const empty = derive({ ...DEFAULTS, walls: 'none', floor: false });
  assert.equal(empty.panels.length, 0);
  assert.equal(empty.panelArea, 0); assert.equal(empty.panelMass, 0);
  const floor = derive({ ...DEFAULTS, walls: 'none' });
  near(floor.panelArea, .9492 * .5992);
  assert.equal(floor.panels.length, 1);
});
test('slats fill the opening with exactly 20 mm gaps and positive dimensions at all bounds', () => {
  for (const height of [20, 35, 45, 70]) {
    const d = derive({ ...DEFAULTS, height, walls: 'slats', width: 45, thickness: 18 });
    near(d.slatCount * d.slatHeight + (d.slatCount - 1) * 20, d.wallH);
    assert.equal(d.panels[1].qty, d.slatCount * 2);
    assert.ok(d.panels.every(p => p.width > 0 && p.length > 0));
    assert.ok(d.panelArea < derive({ ...DEFAULTS, height, width: 45, thickness: 18 }).panelArea);
  }
});
test('steel changes frame mass by density ratio without changing geometry or panel mass', () => {
  const aluminium = derive(DEFAULTS), steel = derive({ ...DEFAULTS, frame: 'steel' });
  near(steel.frameMass / aluminium.frameMass, 7850 / 2700);
  near(steel.panelMass, aluminium.panelMass);
  near(steel.tubeLength, aluminium.tubeLength);
});
test('untrusted hash and import inputs are bounded, finite and use known options', () => {
  const clean = normalize({ length: Infinity, width: -30, height: 10000, finish: '<script>', floor: 'false', thickness: null, exploded: true, injected: 'bad' });
  assert.equal(clean.length, DEFAULTS.length); assert.equal(clean.width, 45); assert.equal(clean.height, 70);
  assert.equal(clean.finish, 'natural'); assert.equal(clean.floor, true); assert.equal(clean.exploded, true);
  assert.equal(clean.thickness, 9.5); assert.equal('injected' in clean, false);
  assert.deepEqual(normalize(null), DEFAULTS);
  assert.equal(configurationFromHash('#config=%broken'), null);
});
test('a shared link round-trips the configuration including display options', () => {
  const s = normalize({ ...DEFAULTS, length: 137, walls: 'slats', finish: 'forest', exploded: true });
  assert.deepEqual(configurationFromHash(configurationHash(s)), s);
});
test('CSV has UTF-8 BOM, panel dimensions and model caveat', () => {
  const csv = cutListCsv(DEFAULTS);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"949.2";"599.2";"9.5"'));
  assert.ok(csv.includes('emboîtements'));
  assert.ok(!cutListCsv({ ...DEFAULTS, walls: 'none', floor: false }).includes('"Plancher"'));
});