"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  MessageCircle, CalendarDays, Building2,
  Layers, Sparkles, Syringe, Zap, Sun, Heart, Leaf, Droplets, Activity, Star,
  ChevronLeft, ChevronRight, Search, X, MapPin,
} from "lucide-react"

// ─── Core types ───────────────────────────────────────────────────────────────

export type FieldValue = string | boolean | string[] | number

export type HomeSectionId =
  | "hero" | "events" | "philosophy" | "doctors" | "equipment"
  | "gallery" | "strengths" | "branch-info" | "location" | "footer"

// ─── Font & size constants ────────────────────────────────────────────────────

export const FONTS = [
  { key: "sans",    label: "고딕",   css: "system-ui, -apple-system, 'Apple SD Gothic Neo', sans-serif" },
  { key: "serif",   label: "명조",   css: "Georgia, 'Noto Serif KR', serif" },
  { key: "classic", label: "클래식", css: "'Playfair Display', Georgia, serif" },
  { key: "mono",    label: "모노",   css: "ui-monospace, 'Courier New', monospace" },
]

export const BLOCK_SIZES: Record<string, { key: string; label: string; previewPx: number; editorLabel: string }[]> = {
  eyebrow: [
    { key: "xs", label: "XS", previewPx: 7,  editorLabel: "극소" },
    { key: "sm", label: "S",  previewPx: 8,  editorLabel: "소" },
    { key: "md", label: "M",  previewPx: 9,  editorLabel: "중" },
    { key: "lg", label: "L",  previewPx: 11, editorLabel: "대" },
  ],
  headline: [
    { key: "sm",  label: "S",   previewPx: 12, editorLabel: "소" },
    { key: "md",  label: "M",   previewPx: 16, editorLabel: "중" },
    { key: "lg",  label: "L",   previewPx: 20, editorLabel: "대" },
    { key: "xl",  label: "XL",  previewPx: 26, editorLabel: "특대" },
  ],
  subcopy: [
    { key: "xs", label: "XS", previewPx: 7,  editorLabel: "극소" },
    { key: "sm", label: "S",  previewPx: 8,  editorLabel: "소" },
    { key: "md", label: "M",  previewPx: 10, editorLabel: "중" },
    { key: "lg", label: "L",  previewPx: 12, editorLabel: "대" },
  ],
}

export function getSizePx(group: string, key: string): number {
  return BLOCK_SIZES[group]?.find(s => s.key === key)?.previewPx ?? 10
}

// ─── Doctor card size map (philosophy-style: xs=11 … xl=27) ──────────────────
export const DOCTOR_SIZE_MAP: Record<string, number> = {
  xs: 11, sm: 15, md: 19, lg: 23, xl: 27,
}

// ─── stripHtml: RTE HTML → plain text with \n preserved ──────────────────────
function stripDoctorHtml(s: string | undefined | null): string {
  if (!s) return ""
  return s
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)\s*>/gi, "\n")
    .replace(/<(p|div|h[1-6]|li)[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{2,}/g, "\n")
    .trim()
}

// stripDoctorHtml과 동일하되 빈 줄 + 앞/뒤 공백 보존 — renderTextWithLineBreaks 전용
function stripHtmlPreserveBreaks(s: string | undefined | null): string {
  if (!s) return ""
  const raw = String(s)
  const hadHtml = /<[^>]+>/.test(raw)
  let out = raw
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)\s*>/gi, "")
    .replace(/<(p|div|h[1-6]|li)[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
  if (hadHtml) out = out.replace(/^\n/, "")
  return out
}

// ─── renderTextWithLineBreaks: 빈 줄 포함 줄바꿈 보존 렌더 ──────────────────
// stripDoctorHtml과 달리 \n{2,} 를 collapse하지 않아 빈 줄이 보존됨.
// 사용: <p>{renderTextWithLineBreaks(text)}</p>  (whiteSpace: pre-line 불필요)
export function renderTextWithLineBreaks(text: string): React.JSX.Element[] {
  if (!text) return []
  const stripped = stripHtmlPreserveBreaks(text)
  return stripped.split("\n").map((line, i, arr) => (
    <span key={i}>
      {line || " "}
      {i < arr.length - 1 && <br />}
    </span>
  ))
}

export function getFontCss(key: string): string {
  return FONTS.find(f => f.key === key)?.css ?? FONTS[0].css
}

// ─── IMG_EFFECTS & IMG_POSITIONS ────────────────────────────────────────────

export const IMG_EFFECTS = [
  { id: "none",     label: "원본",     filter: "" },
  { id: "bright",   label: "밝게",     filter: "brightness(1.25) contrast(1.05)" },
  { id: "dark",     label: "어둡게",   filter: "brightness(0.72) contrast(1.1)" },
  { id: "bw",       label: "흑백",     filter: "grayscale(1)" },
  { id: "warm",     label: "따뜻하게", filter: "sepia(0.28) saturate(1.25) brightness(1.05)" },
  { id: "cool",     label: "차갑게",   filter: "saturate(0.75) hue-rotate(-18deg) brightness(1.05)" },
  { id: "sharp",    label: "선명하게", filter: "contrast(1.18) saturate(1.12)" },
  { id: "soft",     label: "부드럽게", filter: "brightness(1.08) saturate(0.88) contrast(0.92)" },
  { id: "vintage",  label: "빈티지",   filter: "sepia(0.55) contrast(0.9) brightness(0.95) saturate(0.85)" },
  { id: "faded",    label: "페이디드",  filter: "brightness(1.1) saturate(0.6) contrast(0.85)" },
  { id: "dramatic", label: "드라마틱",  filter: "contrast(1.35) saturate(1.2) brightness(0.9)" },
  { id: "matte",    label: "매트",     filter: "contrast(0.88) saturate(0.8) brightness(1.05)" },
  { id: "cinema",   label: "시네마",   filter: "contrast(1.12) saturate(0.72) brightness(0.85) sepia(0.12)" },
  { id: "ethereal", label: "에테리얼",  filter: "brightness(1.15) saturate(0.55) contrast(0.9) hue-rotate(8deg)" },
] as const

export const IMG_POSITIONS = [
  { v: "top left",    label: "↖" }, { v: "top center",    label: "↑" }, { v: "top right",    label: "↗" },
  { v: "center left", label: "←" }, { v: "center",        label: "⊙" }, { v: "center right", label: "→" },
  { v: "bottom left", label: "↙" }, { v: "bottom center", label: "↓" }, { v: "bottom right", label: "↘" },
] as const

// ─── Hero Image Config ────────────────────────────────────────────────────────

export type HeroImgCfg = {
  effectId: string; brightness: number; contrast: number; saturate: number; hue: number
  position: string
  gradDir: string; gradColor: string; gradOpacity: number
  shadowPreset: string; shadowColor: string
}

export const DEFAULT_HERO_IMG_CFG: HeroImgCfg = {
  effectId: "none", brightness: 100, contrast: 100, saturate: 100, hue: 0,
  position: "center",
  gradDir: "to bottom", gradColor: "#000000", gradOpacity: 0,
  shadowPreset: "none", shadowColor: "#000000",
}

export function parseHeroImgCfg(raw: FieldValue): HeroImgCfg {
  try {
    const p = JSON.parse((raw as string) || "{}")
    if (p && typeof p === "object") return { ...DEFAULT_HERO_IMG_CFG, ...p }
  } catch {}
  return { ...DEFAULT_HERO_IMG_CFG }
}

export function buildHeroImgFilter(cfg: HeroImgCfg): string {
  const parts: string[] = []
  if (cfg.brightness !== 100) parts.push("brightness(" + cfg.brightness + "%)")
  if (cfg.contrast   !== 100) parts.push("contrast(" + cfg.contrast + "%)")
  if (cfg.saturate   !== 100) parts.push("saturate(" + cfg.saturate + "%)")
  if (cfg.hue        !== 0)   parts.push("hue-rotate(" + cfg.hue + "deg)")
  const eff = IMG_EFFECTS.find(e => e.id === cfg.effectId)
  if (eff?.filter) parts.push(eff.filter)
  return parts.join(" ")
}

// ─── hexToRgb ────────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): string {
  const h = (hex || "#000000").replace("#", "")
  const r = parseInt(h.slice(0, 2), 16) || 0
  const g = parseInt(h.slice(2, 4), 16) || 0
  const b = parseInt(h.slice(4, 6), 16) || 0
  return r + "," + g + "," + b
}

// ─── HERO_HEIGHT_PAGE ────────────────────────────────────────────────────────

export const HERO_HEIGHT_PAGE = 392

// ─── Event card types & helpers ──────────────────────────────────────────────

export type EventCard = {
  id: string
  title: string
  subtitle: string
  url: string
  imgUrl: string
  imgPosition: string
  imgEffectId: string
  imgBrightness: number
  imgContrast: number
  imgSaturate: number
  imgHue: number
  imgOverlay: string
  imgOverlayOpacity: number
  imgFade: number
  imgBlend: string
}

export const DEFAULT_EVENT_CARDS: EventCard[] = [
  { id:"ev1", title:"엘라비에 리투오 특가", subtitle:"사람 콜라겐을 직접 주입, 즉각적인 강한 효과", url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:25, imgFade:55, imgBlend:"normal" },
  { id:"ev2", title:"봄 리프팅 패키지",     subtitle:"V라인 완성의 시작",                          url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:25, imgFade:55, imgBlend:"normal" },
  { id:"ev3", title:"피부 재생 스페셜",     subtitle:"최상의 컨디션으로 되돌아오세요",              url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:25, imgFade:55, imgBlend:"normal" },
]

