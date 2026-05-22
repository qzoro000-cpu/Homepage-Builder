"use client"

import { useState, useRef, useLayoutEffect } from "react"
import { ChevronRight, Maximize2, X, Smartphone, Monitor } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldValue = string | boolean | string[] | number
type PageId = "home" | "treatments" | "booking" | "directions" | "recruit" | "popup" | "cart"

type CartPageProps = {
  values: Record<string, FieldValue>
  onChange: (k: string, v: FieldValue) => void
  branchId: string
  onNavigate?: (page: PageId) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FONTS = [
  { key: "sans",    label: "고딕",   css: "system-ui, -apple-system, 'Apple SD Gothic Neo', sans-serif" },
  { key: "serif",   label: "명조",   css: "Georgia, 'Noto Serif KR', serif" },
  { key: "classic", label: "클래식", css: "'Playfair Display', Georgia, serif" },
  { key: "mono",    label: "모노",   css: "ui-monospace, 'Courier New', monospace" },
]

const WEIGHTS = [
  { key: "300", label: "Thin" },
  { key: "400", label: "Regular" },
  { key: "500", label: "Medium" },
  { key: "600", label: "SemiBold" },
  { key: "700", label: "Bold" },
]

const COLOR_PRESETS = [
  { key: "#ffffff",                  label: "흰색",   bg: "#ffffff",                  ring: true  },
  { key: "#f5f0e8",                  label: "크림",   bg: "#f5f0e8",                  ring: true  },
  { key: "#c9a85c",                  label: "골드",   bg: "#c9a85c",                  ring: false },
  { key: "#1a1a1a",                  label: "검정",   bg: "#1a1a1a",                  ring: false },
  { key: "rgba(255,255,255,0.65)",   label: "흰/65%", bg: "rgba(255,255,255,0.65)",   ring: true  },
]

function getFontCss(key: string) {
  return FONTS.find((f) => f.key === key)?.css ?? FONTS[0].css
}

const DEFAULT_VALUES: Record<string, FieldValue> = {
  // 배경 테마
  cartBgTheme:           "dark",
  // 헤드라인
  cartHeadline:          "장바구니",
  cartHeadlineFont:      "sans",
  cartHeadlineSizePx:    28,
  cartHeadlineWeight:    "700",
  cartHeadlineColor:     "#ffffff",
  cartHeadlineItalic:    false,
  // 부제목
  cartSubtitle:          "선택하신 시술을 확인하고 예약을 진행하세요.",
  cartSubtitleFont:      "sans",
  cartSubtitleSizePx:    13,
  cartSubtitleWeight:    "400",
  cartSubtitleColor:     "rgba(255,255,255,0.65)",
  cartSubtitleItalic:    false,
  // 버튼
  cartCtaLabel:          "예약 계속하기",
  cartAddMoreLabel:      "시술 더 추가하기",
  // 섹션 텍스트
  cartSummaryTitle:      "예상 결제 금액",
  cartTotalLabel:        "예상 합계",
  cartEmptyMsg:          "담긴 시술이 없습니다.",
  // 기타
  cartCardRadius:        20,
  cartAccentColor:       "#c9a85c",
  cartShowVat:           false,
  cartVatNote:           "표시 가격은 VAT 포함입니다.",
}

function val<T extends FieldValue>(values: Record<string, FieldValue>, key: string): T {
  return (values[key] ?? DEFAULT_VALUES[key]) as T
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EditorSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: "1px solid rgba(201,168,92,0.15)", borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
        style={{ background: "rgba(201,168,92,0.05)", border: "none", cursor: "pointer" }}
      >
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <ChevronRight
          size={12}
          className="text-muted-foreground transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && <div className="px-3 py-3 space-y-3">{children}</div>}
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {COLOR_PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          title={p.label}
          onClick={() => onChange(p.key)}
          className={cn(
            "h-5 w-5 rounded-full border transition-all",
            value === p.key ? "scale-125 ring-2 ring-primary ring-offset-1" : "hover:scale-110",
            p.ring ? "border-neutral-300" : "border-transparent"
          )}
          style={{ background: p.bg }}
        />
      ))}
      <div className="flex items-center gap-1">
        <input
          type="color"
          value={value.startsWith("#") ? value : "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="h-5 w-5 rounded cursor-pointer border border-border"
          title="직접 선택"
        />
        <span className="text-[10px] text-muted-foreground">직접</span>
      </div>
    </div>
  )
}

