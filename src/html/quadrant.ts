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
  <div class="flex flex--col w--full h--full">
    <div class="card flex flex--col flex--stretch-x h--full">
      ${nextGameCard(teamId, upcoming, utcOffsetSeconds, oppLogoSvg, 60)}
    </div>
  </div>
  ${titleBar(teamName, record, logoSvg)}
</div>`;
}
