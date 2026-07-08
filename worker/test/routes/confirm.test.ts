import { describe, it, expect, vi, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { handleConfirm } from '../../src/routes/confirm';
import { putCachedTeams } from '../../src/kv/teams';
import { getUser } from '../../src/kv/users';

beforeEach(async () => {
  vi.restoreAllMocks();
  await putCachedTeams(env.SCHEDULE, 1, [
    { id: 137, name: 'San Francisco Giants', abbreviation: 'SF' },
  ]);
});

function makePostRequest(params: Record<string, string>): Request {
  return new Request('https://example.com/install', {
    method: 'POST',
    body: new URLSearchParams(params),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

describe('POST /install', () => {
  it('returns 400 if form fields are missing', async () => {
    const res = await handleConfirm(makePostRequest({ code: 'abc' }), env);
    expect(res.status).toBe(400);
  });

  it('redirects to callback URL and stores provisional user with team name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok_xyz' }),
    }));

    const res = await handleConfirm(makePostRequest({
      code: 'abc123',
      installation_callback_url: 'https://trmnl.com/callback',
      team_id: '137',
    }), env);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://trmnl.com/callback');

    const provisional = await getUser(env.USERS, 'pending:tok_xyz');
    expect(provisional?.team_id).toBe(137);
    expect(provisional?.team_name).toBe('San Francisco Giants');
    expect(provisional?.team_abbreviation).toBe('SF');
  });

  it('returns 502 if TRMNL token exchange fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: true }),
    }));

    const res = await handleConfirm(makePostRequest({
      code: 'bad',
      installation_callback_url: 'https://trmnl.com/callback',
      team_id: '137',
    }), env);

    expect(res.status).toBe(502);
  });

  it('returns 404 if selected team_id is not in the teams list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok_xyz' }),
    }));

    const res = await handleConfirm(makePostRequest({
      code: 'abc123',
      installation_callback_url: 'https://trmnl.com/callback',
      team_id: '999',
    }), env);

    expect(res.status).toBe(404);
  });
});
