"use client"

import {
  TreatmentProfile,
  TreatmentData,
  TreatmentLandingSection,
  LandingSectionType,
} from "@/lib/treatment-store"

// ─────────────────────────────────────────────────────────────────────────────
// TATOA 랜딩페이지 고정 9-블록 템플릿
//
// 운영자가 시술 정보를 입력하면 이 템플릿의 각 섹션에 자동으로 반영됩니다.
// sortOrder는 랜딩페이지 출력 순서와 1:1 대응합니다.
// ─────────────────────────────────────────────────────────────────────────────

export type LandingTemplateBlock = {
  sectionType: LandingSectionType
  defaultTitle: string
  /** CMS 입력 항목 중 이 섹션에 반영되는 필드 목록 (표시용) */
  sourceSummary: string
  sortOrder: number
  /** 필수 블록 여부 — false면 운영자가 숨김 처리 가능 */
  required: boolean
}

export const TATOA_DEFAULT_TEMPLATE: LandingTemplateBlock[] = [
  { sectionType: "hero_main_visual",         defaultTitle: "히어로 메인 비주얼",       sortOrder: 1,  required: true,  sourceSummary: "배경이미지 + 가격카드 + CTA" },
  { sectionType: "intro_cta",                defaultTitle: "시술 소개 & CTA",           sortOrder: 2,  required: true,  sourceSummary: "시술명 + 소개문 + CTA 버튼" },
  { sectionType: "overview_feature_cards",   defaultTitle: "주요 특징 카드",            sortOrder: 3,  required: true,  sourceSummary: "번호형 특징 카드 그리드" },
  { sectionType: "overview_media_block",     defaultTitle: "미디어 블록",               sortOrder: 4,  required: false, sourceSummary: "이미지/영상 + 비포애프터" },
  { sectionType: "effects_process_main",     defaultTitle: "시술 효과 & 경과",          sortOrder: 5,  required: true,  sourceSummary: "효과 요약 + 진행 타임라인" },
  { sectionType: "effects_supporting_media", defaultTitle: "효과 미디어 보조",          sortOrder: 6,  required: false, sourceSummary: "지지 이미지 + 비포애프터 카드" },
  { sectionType: "advantages_section",       defaultTitle: "시술 장점",                 sortOrder: 7,  required: true,  sourceSummary: "번호형 장점 카드 + 갤러리" },
  { sectionType: "precautions_section",      defaultTitle: "주의사항",                  sortOrder: 8,  required: true,  sourceSummary: "시술전/후/금기 박스" },
  { sectionType: "why_tatoa",                defaultTitle: "왜 타토아인가",             sortOrder: 9,  required: true,  sourceSummary: "차별화 포인트 카드" },
  { sectionType: "program_pricing",          defaultTitle: "프로그램 & 가격",           sortOrder: 10, required: true,  sourceSummary: "프로그램 카드 (세로형)" },
  { sectionType: "faq_block",                defaultTitle: "자주 묻는 질문",            sortOrder: 11, required: false, sourceSummary: "FAQ 아코디언" },
  { sectionType: "final_cta_contact",        defaultTitle: "마지막 CTA & 지점 연락처", sortOrder: 12, required: true,  sourceSummary: "CTA 버튼 + 전화/카카오 + 지점정보" },
]