/** 글씨체·크기(숫자)·굵기·기울기·색상 전체 제어 */
function TextStyleControls({
  prefix,
  values,
  onChange,
}: {
  prefix: string
  values: Record<string, FieldValue>
  onChange: (k: string, v: FieldValue) => void
}) {
  const currentFont    = val<string>(values, `${prefix}Font`)
  const currentSizePx  = val<number>(values, `${prefix}SizePx`)
  const currentWeight  = val<string>(values, `${prefix}Weight`)
  const currentColor   = val<string>(values, `${prefix}Color`)
  const currentItalic  = val<boolean>(values, `${prefix}Italic`)

  return (
    <div className="space-y-2.5 rounded-xl bg-muted/40 p-3">
      {/* 글씨체 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-10 shrink-0">글씨체</span>
        <div className="flex gap-1 flex-wrap">
          {FONTS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onChange(`${prefix}Font`, f.key)}
              className={cn(
                "rounded-lg px-2 py-1 text-[10px] font-medium border transition-all",
                currentFont === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40"
              )}
              style={{ fontFamily: f.css }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 크기 — 숫자 직접 입력 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-10 shrink-0">크기</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(`${prefix}SizePx`, Math.max(8, currentSizePx - 1))}
            className="h-6 w-6 rounded border border-border bg-card text-muted-foreground text-xs hover:bg-muted flex items-center justify-center"
          >−</button>
          <input
            type="number"
            min={8}
            max={120}
            value={currentSizePx}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10)
              if (!isNaN(n) && n >= 8 && n <= 120) onChange(`${prefix}SizePx`, n)
            }}
            className="h-6 w-12 rounded border border-border bg-card text-center text-[11px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => onChange(`${prefix}SizePx`, Math.min(120, currentSizePx + 1))}
            className="h-6 w-6 rounded border border-border bg-card text-muted-foreground text-xs hover:bg-muted flex items-center justify-center"
          >+</button>
          <span className="text-[10px] text-muted-foreground">px</span>
        </div>
      </div>

      {/* 굵기 + 기울기 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-10 shrink-0">굵기</span>
        <div className="flex gap-1 flex-wrap">
          {WEIGHTS.map((w) => (
            <button
              key={w.key}
              type="button"
              onClick={() => onChange(`${prefix}Weight`, w.key)}
              className={cn(
                "rounded-lg px-2 py-1 text-[10px] border transition-all",
                currentWeight === w.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40"
              )}
              style={{ fontWeight: Number(w.key) }}
            >
              {w.label}
            </button>
          ))}
          {/* 기울기 토글 */}
          <button
            type="button"
            onClick={() => onChange(`${prefix}Italic`, !currentItalic)}
            title="기울기 (Italic)"
            className={cn(
              "rounded-lg px-2.5 py-1 text-[10px] border transition-all italic font-semibold",
              currentItalic
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            I
          </button>
        </div>
      </div>

      {/* 색상 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-10 shrink-0">색상</span>
        <ColorPicker value={currentColor} onChange={(v) => onChange(`${prefix}Color`, v)} />
      </div>
    </div>
  )
}

// ─── CartEditor (left panel) ──────────────────────────────────────────────────

function CartEditor({
  values,
  onChange,
}: {
  values: Record<string, FieldValue>
  onChange: (k: string, v: FieldValue) => void
}) {
  const isDark      = val<string>(values, "cartBgTheme") !== "light"
  const accentColor = val<string>(values, "cartAccentColor")
  const cardRadius  = val<number>(values, "cartCardRadius")
  const showVat     = val<boolean>(values, "cartShowVat")

  return (
    <div className="space-y-1">

      {/* ── 배경 테마 ── */}
      <EditorSection title="배경 테마" defaultOpen>
        <div className="flex items-center gap-3">
          {/* 미니 그라데이션 프리뷰 */}
          <div
            className="h-8 w-12 rounded-md shrink-0 border border-border"
            style={{
              background: isDark
                ? "linear-gradient(135deg,rgba(201,168,92,0.2) 0%,#0e0c09 100%)"
                : "linear-gradient(135deg,rgba(180,180,180,0.2) 0%,#ffffff 100%)",
            }}
          />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">배경 테마</p>
            <p className="text-[10px] text-muted-foreground">
              {isDark ? "블랙 · 골드 앰비언트 글로우" : "화이트 · 그레이 앰비언트 글로우"}
            </p>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-medium">
            <button
              type="button"
              onClick={() => onChange("cartBgTheme", "dark")}
              className={cn(
                "px-3 py-1.5 transition-colors",
                isDark ? "bg-neutral-900 text-white" : "text-muted-foreground hover:bg-muted"
              )}
            >블랙</button>
            <button
              type="button"
              onClick={() => onChange("cartBgTheme", "light")}
              className={cn(
                "px-3 py-1.5 border-l border-border transition-colors",
                !isDark ? "bg-white text-neutral-900" : "text-muted-foreground hover:bg-muted"
              )}
            >화이트</button>
          </div>
        </div>

        {/* 포인트 색상 */}
        <div className="space-y-1.5">
          <Label className="text-xs">포인트 색상 (버튼, 강조)</Label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {["#c9a85c", "#b8923e", "#a67c52", "#2d2318", "#6b4c3b", "#1a1a1a"].map((c) => (
              <button
                key={c}
                onClick={() => onChange("cartAccentColor", c)}
                title={c}
                className="h-5 w-5 rounded-full border transition-all hover:scale-110"
                style={{
                  background: c,
                  border: accentColor === c ? "2px solid #c9a85c" : "1.5px solid rgba(0,0,0,0.15)",
                  boxShadow: accentColor === c ? "0 0 0 2px rgba(201,168,92,0.3)" : "none",
                }}
              />
            ))}
            <input
              type="color"
              value={accentColor.startsWith("#") ? accentColor : "#c9a85c"}
              onChange={(e) => onChange("cartAccentColor", e.target.value)}
              className="h-5 w-5 rounded-full border border-border cursor-pointer"
              title="직접 선택"
            />
          </div>
        </div>
      </EditorSection>

      {/* ── 헤드라인 ── */}
      <EditorSection title="헤드라인" defaultOpen>
        <div className="space-y-2">
          <Label className="text-xs">텍스트 내용</Label>
          <Input
            value={val<string>(values, "cartHeadline")}
            onChange={(e) => onChange("cartHeadline", e.target.value)}
            className="h-8 text-sm"
            placeholder="장바구니"
          />
          <TextStyleControls prefix="cartHeadline" values={values} onChange={onChange} />
        </div>
      </EditorSection>

      {/* ── 부제목 ── */}
      <EditorSection title="부제목" defaultOpen>
        <div className="space-y-2">
          <Label className="text-xs">텍스트 내용</Label>
          <Input
            value={val<string>(values, "cartSubtitle")}
            onChange={(e) => onChange("cartSubtitle", e.target.value)}
            className="h-8 text-sm"
            placeholder="선택하신 시술을 확인하고 예약을 진행하세요."
          />
          <TextStyleControls prefix="cartSubtitle" values={values} onChange={onChange} />
        </div>
      </EditorSection>

      {/* ── 버튼 텍스트 ── */}
      <EditorSection title="버튼 텍스트">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">예약 계속하기 버튼</Label>
            <Input
              value={val<string>(values, "cartCtaLabel")}
              onChange={(e) => onChange("cartCtaLabel", e.target.value)}
              className="h-7 text-xs"
              placeholder="예약 계속하기"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">시술 추가 버튼</Label>
            <Input
              value={val<string>(values, "cartAddMoreLabel")}
              onChange={(e) => onChange("cartAddMoreLabel", e.target.value)}
              className="h-7 text-xs"
              placeholder="시술 더 추가하기"
            />
          </div>
        </div>
      </EditorSection>

      {/* ── 섹션 텍스트 ── */}
      <EditorSection title="섹션 텍스트">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">결제 요약 제목</Label>
            <Input
              value={val<string>(values, "cartSummaryTitle")}
              onChange={(e) => onChange("cartSummaryTitle", e.target.value)}
              className="h-7 text-xs"
              placeholder="예상 결제 금액"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">합계 레이블</Label>
            <Input
              value={val<string>(values, "cartTotalLabel")}
              onChange={(e) => onChange("cartTotalLabel", e.target.value)}
              className="h-7 text-xs"
              placeholder="예상 합계"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">빈 장바구니 메시지</Label>
            <Input
              value={val<string>(values, "cartEmptyMsg")}
              onChange={(e) => onChange("cartEmptyMsg", e.target.value)}
              className="h-7 text-xs"
              placeholder="담긴 시술이 없습니다."
            />
          </div>
        </div>
      </EditorSection>

      {/* ── 카드 스타일 ── */}
      <EditorSection title="카드 스타일">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">카드 모서리 둥글기 ({cardRadius}px)</Label>
          </div>
          <input
            type="range"
            min={0}
            max={32}
            step={2}
            value={cardRadius}
            onChange={(e) => onChange("cartCardRadius", Number(e.target.value))}
            className="w-full accent-yellow-600"
          />
        </div>
      </EditorSection>

      {/* ── 가격 표시 ── */}
      <EditorSection title="가격 표시">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">VAT 안내 문구 표시</Label>
            <Switch
              checked={showVat}
              onCheckedChange={(v) => onChange("cartShowVat", v)}
            />
          </div>
          {showVat && (
            <Input
              value={val<string>(values, "cartVatNote")}
              onChange={(e) => onChange("cartVatNote", e.target.value)}
              className="h-7 text-xs"
              placeholder="표시 가격은 VAT 포함입니다."
            />
          )}
        </div>
      </EditorSection>

    </div>
  )
}

// ─── CartPhoneScreen (right preview) ─────────────────────────────────────────

const MOCK_ITEMS = [
  { id: "1", name: "사각턱 보톡스",  tag: "Event", category: "보톡스", description: "자연스러운 V라인으로 가...", price: "₩150,000", originalPrice: "₩200,000", priceNum: 150000, originalPriceNum: 200000 },
  { id: "2", name: "IPL 광치료",     tag: "Event", category: "레이저", description: "다양한 파장의 빛으로 종...", price: "₩120,000", originalPrice: "₩150,000", priceNum: 120000, originalPriceNum: 150000 },
]

function CartPhoneScreen({ values }: { values: Record<string, FieldValue> }) {
  const isDark      = val<string>(values, "cartBgTheme") !== "light"
  const accentColor = val<string>(values, "cartAccentColor")
  const cardRadius  = val<number>(values, "cartCardRadius")
  const showVat     = val<boolean>(values, "cartShowVat")
  const vatNote     = val<string>(values, "cartVatNote")

  const bgStyle = isDark
    ? { background: "linear-gradient(135deg,rgba(201,168,92,0.12) 0%,#0e0c09 60%,rgba(201,168,92,0.08) 100%)" }
    : { background: "linear-gradient(135deg,rgba(180,180,180,0.15) 0%,#ffffff 60%,rgba(180,180,180,0.10) 100%)" }

  const fg        = isDark ? "#ffffff"                  : "#1a1a1a"
  const fgSub     = isDark ? "rgba(255,255,255,0.55)"  : "#888"
  const cardBg    = isDark ? "rgba(255,255,255,0.05)"  : "#ffffff"
  const cardBdr   = isDark ? "rgba(255,255,255,0.10)"  : "rgba(0,0,0,0.07)"
  const dividerC  = isDark ? "rgba(255,255,255,0.08)"  : "#eee"

  // 헤드라인 스타일
  const hlFont    = getFontCss(val<string>(values, "cartHeadlineFont"))
  const hlSize    = val<number>(values, "cartHeadlineSizePx")
  const hlWeight  = val<string>(values, "cartHeadlineWeight")
  const hlColor   = val<string>(values, "cartHeadlineColor")
  const hlItalic  = val<boolean>(values, "cartHeadlineItalic")

  // 부제목 스타일
  const subFont   = getFontCss(val<string>(values, "cartSubtitleFont"))
  const subSize   = val<number>(values, "cartSubtitleSizePx")
  const subWeight = val<string>(values, "cartSubtitleWeight")
  const subColor  = val<string>(values, "cartSubtitleColor")
  const subItalic = val<boolean>(values, "cartSubtitleItalic")

  const headline     = val<string>(values, "cartHeadline")
  const subtitle     = val<string>(values, "cartSubtitle")
  const ctaLabel     = val<string>(values, "cartCtaLabel")
  const addMoreLabel = val<string>(values, "cartAddMoreLabel")
  const summaryTitle = val<string>(values, "cartSummaryTitle")
  const totalLabel   = val<string>(values, "cartTotalLabel")

  const total         = MOCK_ITEMS.reduce((s, i) => s + i.priceNum, 0)
  const originalTotal = MOCK_ITEMS.reduce((s, i) => s + i.originalPriceNum, 0)

  // 미리보기에서는 크기를 0.36배로 축소하여 표시
  const scale = 0.36

  return (
    <div
      style={{
        width: 220,
        maxHeight: 500,
        overflowY: "auto",
        borderRadius: 0,
        border: `1.5px solid ${accentColor}44`,
        fontSize: 10,
        scrollbarWidth: "none",
        ...bgStyle,
      }}
    >
      {/* 헤드라인 영역 */}
      <div style={{ textAlign: "center", paddingTop: 20, paddingBottom: 12 }}>
        <h2
          style={{
            fontFamily:  hlFont,
            fontSize:    hlSize * scale,
            fontWeight:  Number(hlWeight),
            color:       hlColor,
            fontStyle:   hlItalic ? "italic" : "normal",
            margin:      0,
            letterSpacing: "-0.02em",
          }}
        >
          {headline}
        </h2>
        <p
          style={{
            marginTop:  6,
            fontFamily:  subFont,
            fontSize:    subSize * scale,
            fontWeight:  Number(subWeight),
            color:       subColor,
            fontStyle:   subItalic ? "italic" : "normal",
            padding:     "0 12px",
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* 아이템 수 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 12px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2.2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <span style={{ fontSize: 7.5, fontWeight: 600, color: fg }}>담긴 시술</span>
          <span style={{ background: fg, color: isDark ? "#0e0c09" : "#fff", borderRadius: 9999, padding: "0 4px", fontSize: 6, fontWeight: 700 }}>
            {MOCK_ITEMS.length}건
          </span>
        </div>
        <span style={{ fontSize: 7, color: fgSub }}>전체 삭제</span>
      </div>

      {/* 아이템 카드 목록 */}
      <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {MOCK_ITEMS.map((item) => (
          <div
            key={item.id}
            style={{
              background:   cardBg,
              borderRadius: cardRadius * 0.55,
              padding:      9,
              display:      "flex",
              gap:          8,
              border:       `1px solid ${cardBdr}`,
            }}
          >
            {/* 썸네일 */}
            <div style={{ width: 36, height: 36, borderRadius: cardRadius * 0.36, background: isDark ? "rgba(201,168,92,0.14)" : "#f0ece6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 1 }}>
                <span style={{ fontSize: 7.5, fontWeight: 700, color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                {item.tag && <span style={{ background: "#f05040", color: "#fff", borderRadius: 9999, padding: "0 3px", fontSize: 5.5, fontWeight: 700, flexShrink: 0 }}>{item.tag}</span>}
              </div>
              <p style={{ fontSize: 6.5, color: fgSub, marginBottom: 1 }}>{item.category}</p>
              <p style={{ fontSize: 6.5, color: fgSub, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: fg }}>{item.price}</span>
                <span style={{ fontSize: 6.5, color: fgSub, textDecoration: "line-through" }}>{item.originalPrice}</span>
              </div>
            </div>
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1px solid ${cardBdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-start", marginTop: 1 }}>
              <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke={fgSub} strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* 결제 요약 */}
      <div style={{ margin: "10px 10px 6px", background: cardBg, borderRadius: cardRadius * 0.55, padding: "10px 12px", border: `1px solid ${cardBdr}` }}>
        <p style={{ fontSize: 7.5, fontWeight: 700, color: fg, marginBottom: 7 }}>{summaryTitle}</p>
        {MOCK_ITEMS.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 7, color: fgSub }}>{item.name}</span>
            <span style={{ fontSize: 7, color: fg, fontWeight: 500 }}>{item.price}</span>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${dividerC}`, margin: "6px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 7.5, fontWeight: 700, color: fg }}>{totalLabel}</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 7, color: fgSub, textDecoration: "line-through" }}>₩{originalTotal.toLocaleString()}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: fg, letterSpacing: "-0.02em" }}>₩{total.toLocaleString()}</span>
          </div>
        </div>
        {showVat && <p style={{ fontSize: 6, color: fgSub, marginTop: 4 }}>{vatNote}</p>}
      </div>

      {/* 하단 버튼 */}
      <div style={{ padding: "0 10px 16px", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 26, borderRadius: cardRadius * 0.5, border: `1px solid ${cardBdr}`, background: cardBg }}>
          <span style={{ fontSize: 7.5, color: fg, fontWeight: 500 }}>+ {addMoreLabel}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 30, borderRadius: cardRadius * 0.5, background: accentColor }}>
          <span style={{ fontSize: 8, color: "#fff", fontWeight: 700 }}>{ctaLabel} →</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function CartPageEditor({ values, onChange, branchId, onNavigate }: CartPageProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile")

  const DESKTOP_VIRTUAL_W = 900
  const desktopColRef = useRef<HTMLDivElement>(null)
  const [desktopScale, setDesktopScale] = useState(() =>
    typeof window !== "undefined" ? Math.min(window.innerWidth * 0.38, 580) / DESKTOP_VIRTUAL_W : 400 / DESKTOP_VIRTUAL_W
  )
  useLayoutEffect(() => {
    const el = desktopColRef.current
    if (!el) return
    const update = () => { const w = el.getBoundingClientRect().width; if (w > 0) setDesktopScale(w / DESKTOP_VIRTUAL_W) }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      className="grid gap-5 transition-[grid-template-columns] duration-300"
      style={{ gridTemplateColumns: device === "desktop" ? "1fr clamp(360px, 38vw, 580px)" : "1fr 260px" }}
    >
      {/* Left: Editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">장바구니 페이지 설정</CardTitle>
          <CardDescription className="text-xs">
            배경 테마, 헤드라인·부제목 텍스트 스타일, 버튼 텍스트를 편집합니다.
            우측 미리보기에서 변경 사항을 실시간으로 확인하세요.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <CartEditor values={values} onChange={onChange} />
        </CardContent>
      </Card>

      {/* Right: Preview */}
      <div className={cn("sticky top-20 space-y-3 self-start", device === "desktop" && "w-full")}>
        {/* Controls */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">미리보기</p>
          <div className="flex items-center gap-1.5">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setDevice("mobile")} className={cn("p-1.5 transition-colors", device === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Smartphone className="h-3 w-3" /></button>
              <button onClick={() => setDevice("desktop")} className={cn("p-1.5 transition-colors", device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Monitor className="h-3 w-3" /></button>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFullscreen(f => !f)} title="전체화면">
              <Maximize2 size={12} />
            </Button>
          </div>
        </div>

        {/* Mobile phone frame */}
        {device === "mobile" && (
          <div className="flex justify-center">
            <div className="w-[210px]">
              <div className="rounded-[30px] border-[6px] border-neutral-800 bg-neutral-800 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-center bg-neutral-800 py-1.5">
                  <div className="h-1.5 w-12 rounded-full bg-neutral-900" />
                </div>
                <div className="bg-black relative overflow-hidden" style={{ height: 429 }}>
                  <div className="overflow-y-auto h-full" style={{ scrollbarWidth: "none" }}>
                    <CartPhoneScreen values={values} />
                  </div>
                </div>
                <div className="flex justify-center bg-neutral-800 py-1.5">
                  <div className="h-1 w-8 rounded-full bg-neutral-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop browser frame */}
        {device === "desktop" && (
          <div className="rounded-xl border-2 border-foreground/20 bg-neutral-900 shadow-lg overflow-hidden w-full">
            <div className="flex items-center gap-2 border-b border-neutral-700 bg-neutral-800 px-3 py-2">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500/70" /><div className="h-2 w-2 rounded-full bg-yellow-500/70" /><div className="h-2 w-2 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 rounded bg-neutral-700 border border-neutral-600 px-2 py-1">
                <span className="text-[9px] text-neutral-400">tatoa.kr/cart</span>
              </div>
              <span className="text-[9px] text-neutral-500 tabular-nums shrink-0">{DESKTOP_VIRTUAL_W}px · {Math.round(desktopScale * 100)}%</span>
            </div>
            <div ref={desktopColRef} className="relative overflow-hidden" style={{ paddingBottom: `${(9/16)*100}%` }}>
              <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-neutral-950">
                <div style={{ transform: `scale(${desktopScale.toFixed(4)})`, transformOrigin: "center center" }}>
                  <CartPhoneScreen values={values} />
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-[9px] text-muted-foreground text-center">
          실제 장바구니: <a href="/preview/cart" target="_blank" className="underline">미리보기 열기 →</a>
        </p>
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setFullscreen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ transform: "scale(1.8)", transformOrigin: "center" }}>
            <CartPhoneScreen values={values} />
          </div>
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 text-white opacity-70 hover:opacity-100" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  )
}
