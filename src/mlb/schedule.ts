import type { MLBGame, ProcessedGame, TeamSchedule } from './types';

export function processGames(games: MLBGame[]): ProcessedGame[] {
  return games.map(g => ({
    gamePk: g.gamePk,
    gameDate: new Date(g.gameDate),
    statusCode: g.status.statusCode,
    detailedState: g.status.detailedState,
    statusReason: g.status.reason ?? '',
    home: {
      teamId: g.teams.home.team.id,
      name: g.teams.home.team.name,
      abbreviation: g.teams.home.team.abbreviation,
      score: g.teams.home.score,
      wins: g.teams.home.leagueRecord.wins,
      losses: g.teams.home.leagueRecord.losses,
      pct: g.teams.home.leagueRecord.pct,
    },
    away: {
      teamId: g.teams.away.team.id,
      name: g.teams.away.team.name,
      abbreviation: g.teams.away.team.abbreviation,
      score: g.teams.away.score,
      wins: g.teams.away.leagueRecord.wins,
      losses: g.teams.away.leagueRecord.losses,
      pct: g.teams.away.leagueRecord.pct,
    },
  }));
}

export function splitSchedule(games: ProcessedGame[], nowMs: number, utcOffsetSeconds: number): TeamSchedule {
  const userNowMs = nowMs + utcOffsetSeconds * 1000;
  return {
    previous: games.filter(g => g.gameDate.getTime() + utcOffsetSeconds * 1000 < userNowMs && g.statusCode !== 'I'),
    upcoming: games.filter(g => g.gameDate.getTime() + utcOffsetSeconds * 1000 >= userNowMs || g.statusCode === 'I'),
  };
}

export function dateWindowArgs(now: Date): { startDate: string; endDate: string } {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 10);
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + 10);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}