export const COMPACT_TEMPLATE: LandingTemplateBlock[] = [
  { sectionType: "hero_main_visual",       defaultTitle: "히어로 메인 비주얼",  sortOrder: 1, required: true,  sourceSummary: "배경이미지 + 가격카드" },
  { sectionType: "intro_cta",              defaultTitle: "시술 소개 & CTA",      sortOrder: 2, required: true,  sourceSummary: "시술명 + 소개문" },
  { sectionType: "effects_process_main",   defaultTitle: "시술 효과 & 경과",    sortOrder: 3, required: true,  sourceSummary: "효과 요약 + 타임라인" },
  { sectionType: "advantages_section",     defaultTitle: "시술 장점",            sortOrder: 4, required: true,  sourceSummary: "장점 카드" },
  { sectionType: "program_pricing",        defaultTitle: "프로그램 & 가격",      sortOrder: 5, required: true,  sourceSummary: "프로그램 카드" },
  { sectionType: "faq_block",              defaultTitle: "자주 묻는 질문",       sortOrder: 6, required: false, sourceSummary: "FAQ" },
  { sectionType: "final_cta_contact",      defaultTitle: "마지막 CTA & 연락처",  sortOrder: 7, required: true,  sourceSummary: "CTA + 연락처" },
]

export const EXTENDED_TEMPLATE: LandingTemplateBlock[] = [
  { sectionType: "hero_main_visual",         defaultTitle: "히어로 메인 비주얼",    sortOrder: 1,  required: true,  sourceSummary: "배경이미지 + 가격카드" },
  { sectionType: "intro_cta",                defaultTitle: "시술 소개 & CTA",       sortOrder: 2,  required: true,  sourceSummary: "시술명 + 소개문" },
  { sectionType: "overview_feature_cards",   defaultTitle: "주요 특징 카드",        sortOrder: 3,  required: true,  sourceSummary: "번호형 특징 카드" },
  { sectionType: "overview_media_block",     defaultTitle: "미디어 블록",           sortOrder: 4,  required: false, sourceSummary: "이미지/영상" },
  { sectionType: "effects_process_main",     defaultTitle: "시술 효과 & 경과",     sortOrder: 5,  required: true,  sourceSummary: "효과 + 타임라인" },
  { sectionType: "effects_supporting_media", defaultTitle: "효과 미디어 보조",     sortOrder: 6,  required: false, sourceSummary: "지지 이미지 + 비포애프터" },
  { sectionType: "advantages_section",       defaultTitle: "시술 장점",             sortOrder: 7,  required: true,  sourceSummary: "장점 카드" },
  { sectionType: "precautions_section",      defaultTitle: "주의사항",              sortOrder: 8,  required: true,  sourceSummary: "시술전/후/금기" },
  { sectionType: "why_tatoa",                defaultTitle: "왜 타토아인가",        sortOrder: 9,  required: true,  sourceSummary: "차별화 포인트" },
  { sectionType: "optional_gallery",         defaultTitle: "갤러리 (선택)",         sortOrder: 10, required: false, sourceSummary: "비포애프터 갤러리" },
  { sectionType: "program_pricing",          defaultTitle: "프로그램 & 가격",       sortOrder: 11, required: true,  sourceSummary: "프로그램 카드" },
  { sectionType: "faq_block",                defaultTitle: "자주 묻는 질문",        sortOrder: 12, required: false, sourceSummary: "FAQ" },
  { sectionType: "final_cta_contact",        defaultTitle: "마지막 CTA & 연락처",  sortOrder: 13, required: true,  sourceSummary: "CTA + 연락처" },
  { sectionType: "clinic_info_block",        defaultTitle: "지점 안내 (선택)",      sortOrder: 14, required: false, sourceSummary: "지점 상세정보" },
]

// ─────────────────────────────────────────────────────────────────────────────
// Auto-mapping: CMS 필드 → 랜딩 섹션 metadata 기본값
//
// 각 sectionType에 대해 TreatmentProfile + TreatmentData에서 값을 읽어
// 해당 섹션의 metadata 기본값 객체를 반환합니다.
//
// 반환 값은 "자동 반영값"이므로 운영자가 랜딩 섹션 에디터에서 직접 수정하면
// "랜딩 전용 수정값"으로 오버라이드됩니다.
// ─────────────────────────────────────────────────────────────────────────────

export type AutoMappedSection = {
  sectionType: LandingSectionType
  title: string
  subtitle?: string
  body?: string
  metadata: Record<string, unknown>
  isAutoMapped: true
}

