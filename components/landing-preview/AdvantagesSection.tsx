"use client"

import { LPSection } from "./Section"
import { LPSectionImageStack } from "./SectionImageStack"
import type { LandingPreviewData } from "@/lib/landing-preview-types"

type Props = Pick<
  LandingPreviewData,
  "advantages" | "advantagesTitle" | "advantagesBody" | "advantagesTheme" | "advantagesBoxPreset" | "advantagesCardCustom" | "advantagesImagesData" | "advantagesBgImage" | "advantagesBgImageCfg"
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

// Dark theme overrides for presets
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

export function LPAdvantagesSection({
  advantages,
  advantagesTitle,
  advantagesBody,
  advantagesTheme = "light",
  advantagesBoxPreset = "default",
  advantagesCardCustom,
  advantagesImagesData,
  advantagesBgImage,
  advantagesBgImageCfg,
}: Props) {
  if (!advantages?.length) return null

  const isDark  = advantagesTheme === "dark"
  const tone    = isDark ? "dark" : "default"
  const sectionBg = isDark ? undefined : "bg-white"

  const fgColor   = isDark ? "rgba(255,255,255,0.94)" : "var(--lp-fg)"
  const bodyColor = isDark ? "rgba(255,255,255,0.70)" : "color-mix(in oklch, var(--lp-fg) 75%, transparent)"
  const mutedFg   = isDark ? "rgba(255,255,255,0.45)" : "var(--lp-muted-fg)"

  const presetMap = isDark ? BOX_PRESETS_DARK : BOX_PRESETS
  const preset    = presetMap[advantagesBoxPreset] ?? presetMap["default"]
  const c         = advantagesCardCustom
  const finalBg     = c?.bg     ?? preset.bg
  const finalBorder = c?.border ?? preset.border
  const finalShadow = c?.shadow ?? preset.shadow
  const finalBlur   = c?.blur   ?? preset.blur
  const finalRadius = c?.radius ?? preset.radius

  const cardStyle: React.CSSProperties = {
    background:           finalBg,
    border:               finalBorder,
    boxShadow:            finalShadow,
    backdropFilter:       finalBlur > 0 ? `blur(${finalBlur}px)` : undefined,
    WebkitBackdropFilter: finalBlur > 0 ? `blur(${finalBlur}px)` : undefined,
    borderRadius:         `${finalRadius}px`,
  }

  const topShineClass = isDark
    ? "bg-gradient-to-b from-white/10 to-transparent"
    : "bg-gradient-to-b from-neutral-200/50 to-transparent"

  const defaultTitle = (
    <>
      섬세함이 만드는
      <br />
      차이
    </>
  )

  const titleNode = advantagesTitle
    ? advantagesTitle.split("\\n").reduce<React.ReactNode[]>((acc, line, i, arr) => {
        acc.push(line)
        if (i < arr.length - 1) acc.push(<br key={i} />)
        return acc
      }, [])
    : defaultTitle

  return (
    <LPSection
      id="advantages"
      eyebrow="Advantages"
      align="center"
      tone={tone}
      className={sectionBg}
      title={<>{titleNode}</>}
      description={advantagesBody}
      bgImage={advantagesBgImage}
      bgImageCfg={advantagesBgImageCfg}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
        {advantages.map((a) => (
          <article
            key={a.index}
            className="group relative overflow-hidden p-8 text-center transition-all hover:-translate-y-1 sm:p-10"
            style={cardStyle}
          >
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-[20%] min-h-10 ${topShineClass}`} />
            <span className="text-sm font-light tabular-nums" style={{ color: mutedFg }}>
              {a.index}
            </span>
            <h3
              className="mt-3 text-base font-normal leading-snug sm:text-lg"
              style={{ color: fgColor, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
            >
              {a.title}
            </h3>
            <p
              className="mt-4 text-xs leading-relaxed sm:text-sm"
              style={{ color: bodyColor }}
            >
              {a.body}
            </p>
          </article>
        ))}
      </div>

      {advantagesImagesData && advantagesImagesData.length > 0 && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 mt-12">
          <LPSectionImageStack images={advantagesImagesData} />
        </div>
      )}
    </LPSection>
  )
}
