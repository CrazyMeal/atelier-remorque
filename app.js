import { LIMITS, MM_PER_INCH, DEFAULTS, normalize, derive, configurationFromHash, configurationHash, cutListCsv } from './model.js';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const STORAGE = 'atelier-remorque:configuration:v1';
const names = { natural: 'Bois naturel', forest: 'Vert forêt', sand: 'Sable', charcoal: 'Anthracite' };
const presets = {
  compact: { length: 80, width: 55, height: 35, name: 'La compacte.' },
  everyday: { length: 100, width: 65, height: 45, name: 'La polyvalente.' },
  long: { length: 130, width: 70, height: 45, name: 'La grande voyageuse.' }
};
const fmt = (value, max = 1) => value.toLocaleString('fr-CA', { maximumFractionDigits: max });
let state = { ...DEFAULTS }, view, toastTimer;
try { state = normalize(JSON.parse(localStorage.getItem(STORAGE))); } catch { /* Defaults remain usable without storage. */ }
state = configurationFromHash(location.hash) ?? state;
const units = $('#units');
try { if (localStorage.getItem('atelier-remorque:units') === 'imperial') units.value = 'imperial'; } catch {}
const imperial = () => units.value === 'imperial';
const displayCm = cm => imperial() ? cm * 10 / MM_PER_INCH : cm;
const dimensionUnit = () => imperial() ? 'po' : 'cm';
const dimensionLabel = cm => fmt(displayCm(cm), 3) + ' ' + dimensionUnit();
const cutSize = mm => imperial() ? fmt(mm / MM_PER_INCH, 3) : fmt(mm);
function toast(message) {
  $('#toast').textContent = message; $('#toast').classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3300);
}
function persist() {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(state));
    $('#save-status').innerHTML = '<span class="status-dot"></span> Sauvegardé sur cet appareil';
  } catch { $('#save-status').textContent = 'Sauvegarde locale indisponible · utilisez l’export'; }
}
function download(blob, name) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function sync() {
  for (const key of ['length', 'width', 'height']) {
    const input = $('#' + key);
    const [min, max] = LIMITS[key].map(displayCm);
    input.step = 'any';
    input.min = min.toFixed(3);
    input.max = max.toFixed(3);
    if (document.activeElement !== input) input.value = Number(displayCm(state[key]).toFixed(3));
    input.nextElementSibling.textContent = dimensionUnit();
    const limits = input.closest('.range-field').querySelector('.range-limits');
    limits.firstElementChild.textContent = dimensionLabel(LIMITS[key][0]);
    limits.lastElementChild.textContent = dimensionLabel(LIMITS[key][1]);
    const range = $('[data-range="' + key + '"]');
    range.min = input.min;
    range.max = input.max;
    range.step = 'any';
    range.value = displayCm(state[key]);
    range.setAttribute('aria-valuetext', dimensionLabel(state[key]));
    range.style.setProperty('--fill', ((displayCm(state[key]) - min) / (max - min) * 100) + '%');
  }
  for (const key of ['frame', 'thickness', 'tubeWall']) {
    const select = $('#' + key);
    if (![...select.options].some(o => o.value === String(state[key]))) select.add(new Option(fmt(state[key]) + ' mm', String(state[key])));
    if (key !== 'frame') for (const option of select.options) {
      option.textContent = cutSize(Number(option.value)) + (imperial() ? ' po' : ' mm');
    }
    select.value = String(state[key]);
  }
  $('label[for="frame"]').textContent = 'Tubes carrés · ' + (imperial() ? '1 po' : '25,4 mm');
  $('#cut-heading').textContent = 'Cotes nominales · ' + (imperial() ? 'po' : 'mm');
  $('#floor').checked = state.floor;
  for (const key of ['walls', 'finish']) for (const button of $$('[data-' + key + ']')) {
    const selected = button.dataset[key] === state[key];
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected));
  }
  for (const key of ['dimensions', 'exploded']) $('#' + key).setAttribute('aria-pressed', String(state[key]));
  $('#dimensions').disabled = state.exploded;
  $('#dimensions').title = state.exploded ? 'Les cotes sont masquées en vue éclatée.' : 'Afficher les dimensions extérieures';
  $('#finish-label').textContent = names[state.finish];
  let modelName = 'Votre création.';
  for (const button of $$('[data-preset]')) {
    const preset = presets[button.dataset.preset];
    const selected = ['length', 'width', 'height'].every(k => state[k] === preset[k]);
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected));
    if (selected) modelName = preset.name;
  }
  $('#model-name').textContent = modelName;
  const d = derive(state);
  $('#size-stat').innerHTML = [state.length, state.width, state.height].map(v => fmt(displayCm(v), 3)).join(' × ') + ' <small>' + dimensionUnit() + '</small>';
  $('#tube-stat').innerHTML = fmt(imperial() ? d.tubeLength / 0.3048 : d.tubeLength, 2) + (imperial() ? ' <small>pi linéaires</small>' : ' <small>m linéaires</small>');
  $('#panel-stat').innerHTML = fmt(imperial() ? d.panelArea / 0.3048 ** 2 : d.panelArea, 2) + (imperial() ? ' <small>pi²</small>' : ' <small>m²</small>');
  $('#mass-stat').innerHTML = '≈ ' + fmt(d.materialMass) + ' <small>kg · hors kit</small>';
  const rows = [...d.tubes, ...d.panels];
  const body = $('#parts-body'); body.replaceChildren();
  for (const part of rows) {
    const row = document.createElement('tr');
    const size = part.width ? cutSize(part.length) + ' × ' + cutSize(part.width) + ' × ' + cutSize(part.thickness) : cutSize(part.length);
    for (const value of [part.label, part.qty, size]) {
      const cell = document.createElement('td'); cell.textContent = String(value); row.append(cell);
    }
    body.append(row);
  }
  $('#parts-count').textContent = rows.reduce((n, p) => n + p.qty, 0) + ' pièces';
  persist();
  view?.update(state, dimensionLabel);
}
function change(patch, fit = false) {
  state = normalize({ ...state, ...patch });
  sync();
  if (location.hash.startsWith('#config=')) history.replaceState(null, '', configurationHash(state));
  if (fit) view?.fit();
}
units.addEventListener('change', () => {
  try { localStorage.setItem('atelier-remorque:units', units.value); } catch {}
  sync();
});
const toCm = n => imperial() ? n * MM_PER_INCH / 10 : n;
for (const input of $$('[data-range]')) input.addEventListener('input', () => {
  const value = Number(input.value);
  const step = imperial() ? 0.125 : 1;
  const snapped = value === Number(input.min) || value === Number(input.max) ? value : Math.round(value / step) * step;
  change({ [input.dataset.range]: toCm(snapped) });
});
for (const input of $$('[data-number]')) input.addEventListener('input', () => {
  if (input.validity.valid && Number.isFinite(input.valueAsNumber)) change({ [input.dataset.number]: toCm(input.valueAsNumber) });
});
for (const input of $$('[data-number]')) input.addEventListener('change', () => {
  const number = input.valueAsNumber;
  if (Number.isFinite(number)) change({ [input.dataset.number]: toCm(number) });
  input.value = Number(displayCm(state[input.dataset.number]).toFixed(3));
});
for (const key of ['frame', 'thickness', 'tubeWall']) $('#' + key).addEventListener('change', event => change({ [key]: key === 'frame' ? event.target.value : Number(event.target.value) }));
$('#floor').addEventListener('change', event => change({ floor: event.target.checked }));
for (const key of ['walls', 'finish']) for (const button of $$('[data-' + key + ']')) button.addEventListener('click', () => change({ [key]: button.dataset[key] }));
for (const key of ['dimensions', 'exploded']) $('#' + key).addEventListener('click', () => change({ [key]: !state[key] }, key === 'exploded'));
for (const button of $$('[data-preset]')) button.addEventListener('click', () => {
  const p = presets[button.dataset.preset]; change({ length: p.length, width: p.width, height: p.height }, true);
});
for (const button of $$('[data-view]')) button.addEventListener('click', () => {
  view?.fit(button.dataset.view);
  for (const other of $$('[data-view]')) {
    other.classList.toggle('selected', other === button); other.setAttribute('aria-pressed', String(other === button));
  }
});
$('#reset').addEventListener('click', () => {
  history.replaceState(null, '', location.pathname + location.search);
  state = { ...DEFAULTS }; sync(); view?.fit('perspective');
  for (const b of $$('[data-view]')) { b.classList.toggle('selected', b.dataset.view === 'perspective'); b.setAttribute('aria-pressed', String(b.dataset.view === 'perspective')); }
  toast('Le modèle de départ est restauré.');
});
$('#export').addEventListener('click', () => {
  download(new Blob([cutListCsv(state, imperial())], { type: 'text/csv;charset=utf-8' }), 'remorque-liste-pieces.csv');
  toast('Liste de pièces exportée.');
});
$('#download-json').addEventListener('click', () => {
  download(new Blob([JSON.stringify({ version: 1, configuration: state }, null, 2)], { type: 'application/json' }), 'remorque-projet.json');
});
$('#import-json').addEventListener('click', () => $('#project-file').click());
$('#project-file').addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    if (file.size > 100000) throw new Error('Fichier trop volumineux');
    const data = JSON.parse(await file.text());
    if (data.version !== 1 || !data.configuration || typeof data.configuration !== 'object' || Array.isArray(data.configuration)) throw new Error('Format inconnu');
    change(normalize(data.configuration), true); toast('Projet chargé.');
  } catch { toast('Impossible de lire ce projet. Choisissez un fichier JSON exporté par l’atelier.'); }
  event.target.value = '';
});
$('#share').addEventListener('click', async () => {
  const url = new URL(location.href); url.hash = configurationHash(state);
  history.replaceState(null, '', url);
  try {
    await navigator.clipboard.writeText(url.href);
    toast(location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'Lien copié · cet aperçu reste local à votre ordinateur.' : 'Lien de configuration copié.');
  } catch {
    $('#share-url').value = url.href; $('#share-dialog').showModal(); $('#share-url').select();
  }
});
$('#snapshot').addEventListener('click', async () => {
  if (!view) { toast('La vue 3D n’est pas disponible.'); return; }
  try { download(await view.snapshot(), 'remorque-apercu.png'); } catch { toast('Impossible de créer l’image.'); }
});
window.addEventListener('hashchange', () => {
  const config = configurationFromHash(location.hash);
  if (config) { state = config; sync(); view?.fit(); }
});
sync();
try {
  const { createScene } = await import('./scene.js');
  view = createScene($('#canvas-host'), $('#dimension-labels'));
  view.update(state, dimensionLabel); view.fit();
  $('#scene-loading').hidden = true;
  for (const button of $$('[data-view], #snapshot')) button.disabled = false;
} catch (error) {
  console.error('La vue 3D est indisponible.', error); $('#scene-loading').hidden = true;
  $('#render-error').hidden = false;
  $('#snapshot').disabled = true;
}