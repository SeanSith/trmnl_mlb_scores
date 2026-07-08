import type { Env } from '../env';
import { getCachedTeams, putCachedTeams } from '../kv/teams';
import { fetchTeams } from '../mlb/api';

const MLB_SPORT_ID = 1; // Major League Baseball — expand to a sport picker when adding other leagues

export async function handleInstall(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const callbackUrl = url.searchParams.get('installation_callback_url');

  if (!code || !callbackUrl) {
    return new Response('Missing required parameters', { status: 400 });
  }

  let teams = await getCachedTeams(env.SCHEDULE, MLB_SPORT_ID);
  if (!teams) {
    teams = await fetchTeams(MLB_SPORT_ID);
    await putCachedTeams(env.SCHEDULE, MLB_SPORT_ID, teams);
  }

  const teamOptions = teams.map(t =>
    `<option value="${t.id}">${t.name}</option>`
  ).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MLB Scores Setup</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; padding: 0 20px; color: #111; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    p { color: #555; margin-bottom: 24px; }
    select { width: 100%; padding: 10px 12px; font-size: 16px; border: 1px solid #ccc; border-radius: 6px; margin-bottom: 12px; }
    button { width: 100%; padding: 12px; font-size: 16px; background: #000; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
    button:hover { background: #333; }
  </style>
</head>
<body>
  <h1>MLB Scores for TRMNL</h1>
  <p>Choose your team to display on your device.</p>
  <form method="POST" action="/install">
    <input type="hidden" name="code" value="${code}">
    <input type="hidden" name="installation_callback_url" value="${callbackUrl}">
    <select name="team_id" required>
      ${teamOptions}
    </select>
    <button type="submit">Connect</button>
  </form>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
