"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { ShareTableButton } from "@/components/share-table-button"
import { ChevronUp, ChevronDown, Minus, Pencil, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Player, FormResult } from "@/lib/types"

function FormDot({ result }: { result: FormResult }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
        result === "W" && "bg-win/20 text-win",
        result === "D" && "bg-draw/20 text-draw",
        result === "L" && "bg-loss/20 text-loss"
      )}
      aria-label={result === "W" ? "Win" : result === "D" ? "Draw" : "Loss"}
    >
      {result}
    </span>
  )
}

function PositionChange({ current, previous }: { current: number; previous: number }) {
  if (current < previous) return <ChevronUp className="h-3 w-3 text-win" />
  if (current > previous) return <ChevronDown className="h-3 w-3 text-loss" />
  return <Minus className="h-3 w-3 text-muted-foreground" />
}

interface EditPlayerFormProps {
  player: Player
  onSave: (updates: Partial<Player>) => void
  onClose: () => void
}

const editFields = ["played", "won", "drawn", "lost", "captainCount", "minusPoints", "goalDifference", "goals"] as const
type EditField = (typeof editFields)[number]

const fieldLabels: Record<EditField, string> = {
  played: "Played",
  won: "Won",
  drawn: "Drawn",
  lost: "Lost",
  captainCount: "Captain (C)",
  minusPoints: "Minus Pts",
  goalDifference: "GD",
  goals: "Goals",
}

function EditPlayerForm({ player, onSave, onClose }: EditPlayerFormProps) {
  const [formData, setFormData] = useState<Record<EditField, string>>(() => {
    const obj = {} as Record<EditField, string>
    for (const f of editFields) obj[f] = String(player[f])
    return obj
  })

  const toNum = (val: string) => {
    const n = parseInt(val, 10)
    return isNaN(n) ? 0 : n
  }

  const handleSubmit = () => {
    const nums = {} as Record<EditField, number>
    for (const f of editFields) nums[f] = toNum(formData[f])
    const points = nums.won * 3 + nums.drawn - nums.minusPoints
    onSave({ ...nums, points })
    onClose()
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-semibold text-foreground">{player.name}</h3>
      <div className="grid grid-cols-2 gap-3">
        {editFields.map((field) => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">{fieldLabels[field]}</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="-?[0-9]*"
              value={formData[field]}
              onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
              className="h-9 bg-secondary text-foreground text-sm"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
          <Check className="mr-1 h-4 w-4" /> Save
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1">
          <X className="mr-1 h-4 w-4" /> Cancel
        </Button>
      </div>
    </div>
  )
}

export function LeagueTable() {
  const { players, isAdmin, updatePlayer, seasons, currentSeasonName } = useApp()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingSeason, setViewingSeason] = useState<string>("current")

  const isViewingArchive = viewingSeason !== "current"
  const archivedSeason = seasons.find((s) => s.id === viewingSeason)
  const displayPlayers = isViewingArchive && archivedSeason ? archivedSeason.players : players

  const sorted = [...displayPlayers].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    return b.goalDifference - a.goalDifference
  })

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">League Table</h2>
        <div className="flex items-center gap-2">
          <ShareTableButton type="league" label="Share" />
          <span className="text-xs text-muted-foreground">{displayPlayers.length} players</span>
        </div>
      </div>

      {seasons.length > 0 && (
        <Select value={viewingSeason} onValueChange={setViewingSeason}>
          <SelectTrigger className="h-9 bg-secondary text-foreground text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="current" className="text-xs text-foreground">{currentSeasonName} (Current)</SelectItem>
            {seasons.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-xs text-foreground">{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <ScrollArea className="w-full rounded-lg border border-border">
        <div className="min-w-[700px]">
          <div className="sticky top-0 grid grid-cols-[28px_28px_minmax(100px,1fr)_repeat(9,36px)_80px] items-center gap-0 bg-secondary/80 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
            <span></span>
            <span className="text-center">#</span>
            <span>Player</span>
            <span className="text-center">P</span>
            <span className="text-center">W</span>
            <span className="text-center">D</span>
            <span className="text-center">L</span>
            <span className="text-center">C</span>
            <span className="text-center">MP</span>
            <span className="text-center">GD</span>
            <span className="text-center">Pts</span>
            <span className="text-center">PPG</span>
            <span className="text-center">Form</span>
          </div>

          {sorted.map((player, idx) => {
            const position = idx + 1
            const ppg = player.played > 0 ? (player.points / player.played).toFixed(1) : "0.0"

            return (
              <div
                key={player.id}
                className={cn(
                  "grid grid-cols-[28px_28px_minmax(100px,1fr)_repeat(9,36px)_80px] items-center gap-0 border-t border-border px-2 py-2 text-xs transition-colors",
                  position <= 3 && "bg-primary/5",
                  isAdmin && "hover:bg-secondary/60"
                )}
              >
                <span className="flex justify-center">
                  <PositionChange current={position} previous={player.previousPosition} />
                </span>
                <span className="text-center font-bold text-foreground">{position}</span>
                <span className="flex items-center gap-1 truncate font-medium text-foreground">
                  {player.name}
                  {isAdmin && !isViewingArchive && (
                    <Dialog open={editingId === player.id} onOpenChange={(open) => setEditingId(open ? player.id : null)}>
                      <DialogTrigger asChild>
                        <button className="ml-1 text-muted-foreground hover:text-primary" aria-label={`Edit ${player.name}`}>
                          <Pencil className="h-3 w-3" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-card text-foreground border-border max-w-sm">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Edit Player Stats</DialogTitle>
                        </DialogHeader>
                        <EditPlayerForm
                          player={player}
                          onSave={(updates) => updatePlayer(player.id, updates)}
                          onClose={() => setEditingId(null)}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </span>
                <span className="text-center text-muted-foreground">{player.played}</span>
                <span className="text-center text-muted-foreground">{player.won}</span>
                <span className="text-center text-muted-foreground">{player.drawn}</span>
                <span className="text-center text-muted-foreground">{player.lost}</span>
                <span className="text-center text-muted-foreground">{player.captainCount}</span>
                <span className={cn("text-center", player.minusPoints < 0 ? "text-loss font-semibold" : "text-muted-foreground")}>{player.minusPoints}</span>
                <span className={cn("text-center font-semibold", player.goalDifference > 0 ? "text-win" : player.goalDifference < 0 ? "text-loss" : "text-muted-foreground")}>{player.goalDifference > 0 ? `+${player.goalDifference}` : player.goalDifference}</span>
                <span className="text-center font-bold text-primary">{player.points}</span>
                <span className="text-center text-muted-foreground">{ppg}</span>
                <span className="flex items-center justify-center gap-0.5">
                  {player.form.slice(-5).map((r, i) => (
                    <FormDot key={i} result={r} />
                  ))}
                </span>
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
