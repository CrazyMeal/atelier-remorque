import { planStock, suggestOrder } from './stock.js';
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
const stockUnit = $('#stock-unit');
let previousFactor = Number(stockUnit.value);
function addStock(length = '') {
  const row = $('#stock-row').content.firstElementChild.cloneNode(true);
  row.children[0].value = length;
  row.querySelector('button').onclick = () => {
    row.remove();
    if (!$('#stock-rows').children.length) addStock();
    renderOrder(derive(state).tubes);
  };
  $('#stock-rows').append(row);
  return row.children[0];
}
addStock();
$('#add-stock').onclick = () => addStock().focus();
function stockRows() {
  return $$('#stock-rows .stock-row').filter(row => row.children[0].value || row.children[0].validity.badInput).map(row => {
    const [length, qty] = row.querySelectorAll('input');
    if (!(length.valueAsNumber > 0) || !qty.validity.valid || !qty.value) throw Error();
    return {length: length.valueAsNumber, qty: qty.valueAsNumber};
  });
}
function renderSuggestion(tubes, plan, kerf) {
  const remaining = tubes.map((t,i) => ({length:t.length/MM_PER_INCH, qty:t.qty-plan.counts[i]}));
  const output = $('#suggest-result');
  const stockGroups = new Map();
  for (const bar of plan.bars) stockGroups.set(bar.length,(stockGroups.get(bar.length)||0)+1);
  output.innerHTML = Array.from(stockGroups, ([mm,qty]) => '<div class="stock-bar"><strong>'+qty+' × '+fmt(mm/MM_PER_INCH,3)+' po</strong><small>Chute fournisseur</small></div>').join('');
  if (!remaining.some(t => t.qty)) { output.insertAdjacentText('beforeend','Toutes les pièces sont couvertes.'); return; }
  const price = $('#base-price').valueAsNumber;
  const price12 = $('#price-12').valueAsNumber;
  if (!(price >= price12 && price12 > 0 && price <= 3*price12)) { output.insertAdjacentText('beforeend','Vérifiez les prix de référence (tarif croissant avec un prix par pouce constant ou dégressif).'); return; }
  const result = suggestOrder(remaining, price, kerf/MM_PER_INCH, $('#trim-custom').checked, price12);
  if (!result) { output.insertAdjacentText('beforeend','Certaines coupes dépassent la longueur disponible.'); return; }
  const money = cents => (cents/100).toLocaleString('fr-CA',{style:'currency',currency:'CAD'});
  const lengths = new Set(result.lots.map(lot => lot.length));
  for (const length of lengths) {
    const lots = result.lots.filter(lot => lot.length === length);
    const qty = lots.reduce((sum,l) => sum+l.qty,0);
    const {unit,discount} = lots[0];
    const layouts = lots.map(lot => {
      const cuts = lot.cuts.flatMap((n,i) => n ? [n+' × '+fmt(remaining[i].length,3)+' po'] : []);
      return '<div>'+lot.qty+' barre(s) → '+cuts.join(' + ')+'</div>';
    });
    output.insertAdjacentHTML('beforeend','<div class="stock-bar"><strong>'+qty+' × '+fmt(length,3)+' po</strong><small>Sur mesure · '+money(qty*unit)+'</small>'+layouts.join('')+'Rabais du lot · '+discount+' %</div>');
  }
  output.insertAdjacentHTML('beforeend','<p class="stock-total">Sur mesure estimé · '+money(result.cost)+' (hors chutes)</p>');
}
function renderOrder(tubes) {
  const output = $('#stock-result');
  const factor = Number(stockUnit.value);
  const size = mm => fmt(mm / factor, 3) + (factor === 1 ? ' mm' : ' po');
  try {
    const rows = stockRows();
    $('#sample-stock').hidden = !!rows.length;
    $('#suggest-result').replaceChildren();
    const kerf = $('#kerf').valueAsNumber * factor, margin = $('#allowance').valueAsNumber * factor;
    if (![kerf, margin].every(n => Number.isFinite(n) && n >= 0)) throw Error();
    const qty = tubes.reduce((s,t) => s + t.qty, 0);
    const stock = rows.flatMap(r => Array(Math.min(qty,r.qty)).fill(r.length * factor));
    const plan = planStock(tubes, stock, kerf, margin);
    renderSuggestion(tubes, plan, kerf);
    if (!rows.length) { output.textContent = 'Ajoutez vos chutes pour réduire la commande sur mesure.'; return; }
    const cards = plan.bars.map(bar => {
      const segments = [], cuts = [];
      bar.cuts.forEach((n,i) => {
        if (!n) return;
        cuts.push(n + ' × ' + size(tubes[i].length));
        for (let j = 0; j < n; j++) segments.push('<i style="width:' + (100*tubes[i].length/bar.length) + '%"></i>');
      });
      return '<div class="stock-bar"><strong>' + size(bar.length) + '</strong><small>Reste ' + size(bar.rest) + '</small><div class="cut-strip" aria-hidden="true">' + segments.join('') + '</div>' + cuts.join('　+　') + '</div>';
    });
    const missing = tubes.flatMap((t,i) => t.qty > plan.counts[i] ? [(t.qty-plan.counts[i]) + ' × ' + size(t.length)] : []);
    output.innerHTML = '<p class="stock-total">' + plan.bars.length + (plan.bars.length === 1 ? ' barre' : ' barres') + ' · ' + size(plan.ordered) + '</p>' + cards.join('') +
      '<p class="stock-status">' + (missing.length ? 'Encore à couvrir · ' + missing.join(' / ') : '✓ Toutes les coupes sont couvertes') + '</p>';
  } catch { $('#suggest-result').replaceChildren(); output.textContent = 'Vérifiez les longueurs, les quantités (1 à 1000), le trait de scie et la marge.'; }
}
$('#sample-stock').addEventListener('click', () => {
  stockUnit.value = '25.4'; previousFactor = 25.4;
  $('#stock-rows').replaceChildren();
  [10.75,11.875,39.75,47.875].forEach(addStock);
  $('#kerf').value = 0.125; $('#allowance').value = 0.5;
  renderOrder(derive(state).tubes);
});
stockUnit.addEventListener('change', () => {
  const ratio = previousFactor / Number(stockUnit.value);
  const convert = n => Number((n * ratio).toFixed(9));
  try {
    stockRows();
    for (const input of $$('#stock-rows input:first-child')) if (input.value) input.value = convert(input.valueAsNumber);
  } catch { stockUnit.value = String(previousFactor); return; }
  for (const id of ['#kerf','#allowance']) if ($(id).value) $(id).value = convert($(id).valueAsNumber);
  previousFactor = Number(stockUnit.value);
  renderOrder(derive(state).tubes);
});
for (const id of ['#stock-rows','#kerf','#allowance','#base-price','#price-12','#trim-custom']) $(id).addEventListener('input', () => renderOrder(derive(state).tubes));
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
for (const input of $$('[data-inset]')) input.addEventListener('change', () => {
  if (Number.isFinite(input.valueAsNumber)) change({ [input.dataset.inset]: input.valueAsNumber * (imperial() ? MM_PER_INCH : 1) });
  else sync();
});
function sync() {
  for (const input of $$('[data-inset]')) {
    const key = input.dataset.inset;
    const factor = imperial() ? MM_PER_INCH : 1;
    input.value = Number((state[key] / factor).toFixed(4));
    input.max = LIMITS[key][1] / factor;
    input.nextElementSibling.textContent = imperial() ? 'po' : 'mm';
  }
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
      option.textContent = (imperial() ? cutSize(Number(option.value)) : fmt(Number(option.value), 3)) + (imperial() ? ' po' : ' mm');
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
  renderOrder(d.tubes);
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