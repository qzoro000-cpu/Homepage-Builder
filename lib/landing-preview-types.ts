// Types that match the elegant-treatment-pages template shape.
// These are "presentation types" — the data adapter maps CMS types → these.

/** 섹션 배경 이미지 편집 설정 */
export type SectionBgImageCfg = {
  /** CSS background-position: "center" | "top" | "top left" 등 */
  position?: string
  /** 블러 px (0–30) */
  blur?: number
  /** 이미지 불투명도 0–100 */
  opacity?: number
  /** 확대(줌) 100–150 */
  scale?: number
  /** brightness % (0–200) */
  brightness?: number
  /** contrast % (0–200) */
  contrast?: number
  /** saturate % (0–200) */
  saturate?: number
  /** hue-rotate deg (–180–180) */
  hue?: number
  /** 오버레이 색상 hex "#rrggbb" */
  overlayColor?: string
  /** 오버레이 불투명도 0–100 */
  overlayOpacity?: number
  /** 오버레이 그라데이션 방향 */
  overlayGradient?: "none" | "to-bottom" | "to-top" | "to-right" | "to-left" | "radial"
}

export type LPKeyPoint    = { title: string; body: string }
export type LPProgress    = { label: string; value: string }
export type LPEffectItem  = { title: string; description?: string; cardPreset?: string }
export type LPAdvantage   = { index: string; title: string; body: string }
export type LPReason      = { title: string; body: string }
/** 섹션에 첨부된 이미지 1장 — 랜딩 미리보기에서 여백 없이·세로 무제한으로 렌더링 */
export type LPSectionImage = { url: string; cfg?: string; caption?: string }
export type LPProgram    = {
  name: string
  tag?: string
  price: string
  priceNum?: number
  originalPrice?: string
  originalPriceNum?: number
  priceNote?: string    // 가격 옆 부가 텍스트 (예: "VAT 별도")
  duration?: string
  includes: string[]
  highlight?: boolean
  cardPreset?: string   // 이 카드 전용 BOX_PRESET (설정 시 highlight 무시)
  ctaLabel?: string     // 카드 하단 CTA 버튼 문구
  ctaHref?: string      // 카드 하단 CTA 버튼 링크
  nameFont?: string
  nameSizePx?: number
  nameWeight?: string
  nameItalic?: boolean
  cardBgMode?: "preset" | "solid" | "gradient" | "transparent"
  cardBgHex?: string
  cardBgHex2?: string
  cardBgOpacity?: number
  cardBgGradDir?: string
  cardBorderOn?: boolean
  cardBorderHex?: string
  cardBorderW?: number
  cardShadowMode?: "none" | "soft" | "deep" | "neon"
  cardShadowHex?: string
  cardBlur?: number
  cardRadius?: number
  priceColor?: string
}
export type LPFaqItem    = { q: string; a: string }
export type LPGalleryImg = { src: string; alt: string; aspect?: "portrait" | "landscape" | "square" }

