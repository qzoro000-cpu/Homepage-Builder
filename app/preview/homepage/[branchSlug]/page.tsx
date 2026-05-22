"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useHomepagePreview } from "./layout"
import type { SiteSnapshot, SiteDoctorCard, FooterSocialExtra } from "@/lib/branch-website-store"
import { MapPin, MessageCircle, Phone, BookOpen, Youtube, Instagram, MessageSquare, Facebook, Twitter, Linkedin, Music, Globe } from "lucide-react"
import { parseIconConfigs, RenderSectionIcon } from "@/app/admin/branch/homepage/icon-library"
import { renderTextWithLineBreaks } from "@/components/site/sections/shared"

// ─── Shared helpers (mirrors CMS admin) ───────────────────────────────────────

const GOLD = "#c9a85c"

const FONTS: Record<string, string> = {
  sans:    "system-ui, -apple-system, 'Apple SD Gothic Neo', sans-serif",
  serif:   "Georgia, 'Noto Serif KR', serif",
  classic: "'Playfair Display', Georgia, serif",
  mono:    "ui-monospace, 'Courier New', monospace",
  korean:  "'Noto Serif KR', serif",
}
function getFontCss(key: string) { return FONTS[key] ?? FONTS.sans }

// Full-page sizes (scaled from CMS tiny-preview pixel values)
const INFO_SIZE: Record<string, string> = {
  xs: "0.75rem", sm: "0.875rem", md: "1rem", lg: "1.125rem", xl: "1.375rem", "2xl": "1.75rem",
}
const HEADLINE_SIZE: Record<string, string> = {
  sm: "1.75rem", md: "2.25rem", lg: "3rem", xl: "3.75rem",
}
const EYEBROW_SIZE: Record<string, string> = {
  xs: "0.65rem", sm: "0.75rem", md: "0.875rem", lg: "1rem",
}
const SUBCOPY_SIZE: Record<string, string> = {
  xs: "0.75rem", sm: "0.875rem", md: "1rem", lg: "1.125rem",
}
function iSize(key: string) { return INFO_SIZE[key] ?? INFO_SIZE.md }
function hSize(key: string) { return HEADLINE_SIZE[key] ?? HEADLINE_SIZE.lg }
function eSize(key: string) { return EYEBROW_SIZE[key] ?? EYEBROW_SIZE.sm }
function sSize(key: string) { return SUBCOPY_SIZE[key] ?? SUBCOPY_SIZE.xs }

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "")
  return `${parseInt(h.slice(0,2),16)||0},${parseInt(h.slice(2,4),16)||0},${parseInt(h.slice(4,6),16)||0}`
}

// sectionBgStyle: identical visual identity to CMS admin
function sectionBg(isDark: boolean): React.CSSProperties {
  return isDark
    ? {
        backgroundColor: "#0e0c09",
        backgroundImage: [
          "radial-gradient(ellipse at 85% 10%, rgba(201,168,92,0.28) 0%, transparent 55%)",
          "radial-gradient(ellipse at 15% 92%, rgba(201,168,92,0.20) 0%, transparent 50%)",
        ].join(","),
      }
    : { backgroundColor: "#f8f8f6" }
}

// ─── Hero helpers ─────────────────────────────────────────────────────────────

const IMG_EFFECTS: Record<string, string> = {
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

type ImgCfg = {
  effectId: string; brightness: number; contrast: number; saturate: number; hue: number
  position: string; gradDir: string; gradColor: string; gradOpacity: number
}
function parseImgCfg(raw: unknown): ImgCfg {
  const defaults: ImgCfg = { effectId: "none", brightness: 100, contrast: 100, saturate: 100, hue: 0, position: "center", gradDir: "to bottom", gradColor: "#000000", gradOpacity: 0 }
  try { const p = JSON.parse((raw as string) || "{}"); if (p && typeof p === "object") return { ...defaults, ...p } } catch {}
  return defaults
}
function buildFilter(cfg: ImgCfg): string {
  const parts: string[] = []
  if (cfg.brightness !== 100) parts.push(`brightness(${cfg.brightness}%)`)
  if (cfg.contrast   !== 100) parts.push(`contrast(${cfg.contrast}%)`)
  if (cfg.saturate   !== 100) parts.push(`saturate(${cfg.saturate}%)`)
  if (cfg.hue        !== 0)   parts.push(`hue-rotate(${cfg.hue}deg)`)
  if (IMG_EFFECTS[cfg.effectId]) parts.push(IMG_EFFECTS[cfg.effectId])
  return parts.join(" ")
}
function buildGradient(cfg: ImgCfg | PhiloImage | S1MapImg): string {
  if (!(cfg.gradOpacity)) return ""
  const rgba = `rgba(${hexToRgb(cfg.gradColor || "#000000")},${(cfg.gradOpacity / 100).toFixed(2)})`
  if (cfg.gradDir === "radial")      return `radial-gradient(ellipse at center, ${rgba} 0%, transparent 70%)`
  if (cfg.gradDir === "radial-edge") return `radial-gradient(ellipse at center, transparent 30%, ${rgba} 100%)`
  return `linear-gradient(${cfg.gradDir || "to bottom"}, transparent 0%, ${rgba} 100%)`
}

// ─── Event card parser ────────────────────────────────────────────────────────

type EventCard = {
  id: string; title: string; subtitle: string; url: string; imgUrl: string
  imgPosition: string; imgEffectId: string
  imgBrightness: number; imgContrast: number; imgSaturate: number; imgHue: number
  imgOverlay: string; imgOverlayOpacity: number; imgFade: number; imgBlend: string
}
const DEFAULT_EVENT_CARDS: EventCard[] = [
  { id:"e1", title:"이벤트 제목 1", subtitle:"이벤트 부제목을 입력하세요", url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:25, imgFade:55, imgBlend:"normal" },
  { id:"e2", title:"이벤트 제목 2", subtitle:"이벤트 부제목을 입력하세요", url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:25, imgFade:55, imgBlend:"normal" },
]
function parseEventCards(raw: unknown): EventCard[] {
  try {
    const p = JSON.parse((raw as string) || "[]")
    if (Array.isArray(p) && p.length > 0) return (p as EventCard[]).map(c => ({
      id: c.id || "e", title: c.title || "", subtitle: c.subtitle || "", url: c.url || "",
      imgUrl: c.imgUrl || "", imgPosition: c.imgPosition || "center", imgEffectId: c.imgEffectId || "none",
      imgBrightness: c.imgBrightness ?? 100, imgContrast: c.imgContrast ?? 100,
      imgSaturate: c.imgSaturate ?? 100, imgHue: c.imgHue ?? 0,
      imgOverlay: c.imgOverlay || "#000000", imgOverlayOpacity: c.imgOverlayOpacity ?? 25,
      imgFade: c.imgFade ?? 55, imgBlend: c.imgBlend || "normal",
    }))
  } catch {}
  return DEFAULT_EVENT_CARDS
}
function buildCardFilter(card: EventCard): string {
  const parts: string[] = []
  const eff = IMG_EFFECTS[card.imgEffectId || "none"]
  if (eff) parts.push(eff)
  if (card.imgBrightness !== 100) parts.push(`brightness(${card.imgBrightness}%)`)
  if (card.imgContrast  !== 100) parts.push(`contrast(${card.imgContrast}%)`)
  if (card.imgSaturate  !== 100) parts.push(`saturate(${card.imgSaturate}%)`)
  if (card.imgHue       !== 0)   parts.push(`hue-rotate(${card.imgHue}deg)`)
  return parts.join(" ")
}

// ─── Philosophy image parser ──────────────────────────────────────────────────

type PhiloImage = {
  id: string; mobile: string; pc: string
  effectId: string; brightness: number; contrast: number; saturate: number; hue: number
  position: string; gradDir: string; gradColor: string; gradOpacity: number
  shadowPreset: string; shadowColor: string
}
function parsePhiloImages(raw: unknown, legacy = ""): PhiloImage[] {
  try {
    const p = JSON.parse((raw as string) || "[]")
    if (Array.isArray(p) && p.length > 0) return (p as Partial<PhiloImage>[]).map(img => ({
      id: img.id || "phi", mobile: img.mobile || "", pc: img.pc || "",
      effectId: img.effectId || "none", brightness: img.brightness ?? 100, contrast: img.contrast ?? 100,
      saturate: img.saturate ?? 100, hue: img.hue ?? 0, position: img.position || "center",
      gradDir: img.gradDir || "to bottom", gradColor: img.gradColor || "#000000", gradOpacity: img.gradOpacity ?? 0,
      shadowPreset: img.shadowPreset || "none", shadowColor: img.shadowColor || "#000000",
    }))
    if (raw !== undefined && raw !== null && raw !== "") return []
  } catch {}
  if (legacy) return [{ id:"phi-legacy", mobile: legacy, pc: "", effectId:"none", brightness:100, contrast:100, saturate:100, hue:0, position:"center", gradDir:"to bottom", gradColor:"#000000", gradOpacity:0, shadowPreset:"none", shadowColor:"#000000" }]
  return []
}
function buildPhiloFilter(img: PhiloImage): string {
  const parts: string[] = []
  if (img.brightness !== 100) parts.push(`brightness(${img.brightness}%)`)
  if (img.contrast   !== 100) parts.push(`contrast(${img.contrast}%)`)
  if (img.saturate   !== 100) parts.push(`saturate(${img.saturate}%)`)
  if (img.hue        !== 0)   parts.push(`hue-rotate(${img.hue}deg)`)
  if (IMG_EFFECTS[img.effectId]) parts.push(IMG_EFFECTS[img.effectId])
  return parts.join(" ")
}

// ─── Strengths helpers ────────────────────────────────────────────────────────

type StrengthStat = { id: string; label: string; value: string; unit: string; preset?: string; labelColor?: string; valueColor?: string; chartType?: "line" | "circle" | "bar" }
type S1MapImg = { id: string; url: string; effectId: string; brightness: number; contrast: number; saturate: number; hue: number; position: string; gradDir: string; gradColor: string; gradOpacity: number; shadowPreset: string; shadowColor: string }

const DEFAULT_S1_STATS: StrengthStat[] = [
  { id:"s1a", label:"운영 연차",   value:"15", unit:"년",   preset:"glass-gold" },
  { id:"s1b", label:"글로벌 지점", value:"17", unit:"개",   preset:"glass-gold" },
  { id:"s1c", label:"진출 국가",   value:"3",  unit:"개국", preset:"glass-gold" },
]
const DEFAULT_S2_STATS: StrengthStat[] = [
  { id:"s2a", label:"누적 내원 고객", value:"223,496", unit:"명", chartType:"line"   },
  { id:"s2b", label:"재방문율",       value:"78",      unit:"%",  chartType:"circle" },
  { id:"s2c", label:"기존 고객 비중", value:"82.3",    unit:"%",  chartType:"bar"    },
]
function parseSStats(raw: unknown, defaults: StrengthStat[]): StrengthStat[] {
  if (!raw) return defaults
  try { return JSON.parse(raw as string) as StrengthStat[] } catch { return defaults }
}
function parseS1MapImages(raw: unknown, legacy = ""): S1MapImg[] {
  try {
    const p = JSON.parse((raw as string) || "[]")
    if (Array.isArray(p) && p.length > 0) return p.map((img: Partial<S1MapImg>) => ({
      id: img.id || "s1i", url: img.url || "",
      effectId: img.effectId || "none", brightness: img.brightness ?? 100, contrast: img.contrast ?? 100,
      saturate: img.saturate ?? 100, hue: img.hue ?? 0, position: img.position || "center",
      gradDir: img.gradDir || "to bottom", gradColor: img.gradColor || "#000000", gradOpacity: img.gradOpacity ?? 0,
      shadowPreset: img.shadowPreset || "none", shadowColor: img.shadowColor || "#000000",
    }))
  } catch {}
  if (legacy) return [{ id:"s1i-legacy", url:legacy, effectId:"none", brightness:100, contrast:100, saturate:100, hue:0, position:"center", gradDir:"to bottom", gradColor:"#000000", gradOpacity:0, shadowPreset:"none", shadowColor:"#000000" }]
  return []
}
function buildS1Filter(img: S1MapImg): string {
  const parts: string[] = []
  if (img.brightness !== 100) parts.push(`brightness(${img.brightness}%)`)
  if (img.contrast   !== 100) parts.push(`contrast(${img.contrast}%)`)
  if (img.saturate   !== 100) parts.push(`saturate(${img.saturate}%)`)
  if (img.hue        !== 0)   parts.push(`hue-rotate(${img.hue}deg)`)
  if (IMG_EFFECTS[img.effectId]) parts.push(IMG_EFFECTS[img.effectId])
  return parts.join(" ")
}

// ─── Branch card parser ───────────────────────────────────────────────────────

type BranchCard = { id: string; region: string; name: string; feature: string; url: string; imgUrl: string; imgPosition: string; imgEffectId: string; imgBrightness: number; imgContrast: number; imgSaturate: number; imgHue: number; imgOverlay: string; imgOverlayOpacity: number; imgFade: number; imgBlend: string }
const DEFAULT_BRANCH_CARDS: BranchCard[] = [
  { id:"bc1", region:"SEOUL · KOREA",  name:"TATOA Gangnam",  feature:"The Flagship Experience", url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:30, imgFade:65, imgBlend:"normal" },
  { id:"bc2", region:"BUSAN · KOREA",  name:"TATOA Haeundae", feature:"Coastal Luxury Clinic",   url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:30, imgFade:65, imgBlend:"normal" },
  { id:"bc3", region:"TOKYO · JAPAN",  name:"TATOA Shibuya",  feature:"Precision & Elegance",    url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:30, imgFade:65, imgBlend:"normal" },
]
function parseBranchCards(raw: unknown): BranchCard[] {
  try {
    const p = JSON.parse((raw as string) || "[]")
    if (Array.isArray(p) && p.length > 0) return (p as BranchCard[]).map(c => ({
      id: c.id || "bc", region: c.region || "", name: c.name || "", feature: c.feature || "",
      url: c.url || "", imgUrl: c.imgUrl || "", imgPosition: c.imgPosition || "center",
      imgEffectId: c.imgEffectId || "none", imgBrightness: c.imgBrightness ?? 100,
      imgContrast: c.imgContrast ?? 100, imgSaturate: c.imgSaturate ?? 100, imgHue: c.imgHue ?? 0,
      imgOverlay: c.imgOverlay || "#000000", imgOverlayOpacity: c.imgOverlayOpacity ?? 30,
      imgFade: c.imgFade ?? 65, imgBlend: c.imgBlend || "normal",
    }))
  } catch {}
  return DEFAULT_BRANCH_CARDS
}

// ─── Gallery image parser ─────────────────────────────────────────────────────

type GalleryImage = { id: string; url: string; label?: string }
function parseGalleryImages(raw: unknown): GalleryImage[] {
  try {
    const arr = JSON.parse((raw as string) || "[]")
    if (Array.isArray(arr)) return arr.filter((x: unknown) => x && typeof x === "object") as GalleryImage[]
  } catch {}
  return []
}

// ─── Hours line parser ────────────────────────────────────────────────────────

type HoursLineColor = "default" | "red" | "gold" | "gray"
type HoursLine = { id: string; text: string; color: HoursLineColor; size: "normal" | "sm"; suffix: string; suffixColor: HoursLineColor }
function parseHoursLines(raw: unknown): HoursLine[] {
  const str = (raw as string) || ""
  try {
    const p = JSON.parse(str)
    if (Array.isArray(p) && p.length > 0 && typeof p[0] === "object" && "text" in p[0]) {
      return p.map((l: Partial<HoursLine>) => ({ id: l.id || Math.random().toString(36).slice(2), text: l.text || "", color: l.color || "default", size: l.size || "normal", suffix: l.suffix || "", suffixColor: l.suffixColor || "default" }))
    }
  } catch {}
  if (!str.trim()) return []
  return str.split("\n").filter(Boolean).map(t => ({ id: Math.random().toString(36).slice(2), text: t, color: "default" as HoursLineColor, size: "normal" as const, suffix: "", suffixColor: "default" as HoursLineColor }))
}
function resolveHoursColor(color: HoursLineColor, isDark: boolean, fallback: string): string {
  if (color === "red")  return "#ef4444"
  if (color === "gold") return GOLD
  if (color === "gray") return isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"
  return fallback
}

// ─── Map URL normalizer ───────────────────────────────────────────────────────
function normalizeMapUrl(raw: string): string {
  if (!raw) return ""
  const trimmed = raw.trim()
  const srcMatch = trimmed.match(/src="([^"]+)"/)
  if (srcMatch) return srcMatch[1]
  return trimmed
}

