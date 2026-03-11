"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { Shield, Users, Lock, Crown } from "lucide-react"

const STORAGE_KEY_PLAYER = "mnf_remember_player"
const STORAGE_KEY_ADMIN = "mnf_remember_admin"

export function RoleSelect() {
  const { loginAdmin, loginCaptain, loginPlayer, draft } = useApp()

  // Check localStorage for saved credentials
  const savedPlayerPw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_PLAYER) : null
  const savedAdminPw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_ADMIN) : null

  // Player login state - pre-fill if remembered
  const [showPlayerLogin, setShowPlayerLogin] = useState(!!savedPlayerPw)
  const [playerPassword, setPlayerPassword] = useState(savedPlayerPw ?? "")
  const [playerError, setPlayerError] = useState(false)
  const [rememberPlayer, setRememberPlayer] = useState(!!savedPlayerPw)

  // Admin login state - pre-fill if remembered
  const [showPassword, setShowPassword] = useState(!!savedAdminPw)
  const [password, setPassword] = useState(savedAdminPw ?? "")
  const [error, setError] = useState(false)
  const [rememberAdmin, setRememberAdmin] = useState(!!savedAdminPw)

  // Captain login state
  const [showCaptainPassword, setShowCaptainPassword] = useState(false)
  const [captainPassword, setCaptainPassword] = useState("")
  const [captainError, setCaptainError] = useState(false)

  const captainsSet = draft.captainAPassword && draft.captainBPassword
  const draftActive = draft.step === "toss" || draft.step === "pick"
  const showCaptainOption = captainsSet && draftActive

  const handlePlayerLogin = () => {
    if (!playerPassword) return
    const success = loginPlayer(playerPassword)
    if (success) {
      if (rememberPlayer) {
        localStorage.setItem(STORAGE_KEY_PLAYER, playerPassword)
      } else {
        localStorage.removeItem(STORAGE_KEY_PLAYER)
      }
      setPlayerPassword("")
      setPlayerError(false)
    } else {
      setPlayerError(true)
    }
  }

  const handleAdminLogin = () => {
    const success = loginAdmin(password)
    if (success) {
      if (rememberAdmin) {
        localStorage.setItem(STORAGE_KEY_ADMIN, password)
      } else {
        localStorage.removeItem(STORAGE_KEY_ADMIN)
      }
      setPassword("")
      setError(false)
    } else {
      setError(true)
    }
  }

  const handleCaptainLogin = () => {
    const result = loginCaptain(captainPassword)
    if (result) {
      setCaptainPassword("")
      setCaptainError(false)
    } else {
      setCaptainError(true)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 safe-area-top safe-area-bottom">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-20 w-20 overflow-hidden rounded-full shadow-lg shadow-primary/20">
            <Image src="/images/mnf-logo.jpeg" alt="MNF Logo" width={80} height={80} className="h-full w-full object-cover" priority />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Monday Night Football</h1>
            <p className="mt-1 text-sm text-muted-foreground">7-a-side League Manager</p>
          </div>
        </div>

        {/* Role Cards */}
        <div className="flex w-full flex-col gap-3">

          {/* Player Login Card */}
          {!showPlayerLogin ? (
            <button
              onClick={() => setShowPlayerLogin(true)}
              className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:bg-card/80 active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Users className="h-6 w-6 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Player</p>
                <p className="text-xs text-muted-foreground">Login to set your availability (In / Out)</p>
              </div>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Player Login</p>
                  <p className="text-xs text-muted-foreground">Enter your password to log in</p>
                </div>
              </div>

              <Input
                type="password"
                placeholder="Password"
                value={playerPassword}
                onChange={(e) => { setPlayerPassword(e.target.value); setPlayerError(false) }}
                onKeyDown={(e) => { if (e.key === "Enter") handlePlayerLogin() }}
                className="h-11 bg-secondary text-foreground text-base"
                autoFocus
              />

              {playerError && (
                <p className="text-xs text-loss">Incorrect password. Try again.</p>
              )}

              <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                <Checkbox
                  checked={rememberPlayer}
                  onCheckedChange={(checked) => setRememberPlayer(checked === true)}
                  className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-xs text-muted-foreground">Remember me</span>
              </label>

              <div className="flex gap-2">
                <Button
                  onClick={handlePlayerLogin}
                  disabled={!playerPassword}
                  className="h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPlayerLogin(false)
                    setPlayerPassword("")
                    setPlayerError(false)
                  }}
                  className="h-11"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Captain Card */}
          {showCaptainOption && (
            <>
              {!showCaptainPassword ? (
                <button
                  onClick={() => setShowCaptainPassword(true)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-primary/30 bg-card p-4 text-left transition-all hover:border-primary/40 hover:bg-card/80 active:scale-[0.98]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Captain</p>
                    <p className="text-xs text-muted-foreground">Login to do the coin toss and draft picks</p>
                  </div>
                  <Lock className="h-4 w-4 text-primary" />
                </button>
              ) : (
                <div className="flex w-full flex-col gap-3 rounded-xl border border-primary/30 bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Captain Login</p>
                      <p className="text-xs text-muted-foreground">Enter the password given by the admin</p>
                    </div>
                  </div>
                  <Input
                    type="password"
                    placeholder="Captain password"
                    value={captainPassword}
                    onChange={(e) => { setCaptainPassword(e.target.value); setCaptainError(false) }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCaptainLogin() }}
                    className="h-11 bg-secondary text-foreground text-base"
                    autoFocus
                  />
                  {captainError && (
                    <p className="text-xs text-loss">Incorrect password. Try again.</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCaptainLogin}
                      className="h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Enter as Captain
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setShowCaptainPassword(false); setCaptainPassword(""); setCaptainError(false) }}
                      className="h-11"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Admin Card */}
          {!showPassword ? (
            <button
              onClick={() => setShowPassword(true)}
              className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:bg-card/80 active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">Manage players, results, and league settings</p>
              </div>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <div className="flex w-full flex-col gap-3 rounded-xl border border-primary/30 bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Admin Login</p>
                  <p className="text-xs text-muted-foreground">Enter your password</p>
                </div>
              </div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false) }}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdminLogin() }}
                className="h-11 bg-secondary text-foreground text-base"
                autoFocus
              />
              {error && (
                <p className="text-xs text-loss">Incorrect password. Try again.</p>
              )}

              <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                <Checkbox
                  checked={rememberAdmin}
                  onCheckedChange={(checked) => setRememberAdmin(checked === true)}
                  className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-xs text-muted-foreground">Remember me</span>
              </label>

              <div className="flex gap-2">
                <Button
                  onClick={handleAdminLogin}
                  className="h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Unlock
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowPassword(false); setPassword(""); setError(false) }}
                  className="h-11"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground/60">v1.0</p>
      </div>
    </div>
  )
}
