const status = document.querySelector('#access-status');
const copy = document.querySelector('#access-copy');
const requestedPath = new URLSearchParams(location.search).get('continue');
const destination = requestedPath && requestedPath.startsWith('/') && !requestedPath.startsWith('//')
  ? requestedPath
  : '/';
const config = await fetch('/api/access/config').then(response => response.json()).catch(() => ({ enabled: false }));

if (!config.enabled) {
  status.textContent = 'PORTÃO NÃO CONFIGURADO';
  copy.textContent = 'O administrador ainda não configurou o Cloudflare Turnstile.';
} else {
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    window.turnstile.render('#turnstile', {
      sitekey: config.siteKey,
      action: 'site-entry',
      theme: 'dark',
      callback: async token => {
        status.textContent = 'VALIDANDO ACESSO…';
        try {
          const response = await fetch('/api/access/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          status.textContent = 'ACESSO LIBERADO';
          location.replace(destination);
        } catch (error) {
          status.textContent = error.message || 'VERIFICAÇÃO NÃO ACEITA';
          window.turnstile.reset();
        }
      }
    });
  };
  script.onerror = () => { status.textContent = 'NÃO FOI POSSÍVEL CARREGAR A VERIFICAÇÃO'; };
  document.head.append(script);
}