// ─── Box preset resolver ──────────────────────────────────────────────────────
const BOX_PRESETS_DARK = [
  { id:"default",         bg:"rgba(255,255,255,0.06)", border:"rgba(255,255,255,0.12)", shadow:"none" },
  { id:"glass-gold",      bg:"rgba(201,168,92,0.15)",  border:"rgba(201,168,92,0.30)",  shadow:"0 4px 16px rgba(201,168,92,0.20)" },
  { id:"gradient-gold",   bg:"linear-gradient(135deg,rgba(201,168,92,0.35) 0%,rgba(100,70,20,0.18) 100%)", border:"rgba(201,168,92,0.35)", shadow:"0 6px 24px rgba(201,168,92,0.25)" },
  { id:"solid-dark",      bg:"rgba(8,8,8,0.90)",       border:"rgba(255,255,255,0.08)", shadow:"0 8px 24px rgba(0,0,0,0.45)" },
  { id:"outline",         bg:"transparent",            border:"rgba(255,255,255,0.22)", shadow:"none" },
]
const BOX_PRESETS_LIGHT = [
  { id:"default",         bg:"#ffffff",               border:"rgba(0,0,0,0.08)",  shadow:"0 2px 12px rgba(0,0,0,0.07)" },
  { id:"glass-gold",      bg:"rgba(201,168,92,0.08)", border:"rgba(201,168,92,0.25)", shadow:"0 4px 16px rgba(201,168,92,0.12)" },
  { id:"gradient-gold",   bg:"linear-gradient(135deg,rgba(201,168,92,0.15) 0%,rgba(255,252,240,0.9) 100%)", border:"rgba(201,168,92,0.22)", shadow:"0 6px 24px rgba(201,168,92,0.12)" },
  { id:"solid-cream",     bg:"#faf8f3",               border:"rgba(0,0,0,0.06)",  shadow:"0 4px 20px rgba(0,0,0,0.08)" },
  { id:"outline",         bg:"transparent",           border:"rgba(0,0,0,0.15)",  shadow:"none" },
]
function resolveBoxStyle(presetId: string, isDark: boolean, overrides?: { bg?: string; border?: string; shadow?: string; blur?: number; radius?: number }) {
  const presets = isDark ? BOX_PRESETS_DARK : BOX_PRESETS_LIGHT
  const ps = presets.find(p => p.id === (presetId || "glass-gold")) ?? presets[1]
  return {
    bg:     overrides?.bg     || ps.bg,
    border: `1px solid ${overrides?.border || ps.border}`,
    shadow: overrides?.shadow || ps.shadow,
    blur:   overrides?.blur   ?? 0,
    radius: overrides?.radius ?? 16,
  }
}
function resolveInfoBox(prefix: string, v: Record<string, unknown>, isDark: boolean) {
  return resolveBoxStyle(
    (v[`${prefix}Preset`] as string) || "glass-gold", isDark,
    { bg: (v[`${prefix}Bg`] as string) || undefined, border: (v[`${prefix}Border`] as string) || undefined, shadow: (v[`${prefix}Shadow`] as string) || undefined, blur: (v[`${prefix}Blur`] as number) ?? 0, radius: (v[`${prefix}Radius`] as number) ?? 16 }
  )
}

// ─── Mini Charts ─────────────────────────────────────────────────────────────

