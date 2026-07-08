import { describe, it, expect, vi, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { handleInstall } from '../../src/routes/install';
import { putCachedTeams } from '../../src/kv/teams';

beforeEach(() => vi.restoreAllMocks());

describe('GET /install', () => {
  it('returns 400 if code is missing', async () => {
    const req = new Request('https://example.com/install');
    const res = await handleInstall(req, env);
    expect(res.status).toBe(400);
  });

  it('returns 400 if installation_callback_url is missing', async () => {
    const req = new Request('https://example.com/install?code=abc');
    const res = await handleInstall(req, env);
    expect(res.status).toBe(400);
  });

  it('renders team options from KV cache', async () => {
    await putCachedTeams(env.SCHEDULE, 1, [
      { id: 137, name: 'San Francisco Giants', abbreviation: 'SF' },
      { id: 119, name: 'Los Angeles Dodgers', abbreviation: 'LAD' },
    ]);

    const req = new Request('https://example.com/install?code=abc123&installation_callback_url=https%3A%2F%2Ftrmnl.com%2Fcallback');
    const res = await handleInstall(req, env);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('San Francisco Giants');
    expect(body).toContain('Los Angeles Dodgers');
    expect(body).toContain('<select name="team_id"');
  });

  it('fetches teams from MLB API on cache miss', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ teams: [{ id: 137, name: 'San Francisco Giants', abbreviation: 'SF' }] }),
    }));

    const req = new Request('https://example.com/install?code=abc123&installation_callback_url=https%3A%2F%2Ftrmnl.com%2Fcallback');
    const res = await handleInstall(req, env);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('San Francisco Giants');
  });
});
