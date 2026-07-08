import type { Env } from '../env';
import { putUser } from '../kv/users';
import { getCachedTeams, putCachedTeams } from '../kv/teams';
import { fetchTeams } from '../mlb/api';

const TRMNL_TOKEN_URL = 'https://trmnl.com/oauth/token';
const MLB_SPORT_ID = 1;

export async function handleConfirm(request: Request, env: Env): Promise<Response> {
  const form = await request.formData();
  const code = form.get('code') as string | null;
  const callbackUrl = form.get('installation_callback_url') as string | null;
  const teamIdStr = form.get('team_id') as string | null;

  if (!code || !callbackUrl || !teamIdStr) {
    return new Response('Missing required fields', { status: 400 });
  }

  const teamId = parseInt(teamIdStr, 10);
  if (isNaN(teamId)) return new Response('Invalid team_id', { status: 400 });

  // Resolve team name at install time so screen generation never needs a teams lookup
  let teams = await getCachedTeams(env.SCHEDULE, MLB_SPORT_ID);
  if (!teams) {
    teams = await fetchTeams(MLB_SPORT_ID);
    await putCachedTeams(env.SCHEDULE, MLB_SPORT_ID, teams);
  }
  const team = teams.find(t => t.id === teamId);
  if (!team) return new Response('Unknown team_id', { status: 404 });

  const tokenRes = await fetch(TRMNL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code }),
  });

  const tokenData = await tokenRes.json() as { access_token?: string; error?: boolean };
  if (tokenData.error || !tokenData.access_token) {
    return new Response('Token exchange failed', { status: 502 });
  }

  // Provisional record keyed by access_token; success webhook re-keys by uuid
  await putUser(env.USERS, `pending:${tokenData.access_token}`, {
    team_id: team.id,
    team_name: team.name,
    team_abbreviation: team.abbreviation,
    access_token: tokenData.access_token,
  });

  return Response.redirect(callbackUrl, 302);
}