export function parseEventCards(raw: FieldValue): EventCard[] {
  try {
    const parsed = JSON.parse((raw as string) || "[]")
    if (Array.isArray(parsed) && parsed.length > 0) {
      return (parsed as EventCard[]).map(c => ({
        id: c.id || ("ev" + Date.now()),
        title: c.title || "", subtitle: c.subtitle || "", url: c.url || "",
        imgUrl: c.imgUrl || "", imgPosition: c.imgPosition || "center",
        imgEffectId: c.imgEffectId || "none",
        imgBrightness: c.imgBrightness ?? 100, imgContrast: c.imgContrast ?? 100,
        imgSaturate: c.imgSaturate ?? 100, imgHue: c.imgHue ?? 0,
        imgOverlay: c.imgOverlay || "#000000", imgOverlayOpacity: c.imgOverlayOpacity ?? 25,
        imgFade: c.imgFade ?? 55, imgBlend: c.imgBlend || "normal",
      }))
    }
  } catch {}
  return DEFAULT_EVENT_CARDS
}

// ─── Philosophy image types & helpers ────────────────────────────────────────

export type PhiloImage = {
  id: string
  mobile: string
  pc: string
  effectId: string
  brightness: number
  contrast: number
  saturate: number
  hue: number
  position: string
  gradDir: string
  gradColor: string
  gradOpacity: number
  shadowPreset: string
  shadowColor: string
}

export function parsePhiloImages(raw: FieldValue, legacyImage?: string): PhiloImage[] {
  const hasExplicit = raw !== undefined && raw !== null && raw !== ""
  try {
    const parsed = JSON.parse((raw as string) || "[]")
    if (Array.isArray(parsed)) {
      if (parsed.length > 0) {
        return (parsed as Partial<PhiloImage>[]).map(img => ({
          id: img.id || ("phi" + Date.now()),
          mobile: img.mobile || "",
          pc: img.pc || "",
          effectId: img.effectId || "none",
          brightness: img.brightness ?? 100,
          contrast: img.contrast ?? 100,
          saturate: img.saturate ?? 100,
          hue: img.hue ?? 0,
          position: img.position || "center",
          gradDir:      img.gradDir      || "to bottom",
          gradColor:    img.gradColor    || "#000000",
          gradOpacity:  img.gradOpacity  ?? 0,
          shadowPreset: img.shadowPreset || "none",
          shadowColor:  img.shadowColor  || "#000000",
        }))
      }
      if (hasExplicit) return []
    }
  } catch {}
  if (!hasExplicit && legacyImage) return [{ id: "phi-legacy", mobile: legacyImage, pc: "", effectId: "none", brightness: 100, contrast: 100, saturate: 100, hue: 0, position: "center", gradDir: "to bottom", gradColor: "#000000", gradOpacity: 0, shadowPreset: "none", shadowColor: "#000000" }]
  return []
}

export function buildPhiloImgFilter(img: PhiloImage): string {
  const parts: string[] = []
  if (img.brightness !== 100) parts.push("brightness(" + img.brightness + "%)")
  if (img.contrast   !== 100) parts.push("contrast(" + img.contrast + "%)")
  if (img.saturate   !== 100) parts.push("saturate(" + img.saturate + "%)")
  if (img.hue        !== 0)   parts.push("hue-rotate(" + img.hue + "deg)")
  const eff = IMG_EFFECTS.find(e => e.id === img.effectId)
  if (eff?.filter) parts.push(eff.filter)
  return parts.join(" ")
}

export function buildPhiloGradient(img: PhiloImage): string {
  if (!img.gradOpacity) return ""
  const rgba = "rgba(" + hexToRgb(img.gradColor || "#000000") + "," + (img.gradOpacity / 100).toFixed(2) + ")"
  if (img.gradDir === "radial")
    return "radial-gradient(ellipse at center, " + rgba + " 0%, transparent 70%)"
  if (img.gradDir === "radial-edge")
    return "radial-gradient(ellipse at center, transparent 30%, " + rgba + " 100%)"
  return "linear-gradient(" + (img.gradDir || "to bottom") + ", transparent 0%, " + rgba + " 100%)"
}

export function buildPhiloShadow(img: PhiloImage): string {
  const rgb = hexToRgb(img.shadowColor || "#000000")
  switch (img.shadowPreset) {
    case "sm":   return "0 2px 10px rgba(" + rgb + ",0.25)"
    case "md":   return "0 4px 20px rgba(" + rgb + ",0.38), 0 2px 8px rgba(" + rgb + ",0.18)"
    case "lg":   return "0 8px 36px rgba(" + rgb + ",0.48), 0 4px 14px rgba(" + rgb + ",0.24)"
    case "xl":   return "0 16px 56px rgba(" + rgb + ",0.56), 0 8px 24px rgba(" + rgb + ",0.3)"
    case "glow": return "0 0 28px rgba(" + rgb + ",0.65), 0 0 10px rgba(" + rgb + ",0.45)"
    default:     return "none"
  }
}

// ─── Doctor / Equipment item types ───────────────────────────────────────────

export type DoctorItem = {
  id: string; name: string; title: string; specialty: string; specialties: string[]
  image: string; isFeatured: boolean; description?: string; shortIntro?: string
  homepageQuote?: string
  consultUrl?: string
  careers: Array<{ id: string; organization: string; roleOrDescription: string; sortOrder: number }>
  academics: Array<{ id: string; name: string; sortOrder: number }>
  strengths: string[]
}
export type EquipItem = { id: string; name: string; image: string; isFeatured: boolean; description: string }

// ─── Box style presets ────────────────────────────────────────────────────────