function MiniLineChart({ color }: { color: string }) {
  return (
    <svg width="64" height="28" viewBox="0 0 64 28" fill="none" style={{ flexShrink: 0 }}>
      <polyline points="0,26 12,19 26,22 38,11 52,6 64,2" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="64" cy="2" r="3" fill={color} />
    </svg>
  )
}
function MiniCircleChart({ value, color }: { value: number; color: string }) {
  const r = 14; const circ = 2 * Math.PI * r
  const off = circ - (Math.min(Math.max(value, 0), 100) / 100) * circ
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
      <circle cx="18" cy="18" r={r} stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" fill="none" />
      <circle cx="18" cy="18" r={r} stroke={color} strokeWidth="3.5" fill="none" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 18 18)" />
    </svg>
  )
}
function MiniBarChart({ color }: { color: string }) {
  const bars = [40, 60, 50, 72, 58, 80, 70]
  return (
    <svg width="60" height="28" viewBox="0 0 60 28" fill="none" style={{ flexShrink: 0 }}>
      {bars.map((h, i) => { const bh = (h / 100) * 26; return <rect key={i} x={i * 8.5} y={28 - bh} width="7" height={bh} rx="1.5" fill={color} opacity={0.3 + (i / bars.length) * 0.7} /> })}
    </svg>
  )
}

// ─── Reveal Box (scroll-reveal, IntersectionObserver) ────────────────────────

function RevealBox({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.10, rootMargin: "0px 0px -20px 0px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0px)" : "translateY(34px)", transition: `opacity 1.3s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 1.3s cubic-bezier(0.22,1,0.36,1) ${delay}ms`, willChange: "opacity, transform", ...style }}>
      {children}
    </div>
  )
}

// ─── Smart Pagination (dots ≤5 → windowed → counter+bar ≥10) ─────────────────

function SmartPagination({ total, active, isDark, onSelect }: { total: number; active: number; isDark: boolean; onSelect: (i: number) => void }) {
  const accentActive   = isDark ? GOLD : "#2a2a2a"
  const accentInactive = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)"
  if (total <= 5) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"6px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <button key={i} type="button" onClick={() => onSelect(i)} style={{ width: i === active ? "24px" : "6px", height:"6px", borderRadius:"3px", background: i === active ? accentActive : accentInactive, border:"none", padding:0, cursor:"pointer", flexShrink:0, transition:"width 0.3s ease, background 0.3s ease" }} />
      ))}
    </div>
  )
  if (total < 10) {
    const MAX = 5
    const winStart = Math.min(Math.max(active - 2, 0), total - MAX)
    const win = Array.from({ length: MAX }, (_, i) => winStart + i)
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"5px" }}>
        {winStart > 0 && <div style={{ width:4, height:4, borderRadius:"50%", background:accentInactive, opacity:0.45, flexShrink:0 }} />}
        {win.map(idx => (
          <button key={idx} type="button" onClick={() => onSelect(idx)} style={{ width: idx === active ? "22px" : "6px", height:"6px", borderRadius:"3px", background: idx === active ? accentActive : accentInactive, border:"none", padding:0, cursor:"pointer", flexShrink:0, transition:"width 0.25s ease, background 0.25s ease" }} />
        ))}
        {winStart + MAX < total && <div style={{ width:4, height:4, borderRadius:"50%", background:accentInactive, opacity:0.45, flexShrink:0 }} />}
      </div>
    )
  }
  const progress = total > 1 ? active / (total - 1) : 0
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"6px" }}>
      <span style={{ fontSize:"0.75rem", fontFamily:"system-ui", letterSpacing:"0.08em", color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)" }}>
        <span style={{ color:accentActive, fontWeight:600 }}>{active+1}</span>{" / "}{total}
      </span>
      <div style={{ width:"80px", height:"3px", borderRadius:"2px", background:accentInactive, overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:"2px", background:accentActive, width:`${progress*100}%`, transition:"width 0.3s ease" }} />
      </div>
    </div>
  )
}

// ─── Site Event Tilt Card (full-size 3D tilt, same logic as CMS EventTiltCard) ─

function SiteEventTiltCard({ card, isDark }: { card: EventCard; isDark: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rot,    setRot]    = useState({ x: 0, y: 0 })
  const [glow,   setGlow]   = useState({ x: 50, y: 50 })
  const [active, setActive] = useState(false)
  const ac    = isDark ? { r: 201, g: 168, b: 92 } : { r: 168, g: 175, b: 190 }
  const acStr = `rgba(${ac.r},${ac.g},${ac.b}`
  const ease  = "transform 0.65s cubic-bezier(0.23,1,0.32,1)"
  const track = (clientX: number, clientY: number) => {
    if (!cardRef.current) return
    const r  = cardRef.current.getBoundingClientRect()
    const nx = (clientX - r.left) / r.width
    const ny = (clientY - r.top)  / r.height
    setRot({ x: (ny - 0.5) * -12, y: (nx - 0.5) * 16 })
    setGlow({ x: nx * 100, y: ny * 100 })
  }
  const finalFilter  = buildCardFilter(card)
  const overlayAlpha = ((card.imgOverlayOpacity ?? 25) / 100).toFixed(2)
  const fadeStop     = Math.max(0, 100 - (card.imgFade ?? 55))
  const rimGlow      = `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(${ac.r},${ac.g},${ac.b},0.65) 0%, rgba(${ac.r},${ac.g},${ac.b},0.22) 38%, transparent 65%)`
  return (
    <div
      ref={cardRef}
      onMouseMove={e => { setActive(true); track(e.clientX, e.clientY) }}
      onMouseLeave={() => { setActive(false); setRot({ x:0, y:0 }) }}
      onTouchMove={e => { setActive(true); const t = e.touches[0]; track(t.clientX, t.clientY) }}
      onTouchEnd={() => { setActive(false); setRot({ x:0, y:0 }) }}
      style={{
        width:"100%", aspectRatio:"4/5", borderRadius:"16px", overflow:"hidden", position:"relative",
        background: isDark ? "#181818" : "#e2e2e2",
        transform: `perspective(900px) rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${active ? 1.022 : 1})`,
        transition: active ? "transform 0.08s ease-out, box-shadow 0.15s ease" : `${ease}, box-shadow 0.55s ease`,
        boxShadow: active
          ? `0 32px 80px rgba(0,0,0,0.75), 0 0 56px ${acStr},0.24), 0 0 0 1.5px ${acStr},0.32)`
          : isDark ? "0 14px 48px rgba(0,0,0,0.62), 0 0 0 1px rgba(255,255,255,0.06)" : "0 8px 28px rgba(0,0,0,0.14)",
        cursor:"pointer", willChange:"transform",
      }}
    >
      {card.imgUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.imgUrl} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition: card.imgPosition || "center", filter: finalFilter || undefined, display:"block",
          transform: active ? `scale(1.07) translate(${-rot.y * 0.18}px,${-rot.x * 0.18}px)` : "scale(1) translate(0,0)",
          transition: active ? "transform 0.08s ease-out" : ease }} />
      ) : (
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"8px" }}>
          <span style={{ fontSize:"2.5rem", opacity:0.15 }}>🎯</span>
          <span style={{ fontSize:"0.75rem", color: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)" }}>이벤트 이미지</span>
        </div>
      )}
      <div style={{ position:"absolute", inset:0, background:`rgba(${hexToRgb(card.imgOverlay||"#000000")},${overlayAlpha})`, mixBlendMode:(card.imgBlend||"normal") as React.CSSProperties["mixBlendMode"] }} />
      <div style={{ position:"absolute", inset:0, background:`linear-gradient(to top,rgba(0,0,0,0.70) 0%,rgba(0,0,0,0) ${fadeStop}%)` }} />
      <div style={{ position:"absolute", inset:0, background:rimGlow, opacity: active ? 1 : 0, transition:"opacity 0.2s ease", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, borderRadius:"16px", border: active ? `1.5px solid ${acStr},0.50)` : `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.52)"}`, pointerEvents:"none", transition:"border-color 0.3s ease" }} />
      {active && (
        <>
          <div style={{ position:"absolute", top:14, left:14,  width:18, height:18, borderTop:`1.5px solid ${acStr},0.75)`, borderLeft:`1.5px solid ${acStr},0.75)`,  borderRadius:"3px 0 0 0", pointerEvents:"none" }} />
          <div style={{ position:"absolute", top:14, right:14, width:18, height:18, borderTop:`1.5px solid ${acStr},0.75)`, borderRight:`1.5px solid ${acStr},0.75)`, borderRadius:"0 3px 0 0", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:14, left:14,  width:18, height:18, borderBottom:`1.5px solid ${acStr},0.75)`, borderLeft:`1.5px solid ${acStr},0.75)`,  borderRadius:"0 0 0 3px", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:14, right:14, width:18, height:18, borderBottom:`1.5px solid ${acStr},0.75)`, borderRight:`1.5px solid ${acStr},0.75)`, borderRadius:"0 0 3px 0", pointerEvents:"none" }} />
        </>
      )}
    </div>
  )
}

// ─── Section title (same as CMS: centered, letter-spaced) ────────────────────

