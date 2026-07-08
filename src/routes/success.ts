import type { Env } from '../env';
import type { TRMNLInstallUser, UserRecord } from '../mlb/types';
import { getUser, putUser, deleteUser } from '../kv/users';

export async function handleSuccess(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const accessToken = authHeader.replace('Bearer ', '').trim();
  if (!accessToken) return new Response('Unauthorized', { status: 401 });

  const body = await request.json() as { user: TRMNLInstallUser };
  const { user } = body;
  if (!user?.uuid) return new Response('Missing user.uuid', { status: 400 });

  const provisional = await getUser(env.USERS, `pending:${accessToken}`);

  const record: UserRecord = {
    team_id: provisional?.team_id ?? 0,
    team_name: provisional?.team_name ?? '',
    team_abbreviation: provisional?.team_abbreviation ?? '',
    access_token: accessToken,
    raw: user,
  };

  await putUser(env.USERS, user.uuid, record);
  await deleteUser(env.USERS, `pending:${accessToken}`);

  return new Response('OK', { status: 200 });
}
