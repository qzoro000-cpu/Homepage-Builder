"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import type { LandingPageDraft } from "@/lib/treatment-store"
import type { LandingPreviewData } from "@/lib/landing-preview-types"
import { loadDraftFromStorage } from "@/lib/landing-builder"
import { LPHeroSection } from "@/components/landing-preview/HeroSection"
import { LPOverviewSection } from "@/components/landing-preview/OverviewSection"
import { LPEffectsSection } from "@/components/landing-preview/EffectsSection"
import { LPAdvantagesSection } from "@/components/landing-preview/AdvantagesSection"
import { LPPrecautionsSection } from "@/components/landing-preview/PrecautionsSection"
import { LPWhyTatoaSection } from "@/components/landing-preview/WhyTatoaSection"
import { LPPricingSection } from "@/components/landing-preview/PricingSection"
import { LPFaqSection } from "@/components/landing-preview/FaqSection"
import { LPFinalCtaSection } from "@/components/landing-preview/FinalCtaSection"

// ─── Standalone Landing Preview Page ─────────────────────────────────────────
// Route: /preview/landing/[draftId]
// Opens the saved landing draft snapshot as a full-page landing page render.
// No CMS chrome — pure landing template output for mobile-first validation.
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPreviewPage() {
  const { draftId } = useParams<{ draftId: string }>()
  const [draft, setDraft] = useState<LandingPageDraft | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const found = loadDraftFromStorage(draftId)
    setDraft(found)
    setLoading(false)
  }, [draftId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-500">랜딩 초안을 불러오는 중…</p>
        </div>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-2 max-w-sm px-6">
          <p className="text-lg font-semibold text-neutral-800">초안을 찾을 수 없습니다</p>
          <p className="text-sm text-neutral-500">
            Draft ID <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">{draftId}</code>에 해당하는 랜딩 초안이 없습니다.
          </p>
          <p className="text-xs text-neutral-400 mt-4">
            시술 상세 편집 페이지에서 "랜딩 초안 생성" 후 다시 시도하세요.
          </p>
        </div>
      </div>
    )
  }

  const lp = draft.snapshotData as unknown as LandingPreviewData

  return (
    <div className="lp w-full min-h-screen" data-theme={lp.theme ?? "light"}>
      {/* Preview mode badge */}
      <div className="fixed top-3 right-3 z-50">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.24em] text-white/80 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Preview · {draft.status === "published" ? "Published" : "Draft"}
        </span>
      </div>

      <LPHeroSection
        treatmentName={lp.treatmentName}
        heroImage={lp.heroImage}
        heroBadge={lp.heroBadge}
      />
      <LPOverviewSection
        overviewTitle={lp.overviewTitle}
        overviewBody={lp.overviewBody}
        overviewImage={lp.overviewImage}
        overviewImgCfg={lp.overviewImgCfg}
        keyPoints={lp.keyPoints}
      />
      <LPEffectsSection
        effects={lp.effects}
        progressInfo={lp.progressInfo}
      />
      <LPAdvantagesSection
        advantages={lp.advantages}
        advantagesTitle={lp.advantagesTitle}
        advantagesBody={lp.advantagesBody}
        advantagesTheme={lp.advantagesTheme}
        advantagesBoxPreset={lp.advantagesBoxPreset}
      />
      <LPPrecautionsSection
        precautionsBefore={lp.precautionsBefore}
        precautionsAfter={lp.precautionsAfter}
        contraindications={lp.contraindications}
      />
      <LPWhyTatoaSection tatoaReasons={lp.tatoaReasons} />
      <LPPricingSection
        pricingPrograms={lp.pricingPrograms}
        pricingNote={lp.pricingNote}
        ctaPrimary={lp.ctaPrimary}
        treatmentName={lp.treatmentName}
      />
      <LPFaqSection faqItems={lp.faqItems} />
      <LPFinalCtaSection finalCta={lp.finalCta} clinicInfo={lp.clinicInfo} />
    </div>
  )
}
