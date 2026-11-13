import crypto from 'node:crypto';

const { CF_TURNSTILE_SITE_KEY, CF_TURNSTILE_SECRET, ACCESS_GATE_SECRET } = process.env;
const enabled = Boolean(CF_TURNSTILE_SITE_KEY && CF_TURNSTILE_SECRET && ACCESS_GATE_SECRET);
const maxAge = 8 * 60 * 60 * 1000;
const safeCompare = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const sign = body => crypto.createHmac('sha256', ACCESS_GATE_SECRET).update(body).digest('base64url');
const createPass = () => { const expires = Date.now() + maxAge; const body = String(expires); return `${body}.${sign(body)}`; };
const validPass = value => {
  if (!value || typeof value !== 'string') return false;
  const [expires, signature] = value.split('.');
  return Boolean(expires && signature && Number(expires) > Date.now() && safeCompare(signature, sign(expires)));
};
const asset = path => /\.(?:css|js|mjs|map|png|jpe?g|webp|avif|svg|ico|woff2?)$/i.test(path);

export const accessRouter = (express, path, publicDir) => {
  const router = express.Router();
  router.get('/api/access/config', (_req, res) => res.json({ enabled, siteKey: enabled ? CF_TURNSTILE_SITE_KEY : null }));
  router.post('/api/access/verify', async (req, res) => {
    if (!enabled) return res.status(503).json({ error: 'O portão Cloudflare ainda não foi configurado no servidor.' });
    const token = typeof req.body?.token === 'string' ? req.body.token.slice(0, 2048) : '';
    if (!token) return res.status(400).json({ error: 'Conclua a verificação para entrar.' });
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: CF_TURNSTILE_SECRET, response: token, remoteip: req.ip }) });
      const result = await response.json();
      if (!result.success || result.action !== 'site-entry') return res.status(403).json({ error: 'A verificação não foi aceita. Tente novamente.' });
      res.cookie('dt_access', createPass(), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge });
      res.json({ ok: true });
    } catch { res.status(503).json({ error: 'Não foi possível validar o acesso agora. Tente novamente.' }); }
  });
  router.use((req, res, next) => {
    if (!enabled || req.path.startsWith('/admin') || req.path.startsWith('/api/access') || req.path === '/access.html' || asset(req.path) || validPass(req.cookies.dt_access)) return next();
    if (req.path.startsWith('/api/')) return res.status(403).json({ error: 'Verificação de acesso necessária.' });
    return res.status(403).sendFile(path.join(publicDir, 'access.html'));
  });
  return router;
};