function SectionTitle({ v, skey, isDark, fallback }: { v: Record<string, unknown>; skey: string; isDark: boolean; fallback: string }) {
  const color  = (v[`${skey}TitleColor`]  as string) || (v[`${skey}SectionTitleColor`] as string) || (isDark ? `rgba(201,168,92,0.80)` : "#555")
  const size   = iSize((v[`${skey}TitleSize`] as string) || (v[`${skey}SectionTitleSize`] as string) || "lg")
  const weight = (v[`${skey}TitleWeight`] as string) || (v[`${skey}SectionTitleWeight`] as string) || "600"
  const font   = getFontCss((v[`${skey}TitleFont`] as string) || (v[`${skey}SectionTitleFont`] as string) || "serif")
  const text   = (v.title as string) || fallback
  return (
    <div style={{ height: "4.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ textAlign: "center", fontSize: size, fontWeight: weight, color, fontFamily: font, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
        {text}
      </p>
    </div>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection({ snapshot }: { snapshot: SiteSnapshot }) {
  const v = snapshot.homepage.sectionValues["hero"] ?? {}
  const [imgError, setImgError] = useState(false)

  const bgVideo  = (v.bgVideoPc as string) || (v.bgVideoMobile as string) || ""
  const rawImage = (v.bgImagePc as string) || (v.bgImageMobile as string) || snapshot.homepage.sectionImages["hero"] || snapshot.branch.heroImage || ""
  const bgImage  = imgError ? "" : rawImage

  const imgCfg   = parseImgCfg(v.heroPcImgCfg ?? v.heroMobileImgCfg)
  const imgFilter = buildFilter(imgCfg)
  const heroGrad  = buildGradient(imgCfg)
  const overlayOp = ((v.overlayOpacity as number) ?? 50) / 100

  const b1Visible  = (v.block1Visible as boolean) ?? true
  const b2Visible  = (v.block2Visible as boolean) ?? true
  const b3Visible  = (v.block3Visible as boolean) ?? true
  const ctaVisible = (v.ctaVisible as boolean) ?? true

  const b1Text   = (v.block1Text as string) || ""
  const b2Text   = (v.block2Text as string) || snapshot.branch.name
  const b3Text   = (v.block3Text as string) || snapshot.branch.shortIntro || ""
  const ctaLabel = (v.ctaLabel as string) || "지금 상담 예약하기"

  const b1Style: React.CSSProperties = { fontFamily: getFontCss((v.block1Font as string) || "sans"), fontSize: eSize((v.block1Size as string) || "sm"), fontWeight: Number((v.block1Weight as string) || "400"), color: (v.block1Color as string) || "#ffffff", letterSpacing: "0.15em", lineHeight: 1.3 }
  const b2Style: React.CSSProperties = { fontFamily: getFontCss((v.block2Font as string) || "sans"), fontSize: hSize((v.block2Size as string) || "lg"),  fontWeight: Number((v.block2Weight as string) || "700"), color: (v.block2Color as string) || "#ffffff", lineHeight: 1.2, whiteSpace: "pre-line" }
  const b3Style: React.CSSProperties = { fontFamily: getFontCss((v.block3Font as string) || "sans"), fontSize: sSize((v.block3Size as string) || "xs"),  fontWeight: Number((v.block3Weight as string) || "400"), color: (v.block3Color as string) || "rgba(255,255,255,0.65)", lineHeight: 1.55, whiteSpace: "pre-line", marginTop: "0.5rem" }

  const ctaBg    = (v.ctaBgColor   as string) || "rgba(255,255,255,0.95)"
  const ctaColor = (v.ctaTextColor as string) || "#1a1a1a"
  const textAlignH = (v.textAlignH    as string) || "left"
  const textPosV   = (v.textPositionV as string) || "center"
  const vAlign  = textPosV === "top" ? "flex-start" : textPosV === "bottom" ? "flex-end" : "center"
  const hAlign  = textAlignH === "center" ? "center" : textAlignH === "right" ? "flex-end" : "flex-start"
  const textAlign = textAlignH as "left" | "center" | "right"

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "90vh" }}>
      {bgVideo ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={bgVideo} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : bgImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: imgFilter || undefined, objectPosition: imgCfg.position || "center" }} onError={() => setImgError(true)} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-800 via-neutral-700 to-neutral-900" />
      )}
      {heroGrad && <div className="absolute inset-0 pointer-events-none" style={{ background: heroGrad }} />}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlayOp})` }} />
      <div className="absolute inset-0 flex flex-col px-8 md:px-20 py-24" style={{ justifyContent: vAlign, alignItems: hAlign }}>
        <div style={{ textAlign, maxWidth: "760px" }} className="space-y-3">
          {b1Visible && b1Text && <p style={b1Style}>{b1Text}</p>}
          {b2Visible && <p style={b2Style}>{b2Text}</p>}
          {b3Visible && b3Text && <p style={b3Style}>{b3Text}</p>}
          {ctaVisible && (
            <div style={{ marginTop: "1.75rem", display: "flex", justifyContent: hAlign, width: "100%" }}>
              <a href={snapshot.branch.bookingLink || "#"} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: ctaBg, color: ctaColor, padding: "0.85rem 2rem", borderRadius: 999, fontSize: sSize((v.ctaSize as string) || "sm"), fontFamily: getFontCss((v.ctaFont as string) || "sans"), fontWeight: Number((v.ctaWeight as string) || "600"), textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                <MessageCircle size={16} />
                {ctaLabel}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Events Section ───────────────────────────────────────────────────────────

function EventsSection({ snapshot }: { snapshot: SiteSnapshot }) {
  const sec = snapshot.homepage.sections.find(s => s.id === "events")
  if (!sec?.isEnabled) return null
  const v      = snapshot.homepage.sectionValues["events"] ?? {}
  const isDark = ((v.evBgColor as string) || "dark") === "dark"
  const cards  = parseEventCards(v.eventCards)
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollRef  = useRef<HTMLDivElement>(null)
  const dragState  = useRef({ dragging: false, startX: 0, scrollLeft: 0 })
  const [isCursorGrab, setIsCursorGrab] = useState(false)

  const stColor  = (v.evSectionTitleColor  as string) || (isDark ? `rgba(201,168,92,0.80)` : "#555")
  const stSize   = iSize((v.evSectionTitleSize as string) || "xl")
  const stWeight = (v.evSectionTitleWeight as string) || "600"
  const stFont   = getFontCss((v.evSectionTitleFont as string) || "serif")
  const titleColor   = (v.evTitleColor   as string) || (isDark ? "#f5f0e8" : "#1a1a1a")
  const subColor     = (v.evSubColor     as string) || (isDark ? "rgba(255,255,255,0.55)" : "#666")
  const titleWeight2 = (v.evTitleWeight  as string) || "700"
  const subWeight2   = (v.evSubWeight    as string) || "400"
  const titleFont2   = getFontCss((v.evTitleFont as string) || "sans")
  const subFont2     = getFontCss((v.evSubFont   as string) || "sans")

  // Snap width is measured from container after mount
  const slideRef  = useRef<HTMLDivElement>(null)
  const getSlideW = () => slideRef.current?.offsetWidth ?? window.innerWidth

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
    const w = getSlideW()
    const idx = Math.max(0, Math.min(Math.round(scrollRef.current.scrollLeft / w), cards.length - 1))
    setActiveIdx(idx)
    scrollRef.current.scrollTo({ left: idx * w, behavior: "smooth" })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length])

  const scrollTo = (idx: number) => {
    setActiveIdx(idx)
    scrollRef.current?.scrollTo({ left: idx * getSlideW(), behavior: "smooth" })
  }

  return (
    <section style={{ ...sectionBg(isDark), paddingBottom: "2.5rem" }}>
      {/* Section title */}
      <div style={{ height: "4.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ textAlign: "center", fontSize: stSize, fontWeight: stWeight, color: stColor, fontFamily: stFont, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
          {(v.evSectionTitle as string) || "— Events —"}
        </p>
      </div>

      {/* Snap carousel — one card per "page" (same layout as CMS preview) */}
      <div style={{ margin: "0 -0px", overflow: "hidden" }}>
        <div
          ref={scrollRef}
          onScroll={e => {
            if (dragState.current.dragging) return
            const w = getSlideW()
            setActiveIdx(Math.round((e.currentTarget as HTMLDivElement).scrollLeft / w))
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ display:"flex", overflowX:"auto", scrollSnapType:"x mandatory", scrollbarWidth:"none", cursor: isCursorGrab ? "grabbing" : "grab", userSelect:"none" } as React.CSSProperties}
        >
          {cards.map((card, i) => (
            <div
              key={card.id}
              ref={i === 0 ? slideRef : undefined}
              style={{ flexShrink:0, width:"100%", scrollSnapAlign:"start", padding:"1.5rem 2rem 0", perspective:"900px", boxSizing:"border-box" }}
            >
              {/* Tilt card — max 520px centered */}
              <div style={{ maxWidth:"520px", margin:"0 auto" }}>
                <SiteEventTiltCard card={card} isDark={isDark} />
                {/* Text block below card */}
                <div style={{ paddingTop:"1rem", paddingBottom:"1.25rem" }}>
                  <p style={{ fontSize: iSize((v.evTitleSize as string) || "md"), fontWeight: titleWeight2, color: titleColor, fontFamily: titleFont2, lineHeight:1.4, margin:0, marginBottom:"0.375rem", whiteSpace:"pre-line" }}>
                    {card.title || "이벤트 제목"}
                  </p>
                  <p style={{ fontSize: iSize((v.evSubSize as string) || "xs"), fontWeight: subWeight2, color: subColor, fontFamily: subFont2, lineHeight:1.55, margin:0, whiteSpace:"pre-line" }}>
                    {card.subtitle || "이벤트 부제목"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart pagination */}
      <div style={{ paddingTop:"0.75rem", paddingBottom:"0.25rem" }}>
        <SmartPagination total={cards.length} active={activeIdx} isDark={isDark} onSelect={scrollTo} />
      </div>
    </section>
  )
}

// ─── Philosophy Section ───────────────────────────────────────────────────────

function PhilosophySection({ snapshot }: { snapshot: SiteSnapshot }) {
  const sec = snapshot.homepage.sections.find(s => s.id === "philosophy")
  if (!sec?.isEnabled) return null
  const v = snapshot.homepage.sectionValues["philosophy"] ?? {}

  const isDark   = (v.bgTheme as string) !== "light"
  const eyebrow  = (v.eyebrow  as string) || "OUR PHILOSOPHY"
  const headline = (v.headline as string) || "아름다움은 교정이 아닙니다."
  const body     = (v.body     as string) || ""
  const images   = parsePhiloImages(v.philoImages, (v.image as string) || snapshot.homepage.sectionImages["philosophy"] || "")

  const tc  = isDark ? "#ffffff" : "#111111"
  const tcm = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)"

  const bgStyle: React.CSSProperties = isDark
    ? { background: ["radial-gradient(ellipse 90% 55% at 88% 6%, rgba(201,168,92,0.20) 0%, transparent 52%)", "radial-gradient(ellipse 75% 90% at 10% 96%, rgba(201,168,92,0.12) 0%, transparent 52%)", "#0e0b06"].join(",") }
    : { background: "#ffffff" }

  return (
    <section style={{ ...bgStyle, position: "relative", overflow: "hidden" }}>
      <div className="max-w-6xl mx-auto px-8 md:px-16 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Text */}
          <div style={{ padding: "1rem 0" }}>
            <p style={{ fontFamily: getFontCss((v.eyebrowFont as string) || "sans"), fontSize: eSize((v.eyebrowSize as string) || "sm"), fontWeight: Number((v.eyebrowWeight as string) || "400"), color: (v.eyebrowColor as string) || GOLD, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: "1rem" }}>{eyebrow}</p>
            <p style={{ fontFamily: getFontCss((v.headlineFont as string) || "sans"), fontSize: hSize((v.headlineSize as string) || "md"), fontWeight: Number((v.headlineWeight as string) || "700"), color: (v.headlineColor as string) || tc, lineHeight: 1.38, marginBottom: "1.25rem", letterSpacing: "-0.01em" }}>{renderTextWithLineBreaks(String(headline ?? ""))}</p>
            {body && <p style={{ fontFamily: getFontCss((v.bodyFont as string) || "sans"), fontSize: sSize((v.bodySize as string) || "xs"), fontWeight: Number((v.bodyWeight as string) || "400"), color: (v.bodyColor as string) || tcm, lineHeight: 1.65 }}>{renderTextWithLineBreaks(String(body))}</p>}
          </div>
          {/* Images */}
          {images.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {images.map((img, i) => {
                const url  = img.pc || img.mobile
                const filt = buildPhiloFilter(img)
                const grad = buildGradient(img)
                const ratio = i === 0 ? "4/5" : "3/2"
                return (
                  <div key={img.id} style={{ width: "100%", aspectRatio: ratio, borderRadius: "12px", overflow: "hidden", position: "relative" }}>
                    {url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: img.position, filter: filt || undefined }} />
                        {grad && <div style={{ position: "absolute", inset: 0, background: grad, pointerEvents: "none" }} />}
                      </>
                    ) : (
                      <div style={{ position: "absolute", inset: 0, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "2rem", opacity: 0.3 }}>🖼</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Site Doctor Tilt Card ────────────────────────────────────────────────────

function SiteDoctorTiltCard({ doc, isDark, cs }: {
  doc: SiteDoctorCard
  isDark: boolean
  cs: ReturnType<typeof resolveBoxStyle>
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rot,    setRot]    = useState({ x: 0, y: 0 })
  const [glow,   setGlow]   = useState({ x: 50, y: 50 })
  const [active, setActive] = useState(false)
  const ac    = isDark ? { r: 201, g: 168, b: 92 } : { r: 168, g: 175, b: 190 }
  const acStr = `rgba(${ac.r},${ac.g},${ac.b}`
  const ease  = "transform 0.65s cubic-bezier(0.23,1,0.32,1)"
  const track = (clientX: number, clientY: number) => {
    if (!cardRef.current) return
    const r  = cardRef.current.getBoundingClientRect()
    const nx = (clientX - r.left) / r.width
    const ny = (clientY - r.top)  / r.height
    setRot({ x: (ny - 0.5) * -16, y: (nx - 0.5) * 18 })
    setGlow({ x: nx * 100, y: ny * 100 })
  }
  const photoSrc    = doc.profileImageUrl || doc.image || ""
  const textColor   = isDark ? "#f5f0e8" : "#1a1a1a"
  const subColor    = isDark ? "rgba(255,255,255,0.45)" : "#555"
  const accentColor = isDark ? GOLD : `rgb(${ac.r},${ac.g},${ac.b})`
  const divColor    = isDark ? `rgba(201,168,92,${active ? 0.6 : 0.22})` : `rgba(0,0,0,${active ? 0.12 : 0.06})`

  return (
    <div
      ref={cardRef}
      style={{ perspective: 1200 }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => { setActive(false); setRot({ x:0, y:0 }); setGlow({ x:50, y:50 }) }}
      onMouseMove={e => track(e.clientX, e.clientY)}
      onTouchStart={e => { setActive(true); const t = e.touches[0]; track(t.clientX, t.clientY) }}
      onTouchMove={e => { const t = e.touches[0]; track(t.clientX, t.clientY) }}
      onTouchEnd={() => { setActive(false); setRot({ x:0, y:0 }) }}
    >
      <div style={{
        transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${active ? 1.025 : 1})`,
        transition: active ? "transform 0.09s ease" : ease,
        transformStyle:"preserve-3d",
        borderRadius: cs.radius, position:"relative", overflow:"hidden",
        background: cs.bg, border: cs.border,
        boxShadow: active
          ? `0 24px 72px rgba(0,0,0,${isDark ? 0.7 : 0.15}), 0 0 44px ${acStr},${isDark ? 0.22 : 0.26}), 0 0 0 1.5px ${acStr},${isDark ? 0.32 : 0.38})`
          : cs.shadow,
        backdropFilter: cs.blur ? `blur(${cs.blur}px)` : undefined,
        display:"flex", flexDirection:"column",
      }}>
        {/* Cursor glow */}
        <div style={{ position:"absolute", inset:0, borderRadius:cs.radius, background:`radial-gradient(ellipse 80% 65% at ${glow.x}% ${glow.y}%, ${acStr},${active ? (isDark ? 0.18 : 0.22) : 0}) 0%, transparent 65%)`, transition: active ? "none" : "background 0.65s", pointerEvents:"none", zIndex:1 }} />

        {/* Photo */}
        <div style={{ width:"100%", paddingTop:"125%", position:"relative", overflow:"hidden",
          background: isDark ? "linear-gradient(170deg,#1a1712 0%,#0d0b09 100%)" : "linear-gradient(170deg,#f5f3ef 0%,#e8e5e0 100%)",
          transform: active ? `translate(${(glow.x-50)*0.06}px,${(glow.y-50)*0.06}px)` : "none",
          transition: active ? "none" : ease, zIndex:2, flexShrink:0 }}>
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc} alt={doc.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top", display:"block" }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
          ) : (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6,
              background: isDark ? "rgba(201,168,92,0.04)" : "rgba(139,106,47,0.04)" }}>
              <span style={{ fontSize:36, opacity:0.18 }}>👤</span>
            </div>
          )}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"4rem", pointerEvents:"none", background:`linear-gradient(to top,${isDark ? "rgba(8,7,5,0.92)" : "rgba(245,243,240,0.92)"},transparent)` }} />
          {/* Title badge */}
          {doc.title && (
            <div style={{ position:"absolute", bottom:"0.75rem", left:"0.875rem", display:"flex", alignItems:"center", gap:"0.3rem" }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:accentColor, flexShrink:0, boxShadow: active && isDark ? `0 0 8px ${GOLD}` : "none", transition:"box-shadow 0.3s" }} />
              <span style={{ fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:600, color: isDark ? "rgba(201,168,92,0.9)" : `${acStr},0.85)`, textShadow: isDark ? "0 1px 4px rgba(0,0,0,0.9)" : "none" }}>{doc.title}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height:1, flexShrink:0, position:"relative", zIndex:2, background:`linear-gradient(90deg,transparent,${divColor},transparent)` }} />

        {/* Content */}
        <div style={{
          padding:"1.125rem 1.25rem 1.375rem",
          transform: active ? `translate(${(glow.x-50)*0.04}px,${(glow.y-50)*0.04}px)` : "none",
          transition: active ? "none" : ease,
          position:"relative", zIndex:2,
          display:"flex", flexDirection:"column", gap:"0.625rem", flex:1,
        }}>
          <div>
            <p style={{ fontSize:"1.0625rem", fontWeight:700, color:textColor, lineHeight:1.3, letterSpacing:"-0.02em" }}>{doc.name}</p>
            {doc.specialty && <p style={{ fontSize:"0.75rem", color:subColor, marginTop:"0.25rem" }}>{doc.specialty}</p>}
          </div>
          {doc.oneLinePitch && <p style={{ fontSize:"0.8125rem", color: isDark ? "rgba(201,168,92,0.85)" : "#7a6030", fontStyle:"italic", lineHeight:1.45 }}>&ldquo;{doc.oneLinePitch}&rdquo;</p>}
          {doc.shortIntro   && <p style={{ fontSize:"0.8125rem", color:subColor, lineHeight:1.6 }}>{doc.shortIntro}</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Doctors Section ─────────────────────────────────────────────────────────

function DoctorsSection({ snapshot }: { snapshot: SiteSnapshot }) {
  const sec = snapshot.homepage.sections.find(s => s.id === "doctors")
  if (!sec?.isEnabled) return null
  const v      = snapshot.homepage.sectionValues["doctors"] ?? {}
  const isDark = ((v.bgColor as string) || "dark") === "dark"
  const items  = snapshot.doctors.filter(d => d.isPublic)
  if (items.length === 0) return null

  const sTitle  = (v.title as string) || "— TATOA DOCTORS —"
  const stColor = (v.docSectionTitleColor as string) || (isDark ? `rgba(201,168,92,0.80)` : "#555")
  const stSize  = iSize((v.docSectionTitleSize as string) || "xl")
  const stFont  = getFontCss((v.docSectionTitleFont as string) || "serif")
  const stW     = (v.docSectionTitleWeight as string) || "600"

  const cs = resolveBoxStyle((v.cardPreset as string) || "glass-gold", isDark, {
    bg:     (v.cardBg     as string) || undefined,
    border: (v.cardBorder as string) || undefined,
    shadow: (v.cardShadow as string) || undefined,
    blur:   (v.cardBlur   as number) ?? 0,
    radius: (v.cardRadius as number) ?? 12,
  })

  const bgGrid = isDark
    ? { backgroundImage: ["linear-gradient(rgba(201,168,92,0.055) 1px,transparent 1px)", "linear-gradient(90deg,rgba(201,168,92,0.055) 1px,transparent 1px)"].join(","), backgroundSize: "28px 28px" }
    : {}

  return (
    <section style={{ ...sectionBg(isDark), ...bgGrid, paddingTop:"2.5rem", paddingBottom:"3rem" }}>
      <RevealBox>
        <div style={{ height:"4.5rem", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <p style={{ textAlign:"center", fontSize:stSize, fontWeight:stW, color:stColor, fontFamily:stFont, letterSpacing:"0.18em", textTransform:"uppercase", margin:0 }}>{sTitle}</p>
        </div>
      </RevealBox>
      <div className="max-w-6xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.slice(0, 6).map((doc, i) => (
          <RevealBox key={doc.id} delay={i * 80}>
            <SiteDoctorTiltCard doc={doc} isDark={isDark} cs={cs} />
          </RevealBox>
        ))}
      </div>
    </section>
  )
}

