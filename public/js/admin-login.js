import { api, toast } from './app.js';
const form = document.querySelector('#f'); form.addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/auth/login', { method: 'POST', body: Object.fromEntries(new FormData(form)) }); location.href = '/admin/'; } catch (err) { toast(err.message); } });
