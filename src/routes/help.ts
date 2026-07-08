import type { Env } from '../env';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MLB Scores for TRMNL – Help</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 60px auto; padding: 0 24px; color: #111; line-height: 1.6; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 16px; margin-top: 32px; margin-bottom: 8px; }
    p, li { color: #333; font-size: 15px; }
    ul { padding-left: 20px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .subtitle { color: #666; margin-top: 0; margin-bottom: 32px; }
    hr { border: none; border-top: 1px solid #eee; margin: 32px 0; }
  </style>
</head>
<body>
  <h1>MLB Scores for TRMNL</h1>
  <p class="subtitle">Game scores and schedules for your favorite team, on your TRMNL device.</p>

  <h2>What it shows</h2>
  <p>Your TRMNL screen displays:</p>
  <ul>
    <li>Upcoming games for the next several days</li>
    <li>Your next scheduled game (or the current game in progress)</li>
    <li>Recent past results</li>
    <li>Your team's record and opponent records</li>
  </ul>

  <h2>Installation</h2>
  <p>During installation you'll be asked to choose your MLB team. The plugin stores your selection and uses it to fetch your team's schedule automatically.</p>

  <h2>Changing your team</h2>
  <p>Go to your TRMNL plugin settings and click <strong>Manage Settings</strong>. Select a new team and save — your next screen refresh will reflect the change.</p>

  <h2>Refresh rate</h2>
  <p>Schedule data is cached for up to one hour. Live game scores update on the next refresh after the cache expires.</p>

  <hr>
  <p style="color:#999; font-size:13px;">Data provided by the MLB Stats API. This plugin is not affiliated with MLB.</p>
</body>
</html>`;

export async function handleHelp(_request: Request, _env: Env): Promise<Response> {
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
