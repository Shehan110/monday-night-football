"use client"

import { useState, useCallback } from "react"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shuffle, Coins, ArrowRight, RotateCcw, Users, Crown, GripVertical, Plus, X, Settings } from "lucide-react"
import { ShareTableButton } from "@/components/share-table-button"
import type { DraftPair, MatchFormat, MatchType } from "@/lib/types"

/* ── Coin toss animation ──────────────────────────────────── */
type CoinSide = "heads" | "tails"

function getRandomCoinSide(): CoinSide {
  // Use crypto for true randomness
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] % 2 === 0 ? "heads" : "tails"
}

function CoinTossAnimation({
  tossCaller,
  callerName,
  winnerAName = "Team A",
  winnerBName = "Team B",
  onResult,
}: {
  tossCaller: "A" | "B"
  callerName?: string
  winnerAName?: string
  winnerBName?: string
  onResult: (winner: "A" | "B", call: CoinSide, landedOn: CoinSide) => void
}) {
  const [call, setCall] = useState<CoinSide | null>(null)
  const [flipping, setFlipping] = useState(false)
  const [coinResult, setCoinResult] = useState<{ side: CoinSide; winner: "A" | "B" } | null>(null)

  const handleCall = (chosen: CoinSide) => {
    setCall(chosen)
    setFlipping(true)
    setTimeout(() => {
      const landed = getRandomCoinSide()
      const callerWins = chosen === landed
      const winner: "A" | "B" = callerWins ? tossCaller : tossCaller === "A" ? "B" : "A"
      setCoinResult({ side: landed, winner })
      setFlipping(false)
      setTimeout(() => onResult(winner, chosen, landed), 1800)
    }, 1500)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Coin visual */}
      <div
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full border-2 transition-transform duration-300",
          flipping && "animate-spin",
          coinResult ? "border-primary bg-primary/20" : "border-primary bg-primary/10"
        )}
      >
        {coinResult ? (
          <span className="text-base font-bold text-primary capitalize">{coinResult.side}</span>
        ) : (
          <Coins className="h-8 w-8 text-primary" />
        )}
      </div>

      {/* Heads or Tails call buttons */}
      {!call && !coinResult && (
        <div className="flex flex-col items-center gap-3 w-full">
          <p className="text-sm font-bold text-foreground">{callerName || `Captain ${tossCaller}`} - Heads or Tails?</p>
          <div className="flex gap-3 w-full">
            <Button
              onClick={() => handleCall("heads")}
              className="flex-1 h-14 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-bold"
            >
              Heads
            </Button>
            <Button
              onClick={() => handleCall("tails")}
              variant="outline"
              className="flex-1 h-14 border-primary text-foreground hover:bg-primary/10 text-base font-bold"
            >
              Tails
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            Winner gets first pick. Loser gets kick off.
          </p>
        </div>
      )}

      {/* Flipping state */}
      {flipping && call && (
        <p className="text-sm font-medium text-muted-foreground">
          Called <span className="text-foreground capitalize font-bold">{call}</span> - flipping...
        </p>
      )}

      {/* Result state */}
      {coinResult && !flipping && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            Called <span className="text-foreground capitalize font-bold">{call}</span> -- landed on <span className="text-foreground capitalize font-bold">{coinResult.side}</span>
          </p>
          <p className="text-lg font-bold text-primary">
            {coinResult.winner === "A" ? winnerAName : winnerBName} wins the toss!
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Step indicator ───────────────────────────────────────── */
const STEPS = ["setup", "pairing", "toss", "pick", "done"] as const

function StepIndicator({ current }: { current: string }) {
  const currentIdx = STEPS.indexOf(current as (typeof STEPS)[number])
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold",
              current === s
                ? "bg-primary text-primary-foreground"
                : currentIdx > i
                  ? "bg-primary/30 text-primary"
                  : "bg-secondary text-muted-foreground"
            )}
          >
            {i + 1}
          </div>
          {i < STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
        </div>
      ))}
    </div>
  )
}

