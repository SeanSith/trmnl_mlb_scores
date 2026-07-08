import type { TeamSchedule, ProcessedGame } from '../mlb/types';

interface RenderOptions {
  teamId: number;
  teamName: string;
  teamAbbr: string;
  schedule: TeamSchedule;
  utcOffsetSeconds: number;
  logoSvg: string;
  oppLogoSvg: string | null;
}

export function renderFull(opts: RenderOptions): string {
  const { teamId, teamName, schedule, utcOffsetSeconds, logoSvg, oppLogoSvg } = opts;
  const { previous, upcoming } = schedule;

  const record = getRecord(teamId, [...previous, ...upcoming]);
  const upcomingHtml = renderUpcomingGames(teamId, upcoming, utcOffsetSeconds);
  const nextGameHtml = renderNextGame(teamId, upcoming, utcOffsetSeconds, oppLogoSvg);
  const previousHtml = renderPreviousGames(teamId, previous, utcOffsetSeconds);
  const logoB64 = `data:image/svg+xml;base64,${btoa(logoSvg)}`;

  return `<link rel="stylesheet" href="https://trmnl.com/css/latest/plugins.css">
<script src="https://trmnl.com/js/latest/plugins.js"></script>
<style>
  #upcoming_games { font-size: 12px; min-height: 50px; }
  #upcoming_games .game { width: calc(100% / 5); border-radius: 10px; }
  #upcoming_games .game .matchup { font-weight: 600; font-size: 18px; }
  #upcoming_games .game .dayofweek { font-weight: 600; font-size: 14px; }
  #upcoming_games .game .gametime { font-weight: 600; font-size: 14px; }
  .card .title { border-radius: 10px; }
  #next_game #my_team { font-size: 18px; }
  #next_game #matchup { font-size: 25px; margin-bottom: 0; }
  #next_game img { width: 140px; height: 140px; margin: 0 auto; }
  #next_game #datetime { margin-top: 5px; font-size: 20px; }
  #previous_games_row { font-weight: 600; border-radius: 10px; padding: 5px; }
  #not_final { font-size: 14px; }
</style>

<div id="mlb-scores" class="view view--full">
  <div class="flex flex--col w--full h--full">
    <div id="upcoming_games" class="flex flex--row w--full gap--xsmall text--center">
      ${upcomingHtml}
    </div>
    <div class="flex flex--row flex--center-x flex--stretch w--full flex--content-between">
      <div id="card--left" class="card flex flex--col flex--stretch-x">
        ${nextGameHtml}
      </div>
      <div id="card--right" class="card flex flex--col flex--stretch-x">
        <div class="title flex bg--gray-5 pt--1 pb--1"><p class="text--center w--full">Previous Games</p></div>
        <div id="previous_games" class="flex flex--col">
          ${previousHtml}
        </div>
      </div>
    </div>
  </div>
  <div class="title_bar">
    <img src="${logoB64}" alt="${teamName} logo" class="image">
    <span class="instance"><strong>${teamName}</strong> (${record.wins} - ${record.losses})</span>
  </div>
</div>`;
}

function getRecord(teamId: number, games: ProcessedGame[]): { wins: number; losses: number } {
  const game = [...games].reverse().find(g =>
    g.home.teamId === teamId || g.away.teamId === teamId
  );
  if (!game) return { wins: 0, losses: 0 };
  const side = game.home.teamId === teamId ? game.home : game.away;
  return { wins: side.wins, losses: side.losses };
}

function toUserDate(date: Date, utcOffsetSeconds: number): Date {
  return new Date(date.getTime() + utcOffsetSeconds * 1000);
}

function renderUpcomingGames(teamId: number, upcoming: ProcessedGame[], utcOffsetSeconds: number): string {
  if (upcoming.length <= 1) return '';
  return upcoming.slice(1, 6).map(game => {
    const d = toUserDate(game.gameDate, utcOffsetSeconds);
    const isHome = game.home.teamId === teamId;
    const matchup = isHome
      ? `${game.home.abbreviation} vs ${game.away.abbreviation}`
      : `${game.away.abbreviation} @ ${game.home.abbreviation}`;
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).toLowerCase();
    return `<div class="game flex flex--col flex--center-x flex--center-y p--2 bg--black">
      <div class="matchup"><span class="text--white">${matchup}</span></div>
      <div class="dayofweek"><span class="text--white">${weekday}</span></div>
      <div class="gametime"><span class="text--white">${date} &middot; ${time}</span></div>
    </div>`;
  }).join('');
}

function renderNextGame(teamId: number, upcoming: ProcessedGame[], utcOffsetSeconds: number, oppLogoSvg: string | null): string {
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

  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).toLowerCase();
  const logoImg = oppLogoSvg
    ? `<img src="data:image/svg+xml;base64,${btoa(oppLogoSvg)}" alt="${opp.name} logo">`
    : '';

  return `<div class="title flex bg--gray-5 pt--1 pb--1"><p class="text--center w--full">${title}</p></div>
  <div id="next_game" class="flex flex--col flex--center-y h--full">
    <div id="my_team" class="flex w--full flex--center-x">${myTeam.name} ${sep}</div>
    <div id="matchup" class="flex w--full flex--center-x"><span><strong>${opp.name}</strong></span></div>
    <div id="image" class="flex w--full flex--center-x">${logoImg}</div>
    <div id="datetime" class="flex w--full flex--center-x">${date} &middot; ${time}</div>
  </div>`;
}

function renderPreviousGames(teamId: number, previous: ProcessedGame[], utcOffsetSeconds: number): string {
  if (previous.length === 0) {
    return `<div class="flex flex--row flex--center-x flex--center-y p--5">
      <div class="value w--full">No previous games</div>
    </div>`;
  }

  return previous.slice(-7).reverse().map(game => {
    const isHome = game.home.teamId === teamId;
    const myScore = isHome ? (game.home.score ?? 0) : (game.away.score ?? 0);
    const oppScore = isHome ? (game.away.score ?? 0) : (game.home.score ?? 0);
    const result = myScore > oppScore ? 'W' : 'L';
    const bgClass = result === 'L' ? 'bg--gray-6' : '';
    const matchup = isHome
      ? `${game.home.abbreviation} vs. ${game.away.abbreviation}`
      : `${game.away.abbreviation} @ ${game.home.abbreviation}`;
    const d = toUserDate(game.gameDate, utcOffsetSeconds);
    const dateStr = `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`;
    const highScore = Math.max(myScore, oppScore);
    const lowScore = Math.min(myScore, oppScore);
    const formattedScore = `${highScore}-${lowScore}`;

    const scoreOrStatus = game.statusCode !== 'F'
      ? `<div id="not_final" class="grid col--center col--span-2">${game.detailedState}${game.statusReason ? ` - ${game.statusReason}` : ''}</div>`
      : `<div id="score" class="grid col--center col--span-1">${formattedScore}</div>
         <div id="result" class="grid col--center col--span-1">${result}</div>`;

    return `<div id="previous_games_row" class="grid col--start grid--cols-5 ${bgClass}">
      <div id="date" class="grid col--center col--span-1">${dateStr}</div>
      <div id="matchup" class="grid col--center col--span-2">${matchup}</div>
      ${scoreOrStatus}
    </div>`;
  }).join('');
}
