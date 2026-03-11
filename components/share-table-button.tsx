"use client"

import { useState } from "react"
import { Share2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"
import type { Player } from "@/lib/types"

interface TeamData {
  teamAName: string
  teamBName: string
  captainA: string
  captainB: string
  teamA: string[]
  teamB: string[]
  matchFormat: string
  matchType: string
  coinTossWinner: "A" | "B" | null
}

interface ShareTableButtonProps {
  type: "league" | "scorers" | "teams"
  label?: string
  teamData?: TeamData
}

function drawLeagueTable(players: Player[]): HTMLCanvasElement {
  const sorted = [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    return b.goalDifference - a.goalDifference
  })

  const cols = ["#", "Player", "P", "W", "D", "L", "C", "MP", "GD", "Pts", "PPG", "Form"]
  const colWidths = [32, 140, 32, 32, 32, 32, 32, 32, 40, 40, 42, 90]
  const totalW = colWidths.reduce((s, w) => s + w, 0) + 40 // +padding
  const rowH = 36
  const headerH = 44
  const titleH = 56
  const totalH = titleH + headerH + sorted.length * rowH + 16

  const canvas = document.createElement("canvas")
  canvas.width = totalW * 2
  canvas.height = totalH * 2
  const ctx = canvas.getContext("2d")!
  ctx.scale(2, 2)

  // Background
  ctx.fillStyle = "#0a0a0a"
  ctx.fillRect(0, 0, totalW, totalH)

  // Title
  ctx.fillStyle = "#22c55e"
  ctx.font = "bold 18px system-ui, sans-serif"
  ctx.fillText("MNF League Table", 20, 34)

  // Header row
  let y = titleH
  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, y, totalW, headerH)
  ctx.fillStyle = "#888888"
  ctx.font = "bold 11px system-ui, sans-serif"
  let x = 20
  for (let i = 0; i < cols.length; i++) {
    const align = i === 1 ? "left" : "center"
    if (align === "center") {
      ctx.textAlign = "center"
      ctx.fillText(cols[i], x + colWidths[i] / 2, y + 27)
    } else {
      ctx.textAlign = "left"
      ctx.fillText(cols[i], x, y + 27)
    }
    x += colWidths[i]
  }

  // Data rows
  y += headerH
  sorted.forEach((player, idx) => {
    const pos = idx + 1

    // Alternate row bg
    if (pos <= 3) {
      ctx.fillStyle = "rgba(34,197,94,0.06)"
      ctx.fillRect(0, y, totalW, rowH)
    } else if (idx % 2 === 1) {
      ctx.fillStyle = "#111111"
      ctx.fillRect(0, y, totalW, rowH)
    }

    // Row border
    ctx.strokeStyle = "#222222"
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(totalW, y)
    ctx.stroke()

    const ppg = player.played > 0 ? (player.points / player.played).toFixed(1) : "0.0"
    const values = [
      String(pos),
      player.name,
      String(player.played),
      String(player.won),
      String(player.drawn),
      String(player.lost),
      String(player.captainCount),
      String(player.minusPoints),
      player.goalDifference > 0 ? `+${player.goalDifference}` : String(player.goalDifference),
      String(player.points),
      ppg,
      "", // Form drawn separately
    ]

    x = 20
    for (let i = 0; i < values.length; i++) {
      if (i === 11) {
        // Form - draw colored dots
        const form = player.form.slice(-5)
        const dotSize = 12
        const dotGap = 3
        const formStartX = x + 4
        form.forEach((r, fi) => {
          const dx = formStartX + fi * (dotSize + dotGap)
          const dy = y + 11
          ctx.beginPath()
          ctx.arc(dx + dotSize / 2, dy + dotSize / 2, dotSize / 2, 0, Math.PI * 2)
          ctx.fillStyle = r === "W" ? "rgba(34,197,94,0.2)" : r === "D" ? "rgba(234,179,8,0.2)" : "rgba(239,68,68,0.2)"
          ctx.fill()
          ctx.fillStyle = r === "W" ? "#22c55e" : r === "D" ? "#eab308" : "#ef4444"
          ctx.font = "bold 8px system-ui, sans-serif"
          ctx.textAlign = "center"
          ctx.fillText(r, dx + dotSize / 2, dy + dotSize / 2 + 3)
        })
      } else if (i === 1) {
        ctx.textAlign = "left"
        ctx.font = "600 11px system-ui, sans-serif"
        ctx.fillStyle = "#e5e5e5"
        ctx.fillText(values[i], x, y + 23)
      } else if (i === 9) {
        // Pts - bold green
        ctx.textAlign = "center"
        ctx.font = "bold 12px system-ui, sans-serif"
        ctx.fillStyle = "#22c55e"
        ctx.fillText(values[i], x + colWidths[i] / 2, y + 23)
      } else if (i === 8) {
        // GD - colored
        ctx.textAlign = "center"
        ctx.font = "600 11px system-ui, sans-serif"
        ctx.fillStyle = player.goalDifference > 0 ? "#22c55e" : player.goalDifference < 0 ? "#ef4444" : "#888888"
        ctx.fillText(values[i], x + colWidths[i] / 2, y + 23)
      } else if (i === 7) {
        // MP - red if > 0
        ctx.textAlign = "center"
        ctx.font = "11px system-ui, sans-serif"
        ctx.fillStyle = player.minusPoints > 0 ? "#ef4444" : "#888888"
        ctx.fillText(values[i], x + colWidths[i] / 2, y + 23)
      } else {
        ctx.textAlign = "center"
        ctx.font = "11px system-ui, sans-serif"
        ctx.fillStyle = i === 0 ? "#e5e5e5" : "#999999"
        if (i === 0) ctx.font = "bold 11px system-ui, sans-serif"
        ctx.fillText(values[i], x + colWidths[i] / 2, y + 23)
      }

      x += colWidths[i]
    }

    y += rowH
  })

  return canvas
}

