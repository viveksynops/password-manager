import { useState, useEffect, useCallback } from "react"
import {
  ShieldCheck,
  KeyRound,
  Copy,
  ExternalLink,
  Lock,
  Search,
  Check,
  Globe,
  LogIn,
  RefreshCw,
  Loader2,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const WEB_ORIGIN =
  (import.meta.env.VITE_WEB_URL as string) ||
  "https://password-manager-beige-seven.vercel.app"

interface CredentialItem {
  id: string
  serviceName: string
  username: string
  passwordMasked: string
  loginUrl?: string | null
}

interface UserProfile {
  id: string
  email: string
  fullName: string | null
  role: string
}

export default function App() {
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [activeDomain, setActiveDomain] = useState<string>("")
  const [credentials, setCredentials] = useState<CredentialItem[]>([])
  const [loadingCreds, setLoadingCreds] = useState(false)
  const [search, setSearch] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filledId, setFilledId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Record user activity to reset background 15-minute inactivity timer
  const recordActivity = useCallback(() => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "CV_RECORD_ACTIVITY" })
    }
  }, [])

  // 1. Get current active tab hostname
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0]
        if (activeTab?.url) {
          try {
            const url = new URL(activeTab.url)
            if (url.protocol === "http:" || url.protocol === "https:") {
              setActiveDomain(url.hostname.replace(/^www\./, ""))
            }
          } catch {
            setActiveDomain("")
          }
        }
      })
    }
  }, [])

  // 2. Check web app session and background lock status
  const checkSession = useCallback(async () => {
    setCheckingAuth(true)
    setErrorMsg(null)

    // Check background auto-lock state
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "CV_GET_LOCK_STATUS" }, (res) => {
        if (res?.isLocked) {
          setIsLocked(true)
        }
      })
    }

    try {
      const res = await fetch(`${WEB_ORIGIN}/api/extension/session`, {
        method: "GET",
        credentials: "include",
      })
      if (!res.ok) {
        setUser(null)
        setCheckingAuth(false)
        return
      }
      const data = await res.json()
      if (data.authenticated && data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
      setErrorMsg("Unable to connect to Company Vault web server at " + WEB_ORIGIN)
    } finally {
      setCheckingAuth(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const handleLockVault = () => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "CV_MANUAL_LOCK" }, () => {
        setIsLocked(true)
      })
    } else {
      setIsLocked(true)
    }
  }

  const handleUnlockVault = () => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "CV_MANUAL_UNLOCK" }, () => {
        setIsLocked(false)
        checkSession()
      })
    } else {
      setIsLocked(false)
    }
  }

  // 3. Load credentials matching active domain
  const fetchCredentials = useCallback(async () => {
    if (!user) return
    setLoadingCreds(true)
    try {
      const res = await fetch(`${WEB_ORIGIN}/api/extension/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          domain: activeDomain || "all",
          action: "list",
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setCredentials(data.credentials || [])
      }
    } catch (e) {
      console.error("Failed to load credentials", e)
    } finally {
      setLoadingCreds(false)
    }
  }, [user, activeDomain])

  useEffect(() => {
    if (user) {
      fetchCredentials()
    }
  }, [user, fetchCredentials])

  // Copy decrypted password
  const handleCopyPassword = async (cred: CredentialItem) => {
    recordActivity()
    try {
      const res = await fetch(`${WEB_ORIGIN}/api/extension/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "fill",
          credentialId: cred.id,
          domain: activeDomain,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.password) {
          await navigator.clipboard.writeText(data.password)
          setCopiedId(cred.id)
          setTimeout(() => setCopiedId(null), 2000)
        }
      }
    } catch (e) {
      console.error("Failed to copy password", e)
    }
  }

  // Fill credentials into active tab
  const handleFill = async (cred: CredentialItem) => {
    recordActivity()
    try {
      const res = await fetch(`${WEB_ORIGIN}/api/extension/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "fill",
          credentialId: cred.id,
          domain: activeDomain,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.password && typeof chrome !== "undefined" && chrome.tabs?.query) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0]
            if (activeTab?.id) {
              chrome.tabs.sendMessage(activeTab.id, {
                type: "CV_AUTOFILL_CREDENTIAL",
                payload: {
                  username: data.username,
                  password: data.password,
                },
              })
              setFilledId(cred.id)
              setTimeout(() => setFilledId(null), 2000)
            }
          })
        }
      }
    } catch (e) {
      console.error("Failed to fill credential", e)
    }
  }

  const openWebLogin = () => {
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url: `${WEB_ORIGIN}/login` })
    } else {
      window.open(`${WEB_ORIGIN}/login`, "_blank")
    }
  }

  const filtered = credentials.filter(
    (c) =>
      c.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase())
  )

  // Loading Screen
  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center w-[380px] h-[500px] bg-background text-foreground border border-border">
        <Loader2 className="size-6 text-primary animate-spin mb-3" />
        <p className="text-xs text-muted-foreground font-medium">Checking web session...</p>
      </div>
    )
  }

  // Unauthenticated Screen (Web SSO Prompt)
  if (!user) {
    return (
      <div className="flex flex-col w-[380px] h-[500px] bg-background text-foreground border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <KeyRound className="size-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">Company Vault</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Secrets & Logins</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 text-[11px] border-amber-500/30 text-amber-400 bg-amber-500/10">
            <Lock className="size-3" />
            Locked
          </Badge>
        </div>

        {/* Not Signed In Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="size-12 rounded-full bg-muted/60 border border-border flex items-center justify-center mb-4 text-muted-foreground">
            <LogIn className="size-6 text-primary" />
          </div>
          <h2 className="text-base font-semibold">Web Sign-In Required</h2>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-[260px] leading-relaxed">
            Please sign in to Company Vault on the web to sync and autofill your encrypted passwords.
          </p>

          {errorMsg && (
            <p className="text-[11px] text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded-md mt-3 w-full">
              {errorMsg}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2 w-full max-w-[240px]">
            <Button onClick={openWebLogin} className="w-full gap-2">
              <LogIn className="size-3.5" />
              Sign in with Web
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={checkSession}
              className="w-full gap-1.5 text-xs text-muted-foreground"
            >
              <RefreshCw className="size-3" />
              Check Session Again
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-border bg-card/40 text-center">
          <span className="text-[10px] text-muted-foreground">
            Connects securely via Company Vault Web Session
          </span>
        </div>
      </div>
    )
  }

  // Auto-Lock Inactivity Screen
  if (isLocked) {
    return (
      <div className="flex flex-col w-[380px] h-[500px] bg-background text-foreground border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Lock className="size-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">Company Vault</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Secrets & Logins</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 text-[11px] border-amber-500/30 text-amber-400 bg-amber-500/10">
            <Lock className="size-3" />
            Auto-Locked
          </Badge>
        </div>

        {/* Locked Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="size-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
            <Lock className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Vault Locked</h2>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-[260px] leading-relaxed">
            Your vault was locked after 15 minutes of inactivity to protect your credentials.
          </p>

          <div className="mt-6 flex flex-col gap-2 w-full max-w-[240px]">
            <Button onClick={handleUnlockVault} className="w-full gap-2">
              <ShieldCheck className="size-3.5" />
              Unlock Vault
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openWebLogin}
              className="w-full gap-1.5 text-xs text-muted-foreground"
            >
              <ExternalLink className="size-3" />
              Open Web App
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-border bg-card/40 text-center">
          <span className="text-[10px] text-muted-foreground">
            Auto-lock active (15-minute inactivity protection)
          </span>
        </div>
      </div>
    )
  }

  // Authenticated Screen
  return (
    <div className="flex flex-col w-[380px] h-[520px] bg-background text-foreground border border-border">
      {/* Extension Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <KeyRound className="size-4" />
          </div>
          <div className="truncate max-w-[190px]">
            <h1 className="text-sm font-semibold leading-none truncate">
              {user.fullName || user.email.split("@")[0]}
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate flex items-center gap-1">
              <User className="size-2.5" /> {user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0.5 border-primary/30 text-primary bg-primary/10">
            {user.role}
          </Badge>
          <Badge variant="outline" className="gap-1 text-[11px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            <ShieldCheck className="size-3" />
            Active
          </Badge>
        </div>
      </div>

      {/* Active Tab Domain Banner */}
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground truncate">
          <Globe className="size-3.5 text-primary shrink-0" />
          <span className="font-mono text-[11px] truncate max-w-[210px]">
            {activeDomain || "No active web tab"}
          </span>
        </div>
        <Badge variant="secondary" className="text-[10px] font-medium shrink-0">
          {credentials.length} matched
        </Badge>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search matching logins..."
            className="pl-8 h-8 text-xs bg-muted/30"
          />
        </div>
      </div>

      {/* Credentials List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {loadingCreds ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="size-5 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
            <KeyRound className="size-6 mb-2 opacity-40" />
            <p className="text-xs font-medium">No credentials for this domain</p>
            <p className="text-[11px] mt-0.5 text-muted-foreground/80 max-w-[240px]">
              {activeDomain ? `No logins found matching ${activeDomain}` : "Navigate to a site to autofill credentials"}
            </p>
          </div>
        ) : (
          filtered.map((cred) => (
            <Card key={cred.id} className="p-3 bg-card/80 border-border/80 shadow-xs">
              <CardHeader className="p-0 pb-1.5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold">{cred.serviceName}</CardTitle>
                  <Button
                    size="xs"
                    variant={filledId === cred.id ? "default" : "secondary"}
                    onClick={() => handleFill(cred)}
                    className="h-6 text-[10px] px-2 gap-1"
                  >
                    {filledId === cred.id ? (
                      <>
                        <Check className="size-2.5" /> Filled
                      </>
                    ) : (
                      "Autofill"
                    )}
                  </Button>
                </div>
                <CardDescription className="text-[11px] font-mono text-muted-foreground truncate">
                  {cred.username}
                </CardDescription>
              </CardHeader>
              <Separator className="my-1.5 opacity-50" />
              <CardContent className="p-0 flex items-center justify-between text-[11px]">
                <span className="font-mono text-muted-foreground tracking-widest text-xs">
                  {cred.passwordMasked}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => handleCopyPassword(cred)}
                    title="Copy password"
                  >
                    {copiedId === cred.id ? (
                      <Check className="size-3 text-emerald-400" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                  {cred.loginUrl && (
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => window.open(cred.loginUrl!, "_blank")}
                      title="Open website"
                    >
                      <ExternalLink className="size-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Extension Footer */}
      <div className="p-2.5 border-t border-border bg-card/40 flex items-center justify-between">
        <Button
          size="xs"
          variant="ghost"
          className="text-xs text-muted-foreground hover:text-foreground gap-1"
          onClick={() => window.open(WEB_ORIGIN, "_blank")}
        >
          <ExternalLink className="size-3" />
          Dashboard
        </Button>
        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="ghost"
            onClick={checkSession}
            className="text-xs gap-1 text-muted-foreground hover:text-foreground"
            title="Sync session with web"
          >
            <RefreshCw className="size-3" />
            Sync
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={handleLockVault}
            className="text-xs gap-1 border-border text-muted-foreground hover:text-foreground"
            title="Lock Vault now"
          >
            <Lock className="size-3" />
            Lock
          </Button>
        </div>
      </div>
    </div>
  )
}
