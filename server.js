import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicRouter } from './server/routes/public.js';
import { authRouter } from './server/routes/auth.js';
import { adminRouter } from './server/routes/admin.js';
import { accessRouter } from './server/access-gate.js';
import { supabaseConfigured } from './server/lib/supabase.js';
const app = express();
app.set('trust proxy', 1); // atrás do Cloudflare
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], styleSrc: ["'self'", 'https://fonts.googleapis.com'],
  fontSrc: ['https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:', 'https://*.supabase.co'], connectSrc: ["'self'", 'https://challenges.cloudflare.com'], scriptSrc: ["'self'", 'https://challenges.cloudflare.com'], frameSrc: ['https://challenges.cloudflare.com'], frameAncestors: ["'none'"] } } }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/api', rateLimit({ windowMs: 60e3, limit: 120, standardHeaders: true }));
// Sem Supabase configurado, responde JSON claro em vez de derrubar a função.
const needsDb = (req, res, next) => supabaseConfigured || req.path.startsWith('/access') ? next() : res.status(503).json({ error: 'Servidor sem configuração do Supabase. Defina as variáveis de ambiente e faça um novo deploy.' });
app.use('/api', needsDb);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use(accessRouter(express));
app.use('/api', publicRouter);
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'public')));
app.use((_q, res) => res.status(404).json({ error: 'Não encontrado.' }));
app.use((err, _q, res, _n) => { if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Arquivo excede o limite permitido.' }); if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Requisição inválida.' }); console.error(err); res.status(500).json({ error: 'Erro interno.' }); });
// Entrypoint Express da Vercel: este arquivo precisa importar 'express' diretamente.
// Localmente, o projeto continua usando `npm run dev`/`npm start`.
if (!process.env.VERCEL) app.listen(process.env.PORT || 3000, () => console.log('Dark Tactical no ar'));

export default app;
