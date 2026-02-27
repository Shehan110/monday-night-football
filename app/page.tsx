"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/lib/store"
import { RoleSelect } from "@/components/role-select"
import { BottomNav, type TabId } from "@/components/bottom-nav"
import { AppHeader } from "@/components/app-header"
import { LeagueTable } from "@/components/league-table"
import { TopScorers } from "@/components/top-scorers"
import { Registration } from "@/components/registration"
import { MatchCenter } from "@/components/match-center"
import { AdminPanel } from "@/components/admin-panel"
import { RulesView } from "@/components/rules-view"
import { TeamDraft } from "@/components/team-draft"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  const { role, isCaptain } = useApp()
  const [activeTab, setActiveTab] = useState<TabId>("league")

  // Auto-navigate captains to the draft tab
  useEffect(() => {
    if (isCaptain) {
      setActiveTab("registration")
    }
  }, [isCaptain])

  if (role === "none") {
    return <RoleSelect />
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader />

      <main className="flex-1 pb-20 pt-4">
        {activeTab === "league" && (
          <Tabs defaultValue="table" className="px-4 mb-4">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="table" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">League Table</TabsTrigger>
              <TabsTrigger value="scorers" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Top Scorers</TabsTrigger>
            </TabsList>
            <TabsContent value="table" className="mt-4 -mx-4">
              <LeagueTable />
            </TabsContent>
            <TabsContent value="scorers" className="mt-4 -mx-4">
              <TopScorers />
            </TabsContent>
          </Tabs>
        )}

        {activeTab === "scorers" && <TopScorers />}

        {activeTab === "registration" && (
          <Tabs defaultValue={isCaptain ? "draft" : "register"} className="px-4 mb-4">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="register" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Registration</TabsTrigger>
              <TabsTrigger value="draft" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Team Draft</TabsTrigger>
            </TabsList>
            <TabsContent value="register" className="mt-4 -mx-4">
              <Registration />
            </TabsContent>
            <TabsContent value="draft" className="mt-4 -mx-4">
              <TeamDraft />
            </TabsContent>
          </Tabs>
        )}

        {activeTab === "match" && <MatchCenter />}
        {activeTab === "rules" && <RulesView />}
        {activeTab === "admin" && <AdminPanel />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
