// All lengths are millimetres. Each state represents the quantities already covered.
export function planStock(tubes, stock, kerf, tolerance) {
  let plans = new Map();
  const start = { counts: tubes.map(() => 0), covered: 0, ordered: 0, bars: [] };
  plans.set(start.counts.join(','), start);
  for (const length of stock) {
    const usable = length - tolerance;
    const next = new Map(plans);
    for (const plan of plans.values()) {
      function pack(i, used, cuts) {
        if (i < tubes.length) {
          const tube = tubes[i];
          for (let n = 0; n <= tube.qty - plan.counts[i]; n++) {
            const needed = used + n * (tube.length + kerf);
            if (needed - kerf > usable + 1e-7) break;
            pack(i + 1, needed, [...cuts, n]);
          }
          return;
        }
        if (!used) return;
        // A measured, exact final piece can use the original end of the bar.
        const exact = !tolerance && Math.abs(used - kerf - usable) < 1e-7;
        if (!exact && used > usable + 1e-7) return;
        const counts = cuts.map((n, j) => plan.counts[j] + n);
        const key = counts.join(',');
        const ordered = plan.ordered + length;
        if ((next.get(key)?.ordered ?? Infinity) <= ordered) return;
        next.set(key, { counts, ordered, covered: counts.reduce((s,n,j) => s + n*tubes[j].length, 0),
          bars: [...plan.bars, { length, cuts, rest: exact ? 0 : Math.max(0, usable - used) }] });
      }
      pack(0, 0, []);
    }
    plans = next;
  }
  return [...plans.values()].sort((a,b) => b.covered - a.covered || a.ordered - b.ordered)[0];
}

// Supplier lengths and tolerances are expressed in inches.
export function suggestOrder(tubes, price36, kerf, trim, price12 = price36 / 3) {
  const rates = [[12,11],[8,10],[5,8],[3,5],[2,3]];
  function quote(length, qty) {
    const discount = rates.find(([min]) => qty >= min)?.[1] ?? 0;
    const base = price12 + (length - 12) * (price36 - price12) / 24;
    return { discount, unit: Math.round(Math.max(0,base) * (100-discount)) };
  }
  const patterns = [];
  function enumerate(i, cuts, sum, count) {
    if (i < tubes.length) {
      for (let n = 0; n <= tubes[i].qty; n++)
        enumerate(i + 1, [...cuts,n], sum + n*tubes[i].length, count+n);
      return;
    }
    if (!count) return;
    const nominal = Math.max(1, Math.ceil((sum - 1e-8)*8)/8);
    const direct = count === 1 && !trim && Math.abs(nominal-sum)<1e-8;
    const length = direct ? nominal : Math.max(1,Math.ceil((sum + count*kerf + (trim ? 0.125 : 0) - 1e-8)*8)/8);
    if (length <= 96) patterns.push({ cuts, length });
  }
  enumerate(0, [], 0, 0);
  const memo = new Map();
  function solve(left) {
    const key = left.join(',');
    if (memo.has(key)) return memo.get(key);
    const first = left.findIndex(n => n > 0);
    if (first < 0) return { cost: 0, lots: [] };
    let best = null;
    for (const pattern of patterns) {
      if (!pattern.cuts[first]) continue;
      const max = Math.min(...pattern.cuts.map((n,i) => n ? Math.floor(left[i]/n) : Infinity));
      for (let qty = 1; qty <= max; qty++) {
        const rest = solve(left.map((n,i) => n - qty*pattern.cuts[i]));
        if (!rest) continue;
        const { discount, unit } = quote(pattern.length, qty);
        const cost = qty*unit + rest.cost;
        if (!best || cost < best.cost) best = {cost, lots:[{...pattern,qty,discount,unit}, ...rest.lots]};
      }
    }
    memo.set(key,best);
    return best;
  }
  const demand = tubes.map(t => t.qty);
  let best = solve(demand);
  if (!best || !best.lots.length) return best;

  // Group by the length sold, even when the workshop cuts differ.
  function priceLots(lots) {
    const totals = new Map();
    for (const lot of lots) totals.set(lot.length, (totals.get(lot.length) || 0) + lot.qty);
    const priced = lots.map(lot => ({...lot, ...quote(lot.length, totals.get(lot.length))}));
    return { lots: priced, cost: priced.reduce((sum,l) => sum + l.unit*l.qty, 0) };
  }
  best = priceLots(best.lots);
  for (const length of new Set(patterns.map(p => p.length))) {
    const eligible = patterns.filter(p => p.length <= length && (trim || p.length === length ||
      p.cuts.reduce((sum,n,i) => sum+n*(tubes[i].length+kerf),0) <= length+1e-8));
    const cache = new Map();
    function fill(left) {
      const key = left.join(',');
      if (cache.has(key)) return cache.get(key);
      const first = left.findIndex(n => n > 0);
      if (first < 0) return [];
      let shortest = null;
      for (const pattern of eligible) {
        if (!pattern.cuts[first] || pattern.cuts.some((n,i) => n > left[i])) continue;
        const tail = fill(left.map((n,i) => n-pattern.cuts[i]));
        if (tail && (!shortest || tail.length+1 < shortest.length)) shortest = [pattern,...tail];
      }
      cache.set(key,shortest);
      return shortest;
    }
    const packed = fill(demand);
    if (!packed) continue;
    const counts = new Map();
    for (const pattern of packed) counts.set(pattern,(counts.get(pattern)||0)+1);
    const candidate = priceLots(Array.from(counts, ([pattern,qty]) => ({...pattern,length,qty})));
    if (candidate.cost < best.cost) best = candidate;
  }
  return best;
}