// ─── Equipment Section ────────────────────────────────────────────────────────

function EquipmentSection({ snapshot }: { snapshot: SiteSnapshot }) {
  const sec = snapshot.homepage.sections.find(s => s.id === "equipment")
  if (!sec?.isEnabled) return null
  const v      = snapshot.homepage.sectionValues["equipment"] ?? {}
  const isDark = ((v.bgColor as string) || "dark") === "dark"
  const items  = snapshot.equipment.filter(e => e.isPublic)
  if (items.length === 0) return null

  const sTitle  = (v.title as string) || "— OUR EQUIPMENT —"
  const stColor = (v.docSectionTitleColor as string) || (isDark ? `rgba(201,168,92,0.80)` : "#555")
  const stSize  = iSize((v.docSectionTitleSize as string) || "xl")
  const stFont  = getFontCss((v.docSectionTitleFont as string) || "serif")
  const stW     = (v.docSectionTitleWeight as string) || "600"

  const cs = resolveBoxStyle((v.cardPreset as string) || "glass-gold", isDark, { bg: (v.cardBg as string) || undefined, border: (v.cardBorder as string) || undefined, shadow: (v.cardShadow as string) || undefined, blur: (v.cardBlur as number) ?? 0, radius: (v.cardRadius as number) ?? 12 })
  const textColor = isDark ? "#f5f0e8" : "#1a1a1a"
  const subColor  = isDark ? "rgba(255,255,255,0.45)" : "#555"

  const bgGrid = isDark
    ? { backgroundImage: ["linear-gradient(rgba(201,168,92,0.055) 1px,transparent 1px)", "linear-gradient(90deg,rgba(201,168,92,0.055) 1px,transparent 1px)"].join(","), backgroundSize: "28px 28px" }
    : {}

  return (
    <section style={{ ...sectionBg(isDark), ...bgGrid, paddingTop: "2.5rem", paddingBottom: "3rem" }}>
      <RevealBox>
        <div style={{ height: "4.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ textAlign: "center", fontSize: stSize, fontWeight: stW, color: stColor, fontFamily: stFont, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>{sTitle}</p>
        </div>
      </RevealBox>
      <div className="max-w-6xl mx-auto px-8 grid grid-cols-2 md:grid-cols-3 gap-5">
        {items.slice(0, 6).map((eq, i) => {
          const imgSrc = eq.coverImageUrl || eq.image || ""
          return (
            <RevealBox key={eq.id} delay={i * 60}>
              <div style={{ borderRadius: cs.radius, background: cs.bg, border: cs.border, boxShadow: cs.shadow, backdropFilter: cs.blur ? `blur(${cs.blur}px)` : undefined, overflow: "hidden" }}>
                <div style={{ width: "100%", paddingTop: "75%", position: "relative", background: isDark ? "#1a1714" : "#e8e5e0" }}>
                  {imgSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgSrc} alt={eq.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "2.5rem", opacity: 0.2 }}>🔬</span></div>
                  )}
                </div>
                <div style={{ padding: "0.875rem 1rem 1rem" }}>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: textColor, lineHeight: 1.3 }}>{eq.name}</p>
                  {eq.description && <p style={{ fontSize: "0.8125rem", color: subColor, marginTop: "0.375rem", lineHeight: 1.55 }}>{eq.description}</p>}
                </div>
              </div>
            </RevealBox>
          )
        })}
      </div>
    </section>
  )
}

