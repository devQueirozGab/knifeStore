// Função abrangente da Vercel: garante que todo /api/* seja entregue ao
// roteador Express, inclusive quando o projeto for importado como "Other".
import app from '../server/index.js';

export default app;
