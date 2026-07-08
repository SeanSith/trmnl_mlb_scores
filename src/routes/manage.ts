import type { Env } from '../env';
import { getUser, putUser } from '../kv/users';
import { getCachedTeams, putCachedTeams } from '../kv/teams';
import { fetchTeams } from '../mlb/api';

const MLB_SPORT_ID = 1;
const TRMNL_PLUGINS_URL = 'https://trmnl.com/plugin_settings';

const STYLES = `
  body { font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; padding: 0 20px; color: #111; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  p { color: #555; margin-bottom: 24px; }
  select { width: 100%; padding: 10px 12px; font-size: 16px; border: 1px solid #ccc; border-radius: 6px; margin-bottom: 12px; }
  button { width: 100%; padding: 12px; font-size: 16px; background: #000; color: #fff; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 12px; }
  button:hover { background: #333; }
  a.back { display: block; text-align: center; color: #555; font-size: 14px; text-decoration: none; }
  a.back:hover { color: #111; }
`;

export async function handleManage(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const uuid = request.method === 'GET'
    ? url.searchParams.get('uuid')
    : null;

  if (request.method === 'GET') return handleGet(url, env);
  if (request.method === 'POST') return handlePost(request, env);
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleGet(url: URL, env: Env): Promise<Response> {
  const uuid = url.searchParams.get('uuid');
  if (!uuid) return new Response('Missing uuid', { status: 400 });

  const user = await getUser(env.USERS, uuid);
  if (!user) return new Response('User not found', { status: 404 });

  let teams = await getCachedTeams(env.SCHEDULE, MLB_SPORT_ID);
  if (!teams) {
    teams = await fetchTeams(MLB_SPORT_ID);
    await putCachedTeams(env.SCHEDULE, MLB_SPORT_ID, teams);
  }

  const teamOptions = teams
    .map(t => `<option value="${t.id}"${t.id === user.team_id ? ' selected' : ''}>${t.name}</option>`)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MLB Scores Settings</title>
  <style>${STYLES}</style>
</head>
<body>
  <h1>MLB Scores Settings</h1>
  <p>Update your team selection.</p>
  <form method="POST" action="/manage">
    <input type="hidden" name="uuid" value="${uuid}">
    <select name="team_id" required>
      ${teamOptions}
    </select>
    <button type="submit">Save</button>
  </form>
  <a class="back" href="${TRMNL_PLUGINS_URL}">← Back to TRMNL</a>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function handlePost(request: Request, env: Env): Promise<Response> {
  const form = await request.formData();
  const uuid = form.get('uuid') as string | null;
  const teamIdStr = form.get('team_id') as string | null;

  if (!uuid || !teamIdStr) return new Response('Missing required fields', { status: 400 });

  const teamId = parseInt(teamIdStr, 10);
  if (isNaN(teamId)) return new Response('Invalid team_id', { status: 400 });

  const user = await getUser(env.USERS, uuid);
  if (!user) return new Response('User not found', { status: 404 });

  let teams = await getCachedTeams(env.SCHEDULE, MLB_SPORT_ID);
  if (!teams) {
    teams = await fetchTeams(MLB_SPORT_ID);
    await putCachedTeams(env.SCHEDULE, MLB_SPORT_ID, teams);
  }
  const team = teams.find(t => t.id === teamId);
  if (!team) return new Response('Unknown team_id', { status: 404 });

  await putUser(env.USERS, uuid, { ...user, team_id: team.id, team_name: team.name, team_abbreviation: team.abbreviation });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MLB Scores Settings</title>
  <style>${STYLES}body { text-align: center; }</style>
</head>
<body>
  <h1>Settings saved!</h1>
  <p>Now showing scores for the ${team.name}.</p>
  <a class="back" href="${TRMNL_PLUGINS_URL}">← Back to TRMNL</a>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
