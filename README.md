# Dark Tactical

Catálogo digital informativo e CMS administrativo em Node.js, Express e Supabase.

## Configuração

1. Instale Node.js 20+ e execute `npm install`.
2. Copie `.env.example` para `.env` e preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. A chave service role deve permanecer somente no servidor.
3. Execute `db/schema.sql` no SQL Editor do Supabase.
   - Em um projeto que já esteja em uso, execute também `db/migrations/002_cart_and_options.sql` para habilitar preço e opções de compra. Sem essa etapa, o cadastro de itens retornará erro porque o CMS precisa dessas colunas.
4. No Supabase Storage, crie o bucket **media** com leitura pública. Alternativamente, execute `db/storage.sql` no SQL Editor. Não habilite escrita pública: os uploads passam pelo backend autenticado com service role.
5. Crie o usuário administrador em Supabase Auth e insira seu UUID em `admins` (ver comentário em `db/schema.sql`). Não existe cadastro público de administradores.
6. Rode `npm run dev` e abra `http://localhost:3000`. O painel fica em `/admin/login.html`.

## Upload de imagens

O painel aceita JPG, PNG, WebP e AVIF até 8 MB por imagem. A API valida a assinatura binária, usa nomes aleatórios e limita a 30 uploads por 15 minutos por IP. SVG não é aceito. A otimização automática ainda não está implementada.

## Verificações

- `npm test`: testes unitários da identificação de formatos.
- `node --check server/routes/admin.js` e `node --check public/js/admin-manage.js`: verificações rápidas de sintaxe.

Antes de publicar, configure HTTPS, `NODE_ENV=production`, proxy confiável corretamente, regras Cloudflare e backups. Faça testes de integração no seu projeto Supabase real.

## Carrinho e opções de compra

O carrinho é persistido no navegador do visitante e abre em um modal, sem página separada. Defina o preço e as opções (por exemplo, acabamento ou orientação) de cada faca no CMS após aplicar a migração. O resumo pode ser copiado para atendimento; pagamentos e pedidos definitivos exigem uma integração de checkout própria.

## Portão de entrada Cloudflare

O site público pode exigir uma verificação Cloudflare Turnstile antes de liberar catálogo, busca e APIs públicas. O painel `/admin` não é bloqueado por esse portão.

1. Crie um widget Turnstile do tipo **Managed** no painel Cloudflare e configure o domínio de produção.
2. Preencha no `.env` as variáveis `CF_TURNSTILE_SITE_KEY`, `CF_TURNSTILE_SECRET` e `ACCESS_GATE_SECRET` (uma string aleatória longa, exclusiva do projeto).
3. Reinicie o servidor. Sem as três variáveis, o portão fica desligado para facilitar o desenvolvimento local.

O segredo do Turnstile nunca vai ao navegador: o servidor valida o token diretamente com a API Siteverify do Cloudflare.
