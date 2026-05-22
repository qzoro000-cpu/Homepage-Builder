"use client"
import React, { useState, useMemo, useRef, useCallback } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Heart, Star, Shield, Award, Sparkles, Leaf, Sun, Moon, Zap, Activity,
  Calendar, Clock, MapPin, Phone, MessageCircle, User, Users, Bell,
  Navigation, Car, Home, Gift, Lock, Key,
  Droplets, Wind, Flame, Snowflake,
  Search, X, CheckCircle, Gem, Crown,
  Eye, Brain, Stethoscope, Pill, Syringe, Microscope, Thermometer,
  TrendingUp, ChevronRight, Package, Tag, Flower2, Waves,
  Camera, Video, Music, Coffee, Smile,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

export type IconMode      = "block" | "float"
export type FloatAnchor   = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br"

export type IconConfig = {
  iconId:       string
  size:         number
  color:        string
  mode:         IconMode
  opacity:      number
  // float settings
  floatAnchor?: FloatAnchor
  floatX?:      number
  floatY?:      number
  // drag position (overrides anchor / default when set)
  posX?:        number
  posY?:        number
  // block container settings
  blockBg?:     string
  blockPadX?:   number
  blockPadY?:   number
  blockW?:      "full" | "auto"
}

export const DEFAULT_ICON_CONFIG: IconConfig = {
  iconId: "", size: 48, color: "#c9a85c", mode: "block", opacity: 1,
  floatAnchor: "tc", floatX: 0, floatY: 0,
  blockBg: "transparent", blockPadX: 16, blockPadY: 12, blockW: "auto",
}

export function parseIconConfig(raw: unknown): IconConfig {
  if (!raw) return { ...DEFAULT_ICON_CONFIG }
  if (typeof raw === "object" && raw !== null) return { ...DEFAULT_ICON_CONFIG, ...(raw as Partial<IconConfig>) }
  try { return { ...DEFAULT_ICON_CONFIG, ...JSON.parse(raw as string) } } catch { return { ...DEFAULT_ICON_CONFIG } }
}

export function parseIconConfigs(raw: unknown): IconConfig[] {
  if (Array.isArray(raw)) return raw.map(item => parseIconConfig(item)).filter(c => c.iconId !== "")
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(item => parseIconConfig(item)).filter(c => c.iconId !== "")
      const single = parseIconConfig(parsed)
      return single.iconId ? [single] : []
    } catch { return [] }
  }
  if (raw && typeof raw === "object") {
    const single = parseIconConfig(raw)
    return single.iconId ? [single] : []
  }
  return []
}

// ── Custom SVG icons (medical / beauty / clinic) ───────────────────────────

type SvgProps = { size: number; color: string }

const sw = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: "1.8" }

function SvgConsultation({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <circle cx="24" cy="10" r="6" />
      <path d="M24 7v6M21 10h6" />
      <circle cx="12" cy="24" r="4" />
      <path d="M6 40c0-7 2.7-11 6-11s6 4 6 11" />
      <circle cx="36" cy="24" r="4" />
      <path d="M30 40c0-7 2.7-11 6-11s6 4 6 11" />
      <path d="M18 24h12" strokeDasharray="2 2" />
    </svg>
  )
}

function SvgTreatmentPlan({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <rect x="8" y="10" width="28" height="33" rx="4" />
      <path d="M18 10V7a2 2 0 014 0v3M26 10V7a2 2 0 014 0v3" />
      <path d="M14 20h20M14 26h14" />
      <circle cx="29" cy="34" r="7" />
      <path d="M29 31v6M26 34h6" />
    </svg>
  )
}

function SvgLifting({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <ellipse cx="24" cy="28" rx="12" ry="13" />
      <circle cx="20" cy="26" r="1.5" fill={color} stroke="none" />
      <circle cx="28" cy="26" r="1.5" fill={color} stroke="none" />
      <path d="M20 32c1 1.5 2.5 2.5 4 2.5s3-1 4-2.5" />
      <path d="M14 18l-3-4m3 0h-3v3" />
      <path d="M34 18l3-4m-3 0h3v3" />
      <path d="M21 13l3-4 3 4" />
    </svg>
  )
}

function SvgSkinAnalysis({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <circle cx="21" cy="21" r="13" />
      <path d="M30 30l10 10" />
      <path d="M16 18c2-2 5-3 8-2M16 24c1 2 3.5 3 7 3" />
    </svg>
  )
}

function SvgInjection({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <path d="M32 8l8 8" />
      <path d="M36 6l6 6" />
      <path d="M28 12l8 8" />
      <path d="M10 38l18-18" />
      <path d="M22 16l10 10" />
      <path d="M18 20l10 10" />
      <path d="M10 38l-4 4" />
      <circle cx="7" cy="44" r="1.2" fill={color} stroke="none" />
    </svg>
  )
}

