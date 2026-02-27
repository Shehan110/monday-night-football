"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clock, CreditCard, CheckCircle2, XCircle, Timer, Crown, AlertTriangle, KeyRound, Check, X, Banknote } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { LeagueRules } from "@/lib/types"

function getWithdrawalPenalty(rules: LeagueRules): { points: number; reason: string } | null {
  const day = new Date().getDay()
  if (day === rules.matchDay) return { points: rules.penaltyLate, reason: rules.penaltyLateLabel }
  // Check if we're in the "open" period (after registration opened, before match day)
  const openDay = rules.registrationOpenDay
  const matchDay = rules.matchDay
  const inOpenPeriod = openDay < matchDay
    ? (day > openDay && day < matchDay) || day === 0 // wrap for Sun
    : (day > openDay || day < matchDay)
  if (inOpenPeriod) return { points: rules.penaltyEarly, reason: rules.penaltyEarlyLabel }
  return null
}

function StatusBadge({ status, waitlistPos }: { status: "out" | "in" | "reserved"; waitlistPos?: number }) {
  if (waitlistPos && waitlistPos > 0) {
    return (
      <Badge variant="outline" className="text-[10px] font-semibold border-draw/40 bg-draw/10 text-draw">
        WAITLIST #{waitlistPos}
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-semibold",
        status === "in" && "border-win/40 bg-win/10 text-win",
        status === "out" && "border-loss/40 bg-loss/10 text-loss",
        status === "reserved" && "border-draw/40 bg-draw/10 text-draw"
      )}
    >
      {status === "in" ? "IN" : status === "out" ? "OUT" : "RESERVED"}
    </Badge>
  )
}

