import { describe, it, expect } from 'vitest';
import { logoUrl } from '../src/teams';

describe('logoUrl', () => {
  it('returns the mlbstatic URL for a team id', () => {
    expect(logoUrl(137)).toBe('https://www.mlbstatic.com/team-logos/137.svg');
  });

  it('works for any numeric id', () => {
    expect(logoUrl(119)).toBe('https://www.mlbstatic.com/team-logos/119.svg');
  });
});