/**
 * 주어진 sectionType에 대해 CMS 데이터로부터 자동 매핑된 섹션 기본값을 계산합니다.
 */
export function buildLandingSectionDefaults(
  sectionType: LandingSectionType,
  profile: TreatmentProfile,
  data: TreatmentData
): AutoMappedSection {
  switch (sectionType) {

    // ── 1. 가격 및 예약 CTA ────────────────────────────────────────────────
    case "hero_price_cta":
      return {
        sectionType,
        title: profile.name,
        subtitle: profile.landingHeroPriceText ?? formatPriceText(profile),
        isAutoMapped: true,
        metadata: {
          priceText: profile.landingHeroPriceText ?? formatPriceText(profile),
          ctaPrimaryLabel: profile.ctaPrimaryLabel ?? "상담 신청하기",
          ctaSecondaryLabel: profile.ctaSecondaryLabel ?? "전화 문의",
          bookingUrl: profile.bookingUrl ?? "",
          phoneUrl: profile.phoneUrl ?? "",
          kakaoUrl: profile.kakaoUrl ?? "",
          heroImageAssetId: profile.heroImageAssetId ?? "",
          mobileHeroAssetId: profile.mobileHeroAssetId ?? "",
          badge: profile.cardBadge ?? "",
        },
      }

    // ── 2. 시술 소개 & 후킹 요소 ───────────────────────────────────────────
    case "treatment_intro":
      return {
        sectionType,
        title: profile.landingHeadline ?? profile.name,
        subtitle: profile.landingSubheadline ?? profile.oneLinePitch,
        body: profile.longDescription ?? profile.shortDescription,
        isAutoMapped: true,
        metadata: {
          name: profile.name,
          englishName: profile.englishName ?? "",
          category: profile.category,
          oneLinePitch: profile.oneLinePitch ?? "",
          shortDescription: profile.shortDescription ?? "",
          longDescription: profile.longDescription ?? "",
          hookCopy: profile.hookCopy ?? profile.differentiationCopy ?? "",
          landingHeadline: profile.landingHeadline ?? profile.name,
          landingSubheadline: profile.landingSubheadline ?? profile.oneLinePitch ?? "",
          keywords: data.keywords,
          benefits: data.benefits,
          heroImageAssetId: profile.heroImageAssetId ?? "",
          mobileHeroAssetId: profile.mobileHeroAssetId ?? "",
        },
      }

    // ── 3. 시술 효과 & 일반 경과 ───────────────────────────────────────────
    case "effects_progress":
      return {
        sectionType,
        title: "시술 효과 & 일반 경과",
        isAutoMapped: true,
        metadata: {
          concernAreas: data.concernAreas,
          painLevel: profile.painLevel ?? "",
          anesthesiaRequired: profile.anesthesiaRequired ?? false,
          downtimeNote: profile.downtimeNote ?? "",
          durationMinutes: profile.durationMinutes ?? null,
          treatmentCycleGuide: profile.treatmentCycleGuide ?? "",
          maintenancePeriod: profile.maintenancePeriod ?? "",
          recommendedVisits: profile.recommendedVisits ?? null,
          effectCards: data.effectCards.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description ?? "",
            icon: c.icon ?? "",
            imageAssetId: c.imageAssetId ?? "",
            sortOrder: c.sortOrder,
          })),
        },
      }

    // ── 4. 시술 장점 카드 ──────────────────────────────────────────────────
    case "treatment_advantages":
      return {
        sectionType,
        title: "타토아의 선택받은 이유",
        isAutoMapped: true,
        metadata: {
          specialtyPoints: data.specialtyPoints,
          benefits: data.benefits,
          differentiationCopy: profile.differentiationCopy ?? "",
        },
      }

    // ── 5. 주의사항 ────────────────────────────────────────────────────────
    case "treatment_precautions": {
      const byType = {
        before: data.precautions.filter((p) => p.type === "before" && p.isPublic),
        after: data.precautions.filter((p) => p.type === "after" && p.isPublic),
        contraindication: data.precautions.filter(
          (p) => p.type === "contraindication" && p.isPublic
        ),
        note: data.precautions.filter((p) => p.type === "note" && p.isPublic),
      }
      return {
        sectionType,
        title: "시술 전·후 주의사항",
        isAutoMapped: true,
        metadata: {
          before: byType.before.map((p) => p.content),
          after: byType.after.map((p) => p.content),
          contraindication: byType.contraindication.map((p) => p.content),
          notes: byType.note.map((p) => p.content),
        },
      }
    }

    // ── 6. 왜 타토아인가 ───────────────────────────────────────────────────
    case "why_tatoa":
      return {
        sectionType,
        title: profile.whyTatoaHeadline ?? "왜 타토아에서 해야 하는가",
        subtitle: profile.whyTatoaSummary ?? "",
        body: profile.whyTatoaPhilosophy ?? "",
        isAutoMapped: true,
        metadata: {
          headline: profile.whyTatoaHeadline ?? "왜 타토아에서 해야 하는가",
          summary: profile.whyTatoaSummary ?? "",
          philosophy: profile.whyTatoaPhilosophy ?? "",
          cards: data.whyTatoaCards.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description ?? "",
            imageAssetId: c.imageAssetId ?? "",
            sortOrder: c.sortOrder,
          })),
          galleryAssetIds: data.whyTatoaGalleryAssetIds,
        },
      }

    // ── 7. 연관 프로그램 & 특가 ────────────────────────────────────────────
    case "pricing_program_offer":
      return {
        sectionType,
        title: "시술 프로그램 안내",
        isAutoMapped: true,
        metadata: {
          programs: data.programs
            .filter((p) => p.isPublic)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((p) => ({
              id: p.id,
              name: p.name,
              targetArea: p.targetArea ?? "",
              description: p.description ?? "",
              priceRegular: p.priceRegular ?? null,
              priceDiscount: p.priceDiscount ?? null,
              vatIncluded: p.vatIncluded,
              durationMinutes: p.durationMinutes ?? null,
              note: p.note ?? "",
            })),
          companionTreatments: data.companionTreatments,
          linkedEventIds: data.linkedEventIds,
          vatIncluded: profile.vatIncluded,
        },
      }

    // ── 8. FAQ ────────────────────────────────────────────────────────────
    case "faq_block":
      return {
        sectionType,
        title: "자주 묻는 질문",
        isAutoMapped: true,
        metadata: {
          linkedFaqIds: data.linkedFaqIds,
          // FAQ items are populated from the FAQ store by linkedFaqIds at render time
          faqs: [],
        },
      }

    // ── 9. 마지막 CTA ──────────────────────────────────────────────────────
    case "final_cta":
      return {
        sectionType,
        title: profile.ctaPrimaryLabel ?? "지금 바로 상담 예약하세요",
        subtitle: "전문 의료진이 1:1 맞춤 상담을 제공합니다",
        isAutoMapped: true,
        metadata: {
          ctaPrimaryLabel: profile.ctaPrimaryLabel ?? "상담 신청하기",
          ctaSecondaryLabel: profile.ctaSecondaryLabel ?? "전화 문의",
          bookingUrl: profile.bookingUrl ?? "",
          phoneUrl: profile.phoneUrl ?? "",
          kakaoUrl: profile.kakaoUrl ?? "",
        },
      }

    // ── Fallback for all other / legacy section types ──────────────────────
    default:
      return {
        sectionType,
        title: "",
        isAutoMapped: true,
        metadata: {},
      }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// initializeLandingSections
