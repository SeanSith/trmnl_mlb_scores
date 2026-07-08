import type { ProcessedGame } from '../mlb/types';
import {
  type RenderOptions,
  TRMNL_ASSETS,
  getRecord,
  toUserDate,
  formatDate,
  formatTime,
  logoDataUri,
  titleBar,
  nextGameCard,
  previousGamesRows,
} from './helpers';

export function renderFull(opts: RenderOptions): string {
  const { teamId, teamName, schedule, utcOffsetSeconds, logoSvg, oppLogoSvg } = opts;
  const { previous, upcoming } = schedule;
  const record = getRecord(teamId, [...previous, ...upcoming]);

  return `${TRMNL_ASSETS}
<style>
  #upcoming_games { font-size: 12px; min-height: 50px; }
  #upcoming_games .game { width: calc(100% / 5); border-radius: 10px; }
  #upcoming_games .game .matchup { font-weight: 600; font-size: 18px; }
  #upcoming_games .game .dayofweek { font-weight: 600; font-size: 14px; }
  #upcoming_games .game .gametime { font-weight: 600; font-size: 14px; }
</style>

<div id="mlb-scores" class="view view--full">
  <div class="flex flex--col w--full h--full">
    <div id="upcoming_games" class="flex flex--row w--full gap--xsmall text--center">
      ${renderUpcomingGames(teamId, upcoming, utcOffsetSeconds)}
    </div>
    <div class="flex flex--row flex--center-x flex--stretch w--full flex--content-between">
      <div class="card flex flex--col flex--stretch-x">
        ${nextGameCard(teamId, upcoming, utcOffsetSeconds, oppLogoSvg, 140)}
      </div>
      <div class="card flex flex--col flex--stretch-x">
        <div class="title flex bg--gray-5 pt--1 pb--1"><p class="text--center w--full">Previous Games</p></div>
        <div class="flex flex--col">
          ${previousGamesRows(teamId, previous, utcOffsetSeconds, 7)}
        </div>
      </div>
    </div>
  </div>
  ${titleBar(teamName, record, logoSvg)}
</div>`;
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
    return `<div class="game flex flex--col flex--center-x flex--center-y p--2 bg--black">
  <div class="matchup"><span class="text--white">${matchup}</span></div>
  <div class="dayofweek"><span class="text--white">${weekday}</span></div>
  <div class="gametime"><span class="text--white">${formatDate(d)} &middot; ${formatTime(d)}</span></div>
</div>`;
  }).join('');
}
