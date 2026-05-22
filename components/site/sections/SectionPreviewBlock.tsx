"use client"

import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react"
import {
  MessageCircle, Building2, MapPin, Search, X, ChevronLeft, ChevronRight, Sparkles,
  Layers, Star, Syringe, Zap, Sun, Heart, Leaf, Droplets, Activity,
  BookOpen, Youtube, Instagram, MessageSquare,
  Facebook, Twitter, Linkedin, Music, Globe,
} from "lucide-react"
import { useStaff } from "@/lib/staff-store"
import { useEquipment } from "@/lib/equipment-store"
import { useTreatment } from "@/lib/treatment-store"
import { type SiteDoctorCard, type FooterSocialExtra } from "@/lib/branch-website-store"

export type SiteDoctorCardFull = SiteDoctorCard & {
  specialties?: string[]
  homepageQuote?: string
  consultUrl?: string
  careers?: Array<{ id: string; organization: string; roleOrDescription: string; sortOrder: number }>
  academics?: Array<{ id: string; name: string; sortOrder: number }>
  strengths?: string[]
}
import {
  type FieldValue,
  type HomeSectionId,
  type HeroImgCfg,
  type EventCard,
  type PhiloImage,
  type DoctorItem,
  type EquipItem,
  type StrengthStat,
  type S1MapImg,
  type BranchCard,
  type GalleryImage,
  type TreatmentPreviewItem,
  type TreatmentCategory,
  type HoursLine,
  FONTS, BLOCK_SIZES, IMG_EFFECTS, HERO_HEIGHT_PAGE,
  getSizePx, getFontCss, hexToRgb,
  parseHeroImgCfg, buildHeroImgFilter,
  parseEventCards, parsePhiloImages, buildPhiloImgFilter, buildPhiloGradient, buildPhiloShadow,
  parseBranchCards, buildCardFilter, parseGalleryImages,
  parseSStats, parseS1MapImages, buildS1ImgFilter, buildS1Gradient, buildS1Shadow,
  resolveStatCardStyle, DEFAULT_S1_STATS, DEFAULT_S2_STATS,
  parseTreatmentCats, DEFAULT_TREATMENT_CATS, TREATMENT_ICON_OPTIONS,
  resolveCardStyle, resolveInfoBoxStyle, resolveHoursColor,
  sectionBgStyle, LIGHT_GRAIN_URL, INFO_FONT_MAP, INFO_SIZE_MAP, DOCTOR_SIZE_MAP,
  parseHoursLines, normalizeMapUrl,
  TatoaNavOverlay, EventTiltCard, EventPagination,
  DoctorTiltCard, EquipmentTiltCard,
  S2StatCard, RevealBox, TreatmentCatIcon,
  renderTextWithLineBreaks,
} from "./shared"

// ─── Event-only size map (xs=11px … xl=24px) ─────────────────────────────────
const EV_SIZE_MAP: Record<string, string> = {
  xs: "11px", sm: "14px", md: "17px", lg: "20px", xl: "24px", "2xl": "28px",
}

// ─── Philosophy-only size map (xs=11px … xl=27px) ────────────────────────────
const PHILOSOPHY_SIZE_MAP: Record<string, number> = {
  xs: 11, sm: 15, md: 19, lg: 23, xl: 27, "2xl": 31,
}

