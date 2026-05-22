"use client"

import type { LPSectionImage } from "@/lib/landing-preview-types"

// 효과 프리셋 → CSS filter
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

function buildFilter(cfgJson?: string): React.CSSProperties {
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

type Props = {
  images: LPSectionImage[]
  /** 캡션 텍스트 색상 (섹션 테마에 맞춰 호출부에서 전달) */
  captionColor?: string
}

/**
 * 섹션 이미지 스택 — 랜딩 미리보기 전용
 * · 여백 없음 (이미지 간 border-top 구분선만)
 * · 가로: 컨테이너 100%  /  세로: 원본 비율 그대로 (자르지 않음)
 * · 캡션: 이미지 하단 중앙 오버레이
 */
export function LPSectionImageStack({ images, captionColor }: Props) {
  if (!images.length) return null

  return (
    <div style={{ overflow: "hidden" }}>
      {images.map((img, i) => (
        <div
          key={i}
          style={{
            position:  "relative",
            borderTop: i > 0 ? "1px solid rgba(0,0,0,0.06)" : undefined,
          }}
        >
          {/* 이미지 — 원본 비율, 세로 무제한 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt=""
            loading="lazy"
            style={{
              display:   "block",
              width:     "100%",
              height:    "auto",
              ...buildFilter(img.cfg),
            }}
          />

          {/* 캡션 — 이미지 하단 중앙 */}
          {img.caption && (
            <div
              style={{
                position:        "absolute",
                bottom:          0,
                left:            0,
                right:           0,
                padding:         "20px 16px 12px",
                background:      "linear-gradient(to top, rgba(0,0,0,0.52) 0%, transparent 100%)",
                textAlign:       "center",
              }}
            >
              <p
                style={{
                  margin:        0,
                  fontSize:      11,
                  lineHeight:    1.5,
                  letterSpacing: "0.04em",
                  color:         captionColor ?? "rgba(255,255,255,0.88)",
                }}
                dangerouslySetInnerHTML={{ __html: img.caption }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
