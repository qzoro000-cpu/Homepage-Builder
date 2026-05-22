"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useParams, usePathname } from "next/navigation"
import { loadDraftSnapshot, loadPublishedSnapshot, SITE_LIVE_BROADCAST, type SiteSnapshot } from "@/lib/branch-website-store"
import { OptionProvider } from "@/lib/option-context"
import { StaffProvider } from "@/lib/staff-store"
import { EquipmentProvider } from "@/lib/equipment-store"
import { TreatmentProvider } from "@/lib/treatment-store"
import { DomainProvider } from "@/lib/domain-store"
import { ContentRelationProvider } from "@/lib/content-relation-store"
import { LandingDraftProvider } from "@/lib/landing-draft-store"
import { MediaProvider } from "@/lib/media-store"
import { BranchWebsiteProvider } from "@/lib/branch-website-store"
import { CartProvider } from "@/lib/cart-store"
import { SiteNav } from "@/components/site/SiteNav"

// ─── SiteData Context ──────────────────────────────────────────────────────────

type SiteDataContextType = {
  snapshot: SiteSnapshot | null
  isLoading: boolean
  mode: "draft" | "live"
}

const SiteDataContext = createContext<SiteDataContextType>({
  snapshot: null,
  isLoading: true,
  mode: "draft",
})

export const useSiteData = () => useContext(SiteDataContext)

// ─── Site Footer ───────────────────────────────────────────────────────────────

function SiteFooter({ snapshot }: { snapshot: SiteSnapshot }) {
  const footer = snapshot.homepage.sectionValues["footer"] ?? {}
  const clinicName  = (footer.clinicName  as string) || snapshot.branch.name
  const bizNumber   = (footer.bizNumber   as string) || ""
  const ceoName     = (footer.ceoName     as string) || ""
  const address     = (footer.address     as string) || snapshot.branch.address
  const phone       = (footer.phone       as string) || snapshot.branch.phone
  const copyright   = (footer.copyright  as string) || `© ${new Date().getFullYear()} ${snapshot.branch.name}. All rights reserved.`

  return (
    <footer className="bg-neutral-900 text-neutral-400 text-xs py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-3">
        <p className="font-semibold text-neutral-200 text-sm">{clinicName}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {ceoName    && <span>대표: {ceoName}</span>}
          {bizNumber  && <span>사업자등록번호: {bizNumber}</span>}
          {address    && <span>주소: {address}</span>}
          {phone      && <span>전화: {phone}</span>}
        </div>
        <p className="text-neutral-500">{copyright}</p>
      </div>
    </footer>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function PreviewSiteLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ branchSlug: string }>()
  const branchSlug = params?.branchSlug ?? ""
  const pathname = usePathname()
  const isHomePage = pathname === `/preview/site/${branchSlug}` || pathname === `/preview/site/${branchSlug}/`
  const [snapshot, setSnapshot] = useState<SiteSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Determine mode from URL query param (mode=live uses published snapshot)
  const mode: "draft" | "live" =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "live"
      ? "live"
      : "draft"

  useEffect(() => {
    if (!branchSlug) return

    const load = () => {
      const snap = mode === "live"
        ? loadPublishedSnapshot(branchSlug)
        : loadDraftSnapshot(branchSlug)
      setSnapshot(snap)
      setIsLoading(false)
    }

    load()

    // Live sync: re-read snapshot when editor broadcasts a change
    if (mode !== "live") {
      const bc = new BroadcastChannel(SITE_LIVE_BROADCAST(branchSlug))
      bc.onmessage = load
      return () => bc.close()
    }
  }, [branchSlug, mode])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
          <p className="text-sm text-neutral-500">사이트 로딩 중...</p>
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
          <h2 className="text-lg font-semibold text-neutral-800">테스트 사이트가 아직 생성되지 않았습니다</h2>
          <p className="text-sm text-neutral-500">
            CMS 홈페이지편집 메뉴에서 <strong>테스트 홈페이지 생성</strong> 버튼을 클릭하여 사이트를 만들어주세요.
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
    <OptionProvider>
      <StaffProvider>
        <EquipmentProvider>
          <TreatmentProvider>
            <DomainProvider>
              <ContentRelationProvider>
                <LandingDraftProvider>
                  <MediaProvider>
                    <BranchWebsiteProvider>
                      <CartProvider>
                        <SiteDataContext.Provider value={{ snapshot, isLoading: false, mode }}>
                          <div className="min-h-screen bg-white">
                            <SiteNav snapshot={snapshot} branchSlug={branchSlug} isPreview={mode !== "live"} mobileScrollReveal={isHomePage} />
                            {/* Offset for sticky nav — homepage has hero overlay so no padding needed */}
                            <div className={isHomePage ? "" : mode !== "live" ? "pt-[83px]" : "pt-[60px]"}>
                              {children}
                            </div>
                            <SiteFooter snapshot={snapshot} />
                          </div>
                        </SiteDataContext.Provider>
                      </CartProvider>
                    </BranchWebsiteProvider>
                  </MediaProvider>
                </LandingDraftProvider>
              </ContentRelationProvider>
            </DomainProvider>
          </TreatmentProvider>
        </EquipmentProvider>
      </StaffProvider>
    </OptionProvider>
  )
}
