import type { ProcessedGame } from '../mlb/types';
import {
  type RenderOptions,
  TRMNL_ASSETS,
  getRecord,
  toUserDate,
  formatShortDate,
  titleBar,
  nextGameCard,
  previousGamesRows,
} from './helpers';

export function renderHalfVertical(opts: RenderOptions): string {
  const { teamId, teamName, schedule, utcOffsetSeconds, logoSvg, oppLogoSvg } = opts;
  const { previous, upcoming } = schedule;
  const record = getRecord(teamId, [...previous, ...upcoming]);
  const tiles = renderUpcomingTiles(teamId, upcoming, utcOffsetSeconds, 3);

  return `${TRMNL_ASSETS}
<div class="view view--half_vertical">
  <div class="layout layout--col">
    ${tiles ? `<div class="flex flex--row w--full gap--xsmall text--center">${tiles}</div>` : ''}
    <div class="card flex flex--col flex--stretch-x">
      ${nextGameCard(teamId, upcoming, utcOffsetSeconds, oppLogoSvg, 100)}
    </div>
    <div class="flex flex--col">
      ${previousGamesRows(teamId, previous, utcOffsetSeconds, 3)}
    </div>
  </div>
  ${titleBar(teamName, record, logoSvg)}
</div>`;
}

function renderUpcomingTiles(teamId: number, upcoming: ProcessedGame[], utcOffsetSeconds: number, limit: number): string {
  if (upcoming.length <= 1) return '';
  return upcoming.slice(1, limit + 1).map(game => {
    const d = toUserDate(game.gameDate, utcOffsetSeconds);
    const isHome = game.home.teamId === teamId;
    const matchup = isHome
      ? `${game.home.abbreviation} vs ${game.away.abbreviation}`
      : `${game.away.abbreviation} @ ${game.home.abbreviation}`;
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    return `<div class="flex flex--col flex--center-x flex--center-y p--2 bg--black" style="width:calc(100%/${limit});border-radius:10px;">
  <div style="font-weight:600;font-size:13px;"><span class="text--white">${matchup}</span></div>
  <div style="font-weight:600;font-size:11px;"><span class="text--white">${weekday} &middot; ${formatShortDate(d)}</span></div>
</div>`;
  }).join('');
}
