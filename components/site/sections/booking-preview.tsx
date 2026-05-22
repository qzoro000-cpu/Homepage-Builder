"use client"

import * as React from "react"
import { useState, useCallback, useContext, createContext, useRef } from "react"
import {
  MapPin, Activity, Syringe, CalendarDays, Users, CheckCircle2,
  ChevronLeft, ChevronRight, Search, Star, RotateCcw,
  Bell, MessageCircle,
} from "lucide-react"
import { useTreatment } from "@/lib/treatment-store"
import { useRouter, useParams, useSearchParams } from "next/navigation"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type FieldValue = string | boolean | string[] | number

export type PageId = "home" | "treatments" | "booking" | "directions" | "recruit"

export type TreatmentOption = "원장 상담만" | "상담 후 시술" | "시술만 진행"
export type VisitType = "초진" | "재진"

export type ThemeTokens = {
  gold: string; textPrimary: string; textSub: string; textMuted: string
  border: string; borderGold: string; cardBg: string; cardBgGold: string
  searchBg: string; divider: string; footerBg: string; stepMutedBg: string
}

export type BranchInfo = {
  id: string
  name: string
  address?: string
  isPublic?: boolean
}

export type PreviewBookingProps = {
  values: Record<string, FieldValue>
  branchId: string
  branches: BranchInfo[]
  onNavigate?: (page: PageId) => void
  mode?: "phone" | "page"
  forceNarrow?: boolean
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

export const GOLD    = "#c9a85c"
export const DARK_BG = "#0e0c09"

export const DARK_TO_LIGHT: Record<string, string> = {
  "#ffffff":                  "#111111",
  "rgba(255,255,255,0.55)":  "rgba(0,0,0,0.55)",
  "rgba(255,255,255,0.5)":   "rgba(0,0,0,0.55)",
}

export const STEP_ICONS  = [MapPin, Activity, Syringe, CalendarDays, Users, CheckCircle2]
export const STEP_LABELS = ["지점선택", "진료옵션", "시술선택", "날짜/시간", "고객정보", "완료"]

export const TREATMENT_OPTIONS: { label: TreatmentOption; icon: React.ElementType; desc: string }[] = [
  { label: "원장 상담만", icon: Users,     desc: "시술 없이 원장 상담만 진행합니다" },
  { label: "상담 후 시술", icon: Activity,  desc: "상담 후 당일 시술까지 진행합니다" },
  { label: "시술만 진행", icon: Syringe,   desc: "재방문 고객 대상, 바로 시술 진행합니다" },
]

export const DAYS_KO = ["일", "월", "화", "수", "목", "금", "토"]

export const FONTS = [
  { key: "sans",    label: "고딕",   css: "system-ui, -apple-system, 'Apple SD Gothic Neo', sans-serif" },
  { key: "serif",   label: "명조",   css: "Georgia, 'Noto Serif KR', serif" },
  { key: "classic", label: "클래식", css: "'Playfair Display', Georgia, serif" },
  { key: "mono",    label: "모노",   css: "ui-monospace, 'Courier New', monospace" },
]

export const EYEBROW_SIZES = [
  { key: "xs", label: "XS", px: 6  },
  { key: "sm", label: "S",  px: 7  },
  { key: "md", label: "M",  px: 9  },
  { key: "lg", label: "L",  px: 11 },
]
export const TITLE_SIZES = [
  { key: "sm", label: "S",  px: 11 },
  { key: "md", label: "M",  px: 14 },
  { key: "lg", label: "L",  px: 18 },
  { key: "xl", label: "XL", px: 22 },
]
export const DESC_SIZES = [
  { key: "xs", label: "XS", px: 7  },
  { key: "sm", label: "S",  px: 8  },
  { key: "md", label: "M",  px: 9  },
  { key: "lg", label: "L",  px: 11 },
]
export const WEIGHTS = [
  { key: "300", label: "Thin"     },
  { key: "400", label: "Regular"  },
  { key: "600", label: "SemiBold" },
  { key: "700", label: "Bold"     },
]

// OdeClinic Design Tokens (page mode only)
export const OD = {
  // Colors
  brand: "#483C32",           // primary brown
  accent: "#2C636A",          // teal (price emphasis)
  discount: "#FF4D4D",        // red (discount %)
  weekendSun: "#DC2626",      // red-600
  weekendSat: "#2563EB",      // blue-600
  surface: "#FFFFFF",

  // Brand opacity ladder
  brand05: "rgba(72, 60, 50, 0.05)",
  brand10: "rgba(72, 60, 50, 0.10)",
  brand20: "rgba(72, 60, 50, 0.20)",
  brand30: "rgba(72, 60, 50, 0.30)",
  brand40: "rgba(72, 60, 50, 0.40)",
  brand70: "rgba(72, 60, 50, 0.70)",

  // Radius scale
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 28,

  // Spacing
  pagePaddingX: 20,
  pagePaddingY: 32,
  sectionGap: 32,
  cardPadding: 20,

  // Typography
  fsBase: 14,
  fsLg: 16,
  fsHeader: 18,
  fsPrice: 20,

  fwRegular: 400,
  fwMedium: 500,
  fwSemibold: 600,
  fwBold: 700,
  fwBlack: 900,
} as const

export const DEFAULT_VALUES: Record<string, FieldValue> = {
  bkBgTheme:       "dark",
  // 영어 제목
  bkEyebrow:       "RESERVATION",
  bkEyebrowFont:   "sans",
  bkEyebrowSize:   "xs",
  bkEyebrowColor:  "#c9a85c",
  // 메인 제목
  bkTitle:         "온라인 예약",
  bkTitleFont:     "sans",
  bkTitleSize:     "md",
  bkTitleWeight:   "700",
  bkTitleColor:    "#ffffff",
  // 설명 텍스트
  bkDescFont:      "sans",
  bkDescSize:      "xs",
  bkDescColor:     "rgba(255,255,255,0.55)",
  // 단계별 설명
  bkDesc1:      "방문하실 지점을 선택해주세요.",
  bkDesc2:      "원하시는 진료 옵션을 선택해주세요.",
  bkDesc3:      "받으실 시술을 선택해주세요.",
  bkDesc4:      "편리한 날짜와 시간을 선택해주세요.",
  bkDesc5:      "예약자 정보를 입력해주세요.",
  bkDesc6:      "예약 접수가 완료되었습니다. 확인 후 담당자가 연락드리겠습니다.",
  bkStartHour:  "09:00",
  bkEndHour:    "19:00",
  bkInterval:   30,
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

export const ThemeCtx = createContext<{ isDark: boolean; isPage?: boolean; isNarrow?: boolean }>({ isDark: true })
export function useTheme() { return useContext(ThemeCtx) }

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export function makeTokens(isDark: boolean): ThemeTokens {
  return isDark ? {
    gold:         "#c9a85c",
    textPrimary:  "#ffffff",
    textSub:      "rgba(255,255,255,0.60)",
    textMuted:    "rgba(255,255,255,0.28)",
    border:       "rgba(255,255,255,0.10)",
    borderGold:   "rgba(201,168,92,0.30)",
    cardBg:       "rgba(255,255,255,0.03)",
    cardBgGold:   "rgba(201,168,92,0.08)",
    searchBg:     "rgba(255,255,255,0.05)",
    divider:      "rgba(255,255,255,0.06)",
    footerBg:     "rgba(8,6,3,0.70)",
    stepMutedBg:  "rgba(255,255,255,0.04)",
  } : {
    gold:         "#b8923e",
    textPrimary:  "#111111",
    textSub:      "rgba(0,0,0,0.55)",
    textMuted:    "rgba(0,0,0,0.28)",
    border:       "rgba(0,0,0,0.10)",
    borderGold:   "rgba(180,140,50,0.35)",
    cardBg:       "rgba(0,0,0,0.02)",
    cardBgGold:   "rgba(180,140,50,0.06)",
    searchBg:     "rgba(0,0,0,0.04)",
    divider:      "rgba(0,0,0,0.07)",
    footerBg:     "rgba(245,243,240,0.92)",
    stepMutedBg:  "rgba(0,0,0,0.04)",
  }
}

export function resolveUserColor(stored: string, isDark: boolean): string {
  if (isDark) return stored
  return DARK_TO_LIGHT[stored] ?? stored
}

export function getFontCss(key: string) {
  return FONTS.find(f => f.key === key)?.css ?? FONTS[0].css
}
export function getEyebrowPx(key: string) {
  return EYEBROW_SIZES.find(s => s.key === key)?.px ?? 6
}
export function getTitlePx(key: string) {
  return TITLE_SIZES.find(s => s.key === key)?.px ?? 14
}
export function getDescPx(key: string) {
  return DESC_SIZES.find(s => s.key === key)?.px ?? 8
}

export function val<T extends FieldValue>(values: Record<string, FieldValue>, key: string): T {
  return (values[key] ?? DEFAULT_VALUES[key]) as T
}

export function generateTimeSlots(startHour: string, endHour: string, intervalMins: number): string[] {
  const [sh, sm] = startHour.split(":").map(Number)
  const [eh, em] = endHour.split(":").map(Number)
  const startTotal = (sh || 9) * 60 + (sm || 0)
  const endTotal   = (eh || 19) * 60 + (em || 0)
  const interval   = intervalMins > 0 ? intervalMins : 30
  const slots: string[] = []
  for (let t = startTotal; t < endTotal; t += interval) {
    const h = Math.floor(t / 60).toString().padStart(2, "0")
    const m = (t % 60).toString().padStart(2, "0")
    slots.push(`${h}:${m}`)
  }
  return slots
}

export function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  return cells
}

// ─────────────────────────────────────────────
// Preview sub-components
// ─────────────────────────────────────────────

// -- Dark glassmorphism nav
function PhoneNav({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <div
      style={{
        background: "rgba(8,6,3,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.20)",
          "inset 1px 0 0 rgba(255,255,255,0.10)",
          "inset 0 -1px 0 rgba(255,255,255,0.04)",
          "0 0 0 1px rgba(255,255,255,0.07)",
          "0 2px 12px rgba(0,0,0,0.35)",
        ].join(","),
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 12px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 17, height: 17,
          border: "1px solid rgba(255,255,255,0.55)",
          borderRadius: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.25), 0 0 5px rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.04)",
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#ffffff", fontFamily: "system-ui", lineHeight: 1 }}>T</span>
        </div>
        <div>
          <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: "0.12em", color: "#ffffff", lineHeight: 1.1, fontFamily: "system-ui" }}>TATOA</p>
          <p style={{ fontSize: 5, fontWeight: 300, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", lineHeight: 1, fontFamily: "system-ui" }}>DERMATOLOGY</p>
        </div>
      </div>
      {/* Hamburger */}
      <button
        onClick={onMenuOpen}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 0", lineHeight: 0 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 14, height: 1.5, background: "rgba(255,255,255,0.80)", borderRadius: 1 }} />
          ))}
        </div>
      </button>
    </div>
  )
}