function drawScorersTable(players: Player[]): HTMLCanvasElement {
  const sorted = [...players].filter((p) => p.goals > 0).sort((a, b) => b.goals - a.goals)

  const totalW = 400
  const rowH = 44
  const titleH = 56
  const totalH = titleH + (sorted.length || 1) * rowH + 16

  const canvas = document.createElement("canvas")
  canvas.width = totalW * 2
  canvas.height = totalH * 2
  const ctx = canvas.getContext("2d")!
  ctx.scale(2, 2)

  // Background
  ctx.fillStyle = "#0a0a0a"
  ctx.fillRect(0, 0, totalW, totalH)

  // Title
  ctx.fillStyle = "#22c55e"
  ctx.font = "bold 18px system-ui, sans-serif"
  ctx.fillText("MNF Top Scorers", 20, 34)

  if (sorted.length === 0) {
    ctx.fillStyle = "#888888"
    ctx.font = "14px system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("No goals scored yet.", totalW / 2, titleH + 30)
    return canvas
  }

  let y = titleH
  sorted.forEach((player, idx) => {
    const rank = idx + 1

    // Row bg
    if (rank <= 3) {
      ctx.fillStyle = "rgba(34,197,94,0.06)"
      ctx.fillRect(0, y, totalW, rowH)
    } else if (idx % 2 === 1) {
      ctx.fillStyle = "#111111"
      ctx.fillRect(0, y, totalW, rowH)
    }

    // Border
    ctx.strokeStyle = "#222222"
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(totalW, y)
    ctx.stroke()

    // Rank circle
    const cx = 32
    const cy = y + rowH / 2
    ctx.beginPath()
    ctx.arc(cx, cy, 14, 0, Math.PI * 2)
    if (rank === 1) ctx.fillStyle = "#22c55e"
    else if (rank === 2) ctx.fillStyle = "rgba(34,197,94,0.6)"
    else if (rank === 3) ctx.fillStyle = "rgba(34,197,94,0.3)"
    else ctx.fillStyle = "#1a1a1a"
    ctx.fill()

    ctx.fillStyle = rank <= 2 ? "#0a0a0a" : "#e5e5e5"
    ctx.font = "bold 12px system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(String(rank), cx, cy + 4)

    // Name
    ctx.textAlign = "left"
    ctx.font = "600 13px system-ui, sans-serif"
    ctx.fillStyle = "#e5e5e5"
    ctx.fillText(player.name, 58, y + 20)

    // Sub text
    ctx.font = "10px system-ui, sans-serif"
    ctx.fillStyle = "#888888"
    ctx.fillText(`${player.played} games | ${player.played > 0 ? (player.goals / player.played).toFixed(2) : "0.00"} per game`, 58, y + 34)

    // Goals
    ctx.textAlign = "right"
    ctx.font = "bold 18px system-ui, sans-serif"
    ctx.fillStyle = "#22c55e"
    ctx.fillText(String(player.goals), totalW - 20, y + 28)

    y += rowH
  })

  return canvas
}

