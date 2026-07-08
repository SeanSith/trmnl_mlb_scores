import type { Env } from '../env';
import { getUser, deleteUser } from '../kv/users';

export async function handleUninstall(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const bearerToken = authHeader.replace('Bearer ', '').trim();

  const body = await request.json() as { user_uuid?: string };
  if (!body.user_uuid) return new Response('Missing user_uuid', { status: 400 });

  const record = await getUser(env.USERS, body.user_uuid);
  if (!record || record.access_token !== bearerToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  await deleteUser(env.USERS, body.user_uuid);
  return new Response('OK', { status: 200 });
}