/* ── Main component ───────────────────────────────────────── */
export function TeamDraft() {
  const { players, draft, setDraft, isAdmin, isCaptain, captainTeam, updatePlayer } = useApp()

  /* Setup state (local until confirmed) */
  const [matchFormat, setMatchFormat] = useState<MatchFormat>(draft.matchFormat)
  const [matchType, setMatchType] = useState<MatchType>(draft.matchType)
  const [captainAId, setCaptainAId] = useState<string>(draft.captainA || "")
  const [captainBId, setCaptainBId] = useState<string>(draft.captainB || "")
  const [captainAPass, setCaptainAPass] = useState("")
  const [captainBPass, setCaptainBPass] = useState("")

  /* Manual pairing state */
  const [pairingMode, setPairingMode] = useState<"auto" | "manual">("auto")
  const [manualPairs, setManualPairs] = useState<DraftPair[]>([])
  const [manualPick1, setManualPick1] = useState<string>("")
  const [manualPick2, setManualPick2] = useState<string>("")

  const eligiblePlayers = players.filter((p) => p.registrationStatus === "in")
  const requiredCount = matchFormat === "6v6" ? 12 : 14
  const hasEnough = eligiblePlayers.length >= requiredCount

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || "Unknown"
  const teamAName = draft.captainA ? `Team ${getPlayerName(draft.captainA)}` : "Team A"
  const teamBName = draft.captainB ? `Team ${getPlayerName(draft.captainB)}` : "Team B"

  /* ── Setup confirm ──────────────────────────────────────── */
  const handleSetupConfirm = () => {
    if (!captainAId || !captainBId || captainAId === captainBId) return
    if (!captainAPass || !captainBPass) return
    setDraft((prev) => ({
      ...prev,
      matchFormat,
      matchType,
      captainA: captainAId,
      captainB: captainBId,
      captainAPassword: captainAPass,
      captainBPassword: captainBPass,
      step: "pairing",
    }))
  }

  /* ── Auto pair ──────────────────────────────────────────── */
  const handleAutoPair = useCallback(() => {
    const pool = eligiblePlayers
      .filter((p) => p.id !== draft.captainA && p.id !== draft.captainB)
      .sort(() => Math.random() - 0.5)
    const pairs: DraftPair[] = []
    for (let i = 0; i < pool.length - 1; i += 2) {
      pairs.push({ id: `pair-${i}`, player1Id: pool[i].id, player2Id: pool[i + 1].id })
    }
    setDraft((prev) => ({ ...prev, pairs, step: "toss" }))
  }, [eligiblePlayers, draft.captainA, draft.captainB, setDraft])

  /* ── Manual pair helpers ────────────────────────────────── */
  const pairedIds = new Set(manualPairs.flatMap((p) => [p.player1Id, p.player2Id]))
  const unpaired = eligiblePlayers.filter(
    (p) => p.id !== draft.captainA && p.id !== draft.captainB && !pairedIds.has(p.id)
  )
  const expectedPairs = matchFormat === "6v6" ? 5 : 6 // minus 2 captains

  const handleAddManualPair = () => {
    if (!manualPick1 || !manualPick2 || manualPick1 === manualPick2) return
    setManualPairs((prev) => [
      ...prev,
      { id: `pair-${prev.length}`, player1Id: manualPick1, player2Id: manualPick2 },
    ])
    setManualPick1("")
    setManualPick2("")
  }

  const handleRemoveManualPair = (id: string) => {
    setManualPairs((prev) => prev.filter((p) => p.id !== id))
  }

  const handleConfirmManualPairs = () => {
    setDraft((prev) => ({ ...prev, pairs: manualPairs, step: "toss" }))
  }

  /* ── Coin toss ──────────────────────────────────────────── */
  const handleCoinResult = useCallback(
  (winner: "A" | "B", _call: CoinSide, _result: CoinSide) => {
  setDraft((prev) => ({ ...prev, coinTossWinner: winner, currentPick: winner, step: "pick" }))
  },
  [setDraft]
  )

  /* ── Pick ───────────────────────────────────────────────── */
  const handlePick = useCallback(
    (pairId: string, playerId: string) => {
      setDraft((prev) => {
        const pair = prev.pairs.find((p) => p.id === pairId)
        if (!pair) return prev
        const otherPlayerId = pair.player1Id === playerId ? pair.player2Id : pair.player1Id
        const isTeamA = prev.currentPick === "A"
        const newTeamA = isTeamA ? [...prev.teamA, playerId] : [...prev.teamA, otherPlayerId]
        const newTeamB = isTeamA ? [...prev.teamB, otherPlayerId] : [...prev.teamB, playerId]
        const remainingPairs = prev.pairs.filter((p) => p.id !== pairId)
        const nextPick = prev.currentPick === "A" ? "B" : "A"
        const isDone = remainingPairs.length === 0

        return {
          ...prev,
          teamA: newTeamA,
          teamB: newTeamB,
          pairs: remainingPairs,
          currentPick: isDone ? null : nextPick,
          step: isDone ? "done" : "pick",
        }
      })
    },
    [setDraft]
  )

  /* ── When draft is done & is league, increment captain counts ── */
  const handleFinalizeDraft = useCallback(() => {
    if (draft.matchType === "league") {
      if (draft.captainA) updatePlayer(draft.captainA, { captainCount: (players.find((p) => p.id === draft.captainA)?.captainCount || 0) + 1 })
      if (draft.captainB) updatePlayer(draft.captainB, { captainCount: (players.find((p) => p.id === draft.captainB)?.captainCount || 0) + 1 })
    }
  }, [draft.matchType, draft.captainA, draft.captainB, players, updatePlayer])

  /* ── Reset ──────────────────────────────────────────────── */
  const handleReset = () => {
    setDraft({
      matchFormat: "7v7",
      matchType: "league",
      pairs: [],
      coinTossWinner: null,
      tossCaller: null,
      teamA: [],
      teamB: [],
      captainA: null,
      captainB: null,
      captainAPassword: null,
      captainBPassword: null,
      currentPick: null,
      step: "setup",
    })
    setManualPairs([])
    setManualPick1("")
    setManualPick2("")
    setCaptainAId("")
    setCaptainBId("")
    setCaptainAPass("")
    setCaptainBPass("")
  }

  /* ────────────────────────────────────────────────────────── */
  /*  PLAYER VIEW (non-admin, non-captain)                     */
  /* ────────────────────────────────────────────────────────── */
  if (!isAdmin && !isCaptain) {
    if (draft.step === "done") {
      return <FinalTeamsView draft={draft} getPlayerName={getPlayerName} />
    }
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-16">
        <Users className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Teams haven{"'"}t been drafted yet. Check back once the draft is complete.
        </p>
      </div>
    )
  }

  /* ────────────────────────────────────────────────────────── */
  /*  CAPTAIN VIEW                                             */
  /* ────────────────────────────────────────────────────────── */
  if (isCaptain && !isAdmin) {
    // Captains can do toss + pick steps
    if (draft.step === "toss") {
      const isCaller = draft.tossCaller === captainTeam
      const callerNotSet = !draft.tossCaller
      return (
        <div className="flex flex-col gap-4 px-4 pb-4">
          <h2 className="text-lg font-bold text-foreground">Coin Toss</h2>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
            <Crown className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">
              You are {captainTeam === "A" ? teamAName : teamBName} captain ({getPlayerName(captainTeam === "A" ? draft.captainA! : draft.captainB!)})
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <h3 className="text-xs font-bold text-foreground mb-2">Pairs</h3>
            {draft.pairs.map((pair, i) => (
              <div key={pair.id} className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                <span className="text-[10px] text-primary font-bold">P{i + 1}</span>
                <span className="text-foreground">{getPlayerName(pair.player1Id)}</span>
                <span>vs</span>
                <span className="text-foreground">{getPlayerName(pair.player2Id)}</span>
              </div>
            ))}
          </div>

          {callerNotSet && (
            <div className="rounded-lg border border-draw/30 bg-draw/5 p-4 text-center">
              <p className="text-xs text-draw font-medium">Waiting for the admin to decide who calls the toss...</p>
            </div>
          )}

          {isCaller && draft.tossCaller && (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                <p className="text-xs font-bold text-primary">You call heads or tails!</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <CoinTossAnimation key={`captain-toss-${draft.tossCaller}`} tossCaller={draft.tossCaller} callerName={draft.tossCaller === "A" ? teamAName : teamBName} winnerAName={teamAName} winnerBName={teamBName} onResult={handleCoinResult} />
              </div>
            </div>
          )}

          {!isCaller && !callerNotSet && (
            <div className="rounded-lg border border-draw/30 bg-draw/5 p-4 text-center">
              <p className="text-xs text-draw font-medium">
                {draft.tossCaller === "A" ? teamAName : teamBName} captain is calling the toss...
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Waiting for the coin toss result.</p>
            </div>
          )}
        </div>
      )
    }

    if (draft.step === "pick") {
      const isMyTurn = draft.currentPick === captainTeam
      return (
        <div className="flex flex-col gap-4 px-4 pb-4">
          <h2 className="text-lg font-bold text-foreground">Draft Pick</h2>
          <div className={cn("rounded-lg border p-3 text-center", isMyTurn ? "border-primary/30 bg-primary/5" : "border-border bg-card")}>
            <Crown className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">
              {isMyTurn ? "Your turn to pick!" : `Waiting for ${draft.currentPick === "A" ? teamAName : teamBName} captain to pick...`}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {draft.pairs.length} pair{draft.pairs.length !== 1 ? "s" : ""} remaining
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <p className="text-[10px] font-bold text-primary mb-1">{teamAName} ({draft.teamA.length})</p>
              {draft.teamA.map((id) => (
                <p key={id} className="text-[10px] text-foreground">{getPlayerName(id)}</p>
              ))}
            </div>
            <div className="rounded-lg bg-loss/10 p-2">
              <p className="text-[10px] font-bold text-loss mb-1">{teamBName} ({draft.teamB.length})</p>
              {draft.teamB.map((id) => (
                <p key={id} className="text-[10px] text-foreground">{getPlayerName(id)}</p>
              ))}
            </div>
          </div>

          {isMyTurn && draft.pairs.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Pick one player from any pair ({draft.pairs.length} pairs):
              </p>
              {draft.pairs.map((pair, idx) => (
                <div key={pair.id} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-[10px] font-medium text-muted-foreground mb-2">Pair {idx + 1} of {draft.pairs.length}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-12 text-xs border-primary/30 hover:bg-primary/10 text-foreground"
                      onClick={() => handlePick(pair.id, pair.player1Id)}
                    >
                      {getPlayerName(pair.player1Id)}
                    </Button>
                    <span className="text-[10px] text-muted-foreground font-bold">OR</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-12 text-xs border-primary/30 hover:bg-primary/10 text-foreground"
                      onClick={() => handlePick(pair.id, pair.player2Id)}
                    >
                      {getPlayerName(pair.player2Id)}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isMyTurn && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Waiting for {draft.currentPick === "A" ? teamAName : teamBName} captain to make their pick...
            </p>
          )}
        </div>
      )
    }

    if (draft.step === "done") {
      return <FinalTeamsView draft={draft} getPlayerName={getPlayerName} />
    }

    // Captain waiting for admin to finish setup/pairing
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-16">
        <Crown className="h-12 w-12 text-primary" />
        <p className="text-sm text-muted-foreground text-center">
          Welcome, {captainTeam === "A" ? teamAName : teamBName} captain! Waiting for admin to finish setting up pairs.
        </p>
      </div>
    )
  }

  /* ────────────────────────────────────────────────────────── */
  /*  ADMIN VIEW                                               */
  /* ────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Team Draft</h2>
        <Button variant="outline" size="sm" onClick={handleReset} className="h-7 text-[10px]">
          <RotateCcw className="mr-1 h-3 w-3" /> Reset
        </Button>
      </div>

      <StepIndicator current={draft.step} />

      {/* ── SETUP STEP ──────────────────────────────────────── */}
      {draft.step === "setup" && (
        <div className="flex flex-col gap-4">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-primary" /> Match Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Format toggle */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Match Format</label>
                <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
                  {(["7v7", "6v6"] as MatchFormat[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setMatchFormat(f)}
                      className={cn(
                        "flex-1 rounded-md px-3 py-2.5 text-xs font-medium transition-colors min-h-[44px]",
                        matchFormat === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f} ({f === "7v7" ? "14" : "12"} players)
                    </button>
                  ))}
                </div>
              </div>

              {/* Match type toggle */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Match Type</label>
                <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
                  {(["league", "friendly"] as MatchType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setMatchType(t)}
                      className={cn(
                        "flex-1 rounded-md px-3 py-2.5 text-xs font-medium transition-colors capitalize min-h-[44px]",
                        matchType === t
                          ? t === "league" ? "bg-primary text-primary-foreground" : "bg-draw text-background"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {matchType === "friendly" && (
                  <p className="text-[10px] text-draw mt-1">Captain counts won{"'"}t be tracked for friendlies.</p>
                )}
              </div>

              {/* Player count status */}
              <div className={cn(
                "rounded-lg border p-3",
                hasEnough ? "border-win/30 bg-win/5" : "border-draw/30 bg-draw/5"
              )}>
                <p className={cn("text-xs font-medium", hasEnough ? "text-win" : "text-draw")}>
                  {eligiblePlayers.length} / {requiredCount} players registered as In
                </p>
                {!hasEnough && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Need {requiredCount - eligiblePlayers.length} more player{requiredCount - eligiblePlayers.length !== 1 ? "s" : ""} to start.
                  </p>
                )}
              </div>

              {/* Captain selection */}
              <div className="flex flex-col gap-3">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Select Captains</label>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-foreground font-medium">Captain A</span>
                  <Select value={captainAId} onValueChange={setCaptainAId}>
                    <SelectTrigger className="h-10 bg-secondary text-foreground text-sm">
                      <SelectValue placeholder="Select Captain A" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {eligiblePlayers.filter((p) => p.id !== captainBId).map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-foreground">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {captainAId && (
                    <Input
                      type="text"
                      placeholder="Set password for Captain A"
                      value={captainAPass}
                      onChange={(e) => setCaptainAPass(e.target.value)}
                      className="h-9 bg-secondary text-foreground text-sm mt-1"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-foreground font-medium">Captain B</span>
                  <Select value={captainBId} onValueChange={setCaptainBId}>
                    <SelectTrigger className="h-10 bg-secondary text-foreground text-sm">
                      <SelectValue placeholder="Select captain B" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {eligiblePlayers.filter((p) => p.id !== captainAId).map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-foreground">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {captainBId && (
                    <Input
                      type="text"
                      placeholder="Set password for Captain B"
                      value={captainBPass}
                      onChange={(e) => setCaptainBPass(e.target.value)}
                      className="h-9 bg-secondary text-foreground text-sm mt-1"
                    />
                  )}
                </div>
              </div>

              <Button
                onClick={handleSetupConfirm}
                disabled={!hasEnough || !captainAId || !captainBId || captainAId === captainBId || !captainAPass || !captainBPass}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12"
              >
                Continue to Pairing
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── PAIRING STEP ────────────────────────────────────── */}
      {draft.step === "pairing" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">Captains</span>
              <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">{draft.matchFormat}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary font-medium">{teamAName}</span>
              <span className="text-xs text-muted-foreground">vs</span>
              <span className="rounded-md bg-loss/10 px-2 py-1 text-xs text-loss font-medium">{teamBName}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {unpaired.length + manualPairs.length * 2} players to pair (excluding captains). Create {expectedPairs} pairs.
          </p>

          {/* Pairing mode toggle */}
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
            <button
              onClick={() => setPairingMode("auto")}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors min-h-[44px]",
                pairingMode === "auto" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Auto Pair
            </button>
            <button
              onClick={() => setPairingMode("manual")}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors min-h-[44px]",
                pairingMode === "manual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Manual Pair
            </button>
          </div>

          {pairingMode === "auto" && (
            <Button onClick={handleAutoPair} className="bg-primary text-primary-foreground hover:bg-primary/90 h-12">
              <Shuffle className="mr-2 h-4 w-4" /> Auto-Pair & Continue
            </Button>
          )}

          {pairingMode === "manual" && (
            <div className="flex flex-col gap-3">
              {/* Created pairs */}
              {manualPairs.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {manualPairs.map((pair, i) => (
                    <div key={pair.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-primary font-bold">P{i + 1}</span>
                        <span className="text-foreground font-medium">{getPlayerName(pair.player1Id)}</span>
                        <span className="text-muted-foreground">vs</span>
                        <span className="text-foreground font-medium">{getPlayerName(pair.player2Id)}</span>
                      </div>
                      <button onClick={() => handleRemoveManualPair(pair.id)} className="text-muted-foreground hover:text-loss min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add pair form */}
              {unpaired.length >= 2 && (
                <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-2">
                  <p className="text-[10px] text-muted-foreground font-medium">Add pair ({manualPairs.length + 1} of {expectedPairs})</p>
                  <div className="flex items-center gap-2">
                    <Select value={manualPick1} onValueChange={setManualPick1}>
                      <SelectTrigger className="h-10 flex-1 bg-secondary text-foreground text-xs">
                        <SelectValue placeholder="Player 1" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {unpaired.filter((p) => p.id !== manualPick2).map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-foreground text-xs">{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-[10px] text-muted-foreground font-bold">vs</span>
                    <Select value={manualPick2} onValueChange={setManualPick2}>
                      <SelectTrigger className="h-10 flex-1 bg-secondary text-foreground text-xs">
                        <SelectValue placeholder="Player 2" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {unpaired.filter((p) => p.id !== manualPick1).map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-foreground text-xs">{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAddManualPair}
                    disabled={!manualPick1 || !manualPick2}
                    variant="outline"
                    className="h-10 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Pair
                  </Button>
                </div>
              )}

              {/* Remaining players */}
              {unpaired.length > 0 && unpaired.length < 2 && (
                <p className="text-[10px] text-draw">1 player remaining unpaired: {unpaired[0].name}</p>
              )}

              {manualPairs.length === expectedPairs && (
                <Button onClick={handleConfirmManualPairs} className="bg-primary text-primary-foreground hover:bg-primary/90 h-12">
                  Confirm Pairs & Continue
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TOSS STEP ───────────────────────────────────────── */}
      {draft.step === "toss" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <h3 className="text-xs font-bold text-foreground mb-2">Pairs Created</h3>
            {draft.pairs.map((pair, i) => (
              <div key={pair.id} className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                <span className="text-[10px] text-primary font-bold">P{i + 1}</span>
                <span className="text-foreground">{getPlayerName(pair.player1Id)}</span>
                <span>vs</span>
                <span className="text-foreground">{getPlayerName(pair.player2Id)}</span>
              </div>
            ))}
          </div>

          {/* Who calls heads/tails? */}
          {!draft.tossCaller && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col gap-3">
              <p className="text-xs font-bold text-foreground text-center">Who calls heads or tails?</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setDraft((prev) => ({ ...prev, tossCaller: "A" }))}
                  variant="outline"
                  className="flex-1 h-12 border-primary/30 hover:bg-primary/10 text-foreground text-xs"
                >
                  <Crown className="mr-1.5 h-4 w-4 text-primary" />
                  {teamAName}
                </Button>
                <Button
                  onClick={() => setDraft((prev) => ({ ...prev, tossCaller: "B" }))}
                  variant="outline"
                  className="flex-1 h-12 border-loss/30 hover:bg-loss/10 text-foreground text-xs"
                >
                  <Crown className="mr-1.5 h-4 w-4 text-loss" />
                  {teamBName}
                </Button>
              </div>
            </div>
          )}

          {draft.tossCaller && (
            <>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                <p className="text-xs font-bold text-foreground">
                  <Crown className="inline h-3.5 w-3.5 text-primary mr-1" />
                  {draft.tossCaller === "A" ? teamAName : teamBName} captain calls the toss
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                The captain can call it from their device, or you can do it here on their behalf.
              </p>
              <CoinTossAnimation key={`admin-toss-${draft.tossCaller}`} tossCaller={draft.tossCaller!} callerName={draft.tossCaller === "A" ? teamAName : teamBName} winnerAName={teamAName} winnerBName={teamBName} onResult={handleCoinResult} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDraft((prev) => ({ ...prev, tossCaller: null }))}
                className="text-xs text-muted-foreground mx-auto"
              >
                Change caller
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── PICK STEP ───────────────────────────────────────── */}
      {draft.step === "pick" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
            <Crown className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-bold text-primary">
              {draft.currentPick === "A" ? teamAName : teamBName}{"'"}s turn to pick
            </p>
            <p className="text-[10px] text-muted-foreground">
              {draft.pairs.length} pair{draft.pairs.length !== 1 ? "s" : ""} remaining
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <p className="text-[10px] font-bold text-primary mb-1">{teamAName} ({draft.teamA.length})</p>
              {draft.teamA.map((id) => (
                <p key={id} className="text-[10px] text-foreground">{getPlayerName(id)}</p>
              ))}
            </div>
            <div className="rounded-lg bg-loss/10 p-2">
              <p className="text-[10px] font-bold text-loss mb-1">{teamBName} ({draft.teamB.length})</p>
              {draft.teamB.map((id) => (
                <p key={id} className="text-[10px] text-foreground">{getPlayerName(id)}</p>
              ))}
            </div>
          </div>

          <p className="text-[10px] font-bold text-muted-foreground">Pick one player from any pair:</p>
          {draft.pairs.map((pair, i) => (
            <div key={pair.id} className="rounded-lg border border-border bg-card p-3">
              <p className="text-[10px] font-bold text-muted-foreground mb-2">Pair {i + 1}</p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-12 text-xs border-primary/30 hover:bg-primary/10 text-foreground"
                  onClick={() => handlePick(pair.id, pair.player1Id)}
                >
                  {getPlayerName(pair.player1Id)}
                </Button>
                <span className="text-[10px] text-muted-foreground font-bold">OR</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-12 text-xs border-primary/30 hover:bg-primary/10 text-foreground"
                  onClick={() => handlePick(pair.id, pair.player2Id)}
                >
                  {getPlayerName(pair.player2Id)}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DONE STEP ───────────────────────────────────────── */}
      {draft.step === "done" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-win/30 bg-win/5 p-3 text-center">
            <p className="text-sm font-bold text-win">Draft Complete!</p>
            {draft.matchType === "league" && (
              <p className="text-[10px] text-muted-foreground mt-1">Captain counts have been updated.</p>
            )}
          </div>
          {/* Trigger captain count update */}
          <DraftFinalizer onFinalize={handleFinalizeDraft} />
          <ShareTableButton
            type="teams"
            label="Share Teams"
            teamData={{
              teamAName,
              teamBName,
              captainA: getPlayerName(draft.captainA!),
              captainB: getPlayerName(draft.captainB!),
              teamA: draft.teamA.map(getPlayerName),
              teamB: draft.teamB.map(getPlayerName),
              matchFormat: draft.matchFormat,
              matchType: draft.matchType,
              coinTossWinner: draft.coinTossWinner,
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-primary flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {teamAName}
                </CardTitle>
                {draft.coinTossWinner === "A" && (
                  <Badge variant="outline" className="text-[9px] w-fit border-primary/40 text-primary">1st Pick</Badge>
                )}
                {draft.coinTossWinner === "B" && (
                  <Badge variant="outline" className="text-[9px] w-fit border-draw/40 text-draw">Kick Off</Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
                <div className="flex items-center rounded bg-primary/20 px-2 py-1.5">
                  <Crown className="h-3 w-3 text-primary mr-1.5" />
                  <span className="text-xs font-bold text-primary">{getPlayerName(draft.captainA!)}</span>
                  <Badge variant="outline" className="ml-auto text-[8px] border-primary/40 text-primary">Capt</Badge>
                </div>
                {draft.teamA.map((id) => (
                  <div key={id} className="flex items-center rounded bg-secondary/50 px-2 py-1.5">
                    <span className="text-xs font-medium text-foreground">{getPlayerName(id)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-loss/30 bg-loss/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-loss flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {teamBName}
                </CardTitle>
                {draft.coinTossWinner === "B" && (
                  <Badge variant="outline" className="text-[9px] w-fit border-loss/40 text-loss">1st Pick</Badge>
                )}
                {draft.coinTossWinner === "A" && (
                  <Badge variant="outline" className="text-[9px] w-fit border-draw/40 text-draw">Kick Off</Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
                <div className="flex items-center rounded bg-loss/20 px-2 py-1.5">
                  <Crown className="h-3 w-3 text-loss mr-1.5" />
                  <span className="text-xs font-bold text-loss">{getPlayerName(draft.captainB!)}</span>
                  <Badge variant="outline" className="ml-auto text-[8px] border-loss/40 text-loss">Capt</Badge>
                </div>
                {draft.teamB.map((id) => (
                  <div key={id} className="flex items-center rounded bg-secondary/50 px-2 py-1.5">
                    <span className="text-xs font-medium text-foreground">{getPlayerName(id)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Shared final teams view ──────────────────────────────── */
function FinalTeamsView({ draft, getPlayerName }: { draft: ReturnType<typeof useApp>["draft"]; getPlayerName: (id: string) => string }) {
  const tAName = draft.captainA ? `Team ${getPlayerName(draft.captainA)}` : "Team A"
  const tBName = draft.captainB ? `Team ${getPlayerName(draft.captainB)}` : "Team B"
  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <h2 className="text-lg font-bold text-foreground">Team Lineups</h2>
      <div className="flex items-center justify-center gap-2">
        <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">{draft.matchFormat}</Badge>
        <Badge variant="outline" className={cn("text-[9px]", draft.matchType === "league" ? "border-primary/40 text-primary" : "border-draw/40 text-draw")}>
          {draft.matchType === "league" ? "League" : "Friendly"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary flex items-center gap-1.5">
              <Users className="h-4 w-4" /> {tAName}
            </CardTitle>
            {draft.coinTossWinner === "A" && (
              <Badge variant="outline" className="text-[9px] w-fit border-primary/40 text-primary">1st Pick</Badge>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {draft.captainA && (
              <div className="flex items-center rounded bg-primary/20 px-2 py-1.5">
                <Crown className="h-3 w-3 text-primary mr-1.5" />
                <span className="text-xs font-bold text-primary">{getPlayerName(draft.captainA)}</span>
              </div>
            )}
            {draft.teamA.map((id) => (
              <div key={id} className="flex items-center rounded bg-secondary/50 px-2 py-1.5">
                <span className="text-xs font-medium text-foreground">{getPlayerName(id)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-loss/30 bg-loss/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-loss flex items-center gap-1.5">
              <Users className="h-4 w-4" /> {tBName}
            </CardTitle>
            {draft.coinTossWinner === "B" && (
              <Badge variant="outline" className="text-[9px] w-fit border-loss/40 text-loss">1st Pick</Badge>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {draft.captainB && (
              <div className="flex items-center rounded bg-loss/20 px-2 py-1.5">
                <Crown className="h-3 w-3 text-loss mr-1.5" />
                <span className="text-xs font-bold text-loss">{getPlayerName(draft.captainB)}</span>
              </div>
            )}
            {draft.teamB.map((id) => (
              <div key={id} className="flex items-center rounded bg-secondary/50 px-2 py-1.5">
                <span className="text-xs font-medium text-foreground">{getPlayerName(id)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ── Helper to fire finalize once ─────────────────────────── */
import { useEffect, useRef } from "react"

function DraftFinalizer({ onFinalize }: { onFinalize: () => void }) {
  const called = useRef(false)
  useEffect(() => {
    if (!called.current) {
      called.current = true
      onFinalize()
    }
  }, [onFinalize])
  return null
}
