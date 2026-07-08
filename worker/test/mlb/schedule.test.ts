import { describe, it, expect } from 'vitest';
import { processGames, dateWindowArgs } from '../../src/mlb/schedule';
import type { MLBGame } from '../../src/mlb/types';

const baseGame = (overrides: Partial<MLBGame> = {}): MLBGame => ({
  gamePk: 1,
  gameDate: '2026-07-07T18:00:00Z',
  officialDate: '2026-07-07',
  status: {
    abstractGameState: 'Final',
    codedGameState: 'F',
    detailedState: 'Final',
    statusCode: 'F',
    startTimeTBD: false,
  },
  teams: {
    home: {
      team: { id: 137, name: 'San Francisco Giants', abbreviation: 'SF', link: '' },
      leagueRecord: { wins: 50, losses: 40, pct: '.556' },
      score: 5,
      splitSquad: false,
    },
    away: {
      team: { id: 119, name: 'Los Angeles Dodgers', abbreviation: 'LAD', link: '' },
      leagueRecord: { wins: 55, losses: 35, pct: '.611' },
      score: 3,
      splitSquad: false,
    },
  },
  ...overrides,
});

describe('processGames', () => {
  it('maps game fields correctly', () => {
    const games = processGames([baseGame()]);
    expect(games).toHaveLength(1);
    const g = games[0];
    expect(g.gamePk).toBe(1);
    expect(g.statusCode).toBe('F');
    expect(g.home.teamId).toBe(137);
    expect(g.home.abbreviation).toBe('SF');
    expect(g.home.score).toBe(5);
    expect(g.away.score).toBe(3);
    expect(g.gameDate).toBeInstanceOf(Date);
  });

  it('includes statusReason when present', () => {
    const game = baseGame();
    game.status.reason = 'Rain';
    const [processed] = processGames([game]);
    expect(processed.statusReason).toBe('Rain');
  });

  it('returns empty array for empty input', () => {
    expect(processGames([])).toEqual([]);
  });
});

describe('dateWindowArgs', () => {
  it('returns startDate 10 days ago and endDate 10 days from now', () => {
    const now = new Date('2026-07-07T00:00:00Z');
    const { startDate, endDate } = dateWindowArgs(now);
    expect(startDate).toBe('2026-06-27');
    expect(endDate).toBe('2026-07-17');
  });
});
