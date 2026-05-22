"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { loadDraftSnapshot, SITE_LIVE_BROADCAST, type SiteSnapshot } from "@/lib/branch-website-store"
import { SiteNav } from "@/components/site/SiteNav"
import { ExternalLink, RefreshCw } from "lucide-react"

// ─── HomepagePreview Context ──────────────────────────────────────────────────

type HomepagePreviewContextType = {
  snapshot: SiteSnapshot | null
  isLoading: boolean
}

const HomepagePreviewContext = createContext<HomepagePreviewContextType>({
  snapshot: null,
  isLoading: true,
})

export const useHomepagePreview = () => useContext(HomepagePreviewContext)

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function HomepagePreviewLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ branchSlug: string }>()
  const branchSlug = params?.branchSlug ?? ""
  const [snapshot, setSnapshot] = useState<SiteSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [flashUpdate, setFlashUpdate] = useState(false)

  useEffect(() => {
    if (!branchSlug) return

    const load = () => {
      const snap = loadDraftSnapshot(branchSlug)
      setSnapshot(snap)
      setIsLoading(false)
      setLastUpdated(new Date())
      setFlashUpdate(true)
      setTimeout(() => setFlashUpdate(false), 600)
    }

    load()

    // Re-read snapshot whenever the editor broadcasts a change
    const bc = new BroadcastChannel(SITE_LIVE_BROADCAST(branchSlug))
    bc.onmessage = load
    return () => bc.close()
  }, [branchSlug])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
          <p className="text-sm text-neutral-500">미리보기 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏗️</span>
          </div>
          <h2 className="text-lg font-semibold text-neutral-800">테스트 홈페이지가 아직 생성되지 않았습니다</h2>
          <p className="text-sm text-neutral-500">
            CMS 홈페이지편집에서 <strong>테스트 사이트 생성</strong> 버튼을 클릭해주세요.
          </p>
          <a
            href="/admin/branch/homepage"
            className="inline-block mt-4 px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-full hover:bg-neutral-700 transition-colors"
          >
            CMS로 돌아가기
          </a>
        </div>
      </div>
    )
  }

  return (
    <HomepagePreviewContext.Provider value={{ snapshot, isLoading: false }}>
      <div className="min-h-screen bg-white">
        {/* ── Draft preview top banner ── */}
        <div
          className={`
            fixed top-0 left-0 right-0 z-[200] w-full flex items-center justify-between
            px-4 py-1.5 text-xs font-medium transition-colors duration-300
            ${flashUpdate
              ? "bg-emerald-600 text-white"
              : "bg-amber-500 text-white"
            }
          `}
        >
          <div className="flex items-center gap-2">
            {flashUpdate ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-white/70 animate-pulse" />
            )}
            <span>{flashUpdate ? "업데이트됨" : "편집 미리보기 모드"}</span>
            <span className="opacity-60">·</span>
            <span className="opacity-60">{snapshot.branch.name}</span>
            {lastUpdated && !flashUpdate && (
              <>
                <span className="opacity-40">·</span>
                <span className="opacity-60">
                  {lastUpdated.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </>
            )}
          </div>
          <a
            href="/admin/branch/homepage"
            className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="h-3 w-3" />
            CMS 편집
          </a>
        </div>

        {/* ── Site Nav (below preview banner, z-index 100) ── */}
        {/* isPreview=false: SiteNav의 자체 배너 비활성화, 우리 배너가 대신 표시됨 */}
        <div className="fixed left-0 right-0 z-[100]" style={{ top: "1.75rem" }}>
          <SiteNav snapshot={snapshot} branchSlug={branchSlug} isPreview={false} />
        </div>

        {/* Page content — 상단 고정 요소(배너 1.75rem + 네비 4rem) 아래 시작 */}
        <div style={{ paddingTop: "calc(1.75rem + 4rem)" }}>
          {children}
        </div>
      </div>
    </HomepagePreviewContext.Provider>
  )
}
