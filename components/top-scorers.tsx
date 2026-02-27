"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import { ShareTableButton } from "@/components/share-table-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TopScorers() {
  const { players, seasons, currentSeasonName } = useApp()
  const [viewingSeason, setViewingSeason] = useState<string>("current")

  const archivedSeason = seasons.find((s) => s.id === viewingSeason)
  const displayPlayers = viewingSeason !== "current" && archivedSeason ? archivedSeason.players : players

  const sorted = [...displayPlayers].filter((p) => p.goals > 0).sort((a, b) => b.goals - a.goals)

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Top Scorers</h2>
        <ShareTableButton type="scorers" label="Share" />
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

      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No goals scored yet.</p>
      )}

      <div className="flex flex-col gap-2">
        {sorted.map((player, idx) => {
          const rank = idx + 1
          return (
            <div
              key={player.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all",
                rank <= 3 && "border-primary/30 bg-primary/5"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  rank === 1 && "bg-primary text-primary-foreground",
                  rank === 2 && "bg-primary/60 text-primary-foreground",
                  rank === 3 && "bg-primary/30 text-foreground",
                  rank > 3 && "bg-secondary text-muted-foreground"
                )}
              >
                {rank}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-semibold text-foreground">{player.name}</span>
                <span className="text-[10px] text-muted-foreground">{player.played} games played</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-lg font-bold text-primary">{player.goals}</span>
                <span className="text-[10px] text-muted-foreground">
                  {player.played > 0 ? (player.goals / player.played).toFixed(2) : "0.00"} per game
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
