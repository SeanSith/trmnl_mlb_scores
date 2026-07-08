export interface MLBTeamsResponse {
  teams: MLBTeam[];
}

export interface MLBTeam {
  id: number;
  name: string;
  abbreviation: string;
}

export interface MLBScheduleResponse {
  dates: MLBDate[];
  totalGames: number;
}

export interface MLBDate {
  date: string;
  games: MLBGame[];
}

export interface MLBGame {
  gamePk: number;
  gameDate: string;
  officialDate: string;
  status: {
    abstractGameState: string;
    codedGameState: string;
    detailedState: string;
    statusCode: string;
    startTimeTBD: boolean;
    reason?: string;
  };
  teams: {
    home: MLBTeamEntry;
    away: MLBTeamEntry;
  };
}

export interface MLBTeamEntry {
  team: {
    id: number;
    name: string;
    abbreviation: string;
    link: string;
  };
  leagueRecord: {
    wins: number;
    losses: number;
    pct: string;
  };
  score?: number;
  isWinner?: boolean;
  splitSquad: boolean;
}

export interface ProcessedGame {
  gamePk: number;
  gameDate: Date;
  statusCode: string;
  detailedState: string;
  statusReason: string;
  home: TeamGameInfo;
  away: TeamGameInfo;
}

export interface TeamGameInfo {
  teamId: number;
  name: string;
  abbreviation: string;
  score: number | undefined;
  wins: number;
  losses: number;
  pct: string;
}

export interface TeamSchedule {
  previous: ProcessedGame[];
  upcoming: ProcessedGame[];
}

// team_name and team_abbreviation are resolved at install time so screen
// generation never needs a separate teams lookup.
export interface UserRecord {
  team_id: number;
  team_name: string;
  team_abbreviation: string;
  access_token: string;
  raw?: TRMNLInstallUser;
}

export interface TRMNLInstallUser {
  id: number;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  locale: string;
  time_zone: string;
  time_zone_iana: string;
  utc_offset: number;
  plugin_setting_id: number;
  uuid: string;
}

export interface TRMNLMeta {
  user: {
    name: string;
    first_name: string;
    last_name: string;
    locale: string;
    time_zone: string;
    time_zone_iana: string;
    utc_offset: number;
  };
  device: {
    friendly_id: string;
    percent_charged: number;
    wifi_strength: number;
    height: number;
    width: number;
  };
  system: {
    timestamp_utc: number;
  };
  plugin_settings: {
    instance_name: string;
  };
}

export interface ScreenResponse {
  markup: string;
  markup_half_horizontal: string;
  markup_half_vertical: string;
  markup_quadrant: string;
  shared: string;
}
