import {
  type RenderOptions,
  TRMNL_ASSETS,
  getRecord,
  titleBar,
  nextGameCard,
  previousGamesRows,
} from './helpers';

export function renderHalfHorizontal(opts: RenderOptions): string {
  const { teamId, teamName, schedule, utcOffsetSeconds, logoSvg, oppLogoSvg } = opts;
  const { previous, upcoming } = schedule;
  const record = getRecord(teamId, [...previous, ...upcoming]);

  return `${TRMNL_ASSETS}
<div class="view view--half_horizontal">
  <div class="layout layout--row">
    <div class="card flex flex--col flex--stretch-x">
      ${nextGameCard(teamId, upcoming, utcOffsetSeconds, oppLogoSvg, 80)}
    </div>
    <div class="card flex flex--col flex--stretch-x">
      <div class="title flex bg--gray-5 pt--1 pb--1"><p class="text--center w--full">Previous Games</p></div>
      <div class="flex flex--col">
        ${previousGamesRows(teamId, previous, utcOffsetSeconds, 5)}
      </div>
    </div>
  </div>
  ${titleBar(teamName, record, logoSvg)}
</div>`;
}
