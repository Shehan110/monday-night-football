"use client"

import { useApp } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Trophy, AlertTriangle } from "lucide-react"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function formatHour(h: number) {
  if (h === 0) return "12am"
  if (h < 12) return `${h}am`
  if (h === 12) return "12pm"
  return `${h - 12}pm`
}

export function RulesView() {
  const { leagueRules } = useApp()

  return (
    <div className="flex flex-col gap-4 px-4">
      <h2 className="text-lg font-bold text-foreground">League Rules</h2>

      {/* Match Schedule */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-primary" /> Match Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Match Day</span>
            <span className="text-xs font-semibold text-foreground">{DAY_NAMES[leagueRules.matchDay]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Registration Opens</span>
            <span className="text-xs font-semibold text-foreground">{DAY_NAMES[leagueRules.registrationOpenDay]} at {formatHour(leagueRules.registrationOpenHour)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Max Players Per Match</span>
            <span className="text-xs font-semibold text-foreground">{leagueRules.maxSpots}</span>
          </div>
        </CardContent>
      </Card>

      {/* Points System */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-primary" /> Points System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center rounded-lg bg-secondary/50 p-3">
              <span className="text-lg font-bold text-win">{leagueRules.winPoints}</span>
              <span className="text-[10px] text-muted-foreground">Win</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-secondary/50 p-3">
              <span className="text-lg font-bold text-draw">{leagueRules.drawPoints}</span>
              <span className="text-[10px] text-muted-foreground">Draw</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-secondary/50 p-3">
              <span className="text-lg font-bold text-loss">{leagueRules.lossPoints}</span>
              <span className="text-[10px] text-muted-foreground">Loss</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Penalties */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-primary" /> Withdrawal Penalties
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-lg bg-loss/10 px-3 py-2">
            <span className="text-xs text-foreground">{leagueRules.penaltyLateLabel}</span>
            <span className="text-xs font-bold text-loss">-{leagueRules.penaltyLate} pt{leagueRules.penaltyLate !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-loss/10 px-3 py-2">
            <span className="text-xs text-foreground">{leagueRules.penaltyEarlyLabel}</span>
            <span className="text-xs font-bold text-loss">-{leagueRules.penaltyEarly} pt{leagueRules.penaltyEarly !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-win/10 px-3 py-2">
            <span className="text-xs text-foreground">{leagueRules.noPenaltyLabel}</span>
            <span className="text-xs font-bold text-win">No penalty</span>
          </div>
        </CardContent>
      </Card>


    </div>
  )
}
