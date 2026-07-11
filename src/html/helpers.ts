import type { TeamSchedule, ProcessedGame } from '../mlb/types';

export interface RenderOptions {
  teamId: number;
  teamName: string;
  schedule: TeamSchedule;
  utcOffsetSeconds: number;
  logoSvg: string;
  oppLogoSvg: string | null;
}

export const TRMNL_ASSETS = `<link rel="stylesheet" href="https://trmnl.com/css/latest/plugins.css">
<script src="https://trmnl.com/js/latest/plugins.js"></script>
<style>.card .title { border-radius: 10px; }</style>`;

export function getRecord(teamId: number, games: ProcessedGame[]): { wins: number; losses: number } {
  const game = [...games].reverse().find(g =>
    g.home.teamId === teamId || g.away.teamId === teamId
  );
  if (!game) return { wins: 0, losses: 0 };
  const side = game.home.teamId === teamId ? game.home : game.away;
  return { wins: side.wins, losses: side.losses };
}

export function toUserDate(date: Date, utcOffsetSeconds: number): Date {
  return new Date(date.getTime() + utcOffsetSeconds * 1000);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).toLowerCase();
}

export function formatShortDate(date: Date): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${m}/${d}`;
}

export function logoDataUri(svg: string): string {
  const bytes = new TextEncoder().encode(svg);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

export function matchupAbbr(teamId: number, game: ProcessedGame): string {
  const isHome = game.home.teamId === teamId;
  return isHome
    ? `${game.home.abbreviation} vs ${game.away.abbreviation}`
    : `${game.away.abbreviation} @ ${game.home.abbreviation}`;
}

export function titleBar(teamName: string, record: { wins: number; losses: number }, logoSvg: string): string {
  return `<div class="title_bar">
  <img src="${logoDataUri(logoSvg)}" alt="${teamName} logo" class="image">
  <span class="instance"><strong>${teamName}</strong> (${record.wins} - ${record.losses})</span>
</div>`;
}

export function nextGameCard(
  teamId: number,
  upcoming: ProcessedGame[],
  utcOffsetSeconds: number,
  oppLogoSvg: string | null,
  logoSize = 140,
  textSizes = { myTeam: 18, opp: 25, datetime: 20 },
  compact = false,
  showHeader = true,
): string {
  if (upcoming.length === 0) {
    return `<div class="title flex bg--gray-5 pt--1 pb--1"><p class="text--center w--full">No Upcoming Games</p></div>`;
  }

  const game = upcoming[0];
  const d = toUserDate(game.gameDate, utcOffsetSeconds);
  const isHome = game.home.teamId === teamId;
  const myTeam = isHome ? game.home : game.away;
  const opp = isHome ? game.away : game.home;
  const sep = isHome ? 'vs' : '@';

  const today = toUserDate(new Date(), utcOffsetSeconds);
  const isToday = d.getUTCFullYear() === today.getUTCFullYear()
    && d.getUTCMonth() === today.getUTCMonth()
    && d.getUTCDate() === today.getUTCDate();

  let title = 'Next Game';
  if (game.statusCode === 'I') title = 'Current Game';
  else if (isToday) title = "Today's Game";

  const logoImg = oppLogoSvg
    ? `<img src="${logoDataUri(oppLogoSvg)}" alt="${opp.name} logo" style="width:${logoSize}px;height:${logoSize}px;margin:0 auto;">`
    : '';

  const header = showHeader
    ? `<div class="title flex bg--gray-5 pt--1 pb--1"><p class="text--center w--full">${title}</p></div>\n`
    : '';

  return `${header}<div class="flex flex--col flex--center-y${compact ? '' : ' h--full'}"${compact ? ' style="gap:4px;"' : ''}>
  <div class="flex w--full flex--center-x" style="font-size:${textSizes.myTeam}px;">${myTeam.name} ${sep}</div>
  <div class="flex w--full flex--center-x"><strong style="font-size:${textSizes.opp}px;margin-bottom:0;">${opp.name}</strong></div>
  <div class="flex w--full flex--center-x">${logoImg}</div>
  <div class="flex w--full flex--center-x" style="margin-top:5px;font-size:${textSizes.datetime}px;">${formatDate(d)} &middot; ${formatTime(d)}</div>
</div>`;
}

export function previousGamesRows(teamId: number, previous: ProcessedGame[], utcOffsetSeconds: number, limit = 7): string {
  if (previous.length === 0) {
    return `<div class="flex flex--row flex--center-x flex--center-y p--5">
  <div class="value w--full">No previous games</div>
</div>`;
  }
  return previous.slice(-limit).reverse().map(game => {
    const isHome = game.home.teamId === teamId;
    const myScore = isHome ? (game.home.score ?? 0) : (game.away.score ?? 0);
    const oppScore = isHome ? (game.away.score ?? 0) : (game.home.score ?? 0);
    const result = myScore > oppScore ? 'W' : 'L';
    const bgClass = game.statusCode === 'F' && result === 'L' ? 'bg--gray-6' : '';
    const matchup = matchupAbbr(teamId, game);
    const d = toUserDate(game.gameDate, utcOffsetSeconds);
    const high = Math.max(myScore, oppScore);
    const low = Math.min(myScore, oppScore);

    const scoreOrStatus = game.statusCode !== 'F'
      ? `<div class="grid col--center col--span-2">${game.detailedState}${game.statusReason ? ` - ${game.statusReason}` : ''}</div>`
      : `<div class="grid col--center col--span-1">${high}-${low}</div>
         <div class="grid col--center col--span-1">${result}</div>`;

    return `<div class="grid col--start grid--cols-5 ${bgClass}" style="font-weight:600;border-radius:10px;padding:5px;">
  <div class="grid col--center col--span-1">${formatShortDate(d)}</div>
  <div class="grid col--center col--span-2" style="white-space:nowrap;">${matchup}</div>
  ${scoreOrStatus}
</div>`;
  }).join('');
}

export function upcomingGamesRows(teamId: number, upcoming: ProcessedGame[], utcOffsetSeconds: number, limit = 4): string {
  const future = upcoming.slice(1, limit + 1);
  if (future.length === 0) {
    return `<p class="text--center w--full">No Upcoming Games</p>`;
  }
  return future.map(game => {
    const d = toUserDate(game.gameDate, utcOffsetSeconds);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    return `<div class="grid col--start grid--cols-5 bg--black" style="font-weight:600;border-radius:10px;padding:5px;">
  <div class="grid col--center col--span-1 text--white">${formatShortDate(d)}</div>
  <div class="grid col--center col--span-2 text--white" style="white-space:nowrap;">${matchupAbbr(teamId, game)}</div>
  <div class="grid col--center col--span-1 text--white">${weekday}</div>
  <div class="grid col--center col--span-1 text--white">${formatTime(d)}</div>
</div>`;
  }).join('');
}