function SvgLaser({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <rect x="14" y="6" width="20" height="12" rx="4" />
      <circle cx="24" cy="12" r="2.5" fill={color} stroke="none" />
      <path d="M24 18v5" />
      <path d="M16 26L8 34M24 23v14M32 26l8 8" />
      <path d="M22 40l2 2 2-2M22 36l2 2 2-2" />
    </svg>
  )
}

function SvgFiller({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <path d="M12 26c0-6 5-11 12-11s12 5 12 11c0 5-3 9-7 10.5" />
      <path d="M36 26c0 5-3 9-7 10.5-1.5.8-3 1.2-5 1.2s-3.5-.4-5-1.2C15 35 12 31 12 26" />
      <path d="M24 15c-3 0-4 2.5-4 2.5s-1.5-2.5-4.5-2.5" />
      <path d="M24 15c3 0 4 2.5 4 2.5s1.5-2.5 4.5-2.5" />
      <path d="M38 14l5 5M40 12l3 3" />
    </svg>
  )
}

function SvgFaceBeauty({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <ellipse cx="24" cy="27" rx="14" ry="15" />
      <path d="M18 24c0 0 .8-1.5 2-1.5s2 1.5 2 1.5" />
      <path d="M26 24c0 0 .8-1.5 2-1.5s2 1.5 2 1.5" />
      <path d="M19 32c1 2 2.5 3 5 3s4-1 5-3" />
      <path d="M19 13l-2-5M29 13l2-5" />
      <path d="M24 12V7" />
    </svg>
  )
}

function SvgMedicalCross({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <rect x="6" y="6" width="36" height="36" rx="10" />
      <path d="M24 14v20M14 24h20" />
    </svg>
  )
}

function SvgDoctor({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <circle cx="24" cy="13" r="7" />
      <path d="M12 42c0-9 4.5-14 12-14s12 5 12 14" />
      <path d="M18 30l6 5 6-5" />
      <path d="M13 22c-3 3-5 7-5 11" />
      <circle cx="8" cy="35" r="3" />
      <path d="M6 35h4M8 33v4" />
    </svg>
  )
}

function SvgCertificate({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <rect x="6" y="6" width="28" height="36" rx="3" />
      <path d="M12 16h16M12 22h12M12 28h8" />
      <circle cx="33" cy="35" r="8" />
      <path d="M30 35l2 2 5-5" />
    </svg>
  )
}

function SvgHandCare({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <path d="M5 28l8-5h10l10 4c2 1 3 3 2 5s-3 3-5 2l-7-2" />
      <path d="M13 28v-9" />
      <path d="M5 22l8 6" />
      <path d="M24 17c0-2.5 1.5-4.5 4.5-4.5S33 14.5 33 17c0 3.5-4.5 7-4.5 7s-4.5-3.5-4.5-7z" />
    </svg>
  )
}

function SvgSparkleGem({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <path d="M24 8l7 9H17l7-9z" />
      <path d="M17 17l7 21 7-21" />
      <path d="M7 14l2 2M7 18H11M9 16l2-2" />
      <path d="M37 30l2 2M37 34H41M39 32l2-2" />
      <path d="M7 36l1.5 1.5M7 39H10M8.5 37.5l1.5-1.5" />
    </svg>
  )
}

function SvgRibbon({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <circle cx="24" cy="19" r="11" />
      <path d="M18 29l-7 13 13-6 13 6-7-13" />
      <path d="M20 19h8M24 15v8" />
    </svg>
  )
}

function SvgSkincare({ size, color }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" stroke={color} {...sw}>
      <path d="M24 6c-10 0-17 8-17 18 0 9 6 16 14 17.5V36" />
      <path d="M24 6c10 0 17 8 17 18 0 9-6 16-14 17.5V36" />
      <path d="M24 36c-3 0-5-2-5-4.5S21 27 24 27s5 2 5 4.5S27 36 24 36z" />
      <path d="M18 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  )
}

// ── Lucide wrapper ─────────────────────────────────────────────────────────────

const lc = (Icon: LucideIcon) => (size: number, color: string) =>
  React.createElement(Icon, { size, color, strokeWidth: 1.6 })

// ── Icon definitions ──────────────────────────────────────────────────────────

export type IconDef = { id: string; name: string; category: string; render: (size: number, color: string) => React.ReactNode }