// -- Hamburger drawer
function MenuDrawer({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate?: (page: PageId) => void }) {
  if (!open) return null
  const items: { label: string; pageId: PageId; active: boolean }[] = [
    { label: "홈",      pageId: "home",       active: false },
    { label: "시술안내", pageId: "treatments", active: false },
    { label: "예약하기", pageId: "booking",    active: true  },
    { label: "오시는길", pageId: "directions", active: false },
  ]
  return (
    <div
      style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.28)",
      }}
      onClick={onClose}
    >
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "70%", height: "80%",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderRadius: "0 0 0 16px",
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 4px 24px rgba(0,0,0,0.22)",
        overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px 8px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", color: "#111", fontFamily: "system-ui" }}>TATOA</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#888", lineHeight: 1, padding: "2px" }}>✕</button>
        </div>
        <div style={{ padding: "4px 6px", flex: 1 }}>
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => { onNavigate?.(item.pageId); onClose() }}
              style={{
                display: "block", width: "100%", textAlign: "left" as const,
                padding: "7px 8px",
                borderRadius: 5,
                background: item.active ? "rgba(0,0,0,0.06)" : "transparent",
                marginBottom: 1,
                border: "none", cursor: "pointer",
                fontSize: 8, fontWeight: item.active ? 600 : 400,
                color: item.active ? "#111" : "#555",
                fontFamily: "system-ui",
              }}
            >{item.label}</button>
          ))}
        </div>
        {/* 언어 선택 */}
        <div style={{ padding: "7px 10px 8px", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <p style={{ fontSize: 6, color: "#999", marginBottom: 5, fontFamily: "system-ui", letterSpacing: "0.05em" }}>언어 선택</p>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
            {["한국어", "English", "日本語", "中文"].map((lang, i) => (
              <div key={lang} style={{
                padding: "3px 6px", borderRadius: 20,
                background: i === 0 ? "#7a5c2e" : "transparent",
                border: i === 0 ? "none" : "1px solid rgba(0,0,0,0.18)",
                fontSize: 6, color: i === 0 ? "#fff" : "#666",
                fontFamily: "system-ui",
              }}>{lang}</div>
            ))}
          </div>
        </div>
        {/* 상담하기 CTA */}
        <div style={{ padding: "0 10px 10px" }}>
          <div style={{
            background: "linear-gradient(135deg, #8B6E3A 0%, #6b5228 100%)",
            borderRadius: 8, padding: "7px 10px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            boxShadow: "0 2px 6px rgba(122,92,46,0.30)",
          }}>
            <span style={{ fontSize: 7, fontWeight: 600, color: "#fff", letterSpacing: "0.06em", fontFamily: "system-ui" }}>상담하기</span>
            <MessageCircle size={8} color="rgba(255,255,255,0.85)" />
          </div>
        </div>
      </div>
    </div>
  )
}

// -- Step progress bar
function StepBar({ current }: { current: number }) {
  const { isDark, isPage, isNarrow } = useTheme()
  const T = makeTokens(isDark)
  const circleSize      = isPage ? (isNarrow ? 36 : "clamp(36px, 8vw, 50px)") : 20
  const iconSize        = isPage ? 20 : 9
  const labelSize       = isPage ? (isNarrow ? 9.5 : "clamp(8px, 2.5vw, 11.9px)") : 6
  const columnGap       = isPage ? 6 : 1
  const connectorW      = isPage ? (isNarrow ? 12 : "clamp(12px, 3vw, 20px)") : 10
  const connectorH      = isPage ? 2.4 : 1
  const containerPadding = isPage ? (isNarrow ? "12px 6px 6px" : "12px clamp(4px, 1.5vw, 9px) 6px") : "8px 6px 4px"
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: containerPadding, gap: 0,
    }}>
      {STEP_ICONS.map((Icon, i) => {
        const stepNum = i + 1
        const done = stepNum < current
        const active = stepNum === current
        const muted = stepNum > current
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: columnGap }}>
              <div style={{
                width: circleSize, height: circleSize, borderRadius: "50%",
                background: done || active ? `${T.gold}22` : T.stepMutedBg,
                border: active ? `1.5px solid ${T.gold}` : done ? `1px solid ${T.gold}88` : `1px solid ${T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: active ? `0 0 6px ${T.gold}50` : "none",
              }}>
                <Icon size={iconSize} color={muted ? T.textMuted : T.gold} />
              </div>
              <div style={{ fontSize: labelSize, color: muted ? T.textMuted : T.gold, lineHeight: 1, whiteSpace: "nowrap" }}>
                {STEP_LABELS[i]}
              </div>
            </div>
            {i < 5 && (
              <div style={{
                width: connectorW, height: connectorH,
                background: i < current - 1 ? T.gold : T.border,
                marginBottom: 8,
                marginLeft: isNarrow ? 0 : 2,
                marginRight: isNarrow ? 0 : 2,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// -- Page header: RESERVATION + 메인제목 (nav 바로 아래, 최상단 고정)
function PageHeader({ values }: { values: Record<string, FieldValue> }) {
  const { isDark, isPage } = useTheme()
  const eyebrow      = val<string>(values, "bkEyebrow")
  const eyebrowFont  = getFontCss(val<string>(values, "bkEyebrowFont"))
  const eyebrowPx    = getEyebrowPx(val<string>(values, "bkEyebrowSize")) * (isPage ? 1.4 : 1)
  const eyebrowColor = resolveUserColor(val<string>(values, "bkEyebrowColor"), isDark)
  const title        = val<string>(values, "bkTitle")
  const titleFont    = getFontCss(val<string>(values, "bkTitleFont"))
  const titlePx      = getTitlePx(val<string>(values, "bkTitleSize")) * (isPage ? 1.8 : 1)
  const titleWeight  = val<string>(values, "bkTitleWeight")
  const titleColor   = resolveUserColor(val<string>(values, "bkTitleColor"), isDark)
  return (
    <div style={{ padding: isPage ? "28px 12px 48px" : "14px 12px 10px", textAlign: "center" }}>
      <p style={{
        fontFamily: eyebrowFont,
        fontSize: eyebrowPx,
        color: eyebrowColor,
        letterSpacing: "0.20em",
        textTransform: "uppercase",
        marginBottom: isPage ? 30 : 10,
        lineHeight: 1,
      }}>{eyebrow}</p>
      <p style={{
        fontFamily: titleFont,
        fontSize: titlePx,
        fontWeight: titleWeight,
        color: titleColor,
        lineHeight: 1.2,
      }}>{title}</p>
    </div>
  )
}

// -- Step-level description only (no global header)
function StepHeader({ values, step }: { values: Record<string, FieldValue>; step: number }) {
  const { isDark, isPage } = useTheme()
  const desc      = val<string>(values, `bkDesc${step}`)
  const descFont  = getFontCss(val<string>(values, "bkDescFont"))
  const descPx    = getDescPx(val<string>(values, "bkDescSize")) * (isPage ? 1.8 : 1)
  const descColor = resolveUserColor(val<string>(values, "bkDescColor"), isDark)
  if (!desc) return null
  return (
    <div style={{ padding: "0 12px 8px" }}>
      <p style={{
        fontFamily: descFont,
        fontSize: descPx,
        color: descColor,
        lineHeight: 1.5,
      }}>{desc}</p>
    </div>
  )
}

// -- Gold pill label
function PillLabel({ text }: { text: string }) {
  const { isDark, isPage } = useTheme()
  const T = makeTokens(isDark)
  const pillFontSize     = isPage ? 14 : 7
  const pillPadding      = isPage ? "4px 14px" : "2px 7px"
  const pillRadius       = isPage ? OD.radiusLg : 10
  const pillMarginBottom = isPage ? 8 : 4
  return (
    <div style={{
      display: isPage ? "flex" : "inline-flex",
      alignItems: "center",
      justifyContent: "flex-start",
      width: isPage ? "calc(100% - 20px)" : undefined,
      marginLeft: 10,
      marginRight: isPage ? 10 : undefined,
      marginBottom: pillMarginBottom,
      background: T.cardBgGold,
      border: `1px solid ${T.borderGold}`,
      borderRadius: pillRadius, padding: pillPadding,
      fontSize: pillFontSize, color: T.gold,
    }}>{text}</div>
  )
}

// -- Summary box
function SummaryBox({
  branch, option, treatments: txList, date, time, total, compact,
}: {
  branch: string; option: string; treatments: string[]; date: string; time: string;
  total: string; compact?: boolean
}) {
  const { isDark, isPage } = useTheme()
  const T = makeTokens(isDark)
  const boxRadius      = isPage ? OD.radiusLg : 6
  const boxPadding     = isPage ? "10px 16px" : "5px 8px"
  const rowMarginBottom = isPage ? 8 : 2
  const rowFontSize    = isPage ? 14 : 7
  const valueMaxWidth  = isPage ? 260 : 130
  const rows = compact
    ? [
        { label: "지점", value: branch || "—" },
        { label: "항목", value: option || "—" },
        ...(date ? [{ label: "일시", value: `${date} ${time}` }] : []),
      ]
    : [
        { label: "지점", value: branch || "—" },
        { label: "진료옵션", value: option || "—" },
        { label: "시술", value: txList.length > 0 ? txList.join(", ") : option === "원장 상담만" ? "상담만" : "—" },
        { label: "일시", value: date ? `${date} ${time}` : "—" },
        { label: "예상금액", value: total || "—" },
      ]
  return (
    <div style={{
      margin: "4px 10px",
      background: T.cardBgGold,
      border: `1px solid ${T.borderGold}`,
      borderRadius: boxRadius, padding: boxPadding,
    }}>
      {rows.map(r => (
        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: rowMarginBottom }}>
          <span style={{ fontSize: rowFontSize, color: T.textMuted }}>{r.label}</span>
          <span style={{ fontSize: rowFontSize, color: T.textPrimary, maxWidth: valueMaxWidth, textAlign: "right" as const }}>{r.value}</span>
        </div>
      ))}
    </div>
  )
}

// -- Nav buttons
function NavButtons({
  step, onPrev, onNext, prevDisabled,
}: { step: number; onPrev: () => void; onNext: () => void; prevDisabled?: boolean }) {
  const { isDark } = useTheme()
  const T = makeTokens(isDark)
  return (
    <div style={{
      display: "flex", gap: 6, padding: "6px 10px 8px",
      borderTop: `1px solid ${T.divider}`,
      background: isDark ? "rgba(8,6,3,0.6)" : "rgba(245,243,240,0.85)",
      marginTop: "auto",
    }}>
      <button
        onClick={onPrev}
        disabled={prevDisabled}
        style={{
          flex: 1, height: 26,
          border: `1px solid ${prevDisabled ? T.border : T.borderGold}`,
          background: "transparent", borderRadius: 4, fontSize: 8,
          color: prevDisabled ? T.textMuted : T.textSub,
          cursor: prevDisabled ? "not-allowed" : "pointer",
        }}
      >이전</button>
      <button
        onClick={onNext}
        style={{
          flex: 2, height: 26, border: "none",
          background: `linear-gradient(135deg, ${T.gold}, #a07830)`,
          borderRadius: 4, fontSize: 8,
          color: isDark ? DARK_BG : "#ffffff",
          fontWeight: 700, cursor: "pointer",
        }}
      >{step === 6 ? "완료" : "다음"}</button>
    </div>
  )
}

