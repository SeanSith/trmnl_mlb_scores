import type { Team } from '../teams';

const TEAMS_TTL_SECONDS = 24 * 60 * 60; // 24 hours

const key = (sportId: number) => `teams:${sportId}`;

export async function getCachedTeams(kv: KVNamespace, sportId: number): Promise<Team[] | null> {
  return kv.get<Team[]>(key(sportId), 'json');
}

export async function putCachedTeams(kv: KVNamespace, sportId: number, teams: Team[]): Promise<void> {
  await kv.put(key(sportId), JSON.stringify(teams), {
    expirationTtl: TEAMS_TTL_SECONDS,
  });
}
