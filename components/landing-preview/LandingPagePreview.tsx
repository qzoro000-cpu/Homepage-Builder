"use client"

import { useMemo, useRef, useLayoutEffect, useState } from "react"
import type { TreatmentProfile, TreatmentData, TreatmentAsset } from "@/lib/treatment-store"
import { buildLandingPreviewData } from "@/lib/landing-data-adapter"
import { LPHeroSection } from "./HeroSection"
import { LPOverviewSection } from "./OverviewSection"
import { LPEffectsSection } from "./EffectsSection"
import { LPAdvantagesSection } from "./AdvantagesSection"
import { LPPrecautionsSection } from "./PrecautionsSection"
import { LPWhyTatoaSection } from "./WhyTatoaSection"
import { LPPricingSection } from "./PricingSection"
import { LPFaqSection } from "./FaqSection"
import { LPFinalCtaSection } from "./FinalCtaSection"
import { CartProvider } from "@/lib/cart-store"
import { CartPopup } from "./CartPopup"

type Props = {
  profile: TreatmentProfile
  data: TreatmentData
  assets: TreatmentAsset[]
  /** Highlight one section (scroll + ring).  "hero" | "overview" | "effects" | "advantages" | "precautions" | "why-tatoa" | "pricing" | "faq" | "cta" */
  focusSection?: string | null
  /**
   * 테마 오버라이드.
   * 미지정 시 lpData.theme 값(기본 "light") 사용.
   * CMS에서 테마 전환 버튼으로 제어 가능.
   */
  theme?: "light" | "dark"
}

export function LandingPagePreview({ profile, data, assets, focusSection, theme }: Props) {
  return (
    <CartProvider>
      <LandingPagePreviewInner profile={profile} data={data} assets={assets} focusSection={focusSection} theme={theme} />
    </CartProvider>
  )
}