export const BOX_PRESETS_DARK = [
  { id: "default",         label: "글라스",          bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", shadow: "none" },
  { id: "glass-gold",      label: "글라스 골드",     bg: "rgba(201,168,92,0.15)",  border: "rgba(201,168,92,0.30)",  shadow: "0 4px 16px rgba(201,168,92,0.20)" },
  { id: "gradient-gold",   label: "그라데이션 골드",  bg: "linear-gradient(135deg,rgba(201,168,92,0.35) 0%,rgba(100,70,20,0.18) 100%)", border: "rgba(201,168,92,0.35)", shadow: "0 6px 24px rgba(201,168,92,0.25)" },
  { id: "gradient-teal",   label: "그라데이션 틸",    bg: "linear-gradient(135deg,rgba(32,178,170,0.32) 0%,rgba(0,100,100,0.18) 100%)", border: "rgba(32,178,170,0.30)", shadow: "0 6px 24px rgba(32,178,170,0.20)" },
  { id: "gradient-purple", label: "그라데이션 퍼플",  bg: "linear-gradient(135deg,rgba(139,92,246,0.32) 0%,rgba(80,20,160,0.18) 100%)", border: "rgba(139,92,246,0.30)", shadow: "0 6px 24px rgba(139,92,246,0.20)" },
  { id: "solid-dark",      label: "솔리드 다크",      bg: "rgba(8,8,8,0.90)",       border: "rgba(255,255,255,0.08)", shadow: "0 8px 24px rgba(0,0,0,0.45)" },
  { id: "outline",         label: "아웃라인",          bg: "transparent",            border: "rgba(255,255,255,0.22)", shadow: "none" },
] as const

export const BOX_PRESETS_LIGHT = [
  { id: "default",         label: "기본",             bg: "#ffffff",                border: "rgba(0,0,0,0.08)",  shadow: "0 2px 12px rgba(0,0,0,0.07)" },
  { id: "glass-gold",      label: "골드 포인트",      bg: "rgba(201,168,92,0.08)",  border: "rgba(201,168,92,0.25)", shadow: "0 4px 16px rgba(201,168,92,0.12)" },
  { id: "gradient-gold",   label: "그라데이션 골드",  bg: "linear-gradient(135deg,rgba(201,168,92,0.15) 0%,rgba(255,252,240,0.9) 100%)", border: "rgba(201,168,92,0.22)", shadow: "0 6px 24px rgba(201,168,92,0.12)" },
  { id: "gradient-teal",   label: "그라데이션 틸",    bg: "linear-gradient(135deg,rgba(32,178,170,0.14) 0%,rgba(245,255,255,0.95) 100%)", border: "rgba(32,178,170,0.20)", shadow: "0 6px 24px rgba(32,178,170,0.10)" },
  { id: "gradient-purple", label: "그라데이션 퍼플",  bg: "linear-gradient(135deg,rgba(139,92,246,0.14) 0%,rgba(248,245,255,0.95) 100%)", border: "rgba(139,92,246,0.20)", shadow: "0 6px 24px rgba(139,92,246,0.10)" },
  { id: "solid-cream",     label: "크림",             bg: "#faf8f3",                border: "rgba(0,0,0,0.06)",  shadow: "0 4px 20px rgba(0,0,0,0.08)" },
  { id: "outline",         label: "아웃라인",          bg: "transparent",            border: "rgba(0,0,0,0.15)",  shadow: "none" },
] as const

export const SHADOW_PRESETS = [
  { id: "none",        label: "없음",       css: "none" },
  { id: "soft",        label: "부드럽게",   css: "0 4px 20px rgba(0,0,0,0.18)" },
  { id: "medium",      label: "보통",       css: "0 8px 32px rgba(0,0,0,0.30)" },
  { id: "strong",      label: "강하게",     css: "0 12px 48px rgba(0,0,0,0.48), 0 2px 8px rgba(0,0,0,0.30)" },
  { id: "glow-gold",   label: "골드 글로우", css: "0 0 28px 4px rgba(201,168,92,0.45), 0 4px 16px rgba(201,168,92,0.25)" },
  { id: "glow-teal",   label: "틸 글로우",   css: "0 0 28px 4px rgba(32,178,170,0.45), 0 4px 16px rgba(32,178,170,0.25)" },
  { id: "glow-purple", label: "퍼플 글로우", css: "0 0 28px 4px rgba(139,92,246,0.45), 0 4px 16px rgba(139,92,246,0.25)" },
] as const

export function resolveCardStyle(v: Record<string, FieldValue>, isDark: boolean, active: boolean) {
  const presets = isDark ? BOX_PRESETS_DARK : BOX_PRESETS_LIGHT
  const presetId = (v.cardPreset as string) || "glass-gold"
  const ps = presets.find((p) => p.id === presetId) ?? presets[0]

  const bg     = (v.cardBg     as string) || ps.bg
  const border = (v.cardBorder as string) || ps.border
  const shadow = (v.cardShadow as string) || ps.shadow
  const blur   = (v.cardBlur   as number) || 0
  const radius = (v.cardRadius as number) || 12

  return {
    bg,
    border: "1px solid " + border,
    shadow: shadow === "none" ? (active ? "0 8px 32px rgba(0,0,0,0.4)" : "none") : shadow,
    blur,
    radius,
  }
}

// ─── Grain URL ────────────────────────────────────────────────────────────────

export const LIGHT_GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E" +
  "%3Cfilter id='g'%3E" +
  "%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E" +
  "%3CfeColorMatrix type='saturate' values='0'/%3E" +
  "%3C/filter%3E" +
  "%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.038'/%3E" +
  "%3C/svg%3E\")"

// ─── Section background style ─────────────────────────────────────────────────

export function sectionBgStyle(isDark: boolean) {
  return isDark
    ? {
        backgroundColor: "#0e0c09",
        backgroundImage: [
          "radial-gradient(ellipse at 85% 10%, rgba(201,168,92,0.28) 0%, transparent 55%)",
          "radial-gradient(ellipse at 15% 92%, rgba(201,168,92,0.20) 0%, transparent 50%)",
        ].join(","),
      }
    : {
        backgroundColor: "#f8f8f6",
        backgroundImage: [
          LIGHT_GRAIN_URL,
          "radial-gradient(ellipse 85% 60% at 6%  8%,  rgba(200,200,198,0.38) 0%, transparent 60%)",
          "radial-gradient(ellipse 60% 75% at 94% 14%, rgba(192,194,198,0.26) 0%, transparent 56%)",
          "radial-gradient(ellipse 70% 45% at 48% 96%, rgba(204,202,200,0.32) 0%, transparent 58%)",
          "radial-gradient(ellipse 50% 65% at 80% 72%, rgba(196,196,194,0.20) 0%, transparent 52%)",
          "radial-gradient(ellipse 65% 55% at 18% 62%, rgba(202,200,198,0.18) 0%, transparent 60%)",
          "radial-gradient(ellipse 40% 40% at 58% 42%, rgba(210,208,206,0.14) 0%, transparent 50%)",
        ].join(","),
        backgroundSize: "256px 256px, auto, auto, auto, auto, auto, auto",
        backgroundRepeat: "repeat, no-repeat, no-repeat, no-repeat, no-repeat, no-repeat, no-repeat",
      }
}

// ─── Info helpers ─────────────────────────────────────────────────────────────

export const INFO_FONT_MAP: Record<string, string> = {
  sans: "system-ui,sans-serif",
  serif: "Georgia,serif",
  mono: "monospace",
  korean: "'Noto Serif KR',serif",
}

export const INFO_SIZE_MAP: Record<string, string> = {
  xs: "7px", sm: "8px", md: "9px", lg: "10px", xl: "12px", "2xl": "14px",
}

// ─── Hours line types & helpers ───────────────────────────────────────────────

export type HoursLineColor = "default" | "red" | "gold" | "gray"
export type HoursLine = {
  id: string
  text: string
  color: HoursLineColor
  size: "normal" | "sm"
  suffix: string
  suffixColor: HoursLineColor
}

function makeHoursLine(text = ""): HoursLine {
  return { id: Math.random().toString(36).slice(2), text, color: "default", size: "normal", suffix: "", suffixColor: "default" }
}

export function parseHoursLines(raw: FieldValue): HoursLine[] {
  const str = (raw as string) || ""
  try {
    const parsed = JSON.parse(str)
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object" && "text" in parsed[0]) {
      return parsed.map((l: Partial<HoursLine>) => ({
        id: l.id || Math.random().toString(36).slice(2),
        text: l.text || "",
        color: l.color || "default",
        size: l.size || "normal",
        suffix: l.suffix || "",
        suffixColor: l.suffixColor || "default",
      }))
    }
  } catch {}
  if (!str.trim()) return [makeHoursLine()]
  return str.split("\n").filter(Boolean).map(t => makeHoursLine(t))
}

export function resolveHoursColor(color: HoursLineColor, isDark: boolean, defaultColor: string): string {
  if (color === "red")  return "#ef4444"
  if (color === "gold") return "#c9a85c"
  if (color === "gray") return isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"
  return defaultColor
}

// ─── Info box style ───────────────────────────────────────────────────────────

export function resolveInfoBoxStyle(
  prefix: string,
  values: Record<string, FieldValue>,
  isDark: boolean
) {
  const presets = isDark ? BOX_PRESETS_DARK : BOX_PRESETS_LIGHT
  const presetId = (values[prefix + "Preset"] as string) || "glass-gold"
  const ps = presets.find(p => p.id === presetId) ?? presets[1]
  const bg     = (values[prefix + "Bg"]     as string) || ps.bg
  const border = (values[prefix + "Border"] as string) || ps.border
  const shadow = (values[prefix + "Shadow"] as string) || ps.shadow
  const blur   = (values[prefix + "Blur"]   as number) ?? 0
  const radius = (values[prefix + "Radius"] as number) ?? 12
  return { bg, border: "1px solid " + border, shadow, blur, radius }
}

// ─── Map URL normalizer ───────────────────────────────────────────────────────

export function normalizeMapUrl(raw: string, zoom?: number): string {
  if (!raw) return ""
  const trimmed = raw.trim()
  const srcMatch = trimmed.match(/src="([^"]+)"/)
  if (srcMatch) return srcMatch[1]
  if (trimmed.includes("/maps/embed")) {
    try {
      const u = new URL(trimmed)
      if (zoom !== undefined && u.searchParams.has("q")) u.searchParams.set("z", String(zoom))
      return u.toString()
    } catch { return trimmed }
  }
  if (trimmed.includes("google.com/maps") || trimmed.includes("maps.google.com")) {
    try {
      const u = new URL(trimmed)
      u.searchParams.set("output", "embed")
      if (zoom !== undefined) u.searchParams.set("z", String(zoom))
      else if (!u.searchParams.has("z")) u.searchParams.set("z", "15")
      return u.toString()
    } catch { return trimmed }
  }
  return trimmed
}

// ─── Strengths types & helpers ────────────────────────────────────────────────

export type StrengthStat = {
  id: string
  label: string
  value: string
  unit: string
  preset?: string
  bgOverride?: string
  borderOverride?: string
  shadowOverride?: string
  blurOverride?: number
  radiusOverride?: number
  labelColor?: string
  valueColor?: string
  chartType?: "line" | "circle" | "bar"
}

export type S1MapImg = {
  id: string; url: string
  effectId: string; brightness: number; contrast: number; saturate: number; hue: number
  position: string
  gradDir: string; gradColor: string; gradOpacity: number
  shadowPreset: string; shadowColor: string
}

export const DEFAULT_S1_STATS: StrengthStat[] = [
  { id: "s1a", label: "운영 연차",   value: "15",      unit: "년",   preset: "glass-gold" },
  { id: "s1b", label: "글로벌 지점", value: "17",      unit: "개",   preset: "glass-gold" },
  { id: "s1c", label: "진출 국가",   value: "3",       unit: "개국", preset: "glass-gold" },
]
export const DEFAULT_S2_STATS: StrengthStat[] = [
  { id: "s2a", label: "누적 내원 고객", value: "223,496", unit: "명", preset: "glass-gold", chartType: "line"   },
  { id: "s2b", label: "재방문율",       value: "78",      unit: "%",  preset: "glass-gold", chartType: "circle" },
  { id: "s2c", label: "기존 고객 비중", value: "82.3",    unit: "%",  preset: "glass-gold", chartType: "bar"    },
]

export function parseSStats(raw: FieldValue | undefined, defaults: StrengthStat[]): StrengthStat[] {
  if (!raw) return defaults
  try { return JSON.parse(raw as string) as StrengthStat[] } catch { return defaults }
}

export function resolveStatCardStyle(stat: StrengthStat, isDark: boolean) {
  const presets = isDark ? BOX_PRESETS_DARK : BOX_PRESETS_LIGHT
  const ps = presets.find(p => p.id === (stat.preset || "glass-gold")) ?? presets[1]
  return {
    bg:     stat.bgOverride     || ps.bg,
    border: "1px solid " + (stat.borderOverride || ps.border),
    shadow: (stat.shadowOverride === "none" ? undefined : stat.shadowOverride) || (ps.shadow === "none" ? undefined : ps.shadow),
    blur:   stat.blurOverride   ?? 0,
    radius: stat.radiusOverride ?? 12,
  }
}

