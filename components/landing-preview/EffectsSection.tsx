"use client"

import { LPSection } from "./Section"
import { LPSectionImageStack } from "./SectionImageStack"
import type { LandingPreviewData } from "@/lib/landing-preview-types"

type Props = Pick<
  LandingPreviewData,
  | "effects"
  | "effectItems"
  | "effectsEyebrow"
  | "effectsHeadline"
  | "effectsDescription"
  | "effectsTitleColor"
  | "effectsTitleFontSize"
  | "effectsTitleFontFamily"
  | "effectsTheme"
  | "effectsBoxPreset"
  | "effectsBoxCustom"
  | "effectsImage"
  | "effectsImagesData"
  | "effectsBgImage"
  | "effectsBgImageCfg"
>

// ── 카드 박스 스타일 프리셋 (장점 섹션과 동일 체계) ─────────────────────────────
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

// ── 섹션 제목 스타일 맵 ──────────────────────────────────────────────────────
const TITLE_FONT_SIZE_MAP: Record<string, string> = {
  sm: "clamp(1.5rem,  3vw, 2.25rem)",
  lg: "clamp(2.5rem,  5vw, 3.5rem)",
  xl: "clamp(3rem,    6vw, 4.5rem)",
}

const TITLE_FONT_FAMILY_MAP: Record<string, string> = {
  sans:  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
}

export function LPEffectsSection({
  effects,
  effectItems,
  effectsEyebrow,
  effectsHeadline,
  effectsDescription,
  effectsTitleColor,
  effectsTitleFontSize,
  effectsTitleFontFamily,
  effectsTheme,
  effectsBoxPreset,
  effectsBoxCustom,
  effectsImage,
  effectsImagesData,
  effectsBgImage,
  effectsBgImageCfg,
}: Props) {
  if (!effectItems?.length && !effects?.length) return null

  const isDark = (effectsTheme ?? "dark") === "dark"
  const tone   = isDark ? "dark" : "elevated"
  const items  = effectItems ?? effects?.map((t) => ({ title: t, description: "" as string, cardPreset: "default" })) ?? []

  // ── 카드 스타일 ──
  const presetMap = isDark ? BOX_PRESETS_DARK : BOX_PRESETS
  const preset    = presetMap[effectsBoxPreset ?? "default"] ?? presetMap["default"]
  const c         = effectsBoxCustom
  const finalBlur   = c?.blur   ?? preset.blur
  const finalRadius = c?.radius ?? preset.radius

  const cardStyle: React.CSSProperties = {
    background:           c?.bg     ?? preset.bg,
    border:               c?.border ?? preset.border,
    boxShadow:            c?.shadow  ?? preset.shadow,
    backdropFilter:       finalBlur > 0 ? `blur(${finalBlur}px)` : undefined,
    WebkitBackdropFilter: finalBlur > 0 ? `blur(${finalBlur}px)` : undefined,
    borderRadius:         `${finalRadius}px`,
  }

  const fgColor    = isDark ? "rgba(255,255,255,0.94)" : "var(--lp-fg)"
  const bodyColor  = isDark ? "rgba(255,255,255,0.70)" : "color-mix(in oklch, var(--lp-fg) 75%, transparent)"
  const mutedFg    = isDark ? "rgba(255,255,255,0.45)" : "var(--lp-muted-fg)"
  const topShineClass = isDark
    ? "bg-gradient-to-b from-white/10 to-transparent"
    : "bg-gradient-to-b from-neutral-200/50 to-transparent"

  // ── 섹션 제목 스타일 ──
  const titleStyle: React.CSSProperties = {
    ...(effectsTitleColor      ? { color:      effectsTitleColor } : {}),
    ...(effectsTitleFontSize   && TITLE_FONT_SIZE_MAP[effectsTitleFontSize]
        ? { fontSize:   TITLE_FONT_SIZE_MAP[effectsTitleFontSize] } : {}),
    ...(effectsTitleFontFamily && TITLE_FONT_FAMILY_MAP[effectsTitleFontFamily]
        ? { fontFamily: TITLE_FONT_FAMILY_MAP[effectsTitleFontFamily] } : {}),
  }

  const headline    = effectsHeadline   ?? "기대할 수 있는 변화와 정돈된 진행 흐름"
  const description = effectsDescription ?? "시술의 흐름을 투명하게 공유합니다. 변화는 강요되지 않고, 회복은 단정합니다."

  // ── 1열 카드 그리드 ──
  const CardsGrid = (
    <div className="grid grid-cols-1 gap-5 lg:gap-6">
      {items.map((item, i) => (
        <article
          key={i}
          className="group relative overflow-hidden transition-all hover:-translate-y-0.5"
          style={cardStyle}
        >
          <div className={`pointer-events-none absolute inset-x-0 top-0 h-[30%] min-h-8 ${topShineClass}`} />
          {/* 가로 레이아웃: 번호 | 제목 + 설명 */}
          <div className="relative flex items-start gap-5 px-7 py-6 sm:gap-7 sm:px-10 sm:py-7">
            <span
              className="shrink-0 mt-0.5 text-xs font-light tabular-nums"
              style={{ color: mutedFg }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 text-left">
              <h3
                className="text-base font-semibold leading-snug sm:text-lg lp-rich-text"
                style={{ color: fgColor }}
                dangerouslySetInnerHTML={{ __html: item.title }}
              />
              {item.description && (
                <div
                  className="mt-2 text-xs leading-relaxed sm:text-sm lp-rich-text"
                  style={{ color: bodyColor }}
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  )

  return (
    <LPSection
      id="effects"
      eyebrow={effectsEyebrow ?? "Effects & Process"}
      tone={tone}
      align="center"
      title={<>{headline}</>}
      titleStyle={Object.keys(titleStyle).length > 0 ? titleStyle : undefined}
      description={description}
      bgImage={effectsBgImage}
      bgImageCfg={effectsBgImageCfg}
    >
      {effectsImage && !effectsImagesData?.length ? (
        /* 이미지 있을 때: 12컬럼 그리드 (다중 이미지가 없을 때만) */
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            {CardsGrid}
          </div>
          <div className="lg:col-span-5">
            <div
              className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "var(--lp-muted)",
                boxShadow: "var(--lp-shadow-card)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={effectsImage}
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

      {/* 다중 이미지 스택 */}
      {effectsImagesData && effectsImagesData.length > 0 && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 mt-12">
          <LPSectionImageStack images={effectsImagesData} />
        </div>
      )}
    </LPSection>
  )
}
