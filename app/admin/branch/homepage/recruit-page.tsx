"use client"

import { useState, useRef, useLayoutEffect } from "react"
import { ChevronRight, Maximize2, X, Smartphone, Monitor } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { branches } from "@/lib/mock-data"
import type { SiteSnapshot } from "@/lib/branch-website-store"
import { SiteNav } from "@/components/site/SiteNav"
import type { FieldValue, PageId } from "@/components/site/sections/booking-preview"
import { FONTS } from "@/components/site/sections/booking-preview"
import { PreviewRecruit, getRecruitIcon } from "@/components/site/sections/recruit-preview"

// ─── Types ────────────────────────────────────────────────────────────────────

type RecruitPageProps = {
  values: Record<string, FieldValue>
  onChange: (k: string, v: FieldValue) => void
  branchId: string
  onNavigate?: (page: PageId) => void
  snapshot?: SiteSnapshot
  branchSlug?: string
}

// ─── Editor helpers ───────────────────────────────────────────────────────────

type EditorSectionProps = { title: string; children: React.ReactNode; defaultOpen?: boolean }

function EditorSection({ title, children, defaultOpen = false }: EditorSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: "1px solid rgba(201,168,92,0.15)", borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
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

type RcSize = "xs" | "s" | "m" | "l" | "xl"
const RC_SIZE_KEYS: RcSize[] = ["xs", "s", "m", "l", "xl"]
const RC_SIZE_LABELS: Record<RcSize, string> = { xs: "XS", s: "S", m: "M", l: "L", xl: "XL" }

function RcSizePills({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {RC_SIZE_KEYS.map((k) => (
        <button key={k} type="button" onClick={() => onChange(k)}
          className={cn("px-2 py-0.5 rounded-full border text-[10px] transition-all",
            value === k
              ? "border-primary bg-primary/10 font-semibold"
              : "border-border bg-background hover:border-muted-foreground/40"
          )}
        >{RC_SIZE_LABELS[k]}</button>
      ))}
    </div>
  )
}

const RC_WEIGHTS = [
  { key: "300", label: "Thin" },
  { key: "400", label: "Regular" },
  { key: "500", label: "Medium" },
  { key: "600", label: "SemiBold" },
  { key: "700", label: "Bold" },
]

function RcWeightPills({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {RC_WEIGHTS.map((w) => (
        <button key={w.key} type="button" onClick={() => onChange(w.key)}
          className={cn("px-2 py-0.5 rounded-full border text-[10px] transition-all",
            value === w.key
              ? "border-primary bg-primary/10 font-semibold"
              : "border-border bg-background hover:border-muted-foreground/40"
          )}
        >{w.label}</button>
      ))}
    </div>
  )
}

function RcFontPills({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {FONTS.map((f) => (
        <button key={f.key} type="button" onClick={() => onChange(f.key)}
          className={cn("px-2 py-0.5 rounded-full border text-[10px] transition-all",
            value === f.key
              ? "border-primary bg-primary/10 font-semibold"
              : "border-border bg-background hover:border-muted-foreground/40"
          )}
        >{f.label}</button>
      ))}
    </div>
  )
}

function RcColorRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const safeHex = value.startsWith("#") ? value : "#ffffff"
  return (
    <div className="flex items-center gap-1.5">
      <input type="color" value={safeHex} onChange={(e) => onChange(e.target.value)}
        className="h-7 w-8 rounded cursor-pointer border border-border shrink-0" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1 h-7 px-2 text-[11px] font-mono border border-border rounded bg-background text-foreground" />
    </div>
  )
}

