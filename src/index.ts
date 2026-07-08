import type { Env } from './env';
import { handleInstall } from './routes/install';
import { handleConfirm } from './routes/confirm';
import { handleScreen } from './routes/screen';
import { handleSuccess } from './routes/success';
import { handleUninstall } from './routes/uninstall';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { method } = request;
    const { pathname } = url;

    if (method === 'GET' && pathname === '/install') return handleInstall(request, env);
    if (method === 'POST' && pathname === '/install') return handleConfirm(request, env);
    if (method === 'POST' && pathname === '/screen') return handleScreen(request, env);
    if (method === 'POST' && pathname === '/success') return handleSuccess(request, env);
    if (method === 'POST' && pathname === '/uninstall') return handleUninstall(request, env);

    return new Response('Not Found', { status: 404 });
  },
};
