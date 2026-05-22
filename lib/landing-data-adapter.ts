/**
 * landing-data-adapter.ts
 *
 * Maps the CMS's TreatmentProfile + TreatmentData into the LandingPreviewData
 * shape expected by the landing-preview section components.
 *
 * Rules:
 * - Fact fields (price, CTA URLs, duration) come ONLY from profile — never AI-generated.
 * - Copy fields (descriptions, cards, precautions) come from their respective arrays.
 * - Missing/empty values collapse sections gracefully (the section components return null).
 */

import type { TreatmentProfile, TreatmentData, TreatmentAsset } from "@/lib/treatment-store"
import type { LandingPreviewData, LPAdvantage, LPProgress, LPProgram, SectionBgImageCfg } from "@/lib/landing-preview-types"

/**
 * Rich-text HTML → string[] (one HTML-fragment per line).
 * Splits on <br>, </p>, </li> boundaries; strips wrapper block tags;
 * keeps inline formatting (span, strong, em, etc.) so the preview can
 * render with dangerouslySetInnerHTML and show colours / font-sizes.
 */
function parseIncludesHtml(html: string): string[] {
  return html
    // split at every line-ending tag
    .split(/<br\s*\/?>|<\/p>|<\/li>/gi)
    // strip leading block-open tags (<p>, <li>, <ul>, <ol> …)
    .map(chunk => chunk.replace(/^<(p|li|ul|ol|div)[^>]*>/gi, "").trim())
    // discard chunks that are empty or whitespace-only after stripping all tags
    .filter(chunk => chunk.replace(/<[^>]+>/g, "").trim().length > 0)
}

/** JSON 문자열 → SectionBgImageCfg 파싱 (실패 시 undefined) */
function parseBgCfg(json?: string): SectionBgImageCfg | undefined {
  if (!json) return undefined
  try { return JSON.parse(json) as SectionBgImageCfg } catch { return undefined }
}

function formatPrice(n: number | null | undefined): string | undefined {
  if (n == null || n <= 0) return undefined
  if (n >= 10000) return `₩${Math.floor(n / 10000).toLocaleString()}만`
  return `₩${n.toLocaleString()}`
}

function findFirstImage(assets: TreatmentAsset[], assetId?: string): string | undefined {
  if (assetId) {
    const a = assets.find((a) => a.id === assetId && a.fileType === "image")
    return a?.fileUrl  // undefined if not found — don't fall through to first image
  }
  const first = assets.find((a) => a.fileType === "image")
  return first?.fileUrl
}

