"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

// ─────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────

export type TreatmentStatus = "draft" | "published" | "hidden" | "archived" | "needs_review"

export type TreatmentPrecautionType = "before" | "after" | "contraindication" | "note"

export type TreatmentAssetType =
  | "카드썸네일"
  | "히어로이미지"
  | "랜딩이미지"
  | "비포애프터"
  | "가격표이미지"
  | "설명PDF"
  | "홍보영상"
  | "시술영상"
  | "홈페이지용"
  | "랜딩용"
  | "챗봇참조용"

export type LandingSectionType =
  // ── New concrete section types (Tatoa landing structure) ──
  | "hero_price_cta"           // 1. 가격/CTA/히어로 통합 블록
  | "treatment_intro"          // 2. 시술 전반 설명 + 후킹 이미지
  | "effects_progress"         // 3. 시술 효과 & 일반 경과
  | "treatment_advantages"     // 4. 시술 장점 카드
  | "treatment_precautions"    // 5. 주의사항
  | "why_tatoa"                // 6. 왜 타토아인가
  | "pricing_program_offer"    // 7. 연관 프로그램 & 특가
  | "faq_block"                // 8. FAQ
  | "final_cta"                // 9. 마지막 CTA
  | "optional_gallery"         // optional: 갤러리
  | "optional_doctor_highlight"// optional: 의료진 소개
  | "optional_equipment_highlight" // optional: 장비 소개
  // ── PDF Template sections (Tatoa Landing PDF Full v1) ──
  | "hero_main_visual"           // PDF p.1 — Hero: bg image + price card + glassmorphism
  | "intro_cta"                  // PDF p.2 — Intro: name + en subtitle + paragraph + CTA
  | "overview_feature_cards"     // PDF p.3 — Numbered feature card grid
  | "overview_media_block"       // PDF p.4 — Media block: image/video + optional before-after
  | "effects_process_main"       // PDF p.5 — Effects & Process: cards + timeline
  | "effects_supporting_media"   // PDF p.6 — Supporting images + before-after cards
  | "advantages_section"         // PDF p.7 — Advantage numbered card list + gallery
  | "precautions_section"        // PDF p.8 — Before/After/Contraindication boxes
  | "program_pricing"            // PDF p.10 — Program pricing cards (vertical)
  | "final_cta_contact"          // PDF p.12 — Final CTA + branch contact
  // ── Legacy abstract types (kept for backward compatibility) ──
  | "hero_image"
  | "hero_video"
  | "headline_copy"
  | "intro_text"
  | "feature_grid"
  | "diagnosis_section"
  | "treatment_process"
  | "program_pricing_table"
  | "before_after_gallery"
  | "quote_block"
  | "treatment_area_visual"
  | "doctor_recommendation"
  | "equipment_highlight"
  | "differentiation_cards"
  | "clinic_info_block"
  | "map_block"
  | "cta_block"
  | "image_text_split"
  | "fullwidth_image"
  | "bullet_list"
  | "notice_block"

export type AssetScope = "hq_common" | "branch_specific"

// ── Effect card (Section C: 효과 및 경과) ────────────────────────────────────
/** 효과 카드 박스 스타일 프리셋 */
export type EffectCardPreset =
  | "default"         // glass-silver (기본)
  | "glass-gold"      // 골드 틴트 유리
  | "gradient-gold"   // 골드 그라데이션
  | "gradient-teal"   // 틸 그라데이션
  | "gradient-purple" // 퍼플 그라데이션
  | "solid-dark"      // 솔리드 다크
  | "outline"         // 아웃라인

export type TreatmentEffectCard = {
  id: string
  treatmentId: string
  title: string
  description?: string
  icon?: string          // emoji or icon name
  imageAssetId?: string  // optional image reference
  cardPreset?: EffectCardPreset  // 개별 카드 스타일 프리셋
  sortOrder: number
}

// ── Overview card (Section B: 소개 핵심 카드) ─────────────────────────────────
export type TreatmentOverviewCard = {
  id: string
  treatmentId: string
  title: string
  description?: string
  sortOrder: number
}

// ── Why Tatoa card (Section E: 왜 타토아인가) ─────────────────────────────────
export type TreatmentWhyTatoaCard = {
  id: string
  treatmentId: string
  title: string
  description?: string
  imageAssetId?: string
  sortOrder: number
}

// ── Source Material (원천 자료함) ───────────────────────────────────────────

export type SourceMaterialCategory =
  | "vendor_pdf"       // 업체 PDF
  | "brochure_image"   // 브로슈어 이미지
  | "product_image"    // 제품/장비 설명 이미지
  | "price_sheet"      // 가격표 이미지/PDF
  | "video"            // 관련 영상
  | "internal_memo"    // 내부 참고 메모
  | "director_comment" // 원장 코멘트
  | "staff_memo"       // 직원 운영 메모
  | "existing_copy"    // 기존 홈페이지 문구 붙여넣기
  | "search_keywords"  // 검색 보강 키워드

