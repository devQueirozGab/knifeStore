import { api, esc } from './app.js';
const status = document.querySelector('#st'), activity = document.querySelector('#act');
try { const s = await api('/api/admin/stats'); status.textContent = `${s.items} ITENS / ${s.categories} CATEGORIAS`; activity.innerHTML = `<p class="eyebrow mono">// ATIVIDADE RECENTE</p><table class="spec-table">${s.activity.map(a => `<tr><td>${esc(a.created_at.slice(0, 16))}</td><td>${esc(`${a.action} ${a.entity}`)}</td></tr>`).join('') || '<tr><td>—</td><td>Nenhuma atividade registrada.</td></tr>'}</table>`; } catch { location.href = '/admin/login.html'; }
document.querySelector('#out').addEventListener('click', async () => { await api('/api/auth/logout', { method: 'POST' }); location.href = '/admin/login.html'; });