export function parseS1MapImages(raw: FieldValue, legacyUrl?: string): S1MapImg[] {
  try {
    const p = JSON.parse((raw as string) || "[]")
    if (Array.isArray(p) && p.length > 0) {
      return p.map((img: Partial<S1MapImg>) => ({
        id: img.id || ("s1i" + Date.now()),
        url: img.url || "",
        effectId: img.effectId || "none",
        brightness: img.brightness ?? 100, contrast: img.contrast ?? 100,
        saturate: img.saturate ?? 100, hue: img.hue ?? 0,
        position: img.position || "center",
        gradDir: img.gradDir || "to bottom", gradColor: img.gradColor || "#000000", gradOpacity: img.gradOpacity ?? 0,
        shadowPreset: img.shadowPreset || "none", shadowColor: img.shadowColor || "#000000",
      }))
    }
  } catch {}
  if (legacyUrl) return [{ id: "s1i-legacy", url: legacyUrl, effectId: "none", brightness: 100, contrast: 100, saturate: 100, hue: 0, position: "center", gradDir: "to bottom", gradColor: "#000000", gradOpacity: 0, shadowPreset: "none", shadowColor: "#000000" }]
  return []
}

export function buildS1ImgFilter(img: S1MapImg): string {
  const parts: string[] = []
  if (img.brightness !== 100) parts.push("brightness(" + img.brightness + "%)")
  if (img.contrast   !== 100) parts.push("contrast(" + img.contrast + "%)")
  if (img.saturate   !== 100) parts.push("saturate(" + img.saturate + "%)")
  if (img.hue        !== 0)   parts.push("hue-rotate(" + img.hue + "deg)")
  const eff = IMG_EFFECTS.find(e => e.id === img.effectId)
  if (eff?.filter) parts.push(eff.filter)
  return parts.join(" ")
}

export function buildS1Gradient(img: S1MapImg): string {
  if (!img.gradOpacity) return ""
  const rgba = "rgba(" + hexToRgb(img.gradColor || "#000000") + "," + (img.gradOpacity / 100).toFixed(2) + ")"
  if (img.gradDir === "radial")      return "radial-gradient(ellipse at center, " + rgba + " 0%, transparent 70%)"
  if (img.gradDir === "radial-edge") return "radial-gradient(ellipse at center, transparent 30%, " + rgba + " 100%)"
  return "linear-gradient(" + (img.gradDir || "to bottom") + ", transparent 0%, " + rgba + " 100%)"
}

export function buildS1Shadow(img: S1MapImg): string {
  const rgb = hexToRgb(img.shadowColor || "#000000")
  switch (img.shadowPreset) {
    case "sm":   return "0 2px 10px rgba(" + rgb + ",0.25)"
    case "md":   return "0 4px 20px rgba(" + rgb + ",0.38), 0 2px 8px rgba(" + rgb + ",0.18)"
    case "lg":   return "0 8px 36px rgba(" + rgb + ",0.48), 0 4px 14px rgba(" + rgb + ",0.24)"
    case "xl":   return "0 16px 56px rgba(" + rgb + ",0.56), 0 8px 24px rgba(" + rgb + ",0.3)"
    case "glow": return "0 0 28px rgba(" + rgb + ",0.65), 0 0 10px rgba(" + rgb + ",0.45)"
    default:     return "none"
  }
}

// ─── Branch card types ────────────────────────────────────────────────────────

export type BranchCard = {
  id: string
  region: string
  name: string
  feature: string
  url: string
  imgUrl: string
  imgPosition: string
  imgEffectId: string
  imgBrightness: number
  imgContrast: number
  imgSaturate: number
  imgHue: number
  imgOverlay: string
  imgOverlayOpacity: number
  imgFade: number
  imgBlend: string
}

export const DEFAULT_BRANCH_CARDS: BranchCard[] = [
  { id:"bc1", region:"SEOUL · KOREA",  name:"TATOA Gangnam",  feature:"The Flagship Experience", url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:30, imgFade:65, imgBlend:"normal" },
  { id:"bc2", region:"BUSAN · KOREA",  name:"TATOA Haeundae", feature:"Coastal Luxury Clinic",   url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:30, imgFade:65, imgBlend:"normal" },
  { id:"bc3", region:"TOKYO · JAPAN",  name:"TATOA Shibuya",  feature:"Precision & Elegance",    url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:30, imgFade:65, imgBlend:"normal" },
  { id:"bc4", region:"OSAKA · JAPAN",  name:"TATOA Namba",    feature:"Modern Beauty Hub",       url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:30, imgFade:65, imgBlend:"normal" },
  { id:"bc5", region:"DUBAI · UAE",    name:"TATOA Dubai",    feature:"Global Premium Care",     url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:30, imgFade:65, imgBlend:"normal" },
]

export function parseBranchCards(raw: FieldValue): BranchCard[] {
  try {
    const parsed = JSON.parse((raw as string) || "[]")
    if (Array.isArray(parsed) && parsed.length > 0) {
      return (parsed as BranchCard[]).map(c => ({
        id: c.id || ("bc" + Date.now()),
        region: c.region || "", name: c.name || "", feature: c.feature || "",
        url: c.url || "", imgUrl: c.imgUrl || "", imgPosition: c.imgPosition || "center",
        imgEffectId: c.imgEffectId || "none",
        imgBrightness: c.imgBrightness ?? 100, imgContrast: c.imgContrast ?? 100,
        imgSaturate: c.imgSaturate ?? 100, imgHue: c.imgHue ?? 0,
        imgOverlay: c.imgOverlay || "#000000", imgOverlayOpacity: c.imgOverlayOpacity ?? 30,
        imgFade: c.imgFade ?? 65, imgBlend: c.imgBlend || "normal",
      }))
    }
  } catch {}
  return DEFAULT_BRANCH_CARDS
}

export function buildCardFilter(card: BranchCard | EventCard): string {
  const effectFilter = IMG_EFFECTS.find(e => e.id === (card.imgEffectId || "none"))?.filter || ""
  const manualParts: string[] = []
  if (card.imgBrightness !== 100) manualParts.push("brightness(" + card.imgBrightness + "%)")
  if (card.imgContrast  !== 100) manualParts.push("contrast(" + card.imgContrast + "%)")
  if (card.imgSaturate  !== 100) manualParts.push("saturate(" + card.imgSaturate + "%)")
  if (card.imgHue       !== 0)   manualParts.push("hue-rotate(" + card.imgHue + "deg)")
  return [effectFilter, manualParts.join(" ")].filter(Boolean).join(" ")
}

// ─── Gallery types ────────────────────────────────────────────────────────────

export type GalleryImage = { id: string; url: string; label?: string }

export function parseGalleryImages(raw: FieldValue): GalleryImage[] {
  try {
    const arr = JSON.parse((raw as string) || "[]")
    if (Array.isArray(arr)) return arr.filter((x: unknown) => x && typeof x === "object")
  } catch {}
  return []
}

// ─── Treatment types & helpers ────────────────────────────────────────────────

export type TreatmentCategory = {
  id: string
  label: string
  icon: string
  description: string
}

export type TreatmentPreviewItem = {
  id: string
  name: string
  category: string
  description: string
  price: string
  duration: string
  image: string
  badge?: string
  isPublic: boolean
  isFeatured: boolean
  branchId: string
  bookingUrl?: string
  kakaoUrl?: string
  landingPageUrl?: string
}

export const DEFAULT_TREATMENT_CATS: TreatmentCategory[] = [
  { id: "tc_all",    label: "전체",        icon: "layers",   description: "모든 시술" },
  { id: "tc_botox",  label: "보톡스",      icon: "syringe",  description: "보툴리눔 시술" },
  { id: "tc_filler", label: "필러/콜라겐", icon: "sparkles", description: "볼륨 & 탄력" },
  { id: "tc_laser",  label: "레이저",      icon: "zap",      description: "피부 리프팅" },
  { id: "tc_skin",   label: "피부케어",    icon: "sun",      description: "스킨케어" },
  { id: "tc_body",   label: "바디",        icon: "activity", description: "바디 슬리밍" },
]

export function parseTreatmentCats(raw: FieldValue): TreatmentCategory[] {
  try {
    const parsed = JSON.parse((raw as string) || "[]")
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as TreatmentCategory[]
  } catch {}
  return DEFAULT_TREATMENT_CATS
}

export const TREATMENT_ICON_OPTIONS: { key: string; label: string; Icon: React.FC<{ size?: number; color?: string }> }[] = [
  { key: "layers",   label: "레이어",    Icon: Layers   },
  { key: "sparkles", label: "스파클",    Icon: Sparkles },
  { key: "syringe",  label: "주사기",    Icon: Syringe  },
  { key: "zap",      label: "레이저",    Icon: Zap      },
  { key: "sun",      label: "태양",      Icon: Sun      },
  { key: "heart",    label: "하트",      Icon: Heart    },
  { key: "leaf",     label: "잎",        Icon: Leaf     },
  { key: "droplets", label: "물방울",    Icon: Droplets },
  { key: "activity", label: "액티비티",  Icon: Activity },
  { key: "star",     label: "스타",      Icon: Star     },
]

export function TreatmentCatIcon({ iconKey, size, color }: { iconKey: string; size: number; color: string }) {
  const found = TREATMENT_ICON_OPTIONS.find(o => o.key === iconKey)
  const { Icon } = found ?? TREATMENT_ICON_OPTIONS[0]
  return <Icon size={size} color={color} />
}

// ─── TatoaNavOverlay ─────────────────────────────────────────────────────────

export function TatoaNavOverlay() {
  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center pointer-events-none"
      style={{
        paddingTop: 10,
        paddingBottom: 20,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)",
      }}
    >
      <span style={{
        fontFamily: "system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
        fontSize: 8,
        fontWeight: 200,
        letterSpacing: "0.58em",
        paddingLeft: "0.58em",
        color: "#c9a85c",
        lineHeight: 1,
        textTransform: "uppercase" as const,
      }}>
        TATOA
      </span>
    </div>
  )
}

// ─── EventTiltCard ────────────────────────────────────────────────────────────