export function Registration() {
  const { players, isAdmin, updatePlayer, loggedInPlayerId, changePlayerPassword, registrationOpen, addNotification, paymentLink, leagueRules } = useApp()
  const [penaltyAlert, setPenaltyAlert] = useState<{ playerName: string; points: number; reason: string } | null>(null)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [pwError, setPwError] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [showDropConfirm, setShowDropConfirm] = useState(false)

  const loggedInPlayer = loggedInPlayerId ? players.find((p) => p.id === loggedInPlayerId) : null

  // ── Queue logic ────────────────────────────────────────────────
  // "in" players sorted by registeredAt timestamp (first come first served)
  const inPlayersSorted = players
    .filter((p) => p.registrationStatus === "in" && p.registeredAt)
    .sort((a, b) => new Date(a.registeredAt!).getTime() - new Date(b.registeredAt!).getTime())

  const confirmedPlayers = inPlayersSorted.slice(0, leagueRules.maxSpots)
  const waitlistPlayers = inPlayersSorted.slice(leagueRules.maxSpots)
  const reservedPlayers = players.filter((p) => p.registrationStatus === "reserved").sort((a, b) => a.name.localeCompare(b.name))
  const outPlayers = players.filter((p) => p.registrationStatus === "out").sort((a, b) => a.name.localeCompare(b.name))
  const spotsRemaining = Math.max(0, leagueRules.maxSpots - confirmedPlayers.length - reservedPlayers.length)
  const winningTeam = players.filter((p) => p.isWinningTeam)
  const paidCount = confirmedPlayers.filter((p) => p.paid).length

  // Get waitlist position for a player (0 = not on waitlist)
  const getWaitlistPos = (playerId: string): number => {
    const idx = waitlistPlayers.findIndex((p) => p.id === playerId)
    return idx >= 0 ? idx + 1 : 0
  }

  // Promote the first waitlisted player to confirmed when a spot opens
  const promoteFromWaitlist = () => {
    if (waitlistPlayers.length > 0) {
      const promoted = waitlistPlayers[0]
      addNotification({
        type: "registration_open",
        message: `A spot opened up! You've been moved to confirmed.`,
        detail: "Pay before the deadline to secure your place.",
        forPlayerId: promoted.id,
      })
      addNotification({
        type: "dropout",
        message: `${promoted.name} promoted from waitlist`,
        detail: "Moved to confirmed spot automatically.",
        forAdmin: true,
      })
    }
  }

  const handleStatusChange = (playerId: string, newStatus: "out" | "in" | "reserved") => {
    const player = players.find((p) => p.id === playerId)
    if (!player) return

    // Saying IN -- set timestamp for queue ordering
    if (newStatus === "in") {
      updatePlayer(playerId, {
        registrationStatus: "in",
        registeredAt: new Date().toISOString(),
      })
      return
    }

    // Saying OUT from "in" -- check penalty and promote waitlist
    if ((player.registrationStatus === "in" || player.registrationStatus === "reserved") && newStatus === "out") {
      const wasConfirmed = player.registrationStatus === "in" || player.registrationStatus === "reserved"
      const penalty = player.registrationStatus === "in" ? getWithdrawalPenalty(leagueRules) : null

      // Notify admin of dropout
      addNotification({
        type: "dropout",
        message: `${player.name} has dropped out`,
        detail: penalty
          ? `Penalty of -${penalty.points} point${penalty.points > 1 ? "s" : ""} applied (${penalty.reason.toLowerCase()})`
          : "No penalty applied",
        forAdmin: true,
      })

      if (penalty) {
        const newMinus = player.minusPoints + penalty.points
        const newPoints = player.won * 3 + player.drawn - newMinus
        updatePlayer(playerId, {
          registrationStatus: "out",
          registeredAt: null,
          minusPoints: newMinus,
          points: newPoints,
        })
        setPenaltyAlert({ playerName: player.name, points: penalty.points, reason: penalty.reason })
        setTimeout(() => setPenaltyAlert(null), 5000)
      } else {
        updatePlayer(playerId, { registrationStatus: "out", registeredAt: null })
      }

      // If they were in a confirmed spot, promote from waitlist
      if (wasConfirmed) {
        promoteFromWaitlist()
      }
      return
    }

    // All other status changes (admin moving to reserved, etc.)
    updatePlayer(playerId, {
      registrationStatus: newStatus,
      registeredAt: newStatus === "out" ? null : player.registeredAt,
    })
  }

  // ── Player's own status for display ────────────────────────────
  const myWaitlistPos = loggedInPlayer ? getWaitlistPos(loggedInPlayer.id) : 0
  const myIsConfirmed = loggedInPlayer
    ? confirmedPlayers.some((p) => p.id === loggedInPlayer.id)
    : false
  const myConfirmedPos = loggedInPlayer
    ? confirmedPlayers.findIndex((p) => p.id === loggedInPlayer.id) + 1
    : 0

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Registration</h2>
        <span className="text-xs text-muted-foreground">
          {confirmedPlayers.length + reservedPlayers.length}/{leagueRules.maxSpots} spots filled
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg border border-border bg-card p-2.5 text-center">
          <p className="text-lg font-bold text-win">{confirmedPlayers.length}</p>
          <p className="text-[9px] text-muted-foreground">Confirmed</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2.5 text-center">
          <p className="text-lg font-bold text-draw">{reservedPlayers.length}</p>
          <p className="text-[9px] text-muted-foreground">Reserved</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2.5 text-center">
          <p className="text-lg font-bold text-primary">{waitlistPlayers.length}</p>
          <p className="text-[9px] text-muted-foreground">Waitlist</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2.5 text-center">
          <p className="text-lg font-bold text-loss">{outPlayers.length}</p>
          <p className="text-[9px] text-muted-foreground">Out</p>
        </div>
      </div>

      {/* Spots remaining */}
      {spotsRemaining > 0 && (
        <div className="rounded-lg border border-win/30 bg-win/5 p-3 text-center">
          <p className="text-xs font-bold text-win">{spotsRemaining} spot{spotsRemaining !== 1 ? "s" : ""} remaining</p>
          <p className="text-[10px] text-muted-foreground">First come, first served</p>
        </div>
      )}
      {spotsRemaining === 0 && waitlistPlayers.length > 0 && (
        <div className="rounded-lg border border-draw/30 bg-draw/5 p-3 text-center">
          <p className="text-xs font-bold text-draw">All spots filled - {waitlistPlayers.length} on waitlist</p>
          <p className="text-[10px] text-muted-foreground">{"You'll"} be promoted if someone drops out</p>
        </div>
      )}

      {/* Player Self-Service Card */}
      {loggedInPlayer && !isAdmin && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Position number */}
              {(myConfirmedPos > 0 || myWaitlistPos > 0) && (
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  myConfirmedPos > 0
                    ? "bg-win/20 text-win border border-win/30"
                    : "bg-draw/20 text-draw border border-draw/30"
                )}>
                  #{myConfirmedPos > 0 ? myConfirmedPos : myWaitlistPos}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-foreground">{loggedInPlayer.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {myIsConfirmed
                    ? `Confirmed - spot #${myConfirmedPos} of ${leagueRules.maxSpots}`
                    : myWaitlistPos > 0
                      ? `Waitlist position #${myWaitlistPos} - all ${leagueRules.maxSpots} spots full`
                      : loggedInPlayer.registrationStatus === "reserved"
                        ? "Reserved spot from last week - say in to confirm"
                        : "Set your availability for this week"}
                </p>
              </div>
            </div>
            <StatusBadge status={loggedInPlayer.registrationStatus} waitlistPos={myWaitlistPos} />
          </div>

          {/* Registration closed banner */}
          {!registrationOpen && loggedInPlayer.registrationStatus === "out" && (
            <div className="rounded-lg border border-draw/30 bg-draw/5 p-3 flex items-start gap-2">
              <Clock className="h-4 w-4 text-draw shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-draw">Registration not open yet</p>
                <p className="text-[10px] text-muted-foreground">Spots open on Wednesday at 12:00 PM for next Monday{"'"}s match.</p>
              </div>
            </div>
          )}

          {/* Pay Now button for confirmed players who haven't paid */}
          {loggedInPlayer.registrationStatus === "in" && !loggedInPlayer.paid && paymentLink && (
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-12 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <Banknote className="h-4 w-4" />
              Pay Now
            </a>
          )}

          {!showDropConfirm ? (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (!registrationOpen) return
                  if (loggedInPlayer.registrationStatus === "in") return
                  handleStatusChange(loggedInPlayer.id, "in")
                  setShowDropConfirm(false)
                }}
                disabled={(!registrationOpen && loggedInPlayer.registrationStatus !== "in") || loggedInPlayer.registrationStatus === "in"}
                className={cn(
                  "flex-1 h-12 text-sm font-bold",
                  loggedInPlayer.registrationStatus === "in"
                    ? "bg-win text-background hover:bg-win/90"
                    : !registrationOpen
                      ? "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {loggedInPlayer.registrationStatus === "in"
                  ? myWaitlistPos > 0 ? `Waitlist #${myWaitlistPos}` : `Spot #${myConfirmedPos}`
                  : "I'm In"}
              </Button>
              <Button
                onClick={() => {
                  if (loggedInPlayer.registrationStatus === "out") return
                  setShowDropConfirm(true)
                }}
                disabled={loggedInPlayer.registrationStatus === "out"}
                className={cn(
                  "flex-1 h-12 text-sm font-bold",
                  loggedInPlayer.registrationStatus === "out"
                    ? "bg-loss text-background hover:bg-loss/90"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {"I'm Out"}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-loss/40 bg-loss/5 p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-loss shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground">Are you sure you want to drop out?</p>
                  {(() => {
                    const penalty = getWithdrawalPenalty(leagueRules)
                    if (penalty) {
                      return (
                        <p className="text-xs text-loss mt-1">
                          This will result in <span className="font-bold">-{penalty.points} point{penalty.points > 1 ? "s" : ""}</span> ({penalty.reason.toLowerCase()}).
                        </p>
                      )
                    }
                    return <p className="text-xs text-muted-foreground mt-1">No penalty applies right now.</p>
                  })()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    handleStatusChange(loggedInPlayer.id, "out")
                    setShowDropConfirm(false)
                  }}
                  className="flex-1 h-11 bg-loss text-background hover:bg-loss/90 text-sm font-bold"
                >
                  Yes, drop out
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDropConfirm(false)}
                  className="flex-1 h-11 text-sm font-bold"
                >
                  No, stay in
                </Button>
              </div>
            </div>
          )}

          {/* Change Password */}
          {!showChangePassword ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChangePassword(true)}
              className="text-xs text-muted-foreground hover:text-foreground mx-auto"
            >
              <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Change Password
            </Button>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
              <p className="text-xs font-semibold text-foreground">Change Password</p>
              <Input
                type="password"
                placeholder="Current password"
                value={currentPw}
                onChange={(e) => { setCurrentPw(e.target.value); setPwError(false); setPwSuccess(false) }}
                className="h-9 bg-secondary text-foreground text-sm"
              />
              <Input
                type="password"
                placeholder="New password"
                value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setPwError(false); setPwSuccess(false) }}
                className="h-9 bg-secondary text-foreground text-sm"
              />
              {pwError && <p className="text-[10px] text-loss">Current password is incorrect.</p>}
              {pwSuccess && <p className="text-[10px] text-win">Password changed successfully.</p>}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const ok = changePlayerPassword(loggedInPlayer.id, currentPw, newPw)
                    if (ok) {
                      setPwSuccess(true)
                      setPwError(false)
                      setCurrentPw("")
                      setNewPw("")
                      setTimeout(() => { setPwSuccess(false); setShowChangePassword(false) }, 2000)
                    } else {
                      setPwError(true)
                    }
                  }}
                  disabled={!currentPw || !newPw}
                  className="flex-1 h-9 bg-primary text-primary-foreground text-xs"
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setShowChangePassword(false); setCurrentPw(""); setNewPw(""); setPwError(false); setPwSuccess(false) }}
                  className="h-9 text-xs"
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Withdrawal Penalty Alert */}
      {penaltyAlert && (
        <div className="rounded-lg border border-loss/40 bg-loss/10 p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="h-4 w-4 text-loss shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-loss">-{penaltyAlert.points} point{penaltyAlert.points > 1 ? "s" : ""} applied to {penaltyAlert.playerName}</p>
            <p className="text-[10px] text-muted-foreground">{penaltyAlert.reason}</p>
          </div>
        </div>
      )}

      {/* Withdrawal Rules (visible to all) */}
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Withdrawal Penalties</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{leagueRules.penaltyEarlyLabel}</span>
            <span className="text-[10px] font-bold text-loss">-{leagueRules.penaltyEarly} point{leagueRules.penaltyEarly !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{leagueRules.penaltyLateLabel}</span>
            <span className="text-[10px] font-bold text-loss">-{leagueRules.penaltyLate} point{leagueRules.penaltyLate !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{leagueRules.noPenaltyLabel}</span>
            <span className="text-[10px] font-bold text-win">No penalty</span>
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1">
            <CreditCard className="h-3.5 w-3.5 text-primary" /> Payment Progress
          </span>
          <span className="text-xs text-muted-foreground">{paidCount}/{confirmedPlayers.length} paid</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${confirmedPlayers.length > 0 ? (paidCount / confirmedPlayers.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Winning Team Priority */}
      {winningTeam.length > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary">Last Week{"'"}s Winners - Reserved Spots</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">
            Must say in and pay by midnight to keep their spot. Unpaid spots open to first on waitlist.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {winningTeam.map((p) => (
              <span
                key={p.id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium",
                  p.registrationStatus === "in" && p.paid
                    ? "bg-win/15 text-win"
                    : p.registrationStatus === "in" && !p.paid
                      ? "bg-draw/15 text-draw"
                      : "bg-loss/15 text-loss"
                )}
              >
                {p.registrationStatus === "in" && p.paid ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : p.registrationStatus === "in" ? (
                  <Timer className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Confirmed Players ─────────────────────────────────── */}
      {confirmedPlayers.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-win px-1">
            Confirmed ({confirmedPlayers.length}/{leagueRules.maxSpots})
          </h3>
          {confirmedPlayers.map((player, idx) => (
            <PlayerRow
  key={player.id}
  player={player}
  queueNumber={idx + 1}
  isAdmin={isAdmin}
  paymentLink={paymentLink}
  handleStatusChange={handleStatusChange}
  updatePlayer={updatePlayer}
            />
          ))}
        </div>
      )}

      {/* ── Reserved Players (winners) ─────────────────���──────── */}
      {reservedPlayers.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-draw px-1">
            Reserved - Winners ({reservedPlayers.length})
          </h3>
          {reservedPlayers.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              isAdmin={isAdmin}
              paymentLink={paymentLink}
              handleStatusChange={handleStatusChange}
              updatePlayer={updatePlayer}
            />
          ))}
        </div>
      )}

      {/* ── Waitlist ─────────���────────────────────────────────── */}
      {waitlistPlayers.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-primary px-1">
            Waitlist ({waitlistPlayers.length})
          </h3>
          {waitlistPlayers.map((player, idx) => (
            <PlayerRow
  key={player.id}
  player={player}
  waitlistPos={idx + 1}
  isAdmin={isAdmin}
  paymentLink={paymentLink}
  handleStatusChange={handleStatusChange}
  updatePlayer={updatePlayer}
            />
          ))}
        </div>
      )}

      {/* ── Out Players ─────────────────────────────���─────────── */}
      {outPlayers.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Out ({outPlayers.length})
          </h3>
          {outPlayers.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              isAdmin={isAdmin}
              paymentLink={paymentLink}
              handleStatusChange={handleStatusChange}
              updatePlayer={updatePlayer}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Player Row Component ──────────────────────────────────────────────────

interface PlayerRowProps {
  player: import("@/lib/types").Player
  queueNumber?: number
  waitlistPos?: number
  isAdmin: boolean
  paymentLink: string
  handleStatusChange: (id: string, status: "out" | "in" | "reserved") => void
  updatePlayer: (id: string, updates: Partial<import("@/lib/types").Player>) => void
}

function PlayerRow({ player, queueNumber, waitlistPos, isAdmin, paymentLink, handleStatusChange, updatePlayer }: PlayerRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card p-3",
        player.isWinningTeam && "border-primary/20"
      )}
    >
      {/* Queue number */}
      {queueNumber && (
        <span className="text-[10px] font-bold text-muted-foreground w-4 text-center">{queueNumber}</span>
      )}
      {waitlistPos && (
        <span className="text-[10px] font-bold text-draw w-4 text-center">#{waitlistPos}</span>
      )}

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{player.name}</span>
          {player.isWinningTeam && <Crown className="h-3 w-3 text-primary" />}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={player.registrationStatus} waitlistPos={waitlistPos} />
          {player.registrationStatus !== "out" && (
            player.paid ? (
              <span className="flex items-center gap-0.5 text-[10px] text-win">
                <CheckCircle2 className="h-3 w-3" /> Paid
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[10px] text-loss">
                <XCircle className="h-3 w-3" /> Unpaid
              </span>
            )
          )}
          {player.registeredAt && (
            <span className="text-[9px] text-muted-foreground">
              {new Date(player.registeredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!player.paid && player.registrationStatus !== "out" && !isAdmin && paymentLink && (
          <a
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-7 px-3 rounded-md bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors"
          >
            Pay Now
          </a>
        )}

        {isAdmin && (
          <div className="flex items-center gap-1.5">
            <Select
              value={player.registrationStatus}
              onValueChange={(val: "out" | "in" | "reserved") => handleStatusChange(player.id, val)}
            >
              <SelectTrigger className="h-7 w-[80px] bg-secondary text-[10px] text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card text-foreground border-border">
                <SelectItem value="in">In</SelectItem>
                <SelectItem value="out">Out</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant={player.paid ? "outline" : "default"}
              className={cn("h-7 text-[10px]", player.paid ? "border-win/40 text-win" : "bg-primary text-primary-foreground")}
              onClick={() => updatePlayer(player.id, { paid: !player.paid })}
            >
              {player.paid ? <CheckCircle2 className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
