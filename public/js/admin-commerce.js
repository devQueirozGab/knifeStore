import { api, esc } from './app.js';

let selectedId = null;
document.addEventListener('click', event => {
  const edit = event.target.closest('[data-edit]');
  if (edit) selectedId = edit.dataset.edit;
  if (event.target.closest('#new') || event.target.closest('#items-tab')) selectedId = null;
}, true);

const currency = cents => (Number(cents || 0) / 100).toFixed(2).replace('.', ',');
const optionText = options => Array.isArray(options) ? options.map(option => `${option.name}: ${(option.values || []).join(' | ')}`).join('\n') : '';
const addCommerceFields = async () => {
  const fields = document.querySelector('#fields');
  const title = document.querySelector('#form-title')?.textContent.toLocaleLowerCase() || '';
  if (!title.includes('item') || !fields?.querySelector('input[name="name"]') || fields.querySelector('[data-commerce-fields]')) return;
  let item = null;
  if (selectedId) { try { item = (await api('/api/items')).find(entry => entry.id === selectedId); } catch { /* mantém campos vazios */ } }
  fields.insertAdjacentHTML('beforeend', `<div data-commerce-fields class="wide admin-commerce"><label>PREÇO (R$)<input name="price" inputmode="decimal" type="number" min="0" step="0.01" value="${esc(currency(item?.price_cents))}" placeholder="0,00"></label><label class="wide">OPÇÕES DE COMPRA <textarea name="options" rows="3" placeholder="Acabamento: Stonewash | Satin\nOrientação: Destro | Canhoto">${esc(optionText(item?.options))}</textarea><small>Uma opção por linha. Use “Nome: valor 1 | valor 2”.</small></label></div>`);
};
new MutationObserver(addCommerceFields).observe(document.querySelector('#fields'), { childList: true, subtree: true });
