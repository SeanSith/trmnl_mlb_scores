import type { Env } from '../env';
import { deleteUser } from '../kv/users';

export async function handleUninstall(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { user_uuid?: string };
  if (!body.user_uuid) return new Response('Missing user_uuid', { status: 400 });
  await deleteUser(env.USERS, body.user_uuid);
  return new Response('OK', { status: 200 });
}