function drawTeamsTable(data: TeamData): HTMLCanvasElement {
  const totalW = 420
  const colW = (totalW - 40 - 16) / 2 // two columns with padding and gap
  const titleH = 56
  const badgeH = 32
  const headerH = 36
  const rowH = 32
  const maxPlayers = Math.max(data.teamA.length, data.teamB.length)
  const totalH = titleH + badgeH + headerH + (maxPlayers + 1) * rowH + 24 // +1 for captain

  const canvas = document.createElement("canvas")
  canvas.width = totalW * 2
  canvas.height = totalH * 2
  const ctx = canvas.getContext("2d")!
  ctx.scale(2, 2)

  // Background
  ctx.fillStyle = "#0a0a0a"
  ctx.fillRect(0, 0, totalW, totalH)

  // Title
  ctx.fillStyle = "#22c55e"
  ctx.font = "bold 18px system-ui, sans-serif"
  ctx.textAlign = "left"
  ctx.fillText("MNF Team Lineups", 20, 34)

  // Match info badges
  let y = titleH
  ctx.font = "bold 10px system-ui, sans-serif"
  ctx.textAlign = "center"
  // Format badge
  ctx.fillStyle = "rgba(34,197,94,0.15)"
  const fmtText = data.matchFormat
  const fmtW = ctx.measureText(fmtText).width + 16
  ctx.beginPath()
  ctx.roundRect(totalW / 2 - fmtW / 2 - 40, y, fmtW, 20, 4)
  ctx.fill()
  ctx.fillStyle = "#22c55e"
  ctx.fillText(fmtText, totalW / 2 - 40, y + 14)
  // Type badge
  const typeText = data.matchType === "league" ? "League" : "Friendly"
  const typeW = ctx.measureText(typeText).width + 16
  ctx.fillStyle = data.matchType === "league" ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)"
  ctx.beginPath()
  ctx.roundRect(totalW / 2 + 40 - typeW / 2, y, typeW, 20, 4)
  ctx.fill()
  ctx.fillStyle = data.matchType === "league" ? "#22c55e" : "#eab308"
  ctx.fillText(typeText, totalW / 2 + 40, y + 14)

  y += badgeH

  const leftX = 20
  const rightX = 20 + colW + 16

  // Helper to draw a team column
  const drawTeamColumn = (
    x: number,
    teamName: string,
    captain: string,
    players: string[],
    color: string,
    colorBg: string,
    isFirstPick: boolean,
    isKickOff: boolean,
    startY: number,
  ) => {
    // Team header bg
    ctx.fillStyle = colorBg
    ctx.beginPath()
    ctx.roundRect(x, startY, colW, headerH, [6, 6, 0, 0])
    ctx.fill()

    // Team name
    ctx.textAlign = "left"
    ctx.font = "bold 13px system-ui, sans-serif"
    ctx.fillStyle = color
    ctx.fillText(teamName, x + 10, startY + 23)

    // Badge
    if (isFirstPick) {
      ctx.textAlign = "right"
      ctx.font = "bold 8px system-ui, sans-serif"
      ctx.fillStyle = color
      ctx.fillText("1ST PICK", x + colW - 8, startY + 22)
    } else if (isKickOff) {
      ctx.textAlign = "right"
      ctx.font = "bold 8px system-ui, sans-serif"
      ctx.fillStyle = "#eab308"
      ctx.fillText("KICK OFF", x + colW - 8, startY + 22)
    }

    let ry = startY + headerH

    // Captain row
    ctx.fillStyle = colorBg
    ctx.fillRect(x, ry, colW, rowH)
    ctx.textAlign = "left"
    ctx.font = "bold 11px system-ui, sans-serif"
    ctx.fillStyle = color
    ctx.fillText(`\u2655 ${captain}`, x + 10, ry + 21)
    // Capt badge
    ctx.textAlign = "right"
    ctx.font = "bold 7px system-ui, sans-serif"
    ctx.fillText("CAPT", x + colW - 8, ry + 21)
    ry += rowH

    // Players
    players.forEach((name, idx) => {
      if (idx % 2 === 0) {
        ctx.fillStyle = "#111111"
        ctx.fillRect(x, ry, colW, rowH)
      }
      ctx.strokeStyle = "#1a1a1a"
      ctx.beginPath()
      ctx.moveTo(x, ry)
      ctx.lineTo(x + colW, ry)
      ctx.stroke()

      ctx.textAlign = "left"
      ctx.font = "11px system-ui, sans-serif"
      ctx.fillStyle = "#cccccc"
      ctx.fillText(name, x + 10, ry + 21)
      ry += rowH
    })
  }

  drawTeamColumn(
    leftX, data.teamAName, data.captainA, data.teamA,
    "#22c55e", "rgba(34,197,94,0.1)",
    data.coinTossWinner === "A", data.coinTossWinner === "B", y,
  )
  drawTeamColumn(
    rightX, data.teamBName, data.captainB, data.teamB,
    "#ef4444", "rgba(239,68,68,0.1)",
    data.coinTossWinner === "B", data.coinTossWinner === "A", y,
  )

  return canvas
}

export function ShareTableButton({ type, label = "Share", teamData }: ShareTableButtonProps) {
  const { isAdmin, players } = useApp()
  const [loading, setLoading] = useState(false)

  if (!isAdmin) return null

  const handleShare = async () => {
    if (loading) return
    setLoading(true)

    try {
      let canvas: HTMLCanvasElement
      if (type === "teams" && teamData) {
        canvas = drawTeamsTable(teamData)
      } else if (type === "league") {
        canvas = drawLeagueTable(players)
      } else {
        canvas = drawScorersTable(players)
      }

      const titles: Record<string, string> = {
        league: "Monday Night Football - League Table",
        scorers: "Monday Night Football - Top Scorers",
        teams: "Monday Night Football - Team Lineups",
      }

      const dataUrl = canvas.toDataURL("image/png")
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], `mnf-${type}-table.png`, { type: "image/png" })

      // Try native share (mobile)
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "MNF Update",
          text: titles[type] || "MNF Update",
        })
      } else {
        // Download fallback (desktop)
        const a = document.createElement("a")
        a.href = dataUrl
        a.download = `mnf-${type}-table.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error("Share failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleShare}
      disabled={loading}
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 text-xs border-border text-muted-foreground hover:text-foreground"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      {label}
    </Button>
  )
}