export const ICON_DEFS: IconDef[] = [
  // ── 의료/미용 ──────────────────────────────────────────────────────
  { id: "consultation",   name: "1:1 상담",   category: "의료/미용", render: (s,c) => <SvgConsultation   size={s} color={c} /> },
  { id: "treatment-plan", name: "맞춤 플랜",  category: "의료/미용", render: (s,c) => <SvgTreatmentPlan  size={s} color={c} /> },
  { id: "lifting",        name: "리프팅",     category: "의료/미용", render: (s,c) => <SvgLifting        size={s} color={c} /> },
  { id: "skin-analysis",  name: "피부 분석",  category: "의료/미용", render: (s,c) => <SvgSkinAnalysis   size={s} color={c} /> },
  { id: "injection",      name: "주사 시술",  category: "의료/미용", render: (s,c) => <SvgInjection      size={s} color={c} /> },
  { id: "laser",          name: "레이저",     category: "의료/미용", render: (s,c) => <SvgLaser          size={s} color={c} /> },
  { id: "filler",         name: "필러",       category: "의료/미용", render: (s,c) => <SvgFiller         size={s} color={c} /> },
  { id: "face-beauty",    name: "얼굴",       category: "의료/미용", render: (s,c) => <SvgFaceBeauty     size={s} color={c} /> },
  { id: "medical-cross",  name: "의료 십자",  category: "의료/미용", render: (s,c) => <SvgMedicalCross   size={s} color={c} /> },
  { id: "doctor",         name: "의사",       category: "의료/미용", render: (s,c) => <SvgDoctor         size={s} color={c} /> },
  { id: "certificate",    name: "인증서",     category: "의료/미용", render: (s,c) => <SvgCertificate    size={s} color={c} /> },
  { id: "hand-care",      name: "케어 손",    category: "의료/미용", render: (s,c) => <SvgHandCare       size={s} color={c} /> },
  { id: "sparkle-gem",    name: "뷰티 반짝",  category: "의료/미용", render: (s,c) => <SvgSparkleGem     size={s} color={c} /> },
  { id: "ribbon",         name: "어워드 리본",category: "의료/미용", render: (s,c) => <SvgRibbon         size={s} color={c} /> },
  { id: "skincare",       name: "스킨케어",   category: "의료/미용", render: (s,c) => <SvgSkincare       size={s} color={c} /> },
  { id: "stethoscope",    name: "청진기",     category: "의료/미용", render: lc(Stethoscope) },
  { id: "pill",           name: "알약",       category: "의료/미용", render: lc(Pill) },
  { id: "syringe",        name: "주사기",     category: "의료/미용", render: lc(Syringe) },
  { id: "microscope",     name: "현미경",     category: "의료/미용", render: lc(Microscope) },
  { id: "eye",            name: "눈",         category: "의료/미용", render: lc(Eye) },
  { id: "brain",          name: "뇌/지식",    category: "의료/미용", render: lc(Brain) },
  { id: "thermometer",    name: "체온계",     category: "의료/미용", render: lc(Thermometer) },
  { id: "activity",       name: "맥박/활동",  category: "의료/미용", render: lc(Activity) },
  // ── 서비스 ────────────────────────────────────────────────────────
  { id: "calendar",       name: "예약/달력",  category: "서비스",    render: lc(Calendar) },
  { id: "clock",          name: "시간",       category: "서비스",    render: lc(Clock) },
  { id: "map-pin",        name: "위치",       category: "서비스",    render: lc(MapPin) },
  { id: "phone",          name: "전화",       category: "서비스",    render: lc(Phone) },
  { id: "message",        name: "채팅/상담",  category: "서비스",    render: lc(MessageCircle) },
  { id: "user",           name: "고객",       category: "서비스",    render: lc(User) },
  { id: "users",          name: "팀/고객들",  category: "서비스",    render: lc(Users) },
  { id: "bell",           name: "알림",       category: "서비스",    render: lc(Bell) },
  { id: "navigation",     name: "길안내",     category: "서비스",    render: lc(Navigation) },
  { id: "car",            name: "자동차",     category: "서비스",    render: lc(Car) },
  { id: "home",           name: "홈",         category: "서비스",    render: lc(Home) },
  { id: "gift",           name: "선물",       category: "서비스",    render: lc(Gift) },
  { id: "package",        name: "패키지",     category: "서비스",    render: lc(Package) },
  { id: "tag",            name: "태그/가격",  category: "서비스",    render: lc(Tag) },
  { id: "trending-up",    name: "성장",       category: "서비스",    render: lc(TrendingUp) },
  { id: "camera",         name: "카메라",     category: "서비스",    render: lc(Camera) },
  { id: "video",          name: "영상",       category: "서비스",    render: lc(Video) },
  { id: "coffee",         name: "카페/휴식",  category: "서비스",    render: lc(Coffee) },
  // ── 뷰티/자연 ────────────────────────────────────────────────────
  { id: "heart",          name: "하트",       category: "뷰티/자연", render: lc(Heart) },
  { id: "sparkles",       name: "반짝임",     category: "뷰티/자연", render: lc(Sparkles) },
  { id: "leaf",           name: "자연/잎",    category: "뷰티/자연", render: lc(Leaf) },
  { id: "sun",            name: "태양",       category: "뷰티/자연", render: lc(Sun) },
  { id: "moon",           name: "달",         category: "뷰티/자연", render: lc(Moon) },
  { id: "flower",         name: "꽃",         category: "뷰티/자연", render: lc(Flower2) },
  { id: "droplets",       name: "물방울",     category: "뷰티/자연", render: lc(Droplets) },
  { id: "wind",           name: "바람",       category: "뷰티/자연", render: lc(Wind) },
  { id: "waves",          name: "파도",       category: "뷰티/자연", render: lc(Waves) },
  { id: "flame",          name: "불꽃",       category: "뷰티/자연", render: lc(Flame) },
  { id: "snowflake",      name: "눈송이",     category: "뷰티/자연", render: lc(Snowflake) },
  { id: "zap",            name: "에너지",     category: "뷰티/자연", render: lc(Zap) },
  { id: "smile",          name: "미소",       category: "뷰티/자연", render: lc(Smile) },
  { id: "music",          name: "음악",       category: "뷰티/자연", render: lc(Music) },
  // ── 신뢰/품질 ────────────────────────────────────────────────────
  { id: "star",           name: "별점",       category: "신뢰/품질", render: lc(Star) },
  { id: "shield",         name: "안전/신뢰",  category: "신뢰/품질", render: lc(Shield) },
  { id: "award",          name: "어워드",     category: "신뢰/품질", render: lc(Award) },
  { id: "check-circle",   name: "확인",       category: "신뢰/품질", render: lc(CheckCircle) },
  { id: "gem",            name: "보석",       category: "신뢰/품질", render: lc(Gem) },
  { id: "crown",          name: "왕관",       category: "신뢰/품질", render: lc(Crown) },
  { id: "lock",           name: "자물쇠",     category: "신뢰/품질", render: lc(Lock) },
  { id: "key",            name: "열쇠",       category: "신뢰/품질", render: lc(Key) },
  { id: "chevron-right",  name: "화살표",     category: "신뢰/품질", render: lc(ChevronRight) },
]