export function EventTiltCard({ card, isDark, cardW = 168, cardH = 210 }: {
  card: EventCard; isDark: boolean; cardW?: number; cardH?: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rot,    setRot]    = useState({ x: 0, y: 0 })
  const [glow,   setGlow]   = useState({ x: 50, y: 50 })
  const [active, setActive] = useState(false)

  const CARD_W = cardW
  const CARD_H = cardH

  const ac = isDark
    ? { r: 201, g: 168, b: 92 }
    : { r: 168, g: 175, b: 190 }

  const track = (clientX: number, clientY: number) => {
    if (!cardRef.current) return
    const r  = cardRef.current.getBoundingClientRect()
    const nx = (clientX - r.left) / r.width
    const ny = (clientY - r.top)  / r.height
    setRot({ x: (ny - 0.5) * -16, y: (nx - 0.5) * 20 })
    setGlow({ x: nx * 100, y: ny * 100 })
  }

  const finalFilter  = buildCardFilter(card)
  const overlayAlpha = ((card.imgOverlayOpacity ?? 25) / 100).toFixed(2)
  const overlayColor = "rgba(" + hexToRgb(card.imgOverlay || "#000000") + "," + overlayAlpha + ")"
  const fadeStop     = Math.max(0, 100 - (card.imgFade ?? 55))
  const gradBottom   = "linear-gradient(to top,rgba(0,0,0,0.70) 0%,rgba(0,0,0,0) " + fadeStop + "%)"

  const rimGlow = "radial-gradient(circle at " + glow.x + "% " + glow.y + "%, rgba(" + ac.r + "," + ac.g + "," + ac.b + ",0.65) 0%, rgba(" + ac.r + "," + ac.g + "," + ac.b + ",0.22) 38%, transparent 65%)"
  const ease    = "transform 0.65s cubic-bezier(0.23,1,0.32,1)"
  const acStr   = "rgba(" + ac.r + "," + ac.g + "," + ac.b

  return (
    <div
      ref={cardRef}
      onMouseMove={(e) => { setActive(true); track(e.clientX, e.clientY) }}
      onMouseLeave={() => { setActive(false); setRot({ x: 0, y: 0 }) }}
      onTouchMove={(e) => { setActive(true); const t = e.touches[0]; track(t.clientX, t.clientY) }}
      onTouchEnd={() => { setActive(false); setRot({ x: 0, y: 0 }) }}
      style={{
        width: CARD_W + "px", height: CARD_H + "px",
        borderRadius: "16px", overflow: "hidden", position: "relative",
        background: isDark ? "#181818" : "#e2e2e2",
        transform: "perspective(700px) rotateX(" + rot.x + "deg) rotateY(" + rot.y + "deg) scale(" + (active ? 1.028 : 1) + ")",
        transition: active
          ? "transform 0.08s ease-out, box-shadow 0.15s ease"
          : ease + ", box-shadow 0.55s ease",
        boxShadow: active
          ? "0 28px 72px rgba(0,0,0,0.75), 0 0 52px " + acStr + ",0.24), 0 0 0 1.5px " + acStr + ",0.32)"
          : (isDark
            ? "0 12px 40px rgba(0,0,0,0.62), 0 0 0 1px rgba(255,255,255,0.06)"
            : "0 8px 28px rgba(0,0,0,0.14)"),
        cursor: "pointer",
        willChange: "transform",
      }}
    >
      {card.imgUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.imgUrl} alt="" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: card.imgPosition || "center",
          filter: finalFilter || undefined, display: "block",
          transform: active
            ? "scale(1.07) translate(" + (-rot.y * 0.20) + "px, " + (-rot.x * 0.20) + "px)"
            : "scale(1) translate(0,0)",
          transition: active ? "transform 0.08s ease-out" : ease,
        }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "5px" }}>
          <CalendarDays style={{ width: "22px", height: "22px", color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }} />
          <span style={{ fontSize: "6px", color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)" }}>이벤트 이미지</span>
        </div>
      )}

      <div style={{
        position: "absolute", inset: 0, background: overlayColor,
        mixBlendMode: (card.imgBlend || "normal") as React.CSSProperties["mixBlendMode"],
      }} />
      <div style={{ position: "absolute", inset: 0, background: gradBottom }} />
      <div style={{
        position: "absolute", inset: 0,
        background: rimGlow,
        opacity: active ? 1 : 0,
        transition: "opacity 0.2s ease",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", inset: 0, borderRadius: "16px",
        border: active
          ? "1.5px solid " + acStr + ",0.50)"
          : "1px solid " + (isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.52)"),
        pointerEvents: "none",
        transition: "border-color 0.3s ease",
      }} />
      {active && (
        <>
          <div style={{ position:"absolute", top:10, left:10,  width:14, height:14, borderTop:"1.5px solid " + acStr + ",0.75)", borderLeft:"1.5px solid " + acStr + ",0.75)",  borderRadius:"3px 0 0 0", pointerEvents:"none" }} />
          <div style={{ position:"absolute", top:10, right:10, width:14, height:14, borderTop:"1.5px solid " + acStr + ",0.75)", borderRight:"1.5px solid " + acStr + ",0.75)", borderRadius:"0 3px 0 0", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:10, left:10,  width:14, height:14, borderBottom:"1.5px solid " + acStr + ",0.75)", borderLeft:"1.5px solid " + acStr + ",0.75)",  borderRadius:"0 0 0 3px", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:10, right:10, width:14, height:14, borderBottom:"1.5px solid " + acStr + ",0.75)", borderRight:"1.5px solid " + acStr + ",0.75)", borderRadius:"0 0 3px 0", pointerEvents:"none" }} />
        </>
      )}
    </div>
  )
}

// ─── EventPagination ──────────────────────────────────────────────────────────

export function EventPagination({ total, active, isDark, gold, onSelect }: {
  total: number; active: number; isDark: boolean; gold: string
  onSelect: (i: number) => void
}) {
  const accentActive   = isDark ? gold : "#2a2a2a"
  const accentInactive = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)"

  if (total <= 5) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"5px" }}>
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} type="button" onClick={() => onSelect(i)} style={{
            width: i === active ? "20px" : "5px", height: "5px",
            borderRadius: "3px",
            background: i === active ? accentActive : accentInactive,
            border: "none", padding: 0, cursor: "pointer", flexShrink: 0,
            transition: "width 0.3s ease, background 0.3s ease",
          }} />
        ))}
      </div>
    )
  }

  if (total < 10) {
    const MAX = 5
    const winStart = Math.min(Math.max(active - 2, 0), total - MAX)
    const window = Array.from({ length: MAX }, (_, i) => winStart + i)
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"4px" }}>
        {winStart > 0 && (
          <div style={{ width:3, height:3, borderRadius:"50%", background: accentInactive, opacity:0.45, flexShrink:0 }} />
        )}
        {window.map((idx) => (
          <button key={idx} type="button" onClick={() => onSelect(idx)} style={{
            width: idx === active ? "18px" : "5px", height: "5px",
            borderRadius: "3px",
            background: idx === active ? accentActive : accentInactive,
            border: "none", padding: 0, cursor: "pointer", flexShrink: 0,
            transition: "width 0.25s ease, background 0.25s ease",
          }} />
        ))}
        {winStart + MAX < total && (
          <div style={{ width:3, height:3, borderRadius:"50%", background: accentInactive, opacity:0.45, flexShrink:0 }} />
        )}
      </div>
    )
  }

  const progress = total > 1 ? active / (total - 1) : 0
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"5px" }}>
      <span style={{
        fontSize: "7px", fontFamily: "system-ui", letterSpacing: "0.08em",
        color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
      }}>
        <span style={{ color: accentActive, fontWeight:600 }}>{active + 1}</span>
        {" / "}{total}
      </span>
      <div style={{ width: "60px", height: "3px", borderRadius: "2px", background: accentInactive, overflow:"hidden" }}>
        <div style={{
          height: "100%", borderRadius: "2px",
          background: accentActive,
          width: (progress * 100) + "%",
          transition: "width 0.3s ease",
        }} />
      </div>
    </div>
  )
}

// ─── DoctorTiltCard ───────────────────────────────────────────────────────────

