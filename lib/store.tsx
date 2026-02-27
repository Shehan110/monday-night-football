"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import type { Player, Match, DraftState, Season, AppNotification, LeagueRules } from "./types"
import { initialPlayers, initialMatches } from "./mock-data"

type Role = "none" | "player" | "admin" | "captainA" | "captainB"

interface AppState {
  players: Player[]
  matches: Match[]
  isAdmin: boolean
  role: Role
  draft: DraftState
  seasons: Season[]
  currentSeasonName: string
  setPlayers: (players: Player[] | ((prev: Player[]) => Player[])) => void
  setMatches: (matches: Match[] | ((prev: Match[]) => Match[])) => void
  loginAdmin: (password: string) => boolean
  loginCaptain: (password: string) => "A" | "B" | false
  logoutAdmin: () => void
  enterAsPlayer: () => void
  loginPlayer: (password: string) => boolean
  resetPlayerPassword: (playerId: string) => void
  loggedInPlayerId: string | null
  changePassword: (currentPassword: string, newPassword: string) => boolean
  changePlayerPassword: (playerId: string, currentPassword: string, newPassword: string) => boolean
  isCaptain: boolean
  captainTeam: "A" | "B" | null
  setDraft: (draft: DraftState | ((prev: DraftState) => DraftState)) => void
  updatePlayer: (id: string, updates: Partial<Player>) => void
  addPlayer: (player: Player) => void
  removePlayer: (id: string) => void
  addMatch: (match: Match) => void
  deleteMatch: (matchId: string) => void
  updateMatch: (matchId: string, updated: Match) => void
  notifications: AppNotification[]
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  unreadAdminCount: number
  unreadPlayerCount: (playerId: string) => number
  registrationOpen: boolean
  endSeason: () => void
  startNewSeason: (name: string) => void
  setCurrentSeasonName: (name: string) => void
  paymentLink: string
  setPaymentLink: (link: string) => void
  leagueRules: LeagueRules
  setLeagueRules: (rules: LeagueRules) => void
  startNewMatchWeek: () => void
}

