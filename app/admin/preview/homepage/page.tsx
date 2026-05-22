"use client"

import { useEffect, useRef, useState } from "react"
import {
  Monitor,
  Smartphone,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Rocket,
  Globe,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { branches } from "@/lib/mock-data"
import { useBranch } from "../../layout"
import { useBranchWebsite, loadDraftSnapshot } from "@/lib/branch-website-store"
import { cn } from "@/lib/utils"

type PreviewPage = "home" | "treatments" | "booking" | "directions"

const PAGES: Array<{ id: PreviewPage; label: string }> = [
  { id: "home",       label: "홈" },
  { id: "treatments", label: "시술안내" },
  { id: "booking",    label: "예약하기" },
  { id: "directions", label: "오시는 길" },
]

export default function HomepagePreviewPage() {
  const { selectedBranch } = useBranch()
  const branch = branches.find((b) => b.id === selectedBranch) || branches[0]

  const { websiteState, loadForBranch } = useBranchWebsite()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [viewMode,   setViewMode]   = useState<"desktop" | "mobile">("mobile")
  const [activePage, setActivePage] = useState<PreviewPage>("home")
  const [copied,     setCopied]     = useState(false)
  const [hasDraft,   setHasDraft]   = useState(false)

  // Load website state when branch changes
  useEffect(() => {
    loadForBranch(branch.id)
    setHasDraft(!!loadDraftSnapshot(branch.id))
  }, [branch.id, loadForBranch])

  const pagePath: Record<PreviewPage, string> = {
    home:       `/preview/site/${branch.id}`,
    treatments: `/preview/site/${branch.id}/treatments`,
    booking:    `/preview/site/${branch.id}/booking`,
    directions: `/preview/site/${branch.id}/directions`,
  }

  // Reload iframe when page or branch changes
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = pagePath[activePage]
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, branch.id])

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}${pagePath[activePage]}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleOpenNewTab = () => window.open(pagePath[activePage], "_blank")
  const handleRefresh    = () => { if (iframeRef.current) iframeRef.current.src = pagePath[activePage] }

  const desktopW = 1280
  const scale    = Math.min(1, 760 / desktopW)

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">홈페이지 미리보기</h1>
          <p className="text-sm text-muted-foreground">{branch.name} — 테스트 사이트 실시간 확인</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-xs px-2.5 py-1",
              hasDraft
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200",
            )}
          >
            {hasDraft
              ? <><Eye className="mr-1 h-3 w-3" />테스트 사이트 있음</>
              : <><Rocket className="mr-1 h-3 w-3" />테스트 사이트 없음</>}
          </Badge>

          <div className="flex items-center rounded-xl border border-border bg-muted p-0.5">
            <button
              onClick={() => setViewMode("mobile")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                viewMode === "mobile" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Smartphone className="h-3.5 w-3.5" /> 모바일
            </button>
            <button
              onClick={() => setViewMode("desktop")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                viewMode === "desktop" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Monitor className="h-3.5 w-3.5" /> 데스크톱
            </button>
          </div>

          <button onClick={handleRefresh} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-all border border-border" title="새로고침">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleCopy} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-all border border-border" title="URL 복사">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <Button size="sm" variant="outline" onClick={handleOpenNewTab} className="gap-1.5 h-8 text-xs rounded-lg">
            <ExternalLink className="h-3.5 w-3.5" /> 새 탭으로 열기
          </Button>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-0.5 w-fit">
        {PAGES.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePage(p.id)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
              activePage === p.id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* URL bar */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2">
        <Globe className="h-3.5 w-3.5 text-muted-foreground flex-none" />
        <span className="text-xs text-muted-foreground font-mono">
          localhost:3000{pagePath[activePage]}
        </span>
        {hasDraft && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            실시간 연동
          </span>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 rounded-2xl border border-border bg-muted/20 overflow-hidden flex flex-col items-center justify-center min-h-0">
        {!hasDraft ? (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Rocket className="h-7 w-7 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">테스트 사이트가 아직 없습니다</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                홈페이지편집 메뉴에서 <strong>테스트 홈페이지 생성</strong> 버튼을 누르면 여기서 바로 확인할 수 있습니다.
              </p>
            </div>
            <Button size="sm" variant="outline" asChild className="rounded-xl text-xs gap-1.5">
              <a href="/admin/branch/homepage">
                <Rocket className="h-3.5 w-3.5" />
                홈페이지편집으로 이동
              </a>
            </Button>
          </div>
        ) : viewMode === "mobile" ? (
          /* Mobile phone frame */
          <div className="flex-1 w-full overflow-hidden flex justify-center py-4">
            <div
              className="relative rounded-[2rem] border-[3px] border-neutral-800 bg-white shadow-2xl overflow-hidden flex-none"
              style={{ width: 375, height: "calc(100% - 0px)" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-24 h-5 bg-neutral-800 rounded-b-2xl" />
              <iframe
                ref={iframeRef}
                src={pagePath[activePage]}
                title="홈페이지 미리보기"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        ) : (
          /* Desktop scaled frame */
          <div className="flex-1 w-full overflow-hidden relative">
            <div
              style={{
                width: desktopW,
                height: `${100 / scale}%`,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              <iframe
                ref={iframeRef}
                src={pagePath[activePage]}
                title="홈페이지 미리보기"
                className="border-0"
                style={{ width: desktopW, height: "100%" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer status */}
      {hasDraft && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground pb-1">
          <span>
            마지막 테스트 생성:{" "}
            <span className="text-foreground font-medium">
              {websiteState.draft
                ? new Date(websiteState.draft.generatedAt).toLocaleString("ko-KR")
                : "—"}
            </span>
          </span>
          {websiteState.published && (
            <span>
              마지막 공개 배포:{" "}
              <span className="text-foreground font-medium">
                {new Date(websiteState.published.generatedAt).toLocaleString("ko-KR")}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
