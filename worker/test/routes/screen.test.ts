import { describe, it, expect, vi, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { handleScreen } from '../../src/routes/screen';
import { putUser } from '../../src/kv/users';
import { putCachedSchedule } from '../../src/kv/schedule';
import type { ProcessedGame } from '../../src/mlb/types';

const uuid = 'test-uuid-1';
const token = 'tok_test';

const sampleGame: ProcessedGame = {
  gamePk: 1,
  gameDate: new Date('2026-07-10T18:00:00Z'),
  statusCode: 'P',
  detailedState: 'Pre-Game',
  statusReason: '',
  home: { teamId: 137, name: 'SF Giants', abbreviation: 'SF', score: undefined, wins: 50, losses: 40, pct: '.556' },
  away: { teamId: 119, name: 'LA Dodgers', abbreviation: 'LAD', score: undefined, wins: 55, losses: 35, pct: '.611' },
};

beforeEach(async () => {
  vi.restoreAllMocks();
  await putUser(env.USERS, uuid, {
    team_id: 137,
    team_name: 'San Francisco Giants',
    team_abbreviation: 'SF',
    access_token: token,
  });
  const today = new Date().toISOString().slice(0, 10);
  await putCachedSchedule(env.SCHEDULE, 137, today, [sampleGame]);
});

function makeScreenRequest(userUuid: string, bearerToken: string): Request {
  const meta = JSON.stringify({
    user: { name: 'Jane', first_name: 'Jane', last_name: 'Fan', locale: 'en',
            time_zone: 'Pacific Time (US & Canada)', time_zone_iana: 'America/Los_Angeles', utc_offset: -28800 },
    device: { friendly_id: 'ABC123', percent_charged: 80, wifi_strength: 50, height: 480, width: 800 },
    system: { timestamp_utc: 1751900000 },
    plugin_settings: { instance_name: 'MLB Scores' },
  });
  return new Request('https://example.com/screen', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ user_uuid: userUuid, trmnl: meta }),
  });
}

describe('POST /screen', () => {
  it('returns 401 for unknown user_uuid', async () => {
    const req = makeScreenRequest('unknown-uuid', token);
    const res = await handleScreen(req, env);
    expect(res.status).toBe(401);
  });

  it('returns 401 if bearer token does not match stored token', async () => {
    const req = makeScreenRequest(uuid, 'wrong-token');
    const res = await handleScreen(req, env);
    expect(res.status).toBe(401);
  });

  it('returns JSON with all markup fields on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, text: async () => '<svg></svg>',
    }));
    const req = makeScreenRequest(uuid, token);
    const res = await handleScreen(req, env);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, string>;
    expect(body).toHaveProperty('markup');
    expect(body).toHaveProperty('markup_half_horizontal');
    expect(body).toHaveProperty('markup_half_vertical');
    expect(body).toHaveProperty('markup_quadrant');
    expect(body).toHaveProperty('shared');
    expect(body.markup).toContain('mlb-scores');
  });

  it('fetches from MLB API when cache is cold and caches the result', async () => {
    const today = new Date().toISOString().slice(0, 10);
    await env.SCHEDULE.delete(`schedule:137:${today}`);

    const mlbResponse = {
      dates: [{
        date: today,
        games: [{
          gamePk: 42,
          gameDate: new Date(Date.now() + 86400000).toISOString(),
          officialDate: today,
          status: { abstractGameState: 'Preview', codedGameState: 'P', detailedState: 'Pre-Game', statusCode: 'P', startTimeTBD: false },
          teams: {
            home: { team: { id: 137, name: 'SF Giants', abbreviation: 'SF', link: '' }, leagueRecord: { wins: 50, losses: 40, pct: '.556' }, splitSquad: false },
            away: { team: { id: 119, name: 'LA Dodgers', abbreviation: 'LAD', link: '' }, leagueRecord: { wins: 55, losses: 35, pct: '.611' }, splitSquad: false },
          },
        }],
      }],
    };

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mlbResponse })
      .mockResolvedValueOnce({ ok: true, text: async () => '<svg></svg>' })
    );

    const req = makeScreenRequest(uuid, token);
    const res = await handleScreen(req, env);
    expect(res.status).toBe(200);

    const cached = await env.SCHEDULE.get(`schedule:137:${today}`);
    expect(cached).not.toBeNull();
  });
});
