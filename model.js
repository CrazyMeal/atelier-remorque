export const DEFAULTS = Object.freeze({
  length: 100, width: 65, height: 45, thickness: 9.5,
  walls: 'solid', floor: true, frame: 'aluminium', finish: 'natural',
  railInset: 0, crossInset: 0, postInset: 0, tubeWall: 1.6, dimensions: true, exploded: false
});
export const TUBE = 25.4;
export const LIMITS = { length: [60, 160], width: [45, 100], height: [20, 70], thickness: [6, 18], railInset: [0, 299], crossInset: [0, 224], postInset: [0, 99], tubeWall: [1, 3] };
const choices = { walls: ['solid', 'slats', 'none'], frame: ['aluminium', 'steel'], finish: ['natural', 'forest', 'sand', 'charcoal'] };
export function normalize(input = {}) {
  const result = { ...DEFAULTS };
  if (!input || typeof input !== 'object') return result;
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    const value = input[key];
    if (typeof value === 'number' && Number.isFinite(value)) result[key] = Math.max(min, Math.min(max, value));
  }
  for (const [key, values] of Object.entries(choices)) if (values.includes(input[key])) result[key] = input[key];
  for (const key of ['floor', 'dimensions', 'exploded']) if (typeof input[key] === 'boolean') result[key] = input[key];
  return result;
}
export function derive(input) {
  const s = normalize(input);
  const L = s.length * 10, W = s.width * 10, H = s.height * 10;
  const innerL = L - 2 * TUBE, innerW = W - 2 * TUBE;
  const wallH = H - 2 * TUBE;
  const tubes = [
    { label: 'Longerons · deux niveaux bas + haut', qty: 6, length: L - 2 * s.railInset },
    { label: 'Traverses · deux niveaux bas + haut', qty: 6, length: W - 2 * s.crossInset },
    { label: 'Montants', qty: 4, length: H - 2 * s.postInset }
  ];
  const panels = [];
  if (s.floor) panels.push({ label: 'Plancher', qty: 1, length: innerL, width: innerW, thickness: s.thickness });
  if (s.walls === 'solid') {
    panels.push({ label: 'Parois latérales', qty: 2, length: innerL, width: wallH, thickness: s.thickness });
    panels.push({ label: 'Parois avant / arrière', qty: 2, length: innerW - 2 * s.thickness, width: wallH, thickness: s.thickness });
  }
  const slatCount = Math.max(2, Math.floor((wallH + 20) / 100));
  const slatHeight = (wallH - (slatCount - 1) * 20) / slatCount;
  if (s.walls === 'slats') {
    panels.push({ label: 'Lattes latérales', qty: 2 * slatCount, length: innerL, width: slatHeight, thickness: s.thickness });
    panels.push({ label: 'Lattes avant / arrière', qty: 2 * slatCount, length: innerW - 2 * s.thickness, width: slatHeight, thickness: s.thickness });
  }
  const tubeLength = tubes.reduce((sum, p) => sum + p.qty * p.length, 0) / 1000;
  const panelArea = panels.reduce((sum, p) => sum + p.qty * p.length * p.width, 0) / 1e6;
  const section = (TUBE ** 2 - (TUBE - 2 * s.tubeWall) ** 2) / 1e6;
  const frameMass = tubeLength * section * (s.frame === 'steel' ? 7850 : 2700);
  const panelMass = panelArea * s.thickness / 1000 * 600;
  return { L, W, H, innerL, innerW, wallH, tubes, panels, slatCount, slatHeight,
    tubeLength, panelArea, frameMass, panelMass, materialMass: frameMass + panelMass };
}
export function configurationFromHash(hash) {
  if (!hash.startsWith('#config=')) return null;
  try { return normalize(JSON.parse(decodeURIComponent(hash.slice(8)))); } catch { return null; }
}
export function configurationHash(state) { return '#config=' + encodeURIComponent(JSON.stringify(normalize(state))); }
export const MM_PER_INCH = 25.4;
export function cutListCsv(state, imperial = false) {
  const s = normalize(state), d = derive(s);
  const unit = imperial ? 'po' : 'mm';
  const size = mm => imperial ? (mm / MM_PER_INCH).toFixed(3) : mm.toFixed(1);
  const section = imperial ? '1 po' : '25,4 mm';
  const rows = [
    ['Atelier Remorque — nomenclature indicative'],
    ['Cotes nominales du modèle. Retraits et emboîtements des raccords à mesurer avant découpe.'],
    ['Pièce', 'Quantité', 'Longueur (' + unit + ')', 'Largeur (' + unit + ')', 'Épaisseur (' + unit + ')', 'Matériau'],
    ...d.tubes.map(p => [p.label, p.qty, size(p.length), size(TUBE), size(s.tubeWall), (s.frame === 'steel' ? 'Acier' : 'Aluminium') + ' — tube carré ' + section]),
    ...d.panels.map(p => [p.label, p.qty, size(p.length), size(p.width), size(p.thickness), 'Contreplaqué']),
    ['Kit Wike et visserie non inclus dans la masse estimée']
  ];
  return '\uFEFF' + rows.map(row => row.map(v => '"' + String(v).replaceAll('"', '""') + '"').join(';')).join('\r\n');
}