export const ICON_CATEGORIES = ["전체", "의료/미용", "서비스", "뷰티/자연", "신뢰/품질"]

export function getIconDef(id: string): IconDef | undefined {
  return ICON_DEFS.find(d => d.id === id)
}

// ── Float anchor → CSS position ───────────────────────────────────────────────

export function anchorToStyle(anchor: FloatAnchor, ox: number, oy: number): React.CSSProperties {
  const isLeft   = anchor.endsWith("l")
  const isRight  = anchor.endsWith("r")
  const isTop    = anchor.startsWith("t")
  const isBottom = anchor.startsWith("b")
  const hStyle: React.CSSProperties = isLeft ? { left: ox } : isRight ? { right: ox } : { left: "50%", marginLeft: -(ox) }
  const vStyle: React.CSSProperties = isTop  ? { top: oy }  : isBottom ? { bottom: oy } : { top: "50%", marginTop: -(oy) }
  const tx = !isLeft && !isRight ? "translateX(-50%)" : ""
  const ty = !isTop && !isBottom ? "translateY(-50%)" : ""
  const transform = [tx, ty].filter(Boolean).join(" ") || undefined
  return { ...hStyle, ...vStyle, ...(transform ? { transform } : {}) }
}

// ── IconPicker modal ──────────────────────────────────────────────────────────

const COLOR_PRESETS = ["#c9a85c", "#ffffff", "#111111", "#888888", "#e8d5b7", "#a8b8c9", "#c9a8a8", "#a8c9b8"]

const ANCHOR_GRID: { key: FloatAnchor; label: string }[][] = [
  [{ key: "tl", label: "↖" }, { key: "tc", label: "↑" }, { key: "tr", label: "↗" }],
  [{ key: "ml", label: "←" }, { key: "mc", label: "·" }, { key: "mr", label: "→" }],
  [{ key: "bl", label: "↙" }, { key: "bc", label: "↓" }, { key: "br", label: "↘" }],
]

