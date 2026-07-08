import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { getCachedTeams, putCachedTeams } from '../../src/kv/teams';
import type { Team } from '../../src/teams';

const sampleTeams: Team[] = [
  { id: 137, name: 'San Francisco Giants', abbreviation: 'SF' },
  { id: 119, name: 'Los Angeles Dodgers', abbreviation: 'LAD' },
];

describe('KV teams cache', () => {
  it('returns null on cache miss', async () => {
    expect(await getCachedTeams(env.SCHEDULE, 1)).toBeNull();
  });

  it('stores and retrieves teams by sportId', async () => {
    await putCachedTeams(env.SCHEDULE, 1, sampleTeams);
    const result = await getCachedTeams(env.SCHEDULE, 1);
    expect(result).toEqual(sampleTeams);
  });

  it('different sportIds are stored independently', async () => {
    await putCachedTeams(env.SCHEDULE, 1, sampleTeams);
    expect(await getCachedTeams(env.SCHEDULE, 11)).toBeNull();
  });
});
