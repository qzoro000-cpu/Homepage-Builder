"use client"

import { LPSection } from "./Section"
import { LPSectionImageStack } from "./SectionImageStack"
import type { LandingPreviewData } from "@/lib/landing-preview-types"

type Props = Pick<
  LandingPreviewData,
  | "tatoaReasons"
  | "whyTatoaEyebrow"
  | "whyTatoaHeadline"
  | "whyTatoaSummary"
  | "whyTatoaTheme"
  | "whyTatoaBoxPreset"
  | "whyTatoaCardCustom"
  | "whyTatoaImage"
  | "whyTatoaImagesData"
  | "whyTatoaBgImage"
  | "whyTatoaBgImageCfg"
>

const BOX_PRESETS: Record<string, { bg: string; border: string; shadow: string; blur: number; radius: number }> = {
  "default": {
    bg:     "rgba(255,255,255,0.70)",
    border: "1px solid rgba(255,255,255,0.55)",
    shadow: "0 2px 20px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    blur:   20,
    radius: 24,
  },
  "flat": {
    bg:     "rgba(255,255,255,1)",
    border: "1px solid rgba(0,0,0,0.08)",
    shadow: "0 1px 4px rgba(0,0,0,0.06)",
    blur:   0,
    radius: 20,
  },
  "outline": {
    bg:     "transparent",
    border: "1px solid rgba(0,0,0,0.15)",
    shadow: "none",
    blur:   0,
    radius: 20,
  },
  "glass-dark": {
    bg:     "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    shadow: "0 2px 20px rgba(0,0,0,0.35)",
    blur:   20,
    radius: 24,
  },
  "glass-gold": {
    bg:     "rgba(201,168,92,0.12)",
    border: "1px solid rgba(201,168,92,0.28)",
    shadow: "0 4px 16px rgba(201,168,92,0.18)",
    blur:   16,
    radius: 24,
  },
  "shadow-soft": {
    bg:     "rgba(255,255,255,0.98)",
    border: "none",
    shadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
    blur:   0,
    radius: 20,
  },
  "shadow-deep": {
    bg:     "rgba(255,255,255,1)",
    border: "none",
    shadow: "0 20px 60px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.10)",
    blur:   0,
    radius: 16,
  },
  "gradient-warm": {
    bg:     "linear-gradient(135deg, rgba(255,252,248,1) 0%, rgba(255,228,196,0.70) 100%)",
    border: "1px solid rgba(255,180,100,0.22)",
    shadow: "0 4px 20px rgba(255,150,80,0.12)",
    blur:   0,
    radius: 20,
  },
  "gradient-cool": {
    bg:     "linear-gradient(135deg, rgba(240,249,255,1) 0%, rgba(206,238,255,0.80) 100%)",
    border: "1px solid rgba(100,180,255,0.22)",
    shadow: "0 4px 20px rgba(80,160,255,0.10)",
    blur:   0,
    radius: 20,
  },
  "gradient-rose": {
    bg:     "linear-gradient(135deg, rgba(255,245,248,1) 0%, rgba(255,212,226,0.75) 100%)",
    border: "1px solid rgba(255,140,170,0.22)",
    shadow: "0 4px 20px rgba(255,100,140,0.12)",
    blur:   0,
    radius: 20,
  },
  "neon-blue": {
    bg:     "rgba(240,248,255,0.85)",
    border: "1px solid rgba(80,160,255,0.55)",
    shadow: "0 0 22px rgba(80,160,255,0.28), 0 0 8px rgba(80,160,255,0.16), inset 0 0 18px rgba(80,160,255,0.06)",
    blur:   8,
    radius: 20,
  },
  "frosted": {
    bg:     "rgba(255,255,255,0.38)",
    border: "1px solid rgba(255,255,255,0.75)",
    shadow: "0 8px 32px rgba(0,0,0,0.08)",
    blur:   40,
    radius: 24,
  },
  "inner-glow": {
    bg:     "rgba(255,255,255,0.96)",
    border: "1px solid rgba(190,170,255,0.38)",
    shadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 2px 20px rgba(180,150,255,0.18)",
    blur:   0,
    radius: 20,
  },
}