function RcImageInput({ value, onChange, placeholder = "이미지 URL 또는 base64" }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background text-foreground" />
      {value && (
        <div style={{ width: "100%", aspectRatio: "3/2", backgroundImage: `url(${value})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#f3f3f3", borderRadius: 4, border: "1px solid rgba(0,0,0,0.08)" }} />
      )}
    </div>
  )
}

function RcRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

const RECRUIT_ICON_NAMES: string[] = [
  "Shield", "Calendar", "Sparkles", "Gift", "Cake",
  "Utensils", "Shirt", "GraduationCap", "Users", "Heart",
  "Award", "Clock", "Coffee", "BookOpen", "DollarSign",
  "Smile", "Plane", "MapPin", "Briefcase", "Star",
]

function RcIconGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
      {RECRUIT_ICON_NAMES.map((name) => {
        const Icon = getRecruitIcon(name)
        const isActive = value === name
        return (
          <button key={name} type="button" onClick={() => onChange(name)} title={name}
            style={{
              aspectRatio: "1 / 1",
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: isActive ? "rgba(201,168,92,0.15)" : "#ffffff",
              border: "1px solid " + (isActive ? "#c9a85c" : "#e5e5e5"),
              borderRadius: 4, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <Icon size={18} color={isActive ? "#c9a85c" : "#666666"} strokeWidth={1.5} />
          </button>
        )
      })}
    </div>
  )
}

// ─── RecruitEditor ────────────────────────────────────────────────────────────

function RecruitEditor({
  values,
  onChange,
}: {
  values: Record<string, FieldValue>
  onChange: (key: string, value: FieldValue) => void
}) {
  const s = (k: string, fallback = "") => {
    const v = values[k]
    return typeof v === "string" ? v : fallback
  }
  const n = (k: string, fallback = 0) => {
    const v = values[k]
    return typeof v === "number" ? v : fallback
  }

  const bgType = s("rcHeaderBgType", "color")

  return (
    <div className="space-y-1">

      {/* Section 1: 헤더 */}
      <EditorSection title="1. 헤더" defaultOpen>
        <RcRow label="Eyebrow 텍스트">
          <input type="text" value={s("rcEyebrow")} onChange={e => onChange("rcEyebrow", e.target.value)}
            placeholder="TATOA CLINIC"
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="Eyebrow 사이즈">
          <RcSizePills value={s("rcEyebrowSize", "xs")} onChange={v => onChange("rcEyebrowSize", v)} />
        </RcRow>
        <RcRow label="Eyebrow 폰트">
          <RcFontPills value={s("rcEyebrowFont", "sans")} onChange={v => onChange("rcEyebrowFont", v)} />
        </RcRow>
        <RcRow label="Eyebrow 굵기">
          <RcWeightPills value={s("rcEyebrowWeight", "500")} onChange={v => onChange("rcEyebrowWeight", v)} />
        </RcRow>
        <RcRow label="Eyebrow 색상">
          <RcColorRow value={s("rcEyebrowColor", "#c9a85c")} onChange={v => onChange("rcEyebrowColor", v)} />
        </RcRow>

        <RcRow label="Title 텍스트">
          <input type="text" value={s("rcTitle")} onChange={e => onChange("rcTitle", e.target.value)}
            placeholder="상시 채용"
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="Title 사이즈">
          <RcSizePills value={s("rcTitleSize", "lg")} onChange={v => onChange("rcTitleSize", v)} />
        </RcRow>
        <RcRow label="Title 폰트">
          <RcFontPills value={s("rcTitleFont", "sans")} onChange={v => onChange("rcTitleFont", v)} />
        </RcRow>
        <RcRow label="Title 굵기">
          <RcWeightPills value={s("rcTitleWeight", "700")} onChange={v => onChange("rcTitleWeight", v)} />
        </RcRow>
        <RcRow label="Title 색상">
          <RcColorRow value={s("rcTitleColor", "#ffffff")} onChange={v => onChange("rcTitleColor", v)} />
        </RcRow>

        <RcRow label="Subtitle 텍스트">
          <textarea value={s("rcSubtitle")} onChange={e => onChange("rcSubtitle", e.target.value)}
            rows={2} placeholder="함께 성장하는 타토아"
            className="w-full px-2 py-1 text-[11px] border border-border rounded bg-background resize-y" />
        </RcRow>
        <RcRow label="Subtitle 사이즈">
          <RcSizePills value={s("rcSubtitleSize", "sm")} onChange={v => onChange("rcSubtitleSize", v)} />
        </RcRow>
        <RcRow label="Subtitle 폰트">
          <RcFontPills value={s("rcSubtitleFont", "sans")} onChange={v => onChange("rcSubtitleFont", v)} />
        </RcRow>
        <RcRow label="Subtitle 굵기">
          <RcWeightPills value={s("rcSubtitleWeight", "400")} onChange={v => onChange("rcSubtitleWeight", v)} />
        </RcRow>
        <RcRow label="Subtitle 색상">
          <RcColorRow value={s("rcSubtitleColor", "#c9a85c")} onChange={v => onChange("rcSubtitleColor", v)} />
        </RcRow>

        <RcRow label="배경 타입">
          <div className="flex gap-1">
            {(["color", "gradient", "image"] as const).map((t) => (
              <button key={t} type="button" onClick={() => onChange("rcHeaderBgType", t)}
                className={cn("flex-1 px-2 py-0.5 rounded border text-[10px] transition-all",
                  bgType === t
                    ? "border-primary bg-primary/10 font-semibold"
                    : "border-border bg-background hover:border-muted-foreground/40"
                )}
              >{t === "color" ? "단색" : t === "gradient" ? "그라데이션" : "이미지"}</button>
            ))}
          </div>
        </RcRow>
        {bgType === "color" && (
          <RcRow label="배경 색상">
            <RcColorRow value={s("rcHeaderBgColor", "#0e0c09")} onChange={v => onChange("rcHeaderBgColor", v)} />
          </RcRow>
        )}
        {bgType === "gradient" && (
          <RcRow label="배경 그라데이션 (CSS)">
            <input type="text" value={s("rcHeaderBgGradient")} onChange={e => onChange("rcHeaderBgGradient", e.target.value)}
              placeholder="linear-gradient(135deg, #0e0c09 0%, #2a2520 100%)"
              className="w-full h-7 px-2 text-[11px] font-mono border border-border rounded bg-background" />
          </RcRow>
        )}
        {bgType === "image" && (
          <RcRow label="배경 이미지">
            <RcImageInput value={s("rcHeaderBgImage")} onChange={v => onChange("rcHeaderBgImage", v)} />
          </RcRow>
        )}
      </EditorSection>

      {/* Section 2: 인트로 */}
      <EditorSection title="2. 인트로">
        <RcRow label="이미지">
          <RcImageInput value={s("rcIntroImage")} onChange={v => onChange("rcIntroImage", v)} />
        </RcRow>
        <RcRow label="헤드라인 텍스트">
          <input type="text" value={s("rcIntroHeadline")} onChange={e => onChange("rcIntroHeadline", e.target.value)}
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="헤드라인 사이즈">
          <RcSizePills value={s("rcIntroHeadlineSize", "lg")} onChange={v => onChange("rcIntroHeadlineSize", v)} />
        </RcRow>
        <RcRow label="헤드라인 폰트">
          <RcFontPills value={s("rcIntroHeadlineFont", "sans")} onChange={v => onChange("rcIntroHeadlineFont", v)} />
        </RcRow>
        <RcRow label="헤드라인 굵기">
          <RcWeightPills value={s("rcIntroHeadlineWeight", "700")} onChange={v => onChange("rcIntroHeadlineWeight", v)} />
        </RcRow>
        <RcRow label="헤드라인 색상">
          <RcColorRow value={s("rcIntroHeadlineColor", "#1a1a1a")} onChange={v => onChange("rcIntroHeadlineColor", v)} />
        </RcRow>
        <RcRow label="본문 텍스트">
          <textarea value={s("rcIntroBody")} onChange={e => onChange("rcIntroBody", e.target.value)}
            rows={4} className="w-full px-2 py-1 text-[11px] border border-border rounded bg-background resize-y" />
        </RcRow>
        <RcRow label="본문 사이즈">
          <RcSizePills value={s("rcIntroBodySize", "sm")} onChange={v => onChange("rcIntroBodySize", v)} />
        </RcRow>
        <RcRow label="본문 폰트">
          <RcFontPills value={s("rcIntroBodyFont", "sans")} onChange={v => onChange("rcIntroBodyFont", v)} />
        </RcRow>
        <RcRow label="본문 굵기">
          <RcWeightPills value={s("rcIntroBodyWeight", "400")} onChange={v => onChange("rcIntroBodyWeight", v)} />
        </RcRow>
        <RcRow label="본문 색상">
          <RcColorRow value={s("rcIntroBodyColor", "#1a1a1a")} onChange={v => onChange("rcIntroBodyColor", v)} />
        </RcRow>
      </EditorSection>

      {/* Section 3: 인재상 */}
      <EditorSection title="3. 인재상">
        <RcRow label="Eyebrow 텍스트">
          <input type="text" value={s("rcTalentsEyebrow")} onChange={e => onChange("rcTalentsEyebrow", e.target.value)}
            placeholder="REMEET CLINIC"
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="Title 텍스트">
          <input type="text" value={s("rcTalentsTitle")} onChange={e => onChange("rcTalentsTitle", e.target.value)}
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="Title 사이즈">
          <RcSizePills value={s("rcTalentsTitleSize", "l")} onChange={v => onChange("rcTalentsTitleSize", v)} />
        </RcRow>
        <RcRow label="Title 폰트">
          <RcFontPills value={s("rcTalentsTitleFont", "sans")} onChange={v => onChange("rcTalentsTitleFont", v)} />
        </RcRow>
        <RcRow label="Title 굵기">
          <RcWeightPills value={s("rcTalentsTitleWeight", "700")} onChange={v => onChange("rcTalentsTitleWeight", v)} />
        </RcRow>
        <RcRow label="Title 색상">
          <RcColorRow value={s("rcTalentsTitleColor", "#1a1a1a")} onChange={v => onChange("rcTalentsTitleColor", v)} />
        </RcRow>

        {[1, 2, 3, 4].map((n) => (
          <div key={n} style={{ padding: "8px 10px", backgroundColor: "rgba(201,168,92,0.04)", borderRadius: 4, border: "1px solid rgba(201,168,92,0.1)" }}>
            <RcRow label={`인재상 ${n}`}>
              <textarea value={s("rcTalent" + n)} onChange={e => onChange("rcTalent" + n, e.target.value)}
                rows={2} className="w-full px-2 py-1 text-[11px] border border-border rounded bg-background resize-y" />
            </RcRow>
          </div>
        ))}

        <RcRow label="카드 텍스트 사이즈 (공통)">
          <RcSizePills value={s("rcTalentTextSize", "m")} onChange={v => onChange("rcTalentTextSize", v)} />
        </RcRow>
        <RcRow label="카드 텍스트 폰트 (공통)">
          <RcFontPills value={s("rcTalentTextFont", "sans")} onChange={v => onChange("rcTalentTextFont", v)} />
        </RcRow>
        <RcRow label="카드 텍스트 굵기 (공통)">
          <RcWeightPills value={s("rcTalentTextWeight", "500")} onChange={v => onChange("rcTalentTextWeight", v)} />
        </RcRow>
        <RcRow label="카드 텍스트 색상 (공통)">
          <RcColorRow value={s("rcTalentTextColor", "#1a1a1a")} onChange={v => onChange("rcTalentTextColor", v)} />
        </RcRow>
        <RcRow label="번호 사이즈 (공통)">
          <RcSizePills value={s("rcTalentNumberSize", "m")} onChange={v => onChange("rcTalentNumberSize", v)} />
        </RcRow>
        <RcRow label="번호 폰트 (공통)">
          <RcFontPills value={s("rcTalentNumberFont", "sans")} onChange={v => onChange("rcTalentNumberFont", v)} />
        </RcRow>
        <RcRow label="번호 굵기 (공통)">
          <RcWeightPills value={s("rcTalentNumberWeight", "600")} onChange={v => onChange("rcTalentNumberWeight", v)} />
        </RcRow>
        <RcRow label="번호 색상 (공통)">
          <RcColorRow value={s("rcTalentNumberColor", "#c9a85c")} onChange={v => onChange("rcTalentNumberColor", v)} />
        </RcRow>
      </EditorSection>

      {/* Section 4: 포지션 소개 */}
      <EditorSection title="4. 포지션 소개">
        <RcRow label="Eyebrow 텍스트">
          <input type="text" value={s("rcPositionsEyebrow")} onChange={e => onChange("rcPositionsEyebrow", e.target.value)}
            placeholder="POSITIONS"
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="Eyebrow 사이즈">
          <RcSizePills value={s("rcPositionsEyebrowSize", "sm")} onChange={v => onChange("rcPositionsEyebrowSize", v)} />
        </RcRow>
        <RcRow label="Eyebrow 폰트">
          <RcFontPills value={s("rcPositionsEyebrowFont", "sans")} onChange={v => onChange("rcPositionsEyebrowFont", v)} />
        </RcRow>
        <RcRow label="Eyebrow 굵기">
          <RcWeightPills value={s("rcPositionsEyebrowWeight", "400")} onChange={v => onChange("rcPositionsEyebrowWeight", v)} />
        </RcRow>
        <RcRow label="Eyebrow 색상">
          <RcColorRow value={s("rcPositionsEyebrowColor", "#c9a961")} onChange={v => onChange("rcPositionsEyebrowColor", v)} />
        </RcRow>
        <RcRow label="Title 텍스트">
          <input type="text" value={s("rcPositionsTitle")} onChange={e => onChange("rcPositionsTitle", e.target.value)}
            placeholder="함께할 직군"
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="Title 사이즈">
          <RcSizePills value={s("rcPositionsTitleSize", "xl")} onChange={v => onChange("rcPositionsTitleSize", v)} />
        </RcRow>
        <RcRow label="Title 폰트">
          <RcFontPills value={s("rcPositionsTitleFont", "sans")} onChange={v => onChange("rcPositionsTitleFont", v)} />
        </RcRow>
        <RcRow label="Title 굵기">
          <RcWeightPills value={s("rcPositionsTitleWeight", "600")} onChange={v => onChange("rcPositionsTitleWeight", v)} />
        </RcRow>
        <RcRow label="Title 색상">
          <RcColorRow value={s("rcPositionsTitleColor", "#1a1a1a")} onChange={v => onChange("rcPositionsTitleColor", v)} />
        </RcRow>

        {[1, 2, 3].map((i) => (
          <div key={i} style={{ padding: "10px 12px", backgroundColor: "rgba(201,168,92,0.04)", borderRadius: 4, border: "1px solid rgba(201,168,92,0.1)", display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="text-[10px] font-semibold text-muted-foreground">카드 {i}</span>
            <RcRow label="이미지">
              <RcImageInput value={s("rcPosition" + i + "Image")} onChange={v => onChange("rcPosition" + i + "Image", v)} />
            </RcRow>
            <RcRow label="직책명">
              <input type="text" value={s("rcPosition" + i + "Title")} onChange={e => onChange("rcPosition" + i + "Title", e.target.value)}
                className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
            </RcRow>
            <RcRow label="설명">
              <textarea value={s("rcPosition" + i + "Body")} onChange={e => onChange("rcPosition" + i + "Body", e.target.value)}
                rows={2} className="w-full px-2 py-1 text-[11px] border border-border rounded bg-background resize-y" />
            </RcRow>
          </div>
        ))}

        <RcRow label="카드 직책 사이즈 (공통)">
          <RcSizePills value={s("rcPositionCardTitleSize", "lg")} onChange={v => onChange("rcPositionCardTitleSize", v)} />
        </RcRow>
        <RcRow label="카드 직책 폰트 (공통)">
          <RcFontPills value={s("rcPositionCardTitleFont", "sans")} onChange={v => onChange("rcPositionCardTitleFont", v)} />
        </RcRow>
        <RcRow label="카드 직책 굵기 (공통)">
          <RcWeightPills value={s("rcPositionCardTitleWeight", "600")} onChange={v => onChange("rcPositionCardTitleWeight", v)} />
        </RcRow>
        <RcRow label="카드 직책 색상 (공통)">
          <RcColorRow value={s("rcPositionCardTitleColor", "#1a1a1a")} onChange={v => onChange("rcPositionCardTitleColor", v)} />
        </RcRow>
        <RcRow label="카드 설명 사이즈 (공통)">
          <RcSizePills value={s("rcPositionCardBodySize", "sm")} onChange={v => onChange("rcPositionCardBodySize", v)} />
        </RcRow>
        <RcRow label="카드 설명 폰트 (공통)">
          <RcFontPills value={s("rcPositionCardBodyFont", "sans")} onChange={v => onChange("rcPositionCardBodyFont", v)} />
        </RcRow>
        <RcRow label="카드 설명 굵기 (공통)">
          <RcWeightPills value={s("rcPositionCardBodyWeight", "400")} onChange={v => onChange("rcPositionCardBodyWeight", v)} />
        </RcRow>
        <RcRow label="카드 설명 색상 (공통)">
          <RcColorRow value={s("rcPositionCardBodyColor", "#666666")} onChange={v => onChange("rcPositionCardBodyColor", v)} />
        </RcRow>
      </EditorSection>

      {/* Section 5: 중간 배너 */}
      <EditorSection title="5. 중간 배너">
        <RcRow label="배경 이미지">
          <RcImageInput value={s("rcBannerImage")} onChange={v => onChange("rcBannerImage", v)} />
        </RcRow>
        <RcRow label={"오버레이 강도 (" + n("rcBannerOverlay", 40) + ")"}>
          <input type="range" min={0} max={100} step={5}
            value={n("rcBannerOverlay", 40)}
            onChange={e => onChange("rcBannerOverlay", parseInt(e.target.value, 10))}
            className="w-full" />
        </RcRow>
        <RcRow label="헤드라인 텍스트">
          <input type="text" value={s("rcBannerHeadline")} onChange={e => onChange("rcBannerHeadline", e.target.value)}
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="헤드라인 사이즈">
          <RcSizePills value={s("rcBannerHeadlineSize", "xl")} onChange={v => onChange("rcBannerHeadlineSize", v)} />
        </RcRow>
        <RcRow label="헤드라인 폰트">
          <RcFontPills value={s("rcBannerHeadlineFont", "sans")} onChange={v => onChange("rcBannerHeadlineFont", v)} />
        </RcRow>
        <RcRow label="헤드라인 굵기">
          <RcWeightPills value={s("rcBannerHeadlineWeight", "600")} onChange={v => onChange("rcBannerHeadlineWeight", v)} />
        </RcRow>
        <RcRow label="헤드라인 색상">
          <RcColorRow value={s("rcBannerHeadlineColor", "#ffffff")} onChange={v => onChange("rcBannerHeadlineColor", v)} />
        </RcRow>
        <RcRow label="서브텍스트">
          <input type="text" value={s("rcBannerSubtext")} onChange={e => onChange("rcBannerSubtext", e.target.value)}
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="서브텍스트 사이즈">
          <RcSizePills value={s("rcBannerSubtextSize", "md")} onChange={v => onChange("rcBannerSubtextSize", v)} />
        </RcRow>
        <RcRow label="서브텍스트 폰트">
          <RcFontPills value={s("rcBannerSubtextFont", "sans")} onChange={v => onChange("rcBannerSubtextFont", v)} />
        </RcRow>
        <RcRow label="서브텍스트 굵기">
          <RcWeightPills value={s("rcBannerSubtextWeight", "400")} onChange={v => onChange("rcBannerSubtextWeight", v)} />
        </RcRow>
        <RcRow label="서브텍스트 색상">
          <RcColorRow value={s("rcBannerSubtextColor", "#e0e0e0")} onChange={v => onChange("rcBannerSubtextColor", v)} />
        </RcRow>
      </EditorSection>

      {/* Section 6: 복지 */}
      <EditorSection title="6. 복지">
        <RcRow label="Eyebrow 텍스트">
          <input type="text" value={s("rcWelfareEyebrow")} onChange={e => onChange("rcWelfareEyebrow", e.target.value)}
            placeholder="BENEFITS"
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="Eyebrow 사이즈">
          <RcSizePills value={s("rcWelfareEyebrowSize", "sm")} onChange={v => onChange("rcWelfareEyebrowSize", v)} />
        </RcRow>
        <RcRow label="Eyebrow 폰트">
          <RcFontPills value={s("rcWelfareEyebrowFont", "sans")} onChange={v => onChange("rcWelfareEyebrowFont", v)} />
        </RcRow>
        <RcRow label="Eyebrow 굵기">
          <RcWeightPills value={s("rcWelfareEyebrowWeight", "400")} onChange={v => onChange("rcWelfareEyebrowWeight", v)} />
        </RcRow>
        <RcRow label="Eyebrow 색상">
          <RcColorRow value={s("rcWelfareEyebrowColor", "#c9a961")} onChange={v => onChange("rcWelfareEyebrowColor", v)} />
        </RcRow>
        <RcRow label="Title 텍스트">
          <input type="text" value={s("rcWelfareTitle")} onChange={e => onChange("rcWelfareTitle", e.target.value)}
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="Title 사이즈">
          <RcSizePills value={s("rcWelfareTitleSize", "xl")} onChange={v => onChange("rcWelfareTitleSize", v)} />
        </RcRow>
        <RcRow label="Title 폰트">
          <RcFontPills value={s("rcWelfareTitleFont", "sans")} onChange={v => onChange("rcWelfareTitleFont", v)} />
        </RcRow>
        <RcRow label="Title 굵기">
          <RcWeightPills value={s("rcWelfareTitleWeight", "600")} onChange={v => onChange("rcWelfareTitleWeight", v)} />
        </RcRow>
        <RcRow label="Title 색상">
          <RcColorRow value={s("rcWelfareTitleColor", "#1a1a1a")} onChange={v => onChange("rcWelfareTitleColor", v)} />
        </RcRow>

        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} style={{ padding: "10px 12px", backgroundColor: "rgba(201,168,92,0.04)", borderRadius: 4, border: "1px solid rgba(201,168,92,0.1)", display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="text-[10px] font-semibold text-muted-foreground">복지 {i}</span>
            <RcRow label="아이콘">
              <RcIconGrid value={s("rcWelfare" + i + "Icon", "Shield")} onChange={v => onChange("rcWelfare" + i + "Icon", v)} />
            </RcRow>
            <RcRow label="제목">
              <input type="text" value={s("rcWelfare" + i + "Title")} onChange={e => onChange("rcWelfare" + i + "Title", e.target.value)}
                className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
            </RcRow>
            <RcRow label="설명">
              <input type="text" value={s("rcWelfare" + i + "Body")} onChange={e => onChange("rcWelfare" + i + "Body", e.target.value)}
                className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
            </RcRow>
          </div>
        ))}

        <RcRow label="카드 제목 사이즈 (공통)">
          <RcSizePills value={s("rcWelfareCardTitleSize", "md")} onChange={v => onChange("rcWelfareCardTitleSize", v)} />
        </RcRow>
        <RcRow label="카드 제목 폰트 (공통)">
          <RcFontPills value={s("rcWelfareCardTitleFont", "sans")} onChange={v => onChange("rcWelfareCardTitleFont", v)} />
        </RcRow>
        <RcRow label="카드 제목 굵기 (공통)">
          <RcWeightPills value={s("rcWelfareCardTitleWeight", "600")} onChange={v => onChange("rcWelfareCardTitleWeight", v)} />
        </RcRow>
        <RcRow label="카드 제목 색상 (공통)">
          <RcColorRow value={s("rcWelfareCardTitleColor", "#1a1a1a")} onChange={v => onChange("rcWelfareCardTitleColor", v)} />
        </RcRow>
        <RcRow label="카드 설명 사이즈 (공통)">
          <RcSizePills value={s("rcWelfareCardBodySize", "sm")} onChange={v => onChange("rcWelfareCardBodySize", v)} />
        </RcRow>
        <RcRow label="카드 설명 폰트 (공통)">
          <RcFontPills value={s("rcWelfareCardBodyFont", "sans")} onChange={v => onChange("rcWelfareCardBodyFont", v)} />
        </RcRow>
        <RcRow label="카드 설명 굵기 (공통)">
          <RcWeightPills value={s("rcWelfareCardBodyWeight", "400")} onChange={v => onChange("rcWelfareCardBodyWeight", v)} />
        </RcRow>
        <RcRow label="카드 설명 색상 (공통)">
          <RcColorRow value={s("rcWelfareCardBodyColor", "#666666")} onChange={v => onChange("rcWelfareCardBodyColor", v)} />
        </RcRow>
        <RcRow label="아이콘 색상 (공통)">
          <RcColorRow value={s("rcWelfareIconColor", "#c9a961")} onChange={v => onChange("rcWelfareIconColor", v)} />
        </RcRow>
      </EditorSection>

      {/* Section 7: 채용 절차 */}
      <EditorSection title="7. 채용 절차">
        <RcRow label="Eyebrow 텍스트">
          <input type="text" value={s("rcProcessEyebrow")} onChange={e => onChange("rcProcessEyebrow", e.target.value)}
            placeholder="PROCESS"
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="Eyebrow 사이즈">
          <RcSizePills value={s("rcProcessEyebrowSize", "sm")} onChange={v => onChange("rcProcessEyebrowSize", v)} />
        </RcRow>
        <RcRow label="Eyebrow 폰트">
          <RcFontPills value={s("rcProcessEyebrowFont", "sans")} onChange={v => onChange("rcProcessEyebrowFont", v)} />
        </RcRow>
        <RcRow label="Eyebrow 굵기">
          <RcWeightPills value={s("rcProcessEyebrowWeight", "400")} onChange={v => onChange("rcProcessEyebrowWeight", v)} />
        </RcRow>
        <RcRow label="Eyebrow 색상">
          <RcColorRow value={s("rcProcessEyebrowColor", "#c9a961")} onChange={v => onChange("rcProcessEyebrowColor", v)} />
        </RcRow>
        <RcRow label="Title 텍스트">
          <input type="text" value={s("rcProcessTitle")} onChange={e => onChange("rcProcessTitle", e.target.value)}
            placeholder="채용 절차"
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="Title 사이즈">
          <RcSizePills value={s("rcProcessTitleSize", "xl")} onChange={v => onChange("rcProcessTitleSize", v)} />
        </RcRow>
        <RcRow label="Title 폰트">
          <RcFontPills value={s("rcProcessTitleFont", "sans")} onChange={v => onChange("rcProcessTitleFont", v)} />
        </RcRow>
        <RcRow label="Title 굵기">
          <RcWeightPills value={s("rcProcessTitleWeight", "600")} onChange={v => onChange("rcProcessTitleWeight", v)} />
        </RcRow>
        <RcRow label="Title 색상">
          <RcColorRow value={s("rcProcessTitleColor", "#1a1a1a")} onChange={v => onChange("rcProcessTitleColor", v)} />
        </RcRow>

        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ padding: "10px 12px", backgroundColor: "rgba(201,168,92,0.04)", borderRadius: 4, border: "1px solid rgba(201,168,92,0.1)", display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="text-[10px] font-semibold text-muted-foreground">단계 {i}</span>
            <RcRow label="제목">
              <input type="text" value={s("rcProcess" + i + "Title")} onChange={e => onChange("rcProcess" + i + "Title", e.target.value)}
                className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
            </RcRow>
            <RcRow label="설명">
              <input type="text" value={s("rcProcess" + i + "Body")} onChange={e => onChange("rcProcess" + i + "Body", e.target.value)}
                className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
            </RcRow>
          </div>
        ))}

        <RcRow label="번호 색상 (공통)">
          <RcColorRow value={s("rcProcessNumberColor", "#c9a961")} onChange={v => onChange("rcProcessNumberColor", v)} />
        </RcRow>
        <RcRow label="단계 제목 사이즈 (공통)">
          <RcSizePills value={s("rcProcessStepTitleSize", "md")} onChange={v => onChange("rcProcessStepTitleSize", v)} />
        </RcRow>
        <RcRow label="단계 제목 폰트 (공통)">
          <RcFontPills value={s("rcProcessStepTitleFont", "sans")} onChange={v => onChange("rcProcessStepTitleFont", v)} />
        </RcRow>
        <RcRow label="단계 제목 굵기 (공통)">
          <RcWeightPills value={s("rcProcessStepTitleWeight", "600")} onChange={v => onChange("rcProcessStepTitleWeight", v)} />
        </RcRow>
        <RcRow label="단계 제목 색상 (공통)">
          <RcColorRow value={s("rcProcessStepTitleColor", "#1a1a1a")} onChange={v => onChange("rcProcessStepTitleColor", v)} />
        </RcRow>
        <RcRow label="단계 설명 사이즈 (공통)">
          <RcSizePills value={s("rcProcessStepBodySize", "sm")} onChange={v => onChange("rcProcessStepBodySize", v)} />
        </RcRow>
        <RcRow label="단계 설명 폰트 (공통)">
          <RcFontPills value={s("rcProcessStepBodyFont", "sans")} onChange={v => onChange("rcProcessStepBodyFont", v)} />
        </RcRow>
        <RcRow label="단계 설명 굵기 (공통)">
          <RcWeightPills value={s("rcProcessStepBodyWeight", "400")} onChange={v => onChange("rcProcessStepBodyWeight", v)} />
        </RcRow>
        <RcRow label="단계 설명 색상 (공통)">
          <RcColorRow value={s("rcProcessStepBodyColor", "#666666")} onChange={v => onChange("rcProcessStepBodyColor", v)} />
        </RcRow>

        <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid rgba(201,168,92,0.15)" }}>
          <span className="text-[11px] font-semibold text-foreground">유의사항</span>
          <div className="mt-2 space-y-3">
            <RcRow label="유의사항 제목">
              <input type="text" value={s("rcProcessNotesTitle")} onChange={e => onChange("rcProcessNotesTitle", e.target.value)}
                className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
            </RcRow>
            <RcRow label="유의사항 제목 사이즈">
              <RcSizePills value={s("rcProcessNotesTitleSize", "md")} onChange={v => onChange("rcProcessNotesTitleSize", v)} />
            </RcRow>
            <RcRow label="유의사항 제목 폰트">
              <RcFontPills value={s("rcProcessNotesTitleFont", "sans")} onChange={v => onChange("rcProcessNotesTitleFont", v)} />
            </RcRow>
            <RcRow label="유의사항 제목 굵기">
              <RcWeightPills value={s("rcProcessNotesTitleWeight", "600")} onChange={v => onChange("rcProcessNotesTitleWeight", v)} />
            </RcRow>
            <RcRow label="유의사항 제목 색상">
              <RcColorRow value={s("rcProcessNotesTitleColor", "#1a1a1a")} onChange={v => onChange("rcProcessNotesTitleColor", v)} />
            </RcRow>
            {[1, 2, 3, 4].map((i) => (
              <RcRow key={i} label={"유의사항 " + i + " (빈 값이면 숨김)"}>
                <input type="text" value={s("rcProcessNote" + i)} onChange={e => onChange("rcProcessNote" + i, e.target.value)}
                  className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
              </RcRow>
            ))}
            <RcRow label="유의사항 본문 사이즈 (공통)">
              <RcSizePills value={s("rcProcessNoteBodySize", "sm")} onChange={v => onChange("rcProcessNoteBodySize", v)} />
            </RcRow>
            <RcRow label="유의사항 본문 폰트 (공통)">
              <RcFontPills value={s("rcProcessNoteBodyFont", "sans")} onChange={v => onChange("rcProcessNoteBodyFont", v)} />
            </RcRow>
            <RcRow label="유의사항 본문 굵기 (공통)">
              <RcWeightPills value={s("rcProcessNoteBodyWeight", "400")} onChange={v => onChange("rcProcessNoteBodyWeight", v)} />
            </RcRow>
            <RcRow label="유의사항 본문 색상 (공통)">
              <RcColorRow value={s("rcProcessNoteBodyColor", "#666666")} onChange={v => onChange("rcProcessNoteBodyColor", v)} />
            </RcRow>
          </div>
        </div>
      </EditorSection>

      {/* Section 8: 하단 CTA */}
      <EditorSection title="8. 하단 CTA">
        <RcRow label="배경 이미지">
          <RcImageInput value={s("rcCtaBgImage")} onChange={v => onChange("rcCtaBgImage", v)} />
        </RcRow>
        <RcRow label="배경 단색 (이미지 없을 때)">
          <RcColorRow value={s("rcCtaBgColor", "#1a1a1a")} onChange={v => onChange("rcCtaBgColor", v)} />
        </RcRow>
        <RcRow label={"오버레이 강도 (" + n("rcCtaOverlay", 50) + ")"}>
          <input type="range" min={0} max={100} step={5}
            value={n("rcCtaOverlay", 50)}
            onChange={e => onChange("rcCtaOverlay", parseInt(e.target.value, 10))}
            className="w-full" />
        </RcRow>
        <RcRow label="헤드라인">
          <textarea value={s("rcCtaHeadline")} onChange={e => onChange("rcCtaHeadline", e.target.value)}
            rows={2} className="w-full px-2 py-1 text-[11px] border border-border rounded bg-background resize-y" />
        </RcRow>
        <RcRow label="헤드라인 사이즈">
          <RcSizePills value={s("rcCtaHeadlineSize", "xl")} onChange={v => onChange("rcCtaHeadlineSize", v)} />
        </RcRow>
        <RcRow label="헤드라인 폰트">
          <RcFontPills value={s("rcCtaHeadlineFont", "sans")} onChange={v => onChange("rcCtaHeadlineFont", v)} />
        </RcRow>
        <RcRow label="헤드라인 굵기">
          <RcWeightPills value={s("rcCtaHeadlineWeight", "600")} onChange={v => onChange("rcCtaHeadlineWeight", v)} />
        </RcRow>
        <RcRow label="헤드라인 색상">
          <RcColorRow value={s("rcCtaHeadlineColor", "#ffffff")} onChange={v => onChange("rcCtaHeadlineColor", v)} />
        </RcRow>
        <RcRow label="서브텍스트">
          <input type="text" value={s("rcCtaSubtext")} onChange={e => onChange("rcCtaSubtext", e.target.value)}
            className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
        </RcRow>
        <RcRow label="서브텍스트 사이즈">
          <RcSizePills value={s("rcCtaSubtextSize", "md")} onChange={v => onChange("rcCtaSubtextSize", v)} />
        </RcRow>
        <RcRow label="서브텍스트 폰트">
          <RcFontPills value={s("rcCtaSubtextFont", "sans")} onChange={v => onChange("rcCtaSubtextFont", v)} />
        </RcRow>
        <RcRow label="서브텍스트 굵기">
          <RcWeightPills value={s("rcCtaSubtextWeight", "400")} onChange={v => onChange("rcCtaSubtextWeight", v)} />
        </RcRow>
        <RcRow label="서브텍스트 색상">
          <RcColorRow value={s("rcCtaSubtextColor", "#e0e0e0")} onChange={v => onChange("rcCtaSubtextColor", v)} />
        </RcRow>

        <div style={{ padding: "10px 12px", backgroundColor: "rgba(201,168,92,0.04)", borderRadius: 4, border: "1px solid rgba(201,168,92,0.1)", display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="text-[10px] font-semibold text-muted-foreground">버튼 1 (Primary)</span>
          <RcRow label="버튼 텍스트">
            <input type="text" value={s("rcCtaButton1Text")} onChange={e => onChange("rcCtaButton1Text", e.target.value)}
              placeholder="지원하기"
              className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
          </RcRow>
          <RcRow label="버튼 링크 (mailto: / tel: / https://)">
            <input type="text" value={s("rcCtaButton1Link")} onChange={e => onChange("rcCtaButton1Link", e.target.value)}
              placeholder="mailto:recruit@tatoa.co.kr"
              className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
          </RcRow>
          <RcRow label="버튼 배경 색상">
            <RcColorRow value={s("rcCtaButton1Bg", "#c9a961")} onChange={v => onChange("rcCtaButton1Bg", v)} />
          </RcRow>
          <RcRow label="버튼 글자 색상">
            <RcColorRow value={s("rcCtaButton1Color", "#ffffff")} onChange={v => onChange("rcCtaButton1Color", v)} />
          </RcRow>
        </div>

        <div style={{ padding: "10px 12px", backgroundColor: "rgba(201,168,92,0.04)", borderRadius: 4, border: "1px solid rgba(201,168,92,0.1)", display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="text-[10px] font-semibold text-muted-foreground">버튼 2 (Secondary, 텍스트 비우면 숨김)</span>
          <RcRow label="버튼 텍스트">
            <input type="text" value={s("rcCtaButton2Text")} onChange={e => onChange("rcCtaButton2Text", e.target.value)}
              placeholder="전화 문의"
              className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
          </RcRow>
          <RcRow label="버튼 링크">
            <input type="text" value={s("rcCtaButton2Link")} onChange={e => onChange("rcCtaButton2Link", e.target.value)}
              placeholder="tel:02-1234-5678"
              className="w-full h-7 px-2 text-[11px] border border-border rounded bg-background" />
          </RcRow>
          <RcRow label="버튼 배경 (transparent 입력 시 outline)">
            <input type="text" value={s("rcCtaButton2Bg", "transparent")} onChange={e => onChange("rcCtaButton2Bg", e.target.value)}
              placeholder="transparent 또는 #hex"
              className="w-full h-7 px-2 text-[11px] font-mono border border-border rounded bg-background" />
          </RcRow>
          <RcRow label="버튼 글자 색상">
            <RcColorRow value={s("rcCtaButton2Color", "#ffffff")} onChange={v => onChange("rcCtaButton2Color", v)} />
          </RcRow>
        </div>
      </EditorSection>

    </div>
  )
}

// ─── Main export: RecruitPage ─────────────────────────────────────────────────

export default function RecruitPage({ values, onChange, branchId, onNavigate, snapshot, branchSlug }: RecruitPageProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile")
  const branchName = (branchId ?? "").replace(/-/g, " ")
  const currentBranch =
    branches.find((b) => b.id === branchId) ??
    { id: branchId, name: branchName }

  const DESKTOP_VIRTUAL_W = 1280
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
      style={{ gridTemplateColumns: "1fr clamp(395px, 38vw, 580px)" }}
    >
      {/* Left: Editor placeholder — 19-G-6에서 실제 편집 UI 채움 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">상시채용 페이지 설정</CardTitle>
          <CardDescription className="text-xs">
            채용 페이지의 각 섹션 텍스트·색상·이미지를 편집합니다.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <RecruitEditor values={values} onChange={onChange} />
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

        {/* Mobile viewport simulator */}
        {device === "mobile" && (
          <div className="flex justify-center">
            <div style={{ width: 375, height: 700, overflow: "hidden", border: "1px solid #e5e5e5", borderRadius: 12, background: "white", flexShrink: 0 }}>
              <div style={{ height: "100%", overflowY: "auto" }}>
                <PreviewRecruit values={values} branchName={currentBranch.name} forceNarrow={true} />
              </div>
            </div>
          </div>
        )}

        {/* Desktop 1280px viewport — scaled to fit panel */}
        {device === "desktop" && (
          <div ref={desktopColRef} style={{ position: "relative", width: "100%", height: 600, overflow: "hidden", border: "1px solid #e5e5e5", borderRadius: 12 }}>
            <div style={{
              position: "absolute", top: 0, left: 0,
              width: 1280,
              height: desktopScale > 0 ? Math.round(600 / desktopScale) : 1333,
              transform: `scale(${desktopScale})`,
              transformOrigin: "top left",
              overflowY: "auto",
            }}>
              {snapshot && branchSlug && (
                <SiteNav snapshot={snapshot} branchSlug={branchSlug} isPreview={false} device="desktop" />
              )}
              <div style={{ paddingTop: 60 }}>
                <PreviewRecruit values={values} branchName={currentBranch.name} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-white" style={{ transform: "translateZ(0)" }} onClick={() => setFullscreen(false)}>
          <div onClick={e => e.stopPropagation()}>
            {snapshot && branchSlug && (
              <SiteNav snapshot={snapshot} branchSlug={branchSlug} isPreview={false} device="desktop" />
            )}
            <div className="pt-[60px]">
              <PreviewRecruit values={values} branchName={currentBranch.name} />
            </div>
          </div>
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 text-foreground opacity-70 hover:opacity-100" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  )
}
