import { api, esc, setupMenu, toast } from './app.js';
import { ensureUiLibraries, loadScript } from './libraries.js';
import { addToCart } from './cart.js';

ensureUiLibraries(); setupMenu();
const box = document.querySelector('#box');
const id = new URLSearchParams(location.search).get('id');
const formatPrice = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(cents) || 0) / 100);

try {
  if (!id) throw new Error();
  const item = await api(`/api/items/${encodeURIComponent(id)}`);
  const images = [item.main_image, ...(item.gallery || [])].filter(Boolean);
  const options = Array.isArray(item.options) ? item.options.filter(option => option?.name && Array.isArray(option.values) && option.values.length) : [];
  const buyBox = item.price_cents > 0 ? `<form id="buy-form" class="buy-box"><div class="buy-price"><span class="mono">PREÇO</span><strong>${formatPrice(item.price_cents)}</strong></div>${options.map(option => `<label>${esc(option.name)}<select name="option:${esc(option.name)}">${option.values.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('')}</select></label>`).join('')}<label class="buy-quantity">QUANTIDADE <select name="quantity">${[1,2,3,4,5].map(value => `<option value="${value}">${value}</option>`).join('')}</select></label><button class="btn" type="submit">Adicionar ao carrinho <span>+</span></button></form>` : '<div class="buy-box unavailable"><span class="mono">DISPONIBILIDADE</span><strong>CONSULTE A LOJA</strong><p>Preço e disponibilidade serão confirmados pelo atendimento.</p></div>';
  box.innerHTML = `<a class="text-link" href="/catalog.html">← Voltar ao catálogo</a><div class="record-head"><div><p class="record-code mono">${esc(item.code || 'SEM IDENTIFICAÇÃO')} / ${esc(item.categories?.name || 'SEM CLASSE')}</p><h1>${esc(item.name)}</h1></div><span class="badge badge-outline mono">IMPORTADA / VERIFICADA</span></div><div class="record-gallery"><div class="swiper knife-swiper"><div class="swiper-wrapper">${images.map(src => `<div class="swiper-slide"><img src="${esc(src)}" alt="${esc(item.name)}"></div>`).join('') || '<div class="swiper-slide"><div class="empty">Imagem indisponível.</div></div>'}</div><button class="swiper-button-prev" aria-label="Imagem anterior"><i data-lucide="chevron-left"></i></button><button class="swiper-button-next" aria-label="Próxima imagem"><i data-lucide="chevron-right"></i></button><div class="swiper-pagination"></div></div></div><div class="record-data"><div class="record-description"><p class="eyebrow mono">// DESCRIÇÃO DA LÂMINA</p><p>${esc(item.description || 'Não há descrição disponível para esta lâmina.')}</p>${buyBox}<div class="alert alert-info mt-6 text-xs"><i data-lucide="shield-check"></i><span>Confira a legislação aplicável e as condições de venda e transporte antes de concluir a compra.</span></div></div><div><div class="spec-title"><span class="mono">ESPECIFICAÇÕES</span><span class="mono">VALOR</span></div><table class="spec-table">${(item.specs || []).map(spec => `<tr><td>${esc(spec.label)}</td><td>${esc(spec.value)}</td></tr>`).join('') || '<tr><td>Dados técnicos</td><td>Não informados</td></tr>'}</table></div></div>`;
  await Promise.all([loadScript('/vendor/swiper.min.js'), loadScript('/vendor/lucide.min.js')]);
  new window.Swiper('.knife-swiper', { loop: images.length > 1, speed: 550, grabCursor: true, navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }, pagination: { el: '.swiper-pagination', type: 'fraction' }, keyboard: { enabled: true } });
  window.lucide?.createIcons({ attrs: { 'stroke-width': 1.5 } });
  document.querySelector('#buy-form')?.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.currentTarget); const selected = Object.fromEntries([...data.entries()].filter(([key]) => key.startsWith('option:')).map(([key, value]) => [key.slice(7), value])); try { addToCart({ id: item.id, name: item.name, image: item.main_image, price_cents: item.price_cents, quantity: Number(data.get('quantity')), options: selected }); toast('Lâmina adicionada ao carrinho.'); } catch (error) { toast(error.message); } });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { const { animate, stagger } = await import('/vendor/anime.min.js'); animate('.record-head > *', { opacity: [0, 1], translateY: [20, 0], delay: stagger(90), duration: 550, ease: 'out(3)' }); animate('.record-gallery', { opacity: [0, 1], scale: [.985, 1], duration: 650, ease: 'out(3)' }); }
} catch {
  box.innerHTML = '<div class="empty">Lâmina não encontrada. <a class="text-link" href="/catalog.html">Voltar ao catálogo</a></div>';
}