export function DoctorTiltCard({ doctor, showCta, isDark = true, cardValues = {}, device = "mobile" }: { doctor: DoctorItem; showCta: boolean; isDark?: boolean; cardValues?: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rot,    setRot]    = useState({ x: 0, y: 0 })
  const [glow,   setGlow]   = useState({ x: 50, y: 50 })
  const [active, setActive] = useState(false)

  const track = (clientX: number, clientY: number) => {
    if (!cardRef.current) return
    const r  = cardRef.current.getBoundingClientRect()
    const nx = (clientX - r.left) / r.width
    const ny = (clientY - r.top)  / r.height
    setRot({ x: (ny - 0.5) * -20, y: (nx - 0.5) * 22 })
    setGlow({ x: nx * 100, y: ny * 100 })
  }

  const isDesktop = device === "desktop"
  const gold = "#c9a85c"
  const ease = "transform 0.65s cubic-bezier(0.23,1,0.32,1)"
  const cs = resolveCardStyle(cardValues, isDark, active)
  const ac  = isDark ? { r: 201, g: 168, b: 92 } : { r: 168, g: 175, b: 190 }
  const acStr = "rgba(" + ac.r + "," + ac.g + "," + ac.b
  const textColor   = isDark ? "#f5f0e8" : "#1a1a1a"
  const subColor    = isDark ? "rgba(255,255,255,0.45)" : "#555"
  const subColor2   = isDark ? "rgba(255,255,255,0.28)" : "#999"
  const accentColor = isDark ? gold : "rgb(" + ac.r + "," + ac.g + "," + ac.b + ")"
  const divColor    = isDark ? "rgba(201,168,92," + (active ? 0.6 : 0.22) + ")" : "rgba(0,0,0," + (active ? 0.12 : 0.06) + ")"

  // ── FontControls (docName / docMeta / docDetail) ────────────────────────
  const mobileMul   = 0.65
  const nameSize    = DOCTOR_SIZE_MAP[(cardValues.docNameSize as string) || "md"] ?? 19
  const nameColor   = (cardValues.docNameColor   as string) || textColor
  const nameWeight  = (cardValues.docNameWeight  as string) || "700"
  const nameFont    = getFontCss((cardValues.docNameFont as string) || "sans")
  const metaSize    = DOCTOR_SIZE_MAP[(cardValues.docMetaSize as string) || "xs"] ?? 11
  const metaColorDefault = isDark ? "rgba(201,168,92,0.9)" : acStr + ",0.85)"
  const metaColor   = (cardValues.docMetaColor   as string) || metaColorDefault
  const metaWeight  = (cardValues.docMetaWeight  as string) || "600"
  const metaFont    = getFontCss((cardValues.docMetaFont as string) || "sans")
  const detailSize    = DOCTOR_SIZE_MAP[(cardValues.docDetailSize as string) || "xs"] ?? 11
  const detailColor   = (cardValues.docDetailColor   as string) || subColor
  const detailWeight  = (cardValues.docDetailWeight  as string) || "400"
  const detailFont    = getFontCss((cardValues.docDetailFont as string) || "sans")
  const ctaText      = (cardValues.docCtaText   as string) || "상담 예약"
  const ctaBg        = (cardValues.docCtaBg     as string) || ""
  const ctaSize      = DOCTOR_SIZE_MAP[(cardValues.docCtaSize as string) || "xs"] ?? 11
  const ctaColor     = (cardValues.docCtaColor  as string) || accentColor
  const ctaWeight    = (cardValues.docCtaWeight as string) || "400"
  const ctaFont      = getFontCss((cardValues.docCtaFont as string) || "sans")

  const overrides = (() => { try { return JSON.parse((cardValues.imgOverrides as string) || "{}") } catch { return {} } })()
  const imgOvr    = (overrides[doctor.id] || {}) as { url?: string; position?: string; filter?: string; gradDir?: string; gradColor?: string; gradOpacity?: number }
  const photoSrc  = imgOvr.url || doctor.image
  const photoPos  = imgOvr.position || "center top"
  const photoFx   = imgOvr.filter || undefined
  const photoGrad = (() => {
    const op = imgOvr.gradOpacity ?? 0
    if (!op) return ""
    const rgba = "rgba(" + hexToRgb(imgOvr.gradColor || "#000000") + "," + (op / 100).toFixed(2) + ")"
    const dir   = imgOvr.gradDir || "to bottom"
    if (dir === "radial")      return "radial-gradient(ellipse at center, " + rgba + " 0%, transparent 70%)"
    if (dir === "radial-edge") return "radial-gradient(ellipse at center, transparent 30%, " + rgba + " 100%)"
    return "linear-gradient(" + dir + ", transparent 0%, " + rgba + " 100%)"
  })()

  return (
    <div ref={cardRef} style={{ perspective: isDesktop ? 1200 : 500 }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => { setActive(false); setRot({ x:0, y:0 }); setGlow({ x:50, y:50 }) }}
      onMouseMove={(e) => track(e.clientX, e.clientY)}
      onTouchStart={(e) => { setActive(true); const t = e.touches[0]; track(t.clientX, t.clientY) }}
      onTouchMove={(e) => { const t = e.touches[0]; track(t.clientX, t.clientY) }}
      onTouchEnd={() => { setActive(false); setRot({ x:0, y:0 }) }}
    >
      <div style={{
        transform: "rotateX(" + rot.x + "deg) rotateY(" + rot.y + "deg) scale(" + (active ? 1.025 : 1) + ")",
        transition: active ? "transform 0.09s ease" : ease,
        transformStyle: "preserve-3d",
        borderRadius: cs.radius, position: "relative", overflow: "hidden",
        background: cs.bg, border: cs.border,
        boxShadow: active
          ? "0 20px 60px rgba(0,0,0," + (isDark ? 0.7 : 0.15) + "), 0 0 40px " + acStr + "," + (isDark ? 0.22 : 0.26) + "), 0 0 0 1.5px " + acStr + "," + (isDark ? 0.32 : 0.38) + ")"
          : cs.shadow,
        backdropFilter: cs.blur ? "blur(" + cs.blur + "px)" : undefined,
        display: "flex", flexDirection: isDesktop ? "row" : "column" as const,
      }}>

        <div style={{
          position: "absolute", inset: 0, borderRadius: cs.radius,
          background: "radial-gradient(ellipse 80% 65% at " + glow.x + "% " + glow.y + "%, " + acStr + "," + (active ? (isDark ? 0.18 : 0.22) : 0) + ") 0%, transparent 65%)",
          transition: active ? "none" : "background 0.65s", pointerEvents: "none", zIndex: 1,
        }} />

        <div style={{
          transform: active ? "translate(" + ((glow.x-50)*0.06) + "px," + ((glow.y-50)*0.06) + "px)" : "none",
          transition: active ? "none" : ease, position: "relative", zIndex: 2, flexShrink: 0,
          ...(isDesktop ? { width: "50%" } : {}),
        }}>
          {isDesktop ? (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden",
              background: isDark ? "linear-gradient(170deg,#1a1712 0%,#0d0b09 100%)" : "linear-gradient(170deg,#f5f3ef 0%,#e8e5e0 100%)" }}>
              {photoSrc ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoSrc} alt={doctor.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: photoPos, filter: photoFx, display: "block" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                  {photoGrad && <div style={{ position: "absolute", inset: 0, background: photoGrad, pointerEvents: "none" }} />}
                </>
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" as const,
                  alignItems: "center", justifyContent: "center", gap: 6,
                  background: isDark ? "rgba(201,168,92,0.04)" : "rgba(139,106,47,0.04)" }}>
                  <span style={{ fontSize: 36, opacity: 0.18 }}>👤</span>
                  <span style={{ fontSize: 8, letterSpacing: "0.15em",
                    color: isDark ? "rgba(201,168,92,0.28)" : "rgba(139,106,47,0.28)" }}>NO PHOTO</span>
                </div>
              )}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, pointerEvents: "none",
                background: "linear-gradient(to top," + (isDark ? "rgba(8,7,5,0.92)" : "rgba(245,243,240,0.92)") + ",transparent)" }} />
              <div style={{ position: "absolute", bottom: 14, left: 14, display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: accentColor, flexShrink: 0,
                  boxShadow: active && isDark ? "0 0 8px " + gold : "none", transition: "box-shadow 0.3s" }} />
                <span style={{ fontSize: metaSize, letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: metaWeight, fontFamily: metaFont,
                  color: metaColor,
                  textShadow: isDark ? "0 1px 4px rgba(0,0,0,0.9)" : "none" }}>{doctor.title}</span>
              </div>
            </div>
          ) : (
            <div style={{ width: "100%", paddingTop: "80%", position: "relative", overflow: "hidden",
              background: isDark ? "linear-gradient(170deg,#1a1712 0%,#0d0b09 100%)" : "linear-gradient(170deg,#f5f3ef 0%,#e8e5e0 100%)" }}>
              {photoSrc ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoSrc} alt={doctor.name}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
                      objectFit: "cover", objectPosition: photoPos, filter: photoFx }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                  {photoGrad && <div style={{ position: "absolute", inset: 0, background: photoGrad, pointerEvents: "none" }} />}
                </>
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" as const,
                  alignItems: "center", justifyContent: "center", gap: 4,
                  background: isDark ? "rgba(201,168,92,0.04)" : "rgba(139,106,47,0.04)" }}>
                  <div style={{ position: "absolute", inset: 0, opacity: 0.35,
                    backgroundImage: ["linear-gradient(rgba(201,168,92,0.07) 1px,transparent 1px)",
                      "linear-gradient(90deg,rgba(201,168,92,0.07) 1px,transparent 1px)"].join(","),
                    backgroundSize: "16px 16px" }} />
                  <span style={{ fontSize: 22, opacity: 0.18, position: "relative" }}>👤</span>
                  <span style={{ fontSize: 5, letterSpacing: "0.15em", position: "relative",
                    color: isDark ? "rgba(201,168,92,0.28)" : "rgba(139,106,47,0.28)" }}>NO PHOTO</span>
                </div>
              )}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 36, pointerEvents: "none",
                background: "linear-gradient(to top," + (isDark ? "rgba(8,7,5,0.92)" : "rgba(245,243,240,0.92)") + ",transparent)" }} />
              <div style={{ position: "absolute", bottom: 8, left: 9, display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: accentColor, flexShrink: 0,
                  boxShadow: active && isDark ? "0 0 6px " + gold : "none", transition: "box-shadow 0.3s" }} />
                <span style={{ fontSize: metaSize * mobileMul, letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: metaWeight, fontFamily: metaFont,
                  color: metaColor,
                  textShadow: isDark ? "0 1px 4px rgba(0,0,0,0.9)" : "none" }}>{doctor.title}</span>
              </div>
            </div>
          )}
        </div>

        {isDesktop ? (
          <div style={{ width: 1, flexShrink: 0, position: "relative", zIndex: 2,
            background: "linear-gradient(180deg,transparent," + divColor + ",transparent)" }} />
        ) : (
          <div style={{ height: 1, flexShrink: 0, position: "relative", zIndex: 2,
            background: "linear-gradient(90deg,transparent," + divColor + ",transparent)" }} />
        )}

        <div style={{
          padding: isDesktop ? "18px 20px 22px" : "9px 10px 11px",
          transform: active ? "translate(" + ((glow.x-50)*0.04) + "px," + ((glow.y-50)*0.04) + "px)" : "none",
          transition: active ? "none" : ease,
          position: "relative", zIndex: 2,
          display: "flex", flexDirection: "column" as const,
          gap: isDesktop ? 12 : 7,
          flex: 1,
          justifyContent: "center",
        }}>
          <div>
            <p style={{ fontSize: isDesktop ? nameSize : nameSize * mobileMul, fontWeight: nameWeight, fontFamily: nameFont, color: nameColor, letterSpacing: "-0.02em", marginBottom: isDesktop ? 25 : 15, lineHeight: 1.2 }}>{doctor.name}</p>
            {doctor.shortIntro && (
              <p style={{ fontSize: isDesktop ? detailSize : detailSize * mobileMul, fontWeight: detailWeight, fontFamily: detailFont, color: detailColor, lineHeight: 1.5, textAlign: "justify" as const }}>{renderTextWithLineBreaks(doctor.shortIntro ?? "")}</p>
            )}
          </div>
          {doctor.specialties.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: isDesktop ? 5 : 3 }}>
              {doctor.specialties.slice(0, 4).map((sp, i) => (
                <span key={i} style={{
                  fontSize: isDesktop ? metaSize : metaSize * mobileMul, fontWeight: metaWeight, fontFamily: metaFont, padding: isDesktop ? "3px 8px" : "2px 5px", borderRadius: 4,
                  background: isDark ? "rgba(201,168,92,0.1)" : acStr + ",0.07)",
                  border: "1px solid " + (isDark ? "rgba(201,168,92,0.22)" : acStr + ",0.20)"),
                  color: metaColor,
                }}>{sp}</span>
              ))}
            </div>
          )}
          {doctor.careers.length > 0 && (
            <div style={{ marginTop: isDesktop ? 24 : 14 }}>
              <p style={{ fontSize: isDesktop ? detailSize * 0.75 : detailSize * 0.75 * mobileMul, letterSpacing: "0.22em", textTransform: "uppercase" as const, fontWeight: detailWeight, fontFamily: detailFont,
                color: detailColor, marginBottom: isDesktop ? 6 : 4 }}>경력</p>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: isDesktop ? 5.5 : 3.5 }}>
                {doctor.careers.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: isDesktop ? 5 : 3 }}>
                    <div style={{ width: isDesktop ? 3.5 : 2.5, height: isDesktop ? 3.5 : 2.5, borderRadius: "50%", background: accentColor,
                      flexShrink: 0, marginTop: isDesktop ? 4 : 3, opacity: 0.65 }} />
                    <span style={{ fontSize: isDesktop ? detailSize * 0.9 : detailSize * 0.9 * mobileMul, fontWeight: detailWeight, fontFamily: detailFont, color: detailColor, lineHeight: 1.45 }}>
                      <span style={{ color: textColor, fontWeight: 500 }}>{c.organization}</span>
                      {c.roleOrDescription && <span style={{ opacity: 0.6 }}> · {c.roleOrDescription}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {doctor.academics.length > 0 && (
            <div>
              <p style={{ fontSize: isDesktop ? detailSize * 0.75 : detailSize * 0.75 * mobileMul, letterSpacing: "0.22em", textTransform: "uppercase" as const, fontWeight: detailWeight, fontFamily: detailFont,
                color: detailColor, marginBottom: isDesktop ? 6 : 4 }}>학회/학술</p>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: isDesktop ? 5.5 : 3.5 }}>
                {doctor.academics.slice(0, 3).map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: isDesktop ? 5 : 3 }}>
                    <div style={{ width: isDesktop ? 3.5 : 2.5, height: isDesktop ? 3.5 : 2.5, borderRadius: "50%", background: accentColor,
                      flexShrink: 0, marginTop: isDesktop ? 4 : 3, opacity: 0.65 }} />
                    <span style={{ fontSize: isDesktop ? detailSize * 0.9 : detailSize * 0.9 * mobileMul, fontWeight: detailWeight, fontFamily: detailFont, color: detailColor, lineHeight: 1.45 }}>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {doctor.homepageQuote && (
            <div style={{ borderLeft: (isDesktop ? 3 : 2) + "px solid " + (isDark ? "rgba(201,168,92,0.32)" : acStr + ",0.28)"), paddingLeft: isDesktop ? 10 : 6 }}>
              <p style={{ fontSize: isDesktop ? metaSize : metaSize * mobileMul, fontWeight: metaWeight, fontFamily: metaFont, color: metaColor, fontStyle: "italic", lineHeight: 1.6 }}>
                &ldquo;{doctor.homepageQuote}&rdquo;
              </p>
            </div>
          )}
          {showCta && (() => {
            const ctaWrapStyle = {
              padding: isDesktop ? "9px 0" : "5px 0",
              textAlign: "center" as const,
              borderRadius: 7,
              background: ctaBg || (isDark ? "rgba(201,168,92," + (active ? 0.14 : 0.07) + ")" : acStr + "," + (active ? 0.1 : 0.05) + ")"),
              border: "1px solid " + (isDark ? "rgba(201,168,92," + (active ? 0.4 : 0.2) + ")" : acStr + "," + (active ? 0.35 : 0.18) + ")"),
              transition: "all 0.3s",
              display: "block",
              textDecoration: "none",
              cursor: doctor.consultUrl ? "pointer" : "default",
            }
            const ctaInner = (
              <span style={{ fontSize: isDesktop ? ctaSize : ctaSize * mobileMul, color: ctaColor, fontWeight: ctaWeight, fontFamily: ctaFont, letterSpacing: "0.16em", textTransform: "uppercase" as const }}>{ctaText}</span>
            )
            return doctor.consultUrl ? (
              <a href={doctor.consultUrl} target="_blank" rel="noopener noreferrer" style={ctaWrapStyle}>{ctaInner}</a>
            ) : (
              <div style={ctaWrapStyle}>{ctaInner}</div>
            )
          })()}
        </div>

        <div style={{
          position: "absolute", inset: 0, borderRadius: cs.radius,
          border: active
            ? "1.5px solid " + acStr + "," + (isDark ? 0.50 : 0.55) + ")"
            : "1px solid " + (isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.52)"),
          pointerEvents: "none",
          transition: "border-color 0.3s ease",
          zIndex: 3,
        }} />
        {active && (
          <>
            <div style={{ position:"absolute", top:10, left:10,  width:14, height:14, borderTop:"1.5px solid " + acStr + ",0.75)", borderLeft:"1.5px solid " + acStr + ",0.75)",  borderRadius:"3px 0 0 0", pointerEvents:"none", zIndex:3 }} />
            <div style={{ position:"absolute", top:10, right:10, width:14, height:14, borderTop:"1.5px solid " + acStr + ",0.75)", borderRight:"1.5px solid " + acStr + ",0.75)", borderRadius:"0 3px 0 0", pointerEvents:"none", zIndex:3 }} />
            <div style={{ position:"absolute", bottom:10, left:10,  width:14, height:14, borderBottom:"1.5px solid " + acStr + ",0.75)", borderLeft:"1.5px solid " + acStr + ",0.75)",  borderRadius:"0 0 0 3px", pointerEvents:"none", zIndex:3 }} />
            <div style={{ position:"absolute", bottom:10, right:10, width:14, height:14, borderBottom:"1.5px solid " + acStr + ",0.75)", borderRight:"1.5px solid " + acStr + ",0.75)", borderRadius:"0 0 3px 0", pointerEvents:"none", zIndex:3 }} />
          </>
        )}
      </div>
    </div>
  )
}

