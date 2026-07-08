import type { TeamSchedule, ProcessedGame } from '../mlb/types';
import { logoUrl } from '../teams';

interface RenderOptions {
  teamId: number;
  teamName: string;
  teamAbbr: string;
  schedule: TeamSchedule;
  utcOffsetSeconds: number;
  logoSvg: string;
}

export function renderFull(opts: RenderOptions): string {
  const { teamId, teamName, schedule, utcOffsetSeconds, logoSvg } = opts;
  const { previous, upcoming } = schedule;

  const record = getRecord(teamId, [...previous, ...upcoming]);
  const footer = renderFooter(teamName, record, logoSvg);
  const nextGameHtml = renderNextGame(teamId, upcoming, utcOffsetSeconds);
  const previousHtml = renderPreviousGames(teamId, previous, utcOffsetSeconds);
  const upcomingRowHtml = renderUpcomingRow(teamId, upcoming, utcOffsetSeconds);

  return `<div id="mlb-scores" class="flex flex--col w--full h--full">
  <div class="flex flex--row w--full gap--xsmall text--center">${upcomingRowHtml}</div>
  <div class="flex flex--row flex--center-x flex--stretch w--full flex--content-between">
    <div class="card flex flex--col flex--stretch-x">
      ${nextGameHtml}
    </div>
    <div class="card flex flex--col flex--stretch-x">
      <div class="title flex pt--1 pb--1" style="background:var(--gray-5)">
        <p class="text--center w--full">Previous Games</p>
      </div>
      <div class="flex flex--col">${previousHtml}</div>
    </div>
  </div>
</div>
<div class="title_bar">${footer}</div>`;
}

function getRecord(teamId: number, games: ProcessedGame[]): { wins: number; losses: number; pct: string } {
  const game = [...games].reverse().find(g =>
    g.home.teamId === teamId || g.away.teamId === teamId
  );
  if (!game) return { wins: 0, losses: 0, pct: '.000' };
  const side = game.home.teamId === teamId ? game.home : game.away;
  return { wins: side.wins, losses: side.losses, pct: side.pct };
}

function toUserDate(date: Date, utcOffsetSeconds: number): Date {
  return new Date(date.getTime() + utcOffsetSeconds * 1000);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).toLowerCase();
}

function formatShortDate(date: Date): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${m}/${d}`;
}

function renderFooter(teamName: string, record: { wins: number; losses: number; pct: string }, logoSvg: string): string {
  const encoded = `data:image/svg+xml;base64,${btoa(logoSvg)}`;
  return `<img src="${encoded}" class="image" alt="${teamName} logo">
  <span class="instance"><strong>${teamName}</strong> (${record.wins} - ${record.losses})</span>`;
}

function renderNextGame(teamId: number, upcoming: ProcessedGame[], utcOffsetSeconds: number): string {
  if (upcoming.length === 0) {
    return `<div class="title flex pt--1 pb--1" style="background:var(--gray-5)">
      <p class="text--center w--full">No Upcoming Games</p>
    </div>`;
  }

  const game = upcoming[0];
  const userDate = toUserDate(game.gameDate, utcOffsetSeconds);
  const isHome = game.home.teamId === teamId;
  const opp = isHome ? game.away : game.home;
  const sep = isHome ? 'vs' : '@';

  const today = toUserDate(new Date(), utcOffsetSeconds);
  const isToday = userDate.getUTCFullYear() === today.getUTCFullYear()
    && userDate.getUTCMonth() === today.getUTCMonth()
    && userDate.getUTCDate() === today.getUTCDate();

  let title = 'Next Game';
  if (game.statusCode === 'I') title = 'Current Game';
  else if (isToday) title = "Today's Game";

  return `<div class="title flex pt--1 pb--1" style="background:var(--gray-5)">
    <p class="text--center w--full">${title}</p>
  </div>
  <div class="flex flex--col flex--center-y h--full">
    <div class="flex w--full flex--center-x" style="font-size:18px">
      ${isHome ? game.home.name : game.away.name} ${sep}
    </div>
    <div class="flex w--full flex--center-x" style="font-size:25px">
      <strong>${opp.name}</strong>
    </div>
    <div class="flex w--full flex--center-x">
      <img src="${logoUrl(opp.teamId)}" alt="${opp.name}" style="width:140px;height:140px;margin:0 auto">
    </div>
    <div class="flex w--full flex--center-x" style="margin-top:5px;font-size:20px">
      ${formatDate(userDate)} &middot; ${formatTime(userDate)}
    </div>
  </div>`;
}

function renderUpcomingRow(teamId: number, upcoming: ProcessedGame[], utcOffsetSeconds: number): string {
  if (upcoming.length <= 1) return '';
  return upcoming.slice(1, 6).map(game => {
    const userDate = toUserDate(game.gameDate, utcOffsetSeconds);
    const isHome = game.home.teamId === teamId;
    const matchup = isHome
      ? `${game.home.abbreviation} vs ${game.away.abbreviation}`
      : `${game.away.abbreviation} @ ${game.home.abbreviation}`;
    const weekday = userDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    return `<div class="flex flex--col flex--center-x flex--center-y p--2" style="width:calc(100%/5);border-radius:10px;background:#000">
      <div style="font-weight:600;font-size:18px"><span style="color:#fff">${matchup}</span></div>
      <div style="font-weight:600;font-size:14px"><span style="color:#fff">${weekday}</span></div>
      <div style="font-weight:600;font-size:14px"><span style="color:#fff">${formatDate(userDate)} &middot; ${formatTime(userDate)}</span></div>
    </div>`;
  }).join('');
}

function renderPreviousGames(teamId: number, previous: ProcessedGame[], utcOffsetSeconds: number): string {
  if (previous.length === 0) {
    return `<div class="flex flex--row flex--center-x flex--center-y p--5">
      <div class="w--full">No previous games</div>
    </div>`;
  }

  return previous.slice(-7).reverse().map(game => {
    const isHome = game.home.teamId === teamId;
    const myScore = isHome ? (game.home.score ?? 0) : (game.away.score ?? 0);
    const oppScore = isHome ? (game.away.score ?? 0) : (game.home.score ?? 0);
    const result = myScore > oppScore ? 'W' : 'L';
    const bgStyle = result === 'L' ? 'background:var(--gray-6)' : '';
    const matchup = isHome
      ? `${game.home.abbreviation} vs. ${game.away.abbreviation}`
      : `${game.away.abbreviation} @ ${game.home.abbreviation}`;
    const highScore = Math.max(myScore, oppScore);
    const lowScore = Math.min(myScore, oppScore);
    const score = `${highScore}-${lowScore}`;
    const userDate = toUserDate(game.gameDate, utcOffsetSeconds);
    const dateStr = formatShortDate(userDate);

    const scoreOrStatus = game.statusCode !== 'F'
      ? `<div class="grid col--center col--span-2" style="font-size:14px">${game.detailedState}${game.statusReason ? ` - ${game.statusReason}` : ''}</div>`
      : `<div class="grid col--center col--span-1">${score}</div>
         <div class="grid col--center col--span-1">${result}</div>`;

    return `<div class="grid col--start grid--cols-5" style="font-weight:600;border-radius:10px;padding:5px;${bgStyle}">
      <div class="grid col--center col--span-1">${dateStr}</div>
      <div class="grid col--center col--span-2">${matchup}</div>
      ${scoreOrStatus}
    </div>`;
  }).join('');
}
