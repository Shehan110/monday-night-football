"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Trash2, MinusCircle, Pencil, ShieldAlert, Users, AlertTriangle, KeyRound, Check, CalendarClock, Archive, PlayCircle, RotateCcw, Link2, ScrollText, RefreshCw } from "lucide-react"
import type { Player, FormResult, LeagueRules } from "@/lib/types"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const

export function AdminPanel() {
  const { players, isAdmin, addPlayer, removePlayer, updatePlayer, changePassword, resetPlayerPassword, seasons, currentSeasonName, endSeason, startNewSeason, setCurrentSeasonName, paymentLink, setPaymentLink, leagueRules, setLeagueRules, startNewMatchWeek } = useApp()
  const [resetConfirmId, setResetConfirmId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [newSeasonName, setNewSeasonName] = useState("")
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showStartNew, setShowStartNew] = useState(false)

  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [minusPointsPlayerId, setMinusPointsPlayerId] = useState<string | null>(null)
  const [minusPointsAmount, setMinusPointsAmount] = useState(-1)
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showNewWeekConfirm, setShowNewWeekConfirm] = useState(false)
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwError, setPwError] = useState("")
  const [pwSuccess, setPwSuccess] = useState(false)

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-16">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Admin access required. Log out and select Admin on the home screen.
        </p>
      </div>
    )
  }

  const handleAddPlayer = () => {
    if (!newName.trim()) return
    const newPlayer: Player = {
      id: `p-${Date.now()}`,
      name: newName.trim(),
      password: newName.trim().toLowerCase(),
      registeredAt: null,
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
      previousPosition: players.length + 1,
      registrationStatus: "out",
      paid: false,
      isWinningTeam: false,
      position: "",
    }
    addPlayer(newPlayer)
    setNewName("")
    setShowAddPlayer(false)
  }

  const handleMinusPoints = (playerId: string) => {
    const player = players.find((p) => p.id === playerId)
    if (!player) return
    const newMinus = player.minusPoints + minusPointsAmount
    const newPoints = player.won * leagueRules.winPoints + player.drawn * leagueRules.drawPoints + player.lost * leagueRules.lossPoints - newMinus
    updatePlayer(playerId, { minusPoints: newMinus, points: newPoints })
    setMinusPointsPlayerId(null)
    setMinusPointsAmount(-1)
  }

  const handleEditName = (playerId: string) => {
    if (!editName.trim()) return
    updatePlayer(playerId, { name: editName.trim() })
    setEditingPlayer(null)
    setEditName("")
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <h2 className="text-lg font-bold text-foreground">Admin Panel</h2>

      {/* New Match Week */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          {!showNewWeekConfirm ? (
            <Button
              onClick={() => setShowNewWeekConfirm(true)}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              New Match Week
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-destructive">Start a new match week?</p>
                  <p className="text-[10px] text-muted-foreground">Resets the draft, clears payments, and sets all players to &quot;Out&quot;. If last week was a league match, the winning 7 get reserved spots automatically. Cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewWeekConfirm(false)}
                  className="flex-1 h-10 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    startNewMatchWeek()
                    setShowNewWeekConfirm(false)
                  }}
                  className="flex-1 h-10 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold"
                >
                  Confirm Reset
                </Button>
              </div>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Winning 7 get reserved spots (league only). All others reset.
          </p>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <Users className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{players.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Players</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <MinusCircle className="h-5 w-5 mx-auto text-loss mb-1" />
            <p className="text-lg font-bold text-foreground">{players.filter((p) => p.minusPoints < 0).length}</p>
            <p className="text-[10px] text-muted-foreground">With Penalties</p>
          </CardContent>
        </Card>
      </div>

      {/* Change Password */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground flex items-center gap-1.5">
            <KeyRound className="h-4 w-4 text-primary" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {pwSuccess ? (
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-xs text-primary font-medium">Password changed successfully.</span>
            </div>
          ) : (
            <>
              <Input
                type="password"
                placeholder="Current password"
                value={currentPw}
                onChange={(e) => { setCurrentPw(e.target.value); setPwError(""); setPwSuccess(false) }}
                className="h-10 bg-secondary text-foreground text-sm"
              />
              <Input
                type="password"
                placeholder="New password (min 4 characters)"
                value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setPwError("") }}
                className="h-10 bg-secondary text-foreground text-sm"
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => { setConfirmPw(e.target.value); setPwError("") }}
                className="h-10 bg-secondary text-foreground text-sm"
              />
              {pwError && <p className="text-xs text-loss">{pwError}</p>}
              <Button
                onClick={() => {
                  if (newPw.length < 4) {
                    setPwError("New password must be at least 4 characters.")
                    return
                  }
                  if (newPw !== confirmPw) {
                    setPwError("Passwords do not match.")
                    return
                  }
                  const success = changePassword(currentPw, newPw)
                  if (success) {
                    setPwSuccess(true)
                    setCurrentPw("")
                    setNewPw("")
                    setConfirmPw("")
                    setPwError("")
                  } else {
                    setPwError("Current password is incorrect.")
                  }
                }}
                className="h-10 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Update Password
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Link */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground flex items-center gap-1.5">
            <Link2 className="h-4 w-4 text-primary" /> Payment Link
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-[10px] text-muted-foreground">
            Players will be directed to this link when they tap &quot;Pay Now&quot;.
          </p>
          <Input
            placeholder="https://monzo.me/..."
            value={paymentLink}
            onChange={(e) => setPaymentLink(e.target.value)}
            className="h-10 bg-secondary text-foreground text-sm"
          />
          {paymentLink && (
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary truncate hover:underline"
            >
              {paymentLink}
            </a>
          )}
        </CardContent>
      </Card>

      {/* League Rules */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground flex items-center gap-1.5">
            <ScrollText className="h-4 w-4 text-primary" /> League Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-[10px] text-muted-foreground">
            Configure match schedule, registration, points and withdrawal penalties.
          </p>

          {/* Match Day */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Match Day</label>
            <Select value={String(leagueRules.matchDay)} onValueChange={(v) => setLeagueRules({ ...leagueRules, matchDay: Number(v) })}>
              <SelectTrigger className="h-9 bg-secondary text-foreground text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card text-foreground border-border">
                {DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Registration Opens */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Registration Opens</label>
            <div className="flex gap-2">
              <Select value={String(leagueRules.registrationOpenDay)} onValueChange={(v) => setLeagueRules({ ...leagueRules, registrationOpenDay: Number(v) })}>
                <SelectTrigger className="h-9 flex-1 bg-secondary text-foreground text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card text-foreground border-border">
                  {DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(leagueRules.registrationOpenHour)} onValueChange={(v) => setLeagueRules({ ...leagueRules, registrationOpenHour: Number(v) })}>
                <SelectTrigger className="h-9 w-24 bg-secondary text-foreground text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card text-foreground border-border max-h-48">
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>{i === 0 ? "12am" : i < 12 ? `${i}am` : i === 12 ? "12pm" : `${i - 12}pm`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Max Spots */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Max Players Per Match</label>
            <Input
              type="number"
              min={2}
              value={leagueRules.maxSpots}
              onChange={(e) => setLeagueRules({ ...leagueRules, maxSpots: Math.max(2, parseInt(e.target.value) || 14) })}
              className="h-9 bg-secondary text-foreground text-sm"
            />
          </div>

          {/* Points System */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Points System</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">Win</span>
                <Input
                  type="number"
                  min={0}
                  value={leagueRules.winPoints}
                  onChange={(e) => setLeagueRules({ ...leagueRules, winPoints: parseInt(e.target.value) || 0 })}
                  className="h-9 bg-secondary text-foreground text-sm"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">Draw</span>
                <Input
                  type="number"
                  min={0}
                  value={leagueRules.drawPoints}
                  onChange={(e) => setLeagueRules({ ...leagueRules, drawPoints: parseInt(e.target.value) || 0 })}
                  className="h-9 bg-secondary text-foreground text-sm"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">Loss</span>
                <Input
                  type="number"
                  min={0}
                  value={leagueRules.lossPoints}
                  onChange={(e) => setLeagueRules({ ...leagueRules, lossPoints: parseInt(e.target.value) || 0 })}
                  className="h-9 bg-secondary text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          {/* Withdrawal Penalties */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Withdrawal Penalties</label>
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">Early withdrawal (after reg opens)</span>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min={0}
                    value={leagueRules.penaltyEarly}
                    onChange={(e) => setLeagueRules({ ...leagueRules, penaltyEarly: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="h-9 w-20 bg-secondary text-foreground text-sm"
                  />
                  <span className="text-[10px] text-muted-foreground">pts</span>
                  <Input
                    value={leagueRules.penaltyEarlyLabel}
                    onChange={(e) => setLeagueRules({ ...leagueRules, penaltyEarlyLabel: e.target.value })}
                    placeholder="Label shown to players"
                    className="h-9 flex-1 bg-secondary text-foreground text-[11px]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">Late withdrawal (match day)</span>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min={0}
                    value={leagueRules.penaltyLate}
                    onChange={(e) => setLeagueRules({ ...leagueRules, penaltyLate: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="h-9 w-20 bg-secondary text-foreground text-sm"
                  />
                  <span className="text-[10px] text-muted-foreground">pts</span>
                  <Input
                    value={leagueRules.penaltyLateLabel}
                    onChange={(e) => setLeagueRules({ ...leagueRules, penaltyLateLabel: e.target.value })}
                    placeholder="Label shown to players"
                    className="h-9 flex-1 bg-secondary text-foreground text-[11px]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">No penalty label</span>
                <Input
                  value={leagueRules.noPenaltyLabel}
                  onChange={(e) => setLeagueRules({ ...leagueRules, noPenaltyLabel: e.target.value })}
                  placeholder="e.g. Before Thursday"
                  className="h-9 bg-secondary text-foreground text-[11px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Season Management */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4 text-primary" /> Season Management
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Current season name - editable */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Current Season</label>
            <div className="flex items-center gap-2">
              <Input
                value={currentSeasonName}
                onChange={(e) => setCurrentSeasonName(e.target.value)}
                className="h-9 flex-1 bg-secondary text-foreground text-sm font-medium"
              />
            </div>
          </div>

          {/* End Season */}
          {!showEndConfirm && !showStartNew && (
            <Button
              onClick={() => setShowEndConfirm(true)}
              variant="outline"
              className="h-10 border-loss/50 text-loss hover:bg-loss/10 hover:text-loss"
            >
              <Archive className="mr-2 h-4 w-4" />
              End Current Season
            </Button>
          )}

          {showEndConfirm && (
            <div className="rounded-lg border border-loss/30 bg-loss/5 p-3 flex flex-col gap-2">
              <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-loss" />
                End &quot;{currentSeasonName}&quot;?
              </p>
              <p className="text-[10px] text-muted-foreground">
                All current stats will be archived. You can view them later from the League Table.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    endSeason()
                    setShowEndConfirm(false)
                    setShowStartNew(true)
                  }}
                  className="flex-1 h-9 bg-loss text-foreground hover:bg-loss/90 text-xs"
                >
                  End Season
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 h-9 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showStartNew && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex flex-col gap-2">
              <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
                <PlayCircle className="h-3.5 w-3.5 text-primary" />
                Start a new season
              </p>
              <Input
                placeholder="Season name (e.g. MNF 2026)"
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                className="h-9 bg-secondary text-foreground text-sm"
                autoFocus
              />
              <Button
                onClick={() => {
                  if (!newSeasonName.trim()) return
                  startNewSeason(newSeasonName.trim())
                  setNewSeasonName("")
                  setShowStartNew(false)
                }}
                disabled={!newSeasonName.trim()}
                className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
              >
                Start Season
              </Button>
            </div>
          )}

          {/* Past seasons list */}
          {seasons.length > 0 && (
            <div className="flex flex-col gap-1 pt-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Archived Seasons</p>
              {seasons.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                  <span className="text-xs font-medium text-foreground">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(s.endedAt).toLocaleDateString()} - {s.players.length} players
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Player */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-foreground flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-primary" /> Player Database
            </CardTitle>
            <Button
              size="sm"
              className="h-7 bg-primary text-primary-foreground text-[10px] hover:bg-primary/90"
              onClick={() => setShowAddPlayer(!showAddPlayer)}
            >
              {showAddPlayer ? "Cancel" : "+ Add Player"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {showAddPlayer && (
            <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 mb-2">
              <Input
                placeholder="Player name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-9 bg-secondary text-foreground text-sm"
              />
              <Button onClick={handleAddPlayer} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Add Player
              </Button>
            </div>
          )}

          {/* Player List */}
          <div className="flex flex-col gap-1">
            {[...players].sort((a, b) => a.name.localeCompare(b.name)).map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2"
              >
                {editingPlayer === player.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-7 flex-1 bg-secondary text-foreground text-xs"
                      autoFocus
                    />
                    <Button size="sm" className="h-7 text-[10px] bg-primary text-primary-foreground" onClick={() => handleEditName(player.id)}>Save</Button>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingPlayer(null)}>Cancel</Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-xs font-medium text-foreground">{player.name}</span>
    
                    {player.minusPoints < 0 && (
                      <span className="text-[10px] font-semibold text-loss">{player.minusPoints} pts</span>
                    )}
                    <button
                      className="p-1 text-muted-foreground hover:text-foreground"
                      onClick={() => { setEditingPlayer(player.id); setEditName(player.name) }}
                      aria-label={`Edit ${player.name}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>

                    {/* Reset Password */}
                    <Dialog open={resetConfirmId === player.id} onOpenChange={(open) => setResetConfirmId(open ? player.id : null)}>
                      <DialogTrigger asChild>
                        <button className="p-1 text-muted-foreground hover:text-primary" aria-label={`Reset password for ${player.name}`}>
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-card text-foreground border-border max-w-xs">
                        <DialogHeader>
                          <DialogTitle className="text-foreground flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-primary" /> Reset Password
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-3">
                          <p className="text-xs text-muted-foreground">
                            Reset <strong className="text-foreground">{player.name}</strong>{"'"}s password to their default (<span className="font-mono text-foreground">{player.name.toLowerCase()}</span>)?
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => { resetPlayerPassword(player.id); setResetConfirmId(null) }}
                              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              Reset
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => setResetConfirmId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Minus Points */}
                    <Dialog open={minusPointsPlayerId === player.id} onOpenChange={(open) => setMinusPointsPlayerId(open ? player.id : null)}>
                      <DialogTrigger asChild>
                        <button className="p-1 text-muted-foreground hover:text-loss" aria-label={`Deduct points from ${player.name}`}>
                          <MinusCircle className="h-3 w-3" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-card text-foreground border-border max-w-xs">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Minus Points - {player.name}</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-3">
                          <p className="text-xs text-muted-foreground">Current: {player.minusPoints} pts</p>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Points to deduct</label>
                            <Input
                              type="number"
                              max={0}
                              value={minusPointsAmount}
                              onChange={(e) => setMinusPointsAmount(parseInt(e.target.value) || -1)}
                              className="h-9 bg-secondary text-foreground text-sm"
                            />
                          </div>
                          <Button
                            onClick={() => handleMinusPoints(player.id)}
                            className="bg-loss text-foreground hover:bg-loss/90"
                          >
                            Apply Penalty
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Delete */}
                    <Dialog open={deleteConfirmId === player.id} onOpenChange={(open) => setDeleteConfirmId(open ? player.id : null)}>
                      <DialogTrigger asChild>
                        <button className="p-1 text-muted-foreground hover:text-loss" aria-label={`Remove ${player.name}`}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-card text-foreground border-border max-w-xs">
                        <DialogHeader>
                          <DialogTitle className="text-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-loss" /> Remove Player
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-3">
                          <p className="text-xs text-muted-foreground">
                            Are you sure you want to remove <strong className="text-foreground">{player.name}</strong>? This action cannot be undone.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => { removePlayer(player.id); setDeleteConfirmId(null) }}
                              className="flex-1 bg-loss text-foreground hover:bg-loss/90"
                            >
                              Remove
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
