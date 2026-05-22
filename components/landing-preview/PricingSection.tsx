"use client"

import { useState } from "react"
import { LPSection } from "./Section"
import type { LandingPreviewData, LPProgram } from "@/lib/landing-preview-types"
import { useCart } from "@/lib/cart-store"

type Props = Pick<
  LandingPreviewData,
  | "pricingPrograms"
  | "pricingNote"
  | "ctaPrimary"
  | "pricingEyebrow"
  | "pricingHeadline"
  | "pricingEnName"
  | "pricingBody"
  | "pricingTheme"
  | "pricingBoxPreset"
  | "pricingCardCustom"
  | "treatmentName"
  | "category"
  | "heroImage"
> & {
  desktopLayout?: "sidebar"
}

const BOX_PRESETS: Record<string, { bg: string; border: string; shadow: string; blur: number; radius: number }> = {
  "default": { bg: "var(--lp-card)", border: "1px solid var(--lp-border)", shadow: "var(--lp-shadow-card)", blur: 0, radius: 20 },
  "flat":    { bg: "rgba(255,255,255,1)", border: "1px solid rgba(0,0,0,0.08)", shadow: "0 1px 4px rgba(0,0,0,0.06)", blur: 0, radius: 20 },
  "outline": { bg: "transparent", border: "1px solid rgba(0,0,0,0.15)", shadow: "none", blur: 0, radius: 20 },
  "glass-dark":  { bg: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", shadow: "0 2px 20px rgba(0,0,0,0.35)", blur: 20, radius: 20 },
  "glass-gold":  { bg: "rgba(201,168,92,0.12)", border: "1px solid rgba(201,168,92,0.28)", shadow: "0 4px 16px rgba(201,168,92,0.18)", blur: 16, radius: 20 },
  "shadow-soft": { bg: "rgba(255,255,255,0.98)", border: "none", shadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)", blur: 0, radius: 20 },
  "shadow-deep": { bg: "rgba(255,255,255,1)", border: "none", shadow: "0 20px 60px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.10)", blur: 0, radius: 16 },
  "gradient-warm": { bg: "linear-gradient(135deg, rgba(255,252,248,1) 0%, rgba(255,228,196,0.70) 100%)", border: "1px solid rgba(255,180,100,0.22)", shadow: "0 4px 20px rgba(255,150,80,0.12)", blur: 0, radius: 20 },
  "gradient-cool": { bg: "linear-gradient(135deg, rgba(240,249,255,1) 0%, rgba(206,238,255,0.80) 100%)", border: "1px solid rgba(100,180,255,0.22)", shadow: "0 4px 20px rgba(80,160,255,0.10)", blur: 0, radius: 20 },
  "gradient-rose": { bg: "linear-gradient(135deg, rgba(255,245,248,1) 0%, rgba(255,212,226,0.75) 100%)", border: "1px solid rgba(255,140,170,0.22)", shadow: "0 4px 20px rgba(255,100,140,0.12)", blur: 0, radius: 20 },
  "neon-blue":  { bg: "rgba(240,248,255,0.85)", border: "1px solid rgba(80,160,255,0.55)", shadow: "0 0 22px rgba(80,160,255,0.28), 0 0 8px rgba(80,160,255,0.16), inset 0 0 18px rgba(80,160,255,0.06)", blur: 8, radius: 20 },
  "frosted":    { bg: "rgba(255,255,255,0.38)", border: "1px solid rgba(255,255,255,0.75)", shadow: "0 8px 32px rgba(0,0,0,0.08)", blur: 40, radius: 20 },
  "inner-glow": { bg: "rgba(255,255,255,0.96)", border: "1px solid rgba(190,170,255,0.38)", shadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 2px 20px rgba(180,150,255,0.18)", blur: 0, radius: 20 },
}

export function LPPricingSection({
  pricingPrograms,
  pricingNote,
  ctaPrimary,
  pricingEyebrow,
  pricingHeadline,
  pricingEnName,
  pricingBody,
  pricingTheme = "light",
  pricingBoxPreset = "default",
  pricingCardCustom,
  treatmentName = "",
  category,
  heroImage,
  desktopLayout,
}: Props) {
  if (!pricingPrograms?.length) return null

  const preset      = BOX_PRESETS[pricingBoxPreset] ?? BOX_PRESETS["default"]
  const c           = pricingCardCustom
  const finalBlur   = c?.blur   ?? preset.blur
  const finalRadius = c?.radius ?? preset.radius

  const eyebrow     = pricingEyebrow || "Programs & Pricing"
  const titleNode   = pricingHeadline
    ? <span dangerouslySetInnerHTML={{ __html: pricingHeadline }} />
    : <>단정한 가격,<br />정직한 설계</>
  const description = pricingBody || "필요한 만큼 충분히, 그 이상은 권하지 않습니다."

  const isDark = pricingTheme === "dark"
  const fgPrimary = isDark ? "#fff" : "var(--lp-fg)"
  const fgMuted   = isDark ? "rgba(255,255,255,0.6)" : "var(--lp-muted-fg)"

  const cardList = (
    <div className="space-y-4">
      {pricingPrograms.map((program, idx) => (
        <PricingCard
          key={program.name + idx}
          program={program}
          ctaPrimary={ctaPrimary}
          preset={preset}
          cardCustom={c}
          finalBlur={finalBlur}
          finalRadius={finalRadius}
          treatmentName={treatmentName}
          treatmentId={`treatment-${treatmentName}`}
          category={category}
          heroImage={heroImage}
        />
      ))}
      {pricingNote && (
        <p className="pt-2 text-center text-xs" style={{ color: fgMuted }}>
          {pricingNote}
        </p>
      )}
    </div>
  )

  if (desktopLayout === "sidebar") {
    return (
      <div
        className="flex flex-col"
        style={{
          background: isDark ? "#080808" : "#fff",
          maxHeight: "inherit",
          height: "100%",
        }}
      >
        {/* Fixed header */}
        <div
          className="flex-shrink-0 px-6 pt-8 pb-5 text-center"
          style={{
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
          }}
        >
          {/* Eyebrow */}
          <div
            className="mb-4 flex items-center justify-center gap-3 text-[10px] font-medium uppercase tracking-[0.32em]"
            style={{ color: fgMuted }}
          >
            <span className="h-px w-6 bg-current opacity-40" />
            <span dangerouslySetInnerHTML={{ __html: eyebrow }} />
            <span className="h-px w-6 bg-current opacity-40" />
          </div>
          {/* Headline */}
          <h2
            className="lp-font-display text-2xl font-light leading-[1.15] tracking-tight"
            style={{ color: fgPrimary }}
          >
            {titleNode}
          </h2>
          {/* English treatment name */}
          {pricingEnName && (
            <p
              className="mt-1 text-sm font-medium tracking-wide"
              style={{ color: fgMuted }}
              dangerouslySetInnerHTML={{ __html: pricingEnName }}
            />
          )}
          {/* Description */}
          <div
            className="mt-2 text-xs leading-relaxed lp-rich-text"
            style={{ color: fgMuted }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
        {/* Scrollable cards — scrollbar hidden, wheel still works */}
        <div className="lp-hide-scrollbar flex-1 overflow-y-auto px-6 py-5">
          {cardList}
        </div>
      </div>
    )
  }

  return (
    <LPSection
      id="pricing"
      eyebrow={eyebrow}
      align="center"
      tone={isDark ? "dark" : "elevated"}
      title={<>{titleNode}</>}
    >
      {/* enName + description rendered here so enName appears above description */}
      {(pricingEnName || description) && (
        <div className="mx-auto -mt-10 mb-12 max-w-3xl text-center">
          {pricingEnName && (
            <p
              className="mb-2 text-sm font-medium tracking-wide lp-rich-text"
              style={{ color: fgMuted }}
              dangerouslySetInnerHTML={{ __html: pricingEnName }}
            />
          )}
          <div
            className="text-base leading-relaxed lp-rich-text"
            style={{ color: fgMuted }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      )}
      <div className="mx-auto w-full max-w-lg space-y-4">
        {pricingPrograms.map((program, idx) => (
          <PricingCard
            key={program.name + idx}
            program={program}
            ctaPrimary={ctaPrimary}
            preset={preset}
            cardCustom={c}
            finalBlur={finalBlur}
            finalRadius={finalRadius}
            treatmentName={treatmentName}
            treatmentId={`treatment-${treatmentName}`}
            category={category}
            heroImage={heroImage}
          />
        ))}
      </div>

      {pricingNote && (
        <p className="mt-6 text-center text-xs" style={{ color: fgMuted }}>
          {pricingNote}
        </p>
      )}
    </LPSection>
  )
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

function deriveCardBg(p: LPProgram, fallback: string): string {
  if (!p.cardBgMode || p.cardBgMode === "preset") return fallback
  if (p.cardBgMode === "transparent") return "transparent"
  const op = (p.cardBgOpacity ?? 85) / 100
  const c1 = p.cardBgHex ?? "#ffffff"
  if (p.cardBgMode === "gradient") {
    const c2  = p.cardBgHex2 ?? "#e0e0ff"
    const dir = p.cardBgGradDir ?? "135deg"
    return `linear-gradient(${dir}, ${hexToRgba(c1, op)}, ${hexToRgba(c2, op)})`
  }
  return hexToRgba(c1, op)
}

function deriveCardBorder(p: LPProgram, fallback: string): string {
  if (p.cardBorderOn === undefined) return fallback
  if (!p.cardBorderOn) return "none"
  const w   = p.cardBorderW ?? 1
  const hex = p.cardBorderHex ?? "#cccccc"
  return `${w}px solid ${hexToRgba(hex, 0.60)}`
}

function deriveCardShadow(p: LPProgram, fallback: string): string {
  if (!p.cardShadowMode) return fallback
  if (p.cardShadowMode === "none") return "none"
  const hex = p.cardShadowHex ?? "#000000"
  const h   = hex.replace("#", "")
  const r   = parseInt(h.slice(0, 2), 16)
  const g   = parseInt(h.slice(2, 4), 16)
  const b   = parseInt(h.slice(4, 6), 16)
  const rgb = `${r},${g},${b}`
  if (p.cardShadowMode === "soft") return `0 4px 20px rgba(${rgb},0.14)`
  if (p.cardShadowMode === "deep") return `0 20px 60px rgba(${rgb},0.26), 0 6px 16px rgba(${rgb},0.12)`
  if (p.cardShadowMode === "neon") return `0 0 22px rgba(${rgb},0.30), 0 0 8px rgba(${rgb},0.18), inset 0 0 18px rgba(${rgb},0.07)`
  return fallback
}

function CartIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function PricingCard({
  program: p,
  ctaPrimary,
  preset,
  cardCustom: c,
  finalBlur,
  finalRadius,
  treatmentName,
  treatmentId,
  category,
  heroImage,
}: {
  program: LPProgram
  ctaPrimary?: { label: string; href: string }
  preset: typeof BOX_PRESETS[string]
  cardCustom?: Props["pricingCardCustom"]
  finalBlur: number
  finalRadius: number
  treatmentName: string
  treatmentId: string
  category?: string
  heroImage?: string
}) {
  const { addItem, items } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const hasCardPreset = Boolean(p.cardPreset && BOX_PRESETS[p.cardPreset])
  const isHighlight   = !hasCardPreset && Boolean(p.highlight)
  const cardPreset    = hasCardPreset ? BOX_PRESETS[p.cardPreset!]! : preset

  // Per-card custom overrides take priority over global section custom (c)
  const perCardBlur   = p.cardBlur   ?? c?.blur   ?? cardPreset.blur
  const perCardRadius = p.cardRadius ?? c?.radius ?? cardPreset.radius

  const perCardBg     = deriveCardBg(p,     c?.bg     ?? cardPreset.bg)
  const perCardBorder = deriveCardBorder(p, c?.border ?? cardPreset.border)
  const perCardShadow = deriveCardShadow(p, c?.shadow ?? cardPreset.shadow)

  const discountRate = (p.originalPriceNum && p.priceNum && p.originalPriceNum > p.priceNum)
    ? Math.ceil((1 - p.priceNum / p.originalPriceNum) * 100)
    : 0

  const cartId = `${treatmentId}_${p.name}`
  const inCart = items.some((i) => i.id === cartId)

  const normalStyle: React.CSSProperties = {
    background:           perCardBg,
    border:               perCardBorder,
    boxShadow:            perCardShadow,
    backdropFilter:       perCardBlur > 0 ? `blur(${perCardBlur}px)` : undefined,
    WebkitBackdropFilter: perCardBlur > 0 ? `blur(${perCardBlur}px)` : undefined,
    borderRadius:         `${perCardRadius}px`,
    overflow:             "hidden",
    transition:           "transform 0.25s ease, box-shadow 0.25s ease",
  }

  const highlightStyle: React.CSSProperties = {
    background:   "var(--lp-fg)",
    color:        "var(--lp-bg)",
    boxShadow:    "var(--lp-shadow-float)",
    borderRadius: `${perCardRadius}px`,
    overflow:     "hidden",
    transition:   "transform 0.25s ease, box-shadow 0.25s ease",
  }

  const cardStyle = isHighlight ? highlightStyle : normalStyle

  const fgColor     = isHighlight ? "rgba(255,255,255,0.94)" : "var(--lp-fg)"
  const mutedColor  = isHighlight ? "rgba(255,255,255,0.55)" : "var(--lp-muted-fg)"
  const strikeColor = isHighlight ? "rgba(255,255,255,0.40)" : "var(--lp-muted-fg)"
  const divColor    = isHighlight ? "rgba(255,255,255,0.15)" : "var(--lp-border)"
  const dashColor   = isHighlight ? "rgba(255,255,255,0.40)" : "color-mix(in oklch, var(--lp-fg) 35%, transparent)"
  const itemColor   = isHighlight ? "rgba(255,255,255,0.88)" : "color-mix(in oklch, var(--lp-fg) 80%, transparent)"

  const cardCtaHref  = p.ctaHref  ?? ctaPrimary?.href
  const cardCtaLabel = p.ctaLabel ?? ctaPrimary?.label

  function handleAddToCart() {
    if (inCart) return
    addItem({
      id:              cartId,
      treatmentId,
      programName:     p.name,
      treatmentName,
      category,
      description:     p.includes[0],
      image:           heroImage,
      price:           p.price,
      priceNum:        p.priceNum ?? 0,
      originalPrice:   p.originalPrice,
      originalPriceNum: p.originalPriceNum,
    })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  return (
    <div className="group hover:-translate-y-1 hover:shadow-xl" style={cardStyle}>
      {/* 카드 본문 */}
      <div style={{ padding: `${Math.max(20, perCardRadius * 0.8)}px ${Math.max(20, perCardRadius * 0.8)}px 0` }}>
        {/* 태그 */}
        {p.tag && (
          <span
            style={{
              display:       "inline-flex",
              alignItems:    "center",
              borderRadius:  "9999px",
              padding:       "3px 10px",
              fontSize:      10,
              fontWeight:    600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom:  10,
              ...(isHighlight
                ? { border: "1px solid rgba(255,255,255,0.30)", color: "rgba(255,255,255,0.85)" }
                : { background: "var(--lp-accent, #c9a85c)", color: "#fff" }),
            }}
          >
            {p.tag}
          </span>
        )}

        {/* 시술명 */}
        <h3 style={{
          fontSize:   p.nameSizePx ?? 17,
          fontWeight: p.nameWeight ? Number(p.nameWeight) : 700,
          fontStyle:  p.nameItalic ? "italic" : undefined,
          fontFamily: p.nameFont ?? undefined,
          color:      fgColor,
          lineHeight: 1.35,
          marginBottom: 4,
        }}>
          {p.name}
        </h3>

        {/* 시술 시간 */}
        {p.duration && (
          <p style={{ fontSize: 12, color: mutedColor, marginBottom: 8 }}>{p.duration}</p>
        )}

        {/* 포함 사항 목록 */}
        {p.includes.length > 0 && (
          <ul style={{ marginTop: 10, marginBottom: 4, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {p.includes.map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13 }}>
                <span style={{ marginTop: 6, flexShrink: 0, width: 14, height: 1, background: dashColor, display: "block" }} />
                <span style={{ color: itemColor }} dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 가격 + 버튼 (하단 고정) */}
      <div
        style={{
          display:       "flex",
          alignItems:    "center",
          justifyContent: "space-between",
          gap:            10,
          padding:        `14px ${Math.max(20, perCardRadius * 0.8)}px ${Math.max(18, perCardRadius * 0.8)}px`,
          borderTop:      `1px solid ${divColor}`,
          marginTop:      14,
        }}
      >
        {/* 가격 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {p.originalPrice && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: strikeColor, textDecoration: "line-through" }}>
                {p.originalPrice}
              </span>
              {discountRate > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#ff3b30", letterSpacing: "0.02em" }}>
                  {discountRate}% OFF
                </span>
              )}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{
              fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em",
              color: p.priceColor ?? fgColor,
            }}>
              {p.price}
            </span>
            {p.priceNote && (
              <span style={{ fontSize: 11, color: mutedColor }}>{p.priceNote}</span>
            )}
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {/* 기존 CTA 버튼 */}
          {cardCtaHref && cardCtaLabel && (
            <a
              href={cardCtaHref}
              style={{
                display:        "inline-flex",
                alignItems:     "center",
                justifyContent: "center",
                height:         38,
                padding:        "0 14px",
                borderRadius:   "9999px",
                fontSize:       12,
                fontWeight:     600,
                textDecoration: "none",
                whiteSpace:     "nowrap",
                letterSpacing:  "0.01em",
                ...(isHighlight
                  ? { background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.90)" }
                  : { border: "1px solid var(--lp-fg)", color: "var(--lp-fg)", background: "transparent" }),
              }}
            >
              {cardCtaLabel}
            </a>
          )}

          {/* 시술 담기 버튼 */}
          <button
            onClick={handleAddToCart}
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              justifyContent: "center",
              width:          38,
              height:         38,
              padding:        0,
              borderRadius:   "9999px",
              border:         "none",
              cursor:         inCart ? "default" : "pointer",
              transition:     "background 0.2s ease, transform 0.15s ease",
              transform:      justAdded ? "scale(0.95)" : "scale(1)",
              ...(inCart
                ? { background: "rgba(52,199,89,0.15)", color: "rgb(52,199,89)" }
                : isHighlight
                ? { background: "rgba(255,255,255,0.97)", color: "#111" }
                : { background: "var(--lp-fg)", color: "var(--lp-bg, #fff)" }),
            }}
          >
            {inCart ? <CheckIcon size={14} /> : <CartIcon size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