export type TreatmentSourceMaterial = {
  id: string
  treatmentId: string
  category: SourceMaterialCategory
  title?: string
  content?: string        // text content (memos, copy paste, keywords)
  fileUrl?: string        // for uploaded files
  fileName?: string
  fileType?: "pdf" | "image" | "video" | "other"
  fileSizeBytes?: number
  scope: AssetScope       // "hq_common" | "branch_specific"
  isPublic: boolean       // public-facing vs internal reference only
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ── AI Extraction Item (AI 추출 결과) ─────────────────────────────────────────

export type AIExtractionCategory =
  | "treatment_intro"    // 시술 전반 설명 후보
  | "hook_copy"          // 후킹 카피 후보
  | "effect"             // 핵심 효과 후보
  | "progress"           // 일반적인 경과 후보
  | "advantage"          // 장점 후보
  | "precaution"         // 주의사항 후보
  | "target_audience"    // 적합 대상 후보
  | "contraindication"   // 금기/상담 필요
  | "faq"                // FAQ 후보
  | "why_tatoa"          // Why Tatoa 연결 포인트
  | "program_price"      // 프로그램/가격 후보
  | "image_suggestion"   // 사용 가능 이미지 추천
  | "data_warning"       // 자료 부족 경고
  | "review_warning"     // 검토 필요 표현 경고

export type AIExtractionStatus = "pending" | "approved" | "rejected" | "modified"

export type AIExtractionSource = "internal_data" | "uploaded_material" | "web_search" | "equipment_data"

export type AIConfidenceLevel = "high" | "medium" | "low" | "conflict"

export type AIExtractionItem = {
  id: string
  treatmentId: string
  runId: string              // which extraction run this came from
  category: AIExtractionCategory
  content: string            // extracted text
  modifiedContent?: string   // user-edited version
  status: AIExtractionStatus
  source: AIExtractionSource
  confidence: AIConfidenceLevel
  sourceRef?: string         // which material/field this came from
  conflictWarning?: string   // if conflicts with internal data
  usedInLanding: boolean
  usedInChatbot: boolean
  usedInDescription: boolean
  sortOrder: number
  createdAt: string
}

export type AIExtractionRun = {
  id: string
  treatmentId: string
  runAt: string
  status: "running" | "completed" | "failed"
  itemCount: number
  warnings: string[]
  sourcesUsed: AIExtractionSource[]
  includeWebSearch: boolean
}

// ── Landing Section Draft (랜딩 섹션 초안) ────────────────────────────────────

export type LandingSectionDraftStatus =
  | "generated"    // AI draft available
  | "pending"      // queued for generation
  | "insufficient" // not enough data to generate
  | "needs_review" // generated but has warnings
  | "approved"     // user approved/applied
  | "manual"       // manually written, not AI

export type LandingSectionDraft = {
  id: string
  treatmentId: string
  sectionType: LandingSectionType
  draftIndex: number              // 1, 2, 3... multiple versions
  title?: string
  subtitle?: string
  body?: string
  metadata?: Record<string, unknown>
  status: LandingSectionDraftStatus
  sources: AIExtractionSource[]
  warnings: string[]
  isApplied: boolean              // currently applied to landing section
  generatedAt: string
}

// ── Landing Page Draft (full page snapshot, survives refresh) ──────────────

export type LandingPageDraftStatus = "draft" | "published" | "archived"

export type LandingPageDraft = {
  id: string
  treatmentId: string
  branchId?: string
  templateVariant: "full" | "compact" | "extended"
  status: LandingPageDraftStatus
  generationSource: "manual" | "ai_enhanced"
  /** Snapshot of LandingPreviewData at generation/save time.
   *  Typed as Record to avoid a cross-module import — cast to LandingPreviewData when consuming. */
  snapshotData: Record<string, unknown>
  notes?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export type TreatmentMaster = {
  id: string
  name: string
  englishName?: string
  category: string
  subcategory?: string
  defaultOneLinePitch?: string
  defaultShortDescription?: string
  defaultLongDescription?: string
  defaultDurationMinutes?: number
  defaultPainLevel?: "없음" | "경미" | "보통" | "강함"
  defaultDowntimeNote?: string
  defaultChatbotSummary?: string
  defaultBenefits: string[]
  defaultTargets: string[]
  defaultConcernAreas: string[]
  defaultKeywords: string[]
  defaultSpecialtyPoints: string[]
  defaultPrecautions: TreatmentPrecaution[]
  assets: TreatmentAsset[]
  createdAt: string
  updatedAt: string
}

export type BranchTreatmentOverride = {
  overriddenFields: string[]
  localName?: string
  localOneLinePitch?: string
  localShortDescription?: string
  localLongDescription?: string
  localChatbotSummary?: string
  localCardTitle?: string
  localCardDescription?: string
  localLandingHeadline?: string
  localLandingSubheadline?: string
}

export type TreatmentProfile = {
  id: string
  branchId: string
  masterTreatmentId?: string
  override: BranchTreatmentOverride
  name: string
  englishName?: string
  category: string
  subcategory?: string
  oneLinePitch?: string
  shortDescription?: string
  longDescription?: string
  cardTitle?: string
  cardDescription?: string
  cardPriceText?: string
  cardDurationText?: string
  cardBadge?: string
  landingHeadline?: string
  landingSubheadline?: string
  differentiationCopy?: string
  chatbotSummary?: string
  chatbotForbiddenPhrases?: string
  chatbotEmphasisPoints?: string
  consultReference?: string
  internalMemo?: string
  durationMinutes?: number
  anesthesiaRequired?: boolean
  downtimeNote?: string
  painLevel?: "없음" | "경미" | "보통" | "강함"
  treatmentCycleGuide?: string
  maintenancePeriod?: string
  recommendedVisits?: number
  priceRegular?: number
  priceEvent?: number
  vatIncluded?: boolean
  showPrice?: boolean
  useConsultInquiry?: boolean
  // ── Landing CTA & booking links ──
  ctaPrimaryLabel?: string      // 예: "상담 신청하기"
  ctaSecondaryLabel?: string    // 예: "전화 문의"
  bookingUrl?: string
  phoneUrl?: string             // 예: "tel:02-0000-0000"
  kakaoUrl?: string
  landingPageUrl?: string       // 배포 후 실제 공개 URL (없으면 /preview/landing/live/{id} 자동 사용)
  heroImageUrl?: string         // 직접 업로드한 히어로 이미지 URL (heroImageAssetId 대체/우선)
  heroImgCfg?: string           // 히어로 이미지 편집 설정 JSON (효과·위치·그라데이션·그림자)
  mobileHeroImageUrl?: string   // 모바일 직접 업로드 이미지
  mobileHeroImgCfg?: string     // 모바일 이미지 편집 설정 JSON
  landingHeroPriceText?: string // hero 섹션에 노출할 가격 표기 텍스트 (자유형식)
  // ── Landing hook copy & hero assets ──
  hookCopy?: string             // 후킹 카피 (differentiationCopy와 별도 용도)
  heroImageAssetId?: string     // 히어로 섹션 배경 이미지 (TreatmentAsset.id 참조)
  mobileHeroAssetId?: string    // 모바일 히어로 이미지
  overviewImageAssetId?: string // ② 소개 섹션 전용 이미지 (비우면 히어로 이미지 사용)
  overviewImageUrl?: string     // ② 직접 업로드한 소개 이미지 URL (overviewImageAssetId 대체/우선)
  overviewImgCfg?: string       // ② 소개 이미지 편집 설정 JSON (효과·위치·그라데이션 등)
  overviewImages?: string       // JSON: SectionImageItem[] (다중 이미지, overviewImageUrl 대체/우선)
  overviewTheme?: "light" | "dark" // ② 소개 섹션 배경 테마 (기본 "light")
  overviewBgImageUrl?: string   // ② 소개 섹션 배경 이미지 URL
  overviewBgImageCfg?: string   // ② 소개 섹션 배경 편집 설정 JSON (SectionBgImageCfg)
  // ── ③ 효과 & 경과 섹션 커스터마이징 ──
  effectsSectionEyebrow?: string   // 섹션 아이브로우 (기본 "Effects & Process")
  effectsSectionHeadline?: string  // 섹션 메인 타이틀
  effectsSectionDescription?: string // 섹션 설명 텍스트
  effectsTitleColor?: string       // 섹션 제목 색상 (CSS 색상 문자열)
  effectsTitleFontSize?: string    // 섹션 제목 크기 ("sm" | "lg" | "xl")
  effectsTitleFontFamily?: string  // 섹션 제목 글씨체 ("sans" | "serif")
  effectsTheme?: "light" | "dark"  // 섹션 배경 테마 (기본 "dark")
  effectsBoxPreset?: EffectCardPreset  // Expected Effects 패널 스타일
  effectsInfoPreset?: EffectCardPreset // Progress info 박스 스타일
  // ③ Effects panel — fine-grained custom style (overrides preset when set)
  effectsBoxBg?: string              // CSS background (solid or gradient)
  effectsBoxBorder?: string          // CSS border color rgba string
  effectsBoxShadow?: string          // CSS box-shadow
  effectsBoxBlur?: number            // backdrop-filter blur px (0 = off)
  effectsBoxRadius?: number          // border-radius px
  // ③ Info boxes — fine-grained custom style
  effectsInfoBg?: string
  effectsInfoBorder?: string
  effectsInfoShadow?: string
  effectsInfoBlur?: number
  effectsInfoRadius?: number
  effectsImageAssetId?: string        // ③ 섹션 선택 이미지 (없으면 이미지 없이 표시)
  effectsImages?: string              // JSON: SectionImageItem[] (다중 이미지)
  effectsBgImageUrl?: string          // ③ 효과 섹션 배경 이미지 URL
  effectsBgImageCfg?: string          // ③ 효과 섹션 배경 편집 설정 JSON
  landingTheme?: "light" | "dark" // 랜딩 배경 테마: "light" = 화이트+그레이 글로우 / "dark" = 블랙+골드 글로우
  // ── ④ 장점 & 차별화 섹션 커스터마이징 ──
  advantagesTitle?: string          // 섹션 대제목 (기본: "섬세함이 만드는\n차이")
  advantagesBody?: string           // 대제목 아래 설명 텍스트
  advantagesTheme?: "light" | "dark" // 배경 테마 (기본 "light")
  advantagesBoxPreset?: string      // 장점 카드 박스 스타일 프리셋
  advantagesCardBg?: string         // 카드 배경 (세부 설정)
  advantagesCardBorder?: string     // 카드 테두리
  advantagesCardShadow?: string     // 카드 쉐도우
  advantagesCardBlur?: number       // 백드롭 블러 px
  advantagesCardRadius?: number     // 모서리 반경 px
  advantagesImages?: string         // JSON: SectionImageItem[] (다중 이미지)
  advantagesBgImageUrl?: string    // ④ 장점 섹션 배경 이미지 URL
  advantagesBgImageCfg?: string    // ④ 장점 섹션 배경 편집 설정 JSON
  // ── ⑤ 주의사항 섹션 커스터마이징 ──
  precautionsTitle?: string          // 섹션 대제목
  precautionsBody?: string           // 섹션 설명
  precautionsTheme?: "light" | "dark" // 배경 테마 (기본 "light")
  precautionsBoxPreset?: string      // 카드 박스 스타일 프리셋
  precautionsCardBg?: string
  precautionsCardBorder?: string
  precautionsCardShadow?: string
  precautionsCardBlur?: number
  precautionsCardRadius?: number
  precautionsCardTitles?: Record<string, string> // 카드별 제목 커스터마이징
  precautionsImages?: string      // JSON: SectionImageItem[] (다중 이미지)
  precautionsBgImageUrl?: string  // ⑤ 주의사항 섹션 배경 이미지 URL
  precautionsBgImageCfg?: string  // ⑤ 주의사항 섹션 배경 편집 설정 JSON
  // ── ⑥ Why Tatoa 섹션 커스터마이징 ──
  whyTatoaEyebrow?: string       // 영어 제목 (기본: "Why Tatoa")
  whyTatoaHeadline?: string      // 대제목
  whyTatoaSummary?: string       // 요약 문구
  whyTatoaPhilosophy?: string    // 시술 철학 / 클리닉 강점
  whyTatoaTheme?: "light" | "dark" // 배경 테마 (기본 "dark")
  whyTatoaBoxPreset?: string     // 카드 박스 스타일 프리셋
  whyTatoaCardBg?: string
  whyTatoaCardBorder?: string
  whyTatoaCardShadow?: string
  whyTatoaCardBlur?: number
  whyTatoaCardRadius?: number
  whyTatoaImageAssetId?: string  // 섹션 이미지 (없으면 이미지 없이 표시)
  whyTatoaImages?: string        // JSON: SectionImageItem[] (다중 이미지)
  whyTatoaBgImageUrl?: string   // ⑥ Why Tatoa 섹션 배경 이미지 URL
  whyTatoaBgImageCfg?: string   // ⑥ Why Tatoa 섹션 배경 편집 설정 JSON
  faqImages?: string             // JSON: SectionImageItem[] (FAQ 섹션 다중 이미지)
  faqBgImageUrl?: string         // FAQ 섹션 배경 이미지 URL
  faqBgImageCfg?: string         // FAQ 섹션 배경 편집 설정 JSON
  // ── Pricing section ──
  pricingEyebrow?: string        // 영어 타이틀 (기본 "Programs & Pricing")
  pricingHeadline?: string       // 헤드라인 (기본 "단정한 가격,\n정직한 설계")
  pricingEnName?: string         // 영어 시술명 (헤드라인 아래 표시)
  pricingBody?: string           // 상세 설명
  pricingTheme?: "light" | "dark" // 섹션 배경 테마 (기본 "light" = 화이트)
  pricingBoxPreset?: string      // 카드 박스 스타일 프리셋
  pricingCardBg?: string
  pricingCardBorder?: string
  pricingCardShadow?: string
  pricingCardBlur?: number
  pricingCardRadius?: number
  // ── Fixed bottom CTA bar (독립 설정, 미설정 시 히어로 CTA 값 사용) ──
  ctaBarPrimaryLabel?: string    // 하단 고정 CTA 바 주 버튼 문구
  ctaBarPrimaryHref?: string     // 하단 고정 CTA 바 주 버튼 링크
  ctaBarSecondaryLabel?: string  // 하단 고정 CTA 바 보조 버튼 문구
  ctaBarSecondaryHref?: string   // 하단 고정 CTA 바 보조 버튼 링크
  // ── Final CTA section ──
  finalCtaHeadline?: string     // 랜딩 마지막 CTA 헤드라인
  isPublic: boolean
  isFeatured: boolean
  isLandingPublic: boolean
  chatbotPriority: boolean
  status: TreatmentStatus
  displayOrder: number
  hasLandingPage: boolean
  useMasterAssetsDefault: boolean
  hiddenMasterAssetIds: string[]
  createdAt: string
  updatedAt: string
}

export type TreatmentProgram = {
  id: string
  treatmentId: string
  branchId: string
  name: string
  targetArea?: string
  description?: string
  equipmentNote?: string
  priceRegular?: number
  priceDiscount?: number
  vatIncluded: boolean
  durationMinutes?: number
  note?: string
  sortOrder: number
  isPublic: boolean
  cardPreset?: string   // 이 카드에 적용할 BOX_PRESET (미설정 시 섹션 전역 프리셋 사용)
  highlight?: boolean   // 하이라이트(어두운 강조) 카드 여부 (cardPreset 설정 시 무시)
  ctaLabel?: string     // 카드 하단 CTA 버튼 문구 (미설정 시 전역 ctaPrimary.label 사용)
  ctaHref?: string      // 카드 하단 CTA 버튼 링크 (미설정 시 전역 ctaPrimary.href 사용)
  nameFont?: string     // 프로그램명 글씨체 key
  nameSizePx?: number   // 프로그램명 크기 (px)
  nameWeight?: string   // 프로그램명 굵기 ("300"~"700")
  nameItalic?: boolean  // 프로그램명 기울기
  // ── 카드 커스텀 스타일 ──
  cardBgMode?: "preset" | "solid" | "gradient" | "transparent"
  cardBgHex?: string          // 배경 단색/그라데이션 시작 색 (#rrggbb)
  cardBgHex2?: string         // 그라데이션 끝 색 (#rrggbb)
  cardBgOpacity?: number      // 0-100
  cardBgGradDir?: string      // CSS angle, e.g. "135deg"
  cardBorderOn?: boolean
  cardBorderHex?: string      // 테두리 색 (#rrggbb)
  cardBorderW?: number        // 테두리 두께 1-3
  cardShadowMode?: "none" | "soft" | "deep" | "neon"
  cardShadowHex?: string      // 그림자 색 (#rrggbb)
  cardBlur?: number           // backdrop-blur (px)
  cardRadius?: number         // border-radius (px)
  priceColor?: string         // 가격 텍스트 색상
}

export type TreatmentPrecaution = {
  id: string
  treatmentId: string
  type: TreatmentPrecautionType
  content: string
  sortOrder: number
  isPublic: boolean
}

export type TreatmentAsset = {
  id: string
  treatmentId: string
  scope: AssetScope
  branchId?: string
  inheritedFromMaster: boolean
  hiddenInBranch: boolean
  fileUrl: string
  fileName: string
  fileType: "image" | "pdf" | "video" | "other"
  mimeType: string
  assetType: TreatmentAssetType
  title?: string
  description?: string
  thumbnailUrl?: string
  durationSeconds?: number
  pageCount?: number
  fileSizeBytes?: number
  isFeatured: boolean
  isPublic: boolean
  useForHomepage: boolean
  useForLanding: boolean
  useForChatbot: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type TreatmentLandingSection = {
  id: string
  treatmentId: string
  sectionType: LandingSectionType
  title?: string
  subtitle?: string
  body?: string
  styleVariant?: string
  metadata?: Record<string, unknown>
  isVisible: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type TreatmentData = {
  profile: TreatmentProfile
  benefits: string[]
  targets: string[]
  concernAreas: string[]
  keywords: string[]
  specialtyPoints: string[]
  companionTreatments: string[]
  programs: TreatmentProgram[]
  precautions: TreatmentPrecaution[]
  overviewCards: TreatmentOverviewCard[]  // Section B: 소개 핵심 카드
  effectCards: TreatmentEffectCard[]      // Section C: 효과 카드
  whyTatoaCards: TreatmentWhyTatoaCard[]  // Section E: 왜 타토아 카드
  whyTatoaGalleryAssetIds: string[]       // Section E: 갤러리 이미지 IDs
  assets: TreatmentAsset[]
  landingSections: TreatmentLandingSection[]
  sourceMaterials: TreatmentSourceMaterial[]
  aiExtractions: AIExtractionItem[]
  aiExtractionRuns: AIExtractionRun[]
  landingSectionDrafts: LandingSectionDraft[]
  landingPageDrafts: LandingPageDraft[]
  linkedEquipmentIds: string[]
  linkedDoctorIds: string[]
  linkedFaqIds: string[]
  linkedEventIds: string[]
}

// ─────────────────────────────────────────────
// Context Type
// ─────────────────────────────────────────────

type TreatmentContextType = {
  masters: TreatmentMaster[]
  treatmentList: TreatmentData[]
  // Master operations
  getMaster: (id: string) => TreatmentMaster | undefined
  getAllMasters: () => TreatmentMaster[]
  createMaster: (
    partial: Partial<Omit<TreatmentMaster, "id" | "createdAt" | "updatedAt">>
  ) => TreatmentMaster
  updateMaster: (id: string, updates: Partial<TreatmentMaster>) => void
  // Branch treatment
  getTreatment: (id: string) => TreatmentData | undefined
  getTreatmentsByBranch: (branchId: string) => TreatmentData[]
  createTreatment: (
    branchId: string,
    partial: Partial<Omit<TreatmentProfile, "id" | "branchId" | "createdAt" | "updatedAt">>
  ) => TreatmentData
  createTreatmentFromMaster: (branchId: string, masterId: string) => TreatmentData
  updateProfile: (treatmentId: string, updates: Partial<TreatmentProfile>) => void
  updateExtras: (
    treatmentId: string,
    updates: Partial<
      Omit<
        TreatmentData,
        "profile" | "programs" | "precautions" | "assets" | "landingSections"
      >
    >
  ) => void
  setFieldOverride: (treatmentId: string, fieldName: string, value: string) => void
  resetFieldToMaster: (treatmentId: string, fieldName: string) => void
  syncFromMaster: (treatmentId: string) => void
  // Programs
  addProgram: (treatmentId: string, item: Omit<TreatmentProgram, "id" | "treatmentId">) => void
  updateProgram: (
    treatmentId: string,
    id: string,
    updates: Partial<TreatmentProgram>
  ) => void
  deleteProgram: (treatmentId: string, id: string) => void
  moveProgram: (treatmentId: string, id: string, direction: "up" | "down") => void
  // Precautions
  addPrecaution: (
    treatmentId: string,
    item: Omit<TreatmentPrecaution, "id" | "treatmentId">
  ) => void
  updatePrecaution: (
    treatmentId: string,
    id: string,
    updates: Partial<TreatmentPrecaution>
  ) => void
  deletePrecaution: (treatmentId: string, id: string) => void
  movePrecaution: (treatmentId: string, id: string, direction: "up" | "down") => void
  // Assets
  addAsset: (
    treatmentId: string,
    item: Omit<TreatmentAsset, "id" | "treatmentId" | "createdAt" | "updatedAt">
  ) => TreatmentAsset
  updateAsset: (
    treatmentId: string,
    assetId: string,
    updates: Partial<TreatmentAsset>
  ) => void
  deleteAsset: (treatmentId: string, assetId: string) => void
  reorderAsset: (treatmentId: string, assetId: string, direction: "up" | "down") => void
  getEffectiveAssets: (treatmentId: string) => TreatmentAsset[]
  toggleMasterAssetVisibility: (treatmentId: string, masterAssetId: string) => void
  // Overview cards (Section B)
  addOverviewCard: (treatmentId: string, item: Omit<TreatmentOverviewCard, "id" | "treatmentId">) => void
  updateOverviewCard: (treatmentId: string, cardId: string, updates: Partial<TreatmentOverviewCard>) => void
  deleteOverviewCard: (treatmentId: string, cardId: string) => void
  moveOverviewCard: (treatmentId: string, cardId: string, direction: "up" | "down") => void
  // Effect cards
  addEffectCard: (treatmentId: string, item: Omit<TreatmentEffectCard, "id" | "treatmentId">) => void
  updateEffectCard: (treatmentId: string, cardId: string, updates: Partial<TreatmentEffectCard>) => void
  deleteEffectCard: (treatmentId: string, cardId: string) => void
  moveEffectCard: (treatmentId: string, cardId: string, direction: "up" | "down") => void
  // Why Tatoa cards
  addWhyTatoaCard: (treatmentId: string, item: Omit<TreatmentWhyTatoaCard, "id" | "treatmentId">) => void
  updateWhyTatoaCard: (treatmentId: string, cardId: string, updates: Partial<TreatmentWhyTatoaCard>) => void
  deleteWhyTatoaCard: (treatmentId: string, cardId: string) => void
  moveWhyTatoaCard: (treatmentId: string, cardId: string, direction: "up" | "down") => void
  // Source Materials
  addSourceMaterial: (treatmentId: string, item: Omit<TreatmentSourceMaterial, "id" | "treatmentId" | "createdAt" | "updatedAt">) => void
  updateSourceMaterial: (treatmentId: string, id: string, updates: Partial<TreatmentSourceMaterial>) => void
  deleteSourceMaterial: (treatmentId: string, id: string) => void
  // AI Extractions
  addExtractionRun: (treatmentId: string, run: Omit<AIExtractionRun, "id">) => AIExtractionRun
  addExtractionItems: (treatmentId: string, runId: string, items: Omit<AIExtractionItem, "id" | "treatmentId" | "runId" | "createdAt">[]) => void
  updateExtractionItem: (treatmentId: string, id: string, updates: Partial<AIExtractionItem>) => void
  clearExtractionRun: (treatmentId: string, runId: string) => void
  // Landing Section Drafts (per-section AI drafts)
  addLandingSectionDraft: (treatmentId: string, draft: Omit<LandingSectionDraft, "id" | "treatmentId">) => LandingSectionDraft
  applyLandingSectionDraft: (treatmentId: string, draftId: string) => void
  deleteLandingSectionDraft: (treatmentId: string, draftId: string) => void
  // Landing Page Drafts (full page snapshots)
  createLandingPageDraft: (treatmentId: string, draft: Omit<LandingPageDraft, "id" | "createdAt" | "updatedAt">) => LandingPageDraft
  updateLandingPageDraft: (treatmentId: string, draftId: string, updates: Partial<LandingPageDraft>) => void
  deleteLandingPageDraft: (treatmentId: string, draftId: string) => void
  // Landing sections
  addLandingSection: (
    treatmentId: string,
    item: Omit<TreatmentLandingSection, "id" | "treatmentId" | "createdAt" | "updatedAt">
  ) => TreatmentLandingSection
  updateLandingSection: (
    treatmentId: string,
    sectionId: string,
    updates: Partial<TreatmentLandingSection>
  ) => void
  deleteLandingSection: (treatmentId: string, sectionId: string) => void
  moveLandingSection: (
    treatmentId: string,
    sectionId: string,
    direction: "up" | "down"
  ) => void
  // Lifecycle
  archiveTreatment: (treatmentId: string) => void
  deleteTreatment: (treatmentId: string) => void
  duplicateTreatment: (treatmentId: string) => TreatmentData
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function nowISO(): string {
  return new Date().toISOString()
}

function swapSortOrder<T extends { id: string; sortOrder: number }>(
  items: T[],
  id: string,
  direction: "up" | "down"
): T[] {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder)
  const idx = sorted.findIndex((i) => i.id === id)
  if (idx === -1) return items
  const swapIdx = direction === "up" ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= sorted.length) return items
  const temp = sorted[idx].sortOrder
  sorted[idx] = { ...sorted[idx], sortOrder: sorted[swapIdx].sortOrder }
  sorted[swapIdx] = { ...sorted[swapIdx], sortOrder: temp }
  return sorted
}

const OVERRIDE_FIELD_MAP: Record<string, keyof TreatmentMaster> = {
  name: "name",
  oneLinePitch: "defaultOneLinePitch",
  shortDescription: "defaultShortDescription",
  longDescription: "defaultLongDescription",
  chatbotSummary: "defaultChatbotSummary",
}

// ─────────────────────────────────────────────
// Seed Data
// ─────────────────────────────────────────────

const SEED_MASTERS: TreatmentMaster[] = [
  {
    id: "tm_1",
    name: "울쎄라 리프팅",
    englishName: "Ultherapy Lifting",
    category: "리프팅",
    defaultOneLinePitch: "FDA 승인 초음파 리프팅으로 자연스러운 타이트닝",
    defaultShortDescription:
      "울쎄라는 FDA 승인을 받은 고강도 집속 초음파(HIFU) 기술로 피부 깊은 SMAS층까지 자극하여 자연스러운 리프팅 효과를 제공합니다.",
    defaultLongDescription:
      "울쎄라 리프팅은 수술 없이 피부 아래 SMAS층을 직접 자극해 콜라겐 재생을 촉진합니다. FDA 승인을 받은 유일한 비침습 리프팅 시술로, 한 번의 시술로 3~6개월에 걸쳐 점진적인 개선 효과를 경험할 수 있습니다.",
    defaultDurationMinutes: 60,
    defaultPainLevel: "보통",
    defaultDowntimeNote: "시술 직후 약간의 홍조와 부종이 있을 수 있으나 대부분 24시간 내 회복됩니다.",
    defaultChatbotSummary:
      "울쎄라는 초음파로 피부 SMAS층을 자극하는 비침습 리프팅 시술입니다. 60분 내외 소요, 마취크림 적용 후 진행합니다.",
    defaultBenefits: ["탄력 개선", "리프팅", "윤곽 정리", "SMAS층 직접 자극"],
    defaultTargets: ["30~50대 여성", "탄력 저하", "초기 노화"],
    defaultConcernAreas: ["볼 처짐", "팔자주름", "이중턱", "목 처짐"],
    defaultKeywords: ["울쎄라", "HIFU", "리프팅", "초음파", "비수술", "안티에이징"],
    defaultSpecialtyPoints: [
      "FDA 승인 유일한 비침습 리프팅",
      "SMAS층까지 도달하는 깊은 자극",
      "시술 후 일상생활 즉시 가능",
    ],
    defaultPrecautions: [
      {
        id: "pre_tm1_1",
        treatmentId: "tm_1",
        type: "before",
        content: "시술 전 메이크업을 깨끗이 지워주세요.",
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pre_tm1_2",
        treatmentId: "tm_1",
        type: "after",
        content: "시술 후 1주일간 사우나·찜질방 이용을 삼가주세요.",
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "pre_tm1_3",
        treatmentId: "tm_1",
        type: "contraindication",
        content: "임신 중이거나 얼굴에 금속 임플란트가 있는 경우 시술이 어렵습니다.",
        sortOrder: 3,
        isPublic: true,
      },
    ],
    assets: [],
    createdAt: "2024-01-10T09:00:00.000Z",
    updatedAt: "2024-06-01T12:00:00.000Z",
  },
  {
    id: "tm_2",
    name: "보톡스",
    englishName: "Botox",
    category: "보톡스",
    defaultOneLinePitch: "정확한 주입으로 자연스러운 주름 개선과 윤곽 교정",
    defaultShortDescription:
      "보톡스는 보툴리눔 톡신을 이용해 근육 활동을 일시적으로 억제하여 주름을 개선하고 얼굴 윤곽을 교정하는 시술입니다.",
    defaultLongDescription:
      "보툴리눔 톡신 시술은 표정 주름 개선, 사각턱 축소, 종아리 축소 등 다양한 부위에 적용 가능합니다. 정확한 용량과 주입 부위 선정이 자연스러운 결과를 좌우합니다.",
    defaultDurationMinutes: 20,
    defaultPainLevel: "경미",
    defaultDowntimeNote: "시술 직후 일상생활 가능, 주사 부위 가벼운 멍이 생길 수 있습니다.",
    defaultChatbotSummary:
      "보톡스는 20분 내외의 간단한 시술로 주름 개선, 사각턱, 종아리 등 다양한 부위에 적용 가능합니다.",
    defaultBenefits: ["주름 개선", "사각턱 축소", "얼굴 윤곽 교정", "리프팅 효과"],
    defaultTargets: ["20~40대", "이마 주름", "눈가 주름", "사각턱"],
    defaultConcernAreas: ["이마", "눈가", "미간", "사각턱", "목 주름"],
    defaultKeywords: ["보톡스", "보툴리눔", "주름", "사각턱", "윤곽"],
    defaultSpecialtyPoints: [
      "20분 내외 빠른 시술",
      "즉시 일상복귀 가능",
      "자연스러운 표정 유지",
    ],
    defaultPrecautions: [
      {
        id: "pre_tm2_1",
        treatmentId: "tm_2",
        type: "after",
        content: "시술 후 4시간 동안 눕지 마세요.",
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pre_tm2_2",
        treatmentId: "tm_2",
        type: "after",
        content: "시술 부위를 1주일간 마사지하지 마세요.",
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "pre_tm2_3",
        treatmentId: "tm_2",
        type: "contraindication",
        content: "임신 중이거나 수유 중인 경우 시술이 어렵습니다.",
        sortOrder: 3,
        isPublic: true,
      },
    ],
    assets: [],
    createdAt: "2024-01-10T09:00:00.000Z",
    updatedAt: "2024-06-01T12:00:00.000Z",
  },
]

const SEED_TREATMENTS: TreatmentData[] = [
  // ── tr_t1: 울쎄라 리프팅 (main, published, featured) ──
  {
    profile: {
      id: "tr_t1",
      branchId: "main",
      masterTreatmentId: "tm_1",
      override: {
        overriddenFields: [],
      },
      name: "울쎄라 리프팅",
      englishName: "Ultherapy Lifting",
      category: "리프팅",
      oneLinePitch: "FDA 승인 초음파 리프팅으로 자연스러운 타이트닝",
      shortDescription:
        "울쎄라는 FDA 승인을 받은 고강도 집속 초음파(HIFU) 기술로 피부 깊은 SMAS층까지 자극하여 자연스러운 리프팅 효과를 제공합니다.",
      longDescription:
        "울쎄라 리프팅은 수술 없이 피부 아래 SMAS층을 직접 자극해 콜라겐 재생을 촉진합니다. FDA 승인을 받은 유일한 비침습 리프팅 시술로, 한 번의 시술로 3~6개월에 걸쳐 점진적인 개선 효과를 경험할 수 있습니다.",
      cardTitle: "울쎄라 리프팅",
      cardDescription: "초음파로 SMAS층 자극, 비수술 리프팅",
      cardPriceText: "120만원~",
      cardDurationText: "약 60분",
      cardBadge: "베스트",
      landingHeadline: "피부 깊은 곳부터 끌어올리는 울쎄라",
      landingSubheadline: "FDA 승인 HIFU 기술로 SMAS층까지 직접 자극",
      differentiationCopy:
        "타 병원의 일반 HIFU와 달리 정품 울쎄라 장비와 공인 트랜스듀서를 사용합니다.",
      chatbotSummary:
        "울쎄라는 초음파로 피부 SMAS층을 자극하는 비침습 리프팅 시술입니다. 60분 내외 소요, 마취크림 적용 후 진행합니다.",
      chatbotEmphasisPoints: "FDA 승인, SMAS층 자극, 비수술",
      durationMinutes: 60,
      anesthesiaRequired: true,
      downtimeNote: "시술 직후 약간의 홍조와 부종이 있을 수 있으나 대부분 24시간 내 회복됩니다.",
      painLevel: "보통",
      treatmentCycleGuide: "1회 시술 후 6~12개월 유지, 이후 재시술 권장",
      maintenancePeriod: "6~12개월",
      recommendedVisits: 1,
      priceRegular: 1200000,
      vatIncluded: true,
      showPrice: true,
      useConsultInquiry: false,
      isPublic: true,
      isFeatured: true,
      isLandingPublic: true,
      chatbotPriority: true,
      status: "published",
      displayOrder: 1,
      hasLandingPage: true,
      useMasterAssetsDefault: true,
      hiddenMasterAssetIds: [],
      createdAt: "2024-03-01T09:00:00.000Z",
      updatedAt: "2024-11-15T14:00:00.000Z",
    },
    benefits: ["탄력 개선", "리프팅", "윤곽 정리", "SMAS층 직접 자극"],
    targets: ["30~50대 여성", "탄력 저하", "초기 노화"],
    concernAreas: ["볼 처짐", "팔자주름", "이중턱", "목 처짐"],
    keywords: ["울쎄라", "HIFU", "리프팅", "초음파", "비수술", "안티에이징"],
    specialtyPoints: [
      "FDA 승인 유일한 비침습 리프팅",
      "SMAS층까지 도달하는 깊은 자극",
      "시술 후 일상생활 즉시 가능",
    ],
    companionTreatments: ["tr_t3", "tr_t4"],
    programs: [
      {
        id: "pg_t1_1",
        treatmentId: "tr_t1",
        branchId: "main",
        name: "얼굴 전체 600샷",
        targetArea: "얼굴 전체",
        description: "이마, 볼, 턱선 등 얼굴 전체 영역 600샷 시술",
        equipmentNote: "울쎄라 DS 트랜스듀서 사용",
        priceRegular: 1200000,
        priceDiscount: 980000,
        vatIncluded: true,
        durationMinutes: 60,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pg_t1_2",
        treatmentId: "tr_t1",
        branchId: "main",
        name: "얼굴+목 800샷",
        targetArea: "얼굴+목",
        description: "얼굴 전체 및 목 부위 포함 800샷 시술",
        equipmentNote: "울쎄라 DS 트랜스듀서 사용",
        priceRegular: 1600000,
        priceDiscount: 1380000,
        vatIncluded: true,
        durationMinutes: 80,
        sortOrder: 2,
        isPublic: true,
      },
    ],
    precautions: [
      {
        id: "pre_t1_1",
        treatmentId: "tr_t1",
        type: "before",
        content: "시술 전 메이크업을 깨끗이 지워주세요.",
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pre_t1_2",
        treatmentId: "tr_t1",
        type: "after",
        content: "시술 후 1주일간 사우나·찜질방 이용을 삼가주세요.",
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "pre_t1_3",
        treatmentId: "tr_t1",
        type: "contraindication",
        content: "임신 중이거나 얼굴에 금속 임플란트가 있는 경우 시술이 어렵습니다.",
        sortOrder: 3,
        isPublic: true,
      },
    ],
    overviewCards: [],
    effectCards: [],
    whyTatoaCards: [],
    whyTatoaGalleryAssetIds: [],
    sourceMaterials: [],
    aiExtractions: [],
    aiExtractionRuns: [],
    landingSectionDrafts: [],
    landingPageDrafts: [],
    assets: [],
    landingSections: [
      {
        id: "ls_t1_1",
        treatmentId: "tr_t1",
        sectionType: "hero_image",
        title: "울쎄라 리프팅",
        subtitle: "FDA 승인 HIFU 리프팅",
        isVisible: true,
        sortOrder: 1,
        createdAt: "2024-03-01T09:00:00.000Z",
        updatedAt: "2024-03-01T09:00:00.000Z",
      },
      {
        id: "ls_t1_2",
        treatmentId: "tr_t1",
        sectionType: "headline_copy",
        title: "피부 깊은 곳부터 끌어올리는 울쎄라",
        subtitle: "FDA 승인 HIFU 기술로 SMAS층까지 직접 자극",
        body: "수술 없이 피부 깊은 SMAS층까지 자극해 자연스러운 리프팅 효과를 경험하세요.",
        isVisible: true,
        sortOrder: 2,
        createdAt: "2024-03-01T09:00:00.000Z",
        updatedAt: "2024-03-01T09:00:00.000Z",
      },
      {
        id: "ls_t1_3",
        treatmentId: "tr_t1",
        sectionType: "feature_grid",
        title: "울쎄라의 핵심 특장점",
        isVisible: true,
        sortOrder: 3,
        metadata: {
          features: [
            { icon: "shield", title: "FDA 승인", desc: "안전성이 검증된 유일한 비침습 리프팅" },
            { icon: "layers", title: "SMAS층 자극", desc: "피부 4.5mm 깊이까지 초음파 집중 조사" },
            { icon: "clock", title: "즉시 일상복귀", desc: "시술 후 바로 일상생활 가능" },
            { icon: "trending-up", title: "지속적 개선", desc: "3~6개월에 걸쳐 점진적 효과 발현" },
          ],
        },
        createdAt: "2024-03-01T09:00:00.000Z",
        updatedAt: "2024-03-01T09:00:00.000Z",
      },
      {
        id: "ls_t1_4",
        treatmentId: "tr_t1",
        sectionType: "program_pricing_table",
        title: "시술 프로그램 안내",
        isVisible: true,
        sortOrder: 4,
        createdAt: "2024-03-01T09:00:00.000Z",
        updatedAt: "2024-03-01T09:00:00.000Z",
      },
      {
        id: "ls_t1_5",
        treatmentId: "tr_t1",
        sectionType: "faq_block",
        title: "자주 묻는 질문",
        isVisible: true,
        sortOrder: 5,
        metadata: {
          faqs: [
            {
              q: "시술 시간은 얼마나 걸리나요?",
              a: "부위에 따라 다르지만 얼굴 전체 기준 약 60~90분 소요됩니다.",
            },
            {
              q: "효과는 언제부터 나타나나요?",
              a: "시술 직후부터 약간의 효과를 느끼실 수 있으며, 3~6개월에 걸쳐 점진적으로 개선됩니다.",
            },
            {
              q: "통증이 심한가요?",
              a: "마취크림을 충분히 도포 후 시술하므로 대부분 견딜 수 있는 수준입니다.",
            },
          ],
        },
        createdAt: "2024-03-01T09:00:00.000Z",
        updatedAt: "2024-03-01T09:00:00.000Z",
      },
      {
        id: "ls_t1_6",
        treatmentId: "tr_t1",
        sectionType: "cta_block",
        title: "지금 바로 상담 예약하세요",
        subtitle: "전문 의료진이 1:1 맞춤 상담을 제공합니다",
        isVisible: true,
        sortOrder: 6,
        createdAt: "2024-03-01T09:00:00.000Z",
        updatedAt: "2024-03-01T09:00:00.000Z",
      },
    ],
    linkedEquipmentIds: ["eq_e1"],
    linkedDoctorIds: [],
    linkedFaqIds: [],
    linkedEventIds: [],
  },

  // ── tr_t2: 피코슈어 레이저 (main, published) ──
  {
    profile: {
      id: "tr_t2",
      branchId: "main",
      override: { overriddenFields: [] },
      name: "피코슈어 레이저",
      englishName: "PicoSure Laser",
      category: "레이저",
      oneLinePitch: "차세대 피코초 레이저로 색소·모공 동시 케어",
      shortDescription:
        "피코슈어는 1조분의 1초(피코초) 단위로 레이저를 조사해 색소 병변을 파쇄하고 모공·피부결을 동시에 개선합니다.",
      longDescription:
        "피코슈어 레이저는 기존 나노초 레이저 대비 압도적으로 짧은 펄스폭으로 색소를 미세하게 분쇄합니다. 프레셔웨이브(Pressure Wave) 기술로 주변 조직 손상 없이 색소만 선택적으로 제거하며, Focus Array Lens를 통해 모공 축소와 피부 재생 효과도 얻을 수 있습니다.",
      cardTitle: "피코슈어 레이저",
      cardDescription: "색소·잡티·모공을 한번에",
      cardPriceText: "30만원~",
      cardDurationText: "약 30분",
      landingHeadline: "피코초의 힘으로 잡티와 모공을 한번에",
      landingSubheadline: "차세대 레이저로 선명하고 맑은 피부를",
      chatbotSummary:
        "피코슈어는 잡티·색소 개선에 효과적인 피코초 레이저입니다. 시술 30분 내외, 자외선 차단 필수입니다.",
      durationMinutes: 30,
      painLevel: "경미",
      downtimeNote: "시술 후 붉은기가 2~3시간 지속될 수 있습니다. 자외선 차단에 유의하세요.",
      treatmentCycleGuide: "1~2주 간격으로 3~5회 권장",
      recommendedVisits: 4,
      priceRegular: 300000,
      vatIncluded: true,
      showPrice: true,
      isPublic: true,
      isFeatured: false,
      isLandingPublic: true,
      chatbotPriority: true,
      status: "published",
      displayOrder: 2,
      hasLandingPage: true,
      useMasterAssetsDefault: false,
      hiddenMasterAssetIds: [],
      createdAt: "2024-03-05T10:00:00.000Z",
      updatedAt: "2024-11-01T11:00:00.000Z",
    },
    benefits: ["색소 개선", "모공 축소", "피부결 개선", "잡티 제거", "피부 톤 균일화"],
    targets: ["색소 침착", "잡티·기미", "모공 확장", "여드름 자국"],
    concernAreas: ["볼", "이마", "코", "전체 얼굴"],
    keywords: ["피코슈어", "레이저", "색소", "잡티", "모공", "피코초"],
    specialtyPoints: [
      "피코초 레이저로 최소한의 열 손상",
      "Focus Array Lens 탑재",
      "다운타임 최소화",
    ],
    companionTreatments: ["tr_t4"],
    programs: [
      {
        id: "pg_t2_1",
        treatmentId: "tr_t2",
        branchId: "main",
        name: "전체 토닝",
        targetArea: "얼굴 전체",
        description: "피부 전체적인 톤업 및 색소 개선",
        priceRegular: 300000,
        vatIncluded: true,
        durationMinutes: 30,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pg_t2_2",
        treatmentId: "tr_t2",
        branchId: "main",
        name: "집중 색소 치료",
        targetArea: "부분",
        description: "기미·잡티 집중 치료 (포커스 렌즈 적용)",
        priceRegular: 500000,
        vatIncluded: true,
        durationMinutes: 40,
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "pg_t2_3",
        treatmentId: "tr_t2",
        branchId: "main",
        name: "5회 패키지",
        targetArea: "얼굴 전체",
        description: "피코슈어 전체 토닝 5회 패키지",
        priceRegular: 1500000,
        priceDiscount: 1200000,
        vatIncluded: true,
        durationMinutes: 30,
        sortOrder: 3,
        isPublic: true,
      },
    ],
    precautions: [
      {
        id: "pre_t2_1",
        treatmentId: "tr_t2",
        type: "before",
        content: "시술 전날 음주를 삼가주세요.",
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pre_t2_2",
        treatmentId: "tr_t2",
        type: "after",
        content: "시술 후 충분한 자외선 차단제를 바르세요.",
        sortOrder: 2,
        isPublic: true,
      },
    ],
    overviewCards: [],
    effectCards: [],
    whyTatoaCards: [],
    whyTatoaGalleryAssetIds: [],
    sourceMaterials: [],
    aiExtractions: [],
    aiExtractionRuns: [],
    landingSectionDrafts: [],
    landingPageDrafts: [],
    assets: [],
    landingSections: [],
    linkedEquipmentIds: ["eq_e2"],
    linkedDoctorIds: [],
    linkedFaqIds: [],
    linkedEventIds: [],
  },

  // ── tr_t3: 써마지 FLX (main, draft) ──
  {
    profile: {
      id: "tr_t3",
      branchId: "main",
      override: { overriddenFields: [] },
      name: "써마지 FLX",
      englishName: "Thermage FLX",
      category: "RF 리프팅",
      oneLinePitch: "라디오파 에너지로 피부 탄력을 근본부터 회복",
      shortDescription:
        "써마지 FLX는 고주파(RF) 에너지를 이용해 피부 진피층의 콜라겐을 자극하고 즉각적인 타이트닝 효과를 제공합니다.",
      cardTitle: "써마지 FLX",
      cardDescription: "RF 에너지로 콜라겐 재생",
      cardPriceText: "상담 후 결정",
      cardDurationText: "약 45~90분",
      chatbotSummary:
        "써마지 FLX는 RF 고주파로 진피 콜라겐을 자극하는 시술입니다. 눈가, 얼굴, 몸 등 다양한 부위에 적용 가능합니다.",
      durationMinutes: 70,
      painLevel: "보통",
      downtimeNote: "거의 없음. 시술 당일 미세한 홍조 가능.",
      treatmentCycleGuide: "1년에 1~2회 권장",
      recommendedVisits: 1,
      vatIncluded: true,
      showPrice: false,
      useConsultInquiry: true,
      isPublic: false,
      isFeatured: false,
      isLandingPublic: false,
      chatbotPriority: false,
      status: "draft",
      displayOrder: 3,
      hasLandingPage: false,
      useMasterAssetsDefault: false,
      hiddenMasterAssetIds: [],
      createdAt: "2024-08-01T09:00:00.000Z",
      updatedAt: "2024-08-01T09:00:00.000Z",
    },
    benefits: ["탄력 개선", "콜라겐 재생", "피부 타이트닝", "눈가 개선"],
    targets: ["40~60대", "피부 처짐", "눈가 주름", "전신 탄력 케어"],
    concernAreas: ["눈가", "얼굴 전체", "복부", "팔"],
    keywords: ["써마지", "RF", "고주파", "리프팅", "탄력", "콜라겐"],
    specialtyPoints: [
      "Comfort Pulse Technology로 통증 최소화",
      "1회 시술로 장기간 효과",
      "다양한 부위 적용 가능",
    ],
    companionTreatments: ["tr_t1"],
    programs: [],
    precautions: [],
    overviewCards: [],
    effectCards: [],
    whyTatoaCards: [],
    whyTatoaGalleryAssetIds: [],
    sourceMaterials: [],
    aiExtractions: [],
    aiExtractionRuns: [],
    landingSectionDrafts: [],
    landingPageDrafts: [],
    assets: [],
    landingSections: [],
    linkedEquipmentIds: ["eq_e3"],
    linkedDoctorIds: [],
    linkedFaqIds: [],
    linkedEventIds: [],
  },

  // ── tr_t4: 보톡스 (main, published) ──
  {
    profile: {
      id: "tr_t4",
      branchId: "main",
      masterTreatmentId: "tm_2",
      override: { overriddenFields: [] },
      name: "보톡스",
      englishName: "Botox",
      category: "보톡스",
      oneLinePitch: "정확한 주입으로 자연스러운 주름 개선과 윤곽 교정",
      shortDescription:
        "보톡스는 보툴리눔 톡신을 이용해 근육 활동을 일시적으로 억제하여 주름을 개선하고 얼굴 윤곽을 교정하는 시술입니다.",
      cardTitle: "보톡스",
      cardDescription: "주름·사각턱·리프팅 보톡스",
      cardPriceText: "5만원~",
      cardDurationText: "약 20분",
      cardBadge: "간편시술",
      chatbotSummary:
        "보톡스는 20분 내외의 간단한 시술로 주름 개선, 사각턱, 종아리 등 다양한 부위에 적용 가능합니다.",
      durationMinutes: 20,
      painLevel: "경미",
      downtimeNote: "시술 직후 일상생활 가능, 주사 부위 가벼운 멍이 생길 수 있습니다.",
      treatmentCycleGuide: "4~6개월 간격 재시술 권장",
      maintenancePeriod: "4~6개월",
      priceRegular: 50000,
      vatIncluded: true,
      showPrice: true,
      isPublic: true,
      isFeatured: false,
      isLandingPublic: true,
      chatbotPriority: true,
      status: "published",
      displayOrder: 4,
      hasLandingPage: true,
      useMasterAssetsDefault: true,
      hiddenMasterAssetIds: [],
      createdAt: "2024-03-10T09:00:00.000Z",
      updatedAt: "2024-11-10T10:00:00.000Z",
    },
    benefits: ["주름 개선", "사각턱 축소", "얼굴 윤곽 교정", "리프팅 효과"],
    targets: ["20~40대", "이마 주름", "눈가 주름", "사각턱"],
    concernAreas: ["이마", "눈가", "미간", "사각턱", "목 주름"],
    keywords: ["보톡스", "보툴리눔", "주름", "사각턱", "윤곽"],
    specialtyPoints: [
      "20분 내외 빠른 시술",
      "즉시 일상복귀 가능",
      "자연스러운 표정 유지",
    ],
    companionTreatments: ["tr_t2", "tr_t1"],
    programs: [
      {
        id: "pg_t4_1",
        treatmentId: "tr_t4",
        branchId: "main",
        name: "사각턱 보톡스",
        targetArea: "사각턱 (교근)",
        description: "교근 보톡스로 사각턱 축소 및 얼굴 라인 개선",
        priceRegular: 200000,
        priceDiscount: 150000,
        vatIncluded: true,
        durationMinutes: 20,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pg_t4_2",
        treatmentId: "tr_t4",
        branchId: "main",
        name: "주름 보톡스",
        targetArea: "이마·미간·눈가",
        description: "이마, 미간, 눈가 표정 주름 개선",
        priceRegular: 100000,
        vatIncluded: true,
        durationMinutes: 20,
        note: "부위별 추가 요금 있음",
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "pg_t4_3",
        treatmentId: "tr_t4",
        branchId: "main",
        name: "리프팅 보톡스",
        targetArea: "광대·코끝·입꼬리",
        description: "다운타임 없는 보톡스 리프팅으로 얼굴 윤곽 교정",
        priceRegular: 150000,
        priceDiscount: 120000,
        vatIncluded: true,
        durationMinutes: 25,
        sortOrder: 3,
        isPublic: true,
      },
    ],
    precautions: [
      {
        id: "pre_t4_1",
        treatmentId: "tr_t4",
        type: "after",
        content: "시술 후 4시간 동안 눕지 마세요.",
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pre_t4_2",
        treatmentId: "tr_t4",
        type: "after",
        content: "시술 부위를 1주일간 마사지하지 마세요.",
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "pre_t4_3",
        treatmentId: "tr_t4",
        type: "contraindication",
        content: "임신 중이거나 수유 중인 경우 시술이 어렵습니다.",
        sortOrder: 3,
        isPublic: true,
      },
    ],
    overviewCards: [],
    effectCards: [],
    whyTatoaCards: [],
    whyTatoaGalleryAssetIds: [],
    sourceMaterials: [],
    aiExtractions: [],
    aiExtractionRuns: [],
    landingSectionDrafts: [],
    landingPageDrafts: [],
    assets: [],
    landingSections: [],
    linkedEquipmentIds: [],
    linkedDoctorIds: [],
    linkedFaqIds: [],
    linkedEventIds: [],
  },

  // ── tr_t5: 모피어스8 (sinsa, published) ──
  {
    profile: {
      id: "tr_t5",
      branchId: "sinsa",
      override: { overriddenFields: [] },
      name: "모피어스8",
      englishName: "Morpheus8",
      category: "미세침 RF",
      oneLinePitch: "미세침과 RF로 피부 리모델링과 리프팅을 동시에",
      shortDescription:
        "모피어스8은 극세 미세침으로 진피층에 RF 에너지를 전달해 콜라겐 재생과 피부 리모델링을 동시에 이루는 시술입니다.",
      longDescription:
        "모피어스8은 24개의 절연 미세침을 이용해 피부 표면에 최소한의 손상을 주면서 진피 깊숙한 곳까지 RF 에너지를 조사합니다. 여드름 흉터, 모공, 탄력 개선에 모두 효과적이며 피부 타입에 관계없이 사용 가능합니다.",
      cardTitle: "모피어스8",
      cardDescription: "미세침 RF 복합 피부 리모델링",
      cardPriceText: "50만원~",
      cardDurationText: "약 60분",
      chatbotSummary:
        "모피어스8은 미세침과 RF를 결합한 시술로 여드름 흉터, 모공, 탄력 개선에 효과적입니다.",
      durationMinutes: 60,
      anesthesiaRequired: true,
      painLevel: "보통",
      downtimeNote: "시술 후 3~5일간 붉은기와 미세한 딱지가 생길 수 있습니다.",
      treatmentCycleGuide: "1개월 간격 3~4회 권장",
      recommendedVisits: 3,
      priceRegular: 500000,
      vatIncluded: true,
      showPrice: true,
      isPublic: true,
      isFeatured: true,
      isLandingPublic: true,
      chatbotPriority: true,
      status: "published",
      displayOrder: 1,
      hasLandingPage: true,
      useMasterAssetsDefault: false,
      hiddenMasterAssetIds: [],
      createdAt: "2024-05-01T09:00:00.000Z",
      updatedAt: "2024-11-20T09:00:00.000Z",
    },
    benefits: ["여드름 흉터 개선", "모공 축소", "탄력 회복", "피부 리모델링", "리프팅"],
    targets: ["여드름 흉터", "모공 확장", "피부 처짐", "20~40대"],
    concernAreas: ["볼", "이마", "코", "얼굴 전체"],
    keywords: ["모피어스8", "미세침", "RF", "여드름흉터", "모공", "피부재생"],
    specialtyPoints: [
      "진피 깊숙한 곳까지 RF 전달",
      "피부색 관계없이 사용 가능",
      "표피 손상 최소화",
    ],
    companionTreatments: [],
    programs: [
      {
        id: "pg_t5_1",
        treatmentId: "tr_t5",
        branchId: "sinsa",
        name: "얼굴 전체",
        targetArea: "얼굴 전체",
        description: "얼굴 전체 모피어스8 시술",
        priceRegular: 500000,
        vatIncluded: true,
        durationMinutes: 60,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pg_t5_2",
        treatmentId: "tr_t5",
        branchId: "sinsa",
        name: "집중 흉터 치료",
        targetArea: "여드름 흉터 부위",
        description: "여드름 흉터 집중 치료 프로그램",
        priceRegular: 700000,
        priceDiscount: 590000,
        vatIncluded: true,
        durationMinutes: 70,
        sortOrder: 2,
        isPublic: true,
      },
    ],
    precautions: [
      {
        id: "pre_t5_1",
        treatmentId: "tr_t5",
        type: "before",
        content: "시술 1시간 전 마취크림을 도포합니다.",
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pre_t5_2",
        treatmentId: "tr_t5",
        type: "after",
        content: "시술 후 3~5일간 자외선 노출을 피하고 자외선 차단제를 꼭 발라주세요.",
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "pre_t5_3",
        treatmentId: "tr_t5",
        type: "after",
        content: "세안 시 문지르지 말고 가볍게 씻어주세요.",
        sortOrder: 3,
        isPublic: true,
      },
    ],
    overviewCards: [],
    effectCards: [],
    whyTatoaCards: [],
    whyTatoaGalleryAssetIds: [],
    sourceMaterials: [],
    aiExtractions: [],
    aiExtractionRuns: [],
    landingSectionDrafts: [],
    landingPageDrafts: [],
    assets: [],
    landingSections: [],
    linkedEquipmentIds: ["eq_e4"],
    linkedDoctorIds: [],
    linkedFaqIds: [],
    linkedEventIds: [],
  },

  // ── tr_t6: 필러 (sinsa, draft) ──
  {
    profile: {
      id: "tr_t6",
      branchId: "sinsa",
      override: { overriddenFields: [] },
      name: "필러",
      englishName: "Filler",
      category: "필러",
      oneLinePitch: "볼륨 보충과 윤곽 교정을 위한 히알루론산 필러",
      shortDescription:
        "히알루론산 성분의 필러를 이용해 꺼진 부위의 볼륨을 채우고 코, 턱, 입술 등의 윤곽을 교정합니다.",
      chatbotSummary:
        "필러는 히알루론산으로 볼륨을 채우는 시술입니다. 코, 턱, 입술, 볼 등 다양한 부위에 적용 가능합니다.",
      durationMinutes: 30,
      painLevel: "경미",
      downtimeNote: "시술 부위에 약간의 부종과 멍이 생길 수 있으며, 1~2주 내 회복됩니다.",
      treatmentCycleGuide: "유지 기간에 따라 6~18개월 후 재시술",
      vatIncluded: true,
      showPrice: false,
      useConsultInquiry: true,
      isPublic: false,
      isFeatured: false,
      isLandingPublic: false,
      chatbotPriority: false,
      status: "draft",
      displayOrder: 2,
      hasLandingPage: false,
      useMasterAssetsDefault: false,
      hiddenMasterAssetIds: [],
      createdAt: "2024-09-01T09:00:00.000Z",
      updatedAt: "2024-09-01T09:00:00.000Z",
    },
    benefits: ["볼륨 보충", "윤곽 교정", "자연스러운 라인", "즉각적인 효과"],
    targets: ["볼 꺼짐", "코 교정", "턱 라인 교정", "입술 볼륨"],
    concernAreas: ["코", "턱", "볼", "입술", "팔자 주름"],
    keywords: ["필러", "히알루론산", "볼륨", "윤곽", "코필러"],
    specialtyPoints: ["즉각적인 볼륨감", "자연스러운 결과", "용해 가능"],
    companionTreatments: ["tr_t4"],
    programs: [],
    precautions: [
      {
        id: "pre_t6_1",
        treatmentId: "tr_t6",
        type: "after",
        content: "시술 후 2주간 시술 부위를 심하게 누르거나 마사지하지 마세요.",
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pre_t6_2",
        treatmentId: "tr_t6",
        type: "contraindication",
        content: "임신·수유 중이거나 혈액응고 장애가 있는 경우 시술이 어렵습니다.",
        sortOrder: 2,
        isPublic: true,
      },
    ],
    overviewCards: [],
    effectCards: [],
    whyTatoaCards: [],
    whyTatoaGalleryAssetIds: [],
    sourceMaterials: [],
    aiExtractions: [],
    aiExtractionRuns: [],
    landingSectionDrafts: [],
    landingPageDrafts: [],
    assets: [],
    landingSections: [],
    linkedEquipmentIds: [],
    linkedDoctorIds: [],
    linkedFaqIds: [],
    linkedEventIds: [],
  },
]

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

const TreatmentContext = createContext<TreatmentContextType | null>(null)

// ─── localStorage 키 상수 ───────────────────────────────────────────────────
const LS_TREATMENTS_KEY = "tatoa_treatments_v1"
const LS_MASTERS_KEY    = "tatoa_masters_v1"

/** 저장된 JSON을 파싱. 실패 시 fallback 반환 */
function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    /* ignore parse errors */
  }
  return fallback
}

export function TreatmentProvider({ children }: { children: React.ReactNode }) {
  // 마운트 시 localStorage에서 복원, 없으면 시드 데이터 사용
  const [masters, setMasters] = useState<TreatmentMaster[]>(
    () => readLS<TreatmentMaster[]>(LS_MASTERS_KEY, SEED_MASTERS)
  )
  const [treatmentList, setTreatmentList] = useState<TreatmentData[]>(
    () => readLS<TreatmentData[]>(LS_TREATMENTS_KEY, SEED_TREATMENTS)
  )

  // 변경될 때마다 localStorage에 자동 저장
  useEffect(() => {
    try { localStorage.setItem(LS_TREATMENTS_KEY, JSON.stringify(treatmentList)) } catch { /* quota/security */ }
  }, [treatmentList])

  useEffect(() => {
    try { localStorage.setItem(LS_MASTERS_KEY, JSON.stringify(masters)) } catch { /* quota/security */ }
  }, [masters])

  // ── Helpers ──

  const updateTreatment = useCallback(
    (treatmentId: string, updater: (t: TreatmentData) => TreatmentData) => {
      setTreatmentList((prev) =>
        prev.map((t) => (t.profile.id === treatmentId ? updater(t) : t))
      )
    },
    []
  )

  // ── Master operations ──

  const getMaster = useCallback(
    (id: string) => masters.find((m) => m.id === id),
    [masters]
  )

  const getAllMasters = useCallback(() => masters, [masters])

  const createMaster = useCallback(
    (
      partial: Partial<Omit<TreatmentMaster, "id" | "createdAt" | "updatedAt">>
    ): TreatmentMaster => {
      const now = nowISO()
      const master: TreatmentMaster = {
        id: generateId("tm"),
        name: partial.name ?? "새 마스터 시술",
        category: partial.category ?? "기타",
        defaultBenefits: partial.defaultBenefits ?? [],
        defaultTargets: partial.defaultTargets ?? [],
        defaultConcernAreas: partial.defaultConcernAreas ?? [],
        defaultKeywords: partial.defaultKeywords ?? [],
        defaultSpecialtyPoints: partial.defaultSpecialtyPoints ?? [],
        defaultPrecautions: partial.defaultPrecautions ?? [],
        assets: partial.assets ?? [],
        ...partial,
        createdAt: now,
        updatedAt: now,
      }
      setMasters((prev) => [...prev, master])
      return master
    },
    []
  )

  const updateMaster = useCallback((id: string, updates: Partial<TreatmentMaster>) => {
    setMasters((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: nowISO() } : m
      )
    )
  }, [])

  // ── Branch treatment operations ──

  const getTreatment = useCallback(
    (id: string) => treatmentList.find((t) => t.profile.id === id),
    [treatmentList]
  )

  const getTreatmentsByBranch = useCallback(
    (branchId: string) => treatmentList.filter((t) => t.profile.branchId === branchId),
    [treatmentList]
  )

  const createTreatment = useCallback(
    (
      branchId: string,
      partial: Partial<Omit<TreatmentProfile, "id" | "branchId" | "createdAt" | "updatedAt">>
    ): TreatmentData => {
      const now = nowISO()
      const profile: TreatmentProfile = {
        id: generateId("tr"),
        branchId,
        override: { overriddenFields: [] },
        name: partial.name ?? "새 시술",
        category: partial.category ?? "기타",
        isPublic: false,
        isFeatured: false,
        isLandingPublic: false,
        chatbotPriority: false,
        status: "draft",
        displayOrder: 99,
        hasLandingPage: false,
        useMasterAssetsDefault: false,
        hiddenMasterAssetIds: [],
        vatIncluded: true,
        showPrice: false,
        ...partial,
        createdAt: now,
        updatedAt: now,
      }
      const data: TreatmentData = {
        profile,
        benefits: [],
        targets: [],
        concernAreas: [],
        keywords: [],
        specialtyPoints: [],
        companionTreatments: [],
        programs: [],
        precautions: [],
        overviewCards: [],
        effectCards: [],
        whyTatoaCards: [],
        whyTatoaGalleryAssetIds: [],
        assets: [],
        landingSections: [],
        sourceMaterials: [],
        aiExtractions: [],
        aiExtractionRuns: [],
        landingSectionDrafts: [],
        landingPageDrafts: [],
        linkedEquipmentIds: [],
        linkedDoctorIds: [],
        linkedFaqIds: [],
        linkedEventIds: [],
      }
      setTreatmentList((prev) => [...prev, data])
      return data
    },
    []
  )

  const createTreatmentFromMaster = useCallback(
    (branchId: string, masterId: string): TreatmentData => {
      const master = masters.find((m) => m.id === masterId)
      if (!master) throw new Error(`Master ${masterId} not found`)
      const now = nowISO()
      const profile: TreatmentProfile = {
        id: generateId("tr"),
        branchId,
        masterTreatmentId: masterId,
        override: { overriddenFields: [] },
        name: master.name,
        englishName: master.englishName,
        category: master.category,
        subcategory: master.subcategory,
        oneLinePitch: master.defaultOneLinePitch,
        shortDescription: master.defaultShortDescription,
        longDescription: master.defaultLongDescription,
        chatbotSummary: master.defaultChatbotSummary,
        durationMinutes: master.defaultDurationMinutes,
        painLevel: master.defaultPainLevel,
        downtimeNote: master.defaultDowntimeNote,
        isPublic: false,
        isFeatured: false,
        isLandingPublic: false,
        chatbotPriority: false,
        status: "draft",
        displayOrder: 99,
        hasLandingPage: false,
        useMasterAssetsDefault: true,
        hiddenMasterAssetIds: [],
        vatIncluded: true,
        showPrice: false,
        createdAt: now,
        updatedAt: now,
      }
      const data: TreatmentData = {
        profile,
        benefits: [...master.defaultBenefits],
        targets: [...master.defaultTargets],
        concernAreas: [...master.defaultConcernAreas],
        keywords: [...master.defaultKeywords],
        specialtyPoints: [...master.defaultSpecialtyPoints],
        companionTreatments: [],
        programs: [],
        precautions: master.defaultPrecautions.map((p) => ({
          ...p,
          id: generateId("pre"),
          treatmentId: profile.id,
        })),
        overviewCards: [],
        effectCards: [],
        whyTatoaCards: [],
        whyTatoaGalleryAssetIds: [],
        assets: [],
        landingSections: [],
        sourceMaterials: [],
        aiExtractions: [],
        aiExtractionRuns: [],
        landingSectionDrafts: [],
        landingPageDrafts: [],
        linkedEquipmentIds: [],
        linkedDoctorIds: [],
        linkedFaqIds: [],
        linkedEventIds: [],
      }
      setTreatmentList((prev) => [...prev, data])
      return data
    },
    [masters]
  )

  const updateProfile = useCallback(
    (treatmentId: string, updates: Partial<TreatmentProfile>) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        profile: { ...t.profile, ...updates, updatedAt: nowISO() },
      }))
    },
    [updateTreatment]
  )

  const updateExtras = useCallback(
    (
      treatmentId: string,
      updates: Partial<
        Omit<
          TreatmentData,
          "profile" | "programs" | "precautions" | "assets" | "landingSections"
        >
      >
    ) => {
      updateTreatment(treatmentId, (t) => ({ ...t, ...updates }))
    },
    [updateTreatment]
  )

  const setFieldOverride = useCallback(
    (treatmentId: string, fieldName: string, value: string) => {
      updateTreatment(treatmentId, (t) => {
        const overriddenFields = t.profile.override.overriddenFields.includes(fieldName)
          ? t.profile.override.overriddenFields
          : [...t.profile.override.overriddenFields, fieldName]
        return {
          ...t,
          profile: {
            ...t.profile,
            [fieldName]: value,
            override: { ...t.profile.override, overriddenFields },
            updatedAt: nowISO(),
          },
        }
      })
    },
    [updateTreatment]
  )

  const resetFieldToMaster = useCallback(
    (treatmentId: string, fieldName: string) => {
      const treatment = treatmentList.find((t) => t.profile.id === treatmentId)
      if (!treatment || !treatment.profile.masterTreatmentId) return
      const master = masters.find((m) => m.id === treatment.profile.masterTreatmentId)
      if (!master) return
      const masterKey = OVERRIDE_FIELD_MAP[fieldName]
      if (!masterKey) return
      const masterValue = master[masterKey]
      updateTreatment(treatmentId, (t) => ({
        ...t,
        profile: {
          ...t.profile,
          [fieldName]: masterValue,
          override: {
            ...t.profile.override,
            overriddenFields: t.profile.override.overriddenFields.filter(
              (f) => f !== fieldName
            ),
          },
          updatedAt: nowISO(),
        },
      }))
    },
    [treatmentList, masters, updateTreatment]
  )

  const syncFromMaster = useCallback(
    (treatmentId: string) => {
      const treatment = treatmentList.find((t) => t.profile.id === treatmentId)
      if (!treatment || !treatment.profile.masterTreatmentId) return
      const master = masters.find((m) => m.id === treatment.profile.masterTreatmentId)
      if (!master) return
      const { overriddenFields } = treatment.profile.override
      const profileUpdates: Partial<TreatmentProfile> = {}
      for (const [fieldName, masterKey] of Object.entries(OVERRIDE_FIELD_MAP)) {
        if (!overriddenFields.includes(fieldName)) {
          ;(profileUpdates as Record<string, unknown>)[fieldName] = master[masterKey]
        }
      }
      updateTreatment(treatmentId, (t) => ({
        ...t,
        profile: { ...t.profile, ...profileUpdates, updatedAt: nowISO() },
      }))
    },
    [treatmentList, masters, updateTreatment]
  )

  // ── Programs ──

  const addProgram = useCallback(
    (treatmentId: string, item: Omit<TreatmentProgram, "id" | "treatmentId">) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        programs: [
          ...t.programs,
          { ...item, id: generateId("pg"), treatmentId },
        ],
      }))
    },
    [updateTreatment]
  )

  const updateProgram = useCallback(
    (treatmentId: string, id: string, updates: Partial<TreatmentProgram>) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        programs: t.programs.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }))
    },
    [updateTreatment]
  )

  const deleteProgram = useCallback(
    (treatmentId: string, id: string) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        programs: t.programs.filter((p) => p.id !== id),
      }))
    },
    [updateTreatment]
  )

  const moveProgram = useCallback(
    (treatmentId: string, id: string, direction: "up" | "down") => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        programs: swapSortOrder(t.programs, id, direction),
      }))
    },
    [updateTreatment]
  )

  // ── Precautions ──

  const addPrecaution = useCallback(
    (treatmentId: string, item: Omit<TreatmentPrecaution, "id" | "treatmentId">) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        precautions: [
          ...t.precautions,
          { ...item, id: generateId("pre"), treatmentId },
        ],
      }))
    },
    [updateTreatment]
  )

  const updatePrecaution = useCallback(
    (treatmentId: string, id: string, updates: Partial<TreatmentPrecaution>) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        precautions: t.precautions.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }))
    },
    [updateTreatment]
  )

  const deletePrecaution = useCallback(
    (treatmentId: string, id: string) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        precautions: t.precautions.filter((p) => p.id !== id),
      }))
    },
    [updateTreatment]
  )

  const movePrecaution = useCallback(
    (treatmentId: string, id: string, direction: "up" | "down") => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        precautions: swapSortOrder(t.precautions, id, direction),
      }))
    },
    [updateTreatment]
  )

  // ── Assets ──

  const addAsset = useCallback(
    (
      treatmentId: string,
      item: Omit<TreatmentAsset, "id" | "treatmentId" | "createdAt" | "updatedAt">
    ): TreatmentAsset => {
      const now = nowISO()
      const asset: TreatmentAsset = {
        ...item,
        id: generateId("ast"),
        treatmentId,
        createdAt: now,
        updatedAt: now,
      }
      updateTreatment(treatmentId, (t) => ({
        ...t,
        assets: [...t.assets, asset],
      }))
      return asset
    },
    [updateTreatment]
  )

  const updateAsset = useCallback(
    (treatmentId: string, assetId: string, updates: Partial<TreatmentAsset>) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        assets: t.assets.map((a) =>
          a.id === assetId ? { ...a, ...updates, updatedAt: nowISO() } : a
        ),
      }))
    },
    [updateTreatment]
  )

  const deleteAsset = useCallback(
    (treatmentId: string, assetId: string) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        assets: t.assets.filter((a) => a.id !== assetId),
      }))
    },
    [updateTreatment]
  )

  const reorderAsset = useCallback(
    (treatmentId: string, assetId: string, direction: "up" | "down") => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        assets: swapSortOrder(t.assets, assetId, direction),
      }))
    },
    [updateTreatment]
  )

  const getEffectiveAssets = useCallback(
    (treatmentId: string): TreatmentAsset[] => {
      const treatment = treatmentList.find((t) => t.profile.id === treatmentId)
      if (!treatment) return []
      const branchAssets = treatment.assets
      if (!treatment.profile.useMasterAssetsDefault || !treatment.profile.masterTreatmentId) {
        return [...branchAssets].sort((a, b) => a.sortOrder - b.sortOrder)
      }
      const master = masters.find((m) => m.id === treatment.profile.masterTreatmentId)
      if (!master) return [...branchAssets].sort((a, b) => a.sortOrder - b.sortOrder)
      const hiddenSet = new Set(treatment.profile.hiddenMasterAssetIds)
      const masterAssets = master.assets
        .filter((a) => !hiddenSet.has(a.id))
        .map((a) => ({
          ...a,
          treatmentId,
          inheritedFromMaster: true,
          hiddenInBranch: false,
          scope: "hq_common" as AssetScope,
        }))
      return [...masterAssets, ...branchAssets].sort((a, b) => a.sortOrder - b.sortOrder)
    },
    [treatmentList, masters]
  )

  const toggleMasterAssetVisibility = useCallback(
    (treatmentId: string, masterAssetId: string) => {
      updateTreatment(treatmentId, (t) => {
        const hidden = t.profile.hiddenMasterAssetIds
        const next = hidden.includes(masterAssetId)
          ? hidden.filter((id) => id !== masterAssetId)
          : [...hidden, masterAssetId]
        return {
          ...t,
          profile: {
            ...t.profile,
            hiddenMasterAssetIds: next,
            updatedAt: nowISO(),
          },
        }
      })
    },
    [updateTreatment]
  )

  // ── Overview cards (Section B) ──

  const addOverviewCard = useCallback(
    (treatmentId: string, item: Omit<TreatmentOverviewCard, "id" | "treatmentId">) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        overviewCards: [...(t.overviewCards ?? []), { ...item, id: generateId("ovc"), treatmentId }],
      }))
    },
    [updateTreatment]
  )

  const updateOverviewCard = useCallback(
    (treatmentId: string, cardId: string, updates: Partial<TreatmentOverviewCard>) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        overviewCards: (t.overviewCards ?? []).map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
      }))
    },
    [updateTreatment]
  )

  const deleteOverviewCard = useCallback(
    (treatmentId: string, cardId: string) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        overviewCards: (t.overviewCards ?? []).filter((c) => c.id !== cardId),
      }))
    },
    [updateTreatment]
  )

  const moveOverviewCard = useCallback(
    (treatmentId: string, cardId: string, direction: "up" | "down") => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        overviewCards: swapSortOrder(t.overviewCards ?? [], cardId, direction),
      }))
    },
    [updateTreatment]
  )

  // ── Effect cards ──

  const addEffectCard = useCallback(
    (treatmentId: string, item: Omit<TreatmentEffectCard, "id" | "treatmentId">) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        effectCards: [...t.effectCards, { ...item, id: generateId("eff"), treatmentId }],
      }))
    },
    [updateTreatment]
  )

  const updateEffectCard = useCallback(
    (treatmentId: string, cardId: string, updates: Partial<TreatmentEffectCard>) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        effectCards: t.effectCards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
      }))
    },
    [updateTreatment]
  )

  const deleteEffectCard = useCallback(
    (treatmentId: string, cardId: string) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        effectCards: t.effectCards.filter((c) => c.id !== cardId),
      }))
    },
    [updateTreatment]
  )

  const moveEffectCard = useCallback(
    (treatmentId: string, cardId: string, direction: "up" | "down") => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        effectCards: swapSortOrder(t.effectCards, cardId, direction),
      }))
    },
    [updateTreatment]
  )

  // ── Why Tatoa cards ──

  const addWhyTatoaCard = useCallback(
    (treatmentId: string, item: Omit<TreatmentWhyTatoaCard, "id" | "treatmentId">) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        whyTatoaCards: [...t.whyTatoaCards, { ...item, id: generateId("wty"), treatmentId }],
      }))
    },
    [updateTreatment]
  )

  const updateWhyTatoaCard = useCallback(
    (treatmentId: string, cardId: string, updates: Partial<TreatmentWhyTatoaCard>) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        whyTatoaCards: t.whyTatoaCards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
      }))
    },
    [updateTreatment]
  )

  const deleteWhyTatoaCard = useCallback(
    (treatmentId: string, cardId: string) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        whyTatoaCards: t.whyTatoaCards.filter((c) => c.id !== cardId),
      }))
    },
    [updateTreatment]
  )

  const moveWhyTatoaCard = useCallback(
    (treatmentId: string, cardId: string, direction: "up" | "down") => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        whyTatoaCards: swapSortOrder(t.whyTatoaCards, cardId, direction),
      }))
    },
    [updateTreatment]
  )

  // ── Source Materials ──

  const addSourceMaterial = useCallback((treatmentId: string, item: Omit<TreatmentSourceMaterial, "id" | "treatmentId" | "createdAt" | "updatedAt">) => {
    setTreatmentList((prev) => prev.map((t) => {
      if (t.profile.id !== treatmentId) return t
      const now = new Date().toISOString()
      const newItem: TreatmentSourceMaterial = {
        ...item, id: generateId("src"), treatmentId, createdAt: now, updatedAt: now,
      }
      return { ...t, sourceMaterials: [...t.sourceMaterials, newItem] }
    }))
  }, [])

  const updateSourceMaterial = useCallback((treatmentId: string, id: string, updates: Partial<TreatmentSourceMaterial>) => {
    setTreatmentList((prev) => prev.map((t) => {
      if (t.profile.id !== treatmentId) return t
      return { ...t, sourceMaterials: t.sourceMaterials.map((m) => m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m) }
    }))
  }, [])

  const deleteSourceMaterial = useCallback((treatmentId: string, id: string) => {
    setTreatmentList((prev) => prev.map((t) => {
      if (t.profile.id !== treatmentId) return t
      return { ...t, sourceMaterials: t.sourceMaterials.filter((m) => m.id !== id) }
    }))
  }, [])

  // ── AI Extractions ──

  const addExtractionRun = useCallback((treatmentId: string, run: Omit<AIExtractionRun, "id">): AIExtractionRun => {
    const newRun: AIExtractionRun = { ...run, id: generateId("run") }
    setTreatmentList((prev) => prev.map((t) => {
      if (t.profile.id !== treatmentId) return t
      return { ...t, aiExtractionRuns: [...t.aiExtractionRuns, newRun] }
    }))
    return newRun
  }, [])

  const addExtractionItems = useCallback((treatmentId: string, runId: string, items: Omit<AIExtractionItem, "id" | "treatmentId" | "runId" | "createdAt">[]) => {
    setTreatmentList((prev) => prev.map((t) => {
      if (t.profile.id !== treatmentId) return t
      const now = new Date().toISOString()
      const newItems: AIExtractionItem[] = items.map((item, i) => ({
        ...item, id: generateId("ext"), treatmentId, runId, createdAt: now, sortOrder: item.sortOrder ?? i,
      }))
      return { ...t, aiExtractions: [...t.aiExtractions, ...newItems] }
    }))
  }, [])

  const updateExtractionItem = useCallback((treatmentId: string, id: string, updates: Partial<AIExtractionItem>) => {
    setTreatmentList((prev) => prev.map((t) => {
      if (t.profile.id !== treatmentId) return t
      return { ...t, aiExtractions: t.aiExtractions.map((e) => e.id === id ? { ...e, ...updates } : e) }
    }))
  }, [])

  const clearExtractionRun = useCallback((treatmentId: string, runId: string) => {
    setTreatmentList((prev) => prev.map((t) => {
      if (t.profile.id !== treatmentId) return t
      return {
        ...t,
        aiExtractions: t.aiExtractions.filter((e) => e.runId !== runId),
        aiExtractionRuns: t.aiExtractionRuns.filter((r) => r.id !== runId),
      }
    }))
  }, [])

  // ── Landing Section Drafts ──

  const addLandingSectionDraft = useCallback((treatmentId: string, draft: Omit<LandingSectionDraft, "id" | "treatmentId">): LandingSectionDraft => {
    const newDraft: LandingSectionDraft = { ...draft, id: generateId("dft"), treatmentId }
    setTreatmentList((prev) => prev.map((t) => {
      if (t.profile.id !== treatmentId) return t
      return { ...t, landingSectionDrafts: [...t.landingSectionDrafts, newDraft] }
    }))
    return newDraft
  }, [])

  const applyLandingSectionDraft = useCallback((treatmentId: string, draftId: string) => {
    setTreatmentList((prev) => prev.map((t) => {
      if (t.profile.id !== treatmentId) return t
      const draft = t.landingSectionDrafts.find((d) => d.id === draftId)
      if (!draft) return t
      // Mark only this draft as applied, unmark others of same sectionType
      const updatedDrafts = t.landingSectionDrafts.map((d) =>
        d.sectionType === draft.sectionType ? { ...d, isApplied: d.id === draftId } : d
      )
      // Also update the landing section with draft content
      const updatedSections = t.landingSections.map((s) =>
        s.sectionType === draft.sectionType
          ? { ...s, title: draft.title ?? s.title, subtitle: draft.subtitle, body: draft.body, metadata: { ...s.metadata, ...draft.metadata }, updatedAt: new Date().toISOString() }
          : s
      )
      return { ...t, landingSectionDrafts: updatedDrafts, landingSections: updatedSections }
    }))
  }, [])

  const deleteLandingSectionDraft = useCallback((treatmentId: string, draftId: string) => {
    setTreatmentList((prev) => prev.map((t) => {
      if (t.profile.id !== treatmentId) return t
      return { ...t, landingSectionDrafts: t.landingSectionDrafts.filter((d) => d.id !== draftId) }
    }))
  }, [])

  // ── Landing Page Drafts ──

  const createLandingPageDraft = useCallback((
    treatmentId: string,
    draft: Omit<LandingPageDraft, "id" | "createdAt" | "updatedAt">
  ): LandingPageDraft => {
    const now = nowISO()
    const newDraft: LandingPageDraft = {
      ...draft,
      id: generateId("lpd"),
      createdAt: now,
      updatedAt: now,
    }
    setTreatmentList((prev) => prev.map((t) => {
      if (t.profile.id !== treatmentId) return t
      // Archive any previously published draft when creating a new one (keep history)
      return { ...t, landingPageDrafts: [...t.landingPageDrafts, newDraft] }
    }))
    return newDraft
  }, [])

  const updateLandingPageDraft = useCallback((
    treatmentId: string,
    draftId: string,
    updates: Partial<LandingPageDraft>
  ) => {
    setTreatmentList((prev) => prev.map((t) => {
      if (t.profile.id !== treatmentId) return t
      return {
        ...t,
        landingPageDrafts: t.landingPageDrafts.map((d) =>
          d.id === draftId ? { ...d, ...updates, updatedAt: nowISO() } : d
        ),
      }
    }))
  }, [])

  const deleteLandingPageDraft = useCallback((treatmentId: string, draftId: string) => {
    setTreatmentList((prev) => prev.map((t) => {
      if (t.profile.id !== treatmentId) return t
      return { ...t, landingPageDrafts: t.landingPageDrafts.filter((d) => d.id !== draftId) }
    }))
  }, [])

  // ── Landing sections ──

  const addLandingSection = useCallback(
    (
      treatmentId: string,
      item: Omit<TreatmentLandingSection, "id" | "treatmentId" | "createdAt" | "updatedAt">
    ): TreatmentLandingSection => {
      const now = nowISO()
      const section: TreatmentLandingSection = {
        ...item,
        id: generateId("ls"),
        treatmentId,
        createdAt: now,
        updatedAt: now,
      }
      updateTreatment(treatmentId, (t) => ({
        ...t,
        landingSections: [...t.landingSections, section],
      }))
      return section
    },
    [updateTreatment]
  )

  const updateLandingSection = useCallback(
    (
      treatmentId: string,
      sectionId: string,
      updates: Partial<TreatmentLandingSection>
    ) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        landingSections: t.landingSections.map((s) =>
          s.id === sectionId ? { ...s, ...updates, updatedAt: nowISO() } : s
        ),
      }))
    },
    [updateTreatment]
  )

  const deleteLandingSection = useCallback(
    (treatmentId: string, sectionId: string) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        landingSections: t.landingSections.filter((s) => s.id !== sectionId),
      }))
    },
    [updateTreatment]
  )

  const moveLandingSection = useCallback(
    (treatmentId: string, sectionId: string, direction: "up" | "down") => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        landingSections: swapSortOrder(t.landingSections, sectionId, direction),
      }))
    },
    [updateTreatment]
  )

  // ── Lifecycle ──

  const archiveTreatment = useCallback(
    (treatmentId: string) => {
      updateTreatment(treatmentId, (t) => ({
        ...t,
        profile: {
          ...t.profile,
          status: "archived",
          isPublic: false,
          isLandingPublic: false,
          updatedAt: nowISO(),
        },
      }))
    },
    [updateTreatment]
  )

  const deleteTreatment = useCallback(
    (treatmentId: string) => {
      setTreatmentList((prev) => prev.filter((t) => t.profile.id !== treatmentId))
    },
    []
  )

  const duplicateTreatment = useCallback(
    (treatmentId: string): TreatmentData => {
      const original = treatmentList.find((t) => t.profile.id === treatmentId)
      if (!original) throw new Error(`Treatment ${treatmentId} not found`)
      const now = nowISO()
      const newId = generateId("tr")
      const dupProfile: TreatmentProfile = {
        ...original.profile,
        id: newId,
        name: `${original.profile.name} (복사)`,
        status: "draft",
        isPublic: false,
        isLandingPublic: false,
        isFeatured: false,
        chatbotPriority: false,
        createdAt: now,
        updatedAt: now,
      }
      const dupPrograms: TreatmentProgram[] = original.programs.map((p) => ({
        ...p,
        id: generateId("pg"),
        treatmentId: newId,
      }))
      const dupPrecautions: TreatmentPrecaution[] = original.precautions.map((p) => ({
        ...p,
        id: generateId("pre"),
        treatmentId: newId,
      }))
      const dupAssets: TreatmentAsset[] = original.assets.map((a) => ({
        ...a,
        id: generateId("ast"),
        treatmentId: newId,
        createdAt: now,
        updatedAt: now,
      }))
      const dupLandingSections: TreatmentLandingSection[] = original.landingSections.map(
        (s) => ({
          ...s,
          id: generateId("ls"),
          treatmentId: newId,
          createdAt: now,
          updatedAt: now,
        })
      )
      const dupEffectCards: TreatmentEffectCard[] = original.effectCards.map((c) => ({
        ...c,
        id: generateId("eff"),
        treatmentId: newId,
      }))
      const dupWhyTatoaCards: TreatmentWhyTatoaCard[] = original.whyTatoaCards.map((c) => ({
        ...c,
        id: generateId("wty"),
        treatmentId: newId,
      }))
      const dupOverviewCards: TreatmentOverviewCard[] = (original.overviewCards ?? []).map((c) => ({
        ...c,
        id: generateId("ovc"),
        treatmentId: newId,
      }))
      const duplicate: TreatmentData = {
        profile: dupProfile,
        benefits: [...original.benefits],
        targets: [...original.targets],
        concernAreas: [...original.concernAreas],
        keywords: [...original.keywords],
        specialtyPoints: [...original.specialtyPoints],
        companionTreatments: [...original.companionTreatments],
        programs: dupPrograms,
        precautions: dupPrecautions,
        overviewCards: dupOverviewCards,
        effectCards: dupEffectCards,
        whyTatoaCards: dupWhyTatoaCards,
        whyTatoaGalleryAssetIds: [...original.whyTatoaGalleryAssetIds],
        assets: dupAssets,
        landingSections: dupLandingSections,
        sourceMaterials: [],        // don't copy source materials to duplicates
        aiExtractions: [],
        aiExtractionRuns: [],
        landingSectionDrafts: [],
        landingPageDrafts: [],
        linkedEquipmentIds: [...original.linkedEquipmentIds],
        linkedDoctorIds: [...original.linkedDoctorIds],
        linkedFaqIds: [...original.linkedFaqIds],
        linkedEventIds: [...original.linkedEventIds],
      }
      setTreatmentList((prev) => [...prev, duplicate])
      return duplicate
    },
    [treatmentList]
  )

  const value: TreatmentContextType = {
    masters,
    treatmentList,
    getMaster,
    getAllMasters,
    createMaster,
    updateMaster,
    getTreatment,
    getTreatmentsByBranch,
    createTreatment,
    createTreatmentFromMaster,
    updateProfile,
    updateExtras,
    setFieldOverride,
    resetFieldToMaster,
    syncFromMaster,
    addProgram,
    updateProgram,
    deleteProgram,
    moveProgram,
    addPrecaution,
    updatePrecaution,
    deletePrecaution,
    movePrecaution,
    addAsset,
    updateAsset,
    deleteAsset,
    reorderAsset,
    getEffectiveAssets,
    toggleMasterAssetVisibility,
    addOverviewCard,
    updateOverviewCard,
    deleteOverviewCard,
    moveOverviewCard,
    addEffectCard,
    updateEffectCard,
    deleteEffectCard,
    moveEffectCard,
    addWhyTatoaCard,
    updateWhyTatoaCard,
    deleteWhyTatoaCard,
    moveWhyTatoaCard,
    addSourceMaterial, updateSourceMaterial, deleteSourceMaterial,
    addExtractionRun, addExtractionItems, updateExtractionItem, clearExtractionRun,
    addLandingSectionDraft, applyLandingSectionDraft, deleteLandingSectionDraft,
    createLandingPageDraft, updateLandingPageDraft, deleteLandingPageDraft,
    addLandingSection,
    updateLandingSection,
    deleteLandingSection,
    moveLandingSection,
    archiveTreatment,
    deleteTreatment,
    duplicateTreatment,
  }

  return (
    <TreatmentContext.Provider value={value}>{children}</TreatmentContext.Provider>
  )
}

export function useTreatment(): TreatmentContextType {
  const ctx = useContext(TreatmentContext)
  if (!ctx) {
    throw new Error("useTreatment must be used within a TreatmentProvider")
  }
  return ctx
}
