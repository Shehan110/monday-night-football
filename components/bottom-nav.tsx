"use client"

import { Trophy, Target, UserPlus, Swords, Shield, ScrollText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/store"

export type TabId = "league" | "scorers" | "registration" | "match" | "rules" | "admin"

const allTabs: { id: TabId; label: string; icon: typeof Trophy; adminOnly?: boolean; playerOnly?: boolean }[] = [
  { id: "league", label: "League", icon: Trophy },
  { id: "scorers", label: "Scorers", icon: Target },
  { id: "registration", label: "Register", icon: UserPlus },
  { id: "match", label: "Match", icon: Swords },
  { id: "rules", label: "Rules", icon: ScrollText, playerOnly: true },
  { id: "admin", label: "Admin", icon: Shield, adminOnly: true },
]

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { isAdmin, isCaptain } = useApp()
  const tabs = allTabs.filter((tab) => {
    if (tab.adminOnly) return isAdmin
    if (tab.playerOnly) return !isAdmin
    return true
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex min-h-[52px] min-w-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_var(--primary)]")} />
              <span className={cn("text-[10px] leading-tight", isActive && "font-semibold")}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
