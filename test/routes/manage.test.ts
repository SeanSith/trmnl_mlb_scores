import { describe, it, expect, vi, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { handleManage } from '../../src/routes/manage';
import { putUser } from '../../src/kv/users';
import { putCachedTeams } from '../../src/kv/teams';

const uuid = 'manage-test-uuid';

beforeEach(async () => {
  vi.restoreAllMocks();
  await putCachedTeams(env.SCHEDULE, 1, [
    { id: 137, name: 'San Francisco Giants', abbreviation: 'SF' },
    { id: 119, name: 'Los Angeles Dodgers', abbreviation: 'LAD' },
  ]);
  await putUser(env.USERS, uuid, {
    team_id: 137,
    team_name: 'San Francisco Giants',
    team_abbreviation: 'SF',
    access_token: 'tok_test',
  });
});

describe('GET /manage', () => {
  it('returns 400 if uuid is missing', async () => {
    const req = new Request('https://example.com/manage');
    const res = await handleManage(req, env);
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown uuid', async () => {
    const req = new Request('https://example.com/manage?uuid=unknown');
    const res = await handleManage(req, env);
    expect(res.status).toBe(404);
  });

  it('renders form with current team pre-selected', async () => {
    const req = new Request(`https://example.com/manage?uuid=${uuid}`);
    const res = await handleManage(req, env);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('<option value="137" selected>San Francisco Giants</option>');
    expect(body).toContain('<option value="119">Los Angeles Dodgers</option>');
  });
});

describe('POST /manage', () => {
  it('returns 400 if fields are missing', async () => {
    const req = new Request('https://example.com/manage', {
      method: 'POST',
      body: new URLSearchParams({ uuid }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const res = await handleManage(req, env);
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown uuid', async () => {
    const req = new Request('https://example.com/manage', {
      method: 'POST',
      body: new URLSearchParams({ uuid: 'ghost', team_id: '137' }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const res = await handleManage(req, env);
    expect(res.status).toBe(404);
  });

  it('returns 404 for unknown team_id', async () => {
    const req = new Request('https://example.com/manage', {
      method: 'POST',
      body: new URLSearchParams({ uuid, team_id: '999' }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const res = await handleManage(req, env);
    expect(res.status).toBe(404);
  });

  it('updates user record and shows success page', async () => {
    const req = new Request('https://example.com/manage', {
      method: 'POST',
      body: new URLSearchParams({ uuid, team_id: '119' }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const res = await handleManage(req, env);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('Los Angeles Dodgers');

    // Verify KV was updated
    const updated = await env.USERS.get(`user:${uuid}`, 'json') as { team_id: number; team_name: string } | null;
    expect(updated?.team_id).toBe(119);
    expect(updated?.team_name).toBe('Los Angeles Dodgers');
  });
});
