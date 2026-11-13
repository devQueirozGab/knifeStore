# DARK TACTICAL: prompt de continuação para outra IA

> **Regra do projeto:** todo código novo deve vir acompanhado da atualização deste arquivo (seção "Estado atual" e "Próximos passos"), para que qualquer IA retome de onde parou. As imagens de referência ficam em `docs/reference/` e devem ser consultadas antes de mexer na interface.

## 1. Briefing original (resumo fiel)

Plataforma web de **catálogo digital informativo** + **painel administrativo (CMS)**, estética dark, industrial, minimalista e brutalista. Prioridades: segurança, desempenho, organização, UX. Arquitetura escalável; preservar tecnologias que já funcionem.

**Produto/identidade:** catálogo de venda de facas importadas, com foco em procedência, aço, construção, acabamento e especificações. A linguagem deve transmitir robustez, precisão, sofisticação, exclusividade e tecnologia.
**Cores:** preto SWAT `#080909` (predominante), preto secundário `#101212`, grafite `#1B1E1F`, cinza metálico `#555B5D`, branco `#F5F5F5`, branco secundário `#C5C8C9`. Sem gradientes excessivos nem cores vibrantes.
**Tipografia:** Bebas Neue ou Oswald (títulos), Inter ou Manrope (texto), IBM Plex Mono (dados técnicos).
**Bibliotecas desejadas:** DaisyUI, Tailwind CSS, Anime.js, Swiper.js, Lucide Icons, AOS ou Intersection Observer. Usar de forma complementar, sem duplicar função. Animações discretas: entrada de títulos, hover de cards, microinterações em botões, carrossel natural, feedback em formulários. **Não virar demo de animações.** Respeitar `prefers-reduced-motion`.

**Site público:**
- Home: header minimalista (logo à esquerda, navegação discreta), hero de impacto com imagem principal e título grande, seção institucional, categorias, destaques, rodapé completo.
- Catálogo: grid responsivo, busca por nome, filtro por categoria, ordenação, cards minimalistas, descrições resumidas.
- Página do item: galeria Swiper, nome, identificação, categoria, descrição, informações técnicas, características em tabela.

**Painel admin (independente do público, mesma identidade):**
- Login exclusivo, hash Argon2id/bcrypt, sessões seguras, cookies HttpOnly/Secure/SameSite, expiração, limite de tentativas, recuperação por token temporário, 2FA opcional. **Sem cadastro público de admins.**
- Dashboard: nº de itens, nº de categorias, últimos registros, atalhos, histórico de atividades.
- CRUD de itens: nome, descrição, categoria, imagem principal, galeria, informações técnicas, datas de criação/atualização. Exclusão com confirmação.
- CRUD de categorias: nome, descrição, imagem, ordem de exibição. **Bloquear exclusão se houver itens associados**, com mensagem explicativa.
- Imagens: upload, validação de formato, limite de tamanho, nomes seguros, armazenamento externo, otimização automática, proteção contra arquivos maliciosos.

**Segurança / Cloudflare:** DNS, proxy reverso, CDN, SSL Full (Strict), DDoS, WAF, rate limiting, Turnstile quando apropriado, sem expor o IP de origem. O Cloudflare **não substitui** validações no backend: validação e sanitização no servidor, proteção contra SQLi/XSS/CSRF, permissões, rate limit em endpoints sensíveis, auth em todas as rotas admin, erros sem detalhes internos, variáveis de ambiente, dev/prod separados, consultas parametrizadas, backups, log de atividades, menor privilégio.

**UX:** responsivo, menu mobile, skeleton loading, estados vazios, mensagens de sucesso/erro, confirmação em ações destrutivas, acessibilidade.

**Regras:** nada de demo estática; CRUD real ligado ao banco; autenticação real; rotas admin protegidas no backend; nenhuma credencial no código; sem bibliotecas desnecessárias; código limpo e modular.

## 2. Imagens de referência (usar como direção visual)

