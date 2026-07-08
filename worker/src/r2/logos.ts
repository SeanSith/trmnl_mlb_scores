const MLB_LOGO_BASE = 'https://www.mlbstatic.com/team-logos';

const r2Key = (teamId: number) => `logo-${teamId}.svg`;

export async function getLogoSvg(r2: R2Bucket, teamId: number): Promise<string> {
  const cached = await r2.get(r2Key(teamId));
  if (cached) return cached.text();

  const res = await fetch(`${MLB_LOGO_BASE}/${teamId}.svg`);
  if (!res.ok) throw new Error(`Logo fetch failed for team ${teamId}: ${res.status}`);
  const svg = await res.text();

  await r2.put(r2Key(teamId), svg, {
    httpMetadata: { contentType: 'image/svg+xml' },
  });

  return svg;
}