export function IconPicker({ open, value, onClose, onApply }: {
  open: boolean; value: IconConfig; onClose: () => void; onApply: (cfg: IconConfig) => void
}) {
  const [cat,   setCat]   = useState("전체")
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState<IconConfig>(value)

  React.useEffect(() => { if (open) setDraft(value) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = ICON_DEFS
    if (cat !== "전체") list = list.filter(d => d.category === cat)
    if (query.trim()) list = list.filter(d => d.name.includes(query.trim()) || d.id.includes(query.trim()))
    return list
  }, [cat, query])

  if (!open) return null
  const upd = (p: Partial<IconConfig>) => setDraft(prev => ({ ...prev, ...p }))
  const selectedDef = draft.iconId ? getIconDef(draft.iconId) : undefined

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 18, width: 700, maxWidth: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>아이콘 라이브러리</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "#888" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          {/* Left — icon browser */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #f0f0f0", overflow: "hidden", minWidth: 0 }}>
            {/* Search */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #f5f5f5", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f7f7f7", borderRadius: 9, padding: "7px 10px" }}>
                <Search size={14} color="#aaa" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="아이콘 검색..." style={{ border: "none", background: "none", fontSize: 13, flex: 1, outline: "none", color: "#333" }} />
              </div>
            </div>
            {/* Categories */}
            <div style={{ display: "flex", gap: 5, padding: "8px 12px", borderBottom: "1px solid #f5f5f5", flexWrap: "wrap", flexShrink: 0 }}>
              {ICON_CATEGORIES.map(c => (
                <button key={c} onClick={() => setCat(c)} style={{ fontSize: 12, padding: "3px 11px", borderRadius: 20, border: "none", cursor: "pointer", background: cat === c ? "#111" : "#f0f0f0", color: cat === c ? "#fff" : "#555", fontWeight: cat === c ? 600 : 400, transition: "all 0.1s" }}>
                  {c}
                </button>
              ))}
            </div>
            {/* Grid */}
            <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 7 }}>
                {filtered.map(def => {
                  const sel = draft.iconId === def.id
                  return (
                    <button key={def.id} onClick={() => upd({ iconId: def.id })} title={def.name}
                      style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, border: sel ? "2px solid #c9a85c" : "1.5px solid #eee", borderRadius: 11, cursor: "pointer", background: sel ? "#fdf8ef" : "#fafafa", padding: 6, transition: "all 0.1s" }}>
                      {def.render(22, sel ? "#c9a85c" : "#555")}
                      <span style={{ fontSize: 9.5, color: sel ? "#c9a85c" : "#888", textAlign: "center", lineHeight: 1.2, wordBreak: "keep-all" }}>{def.name}</span>
                    </button>
                  )
                })}
              </div>
              {filtered.length === 0 && <p style={{ textAlign: "center", color: "#ccc", fontSize: 13, marginTop: 48 }}>검색 결과 없음</p>}
            </div>
          </div>

          {/* Right — settings */}
          <div style={{ width: 224, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 13, overflowY: "auto", flexShrink: 0 }}>
            {/* Preview */}
            <div style={{ background: "#f4f4f4", borderRadius: 12, height: 96, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {selectedDef ? (
                <div style={{ opacity: draft.opacity }}>
                  {selectedDef.render(draft.size > 80 ? 80 : draft.size, draft.color)}
                </div>
              ) : <span style={{ fontSize: 12, color: "#bbb" }}>아이콘을 선택하세요</span>}
            </div>

            {/* Size */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={{ fontSize: 11, color: "#888" }}>크기</label>
                <span style={{ fontSize: 11, color: "#555", fontWeight: 600 }}>{draft.size}px</span>
              </div>
              <input type="range" min={16} max={120} value={draft.size} onChange={e => upd({ size: Number(e.target.value) })} style={{ width: "100%", accentColor: "#c9a85c" }} />
            </div>

            {/* Color */}
            <div>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 5 }}>색상</label>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <input type="color" value={draft.color} onChange={e => upd({ color: e.target.value })} style={{ width: 34, height: 28, border: "1.5px solid #eee", borderRadius: 7, cursor: "pointer", padding: 2 }} />
                <input value={draft.color} onChange={e => upd({ color: e.target.value })} style={{ flex: 1, border: "1.5px solid #eee", borderRadius: 7, padding: "4px 8px", fontSize: 12, fontFamily: "monospace", color: "#333" }} />
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {COLOR_PRESETS.map(cl => (
                  <div key={cl} onClick={() => upd({ color: cl })}
                    style={{ width: 20, height: 20, borderRadius: 5, background: cl, border: draft.color === cl ? "2.5px solid #555" : "1.5px solid #ddd", cursor: "pointer", flexShrink: 0 }} />
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={{ fontSize: 11, color: "#888" }}>투명도</label>
                <span style={{ fontSize: 11, color: "#555", fontWeight: 600 }}>{Math.round(draft.opacity * 100)}%</span>
              </div>
              <input type="range" min={10} max={100} value={Math.round(draft.opacity * 100)} onChange={e => upd({ opacity: Number(e.target.value) / 100 })} style={{ width: "100%", accentColor: "#c9a85c" }} />
            </div>

            {/* Mode */}
            <div>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 6 }}>삽입 방식</label>
              <div style={{ display: "flex", gap: 5 }}>
                {(["block", "float"] as const).map(m => (
                  <button key={m} onClick={() => upd({ mode: m })}
                    style={{ flex: 1, padding: "7px 0", borderRadius: 9, border: draft.mode === m ? "2px solid #c9a85c" : "1.5px solid #eee", background: draft.mode === m ? "#fdf8ef" : "#f7f7f7", cursor: "pointer", fontSize: 12, fontWeight: draft.mode === m ? 700 : 400, color: draft.mode === m ? "#c9a85c" : "#666" }}>
                    {m === "block" ? "블록" : "플로팅"}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 10.5, color: "#bbb", marginTop: 5, lineHeight: 1.45 }}>
                {draft.mode === "block" ? "공간을 차지하며 콘텐츠를 밀어냅니다." : "공간 없이 섹션 위에 떠있습니다."}
              </p>
            </div>

            {/* Block container settings */}
            {draft.mode === "block" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 11, color: "#888" }}>블록 배경색</label>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="color" value={draft.blockBg === "transparent" ? "#ffffff" : (draft.blockBg ?? "#ffffff")} onChange={e => upd({ blockBg: e.target.value })} style={{ width: 34, height: 28, border: "1.5px solid #eee", borderRadius: 7, cursor: "pointer", padding: 2 }} />
                  <input value={draft.blockBg ?? "transparent"} onChange={e => upd({ blockBg: e.target.value })} style={{ flex: 1, border: "1.5px solid #eee", borderRadius: 7, padding: "4px 8px", fontSize: 11, fontFamily: "monospace", color: "#333" }} />
                  <button onClick={() => upd({ blockBg: "transparent" })} style={{ fontSize: 10, color: "#aaa", border: "1.5px solid #eee", borderRadius: 6, padding: "3px 7px", background: "#fafafa", cursor: "pointer", whiteSpace: "nowrap" }}>투명</button>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {["transparent","#ffffff","#111111","#c9a85c","rgba(201,168,92,0.15)","rgba(0,0,0,0.08)"].map(cl => (
                    <div key={cl} onClick={() => upd({ blockBg: cl })}
                      style={{ width: 20, height: 20, borderRadius: 5, background: cl === "transparent" ? "linear-gradient(45deg,#eee 25%,#fff 25%,#fff 50%,#eee 50%,#eee 75%,#fff 75%)" : cl, border: draft.blockBg === cl ? "2.5px solid #555" : "1.5px solid #ddd", cursor: "pointer", flexShrink: 0, backgroundSize: "8px 8px" }} />
                  ))}
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <label style={{ fontSize: 11, color: "#888" }}>가로 패딩</label>
                    <span style={{ fontSize: 11, color: "#555", fontWeight: 600 }}>{draft.blockPadX ?? 16}px</span>
                  </div>
                  <input type="range" min={0} max={60} value={draft.blockPadX ?? 16} onChange={e => upd({ blockPadX: Number(e.target.value) })} style={{ width: "100%", accentColor: "#c9a85c" }} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <label style={{ fontSize: 11, color: "#888" }}>세로 패딩</label>
                    <span style={{ fontSize: 11, color: "#555", fontWeight: 600 }}>{draft.blockPadY ?? 12}px</span>
                  </div>
                  <input type="range" min={0} max={60} value={draft.blockPadY ?? 12} onChange={e => upd({ blockPadY: Number(e.target.value) })} style={{ width: "100%", accentColor: "#c9a85c" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 5 }}>블록 너비</label>
                  <div style={{ display: "flex", gap: 5 }}>
                    {(["auto", "full"] as const).map(w => (
                      <button key={w} onClick={() => upd({ blockW: w })}
                        style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: (draft.blockW ?? "auto") === w ? "2px solid #c9a85c" : "1.5px solid #eee", background: (draft.blockW ?? "auto") === w ? "#fdf8ef" : "#f7f7f7", cursor: "pointer", fontSize: 12, fontWeight: (draft.blockW ?? "auto") === w ? 700 : 400, color: (draft.blockW ?? "auto") === w ? "#c9a85c" : "#666" }}>
                        {w === "auto" ? "콘텐츠 맞춤" : "전체 너비"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Drag position reset */}
            {(draft.posX !== undefined || draft.posY !== undefined) && (
              <button onClick={() => upd({ posX: undefined, posY: undefined })}
                style={{ padding: "6px 0", borderRadius: 8, border: "1.5px solid #f0c0c0", background: "#fff8f8", color: "#c06060", fontSize: 12, cursor: "pointer" }}>
                드래그 위치 초기화
              </button>
            )}

            {/* Float anchor — only for float mode */}
            {draft.mode === "float" && (
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 6 }}>위치</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, width: 90 }}>
                  {ANCHOR_GRID.flat().map(({ key, label }) => (
                    <button key={key} onClick={() => upd({ floatAnchor: key })}
                      style={{ aspectRatio: "1", border: draft.floatAnchor === key ? "2px solid #c9a85c" : "1.5px solid #ddd", borderRadius: 7, background: draft.floatAnchor === key ? "#fdf8ef" : "#f7f7f7", cursor: "pointer", fontSize: 14, color: draft.floatAnchor === key ? "#c9a85c" : "#666" }}>
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  {(["floatX", "floatY"] as const).map(k => (
                    <div key={k}>
                      <label style={{ fontSize: 10, color: "#bbb", display: "block", marginBottom: 2 }}>{k === "floatX" ? "X" : "Y"} 오프셋</label>
                      <input type="number" value={draft[k] ?? 0} onChange={e => upd({ [k]: Number(e.target.value) })}
                        style={{ width: 62, border: "1.5px solid #eee", borderRadius: 7, padding: "3px 7px", fontSize: 12, color: "#333" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={() => { onApply(draft); onClose() }}
                style={{ padding: "10px 0", borderRadius: 10, border: "none", background: "#111", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                적용
              </button>
              {draft.iconId && (
                <button onClick={() => { onApply({ ...draft, iconId: "" }); onClose() }}
                  style={{ padding: "7px 0", borderRadius: 10, border: "1.5px solid #eee", background: "#fff", color: "#aaa", fontSize: 13, cursor: "pointer" }}>
                  아이콘 제거
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── IconField ─────────────────────────────────────────────────────────────────

export function IconField({ value, onChange, label = "아이콘" }: {
  value: IconConfig; onChange: (cfg: IconConfig) => void; label?: string
}) {
  const [open, setOpen] = useState(false)
  const def = value.iconId ? getIconDef(value.iconId) : undefined

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {label && <span style={{ fontSize: 12, color: "#666", minWidth: 52, flexShrink: 0 }}>{label}</span>}
        <button onClick={() => setOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", border: "1.5px solid #e5e5e5", borderRadius: 9, background: "#fafafa", cursor: "pointer", flex: 1, textAlign: "left" }}>
          {def ? (
            <>
              <span style={{ opacity: value.opacity, flexShrink: 0 }}>{def.render(18, value.color)}</span>
              <span style={{ fontSize: 12, color: "#333", fontWeight: 500 }}>{def.name}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#aaa", background: "#efefef", padding: "1px 7px", borderRadius: 10, flexShrink: 0 }}>
                {value.mode === "block" ? "블록" : "플로팅"}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 12, color: "#bbb" }}>+ 아이콘 선택</span>
          )}
        </button>
        {def && (
          <button onClick={() => onChange({ ...value, iconId: "" })}
            style={{ border: "none", background: "none", cursor: "pointer", color: "#ccc", padding: 4, flexShrink: 0 }}>
            <X size={14} />
          </button>
        )}
      </div>
      <IconPicker open={open} value={value} onClose={() => setOpen(false)} onApply={onChange} />
    </>
  )
}

// ── RenderSectionIcon ─────────────────────────────────────────────────────────
// Static renderer (no drag). Float mode uses position:absolute within a relative container.

export function RenderSectionIcon({ config }: { config: IconConfig }) {
  if (!config.iconId) return null
  const def = getIconDef(config.iconId)
  if (!def) return null

  const hasPos = config.posX !== undefined && config.posY !== undefined

  const iconNode = (
    <div style={{ opacity: config.opacity, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {def.render(config.size, config.color)}
    </div>
  )

  const posStyle: React.CSSProperties = hasPos
    ? { position: "absolute", left: config.posX, top: config.posY, zIndex: 5 }
    : config.mode === "float"
      ? { position: "absolute", zIndex: 5, ...anchorToStyle(config.floatAnchor ?? "tc", config.floatX ?? 0, config.floatY ?? 0) }
      : {}

  const wrapped = config.mode === "block"
    ? <div style={{ background: config.blockBg || "transparent", padding: `${config.blockPadY ?? 12}px ${config.blockPadX ?? 16}px`, display: config.blockW === "full" ? "flex" : "inline-flex", justifyContent: "center", width: config.blockW === "full" ? "100%" : undefined }}>{iconNode}</div>
    : iconNode

  if (hasPos || config.mode === "float") {
    return <div style={{ ...posStyle, pointerEvents: "none" }}>{wrapped}</div>
  }
  return wrapped
}

// ── DraggableIconInPreview ────────────────────────────────────────────────────
// Interactive version for the editor preview panel. Supports mouse drag to reposition.
// containerRef must point to a position:relative wrapper around the section.

export function DraggableIconInPreview({
  config, containerRef, onDrag,
}: {
  config: IconConfig
  containerRef: React.RefObject<HTMLDivElement | null>
  onDrag?: (posX: number, posY: number) => void
}) {
  if (!config.iconId) return null
  const def = getIconDef(config.iconId)
  if (!def) return null

  const elemRef     = useRef<HTMLDivElement>(null)
  const hintRef     = useRef<HTMLDivElement>(null)
  const dragState   = useRef({ active: false, startMX: 0, startMY: 0, startEX: 0, startEY: 0 })
  const draggable   = !!onDrag

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable || !containerRef.current || !elemRef.current) return
    e.preventDefault()
    e.stopPropagation()

    const containerRect = containerRef.current.getBoundingClientRect()
    const elemRect      = elemRef.current.getBoundingClientRect()
    const startEX = elemRect.left - containerRect.left
    const startEY = elemRect.top  - containerRect.top

    dragState.current = { active: true, startMX: e.clientX, startMY: e.clientY, startEX, startEY }

    const onMove = (me: MouseEvent) => {
      if (!dragState.current.active || !elemRef.current) return
      const dx   = me.clientX - dragState.current.startMX
      const dy   = me.clientY - dragState.current.startMY
      elemRef.current.style.left      = `${dragState.current.startEX + dx}px`
      elemRef.current.style.top       = `${dragState.current.startEY + dy}px`
      elemRef.current.style.transform = "none"
    }

    const onUp = (me: MouseEvent) => {
      if (!dragState.current.active) return
      dragState.current.active = false
      const dx = me.clientX - dragState.current.startMX
      const dy = me.clientY - dragState.current.startMY
      onDrag?.(Math.round(dragState.current.startEX + dx), Math.round(dragState.current.startEY + dy))
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup",   onUp)
    }

    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup",   onUp)
  }, [draggable, containerRef, onDrag])

  // Compute initial position style (before any drag)
  const hasPos = config.posX !== undefined && config.posY !== undefined
  let posStyle: React.CSSProperties

  if (hasPos) {
    posStyle = { position: "absolute", left: config.posX, top: config.posY }
  } else if (config.mode === "float") {
    posStyle = { position: "absolute", ...anchorToStyle(config.floatAnchor ?? "tc", config.floatX ?? 0, config.floatY ?? 0) }
  } else {
    // block default: horizontally centered near top
    posStyle = { position: "absolute", left: "50%", top: config.blockPadY ?? 12, transform: "translateX(-50%)" }
  }

  const iconNode = (
    <div style={{ opacity: config.opacity, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {def.render(config.size, config.color)}
    </div>
  )

  const content = config.mode === "block"
    ? (
      <div style={{
        background:  config.blockBg || "transparent",
        padding:     `${config.blockPadY ?? 12}px ${config.blockPadX ?? 16}px`,
        display:     config.blockW === "full" ? "flex" : "inline-flex",
        width:       config.blockW === "full" ? "100%" : undefined,
        justifyContent: "center",
        borderRadius: 8,
      }}>
        {iconNode}
      </div>
    )
    : iconNode

  return (
    <div
      ref={elemRef}
      onMouseDown={onMouseDown}
      onMouseEnter={() => { if (hintRef.current) hintRef.current.style.opacity = "1" }}
      onMouseLeave={() => { if (hintRef.current) hintRef.current.style.opacity = "0" }}
      style={{
        ...posStyle,
        zIndex:     20,
        cursor:     draggable ? "grab" : "default",
        userSelect: "none",
      }}
    >
      {content}
      {/* Drag hint — hidden until hover */}
      {draggable && (
        <div ref={hintRef} style={{
          position:   "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)",
          fontSize:   8, color: "rgba(60,60,60,0.7)", background: "rgba(255,255,255,0.92)",
          borderRadius: 4, padding: "1px 6px", pointerEvents: "none", whiteSpace: "nowrap",
          boxShadow:  "0 1px 4px rgba(0,0,0,0.12)",
          opacity:    0, transition: "opacity 0.15s",
        }}>
          ✥ 드래그
        </div>
      )}
    </div>
  )
}