| Arquivo | O que extrair |
|---|---|
| `docs/reference/ref-1-brutal-architecture.png` | Site brutalista monocromático: tipografia condensada enorme em caixa alta, texto alinhado à direita sobre foto de concreto, nav em colunas pequenas, CTA com seta. Referência de **hero**. |
| `docs/reference/ref-2-blackplate-catalog.png` | Loja dark premium: home com hero + faixa de 4 especificações, **página de produto** (miniaturas à esquerda, imagem grande, tabela de especificações em mono, abas), cards "você também pode gostar", painel de tipografia e paleta. Referência de **catálogo e página do item**. |
| `docs/reference/ref-3-emil-editorial-grid.png` | Portfólio editorial P&B: nome gigante, listagem em **linhas/tabela numerada** com hover revelando imagem, grid de imagens com legendas pequenas, nav mínima. Referência de **catálogo em modo lista/grade** e de espaçamento. (Fundo branco: adaptar para o dark.) |
| `docs/reference/ref-4-labworks-hud.png` | Interface tipo HUD: marcas de registro (+) nos cantos, textos em mono, contador/relógio, menu em botão branco, objeto central com muito vazio. Referência de **detalhes técnicos** (marcadores, mono, microcopy). |

## 3. Stack e decisões tomadas

- **Backend:** Node.js + Express (ESM). **Banco/Storage/Auth:** Supabase.
- Frontend público e admin: HTML + ES modules + `public/css/style.css` (tokens de cor e fonte em `:root`).
- Leitura pública via `anon` + RLS (só `select`). **Toda escrita passa pelo backend** com `service role` (`server/lib/supabase.js`), que ignora RLS.
- Login: `signInWithPassword` no servidor; o token vai em cookie `sb_at` (HttpOnly, SameSite=Strict, Secure em produção, expira em até 1 h). Só entra quem estiver na tabela `admins`.
- CSRF: cookie `csrf` + header `x-csrf-token` (double-submit), checado em todo POST/PUT/DELETE admin.
- Rate limit: 5 logins/15 min; 120 req/min na API. Helmet com CSP. Validação e sanitização em `server/lib/validate.js`. Exclusão de categoria com itens retorna 409 com mensagem.
- Hash de senha é feito pelo Supabase Auth (bcrypt).

## 4. Estado atual

**Pronto:** `db/schema.sql` (tabelas, RLS), API pública (`/api/categories`, `/api/items`, `/api/items/:id`), login/logout/me, API admin (stats, CRUD de itens e categorias, audit log), páginas `index`, `catalog`, `item` (skeleton, estados vazios, busca/filtro/ordenação), `admin/login` e `admin/index` (dashboard simples), `prefers-reduced-motion`.

**Atualização desta etapa (12/11/2026):** criada a tela `public/admin/manage.html` com `public/js/admin-manage.js` para listar, criar, editar e excluir itens e categorias usando as rotas admin existentes. O formulário de itens cobre código, categoria, imagem principal, descrição, galeria por URLs HTTPS, especificações e destaque. O dashboard ganhou atalho para o CMS. CSS responsivo adicionado ao final de `public/css/style.css`. Implementado endpoint autenticado `POST /api/admin/media`: aceita corpo binário JPG/PNG/WebP/AVIF até 8 MB, verifica assinatura do arquivo, gera chave aleatória e envia ao bucket `media` do Supabase Storage; formulário de item/categoria permite enviar imagem principal. O bucket precisa existir e ser público para leitura; o upload aceita também várias imagens da galeria e limita uploads a 30 por 15 minutos por IP. A otimização/conversão com Sharp permanece pendente. Testes unitários de assinatura de imagem adicionados (`npm test`, 6 casos aprovados); validação de ordem numérica de categorias corrigida.

**Reformulação visual desta etapa (12/11/2026):** home, catálogo, página de item, login e dashboard foram redesenhados com composição brutalista/editorial, divisórias industriais, marcadores HUD, tipografia de exibição, dados em monoespaçada e layout responsivo. O catálogo agora exibe os registros em linhas numeradas (mantendo busca, filtro e ordem); a página de item inclui galeria navegável e tabela técnica; a home usa faixas de especificação e categorias visuais. Os scripts inline foram transferidos para módulos em `public/js/`, permitindo remover `'unsafe-inline'` da CSP. O menu mobile também foi implementado. Nenhuma variável do `.env` foi alterada.

