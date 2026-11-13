import { api, esc, productCard, setupMenu, toast } from './app.js';
import { ensureUiLibraries } from './libraries.js';
import { addToCart } from './cart.js';

ensureUiLibraries();
setupMenu();
const q = document.querySelector('#q');
const cat = document.querySelector('#cat');
const ord = document.querySelector('#ord');
const list = document.querySelector('#list');
const count = document.querySelector('#result-count');
q.value = new URLSearchParams(location.search).get('q') || '';

try {
  const [categories, items] = await Promise.all([api('/api/categories'), api('/api/items')]);
  const categorized = items.map(item => ({ ...item, categories: { name: categories.find(category => category.id === item.category_id)?.name || 'LÂMINA IMPORTADA' } }));
  cat.innerHTML += categories.map(category => `<option value="${esc(category.id)}">${esc(category.name)}</option>`).join('');
  cat.value = new URLSearchParams(location.search).get('cat') || '';
  const updateHero = () => {
    const selected = categories.find(category => category.id === cat.value);
    document.querySelector('#catalog-kicker').textContent = selected ? '// CATEGORIA / SELEÇÃO' : '// CATÁLOGO / ÍNDICE 01';
    document.querySelector('#catalog-title').innerHTML = selected ? esc(selected.name) : 'Lâminas<br><em>importadas.</em>';
    document.querySelector('#catalog-description').textContent = selected ? (selected.description || `Seleção de lâminas da categoria ${selected.name}.`) : 'Facas selecionadas por origem, aço, construção e perfil de uso.';
    document.title = selected ? `${selected.name} — Dark Tactical` : 'Catálogo — Dark Tactical';
  };
  const draw = () => {
    updateHero();
    const term = q.value.toLocaleLowerCase();
    let results = categorized.filter(item => (!cat.value || item.category_id === cat.value) && `${item.name} ${item.code || ''}`.toLocaleLowerCase().includes(term));
    if (ord.value === 'az') results = [...results].sort((a, b) => a.name.localeCompare(b.name));
    count.textContent = `${String(results.length).padStart(2, '0')} ITENS`;
    list.className = 'product-grid';
    list.innerHTML = results.length ? results.map(productCard).join('') : '<div class="empty">Nenhuma lâmina encontrada. Ajuste os filtros.</div>';
    list.querySelectorAll('[data-quick-add]').forEach(button => button.onclick = () => {
      const item = categorized.find(entry => entry.id === button.dataset.quickAdd);
      try { addToCart({ id: item.id, name: item.name, image: item.main_image, price_cents: item.price_cents, quantity: 1 }); toast('Lâmina adicionada ao carrinho.'); } catch (error) { toast(error.message); }
    });
  };
  [q, cat, ord].forEach(element => element.addEventListener('input', draw));
  draw();
} catch {
  list.innerHTML = '<div class="empty">Não foi possível carregar o catálogo.</div>';
  count.textContent = 'INDISPONÍVEL';
}
