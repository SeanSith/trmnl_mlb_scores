import {
  type RenderOptions,
  TRMNL_ASSETS,
  getRecord,
  titleBar,
  nextGameCard,
  previousGamesRows,
  upcomingGamesRows,
} from './helpers';

export function renderHalfHorizontal(opts: RenderOptions): string {
  const { teamId, teamName, schedule, utcOffsetSeconds, logoSvg, oppLogoSvg } = opts;
  const { previous, upcoming } = schedule;
  const record = getRecord(teamId, [...previous, ...upcoming]);

  return `${TRMNL_ASSETS}
<div class="view view--half_horizontal">
  <div class="layout layout--row">
    <div class="card flex flex--col" style="flex:3;min-width:0;">
      ${upcomingGamesRows(teamId, upcoming, utcOffsetSeconds, 4)}
    </div>
    <div class="card flex flex--col" style="flex:2;min-width:0;">
      ${nextGameCard(teamId, upcoming, utcOffsetSeconds, oppLogoSvg, 45, { myTeam: 11, opp: 15, datetime: 11 }, false, false)}
    </div>
    <div class="card flex flex--col" style="flex:3;min-width:0;">
      <div class="flex flex--col">
        ${previousGamesRows(teamId, previous, utcOffsetSeconds, 5)}
      </div>
    </div>
  </div>
  ${titleBar(teamName, record, logoSvg)}
</div>`;
}

