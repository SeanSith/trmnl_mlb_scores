import type { ProcessedGame } from '../mlb/types';

const SCHEDULE_TTL_SECONDS = 60 * 60; // 1 hour — keeps KV writes within free tier

const key = (teamId: number, date: string) => `schedule:${teamId}:${date}`;

type SerializedGame = Omit<ProcessedGame, 'gameDate'> & { gameDate: string };

export async function getCachedSchedule(
  kv: KVNamespace,
  teamId: number,
  date: string,
): Promise<ProcessedGame[] | null> {
  const raw = await kv.get<SerializedGame[]>(key(teamId, date), 'json');
  if (!raw) return null;
  return raw.map(g => ({ ...g, gameDate: new Date(g.gameDate) }));
}

export async function putCachedSchedule(
  kv: KVNamespace,
  teamId: number,
  date: string,
  games: ProcessedGame[],
): Promise<void> {
  await kv.put(key(teamId, date), JSON.stringify(games), {
    expirationTtl: SCHEDULE_TTL_SECONDS,
  });
}
