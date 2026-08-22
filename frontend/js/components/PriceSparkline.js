export const PriceSparkline = ({ pontos }) => {
  if (!pontos || pontos.length < 2) return '<p class="history-empty">Ainda sem histórico suficiente para mostrar tendência.</p>';
  const values = pontos.map(p => Number(p.preco_min)), min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const coords = values.map((v, i) => `${i / (values.length - 1) * 100},${90 - ((v - min) / range) * 80}`).join(' '), low = values.indexOf(min), cx = low / (values.length - 1) * 100;
  return `<svg class="price-sparkline" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${coords}" fill="none" stroke="var(--color-savings)" stroke-width="3" vector-effect="non-scaling-stroke"/><circle cx="${cx}" cy="90" r="3" fill="var(--color-savings)" vector-effect="non-scaling-stroke"/></svg>`;
};