**Bibliotecas integradas (12/11/2026):** Tailwind CSS + DaisyUI estão configurados em `tailwind.config.cjs`; o CSS compilado fica em `public/css/tailwind-build.css` e é gerado por `npm run build:css`. Swiper está incorporado localmente em `public/vendor/` e alimenta a galeria da página de item, com teclado, arraste, paginação e controles. Anime.js também está local e anima a entrada do registro apenas quando `prefers-reduced-motion` não está ativo. Lucide é carregado localmente para ícones de navegação e de aviso. As dependências também foram registradas no `package.json` e no lockfile.

**Correção visual desta etapa (12/11/2026):** a escala do título do hero foi limitada em telas de até 900 px em `public/css/hotfix.css`, removendo o corte lateral de “PRECISÃO”. `public/js/app.js` ganhou uma abertura de no máximo 1,1 s com uma silhueta vetorial de faca lateral, linha de leitura e texto de estado; não há emoji e o loader respeita `prefers-reduced-motion`.

**Comércio desta etapa (12/11/2026):** o catálogo público ganhou busca rápida global e um carrinho persistente no navegador, exibido em modal. A página de item permite escolher quantidade e as opções cadastradas antes de adicionar ao carrinho. Itens com combinações de opções distintas permanecem separados; o modal permite alterar quantidade, remover, consultar subtotal e copiar um resumo para atendimento. A migração `db/migrations/002_cart_and_options.sql` adiciona `price_cents` e `options` em instalações já existentes. O CMS aceita preço em reais e opções no formato `Nome: valor 1 | valor 2`. Não há checkout de pagamento automático: entrega, legalidade e pagamento seguem para confirmação humana.

**Diagnóstico de upload (12/11/2026):** o envio de imagem depende do bucket público `media` no mesmo projeto Supabase indicado pelas três variáveis do `.env`. O SQL de criação segura está em `db/storage.sql`. A API agora diferencia bucket ausente e credenciais/projetos incompatíveis, para que o CMS não mostre apenas o erro genérico.

**Portão Cloudflare desta etapa (12/11/2026):** `server/access-gate.js` implementa um portão opcional de entrada com Cloudflare Turnstile. Quando `CF_TURNSTILE_SITE_KEY`, `CF_TURNSTILE_SECRET` e `ACCESS_GATE_SECRET` estão preenchidas, o site público e suas APIs exigem um token validado server-side pela Siteverify antes de liberar acesso; `/admin` permanece disponível. A tela fica em `public/access.html`. Em desenvolvimento, sem as três variáveis, o portão fica desligado.

**Deploy Vercel (12/11/2026):** foi incluído `server.js` na raiz, que exporta a aplicação Express como default export no local de entrada reconhecido pela Vercel. `server/index.js` ainda faz `listen()` apenas localmente; no ambiente Vercel ele exporta a instância sem iniciar um listener próprio.

**Ainda não feito (próximos passos, em ordem sugerida):**
1. Otimização automática das imagens com Sharp e limpeza de arquivos órfãos no Storage.
3. Integrar Swiper, Anime.js e Lucide somente se a necessidade justificar o peso adicional; a galeria, animações discretas e ícones atuais são nativos e leves.
4. Substituir o texto institucional de exemplo e revisar a identidade verbal com o conteúdo real da marca.
6. Recuperação de acesso (reset por e-mail do Supabase) e 2FA (TOTP via Supabase MFA).
7. Cloudflare: DNS proxied, SSL Full (Strict), WAF, regras de rate limit, Turnstile no login; só aceitar tráfego do Cloudflare na origem.
8. Remover `'unsafe-inline'` da CSP movendo os scripts inline para arquivos em `public/js/`.
9. Backups (Supabase PITR/dump agendado) e testes.

## 5. Como rodar

```
npm install
cp .env.example .env        # preencher as 3 variáveis do Supabase
# SQL Editor: executar db/schema.sql; criar usuário em Auth; inserir o UUID dele em admins
npm run dev                 # http://localhost:3000  | admin: /admin/login.html
```

## 6. Segurança das chaves

As chaves reais **não estão neste repositório**. Só vão em `.env` (ignorado pelo git) ou nos secrets do host. A `service role` nunca vai ao frontend. Se alguma chave já foi colada em chats ou documentos, **rotacione no painel do Supabase** (Settings > API) antes de publicar.
