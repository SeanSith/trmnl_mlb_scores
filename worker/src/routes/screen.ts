import type { Env } from '../env';
import type { TRMNLMeta, ScreenResponse } from '../mlb/types';
import { getUser } from '../kv/users';
import { getCachedSchedule, putCachedSchedule } from '../kv/schedule';
import { fetchTeamSchedule } from '../mlb/api';
import { splitSchedule, dateWindowArgs } from '../mlb/schedule';
import { getLogoSvg } from '../r2/logos';
import { renderFull } from '../html/full';
import { renderHalfHorizontal, renderHalfVertical, renderQuadrant } from '../html/stubs';

export async function handleScreen(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const bearerToken = authHeader.replace('Bearer ', '').trim();

  const form = await request.formData();
  const userUuid = form.get('user_uuid') as string | null;
  const trmnlRaw = form.get('trmnl') as string | null;

  if (!userUuid) return new Response('Bad Request', { status: 400 });

  const record = await getUser(env.USERS, userUuid);
  if (!record || record.access_token !== bearerToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  const utcOffsetSeconds = trmnlRaw
    ? (JSON.parse(trmnlRaw) as TRMNLMeta).user.utc_offset
    : (record.raw?.utc_offset ?? 0);

  const now = new Date();
  const todayUtc = now.toISOString().slice(0, 10);
  const { startDate, endDate } = dateWindowArgs(now);

  let games = await getCachedSchedule(env.SCHEDULE, record.team_id, todayUtc);
  if (!games) {
    games = await fetchTeamSchedule(record.team_id, startDate, endDate);
    await putCachedSchedule(env.SCHEDULE, record.team_id, todayUtc, games);
  }

  const schedule = splitSchedule(games, now.getTime(), utcOffsetSeconds);
  const logoSvg = await getLogoSvg(env.LOGOS, record.team_id);

  const nextGame = schedule.upcoming[0];
  const oppTeamId = nextGame
    ? (nextGame.home.teamId === record.team_id ? nextGame.away.teamId : nextGame.home.teamId)
    : null;
  const oppLogoSvg = oppTeamId ? await getLogoSvg(env.LOGOS, oppTeamId) : null;

  const markup = renderFull({
    teamId: record.team_id,
    teamName: record.team_name,
    teamAbbr: record.team_abbreviation,
    schedule,
    utcOffsetSeconds,
    logoSvg,
    oppLogoSvg,
  });

  const response: ScreenResponse = {
    markup,
    markup_half_horizontal: renderHalfHorizontal(),
    markup_half_vertical: renderHalfVertical(),
    markup_quadrant: renderQuadrant(),
    shared: '',
  };

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}
