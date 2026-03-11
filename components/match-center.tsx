"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Video, Calendar, ExternalLink, Trophy, Pencil, Trash2, AlertTriangle } from "lucide-react"
import type { Match, MatchType } from "@/lib/types"

// ─── Inline Edit Form (reused for new + edit) ──────────────────────────

interface MatchFormProps {
  initial: Omit<Match, "id">
  allMatchPlayers: string[]
  getPlayerName: (id: string) => string
  teamALabel?: string
  teamBLabel?: string
  onSave: (data: Omit<Match, "id">) => void
  onCancel: () => void
  submitLabel: string
}

function MatchForm({ initial, allMatchPlayers, getPlayerName, teamALabel = "Team A", teamBLabel = "Team B", onSave, onCancel, submitLabel }: MatchFormProps) {
  const [matchType, setMatchType] = useState<MatchType>(initial.matchType ?? "league")
  const [teamAScore, setTeamAScore] = useState(initial.teamAScore)
  const [teamBScore, setTeamBScore] = useState(initial.teamBScore)
  const [goalScorers, setGoalScorers] = useState<{ playerId: string; goals: string; isOwnGoal: boolean }[]>(
    initial.goalScorers.map((gs) => ({ playerId: gs.playerId, goals: String(gs.goals), isOwnGoal: gs.isOwnGoal ?? false }))
  )
  const [highlightUrl, setHighlightUrl] = useState(initial.highlightUrl ?? "")

  const addGoalScorer = (ownGoal = false) => {
    if (allMatchPlayers.length > 0) {
      setGoalScorers((prev) => [...prev, { playerId: allMatchPlayers[0], goals: "1", isOwnGoal: ownGoal }])
    }
  }

  const toGoals = (val: string) => { const n = parseInt(val, 10); return isNaN(n) || n < 1 ? 1 : n }

  const handleSubmit = () => {
    onSave({
      date: initial.date,
      matchType,
      teamAScore,
      teamBScore,
      teamA: initial.teamA,
      teamB: initial.teamB,
      goalScorers: goalScorers.map((gs) => ({ playerId: gs.playerId, goals: toGoals(gs.goals), isOwnGoal: gs.isOwnGoal })),
      highlightUrl: highlightUrl || undefined,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Match Type Toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
        <button
          onClick={() => setMatchType("league")}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors min-h-[44px]",
            matchType === "league"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          League
        </button>
        <button
          onClick={() => setMatchType("friendly")}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors min-h-[44px]",
            matchType === "friendly"
              ? "bg-draw text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Friendly
        </button>
      </div>

      {matchType === "friendly" && (
        <p className="text-[10px] text-draw -mt-2">Friendly matches will not count towards league table or top scorer stats.</p>
      )}

      {/* Score Input */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-primary">{teamALabel}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setTeamAScore(Math.max(0, teamAScore - 1))}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-2xl font-black text-foreground">{teamAScore}</span>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setTeamAScore(teamAScore + 1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <span className="text-sm font-bold text-muted-foreground">-</span>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-loss">{teamBLabel}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setTeamBScore(Math.max(0, teamBScore - 1))}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-2xl font-black text-foreground">{teamBScore}</span>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setTeamBScore(teamBScore + 1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Goal Scorers Section */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold text-foreground">Goal Scorers</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-10 text-xs font-medium"
            onClick={() => addGoalScorer(false)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Goal
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-10 text-xs font-medium border-loss/50 text-loss hover:bg-loss/10 hover:text-loss"
            onClick={() => addGoalScorer(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Own Goal
          </Button>
        </div>
        {goalScorers.map((gs, idx) => (
          <div key={idx} className="flex items-center gap-2 rounded-lg bg-secondary/30 p-2">
            {gs.isOwnGoal && (
              <Badge variant="outline" className="text-[9px] border-loss/50 text-loss px-1.5 py-0.5 shrink-0 font-bold">OG</Badge>
            )}
            <Select
              value={gs.playerId}
              onValueChange={(val) => {
                setGoalScorers((prev) => prev.map((g, i) => (i === idx ? { ...g, playerId: val } : g)))
              }}
            >
              <SelectTrigger className="h-9 flex-1 bg-secondary text-xs text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card text-foreground border-border">
                {allMatchPlayers.map((id) => (
                  <SelectItem key={id} value={id}>{getPlayerName(id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={gs.goals}
              onChange={(e) => {
                setGoalScorers((prev) => prev.map((g, i) => (i === idx ? { ...g, goals: e.target.value } : g)))
              }}
              className="h-9 w-14 bg-secondary text-foreground text-xs text-center"
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 p-0 text-loss hover:text-loss hover:bg-loss/10"
              onClick={() => setGoalScorers((prev) => prev.filter((_, i) => i !== idx))}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Highlights URL */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground">Highlights URL</label>
        <Input
          placeholder="https://youtube.com/..."
          value={highlightUrl}
          onChange={(e) => setHighlightUrl(e.target.value)}
          className="h-8 bg-secondary text-foreground text-xs"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
          {submitLabel}
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ─── Match Card ─────────────────────────────────────────────────────────

interface ScoreDisplayProps {
  match: Match
  getPlayerName: (id: string) => string
  teamALabel?: string
  teamBLabel?: string
  isAdmin: boolean
  allMatchPlayers: string[]
  onDelete: (id: string) => void
  onUpdate: (id: string, updated: Match) => void
}

function ScoreDisplay({ match, getPlayerName, teamALabel = "Team A", teamBLabel = "Team B", isAdmin, allMatchPlayers, onDelete, onUpdate }: ScoreDisplayProps) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (editing) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-primary">Edit Match</CardTitle>
        </CardHeader>
        <CardContent>
          <MatchForm
            initial={{
              date: match.date,
              matchType: match.matchType,
              teamAScore: match.teamAScore,
              teamBScore: match.teamBScore,
              teamA: match.teamA,
              teamB: match.teamB,
              goalScorers: match.goalScorers,
              highlightUrl: match.highlightUrl,
            }}
            allMatchPlayers={[...match.teamA, ...match.teamB]}
            getPlayerName={getPlayerName}
            teamALabel={teamALabel}
            teamBLabel={teamBLabel}
            onSave={(data) => {
              onUpdate(match.id, { ...data, id: match.id })
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(match.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {match.matchType === "friendly" ? (
              <Badge variant="outline" className="text-[9px] border-draw/40 text-draw px-1.5 py-0">Friendly</Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] border-primary/40 text-primary px-1.5 py-0">League</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {match.highlightUrl && (
              <a
                href={match.highlightUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-primary hover:underline mr-1"
              >
                <Video className="h-3 w-3" /> Highlights <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Edit match"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 rounded-md hover:bg-loss/10 text-muted-foreground hover:text-loss transition-colors"
                  aria-label="Delete match"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="rounded-lg border border-loss/30 bg-loss/5 p-3 mb-3 flex flex-col gap-2">
            <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-loss" />
              Delete this match?
            </p>
            {match.matchType === "league" && (
              <p className="text-[10px] text-muted-foreground">
                League match stats (W/D/L, goals, form) will be reversed from all players.
              </p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onDelete(match.id)
                  setConfirmDelete(false)
                }}
                className="flex-1 h-9 bg-loss text-foreground hover:bg-loss/90 text-xs"
              >
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 h-9 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 py-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-primary">{teamALabel}</span>
            <span className="text-4xl font-black text-foreground">{match.teamAScore}</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border">
            <span className="text-sm font-bold text-muted-foreground">VS</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-loss">{teamBLabel}</span>
            <span className="text-4xl font-black text-foreground">{match.teamBScore}</span>
          </div>
        </div>

        {match.teamAScore !== match.teamBScore && (
          <div className="flex justify-center mb-3">
            <Badge className={cn(
              "text-[10px]",
              match.teamAScore > match.teamBScore ? "bg-primary/15 text-primary border-primary/30" : "bg-loss/15 text-loss border-loss/30"
            )} variant="outline">
              <Trophy className="h-3 w-3 mr-1" />
              {match.teamAScore > match.teamBScore ? teamALabel : teamBLabel} Wins
            </Badge>
          </div>
        )}

        {/* Goal Scorers */}
        {match.goalScorers.length > 0 && (
          <div className="border-t border-border pt-3 mt-1">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Goal Scorers</h4>
            <div className="flex flex-wrap gap-1.5">
              {match.goalScorers.map((gs, i) => (
                <span
                  key={`${gs.playerId}-${i}`}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px]",
                    gs.isOwnGoal ? "bg-loss/10 text-loss" : "bg-secondary text-foreground"
                  )}
                >
                  {getPlayerName(gs.playerId)}
                  {gs.goals > 1 && <span className={cn("font-bold", gs.isOwnGoal ? "text-loss" : "text-primary")}>x{gs.goals}</span>}
                  {gs.isOwnGoal && <span className="text-[8px] font-bold">(OG)</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rosters */}
        <div className="grid grid-cols-2 gap-3 mt-3 border-t border-border pt-3">
          <div>
            <p className="text-[10px] font-bold text-primary mb-1">{teamALabel}</p>
            {match.teamA.map((id) => (
              <p key={id} className="text-[10px] text-muted-foreground">{getPlayerName(id)}</p>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-bold text-loss mb-1">{teamBLabel}</p>
            {match.teamB.map((id) => (
              <p key={id} className="text-[10px] text-muted-foreground">{getPlayerName(id)}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Match Center ──────────────────────────────────────────���────────────

export function MatchCenter() {
  const { players, matches, isAdmin, addMatch, deleteMatch, updateMatch, draft } = useApp()
  const [showNewMatch, setShowNewMatch] = useState(false)
  const [filterType, setFilterType] = useState<"all" | MatchType>("all")

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || "Unknown"
  const draftTeamAName = draft.captainA ? `Team ${getPlayerName(draft.captainA)}` : "Team A"
  const draftTeamBName = draft.captainB ? `Team ${getPlayerName(draft.captainB)}` : "Team B"

  // Include captains in the team lists -- captains are excluded from pairs so they
  // don't appear in draft.teamA / draft.teamB, but they play on their respective teams.
  const draftTeamA = draft.step === "done"
    ? [...(draft.captainA ? [draft.captainA] : []), ...draft.teamA]
    : []
  const draftTeamB = draft.step === "done"
    ? [...(draft.captainB ? [draft.captainB] : []), ...draft.teamB]
    : []
  const allMatchPlayers = draft.step === "done"
    ? [...draftTeamA, ...draftTeamB]
    : players.filter((p) => p.registrationStatus === "in").map((p) => p.id)

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Match Center</h2>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setShowNewMatch(!showNewMatch)}
            className="h-7 bg-primary text-primary-foreground text-[10px] hover:bg-primary/90"
          >
            {showNewMatch ? "Cancel" : "+ New Match"}
          </Button>
        )}
      </div>

      {/* New Match Form */}
      {isAdmin && showNewMatch && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary">Record Match Result</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchForm
              initial={{
                date: new Date().toISOString().split("T")[0],
                matchType: "league",
                teamAScore: 0,
                teamBScore: 0,
                teamA: draft.step === "done" ? draftTeamA : allMatchPlayers.slice(0, Math.ceil(allMatchPlayers.length / 2)),
                teamB: draft.step === "done" ? draftTeamB : allMatchPlayers.slice(Math.ceil(allMatchPlayers.length / 2)),
                goalScorers: [],
                highlightUrl: undefined,
              }}
              allMatchPlayers={allMatchPlayers}
              getPlayerName={getPlayerName}
              teamALabel={draft.step === "done" ? draftTeamAName : "Team A"}
              teamBLabel={draft.step === "done" ? draftTeamBName : "Team B"}
              onSave={(data) => {
                addMatch({ ...data, id: `m-${Date.now()}` })
                setShowNewMatch(false)
              }}
              onCancel={() => setShowNewMatch(false)}
              submitLabel="Save Match"
            />
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      {matches.length > 0 && (
        <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
          {(["all", "league", "friendly"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-[10px] font-medium transition-colors min-h-[36px] capitalize",
                filterType === type
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {type === "all" ? "All" : type === "league" ? "League" : "Friendly"}
              <span className="ml-1 text-muted-foreground">
                ({type === "all" ? matches.length : matches.filter((m) => m.matchType === type).length})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Match List */}
      <div className="flex flex-col gap-3">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Trophy className="h-10 w-10 mb-2" />
            <p className="text-sm">No matches recorded yet</p>
          </div>
        ) : (
          matches
            .filter((m) => filterType === "all" || m.matchType === filterType)
            .map((match) => {
              const mTeamALabel = match.teamA.length > 0 ? `Team ${getPlayerName(match.teamA[0])}` : "Team A"
              const mTeamBLabel = match.teamB.length > 0 ? `Team ${getPlayerName(match.teamB[0])}` : "Team B"
              return (
                <ScoreDisplay
                  key={match.id}
                  match={match}
                  getPlayerName={getPlayerName}
                  teamALabel={mTeamALabel}
                  teamBLabel={mTeamBLabel}
                  isAdmin={isAdmin}
                  allMatchPlayers={[...match.teamA, ...match.teamB]}
                  onDelete={deleteMatch}
                  onUpdate={updateMatch}
                />
              )
            })
        )}
      </div>
    </div>
  )
}
