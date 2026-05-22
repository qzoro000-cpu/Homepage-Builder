"use client"

import type { LandingPreviewData } from "@/lib/landing-preview-types"

type Props = Pick<
  LandingPreviewData,
  | "treatmentName"
  | "heroImage"
  | "heroBadge"
>

export function LPHeroSection({
  treatmentName,
  heroImage,
  heroBadge,
}: Props) {
  if (!treatmentName) return null

  return (
    <section
      className="lp-hero-section relative w-full overflow-hidden"
      style={{ backgroundColor: "var(--lp-hero-bg)" }}
    >
      {/* 비대칭 앰비언트 글로우 — 우상단(크고 연함) + 좌하단(작고 진함)
          light 테마: 그레이 글로우 / dark 테마: 골드 글로우
          CSS var로 테마별 색상 자동 분기 */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: "var(--lp-glow-tr)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: "var(--lp-glow-bl)" }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-4 pb-4 lg:px-8 lg:pt-8 lg:pb-8">

        {/* 이미지 프레임 — full-width, rounded-3xl */}
        <div
          className="relative aspect-[6/7] w-full overflow-hidden rounded-3xl"
          style={{
            backgroundColor: "var(--lp-muted)",
            boxShadow: "var(--lp-shadow-float)",
          }}
        >
          {heroImage ? (
            <img
              src={heroImage}
              alt={treatmentName}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="lp-font-display text-7xl font-light tracking-[0.28em] select-none"
                style={{ color: "var(--lp-fg)", opacity: 0.10 }}
              >
                TATOA
              </span>
            </div>
          )}

          {/* 하단 그라데이션 오버레이 */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "var(--lp-grad-overlay)" }}
          />

          {/* 뱃지 — 이미지 좌상단 */}
          {heroBadge && (
            <div className="absolute left-5 top-5 lg:left-7 lg:top-7">
              <span
                className="inline-flex items-center rounded-full px-4 py-2 text-[10px] font-medium uppercase tracking-[0.28em] text-white"
                style={{
                  background: "rgba(0,0,0,0.35)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.28)",
                }}
              >
                {heroBadge}
              </span>
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