const BOX_PRESETS_DARK: Record<string, { bg: string; border: string; shadow: string; blur: number; radius: number }> = {
  "default": {
    bg:     "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.14)",
    shadow: "0 2px 20px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.25)",
    blur:   20,
    radius: 24,
  },
  "flat": {
    bg:     "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    shadow: "0 1px 4px rgba(0,0,0,0.30)",
    blur:   0,
    radius: 20,
  },
  "outline": {
    bg:     "transparent",
    border: "1px solid rgba(255,255,255,0.20)",
    shadow: "none",
    blur:   0,
    radius: 20,
  },
  "glass-dark": {
    bg:     "rgba(0,0,0,0.40)",
    border: "1px solid rgba(255,255,255,0.12)",
    shadow: "0 4px 24px rgba(0,0,0,0.50)",
    blur:   20,
    radius: 24,
  },
  "glass-gold": {
    bg:     "rgba(201,168,92,0.15)",
    border: "1px solid rgba(201,168,92,0.35)",
    shadow: "0 4px 20px rgba(201,168,92,0.22)",
    blur:   16,
    radius: 24,
  },
  "shadow-soft": {
    bg:     "rgba(30,30,42,0.95)",
    border: "none",
    shadow: "0 8px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.28)",
    blur:   0,
    radius: 20,
  },
  "shadow-deep": {
    bg:     "rgba(18,18,28,1)",
    border: "none",
    shadow: "0 20px 60px rgba(0,0,0,0.65), 0 6px 16px rgba(0,0,0,0.42)",
    blur:   0,
    radius: 16,
  },
  "gradient-warm": {
    bg:     "linear-gradient(135deg, rgba(40,28,18,1) 0%, rgba(65,36,12,0.90) 100%)",
    border: "1px solid rgba(255,180,100,0.18)",
    shadow: "0 4px 20px rgba(255,150,80,0.08)",
    blur:   0,
    radius: 20,
  },
  "gradient-cool": {
    bg:     "linear-gradient(135deg, rgba(12,22,38,1) 0%, rgba(18,42,72,0.90) 100%)",
    border: "1px solid rgba(100,180,255,0.18)",
    shadow: "0 4px 20px rgba(80,160,255,0.10)",
    blur:   0,
    radius: 20,
  },
  "gradient-rose": {
    bg:     "linear-gradient(135deg, rgba(38,14,20,1) 0%, rgba(68,18,34,0.90) 100%)",
    border: "1px solid rgba(255,140,170,0.18)",
    shadow: "0 4px 20px rgba(255,100,140,0.10)",
    blur:   0,
    radius: 20,
  },
  "neon-blue": {
    bg:     "rgba(8,18,38,0.88)",
    border: "1px solid rgba(80,160,255,0.65)",
    shadow: "0 0 28px rgba(80,160,255,0.40), 0 0 10px rgba(80,160,255,0.22), inset 0 0 20px rgba(80,160,255,0.08)",
    blur:   8,
    radius: 20,
  },
  "frosted": {
    bg:     "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.28)",
    shadow: "0 8px 32px rgba(0,0,0,0.45)",
    blur:   40,
    radius: 24,
  },
  "inner-glow": {
    bg:     "rgba(28,22,44,0.96)",
    border: "1px solid rgba(180,150,255,0.32)",
    shadow: "0 4px 20px rgba(0,0,0,0.45), inset 0 2px 20px rgba(180,150,255,0.12)",
    blur:   0,
    radius: 20,
  },
}

export function LPWhyTatoaSection({
  tatoaReasons,
  whyTatoaEyebrow,
  whyTatoaHeadline,
  whyTatoaSummary,
  whyTatoaTheme = "dark",
  whyTatoaBoxPreset = "glass-dark",
  whyTatoaCardCustom,
  whyTatoaImage,
  whyTatoaImagesData,
  whyTatoaBgImage,
  whyTatoaBgImageCfg,
}: Props) {
  if (!tatoaReasons?.length) return null

  const isDark    = whyTatoaTheme === "dark"
  const tone      = isDark ? "dark" : "default"
  const sectionBg = isDark ? "bg-black" : "bg-white"

  const fgColor   = isDark ? "rgba(255,255,255,0.94)" : "var(--lp-fg)"
  const bodyColor = isDark ? "rgba(255,255,255,0.65)" : "color-mix(in oklch, var(--lp-fg) 75%, transparent)"
  const numColor  = isDark ? "rgba(255,255,255,0.40)" : "var(--lp-muted-fg)"

  const presetMap = isDark ? BOX_PRESETS_DARK : BOX_PRESETS
  const preset    = presetMap[whyTatoaBoxPreset] ?? presetMap["glass-dark"]
  const c         = whyTatoaCardCustom
  const finalBlur   = c?.blur   ?? preset.blur
  const finalRadius = c?.radius ?? preset.radius

  const cardStyle: React.CSSProperties = {
    background:           c?.bg     ?? preset.bg,
    border:               c?.border ?? preset.border,
    boxShadow:            c?.shadow  ?? preset.shadow,
    backdropFilter:       finalBlur > 0 ? `blur(${finalBlur}px)` : undefined,
    WebkitBackdropFilter: finalBlur > 0 ? `blur(${finalBlur}px)` : undefined,
    borderRadius:         `${preset.radius}px`,
  }

  const eyebrow  = whyTatoaEyebrow || "Why Tatoa"
  const hasImage = Boolean(whyTatoaImage) && !whyTatoaImagesData?.length

  const titleNode = whyTatoaHeadline ? (
    whyTatoaHeadline
  ) : (
    <>
      <span>왜 이 시술은</span>
      <br />
      <span className={isDark ? "lp-metal-text" : ""}>타토아여야 하는가</span>
    </>
  )

  const description = whyTatoaSummary || "장비가 아닌 철학이, 기술이 아닌 태도가 결과를 만듭니다."

  const CardsGrid = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {tatoaReasons.map((r, i) => (
        <div
          key={i}
          className="p-8 sm:p-12 text-center transition-all hover:-translate-y-1"
          style={cardStyle}
        >
          <span
            className="text-2xl font-light tabular-nums"
            style={{ color: numColor }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3
            className="mt-3 text-xl font-semibold sm:text-2xl"
            style={{ color: fgColor }}
          >
            {r.title}
          </h3>
          <p
            className="mt-4 text-sm leading-relaxed sm:text-base"
            style={{ color: bodyColor }}
          >
            {r.body}
          </p>
        </div>
      ))}
    </div>
  )

  return (
    <LPSection
      id="why-tatoa"
      eyebrow={eyebrow}
      tone={tone}
      align="center"
      className={sectionBg}
      title={titleNode}
      description={description}
      bgImage={whyTatoaBgImage}
      bgImageCfg={whyTatoaBgImageCfg}
    >
      {hasImage ? (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">{CardsGrid}</div>
          <div className="lg:col-span-5">
            <div
              className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "var(--lp-muted)",
                boxShadow: "var(--lp-shadow-card)",
              }}
            >
              <img
                src={whyTatoaImage}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      ) : (
        CardsGrid
      )}

      {whyTatoaImagesData && whyTatoaImagesData.length > 0 && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 mt-12">
          <LPSectionImageStack images={whyTatoaImagesData} />
        </div>
      )}
    </LPSection>
  )
}
