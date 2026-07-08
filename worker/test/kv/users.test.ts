import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { getUser, putUser, deleteUser } from '../../src/kv/users';
import type { UserRecord } from '../../src/mlb/types';

const sampleUser: UserRecord = {
  team_id: 137,
  team_name: 'San Francisco Giants',
  team_abbreviation: 'SF',
  access_token: 'tok_abc123',
  raw: {
    id: 1,
    name: 'Jane Fan',
    email: 'jane@example.com',
    first_name: 'Jane',
    last_name: 'Fan',
    locale: 'en',
    time_zone: 'Pacific Time (US & Canada)',
    time_zone_iana: 'America/Los_Angeles',
    utc_offset: -28800,
    plugin_setting_id: 42,
    uuid: 'uuid-1234',
  },
};

describe('KV user operations', () => {
  it('returns null for missing user', async () => {
    expect(await getUser(env.USERS, 'nonexistent')).toBeNull();
  });

  it('stores and retrieves a user record', async () => {
    await putUser(env.USERS, 'uuid-1234', sampleUser);
    const result = await getUser(env.USERS, 'uuid-1234');
    expect(result).toEqual(sampleUser);
  });

  it('deletes a user record', async () => {
    await putUser(env.USERS, 'uuid-1234', sampleUser);
    await deleteUser(env.USERS, 'uuid-1234');
    expect(await getUser(env.USERS, 'uuid-1234')).toBeNull();
  });
});