function stripHtml(s: string | undefined | null): string {
  if (!s) return ""
  return s
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)\s*>/gi, "\n")
    .replace(/<(p|div|h[1-6]|li)[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim()
}

// ─── SectionImagesContext ────────────────────────────────────────────────────

const SectionImagesContext = React.createContext<Record<string, string>>({})

// ─── PreviewHero ──────────────────────────────────────────────────────────────

function PreviewHero({
  v, branchName, isFullscreen, device = "mobile", isPageView = false, pageHeroHeight,
}: {
  v: Record<string, FieldValue>; branchName: string; isFullscreen: boolean; device?: "mobile" | "desktop"; isPageView?: boolean; pageHeroHeight?: string | number
}) {
  const [ctaHovered, setCtaHovered] = useState(false)
  const bgVideo = device === "desktop"
    ? ((v.bgVideoPc as string) || "")
    : ((v.bgVideoMobile as string) || "")
  const bgImage = device === "desktop"
    ? ((v.bgImagePc as string) || "")
    : ((v.bgImageMobile as string) || "")
  const imgCfg       = parseHeroImgCfg(device === "desktop" ? v.heroPcImgCfg : v.heroMobileImgCfg)
  const heroImgFilter = buildHeroImgFilter(imgCfg)
  const heroGrad = (() => {
    if (!imgCfg.gradOpacity) return ""
    const rgba = "rgba(" + hexToRgb(imgCfg.gradColor || "#000000") + "," + (imgCfg.gradOpacity / 100).toFixed(2) + ")"
    if (imgCfg.gradDir === "radial")      return "radial-gradient(ellipse at center, " + rgba + " 0%, transparent 70%)"
    if (imgCfg.gradDir === "radial-edge") return "radial-gradient(ellipse at center, transparent 30%, " + rgba + " 100%)"
    return "linear-gradient(" + (imgCfg.gradDir || "to bottom") + ", transparent 0%, " + rgba + " 100%)"
  })()
  const heroShadow = (() => {
    const rgb = hexToRgb(imgCfg.shadowColor || "#000000")
    switch (imgCfg.shadowPreset) {
      case "sm":   return "0 2px 10px rgba(" + rgb + ",0.25)"
      case "md":   return "0 4px 20px rgba(" + rgb + ",0.38), 0 2px 8px rgba(" + rgb + ",0.18)"
      case "lg":   return "0 8px 36px rgba(" + rgb + ",0.48), 0 4px 14px rgba(" + rgb + ",0.24)"
      case "xl":   return "0 16px 56px rgba(" + rgb + ",0.56), 0 8px 24px rgba(" + rgb + ",0.3)"
      case "glow": return "0 0 28px rgba(" + rgb + ",0.65), 0 0 10px rgba(" + rgb + ",0.45)"
      default:     return ""
    }
  })()
  const overlayOp    = ((v.overlayOpacity as number) ?? 50) / 100
  const textAlignH   = (v.textAlignH as string) || "left"
  const textPositionV = (v.textPositionV as string) || "center"

  const b1Visible = (v.block1Visible as boolean) ?? true
  const b2Visible = (v.block2Visible as boolean) ?? true
  const b3Visible = (v.block3Visible as boolean) ?? true
  const ctaVisible = (v.ctaVisible as boolean) ?? true

  const b1Text = (v.block1Text as string) || ""
  const b2Text = (v.block2Text as string) || (isFullscreen ? branchName + "\n히어로 카피를 입력하세요" : branchName)
  const b3Text = (v.block3Text as string) || ""
  const ctaLabel = (v.ctaLabel as string) || "지금 상담 예약하기"

  const vAlign = textPositionV === "top" ? "flex-start" : textPositionV === "bottom" ? "flex-end" : "center"
  const hAlignCSS = textAlignH === "center" ? "center" : textAlignH === "right" ? "flex-end" : "flex-start"
  const textAlign = textAlignH as "left" | "center" | "right"

  const heroHeight = isFullscreen ? "100%" : isPageView ? (pageHeroHeight ?? "100dvh") : 160

  return (
    <div
      className="relative overflow-hidden shrink-0"
      style={{ height: heroHeight, minHeight: isFullscreen ? 0 : 160, boxShadow: heroShadow || undefined }}
    >
      {bgVideo ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={bgVideo} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : bgImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bgImage} alt="hero bg" className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: heroImgFilter || undefined, objectPosition: imgCfg.position || "center" }} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-800 via-neutral-700 to-neutral-900" />
      )}
      {heroGrad && <div className="absolute inset-0 pointer-events-none" style={{ background: heroGrad }} />}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0," + overlayOp + ")" }} />
      <TatoaNavOverlay />

      <div
        className="absolute inset-0 flex flex-col p-4"
        style={{ justifyContent: vAlign, alignItems: hAlignCSS, paddingTop: "10%", paddingBottom: "10%", paddingLeft: device === "desktop" ? "15%" : undefined, paddingRight: device === "desktop" ? "15%" : undefined }}
      >
        <div style={{ textAlign, maxWidth: "100%" }} className="space-y-1.5">
          {b1Visible && b1Text && (
            <p style={{
              fontFamily: getFontCss((v.block1Font as string) || "sans"),
              fontSize: getSizePx("eyebrow", (v.block1Size as string) || "sm") * 1.5 * (device === "desktop" ? 1.5 : 1),
              fontWeight: Number((v.block1Weight as string) || "400"),
              color: (v.block1Color as string) || "#ffffff",
              letterSpacing: "0.15em",
              lineHeight: 1.3,
            }}>
              {b1Text}
            </p>
          )}
          {b2Visible && (
            <p style={{
              fontFamily: getFontCss((v.block2Font as string) || "sans"),
              fontSize: getSizePx("headline", (v.block2Size as string) || "lg") * 1.5 * (device === "desktop" ? 1.5 : 1),
              fontWeight: Number((v.block2Weight as string) || "700"),
              color: (v.block2Color as string) || "#ffffff",
              lineHeight: 1.35,
              whiteSpace: "pre-line",
            }}>
              {b2Text || (isFullscreen ? "메인 카피를 입력하세요" : "")}
            </p>
          )}
          {b3Visible && b3Text && (
            <p style={{
              fontFamily: getFontCss((v.block3Font as string) || "sans"),
              fontSize: getSizePx("subcopy", (v.block3Size as string) || "xs") * 1.5 * (device === "desktop" ? 1.5 : 1),
              fontWeight: Number((v.block3Weight as string) || "400"),
              color: (v.block3Color as string) || "rgba(255,255,255,0.65)",
              lineHeight: 1.5,
              whiteSpace: "pre-line",
              marginTop: 4,
            }}>
              {b3Text}
            </p>
          )}
          {ctaVisible && (
            <div style={{ marginTop: 8, display: "flex", justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start", width: "100%" }}>
              <span
                onMouseEnter={() => setCtaHovered(true)}
                onMouseLeave={() => setCtaHovered(false)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  width: "80%",
                  background: (v.ctaBgColor as string) || "rgba(255,255,255,0.95)",
                  color: (v.ctaTextColor as string) || "#1a1a1a",
                  fontSize: 16,
                  fontFamily: getFontCss((v.ctaFont as string) || "sans"),
                  fontWeight: Number((v.ctaWeight as string) || "600"),
                  fontStyle: (v.ctaItalic as boolean) ? "italic" : "normal",
                  padding: "10px 20px",
                  borderRadius: 999,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  transform: ctaHovered ? "translateY(-3px)" : "translateY(0)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: ctaHovered ? "0 6px 18px rgba(0,0,0,0.22)" : "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                <MessageCircle size={14} />
                {ctaLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {isFullscreen && (
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-1 pointer-events-none">
          <div className="flex flex-col items-center gap-0.5 opacity-60">
            <div className="h-px w-8 bg-white/40 rounded-full" />
            <div className="h-px w-4 bg-white/20 rounded-full" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PreviewEvents ────────────────────────────────────────────────────────────

function PreviewEvents({ v, device = "mobile" }: { v: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDark = ((v.evBgColor as string) || "dark") === "dark"
  const gold   = "#c9a85c"
  const isDesktop = device === "desktop"
  const COLS = isDesktop ? 2.5 : 1

  // Measure scroll container → card size = slide × ratio
  const [containerW, setContainerW] = useState(isDesktop ? 1280 : 375)
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => { setContainerW(el.clientWidth) })
    ro.observe(el)
    setContainerW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const CARD_W_RATIO = isDesktop ? 0.905 : 0.95
  const slideW  = containerW / COLS
  const CARD_W  = Math.max(10, Math.floor(slideW * CARD_W_RATIO))
  const CARD_PAD = isDesktop
    ? Math.floor((slideW - CARD_W) / 4)
    : Math.floor((slideW - CARD_W) / 2)
  const CARD_H  = Math.round(CARD_W * 1.25)  // 4:5 aspect ratio

  const dragState = useRef({ dragging: false, startX: 0, scrollLeft: 0 })
  const [isCursorGrab, setIsCursorGrab] = useState(false)

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    dragState.current = { dragging: true, startX: e.clientX, scrollLeft: scrollRef.current.scrollLeft }
    setIsCursorGrab(true)
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current.dragging || !scrollRef.current) return
    e.preventDefault()
    scrollRef.current.scrollLeft = dragState.current.scrollLeft - (e.clientX - dragState.current.startX)
  }
  const onMouseUp = useCallback(() => {
    if (!dragState.current.dragging || !scrollRef.current) return
    dragState.current.dragging = false
    setIsCursorGrab(false)
    const SNAP = scrollRef.current.clientWidth / COLS
    const total = parseEventCards(v.eventCards).length
    const idx = Math.max(0, Math.min(Math.round(scrollRef.current.scrollLeft / SNAP), total - 1))
    setActiveIdx(idx)
    scrollRef.current.scrollTo({ left: idx * SNAP, behavior: "smooth" })
  }, [v.eventCards, COLS])

  const bgStyle = sectionBgStyle(isDark)
  const cards   = parseEventCards(v.eventCards)

  const titleColor  = (v.evTitleColor  as string) || (isDark ? "#f5f0e8" : "#1a1a1a")
  const titleSize   = EV_SIZE_MAP[(v.evTitleSize   as string) || "md"]  || "16px"
  const titleWeight = (v.evTitleWeight as string) || "700"
  const titleFont   = INFO_FONT_MAP[(v.evTitleFont   as string) || "sans"] || INFO_FONT_MAP.sans
  const subColor  = (v.evSubColor  as string) || (isDark ? "rgba(255,255,255,0.55)" : "#666")
  const subSize   = EV_SIZE_MAP[(v.evSubSize   as string) || "xs"]  || "12px"
  const subWeight = (v.evSubWeight as string) || "400"
  const subFont   = INFO_FONT_MAP[(v.evSubFont   as string) || "sans"] || INFO_FONT_MAP.sans

  const scrollTo = (idx: number) => {
    if (!scrollRef.current) return
    setActiveIdx(idx)
    scrollRef.current.scrollTo({ left: idx * (scrollRef.current.clientWidth / COLS), behavior: "smooth" })
  }

  const stColor  = (v.evSectionTitleColor  as string) || (isDark ? "rgba(201,168,92,0.80)" : "#555555")
  const stSize   = EV_SIZE_MAP[(v.evSectionTitleSize   as string) || "xs"] || "12px"
  const stWeight = (v.evSectionTitleWeight as string) || "500"
  const stFont   = INFO_FONT_MAP[(v.evSectionTitleFont   as string) || "serif"] || INFO_FONT_MAP.serif

  const arrowBtn = (side: "left" | "right", onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "absolute",
        [side]: "16px",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 10,
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
        border: "1px solid " + (isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)"),
        color: isDark ? "#f5f0e8" : "#222222",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        backdropFilter: "blur(8px)",
        flexShrink: 0,
      } as React.CSSProperties}
    >
      {side === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  )

  return (
    <div style={{
      ...bgStyle,
      minHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      paddingBottom: "20px",
    }}>
      {/* Section title */}
      <div style={{ height: "76px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <p style={{
          textAlign: "center",
          fontSize: parseFloat(stSize), fontWeight: stWeight, color: stColor, fontFamily: stFont,
          letterSpacing: "0.18em", textTransform: "uppercase", margin: 0,
        }}>
          {(v.evSectionTitle as string) || "— Events —"}
        </p>
      </div>

      {/* Carousel */}
      <div style={{ position: "relative", width: isDesktop ? "65.625%" : "90%", marginLeft: "auto", marginRight: "auto" }}>
        {isDesktop && cards.length > 1 && arrowBtn("left",  () => scrollTo(Math.max(0, activeIdx - 1)))}
        {isDesktop && cards.length > 1 && arrowBtn("right", () => scrollTo(Math.min(cards.length - 1, activeIdx + 1)))}

        <div
          ref={scrollRef}
          onScroll={(e) => {
            if (dragState.current.dragging) return
            const el = e.currentTarget
            setActiveIdx(Math.round(el.scrollLeft / (el.clientWidth / COLS)))
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{
            display: "flex",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            cursor: isCursorGrab ? "grabbing" : "grab",
            userSelect: "none",
          } as React.CSSProperties}
        >
          {cards.map(card => (
            <div key={card.id} style={{
              flex: isDesktop ? "0 0 40%" : "0 0 100%",
              scrollSnapAlign: "start",
              padding: "24px " + CARD_PAD + "px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              perspective: "700px",
              boxSizing: "border-box",
            }}>
              <EventTiltCard card={card} isDark={isDark} cardW={CARD_W} cardH={CARD_H} />
              <div style={{ width: CARD_W + "px", paddingTop: "10px", paddingBottom: "14px", textAlign: "center" }}>
                <p style={{
                  fontSize: parseFloat(titleSize), fontWeight: titleWeight, color: titleColor,
                  fontFamily: titleFont, lineHeight: 1.4, margin: 0, marginBottom: "4px", whiteSpace: "pre-line",
                }}>
                  {stripHtml(card.title) || "이벤트 제목"}
                </p>
                <p style={{
                  fontSize: parseFloat(subSize), fontWeight: subWeight, color: subColor,
                  fontFamily: subFont, lineHeight: 1.55, margin: 0, whiteSpace: "pre-line",
                }}>
                  {stripHtml(card.subtitle) || "이벤트 부제목"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div style={{ paddingTop: "10px", paddingBottom: "6px", flexShrink: 0 }}>
        <EventPagination total={cards.length} active={activeIdx} isDark={isDark} gold={gold} onSelect={scrollTo} />
      </div>
    </div>
  )
}

// ─── PreviewPhilosophy ────────────────────────────────────────────────────────

function PreviewPhilosophy({ v, device = "mobile" }: { v: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const isDesktop = device === "desktop"
  const isDark   = (v.bgTheme as string) !== "light"
  const eyebrow  = (v.eyebrow  as string) || "OUR PHILOSOPHY"
  const headline = (v.headline as string) || "아름다움은 교정이 아닙니다.\n그것은 본연의 가치를\n드러내는 일입니다."
  const body     = (v.body     as string) || "타토아는 모든 얼굴에 아직 들려주지 않은 저마다의 이야기가 담겨 있다고 믿습니다. 정교한 과학과 예술적 심미안을 결합한 타토아만의 접근 방식은, 꾸미지 않은 듯 본연의 자연스러운 아름다움을 완성합니다."
  const images   = parsePhiloImages(v.philoImages, (v.image as string) || "")

  const tc   = isDark ? "#ffffff" : "#111111"
  const tcm  = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)"
  const gold = "#c9a85c"

  const bg = isDark
    ? [
        "radial-gradient(ellipse 90% 55% at 88% 6%,  rgba(201,168,92,0.20) 0%, transparent 52%)",
        "radial-gradient(ellipse 75% 90% at 10% 96%, rgba(201,168,92,0.12) 0%, transparent 52%)",
        "radial-gradient(ellipse 55% 45% at 62% 38%, rgba(28,22,12,0.88) 0%, transparent 65%)",
        "radial-gradient(ellipse 80% 60% at 20% 60%, rgba(18,14,8,0.95) 0%, transparent 70%)",
        "radial-gradient(ellipse 100% 100% at 50% 50%, #0e0b06 0%, #080604 100%)",
      ].join(",")
    : "#ffffff"

  const grain = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E\")"

  const slotBg   = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"
  const slotBd   = isDark ? "1px dashed rgba(255,255,255,0.12)" : "1px dashed rgba(0,0,0,0.12)"
  const slotTxt  = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.25)"

  const mobileImgStyle: React.CSSProperties = { width: "100%", aspectRatio: "4/5", borderRadius: 12, overflow: "hidden", flexShrink: 0, position: "relative" }

  const renderImg = (img: PhiloImage, forDesktop: boolean, wrapStyle: React.CSSProperties, key: string, label: string) => {
    const url    = forDesktop ? (img.pc || img.mobile) : img.mobile
    const shadow = buildPhiloShadow(img)
    const grad   = buildPhiloGradient(img)
    return (
      <div key={key} style={{ ...wrapStyle, boxShadow: shadow !== "none" ? shadow : undefined }}>
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: img.position, display: "block", filter: buildPhiloImgFilter(img) || undefined }} />
            {grad && <div style={{ position: "absolute", inset: 0, background: grad, pointerEvents: "none" }} />}
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: slotBg, border: slotBd, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
            <span style={{ fontSize: 12, opacity: 0.3 }}>🖼</span>
            <span style={{ fontSize: 6.5, color: slotTxt }}>{label}</span>
          </div>
        )}
      </div>
    )
  }

  const emptyMain = (
    <div style={{ ...mobileImgStyle, background: slotBg, border: slotBd, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
      <span style={{ fontSize: 16, opacity: 0.3 }}>🖼</span>
      <span style={{ fontSize: 7, color: slotTxt }}>이미지를 추가해주세요</span>
    </div>
  )

  const textBlock = (
    <div style={{ position: "relative", paddingTop: "36px", paddingBottom: "14px", paddingLeft: "14px", paddingRight: "14px" }}>
      <p style={{ fontFamily: getFontCss((v.eyebrowFont as string) || "sans"), fontSize: PHILOSOPHY_SIZE_MAP[(v.eyebrowSize as string) || "sm"] ?? 15, fontWeight: Number((v.eyebrowWeight as string) || "400"), color: (v.eyebrowColor as string) || gold, letterSpacing: "0.24em", paddingLeft: "0.24em", textTransform: "uppercase" as const, marginBottom: isDesktop ? 20 : 10 }}>{eyebrow}</p>
      <p style={{ fontFamily: getFontCss((v.headlineFont as string) || "sans"), fontSize: PHILOSOPHY_SIZE_MAP[(v.headlineSize as string) || "sm"] ?? 15, fontWeight: Number((v.headlineWeight as string) || "700"), color: (v.headlineColor as string) || tc, lineHeight: 1.38, marginBottom: isDesktop ? 20 : 10, letterSpacing: "-0.01em" }}>{renderTextWithLineBreaks(String(headline ?? ""))}</p>
      <p style={{ fontFamily: getFontCss((v.bodyFont as string) || "sans"), fontSize: PHILOSOPHY_SIZE_MAP[(v.bodySize as string) || "xs"] ?? 11, fontWeight: Number((v.bodyWeight as string) || "400"), color: (v.bodyColor as string) || tcm, lineHeight: 1.65 }}>{renderTextWithLineBreaks(String(body ?? ""))}</p>
    </div>
  )

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: bg }} />
      {isDark && <div style={{ position: "absolute", inset: 0, backgroundImage: grain, backgroundSize: "180px 180px", opacity: 0.055, mixBlendMode: "overlay", pointerEvents: "none" }} />}
      {isDark && <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 80, background: "radial-gradient(ellipse at center,rgba(201,168,92,0.22) 0%,transparent 70%)", filter: "blur(8px)", pointerEvents: "none" }} />}

      {isDesktop ? (
        <div style={{ position: "relative", padding: "0 15%" }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{ width: "55%", flexShrink: 0 }}>
              {textBlock}
            </div>
            <div style={{ width: "45%", flexShrink: 0, padding: "12px 14px 12px 0", display: "flex", flexDirection: "column", gap: 8 }}>
              {images.length === 0
                ? <div style={{ ...mobileImgStyle, maxHeight: 220, background: slotBg, border: slotBd, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 7, color: slotTxt }}>이미지 1</span></div>
                : images.map((img, i) => {
                    const ratio = i === 0 ? "2/3" : "3/2"
                    const style: React.CSSProperties = { width: "100%", aspectRatio: ratio, borderRadius: 10, overflow: "hidden", flexShrink: 0, position: "relative", maxHeight: i === 0 ? undefined : 180 }
                    return renderImg(img, true, style, img.id, "이미지 " + (i + 1))
                  })
              }
            </div>
          </div>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          {textBlock}
          <div style={{ padding: "0 0 14px", display: "flex", flexDirection: "column", gap: 0 }}>
            {images.length === 0
              ? emptyMain
              : images.map((img, i) => {
                  const mobStyle: React.CSSProperties = i === 0 ? { ...mobileImgStyle, aspectRatio: "2/3", borderRadius: 0 } : mobileImgStyle
                  return renderImg(img, false, mobStyle, img.id, "이미지 " + (i + 1))
                })
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PreviewLinked (Doctors / Equipment) ─────────────────────────────────────

function PreviewLinked({ v, type, branchId, device = "mobile", doctors: propDoctors }: { v: Record<string, FieldValue>; type: "doctors" | "equipment"; branchId: string; device?: "mobile" | "desktop"; doctors?: SiteDoctorCardFull[] }) {
  const { getDoctorsByBranch } = useStaff()
  const { getEquipmentByBranch } = useEquipment()

  const title   = (v.title as string) || (type === "doctors" ? "— TATOA DOCTORS —" : "— OUR EQUIPMENT —")
  const showCta = (v.showCta as boolean) ?? true
  const bgColor = (v.bgColor as string) || "dark"
  const gold    = "#c9a85c"
  const isDark  = bgColor === "dark"

  const stColor  = (v.docSectionTitleColor  as string) || (isDark ? "rgba(201,168,92,0.80)" : "#555555")
  const stSize   = (DOCTOR_SIZE_MAP[(v.docSectionTitleSize as string) || "xs"] ?? 11) + "px"
  const stWeight = (v.docSectionTitleWeight as string) || "500"
  const stFont   = INFO_FONT_MAP[(v.docSectionTitleFont  as string) || "serif"] || INFO_FONT_MAP.serif

  const rawDoctors   = getDoctorsByBranch(branchId)
  const rawEquipment = getEquipmentByBranch(branchId)

  const items = type === "doctors"
    ? propDoctors
      ? propDoctors.filter((d) => d.isPublic).map((d) => ({
          id: d.id,
          name: d.name,
          title: d.title || "",
          specialty: (d.specialties && d.specialties[0]) || d.specialty || "",
          specialties: d.specialties ?? [],
          image: d.profileImageUrl || d.image || "",
          isFeatured: d.isFeatured,
          description: d.shortIntro || "",
          shortIntro: d.shortIntro || "",
          homepageQuote: d.homepageQuote || "",
          consultUrl: d.consultUrl,
          careers: (d.careers ?? []).map((c) => ({ id: c.id, organization: c.organization, roleOrDescription: c.roleOrDescription, sortOrder: c.sortOrder })),
          academics: (d.academics ?? []).map((a) => ({ id: a.id, name: a.name, sortOrder: a.sortOrder })),
          strengths: d.strengths ?? [],
        }))
      : rawDoctors.filter((d) => d.profile.isPublic).map((d) => ({
          id: d.profile.id,
          name: d.profile.name,
          title: d.profile.title || "",
          specialty: d.specialties[0] || "",
          specialties: d.specialties,
          image: d.profile.profileImageUrl || "",
          isFeatured: d.profile.isFeatured,
          description: d.profile.shortIntro || "",
          shortIntro: d.profile.shortIntro || "",
          homepageQuote: d.profile.homepageQuote || "",
          consultUrl: d.profile.consultUrl,
          careers: d.careers
            .filter((c) => c.isPublic)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((c) => ({ id: c.id, organization: c.organization, roleOrDescription: c.roleOrDescription, sortOrder: c.sortOrder })),
          academics: d.academics
            .filter((a) => a.isPublic)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((a) => ({ id: a.id, name: a.name, sortOrder: a.sortOrder })),
          strengths: d.strengths,
        }))
    : rawEquipment.filter((e) => e.profile.isPublic).map((e) => ({
        id: e.profile.id,
        name: e.profile.name,
        image: e.assets[0]?.fileUrl || "",
        isFeatured: e.profile.isFeatured,
        description: e.profile.shortDescription || e.profile.oneLinePitch || "",
      }))

  const cols = "1fr"
  const sectionPad = device === "desktop" ? "28px 15% 32px" : "16px 12px 20px"

  return (
    <div style={{
      padding: sectionPad,
      backgroundColor: isDark ? "#0e0c09" : "#ffffff",
      backgroundImage: isDark
        ? [
            "linear-gradient(rgba(201,168,92,0.055) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(201,168,92,0.055) 1px, transparent 1px)",
          ].join(",")
        : "none",
      backgroundSize: isDark ? "22px 22px" : "auto",
      position: "relative",
    }}>
      <div>
        <div style={{ height: 76, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 5 }}>
          <p style={{
            textAlign: "center" as const,
            fontSize: stSize,
            fontWeight: stWeight,
            color: stColor,
            fontFamily: stFont,
            letterSpacing: "0.18em",
            textTransform: "uppercase" as const,
            margin: 0,
          }}>
            {title}
          </p>
        </div>

        {(v.description as string) && (
          <p style={{ fontSize: 7, color: isDark ? "rgba(255,255,255,0.38)" : "#666", textAlign: "center" as const, marginBottom: 30, letterSpacing: "0.04em" }}>
            {v.description as string}
          </p>
        )}

        {items.length === 0 ? (
          <div style={{
            borderRadius: 10, border: "1px dashed " + (isDark ? "rgba(201,168,92,0.2)" : "#ddd"), padding: "16px 0",
            textAlign: "center" as const, background: isDark ? "rgba(201,168,92,0.03)" : "#f9f9f9",
          }}>
            <p style={{ fontSize: 7.5, color: isDark ? "rgba(255,255,255,0.25)" : "#999" }}>
              {type === "doctors" ? "등록된 의료진이 없습니다" : "등록된 장비가 없습니다"}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: cols, gap: 20, alignItems: "stretch" }}>
            {items.slice(0, 6).map((item) =>
              type === "doctors" ? (
                <DoctorTiltCard key={item.id} doctor={item as Parameters<typeof DoctorTiltCard>[0]["doctor"]} showCta={showCta} isDark={isDark} cardValues={v} device={device} />
              ) : (
                <EquipmentTiltCard key={item.id} item={item as Parameters<typeof EquipmentTiltCard>[0]["item"]} isDark={isDark} cardValues={v} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TreatmentCard ────────────────────────────────────────────────────────────

function TreatmentCard({
  treatment, isDark, gold, cardValues,
}: {
  treatment: TreatmentPreviewItem
  isDark: boolean
  gold: string
  cardValues: Record<string, FieldValue>
}) {
  const cs = resolveCardStyle(cardValues, isDark, false)
  const [hovered, setHovered] = useState(false)
  const imgBg = isDark
    ? "linear-gradient(170deg,rgba(201,168,92,0.18) 0%,rgba(20,15,8,0.75) 100%)"
    : "linear-gradient(170deg,rgba(220,210,190,0.55) 0%,rgba(240,235,225,0.9) 100%)"
  const nameColor  = (cardValues.trCardNameColor  as string) || (isDark ? "#f5f0e8" : "#111111")
  const descColor  = (cardValues.trCardDescColor  as string) || (isDark ? "rgba(255,255,255,0.48)" : "#888888")
  const priceColor = (cardValues.trCardPriceColor as string) || (isDark ? gold : "#111111")

  const action  = (cardValues.trCardAction  as string) || "landing"
  const target  = (cardValues.trCardTarget  as string) || "_blank"

  function resolveHref(): string | undefined {
    if (action === "landing")  return treatment.landingPageUrl || "/preview/landing/live/" + treatment.id
    if (action === "booking")  return treatment.bookingUrl  || undefined
    if (action === "kakao")    return treatment.kakaoUrl    || undefined
    return undefined
  }
  const href = resolveHref()
  const isClickable = action !== "none" && !!href

  function handleClick() {
    if (!isClickable || !href) return
    window.open(href, target)
  }

  const liftShadow = isDark
    ? "0 12px 32px rgba(0,0,0,0.65), 0 4px 12px rgba(201,168,92,0.18)"
    : "0 12px 28px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.10)"

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      onClick={handleClick}
      style={{
        borderRadius: cs.radius, border: cs.border, overflow: "hidden",
        background: cs.bg,
        boxShadow: hovered ? liftShadow : cs.shadow,
        transform: hovered ? "translateY(-4px) scale(1.015)" : "translateY(0px) scale(1)",
        transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease",
        willChange: "transform, box-shadow",
        cursor: isClickable ? "pointer" : "default",
        ...(cs.blur > 0 ? { backdropFilter: "blur(" + cs.blur + "px)", WebkitBackdropFilter: "blur(" + cs.blur + "px)" } : {}),
      }}>
      <div style={{ width: "100%", paddingTop: "75%", position: "relative", overflow: "hidden", background: imgBg }}>
        {treatment.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={treatment.image} alt={treatment.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={22} color={isDark ? "rgba(201,168,92,0.40)" : "rgba(180,160,120,0.40)"} />
            </div>
          )
        }
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 36, background: "linear-gradient(to top,rgba(0,0,0,0.52),transparent)", pointerEvents: "none" }} />
        <span style={{
          position: "absolute", top: 6, left: 6, fontSize: 5.5, padding: "2px 5px", borderRadius: 4,
          background: "rgba(0,0,0,0.42)", color: "#fff", fontWeight: 500, backdropFilter: "blur(4px)",
        }}>
          {treatment.category}
        </span>
        {treatment.badge && (
          <span style={{
            position: "absolute", top: 6, right: 6, fontSize: 5.5, padding: "2px 5px", borderRadius: 4,
            background: "rgba(201,168,92,0.90)", color: "#1a1000", fontWeight: 700,
          }}>
            {treatment.badge}
          </span>
        )}
      </div>
      <div style={{ padding: "7px 8px 9px" }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: nameColor, lineHeight: 1.25, marginBottom: 3 }}>
          {treatment.name}
        </p>
        {treatment.description && (
          <p style={{ fontSize: 6.5, color: descColor, lineHeight: 1.4, marginBottom: 5 }}>
            {treatment.description}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: priceColor }}>{treatment.price}</span>
          <span style={{ fontSize: 6, color: isDark ? "rgba(255,255,255,0.28)" : "#bbb" }}>{treatment.duration}</span>
        </div>
      </div>
    </div>
  )
}

// ─── PreviewTreatments ────────────────────────────────────────────────────────

function PreviewTreatments({ v, branchId, device = "mobile" }: { v: Record<string, FieldValue>; branchId: string; device?: "mobile" | "desktop" }) {
  const isDesktop = device === "desktop"
  const isDark   = ((v.trBgColor as string) || "light") === "dark"
  const bgStyle  = sectionBgStyle(isDark)
  const gold     = "#c9a85c"
  const cats     = parseTreatmentCats(v.trCategories)
  const [activeCat, setActiveCat] = useState<string>(cats[0]?.id ?? "")
  const [searchQuery, setSearchQuery] = useState("")
  const catScrollRef = useRef<HTMLDivElement>(null)
  const dragRef      = useRef({ active: false, startX: 0, scrollLeft: 0 })
  const [catScroll,  setCatScroll]  = useState({ atStart: true, atEnd: false })

  const updateScrollState = () => {
    const el = catScrollRef.current
    if (!el) return
    setCatScroll({
      atStart: el.scrollLeft <= 2,
      atEnd:   el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    })
  }

  const scrollCatBy = (delta: number) => {
    catScrollRef.current?.scrollBy({ left: delta, behavior: "smooth" })
  }

  const handleCatWheel = (e: React.WheelEvent) => {
    if (catScrollRef.current) {
      e.preventDefault()
      catScrollRef.current.scrollLeft += e.deltaY + e.deltaX
    }
  }

  const onMouseDown = (e: React.MouseEvent) => {
    const el = catScrollRef.current
    if (!el) return
    dragRef.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    el.style.cursor = "grabbing"
    el.style.userSelect = "none"
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.active) return
    const el = catScrollRef.current
    if (!el) return
    const x    = e.pageX - el.offsetLeft
    const walk = x - dragRef.current.startX
    el.scrollLeft = dragRef.current.scrollLeft - walk
  }
  const onMouseUp = () => {
    dragRef.current.active = false
    if (catScrollRef.current) {
      catScrollRef.current.style.cursor = "grab"
      catScrollRef.current.style.userSelect = ""
    }
  }

  useEffect(() => {
    if (!cats.find(c => c.id === activeCat)) setActiveCat(cats[0]?.id ?? "")
  }, [v.trCategories]) // eslint-disable-line react-hooks/exhaustive-deps

  const { getTreatmentsByBranch, getEffectiveAssets } = useTreatment()
  const linked: TreatmentPreviewItem[] = getTreatmentsByBranch(branchId)
    .filter(t => t.profile.isPublic)
    .map(t => {
      const assets = getEffectiveAssets(t.profile.id)
      const heroAsset  = t.profile.heroImageAssetId
        ? assets.find(a => a.id === t.profile.heroImageAssetId)
        : undefined
      const thumbAsset = assets.find(a => a.assetType === "카드썸네일")
      return {
        id: t.profile.id,
        name: t.profile.cardTitle || t.profile.name,
        category: t.profile.category,
        description: t.profile.cardDescription || t.profile.shortDescription || "",
        price: t.profile.cardPriceText || (t.profile.priceRegular ? t.profile.priceRegular.toLocaleString() + "원~" : ""),
        duration: t.profile.cardDurationText || (t.profile.durationMinutes ? "약 " + t.profile.durationMinutes + "분" : ""),
        image: (heroAsset ?? thumbAsset)?.fileUrl ?? "",
        badge: t.profile.cardBadge,
        isPublic: t.profile.isPublic,
        isFeatured: t.profile.isFeatured,
        branchId: t.profile.branchId,
        bookingUrl: t.profile.bookingUrl,
        kakaoUrl: t.profile.kakaoUrl,
        landingPageUrl: t.profile.landingPageUrl,
      }
    })

  const firstCatId = cats[0]?.id ?? ""
  const catFiltered = activeCat === firstCatId
    ? linked
    : linked.filter(t => {
        const cat = cats.find(c => c.id === activeCat)
        return cat ? t.category.toLowerCase().includes(cat.label.toLowerCase()) : true
      })
  const q = searchQuery.trim().toLowerCase()
  const visibleCards = q
    ? catFiltered.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    : catFiltered

  const eyebrowColor  = (v.trEyebrowColor  as string) || (isDark ? gold : "#888888")
  const eyebrowSize   = INFO_SIZE_MAP[(v.trEyebrowSize as string)  || "xs"] || "7px"
  const eyebrowWeight = (v.trEyebrowWeight as string)  || "600"
  const eyebrowFont   = INFO_FONT_MAP[(v.trEyebrowFont as string)  || "sans"] || INFO_FONT_MAP.sans
  const titleColor    = (v.trTitleColor    as string) || (isDark ? "#f5f0e8" : "#1a1a1a")
  const titleSize     = INFO_SIZE_MAP[(v.trTitleSize   as string)   || "xl"]  || "14px"
  const titleWeight   = (v.trTitleWeight   as string) || "700"
  const titleFont     = INFO_FONT_MAP[(v.trTitleFont   as string)   || "sans"] || INFO_FONT_MAP.sans
  const descColor     = (v.trDescColor     as string) || (isDark ? "rgba(255,255,255,0.52)" : "#666")
  const descSize      = INFO_SIZE_MAP[(v.trDescSize    as string)   || "sm"]  || "8px"

  const barBg = isDark
    ? "linear-gradient(135deg,rgba(255,255,255,0.09) 0%,rgba(255,255,255,0.04) 100%)"
    : "linear-gradient(135deg,rgba(255,255,255,0.82) 0%,rgba(255,255,255,0.60) 100%)"
  const barBorder = isDark ? "1px solid rgba(255,255,255,0.13)" : "1px solid rgba(255,255,255,0.85)"
  const barShadow = isDark
    ? "0 4px 28px rgba(0,0,0,0.40),inset 0 1px 0 rgba(255,255,255,0.08)"
    : "0 4px 28px rgba(0,0,0,0.09),inset 0 1px 0 rgba(255,255,255,1)"

  return (
    <div style={{ ...bgStyle, padding: "24px 0 20px" }}>
      <div style={{ padding: "0 16px 18px" }}>
        <p style={{
          fontSize: eyebrowSize, fontWeight: eyebrowWeight, fontFamily: eyebrowFont,
          color: eyebrowColor, letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: 7,
        }}>
          {(v.trEyebrow as string) || "OUR SERVICES"}
        </p>
        <p style={{
          fontSize: titleSize, fontWeight: titleWeight, fontFamily: titleFont,
          color: titleColor, lineHeight: 1.35, marginBottom: 9, paddingTop: 6,
        }}>
          {(v.trTitle as string) || "시술 안내"}
        </p>
        <p style={{
          fontSize: descSize, color: descColor, lineHeight: 1.65, whiteSpace: "pre-line",
        }}>
          {(v.trDesc as string) || "타토아 클리닉의 다양한 시술 프로그램을 확인해보세요.\n모든 시술은 전문 의료진의 1:1 상담 후 진행됩니다."}
        </p>
      </div>

      <div style={{ padding: "0 12px 10px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
          borderRadius: 12, padding: "6px 10px",
          border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.09)",
        }}>
          <Search style={{ width: 10, height: 10, flexShrink: 0, color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.30)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="시술명, 카테고리 검색..."
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontSize: 8, color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.70)",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, lineHeight: 1 }}
            >
              <X style={{ width: 9, height: 9, color: isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.25)" }} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "0 12px 16px" }}>
        <div style={{
          display: "flex", alignItems: "stretch", position: "relative",
          background: barBg, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
          border: barBorder, borderRadius: 18,
          boxShadow: barShadow, overflow: "hidden",
        }}>
          <div
            ref={catScrollRef}
            onWheel={handleCatWheel}
            onScroll={updateScrollState}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ flex: 1, display: "flex", overflowX: "auto", scrollbarWidth: "none", cursor: "grab" }}
          >
            {cats.map(cat => {
              const isActive = cat.id === activeCat
              const iconC = isActive
                ? (isDark ? gold : "#111111")
                : (isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.28)")
              const labelC = isActive
                ? (isDark ? "#f5f0e8" : "#111111")
                : (isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.28)")
              return (
                <button key={cat.id} type="button" onClick={() => setActiveCat(cat.id)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "8px 13px", minWidth: 52, flexShrink: 0,
                  background: isActive
                    ? (isDark ? "rgba(201,168,92,0.14)" : "rgba(0,0,0,0.055)")
                    : "transparent",
                  border: "none", cursor: "pointer",
                  borderBottom: "2px solid " + (isActive ? (isDark ? gold : "#111") : "transparent"),
                  transition: "all 0.2s ease",
                }}>
                  <TreatmentCatIcon iconKey={cat.icon} size={15} color={iconC} />
                  <span style={{ fontSize: 7, color: labelC, fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap" }}>
                    {cat.label}
                  </span>
                </button>
              )
            })}
          </div>
          {!catScroll.atStart && (
            <button type="button" onClick={() => scrollCatBy(-80)} style={{
              position: "absolute", left: 0, top: 0, bottom: 0,
              display: "flex", alignItems: "center", paddingLeft: 9, paddingRight: 22,
              background: isDark
                ? "linear-gradient(to left, transparent, rgba(14,12,9,0.70) 55%)"
                : "linear-gradient(to left, transparent, rgba(248,248,246,0.70) 55%)",
              border: "none", cursor: "pointer",
            }}>
              <ChevronLeft size={13} color={isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)"} />
            </button>
          )}
          {!catScroll.atEnd && (
            <button type="button" onClick={() => scrollCatBy(80)} style={{
              position: "absolute", right: 0, top: 0, bottom: 0,
              display: "flex", alignItems: "center", paddingRight: 9, paddingLeft: 22,
              background: isDark
                ? "linear-gradient(to right, transparent, rgba(14,12,9,0.70) 55%)"
                : "linear-gradient(to right, transparent, rgba(248,248,246,0.70) 55%)",
              border: "none", cursor: "pointer",
            }}>
              <ChevronRight size={13} color={isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)"} />
            </button>
          )}
        </div>
      </div>

      <div style={{
        padding: isDesktop ? "28px 80px 40px" : "0 16px 20px",
        display: "grid",
        gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr",
        gap: 20,
      }}>
        {visibleCards.slice(0, isDesktop ? 9 : 8).map((t, i) => (
          <RevealBox key={t.id} delay={i * 60}>
            <TreatmentCard treatment={t} isDark={isDark} gold={gold} cardValues={v} />
          </RevealBox>
        ))}
        {visibleCards.length === 0 && q && (
          <div style={{
            padding: "20px 0", textAlign: "center",
            color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.25)", fontSize: 8,
          }}>
            &ldquo;{searchQuery}&rdquo; 검색 결과가 없습니다
          </div>
        )}
        {linked.length === 0 && (
          <div style={{
            padding: "24px 0", textAlign: "center",
            color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.22)", fontSize: 8,
          }}>
            의료진/장비 메뉴 → 시술에서 등록한 시술이 여기에 연동됩니다
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PreviewStrengths ─────────────────────────────────────────────────────────

function PreviewStrengths({ v, device = "mobile" }: { v: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const isDesktop = device === "desktop"
  const gold = "#c9a85c"

  const s1Dark   = ((v.s1BgColor as string) || "dark") === "dark"
  const s1Stats  = parseSStats(v.s1Stats, DEFAULT_S1_STATS)
  const s1SubLabel    = (v.s1SubLabel    as string) || "TATOA IN NUMBERS"
  const s1Headline    = (v.s1Headline    as string) || "시간이 증명한\n아름다움의 기준"
  const s1Description = (v.s1Description as string) || "15년간 쌓아온 신뢰와 결과로\n증명하는 타토아의 브랜드 파워"
  const s1MapImages = parseS1MapImages(v.s1MapImages, (v.s1MapImage as string) || "")

  const s1SubColor   = (v.s1SubLabelColor    as string) || gold
  const s1HColor     = (v.s1HeadlineColor    as string) || (s1Dark ? "#f5f0e8" : "#1a1a1a")
  const s1DColor     = (v.s1DescriptionColor as string) || (s1Dark ? "rgba(255,255,255,0.55)" : "#666")
  const s1HSize      = DOCTOR_SIZE_MAP[(v.s1HeadlineSize as string) || "md"] ?? 19
  const s1HWeight    = (v.s1HeadlineWeight   as string) || "600"
  const s1HFont      = getFontCss((v.s1HeadlineFont as string) || "sans")

  const s2Dark   = ((v.s2BgColor as string) || "dark") === "dark"
  const s2Stats  = parseSStats(v.s2Stats, DEFAULT_S2_STATS)
  const s2Headline    = (v.s2Headline    as string) || "숫자로 보는 신뢰"
  const s2Description = (v.s2Description as string) || "타토아를 선택한 고객들의\n진실된 재방문 데이터"

  const s2HColor  = (v.s2HeadlineColor    as string) || (s2Dark ? "#f5f0e8" : "#1a1a1a")
  const s2DColor  = (v.s2DescriptionColor as string) || (s2Dark ? "rgba(255,255,255,0.55)" : "#666")
  const s2HSize   = DOCTOR_SIZE_MAP[(v.s2HeadlineSize as string) || "md"] ?? 19
  const s2HWeight = (v.s2HeadlineWeight  as string) || "600"
  const s2HFont   = getFontCss((v.s2HeadlineFont as string) || "sans")
  const s2MapImages = parseS1MapImages(v.s2MapImages)

  // Dynamic SubLabel height for s2 paddingTop alignment (PC only)
  const subLabelRef = useRef<HTMLParagraphElement>(null)
  const [subLabelH, setSubLabelH] = useState(14)
  useLayoutEffect(() => {
    if (subLabelRef.current) {
      const h = subLabelRef.current.offsetHeight
      if (h > 0) setSubLabelH(h)
    }
  }, [v.s1SubLabel, v.s1SubLabelSize, v.s1SubLabelWeight, v.s1SubLabelFont])

  return (
    <div style={{ display: isDesktop ? "flex" : "block" }}>
      <div style={{ ...sectionBgStyle(s1Dark), flex: isDesktop ? "0 0 50%" : undefined }}>
        <div style={{ maxWidth: isDesktop ? 600 : undefined, marginLeft: isDesktop ? "auto" : undefined, padding: isDesktop ? "20px 14px 18px 15%" : "20px 14px 18px" }}>
        <p ref={subLabelRef} style={{
          fontSize: DOCTOR_SIZE_MAP[(v.s1SubLabelSize as string) || "xs"] ?? 11,
          fontWeight: Number((v.s1SubLabelWeight as string) || "600"),
          fontFamily: getFontCss((v.s1SubLabelFont as string) || "sans"),
          color: s1SubColor,
          letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 9,
        }}>
          {s1SubLabel}
        </p>
        <p style={{
          fontSize: s1HSize, fontWeight: Number(s1HWeight), fontFamily: s1HFont,
          color: s1HColor, lineHeight: 1.3, marginBottom: 8,
        }}>
          {renderTextWithLineBreaks(s1Headline)}
        </p>
        <p style={{ fontSize: DOCTOR_SIZE_MAP[(v.s1DescriptionSize as string) || "xs"] ?? 11, color: s1DColor, lineHeight: 1.5, marginBottom: 12 }}>
          {renderTextWithLineBreaks(s1Description)}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          {s1Stats.slice(0, 4).map((stat, i) => {
            const cs = resolveStatCardStyle(stat, s1Dark)
            const valC = stat.valueColor || gold
            const lblC = stat.labelColor || (s1Dark ? "rgba(255,255,255,0.42)" : "#888")
            return (
              <RevealBox key={stat.id} delay={i * 120} style={{ flex: 1 }}>
                <div style={{
                  borderRadius: cs.radius, background: cs.bg, border: cs.border,
                  boxShadow: cs.shadow, backdropFilter: cs.blur ? "blur(" + cs.blur + "px)" : undefined,
                  padding: "14px 8px", textAlign: "center", height: "100%",
                }}>
                  <p style={{ fontSize: 24, fontWeight: 700, color: valC, lineHeight: 1 }}>
                    {stat.value}<span style={{ fontSize: 12 }}>{stat.unit}</span>
                  </p>
                  <p style={{ fontSize: 12, color: lblC, marginTop: 6, lineHeight: 1.2 }}>{stat.label}</p>
                </div>
              </RevealBox>
            )
          })}
        </div>
        {s1MapImages.length === 0 ? (
          <div style={{ width: "100%", marginTop: 12, borderRadius: 8, overflow: "hidden",
            background: s1Dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            minHeight: 88, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 7, color: s1Dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)" }}>이미지 없음</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {s1MapImages.map((img, idx) => {
              const shadow = buildS1Shadow(img)
              const grad   = buildS1Gradient(img)
              const ratio  = idx === 0 ? "5/4" : "3/2"
              return (
                <div key={img.id} style={{ width: "100%", aspectRatio: ratio, borderRadius: 8, overflow: "hidden", position: "relative", flexShrink: 0, boxShadow: shadow !== "none" ? shadow : undefined }}>
                  {img.url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: img.position, filter: buildS1ImgFilter(img) || undefined }} />
                      {grad && <div style={{ position: "absolute", inset: 0, background: grad, pointerEvents: "none" }} />}
                    </>
                  ) : (
                    <div style={{ position: "absolute", inset: 0, background: s1Dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 7, color: s1Dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>이미지 {idx + 1}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        </div>
      </div>

      <div style={{ ...sectionBgStyle(s2Dark), flex: isDesktop ? "0 0 50%" : undefined }}>
        <div style={{ maxWidth: isDesktop ? 600 : undefined, marginRight: isDesktop ? "auto" : undefined, padding: isDesktop ? (20 + subLabelH + 9) + "px 15% 18px 14px" : "30px 14px 18px" }}>
        <p style={{
          fontSize: s2HSize, fontWeight: Number(s2HWeight), fontFamily: s2HFont,
          color: s2HColor, lineHeight: 1.3, marginBottom: 6,
        }}>
          {renderTextWithLineBreaks(s2Headline)}
        </p>
        <p style={{ fontSize: DOCTOR_SIZE_MAP[(v.s2DescriptionSize as string) || "xs"] ?? 11, color: s2DColor, lineHeight: 1.5, marginBottom: 14 }}>
          {renderTextWithLineBreaks(s2Description)}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {s2Stats.map((stat, i) => (
            <RevealBox key={stat.id} delay={i * 130}>
              <S2StatCard stat={stat} isDark={s2Dark} gold={gold} />
            </RevealBox>
          ))}
        </div>
        {s2MapImages.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {s2MapImages.map((img, idx) => {
              const shadow = buildS1Shadow(img)
              const grad   = buildS1Gradient(img)
              const ratio  = idx === 0 ? "5/4" : "3/2"
              return (
                <div key={img.id} style={{ width: "100%", aspectRatio: ratio, borderRadius: 8, overflow: "hidden", position: "relative", flexShrink: 0, boxShadow: shadow !== "none" ? shadow : undefined }}>
                  {img.url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: img.position, filter: buildS1ImgFilter(img) || undefined }} />
                      {grad && <div style={{ position: "absolute", inset: 0, background: grad, pointerEvents: "none" }} />}
                    </>
                  ) : (
                    <div style={{ position: "absolute", inset: 0, background: s2Dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 7, color: s2Dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>이미지 {idx + 1}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

// ─── PreviewBranchInfo ────────────────────────────────────────────────────────

function PreviewBranchInfo({ v, device = "mobile" }: { v: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const isDesktop = device === "desktop"
  const isDark  = ((v.biBgColor as string) || "dark") === "dark"
  const gold    = "#c9a85c"
  const bgStyle = sectionBgStyle(isDark)
  const cards   = parseBranchCards(v.branchCards)

  const subText   = (v.biSubLabel      as string) || "OUR BRANCHES"
  const subColor  = (v.biSubLabelColor as string) || gold
  const subSize   = (DOCTOR_SIZE_MAP[(v.biSubLabelSize as string) || "xs"] ?? 11) + "px"
  const subWeight = (v.biSubLabelWeight as string) || "600"

  const titleText   = (v.biTitle       as string) || "Global Network"
  const titleColor  = (v.biTitleColor  as string) || (isDark ? "#f5f0e8" : "#1a1a1a")
  const titleSize   = (DOCTOR_SIZE_MAP[(v.biTitleSize as string) || "xl"] ?? 27) + "px"
  const titleWeight = (v.biTitleWeight as string) || "700"
  const titleFont   = INFO_FONT_MAP[(v.biTitleFont   as string) || "sans"] || INFO_FONT_MAP.sans

  const visibleCards = cards.slice(0, 5)
  const extraCount   = Math.max(0, cards.length - 5)

  const CARD_W = 308
  const CARD_H = 428

  // Drag-to-scroll for branch carousel (PC mouse + works on touch via native scroll)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ isDown: false, startX: 0, startScrollLeft: 0 })
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollerRef.current) return
    dragRef.current.isDown = true
    dragRef.current.startX = e.pageX - scrollerRef.current.offsetLeft
    dragRef.current.startScrollLeft = scrollerRef.current.scrollLeft
    scrollerRef.current.style.cursor = "grabbing"
    scrollerRef.current.style.userSelect = "none"
  }
  const handleMouseLeave = () => {
    if (!scrollerRef.current) return
    dragRef.current.isDown = false
    scrollerRef.current.style.cursor = "grab"
    scrollerRef.current.style.removeProperty("user-select")
  }
  const handleMouseUp = () => {
    if (!scrollerRef.current) return
    dragRef.current.isDown = false
    scrollerRef.current.style.cursor = "grab"
    scrollerRef.current.style.removeProperty("user-select")
  }
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDown || !scrollerRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollerRef.current.offsetLeft
    const walk = (x - dragRef.current.startX) * 1.2
    scrollerRef.current.scrollLeft = dragRef.current.startScrollLeft - walk
  }

  return (
    <div style={{ ...bgStyle, paddingTop: "28px", paddingBottom: "16px", paddingLeft: isDesktop ? "15%" : 0, paddingRight: isDesktop ? "15%" : 0 }}>
      <div style={{ paddingLeft: "16px", paddingRight: "14px", marginBottom: "12px" }}>
        <p style={{
          fontSize: subSize, fontWeight: subWeight, color: subColor,
          letterSpacing: "0.12em", marginBottom: "4px", textTransform: "uppercase",
        }}>
          {subText}
        </p>
        <p style={{
          fontSize: titleSize, fontWeight: titleWeight, color: titleColor,
          fontFamily: titleFont, lineHeight: 1.18,
        }}>
          {titleText}
        </p>
      </div>

      <div style={{ position: "relative" }}>
      <div
        ref={scrollerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onDragStart={(e) => e.preventDefault()}
        style={{
        display: "flex", gap: "28px",
        overflowX: "auto", paddingRight: "10px",
        scrollSnapType: "x mandatory",
        scrollPaddingLeft: "16px",
        scrollbarWidth: "none",
        cursor: "grab",
      } as React.CSSProperties}>
        {visibleCards.map((card, idx) => {
          const finalFilter  = buildCardFilter(card)
          const overlayAlpha = ((card.imgOverlayOpacity ?? 30) / 100).toFixed(2)
          const overlayRgb   = hexToRgb(card.imgOverlay || "#000000")
          const overlayColor = "rgba(" + overlayRgb + "," + overlayAlpha + ")"
          const fadeStop     = Math.max(0, 100 - (card.imgFade ?? 65))
          const gradBottom   = "linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0) " + fadeStop + "%)"

          return (
            <div key={card.id} style={{
              flexShrink: 0, width: CARD_W + "px", height: CARD_H + "px",
              borderRadius: "10px", overflow: "hidden", position: "relative",
              scrollSnapAlign: "start",
              background: isDark ? "#1c1c1c" : "#d8d8d8",
              ...(idx === 0 ? { marginLeft: "16px" } : {}),
            }}>
              {card.imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.imgUrl} alt="" style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  objectFit: "cover", objectPosition: card.imgPosition || "center",
                  filter: finalFilter || undefined, display: "block",
                }} />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Building2 style={{ width: "22px", height: "22px", color: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.13)" }} />
                </div>
              )}
              <div style={{
                position: "absolute", inset: 0,
                background: overlayColor,
                mixBlendMode: (card.imgBlend || "normal") as React.CSSProperties["mixBlendMode"],
              }} />
              <div style={{ position: "absolute", inset: 0, background: gradBottom }} />
              <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px" }}>
                <p style={{ fontSize: "5.5px", fontWeight: "500", color: "rgba(255,255,255,0.58)", letterSpacing: "0.1em", marginBottom: "2px", textTransform: "uppercase" }}>
                  {card.region || "REGION · COUNTRY"}
                </p>
                <p style={{ fontSize: "9px", fontWeight: "700", color: "#fff", lineHeight: 1.2, marginBottom: "2px" }}>
                  {card.name || "Branch Name"}
                </p>
                <p style={{ fontSize: "6px", color: "rgba(255,255,255,0.52)", lineHeight: 1.3 }}>
                  {card.feature || "Feature tagline"}
                </p>
              </div>
            </div>
          )
        })}

        {extraCount > 0 && (
          <div style={{
            flexShrink: 0, width: "176px", height: CARD_H + "px",
            borderRadius: "10px", scrollSnapAlign: "start",
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            border: "1px solid " + (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"),
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px",
          }}>
            <p style={{ fontSize: "15px", fontWeight: "700", color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.22)" }}>+{extraCount}</p>
            <p style={{ fontSize: "5.5px", color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)" }}>더보기</p>
          </div>
        )}
      </div>
        {isDesktop && (
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 80,
            pointerEvents: "none",
            background: "linear-gradient(to right, transparent, " + (isDark ? "#0e0c09" : "#f8f8f6") + ")",
          }} />
        )}
      </div>
    </div>
  )
}

// ─── PreviewInfo ──────────────────────────────────────────────────────────────

export function PreviewInfo({ v, device = "mobile" }: { v: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const isDesktop = device === "desktop"
  const isDark = ((v.infoBgColor as string) || "dark") === "dark"
  const gold   = "#c9a85c"
  const bgStyle = sectionBgStyle(isDark)

  const titleColor  = (v.infoTitleColor  as string) || (isDark ? gold : "#1a1a1a")
  const titleSize   = (DOCTOR_SIZE_MAP[(v.infoTitleSize as string) || "lg"] ?? 23) + "px"
  const titleWeight = (v.infoTitleWeight as string) || "700"
  const titleFont   = INFO_FONT_MAP[(v.infoTitleFont as string) || "sans"] || INFO_FONT_MAP.sans

  const addrBox      = resolveInfoBoxStyle("addr", v, isDark)
  const addrTitle    = (v.addrTitle as string) || "주소 / 연락처"
  const addrBody     = (v.addrBody  as string) || "서울특별시 강남구 테헤란로 123"
  const addrPhone    = (v.addrPhone as string) || "02-1234-5678"
  const addrTitleC   = (v.addrTitleColor  as string) || (isDark ? gold : "#1a1a1a")
  const addrBodyC    = (v.addrBodyColor   as string) || (isDark ? "rgba(255,255,255,0.72)" : "#555")
  const addrPhoneC   = (v.addrPhoneColor  as string) || (isDark ? gold : "#1a1a1a")
  const addrTitleSize = INFO_SIZE_MAP[(v.addrTitleSize as string) || "sm"] || "8px"
  const addrBodySize  = INFO_SIZE_MAP[(v.addrBodySize  as string) || "xs"] || "7px"
  const addrPhoneSize = INFO_SIZE_MAP[(v.addrPhoneSize as string) || "xs"] || "7px"
  const addrTitleW   = (v.addrTitleWeight as string) || "700"
  const addrBodyW    = (v.addrBodyWeight  as string) || "400"

  const hoursBox      = resolveInfoBoxStyle("hours", v, isDark)
  const hoursTitle    = (v.hoursTitle as string) || "진료 시간"
  const hoursLines    = parseHoursLines(v.hoursBody || "월~금  10:00 – 19:00\n토        10:00 – 17:00\n일·공휴일  휴진")
  const hoursTitleC   = (v.hoursTitleColor as string) || (isDark ? gold : "#1a1a1a")
  const hoursBodyC    = (v.hoursBodyColor  as string) || (isDark ? "rgba(255,255,255,0.72)" : "#555")
  const hoursTitleSize = INFO_SIZE_MAP[(v.hoursTitleSize as string) || "sm"] || "8px"
  const hoursBodySize  = INFO_SIZE_MAP[(v.hoursBodySize  as string) || "xs"] || "7px"
  const hoursTitleW   = (v.hoursTitleWeight as string) || "700"
  const hoursBodyW    = (v.hoursBodyWeight  as string) || "400"

  const mapUrl = (v.mapEmbedUrl as string) || ""

  const mapBlock = (height: string) => (
    <div style={{ height, overflow: "hidden", position: "relative", borderRadius: isDesktop ? "12px" : 0 }}>
      {mapUrl ? (
        isDesktop ? (
          <iframe
            src={mapUrl}
            width="100%" height="100%"
            style={{ border: 0, display: "block", touchAction: "pan-x pan-y" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div style={{ position: "absolute", top: 0, left: 0, width: "143%", height: (parseInt(height) * (1 / 0.7)) + "px", transform: "scale(0.7)", transformOrigin: "top left" }}>
            <iframe src={mapUrl} width="100%" height="100%" style={{ border: 0, display: "block", touchAction: "pan-x pan-y" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          </div>
        )
      ) : (
        <div style={{ width: "100%", height: "100%", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: "1px dashed " + (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"), borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px" }}>
          <MapPin style={{ width: "14px", height: "14px", color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }} />
          <span style={{ fontSize: "6px", color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)" }}>Google Maps 미연결</span>
        </div>
      )}
    </div>
  )

  const infoBoxes = (
    <>
      <div style={{ background: addrBox.bg, border: addrBox.border, boxShadow: addrBox.shadow === "none" ? "none" : addrBox.shadow, backdropFilter: addrBox.blur > 0 ? "blur(" + addrBox.blur + "px)" : undefined, borderRadius: addrBox.radius, padding: isDesktop ? "20px 24px" : "8px 10px", marginBottom: isDesktop ? "12px" : "6px", textAlign: isDesktop ? "center" : undefined }}>
        <p style={{ fontSize: isDesktop ? "11px" : addrTitleSize, fontWeight: addrTitleW, color: addrTitleC, marginBottom: isDesktop ? "10px" : "4px", letterSpacing: "0.04em" }}>{addrTitle}</p>
        <p style={{ fontSize: isDesktop ? "10px" : addrBodySize, fontWeight: addrBodyW, color: addrBodyC, lineHeight: 1.6, marginBottom: isDesktop ? "8px" : "3px", whiteSpace: "pre-line" }}>{addrBody}</p>
        <p style={{ fontSize: isDesktop ? "13px" : addrPhoneSize, fontWeight: "700", color: addrPhoneC }}>{addrPhone}</p>
      </div>
      <div style={{ background: hoursBox.bg, border: hoursBox.border, boxShadow: hoursBox.shadow === "none" ? "none" : hoursBox.shadow, backdropFilter: hoursBox.blur > 0 ? "blur(" + hoursBox.blur + "px)" : undefined, borderRadius: hoursBox.radius, padding: isDesktop ? "20px 24px" : "8px 10px" }}>
        <p style={{ fontSize: isDesktop ? "11px" : hoursTitleSize, fontWeight: hoursTitleW, color: hoursTitleC, marginBottom: isDesktop ? "10px" : "4px", letterSpacing: "0.04em", textAlign: isDesktop ? "center" : undefined }}>{hoursTitle}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, alignItems: isDesktop ? "center" : undefined }}>
          {hoursLines.map((line) => {
            const mainSize  = line.size === "sm" ? (isDesktop ? "8px" : "6px") : (isDesktop ? "10px" : hoursBodySize)
            const mainColor = resolveHoursColor(line.color, isDark, hoursBodyC)
            const sufColor  = resolveHoursColor(line.suffixColor, isDark, isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)")
            return (
              <div key={line.id} style={{ fontSize: mainSize, lineHeight: 1.55 }}>
                <span style={{ fontWeight: hoursBodyW, color: mainColor }}>{line.text}</span>
                {line.suffix && (
                  <span style={{ fontSize: isDesktop ? "8px" : "5.5px", color: sufColor, marginLeft: "4px" }}>{line.suffix}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )

  if (isDesktop) {
    return (
      <div style={{ ...bgStyle }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px 32px" }}>
          <p style={{ fontSize: titleSize, fontWeight: titleWeight, color: titleColor, fontFamily: titleFont, marginBottom: "20px", letterSpacing: "0.12em", textAlign: "center" }}>
            {(v.infoTitle as string) || "INFO"}
          </p>
          <div style={{ display: "flex", gap: "20px", alignItems: "stretch" }}>
            <div style={{ flex: "0 0 60%", minHeight: "480px" }}>
              {mapBlock("100%")}
            </div>
            <div style={{ flex: "0 0 calc(40% - 20px)", display: "flex", flexDirection: "column", justifyContent: "center", gap: "18px" }}>
              {infoBoxes}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...bgStyle, padding: "14px 14px 16px" }}>
      <p style={{ fontSize: titleSize, fontWeight: titleWeight, color: titleColor, fontFamily: titleFont, marginBottom: "10px", letterSpacing: "0.06em", textAlign: "center" }}>
        {(v.infoTitle as string) || "— 정보 / 위치 —"}
      </p>
      <div style={{ marginLeft: "-14px", marginRight: "-14px", marginBottom: "8px" }}>
        {mapBlock("230px")}
      </div>
      {infoBoxes}
    </div>
  )
}

// ─── PreviewGallery ───────────────────────────────────────────────────────────

function PreviewGallery({ v, device = "mobile" }: { v: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const images  = parseGalleryImages(v.galleryImages)
  const title   = (v.title as string) || "병원 둘러보기"
  const isDark  = ((v.galleryBg as string) || "dark") === "dark"
  const isDesktop = device === "desktop"

  const bg      = isDark ? "#0e0c09" : "#f5f5f5"
  const tc      = isDark ? "rgba(255,255,255,0.80)" : "#111"
  const gold    = "#c9a85c"

  const titleSizeKey = (v.titleSize as string) || "sm"
  const titleWeight  = (v.titleWeight as string) || "700"
  const titleFont    = getFontCss((v.titleFont as string) || "sans")
  const titleColor   = (v.titleColor as string) || (isDark ? gold : tc)
  const titlePx      = DOCTOR_SIZE_MAP[titleSizeKey] ?? 15

  const safeIdx = images.length > 0 ? Math.min(activeIdx, images.length - 1) : 0
  const prev = () => setActiveIdx(i => (i - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1))
  const next = () => setActiveIdx(i => (i + 1) % Math.max(images.length, 1))

  const mobileStripRef = useRef<HTMLDivElement>(null)
  const mobileDrag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false })
  const onMobilePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = mobileStripRef.current; if (!el) return
    e.currentTarget.setPointerCapture(e.pointerId)
    mobileDrag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false }
    el.style.cursor = "grabbing"
  }
  const onMobilePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = mobileDrag.current; if (!d.active) return
    const el = mobileStripRef.current; if (!el) return
    const dx = e.clientX - d.startX
    if (Math.abs(dx) > 3) d.moved = true
    el.scrollLeft = d.scrollLeft - dx
  }
  const onMobilePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    mobileDrag.current.active = false
    e.currentTarget.style.cursor = "grab"
  }

  const PC_THUMB_W   = 88
  const PC_GAP       = 3
  const PC_STEP      = 91
  const PC_CONTAINER = 270

  const pcThumbRef   = useRef<HTMLDivElement>(null)
  const pcInnerRef   = useRef<HTMLDivElement>(null)
  const pcWasDrag    = useRef(false)
  const pcScrollX    = useRef(0)
  const pcIsDragging = useRef(false)
  const pcImagesLen  = useRef(images.length)
  pcImagesLen.current = images.length

  useEffect(() => {
    if (pcIsDragging.current) return
    const inner = pcInnerRef.current
    if (!inner) return
    const n = pcImagesLen.current
    if (n <= 3) { pcScrollX.current = 0; inner.style.transform = "translateX(0)"; return }
    const maxScroll = (n - 3) * PC_STEP
    const target = Math.min(safeIdx * PC_STEP, maxScroll)
    inner.style.transition = "transform 0.25s ease"
    inner.style.transform  = "translateX(" + (-target) + "px)"
    pcScrollX.current = target
    const t = setTimeout(() => { if (inner) inner.style.transition = "" }, 260)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx])

  useEffect(() => {
    if (!pcThumbRef.current || !pcInnerRef.current) return
    const container = pcThumbRef.current as HTMLDivElement
    const inner     = pcInnerRef.current as HTMLDivElement

    let velocity  = 0
    let rafHandle = 0

    const cancelAnim = () => { if (rafHandle) { cancelAnimationFrame(rafHandle); rafHandle = 0 } }
    const getScale     = () => { const w = container.getBoundingClientRect().width; return w > 0 ? w / PC_CONTAINER : 1 }
    const getMaxScroll = () => Math.max(0, (pcImagesLen.current - 3) * PC_STEP)

    function applyPos(x: number) {
      const clamped = Math.max(0, Math.min(getMaxScroll(), x))
      pcScrollX.current = clamped
      inner.style.transform = "translateX(" + (-clamped) + "px)"
      return clamped
    }

    let lastTs = 0
    function runInertia(ts: number) {
      if (!lastTs) lastTs = ts
      const dt      = Math.min(ts - lastTs, 50)
      lastTs        = ts
      velocity     *= Math.pow(0.90, dt / 16)
      const newPos  = applyPos(pcScrollX.current + velocity * dt)
      const maxS    = getMaxScroll()
      if (Math.abs(velocity) < 0.05 || newPos <= 0 || newPos >= maxS) {
        const snapped = Math.min(Math.round(pcScrollX.current / PC_STEP), pcImagesLen.current - 1)
        inner.style.transition = "transform 0.18s ease"
        inner.style.transform  = "translateX(" + (-(snapped * PC_STEP)) + "px)"
        pcScrollX.current      = snapped * PC_STEP
        setTimeout(() => { if (inner) inner.style.transition = "" }, 200)
        setActiveIdx(Math.min(snapped, pcImagesLen.current - 1))
        velocity = 0; rafHandle = 0
        return
      }
      rafHandle = requestAnimationFrame(runInertia)
    }

    function handleDown(e: PointerEvent) {
      cancelAnim()
      inner.style.transition = ""
      pcIsDragging.current   = true
      pcWasDrag.current      = false
      velocity               = 0
      container.style.cursor = "grabbing"

      const startX      = e.clientX
      const startScroll = pcScrollX.current
      let lastX         = e.clientX
      let lastT         = e.timeStamp

      function handleMove(ev: PointerEvent) {
        const scale = getScale()
        const dt    = ev.timeStamp - lastT
        if (dt > 0) { velocity = -(ev.clientX - lastX) / (dt * scale); lastX = ev.clientX; lastT = ev.timeStamp }
        applyPos(startScroll + (startX - ev.clientX) / scale)
        if (Math.abs(ev.clientX - startX) > 5) pcWasDrag.current = true
      }
      function handleUp() {
        container.style.cursor = "grab"
        window.removeEventListener("pointermove", handleMove)
        window.removeEventListener("pointerup",   handleUp)
        pcIsDragging.current = false
        lastTs = 0
        if (pcWasDrag.current) rafHandle = requestAnimationFrame(runInertia)
        setTimeout(() => { pcWasDrag.current = false }, 0)
      }
      window.addEventListener("pointermove", handleMove)
      window.addEventListener("pointerup",   handleUp)
    }

    container.addEventListener("pointerdown", handleDown, { passive: false })
    return () => { container.removeEventListener("pointerdown", handleDown); cancelAnim() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mainRatio = isDesktop ? "3/2" : "4/5"
  const thumbW   = isDesktop ? "20%" : "calc(100% / 3.5)"

  const arrowStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    [side]: isDesktop ? 12 : 6,
    width: isDesktop ? 36 : 22, height: isDesktop ? 36 : 22,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", zIndex: 4, color: "#fff",
    fontSize: isDesktop ? 18 : 12, fontWeight: 300, lineHeight: 1,
    userSelect: "none",
  })

  const emptySlot = (
    <div style={{ width: "100%", aspectRatio: mainRatio, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
      <Building2 style={{ width: isDesktop ? 32 : 18, height: isDesktop ? 32 : 18, color: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)" }} />
      <span style={{ fontSize: isDesktop ? 11 : 7, color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)" }}>이미지를 추가해주세요</span>
    </div>
  )

  return (
    <div style={{ background: bg, padding: isDesktop ? "64px 0 36px" : "36px 0 22px" }}>
      <p style={{ fontSize: titlePx, fontWeight: Number(titleWeight), fontFamily: titleFont, color: titleColor, letterSpacing: "0.10em", textTransform: "uppercase", textAlign: "center", marginBottom: isDesktop ? 32 : 20 }}>
        {title}
      </p>

      <div style={{
        position: "relative",
        width: isDesktop ? "min(100%, calc((100dvh - 165px) * 1.875))" : "100%",
        aspectRatio: mainRatio,
        overflow: "hidden",
        margin: isDesktop ? "0 auto" : undefined,
      }}>
        {images.length > 0 && images[safeIdx].url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[safeIdx].url} alt={images[safeIdx].label || ""}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : emptySlot}

        {images.length > 1 && (
          <button type="button" onClick={prev} style={arrowStyle("left")}>‹</button>
        )}
        {images.length > 1 && (
          <button type="button" onClick={next} style={arrowStyle("right")}>›</button>
        )}

        {images.length > 1 && !isDesktop && (
          <div style={{ position: "absolute", bottom: 5, right: 7, background: "rgba(0,0,0,0.45)", borderRadius: 20, padding: "1px 5px", fontSize: 6, color: "#fff", backdropFilter: "blur(4px)" }}>
            {safeIdx + 1} / {images.length}
          </div>
        )}

        {isDesktop && images.length > 1 && (
          <div
            ref={pcThumbRef}
            style={{
              position: "absolute",
              bottom: "14%",
              right: 10,
              width: "30%",
              overflow: "hidden",
              zIndex: 5,
              cursor: "grab",
              userSelect: "none",
              touchAction: "none",
            }}
          >
            <div
              ref={pcInnerRef}
              style={{ display: "flex", gap: PC_GAP, willChange: "transform" }}
            >
              {images.map((thumb, imgIdx) => {
                const isActive = imgIdx === safeIdx
                return (
                  <button
                    key={thumb.id || imgIdx}
                    type="button"
                    onClick={(e) => {
                      if (pcWasDrag.current) { e.preventDefault(); return }
                      setActiveIdx(imgIdx)
                    }}
                    style={{
                      flexShrink: 0,
                      width: PC_THUMB_W,
                      aspectRatio: "4/3",
                      overflow: "hidden",
                      cursor: "inherit",
                      padding: 0,
                      border: isActive ? "2px solid " + gold : "1.5px solid rgba(255,255,255,0.30)",
                      opacity: isActive ? 1 : 0.65,
                      transition: "opacity 0.2s, border-color 0.2s",
                      borderRadius: 3,
                      background: "#111",
                      pointerEvents: "auto",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {thumb.url
                      ? <img src={thumb.url} alt={thumb.label || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
                      : <div style={{ width: "100%", height: "100%", background: "#222" }} />
                    }
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {!isDesktop && images.length > 1 && (
        <div
          ref={mobileStripRef}
          onPointerDown={onMobilePointerDown}
          onPointerMove={onMobilePointerMove}
          onPointerUp={onMobilePointerUp}
          onPointerCancel={onMobilePointerUp}
          style={{
            display: "flex", gap: 2, padding: "3px 0 0",
            overflowX: "auto", scrollbarWidth: "none",
            cursor: "grab", userSelect: "none",
            touchAction: "none",
          }}
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={(e) => {
                if (mobileDrag.current.moved) { e.preventDefault(); return }
                setActiveIdx(i)
              }}
              style={{
                flexShrink: 0, width: thumbW, aspectRatio: "4/3",
                overflow: "hidden", cursor: "inherit", padding: 0, border: "none",
                outline: i === safeIdx ? "1.5px solid " + gold : "none",
                outlineOffset: "-1.5px",
                opacity: i === safeIdx ? 1 : 0.55,
                transition: "opacity 0.2s, outline 0.2s",
                borderRadius: 2,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {img.url
                ? <img src={img.url} alt={img.label || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
                : <div style={{ width: "100%", height: "100%", background: "#333" }} />
              }
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── PreviewFooter ────────────────────────────────────────────────────────────

function getSocialIconByPlatform(platform: string) {
  switch (platform) {
    case "facebook": return Facebook
    case "twitter":  return Twitter
    case "tiktok":   return Music
    case "linkedin": return Linkedin
    case "other":    return Globe
    default:         return Globe
  }
}

function PreviewFooter({ v, device = "mobile" }: { v: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const isDesktop = device === "desktop"

  // ── 사업자 정보
  const hospitalName   = (v.footerHospitalName   as string) ?? ""
  const corporateName  = (v.footerCorporateName  as string) ?? ""
  const businessNumber = (v.footerBusinessNumber as string) ?? ""
  const ceoName        = (v.footerCEOName        as string) ?? ""
  const licenseNumber  = (v.footerLicenseNumber  as string) ?? ""
  const phone          = (v.footerPhone          as string) ?? ""
  const address        = (v.footerAddress        as string) ?? ""

  // ── 정책 링크 (toggle on만 렌더)
  const policies = [
    { enabled: (v.footerTermsToggle        as boolean) ?? false, url: (v.footerTermsUrl        as string) ?? "", label: "이용약관" },
    { enabled: (v.footerPrivacyToggle      as boolean) ?? true,  url: (v.footerPrivacyUrl      as string) ?? "", label: "개인정보처리방침" },
    { enabled: (v.footerEmailRefuseToggle  as boolean) ?? false, url: (v.footerEmailRefuseUrl  as string) ?? "", label: "이메일수집거부" },
    { enabled: (v.footerNonCoveredToggle   as boolean) ?? false, url: (v.footerNonCoveredUrl   as string) ?? "", label: "비급여진료비용안내" },
  ]

  // ── 소셜 미디어 (toggle on만 렌더)
  const socials: Array<{ enabled: boolean; url: string; Icon: typeof BookOpen; label: string }> = [
    { enabled: (v.footerSocialBlogToggle          as boolean) ?? false, url: (v.footerSocialBlogUrl          as string) ?? "", Icon: BookOpen,        label: "네이버 블로그" },
    { enabled: (v.footerSocialYoutubeToggle       as boolean) ?? false, url: (v.footerSocialYoutubeUrl       as string) ?? "", Icon: Youtube,         label: "유튜브" },
    { enabled: (v.footerSocialInstagramToggle     as boolean) ?? false, url: (v.footerSocialInstagramUrl     as string) ?? "", Icon: Instagram,       label: "인스타그램" },
    { enabled: (v.footerSocialKakaoChannelToggle  as boolean) ?? false, url: (v.footerSocialKakaoChannelUrl  as string) ?? "", Icon: MessageCircle,   label: "카카오 채널" },
    { enabled: (v.footerSocialKakaoTalkToggle     as boolean) ?? false, url: (v.footerSocialKakaoTalkUrl     as string) ?? "", Icon: MessageSquare,   label: "카카오 톡톡" },
  ]
  const anySocialOn = socials.some(s => s.enabled)

  let extras: FooterSocialExtra[] = []
  try {
    const raw = (v.footerSocialExtras as string) ?? "[]"
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) extras = parsed
  } catch {
    extras = []
  }

  // ── 카피라이트 (custom/auto 분기)
  const currentYear = new Date().getFullYear()
  const copyrightMode = (v.footerCopyrightMode as string) ?? "auto"
  const copyrightText = (v.footerCopyrightText as string) ?? ""
  const copyright = copyrightMode === "custom" && copyrightText
    ? copyrightText
    : "© " + currentYear + " " + (hospitalName || "TATOA") + ". All rights reserved."

  // ── 로고 분기
  const logoToggle = (v.footerLogoToggle as boolean) ?? false
  const logoImage  = (v.footerLogoImage  as string) ?? ""
  const logoSize   = (v.footerLogoSize   as string) ?? "md"
  const logoHeightPx = isDesktop
    ? (logoSize === "sm" ? 32 : logoSize === "lg" ? 64 : 48)
    : (logoSize === "sm" ? 28 : logoSize === "lg" ? 48 : 36)

  // ── 디자인 토큰 (footerBgColor light/dark 분기)
  const footerBgMode = (v.footerBgColor as string) ?? "dark"
  const isFooterDark = footerBgMode === "dark"
  const bgColor      = isFooterDark ? "#0e0c09" : "#f8f8f6"
  const linkColor    = isFooterDark ? "#f5f0e8" : "#1a1a1a"
  const mutedColor   = isFooterDark ? "rgba(245,240,232,0.6)" : "rgba(26,26,26,0.6)"
  const dimColor     = isFooterDark ? "rgba(245,240,232,0.5)" : "rgba(26,26,26,0.5)"
  const dividerColor = isFooterDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"
  const iconBg       = isFooterDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"

  const policyLinkStyle = { color: linkColor, fontSize: 14, textDecoration: "none", fontWeight: 500 } as React.CSSProperties
  const iconWrapStyle = {
    width: 44, height: 44, borderRadius: "50%", backgroundColor: iconBg,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background-color 0.2s",
    textDecoration: "none",
  } as React.CSSProperties

  return (
    <div style={{
      backgroundColor: bgColor,
      padding: isDesktop ? "60px 15%" : "40px 24px",
      color: linkColor,
    }}>
      {/* 1. 정책 링크 가로 나열 */}
      {policies.some(p => p.enabled) && (
        <div style={{
          display: "flex", flexWrap: "wrap",
          gap: isDesktop ? 24 : 16,
          justifyContent: isDesktop ? "flex-start" : "center",
        }}>
          {policies.map((p, i) => p.enabled ? (
            p.url ? (
              <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" style={policyLinkStyle}>
                {p.label}
              </a>
            ) : (
              <span key={i} style={policyLinkStyle}>{p.label}</span>
            )
          ) : null)}
        </div>
      )}

      {/* 2. 가로선 */}
      <div style={{
        height: 1, backgroundColor: dividerColor,
        margin: isDesktop ? "32px 0" : "24px 0",
      }} />

      {/* 3. 소셜 아이콘 (5고정 + 동적) */}
      {(anySocialOn || extras.some(e => e.enabled)) && (
        <div style={{
          display: "flex", gap: 12,
          marginBottom: isDesktop ? 32 : 24,
          justifyContent: isDesktop ? "flex-start" : "center",
          flexWrap: "wrap",
        }}>
          {socials.map((s, i) => {
            if (!s.enabled) return null
            const IconComp = s.Icon
            return s.url ? (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                aria-label={s.label} style={iconWrapStyle}>
                <IconComp size={20} color={linkColor} />
              </a>
            ) : (
              <div key={i} aria-label={s.label} style={iconWrapStyle}>
                <IconComp size={20} color={linkColor} />
              </div>
            )
          })}
          {extras.filter(e => e.enabled).map(extra => {
            const Icon = getSocialIconByPlatform(extra.platform)
            return extra.url ? (
              <a key={extra.id} href={extra.url} target="_blank" rel="noopener noreferrer"
                aria-label={extra.label} style={iconWrapStyle}>
                <Icon size={20} color={linkColor} />
              </a>
            ) : (
              <div key={extra.id} aria-label={extra.label} style={iconWrapStyle}>
                <Icon size={20} color={linkColor} />
              </div>
            )
          })}
        </div>
      )}

      {/* 4. 로고 또는 병원명 (16-A-5-b 분기) */}
      {logoToggle && logoImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoImage} alt={hospitalName || "logo"}
          style={{
            height: logoHeightPx, width: "auto", objectFit: "contain",
            marginBottom: 16, display: "block",
            marginLeft: !isDesktop ? "auto" : undefined,
            marginRight: !isDesktop ? "auto" : undefined,
          }} />
      ) : (
        hospitalName && (
          <div style={{
            fontSize: isDesktop ? 24 : 20, fontWeight: 600,
            marginBottom: 16,
            textAlign: isDesktop ? "left" : "center",
          }}>
            {hospitalName}
          </div>
        )
      )}

      {/* 5. 사업자 정보 */}
      <div style={{
        fontSize: 13, color: mutedColor, lineHeight: 1.7,
        textAlign: isDesktop ? "left" : "center",
      }}>
        {corporateName && (
          <div style={{ marginBottom: 4 }}>{corporateName}</div>
        )}
        <div style={{
          display: isDesktop ? "flex" : "block",
          flexWrap: "wrap",
          gap: isDesktop ? 16 : 0,
          marginBottom: 4,
        }}>
          {businessNumber && <span>사업자등록번호: {businessNumber}</span>}
          {ceoName        && <span>대표자: {ceoName}</span>}
          {licenseNumber  && <span>의료기관 신고번호: {licenseNumber}</span>}
        </div>
        <div style={{
          display: isDesktop ? "flex" : "block",
          flexWrap: "wrap",
          gap: isDesktop ? 16 : 0,
          marginBottom: 4,
        }}>
          {phone   && <span>대표번호: {phone}</span>}
          {address && <span>주소: {address}</span>}
        </div>
      </div>

      {/* 6. 카피라이트 */}
      <div style={{
        fontSize: 12, color: dimColor,
        marginTop: isDesktop ? 24 : 20,
        textAlign: isDesktop ? "left" : "center",
      }}>
        {copyright}
      </div>
    </div>
  )
}

// ─── SectionPreviewBlock (shared — no DraggableIconInPreview) ─────────────────

export function SectionPreviewBlock({
  sectionId, values, branchName, branchId, isFullscreen = false, device = "mobile", isPageView = false, pageHeroHeight, doctors,
}: {
  sectionId: HomeSectionId
  values: Record<string, FieldValue>
  branchName: string
  branchId: string
  isFullscreen?: boolean
  device?: "mobile" | "desktop"
  isPageView?: boolean
  pageHeroHeight?: string | number
  doctors?: SiteDoctorCardFull[]
}) {
  switch (sectionId) {
    case "hero":        return <PreviewHero       v={values} branchName={branchName} isFullscreen={isFullscreen} device={device} isPageView={isPageView} pageHeroHeight={pageHeroHeight} />
    case "events":      return <PreviewEvents      v={values} device={device} />
    case "philosophy":  return <PreviewPhilosophy v={values} device={device} />
    case "doctors":     return <PreviewLinked     v={values} type="doctors"   branchId={branchId} device={device} doctors={doctors} />
    case "equipment":   return <PreviewLinked     v={values} type="equipment" branchId={branchId} device={device} />
    case "gallery":     return <PreviewGallery    v={values} device={device} />
    case "strengths":   return <PreviewStrengths  v={values} device={device} />
    case "branch-info": return <PreviewBranchInfo v={values} device={device} />
    case "location":    return <PreviewInfo        v={values} device={device} />
    case "footer":      return <PreviewFooter     v={values} device={device} />
    default:            return null
  }
}
