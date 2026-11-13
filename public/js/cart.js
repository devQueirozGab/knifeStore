const KEY = 'dark-tactical-cart-v1';
const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(cents) || 0) / 100);
const get = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const save = cart => { localStorage.setItem(KEY, JSON.stringify(cart)); window.dispatchEvent(new Event('cart:changed')); };
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const whatsappNumber = '5515996934171';
let turnstileScript;
const loadTurnstile = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileScript) return turnstileScript;
  turnstileScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true; script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error('Não foi possível carregar a verificação.'));
    document.head.append(script);
  });
  return turnstileScript;
};

export const cartCount = () => get().reduce((total, item) => total + item.quantity, 0);
export const addToCart = product => {
  if (!product?.id || !Number.isInteger(product.price_cents) || product.price_cents < 1) throw new Error('Este item ainda não possui preço disponível.');
  const selected = product.options || {};
  const key = `${product.id}:${Object.entries(selected).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => `${name}=${value}`).join('|')}`;
  const cart = get(); const existing = cart.find(item => item.key === key);
  if (existing) existing.quantity = Math.min(existing.quantity + product.quantity, 10);
  else cart.push({ key, id: product.id, name: product.name, image: product.image || '', price_cents: product.price_cents, quantity: Math.min(Math.max(product.quantity || 1, 1), 10), options: selected });
  save(cart); return cart;
};
export const updateQuantity = (key, quantity) => { const cart = get(); const item = cart.find(entry => entry.key === key); if (!item) return; item.quantity = Math.min(Math.max(Number(quantity) || 1, 1), 10); save(cart); };
export const removeFromCart = key => save(get().filter(item => item.key !== key));
export const cartTotal = () => get().reduce((sum, item) => sum + item.price_cents * item.quantity, 0);

