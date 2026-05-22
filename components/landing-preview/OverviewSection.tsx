"use client"

import { LPSection } from "./Section"
import { LPSectionImageStack } from "./SectionImageStack"
import type { LandingPreviewData } from "@/lib/landing-preview-types"

type Props = Pick<LandingPreviewData, "overviewTitle" | "overviewBody" | "overviewImage" | "overviewImgCfg" | "overviewImagesData" | "overviewTheme" | "overviewBgImage" | "overviewBgImageCfg" | "keyPoints">

// 이미지 효과 프리셋 → CSS filter 문자열
const EFFECT_FILTERS: Record<string, string> = {
  none:     "",
  bright:   "brightness(1.25) contrast(1.05)",
  dark:     "brightness(0.72) contrast(1.1)",
  bw:       "grayscale(1)",
  warm:     "sepia(0.28) saturate(1.25) brightness(1.05)",
  cool:     "saturate(0.75) hue-rotate(-18deg) brightness(1.05)",
  sharp:    "contrast(1.18) saturate(1.12)",
  soft:     "brightness(1.08) saturate(0.88) contrast(0.92)",
  vintage:  "sepia(0.55) contrast(0.9) brightness(0.95) saturate(0.85)",
  faded:    "brightness(1.1) saturate(0.6) contrast(0.85)",
  dramatic: "contrast(1.35) saturate(1.2) brightness(0.9)",
  matte:    "contrast(0.88) saturate(0.8) brightness(1.05)",
  cinema:   "contrast(1.12) saturate(0.72) brightness(0.85) sepia(0.12)",
  ethereal: "brightness(1.15) saturate(0.55) contrast(0.9) hue-rotate(8deg)",
}

function buildImgStyle(cfgJson?: string): React.CSSProperties {
  if (!cfgJson) return {}
  try {
    const c = JSON.parse(cfgJson)
    const preset = EFFECT_FILTERS[c.effectId ?? "none"] ?? ""
    const custom = `brightness(${c.brightness ?? 100}%) contrast(${c.contrast ?? 100}%) saturate(${c.saturate ?? 100}%) hue-rotate(${c.hue ?? 0}deg)`
    return {
      filter:         [preset, custom].filter(Boolean).join(" ") || undefined,
      objectPosition: c.position ?? "center",
    }
  } catch { return {} }
}

export function LPOverviewSection({ overviewTitle, overviewBody, overviewImage, overviewImgCfg, overviewImagesData, overviewTheme, overviewBgImage, overviewBgImageCfg, keyPoints }: Props) {
  if (!overviewTitle && !overviewBody && !keyPoints?.length) return null

  const isDark  = overviewTheme === "dark"
  const tone    = isDark ? "dark" : "elevated"

  // 텍스트 색상
  const fgColor      = isDark ? "rgba(255,255,255,0.94)" : "var(--lp-fg)"
  const bodyColor    = isDark ? "rgba(255,255,255,0.70)" : "color-mix(in oklch, var(--lp-fg) 75%, transparent)"
  const mutedColor   = isDark ? "rgba(255,255,255,0.45)" : "var(--lp-muted-fg)"

  // 키포인트 카드 스타일
  const cardBg       = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(255,255,255,0.72)"
  const cardBorder   = isDark
    ? "1px solid rgba(255,255,255,0.10)"
    : "1px solid rgba(0,0,0,0.06)"
  const cardTopShine = isDark
    ? "bg-gradient-to-b from-white/10 to-transparent"
    : "bg-gradient-to-b from-neutral-200/50 to-transparent"

  return (
    <LPSection id="overview" eyebrow="Overview" tone={tone} bgImage={overviewBgImage} bgImageCfg={overviewBgImageCfg}>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7 text-center">
          {overviewTitle && (
            <h2
              className="lp-font-display text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
              style={{ color: fgColor }}
            >
              {overviewTitle}
            </h2>
          )}
          {overviewBody && (
            <p
              className="mt-8 text-base leading-relaxed sm:text-lg"
              style={{ color: bodyColor }}
            >
              {overviewBody}
            </p>
          )}

          {keyPoints?.length ? (
            <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {keyPoints.map((p, i) => (
                <li
                  key={i}
                  className="relative overflow-hidden rounded-2xl p-6 text-center"
                  style={{
                    background: cardBg,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: cardBorder,
                  }}
                >
                  <div className={`pointer-events-none absolute inset-x-0 top-0 h-[20%] min-h-8 ${cardTopShine}`} />
                  <div
                    className="text-[10px] uppercase tracking-[0.28em]"
                    style={{ color: mutedColor }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3
                    className="mt-3 text-base font-semibold"
                    style={{ color: fgColor }}
                  >
                    {p.title}
                  </h3>
                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: mutedColor }}
                  >
                    {p.body}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* 다중 이미지가 없을 때만 기존 카드형 이미지 표시 */}
        {overviewImage && !(overviewImagesData?.length) && (
          <div className="lg:col-span-5">
            <div
              className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-[var(--lp-shadow-card)]"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "var(--lp-muted)" }}
            >
              <img
                src={overviewImage}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
                style={buildImgStyle(overviewImgCfg)}
              />
            </div>
          </div>
        )}
      </div>

      {/* 다중 이미지 스택 — 여백 없음, 세로 원본 비율 */}
      {overviewImagesData && overviewImagesData.length > 0 && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 mt-12">
          <LPSectionImageStack
            images={overviewImagesData}
            captionColor={isDark ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.90)"}
          />
        </div>
      )}
    </LPSection>
  )
}