export function buildLandingPreviewData(
  profile: TreatmentProfile,
  data: TreatmentData,
  assets: TreatmentAsset[]
): LandingPreviewData {
  const p = profile

  // ── 가격 텍스트 ──
  const priceText = p.landingHeroPriceText
    ?? formatPrice(p.priceEvent)
    ?? formatPrice(p.priceRegular)
    ?? (p.useConsultInquiry ? "상담 후 결정" : undefined)

  const originalPriceText = p.priceEvent && p.priceRegular && p.priceRegular > p.priceEvent
    ? formatPrice(p.priceRegular)
    : undefined

  // ── CTA ──
  const ctaPrimary = p.bookingUrl
    ? { label: p.ctaPrimaryLabel ?? "예약 상담 신청", href: p.bookingUrl }
    : { label: p.ctaPrimaryLabel ?? "예약 상담 신청", href: "#reserve" }

  const ctaSecondary = p.phoneUrl
    ? { label: p.ctaSecondaryLabel ?? "전화 문의", href: p.phoneUrl }
    : p.kakaoUrl
    ? { label: p.ctaSecondaryLabel ?? "카카오 문의", href: p.kakaoUrl }
    : undefined

  // ── 이미지 ── heroImageUrl(직접업로드) 우선, 없으면 asset 라이브러리 폴백
  const heroImage   = p.heroImageUrl || findFirstImage(assets, p.heroImageAssetId)

  // 다중 이미지 JSON → 배열 파싱 헬퍼
  const parseSectionImgs = (json?: string) => {
    try { const arr = JSON.parse(json || "[]"); if (Array.isArray(arr) && arr.length) return arr as { url: string; cfg?: string; caption?: string }[] } catch {}
    return undefined
  }
  const firstSectionImg = (json?: string) => parseSectionImgs(json)?.[0]?.url

  // overviewImages → overviewImageUrl → overviewImageAssetId → mobileHeroAssetId → heroImage 순으로 폴백
  const overviewImg = firstSectionImg(p.overviewImages)
    || p.overviewImageUrl
    || findFirstImage(assets, p.overviewImageAssetId)
    || findFirstImage(assets, p.mobileHeroAssetId)
    || heroImage

  // ── 시술 시간 텍스트 ──
  const durationText = p.durationMinutes ? `약 ${p.durationMinutes}분` : undefined

  // ── Overview key points (overviewCards 전용 — effectCards 폴백 제거) ──
  const keyPoints = [...(data.overviewCards ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({ title: c.title, body: c.description ?? "" }))

  // ── Effects list (effect card titles + per-card preset) ──
  const sortedEffectCards = [...data.effectCards].sort((a, b) => a.sortOrder - b.sortOrder)
  const effects = sortedEffectCards.map((c) => c.title).filter(Boolean)
  const effectItems = sortedEffectCards.map((c) => ({
    title:       c.title,
    description: c.description || undefined,
    cardPreset:  c.cardPreset ?? "default",
  }))

  // ── Progress info grid ──
  const progressInfo: LPProgress[] = []
  if (p.durationMinutes)     progressInfo.push({ label: "시술 시간",  value: `약 ${p.durationMinutes}분` })
  if (p.anesthesiaRequired !== undefined)
    progressInfo.push({ label: "마취",       value: p.anesthesiaRequired ? "표면 마취" : "없음" })
  if (p.painLevel)           progressInfo.push({ label: "통증 정도",  value: p.painLevel })
  if (p.downtimeNote)        progressInfo.push({ label: "다운타임",   value: p.downtimeNote })
  if (p.treatmentCycleGuide) progressInfo.push({ label: "권장 주기",  value: p.treatmentCycleGuide })
  if (p.maintenancePeriod)   progressInfo.push({ label: "효과 지속",  value: p.maintenancePeriod })

  // ── Advantages from specialtyPoints + benefits ──
  const advantages: LPAdvantage[] = data.specialtyPoints.slice(0, 6).map((pt, i) => ({
    index: String(i + 1).padStart(2, "0"),
    title: pt,
    body:  data.benefits[i] ?? "",
  }))

  // ── Precautions by type ──
  const pubPrecs = data.precautions.filter((pr) => pr.isPublic)
  const precautionsBefore   = pubPrecs.filter((pr) => pr.type === "before").map((pr) => pr.content)
  const precautionsAfter    = pubPrecs.filter((pr) => pr.type === "after").map((pr) => pr.content)
  const contraindications   = pubPrecs.filter((pr) => pr.type === "contraindication").map((pr) => pr.content)
  const precautionsNotes    = pubPrecs.filter((pr) => pr.type === "note").map((pr) => pr.content)

  // ── Why Tatoa reasons ──
  const tatoaReasons = [...data.whyTatoaCards]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({ title: c.title, body: c.description ?? "" }))

  // ── Pricing programs ──
  const pricingPrograms: LPProgram[] = [...data.programs]
    .filter((pr) => pr.isPublic)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((pr, i) => ({
      name:          pr.name,
      tag:           pr.note ?? undefined,
      price:             pr.priceDiscount ? `₩${pr.priceDiscount.toLocaleString()}` : pr.priceRegular ? `₩${pr.priceRegular.toLocaleString()}` : "상담",
      priceNum:          pr.priceDiscount ?? pr.priceRegular ?? 0,
      originalPrice:     pr.priceDiscount && pr.priceRegular ? `₩${pr.priceRegular.toLocaleString()}` : undefined,
      originalPriceNum:  pr.priceDiscount && pr.priceRegular ? pr.priceRegular : undefined,
      priceNote:         p.vatIncluded === false ? "VAT 별도" : undefined,
      duration:      pr.durationMinutes ? `${pr.durationMinutes}분 / ${pr.targetArea ?? ""}` : pr.targetArea ?? undefined,
      includes:      pr.description
        ? parseIncludesHtml(pr.description)
        : ["1:1 전담 상담", "기본 사후 케어"],
      // highlight: 명시 설정 우선, 없으면 두 번째 카드가 기본 하이라이트 (cardPreset 설정 시 무시됨)
      highlight:     pr.highlight !== undefined ? pr.highlight : i === 1,
      cardPreset:    pr.cardPreset ?? undefined,
      ctaLabel:      pr.ctaLabel   ?? undefined,
      ctaHref:       pr.ctaHref    ?? undefined,
      nameFont:      pr.nameFont   ?? undefined,
      nameSizePx:    pr.nameSizePx ?? undefined,
      nameWeight:    pr.nameWeight ?? undefined,
      nameItalic:    pr.nameItalic ?? undefined,
      cardBgMode:    pr.cardBgMode,
      cardBgHex:     pr.cardBgHex,
      cardBgHex2:    pr.cardBgHex2,
      cardBgOpacity: pr.cardBgOpacity,
      cardBgGradDir: pr.cardBgGradDir,
      cardBorderOn:  pr.cardBorderOn,
      cardBorderHex: pr.cardBorderHex,
      cardBorderW:   pr.cardBorderW,
      cardShadowMode: pr.cardShadowMode,
      cardShadowHex:  pr.cardShadowHex,
      cardBlur:      pr.cardBlur,
      cardRadius:    pr.cardRadius,
      priceColor:    pr.priceColor,
    }))

  // ── FAQ (from data.linkedFaqIds — flat store IDs, we use whatever the CMS has) ──
  // Since FAQ items aren't directly embedded in TreatmentData, we skip here.
  // FAQ content should be in aiExtractions with category="faq"
  const faqFromExtractions = data.aiExtractions
    ?.filter((it) => it.category === "faq" && (it.status === "approved" || it.status === "modified"))
    .map((it) => {
      const raw = it.modifiedContent ?? it.content
      // Try to parse "Q: ... A: ..." format (no dotAll — split on newline first)
      const qMatch = raw.match(/Q[：:]\s*(.+?)(?:\n|A[：:])/i)
      const aMatch = raw.match(/A[：:]\s*([\s\S]+)/i)
      return {
        q: qMatch?.[1]?.trim() ?? raw.split("\n")[0]?.trim() ?? raw.slice(0, 60),
        a: aMatch?.[1]?.trim() ?? raw.slice(60),
      }
    }) ?? []

  // ── Final CTA ──
  const finalCta = {
    headline: p.finalCtaHeadline || `지금, ${p.name}을 시작하세요.`,
    body:     p.whyTatoaSummary ?? "전담 의료진이 1:1 상담으로 가장 알맞은 흐름을 설계해드립니다.",
    primary:  ctaPrimary,
    secondary: ctaSecondary,
  }

  return {
    theme:            p.landingTheme ?? "light",

    category:         p.category || undefined,
    treatmentName:    p.name,
    subtitle:         p.englishName || undefined,
    summary:          p.oneLinePitch || undefined,
    heroImage,
    heroImgCfg:       p.heroImgCfg || undefined,
    heroBadge:        p.cardBadge || undefined,
    durationText,
    priceText,
    originalPriceText,
    ctaPrimary,
    ctaSecondary,

    overviewTitle:      p.landingHeadline ?? p.name,
    overviewBody:       p.shortDescription ?? p.longDescription ?? undefined,
    overviewImage:      overviewImg,
    overviewImgCfg:     p.overviewImgCfg || undefined,
    overviewTheme:      p.overviewTheme ?? "light",
    overviewImagesData: parseSectionImgs(p.overviewImages),
    overviewBgImage:    p.overviewBgImageUrl || undefined,
    overviewBgImageCfg: parseBgCfg(p.overviewBgImageCfg),
    keyPoints:          keyPoints.length ? keyPoints : undefined,

    effects:         effects.length ? effects : undefined,
    effectItems:     effectItems.length ? effectItems : undefined,
    progressInfo:    progressInfo.length ? progressInfo : undefined,

    effectsEyebrow:         p.effectsSectionEyebrow    || undefined,
    effectsHeadline:        p.effectsSectionHeadline   || undefined,
    effectsDescription:     p.effectsSectionDescription || undefined,
    effectsTitleColor:      p.effectsTitleColor        || undefined,
    effectsTitleFontSize:   p.effectsTitleFontSize     || undefined,
    effectsTitleFontFamily: p.effectsTitleFontFamily   || undefined,
    effectsTheme:           p.effectsTheme ?? "dark",
    effectsBoxPreset:   p.effectsBoxPreset ?? "default",
    effectsInfoPreset:  p.effectsInfoPreset ?? "default",
    effectsBoxCustom:   (p.effectsBoxBg || p.effectsBoxBorder || p.effectsBoxShadow || p.effectsBoxBlur || p.effectsBoxRadius)
      ? { bg: p.effectsBoxBg, border: p.effectsBoxBorder, shadow: p.effectsBoxShadow, blur: p.effectsBoxBlur, radius: p.effectsBoxRadius }
      : undefined,
    effectsInfoCustom:  (p.effectsInfoBg || p.effectsInfoBorder || p.effectsInfoShadow || p.effectsInfoBlur || p.effectsInfoRadius)
      ? { bg: p.effectsInfoBg, border: p.effectsInfoBorder, shadow: p.effectsInfoShadow, blur: p.effectsInfoBlur, radius: p.effectsInfoRadius }
      : undefined,
    effectsImage:       firstSectionImg(p.effectsImages) || (p.effectsImageAssetId ? findFirstImage(assets, p.effectsImageAssetId) : undefined),
    effectsImagesData:  parseSectionImgs(p.effectsImages),
    effectsBgImage:     p.effectsBgImageUrl || undefined,
    effectsBgImageCfg:  parseBgCfg(p.effectsBgImageCfg),

    advantages:      advantages.length ? advantages : undefined,
    advantagesTitle: p.advantagesTitle || undefined,
    advantagesBody:  p.advantagesBody  || undefined,
    advantagesTheme: p.advantagesTheme ?? "light",
    advantagesBoxPreset: p.advantagesBoxPreset ?? "default",
    advantagesCardCustom: (p.advantagesCardBg || p.advantagesCardBorder || p.advantagesCardShadow || p.advantagesCardBlur || p.advantagesCardRadius)
      ? { bg: p.advantagesCardBg, border: p.advantagesCardBorder, shadow: p.advantagesCardShadow, blur: p.advantagesCardBlur, radius: p.advantagesCardRadius }
      : undefined,
    advantagesImagesData:  parseSectionImgs(p.advantagesImages),
    advantagesBgImage:     p.advantagesBgImageUrl || undefined,
    advantagesBgImageCfg:  parseBgCfg(p.advantagesBgImageCfg),

    precautionsBefore:      precautionsBefore.length  ? precautionsBefore  : undefined,
    precautionsAfter:       precautionsAfter.length   ? precautionsAfter   : undefined,
    contraindications:      contraindications.length  ? contraindications  : undefined,
    precautionsNotes:       precautionsNotes.length   ? precautionsNotes   : undefined,
    precautionsTitle:       p.precautionsTitle  || undefined,
    precautionsBody:        p.precautionsBody   || undefined,
    precautionsTheme:       p.precautionsTheme  ?? "light",
    precautionsBoxPreset:   p.precautionsBoxPreset ?? "default",
    precautionsCardCustom:  (p.precautionsCardBg || p.precautionsCardBorder || p.precautionsCardShadow || p.precautionsCardBlur || p.precautionsCardRadius)
      ? { bg: p.precautionsCardBg, border: p.precautionsCardBorder, shadow: p.precautionsCardShadow, blur: p.precautionsCardBlur, radius: p.precautionsCardRadius }
      : undefined,
    precautionsCardTitles:  p.precautionsCardTitles ?? {},
    precautionsImagesData:  parseSectionImgs(p.precautionsImages),
    precautionsBgImage:     p.precautionsBgImageUrl || undefined,
    precautionsBgImageCfg:  parseBgCfg(p.precautionsBgImageCfg),

    tatoaReasons:    tatoaReasons.length ? tatoaReasons : undefined,
    whyTatoaEyebrow:   p.whyTatoaEyebrow   || undefined,
    whyTatoaHeadline:  p.whyTatoaHeadline  || undefined,
    whyTatoaSummary:   p.whyTatoaSummary   || undefined,
    whyTatoaTheme:     p.whyTatoaTheme     ?? "dark",
    whyTatoaBoxPreset: p.whyTatoaBoxPreset ?? "glass-dark",
    whyTatoaCardCustom: (p.whyTatoaCardBg || p.whyTatoaCardBorder || p.whyTatoaCardShadow || p.whyTatoaCardBlur || p.whyTatoaCardRadius)
      ? { bg: p.whyTatoaCardBg, border: p.whyTatoaCardBorder, shadow: p.whyTatoaCardShadow, blur: p.whyTatoaCardBlur, radius: p.whyTatoaCardRadius }
      : undefined,
    whyTatoaImage:      firstSectionImg(p.whyTatoaImages) || (p.whyTatoaImageAssetId ? findFirstImage(assets, p.whyTatoaImageAssetId) : undefined),
    whyTatoaImagesData:  parseSectionImgs(p.whyTatoaImages),
    whyTatoaBgImage:     p.whyTatoaBgImageUrl || undefined,
    whyTatoaBgImageCfg:  parseBgCfg(p.whyTatoaBgImageCfg),
    faqImagesData:       parseSectionImgs(p.faqImages),
    faqBgImage:          p.faqBgImageUrl || undefined,
    faqBgImageCfg:       parseBgCfg(p.faqBgImageCfg),

    pricingPrograms: pricingPrograms.length ? pricingPrograms : undefined,
    pricingNote:     p.vatIncluded === false ? "표시된 가격은 부가세(VAT) 별도입니다." : undefined,
    pricingEyebrow:  p.pricingEyebrow  || undefined,
    pricingHeadline: p.pricingHeadline || undefined,
    pricingEnName:   p.pricingEnName   || undefined,
    pricingBody:     p.pricingBody     || undefined,
    pricingTheme:    p.pricingTheme    ?? "light",
    pricingBoxPreset: p.pricingBoxPreset ?? "default",
    pricingCardCustom: (p.pricingCardBg || p.pricingCardBorder || p.pricingCardShadow || p.pricingCardBlur || p.pricingCardRadius)
      ? { bg: p.pricingCardBg, border: p.pricingCardBorder, shadow: p.pricingCardShadow, blur: p.pricingCardBlur, radius: p.pricingCardRadius }
      : undefined,

    // ── 하단 고정 CTA 바 — ctaBar 전용 설정 우선, 없으면 히어로 CTA 값 사용 ──
    ctaBarPrimary: p.ctaBarPrimaryHref
      ? { label: p.ctaBarPrimaryLabel ?? ctaPrimary.label, href: p.ctaBarPrimaryHref }
      : undefined,
    ctaBarSecondary: p.ctaBarSecondaryHref
      ? { label: p.ctaBarSecondaryLabel ?? "전화 문의", href: p.ctaBarSecondaryHref }
      : undefined,

    faqItems:        faqFromExtractions.length ? faqFromExtractions : undefined,

    finalCta,

    clinicInfo: {
      name:    "TATOA Clinic",
      phone:   p.phoneUrl?.replace("tel:", "") || undefined,
    },
  }
}
