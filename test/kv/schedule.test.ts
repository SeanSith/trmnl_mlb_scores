import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { getCachedSchedule, putCachedSchedule } from '../../src/kv/schedule';
import type { ProcessedGame } from '../../src/mlb/types';

const sampleGames: ProcessedGame[] = [
  {
    gamePk: 1,
    gameDate: new Date('2026-07-07T18:00:00Z'),
    statusCode: 'F',
    detailedState: 'Final',
    statusReason: '',
    home: { teamId: 137, name: 'SF Giants', abbreviation: 'SF', score: 5, wins: 50, losses: 40, pct: '.556' },
    away: { teamId: 119, name: 'LA Dodgers', abbreviation: 'LAD', score: 3, wins: 55, losses: 35, pct: '.611' },
  },
];

describe('KV schedule cache', () => {
  it('returns null on cache miss', async () => {
    expect(await getCachedSchedule(env.SCHEDULE, 137, '2026-07-07')).toBeNull();
  });

  it('stores and retrieves schedule with dates deserialized', async () => {
    await putCachedSchedule(env.SCHEDULE, 137, '2026-07-07', sampleGames);
    const result = await getCachedSchedule(env.SCHEDULE, 137, '2026-07-07');
    expect(result).toHaveLength(1);
    expect(result![0].gameDate).toBeInstanceOf(Date);
    expect(result![0].gameDate.toISOString()).toBe('2026-07-07T18:00:00.000Z');
  });
});
