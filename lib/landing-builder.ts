/**
 * landing-builder.ts
 *
 * Core logic for creating a LandingPageDraft from current CMS data — NO AI required.
 * AI enhancement is a separate step layered on top.
 */

import type { TreatmentProfile, TreatmentData, TreatmentAsset, LandingPageDraft } from "@/lib/treatment-store"
import { buildLandingPreviewData } from "@/lib/landing-data-adapter"

// ─── Validation ──────────────────────────────────────────────────────────────

export type LandingBuildValidation = {
  canBuild: boolean
  /** Hard blocks — generation is refused until fixed */
  errors: string[]
  /** Soft warnings — generation proceeds but certain sections will be missing/placeholder */
  warnings: string[]
}

export function validateLandingBuild(
  profile: TreatmentProfile,
  data: TreatmentData,
): LandingBuildValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // ── Required fields ──────────────────────────────────────────────
  if (!profile.name?.trim()) {
    errors.push("시술명이 없습니다.")
  }

  const hasIntro =
    profile.shortDescription?.trim() ||
    profile.longDescription?.trim() ||
    profile.oneLinePitch?.trim() ||
    profile.hookCopy?.trim()
  if (!hasIntro) {
    errors.push("시술 소개 문구가 필요합니다. (한줄설명 또는 짧은소개 중 하나)")
  }

  const hasPrice =
    (profile.priceRegular && profile.priceRegular > 0) ||
    (profile.priceEvent && profile.priceEvent > 0) ||
    profile.useConsultInquiry ||
    profile.landingHeroPriceText?.trim()
  if (!hasPrice) {
    errors.push("가격 정보 또는 '상담 후 결정' 설정이 필요합니다.")
  }

  const hasContact = profile.bookingUrl?.trim() || profile.phoneUrl?.trim() || profile.kakaoUrl?.trim()
  if (!hasContact) {
    errors.push("예약/문의 수단(예약URL · 전화 · 카카오) 중 하나가 필요합니다.")
  }

  // ── Soft warnings ────────────────────────────────────────────────
  const hasHeroImage = data.assets.some((a) => a.fileType === "image")
  if (!hasHeroImage) {
    warnings.push("이미지 자산이 없어 히어로 영역은 placeholder로 표시됩니다.")
  }

  if (!data.effectCards.length) {
    warnings.push("효과 카드가 없어 효과 섹션이 비어 보입니다.")
  }

  if (!data.whyTatoaCards.length) {
    warnings.push("Why Tatoa 카드가 없어 해당 섹션이 숨김 처리됩니다.")
  }

  if (!data.programs.filter((p) => p.isPublic).length) {
    warnings.push("공개 프로그램이 없어 가격 섹션이 숨김 처리됩니다.")
  }

  if (!data.precautions.filter((p) => p.isPublic).length) {
    warnings.push("공개 주의사항이 없어 해당 섹션이 숨김 처리됩니다.")
  }

  if (!data.aiExtractions?.filter((it) => it.category === "faq" && (it.status === "approved" || it.status === "modified")).length) {
    warnings.push("FAQ 항목이 없어 FAQ 섹션이 숨김 처리됩니다.")
  }

  return { canBuild: errors.length === 0, errors, warnings }
}

// ─── Build ───────────────────────────────────────────────────────────────────

export type BuildLandingDraftOptions = {
  templateVariant?: "full" | "compact" | "extended"
  branchId?: string
  generationSource?: "manual" | "ai_enhanced"
  notes?: string
}

/**
 * Creates a complete LandingPageDraft from current CMS data.
 * Returns the draft object — caller must persist it via createLandingPageDraft().
 */
export function buildLandingDraftPayload(
  profile: TreatmentProfile,
  data: TreatmentData,
  assets: TreatmentAsset[],
  options: BuildLandingDraftOptions = {},
): Omit<LandingPageDraft, "id" | "createdAt" | "updatedAt"> {
  const snapshotData = buildLandingPreviewData(profile, data, assets)

  return {
    treatmentId: profile.id,
    branchId: options.branchId,
    templateVariant: options.templateVariant ?? "full",
    status: "draft",
    generationSource: options.generationSource ?? "manual",
    snapshotData: snapshotData as Record<string, unknown>,
    notes: options.notes,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Loads a LandingPageDraft from localStorage directly (for use in standalone preview route
 * outside the React Context tree).
 */
export function loadDraftFromStorage(draftId: string): LandingPageDraft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("tatoa_treatments_v1")
    if (!raw) return null
    const list: TreatmentData[] = JSON.parse(raw)
    for (const treatment of list) {
      const drafts = (treatment as TreatmentData & { landingPageDrafts?: LandingPageDraft[] }).landingPageDrafts ?? []
      const found = drafts.find((d) => d.id === draftId)
      if (found) return found
    }
    return null
  } catch {
    return null
  }
}

/**
 * Returns the latest (most recently updated) LandingPageDraft for a treatment.
 */
export function getLatestLandingDraft(data: TreatmentData): LandingPageDraft | null {
  const drafts = (data as TreatmentData & { landingPageDrafts?: LandingPageDraft[] }).landingPageDrafts
  if (!drafts?.length) return null
  return [...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
}

/**
 * Returns the currently published LandingPageDraft for a treatment.
 */
export function getPublishedLandingDraft(data: TreatmentData): LandingPageDraft | null {
  const drafts = (data as TreatmentData & { landingPageDrafts?: LandingPageDraft[] }).landingPageDrafts
  if (!drafts?.length) return null
  return drafts.find((d) => d.status === "published") ?? null
}
