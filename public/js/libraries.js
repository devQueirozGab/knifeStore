const addStyle = href => {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href; document.head.append(link);
  }
};

export const ensureUiLibraries = () => {
  document.documentElement.dataset.theme = 'tactical';
  addStyle('/css/tailwind-build.css');
  addStyle('/vendor/swiper.min.css');
  addStyle('/css/libraries.css');
  addStyle('/css/hotfix.css');
  addStyle('/css/shop.css');
  addStyle('/css/purchase.css');
  addStyle('/css/products.css');
  addStyle('/css/selects.css');
};

export const loadScript = src => new Promise((resolve, reject) => {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return resolve();
  const script = document.createElement('script');
  script.src = src; script.defer = true; script.onload = resolve; script.onerror = reject;
  document.head.append(script);
});
