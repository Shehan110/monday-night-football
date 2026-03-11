export type FormResult = "W" | "D" | "L"

export interface Player {
  id: string
  name: string
  password: string
  played: number
  won: number
  drawn: number
  lost: number
  captainCount: number
  minusPoints: number
  goalDifference: number
  points: number
  goals: number
  form: FormResult[]
  previousPosition: number
  registrationStatus: "out" | "in" | "reserved"
  registeredAt: string | null   // ISO timestamp of when they said "in" -- used for queue ordering
  paid: boolean
  isWinningTeam: boolean
  payDeadline?: string
  position?: string
}

export type MatchType = "league" | "friendly"

export interface Match {
  id: string
  date: string
  matchType: MatchType
  teamAScore: number
  teamBScore: number
  teamA: string[]
  teamB: string[]
  goalScorers: { playerId: string; goals: number; isOwnGoal?: boolean }[]
  highlightUrl?: string
}

export interface DraftPair {
  id: string
  player1Id: string
  player2Id: string
}

export type MatchFormat = "6v6" | "7v7"

export interface DraftState {
  matchFormat: MatchFormat
  matchType: MatchType
  pairs: DraftPair[]
  tossCaller: "A" | "B" | null
  coinTossWinner: "A" | "B" | null
  teamA: string[]
  teamB: string[]
  captainA: string | null
  captainB: string | null
  captainAPassword: string | null
  captainBPassword: string | null
  currentPick: "A" | "B" | null
  step: "setup" | "pairing" | "toss" | "pick" | "done"
}

export interface AppNotification {
  id: string
  type: "dropout" | "registration_open"
  message: string
  detail?: string
  timestamp: string
  read: boolean
  forAdmin?: boolean
  forPlayerId?: string
}

export interface Season {
  id: string
  name: string
  players: Player[]
  matches: Match[]
  endedAt: string
}

export interface LeagueRules {
  matchDay: number                 // 0=Sun, 1=Mon, ... 6=Sat
  registrationOpenDay: number      // Day registration opens
  registrationOpenHour: number     // Hour registration opens (24h)
  maxSpots: number                 // Max confirmed players per match
  winPoints: number                // Points for a win
  drawPoints: number               // Points for a draw
  lossPoints: number               // Points for a loss
  penaltyEarly: number             // Penalty for dropping out early (after reg opens but before late period)
  penaltyLate: number              // Penalty for dropping out on match day
  penaltyEarlyLabel: string        // e.g. "Withdrew after Wednesday"
  penaltyLateLabel: string         // e.g. "Withdrew on match day (Monday)"
  noPenaltyLabel: string           // e.g. "Before Thursday"
}