export type LandingPreviewData = {
  /** "light" (크림/베이지, 기본) | "dark" (블랙, 골드 포인트) */
  theme?:             "light" | "dark"

  category?:          string
  treatmentName:      string
  subtitle?:          string
  summary?:           string
  heroImage?:         string
  heroImgCfg?:        string   // JSON: HeroImgCfg (효과·위치·그라데이션·그림자)
  heroBadge?:         string
  durationText?:      string
  priceText?:         string
  originalPriceText?: string
  ctaPrimary?:        { label: string; href: string }
  ctaSecondary?:      { label: string; href: string }

  overviewTitle?:     string
  overviewBody?:      string
  overviewImage?:     string
  overviewImgCfg?:    string
  overviewTheme?:     "light" | "dark"
  overviewImagesData?: LPSectionImage[]   // 다중 이미지 (랜딩 렌더링용)
  overviewBgImage?:   string              // 섹션 배경 이미지 URL
  overviewBgImageCfg?: SectionBgImageCfg // 섹션 배경 편집 설정
  keyPoints?:         LPKeyPoint[]

  effects?:      string[]
  effectItems?:  LPEffectItem[]
  progressInfo?: LPProgress[]

  effectsEyebrow?:          string
  effectsHeadline?:         string
  effectsDescription?:      string
  effectsTitleColor?:       string
  effectsTitleFontSize?:    string
  effectsTitleFontFamily?:  string
  effectsTheme?:            "light" | "dark"
  effectsBoxPreset?:   string
  effectsInfoPreset?:  string
  effectsBoxCustom?:   { bg?: string; border?: string; shadow?: string; blur?: number; radius?: number }
  effectsInfoCustom?:  { bg?: string; border?: string; shadow?: string; blur?: number; radius?: number }
  effectsImage?:       string
  effectsImagesData?:  LPSectionImage[]   // 다중 이미지
  effectsBgImage?:     string             // 섹션 배경 이미지 URL
  effectsBgImageCfg?:  SectionBgImageCfg  // 섹션 배경 편집 설정

  advantages?: LPAdvantage[]
  advantagesTitle?: string
  advantagesBody?: string
  advantagesTheme?: "light" | "dark"
  advantagesBoxPreset?: string
  advantagesCardCustom?: { bg?: string; border?: string; shadow?: string; blur?: number; radius?: number }
  advantagesImagesData?: LPSectionImage[] // 다중 이미지
  advantagesBgImage?:   string           // 섹션 배경 이미지 URL
  advantagesBgImageCfg?: SectionBgImageCfg

  precautionsBefore?:       string[]
  precautionsAfter?:        string[]
  contraindications?:       string[]
  precautionsNotes?:        string[]
  precautionsTitle?:        string
  precautionsBody?:         string
  precautionsTheme?:        "light" | "dark"
  precautionsBoxPreset?:    string
  precautionsCardCustom?:   { bg?: string; border?: string; shadow?: string; blur?: number; radius?: number }
  precautionsCardTitles?:   Record<string, string>
  precautionsImagesData?:   LPSectionImage[] // 다중 이미지
  precautionsBgImage?:      string           // 섹션 배경 이미지 URL
  precautionsBgImageCfg?:   SectionBgImageCfg

  tatoaReasons?: LPReason[]
  whyTatoaEyebrow?:     string
  whyTatoaHeadline?:    string
  whyTatoaSummary?:     string
  whyTatoaTheme?:       "light" | "dark"
  whyTatoaBoxPreset?:   string
  whyTatoaCardCustom?:  { bg?: string; border?: string; shadow?: string; blur?: number; radius?: number }
  whyTatoaImage?:       string
  whyTatoaImagesData?:  LPSectionImage[]   // 다중 이미지
  whyTatoaBgImage?:     string             // 섹션 배경 이미지 URL
  whyTatoaBgImageCfg?:  SectionBgImageCfg

  faqImagesData?:   LPSectionImage[]        // 다중 이미지
  faqBgImage?:      string                  // 섹션 배경 이미지 URL
  faqBgImageCfg?:   SectionBgImageCfg

  pricingPrograms?: LPProgram[]
  pricingNote?:     string
  pricingEyebrow?:  string
  pricingHeadline?: string
  pricingEnName?:   string
  pricingBody?:     string
  pricingTheme?:    "light" | "dark"
  pricingBoxPreset?: string
  pricingCardCustom?: { bg?: string; border?: string; shadow?: string; blur?: number; radius?: number }

  ctaBarPrimary?:   { label: string; href: string }
  ctaBarSecondary?: { label: string; href: string }

  galleryImages?: LPGalleryImg[]

  faqItems?: LPFaqItem[]

  finalCta?: {
    headline: string
    body?:    string
    primary:  { label: string; href: string }
    secondary?: { label: string; href: string }
  }

  clinicInfo?: {
    name:     string
    address?: string
    hours?:   string[]
    phone?:   string
  }
}