export const mountShopUi = () => {
  if (location.pathname.startsWith('/admin/') || document.querySelector('#cart-dialog')) return;
  const nav = document.querySelector('#site-nav'); if (!nav) return;
  nav.insertAdjacentHTML('beforeend', `<button class="shop-nav-button" id="search-open" type="button" aria-label="Buscar no catálogo"><span>BUSCAR</span><i>⌕</i></button><button class="shop-nav-button" id="cart-open" type="button" aria-label="Abrir carrinho"><span>CARRINHO</span><b id="cart-count">0</b></button>`);
  document.body.insertAdjacentHTML('beforeend', `<dialog class="shop-dialog" id="search-dialog"><div class="shop-dialog__panel search-panel"><button class="dialog-close" data-close="search-dialog" aria-label="Fechar busca">×</button><p class="eyebrow mono">// BUSCA RÁPIDA</p><label class="search-input"><span>⌕</span><input id="global-search" type="search" placeholder="Busque por modelo, marca ou código" autocomplete="off"></label><div id="search-results" class="search-results"><p class="mono">DIGITE PARA CONSULTAR O CATÁLOGO</p></div></div></dialog><dialog class="shop-dialog" id="cart-dialog"><div class="shop-dialog__panel cart-panel"><div class="dialog-head"><div><p class="eyebrow mono">// CARRINHO</p><h2>Seleção</h2></div><button class="dialog-close" data-close="cart-dialog" aria-label="Fechar carrinho">×</button></div><div id="cart-lines" class="cart-lines"></div><div class="cart-total"><span class="mono">SUBTOTAL</span><strong id="cart-total">R$ 0,00</strong></div><p class="cart-note">Frete e condições de venda são confirmados no atendimento.</p><button id="cart-checkout" class="btn" type="button">Solicitar pelo WhatsApp <span>↗</span></button></div></dialog><dialog class="shop-dialog" id="contact-dialog"><div class="shop-dialog__panel"><button class="dialog-close" data-close="contact-dialog" aria-label="Fechar verificação">×</button><p class="eyebrow mono">// SOLICITAÇÃO SEGURA</p><h2 class="dialog-title">Confirmar atendimento</h2><p class="cart-note">Conclua a verificação para abrir sua mensagem no WhatsApp.</p><div id="contact-turnstile"></div><p id="contact-status" class="cart-note" aria-live="polite"></p></div></dialog>`);
  const searchDialog = document.querySelector('#search-dialog'), cartDialog = document.querySelector('#cart-dialog'), contactDialog = document.querySelector('#contact-dialog'), searchInput = document.querySelector('#global-search'), searchResults = document.querySelector('#search-results');
  const open = dialog => { dialog.showModal(); if (dialog === searchDialog) setTimeout(() => searchInput.focus(), 50); };
  document.querySelector('#search-open').onclick = () => open(searchDialog); document.querySelector('#cart-open').onclick = () => { renderCart(); open(cartDialog); };
  document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => document.querySelector(`#${button.dataset.close}`).close());
  document.querySelectorAll('.shop-dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));
  let inventory = null; let timer;
  searchInput.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(async () => { const term = searchInput.value.trim().toLocaleLowerCase(); if (!term) { searchResults.innerHTML = '<p class="mono">DIGITE PARA CONSULTAR O CATÁLOGO</p>'; return; } try { inventory ||= await fetch('/api/items', { credentials: 'same-origin' }).then(response => response.ok ? response.json() : []); const results = inventory.filter(item => `${item.name} ${item.code || ''}`.toLocaleLowerCase().includes(term)).slice(0, 6); searchResults.innerHTML = results.length ? results.map(item => `<a href="/item.html?id=${encodeURIComponent(item.id)}" class="search-result"><span>${esc(item.name)}</span><small>${esc(item.code || 'SEM CÓDIGO')}</small></a>`).join('') : '<p class="mono">NENHUMA LÂMINA ENCONTRADA</p>'; } catch { searchResults.innerHTML = '<p class="mono">BUSCA INDISPONÍVEL</p>'; } }, 160); });
  const renderCart = () => { const cart = get(); document.querySelector('#cart-count').textContent = cartCount(); const lines = document.querySelector('#cart-lines'); lines.innerHTML = cart.length ? cart.map(item => `<article class="cart-line"><img src="${esc(item.image)}" alt="" onerror="this.remove()"><div><h3>${esc(item.name)}</h3><p>${Object.entries(item.options).map(([name, value]) => `${esc(name)}: ${esc(value)}`).join(' · ') || 'Configuração padrão'}</p><strong>${money(item.price_cents)}</strong></div><div class="quantity-control"><button data-minus="${esc(item.key)}" aria-label="Diminuir quantidade">−</button><span>${item.quantity}</span><button data-plus="${esc(item.key)}" aria-label="Aumentar quantidade">+</button></div><button class="cart-remove" data-remove="${esc(item.key)}" aria-label="Remover item">×</button></article>`).join('') : '<div class="cart-empty"><p class="mono">SEU CARRINHO ESTÁ VAZIO</p><a href="/catalog.html" class="text-link">Ver catálogo →</a></div>'; document.querySelector('#cart-total').textContent = money(cartTotal()); lines.querySelectorAll('[data-minus]').forEach(button => button.onclick = () => { const item = get().find(entry => entry.key === button.dataset.minus); updateQuantity(item.key, item.quantity - 1); renderCart(); }); lines.querySelectorAll('[data-plus]').forEach(button => button.onclick = () => { const item = get().find(entry => entry.key === button.dataset.plus); updateQuantity(item.key, item.quantity + 1); renderCart(); }); lines.querySelectorAll('[data-remove]').forEach(button => button.onclick = () => { removeFromCart(button.dataset.remove); renderCart(); }); };
  document.querySelector('#cart-checkout').onclick = async () => { const cart = get(); if (!cart.length) return; const status = document.querySelector('#contact-status'), target = document.querySelector('#contact-turnstile'); status.textContent = 'CARREGANDO VERIFICAÇÃO…'; target.replaceChildren(); open(contactDialog); try { const config = await fetch('/api/access/config').then(response => response.json()); if (!config.enabled) throw new Error('A verificação de atendimento ainda não foi configurada.'); const turnstile = await loadTurnstile(); status.textContent = 'CONCLUA A VERIFICAÇÃO PARA CONTINUAR'; turnstile.render(target, { sitekey: config.siteKey, action: 'site-entry', theme: 'dark', callback: async token => { status.textContent = 'ABRINDO WHATSAPP…'; try { const response = await fetch('/api/access/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); const lines = cart.map(item => `• ${item.quantity}× ${item.name}${Object.keys(item.options).length ? ` (${Object.entries(item.options).map(([name, value]) => `${name}: ${value}`).join(', ')})` : ''}`).join('\n'); const message = `Olá! Tenho interesse nestas facas:\n${lines}\n\nSubtotal: ${money(cartTotal())}`; location.assign(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`); } catch (error) { status.textContent = error.message || 'A verificação não foi aceita.'; turnstile.reset(); } } }); } catch (error) { status.textContent = error.message || 'Não foi possível iniciar a verificação.'; } };
  window.addEventListener('cart:changed', renderCart); renderCart();
};