//
// 현재 TreatmentData에 랜딩 섹션이 없을 때, TATOA_DEFAULT_TEMPLATE의 9개 블록을
// 자동 매핑 기본값으로 초기화하여 반환합니다.
// ─────────────────────────────────────────────────────────────────────────────

export function initializeLandingSections(
  data: TreatmentData,
  generateId: (prefix: string) => string
): Omit<TreatmentLandingSection, "createdAt" | "updatedAt">[] {
  const now = new Date().toISOString()
  return TATOA_DEFAULT_TEMPLATE.map((block) => {
    const defaults = buildLandingSectionDefaults(block.sectionType, data.profile, data)
    return {
      id: generateId("ls"),
      treatmentId: data.profile.id,
      sectionType: block.sectionType,
      title: defaults.title,
      subtitle: defaults.subtitle,
      body: defaults.body,
      metadata: defaults.metadata,
      isVisible: block.required,
      sortOrder: block.sortOrder,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatPriceText(profile: TreatmentProfile): string {
  if (!profile.showPrice || profile.useConsultInquiry) return "상담 후 결정"
  if (profile.priceEvent != null) {
    return `${profile.priceEvent.toLocaleString()}원~`
  }
  if (profile.priceRegular != null) {
    return `${profile.priceRegular.toLocaleString()}원~`
  }
  return "상담 후 결정"
}

// ─────────────────────────────────────────────────────────────────────────────
// Section type → Korean label (for UI display)
// ─────────────────────────────────────────────────────────────────────────────

export const LANDING_SECTION_LABELS: Record<LandingSectionType, string> = {
  // New concrete types
  hero_price_cta: "① 가격 및 예약 CTA",
  // PDF Template section types
  hero_main_visual:           "히어로 메인 비주얼",
  intro_cta:                  "시술 소개 & CTA",
  overview_feature_cards:     "주요 특징 카드",
  overview_media_block:       "미디어 블록",
  effects_process_main:       "시술 효과 & 경과",
  effects_supporting_media:   "효과 미디어 보조",
  advantages_section:         "시술 장점",
  precautions_section:        "주의사항",
  program_pricing:            "프로그램 & 가격",
  final_cta_contact:          "마지막 CTA & 연락처",
  treatment_intro: "② 시술 소개 & 후킹",
  effects_progress: "③ 효과 & 경과",
  treatment_advantages: "④ 시술 장점",
  treatment_precautions: "⑤ 주의사항",
  why_tatoa: "⑥ 왜 타토아인가",
  pricing_program_offer: "⑦ 프로그램 & 특가",
  faq_block: "⑧ FAQ",
  final_cta: "⑨ 마지막 CTA",
  optional_gallery: "갤러리 (선택)",
  optional_doctor_highlight: "의료진 소개 (선택)",
  optional_equipment_highlight: "장비 소개 (선택)",
  // Legacy types
  hero_image: "히어로 이미지",
  hero_video: "히어로 동영상",
  headline_copy: "헤드라인 카피",
  intro_text: "인트로 텍스트",
  feature_grid: "특장점 그리드",
  diagnosis_section: "진단/검사 섹션",
  treatment_process: "시술 과정",
  program_pricing_table: "프로그램 가격표",
  before_after_gallery: "비포/애프터 갤러리",
  quote_block: "인용구",
  treatment_area_visual: "시술 부위 비주얼",
  doctor_recommendation: "의료진 추천",
  equipment_highlight: "장비 소개",
  differentiation_cards: "차별화 카드",
  clinic_info_block: "클리닉 정보",
  map_block: "지도",
  cta_block: "CTA 블록",
  image_text_split: "이미지+텍스트",
  fullwidth_image: "전체폭 이미지",
  bullet_list: "목록",
  notice_block: "공지/안내",
}

/**
 * Returns the Korean label for a given section type.
 */
export function getLandingSectionLabel(sectionType: LandingSectionType): string {
  return LANDING_SECTION_LABELS[sectionType] ?? sectionType
}