// ─── Step 1: Branch selection ─────────────────────────────────────────────────

function Step1Branch({
  values, selectedBranchId, onSelect, branchId, branches,
}: {
  values: Record<string, FieldValue>
  selectedBranchId: string
  onSelect: (id: string) => void
  branchId: string
  branches: BranchInfo[]
}) {
  const { isDark, isPage } = useTheme()
  const T = makeTokens(isDark)
  const searchFontSize = isPage ? 14 : 7
  const searchPadding  = isPage ? "6px 12px 6px 36px" : "3px 6px 3px 18px"
  const searchRadius   = isPage ? 8 : 4
  const searchIconSize = isPage ? 16 : 8
  const [search, setSearch] = useState("")
  // STEP 19-A-4-fix (2026-05-09): isPublic 필터링은 caller 책임.
  // booking-page.tsx (어드민): 단일 currentBranch 전달 — gumi 비공개여도 편집 진입 시 보여야 함.
  // preview/site/.../booking/page.tsx (테스트 사이트): 단일 snapshot.branch 전달 — 라우트 진입 자체가 권한 게이트.
  // 멀티브랜치 도입 시 caller 측에서 isPublic 필터링 추가 필요 (테스트 사이트가 멀티 지점 받기 시작할 때).
  const filtered = branches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.address ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={isPage ? { display: "flex", flexDirection: "column" } : { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <StepHeader values={values} step={1} />
      {isPage ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 4, height: 16, background: OD.brand, borderRadius: 9999 }} />
          <div style={{ fontSize: OD.fsHeader, fontWeight: OD.fwBold, color: OD.brand }}>지점을 선택해주세요</div>
        </div>
      ) : (
        <div style={{ padding: "4px 10px 2px", fontSize: 8, color: T.textSub, fontWeight: 600 }}>
          지점을 선택해주세요
        </div>
      )}
      {/* Search */}
      <div style={{ padding: "2px 10px 4px", position: "relative" }}>
        <Search size={searchIconSize} color={T.textMuted} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="지점 검색..."
          style={{
            width: "100%", background: T.searchBg, border: `1px solid ${T.border}`,
            borderRadius: searchRadius, padding: searchPadding, fontSize: searchFontSize, color: T.textPrimary,
            outline: "none", boxSizing: "border-box" as const,
          }}
        />
      </div>
      {/* Branch list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 10px", display: "flex", flexDirection: "column", gap: isPage ? 0 : 4 }}>
        {filtered.map(b => {
          const isSelected = b.id === selectedBranchId || (selectedBranchId === "" && b.id === branchId)
          return isPage ? (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              style={{
                width: "100%",
                background: OD.surface,
                border: `2px solid ${isSelected ? OD.brand : OD.brand10}`,
                borderRadius: OD.radiusLg,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                cursor: "pointer",
                textAlign: "left",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: OD.fsLg, fontWeight: OD.fwBold, color: OD.brand }}>{b.name}</div>
              <div style={{ fontSize: OD.fsBase, fontWeight: OD.fwRegular, color: OD.brand70 }}>{b.address}</div>
            </button>
          ) : (
            <div
              key={b.id}
              onClick={() => onSelect(b.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 7px", borderRadius: 5, cursor: "pointer",
                border: isSelected ? `1px solid ${T.gold}` : `1px solid ${T.border}`,
                background: isSelected ? T.cardBgGold : T.cardBg,
              }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                border: isSelected ? `2px solid ${T.gold}` : `1.5px solid ${T.textSub}`,
                background: isSelected ? T.gold : "transparent",
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 8, color: isSelected ? T.gold : T.textPrimary, fontWeight: isSelected ? 700 : 400 }}>{b.name}</div>
                <div style={{ fontSize: 6.5, color: T.textMuted }}>{b.address}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2: Treatment option ─────────────────────────────────────────────────

function Step2Option({
  values, selectedBranchName, selectedOption, onSelect,
}: {
  values: Record<string, FieldValue>
  selectedBranchName: string
  selectedOption: TreatmentOption | ""
  onSelect: (o: TreatmentOption) => void
}) {
  const { isDark, isPage } = useTheme()
  const T = makeTokens(isDark)
  return (
    <div style={isPage ? { display: "flex", flexDirection: "column" } : { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <StepHeader values={values} step={2} />
      <PillLabel text={selectedBranchName || "지점 미선택"} />
      {isPage ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 4, height: 16, background: OD.brand, borderRadius: 9999 }} />
          <div style={{ fontSize: OD.fsHeader, fontWeight: OD.fwBold, color: OD.brand }}>진료 옵션을 선택해주세요</div>
        </div>
      ) : (
        <div style={{ padding: "2px 10px 4px", fontSize: 8, color: T.textSub, fontWeight: 600 }}>
          진료 옵션을 선택해주세요
        </div>
      )}
      <div style={isPage
        ? { padding: "0 10px", display: "flex", flexDirection: "column", overflowY: "auto" }
        : { flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: 5, overflowY: "auto" }
      }>
        {TREATMENT_OPTIONS.map(({ label, icon: Icon, desc }) => {
          const isSelected = selectedOption === label
          return isPage ? (
            <button
              key={label}
              onClick={() => onSelect(label)}
              style={{
                width: "100%",
                background: OD.surface,
                border: `2px solid ${isSelected ? OD.brand : OD.brand10}`,
                borderRadius: OD.radiusLg,
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                textAlign: "left",
                marginBottom: 12,
              }}
            >
              <Icon style={{ width: 24, height: 24, color: OD.brand, flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <div style={{ fontSize: OD.fsLg, fontWeight: OD.fwBold, color: OD.brand }}>{label}</div>
                {desc && (
                  <div style={{ fontSize: OD.fsBase, fontWeight: OD.fwRegular, color: OD.brand70 }}>{desc}</div>
                )}
              </div>
            </button>
          ) : (
            <div
              key={label}
              onClick={() => onSelect(label)}
              style={{
                padding: "8px 10px", borderRadius: 6, cursor: "pointer",
                border: isSelected ? `1.5px solid ${T.gold}` : `1px solid ${T.border}`,
                background: isSelected ? T.cardBgGold : T.cardBg,
                display: "flex", flexDirection: "column", gap: 3,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Icon size={11} color={isSelected ? T.gold : T.textMuted} />
                <span style={{ fontSize: 9, color: isSelected ? T.gold : T.textPrimary, fontWeight: isSelected ? 700 : 500 }}>{label}</span>
              </div>
              <div style={{ fontSize: 7, color: T.textMuted, lineHeight: 1.4 }}>{desc}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 3: Treatment selection ──────────────────────────────────────────────

function Step3Treatments({
  values, selectedBranchName, branchId, selectedTxIds, onToggle,
}: {
  values: Record<string, FieldValue>
  selectedBranchName: string
  branchId: string
  selectedTxIds: string[]
  onToggle: (id: string) => void
}) {
  const { isDark, isPage } = useTheme()
  const T = makeTokens(isDark)
  const searchFontSize = isPage ? 14 : 7
  const searchPadding  = isPage ? "6px 12px 6px 36px" : "3px 6px 3px 18px"
  const searchRadius   = isPage ? 8 : 4
  const searchIconSize = isPage ? 16 : 8
  const { getTreatmentsByBranch } = useTreatment()
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("전체")

  const allTx = getTreatmentsByBranch(branchId).filter(t => t.profile.isPublic !== false)
  const categories = ["전체", ...Array.from(new Set(allTx.map(t => t.profile.category).filter(Boolean)))]
  const filtered = allTx.filter(t => {
    const matchSearch = !search ||
      t.profile.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.profile.cardTitle || "").toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === "전체" || t.profile.category === catFilter
    return matchSearch && matchCat
  })

  const selectedTxs = allTx.filter(t => selectedTxIds.includes(t.profile.id))
  const totalRegular = selectedTxs.reduce((s, t) => s + (t.profile.priceRegular || 0), 0)
  const totalEvent   = selectedTxs.reduce((s, t) => s + (t.profile.priceEvent || t.profile.priceRegular || 0), 0)

  return (
    <div style={isPage ? { display: "flex", flexDirection: "column" } : { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <StepHeader values={values} step={3} />
      <PillLabel text={selectedBranchName || "지점 미선택"} />
      {isPage ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 4, height: 16, background: OD.brand, borderRadius: 9999 }} />
          <div style={{ fontSize: OD.fsHeader, fontWeight: OD.fwBold, color: OD.brand }}>시술을 선택해주세요</div>
        </div>
      ) : (
        <div style={{ padding: "2px 10px 4px", fontSize: 8, color: T.textSub, fontWeight: 600 }}>
          시술을 선택해주세요
        </div>
      )}
      {/* Search */}
      <div style={{ padding: "2px 10px 4px", position: "relative" }}>
        <Search size={searchIconSize} color={T.textMuted} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="시술 검색..."
          style={{
            width: "100%", background: T.searchBg, border: `1px solid ${T.border}`,
            borderRadius: searchRadius, padding: searchPadding, fontSize: searchFontSize, color: T.textPrimary,
            outline: "none", boxSizing: "border-box" as const,
          }}
        />
      </div>
      {/* Category pills */}
      <div style={{ display: "flex", gap: isPage ? 8 : 4, padding: isPage ? "4px 10px 8px" : "2px 10px 4px", overflowX: "auto", flexWrap: "nowrap" }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            style={{
              flexShrink: 0, padding: isPage ? "4px 14px" : "2px 7px", borderRadius: isPage ? 20 : 10, fontSize: isPage ? 14 : 7, cursor: "pointer",
              border: catFilter === cat ? `1px solid ${T.gold}` : `1px solid ${T.border}`,
              background: catFilter === cat ? T.cardBgGold : "transparent",
              color: catFilter === cat ? T.gold : T.textSub,
              whiteSpace: "nowrap" as const,
            }}
          >{cat}</button>
        ))}
      </div>
      {/* Treatment list */}
      <div style={isPage
        ? { overflowY: "auto", maxHeight: 450, paddingRight: 4, padding: "0 10px", display: "flex", flexDirection: "column" }
        : { flex: 1, overflowY: "auto", padding: "0 10px", display: "flex", flexDirection: "column", gap: 3 }
      }>
        {filtered.slice(0, 8).map(t => {
          const checked = selectedTxIds.includes(t.profile.id)
          return isPage ? (
            <button
              key={t.profile.id}
              onClick={() => onToggle(t.profile.id)}
              style={{
                width: "100%",
                background: OD.surface,
                border: `2px solid ${checked ? OD.brand : OD.brand10}`,
                borderRadius: OD.radiusXl,
                padding: OD.cardPadding,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                cursor: "pointer",
                textAlign: "left",
                marginBottom: 12,
                boxShadow: checked ? "0 10px 15px -3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {/* 시술명 + 카테고리 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: OD.fsLg, fontWeight: OD.fwBold, color: OD.brand }}>
                    {t.profile.cardTitle || t.profile.name}
                  </div>
                  {t.profile.cardBadge && (
                    <div style={{ fontSize: 12, fontWeight: OD.fwBlack, color: OD.discount }}>
                      {t.profile.cardBadge}
                    </div>
                  )}
                </div>
                {t.profile.category && (
                  <div style={{ fontSize: OD.fsBase, fontWeight: OD.fwRegular, color: OD.brand70 }}>
                    {t.profile.category}
                  </div>
                )}
              </div>
              {/* 가격 영역 */}
              {(t.profile.priceRegular || t.profile.priceEvent) ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: OD.fwMedium, color: "rgba(44,99,106,0.6)" }}>VAT 별도</div>
                  {t.profile.priceEvent ? (
                    <>
                      {t.profile.priceRegular && (
                        <div style={{ fontSize: 13, fontWeight: OD.fwBold, color: OD.brand20, textDecoration: "line-through" }}>
                          {t.profile.priceRegular.toLocaleString()}원
                        </div>
                      )}
                      <div style={{ fontSize: OD.fsPrice, fontWeight: OD.fwBlack, color: OD.accent, lineHeight: 1 }}>
                        {t.profile.priceEvent.toLocaleString()}원
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: OD.fsPrice, fontWeight: OD.fwBlack, color: OD.brand, lineHeight: 1 }}>
                      {t.profile.priceRegular!.toLocaleString()}원
                    </div>
                  )}
                </div>
              ) : null}
            </button>
          ) : (
            <div
              key={t.profile.id}
              onClick={() => onToggle(t.profile.id)}
              style={{
                padding: "5px 7px", borderRadius: 5, cursor: "pointer",
                border: checked ? `1px solid ${T.gold}` : `1px solid ${T.border}`,
                background: checked ? T.cardBgGold : T.cardBg,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 8, color: checked ? T.gold : T.textPrimary, fontWeight: checked ? 700 : 400 }}>
                    {t.profile.cardTitle || t.profile.name}
                  </span>
                  {t.profile.cardBadge && (
                    <span style={{
                      fontSize: 6, background: T.cardBgGold, color: T.gold,
                      borderRadius: 4, padding: "1px 4px",
                    }}>{t.profile.cardBadge}</span>
                  )}
                </div>
                <div style={{ fontSize: 6.5, color: T.textMuted }}>{t.profile.category}</div>
                <div style={{ display: "flex", gap: 4, marginTop: 1 }}>
                  {t.profile.priceRegular ? (
                    <span style={{ fontSize: 7, color: t.profile.priceEvent ? T.textMuted : T.textSub, textDecoration: t.profile.priceEvent ? "line-through" : "none" }}>
                      ₩{t.profile.priceRegular.toLocaleString()}
                    </span>
                  ) : null}
                  {t.profile.priceEvent ? (
                    <span style={{ fontSize: 7, color: T.gold, fontWeight: 700 }}>
                      ₩{t.profile.priceEvent.toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </div>
              <div style={{
                width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                border: checked ? `2px solid ${T.gold}` : `1.5px solid ${T.textSub}`,
                background: checked ? T.gold : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {checked && <span style={{ fontSize: 7, color: isDark ? DARK_BG : "#ffffff", fontWeight: 900 }}>✓</span>}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ fontSize: 8, color: T.textMuted, textAlign: "center", padding: "12px 0" }}>
            검색 결과가 없습니다
          </div>
        )}
      </div>
      {/* Selected summary */}
      {selectedTxs.length > 0 && (
        <div style={{
          margin: "4px 10px 2px",
          background: T.cardBgGold, border: `1px solid ${T.borderGold}`,
          borderRadius: isPage ? OD.radiusLg : 6, padding: isPage ? "10px 16px" : "4px 8px",
        }}>
          <div style={{ fontSize: isPage ? 14 : 7, color: T.gold, fontWeight: 600, marginBottom: isPage ? 8 : 2 }}>
            선택된 시술 요약 ({selectedTxs.length}개)
          </div>
          {selectedTxs.map(t => (
            <div key={t.profile.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: isPage ? 4 : 1 }}>
              <span style={{ fontSize: isPage ? 13 : 6.5, color: T.textSub }}>{t.profile.cardTitle || t.profile.name}</span>
              <span style={{ fontSize: isPage ? 13 : 6.5, color: T.textMuted }}>
                {t.profile.priceEvent
                  ? `₩${t.profile.priceEvent.toLocaleString()}`
                  : t.profile.priceRegular ? `₩${t.profile.priceRegular.toLocaleString()}` : "문의"}
              </span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${T.borderGold}`, paddingTop: isPage ? 8 : 2, marginTop: isPage ? 8 : 2 }}>
            <span style={{ fontSize: isPage ? 14 : 7, color: T.gold }}>예상 합계</span>
            <div style={{ textAlign: "right" as const }}>
              {totalRegular !== totalEvent && (
                <div style={{ fontSize: isPage ? 12 : 6, color: T.textMuted, textDecoration: "line-through" }}>₩{totalRegular.toLocaleString()}</div>
              )}
              <div style={{ fontSize: isPage ? 14 : 7, color: T.gold, fontWeight: 700 }}>₩{totalEvent.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 4: Date & time ──────────────────────────────────────────────────────

function Step4DateTime({
  values, option, selectedTxIds, branchId,
  selectedDate, onDateSelect, selectedTime, onTimeSelect,
}: {
  values: Record<string, FieldValue>
  option: TreatmentOption | ""
  selectedTxIds: string[]
  branchId: string
  selectedDate: string; onDateSelect: (d: string) => void
  selectedTime: string; onTimeSelect: (t: string) => void
}) {
  const { isDark, isPage } = useTheme()
  const T = makeTokens(isDark)
  const { getTreatmentsByBranch } = useTreatment()
  const now = new Date()
  const [viewYear, setViewYear]   = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const allTx    = getTreatmentsByBranch(branchId)
  const selectedTxs = allTx.filter(t => selectedTxIds.includes(t.profile.id))
  const totalEvent  = selectedTxs.reduce((s, t) => s + (t.profile.priceEvent || t.profile.priceRegular || 0), 0)

  const cells  = getCalendarDays(viewYear, viewMonth)
  const slots  = generateTimeSlots(
    val<string>(values, "bkStartHour"),
    val<string>(values, "bkEndHour"),
    val<number>(values, "bkInterval"),
  )
  const today  = now.getDate()
  const monthLabel = `${viewYear}.${String(viewMonth + 1).padStart(2, "0")}`

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <StepHeader values={values} step={4} />
      {/* Compact summary */}
      {option === "원장 상담만" ? (
        <PillLabel text="원장 상담" />
      ) : selectedTxs.length > 0 ? (
        <div style={{ margin: "2px 10px 2px", background: T.cardBgGold, border: `1px solid ${T.borderGold}`, borderRadius: isPage ? OD.radiusLg : 5, padding: isPage ? "10px 16px" : "3px 7px" }}>
          <div style={{ fontSize: isPage ? 14 : 7, color: T.gold }}>{selectedTxs.map(t => t.profile.cardTitle || t.profile.name).join(", ")}</div>
          {totalEvent > 0 && <div style={{ fontSize: isPage ? 14 : 7, color: T.textSub }}>예상 ₩{totalEvent.toLocaleString()}</div>}
        </div>
      ) : null}
      {isPage ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 4, height: 16, background: OD.brand, borderRadius: 9999 }} />
          <div style={{ fontSize: OD.fsHeader, fontWeight: OD.fwBold, color: OD.brand }}>날짜와 시간을 선택해주세요</div>
        </div>
      ) : (
        <div style={{ padding: "2px 10px 4px", fontSize: 8, color: T.textSub, fontWeight: 600 }}>
          날짜와 시간을 선택해주세요
        </div>
      )}
      {/* Calendar */}
      {isPage ? (
        <div style={{
          margin: "0 0 16px",
          background: OD.surface,
          border: `1px solid ${OD.brand10}`,
          borderRadius: OD.radiusXl,
          overflow: "hidden",
        }}>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
            <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: OD.brand, padding: 0 }}>
              <ChevronLeft size={20} />
            </button>
            <div style={{ fontSize: OD.fsHeader, fontWeight: OD.fwBold, color: OD.brand }}>{monthLabel}</div>
            <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: OD.brand, padding: 0 }}>
              <ChevronRight size={20} />
            </button>
          </div>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 12px 12px" }}>
            {DAYS_KO.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: OD.fwSemibold, color: OD.brand40 }}>{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, padding: "0 12px 12px" }}>
            {cells.map((day, idx) => {
              if (day === null) return <div key={idx} />
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const isSel = selectedDate === dateStr
              const dayOfWeek = idx % 7
              const isPast =
                viewYear < now.getFullYear() ||
                (viewYear === now.getFullYear() && viewMonth < now.getMonth()) ||
                (viewYear === now.getFullYear() && viewMonth === now.getMonth() && day < today)
              const textColor = dayOfWeek === 0 ? OD.weekendSun : dayOfWeek === 6 ? OD.weekendSat : OD.brand
              return (
                <button
                  key={idx}
                  disabled={isPast}
                  onClick={() => onDateSelect(dateStr)}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 9999,
                    border: "none",
                    background: isSel ? OD.brand : "transparent",
                    color: isSel ? OD.surface : textColor,
                    fontSize: 13,
                    fontWeight: OD.fwSemibold,
                    opacity: isPast ? 0.25 : 1,
                    cursor: isPast ? "not-allowed" : "pointer",
                  }}
                >{day}</button>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ margin: "0 10px 4px", background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px" }}>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
            <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSub, padding: 0 }}>
              <ChevronLeft size={10} />
            </button>
            <span style={{ fontSize: 8, color: T.textPrimary, fontWeight: 600 }}>{monthLabel}</span>
            <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSub, padding: 0 }}>
              <ChevronRight size={10} />
            </button>
          </div>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: 3 }}>
            {DAYS_KO.map(d => (
              <div key={d} style={{ fontSize: 6, color: T.textMuted, textAlign: "center" as const }}>{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
            {cells.map((day, idx) => {
              if (day === null) return <div key={idx} />
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const isToday = day === today && viewMonth === now.getMonth() && viewYear === now.getFullYear()
              const isSel   = selectedDate === dateStr
              return (
                <button
                  key={idx}
                  onClick={() => onDateSelect(dateStr)}
                  style={{
                    background: isSel ? T.gold : isToday ? T.cardBgGold : "transparent",
                    border: isToday && !isSel ? `1px solid ${T.borderGold}` : "1px solid transparent",
                    borderRadius: 3,
                    color: isSel ? (isDark ? DARK_BG : "#ffffff") : isToday ? T.gold : T.textSub,
                    fontSize: 7, cursor: "pointer", padding: "2px 0", fontWeight: isSel || isToday ? 700 : 400,
                  }}
                >{day}</button>
              )
            })}
          </div>
        </div>
      )}
      {/* Time slots */}
      {(!isPage || selectedDate) && (
        isPage ? (
          <div style={{
            background: OD.surface,
            border: `1px solid ${OD.brand10}`,
            borderRadius: OD.radiusXl,
            padding: 20,
            marginTop: 16,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {slots.map(slot => {
                const isSel = selectedTime === slot
                return (
                  <button
                    key={slot}
                    onClick={() => onTimeSelect(slot)}
                    style={{
                      background: isSel ? OD.brand : OD.surface,
                      border: `1px solid ${isSel ? OD.brand : OD.brand10}`,
                      borderRadius: OD.radiusMd,
                      padding: "12px 8px",
                      fontSize: OD.fsBase,
                      fontWeight: OD.fwSemibold,
                      color: isSel ? OD.surface : OD.brand,
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >{slot}</button>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "0 10px" }}>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
              {slots.map(slot => {
                const isSel = selectedTime === slot
                return (
                  <button
                    key={slot}
                    onClick={() => onTimeSelect(slot)}
                    style={{
                      padding: "3px 7px", borderRadius: 4, fontSize: 7, cursor: "pointer",
                      border: isSel ? `1px solid ${T.gold}` : `1px solid ${T.border}`,
                      background: isSel ? T.gold : T.cardBg,
                      color: isSel ? (isDark ? DARK_BG : "#ffffff") : T.textSub,
                      fontWeight: isSel ? 700 : 400,
                    }}
                  >{slot}</button>
                )
              })}
            </div>
          </div>
        )
      )}
    </div>
  )
}

// ─── Step 5: Customer info ────────────────────────────────────────────────────

function Step5Info({
  values, branchName, option, selectedTxIds, branchId, date, time,
}: {
  values: Record<string, FieldValue>
  branchName: string; option: TreatmentOption | ""; selectedTxIds: string[]
  branchId: string; date: string; time: string
}) {
  const { isDark, isPage } = useTheme()
  const T = makeTokens(isDark)
  const { getTreatmentsByBranch } = useTreatment()
  const [visitType, setVisitType] = useState<VisitType>("초진")
  const [name, setName]           = useState("")
  const [phone, setPhone]         = useState("")
  const [email, setEmail]         = useState("")
  const [note, setNote]           = useState("")
  // Reminder notification preferences (customer opt-in)
  const [remWeek,      setRemWeek]      = useState(true)
  const [remThreeDays, setRemThreeDays] = useState(true)
  const [remDayOf,     setRemDayOf]     = useState(true)

  const allTx = getTreatmentsByBranch(branchId)
  const selectedTxs = allTx.filter(t => selectedTxIds.includes(t.profile.id))
  const totalEvent  = selectedTxs.reduce((s, t) => s + (t.profile.priceEvent || t.profile.priceRegular || 0), 0)
  const txNames     = selectedTxs.map(t => t.profile.cardTitle || t.profile.name)

  const inputStyle: React.CSSProperties = {
    width: "100%", background: T.searchBg,
    border: `1px solid ${T.border}`, borderRadius: 4,
    padding: "4px 7px", fontSize: 7, color: T.textPrimary, outline: "none",
    boxSizing: "border-box",
  }
  const labelStyle: React.CSSProperties = { fontSize: 7, color: T.textMuted, marginBottom: 2, display: "block" }

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <StepHeader values={values} step={5} />
      {/* Compact summary */}
      <SummaryBox
        branch={branchName} option={option} treatments={txNames}
        date={date} time={time} total={totalEvent > 0 ? `₩${totalEvent.toLocaleString()}` : "—"}
        compact
      />
      {isPage ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 4, height: 16, background: OD.brand, borderRadius: 9999 }} />
          <div style={{ fontSize: OD.fsHeader, fontWeight: OD.fwBold, color: OD.brand }}>고객 정보를 입력해주세요</div>
        </div>
      ) : (
        <div style={{ padding: "2px 10px 4px", fontSize: 8, color: T.textSub, fontWeight: 600 }}>
          고객 정보를 입력해주세요
        </div>
      )}
      {isPage ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Visit type */}
          <div>
            <label style={{ fontSize: OD.fsBase, color: OD.brand70, fontWeight: OD.fwMedium, marginBottom: 8, display: "block" }}>방문유형</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["초진", "재진"] as VisitType[]).map(vt => (
                <button
                  key={vt}
                  onClick={() => setVisitType(vt)}
                  style={{
                    flex: 1, padding: "10px 0", fontSize: OD.fsBase, cursor: "pointer",
                    border: visitType === vt ? `1px solid ${OD.brand}` : `1px solid ${OD.brand20}`,
                    background: visitType === vt ? OD.brand10 : "transparent",
                    color: visitType === vt ? OD.brand : OD.brand40,
                    borderRadius: OD.radiusMd,
                    fontWeight: visitType === vt ? OD.fwSemibold : OD.fwRegular,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {vt === "초진" ? <Star size={16} color={visitType === vt ? OD.brand : OD.brand40} /> : <RotateCcw size={16} color={visitType === vt ? OD.brand : OD.brand40} />}
                  {vt}
                </button>
              ))}
            </div>
          </div>
          {/* Name */}
          <div>
            <label style={{ fontSize: OD.fsBase, color: OD.brand70, fontWeight: OD.fwMedium, marginBottom: 8, display: "block" }}>성함</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" style={{ width: "100%", background: OD.surface, border: `1px solid ${OD.brand20}`, borderRadius: OD.radiusMd, padding: "12px 16px", fontSize: OD.fsBase, color: OD.brand, outline: "none", boxSizing: "border-box" as const }} />
          </div>
          {/* Phone */}
          <div>
            <label style={{ fontSize: OD.fsBase, color: OD.brand70, fontWeight: OD.fwMedium, marginBottom: 8, display: "block" }}>연락처</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" style={{ width: "100%", background: OD.surface, border: `1px solid ${OD.brand20}`, borderRadius: OD.radiusMd, padding: "12px 16px", fontSize: OD.fsBase, color: OD.brand, outline: "none", boxSizing: "border-box" as const }} />
          </div>
          {/* Email */}
          <div>
            <label style={{ fontSize: OD.fsBase, color: OD.brand70, fontWeight: OD.fwMedium, marginBottom: 8, display: "block" }}>이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" style={{ width: "100%", background: OD.surface, border: `1px solid ${OD.brand20}`, borderRadius: OD.radiusMd, padding: "12px 16px", fontSize: OD.fsBase, color: OD.brand, outline: "none", boxSizing: "border-box" as const }} />
          </div>
          {/* Note */}
          <div>
            <label style={{ fontSize: OD.fsBase, color: OD.brand70, fontWeight: OD.fwMedium, marginBottom: 8, display: "block" }}>요청사항</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="특이사항이나 요청사항을 입력해주세요" rows={3} style={{ width: "100%", background: OD.surface, border: `1px solid ${OD.brand20}`, borderRadius: OD.radiusMd, padding: "12px 16px", fontSize: OD.fsBase, color: OD.brand, outline: "none", boxSizing: "border-box" as const, resize: "none", lineHeight: 1.5 }} />
          </div>
          {/* Reminder */}
          <div style={{ border: `1px solid ${OD.brand20}`, borderRadius: OD.radiusLg, padding: 16, background: OD.brand05 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Bell size={16} color={OD.brand} />
              <span style={{ fontSize: OD.fsBase, color: OD.brand, fontWeight: OD.fwSemibold }}>예약 알림 받기</span>
              <span style={{ fontSize: 12, color: OD.brand40, marginLeft: 2 }}>(선택)</span>
            </div>
            {([
              { label: "예약 1주일 전 알림",      checked: remWeek,      toggle: () => setRemWeek(p      => !p) },
              { label: "예약 3일 전 알림",         checked: remThreeDays, toggle: () => setRemThreeDays(p => !p) },
              { label: "예약 당일 오전 8:00 알림", checked: remDayOf,     toggle: () => setRemDayOf(p     => !p) },
            ] as { label: string; checked: boolean; toggle: () => void }[]).map((item, i) => (
              <div key={i} onClick={item.toggle} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 2 ? 10 : 0, cursor: "pointer" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: item.checked ? `1px solid ${OD.brand}` : `1px solid ${OD.brand30}`, background: item.checked ? OD.brand : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}>
                  {item.checked && <span style={{ fontSize: 11, color: "#fff", fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ fontSize: OD.fsBase, color: item.checked ? OD.brand : OD.brand40, transition: "color 0.12s" }}>{item.label}</span>
              </div>
            ))}
            <div style={{ fontSize: 12, color: OD.brand40, marginTop: 12, lineHeight: 1.5, borderTop: `1px solid ${OD.brand10}`, paddingTop: 4 }}>
              선택한 채널(카카오·이메일·SMS)로 자동 발송됩니다.
            </div>
          </div>
          {/* Full summary */}
          <SummaryBox branch={branchName} option={option} treatments={txNames} date={date} time={time} total={totalEvent > 0 ? `₩${totalEvent.toLocaleString()}` : "—"} />
        </div>
      ) : (
        <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 5 }}>
          {/* Visit type */}
          <div>
            <label style={labelStyle}>방문유형</label>
            <div style={{ display: "flex", gap: 4 }}>
              {(["초진", "재진"] as VisitType[]).map(vt => (
                <button
                  key={vt}
                  onClick={() => setVisitType(vt)}
                  style={{
                    flex: 1, padding: "3px 0", fontSize: 7, cursor: "pointer",
                    border: visitType === vt ? `1px solid ${T.gold}` : `1px solid ${T.border}`,
                    background: visitType === vt ? T.cardBgGold : "transparent",
                    color: visitType === vt ? T.gold : T.textSub, borderRadius: 4,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                  }}
                >
                  {vt === "초진" ? <Star size={7} color={visitType === vt ? T.gold : T.textSub} /> : <RotateCcw size={7} color={visitType === vt ? T.gold : T.textSub} />}
                  {vt}
                </button>
              ))}
            </div>
          </div>
          {/* Name */}
          <div>
            <label style={labelStyle}>성함</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" style={inputStyle} />
          </div>
          {/* Phone */}
          <div>
            <label style={labelStyle}>연락처</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" style={inputStyle} />
          </div>
          {/* Email */}
          <div>
            <label style={labelStyle}>이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" style={inputStyle} />
          </div>
          {/* Note */}
          <div>
            <label style={labelStyle}>요청사항</label>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="특이사항이나 요청사항을 입력해주세요"
              rows={2}
              style={{ ...inputStyle, resize: "none" as const, lineHeight: 1.5 }}
            />
          </div>

          {/* ── 예약 알림 받기 ────────────────────────── */}
          <div style={{
            border: `1px solid ${T.borderGold}`,
            borderRadius: 6,
            padding: "7px 9px",
            background: T.cardBgGold,
          }}>
            {/* Section title */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
              <Bell size={8} color={T.gold} />
              <span style={{ fontSize: 7.5, color: T.gold, fontWeight: 700 }}>
                예약 알림 받기
              </span>
              <span style={{ fontSize: 6, color: T.textMuted, marginLeft: 2 }}>(선택)</span>
            </div>
            {/* Checkboxes */}
            {([
              { label: "예약 1주일 전 알림",       checked: remWeek,      toggle: () => setRemWeek(p      => !p) },
              { label: "예약 3일 전 알림",          checked: remThreeDays, toggle: () => setRemThreeDays(p => !p) },
              { label: "예약 당일 오전 8:00 알림",  checked: remDayOf,     toggle: () => setRemDayOf(p     => !p) },
            ] as { label: string; checked: boolean; toggle: () => void }[]).map((item, i) => (
              <div
                key={i}
                onClick={item.toggle}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  marginBottom: i < 2 ? 5 : 0, cursor: "pointer",
                }}
              >
                {/* Custom checkbox */}
                <div style={{
                  width: 11, height: 11, borderRadius: 2, flexShrink: 0,
                  border: item.checked ? `2px solid ${T.gold}` : `1.5px solid ${T.textSub}`,
                  background: item.checked ? T.gold : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.12s",
                }}>
                  {item.checked && (
                    <span style={{
                      fontSize: 7, color: isDark ? DARK_BG : "#fff",
                      fontWeight: 900, lineHeight: 1,
                    }}>✓</span>
                  )}
                </div>
                <span style={{
                  fontSize: 7,
                  color: item.checked ? T.textPrimary : T.textSub,
                  transition: "color 0.12s",
                }}>{item.label}</span>
              </div>
            ))}
            {/* Footnote */}
            <div style={{
              fontSize: 6, color: T.textMuted, marginTop: 6, lineHeight: 1.5,
              borderTop: `1px solid ${T.borderGold}`, paddingTop: 5,
            }}>
              선택한 채널(카카오·이메일·SMS)로 자동 발송됩니다.
            </div>
          </div>

          {/* Full summary */}
          <SummaryBox
            branch={branchName} option={option} treatments={txNames}
            date={date} time={time} total={totalEvent > 0 ? `₩${totalEvent.toLocaleString()}` : "—"}
          />
        </div>
      )}
    </div>
  )
}

// ─── Step 6: Confirmation ─────────────────────────────────────────────────────

export function Step6Confirm({
  values, branchName, option, selectedTxIds, branchId, date, time, onReset,
}: {
  values: Record<string, FieldValue>
  branchName: string; option: TreatmentOption | ""; selectedTxIds: string[]
  branchId: string; date: string; time: string
  onReset: () => void
}) {
  const { isDark, isPage } = useTheme()
  const T = makeTokens(isDark)
  const { getTreatmentsByBranch } = useTreatment()
  const allTx = getTreatmentsByBranch(branchId)
  const selectedTxs = allTx.filter(t => selectedTxIds.includes(t.profile.id))
  const totalEvent  = selectedTxs.reduce((s, t) => s + (t.profile.priceEvent || t.profile.priceRegular || 0), 0)
  const txNames     = selectedTxs.map(t => t.profile.cardTitle || t.profile.name)
  const router = useRouter()
  const params = useParams<{ branchSlug: string }>()
  const branchSlug = params?.branchSlug ?? ""

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ padding: "12px 10px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
        {/* Check circle */}
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: `2px solid ${T.gold}`, background: T.cardBgGold,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CheckCircle2 size={18} color={T.gold} />
        </div>
        {isPage ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 4, height: 16, background: OD.brand, borderRadius: 9999 }} />
            <div style={{ fontSize: OD.fsHeader, fontWeight: OD.fwBold, color: OD.brand }}>예약 대기가 완료되었습니다.</div>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: T.textPrimary, fontWeight: 700, textAlign: "center" as const, lineHeight: 1.4 }}>
            예약 대기가<br />완료되었습니다.
          </div>
        )}
        {isPage ? (
          <div style={{ fontSize: OD.fsBase, color: OD.brand70, textAlign: "center" as const, lineHeight: 1.6, marginTop: 4 }}>
            {val(values, "bkDesc6")}
          </div>
        ) : (
          <div style={{ fontSize: 7.5, color: T.textMuted, textAlign: "center" as const, maxWidth: 160, lineHeight: 1.5 }}>
            {val(values, "bkDesc6")}
          </div>
        )}
      </div>
      {/* Summary card */}
      {isPage ? (
        <div style={{ width: "100%", background: OD.surface, border: `1px solid ${OD.brand10}`, borderRadius: OD.radiusXl, padding: OD.cardPadding, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 4, height: 16, background: OD.brand, borderRadius: 9999 }} />
            <div style={{ fontSize: OD.fsLg, fontWeight: OD.fwBold, color: OD.brand }}>예약 정보</div>
          </div>
          {[
            { label: "성함",     value: "홍길동" },
            { label: "연락처",   value: "010-0000-0000" },
            { label: "예약일시", value: date ? `${date} ${time}` : "—" },
            { label: "예약항목", value: txNames.length > 0 ? txNames.join(", ") : option || "—" },
            { label: "예상금액", value: totalEvent > 0 ? `₩${totalEvent.toLocaleString()}` : "—" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: OD.fsBase, color: OD.brand40 }}>{r.label}</span>
              <span style={{ fontSize: OD.fsBase, fontWeight: OD.fwMedium, color: OD.brand, maxWidth: "60%", textAlign: "right" as const }}>{r.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ width: "100%", padding: "0 10px" }}>
          <div style={{
            background: T.cardBgGold, border: `1px solid ${T.borderGold}`,
            borderRadius: 7, padding: "8px 10px",
          }}>
            <div style={{ fontSize: 7.5, color: T.gold, fontWeight: 700, marginBottom: 5 }}>예약 정보</div>
            {[
              { label: "성함",    value: "홍길동" },
              { label: "연락처",  value: "010-0000-0000" },
              { label: "예약일시", value: date ? `${date} ${time}` : "—" },
              { label: "예약항목", value: txNames.length > 0 ? txNames.join(", ") : option || "—" },
              { label: "예상금액", value: totalEvent > 0 ? `₩${totalEvent.toLocaleString()}` : "—" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 7, color: T.textMuted }}>{r.label}</span>
                <span style={{ fontSize: 7, color: T.textPrimary, maxWidth: 130, textAlign: "right" as const }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Action buttons */}
      {isPage ? (
        <div style={{ display: "flex", gap: 8, width: "100%", boxSizing: "border-box" as const }}>
          <button
            onClick={onReset}
            style={{
              flex: 1, height: 48, border: `1px solid ${OD.brand20}`,
              background: "transparent", borderRadius: OD.radiusMd, fontSize: OD.fsBase,
              color: OD.brand70, cursor: "pointer",
            }}
          >홈으로</button>
          <button
            onClick={() => {
              router.push(`/preview/site/${branchSlug}/booking?restore=1`)
            }}
            style={{
              flex: 1, height: 48, border: `1px solid ${OD.brand10}`,
              background: "transparent", borderRadius: OD.radiusMd, fontSize: OD.fsBase,
              color: OD.brand40, cursor: "pointer",
            }}
          >예약 변경</button>
        </div>
      ) : (
        <div style={{ padding: "10px 10px 0", display: "flex", gap: 5, width: "100%", boxSizing: "border-box" as const }}>
          <button
            onClick={onReset}
            style={{
              flex: 1, height: 26, border: `1px solid ${T.borderGold}`,
              background: "transparent", borderRadius: 4, fontSize: 7.5,
              color: T.textSub, cursor: "pointer",
            }}
          >홈으로</button>
          <button
            style={{
              flex: 1, height: 26, border: `1px solid ${T.border}`,
              background: "transparent", borderRadius: 4, fontSize: 7.5,
              color: T.textMuted, cursor: "pointer",
            }}
          >예약 변경</button>
        </div>
      )}
    </div>
  )
}

// ─── Phone preview (main interactive preview) ─────────────────────────────────

function BookingPhoneScreen({
  values, branchId, branches, onNavigate, mode = "phone", forceNarrow,
}: {
  values: Record<string, FieldValue>
  branchId: string
  branches: BranchInfo[]
  onNavigate?: (page: PageId) => void
  mode?: "phone" | "page"
  forceNarrow?: boolean
}) {
  const router = useRouter()
  const params = useParams<{ branchSlug: string }>()
  const branchSlug = params?.branchSlug ?? ""
  const isDark = val<string>(values, "bkBgTheme") !== "light"
  const bgStyle = isDark
    ? { background: "linear-gradient(135deg, rgba(201,168,92,0.12) 0%, #0e0c09 50%, rgba(201,168,92,0.08) 100%)" }
    : { background: "#ffffff" }

  // Core state
  const [step, setStep]               = useState(1)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [selBranchId, setSelBranchId] = useState(branchId)
  const [selOption, setSelOption]     = useState<TreatmentOption | "">("")
  const [selTxIds, setSelTxIds]       = useState<string[]>([])
  const [selDate, setSelDate]         = useState("")
  const [selTime, setSelTime]         = useState("")

  const searchParams = useSearchParams()
  React.useEffect(() => {
    if (searchParams?.get("restore") !== "1") return
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(`tatoa_booking_draft_${branchId}`)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== "object") return
      if (typeof parsed.branchId === "string") setSelBranchId(parsed.branchId)
      if (typeof parsed.option === "string") setSelOption(parsed.option as TreatmentOption | "")
      if (Array.isArray(parsed.selectedTxIds)) setSelTxIds(parsed.selectedTxIds)
      if (typeof parsed.date === "string") setSelDate(parsed.date)
      if (typeof parsed.time === "string") setSelTime(parsed.time)
    } catch {
      // 손상된 JSON 무시
    }
  }, [searchParams, branchId])

  const selBranch     = branches.find(b => b.id === selBranchId) || branches.find(b => b.id === branchId)
  const selBranchName = selBranch?.name || ""

  const toggleTx = useCallback((id: string) => {
    setSelTxIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }, [])

  function handleNext() {
    if (step === 2 && selOption === "원장 상담만") { setStep(4); return }
    if (step < 6) setStep(s => s + 1)
  }

  function handlePrev() {
    if (step === 4 && selOption === "원장 상담만") { setStep(2); return }
    if (step > 1) setStep(s => s - 1)
  }

  function handleReset() {
    setStep(1); setSelOption(""); setSelTxIds([]); setSelDate(""); setSelTime("")
  }

  const T = makeTokens(isDark)

  const isPage = mode === "page"

  const step2Ref = useRef<HTMLDivElement | null>(null)
  const step3Ref = useRef<HTMLDivElement | null>(null)
  const step4Ref = useRef<HTMLDivElement | null>(null)
  const step5Ref = useRef<HTMLDivElement | null>(null)

  const scrollToStep = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => { ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }) }, 100)
  }

  function handleBranchSelect(id: string) {
    setSelBranchId(id)
    if (isPage) scrollToStep(step2Ref)
  }

  function handleOptionSelect(opt: TreatmentOption) {
    setSelOption(opt)
    if (isPage) scrollToStep(opt === "원장 상담만" ? step4Ref : step3Ref)
  }

  function handleTimeSelect(time: string) {
    setSelTime(time)
    if (isPage) scrollToStep(step5Ref)
  }

  const [isNarrowAuto, setIsNarrowAuto] = useState(false)
  const isNarrow = forceNarrow === true ? true : isNarrowAuto
  React.useEffect(() => {
    if (!isPage) return
    if (forceNarrow === true) return
    const check = () => setIsNarrowAuto(window.innerWidth < 540)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [isPage, forceNarrow])

  const outerStyle: React.CSSProperties = isPage
    ? {
        width: "100%",
        maxWidth: 540,
        margin: "0 auto",
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        paddingLeft: isNarrow ? "6%" : 0,
        paddingRight: isNarrow ? "3%" : 0,
        boxSizing: "border-box",
        ...bgStyle,
      }
    : {
        width: 220, minHeight: 420, maxHeight: 500,
        border: `1.5px solid ${T.borderGold}`,
        borderRadius: 0, overflow: "hidden",
        display: "flex", flexDirection: "column",
        position: "relative", fontSize: 10,
        ...bgStyle,
      }

  return (
    <ThemeCtx.Provider value={{ isDark, isPage, isNarrow }}>
      <div style={outerStyle}>
        {/* Nav + Page header */}
        {!isPage ? (
          <>
            <PhoneNav onMenuOpen={() => setMenuOpen(true)} />
            <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={onNavigate} />
            <PageHeader values={values} />
          </>
        ) : (
          <PageHeader values={values} />
        )}

        {/* 구분선 */}
        <div style={{ height: 1, background: T.divider, margin: "0 12px" }} />

        {/* Step bar */}
        <StepBar current={step} />
        <div style={{ height: 1, background: T.divider }} />

        {/* Step content */}
        {isPage ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ paddingTop: 32, paddingBottom: 32 }}>
              <Step1Branch
                values={values} selectedBranchId={selBranchId}
                onSelect={handleBranchSelect} branchId={branchId} branches={branches}
              />
            </div>
            <div style={{ borderTop: `1px solid ${T.divider}` }} />
            <div ref={step2Ref} style={{ paddingTop: 32, paddingBottom: 32 }}>
              <Step2Option
                values={values} selectedBranchName={selBranchName}
                selectedOption={selOption} onSelect={handleOptionSelect}
              />
            </div>
            {selOption !== "원장 상담만" && (
              <>
                <div style={{ borderTop: `1px solid ${T.divider}` }} />
                <div ref={step3Ref} style={{ paddingTop: 32, paddingBottom: 32 }}>
                  <Step3Treatments
                    values={values} selectedBranchName={selBranchName}
                    branchId={selBranchId} selectedTxIds={selTxIds} onToggle={toggleTx}
                  />
                </div>
              </>
            )}
            <div style={{ borderTop: `1px solid ${T.divider}` }} />
            <div ref={step4Ref} style={{ paddingTop: 32, paddingBottom: 32 }}>
              <Step4DateTime
                values={values} option={selOption} selectedTxIds={selTxIds}
                branchId={selBranchId} selectedDate={selDate} onDateSelect={setSelDate}
                selectedTime={selTime} onTimeSelect={handleTimeSelect}
              />
            </div>
            <div style={{ borderTop: `1px solid ${T.divider}` }} />
            <div ref={step5Ref} style={{ paddingTop: 32, paddingBottom: 32 }}>
              <Step5Info
                values={values} branchName={selBranchName} option={selOption}
                selectedTxIds={selTxIds} branchId={selBranchId} date={selDate} time={selTime}
              />
            </div>
            <div style={{ borderTop: `1px solid ${T.divider}` }} />
            <div style={{ paddingTop: 32, paddingBottom: 32, paddingLeft: 20, paddingRight: 20 }}>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    try {
                      window.localStorage.setItem(
                        `tatoa_booking_draft_${selBranchId}`,
                        JSON.stringify({
                          branchId: selBranchId,
                          selectedTxIds: selTxIds,
                          option: selOption,
                          date: selDate,
                          time: selTime,
                          createdAt: Date.now(),
                        })
                      )
                    } catch {
                      // localStorage 차단/할당 실패 시에도 라우팅은 진행
                    }
                  }
                  router.push(`/preview/site/${branchSlug}/booking/complete`)
                }}
                style={{
                  width: "100%",
                  height: 48,
                  border: `1px solid ${OD.brand}`,
                  background: "transparent",
                  borderRadius: OD.radiusMd,
                  fontSize: OD.fsBase,
                  color: OD.brand,
                  fontWeight: OD.fwBold,
                  cursor: "pointer",
                }}
              >예약 완료</button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {step === 1 && (
              <Step1Branch
                values={values} selectedBranchId={selBranchId}
                onSelect={setSelBranchId} branchId={branchId} branches={branches}
              />
            )}
            {step === 2 && (
              <Step2Option
                values={values} selectedBranchName={selBranchName}
                selectedOption={selOption} onSelect={setSelOption}
              />
            )}
            {step === 3 && (
              <Step3Treatments
                values={values} selectedBranchName={selBranchName}
                branchId={selBranchId} selectedTxIds={selTxIds} onToggle={toggleTx}
              />
            )}
            {step === 4 && (
              <Step4DateTime
                values={values} option={selOption} selectedTxIds={selTxIds}
                branchId={selBranchId} selectedDate={selDate} onDateSelect={setSelDate}
                selectedTime={selTime} onTimeSelect={setSelTime}
              />
            )}
            {step === 5 && (
              <Step5Info
                values={values} branchName={selBranchName} option={selOption}
                selectedTxIds={selTxIds} branchId={selBranchId} date={selDate} time={selTime}
              />
            )}
            {step === 6 && (
              <Step6Confirm
                values={values} branchName={selBranchName} option={selOption}
                selectedTxIds={selTxIds} branchId={selBranchId} date={selDate} time={selTime}
                onReset={handleReset}
              />
            )}
          </div>
        )}

        {/* Nav buttons (phone mode only) */}
        {!isPage && step < 6 && (
          <NavButtons
            step={step} onPrev={handlePrev} onNext={handleNext}
            prevDisabled={step === 1}
          />
        )}
      </div>
    </ThemeCtx.Provider>
  )
}

// ─────────────────────────────────────────────
// PreviewBooking — public export
// ─────────────────────────────────────────────

export function PreviewBooking({ values, branchId, branches, onNavigate, mode = "phone", forceNarrow }: PreviewBookingProps): React.JSX.Element {
  if (mode === "page") {
    return (
      <BookingPhoneScreen values={values} branchId={branchId} branches={branches} onNavigate={onNavigate} mode={mode} forceNarrow={forceNarrow} />
    )
  }

  return (
    <BookingPhoneScreen
      values={values}
      branchId={branchId}
      branches={branches}
      onNavigate={onNavigate}
      mode={mode}
      forceNarrow={forceNarrow}
    />
  )
}