// ─── EquipmentTiltCard ────────────────────────────────────────────────────────

export function EquipmentTiltCard({ item, isDark = true, cardValues = {} }: { item: EquipItem; isDark?: boolean; cardValues?: Record<string, FieldValue> }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rot,    setRot]    = useState({ x: 0, y: 0 })
  const [glow,   setGlow]   = useState({ x: 50, y: 50 })
  const [active, setActive] = useState(false)
  const track = (clientX: number, clientY: number) => {
    if (!cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    const nx = (clientX - r.left) / r.width
    const ny = (clientY - r.top)  / r.height
    setRot({ x: (ny - 0.5) * -18, y: (nx - 0.5) * 20 })
    setGlow({ x: nx * 100, y: ny * 100 })
  }
  const gold = "#c9a85c"
  const ease = "transform 0.65s cubic-bezier(0.23,1,0.32,1)"
  const cs = resolveCardStyle(cardValues, isDark, active)
  const textColor = isDark ? "#f5f0e8" : "#1a1a1a"
  const subColor  = isDark ? "rgba(255,255,255,0.38)" : "#666"
  const accentColor = isDark ? gold : "#8b6a2f"
  return (
    <div ref={cardRef} style={{ perspective: 480, height: "100%" }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => { setActive(false); setRot({ x:0, y:0 }); setGlow({ x:50, y:50 }) }}
      onMouseMove={(e) => track(e.clientX, e.clientY)}
      onTouchStart={(e) => { setActive(true); const t = e.touches[0]; track(t.clientX, t.clientY) }}
      onTouchMove={(e) => { const t = e.touches[0]; track(t.clientX, t.clientY) }}
      onTouchEnd={() => { setActive(false); setRot({ x:0, y:0 }) }}
    >
      <div style={{
        transform: "rotateX(" + rot.x + "deg) rotateY(" + rot.y + "deg) scale(" + (active ? 1.025 : 1) + ")",
        transition: active ? "transform 0.09s ease" : ease,
        transformStyle: "preserve-3d",
        borderRadius: cs.radius, position: "relative", overflow: "hidden",
        background: cs.bg, border: cs.border, boxShadow: cs.shadow,
        backdropFilter: cs.blur ? "blur(" + cs.blur + "px)" : undefined,
        height: "100%", display: "flex", flexDirection: "column" as const,
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: cs.radius,
          background: "radial-gradient(ellipse 75% 60% at " + glow.x + "% " + glow.y + "%, rgba(201,168,92," + (active ? 0.15 : 0) + ") 0%, transparent 65%)",
          transition: active ? "none" : "background 0.65s", pointerEvents: "none", zIndex: 1,
        }} />
        <div style={{
          transform: active ? "translate(" + ((glow.x-50)*0.08) + "px," + ((glow.y-50)*0.08) + "px)" : "none",
          transition: active ? "none" : ease, position: "relative", zIndex: 2, flexShrink: 0,
        }}>
          <div style={{ height: 76, overflow: "hidden", background: isDark ? "#1a1712" : "#f0ede8" }}>
            {item.image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
              </>
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                background: isDark ? "rgba(201,168,92,0.08)" : "rgba(139,106,47,0.08)" }}>
                <span style={{ fontSize: 24, color: isDark ? "rgba(201,168,92,0.3)" : "rgba(139,106,47,0.3)" }}>🔬</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ height: 1, flexShrink: 0, background: "linear-gradient(90deg,transparent," + (isDark ? "rgba(201,168,92," + (active ? 0.6 : 0.22) + ")" : "rgba(0,0,0," + (active ? 0.12 : 0.06) + ")") + ",transparent)", zIndex: 2, position: "relative" }} />
        <div style={{
          padding: "7px 9px 10px",
          transform: active ? "translate(" + ((glow.x-50)*0.04) + "px," + ((glow.y-50)*0.04) + "px)" : "none",
          transition: active ? "none" : ease, position: "relative", zIndex: 2,
          display: "flex", flexDirection: "column" as const, flex: 1,
        }}>
          <p style={{ fontSize: 8.5, fontWeight: 700, color: textColor, marginBottom: 2, letterSpacing: "-0.01em" }}>{item.name}</p>
          <p style={{ fontSize: 6.5, color: subColor, lineHeight: 1.45, flex: 1 }}>{item.description}</p>
          {item.isFeatured && (
            <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 3, height: 3, borderRadius: "50%", background: accentColor }} />
              <span style={{ fontSize: 5.5, color: accentColor, letterSpacing: "0.18em", textTransform: "uppercase" as const }}>Featured</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Mini charts ──────────────────────────────────────────────────────────────

