"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import type { SectionBgImageCfg } from "@/lib/landing-preview-types"

// ── 배경 이미지 CSS 헬퍼 ─────────────────────────────────────────────────────
function buildBgFilter(c: SectionBgImageCfg): string | undefined {
  const parts: string[] = []
  if (c.blur        != null && c.blur        > 0)   parts.push(`blur(${c.blur}px)`)
  if (c.brightness  != null && c.brightness !== 100) parts.push(`brightness(${c.brightness}%)`)
  if (c.contrast    != null && c.contrast   !== 100) parts.push(`contrast(${c.contrast}%)`)
  if (c.saturate    != null && c.saturate   !== 100) parts.push(`saturate(${c.saturate}%)`)
  if (c.hue         != null && c.hue         !== 0)  parts.push(`hue-rotate(${c.hue}deg)`)
  return parts.length ? parts.join(" ") : undefined
}

function buildOverlayBg(color: string, opacity: number, gradient?: SectionBgImageCfg["overlayGradient"]): string {
  const hex = color.replace("#", "")
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const alpha = Math.round((opacity / 100) * 255).toString(16).padStart(2, "0")
  const solid = `#${hex}${alpha}`
  const transparent = `rgba(${r},${g},${b},0)`
  const rgba = `rgba(${r},${g},${b},${(opacity / 100).toFixed(3)})`
  switch (gradient) {
    case "to-bottom": return `linear-gradient(to bottom, ${transparent}, ${rgba})`
    case "to-top":    return `linear-gradient(to top, ${transparent}, ${rgba})`
    case "to-right":  return `linear-gradient(to right, ${transparent}, ${rgba})`
    case "to-left":   return `linear-gradient(to left, ${transparent}, ${rgba})`
    case "radial":    return `radial-gradient(ellipse at center, ${transparent}, ${rgba})`
    default:          return solid
  }
}

type SectionProps = {
  id?: string
  eyebrow?: string
  title?: ReactNode
  titleStyle?: React.CSSProperties
  description?: string
  children?: ReactNode
  className?: string
  align?: "left" | "center"
  tone?: "default" | "elevated" | "dark"
  /** 섹션 배경 이미지 URL */
  bgImage?: string
  /** 섹션 배경 이미지 편집 설정 */
  bgImageCfg?: SectionBgImageCfg
}

export function LPSection({
  id,
  eyebrow,
  title,
  titleStyle,
  description,
  children,
  className,
  align = "left",
  tone = "default",
  bgImage,
  bgImageCfg,
}: SectionProps) {
  const cfg = bgImageCfg ?? {}
  const blur       = cfg.blur ?? 0
  const opacity    = cfg.opacity    ?? 100
  const scale      = cfg.scale      ?? 100
  const filterStr  = buildBgFilter(cfg)
  const insetPx    = blur > 0 ? `-${Math.ceil(blur * 2)}px` : "0px"
  const scaleFactor = (scale / 100) + (blur > 0 ? Math.min(blur / 200, 0.15) : 0)
  const hasOverlay = !!(cfg.overlayColor && (cfg.overlayOpacity ?? 0) > 0)

  return (
    <section
      id={id}
      className={cn(
        "relative w-full overflow-hidden",
        !bgImage && tone === "elevated" && "bg-white",
        !bgImage && tone === "dark" && "bg-black text-white",
        "py-20 sm:py-28 lg:py-36",
        className,
      )}
    >
      {/* ── 배경 이미지 레이어 ──────────────────────────────────────────────── */}
      {bgImage && (
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          {/* 이미지 */}
          <div
            style={{
              position:           "absolute",
              inset:              insetPx,
              backgroundImage:    `url(${bgImage})`,
              backgroundSize:     "cover",
              backgroundPosition: cfg.position ?? "center",
              backgroundRepeat:   "no-repeat",
              filter:             filterStr || undefined,
              opacity:            opacity / 100,
              transform:          scaleFactor !== 1 ? `scale(${scaleFactor.toFixed(4)})` : undefined,
              transformOrigin:    "center center",
            }}
          />
          {/* 오버레이 */}
          {hasOverlay && (
            <div
              style={{
                position:   "absolute",
                inset:      0,
                background: buildOverlayBg(
                  cfg.overlayColor!,
                  cfg.overlayOpacity!,
                  cfg.overlayGradient ?? "none",
                ),
              }}
            />
          )}
        </div>
      )}
      {/* Hairline divider — fades at edges */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ zIndex: 1,
          background:
            tone === "dark"
              ? "linear-gradient(to right, transparent, rgba(255,255,255,0.10) 30%, rgba(255,255,255,0.10) 70%, transparent)"
              : "linear-gradient(to right, transparent, rgba(20,18,15,0.10) 30%, rgba(20,18,15,0.10) 70%, transparent)",
        }}
      />
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 1,
          background:
            tone === "dark"
              ? [
                  "radial-gradient(ellipse 70% 55% at 80% 10%, rgba(201,168,92,0.22) 0%, transparent 65%)",
                  "radial-gradient(ellipse 55% 45% at 12% 90%, rgba(185,148,72,0.14) 0%, transparent 60%)",
                  "radial-gradient(ellipse 40% 30% at 50% 50%, rgba(210,178,102,0.06) 0%, transparent 55%)",
                ].join(", ")
              : [
                  "radial-gradient(ellipse 65% 50% at 82% 5%, rgba(0,0,0,0.045) 0%, transparent 60%)",
                  "radial-gradient(ellipse 50% 40% at 14% 95%, rgba(0,0,0,0.03) 0%, transparent 55%)",
                ].join(", "),
        }}
      />
      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8" style={{ zIndex: 2 }}>
        {(eyebrow || title || description) && (
          <header
            className={cn(
              "mb-12 sm:mb-16 lg:mb-20 max-w-3xl",
              align === "center" && "mx-auto text-center",
            )}
          >
            {eyebrow && (
              <div
                className={cn(
                  "mb-10 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.32em]",
                  align === "center" && "justify-center",
                )}
                style={{ color: tone === "dark" ? "rgba(255,255,255,0.6)" : "var(--lp-muted-fg)" }}
              >
                <span className="h-px w-8 bg-current opacity-40" />
                <span dangerouslySetInnerHTML={{ __html: eyebrow }} />
              </div>
            )}
            {title && (
              <h2
                className="lp-font-display text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: tone === "dark" ? "#fff" : "var(--lp-fg)", ...titleStyle }}
              >
                {title}
              </h2>
            )}
            {description && (
              <div
                className="mt-6 text-base leading-relaxed sm:text-lg lp-rich-text"
                style={{ color: tone === "dark" ? "rgba(255,255,255,0.7)" : "var(--lp-muted-fg)" }}
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  )
}