// ─── Gallery Section ──────────────────────────────────────────────────────────

function GallerySection({ snapshot }: { snapshot: SiteSnapshot }) {
  const sec = snapshot.homepage.sections.find(s => s.id === "gallery")
  if (!sec?.isEnabled) return null
  const v = snapshot.homepage.sectionValues["gallery"] ?? {}
  const images  = parseGalleryImages(v.galleryImages)
  const title   = (v.title as string) || "병원 둘러보기"
  const isDark  = ((v.galleryBg as string) || "dark") === "dark"
  const [activeIdx, setActiveIdx] = useState(0)

  const titleColor  = (v.titleColor  as string) || (isDark ? GOLD : "#111")
  const titleWeight = (v.titleWeight as string) || "700"
  const titleFont   = getFontCss((v.titleFont as string) || "sans")

  const safeIdx = images.length > 0 ? Math.min(activeIdx, images.length - 1) : 0
  const prev = () => setActiveIdx(i => (i - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1))
  const next = () => setActiveIdx(i => (i + 1) % Math.max(images.length, 1))

  return (
    <section style={{ background: isDark ? "#0e0c09" : "#f5f5f5", paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
      <p style={{ fontSize: iSize((v.titleSize as string) || "xl"), fontWeight: Number(titleWeight), fontFamily: titleFont, color: titleColor, letterSpacing: "0.10em", textTransform: "uppercase", textAlign: "center", marginBottom: "1.25rem" }}>{title}</p>
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", maxHeight: "70vh", overflow: "hidden" }}>
        {images.length > 0 && images[safeIdx]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[safeIdx].url} alt={images[safeIdx].label || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "2.5rem", opacity: 0.25 }}>🏥</span>
          </div>
        )}
        {images.length > 1 && (
          <>
            <button type="button" onClick={prev} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", width: "2.75rem", height: "2.75rem", borderRadius: "50%", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", fontSize: "1.375rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>‹</button>
            <button type="button" onClick={next} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", width: "2.75rem", height: "2.75rem", borderRadius: "50%", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", fontSize: "1.375rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>›</button>
            <div style={{ position: "absolute", bottom: "0.625rem", right: "0.875rem", background: "rgba(0,0,0,0.45)", borderRadius: "20px", padding: "0.1875rem 0.625rem", fontSize: "0.6875rem", color: "#fff", backdropFilter: "blur(4px)" }}>{safeIdx + 1} / {images.length}</div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div style={{ display: "flex", gap: "0.1875rem", padding: "0.5rem 0 0", overflowX: "auto", scrollbarWidth: "none" } as React.CSSProperties}>
          {images.map((img, i) => (
            <button key={img.id || i} type="button" onClick={() => setActiveIdx(i)} style={{ flexShrink: 0, width: "15%", aspectRatio: "4/3", overflow: "hidden", cursor: "pointer", padding: 0, border: "none", outline: i === safeIdx ? `2px solid ${GOLD}` : "none", outlineOffset: "-2px", opacity: i === safeIdx ? 1 : 0.5, transition: "all 0.2s", borderRadius: "3px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {img.url ? <img src={img.url} alt={img.label || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} /> : <div style={{ width: "100%", height: "100%", background: "#333" }} />}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Strengths Section ────────────────────────────────────────────────────────

function StrengthsSection({ snapshot }: { snapshot: SiteSnapshot }) {
  const sec = snapshot.homepage.sections.find(s => s.id === "strengths")
  if (!sec?.isEnabled) return null
  const v = snapshot.homepage.sectionValues["strengths"] ?? {}

  const s1Dark  = ((v.s1BgColor as string) || "dark") === "dark"
  const s2Dark  = ((v.s2BgColor as string) || "dark") === "dark"
  const s1Stats = parseSStats(v.s1Stats, DEFAULT_S1_STATS)
  const s2Stats = parseSStats(v.s2Stats, DEFAULT_S2_STATS)

  const s1SubLabel    = (v.s1SubLabel    as string) || "TATOA IN NUMBERS"
  const s1Headline    = (v.s1Headline    as string) || "시간이 증명한 아름다움의 기준"
  const s1Description = (v.s1Description as string) || "15년간 쌓아온 신뢰와 결과로 증명하는 타토아의 브랜드 파워"
  const s1MapImages   = parseS1MapImages(v.s1MapImages, (v.s1MapImage as string) || "")

  const s2Headline    = (v.s2Headline    as string) || "숫자로 보는 신뢰"
  const s2Description = (v.s2Description as string) || "타토아를 선택한 고객들의 진실된 재방문 데이터"
  const s2MapImages   = parseS1MapImages(v.s2MapImages)

  const s1SubColor = (v.s1SubLabelColor    as string) || GOLD
  const s1HColor   = (v.s1HeadlineColor    as string) || (s1Dark ? "#f5f0e8" : "#1a1a1a")
  const s1DColor   = (v.s1DescriptionColor as string) || (s1Dark ? "rgba(255,255,255,0.55)" : "#666")
  const s2HColor   = (v.s2HeadlineColor    as string) || (s2Dark ? "#f5f0e8" : "#1a1a1a")
  const s2DColor   = (v.s2DescriptionColor as string) || (s2Dark ? "rgba(255,255,255,0.55)" : "#666")

  const renderS1StatCard = (stat: StrengthStat) => {
    const cs  = resolveBoxStyle(stat.preset || "glass-gold", s1Dark)
    const valC = stat.valueColor || GOLD
    const lblC = stat.labelColor || (s1Dark ? "rgba(255,255,255,0.42)" : "#888")
    return (
      <div key={stat.id} style={{ flex: 1, borderRadius: cs.radius, background: cs.bg, border: cs.border, boxShadow: cs.shadow, padding: "1.25rem 0.75rem", textAlign: "center" }}>
        <p style={{ fontSize: "2rem", fontWeight: 700, color: valC, lineHeight: 1 }}>{stat.value}<span style={{ fontSize: "0.875rem", fontWeight: 400 }}>{stat.unit}</span></p>
        <p style={{ fontSize: "0.75rem", color: lblC, marginTop: "0.5rem", lineHeight: 1.3 }}>{stat.label}</p>
      </div>
    )
  }

  const renderS2StatCard = (stat: StrengthStat) => {
    const cs  = resolveBoxStyle(stat.preset || "glass-gold", s2Dark)
    const valC = stat.valueColor || GOLD
    const lblC = stat.labelColor || (s2Dark ? "rgba(255,255,255,0.42)" : "#888")
    const ct  = stat.chartType || "line"
    const num = parseFloat(stat.value.replace(/,/g, "")) || 0
    return (
      <div key={stat.id} style={{ borderRadius: cs.radius, background: cs.bg, border: cs.border, boxShadow: cs.shadow, padding: "1.125rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "0.8125rem", color: lblC, marginBottom: "0.375rem" }}>{stat.label}</p>
          <p style={{ fontSize: "2.25rem", fontWeight: 700, color: valC, lineHeight: 1 }}>{stat.value}<span style={{ fontSize: "1rem", fontWeight: 400 }}>{stat.unit}</span></p>
        </div>
        {ct === "line"   && <MiniLineChart color={valC} />}
        {ct === "circle" && <MiniCircleChart value={num} color={valC} />}
        {ct === "bar"    && <MiniBarChart color={valC} />}
      </div>
    )
  }

  const renderMapImg = (img: S1MapImg, i: number, isDark: boolean) => {
    const filt = buildS1Filter(img)
    const grad = buildGradient(img)
    const ratio = i === 0 ? "5/4" : "3/2"
    return (
      <div key={img.id} style={{ width: "100%", aspectRatio: ratio, borderRadius: "10px", overflow: "hidden", position: "relative" }}>
        {img.url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: img.position, filter: filt || undefined }} />
            {grad && <div style={{ position: "absolute", inset: 0, background: grad, pointerEvents: "none" }} />}
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "0.75rem", color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>이미지 {i + 1}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2">
      {/* Section 1 */}
      <div style={{ ...sectionBg(s1Dark), padding: "3rem 4rem 3rem 8%" }}>
        <RevealBox>
          <p style={{ fontSize: eSize((v.s1SubLabelSize as string) || "sm"), fontWeight: Number((v.s1SubLabelWeight as string) || "600"), fontFamily: getFontCss((v.s1SubLabelFont as string) || "sans"), color: s1SubColor, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>{s1SubLabel}</p>
          <p style={{ fontSize: hSize((v.s1HeadlineSize as string) || "md"), fontWeight: Number((v.s1HeadlineWeight as string) || "600"), fontFamily: getFontCss((v.s1HeadlineFont as string) || "sans"), color: s1HColor, lineHeight: 1.3, whiteSpace: "pre-line", marginBottom: "0.875rem" }}>{s1Headline}</p>
          <p style={{ fontSize: "0.9375rem", color: s1DColor, lineHeight: 1.55, marginBottom: "1.5rem" }}>{renderTextWithLineBreaks(String(s1Description ?? ""))}</p>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>{s1Stats.slice(0, 4).map(renderS1StatCard)}</div>
          {s1MapImages.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>{s1MapImages.map((img, i) => renderMapImg(img, i, s1Dark))}</div>}
        </RevealBox>
      </div>
      {/* Section 2 */}
      <div style={{ ...sectionBg(s2Dark), padding: "3rem 8% 3rem 4rem" }}>
        <RevealBox delay={120}>
          <p style={{ fontSize: hSize((v.s2HeadlineSize as string) || "md"), fontWeight: Number((v.s2HeadlineWeight as string) || "600"), fontFamily: getFontCss((v.s2HeadlineFont as string) || "sans"), color: s2HColor, lineHeight: 1.3, whiteSpace: "pre-line", marginBottom: "0.75rem" }}>{s2Headline}</p>
          <p style={{ fontSize: "0.9375rem", color: s2DColor, lineHeight: 1.55, marginBottom: "1.75rem" }}>{renderTextWithLineBreaks(String(s2Description ?? ""))}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>{s2Stats.map(renderS2StatCard)}</div>
          {s2MapImages.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>{s2MapImages.map((img, i) => renderMapImg(img, i, s2Dark))}</div>}
        </RevealBox>
      </div>
    </div>
  )
}

// ─── Branch Info Section ──────────────────────────────────────────────────────

function BranchInfoSection({ snapshot }: { snapshot: SiteSnapshot }) {
  const sec = snapshot.homepage.sections.find(s => s.id === "branch-info")
  if (!sec?.isEnabled) return null
  const v = snapshot.homepage.sectionValues["branch-info"] ?? {}
  const isDark = ((v.biBgColor as string) || "dark") === "dark"
  const cards  = parseBranchCards(v.branchCards)

  const subText   = (v.biSubLabel      as string) || "OUR BRANCHES"
  const subColor  = (v.biSubLabelColor as string) || GOLD
  const subSize   = eSize((v.biSubLabelSize as string) || "sm")
  const subWeight = (v.biSubLabelWeight as string) || "600"

  const titleText   = (v.biTitle       as string) || "Global Network"
  const titleColor  = (v.biTitleColor  as string) || (isDark ? "#f5f0e8" : "#1a1a1a")
  const titleSize   = hSize((v.biTitleSize as string) || "md")
  const titleWeight = (v.biTitleWeight as string) || "700"
  const titleFont   = getFontCss((v.biTitleFont as string) || "sans")

  const visibleCards = cards.slice(0, 5)
  const extraCount   = Math.max(0, cards.length - 5)

  return (
    <section style={{ ...sectionBg(isDark), paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
      <div className="px-8 md:px-16 mb-5">
        <p style={{ fontSize: subSize, fontWeight: subWeight, color: subColor, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.5rem" }}>{subText}</p>
        <p style={{ fontSize: titleSize, fontWeight: titleWeight, fontFamily: titleFont, color: titleColor, lineHeight: 1.18 }}>{titleText}</p>
      </div>
      <div style={{ display: "flex", gap: "1.25rem", overflowX: "auto", padding: "0 4rem 0.5rem", scrollSnapType: "x mandatory", scrollbarWidth: "none" } as React.CSSProperties}>
        {visibleCards.map((card, idx) => {
          const filt = (() => { const p: string[] = []; const eff = IMG_EFFECTS[card.imgEffectId || "none"]; if (eff) p.push(eff); if (card.imgBrightness !== 100) p.push(`brightness(${card.imgBrightness}%)`); if (card.imgContrast !== 100) p.push(`contrast(${card.imgContrast}%)`); if (card.imgSaturate !== 100) p.push(`saturate(${card.imgSaturate}%)`); if (card.imgHue !== 0) p.push(`hue-rotate(${card.imgHue}deg)`); return p.join(" ") })()
          const overlayAlpha = ((card.imgOverlayOpacity ?? 30) / 100).toFixed(2)
          const fadeStop = Math.max(0, 100 - (card.imgFade ?? 65))
          return (
            <div key={card.id} style={{ flexShrink: 0, width: "280px", aspectRatio: "2/3", borderRadius: "12px", overflow: "hidden", position: "relative", scrollSnapAlign: "start", background: isDark ? "#1c1c1c" : "#d8d8d8", ...(idx === 0 ? { marginLeft: 0 } : {}) }}>
              {card.imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.imgUrl} alt={card.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: card.imgPosition, filter: filt || undefined }} />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "2.5rem", opacity: 0.15 }}>🏥</span></div>
              )}
              <div style={{ position: "absolute", inset: 0, background: `rgba(${hexToRgb(card.imgOverlay || "#000000")},${overlayAlpha})`, mixBlendMode: (card.imgBlend || "normal") as React.CSSProperties["mixBlendMode"] }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0) ${fadeStop}%)` }} />
              <div style={{ position: "absolute", bottom: "1rem", left: "1rem", right: "1rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 500, color: "rgba(255,255,255,0.58)", letterSpacing: "0.1em", marginBottom: "0.25rem", textTransform: "uppercase" }}>{card.region || "REGION · COUNTRY"}</p>
                <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: "0.25rem" }}>{card.name || "Branch Name"}</p>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.52)", lineHeight: 1.35 }}>{card.feature || "Feature tagline"}</p>
              </div>
            </div>
          )
        })}
        {extraCount > 0 && (
          <div style={{ flexShrink: 0, width: "120px", aspectRatio: "2/3", borderRadius: "12px", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.22)" }}>+{extraCount}</p>
            <p style={{ fontSize: "0.6875rem", color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)" }}>더보기</p>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Location / Info Section ──────────────────────────────────────────────────

function LocationSection({ snapshot }: { snapshot: SiteSnapshot }) {
  const sec = snapshot.homepage.sections.find(s => s.id === "location")
  if (!sec?.isEnabled) return null
  const v      = snapshot.homepage.sectionValues["location"] ?? {}
  const isDark = ((v.infoBgColor as string) || "dark") === "dark"
  const branch = snapshot.branch

  const titleColor  = (v.infoTitleColor  as string) || (isDark ? GOLD : "#1a1a1a")
  const titleSize   = iSize((v.infoTitleSize as string) || "xl")
  const titleWeight = (v.infoTitleWeight as string) || "700"
  const titleFont   = getFontCss((v.infoTitleFont as string) || "sans")

  const addrBox    = resolveInfoBox("addr", v as Record<string, unknown>, isDark)
  const addrTitle  = (v.addrTitle  as string) || "주소 / 연락처"
  const addrBody   = (v.addrBody   as string) || branch.address || ""
  const addrPhone  = (v.addrPhone  as string) || branch.phone || ""
  const addrTitleC = (v.addrTitleColor as string) || (isDark ? GOLD : "#1a1a1a")
  const addrBodyC  = (v.addrBodyColor  as string) || (isDark ? "rgba(255,255,255,0.72)" : "#555")
  const addrPhoneC = (v.addrPhoneColor as string) || (isDark ? GOLD : "#1a1a1a")

  const hoursBox   = resolveInfoBox("hours", v as Record<string, unknown>, isDark)
  const hoursTitle = (v.hoursTitle as string) || "진료 시간"
  const hoursLines = parseHoursLines(v.hoursBody || branch.businessHours || "")
  const hoursTitleC = (v.hoursTitleColor as string) || (isDark ? GOLD : "#1a1a1a")
  const hoursBodyC  = (v.hoursBodyColor  as string) || (isDark ? "rgba(255,255,255,0.72)" : "#555")

  const mapUrl = normalizeMapUrl((v.mapEmbedUrl as string) || branch.naverMapUrl || "")

  return (
    <section style={{ ...sectionBg(isDark), padding: "2.5rem 0 3rem" }}>
      <div className="max-w-6xl mx-auto px-8 md:px-16">
        <p style={{ fontSize: titleSize, fontWeight: titleWeight, fontFamily: titleFont, color: titleColor, letterSpacing: "0.12em", textAlign: "center", marginBottom: "1.5rem" }}>
          {(v.infoTitle as string) || "INFO"}
        </p>
        <div className="grid md:grid-cols-5 gap-6" style={{ alignItems: "stretch" }}>
          {/* Map 60% */}
          <div className="md:col-span-3" style={{ minHeight: "320px", borderRadius: "12px", overflow: "hidden" }}>
            {mapUrl ? (
              <iframe src={mapUrl} width="100%" height="100%" style={{ border: 0, display: "block", minHeight: "320px" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen title="지도" />
            ) : (
              <div style={{ width: "100%", height: "100%", minHeight: "320px", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px dashed ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`, borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <MapPin className="h-8 w-8" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }} />
                <span style={{ fontSize: "0.8125rem", color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)" }}>지도 미연결</span>
              </div>
            )}
          </div>
          {/* Info boxes 40% */}
          <div className="md:col-span-2" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {/* Address */}
            <div style={{ background: addrBox.bg, border: addrBox.border, boxShadow: addrBox.shadow, backdropFilter: addrBox.blur > 0 ? `blur(${addrBox.blur}px)` : undefined, borderRadius: addrBox.radius, padding: "1.25rem 1.5rem" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: addrTitleC, marginBottom: "0.625rem", letterSpacing: "0.04em" }}>{addrTitle}</p>
              {addrBody && <p style={{ fontSize: "0.875rem", color: addrBodyC, lineHeight: 1.65, whiteSpace: "pre-line", marginBottom: "0.5rem" }}>{addrBody}</p>}
              {addrPhone && (
                <p style={{ fontSize: "1rem", fontWeight: 700, color: addrPhoneC, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Phone size={14} />{addrPhone}
                </p>
              )}
            </div>
            {/* Hours */}
            <div style={{ background: hoursBox.bg, border: hoursBox.border, boxShadow: hoursBox.shadow, backdropFilter: hoursBox.blur > 0 ? `blur(${hoursBox.blur}px)` : undefined, borderRadius: hoursBox.radius, padding: "1.25rem 1.5rem" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: hoursTitleC, marginBottom: "0.625rem", letterSpacing: "0.04em" }}>{hoursTitle}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                {hoursLines.length > 0 ? hoursLines.map(line => (
                  <div key={line.id} style={{ fontSize: line.size === "sm" ? "0.8125rem" : "0.9375rem", lineHeight: 1.6 }}>
                    <span style={{ fontWeight: (v.hoursBodyWeight as string) || "400", color: resolveHoursColor(line.color, isDark, hoursBodyC) }}>{line.text}</span>
                    {line.suffix && <span style={{ fontSize: "0.75rem", color: resolveHoursColor(line.suffixColor, isDark, isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)"), marginLeft: "0.375rem" }}>{line.suffix}</span>}
                  </div>
                )) : (
                  <p style={{ fontSize: "0.875rem", color: hoursBodyC, lineHeight: 1.65, whiteSpace: "pre-line" }}>{branch.businessHours || ""}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer Section ───────────────────────────────────────────────────────────

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

function FooterSection({ snapshot }: { snapshot: SiteSnapshot }) {
  const v = snapshot.homepage.sectionValues["footer"] ?? {}

  // ── PC / mobile 분기 (matchMedia)
  const [isDesktop, setIsDesktop] = useState(true)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 768px)")
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  // ── 사업자 정보 (새 키 우선, 옛 키 fallback for legacy snapshots)
  const hospitalName   = (v.footerHospitalName   as string) || (v.clinicName as string) || (v.clinicLegalName as string) || snapshot.branch.name || ""
  const corporateName  = (v.footerCorporateName  as string) || ""
  const businessNumber = (v.footerBusinessNumber as string) || (v.businessNumber as string) || ""
  const ceoName        = (v.footerCEOName        as string) || (v.representative as string) || (v.ceoName as string) || ""
  const licenseNumber  = (v.footerLicenseNumber  as string) || (v.medicalLicenseNumber as string) || ""
  const phone          = (v.footerPhone          as string) || (v.phone as string) || snapshot.branch.phone || ""
  const address        = (v.footerAddress        as string) || (v.address as string) || snapshot.branch.address || ""

  // ── 정책 링크 (toggle on만)
  const policies = [
    { enabled: (v.footerTermsToggle        as boolean) ?? false, url: (v.footerTermsUrl        as string) ?? "", label: "이용약관" },
    { enabled: ((v.footerPrivacyToggle as boolean) ?? (v.showPrivacyLink as boolean)) ?? true, url: (v.footerPrivacyUrl as string) ?? "", label: "개인정보처리방침" },
    { enabled: (v.footerEmailRefuseToggle  as boolean) ?? false, url: (v.footerEmailRefuseUrl  as string) ?? "", label: "이메일수집거부" },
    { enabled: (v.footerNonCoveredToggle   as boolean) ?? false, url: (v.footerNonCoveredUrl   as string) ?? "", label: "비급여진료비용안내" },
  ]

  // ── 소셜 미디어 (toggle on만)
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

  // ── 카피라이트 (custom/auto 분기 + legacy fallback)
  const currentYear = new Date().getFullYear()
  const copyrightMode = (v.footerCopyrightMode as string) ?? "auto"
  const copyrightText = (v.footerCopyrightText as string) ?? ""
  const copyright = copyrightMode === "custom" && copyrightText
    ? copyrightText
    : ((v.copyright as string) || ("© " + currentYear + " " + (hospitalName || snapshot.branch.name || "TATOA") + ". All rights reserved."))

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
    <footer style={{
      backgroundColor: bgColor,
      padding: isDesktop ? "60px 15%" : "40px 24px",
      color: linkColor,
    }}>
      {/* 1. 정책 링크 */}
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
            marginLeft: "auto",
            marginRight: "auto",
          }} />
      ) : (
        hospitalName && (
          <div style={{
            fontSize: isDesktop ? 24 : 20, fontWeight: 600,
            marginBottom: 16,
            textAlign: "center",
          }}>
            {hospitalName}
          </div>
        )
      )}

      {/* 5. 사업자 정보 */}
      <div style={{
        fontSize: 13, color: mutedColor, lineHeight: 1.7,
        textAlign: "center",
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
        textAlign: "center",
      }}>
        {copyright}
      </div>
    </footer>
  )
}

// ─── Popup ────────────────────────────────────────────────────────────────────

function SitePopup({ snapshot }: { snapshot: SiteSnapshot }) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const popup = snapshot.homepage.popupData

  useEffect(() => {
    if (!popup?.enabled || !popup.items?.length) return
    const timer = setTimeout(() => setOpen(true), 800)
    return () => clearTimeout(timer)
  }, [popup])

  if (!popup?.enabled || !popup.items?.length || dismissed || !open) return null

  const item = popup.items[0]
  const filter = `brightness(${item.brightness ?? 100}%) contrast(${item.contrast ?? 100}%) saturate(${item.saturate ?? 100}%) hue-rotate(${item.hue ?? 0}deg)`

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50" onClick={() => setDismissed(true)}>
      <div className="relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="팝업" className="w-full rounded-xl shadow-2xl" style={{ filter }} />
        ) : (
          <div className="bg-white rounded-xl p-8 text-center shadow-2xl"><p className="text-neutral-500 text-sm">팝업 이미지가 없습니다</p></div>
        )}
        <div className="flex items-center justify-between mt-2 px-1">
          <button onClick={() => setDismissed(true)} className="text-white/80 text-xs hover:text-white">오늘 하루 보지 않기</button>
          <button onClick={() => setOpen(false)} className="text-white/80 text-xs hover:text-white">닫기</button>
        </div>
      </div>
    </div>
  )
}

// ─── Section icon overlay ─────────────────────────────────────────────────────

function SectionWithIcons({ sectionId, snapshot, children }: {
  sectionId: string
  snapshot: SiteSnapshot
  children: React.ReactNode
}) {
  const v = snapshot.homepage.sectionValues[sectionId] ?? {}
  const cfgs = parseIconConfigs((v.iconConfigs ?? v.iconConfig) as unknown)
  if (cfgs.length === 0) return <>{children}</>
  return (
    <div style={{ position: "relative" }}>
      {children}
      {cfgs.map((cfg, idx) => <RenderSectionIcon key={idx} config={cfg} />)}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomepagePreviewPage() {
  const { snapshot } = useHomepagePreview()
  if (!snapshot) return null

  const sectionOrder = snapshot.homepage.sections

  return (
    <>
      <SitePopup snapshot={snapshot} />
      <SectionWithIcons sectionId="hero" snapshot={snapshot}>
        <HeroSection snapshot={snapshot} />
      </SectionWithIcons>
      {sectionOrder.map(section => {
        if (!section.isEnabled) return null
        const inner = (() => {
          switch (section.id) {
            case "events":      return <EventsSection      snapshot={snapshot} />
            case "philosophy":  return <PhilosophySection  snapshot={snapshot} />
            case "doctors":     return <DoctorsSection      snapshot={snapshot} />
            case "equipment":   return <EquipmentSection    snapshot={snapshot} />
            case "gallery":     return <GallerySection      snapshot={snapshot} />
            case "strengths":   return <StrengthsSection    snapshot={snapshot} />
            case "branch-info": return <BranchInfoSection   snapshot={snapshot} />
            case "location":    return <LocationSection     snapshot={snapshot} />
            default:            return null
          }
        })()
        if (!inner) return null
        return (
          <SectionWithIcons key={section.id} sectionId={section.id} snapshot={snapshot}>
            {inner}
          </SectionWithIcons>
        )
      })}
      <SectionWithIcons sectionId="footer" snapshot={snapshot}>
        <FooterSection snapshot={snapshot} />
      </SectionWithIcons>
    </>
  )
}