const defaultDraft: DraftState = {
  matchFormat: "7v7",
  matchType: "league",
  pairs: [],
  tossCaller: null,
  coinTossWinner: null,
  teamA: [],
  teamB: [],
  captainA: null,
  captainB: null,
  captainAPassword: null,
  captainBPassword: null,
  currentPick: null,
  step: "setup",
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [isAdmin, setIsAdmin] = useState(false)
  const [role, setRole] = useState<Role>("none")
  const [adminPassword, setAdminPassword] = useState("mnf2026")
  const [draft, setDraft] = useState<DraftState>(defaultDraft)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [currentSeasonName, setCurrentSeasonName] = useState("MNF 2025")
  const [loggedInPlayerId, setLoggedInPlayerId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [paymentLink, setPaymentLink] = useState("https://monzo.me/alishaansheikh?h=oAFbfG")
  const [leagueRules, setLeagueRules] = useState<LeagueRules>({
    matchDay: 1,
    registrationOpenDay: 3,
    registrationOpenHour: 12,
    maxSpots: 14,
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
    penaltyEarly: 1,
    penaltyLate: 3,
    penaltyEarlyLabel: "Withdrew after Wednesday",
    penaltyLateLabel: "Withdrew on match day (Monday)",
    noPenaltyLabel: "Before Thursday",
  })

  // Registration open logic based on configurable rules
  const isRegistrationOpen = useCallback(() => {
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()
    const openDay = leagueRules.registrationOpenDay
    const openHour = leagueRules.registrationOpenHour
    const matchDay = leagueRules.matchDay

    // On the opening day, only open after the configured hour
    if (day === openDay && hour >= openHour) return true
    // Days between open day and match day (wrapping around the week)
    if (openDay < matchDay) {
      // e.g. Wed(3) to Mon(1) wraps: open if day > 3 OR day <= 1
      return day > openDay || day <= matchDay
    } else {
      // e.g. if open=Fri(5), match=Mon(1): open if day > 5 OR day <= 1
      return day > openDay || day <= matchDay
    }
  }, [leagueRules])

  const registrationOpen = isRegistrationOpen()

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    const notif: AppNotification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    setNotifications((prev) => [notif, ...prev])
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadAdminCount = notifications.filter((n) => n.forAdmin && !n.read).length
  const unreadPlayerCount = useCallback((playerId: string) => {
    return notifications.filter((n) => n.forPlayerId === playerId && !n.read).length
  }, [notifications])

  const endSeason = useCallback(() => {
    const archived: Season = {
      id: `season-${Date.now()}`,
      name: currentSeasonName,
      players: [...players],
      matches: [...matches],
      endedAt: new Date().toISOString(),
    }
    setSeasons((prev) => [archived, ...prev])
  }, [currentSeasonName, players, matches])

  const startNewSeason = useCallback((name: string) => {
    // Reset all player stats but keep the player roster
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        captainCount: 0,
        minusPoints: 0,
        goalDifference: 0,
        points: 0,
        goals: 0,
        form: [],
        previousPosition: 0,
        registrationStatus: "out" as const,
        registeredAt: null,
        paid: false,
        isWinningTeam: false,
      }))
    )
    setMatches([])
    setDraft(defaultDraft)
    setCurrentSeasonName(name)
  }, [])

  const loginAdmin = useCallback((password: string): boolean => {
    if (password === adminPassword) {
      setIsAdmin(true)
      setRole("admin")
      return true
    }
    return false
  }, [adminPassword])

  const loginCaptain = useCallback((password: string): "A" | "B" | false => {
    if (draft.captainAPassword && password === draft.captainAPassword) {
      setRole("captainA")
      return "A"
    }
    if (draft.captainBPassword && password === draft.captainBPassword) {
      setRole("captainB")
      return "B"
    }
    return false
  }, [draft.captainAPassword, draft.captainBPassword])

  const isCaptain = role === "captainA" || role === "captainB"
  const captainTeam: "A" | "B" | null = role === "captainA" ? "A" : role === "captainB" ? "B" : null

  const logoutAdmin = useCallback(() => {
    // Don't clear localStorage -- "remember me" should persist across sessions.
    // Auto-login only runs once on app startup (AppProvider mount), not on exit.
    setIsAdmin(false)
    setRole("none")
    setLoggedInPlayerId(null)
  }, [])

  // Auto-login from "remember me" on first mount only (AppProvider never unmounts)
  const autoLoginDone = useRef(false)
  useEffect(() => {
    if (autoLoginDone.current) return
    autoLoginDone.current = true
    try {
      const savedAdmin = localStorage.getItem("mnf_remember_admin")
      if (savedAdmin === adminPassword) {
        setIsAdmin(true)
        setRole("admin")
        return
      }
      const savedPlayer = localStorage.getItem("mnf_remember_player")
      if (savedPlayer) {
        const found = initialPlayers.find((p) => p.password === savedPlayer)
        if (found) {
          setRole("player")
          setLoggedInPlayerId(found.id)
          return
        }
        localStorage.removeItem("mnf_remember_player")
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enterAsPlayer = useCallback(() => {
    setIsAdmin(false)
    setRole("player")
    setLoggedInPlayerId(null)
  }, [])

  const loginPlayer = useCallback((password: string): boolean => {
    const player = players.find((p) => p.password === password)
    if (player) {
      setRole("player")
      setLoggedInPlayerId(player.id)

      // Push "registration open" notification if spots are available
      if (isRegistrationOpen()) {
        addNotification({
          type: "registration_open",
          message: "Spots are open for next Monday's match!",
          detail: "Head to Registration to confirm your availability.",
          forPlayerId: player.id,
        })
      }

      return true
    }
    return false
  }, [players, isRegistrationOpen, addNotification])

  const resetPlayerPassword = useCallback((playerId: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, password: p.name.toLowerCase() } : p)))
  }, [])

  const changePlayerPassword = useCallback((playerId: string, currentPassword: string, newPassword: string): boolean => {
    const player = players.find((p) => p.id === playerId)
    if (player && player.password === currentPassword && newPassword.length >= 1) {
      setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, password: newPassword } : p)))
      return true
    }
    return false
  }, [players])

  const changePassword = useCallback((currentPassword: string, newPassword: string): boolean => {
    if (currentPassword === adminPassword && newPassword.length >= 4) {
      setAdminPassword(newPassword)
      return true
    }
    return false
  }, [adminPassword])

  const updatePlayer = useCallback((id: string, updates: Partial<Player>) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }, [])

  const addPlayer = useCallback((player: Player) => {
    setPlayers((prev) => [...prev, player])
  }, [])

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // Apply or reverse league match stats on players
  const applyMatchStats = useCallback((match: Match, reverse: boolean) => {
    if (match.matchType !== "league") return
    const factor = reverse ? -1 : 1
    const teamAWon = match.teamAScore > match.teamBScore
    const teamBWon = match.teamBScore > match.teamAScore
    const isDraw = match.teamAScore === match.teamBScore
    const gd = match.teamAScore - match.teamBScore

    setPlayers((prev) =>
      prev.map((p) => {
        const isTeamA = match.teamA.includes(p.id)
        const isTeamB = match.teamB.includes(p.id)
        if (!isTeamA && !isTeamB) return p

        const won = isTeamA ? teamAWon : teamBWon
        const lost = isTeamA ? teamBWon : teamAWon
        const playerGd = isTeamA ? gd : -gd

        // Goals scored by this player in this match (own goals excluded)
        const playerGoals = match.goalScorers
          .filter((gs) => gs.playerId === p.id && !gs.isOwnGoal)
          .reduce((sum, gs) => sum + gs.goals, 0)

        // Form entry
        const formEntry: import("./types").FormResult = won ? "W" : isDraw ? "D" : "L"
        const newForm = reverse
          ? p.form.slice(0, -1) // remove last entry
          : [...p.form, formEntry]

        const newPlayed = p.played + factor
        const newWon = p.won + (won ? factor : 0)
        const newDrawn = p.drawn + (isDraw ? factor : 0)
        const newLost = p.lost + (lost ? factor : 0)
        const newGd = p.goalDifference + playerGd * factor
        const newGoals = p.goals + playerGoals * factor
        const newPoints = newWon * leagueRules.winPoints + newDrawn * leagueRules.drawPoints + newLost * leagueRules.lossPoints - p.minusPoints

        return {
          ...p,
          played: Math.max(0, newPlayed),
          won: Math.max(0, newWon),
          drawn: Math.max(0, newDrawn),
          lost: Math.max(0, newLost),
          goalDifference: newGd,
          goals: Math.max(0, newGoals),
          points: Math.max(0, newPoints),
          form: newForm,
        }
      })
    )
  }, [])

  const addMatch = useCallback((match: Match) => {
    setMatches((prev) => [match, ...prev])
    applyMatchStats(match, false)
  }, [applyMatchStats])

  const deleteMatch = useCallback((matchId: string) => {
    setMatches((prev) => {
      const match = prev.find((m) => m.id === matchId)
      if (match) {
        // Reverse the stats before removing
        applyMatchStats(match, true)
      }
      return prev.filter((m) => m.id !== matchId)
    })
  }, [applyMatchStats])

  const updateMatch = useCallback((matchId: string, updated: Match) => {
    setMatches((prev) => {
      const old = prev.find((m) => m.id === matchId)
      if (old) {
        // Reverse old stats, apply new
        applyMatchStats(old, true)
      }
      applyMatchStats(updated, false)
      return prev.map((m) => (m.id === matchId ? updated : m))
    })
  }, [applyMatchStats])

  const startNewMatchWeek = () => {
    // Find the last league match (most recent by date, then by array position)
    const leagueMatches = matches.filter((m) => m.matchType === "league")
    const sorted = [...leagueMatches].sort((a, b) => b.date.localeCompare(a.date))
    const lastLeagueMatch = sorted.length > 0 ? sorted[0] : null

    // Determine winning team player IDs (only if it wasn't a draw and was a league match)
    let winnerIds: string[] = []
    if (lastLeagueMatch && lastLeagueMatch.teamAScore !== lastLeagueMatch.teamBScore) {
      winnerIds = lastLeagueMatch.teamAScore > lastLeagueMatch.teamBScore
        ? [...lastLeagueMatch.teamA]
        : [...lastLeagueMatch.teamB]
    }

    // Reset all players -- winners get "reserved", everyone else gets "out"
    setPlayers((prev) =>
      prev.map((p) => {
        const isWinner = winnerIds.includes(p.id)
        return {
          ...p,
          registrationStatus: isWinner ? "reserved" as const : "out" as const,
          paid: false,
          registeredAt: isWinner ? new Date().toISOString() : null,
          isWinningTeam: isWinner,
        }
      })
    )
    // Reset the draft back to setup
    setDraft(defaultDraft)
  }

  return (
    <AppContext.Provider
      value={{
        players,
        matches,
        isAdmin,
        role,
        draft,
        seasons,
        currentSeasonName,
        setPlayers,
        setMatches,
        loginAdmin,
        loginCaptain,
        logoutAdmin,
        enterAsPlayer,
        loginPlayer,
        resetPlayerPassword,
        loggedInPlayerId,
        changePassword,
        changePlayerPassword,
        isCaptain,
        captainTeam,
        setDraft,
        updatePlayer,
        addPlayer,
        removePlayer,
        addMatch,
        deleteMatch,
        updateMatch,
        notifications,
        addNotification,
        markNotificationRead,
        clearNotifications,
        unreadAdminCount,
        unreadPlayerCount,
        registrationOpen,
        endSeason,
        startNewSeason,
        setCurrentSeasonName,
        paymentLink,
        setPaymentLink,
        leagueRules,
        setLeagueRules,
        startNewMatchWeek,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
