import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTeamSchedule, fetchTeams } from '../../src/mlb/api';

beforeEach(() => vi.restoreAllMocks());

describe('fetchTeamSchedule', () => {
  it('fetches and returns processed games', async () => {
    const mockResponse = {
      dates: [{
        date: '2026-07-07',
        games: [{
          gamePk: 999,
          gameDate: '2026-07-07T18:00:00Z',
          officialDate: '2026-07-07',
          status: { abstractGameState: 'Preview', codedGameState: 'P', detailedState: 'Pre-Game', statusCode: 'P', startTimeTBD: false },
          teams: {
            home: { team: { id: 137, name: 'San Francisco Giants', abbreviation: 'SF', link: '' }, leagueRecord: { wins: 50, losses: 40, pct: '.556' }, splitSquad: false },
            away: { team: { id: 119, name: 'Los Angeles Dodgers', abbreviation: 'LAD', link: '' }, leagueRecord: { wins: 55, losses: 35, pct: '.611' }, splitSquad: false },
          },
        }],
      }],
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => mockResponse }));

    const games = await fetchTeamSchedule(137, '2026-06-27', '2026-07-17');
    expect(games).toHaveLength(1);
    expect(games[0].gamePk).toBe(999);
    expect(games[0].home.teamId).toBe(137);
  });

  it('returns empty array when dates is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ dates: [] }) }));
    expect(await fetchTeamSchedule(137, '2026-06-27', '2026-07-17')).toEqual([]);
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await expect(fetchTeamSchedule(137, '2026-06-27', '2026-07-17')).rejects.toThrow('MLB API error: 403');
  });
});

describe('fetchTeams', () => {
  it('returns teams sorted by name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        teams: [
          { id: 119, name: 'Los Angeles Dodgers', abbreviation: 'LAD' },
          { id: 137, name: 'San Francisco Giants', abbreviation: 'SF' },
          { id: 144, name: 'Atlanta Braves', abbreviation: 'ATL' },
        ],
      }),
    }));

    const teams = await fetchTeams(1);
    expect(teams).toHaveLength(3);
    expect(teams[0].name).toBe('Atlanta Braves');
    expect(teams[1].name).toBe('Los Angeles Dodgers');
    expect(teams[2].name).toBe('San Francisco Giants');
  });

  it('includes the sportId in the request URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ teams: [] }) });
    vi.stubGlobal('fetch', mockFetch);
    await fetchTeams(11);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('sportId=11'));
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(fetchTeams(1)).rejects.toThrow('MLB Teams API error: 500');
  });
});
