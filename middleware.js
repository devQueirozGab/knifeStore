/**
 * Vercel Routing Middleware
 *
 * Public files in /public can be returned by Vercel's CDN before Express runs.
 * This layer therefore repeats only the signed-cookie check at the edge, so the
 * access gate cannot be skipped by requesting index.html directly.
 */
const STATIC_FILE = /\.(?:css|js|mjs|map|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf)$/i;
const encoder = new TextEncoder();

function readCookie(header, name) {
  const entry = (header || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : '';
}

function decodeBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const standard = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4);
  try {
    return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hasValidPass(cookie, secret) {
  const [expires, signature, ...extra] = String(cookie).split('.');
  if (extra.length || !/^\d{10,}$/.test(expires) || Number(expires) <= Date.now()) return false;

  const signatureBytes = decodeBase64Url(signature || '');
  if (!signatureBytes) return false;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    return crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(expires));
  } catch {
    return false;
  }
}

function continueRequest() {
  // The Vercel routing protocol uses this header as the equivalent of
  // NextResponse.next(), allowing the requested static file/function through.
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

export default async function middleware(request) {
  const siteKey = process.env.CF_TURNSTILE_SITE_KEY;
  const turnstileSecret = process.env.CF_TURNSTILE_SECRET;
  const passSecret = process.env.ACCESS_GATE_SECRET;

  // Keep local development and deployments without all three settings usable.
  if (!siteKey || !turnstileSecret || !passSecret) return continueRequest();

  const current = new URL(request.url);
  const { pathname } = current;
  const bypass = pathname === '/access.html'
    || pathname.startsWith('/admin')
    || pathname.startsWith('/api/access/')
    || STATIC_FILE.test(pathname);

  if (bypass || await hasValidPass(readCookie(request.headers.get('cookie'), 'dt_access'), passSecret)) {
    return continueRequest();
  }

  if (pathname.startsWith('/api/')) {
    return Response.json({ error: 'Verificação de acesso necessária.' }, { status: 403 });
  }

  const access = new URL('/access.html', current);
  access.searchParams.set('continue', `${pathname}${current.search}`);
  return Response.redirect(access, 302);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)']
};