function LandingPagePreviewInner({ profile, data, assets, focusSection, theme }: Props) {
  const lpData = useMemo(
    () => buildLandingPreviewData(profile, data, assets),
    [profile, data, assets],
  )

  // theme prop이 있으면 우선 적용, 없으면 lpData.theme(기본 "light") 사용
  const activeTheme = theme ?? lpData.theme ?? "light"

  const NAV_H    = 52   // px — fixed top nav height
  const CTATRAY_H = 0   // px — CTA tray removed

  // ── Desktop left-column proportional scaling ───────────────────────────────
  const BASE_WIDTH = 375                      // mobile viewport reference width (iPhone 6~13 CSS viewport)
  const leftColRef = useRef<HTMLDivElement>(null)
  const [leftScale, setLeftScale] = useState(() => {
    if (typeof window === "undefined") return 1.1
    return (window.innerWidth * 0.352) / BASE_WIDTH
  })

  useLayoutEffect(() => {
    const el = leftColRef.current
    if (!el) return
    const update = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setLeftScale(w / BASE_WIDTH)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Desktop right-column proportional scaling ──────────────────────────────
  const RIGHT_BASE_WIDTH = 380                // pricing sidebar reference width
  const rightColRef = useRef<HTMLDivElement>(null)
  // 초기값: window 너비로 추정 (SSR fallback 1.0) → hydration 깜빡임 방지
  const [rightScale, setRightScale] = useState(() => {
    if (typeof window === "undefined") return 1.0
    return (window.innerWidth * 0.348) / RIGHT_BASE_WIDTH
  })

  // useLayoutEffect: 브라우저 페인트 전 동기 실행 → 첫 프레임부터 올바른 scale 적용
  useLayoutEffect(() => {
    const el = rightColRef.current
    if (!el) return
    const update = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setRightScale(w / RIGHT_BASE_WIDTH)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    /* .lp scopes all CSS variable overrides so the landing styles
       never bleed into the CMS's own Tailwind theme */
    <div className="lp w-full" data-theme={activeTheme}>

      {/* ── Fixed Top Navigation ───────────────────────────────────────────────
          • position: fixed → iframe 뷰포트 기준 고정 (iframe 내부에서만 동작)
          • 반투명 블랙 + backdrop-blur → 스크롤 시 콘텐츠가 아래로 비쳐 보임
          • 브랜드명 좌측 / 전화번호 우측(있을 때만)
      ───────────────────────────────────────────────────────────────────────── */}
      <header
        style={{
          position:           "fixed",
          top:                0,
          left:               0,
          right:              0,
          zIndex:             100,
          height:             NAV_H,
          display:            "flex",
          alignItems:         "center",
          justifyContent:     "space-between",
          paddingLeft:        20,
          paddingRight:       20,
          background:         "rgba(8, 8, 8, 0.72)",
          backdropFilter:     "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom:       "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* 브랜드 로고 / 클리닉명 */}
        <span
          style={{
            color:          "rgba(255,255,255,0.94)",
            fontSize:       12,
            fontWeight:     600,
            letterSpacing:  "0.34em",
            textTransform:  "uppercase",
          }}
        >
          {lpData.clinicInfo?.name ?? "TATOA"}
        </span>

        {/* 전화 문의 (phoneUrl 있을 때만) */}
        {lpData.clinicInfo?.phone && (
          <a
            href={`tel:${lpData.clinicInfo.phone}`}
            style={{
              display:        "flex",
              alignItems:     "center",
              gap:            6,
              color:          "rgba(255,255,255,0.60)",
              fontSize:       11,
              textDecoration: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {lpData.clinicInfo.phone}
          </a>
        )}
      </header>

      {/* Content wrapper */}
      <div
        className="w-full overflow-hidden"
        style={{
          fontFamily:    "inherit",
          paddingTop:    NAV_H,
          paddingBottom: CTATRAY_H,
        }}
      >

        {/* ── Mobile layout (< lg) ──────────────────────────────────────────── */}
        <div className="lg:hidden">
          <SectionWrapper id="hero" focus={focusSection === "A" || focusSection === "hero"}>
            <LPHeroSection
              treatmentName={lpData.treatmentName}
              heroImage={lpData.heroImage}
              heroBadge={lpData.heroBadge}
            />
          </SectionWrapper>

          <SectionWrapper id="pricing" focus={focusSection === "F" || focusSection === "pricing"}>
            <LPPricingSection
              pricingPrograms={lpData.pricingPrograms}
              pricingNote={lpData.pricingNote}
              ctaPrimary={lpData.ctaPrimary}
              pricingEyebrow={lpData.pricingEyebrow}
              pricingHeadline={lpData.pricingHeadline}
              pricingEnName={lpData.pricingEnName}
              pricingBody={lpData.pricingBody}
              pricingTheme={lpData.pricingTheme}
              pricingBoxPreset={lpData.pricingBoxPreset}
              pricingCardCustom={lpData.pricingCardCustom}
              treatmentName={lpData.treatmentName}
              category={lpData.category}
              heroImage={lpData.heroImage}
            />
          </SectionWrapper>

          <SectionWrapper id="overview" focus={focusSection === "B" || focusSection === "overview"}>
            <LPOverviewSection
              overviewTitle={lpData.overviewTitle}
              overviewBody={lpData.overviewBody}
              overviewImage={lpData.overviewImage}
              overviewImgCfg={lpData.overviewImgCfg}
              overviewImagesData={lpData.overviewImagesData}
              overviewTheme={lpData.overviewTheme}
              overviewBgImage={lpData.overviewBgImage}
              overviewBgImageCfg={lpData.overviewBgImageCfg}
              keyPoints={lpData.keyPoints}
            />
          </SectionWrapper>

          <SectionWrapper id="effects" focus={focusSection === "C" || focusSection === "effects"}>
            <LPEffectsSection
              effects={lpData.effects}
              effectItems={lpData.effectItems}
              effectsEyebrow={lpData.effectsEyebrow}
              effectsHeadline={lpData.effectsHeadline}
              effectsDescription={lpData.effectsDescription}
              effectsTitleColor={lpData.effectsTitleColor}
              effectsTitleFontSize={lpData.effectsTitleFontSize}
              effectsTitleFontFamily={lpData.effectsTitleFontFamily}
              effectsTheme={lpData.effectsTheme}
              effectsBoxPreset={lpData.effectsBoxPreset}
              effectsBoxCustom={lpData.effectsBoxCustom}
              effectsImage={lpData.effectsImage}
              effectsImagesData={lpData.effectsImagesData}
              effectsBgImage={lpData.effectsBgImage}
              effectsBgImageCfg={lpData.effectsBgImageCfg}
            />
          </SectionWrapper>

          <SectionWrapper id="advantages" focus={focusSection === "D" || focusSection === "advantages"}>
            <LPAdvantagesSection
              advantages={lpData.advantages}
              advantagesTitle={lpData.advantagesTitle}
              advantagesBody={lpData.advantagesBody}
              advantagesTheme={lpData.advantagesTheme}
              advantagesBoxPreset={lpData.advantagesBoxPreset}
              advantagesCardCustom={lpData.advantagesCardCustom}
              advantagesImagesData={lpData.advantagesImagesData}
              advantagesBgImage={lpData.advantagesBgImage}
              advantagesBgImageCfg={lpData.advantagesBgImageCfg}
            />
          </SectionWrapper>

          <SectionWrapper id="precautions" focus={focusSection === "precautions"}>
            <LPPrecautionsSection
              precautionsBefore={lpData.precautionsBefore}
              precautionsAfter={lpData.precautionsAfter}
              contraindications={lpData.contraindications}
              precautionsNotes={lpData.precautionsNotes}
              precautionsTitle={lpData.precautionsTitle}
              precautionsBody={lpData.precautionsBody}
              precautionsTheme={lpData.precautionsTheme}
              precautionsBoxPreset={lpData.precautionsBoxPreset}
              precautionsCardCustom={lpData.precautionsCardCustom}
              precautionsCardTitles={lpData.precautionsCardTitles}
              precautionsImagesData={lpData.precautionsImagesData}
              precautionsBgImage={lpData.precautionsBgImage}
              precautionsBgImageCfg={lpData.precautionsBgImageCfg}
            />
          </SectionWrapper>

          <SectionWrapper id="why-tatoa" focus={focusSection === "E" || focusSection === "why-tatoa"}>
            <LPWhyTatoaSection
              tatoaReasons={lpData.tatoaReasons}
              whyTatoaEyebrow={lpData.whyTatoaEyebrow}
              whyTatoaHeadline={lpData.whyTatoaHeadline}
              whyTatoaSummary={lpData.whyTatoaSummary}
              whyTatoaTheme={lpData.whyTatoaTheme}
              whyTatoaBoxPreset={lpData.whyTatoaBoxPreset}
              whyTatoaCardCustom={lpData.whyTatoaCardCustom}
              whyTatoaImage={lpData.whyTatoaImage}
              whyTatoaImagesData={lpData.whyTatoaImagesData}
              whyTatoaBgImage={lpData.whyTatoaBgImage}
              whyTatoaBgImageCfg={lpData.whyTatoaBgImageCfg}
            />
          </SectionWrapper>

          <SectionWrapper id="faq" focus={focusSection === "faq"}>
            <LPFaqSection
              faqItems={lpData.faqItems}
              faqImagesData={lpData.faqImagesData}
              faqBgImage={lpData.faqBgImage}
              faqBgImageCfg={lpData.faqBgImageCfg}
            />
          </SectionWrapper>

          <SectionWrapper id="cta" focus={focusSection === "cta"}>
            <LPFinalCtaSection
              finalCta={lpData.finalCta}
              clinicInfo={lpData.clinicInfo}
            />
          </SectionWrapper>
        </div>

        {/* ── Desktop two-column layout (≥ lg) ─────────────────────────────────
            • 좌우 15% 여백
            • 좌측: 히어로 + 나머지 섹션 (스크롤)
            • 우측: 프로그램 & 가격 (sticky, 헤더 고정 + 카드 내부 스크롤)
        ──────────────────────────────────────────────────────────────────────── */}
        {/* Inject CSS that forces mobile-layout inside .lp-mobile-col:
            — resets lg:/sm:/md: responsive overrides so sections look
              identical to the mobile view regardless of viewport width */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* sm breakpoint overrides */
          @media (min-width:640px){
            .lp-mobile-col [class~="sm:text-5xl"]{font-size:2.25rem;line-height:2.5rem}
            .lp-mobile-col [class~="sm:text-4xl"]{font-size:2.25rem;line-height:2.5rem}
            .lp-mobile-col [class~="sm:text-2xl"]{font-size:1.125rem;line-height:1.75rem}
            .lp-mobile-col [class~="sm:text-lg"]{font-size:1rem;line-height:1.75rem}
            .lp-mobile-col [class~="sm:text-sm"]{font-size:0.875rem;line-height:1.25rem}
            .lp-mobile-col [class~="sm:text-base"]{font-size:1rem;line-height:1.5rem}
            .lp-mobile-col [class~="sm:grid-cols-2"]{grid-template-columns:repeat(1,minmax(0,1fr))}
            .lp-mobile-col [class~="sm:grid-cols-3"]{grid-template-columns:repeat(1,minmax(0,1fr))}
            .lp-mobile-col [class~="sm:flex-row"]{flex-direction:column}
            .lp-mobile-col [class~="sm:py-28"]{padding-top:5rem;padding-bottom:5rem}
            .lp-mobile-col [class~="sm:py-32"]{padding-top:5rem;padding-bottom:5rem}
            .lp-mobile-col [class~="sm:px-8"]{padding-left:1.25rem;padding-right:1.25rem}
            .lp-mobile-col [class~="sm:p-8"]{padding:1rem}
            .lp-mobile-col [class~="sm:p-10"]{padding:1.25rem}
            .lp-mobile-col [class~="sm:p-12"]{padding:1.25rem}
            .lp-mobile-col [class~="sm:mb-16"]{margin-bottom:3rem}
            .lp-mobile-col [class~="sm:mb-20"]{margin-bottom:3rem}
            .lp-mobile-col [class~="sm:gap-4"]{gap:1rem}
          }
          /* md breakpoint overrides */
          @media (min-width:768px){
            .lp-mobile-col [class~="md:grid-cols-3"]{grid-template-columns:repeat(1,minmax(0,1fr))}
            .lp-mobile-col [class~="md:grid-cols-2"]{grid-template-columns:repeat(1,minmax(0,1fr))}
          }
          /* lg breakpoint overrides */
          @media (min-width:1024px){
            .lp-mobile-col [class*="lg:grid-cols-"]{grid-template-columns:repeat(1,minmax(0,1fr))}
            .lp-mobile-col [class*="lg:col-span-"]{grid-column:1/-1}
            .lp-mobile-col [class~="lg:text-6xl"]{font-size:2.25rem;line-height:2.5rem}
            .lp-mobile-col [class~="lg:text-5xl"]{font-size:1.875rem;line-height:2.25rem}
            .lp-mobile-col [class~="lg:py-36"]{padding-top:5rem;padding-bottom:5rem}
            .lp-mobile-col [class~="lg:py-40"]{padding-top:5rem;padding-bottom:5rem}
            .lp-mobile-col [class~="lg:px-8"]{padding-left:1.25rem;padding-right:1.25rem}
            .lp-mobile-col [class~="lg:gap-16"]{gap:3rem}
            .lp-mobile-col [class~="lg:gap-10"]{gap:2.5rem}
            .lp-mobile-col [class~="lg:gap-6"]{gap:1.5rem}
            .lp-mobile-col [class~="lg:gap-4"]{gap:1rem}
            .lp-mobile-col [class~="lg:mb-20"]{margin-bottom:3rem}
            .lp-mobile-col [class~="lg:mb-16"]{margin-bottom:3rem}
            .lp-mobile-col [class~="lg:items-end"]{align-items:stretch}
            .lp-mobile-col [class~="lg:items-center"]{align-items:stretch}
            .lp-mobile-col [class~="lg:text-left"]{text-align:inherit}
            .lp-mobile-col [class~="lg:justify-start"]{justify-content:center}
            .lp-mobile-col [class~="lg:flex-row"]{flex-direction:column}
            .lp-mobile-col [class~="lg:order-1"]{order:0}
            .lp-mobile-col [class~="lg:order-2"]{order:0}
            .lp-mobile-col [class~="lg:pt-0"]{padding-top:inherit}
            .lp-mobile-col [class~="lg:pb-0"]{padding-bottom:inherit}
            .lp-mobile-col [class~="lg:pb-20"]{padding-bottom:5rem}
            .lp-mobile-col [class~="lg:pb-24"]{padding-bottom:5rem}
            .lp-mobile-col [class~="lg:pt-20"]{padding-top:5rem}
          }
          /* 스크롤바 숨김 — 좌측 컬럼 & 우측 사이드바 카드 영역 */
          .lp-hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .lp-hide-scrollbar::-webkit-scrollbar { display: none; }
        ` }} />

        {/*
          Desktop two-column layout — independent scroll panes
          [white gutter 15%] [left col 390px] [right col flex:1] [white gutter 15%]

          The outer wrapper sticks to the viewport (below nav, above CTA tray).
          Both left & right columns scroll independently within that fixed frame.
          Left col is pinned to exactly 390px — identical to mobile viewport width.
          Side gutters are pure white (#fff).
        */}
        <div
          className="hidden lg:flex"
          style={{
            position:   "sticky",
            top:        NAV_H,
            height:     `calc(100vh - ${NAV_H}px - ${CTATRAY_H}px)`,
            background: "#fff",
            zIndex:     10,
          }}
        >
          {/* Pure-white left gutter */}
          <div style={{ flex: "0 0 15%", background: "#fff" }} />

          {/*
            Left column — two-layer approach:
            · Outer (layout): flex 0 0 42% of the viewport → measures actual width via ResizeObserver
            · Inner (content): always renders at BASE_WIDTH (390px) → identical text wrapping to mobile
              then scaled up proportionally so it visually fills the outer box
            → text reflow matches mobile exactly; design scales proportionally as window grows
          */}
          <div
            ref={leftColRef}
            style={{
              flex:        "0 0 35.2%",
              height:      "100%",
              overflow:    "hidden",
              background:  "#fff",
              borderRight: "1px solid rgba(0,0,0,0.22)",
            }}
          >
            <div
              className="lp-mobile-col lp-hide-scrollbar"
              style={{
                width:           BASE_WIDTH,
                height:          `${((1 / leftScale) * 100).toFixed(4)}%`,
                overflowY:       "auto",
                overflowX:       "hidden",
                transform:       `scale(${leftScale.toFixed(4)})`,
                transformOrigin: "top left",
              }}
            >
            {/* 상단 여백 — 네비바 아래 숨 고르기 공간 */}
            <div style={{ height: 28 }} />

            <SectionWrapper id="hero-d" focus={focusSection === "A" || focusSection === "hero"}>
              <LPHeroSection
                treatmentName={lpData.treatmentName}
                heroImage={lpData.heroImage}
                heroBadge={lpData.heroBadge}
              />
            </SectionWrapper>

            <SectionWrapper id="overview-d" focus={focusSection === "B" || focusSection === "overview"}>
              <LPOverviewSection
                overviewTitle={lpData.overviewTitle}
                overviewBody={lpData.overviewBody}
                overviewImage={lpData.overviewImage}
                overviewImgCfg={lpData.overviewImgCfg}
                overviewImagesData={lpData.overviewImagesData}
                overviewTheme={lpData.overviewTheme}
                overviewBgImage={lpData.overviewBgImage}
                overviewBgImageCfg={lpData.overviewBgImageCfg}
                keyPoints={lpData.keyPoints}
              />
            </SectionWrapper>

            <SectionWrapper id="effects-d" focus={focusSection === "C" || focusSection === "effects"}>
              <LPEffectsSection
                effects={lpData.effects}
                effectItems={lpData.effectItems}
                effectsEyebrow={lpData.effectsEyebrow}
                effectsHeadline={lpData.effectsHeadline}
                effectsDescription={lpData.effectsDescription}
                effectsTitleColor={lpData.effectsTitleColor}
                effectsTitleFontSize={lpData.effectsTitleFontSize}
                effectsTitleFontFamily={lpData.effectsTitleFontFamily}
                effectsTheme={lpData.effectsTheme}
                effectsBoxPreset={lpData.effectsBoxPreset}
                effectsBoxCustom={lpData.effectsBoxCustom}
                effectsImage={lpData.effectsImage}
                effectsImagesData={lpData.effectsImagesData}
                effectsBgImage={lpData.effectsBgImage}
                effectsBgImageCfg={lpData.effectsBgImageCfg}
              />
            </SectionWrapper>

            <SectionWrapper id="advantages-d" focus={focusSection === "D" || focusSection === "advantages"}>
              <LPAdvantagesSection
                advantages={lpData.advantages}
                advantagesTitle={lpData.advantagesTitle}
                advantagesBody={lpData.advantagesBody}
                advantagesTheme={lpData.advantagesTheme}
                advantagesBoxPreset={lpData.advantagesBoxPreset}
                advantagesCardCustom={lpData.advantagesCardCustom}
                advantagesImagesData={lpData.advantagesImagesData}
                advantagesBgImage={lpData.advantagesBgImage}
                advantagesBgImageCfg={lpData.advantagesBgImageCfg}
              />
            </SectionWrapper>

            <SectionWrapper id="precautions-d" focus={focusSection === "precautions"}>
              <LPPrecautionsSection
                precautionsBefore={lpData.precautionsBefore}
                precautionsAfter={lpData.precautionsAfter}
                contraindications={lpData.contraindications}
                precautionsNotes={lpData.precautionsNotes}
                precautionsTitle={lpData.precautionsTitle}
                precautionsBody={lpData.precautionsBody}
                precautionsTheme={lpData.precautionsTheme}
                precautionsBoxPreset={lpData.precautionsBoxPreset}
                precautionsCardCustom={lpData.precautionsCardCustom}
                precautionsCardTitles={lpData.precautionsCardTitles}
                precautionsImagesData={lpData.precautionsImagesData}
                precautionsBgImage={lpData.precautionsBgImage}
                precautionsBgImageCfg={lpData.precautionsBgImageCfg}
              />
            </SectionWrapper>

            <SectionWrapper id="why-tatoa-d" focus={focusSection === "E" || focusSection === "why-tatoa"}>
              <LPWhyTatoaSection
                tatoaReasons={lpData.tatoaReasons}
                whyTatoaEyebrow={lpData.whyTatoaEyebrow}
                whyTatoaHeadline={lpData.whyTatoaHeadline}
                whyTatoaSummary={lpData.whyTatoaSummary}
                whyTatoaTheme={lpData.whyTatoaTheme}
                whyTatoaBoxPreset={lpData.whyTatoaBoxPreset}
                whyTatoaCardCustom={lpData.whyTatoaCardCustom}
                whyTatoaImage={lpData.whyTatoaImage}
                whyTatoaImagesData={lpData.whyTatoaImagesData}
                whyTatoaBgImage={lpData.whyTatoaBgImage}
                whyTatoaBgImageCfg={lpData.whyTatoaBgImageCfg}
              />
            </SectionWrapper>

            <SectionWrapper id="faq-d" focus={focusSection === "faq"}>
              <LPFaqSection
                faqItems={lpData.faqItems}
                faqImagesData={lpData.faqImagesData}
                faqBgImage={lpData.faqBgImage}
                faqBgImageCfg={lpData.faqBgImageCfg}
              />
            </SectionWrapper>

            <SectionWrapper id="cta-d" focus={focusSection === "cta"}>
              <LPFinalCtaSection
                finalCta={lpData.finalCta}
                clinicInfo={lpData.clinicInfo}
              />
            </SectionWrapper>
            </div>{/* end inner scroll div */}
          </div>{/* end outer layout div */}

          {/* Right column — flex 0 0 36%, proportionally scaled pricing sidebar */}
          <div
            ref={rightColRef}
            style={{
              flex:       "0 0 34.8%",
              height:     "100%",
              overflow:   "hidden",
              borderLeft: "none",
            }}
          >
            {/* Inner scaler — renders at RIGHT_BASE_WIDTH then scaled to fill outer */}
            <div
              style={{
                width:           RIGHT_BASE_WIDTH,
                height:          `${((1 / rightScale) * 100).toFixed(4)}%`,
                transform:       `scale(${rightScale.toFixed(4)})`,
                transformOrigin: "top left",
              }}
            >
              <LPPricingSection
                pricingPrograms={lpData.pricingPrograms}
                pricingNote={lpData.pricingNote}
                ctaPrimary={lpData.ctaPrimary}
                pricingEyebrow={lpData.pricingEyebrow}
                pricingHeadline={lpData.pricingHeadline}
                pricingEnName={lpData.pricingEnName}
                pricingBody={lpData.pricingBody}
                pricingTheme={lpData.pricingTheme}
                pricingBoxPreset={lpData.pricingBoxPreset}
                pricingCardCustom={lpData.pricingCardCustom}
                treatmentName={lpData.treatmentName}
                category={lpData.category}
                heroImage={lpData.heroImage}
                desktopLayout="sidebar"
              />
            </div>
          </div>

          {/* Pure-white right gutter */}
          <div style={{ flex: "0 0 15%", background: "#fff" }} />
        </div>

      </div>


      {/* ── Cart Popup — 시술 담기 후 하단에 슬라이드 업 ── */}
      <CartPopup />

    </div>
  )
}

/**
 * Thin wrapper that adds a focus ring + auto-scroll when a section is active.
 * The ring uses an outline instead of border so it doesn't affect layout.
 */
function SectionWrapper({
  id,
  focus,
  children,
}: {
  id: string
  focus: boolean
  children: React.ReactNode
}) {
  return (
    <div
      id={`lp-section-${id}`}
      className="relative transition-all duration-300"
      style={
        focus
          ? {
              outline: "2px solid rgba(201,168,92,0.70)",
              outlineOffset: "-2px",
              zIndex: 1,
            }
          : undefined
      }
      ref={(el) => {
        if (el && focus) {
          // Scroll the section into view within the preview panel
          el.scrollIntoView({ block: "start", behavior: "smooth" })
        }
      }}
    >
      {children}
    </div>
  )
}
