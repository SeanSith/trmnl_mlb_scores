import type { MLBScheduleResponse, MLBTeamsResponse, ProcessedGame } from './types';
import type { Team } from '../teams';
import { processGames } from './schedule';

const MLB_BASE = 'https://statsapi.mlb.com/api/v1';

export async function fetchTeamSchedule(
  teamId: number,
  startDate: string,
  endDate: string,
): Promise<ProcessedGame[]> {
  const url = `${MLB_BASE}/schedule?hydrate=team&sportId=1&teamId=${teamId}&startDate=${startDate}&endDate=${endDate}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MLB API error: ${res.status}`);
  const data: MLBScheduleResponse = await res.json();
  const games = data.dates?.flatMap(d => d.games) ?? [];
  return processGames(games);
}

export async function fetchTeams(sportId: number): Promise<Team[]> {
  const url = `${MLB_BASE}/teams?sportId=${sportId}&activeStatus=ACTIVE`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MLB Teams API error: ${res.status}`);
  const data: MLBTeamsResponse = await res.json();
  return data.teams
    .map(t => ({ id: t.id, name: t.name, abbreviation: t.abbreviation }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
