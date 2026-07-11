import {
  type RenderOptions,
  TRMNL_ASSETS,
  getRecord,
  titleBar,
  nextGameCard,
} from './helpers';

export function renderQuadrant(opts: RenderOptions): string {
  const { teamId, teamName, schedule, utcOffsetSeconds, logoSvg, oppLogoSvg } = opts;
  const { previous, upcoming } = schedule;
  const record = getRecord(teamId, [...previous, ...upcoming]);

  return `${TRMNL_ASSETS}
<div class="view view--quadrant">
  <div class="layout">
    <div class="card flex flex--col flex--stretch-x">
      ${nextGameCard(teamId, upcoming, utcOffsetSeconds, oppLogoSvg, 70, { myTeam: 13, opp: 18, datetime: 13 }, false, false)}
    </div>
  </div>
  ${titleBar(teamName, record, logoSvg)}
</div>`;
}
