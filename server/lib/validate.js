const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const url = v => { const s = str(v, 500); return /^https:\/\/[^\s"'<>]+$/.test(s) ? s : null; };
export function cleanCategory(b) {
  const name = str(b.name, 80); if (!name) throw new Error('Nome é obrigatório.');
  const order = Number(b.sort_order);
  return { name, description: str(b.description, 500), image: url(b.image), sort_order: Number.isInteger(order) ? order : 0 };
}
export function cleanItem(b) {
  const name = str(b.name, 120); if (!name) throw new Error('Nome é obrigatório.');
  const specs = Array.isArray(b.specs) ? b.specs.slice(0, 40).map(s => ({ label: str(s?.label, 60), value: str(s?.value, 120) })).filter(s => s.label) : [];
  const gallery = Array.isArray(b.gallery) ? b.gallery.slice(0, 12).map(url).filter(Boolean) : [];
  const centsInput = b.price_cents === undefined ? Math.round(Number(String(b.price || '').replace(',', '.')) * 100) : Number(b.price_cents); const price_cents = Number.isInteger(centsInput) && centsInput >= 0 && centsInput <= 100000000 ? centsInput : 0;
  const textOptions = typeof b.options === 'string' ? b.options.split('\n').map(line => { const split = line.indexOf(':'); return split > 0 ? { name: line.slice(0, split), values: line.slice(split + 1).split('|') } : null; }).filter(Boolean) : b.options;
  const options = Array.isArray(textOptions) ? textOptions.slice(0, 4).map(option => ({ name: str(option?.name, 40), values: Array.isArray(option?.values) ? option.values.slice(0, 12).map(value => str(value, 60)).filter(Boolean) : [] })).filter(option => option.name && option.values.length) : [];
  return { name, code: str(b.code, 40) || null, description: str(b.description, 4000), category_id: /^[0-9a-f-]{36}$/i.test(b.category_id || '') ? b.category_id : null,
    main_image: url(b.main_image), gallery, specs, price_cents, options, featured: b.featured === true, updated_at: new Date().toISOString() };
}
