// Team type is also used in kv/teams.ts and mlb/api.ts
export interface Team {
  id: number;
  name: string;
  abbreviation: string;
}

export function logoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}
