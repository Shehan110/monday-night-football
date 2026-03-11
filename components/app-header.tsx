"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ShieldCheck, Users, LogOut, Crown, Bell, X } from "lucide-react"

export function AppHeader() {
  const {
    isAdmin, logoutAdmin, role, isCaptain, captainTeam,
    loggedInPlayerId, players,
    notifications, markNotificationRead, clearNotifications,
    unreadAdminCount, unreadPlayerCount,
  } = useApp()
  const loggedInPlayer = loggedInPlayerId ? players.find((p) => p.id === loggedInPlayerId) : null
  const [showNotifications, setShowNotifications] = useState(false)

  const handleExit = () => {
    logoutAdmin()
  }

  // Determine which notifications to show
  const myNotifications = isAdmin
    ? notifications.filter((n) => n.forAdmin)
    : loggedInPlayerId
      ? notifications.filter((n) => n.forPlayerId === loggedInPlayerId)
      : []
  const unreadCount = isAdmin ? unreadAdminCount : loggedInPlayerId ? unreadPlayerCount(loggedInPlayerId) : 0

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 overflow-hidden rounded-full shrink-0">
            <Image src="/images/mnf-logo.jpeg" alt="MNF Logo" width={32} height={32} className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-foreground">Monday Night Football</h1>
            <p className="text-[10px] text-muted-foreground">7-a-side League</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5">
            {isAdmin ? (
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            ) : isCaptain ? (
              <Crown className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className={`text-[11px] font-medium ${isAdmin || isCaptain ? "text-primary" : "text-muted-foreground"}`}>
              {isAdmin ? "Admin" : isCaptain ? `Captain ${captainTeam}` : loggedInPlayer ? loggedInPlayer.name : "Player"}
            </span>
          </div>

          {/* Notification bell */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors hover:bg-secondary"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-loss px-1 text-[9px] font-bold text-background">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={handleExit}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors hover:bg-secondary"
            aria-label="Exit to role selection"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Notification dropdown */}
      {showNotifications && (
        <div className="absolute right-2 top-full z-50 mt-1 w-[calc(100%-16px)] max-w-sm rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <span className="text-xs font-bold text-foreground">Notifications</span>
            <div className="flex items-center gap-2">
              {myNotifications.length > 0 && (
                <button
                  onClick={() => clearNotifications()}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
              <button onClick={() => setShowNotifications(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {myNotifications.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground text-center">No notifications</p>
            ) : (
              myNotifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left border-b border-border last:border-0 transition-colors",
                    !n.read ? "bg-primary/5" : "bg-transparent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                    <span className="text-xs font-medium text-foreground">{n.message}</span>
                  </div>
                  {n.detail && <span className="text-[10px] text-muted-foreground pl-3.5">{n.detail}</span>}
                  <span className="text-[9px] text-muted-foreground pl-3.5">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  )
}