export function MiniLineChart({ color }: { color: string }) {
  return (
    <svg width="56" height="24" viewBox="0 0 56 24" fill="none">
      <polyline points="0,22 10,16 22,18 32,9 44,5 56,2"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="56" cy="2" r="2.5" fill={color} />
    </svg>
  )
}

export function MiniCircleChart({ value, color }: { value: number; color: string }) {
  const r = 10; const circ = 2 * Math.PI * r
  const off = circ - (Math.min(Math.max(value, 0), 100) / 100) * circ
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r={r} stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" />
      <circle cx="14" cy="14" r={r} stroke={color} strokeWidth="3" fill="none"
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        transform="rotate(-90 14 14)" />
    </svg>
  )
}

export function MiniBarChart({ color }: { color: string }) {
  const bars = [40, 60, 50, 72, 58, 80, 70]
  return (
    <svg width="52" height="24" viewBox="0 0 52 24" fill="none">
      {bars.map((h, i) => {
        const bh = (h / 100) * 22
        return <rect key={i} x={i * 7.5} y={24 - bh} width="6" height={bh}
          rx="1.5" fill={color} opacity={0.35 + (i / bars.length) * 0.65} />
      })}
    </svg>
  )
}

// ─── S2StatCard ───────────────────────────────────────────────────────────────

export function S2StatCard({ stat, isDark, gold }: { stat: StrengthStat; isDark: boolean; gold: string }) {
  const [hovered, setHovered] = useState(false)
  const cs = resolveStatCardStyle(stat, isDark)
  const valC = stat.valueColor || gold
  const lblC = stat.labelColor || (isDark ? "rgba(255,255,255,0.42)" : "#888")
  const ct   = stat.chartType || "line"
  const numericVal = parseFloat(stat.value.replace(/,/g, "")) || 0

  const hoverShadow = isDark
    ? "0 12px 36px rgba(0,0,0,0.55), 0 0 20px rgba(201,168,92,0.18)"
    : "0 12px 36px rgba(0,0,0,0.14)"

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: cs.radius,
        background: cs.bg,
        border: cs.border,
        backdropFilter: cs.blur ? "blur(" + cs.blur + "px)" : undefined,
        padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "default",
        boxShadow:  hovered ? hoverShadow : (cs.shadow ?? "none"),
        transform:  hovered ? "translateY(-4px) scale(1.012)" : "translateY(0) scale(1)",
        transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease",
      }}
    >
      <div>
        <p style={{ fontSize: 14, color: lblC, marginBottom: 8 }}>{stat.label}</p>
        <p style={{ fontSize: 34, fontWeight: 700, color: valC, lineHeight: 1 }}>
          {stat.value}<span style={{ fontSize: 16, fontWeight: 400 }}>{stat.unit}</span>
        </p>
      </div>
      {ct === "line"   && <MiniLineChart color={valC} />}
      {ct === "circle" && <MiniCircleChart value={numericVal} color={valC} />}
      {ct === "bar"    && <MiniBarChart color={valC} />}
    </div>
  )
}

// ─── RevealBox ────────────────────────────────────────────────────────────────

export function RevealBox({
  delay = 0,
  children,
  style,
}: {
  delay?: number
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const ref     = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let root: Element | null = null
    let cur = el.parentElement
    while (cur) {
      const oy = window.getComputedStyle(cur).overflowY
      if (oy === "auto" || oy === "scroll") { root = cur; break }
      cur = cur.parentElement
    }

    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { root, threshold: 0.10, rootMargin: "0px 0px -20px 0px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateY(0px)" : "translateY(34px)",
        transition: "opacity 1.3s cubic-bezier(0.22,1,0.36,1) " + delay + "ms, transform 1.3s cubic-bezier(0.22,1,0.36,1) " + delay + "ms",
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── PreviewTreatmentCard — shared between admin preview + test site ──────────

export type PreviewTreatmentCardData = {
  id: string
  name: string
  category: string
  description: string
  price: string
  duration: string
  image: string
  badge?: string
}

export function PreviewTreatmentCard({
  treatment,
  isDark,
  gold = "#c9a85c",
  cardValues,
  onCardClick,
  href,
}: {
  treatment: PreviewTreatmentCardData
  isDark: boolean
  gold?: string
  cardValues: Record<string, FieldValue>
  onCardClick?: () => void
  href?: string
}) {
  const cs = resolveCardStyle(cardValues, isDark, false)
  const [hovered, setHovered] = useState(false)
  const imgBg = isDark
    ? "linear-gradient(170deg,rgba(201,168,92,0.18) 0%,rgba(20,15,8,0.75) 100%)"
    : "linear-gradient(170deg,rgba(220,210,190,0.55) 0%,rgba(240,235,225,0.9) 100%)"
  const nameColor  = (cardValues.cardNameColor  as string) || (isDark ? "#f5f0e8" : "#111111")
  const descColor  = (cardValues.cardDescColor  as string) || (isDark ? "rgba(255,255,255,0.48)" : "#888888")
  const priceColor = (cardValues.cardPriceColor as string) || (isDark ? gold : "#111111")
  const isClickable = !!href || !!onCardClick

  const liftShadow = isDark
    ? "0 12px 32px rgba(0,0,0,0.65), 0 4px 12px rgba(201,168,92,0.18)"
    : "0 12px 28px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.10)"

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      onClick={() => { if (href) { window.open(href, "_blank") } else { onCardClick?.() } }}
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
      {/* 이미지 영역 4:3 */}
      <div style={{ width: "100%", paddingTop: "75%", position: "relative", overflow: "hidden", background: imgBg }}>
        {treatment.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={treatment.image} alt={treatment.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={32} color={isDark ? "rgba(201,168,92,0.40)" : "rgba(180,160,120,0.40)"} />
            </div>
          )
        }
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to top,rgba(0,0,0,0.52),transparent)", pointerEvents: "none" }} />
        <span style={{
          position: "absolute", top: 12, left: 12, fontSize: 11, padding: "4px 10px", borderRadius: 4,
          background: "rgba(0,0,0,0.42)", color: "#fff", fontWeight: 500, backdropFilter: "blur(4px)",
        }}>
          {treatment.category}
        </span>
        {treatment.badge && (
          <span style={{
            position: "absolute", top: 12, right: 12, fontSize: 11, padding: "4px 10px", borderRadius: 4,
            background: "rgba(201,168,92,0.90)", color: "#1a1000", fontWeight: 700,
          }}>
            {treatment.badge}
          </span>
        )}
      </div>

      {/* 텍스트 영역 */}
      <div style={{ padding: "20px" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: nameColor, lineHeight: 1.25, marginBottom: 6 }}>
          {treatment.name}
        </p>
        {treatment.description && (
          <p style={{ fontSize: 14, color: descColor, lineHeight: 1.4, marginBottom: 10 }}>
            {treatment.description}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: priceColor }}>{treatment.price}</span>
          <span style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.28)" : "#bbb" }}>{treatment.duration}</span>
        </div>
      </div>
    </div>
  )
}
