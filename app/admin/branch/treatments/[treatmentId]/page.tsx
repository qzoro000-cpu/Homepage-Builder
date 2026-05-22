"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff,
  Star, Globe, Link2, Upload, X, Check, AlertCircle, RefreshCw, RotateCcw,
  Building2, Pencil, Tag, Layers, FileText, Image as ImageIcon, Video,
  Sparkles, Clock, Zap, MessageSquare, Layout, Lock, Unlock, Wand2,
  CheckCircle2, AlertTriangle, History
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  useTreatment, TreatmentProfile, TreatmentProgram, TreatmentPrecaution,
  TreatmentAsset, TreatmentLandingSection, LandingSectionType, TreatmentAssetType,
  TreatmentPrecautionType, TreatmentOverviewCard, TreatmentEffectCard, TreatmentWhyTatoaCard,
  TreatmentSourceMaterial, AIExtractionItem, AIExtractionRun, LandingSectionDraft,
} from "@/lib/treatment-store"
import { SourceMaterialsPanel } from "@/components/admin/source-materials-panel"
import { AIExtractionPanel } from "@/components/admin/ai-extraction-panel"
import { TATOA_DEFAULT_TEMPLATE, COMPACT_TEMPLATE, EXTENDED_TEMPLATE, getLandingSectionLabel } from "@/lib/landing-auto-map"
import { useContentRelation, ContentNodeType, RelationType } from "@/lib/content-relation-store"
import { useDomain, PageType } from "@/lib/domain-store"
import { useBranch, useSession } from "@/app/admin/layout"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { hasPermission, canUploadAsset } from "@/lib/rbac"
import { cn } from "@/lib/utils"
import { useLandingDraft, LandingDraft, DraftSection } from "@/lib/landing-draft-store"
import { AiLandingModal } from "@/components/admin/ai-landing-modal"
import { ImageEffectEditor } from "@/components/admin/image-effect-editor"
import { LandingSectionEditor } from "@/components/admin/landing-section-editor"
import { useMedia } from "@/lib/media-store"
import type { AiRegenerateSectionRequest } from "@/app/api/treatments/ai-generate-section/route"
import {
  computeAssetUsageTags, countAssetConnections, assetConnectionTooltip,
  CHANNEL_LABELS, CHANNEL_SHORT_LABELS,
} from "@/lib/asset-binding-store"
import { LandingPagePreview } from "@/components/landing-preview/LandingPagePreview"
import { validateLandingBuild, buildLandingDraftPayload, getLatestLandingDraft } from "@/lib/landing-builder"
import { SectionBgEditor } from "@/components/admin/section-bg-editor"
import type { SectionBgImageCfg } from "@/lib/landing-preview-types"
import type { LandingPageDraft } from "@/lib/treatment-store"

// ─── Korean labels ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  published: "공개",
  hidden: "숨김",
  archived: "보관",
  needs_review: "검토필요",
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  hidden: "bg-yellow-100 text-yellow-700",
  archived: "bg-red-100 text-red-700",
  needs_review: "bg-orange-100 text-orange-700",
}

const CATEGORY_COLORS: Record<string, string> = {
  "리프팅": "bg-purple-100 text-purple-700",
  "RF 리프팅": "bg-violet-100 text-violet-700",
  "레이저": "bg-blue-100 text-blue-700",
  "보톡스": "bg-pink-100 text-pink-700",
  "필러": "bg-rose-100 text-rose-700",
  "미세침 RF": "bg-orange-100 text-orange-700",
  "스킨케어": "bg-teal-100 text-teal-700",
}

const RELATION_TYPE_LABELS: Record<RelationType, string> = {
  related: "연관",
  featured: "대표연결",
  faq_for: "FAQ",
  recommended_by: "추천의사",
  landing_source: "랜딩소스",
  chatbot_reference: "챗봇참조",
}

const CONTENT_NODE_TYPE_LABELS: Record<string, string> = {
  treatment: "시술",
  equipment: "장비",
  doctor: "의사",
  faq: "FAQ",
  event: "이벤트",
  notice: "공지",
}

// Landing section label — uses central registry from landing-auto-map.tsx
// Keeps a Record<> alias so existing LANDING_SECTION_TYPE_LABELS references still compile
const LANDING_SECTION_TYPE_LABELS: Record<LandingSectionType, string> = new Proxy(
  {} as Record<LandingSectionType, string>,
  { get: (_t, key: string) => getLandingSectionLabel(key as LandingSectionType) }
)

const ASSET_TYPE_LIST: TreatmentAssetType[] = [
  "카드썸네일", "히어로이미지", "랜딩이미지", "비포애프터", "가격표이미지",
  "설명PDF", "홍보영상", "시술영상", "홈페이지용", "랜딩용", "챗봇참조용",
]

// All known section types for the manual "add section" picker
// Combines all three PDF template variants (deduplicated, preserving Full order first)
const ALL_LANDING_TYPES: LandingSectionType[] = Array.from(
  new Set([
    ...TATOA_DEFAULT_TEMPLATE.map((b) => b.sectionType),
    ...COMPACT_TEMPLATE.map((b) => b.sectionType),
    ...EXTENDED_TEMPLATE.map((b) => b.sectionType),
  ])
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatKoreanPrice(n: number): string {
  if (n >= 10000) return `${Math.floor(n / 10000)}만원`
  return `${n.toLocaleString()}원`
}

function formatTime(d: Date): string {
  return d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0")
}

// ─── Inline helper components ─────────────────────────────────────────────────

function SectionCard({
  title,
  action,
  children,
  className,
  isFocused,
  onFocus,
  landingNum,
  supplementary,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  isFocused?: boolean
  onFocus?: () => void
  landingNum?: string   // e.g. "①" or "④"
  supplementary?: boolean  // dims styling for secondary sections
}) {
  return (
    <Card className={cn("mb-6 transition-shadow", isFocused && "ring-2 ring-primary/40 shadow-md", className)}>
      <CardHeader className={cn("pb-3", onFocus && "cursor-pointer select-none")} onClick={onFocus}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isFocused && <div className="w-1.5 h-5 rounded-full bg-primary" />}
            {landingNum && (
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                {landingNum}
              </span>
            )}
            <CardTitle className={cn("text-base font-semibold", supplementary && "text-muted-foreground")}>{title}</CardTitle>
          </div>
          {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// ─── Hero Image Upload & Editor (홈 히어로와 동일한 UI) ──────────────────────

type HeroImgCfg = {
  effectId: string; brightness: number; contrast: number; saturate: number; hue: number
  position: string
  gradDir: string; gradColor: string; gradOpacity: number
  shadowPreset: string; shadowColor: string
}

const DEFAULT_HERO_IMG_CFG: HeroImgCfg = {
  effectId: "none", brightness: 100, contrast: 100, saturate: 100, hue: 0,
  position: "center",
  gradDir: "to bottom", gradColor: "#000000", gradOpacity: 0,
  shadowPreset: "none", shadowColor: "#000000",
}

function parseHeroImgCfg(raw: string | undefined): HeroImgCfg {
  try { const p = JSON.parse(raw || "{}"); if (p && typeof p === "object") return { ...DEFAULT_HERO_IMG_CFG, ...p } } catch {}
  return { ...DEFAULT_HERO_IMG_CFG }
}

function hexToRgbStr(hex: string): string {
  const h = hex.replace("#", "")
  return `${parseInt(h.slice(0,2),16)||0},${parseInt(h.slice(2,4),16)||0},${parseInt(h.slice(4,6),16)||0}`
}

const HERO_IMG_EFFECTS = [
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

const HERO_IMG_POSITIONS = [
  { v: "top left",    label: "↖" }, { v: "top center",    label: "↑" }, { v: "top right",    label: "↗" },
  { v: "center left", label: "←" }, { v: "center",        label: "⊙" }, { v: "center right", label: "→" },
  { v: "bottom left", label: "↙" }, { v: "bottom center", label: "↓" }, { v: "bottom right", label: "↘" },
] as const

function HeroImageUploadZone({ dataUrl, onUpload, onClear }: {
  dataUrl: string; onUpload: (url: string) => void; onClear: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const handleFile = (file: File) => { if (!file.type.startsWith("image/")) return; onUpload(URL.createObjectURL(file)) }
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }

  if (dataUrl) return (
    <div className="relative rounded-xl overflow-hidden border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="히어로 이미지" className="w-full h-28 object-cover" />
      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}
          className="rounded-xl h-7 text-xs bg-white/90 text-foreground border-0 gap-1">
          <Pencil className="h-3 w-3" />변경
        </Button>
        <Button size="sm" variant="destructive" onClick={onClear} className="rounded-xl h-7 text-xs gap-1">
          <Trash2 className="h-3 w-3" />삭제
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-5 text-center cursor-pointer hover:bg-muted/50 hover:border-primary/40 transition-all"
      onClick={() => fileRef.current?.click()} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      <ImageIcon className="h-7 w-7 text-muted-foreground mb-2" />
      <p className="text-xs font-medium text-foreground">히어로 이미지 업로드</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">클릭 또는 드래그 · JPG/WebP/PNG</p>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

function HeroImgCfgEditor({ value, onChange: onCfgChange }: { value: HeroImgCfg; onChange: (v: HeroImgCfg) => void }) {
  const patch = (u: Partial<HeroImgCfg>) => onCfgChange({ ...value, ...u })
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* 이미지 효과 프리셋 */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">이미지 효과</p>
        <div className="flex flex-wrap gap-1">
          {HERO_IMG_EFFECTS.map(eff => (
            <button key={eff.id} type="button" onClick={() => patch({ effectId: eff.id })}
              className={cn("rounded-lg px-2 py-1 text-[10px] border transition-all",
                value.effectId === eff.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
              {eff.label}
            </button>
          ))}
        </div>
      </div>

      {/* 세부 조정 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">세부 조정</p>
          <button type="button" onClick={() => patch({ brightness: 100, contrast: 100, saturate: 100, hue: 0 })}
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
            <RotateCcw className="h-2.5 w-2.5" />초기화
          </button>
        </div>
        {([
          { key: "brightness", label: "밝기", min: 50, max: 150, unit: "%" },
          { key: "contrast",   label: "대비", min: 50, max: 200, unit: "%" },
          { key: "saturate",   label: "채도", min: 0,  max: 200, unit: "%" },
          { key: "hue",        label: "색조", min: 0,  max: 360, unit: "°" },
        ] as const).map(({ key, label, min, max, unit }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground w-8 shrink-0">{label}</span>
            <input type="range" min={min} max={max} value={value[key]}
              onChange={e => patch({ [key]: Number(e.target.value) })}
              className="flex-1 accent-primary h-1.5" />
            <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{value[key]}{unit}</span>
          </div>
        ))}
      </div>

      {/* 이미지 위치 */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">이미지 위치</p>
        <div className="grid grid-cols-3 gap-1 w-24">
          {HERO_IMG_POSITIONS.map(pos => (
            <button key={pos.v} type="button" onClick={() => patch({ position: pos.v })}
              className={cn("h-7 rounded text-xs border transition-all",
                value.position === pos.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      {/* 그라데이션 오버레이 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">그라데이션</p>
          {value.gradOpacity > 0 && (
            <button type="button" onClick={() => patch({ gradOpacity: 0 })}
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
              <RotateCcw className="h-2.5 w-2.5" />끄기
            </button>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">방향</p>
          <div className="grid grid-cols-4 gap-1">
            {([
              { v: "to bottom",       label: "↓" }, { v: "to top",         label: "↑" },
              { v: "to right",        label: "→" }, { v: "to left",        label: "←" },
              { v: "to bottom right", label: "↘" }, { v: "to bottom left", label: "↙" },
              { v: "radial",          label: "⊙" }, { v: "radial-edge",    label: "◎" },
            ] as const).map(d => (
              <button key={d.v} type="button" onClick={() => patch({ gradDir: d.v })}
                className={cn("h-7 rounded text-sm border transition-all",
                  value.gradDir === d.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground w-8 shrink-0">색상</span>
          <input type="color" value={value.gradColor || "#000000"} onChange={e => patch({ gradColor: e.target.value })}
            className="w-8 h-7 rounded border border-border cursor-pointer p-0.5 shrink-0" />
          <div className="flex gap-1">
            {["#000000","#ffffff","#c9a85c","#1a0e00","#0a1a2e"].map(c => (
              <div key={c} onClick={() => patch({ gradColor: c })}
                className="w-5 h-5 rounded cursor-pointer border border-border/60 shrink-0" style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground w-8 shrink-0">강도</span>
          <input type="range" min={0} max={100} value={value.gradOpacity}
            onChange={e => patch({ gradOpacity: Number(e.target.value) })}
            className="flex-1 accent-primary h-1.5" />
          <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{value.gradOpacity}%</span>
        </div>
        {value.gradOpacity > 0 && (
          <div className="w-full h-6 rounded-lg border border-border overflow-hidden">
            <div className="w-full h-full" style={{ background:
              value.gradDir === "radial"
                ? `radial-gradient(ellipse at center, rgba(${hexToRgbStr(value.gradColor||"#000")},${value.gradOpacity/100}) 0%, transparent 100%)`
                : value.gradDir === "radial-edge"
                ? `radial-gradient(ellipse at center, transparent 30%, rgba(${hexToRgbStr(value.gradColor||"#000")},${value.gradOpacity/100}) 100%)`
                : `linear-gradient(to right, transparent, rgba(${hexToRgbStr(value.gradColor||"#000")},${value.gradOpacity/100}))` }} />
          </div>
        )}
      </div>

      {/* 그림자 */}
      <div className="space-y-2.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">그림자 (Shadow)</p>
        <div className="grid grid-cols-3 gap-1">
          {([
            { v: "none", label: "없음"  }, { v: "sm", label: "약하게" }, { v: "md",   label: "중간"   },
            { v: "lg",   label: "강하게" }, { v: "xl", label: "매우강" }, { v: "glow", label: "글로우" },
          ] as const).map(s => (
            <button key={s.v} type="button" onClick={() => patch({ shadowPreset: s.v })}
              className={cn("h-7 rounded text-[11px] border transition-all",
                value.shadowPreset === s.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
              {s.label}
            </button>
          ))}
        </div>
        {value.shadowPreset !== "none" && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-8 shrink-0">색상</span>
            <input type="color" value={value.shadowColor || "#000000"} onChange={e => patch({ shadowColor: e.target.value })}
              className="w-8 h-7 rounded border border-border cursor-pointer p-0.5 shrink-0" />
            <div className="flex gap-1">
              {["#000000","#c9a85c","#ffffff","#2563eb","#dc2626"].map(c => (
                <div key={c} onClick={() => patch({ shadowColor: c })}
                  className="w-5 h-5 rounded cursor-pointer border border-border/60 shrink-0" style={{ background: c }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 섹션 다중 이미지 ───────────────────────────────────────────────────────
type SectionImageItem = { url: string; cfg?: string; caption?: string }

function parseSectionImages(raw?: string): SectionImageItem[] {
  try { const p = JSON.parse(raw || "[]"); if (Array.isArray(p)) return p } catch {}
  return []
}

function MultiImageUploader({
  value, onChange, disabled, label = "이미지",
}: {
  value?: string; onChange: (json: string) => void; disabled?: boolean; label?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const images = parseSectionImages(value)

  const patch = (idx: number, fields: Partial<SectionImageItem>) =>
    onChange(JSON.stringify(images.map((img, i) => i === idx ? { ...img, ...fields } : img)))

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    const url = URL.createObjectURL(file)
    onChange(JSON.stringify([...images, { url }]))
  }
  const removeImage = (idx: number) =>
    onChange(JSON.stringify(images.filter((_, i) => i !== idx)))

  return (
    <div className="space-y-6">
      {images.map((img, i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden">

          {/* ── 이미지 썸네일 ── */}
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="w-full h-28 object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="sm" variant="destructive" onClick={() => removeImage(i)}
                disabled={disabled} className="rounded-xl h-7 text-xs gap-1">
                <Trash2 className="h-3 w-3" />삭제
              </Button>
            </div>
          </div>

          {/* ── 캡션 에디터 ── */}
          <div className="border-t border-border bg-muted/20 px-2 py-1.5">
            <RichTextEditor
              mode="floating"
              value={img.caption ?? ""}
              onChange={(html) => patch(i, { caption: html })}
              disabled={disabled}
              minHeight={28}
              style={{ fontSize: "11px" }}
              placeholder="이미지 설명 (선택) — 이미지 하단 중앙에 표시됩니다"
            />
          </div>

          {/* ── 이미지 효과·위치 편집 ── */}
          <div className="border-t border-border p-3">
            <HeroImgCfgEditor
              value={parseHeroImgCfg(img.cfg)}
              onChange={(cfg) => patch(i, { cfg: JSON.stringify(cfg) })}
            />
          </div>

        </div>
      ))}

      {/* ── 이미지 추가 버튼 ── */}
      <div
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-5 text-center cursor-pointer hover:bg-muted/50 hover:border-primary/40 transition-all"
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onDragOver={(e) => e.preventDefault()}
      >
        <ImageIcon className="h-7 w-7 text-muted-foreground mb-2" />
        <p className="text-xs font-medium text-foreground">{label} 추가</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">클릭 또는 드래그 · JPG/WebP/PNG · 개수 제한 없음</p>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function InlineImagePicker({
  label,
  value,
  onChange,
  assets,
  disabled,
  hint,
}: {
  label: string
  value: string
  onChange: (id: string) => void
  assets: import("@/lib/treatment-store").TreatmentAsset[]
  disabled?: boolean
  hint?: string
}) {
  const imageAssets = assets.filter((a) => a.fileType === "image")
  const selected = imageAssets.find((a) => a.id === value)

  return (
    <div>
      <Label className="text-sm mb-2 block">{label}</Label>
      <div className="flex gap-3 items-start flex-wrap">
        {/* Selected preview */}
        <div
          className="relative h-20 w-20 rounded-xl border-2 overflow-hidden shrink-0 flex items-center justify-center bg-muted"
          style={{ borderColor: selected ? "var(--primary)" : undefined }}
        >
          {selected ? (
            <img src={selected.fileUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        {/* Grid of available images */}
        <div className="flex flex-wrap gap-1.5">
          {imageAssets.length === 0 && (
            <p className="text-xs text-muted-foreground self-center">자산 라이브러리에 이미지가 없습니다</p>
          )}
          {imageAssets.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(a.id)}
              className={cn(
                "h-14 w-14 rounded-lg border-2 overflow-hidden transition-all",
                value === a.id ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-muted-foreground/40"
              )}
            >
              <img src={a.fileUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          {/* Clear button */}
          {value && !disabled && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="h-14 w-14 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
              title="이미지 선택 해제"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

function TagInput({
  label,
  tags,
  onChange,
  placeholder = "입력 후 Enter 또는 쉼표",
  disabled = false,
}: {
  label: string
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [input, setInput] = useState("")

  function addTag(raw: string) {
    const val = raw.trim().replace(/,$/, "").trim()
    if (val && !tags.includes(val)) {
      onChange([...tags, val])
    }
    setInput("")
  }

  return (
    <div>
      <Label className="mb-1 block text-sm">{label}</Label>
      <div className="flex flex-wrap gap-1 rounded-md border bg-background p-2 min-h-[40px]">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs"
          >
            {t}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            className="flex-1 min-w-[120px] bg-transparent text-sm outline-none"
            value={input}
            placeholder={placeholder}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                addTag(input)
              } else if (e.key === "Backspace" && !input && tags.length > 0) {
                onChange(tags.slice(0, -1))
              }
            }}
            onBlur={() => { if (input.trim()) addTag(input) }}
          />
        )}
      </div>
    </div>
  )
}

function CharCountInput({
  label,
  value,
  onChange,
  max,
  required,
  placeholder,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  max: number
  required?: boolean
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        <span className={cn("text-xs", value.length > max ? "text-red-500" : "text-muted-foreground")}>
          {value.length}/{max}
        </span>
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(value.length > max && "border-red-400")}
      />
    </div>
  )
}

function CharCountTextarea({
  label,
  value,
  onChange,
  max,
  required,
  placeholder,
  disabled,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  max?: number
  required?: boolean
  placeholder?: string
  disabled?: boolean
  rows?: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        {max && (
          <span className={cn("text-xs", value.length > max ? "text-red-500" : "text-muted-foreground")}>
            {value.length}/{max}
          </span>
        )}
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(max && value.length > max && "border-red-400")}
      />
    </div>
  )
}

function OverrideBadge({
  fieldName,
  overriddenFields,
  onReset,
  disabled,
}: {
  fieldName: string
  overriddenFields: string[]
  onReset: () => void
  disabled?: boolean
}) {
  const isOverridden = overriddenFields.includes(fieldName)
  if (isOverridden) {
    return (
      <div className="flex items-center gap-1">
        <Badge className="bg-amber-100 text-amber-700 text-xs">지점 수정됨</Badge>
        {!disabled && (
          <button
            type="button"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground"
            title="본사 값으로 되돌리기"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }
  return <Badge className="bg-muted text-muted-foreground text-xs">본사 기본값</Badge>
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TreatmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const treatmentId = params.treatmentId as string

  const {
    getTreatment, updateProfile, updateExtras, getAllMasters,
    resetFieldToMaster, syncFromMaster, createTreatmentFromMaster,
    addProgram, updateProgram, deleteProgram, moveProgram,
    addPrecaution, updatePrecaution, deletePrecaution, movePrecaution,
    addAsset, updateAsset, deleteAsset, reorderAsset,
    getEffectiveAssets, toggleMasterAssetVisibility,
    addOverviewCard, updateOverviewCard, deleteOverviewCard, moveOverviewCard,
    addEffectCard, updateEffectCard, deleteEffectCard, moveEffectCard,
    addWhyTatoaCard, updateWhyTatoaCard, deleteWhyTatoaCard, moveWhyTatoaCard,
    addLandingSection, updateLandingSection, deleteLandingSection, moveLandingSection,
    addSourceMaterial, updateSourceMaterial, deleteSourceMaterial,
    addExtractionRun, addExtractionItems, updateExtractionItem, clearExtractionRun,
    addLandingSectionDraft, applyLandingSectionDraft, deleteLandingSectionDraft,
    createLandingPageDraft, updateLandingPageDraft,
  } = useTreatment()

  const { getRelationsFrom, addRelation, updateRelation, removeRelation, moveRelation } = useContentRelation()
  const { getPrimaryDomain, getUrlsForEquipment, addUrl, updateUrl, computeFullUrl, isSlugUnique } = useDomain()
  const { currentUser } = useSession()
  const { selectedBranch } = useBranch()
  const {
    getPendingDraft, setPendingDraft, discardPendingDraft, saveDraft,
    getLockedSectionIds, toggleSectionLock, isSectionLocked,
  } = useLandingDraft()
  const { getVariants, getPrimaryVariant } = useMedia()

  const canEdit = hasPermission(currentUser, "branch_equipment:update")
  const canUpload = canUploadAsset(currentUser)

  const treatmentData = getTreatment(treatmentId)
  const profile = treatmentData?.profile

  // ── Local state ──
  const [localForm, setLocalForm] = useState<Partial<TreatmentProfile>>({})
  const [localBenefits, setLocalBenefits] = useState<string[]>([])
  const [localTargets, setLocalTargets] = useState<string[]>([])
  const [localConcernAreas, setLocalConcernAreas] = useState<string[]>([])
  const [localKeywords, setLocalKeywords] = useState<string[]>([])
  const [localSpecialtyPoints, setLocalSpecialtyPoints] = useState<string[]>([])
  const [localCompanions, setLocalCompanions] = useState<string[]>([])
  // ── Effect cards & Why Tatoa state ──
  const [expandedEffectId, setExpandedEffectId] = useState<string | null>(null)
  const [editingEffect, setEditingEffect] = useState<Record<string, unknown>>({})
  const [showAddEffect, setShowAddEffect] = useState(false)
  const [newEffect, setNewEffect] = useState<{ title: string; description: string; icon: string }>({ title: "", description: "", icon: "" })

  const [expandedWhyTatoaId, setExpandedWhyTatoaId] = useState<string | null>(null)
  const [editingWhyTatoa, setEditingWhyTatoa] = useState<Record<string, unknown>>({})
  const [showAddWhyTatoa, setShowAddWhyTatoa] = useState(false)
  const [newWhyTatoa, setNewWhyTatoa] = useState<{ title: string; description: string }>({ title: "", description: "" })
  // ④ 효과 섹션 이미지 패널 토글 (기본값: 이미지 없음)
  const [showEffectsImagePanel, setShowEffectsImagePanel] = useState(false)
  // ⑦ 왜 타토아인가 섹션 이미지 패널 토글
  const [showWhyTatoaImagePanel, setShowWhyTatoaImagePanel] = useState(false)
  // ④ 효과 섹션 박스 세부 스타일 패널 토글
  const [showBoxStylePanel, setShowBoxStylePanel] = useState<"box" | "info" | null>(null)
  // ③ 그라데이션 빌더 로컬 상태
  const [boxGradFrom, setBoxGradFrom]   = useState("#c9a85c")
  const [boxGradTo, setBoxGradTo]       = useState("#5a3a1a")
  const [boxGradAngle, setBoxGradAngle] = useState(135)
  const [infoGradFrom, setInfoGradFrom] = useState("#c9a85c")
  const [infoGradTo, setInfoGradTo]     = useState("#5a3a1a")
  const [infoGradAngle, setInfoGradAngle] = useState(135)
  // ⑤ 장점 카드 세부 스타일 패널
  const [showAdvBoxPanel, setShowAdvBoxPanel] = useState(false)
  const [advGradFrom, setAdvGradFrom]   = useState("#ffffff")
  const [advGradTo, setAdvGradTo]       = useState("#f0f0f0")
  const [advGradAngle, setAdvGradAngle] = useState(135)
  // ⑥ 주의사항 카드 세부 스타일 패널
  const [showPrecBoxPanel, setShowPrecBoxPanel] = useState(false)
  const [precGradFrom, setPrecGradFrom] = useState("#ffffff")
  const [precGradTo, setPrecGradTo]     = useState("#f0f0f0")
  const [precGradAngle, setPrecGradAngle] = useState(135)
  // ⑦ 왜 타토아 카드 세부 스타일 패널
  const [showWtBoxPanel, setShowWtBoxPanel] = useState(false)
  const [wtGradFrom, setWtGradFrom]     = useState("#1a1a1a")
  const [wtGradTo, setWtGradTo]         = useState("#333333")
  const [wtGradAngle, setWtGradAngle]   = useState(135)
  // ⑦ 프라이싱 카드 세부 스타일 패널
  const [showPricingBoxPanel, setShowPricingBoxPanel] = useState(false)
  const [pricingGradFrom, setPricingGradFrom] = useState("#ffffff")
  const [pricingGradTo, setPricingGradTo]     = useState("#f0f0f0")
  const [pricingGradAngle, setPricingGradAngle] = useState(135)

  const [isDirty, setIsDirty] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<Record<string, unknown>>({})
  const [cardCustomOpen, setCardCustomOpen] = useState(false)
  const [previewTab, setPreviewTab] = useState("card")
  const [previewViewport, setPreviewViewport] = useState<"mobile" | "desktop">("mobile")

  // Section-specific UI state
  const [editingLandingSection, setEditingLandingSection] = useState<TreatmentLandingSection | null>(null)
  const [showAddProgram, setShowAddProgram] = useState(false)
  const [newProgram, setNewProgram] = useState<Partial<TreatmentProgram>>({})
  const [showAddSection, setShowAddSection] = useState(false)
  const [newSection, setNewSection] = useState<Partial<TreatmentLandingSection>>({})
  const [showAddRelation, setShowAddRelation] = useState(false)
  const [newRelation, setNewRelation] = useState<Record<string, unknown>>({})
  const [showAddUrl, setShowAddUrl] = useState(false)
  const [newUrl, setNewUrl] = useState<Record<string, unknown>>({})
  const [assetTab, setAssetTab] = useState<"hq_common" | "branch_specific">("hq_common")
  const [masterPickerOpen, setMasterPickerOpen] = useState(false)

  // Precaution state
  const [expandedPrecId, setExpandedPrecId] = useState<string | null>(null)
  const [editingPrec, setEditingPrec] = useState<Record<string, unknown>>({})
  const [showAddPrec, setShowAddPrec] = useState(false)
  const [newPrec, setNewPrec] = useState<{ type: TreatmentPrecautionType; content: string; isPublic: boolean }>({
    type: "before",
    content: "",
    isPublic: true,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── AI Landing Generation ──
  const [showAiModal, setShowAiModal] = useState(false)
  const [regenSectionId, setRegenSectionId] = useState<string | null>(null)
  const [regenLoading, setRegenLoading] = useState(false)
  const [showDraftPanel, setShowDraftPanel] = useState(false)

  // ── AI Extraction Pipeline ──
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [isDraftGenerating, setIsDraftGenerating] = useState<string | null>(null) // sectionType being generated

  // ── Section focus & AI fill ──
  const [focusedSectionKey, setFocusedSectionKey] = useState<string | null>(null)
  const [aiFillingSection, setAiFillingSection] = useState<string | null>(null)
  const [landingStructureExpanded, setLandingStructureExpanded] = useState(false)

  // ── Landing Page Draft ──
  const [isGeneratingLandingDraft, setIsGeneratingLandingDraft] = useState(false)
  const [landingDraftToast, setLandingDraftToast] = useState<{ type: "success" | "error" | "warn"; msg: string } | null>(null)
  const [landingValidationWarnings, setLandingValidationWarnings] = useState<string[]>([])

  // ── Image Style Editor ──
  const [editingStyleAsset, setEditingStyleAsset] = useState<TreatmentAsset | null>(null)

  // ── Reset state when treatmentId changes ──
  useEffect(() => {
    if (!treatmentData) return
    const p = treatmentData.profile
    setLocalForm({ ...p })
    setLocalBenefits([...treatmentData.benefits])
    setLocalTargets([...treatmentData.targets])
    setLocalConcernAreas([...treatmentData.concernAreas])
    setLocalKeywords([...treatmentData.keywords])
    setLocalSpecialtyPoints([...treatmentData.specialtyPoints])
    setLocalCompanions([...treatmentData.companionTreatments])
    setIsDirty(false)
    setIsSaved(false)
    setExpandedId(null)
    setEditingItem({})
    setEditingLandingSection(null)
    setShowAddProgram(false)
    setNewProgram({})
    setShowAddSection(false)
    setNewSection({})
    setShowAddRelation(false)
    setNewRelation({})
    setShowAddUrl(false)
    setNewUrl({})
    setExpandedPrecId(null)
    setEditingPrec({})
    setShowAddPrec(false)
    setNewPrec({ type: "before", content: "", isPublic: true })
    setExpandedEffectId(null)
    setEditingEffect({})
    setShowAddEffect(false)
    setNewEffect({ title: "", description: "", icon: "" })
    setExpandedWhyTatoaId(null)
    setEditingWhyTatoa({})
    setShowAddWhyTatoa(false)
    setNewWhyTatoa({ title: "", description: "" })
    setShowEffectsImagePanel(Boolean(p.effectsImageAssetId))
    setShowWhyTatoaImagePanel(Boolean(p.whyTatoaImageAssetId))
    setShowBoxStylePanel(null)
    // Restore gradient builder state from saved profile values
    // (parse gradient CSS if present, otherwise reset to defaults)
    const parseGrad = (bg: string | undefined, setFrom: (v: string) => void, setTo: (v: string) => void, setAngle: (v: number) => void) => {
      if (!bg || !bg.startsWith("linear-gradient")) return
      const angleMatch = bg.match(/(\d+)deg/)
      const colorMatches = [...bg.matchAll(/#[0-9a-fA-F]{3,8}/g)]
      if (angleMatch) setAngle(parseInt(angleMatch[1]))
      if (colorMatches[0]) setFrom(colorMatches[0][0])
      if (colorMatches[1]) setTo(colorMatches[1][0])
    }
    parseGrad(p.effectsBoxBg, setBoxGradFrom, setBoxGradTo, setBoxGradAngle)
    parseGrad(p.effectsInfoBg, setInfoGradFrom, setInfoGradTo, setInfoGradAngle)
  }, [treatmentId]) // eslint-disable-line react-hooks/exhaustive-deps

  const patchForm = useCallback((patch: Partial<TreatmentProfile>) => {
    setLocalForm((prev) => ({ ...prev, ...patch }))
    setIsDirty(true)
    setIsSaved(false)
  }, [])

  // ── SSR hydration guard ──
  // localStorage data is only available on the client. Return a consistent
  // skeleton on the first render so server HTML matches the client shell.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // ── 실시간 미리보기 브로드캐스트 ──
  // localForm + localSpecialtyPoints + localBenefits 변경 300ms 후 →
  // localStorage 기록 → BroadcastChannel 알림
  // /preview/landing/live/[treatmentId] iframe이 수신 후 즉시 갱신
  useEffect(() => {
    if (!mounted) return
    const timer = setTimeout(() => {
      try {
        // specialtyPoints와 benefits는 TreatmentData 영역이라 localForm에 없음.
        // __data__ 네임스페이스로 함께 직렬화해 live preview가 data override로 적용.
        localStorage.setItem(`lp_live_form_${treatmentId}`, JSON.stringify({
          ...localForm,
          __specialtyPoints: localSpecialtyPoints,
          __benefits: localBenefits,
          __precautions: treatmentData?.precautions ?? [],
          __whyTatoaCards: treatmentData?.whyTatoaCards ?? [],
          __programs: treatmentData?.programs ?? [],
        }))
        const bc = new BroadcastChannel(`lp_live_${treatmentId}`)
        bc.postMessage("update")
        bc.close()
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [localForm, localSpecialtyPoints, localBenefits, treatmentData?.precautions, treatmentData?.whyTatoaCards, treatmentData?.programs, treatmentId, mounted])

  if (!mounted) {
    return (
      <div className="flex gap-6 animate-pulse">
        <div className="flex-1 space-y-4">
          <div className="h-10 rounded-lg bg-muted" />
          <div className="h-48 rounded-lg bg-muted" />
          <div className="h-48 rounded-lg bg-muted" />
        </div>
        <div className="w-80 shrink-0 h-96 rounded-lg bg-muted" />
      </div>
    )
  }

  // ── Not found ──
  if (!treatmentData || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-80">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-center font-medium">시술을 찾을 수 없습니다</p>
            <Button variant="outline" onClick={() => router.push("/admin/branch/treatments")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const effectiveAssets = getEffectiveAssets(treatmentId)
  const relations = getRelationsFrom(treatmentId, "treatment")
  const domainUrls = getUrlsForEquipment(treatmentId)
  const primaryDomain = getPrimaryDomain(profile.branchId)
  const allMasters = getAllMasters()
  const overriddenFields = profile.override?.overriddenFields ?? []

  // ── Completeness score ──
  const reqFields = [
    !!localForm.name,
    !!localForm.category,
    !!localForm.oneLinePitch,
    !!localForm.shortDescription,
  ]
  const recFields = [
    !!localForm.longDescription,
    treatmentData.programs.length > 0,
    effectiveAssets.length > 0,
    localBenefits.length > 0,
    localKeywords.length > 0,
  ]
  const reqScore = reqFields.filter(Boolean).length * 15
  const recScore = recFields.filter(Boolean).length * 10
  const completenessRaw = reqScore + recScore
  const completenessMax = 4 * 15 + 5 * 10
  const completenessPercent = Math.min(100, Math.round((completenessRaw / completenessMax) * 100))
  const reqMissing = reqFields.filter((v) => !v).length
  const recMissing = recFields.filter((v) => !v).length

  const imageCount = effectiveAssets.filter((a) => a.fileType === "image").length
  const pdfCount = effectiveAssets.filter((a) => a.fileType === "pdf").length
  const videoCount = effectiveAssets.filter((a) => a.fileType === "video").length

  // ── Save handler ──
  function handleSave() {
    updateProfile(treatmentId, localForm)
    updateExtras(treatmentId, {
      benefits: localBenefits,
      targets: localTargets,
      concernAreas: localConcernAreas,
      keywords: localKeywords,
      specialtyPoints: localSpecialtyPoints,
      companionTreatments: localCompanions,
    })
    setIsDirty(false)
    setIsSaved(true)
    setLastSavedAt(new Date())
    setTimeout(() => setIsSaved(false), 3000)
  }

  // ── Landing Page Draft Handlers ──────────────────────────────────────────

  /** Build the merged profile/data for draft generation (uses local state, not just saved state) */
  function buildPreviewProfile(): import("@/lib/treatment-store").TreatmentProfile {
    return { ...(profile ?? {}), ...localForm } as import("@/lib/treatment-store").TreatmentProfile
  }

  function buildPreviewData() {
    if (!treatmentData) return null
    return {
      ...treatmentData,
      benefits:        localBenefits.length        ? localBenefits        : treatmentData.benefits,
      specialtyPoints: localSpecialtyPoints.length ? localSpecialtyPoints : treatmentData.specialtyPoints,
      targets:         localTargets.length         ? localTargets         : treatmentData.targets,
    }
  }

  async function handleCreateLandingDraft(regenerate = false) {
    if (!treatmentData || isGeneratingLandingDraft) return

    const previewProfile = buildPreviewProfile()
    const previewData    = buildPreviewData()!
    const { canBuild, errors, warnings } = validateLandingBuild(previewProfile, previewData)

    if (!canBuild) {
      setLandingDraftToast({ type: "error", msg: `랜딩 생성 불가: ${errors[0]}` })
      setTimeout(() => setLandingDraftToast(null), 6000)
      return
    }

    if (warnings.length) setLandingValidationWarnings(warnings)

    setIsGeneratingLandingDraft(true)
    setLandingDraftToast({ type: "warn", msg: "랜딩 초안을 생성하고 있습니다…" })

    try {
      const payload = buildLandingDraftPayload(
        previewProfile,
        previewData,
        effectiveAssets,
        {
          templateVariant: "full",
          branchId: selectedBranch ?? undefined,
          generationSource: "manual",
        }
      )

      const newDraft = createLandingPageDraft(treatmentId, payload)
      setLandingDraftToast({
        type: "success",
        msg: `${previewProfile.name} 랜딩 초안이 생성되었습니다.`,
      })
      // Switch to landing tab so preview refreshes
      setPreviewTab("landing")
      setTimeout(() => setLandingDraftToast(null), 5000)
      return newDraft
    } catch (e) {
      console.error(e)
      setLandingDraftToast({ type: "error", msg: "랜딩 생성에 실패했습니다. 데이터를 확인하세요." })
      setTimeout(() => setLandingDraftToast(null), 6000)
    } finally {
      setIsGeneratingLandingDraft(false)
    }
  }

  async function handleSaveLandingDraft() {
    if (!treatmentData) return
    const latest = getLatestLandingDraft(treatmentData)
    if (!latest) {
      // No draft yet — create one
      await handleCreateLandingDraft()
      return
    }
    const previewProfile = buildPreviewProfile()
    const previewData    = buildPreviewData()!
    const payload = buildLandingDraftPayload(previewProfile, previewData, effectiveAssets, {
      templateVariant: latest.templateVariant,
      branchId: latest.branchId,
    })
    updateLandingPageDraft(treatmentId, latest.id, { snapshotData: payload.snapshotData })
    setLandingDraftToast({ type: "success", msg: "랜딩 초안이 저장되었습니다." })
    setTimeout(() => setLandingDraftToast(null), 4000)
  }

  function handleOpenLandingPreview() {
    if (!treatmentData) return
    const latest = getLatestLandingDraft(treatmentData)
    if (!latest) {
      setLandingDraftToast({ type: "error", msg: "먼저 랜딩 초안을 생성하세요." })
      setTimeout(() => setLandingDraftToast(null), 4000)
      return
    }
    window.open(`/preview/landing/${latest.id}`, "_blank")
  }

  async function handleToggleLandingPublish() {
    if (!treatmentData) return
    const latest = getLatestLandingDraft(treatmentData)
    if (!latest) {
      setLandingDraftToast({ type: "error", msg: "먼저 랜딩 초안을 생성하세요." })
      setTimeout(() => setLandingDraftToast(null), 4000)
      return
    }
    const newStatus = latest.status === "published" ? "draft" : "published"
    updateLandingPageDraft(treatmentId, latest.id, {
      status: newStatus,
      publishedAt: newStatus === "published" ? new Date().toISOString() : undefined,
    })
    setLandingDraftToast({
      type: "success",
      msg: newStatus === "published" ? "랜딩이 공개 상태로 변경되었습니다." : "랜딩이 비공개로 변경되었습니다.",
    })
    setTimeout(() => setLandingDraftToast(null), 4000)
  }

  // ── AI Extraction Handler ──
  async function handleRunExtraction(includeWebSearch: boolean) {
    if (!treatmentData) return
    setIsExtracting(true)
    setExtractionError(null)
    try {
      const body = {
        treatment: {
          name: profile!.name,
          category: profile!.category,
          subcategory: profile!.subcategory,
          oneLinePitch: profile!.oneLinePitch,
          shortDescription: profile!.shortDescription,
          longDescription: profile!.longDescription,
          hookCopy: profile!.hookCopy,
          differentiationCopy: profile!.differentiationCopy,
          whyTatoaHeadline: profile!.whyTatoaHeadline,
          whyTatoaSummary: profile!.whyTatoaSummary,
          whyTatoaPhilosophy: profile!.whyTatoaPhilosophy,
          durationMinutes: profile!.durationMinutes,
          anesthesiaRequired: profile!.anesthesiaRequired,
          downtimeNote: profile!.downtimeNote,
          painLevel: profile!.painLevel,
          treatmentCycleGuide: profile!.treatmentCycleGuide,
          maintenancePeriod: profile!.maintenancePeriod,
          priceRegular: profile!.priceRegular,
          priceEvent: profile!.priceEvent,
          vatIncluded: profile!.vatIncluded,
          useConsultInquiry: profile!.useConsultInquiry,
          landingHeroPriceText: profile!.landingHeroPriceText,
        },
        benefits: treatmentData.benefits,
        targets: treatmentData.targets,
        concernAreas: treatmentData.concernAreas,
        keywords: treatmentData.keywords,
        specialtyPoints: treatmentData.specialtyPoints,
        effectCards: treatmentData.effectCards.map(c => ({ title: c.title, description: c.description, icon: c.icon })),
        whyTatoaCards: treatmentData.whyTatoaCards.map(c => ({ title: c.title, description: c.description })),
        programs: treatmentData.programs.map(p => ({ name: p.name, targetArea: p.targetArea, description: p.description, priceRegular: p.priceRegular, priceDiscount: p.priceDiscount, durationMinutes: p.durationMinutes })),
        precautions: treatmentData.precautions.map(p => ({ type: p.type, content: p.content })),
        sourceMaterials: treatmentData.sourceMaterials.map(m => ({ category: m.category, title: m.title, content: m.content, fileName: m.fileName, fileType: m.fileType, isPublic: m.isPublic })),
        connectedEquipment: [],
        connectedFaqs: [],
        includeWebSearch,
        webSearchTerms: [profile!.name, profile!.category, profile!.subcategory].filter(Boolean) as string[],
      }

      const res = await fetch("/api/treatments/ai-extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()

      if (!data.success) {
        setExtractionError(data.error ?? "추출 실패")
        return
      }

      // Register run
      const run = addExtractionRun(treatmentId, {
        treatmentId,
        runAt: new Date().toISOString(),
        status: "completed",
        itemCount: data.items.length,
        warnings: data.warnings ?? [],
        sourcesUsed: data.sourcesUsed ?? ["internal_data"],
        includeWebSearch,
      })

      // Add extracted items
      addExtractionItems(treatmentId, run.id, data.items.map((item: { category: string; content: string; source: string; confidence: string; sourceRef?: string; conflictWarning?: string; usedInLanding?: boolean; usedInChatbot?: boolean; usedInDescription?: boolean; sortOrder?: number }, i: number) => ({
        category: item.category,
        content: item.content,
        status: "pending" as const,
        source: item.source,
        confidence: item.confidence,
        sourceRef: item.sourceRef,
        conflictWarning: item.conflictWarning,
        usedInLanding: item.usedInLanding ?? true,
        usedInChatbot: item.usedInChatbot ?? false,
        usedInDescription: item.usedInDescription ?? false,
        sortOrder: item.sortOrder ?? i,
      })))
    } catch (e) {
      setExtractionError(e instanceof Error ? e.message : "네트워크 오류")
    } finally {
      setIsExtracting(false)
    }
  }

  // ── AI Section Fill — applies approved extraction items directly into form fields ──
  // This is the core of the "AI-first" workflow: AI fills form fields, not separate section blocks.
  function handleAIFillSection(sectionKey: string) {
    if (!treatmentData) return
    const approved = treatmentData.aiExtractions.filter(
      (i) => i.status === "approved" || i.status === "modified"
    )
    if (approved.length === 0) {
      alert("먼저 'AI 추출 결과' 섹션에서 항목을 승인해주세요.")
      return
    }

    // Helper: get content array for a given category
    const getContent = (cat: string): string[] =>
      approved
        .filter((i) => i.category === cat)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((i) => (i.modifiedContent ?? i.content).trim())
        .filter(Boolean)

    setAiFillingSection(sectionKey)

    try {
      switch (sectionKey) {
        case "A": {
          // CTA copy — price fields are facts, skip them; only suggest button labels
          const hooks = getContent("hook_copy")
          const fields: Partial<TreatmentProfile> = {}
          if (hooks.length > 0 && !localForm.ctaPrimaryLabel) fields.ctaPrimaryLabel = "상담 신청하기"
          if (hooks.length > 0 && !localForm.ctaSecondaryLabel) fields.ctaSecondaryLabel = "전화 문의"
          if (Object.keys(fields).length === 0) { alert("A섹션: CTA 버튼이 이미 입력되어 있습니다."); break }
          if (window.confirm("A섹션 CTA 버튼 문구를 기본값으로 채우시겠습니까?")) {
            patchForm(fields)
          }
          break
        }
        case "B": {
          const intros = getContent("treatment_intro")
          const hooks = getContent("hook_copy")
          const audiences = getContent("target_audience")
          const benefits = getContent("advantage")
          const fields: Partial<TreatmentProfile> = {}
          if (intros.length > 0) {
            fields.shortDescription = intros[0]
            if (intros.length > 1) fields.longDescription = intros.slice(0, 3).join("\n\n")
          }
          if (hooks.length > 0) fields.hookCopy = hooks[0]
          const hasData = Object.keys(fields).length > 0 || audiences.length > 0 || benefits.length > 0
          if (!hasData) { alert("B섹션: 채울 추출 항목이 없습니다. treatment_intro, hook_copy, advantage 카테고리 항목을 확인해주세요."); break }
          if (window.confirm(`B섹션 기본 정보에 AI 초안을 적용합니다.\n• 시술 소개: ${intros.length}개\n• 후킹 카피: ${hooks.length}개\n• 타겟: ${audiences.length}개\n• 혜택: ${benefits.length}개\n기존 내용이 있으면 덮어씁니다. 계속하시겠습니까?`)) {
            if (Object.keys(fields).length > 0) patchForm(fields)
            if (audiences.length > 0) {
              const newT = audiences.slice(0, 5).filter((a) => !localTargets.includes(a))
              if (newT.length > 0) { setLocalTargets((prev) => [...prev, ...newT]); setIsDirty(true) }
            }
            if (benefits.length > 0) {
              const newB = benefits.slice(0, 5).filter((b) => !localBenefits.includes(b))
              if (newB.length > 0) { setLocalBenefits((prev) => [...prev, ...newB]); setIsDirty(true) }
            }
          }
          break
        }
        case "C": {
          const effects = getContent("effect")
          const progress = getContent("progress")
          if (effects.length === 0 && progress.length === 0) { alert("C섹션: effect, progress 카테고리의 승인된 항목이 없습니다."); break }
          const msgs: string[] = []
          if (effects.length > 0) msgs.push(`효과 카드 ${effects.length}개 추가`)
          if (progress.length > 0 && !localForm.downtimeNote) msgs.push(`다운타임 안내 채우기`)
          if (window.confirm(`C섹션 시술 효과에 AI 초안을 적용합니다:\n• ${msgs.join("\n• ")}\n계속하시겠습니까?`)) {
            const baseOrder = treatmentData.effectCards.length
            effects.slice(0, 8).forEach((e, i) => {
              addEffectCard(treatmentId, {
                title: `효과 ${baseOrder + i + 1}`,
                description: e,
                sortOrder: baseOrder + i + 1,
              })
            })
            if (progress.length > 0 && !localForm.downtimeNote) patchForm({ downtimeNote: progress[0] })
          }
          break
        }
        case "D": {
          const advantages = getContent("advantage")
          const precautions = getContent("precaution")
          const contraindications = getContent("contraindication")
          if (advantages.length === 0 && precautions.length === 0) { alert("D섹션: advantage, precaution 카테고리의 승인된 항목이 없습니다."); break }
          const msgs: string[] = []
          if (advantages.length > 0) msgs.push(`장점 포인트 ${advantages.length}개 추가`)
          if (precautions.length > 0) msgs.push(`주의사항 ${precautions.length}개 추가`)
          if (contraindications.length > 0) msgs.push(`금기사항 ${contraindications.length}개 추가`)
          if (window.confirm(`D섹션 장점/주의사항에 AI 초안을 적용합니다:\n• ${msgs.join("\n• ")}\n계속하시겠습니까?`)) {
            if (advantages.length > 0) {
              const newPts = advantages.slice(0, 6).filter((a) => !localSpecialtyPoints.includes(a))
              if (newPts.length > 0) { setLocalSpecialtyPoints((prev) => [...prev, ...newPts]); setIsDirty(true) }
            }
            const basePrec = treatmentData.precautions.length
            precautions.slice(0, 6).forEach((p, i) => {
              addPrecaution(treatmentId, { type: "note", content: p, isPublic: true, sortOrder: basePrec + i + 1 })
            })
            contraindications.slice(0, 4).forEach((p, i) => {
              addPrecaution(treatmentId, { type: "contraindication", content: p, isPublic: true, sortOrder: basePrec + precautions.length + i + 1 })
            })
          }
          break
        }
        case "E": {
          const whyItems = getContent("why_tatoa")
          const warnings = getContent("data_warning")
          if (whyItems.length === 0) { alert("E섹션: why_tatoa 카테고리의 승인된 항목이 없습니다."); break }
          const msgs = [`Why Tatoa 카드 ${whyItems.length}개 추가`]
          if (!localForm.whyTatoaHeadline) msgs.push("헤드라인 초안 채우기")
          if (window.confirm(`E섹션 왜 타토아인가에 AI 초안을 적용합니다:\n• ${msgs.join("\n• ")}\n계속하시겠습니까?`)) {
            if (!localForm.whyTatoaHeadline) patchForm({ whyTatoaHeadline: "왜 타토아에서 해야 하는가" })
            const baseOrder = treatmentData.whyTatoaCards.length
            whyItems.slice(0, 5).forEach((w, i) => {
              addWhyTatoaCard(treatmentId, {
                title: `차별화 포인트 ${baseOrder + i + 1}`,
                description: w,
                sortOrder: baseOrder + i + 1,
              })
            })
            if (warnings.length > 0 && !localForm.whyTatoaSummary) {
              patchForm({ whyTatoaSummary: warnings[0] })
            }
          }
          break
        }
        default:
          break
      }
    } finally {
      setAiFillingSection(null)
    }
  }

  // ── Draft Section Generation ──
  async function handleGenerateSectionDraft(sectionType: LandingSectionType) {
    if (!treatmentData) return
    setIsDraftGenerating(sectionType)
    try {
      const approvedItems = treatmentData.aiExtractions.filter(
        i => i.status === "approved" || i.status === "modified"
      )

      const body = {
        sectionType,
        treatmentName: profile!.name,
        treatmentCategory: profile!.category,
        extractionItems: approvedItems.map(i => ({
          category: i.category,
          content: i.modifiedContent ?? i.content,
          source: i.source,
          confidence: i.confidence,
          sourceRef: i.sourceRef,
        })),
        factData: {
          priceText: profile!.landingHeroPriceText,
          durationMinutes: profile!.durationMinutes,
          anesthesiaRequired: profile!.anesthesiaRequired,
          downtimeNote: profile!.downtimeNote,
          ctaPrimaryLabel: profile!.ctaPrimaryLabel,
          ctaSecondaryLabel: profile!.ctaSecondaryLabel,
          bookingUrl: profile!.bookingUrl,
          programs: treatmentData.programs.map(p => ({ name: p.name, priceDiscount: p.priceDiscount, priceRegular: p.priceRegular })),
        },
        draftCount: 2,
        tone: "premium" as const,
      }

      const res = await fetch("/api/treatments/ai-draft-section", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()

      if (!data.success) return

      // Save drafts to store
      data.drafts.forEach((draft: { draftIndex: number; title?: string; subtitle?: string; body?: string; metadata?: Record<string, unknown>; sources?: string[]; warnings?: string[] }) => {
        addLandingSectionDraft(treatmentId, {
          sectionType,
          draftIndex: draft.draftIndex,
          title: draft.title,
          subtitle: draft.subtitle,
          body: draft.body,
          metadata: draft.metadata,
          status: "generated",
          sources: (draft.sources ?? []) as ("internal_data" | "uploaded_material" | "web_search" | "equipment_data")[],
          warnings: draft.warnings ?? [],
          isApplied: false,
          generatedAt: new Date().toISOString(),
        })
      })
    } finally {
      setIsDraftGenerating(null)
    }
  }

  // ── Template apply (PDF 기반 3가지 템플릿 변형) ──
  function applyPDFTemplate(variant: "full" | "compact" | "extended") {
    if (!treatmentData) return
    const VARIANT_LABELS = { full: "PDF 기본 (12블록)", compact: "PDF 축소형 (7블록)", extended: "PDF 확장형 (14블록)" }
    const templateMap = { full: TATOA_DEFAULT_TEMPLATE, compact: COMPACT_TEMPLATE, extended: EXTENDED_TEMPLATE }
    if (!window.confirm(`현재 모든 랜딩 섹션이 삭제되고 ${VARIANT_LABELS[variant]} 템플릿으로 교체됩니다. 계속하시겠습니까?`)) return
    const sections = [...treatmentData.landingSections]
    sections.forEach((s) => deleteLandingSection(treatmentId, s.id))
    templateMap[variant].forEach((block) => {
      addLandingSection(treatmentId, {
        sectionType: block.sectionType,
        title: block.defaultTitle,
        isVisible: block.required,
        sortOrder: block.sortOrder,
      })
    })
  }

  // ── Template apply (타토아 9-블록 기본 템플릿) — legacy alias ──
  function applyTatoaTemplate() { applyPDFTemplate("full") }

  // ── Template apply (legacy - custom type list) ──
  function applyTemplate(types: LandingSectionType[]) {
    if (!treatmentData) return
    if (!window.confirm("현재 모든 랜딩 섹션이 삭제되고 템플릿으로 교체됩니다. 계속하시겠습니까?")) return
    const sections = [...treatmentData.landingSections]
    sections.forEach((s) => deleteLandingSection(treatmentId, s.id))
    types.forEach((t, i) => {
      addLandingSection(treatmentId, {
        sectionType: t,
        title: getLandingSectionLabel(t),
        isVisible: true,
        sortOrder: i + 1,
      })
    })
  }

  // ── AI: Apply draft (respects locked sections) ──
  function handleApplyDraft(draft: LandingDraft) {
    if (!treatmentData) return
    const lockedIds = getLockedSectionIds(treatmentId)
    // Save current state as manual backup before replacing
    if (treatmentData.landingSections.length > 0) {
      saveDraft({
        treatmentId,
        source: "manual",
        label: `AI 적용 전 백업 (${new Date().getHours().toString().padStart(2,"0")}:${new Date().getMinutes().toString().padStart(2,"0")})`,
        sections: treatmentData.landingSections.map((s) => ({
          sectionType: s.sectionType,
          title: s.title,
          subtitle: s.subtitle,
          body: s.body,
          styleVariant: s.styleVariant,
          metadata: s.metadata,
          isVisible: s.isVisible,
          sortOrder: s.sortOrder,
        })),
      })
    }

    // Remove non-locked sections
    const sectionsToRemove = treatmentData.landingSections.filter((s) => !lockedIds.has(s.id))
    sectionsToRemove.forEach((s) => deleteLandingSection(treatmentId, s.id))

    // Add AI sections (skip types that are already locked)
    const lockedTypes = new Set(
      treatmentData.landingSections
        .filter((s) => lockedIds.has(s.id))
        .map((s) => s.sectionType)
    )
    const currentLockedCount = treatmentData.landingSections.filter((s) => lockedIds.has(s.id)).length
    draft.sections.forEach((s, i) => {
      if (!lockedTypes.has(s.sectionType)) {
        addLandingSection(treatmentId, {
          sectionType: s.sectionType,
          title: s.title,
          subtitle: s.subtitle,
          body: s.body,
          styleVariant: s.styleVariant,
          metadata: s.metadata,
          isVisible: s.isVisible,
          sortOrder: currentLockedCount + i + 1,
        })
      }
    })

    // Save this draft to history
    saveDraft({
      ...draft,
      source: "ai_generated",
    })
    setPendingDraft(treatmentId, null)
    setShowDraftPanel(false)
  }

  // ── AI: Set pending draft from modal ──
  function handleDraftReady(draft: LandingDraft) {
    setPendingDraft(treatmentId, draft)
    setShowDraftPanel(true)
  }

  // ── AI: Regenerate a single section ──
  async function handleRegenSection(sectionId: string) {
    if (!treatmentData || !profile) return
    const section = treatmentData.landingSections.find((s) => s.id === sectionId)
    if (!section) return
    setRegenSectionId(sectionId)
    setRegenLoading(true)

    try {
      const reqBody: AiRegenerateSectionRequest = {
        sectionType: section.sectionType,
        existingContent: {
          title: section.title,
          subtitle: section.subtitle,
          body: section.body,
          metadata: section.metadata,
        },
        treatment: {
          name: profile.name,
          category: profile.category,
          oneLinePitch: profile.oneLinePitch,
          shortDescription: profile.shortDescription,
          longDescription: profile.longDescription,
          landingHeadline: profile.landingHeadline,
          landingSubheadline: profile.landingSubheadline,
          differentiationCopy: profile.differentiationCopy,
          durationMinutes: profile.durationMinutes,
          painLevel: profile.painLevel,
          downtimeNote: profile.downtimeNote,
          priceRegular: profile.priceRegular,
          priceEvent: profile.priceEvent,
          useConsultInquiry: profile.useConsultInquiry,
        },
        benefits: treatmentData.benefits,
        targets: treatmentData.targets,
        concernAreas: treatmentData.concernAreas,
        specialtyPoints: treatmentData.specialtyPoints,
        programs: treatmentData.programs.map((p) => ({
          name: p.name,
          targetArea: p.targetArea,
          description: p.description,
          priceRegular: p.priceRegular,
          priceDiscount: p.priceDiscount,
          durationMinutes: p.durationMinutes,
        })),
        precautions: treatmentData.precautions.map((p) => ({
          type: p.type,
          content: p.content,
        })),
        connectedEquipment: [],
        connectedDoctors: [],
        connectedFaqs: [],
        tone: "premium",
      }

      const res = await fetch("/api/treatments/ai-generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      })
      const data = await res.json()
      if (data.success && data.section) {
        updateLandingSection(treatmentId, sectionId, {
          title: data.section.title,
          subtitle: data.section.subtitle,
          body: data.section.body,
          styleVariant: data.section.style_variant,
          metadata: data.section.metadata,
        })
      } else {
        alert(data.error ?? "섹션 재생성 중 오류가 발생했습니다.")
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.")
    } finally {
      setRegenSectionId(null)
      setRegenLoading(false)
    }
  }

  // ── File upload handler ──
  function handleFileUpload(files: FileList | null) {
    if (!files || !profile) return
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/")
      const isPdf = file.type === "application/pdf"
      const isVideo = file.type.startsWith("video/")
      if (isImage && file.size > 20 * 1024 * 1024) {
        alert(`${file.name}: 이미지는 최대 20MB까지 업로드 가능합니다.`)
        return
      }
      if (isPdf && file.size > 50 * 1024 * 1024) {
        alert(`${file.name}: PDF는 최대 50MB까지 업로드 가능합니다.`)
        return
      }
      if (isVideo && file.size > 300 * 1024 * 1024) {
        alert(`${file.name}: 영상은 최대 300MB까지 업로드 가능합니다.`)
        return
      }
      const fileType = isImage ? "image" : isPdf ? "pdf" : isVideo ? "video" : "other"
      const url = URL.createObjectURL(file)
      addAsset(treatmentId, {
        scope: "branch_specific",
        branchId: profile.branchId,
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: url,
        fileName: file.name,
        fileType,
        mimeType: file.type,
        assetType: isImage ? "랜딩이미지" : isPdf ? "설명PDF" : "홍보영상",
        fileSizeBytes: file.size,
        isFeatured: false,
        isPublic: true,
        useForHomepage: false,
        useForLanding: false,
        useForChatbot: false,
        sortOrder: effectiveAssets.length + 1,
      })
    })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── In-place asset upload from section editors ──
  function handleInlineAssetUpload(file: File): TreatmentAsset {
    if (!profile) throw new Error("No profile loaded")
    const isImage = file.type.startsWith("image/")
    const isPdf = file.type === "application/pdf"
    const isVideo = file.type.startsWith("video/")
    const fileType = isImage ? "image" : isPdf ? "pdf" : isVideo ? "video" : "other"
    const url = URL.createObjectURL(file)
    return addAsset(treatmentId, {
      scope: "branch_specific",
      branchId: profile.branchId,
      inheritedFromMaster: false,
      hiddenInBranch: false,
      fileUrl: url,
      fileName: file.name,
      fileType,
      mimeType: file.type,
      assetType: isImage ? "랜딩이미지" : isPdf ? "설명PDF" : "홍보영상",
      fileSizeBytes: file.size,
      isFeatured: false,
      isPublic: true,
      useForHomepage: false,
      useForLanding: true,
      useForChatbot: false,
      sortOrder: effectiveAssets.length + 1,
    })
  }

  const hqAssets = effectiveAssets.filter((a) => a.scope === "hq_common" || a.inheritedFromMaster)
  const branchAssets = effectiveAssets.filter((a) => a.scope === "branch_specific" && !a.inheritedFromMaster)
  const allImageAssets = effectiveAssets.filter((a) => a.fileType === "image")

  // Compute per-asset connection counts (channels + section bindings + card slot)
  const assetUsageMap = computeAssetUsageTags(effectiveAssets, treatmentData.landingSections)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-6">
      {/* ── Left column ── */}
      <div className="flex-1 min-w-0 max-w-3xl">

        {/* ── Header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/branch/treatments")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              목록
            </Button>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold truncate">{localForm.name || profile.name}</h1>
                <Badge className={cn("text-xs", STATUS_COLORS[profile.status] ?? "bg-gray-100 text-gray-700")}>
                  {STATUS_LABELS[profile.status] ?? profile.status}
                </Badge>
                {isDirty && (
                  <Badge className="bg-orange-100 text-orange-700 text-xs">
                    <Pencil className="h-3 w-3 mr-1" />
                    미저장 변경
                  </Badge>
                )}
                {isSaved && !isDirty && (
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    저장됨
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Featured star */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!canEdit}
                onClick={() => patchForm({ isFeatured: !localForm.isFeatured })}
                className={cn(localForm.isFeatured ? "text-yellow-500" : "text-muted-foreground")}
              >
                <Star className={cn("h-4 w-4", localForm.isFeatured && "fill-yellow-500")} />
              </Button>

              {/* ── Landing Draft Action Group ── */}
              {(() => {
                const latestDraft = treatmentData ? getLatestLandingDraft(treatmentData) : null
                const hasDraft = !!latestDraft
                const isPublished = latestDraft?.status === "published"
                return (
                  <div className="flex items-center gap-1.5 border-l pl-2 ml-1">
                    {/* 생성 / 다시 생성 */}
                    <Button
                      size="sm"
                      variant={hasDraft ? "outline" : "default"}
                      disabled={!canEdit || isGeneratingLandingDraft}
                      onClick={() => handleCreateLandingDraft()}
                      className={cn(
                        "text-xs",
                        !hasDraft && "bg-amber-600 hover:bg-amber-700 text-white border-amber-600",
                      )}
                    >
                      {isGeneratingLandingDraft ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : hasDraft ? (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      ) : (
                        <Wand2 className="h-3 w-3 mr-1" />
                      )}
                      {hasDraft ? "다시 생성" : "랜딩 초안 생성"}
                    </Button>

                    {/* 저장 */}
                    {hasDraft && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canEdit}
                        onClick={handleSaveLandingDraft}
                        className="text-xs"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        랜딩 저장
                      </Button>
                    )}

                    {/* 미리보기 열기 */}
                    {hasDraft && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleOpenLandingPreview}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        미리보기
                      </Button>
                    )}

                    {/* 공개 / 비공개 */}
                    {hasDraft && (
                      <Button
                        size="sm"
                        variant={isPublished ? "default" : "outline"}
                        disabled={!canEdit}
                        onClick={handleToggleLandingPublish}
                        className={cn(
                          "text-xs",
                          isPublished && "bg-green-600 hover:bg-green-700 text-white border-green-600",
                        )}
                      >
                        {isPublished ? (
                          <><Globe className="h-3 w-3 mr-1" />랜딩 공개</>
                        ) : (
                          <><EyeOff className="h-3 w-3 mr-1" />랜딩 비공개</>
                        )}
                      </Button>
                    )}
                  </div>
                )
              })()}

              {/* ── Toast notification ── */}
              {landingDraftToast && (
                <div className={cn(
                  "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border",
                  landingDraftToast.type === "success" && "bg-green-50 border-green-200 text-green-700",
                  landingDraftToast.type === "error"   && "bg-red-50 border-red-200 text-red-700",
                  landingDraftToast.type === "warn"    && "bg-amber-50 border-amber-200 text-amber-700",
                )}>
                  {landingDraftToast.type === "warn" && <RefreshCw className="h-3 w-3 animate-spin" />}
                  {landingDraftToast.type === "success" && <Check className="h-3 w-3" />}
                  {landingDraftToast.type === "error" && <AlertCircle className="h-3 w-3" />}
                  {landingDraftToast.msg}
                </div>
              )}

              {/* Divider */}
              <div className="border-l h-6 mx-1" />

              {/* Public toggle (treatment) */}
              <Button
                variant={localForm.isPublic ? "default" : "outline"}
                size="sm"
                disabled={!canEdit}
                onClick={() => patchForm({ isPublic: !localForm.isPublic })}
              >
                {localForm.isPublic ? (
                  <><Eye className="h-3 w-3 mr-1" />공개</>
                ) : (
                  <><EyeOff className="h-3 w-3 mr-1" />비공개</>
                )}
              </Button>
              {/* Save */}
              <Button size="sm" disabled={!canEdit || !isDirty} onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                저장
              </Button>
            </div>
          </div>
        </div>

        {/* ── Completeness bar ── */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="font-medium">완성도 {completenessPercent}%</span>
                {reqMissing > 0 && (
                  <span className="text-red-600 text-xs">필수 {reqMissing}개 누락</span>
                )}
                {recMissing > 0 && (
                  <span className="text-yellow-600 text-xs">권장 {recMissing}개 누락</span>
                )}
                {/* Landing draft status badge */}
                {(() => {
                  const latestDraft = getLatestLandingDraft(treatmentData)
                  if (!latestDraft) return (
                    <span className="text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">
                      랜딩 초안 없음
                    </span>
                  )
                  return (
                    <span className={cn(
                      "text-[10px] border rounded px-1.5 py-0.5",
                      latestDraft.status === "published"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    )}>
                      <Layout className="h-2.5 w-2.5 inline mr-0.5" />
                      랜딩 {latestDraft.status === "published" ? "공개중" : "초안"} · {new Date(latestDraft.updatedAt).toLocaleDateString("ko-KR")}
                    </span>
                  )
                })()}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {lastSavedAt && <span>마지막 저장 {formatTime(lastSavedAt)}</span>}
                <span><ImageIcon className="h-3 w-3 inline mr-0.5" />{imageCount}</span>
                <span><FileText className="h-3 w-3 inline mr-0.5" />{pdfCount}</span>
                <span><Video className="h-3 w-3 inline mr-0.5" />{videoCount}</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  completenessPercent >= 80 ? "bg-green-500" : completenessPercent >= 50 ? "bg-yellow-500" : "bg-red-400"
                )}
                style={{ width: `${completenessPercent}%` }}
              />
            </div>

            {/* Validation warnings (shown after failed build attempt with warnings) */}
            {landingValidationWarnings.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-medium text-amber-700 mb-1">랜딩 생성 경고 ({landingValidationWarnings.length})</p>
                    <ul className="space-y-0.5">
                      {landingValidationWarnings.map((w, i) => (
                        <li key={i} className="text-[10px] text-amber-600">· {w}</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setLandingValidationWarnings([])}
                      className="text-[10px] text-muted-foreground underline mt-1"
                    >닫기</button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════
            Section 0 — 원천 자료함
            AI 초안 생성의 기초 자료
        ══════════════════════════════════════════ */}
        <SectionCard
          title="0. 원천 자료함"
          action={
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] bg-slate-100 text-slate-600">AI 초안 입력 소스</Badge>
              <Badge variant="outline" className="text-[10px]">
                {treatmentData.sourceMaterials.length}개 자료
              </Badge>
            </div>
          }
        >
          <div className="mb-2 text-xs text-muted-foreground">
            업체 자료, 내부 문서, 참고 이미지, 기존 문구를 업로드하면 AI가 랜딩페이지 초안 생성을 위한 정보를 먼저 정리합니다.
          </div>
          <SourceMaterialsPanel
            treatmentId={treatmentId}
            materials={treatmentData.sourceMaterials}
            canEdit={canEdit}
            onAdd={(item) => addSourceMaterial(treatmentId, item)}
            onUpdate={(id, updates) => updateSourceMaterial(treatmentId, id, updates)}
            onDelete={(id) => deleteSourceMaterial(treatmentId, id)}
          />
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section AI — AI 추출 결과
            자료 기반 구조화 → 랜딩 초안 생성
        ══════════════════════════════════════════ */}
        <SectionCard
          title="AI. AI 추출 결과"
          action={
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] bg-gradient-to-r from-blue-500 to-indigo-500 text-white">AI-First</Badge>
              {treatmentData.aiExtractions.length > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {treatmentData.aiExtractions.filter(i => i.status === "approved" || i.status === "modified").length}/{treatmentData.aiExtractions.length} 승인
                </Badge>
              )}
            </div>
          }
        >
          <div className="mb-3 text-xs text-muted-foreground">
            업로드 자료와 연결 데이터를 바탕으로 AI가 랜딩페이지 작성에 필요한 핵심 정보를 구조화합니다. 각 항목을 검토·승인하면 섹션 초안이 자동 생성됩니다.
          </div>
          {extractionError && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {extractionError}
            </div>
          )}
          <AIExtractionPanel
            treatmentId={treatmentId}
            items={treatmentData.aiExtractions}
            runs={treatmentData.aiExtractionRuns}
            canEdit={canEdit}
            isExtracting={isExtracting}
            onExtract={handleRunExtraction}
            onUpdateItem={(id, updates) => updateExtractionItem(treatmentId, id, updates)}
            onClearRun={(runId) => clearExtractionRun(treatmentId, runId)}
          />
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section ① — 히어로
            → 랜딩 반영: ① hero_price_cta
        ══════════════════════════════════════════ */}
        <SectionCard
          title="① 히어로 — 시술명 · 가격 · 이미지 · CTA"
          landingNum="①"
          isFocused={focusedSectionKey === "A"}
          onFocus={() => { setFocusedSectionKey("A"); setPreviewTab("landing") }}
          action={
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] bg-purple-100 text-purple-700">→ 랜딩 히어로</Badge>
              {canEdit && (
                <button
                  onClick={() => handleAIFillSection("A")}
                  disabled={aiFillingSection === "A" || (treatmentData.aiExtractions.filter(i => i.status === "approved" || i.status === "modified").length === 0)}
                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-dashed border-primary/40 text-primary/60 hover:text-primary hover:border-primary disabled:opacity-30 transition-colors"
                  title="승인된 AI 추출 항목으로 CTA 초안 채우기"
                >
                  {aiFillingSection === "A" ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                  AI 초안
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4">

            {/* ── 시술 기본 정보 (랜딩 히어로에 직접 반영) ── */}

            {/* 시술명 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">시술명 <span className="text-red-500">*</span></Label>
                {profile.masterTreatmentId && (
                  <OverrideBadge
                    fieldName="name"
                    overriddenFields={overriddenFields}
                    onReset={() => resetFieldToMaster(treatmentId, "name")}
                    disabled={!canEdit}
                  />
                )}
              </div>
              <Input
                value={localForm.name ?? ""}
                onChange={(e) => patchForm({ name: e.target.value })}
                disabled={!canEdit}
              />
            </div>

            {/* 영문명 / 코드명 */}
            <div>
              <Label className="text-sm mb-1 block">영문명 / 코드명</Label>
              <Input
                value={localForm.englishName ?? ""}
                onChange={(e) => patchForm({ englishName: e.target.value })}
                disabled={!canEdit}
                placeholder="e.g. Ultherapy"
              />
            </div>

            {/* 카테고리 + 서브카테고리 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1 block">카테고리 <span className="text-red-500">*</span></Label>
                <Input
                  value={localForm.category ?? ""}
                  onChange={(e) => patchForm({ category: e.target.value })}
                  disabled={!canEdit}
                  placeholder="리프팅, 레이저..."
                />
                {canEdit && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {["리프팅","레이저","RF 리프팅","보톡스","필러","미세침 RF","피부관리","기타"].map((c) => (
                      <button key={c} type="button" onClick={() => patchForm({ category: c })}
                        className={cn("rounded px-2 py-0.5 text-xs border", localForm.category === c ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:text-foreground")}
                      >{c}</button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm mb-1 block">서브카테고리</Label>
                <Input
                  value={localForm.subcategory ?? ""}
                  onChange={(e) => patchForm({ subcategory: e.target.value })}
                  disabled={!canEdit}
                />
              </div>
            </div>

            {/* 한 줄 설명 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">한 줄 설명 <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-2">
                  {profile.masterTreatmentId && (
                    <OverrideBadge
                      fieldName="oneLinePitch"
                      overriddenFields={overriddenFields}
                      onReset={() => resetFieldToMaster(treatmentId, "oneLinePitch")}
                      disabled={!canEdit}
                    />
                  )}
                  <span className={cn("text-xs", (localForm.oneLinePitch?.length ?? 0) > 150 ? "text-red-500" : "text-muted-foreground")}>
                    {localForm.oneLinePitch?.length ?? 0}/150
                  </span>
                </div>
              </div>
              <Input
                value={localForm.oneLinePitch ?? ""}
                onChange={(e) => patchForm({ oneLinePitch: e.target.value })}
                disabled={!canEdit}
                placeholder="150자 이내 — 히어로 섹션 소개 문구"
                maxLength={150}
              />
            </div>

            {/* 카드 배지 */}
            <div>
              <Label className="text-sm mb-1 block">
                카드 배지{" "}
                <span className="text-muted-foreground text-xs font-normal">(히어로 이미지 상단 레이블)</span>
              </Label>
              <Input
                value={localForm.cardBadge ?? ""}
                onChange={(e) => patchForm({ cardBadge: e.target.value })}
                disabled={!canEdit}
                placeholder="NEW · 2025 SIGNATURE"
              />
            </div>

            {/* ── 구분선 ── */}
            <div className="border-t pt-1" />

            {/* 가격 */}
            <div className="flex flex-wrap gap-4 items-center pb-3 border-b">
              <div className="flex items-center gap-2">
                <Switch checked={!!localForm.useConsultInquiry} onCheckedChange={(v) => patchForm({ useConsultInquiry: v })} disabled={!canEdit} />
                <Label className="text-sm">가격 문의 방식</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!localForm.showPrice} onCheckedChange={(v) => patchForm({ showPrice: v })} disabled={!canEdit || !!localForm.useConsultInquiry} />
                <Label className="text-sm">가격 표시</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!localForm.vatIncluded} onCheckedChange={(v) => patchForm({ vatIncluded: v })} disabled={!canEdit} />
                <Label className="text-sm">VAT 포함</Label>
              </div>
            </div>
            {!localForm.useConsultInquiry && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm mb-1 block">정가 (원)</Label>
                  <Input type="number" value={localForm.priceRegular ?? ""} onChange={(e) => patchForm({ priceRegular: Number(e.target.value) })} disabled={!canEdit} />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">이벤트가 (원)</Label>
                  <Input type="number" value={localForm.priceEvent ?? ""} onChange={(e) => patchForm({ priceEvent: Number(e.target.value) })} disabled={!canEdit} />
                </div>
              </div>
            )}
            <div>
              <Label className="text-sm mb-1 block">랜딩 히어로 가격 표기</Label>
              <Input value={localForm.landingHeroPriceText ?? ""} onChange={(e) => patchForm({ landingHeroPriceText: e.target.value })} disabled={!canEdit} placeholder="예: 120만원~ / 상담 후 결정" />
              <p className="text-xs text-muted-foreground mt-0.5">히어로 섹션에 표시할 가격 텍스트 (자유 형식). 비워두면 정가/이벤트가에서 자동 생성됩니다.</p>
            </div>
            {/* CTA 버튼 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1 block">CTA 버튼 (주)</Label>
                <Input value={localForm.ctaPrimaryLabel ?? ""} onChange={(e) => patchForm({ ctaPrimaryLabel: e.target.value })} disabled={!canEdit} placeholder="상담 신청하기" />
              </div>
              <div>
                <Label className="text-sm mb-1 block">CTA 버튼 (부)</Label>
                <Input value={localForm.ctaSecondaryLabel ?? ""} onChange={(e) => patchForm({ ctaSecondaryLabel: e.target.value })} disabled={!canEdit} placeholder="전화 문의" />
              </div>
            </div>
            {/* 랜딩 페이지 & 예약 링크 */}
            <div className="space-y-2">
              <div>
                <Label className="text-sm mb-1 block">랜딩 페이지 공개 URL</Label>
                <Input value={localForm.landingPageUrl ?? ""} onChange={(e) => patchForm({ landingPageUrl: e.target.value })} disabled={!canEdit} placeholder="비워두면 미리보기 주소 자동 사용" />
                <p className="text-[11px] text-muted-foreground mt-1">배포 후 실제 주소를 입력하세요. 비우면 <code className="text-[10px] bg-muted px-1 rounded">/preview/landing/live/{"{id}"}</code> 가 자동으로 사용됩니다.</p>
              </div>
              <div>
                <Label className="text-sm mb-1 block">예약 URL</Label>
                <Input value={localForm.bookingUrl ?? ""} onChange={(e) => patchForm({ bookingUrl: e.target.value })} disabled={!canEdit} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm mb-1 block">전화 링크</Label>
                  <Input value={localForm.phoneUrl ?? ""} onChange={(e) => patchForm({ phoneUrl: e.target.value })} disabled={!canEdit} placeholder="tel:02-0000-0000" />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">카카오 링크</Label>
                  <Input value={localForm.kakaoUrl ?? ""} onChange={(e) => patchForm({ kakaoUrl: e.target.value })} disabled={!canEdit} placeholder="https://open.kakao.com/..." />
                </div>
              </div>
            </div>
            {/* 랜딩 배경 테마 */}
            <div>
              <Label className="text-sm mb-2 block">랜딩 배경 테마</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["light", "dark"] as const).map((t) => {
                  const isSelected = (localForm.landingTheme ?? "light") === t
                  const label    = t === "light" ? "화이트" : "블랙"
                  const sublabel = t === "light" ? "앰비언트 그레이 글로우" : "앰비언트 골드 글로우"
                  const previewBg   = t === "light" ? "#ffffff" : "#161410"
                  const glowTR   = t === "light"
                    ? "radial-gradient(ellipse 65% 55% at 88% 2%,  rgba(180,180,185,0.50) 0%, transparent 70%)"
                    : "radial-gradient(ellipse 65% 55% at 88% 2%,  rgba(201,168,92,0.40) 0%, transparent 70%)"
                  const glowBL   = t === "light"
                    ? "radial-gradient(ellipse 48% 42% at 10% 96%, rgba(155,158,165,0.40) 0%, transparent 68%)"
                    : "radial-gradient(ellipse 48% 42% at 10% 96%, rgba(170,130,55,0.30) 0%, transparent 68%)"
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => patchForm({ landingTheme: t })}
                      className={`relative overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${
                        isSelected
                          ? "border-primary shadow-md"
                          : "border-border hover:border-muted-foreground/40"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {/* 미니 프리뷰 */}
                      <div
                        className="relative h-14 w-full rounded-lg overflow-hidden mb-2.5"
                        style={{ backgroundColor: previewBg }}
                      >
                        <div className="absolute inset-0" style={{ background: glowTR }} />
                        <div className="absolute inset-0" style={{ background: glowBL }} />
                      </div>
                      <p className={`text-sm font-semibold ${t === "dark" ? "" : ""}`}>{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                          <svg className="h-2.5 w-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">랜딩 초안 재생성 시 적용됩니다.</p>
            </div>

            {/* 히어로 이미지 */}
            <div className="space-y-3">
              <Label className="text-sm block">히어로 이미지</Label>
              <HeroImageUploadZone
                dataUrl={localForm.heroImageUrl ?? ""}
                onUpload={(url) => patchForm({ heroImageUrl: url })}
                onClear={() => patchForm({ heroImageUrl: "" })}
              />
              {localForm.heroImageUrl && (
                <HeroImgCfgEditor
                  value={parseHeroImgCfg(localForm.heroImgCfg)}
                  onChange={(cfg) => patchForm({ heroImgCfg: JSON.stringify(cfg) })}
                />
              )}
              <p className="text-xs text-muted-foreground">랜딩 히어로 섹션에 표시되는 메인 이미지 · 클릭 또는 드래그로 업로드</p>
            </div>

            {/* 모바일 히어로 이미지 */}
            <div className="space-y-3">
              <Label className="text-sm block">모바일 히어로 이미지 <span className="text-muted-foreground font-normal">(선택)</span></Label>
              <HeroImageUploadZone
                dataUrl={localForm.mobileHeroImageUrl ?? ""}
                onUpload={(url) => patchForm({ mobileHeroImageUrl: url })}
                onClear={() => patchForm({ mobileHeroImageUrl: "" })}
              />
              {localForm.mobileHeroImageUrl && (
                <HeroImgCfgEditor
                  value={parseHeroImgCfg(localForm.mobileHeroImgCfg)}
                  onChange={(cfg) => patchForm({ mobileHeroImgCfg: JSON.stringify(cfg) })}
                />
              )}
              <p className="text-xs text-muted-foreground">모바일 전용. 비워두면 히어로 이미지가 사용됩니다</p>
            </div>
          </div>
        </SectionCard>


        {/* ══════════════════════════════════════════
            Section ② — 프로그램 & 가격
            → 랜딩 반영: ⑦ pricing_program_offer
        ══════════════════════════════════════════ */}
        <SectionCard
          title="② 프로그램 & 가격"
          landingNum="②"
          isFocused={focusedSectionKey === "F"}
          onFocus={() => { setFocusedSectionKey("F"); setPreviewTab("landing") }}
          action={
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] bg-yellow-100 text-yellow-700">→ 랜딩 ②</Badge>
              {canEdit && (
                <button
                  onClick={() => handleAIFillSection("F")}
                  disabled={aiFillingSection === "F" || (treatmentData.aiExtractions.filter(i => i.status === "approved" || i.status === "modified").length === 0)}
                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-dashed border-primary/40 text-primary/60 hover:text-primary hover:border-primary disabled:opacity-30 transition-colors"
                  title="승인된 AI 추출 항목으로 프로그램 초안 채우기"
                >
                  {aiFillingSection === "F" ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                  AI 초안
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4">

            {/* 영어 제목 (eyebrow) */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">영어 제목 (eyebrow)</Label>
              <RichTextEditor
                mode="floating"
                value={localForm.pricingEyebrow ?? ""}
                onChange={(html) => patchForm({ pricingEyebrow: html })}
                placeholder="Programs & Pricing"
                minHeight={36}
                disabled={!canEdit}
                style={{ fontSize: "12px" }}
              />
            </div>

            {/* 헤드라인 */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">헤드라인</Label>
              <RichTextEditor
                mode="floating"
                value={localForm.pricingHeadline ?? ""}
                onChange={(html) => patchForm({ pricingHeadline: html })}
                placeholder="단정한 가격, 정직한 설계"
                minHeight={36}
                disabled={!canEdit}
                style={{ fontSize: "12px" }}
              />
            </div>

            {/* 영어 시술명 */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">영어 시술명</Label>
              <RichTextEditor
                mode="floating"
                value={localForm.pricingEnName ?? ""}
                onChange={(html) => patchForm({ pricingEnName: html })}
                placeholder="e.g. Lifting & Contouring Program"
                minHeight={36}
                disabled={!canEdit}
                style={{ fontSize: "12px" }}
              />
            </div>

            {/* 상세 설명 */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">상세 설명</Label>
              <RichTextEditor
                mode="floating"
                value={localForm.pricingBody ?? ""}
                onChange={(html) => patchForm({ pricingBody: html })}
                placeholder="필요한 만큼 충분히, 그 이상은 권하지 않습니다."
                minHeight={60}
                disabled={!canEdit}
                style={{ fontSize: "12px" }}
              />
            </div>

            {/* 섹션 배경 테마 */}
            <div className="pt-3 border-t">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">섹션 배경</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["light", "dark"] as const).map((t) => {
                  const isSelected = (localForm.pricingTheme ?? "light") === t
                  const label    = t === "light" ? "화이트" : "블랙"
                  const sublabel = t === "light" ? "흰 배경" : "검정 배경"
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => patchForm({ pricingTheme: t })}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${
                        isSelected ? "border-primary" : "border-border hover:border-muted-foreground/40"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="h-8 w-full" style={{ background: t === "light" ? "#ffffff" : "#111111" }} />
                      <div className="px-2 py-1 bg-background">
                        <p className="text-xs font-medium leading-tight">{label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{sublabel}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                          <svg className="w-2 h-2" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 카드 박스 스타일 */}
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">카드 박스 스타일</p>
              <div className="grid grid-cols-5 gap-1.5">
                {([
                  { id: "default",       label: "글라스",        bg: "rgba(255,255,255,0.70)", border: "rgba(255,255,255,0.55)", shadow: "0 2px 20px rgba(0,0,0,0.06)" },
                  { id: "flat",          label: "플랫",          bg: "rgba(255,255,255,1)",    border: "rgba(0,0,0,0.08)",       shadow: "0 1px 4px rgba(0,0,0,0.06)" },
                  { id: "outline",       label: "아웃라인",      bg: "transparent",            border: "rgba(0,0,0,0.15)",       shadow: "none" },
                  { id: "glass-dark",    label: "다크 글라스",   bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.14)", shadow: "0 2px 20px rgba(0,0,0,0.35)" },
                  { id: "glass-gold",    label: "골드",          bg: "rgba(201,168,92,0.12)",  border: "rgba(201,168,92,0.28)",  shadow: "0 4px 16px rgba(201,168,92,0.18)" },
                  { id: "shadow-soft",   label: "소프트 쉐도우", bg: "rgba(255,255,255,0.98)", border: "transparent",           shadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" },
                  { id: "shadow-deep",   label: "딥 쉐도우",     bg: "rgba(255,255,255,1)",    border: "transparent",           shadow: "0 20px 60px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.10)" },
                  { id: "gradient-warm", label: "웜 그라데이션", bg: "linear-gradient(135deg, rgba(255,252,248,1) 0%, rgba(255,228,196,0.70) 100%)", border: "rgba(255,180,100,0.22)", shadow: "0 4px 20px rgba(255,150,80,0.12)" },
                  { id: "gradient-cool", label: "쿨 그라데이션", bg: "linear-gradient(135deg, rgba(240,249,255,1) 0%, rgba(206,238,255,0.80) 100%)", border: "rgba(100,180,255,0.22)", shadow: "0 4px 20px rgba(80,160,255,0.10)" },
                  { id: "gradient-rose", label: "로즈",          bg: "linear-gradient(135deg, rgba(255,245,248,1) 0%, rgba(255,212,226,0.75) 100%)", border: "rgba(255,140,170,0.22)", shadow: "0 4px 20px rgba(255,100,140,0.12)" },
                  { id: "neon-blue",     label: "네온 글로우",   bg: "rgba(240,248,255,0.85)", border: "rgba(80,160,255,0.55)",  shadow: "0 0 22px rgba(80,160,255,0.28), 0 0 8px rgba(80,160,255,0.16)" },
                  { id: "frosted",       label: "프로스티드",    bg: "rgba(255,255,255,0.38)", border: "rgba(255,255,255,0.75)", shadow: "0 8px 32px rgba(0,0,0,0.08)" },
                  { id: "inner-glow",    label: "인너 글로우",   bg: "rgba(255,255,255,0.96)", border: "rgba(190,170,255,0.38)", shadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 2px 20px rgba(180,150,255,0.18)" },
                ] as const).map((ps) => {
                  const sel = (localForm.pricingBoxPreset ?? "default") === ps.id
                  return (
                    <button
                      key={ps.id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => patchForm({ pricingBoxPreset: ps.id })}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        sel ? "border-primary" : "border-border hover:border-muted-foreground/40"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="h-10 w-full" style={{ background: ps.bg, border: `1px solid ${ps.border}`, boxShadow: ps.shadow }} />
                      <p className="text-[9px] text-center py-1 truncate px-1 leading-tight">{ps.label}</p>
                    </button>
                  )
                })}
              </div>
              {/* ⑦ 세부 박스 스타일 패널 */}
              <div className="flex items-center justify-between mt-2">
                <span />
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setShowPricingBoxPanel(!showPricingBoxPanel)}
                  className="text-[10px] text-primary hover:underline disabled:opacity-50"
                >
                  {showPricingBoxPanel ? "▲ 세부 설정 접기" : "▼ 세부 설정 열기"}
                </button>
              </div>
              {showPricingBoxPanel && (() => {
                const bgKey   = "pricingCardBg" as const
                const bdKey   = "pricingCardBorder" as const
                const shKey   = "pricingCardShadow" as const
                const blurKey = "pricingCardBlur" as const
                const radKey  = "pricingCardRadius" as const
                const curBg   = localForm[bgKey] as string | undefined
                const curBd   = localForm[bdKey] as string | undefined
                const curSh   = localForm[shKey] as string | undefined
                const curBlur = localForm[blurKey] as number | undefined
                const curRad  = localForm[radKey]  as number | undefined
                const isGradient = curBg?.startsWith("linear-gradient") ?? false
                const buildGrad = (f: string, t: string, a: number) => `linear-gradient(${a}deg, ${f} 0%, ${t} 100%)`
                const PRICINSHWS = [
                  { id: "none",    label: "없음",     css: "none" },
                  { id: "soft",    label: "부드럽게", css: "0 4px 20px rgba(0,0,0,0.18)" },
                  { id: "medium",  label: "보통",     css: "0 8px 32px rgba(0,0,0,0.30)" },
                  { id: "strong",  label: "강하게",   css: "0 12px 48px rgba(0,0,0,0.48), 0 2px 8px rgba(0,0,0,0.30)" },
                  { id: "glow-gold",   label: "골드 글로우",  css: "0 0 28px 4px rgba(201,168,92,0.45), 0 4px 16px rgba(201,168,92,0.25)" },
                  { id: "glow-teal",   label: "틸 글로우",    css: "0 0 28px 4px rgba(32,178,170,0.45), 0 4px 16px rgba(32,178,170,0.25)" },
                  { id: "glow-purple", label: "퍼플 글로우",  css: "0 0 28px 4px rgba(139,92,246,0.45), 0 4px 16px rgba(139,92,246,0.25)" },
                ]
                const matchedSh = PRICINSHWS.find(s => s.css === curSh)
                return (
                  <div className="mt-3 space-y-4 rounded-xl border bg-muted/30 p-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">배경</p>
                        <div className="flex gap-1">
                          <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: curBg?.startsWith("linear-gradient") ? "#ffffff" : (curBg ?? "#ffffff") } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${!isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"}`}>단색</button>
                          <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: buildGrad(pricingGradFrom, pricingGradTo, pricingGradAngle) } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"}`}>그라데이션</button>
                        </div>
                      </div>
                      {!isGradient ? (
                        <div className="flex items-center gap-2">
                          <input type="color" value={curBg && !curBg.startsWith("rgba") && !curBg.startsWith("linear") ? curBg : "#ffffff"} onChange={(e) => patchForm({ [bgKey]: e.target.value } as any)} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" />
                          <Input className="h-7 text-xs font-mono flex-1" value={curBg ?? ""} onChange={(e) => patchForm({ [bgKey]: e.target.value } as any)} disabled={!canEdit} placeholder="rgba(255,255,255,0.70) 또는 #ffffff" />
                          {curBg && <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: undefined } as any)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="color" value={pricingGradFrom} onChange={(e) => { setPricingGradFrom(e.target.value); patchForm({ [bgKey]: buildGrad(e.target.value, pricingGradTo, pricingGradAngle) } as any) }} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" title="시작 색상" />
                            <span className="text-muted-foreground text-xs">→</span>
                            <input type="color" value={pricingGradTo} onChange={(e) => { setPricingGradTo(e.target.value); patchForm({ [bgKey]: buildGrad(pricingGradFrom, e.target.value, pricingGradAngle) } as any) }} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" title="끝 색상" />
                            <div className="flex-1 h-6 rounded" style={{ background: buildGrad(pricingGradFrom, pricingGradTo, pricingGradAngle) }} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-[10px] text-muted-foreground whitespace-nowrap">각도 {pricingGradAngle}°</Label>
                            <input type="range" min={0} max={360} step={15} value={pricingGradAngle} onChange={(e) => { const v = Number(e.target.value); setPricingGradAngle(v); patchForm({ [bgKey]: buildGrad(pricingGradFrom, pricingGradTo, v) } as any) }} disabled={!canEdit} className="flex-1 accent-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">테두리</p>
                      <div className="flex items-center gap-2">
                        <input type="color" value={curBd && !curBd.startsWith("rgba") ? curBd : "#ffffff"} onChange={(e) => patchForm({ [bdKey]: e.target.value } as any)} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" />
                        <Input className="h-7 text-xs font-mono flex-1" value={curBd ?? ""} onChange={(e) => patchForm({ [bdKey]: e.target.value } as any)} disabled={!canEdit} placeholder="rgba(255,255,255,0.55)" />
                        {curBd && <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bdKey]: undefined } as any)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">쉐도우</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PRICINSHWS.map((sp) => {
                          const sel = matchedSh?.id === sp.id || (!curSh && sp.id === "none")
                          return <button key={sp.id} type="button" disabled={!canEdit} onClick={() => patchForm({ [shKey]: sp.css === "none" ? undefined : sp.css } as any)} className={`px-2.5 py-1 rounded-full border text-[10px] transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background hover:border-muted-foreground/40"} disabled:opacity-50`}>{sp.label}</button>
                        })}
                      </div>
                      {curSh && curSh !== "none" && <Input className="h-7 text-xs font-mono mt-2" value={curSh} onChange={(e) => patchForm({ [shKey]: e.target.value } as any)} disabled={!canEdit} placeholder="0 8px 32px rgba(0,0,0,0.30)" />}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">백드롭 블러</p>
                        <div className="flex flex-wrap gap-1">
                          {[{ id:"none", label:"없음", val:0 }, { id:"light", label:"약하게", val:8 }, { id:"medium", label:"보통", val:18 }, { id:"strong", label:"강하게", val:32 }].map((b) => {
                            const sel = b.val === 0 ? !curBlur : curBlur === b.val
                            return <button key={b.id} type="button" disabled={!canEdit} onClick={() => patchForm({ [blurKey]: b.val === 0 ? undefined : b.val } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"} disabled:opacity-50`}>{b.label}</button>
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">모서리</p>
                        <div className="flex flex-wrap gap-1">
                          {[{ id:"sharp", label:"각지게", val:8 }, { id:"medium", label:"보통", val:16 }, { id:"round", label:"둥글게", val:24 }, { id:"pill", label:"최대", val:40 }].map((r) => {
                            const sel = curRad == null ? r.val === 24 : curRad === r.val
                            return <button key={r.id} type="button" disabled={!canEdit} onClick={() => patchForm({ [radKey]: r.val } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"} disabled:opacity-50`}>{r.label}</button>
                          })}
                        </div>
                      </div>
                    </div>
                    <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: undefined, [bdKey]: undefined, [shKey]: undefined, [blurKey]: undefined, [radKey]: undefined } as any)} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors disabled:opacity-50">
                      <RotateCcw className="h-2.5 w-2.5" />세부 설정 초기화 (프리셋으로 복귀)
                    </button>
                  </div>
                )
              })()}
            </div>

            {/* 프로그램 목록 */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">프로그램 목록</Label>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddProgram(true)}>
                    <Plus className="h-3 w-3 mr-1" />프로그램 추가
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {[...treatmentData.programs].sort((a, b) => a.sortOrder - b.sortOrder).map((prog, idx, arr) => (
                  <div key={prog.id} className="border rounded-md overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                      <span className="flex-1 text-sm font-medium truncate">{prog.name}</span>
                      {prog.priceDiscount ? <span className="text-xs text-green-600">{formatKoreanPrice(prog.priceDiscount)}</span> : prog.priceRegular ? <span className="text-xs">{formatKoreanPrice(prog.priceRegular)}</span> : null}
                      <Badge className={cn("text-xs", prog.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>{prog.isPublic ? "공개" : "비공개"}</Badge>
                      <div className="flex items-center gap-1">
                        <button disabled={idx === 0 || !canEdit} onClick={() => moveProgram(treatmentId, prog.id, "up")} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                        <button disabled={idx === arr.length - 1 || !canEdit} onClick={() => moveProgram(treatmentId, prog.id, "down")} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                        <button onClick={() => { setExpandedId(expandedId === prog.id ? null : prog.id); setEditingItem({ ...prog }); setCardCustomOpen(false) }} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                        {canEdit && <button onClick={() => deleteProgram(treatmentId, prog.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>}
                      </div>
                    </div>
                    {expandedId === prog.id && (
                      <div className="p-3 space-y-3 border-t">
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-xs mb-1 block">프로그램명</Label><Input value={(editingItem.name as string) ?? ""} onChange={(e) => setEditingItem((p) => ({ ...p, name: e.target.value }))} disabled={!canEdit} className="h-8 text-xs" /></div>
                          <div><Label className="text-xs mb-1 block">태그 (예: BEST, 체험)</Label><Input value={(editingItem.note as string) ?? ""} onChange={(e) => setEditingItem((p) => ({ ...p, note: e.target.value }))} disabled={!canEdit} className="h-8 text-xs" placeholder="BEST" /></div>
                        </div>
                        {/* 프로그램명 텍스트 스타일 */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">프로그램명 텍스트 스타일</Label>
                          {/* 글씨체 */}
                          <div className="flex gap-1 flex-wrap">
                            {([
                              { key: "gothic",   label: "고딕",  css: "'Pretendard', 'Noto Sans KR', sans-serif" },
                              { key: "serif",    label: "명조",  css: "'Noto Serif KR', 'Georgia', serif" },
                              { key: "classic",  label: "클래식", css: "'Times New Roman', serif" },
                              { key: "mono",     label: "모노",  css: "'JetBrains Mono', 'Fira Code', monospace" },
                            ] as const).map((f) => {
                              const sel = (editingItem as any).nameFont === f.css
                              return (
                                <button key={f.key} type="button" disabled={!canEdit}
                                  onClick={() => setEditingItem((p) => ({ ...p, nameFont: sel ? undefined : f.css }))}
                                  className={`h-6 px-2 rounded text-[10px] border transition-colors ${sel ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"}`}
                                  style={{ fontFamily: f.css }}
                                >
                                  {f.label}
                                </button>
                              )
                            })}
                          </div>
                          {/* 크기 + 굵기 + 기울기 */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {/* 크기 */}
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">크기</span>
                              <button type="button" disabled={!canEdit} onClick={() => setEditingItem((p) => ({ ...p, nameSizePx: Math.max(8, ((p as any).nameSizePx ?? 17) - 1) }))} className="w-5 h-5 flex items-center justify-center rounded border border-border text-xs hover:bg-muted disabled:opacity-40">-</button>
                              <input
                                type="number" min={8} max={120} disabled={!canEdit}
                                value={(editingItem as any).nameSizePx ?? 17}
                                onChange={(e) => setEditingItem((p) => ({ ...p, nameSizePx: Number(e.target.value) || 17 }))}
                                className="w-10 h-5 text-center text-[10px] border border-border rounded bg-background"
                              />
                              <button type="button" disabled={!canEdit} onClick={() => setEditingItem((p) => ({ ...p, nameSizePx: Math.min(120, ((p as any).nameSizePx ?? 17) + 1) }))} className="w-5 h-5 flex items-center justify-center rounded border border-border text-xs hover:bg-muted disabled:opacity-40">+</button>
                              <span className="text-[10px] text-muted-foreground">px</span>
                            </div>
                            {/* 굵기 */}
                            <div className="flex gap-1">
                              {([
                                { v: "300", label: "Thin" },
                                { v: "400", label: "Reg" },
                                { v: "500", label: "Med" },
                                { v: "600", label: "SB" },
                                { v: "700", label: "Bold" },
                              ] as const).map((w) => {
                                const sel = (editingItem as any).nameWeight === w.v
                                return (
                                  <button key={w.v} type="button" disabled={!canEdit}
                                    onClick={() => setEditingItem((p) => ({ ...p, nameWeight: sel ? undefined : w.v }))}
                                    className={`h-5 px-1.5 rounded text-[9px] border transition-colors ${sel ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"}`}
                                    style={{ fontWeight: Number(w.v) }}
                                  >
                                    {w.label}
                                  </button>
                                )
                              })}
                            </div>
                            {/* 기울기 */}
                            <button type="button" disabled={!canEdit}
                              onClick={() => setEditingItem((p) => ({ ...p, nameItalic: !(p as any).nameItalic }))}
                              className={`h-5 w-5 rounded border text-[10px] font-bold italic transition-colors ${(editingItem as any).nameItalic ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"}`}
                            >
                              I
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-xs mb-1 block">적용 부위</Label><Input value={(editingItem.targetArea as string) ?? ""} onChange={(e) => setEditingItem((p) => ({ ...p, targetArea: e.target.value }))} disabled={!canEdit} className="h-8 text-xs" /></div>
                          <div><Label className="text-xs mb-1 block">시간(분)</Label><Input type="number" value={(editingItem.durationMinutes as number) ?? ""} onChange={(e) => setEditingItem((p) => ({ ...p, durationMinutes: Number(e.target.value) }))} disabled={!canEdit} className="h-8 text-xs" /></div>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">포함 항목 <span className="text-muted-foreground/60 font-normal">(줄바꿈으로 구분)</span></Label>
                          <RichTextEditor mode="floating" value={(editingItem.description as string) ?? ""} onChange={(html) => setEditingItem((p) => ({ ...p, description: html }))} disabled={!canEdit} minHeight={80} placeholder={"시그니처 리프팅 3회\n전담 의료진 1:1 케어\n프리미엄 사후 케어 패키지"} style={{ fontSize: "12px" }} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-xs mb-1 block">정가 (₩)</Label><Input type="number" value={(editingItem.priceRegular as number) ?? ""} onChange={(e) => setEditingItem((p) => ({ ...p, priceRegular: Number(e.target.value) }))} disabled={!canEdit} className="h-8 text-xs" /></div>
                          <div><Label className="text-xs mb-1 block">할인가 (₩)</Label><Input type="number" value={(editingItem.priceDiscount as number) ?? ""} onChange={(e) => setEditingItem((p) => ({ ...p, priceDiscount: Number(e.target.value) }))} disabled={!canEdit} className="h-8 text-xs" /></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2"><Switch checked={!!(editingItem.isPublic)} onCheckedChange={(v) => setEditingItem((p) => ({ ...p, isPublic: v }))} disabled={!canEdit} /><Label className="text-xs">공개</Label></div>
                          <div className="flex items-center gap-2"><Switch checked={!!(editingItem.vatIncluded)} onCheckedChange={(v) => setEditingItem((p) => ({ ...p, vatIncluded: v }))} disabled={!canEdit} /><Label className="text-xs">VAT포함</Label></div>
                          <div className="flex items-center gap-2"><Switch checked={!!(editingItem.highlight)} onCheckedChange={(v) => setEditingItem((p) => ({ ...p, highlight: v }))} disabled={!canEdit} /><Label className="text-xs">하이라이트</Label></div>
                        </div>
                        {/* 카드 CTA 버튼 */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs mb-1 block">CTA 버튼 문구</Label>
                            <Input className="h-8 text-xs" placeholder="예약 상담 신청" value={(editingItem as any).ctaLabel ?? ""} onChange={(e) => setEditingItem((p) => ({ ...p, ctaLabel: e.target.value || undefined }))} disabled={!canEdit} />
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">CTA 연결 링크</Label>
                            <Input className="h-8 text-xs font-mono" placeholder="https://..." value={(editingItem as any).ctaHref ?? ""} onChange={(e) => setEditingItem((p) => ({ ...p, ctaHref: e.target.value || undefined }))} disabled={!canEdit} />
                          </div>
                        </div>
                        {/* 카드 색상 프리셋 */}
                        <div>
                          <Label className="text-xs mb-1.5 block text-muted-foreground">카드 색상 <span className="font-normal">(미설정 시 섹션 공통 스타일 적용)</span></Label>
                          <div className="grid grid-cols-7 gap-1">
                            {([
                              { id: undefined,         label: "공통",          bg: "repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb 2px,#fff 2px,#fff 8px)" },
                              { id: "default",         label: "글라스",        bg: "rgba(255,255,255,0.70)" },
                              { id: "flat",            label: "플랫",          bg: "rgba(255,255,255,1)" },
                              { id: "glass-dark",      label: "다크",          bg: "rgba(30,30,30,0.85)" },
                              { id: "glass-gold",      label: "골드",          bg: "rgba(201,168,92,0.25)" },
                              { id: "gradient-warm",   label: "웜",            bg: "linear-gradient(135deg,rgba(255,252,248,1) 0%,rgba(255,228,196,0.70) 100%)" },
                              { id: "gradient-cool",   label: "쿨",            bg: "linear-gradient(135deg,rgba(240,249,255,1) 0%,rgba(206,238,255,0.80) 100%)" },
                              { id: "gradient-rose",   label: "로즈",          bg: "linear-gradient(135deg,rgba(255,245,248,1) 0%,rgba(255,212,226,0.75) 100%)" },
                              { id: "shadow-soft",     label: "소프트",        bg: "rgba(255,255,255,0.98)" },
                              { id: "outline",         label: "아웃라인",      bg: "transparent" },
                              { id: "frosted",         label: "프로스티드",    bg: "rgba(255,255,255,0.38)" },
                              { id: "inner-glow",      label: "인너글로우",    bg: "rgba(255,255,255,0.96)" },
                              { id: "neon-blue",       label: "네온",          bg: "rgba(240,248,255,0.85)" },
                            ] as const).map((ps) => {
                              const sel = (editingItem as any).cardPreset === ps.id
                              return (
                                <button key={String(ps.id)} type="button" disabled={!canEdit}
                                  onClick={() => setEditingItem((p) => ({ ...p, cardPreset: ps.id }))}
                                  title={ps.label}
                                  className={`rounded overflow-hidden border-2 transition-all ${sel ? "border-primary" : "border-border hover:border-muted-foreground/40"} disabled:opacity-50`}
                                >
                                  <div className="h-6 w-full" style={{ background: ps.bg, border: ps.id === "outline" ? "1px solid rgba(0,0,0,0.15)" : undefined }} />
                                  <p className="text-[8px] text-center py-0.5 truncate px-0.5 leading-tight">{ps.label}</p>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        {/* ── 카드 커스텀 스타일 ── */}
                        <div className="border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setCardCustomOpen((v) => !v)}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <span>카드 커스텀 스타일</span>
                            <span className="text-muted-foreground">{cardCustomOpen ? "▲" : "▼"}</span>
                          </button>
                          {cardCustomOpen && (
                            <div className="p-3 space-y-4">
                              {/* 배경 */}
                              <div className="space-y-2">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">배경</Label>
                                <div className="flex gap-1 flex-wrap">
                                  {(["preset","solid","gradient","transparent"] as const).map((m) => {
                                    const labels = { preset: "프리셋", solid: "단색", gradient: "그라데이션", transparent: "투명" }
                                    const sel = ((editingItem as any).cardBgMode ?? "preset") === m
                                    return (
                                      <button key={m} type="button" disabled={!canEdit}
                                        onClick={() => setEditingItem((p) => ({ ...p, cardBgMode: m }))}
                                        className={`h-6 px-2 rounded text-[10px] border transition-colors ${sel ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"}`}
                                      >{labels[m]}</button>
                                    )
                                  })}
                                </div>
                                {(editingItem as any).cardBgMode === "solid" || (editingItem as any).cardBgMode === "gradient" ? (
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-muted-foreground">{(editingItem as any).cardBgMode === "gradient" ? "시작색" : "색상"}</span>
                                      <input type="color" value={(editingItem as any).cardBgHex ?? "#ffffff"} disabled={!canEdit}
                                        onChange={(e) => setEditingItem((p) => ({ ...p, cardBgHex: e.target.value }))}
                                        className="h-6 w-6 rounded cursor-pointer border border-border" />
                                    </div>
                                    {(editingItem as any).cardBgMode === "gradient" && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-muted-foreground">끝색</span>
                                        <input type="color" value={(editingItem as any).cardBgHex2 ?? "#e0e0ff"} disabled={!canEdit}
                                          onChange={(e) => setEditingItem((p) => ({ ...p, cardBgHex2: e.target.value }))}
                                          className="h-6 w-6 rounded cursor-pointer border border-border" />
                                        <div className="flex gap-1">
                                          {(["135deg","to right","to bottom","225deg"] as const).map((d) => {
                                            const dlabels: Record<string, string> = { "135deg": "↘", "to right": "→", "to bottom": "↓", "225deg": "↙" }
                                            const sel2 = ((editingItem as any).cardBgGradDir ?? "135deg") === d
                                            return (
                                              <button key={d} type="button" disabled={!canEdit}
                                                onClick={() => setEditingItem((p) => ({ ...p, cardBgGradDir: d }))}
                                                className={`h-6 w-6 rounded text-[11px] border transition-colors ${sel2 ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"}`}
                                              >{dlabels[d]}</button>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-muted-foreground">투명도</span>
                                      <div className="flex gap-0.5">
                                        {([20,40,60,80,100] as const).map((op) => {
                                          const sel3 = ((editingItem as any).cardBgOpacity ?? 85) === op
                                          return (
                                            <button key={op} type="button" disabled={!canEdit}
                                              onClick={() => setEditingItem((p) => ({ ...p, cardBgOpacity: op }))}
                                              className={`h-5 px-1 rounded text-[9px] border transition-colors ${sel3 ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"}`}
                                            >{op}%</button>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              {/* 테두리 */}
                              <div className="space-y-2">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">테두리</Label>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div className="flex gap-1">
                                    {([false, true] as const).map((on) => {
                                      const sel = ((editingItem as any).cardBorderOn ?? false) === on
                                      return (
                                        <button key={String(on)} type="button" disabled={!canEdit}
                                          onClick={() => setEditingItem((p) => ({ ...p, cardBorderOn: on }))}
                                          className={`h-6 px-2 rounded text-[10px] border transition-colors ${sel ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"}`}
                                        >{on ? "켜기" : "끄기"}</button>
                                      )
                                    })}
                                  </div>
                                  {(editingItem as any).cardBorderOn && (
                                    <>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-muted-foreground">색상</span>
                                        <input type="color" value={(editingItem as any).cardBorderHex ?? "#cccccc"} disabled={!canEdit}
                                          onChange={(e) => setEditingItem((p) => ({ ...p, cardBorderHex: e.target.value }))}
                                          className="h-6 w-6 rounded cursor-pointer border border-border" />
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-muted-foreground">두께</span>
                                        {([1,2,3] as const).map((w) => {
                                          const sel = ((editingItem as any).cardBorderW ?? 1) === w
                                          return (
                                            <button key={w} type="button" disabled={!canEdit}
                                              onClick={() => setEditingItem((p) => ({ ...p, cardBorderW: w }))}
                                              className={`h-5 w-7 rounded text-[9px] border transition-colors ${sel ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"}`}
                                            >{w}px</button>
                                          )
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* 그림자 */}
                              <div className="space-y-2">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">그림자</Label>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div className="flex gap-1">
                                    {(["none","soft","deep","neon"] as const).map((m) => {
                                      const slabels = { none: "없음", soft: "소프트", deep: "딥", neon: "네온" }
                                      const sel = ((editingItem as any).cardShadowMode ?? "none") === m
                                      return (
                                        <button key={m} type="button" disabled={!canEdit}
                                          onClick={() => setEditingItem((p) => ({ ...p, cardShadowMode: m }))}
                                          className={`h-6 px-2 rounded text-[10px] border transition-colors ${sel ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"}`}
                                        >{slabels[m]}</button>
                                      )
                                    })}
                                  </div>
                                  {(editingItem as any).cardShadowMode && (editingItem as any).cardShadowMode !== "none" && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-muted-foreground">색상</span>
                                      <input type="color" value={(editingItem as any).cardShadowHex ?? "#4080ff"} disabled={!canEdit}
                                        onChange={(e) => setEditingItem((p) => ({ ...p, cardShadowHex: e.target.value }))}
                                        className="h-6 w-6 rounded cursor-pointer border border-border" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 블러 / 반경 */}
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-muted-foreground">블러</span>
                                  <input type="number" min={0} max={60} disabled={!canEdit}
                                    value={(editingItem as any).cardBlur ?? ""}
                                    placeholder="0"
                                    onChange={(e) => setEditingItem((p) => ({ ...p, cardBlur: e.target.value ? Number(e.target.value) : undefined }))}
                                    className="w-12 h-6 text-center text-[10px] border border-border rounded bg-background" />
                                  <span className="text-[10px] text-muted-foreground">px</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-muted-foreground">반경</span>
                                  <input type="number" min={0} max={60} disabled={!canEdit}
                                    value={(editingItem as any).cardRadius ?? ""}
                                    placeholder="20"
                                    onChange={(e) => setEditingItem((p) => ({ ...p, cardRadius: e.target.value ? Number(e.target.value) : undefined }))}
                                    className="w-12 h-6 text-center text-[10px] border border-border rounded bg-background" />
                                  <span className="text-[10px] text-muted-foreground">px</span>
                                </div>
                              </div>

                              {/* 가격 색상 */}
                              <div className="flex items-center gap-2">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">가격 색상</Label>
                                <input type="color" value={(editingItem as any).priceColor ?? "#1a1a1a"} disabled={!canEdit}
                                  onChange={(e) => setEditingItem((p) => ({ ...p, priceColor: e.target.value }))}
                                  className="h-6 w-6 rounded cursor-pointer border border-border" />
                                {(editingItem as any).priceColor && (
                                  <button type="button" disabled={!canEdit}
                                    onClick={() => setEditingItem((p) => ({ ...p, priceColor: undefined }))}
                                    className="h-5 px-1.5 rounded text-[9px] border border-border bg-background hover:bg-muted"
                                  >초기화</button>
                                )}
                              </div>

                              {/* 커스텀 전체 초기화 */}
                              <button type="button" disabled={!canEdit}
                                onClick={() => setEditingItem((p) => ({
                                  ...p,
                                  cardBgMode: undefined, cardBgHex: undefined, cardBgHex2: undefined,
                                  cardBgOpacity: undefined, cardBgGradDir: undefined,
                                  cardBorderOn: undefined, cardBorderHex: undefined, cardBorderW: undefined,
                                  cardShadowMode: undefined, cardShadowHex: undefined,
                                  cardBlur: undefined, cardRadius: undefined, priceColor: undefined,
                                }))}
                                className="text-[10px] text-red-400 hover:text-red-600 disabled:opacity-40"
                              >
                                커스텀 스타일 전체 초기화
                              </button>
                            </div>
                          )}
                        </div>

                        {canEdit && (
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7 text-xs" onClick={() => { updateProgram(treatmentId, prog.id, editingItem as Partial<TreatmentProgram>); setExpandedId(null) }}>저장</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpandedId(null)}>취소</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {treatmentData.programs.length === 0 && <p className="text-sm text-muted-foreground py-3 text-center">등록된 프로그램이 없습니다.</p>}
              </div>
              {showAddProgram && (
                <div className="border rounded-md p-3 mt-2 space-y-2 bg-muted/20">
                  <p className="text-xs font-medium">새 프로그램</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs mb-1 block">프로그램명 *</Label><Input className="h-8 text-xs" value={(newProgram.name as string) ?? ""} onChange={(e) => setNewProgram((p) => ({ ...p, name: e.target.value }))} /></div>
                    <div><Label className="text-xs mb-1 block">태그 (예: BEST)</Label><Input className="h-8 text-xs" value={(newProgram.note as string) ?? ""} onChange={(e) => setNewProgram((p) => ({ ...p, note: e.target.value }))} placeholder="BEST" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs mb-1 block">적용 부위</Label><Input className="h-8 text-xs" value={(newProgram.targetArea as string) ?? ""} onChange={(e) => setNewProgram((p) => ({ ...p, targetArea: e.target.value }))} /></div>
                    <div><Label className="text-xs mb-1 block">시간(분)</Label><Input className="h-8 text-xs" type="number" value={(newProgram.durationMinutes as number) ?? ""} onChange={(e) => setNewProgram((p) => ({ ...p, durationMinutes: Number(e.target.value) }))} /></div>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">포함 항목 <span className="text-muted-foreground/60 font-normal">(줄바꿈으로 구분)</span></Label>
                    <RichTextEditor mode="floating" value={(newProgram.description as string) ?? ""} onChange={(html) => setNewProgram((p) => ({ ...p, description: html }))} minHeight={80} placeholder={"시그니처 리프팅 1회\n전담 상담\n기본 사후 케어"} style={{ fontSize: "12px" }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs mb-1 block">정가 (₩)</Label><Input className="h-8 text-xs" type="number" value={(newProgram.priceRegular as number) ?? ""} onChange={(e) => setNewProgram((p) => ({ ...p, priceRegular: Number(e.target.value) }))} /></div>
                    <div><Label className="text-xs mb-1 block">할인가 (₩)</Label><Input className="h-8 text-xs" type="number" value={(newProgram.priceDiscount as number) ?? ""} onChange={(e) => setNewProgram((p) => ({ ...p, priceDiscount: Number(e.target.value) }))} /></div>
                  </div>
                  {/* 카드 CTA 버튼 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs mb-1 block">CTA 버튼 문구</Label>
                      <Input className="h-8 text-xs" placeholder="예약 상담 신청" value={(newProgram as any).ctaLabel ?? ""} onChange={(e) => setNewProgram((p) => ({ ...p, ctaLabel: e.target.value || undefined }))} />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">CTA 연결 링크</Label>
                      <Input className="h-8 text-xs font-mono" placeholder="https://..." value={(newProgram as any).ctaHref ?? ""} onChange={(e) => setNewProgram((p) => ({ ...p, ctaHref: e.target.value || undefined }))} />
                    </div>
                  </div>
                  {/* 카드 색상 + 하이라이트 */}
                  <div>
                    <Label className="text-xs mb-1.5 block text-muted-foreground">카드 색상 <span className="font-normal">(미설정 시 섹션 공통 스타일)</span></Label>
                    <div className="grid grid-cols-7 gap-1">
                      {([
                        { id: undefined,         label: "공통",        bg: "repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb 2px,#fff 2px,#fff 8px)" },
                        { id: "default",         label: "글라스",      bg: "rgba(255,255,255,0.70)" },
                        { id: "flat",            label: "플랫",        bg: "rgba(255,255,255,1)" },
                        { id: "glass-dark",      label: "다크",        bg: "rgba(30,30,30,0.85)" },
                        { id: "glass-gold",      label: "골드",        bg: "rgba(201,168,92,0.25)" },
                        { id: "gradient-warm",   label: "웜",          bg: "linear-gradient(135deg,rgba(255,252,248,1) 0%,rgba(255,228,196,0.70) 100%)" },
                        { id: "gradient-cool",   label: "쿨",          bg: "linear-gradient(135deg,rgba(240,249,255,1) 0%,rgba(206,238,255,0.80) 100%)" },
                        { id: "gradient-rose",   label: "로즈",        bg: "linear-gradient(135deg,rgba(255,245,248,1) 0%,rgba(255,212,226,0.75) 100%)" },
                        { id: "shadow-soft",     label: "소프트",      bg: "rgba(255,255,255,0.98)" },
                        { id: "outline",         label: "아웃라인",    bg: "transparent" },
                        { id: "frosted",         label: "프로스티드",  bg: "rgba(255,255,255,0.38)" },
                        { id: "inner-glow",      label: "인너글로우",  bg: "rgba(255,255,255,0.96)" },
                        { id: "neon-blue",       label: "네온",        bg: "rgba(240,248,255,0.85)" },
                      ] as const).map((ps) => {
                        const sel = (newProgram as any).cardPreset === ps.id
                        return (
                          <button key={String(ps.id)} type="button"
                            onClick={() => setNewProgram((p) => ({ ...p, cardPreset: ps.id }))}
                            title={ps.label}
                            className={`rounded overflow-hidden border-2 transition-all ${sel ? "border-primary" : "border-border hover:border-muted-foreground/40"}`}
                          >
                            <div className="h-5 w-full" style={{ background: ps.bg, border: ps.id === "outline" ? "1px solid rgba(0,0,0,0.15)" : undefined }} />
                            <p className="text-[8px] text-center py-0.5 truncate px-0.5 leading-tight">{ps.label}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={!!(newProgram as any).highlight} onCheckedChange={(v) => setNewProgram((p) => ({ ...p, highlight: v }))} />
                    <Label className="text-xs">하이라이트 카드 (어두운 강조 배경)</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={() => {
                      if (!newProgram.name) return
                      addProgram(treatmentId, {
                        branchId: profile.branchId,
                        name: newProgram.name as string,
                        note: newProgram.note as string | undefined,
                        targetArea: newProgram.targetArea as string | undefined,
                        description: newProgram.description as string | undefined,
                        priceRegular: newProgram.priceRegular as number | undefined,
                        priceDiscount: newProgram.priceDiscount as number | undefined,
                        vatIncluded: true,
                        durationMinutes: newProgram.durationMinutes as number | undefined,
                        sortOrder: treatmentData.programs.length + 1,
                        isPublic: true,
                        cardPreset: (newProgram as any).cardPreset,
                        highlight: (newProgram as any).highlight ?? false,
                        ctaLabel: (newProgram as any).ctaLabel,
                        ctaHref: (newProgram as any).ctaHref,
                      })
                      setNewProgram({})
                      setShowAddProgram(false)
                    }}>추가</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowAddProgram(false); setNewProgram({}) }}>취소</Button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t">
              <TagInput label="병행 추천 시술" tags={localCompanions} onChange={(v) => { setLocalCompanions(v); setIsDirty(true) }} disabled={!canEdit} placeholder="시술 ID 또는 이름 입력" />
            </div>
          </div>
        </SectionCard>
        {/* ══════════════════════════════════════════
            Section ③ — 소개
            → 랜딩 반영: ② treatment_intro
        ══════════════════════════════════════════ */}
        <SectionCard
          title="③ 소개 — 헤드라인 · 상세 설명"
          landingNum="③"
          isFocused={focusedSectionKey === "B"}
          onFocus={() => { setFocusedSectionKey("B"); setPreviewTab("landing") }}
          action={
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] bg-blue-100 text-blue-700">→ 랜딩 소개</Badge>
              {canEdit && (
                <button
                  onClick={() => handleAIFillSection("B")}
                  disabled={aiFillingSection === "B" || (treatmentData.aiExtractions.filter(i => i.status === "approved" || i.status === "modified").length === 0)}
                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-dashed border-primary/40 text-primary/60 hover:text-primary hover:border-primary disabled:opacity-30 transition-colors"
                  title="승인된 AI 추출 항목으로 소개 초안 채우기"
                >
                  {aiFillingSection === "B" ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                  AI 초안
                </button>
              )}
              {profile.masterTreatmentId ? (
                <Button variant="outline" size="sm" disabled={!canEdit} onClick={() => syncFromMaster(treatmentId)}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  본사 동기화
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled={!canEdit} onClick={() => setMasterPickerOpen(true)}>
                  <Building2 className="h-3 w-3 mr-1" />
                  본사 불러오기
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            {/* Master picker modal */}
            {masterPickerOpen && (
              <Card className="border-2 border-primary mb-2">
                <CardContent className="py-3">
                  <p className="text-sm font-medium mb-2">본사 마스터 시술 선택</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {allMasters.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm"
                        onClick={() => {
                          if (window.confirm(`"${m.name}"을 본사 시술로 연결하시겠습니까?`)) {
                            patchForm({ masterTreatmentId: m.id })
                          }
                          setMasterPickerOpen(false)
                        }}
                      >
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{m.category}</span>
                      </button>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setMasterPickerOpen(false)}>닫기</Button>
                </CardContent>
              </Card>
            )}

            {/* 랜딩 헤드라인 */}
            <div>
              <Label className="text-sm mb-1 block">랜딩 헤드라인 <span className="text-muted-foreground text-xs font-normal">(랜딩 overview 섹션 타이틀)</span></Label>
              <Input
                value={localForm.landingHeadline ?? ""}
                onChange={(e) => patchForm({ landingHeadline: e.target.value })}
                disabled={!canEdit}
                placeholder="예: 정확한 에너지 전달, 피부 속부터 달라지다"
              />
              <p className="text-xs text-muted-foreground mt-0.5">비워두면 시술명이 자동 사용됩니다.</p>
            </div>

            {/* 소개 본문 — 랜딩 오버뷰 섹션 제목 아래에 표시 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">
                  소개 본문 <span className="text-red-500">*</span>
                  <span className="ml-1 text-muted-foreground text-xs font-normal">(오버뷰 섹션 헤드라인 아래 표시)</span>
                </Label>
                <div className="flex items-center gap-2">
                  {profile.masterTreatmentId && (
                    <OverrideBadge
                      fieldName="shortDescription"
                      overriddenFields={overriddenFields}
                      onReset={() => resetFieldToMaster(treatmentId, "shortDescription")}
                      disabled={!canEdit}
                    />
                  )}
                  <span className={cn("text-xs", (localForm.shortDescription?.length ?? 0) > 200 ? "text-red-500" : "text-muted-foreground")}>
                    {localForm.shortDescription?.length ?? 0}/200
                  </span>
                </div>
              </div>
              <RichTextEditor
                mode="floating"
                value={localForm.shortDescription ?? ""}
                onChange={(html) => patchForm({ shortDescription: html })}
                placeholder="오버뷰 섹션 제목 아래 본문으로 노출됩니다 (200자 이내)"
                minHeight={80}
                disabled={!canEdit}
                style={{ fontSize: "12px" }}
              />
            </div>

            {/* 소개 카드 — overviewCards (랜딩 오버뷰 섹션 키포인트 카드) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">
                  소개 카드
                  <span className="ml-1 text-muted-foreground text-xs font-normal">(오버뷰 섹션 하단 카드로 표시)</span>
                </Label>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => addOverviewCard(treatmentId, {
                      title: `포인트 ${(treatmentData.overviewCards ?? []).length + 1}`,
                      description: "",
                      sortOrder: (treatmentData.overviewCards ?? []).length,
                    })}
                  >
                    <Plus className="h-3 w-3 mr-1" />카드 추가
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {(treatmentData.overviewCards ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded-lg">
                    카드를 추가하면 오버뷰 섹션에 키포인트 카드로 표시됩니다
                  </p>
                )}
                {[...(treatmentData.overviewCards ?? [])].sort((a, b) => a.sortOrder - b.sortOrder).map((card) => (
                  <div
                    key={card.id}
                    className="group rounded-lg border bg-muted/20 p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        value={card.title}
                        onChange={(e) => updateOverviewCard(treatmentId, card.id, { title: e.target.value })}
                        disabled={!canEdit}
                        placeholder="카드 제목"
                        className="h-8 text-sm font-medium"
                      />
                      {canEdit && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveOverviewCard(treatmentId, card.id, "up")}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          ><ChevronUp className="h-3.5 w-3.5" /></button>
                          <button
                            type="button"
                            onClick={() => moveOverviewCard(treatmentId, card.id, "down")}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          ><ChevronDown className="h-3.5 w-3.5" /></button>
                          <button
                            type="button"
                            onClick={() => deleteOverviewCard(treatmentId, card.id)}
                            className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                          ><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                    </div>
                    <RichTextEditor
                      mode="floating"
                      value={card.description ?? ""}
                      onChange={(html) => updateOverviewCard(treatmentId, card.id, { description: html })}
                      placeholder="카드 내용"
                      minHeight={60}
                      disabled={!canEdit}
                      style={{ fontSize: "12px" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 소개 섹션 배경 테마 */}
            <div>
              <Label className="text-sm mb-2 block">소개 섹션 배경 테마</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["light", "dark"] as const).map((t) => {
                  const isSelected = (localForm.overviewTheme ?? "light") === t
                  const label    = t === "light" ? "화이트" : "블랙"
                  const sublabel = t === "light" ? "밝은 배경 + 그레이 글로우" : "다크 배경 + 골드 글로우"
                  const previewBg = t === "light" ? "#ffffff" : "#161410"
                  const glowTR   = t === "light"
                    ? "radial-gradient(ellipse 65% 55% at 88% 2%,  rgba(180,180,185,0.50) 0%, transparent 70%)"
                    : "radial-gradient(ellipse 65% 55% at 88% 2%,  rgba(201,168,92,0.40) 0%, transparent 70%)"
                  const glowBL   = t === "light"
                    ? "radial-gradient(ellipse 48% 42% at 10% 96%, rgba(155,158,165,0.40) 0%, transparent 68%)"
                    : "radial-gradient(ellipse 48% 42% at 10% 96%, rgba(170,130,55,0.30) 0%, transparent 68%)"
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => patchForm({ overviewTheme: t })}
                      className={`relative overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${
                        isSelected
                          ? "border-primary shadow-md"
                          : "border-border hover:border-muted-foreground/40"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {/* 미니 프리뷰 */}
                      <div
                        className="relative h-14 w-full rounded-lg overflow-hidden mb-2.5"
                        style={{ backgroundColor: previewBg }}
                      >
                        <div className="absolute inset-0" style={{ background: glowTR }} />
                        <div className="absolute inset-0" style={{ background: glowBL }} />
                      </div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                          <svg className="h-2.5 w-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 소개 섹션 이미지 */}
            <div className="space-y-3">
              <Label className="text-sm block">소개 섹션 이미지</Label>
              <MultiImageUploader
                value={localForm.overviewImages}
                onChange={(json) => patchForm({ overviewImages: json })}
                disabled={!canEdit}
                label="소개 이미지"
              />
              <p className="text-xs text-muted-foreground">소개 섹션에 표시 · 비워두면 히어로 이미지가 사용됩니다</p>
            </div>

            {/* 소개 섹션 배경 이미지 */}
            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
              <Label className="text-sm font-medium block">섹션 배경 이미지</Label>
              <p className="text-xs text-muted-foreground mb-3">테마 색상(흰색/검정) 대신 이미지를 섹션 배경으로 사용합니다.</p>
              <SectionBgEditor
                imageUrl={localForm.overviewBgImageUrl}
                cfg={localForm.overviewBgImageCfg ? (() => { try { return JSON.parse(localForm.overviewBgImageCfg!) } catch { return undefined } })() : undefined}
                onImageChange={(url) => patchForm({ overviewBgImageUrl: url })}
                onCfgChange={(cfg: SectionBgImageCfg) => patchForm({ overviewBgImageCfg: JSON.stringify(cfg) })}
                onClear={() => patchForm({ overviewBgImageUrl: undefined, overviewBgImageCfg: undefined })}
              />
            </div>

            {/* 정렬 순서 */}
            <div className="w-40">
              <Label className="text-sm mb-1 block">정렬 순서</Label>
              <Input
                type="number"
                value={localForm.displayOrder ?? 0}
                onChange={(e) => patchForm({ displayOrder: Number(e.target.value) })}
                disabled={!canEdit}
              />
            </div>
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            (Section B cont.) — 랜딩 어필 포인트
            추가 필드: hookCopy, 헤드라인, 키워드, 효과태그 등
        ══════════════════════════════════════════ */}
        <SectionCard
          title="B-2. 랜딩 후킹 & 어필 포인트"
          action={<Badge className="text-[10px] bg-blue-100 text-blue-700">→ 랜딩 ② treatment_intro</Badge>}
        >
          <div className="space-y-4">
            <div>
              <TagInput label="대표 효과 태그" tags={localBenefits} onChange={(v) => { setLocalBenefits(v); setIsDirty(true) }} disabled={!canEdit} />
              {canEdit && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {["탄력 개선","리프팅","모공 축소","색소 개선","윤곽 정리","수분 공급","주름 개선","피부결 개선","비수술","당일 시술"].map((p) => (
                    <button key={p} type="button" onClick={() => { if (!localBenefits.includes(p)) { setLocalBenefits([...localBenefits, p]); setIsDirty(true) } }} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80">{p}</button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <TagInput label="추천 대상" tags={localTargets} onChange={(v) => { setLocalTargets(v); setIsDirty(true) }} disabled={!canEdit} />
              {canEdit && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {["30대","40대","탄력 저하","초기 노화","직장인","민감성"].map((p) => (
                    <button key={p} type="button" onClick={() => { if (!localTargets.includes(p)) { setLocalTargets([...localTargets, p]); setIsDirty(true) } }} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80">{p}</button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <TagInput label="고민 부위" tags={localConcernAreas} onChange={(v) => { setLocalConcernAreas(v); setIsDirty(true) }} disabled={!canEdit} />
              {canEdit && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {["얼굴 전체","이마","눈가","볼","턱선","목","전신"].map((p) => (
                    <button key={p} type="button" onClick={() => { if (!localConcernAreas.includes(p)) { setLocalConcernAreas([...localConcernAreas, p]); setIsDirty(true) } }} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80">{p}</button>
                  ))}
                </div>
              )}
            </div>
            <TagInput label="키워드 (SEO)" tags={localKeywords} onChange={(v) => { setLocalKeywords(v); setIsDirty(true) }} disabled={!canEdit} />
            <div>
              <TagInput label="특화 포인트" tags={localSpecialtyPoints} onChange={(v) => { setLocalSpecialtyPoints(v); setIsDirty(true) }} disabled={!canEdit} />
              {canEdit && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {["FDA 승인","당일 복귀","마취 없음","AI 분석 기반","맞춤 설계"].map((p) => (
                    <button key={p} type="button" onClick={() => { if (!localSpecialtyPoints.includes(p)) { setLocalSpecialtyPoints([...localSpecialtyPoints, p]); setIsDirty(true) } }} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80">{p}</button>
                  ))}
                </div>
              )}
            </div>
            <RichTextEditor
              mode="floating"
              value={localForm.chatbotSummary ?? ""}
              onChange={(html) => patchForm({ chatbotSummary: html })}
              placeholder="챗봇이 이 시술을 소개할 때 사용하는 요약문 (300자 이내)"
              minHeight={80}
              disabled={!canEdit}
              style={{ fontSize: "12px" }}
            />
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section ④ — 효과 & 경과
            → 랜딩 반영: ③ effects_progress
        ══════════════════════════════════════════ */}
        <SectionCard
          title="④ 효과 & 경과 — 효과 카드 · 시술 정보"
          landingNum="④"
          isFocused={focusedSectionKey === "C"}
          onFocus={() => { setFocusedSectionKey("C"); setPreviewTab("landing") }}
          action={
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] bg-teal-100 text-teal-700">→ 랜딩 효과</Badge>
              {canEdit && (
                <button
                  onClick={() => handleAIFillSection("C")}
                  disabled={aiFillingSection === "C" || (treatmentData.aiExtractions.filter(i => i.status === "approved" || i.status === "modified").length === 0)}
                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-dashed border-primary/40 text-primary/60 hover:text-primary hover:border-primary disabled:opacity-30 transition-colors"
                  title="승인된 AI 추출 항목으로 효과 카드 채우기"
                >
                  {aiFillingSection === "C" ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                  AI 초안
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4">

            {/* ── 섹션 텍스트 편집 ── */}
            <div className="space-y-3 pb-3 border-b">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">섹션 텍스트</p>
              <div>
                <Label className="text-sm mb-1 block">아이브로우 <span className="text-muted-foreground font-normal text-xs">(기본: Effects &amp; Process)</span></Label>
                <Input
                  value={localForm.effectsSectionEyebrow ?? ""}
                  onChange={(e) => patchForm({ effectsSectionEyebrow: e.target.value })}
                  disabled={!canEdit}
                  placeholder="Effects & Process"
                />
              </div>
              <div>
                <Label className="text-sm mb-1 block">섹션 제목 <span className="text-muted-foreground font-normal text-xs">(기본: 기대할 수 있는 변화와 정돈된 진행 흐름)</span></Label>
                <Input
                  value={localForm.effectsSectionHeadline ?? ""}
                  onChange={(e) => patchForm({ effectsSectionHeadline: e.target.value })}
                  disabled={!canEdit}
                  placeholder="기대할 수 있는 변화와 정돈된 진행 흐름"
                />
              </div>

              {/* ── 섹션 제목 스타일 ── */}
              <div className="rounded-xl border bg-muted/30 p-3 space-y-3">
                <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">제목 스타일</p>

                {/* 색상 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12 shrink-0">색상</span>
                  <input
                    type="color"
                    value={localForm.effectsTitleColor && !localForm.effectsTitleColor.startsWith("rgba") ? localForm.effectsTitleColor : "#ffffff"}
                    onChange={(e) => patchForm({ effectsTitleColor: e.target.value })}
                    disabled={!canEdit}
                    className="h-7 w-10 rounded border border-border cursor-pointer disabled:opacity-50"
                  />
                  <Input
                    className="h-7 text-xs font-mono flex-1"
                    value={localForm.effectsTitleColor ?? ""}
                    onChange={(e) => patchForm({ effectsTitleColor: e.target.value || undefined })}
                    disabled={!canEdit}
                    placeholder="기본 (테마 색상)"
                  />
                  {localForm.effectsTitleColor && (
                    <button type="button" disabled={!canEdit} onClick={() => patchForm({ effectsTitleColor: undefined })} className="text-muted-foreground hover:text-destructive disabled:opacity-50">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* 글씨체 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12 shrink-0">글씨체</span>
                  <div className="flex gap-1 flex-wrap">
                    {([
                      { key: undefined, label: "기본" },
                      { key: "sans",    label: "고딕" },
                      { key: "serif",   label: "명조" },
                    ] as const).map(({ key, label }) => (
                      <button
                        key={label}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => patchForm({ effectsTitleFontFamily: key })}
                        className={`px-2.5 py-1 rounded text-[10px] border transition-all disabled:opacity-50 ${
                          (localForm.effectsTitleFontFamily ?? undefined) === key
                            ? "border-primary bg-primary/10 font-semibold"
                            : "border-border bg-background"
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                {/* 크기 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12 shrink-0">크기</span>
                  <div className="flex gap-1 flex-wrap">
                    {([
                      { key: undefined, label: "기본" },
                      { key: "sm",      label: "작게" },
                      { key: "lg",      label: "크게" },
                      { key: "xl",      label: "최대" },
                    ] as const).map(({ key, label }) => (
                      <button
                        key={label}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => patchForm({ effectsTitleFontSize: key })}
                        className={`px-2.5 py-1 rounded text-[10px] border transition-all disabled:opacity-50 ${
                          (localForm.effectsTitleFontSize ?? undefined) === key
                            ? "border-primary bg-primary/10 font-semibold"
                            : "border-border bg-background"
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm mb-1 block">섹션 설명</Label>
                <RichTextEditor
                  mode="floating"
                  value={localForm.effectsSectionDescription ?? ""}
                  onChange={(html) => patchForm({ effectsSectionDescription: html })}
                  placeholder="시술의 흐름을 투명하게 공유합니다. 변화는 강요되지 않고, 회복은 단정합니다."
                  minHeight={60}
                  disabled={!canEdit}
                  style={{ fontSize: "12px" }}
                />
              </div>
            </div>

            {/* ── 섹션 배경 테마 ── */}
            <div className="pb-3 border-b">
              <Label className="text-sm mb-2 block">섹션 배경 테마</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["dark", "light"] as const).map((t) => {
                  const isSelected = (localForm.effectsTheme ?? "dark") === t
                  const label    = t === "dark" ? "블랙" : "화이트"
                  const sublabel = t === "dark" ? "다크 배경 + 골드 글로우" : "밝은 배경 + 그레이 글로우"
                  const previewBg = t === "dark" ? "#161410" : "#ffffff"
                  const glowTR   = t === "dark"
                    ? "radial-gradient(ellipse 65% 55% at 88% 2%,  rgba(201,168,92,0.40) 0%, transparent 70%)"
                    : "radial-gradient(ellipse 65% 55% at 88% 2%,  rgba(180,180,185,0.50) 0%, transparent 70%)"
                  const glowBL   = t === "dark"
                    ? "radial-gradient(ellipse 48% 42% at 10% 96%, rgba(170,130,55,0.30) 0%, transparent 68%)"
                    : "radial-gradient(ellipse 48% 42% at 10% 96%, rgba(155,158,165,0.40) 0%, transparent 68%)"
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => patchForm({ effectsTheme: t })}
                      className={`relative overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${
                        isSelected ? "border-primary shadow-md" : "border-border hover:border-muted-foreground/40"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="relative h-14 w-full rounded-lg overflow-hidden mb-2.5" style={{ backgroundColor: previewBg }}>
                        <div className="absolute inset-0" style={{ background: glowTR }} />
                        <div className="absolute inset-0" style={{ background: glowBL }} />
                      </div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                          <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── 카드 스타일 (장점 섹션과 동일 체계) ── */}
            {(() => {
              const CARD_PRESETS = [
                { id: "default",        label: "글라스",      bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.14)", shadow: "none" },
                { id: "flat",           label: "플랫",        bg: "rgba(255,255,255,1)",    border: "rgba(0,0,0,0.08)",      shadow: "none" },
                { id: "outline",        label: "아웃라인",    bg: "transparent",            border: "rgba(255,255,255,0.22)", shadow: "none" },
                { id: "glass-dark",     label: "글라스 다크", bg: "rgba(0,0,0,0.40)",       border: "rgba(255,255,255,0.12)", shadow: "none" },
                { id: "glass-gold",     label: "글라스 골드", bg: "rgba(201,168,92,0.15)",  border: "rgba(201,168,92,0.35)", shadow: "0 4px 16px rgba(201,168,92,0.20)" },
                { id: "shadow-soft",    label: "소프트 쉐도우", bg: "rgba(255,255,255,0.98)", border: "none",                shadow: "0 8px 40px rgba(0,0,0,0.12)" },
                { id: "shadow-deep",    label: "딥 쉐도우",   bg: "rgba(255,255,255,1)",    border: "none",                  shadow: "0 20px 60px rgba(0,0,0,0.18)" },
                { id: "gradient-warm",  label: "웜 그라데",   bg: "linear-gradient(135deg,rgba(255,252,248,1) 0%,rgba(255,228,196,0.70) 100%)", border: "rgba(255,180,100,0.22)", shadow: "none" },
                { id: "gradient-cool",  label: "쿨 그라데",   bg: "linear-gradient(135deg,rgba(240,249,255,1) 0%,rgba(206,238,255,0.80) 100%)", border: "rgba(100,180,255,0.22)", shadow: "none" },
                { id: "gradient-rose",  label: "로즈 그라데", bg: "linear-gradient(135deg,rgba(255,245,248,1) 0%,rgba(255,212,226,0.75) 100%)", border: "rgba(255,140,170,0.22)", shadow: "none" },
                { id: "neon-blue",      label: "네온 블루",   bg: "rgba(240,248,255,0.85)", border: "rgba(80,160,255,0.55)", shadow: "0 0 22px rgba(80,160,255,0.28)" },
                { id: "frosted",        label: "프로스티드",  bg: "rgba(255,255,255,0.38)", border: "rgba(255,255,255,0.75)", shadow: "0 8px 32px rgba(0,0,0,0.08)" },
                { id: "inner-glow",     label: "이너 글로우", bg: "rgba(255,255,255,0.96)", border: "rgba(190,170,255,0.38)", shadow: "0 4px 20px rgba(0,0,0,0.06)" },
              ] as const

              const SHADOW_PRESETS = [
                { id: "none",    label: "없음",     css: "none" },
                { id: "soft",    label: "부드럽게", css: "0 4px 20px rgba(0,0,0,0.18)" },
                { id: "medium",  label: "보통",     css: "0 8px 32px rgba(0,0,0,0.30)" },
                { id: "strong",  label: "강하게",   css: "0 12px 48px rgba(0,0,0,0.48), 0 2px 8px rgba(0,0,0,0.30)" },
                { id: "glow-gold",   label: "골드 글로우",  css: "0 0 28px 4px rgba(201,168,92,0.45), 0 4px 16px rgba(201,168,92,0.25)" },
                { id: "glow-blue",   label: "블루 글로우",  css: "0 0 28px 4px rgba(80,160,255,0.45), 0 4px 16px rgba(80,160,255,0.25)" },
              ] as const

              const curBg    = localForm.effectsBoxBg
              const curBd    = localForm.effectsBoxBorder
              const curSh    = localForm.effectsBoxShadow
              const curBlur  = localForm.effectsBoxBlur
              const curRad   = localForm.effectsBoxRadius
              const isGradient = curBg?.startsWith("linear-gradient") ?? false
              const matchedShadow = SHADOW_PRESETS.find(s => s.css === curSh)

              const buildGradient = (from: string, to: string, angle: number) =>
                `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`

              return (
                <div className="space-y-3 pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">카드 스타일</p>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setShowBoxStylePanel(showBoxStylePanel === "box" ? null : "box")}
                      className="text-[10px] text-primary hover:underline disabled:opacity-50"
                    >
                      {showBoxStylePanel === "box" ? "▲ 세부 설정 접기" : "▼ 세부 설정 열기"}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CARD_PRESETS.map((ps) => {
                      const sel = (localForm.effectsBoxPreset ?? "default") === ps.id
                      return (
                        <button
                          key={ps.id}
                          type="button"
                          disabled={!canEdit}
                          onClick={() => patchForm({ effectsBoxPreset: ps.id as any })}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                            sel ? "border-primary" : "border-border hover:border-muted-foreground/40"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="h-10 w-full" style={{ background: ps.bg, border: `1px solid ${ps.border}`, boxShadow: ps.shadow }} />
                          <p className="text-[9px] text-center py-1 truncate px-1 leading-tight">{ps.label}</p>
                        </button>
                      )
                    })}
                  </div>

                  {showBoxStylePanel === "box" && (
                    <div className="mt-2 space-y-4 rounded-xl border bg-muted/30 p-3">
                      {/* 배경 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">배경</p>
                          <div className="flex gap-1">
                            <button type="button" disabled={!canEdit} onClick={() => patchForm({ effectsBoxBg: curBg?.startsWith("linear-gradient") ? "#1a1a1a" : (curBg ?? "#1a1a1a") })} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${!isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"}`}>단색</button>
                            <button type="button" disabled={!canEdit} onClick={() => patchForm({ effectsBoxBg: buildGradient(boxGradFrom, boxGradTo, boxGradAngle) })} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"}`}>그라데이션</button>
                          </div>
                        </div>
                        {!isGradient ? (
                          <div className="flex items-center gap-2">
                            <input type="color" value={curBg && !curBg.startsWith("rgba") && !curBg.startsWith("linear") ? curBg : "#1a1a2e"} onChange={(e) => patchForm({ effectsBoxBg: e.target.value })} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" />
                            <Input className="h-7 text-xs font-mono flex-1" value={curBg ?? ""} onChange={(e) => patchForm({ effectsBoxBg: e.target.value || undefined })} disabled={!canEdit} placeholder="rgba(255,255,255,0.08)" />
                            {curBg && <button type="button" disabled={!canEdit} onClick={() => patchForm({ effectsBoxBg: undefined })} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input type="color" value={boxGradFrom} onChange={(e) => { setBoxGradFrom(e.target.value); patchForm({ effectsBoxBg: buildGradient(e.target.value, boxGradTo, boxGradAngle) }) }} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" />
                              <span className="text-muted-foreground text-xs">→</span>
                              <input type="color" value={boxGradTo} onChange={(e) => { setBoxGradTo(e.target.value); patchForm({ effectsBoxBg: buildGradient(boxGradFrom, e.target.value, boxGradAngle) }) }} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" />
                              <div className="flex-1 h-6 rounded" style={{ background: buildGradient(boxGradFrom, boxGradTo, boxGradAngle) }} />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-[10px] text-muted-foreground whitespace-nowrap">각도 {boxGradAngle}°</Label>
                              <input type="range" min={0} max={360} step={15} value={boxGradAngle} onChange={(e) => { const v = Number(e.target.value); setBoxGradAngle(v); patchForm({ effectsBoxBg: buildGradient(boxGradFrom, boxGradTo, v) }) }} disabled={!canEdit} className="flex-1 accent-primary" />
                            </div>
                          </div>
                        )}
                      </div>
                      {/* 테두리 */}
                      <div>
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">테두리</p>
                        <div className="flex items-center gap-2">
                          <input type="color" value={curBd && !curBd.startsWith("rgba") ? curBd : "#ffffff"} onChange={(e) => patchForm({ effectsBoxBorder: e.target.value })} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" />
                          <Input className="h-7 text-xs font-mono flex-1" value={curBd ?? ""} onChange={(e) => patchForm({ effectsBoxBorder: e.target.value || undefined })} disabled={!canEdit} placeholder="rgba(255,255,255,0.22)" />
                          {curBd && <button type="button" disabled={!canEdit} onClick={() => patchForm({ effectsBoxBorder: undefined })} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                        </div>
                      </div>
                      {/* 쉐도우 */}
                      <div>
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">쉐도우</p>
                        <div className="flex flex-wrap gap-1.5">
                          {SHADOW_PRESETS.map((sp) => {
                            const sel = matchedShadow?.id === sp.id || (!curSh && sp.id === "none")
                            return (
                              <button key={sp.id} type="button" disabled={!canEdit} onClick={() => patchForm({ effectsBoxShadow: sp.css === "none" ? undefined : sp.css })} className={`px-2.5 py-1 rounded-full border text-[10px] transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background hover:border-muted-foreground/40"} disabled:opacity-50`}>{sp.label}</button>
                            )
                          })}
                        </div>
                        {curSh && curSh !== "none" && <Input className="h-7 text-xs font-mono mt-2" value={curSh} onChange={(e) => patchForm({ effectsBoxShadow: e.target.value })} disabled={!canEdit} />}
                      </div>
                      {/* 블러 & 모서리 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">백드롭 블러</p>
                          <div className="flex flex-wrap gap-1">
                            {[{ id: "none", label: "없음", val: 0 }, { id: "light", label: "약하게", val: 8 }, { id: "medium", label: "보통", val: 18 }, { id: "strong", label: "강하게", val: 32 }].map((b) => {
                              const sel = b.val === 0 ? !curBlur : curBlur === b.val
                              return <button key={b.id} type="button" disabled={!canEdit} onClick={() => patchForm({ effectsBoxBlur: b.val === 0 ? undefined : b.val })} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"} disabled:opacity-50`}>{b.label}</button>
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">모서리</p>
                          <div className="flex flex-wrap gap-1">
                            {[{ id: "sharp", label: "각지게", val: 8 }, { id: "medium", label: "보통", val: 16 }, { id: "round", label: "둥글게", val: 24 }, { id: "pill", label: "최대", val: 40 }].map((r) => {
                              const sel = curRad == null ? r.val === 24 : curRad === r.val
                              return <button key={r.id} type="button" disabled={!canEdit} onClick={() => patchForm({ effectsBoxRadius: r.val })} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"} disabled:opacity-50`}>{r.label}</button>
                            })}
                          </div>
                        </div>
                      </div>
                      {/* 초기화 */}
                      <button type="button" disabled={!canEdit} onClick={() => patchForm({ effectsBoxBg: undefined, effectsBoxBorder: undefined, effectsBoxShadow: undefined, effectsBoxBlur: undefined, effectsBoxRadius: undefined })} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors disabled:opacity-50">
                        <RotateCcw className="h-2.5 w-2.5" />세부 설정 초기화 (프리셋으로 복귀)
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* ── 시술 정보 그리드 ── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1 block">시술 시간 (분)</Label>
                <Input
                  type="number"
                  value={localForm.durationMinutes ?? ""}
                  onChange={(e) => patchForm({ durationMinutes: Number(e.target.value) })}
                  disabled={!canEdit}
                />
              </div>
              <div>
                <Label className="text-sm mb-1 block">통증 강도</Label>
                <Select
                  value={localForm.painLevel ?? ""}
                  onValueChange={(v) => patchForm({ painLevel: v as TreatmentProfile["painLevel"] })}
                  disabled={!canEdit}
                >
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    {["없음", "경미", "보통", "강함"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={!!localForm.anesthesiaRequired}
                onCheckedChange={(v) => patchForm({ anesthesiaRequired: v })}
                disabled={!canEdit}
              />
              <Label className="text-sm">마취 필요</Label>
            </div>
            <RichTextEditor
              mode="floating"
              value={localForm.downtimeNote ?? ""}
              onChange={(html) => patchForm({ downtimeNote: html })}
              minHeight={60}
              disabled={!canEdit}
              style={{ fontSize: "12px" }}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1 block">시술 주기 안내</Label>
                <Input value={localForm.treatmentCycleGuide ?? ""} onChange={(e) => patchForm({ treatmentCycleGuide: e.target.value })} disabled={!canEdit} />
              </div>
              <div>
                <Label className="text-sm mb-1 block">유지 기간</Label>
                <Input value={localForm.maintenancePeriod ?? ""} onChange={(e) => patchForm({ maintenancePeriod: e.target.value })} disabled={!canEdit} />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1 block">권장 방문 횟수</Label>
              <Input
                type="number"
                value={localForm.recommendedVisits ?? ""}
                onChange={(e) => patchForm({ recommendedVisits: Number(e.target.value) })}
                disabled={!canEdit}
                className="w-32"
              />
            </div>
            {/* effectCards repeater */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">효과 카드 <span className="text-muted-foreground text-xs font-normal">(랜딩 섹션 ③에 자동 반영)</span></Label>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddEffect(true)}>
                    <Plus className="h-3 w-3 mr-1" />효과 카드 추가
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {[...treatmentData.effectCards].sort((a, b) => a.sortOrder - b.sortOrder).map((card, idx, arr) => (
                  <div key={card.id} className="border rounded-md overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
                      {card.icon && <span className="text-base shrink-0">{card.icon}</span>}
                      <span className="flex-1 text-sm truncate font-medium">{card.title.replace(/<[^>]+>/g, "")}</span>
                      {card.description && <span className="text-xs text-muted-foreground truncate max-w-[160px]">{card.description.replace(/<[^>]+>/g, "")}</span>}
                      <div className="flex items-center gap-1">
                        <button disabled={idx === 0 || !canEdit} onClick={() => moveEffectCard(treatmentId, card.id, "up")} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                        <button disabled={idx === arr.length - 1 || !canEdit} onClick={() => moveEffectCard(treatmentId, card.id, "down")} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                        <button onClick={() => { setExpandedEffectId(expandedEffectId === card.id ? null : card.id); setEditingEffect({ ...card }) }} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                        {canEdit && <button onClick={() => deleteEffectCard(treatmentId, card.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>}
                      </div>
                    </div>
                    {expandedEffectId === card.id && (
                      <div className="p-3 border-t space-y-2">
                        <div>
                          <Label className="text-xs mb-1 block">제목 *</Label>
                          <RichTextEditor mode="floating" value={(editingEffect.title as string) ?? ""} onChange={(html) => setEditingEffect((p) => ({ ...p, title: html }))} minHeight={32} disabled={!canEdit} style={{ fontSize: "12px" }} placeholder="효과 카드 제목" />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">설명</Label>
                          <RichTextEditor mode="floating" value={(editingEffect.description as string) ?? ""} onChange={(html) => setEditingEffect((p) => ({ ...p, description: html }))} minHeight={60} disabled={!canEdit} style={{ fontSize: "12px" }} />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">아이콘 (이모지)</Label>
                          <Input className="h-8 text-xs w-24" value={(editingEffect.icon as string) ?? ""} onChange={(e) => setEditingEffect((p) => ({ ...p, icon: e.target.value }))} disabled={!canEdit} placeholder="✨" />
                        </div>
                        {/* 카드 강조 스타일 */}
                        <div>
                          <Label className="text-xs mb-1.5 block">강조 색상</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {([
                              { id: "default",         label: "기본",  dot: "rgba(180,180,180,0.60)" },
                              { id: "glass-gold",      label: "골드",  dot: "rgba(201,168,92,0.90)" },
                              { id: "gradient-gold",   label: "골드★", dot: "rgba(220,180,60,1)" },
                              { id: "gradient-teal",   label: "틸",    dot: "rgba(32,178,170,0.90)" },
                              { id: "gradient-purple", label: "퍼플",  dot: "rgba(139,92,246,0.90)" },
                            ] as const).map((ps) => {
                              const sel = ((editingEffect.cardPreset as string) ?? "default") === ps.id
                              return (
                                <button
                                  key={ps.id}
                                  type="button"
                                  disabled={!canEdit}
                                  onClick={() => setEditingEffect((p) => ({ ...p, cardPreset: ps.id }))}
                                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] border transition-all ${
                                    sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-muted/30 hover:border-muted-foreground/40"
                                  }`}
                                >
                                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: ps.dot }} />
                                  {ps.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7 text-xs" onClick={() => { updateEffectCard(treatmentId, card.id, editingEffect as Partial<TreatmentEffectCard>); setExpandedEffectId(null) }}>저장</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpandedEffectId(null)}>취소</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {treatmentData.effectCards.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2 text-center">등록된 효과 카드가 없습니다.</p>
                )}
              </div>
              {showAddEffect && (
                <div className="border rounded-md p-3 space-y-2 bg-muted/20 mt-2">
                  <p className="text-xs font-medium">효과 카드 추가</p>
                  <div>
                    <Label className="text-xs mb-1 block">제목 *</Label>
                    <RichTextEditor mode="floating" value={newEffect.title} onChange={(html) => setNewEffect((p) => ({ ...p, title: html }))} minHeight={32} style={{ fontSize: "12px" }} placeholder="효과 카드 제목" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">설명</Label>
                    <RichTextEditor mode="floating" value={newEffect.description} onChange={(html) => setNewEffect((p) => ({ ...p, description: html }))} minHeight={60} style={{ fontSize: "12px" }} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">아이콘</Label>
                    <Input className="h-8 text-xs w-24" value={newEffect.icon} onChange={(e) => setNewEffect((p) => ({ ...p, icon: e.target.value }))} placeholder="✨" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={() => {
                      if (!newEffect.title.replace(/<[^>]+>/g, "").trim()) return
                      addEffectCard(treatmentId, { title: newEffect.title, description: newEffect.description, icon: newEffect.icon, sortOrder: treatmentData.effectCards.length + 1 })
                      setNewEffect({ title: "", description: "", icon: "" })
                      setShowAddEffect(false)
                    }}>추가</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowAddEffect(false); setNewEffect({ title: "", description: "", icon: "" }) }}>취소</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Concern areas (고민 부위) — also feeds effects_progress */}
            <div className="pt-3 border-t">
              <TagInput label="고민 부위 (→ 랜딩 ③)" tags={localConcernAreas} onChange={(v) => { setLocalConcernAreas(v); setIsDirty(true) }} disabled={!canEdit} />
              {canEdit && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {["얼굴 전체","이마","눈가","볼","턱선","목","전신"].map((p) => (
                    <button key={p} type="button" onClick={() => { if (!localConcernAreas.includes(p)) { setLocalConcernAreas([...localConcernAreas, p]); setIsDirty(true) } }} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80">{p}</button>
                  ))}
                </div>
              )}
            </div>

            {/* 섹션 이미지 */}
            <div className="pt-3 border-t space-y-2">
              <Label className="text-sm block">섹션 이미지</Label>
              <MultiImageUploader
                value={localForm.effectsImages}
                onChange={(json) => patchForm({ effectsImages: json })}
                disabled={!canEdit}
                label="효과 이미지"
              />
            </div>

            {/* 효과 섹션 배경 이미지 */}
            <div className="pt-3 border-t space-y-2 rounded-xl border border-border bg-muted/30 p-4">
              <Label className="text-sm font-medium block">섹션 배경 이미지</Label>
              <p className="text-xs text-muted-foreground mb-3">테마 색상(흰색/검정) 대신 이미지를 섹션 배경으로 사용합니다.</p>
              <SectionBgEditor
                imageUrl={localForm.effectsBgImageUrl}
                cfg={localForm.effectsBgImageCfg ? (() => { try { return JSON.parse(localForm.effectsBgImageCfg!) } catch { return undefined } })() : undefined}
                onImageChange={(url) => patchForm({ effectsBgImageUrl: url })}
                onCfgChange={(cfg: SectionBgImageCfg) => patchForm({ effectsBgImageCfg: JSON.stringify(cfg) })}
                onClear={() => patchForm({ effectsBgImageUrl: undefined, effectsBgImageCfg: undefined })}
              />
            </div>

          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section ⑤ — 장점
            → 랜딩 반영: ④ treatment_advantages
        ══════════════════════════════════════════ */}
        <SectionCard
          title="⑤ 장점 — 차별화 포인트"
          landingNum="⑤"
          isFocused={focusedSectionKey === "D"}
          onFocus={() => { setFocusedSectionKey("D"); setPreviewTab("landing") }}
          action={
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] bg-orange-100 text-orange-700">→ 랜딩 ④</Badge>
              {canEdit && (
                <button
                  onClick={() => handleAIFillSection("D")}
                  disabled={aiFillingSection === "D" || (treatmentData.aiExtractions.filter(i => i.status === "approved" || i.status === "modified").length === 0)}
                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-dashed border-primary/40 text-primary/60 hover:text-primary hover:border-primary disabled:opacity-30 transition-colors"
                  title="승인된 AI 추출 항목으로 장점 초안 채우기"
                >
                  {aiFillingSection === "D" ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                  AI 초안
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            {/* 전문/특화 포인트 */}
            <div>
              <Label className="text-sm mb-1 block">전문 포인트 / 특화 포인트 <span className="text-muted-foreground text-xs font-normal">(→ 랜딩 ⑤ 장점 카드)</span></Label>
              <div className="space-y-1">
                {localSpecialtyPoints.map((pt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={pt} onChange={(e) => { const copy = [...localSpecialtyPoints]; copy[i] = e.target.value; setLocalSpecialtyPoints(copy); setIsDirty(true) }} disabled={!canEdit} className="h-8 text-sm flex-1" />
                    {canEdit && <button onClick={() => { setLocalSpecialtyPoints(localSpecialtyPoints.filter((_, j) => j !== i)); setIsDirty(true) }} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>}
                  </div>
                ))}
                {canEdit && (
                  <Button variant="outline" size="sm" className="h-7 text-xs mt-1" onClick={() => { setLocalSpecialtyPoints([...localSpecialtyPoints, ""]); setIsDirty(true) }}>
                    <Plus className="h-3 w-3 mr-1" />항목 추가
                  </Button>
                )}
              </div>
              {canEdit && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {["FDA 승인","당일 복귀","마취 없음","AI 분석 기반","맞춤 설계","비수술","즉시 일상복귀"].map((p) => (
                    <button key={p} type="button" onClick={() => { if (!localSpecialtyPoints.includes(p)) { setLocalSpecialtyPoints([...localSpecialtyPoints, p]); setIsDirty(true) } }} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground">{p}</button>
                  ))}
                </div>
              )}
            </div>

            {/* 섹션 헤드라인 */}
            <div className="pt-3 border-t space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">섹션 헤드라인</p>
              <div>
                <Label className="text-sm mb-1 block">대제목 <span className="text-muted-foreground text-xs font-normal">(기본: "섬세함이 만드는 차이")</span></Label>
                <Input
                  value={localForm.advantagesTitle ?? ""}
                  onChange={(e) => patchForm({ advantagesTitle: e.target.value })}
                  disabled={!canEdit}
                  placeholder="섬세함이 만드는 차이"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">줄바꿈은 \n 으로 입력</p>
              </div>
              <div>
                <Label className="text-sm mb-1 block">대제목 아래 설명</Label>
                <RichTextEditor
                  mode="floating"
                  value={localForm.advantagesBody ?? ""}
                  onChange={(html) => patchForm({ advantagesBody: html })}
                  placeholder="섹션 설명 텍스트 (선택사항)"
                  minHeight={60}
                  disabled={!canEdit}
                  style={{ fontSize: "12px" }}
                />
              </div>
            </div>

            {/* 섹션 배경 테마 */}
            <div className="pt-3 border-t">
              <Label className="text-sm mb-2 block">섹션 배경 테마</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["light", "dark"] as const).map((t) => {
                  const isSelected = (localForm.advantagesTheme ?? "light") === t
                  const label    = t === "light" ? "화이트" : "블랙"
                  const sublabel = t === "light" ? "밝은 배경 + 그레이 글로우" : "다크 배경 + 골드 글로우"
                  const previewBg = t === "light" ? "#ffffff" : "#161410"
                  const glowTR   = t === "light"
                    ? "radial-gradient(ellipse 65% 55% at 88% 2%,  rgba(180,180,185,0.50) 0%, transparent 70%)"
                    : "radial-gradient(ellipse 65% 55% at 88% 2%,  rgba(201,168,92,0.40) 0%, transparent 70%)"
                  const glowBL   = t === "light"
                    ? "radial-gradient(ellipse 48% 42% at 10% 96%, rgba(155,158,165,0.40) 0%, transparent 68%)"
                    : "radial-gradient(ellipse 48% 42% at 10% 96%, rgba(170,130,55,0.30) 0%, transparent 68%)"
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => patchForm({ advantagesTheme: t })}
                      className={`relative overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${
                        isSelected ? "border-primary shadow-md" : "border-border hover:border-muted-foreground/40"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="relative h-14 w-full rounded-lg overflow-hidden mb-2.5" style={{ backgroundColor: previewBg }}>
                        <div className="absolute inset-0" style={{ background: glowTR }} />
                        <div className="absolute inset-0" style={{ background: glowBL }} />
                      </div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                          <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 장점 카드 박스 스타일 */}
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">장점 카드 박스 스타일</p>
              <div className="grid grid-cols-5 gap-1.5">
                {([
                  { id: "default",       label: "글라스",        bg: "rgba(255,255,255,0.70)", border: "rgba(255,255,255,0.55)", shadow: "0 2px 20px rgba(0,0,0,0.06)" },
                  { id: "flat",          label: "플랫",          bg: "rgba(255,255,255,1)",    border: "rgba(0,0,0,0.08)",       shadow: "0 1px 4px rgba(0,0,0,0.06)" },
                  { id: "outline",       label: "아웃라인",      bg: "transparent",            border: "rgba(0,0,0,0.15)",       shadow: "none" },
                  { id: "glass-dark",    label: "다크 글라스",   bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.14)", shadow: "0 2px 20px rgba(0,0,0,0.35)" },
                  { id: "glass-gold",    label: "골드",          bg: "rgba(201,168,92,0.12)",  border: "rgba(201,168,92,0.28)",  shadow: "0 4px 16px rgba(201,168,92,0.18)" },
                  { id: "shadow-soft",   label: "소프트 쉐도우", bg: "rgba(255,255,255,0.98)", border: "transparent",           shadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" },
                  { id: "shadow-deep",   label: "딥 쉐도우",     bg: "rgba(255,255,255,1)",    border: "transparent",           shadow: "0 20px 60px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.10)" },
                  { id: "gradient-warm", label: "웜 그라데이션", bg: "linear-gradient(135deg, rgba(255,252,248,1) 0%, rgba(255,228,196,0.70) 100%)", border: "rgba(255,180,100,0.22)", shadow: "0 4px 20px rgba(255,150,80,0.12)" },
                  { id: "gradient-cool", label: "쿨 그라데이션", bg: "linear-gradient(135deg, rgba(240,249,255,1) 0%, rgba(206,238,255,0.80) 100%)", border: "rgba(100,180,255,0.22)", shadow: "0 4px 20px rgba(80,160,255,0.10)" },
                  { id: "gradient-rose", label: "로즈 그라데이션", bg: "linear-gradient(135deg, rgba(255,245,248,1) 0%, rgba(255,212,226,0.75) 100%)", border: "rgba(255,140,170,0.22)", shadow: "0 4px 20px rgba(255,100,140,0.12)" },
                  { id: "neon-blue",     label: "네온 글로우",   bg: "rgba(240,248,255,0.85)", border: "rgba(80,160,255,0.55)",  shadow: "0 0 22px rgba(80,160,255,0.28), 0 0 8px rgba(80,160,255,0.16)" },
                  { id: "frosted",       label: "프로스티드",    bg: "rgba(255,255,255,0.38)", border: "rgba(255,255,255,0.75)", shadow: "0 8px 32px rgba(0,0,0,0.08)" },
                  { id: "inner-glow",    label: "인너 글로우",   bg: "rgba(255,255,255,0.96)", border: "rgba(190,170,255,0.38)", shadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 2px 20px rgba(180,150,255,0.18)" },
                ] as const).map((ps) => {
                  const sel = (localForm.advantagesBoxPreset ?? "default") === ps.id
                  return (
                    <button
                      key={ps.id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => patchForm({ advantagesBoxPreset: ps.id })}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        sel ? "border-primary" : "border-border hover:border-muted-foreground/40"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="h-10 w-full" style={{ background: ps.bg, border: `1px solid ${ps.border}`, boxShadow: ps.shadow }} />
                      <p className="text-[9px] text-center py-1 truncate px-1 leading-tight">{ps.label}</p>
                    </button>
                  )
                })}
              </div>
              {/* ④ 세부 박스 스타일 패널 */}
              <div className="flex items-center justify-between mt-2">
                <span />
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setShowAdvBoxPanel(!showAdvBoxPanel)}
                  className="text-[10px] text-primary hover:underline disabled:opacity-50"
                >
                  {showAdvBoxPanel ? "▲ 세부 설정 접기" : "▼ 세부 설정 열기"}
                </button>
              </div>
              {showAdvBoxPanel && (() => {
                const bgKey = "advantagesCardBg" as const
                const bdKey = "advantagesCardBorder" as const
                const shKey = "advantagesCardShadow" as const
                const blurKey = "advantagesCardBlur" as const
                const radKey  = "advantagesCardRadius" as const
                const curBg   = localForm[bgKey] as string | undefined
                const curBd   = localForm[bdKey] as string | undefined
                const curSh   = localForm[shKey] as string | undefined
                const curBlur = localForm[blurKey] as number | undefined
                const curRad  = localForm[radKey]  as number | undefined
                const isGradient = curBg?.startsWith("linear-gradient") ?? false
                const buildGrad = (f: string, t: string, a: number) => `linear-gradient(${a}deg, ${f} 0%, ${t} 100%)`
                const ADVSHADOWS = [
                  { id: "none",    label: "없음",     css: "none" },
                  { id: "soft",    label: "부드럽게", css: "0 4px 20px rgba(0,0,0,0.18)" },
                  { id: "medium",  label: "보통",     css: "0 8px 32px rgba(0,0,0,0.30)" },
                  { id: "strong",  label: "강하게",   css: "0 12px 48px rgba(0,0,0,0.48), 0 2px 8px rgba(0,0,0,0.30)" },
                  { id: "glow-gold",   label: "골드 글로우",  css: "0 0 28px 4px rgba(201,168,92,0.45), 0 4px 16px rgba(201,168,92,0.25)" },
                  { id: "glow-teal",   label: "틸 글로우",    css: "0 0 28px 4px rgba(32,178,170,0.45), 0 4px 16px rgba(32,178,170,0.25)" },
                  { id: "glow-purple", label: "퍼플 글로우",  css: "0 0 28px 4px rgba(139,92,246,0.45), 0 4px 16px rgba(139,92,246,0.25)" },
                ]
                const matchedSh = ADVSHADOWS.find(s => s.css === curSh)
                return (
                  <div className="mt-3 space-y-4 rounded-xl border bg-muted/30 p-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">배경</p>
                        <div className="flex gap-1">
                          <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: curBg?.startsWith("linear-gradient") ? "#ffffff" : (curBg ?? "#ffffff") } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${!isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"}`}>단색</button>
                          <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: buildGrad(advGradFrom, advGradTo, advGradAngle) } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"}`}>그라데이션</button>
                        </div>
                      </div>
                      {!isGradient ? (
                        <div className="flex items-center gap-2">
                          <input type="color" value={curBg && !curBg.startsWith("rgba") && !curBg.startsWith("linear") ? curBg : "#ffffff"} onChange={(e) => patchForm({ [bgKey]: e.target.value } as any)} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" />
                          <Input className="h-7 text-xs font-mono flex-1" value={curBg ?? ""} onChange={(e) => patchForm({ [bgKey]: e.target.value } as any)} disabled={!canEdit} placeholder="rgba(255,255,255,0.70) 또는 #ffffff" />
                          {curBg && <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: undefined } as any)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="color" value={advGradFrom} onChange={(e) => { setAdvGradFrom(e.target.value); patchForm({ [bgKey]: buildGrad(e.target.value, advGradTo, advGradAngle) } as any) }} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" title="시작 색상" />
                            <span className="text-muted-foreground text-xs">→</span>
                            <input type="color" value={advGradTo} onChange={(e) => { setAdvGradTo(e.target.value); patchForm({ [bgKey]: buildGrad(advGradFrom, e.target.value, advGradAngle) } as any) }} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" title="끝 색상" />
                            <div className="flex-1 h-6 rounded" style={{ background: buildGrad(advGradFrom, advGradTo, advGradAngle) }} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-[10px] text-muted-foreground whitespace-nowrap">각도 {advGradAngle}°</Label>
                            <input type="range" min={0} max={360} step={15} value={advGradAngle} onChange={(e) => { const v = Number(e.target.value); setAdvGradAngle(v); patchForm({ [bgKey]: buildGrad(advGradFrom, advGradTo, v) } as any) }} disabled={!canEdit} className="flex-1 accent-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">테두리</p>
                      <div className="flex items-center gap-2">
                        <input type="color" value={curBd && !curBd.startsWith("rgba") ? curBd : "#ffffff"} onChange={(e) => patchForm({ [bdKey]: e.target.value } as any)} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" />
                        <Input className="h-7 text-xs font-mono flex-1" value={curBd ?? ""} onChange={(e) => patchForm({ [bdKey]: e.target.value } as any)} disabled={!canEdit} placeholder="rgba(255,255,255,0.55)" />
                        {curBd && <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bdKey]: undefined } as any)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">쉐도우</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ADVSHADOWS.map((sp) => {
                          const sel = matchedSh?.id === sp.id || (!curSh && sp.id === "none")
                          return <button key={sp.id} type="button" disabled={!canEdit} onClick={() => patchForm({ [shKey]: sp.css === "none" ? undefined : sp.css } as any)} className={`px-2.5 py-1 rounded-full border text-[10px] transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background hover:border-muted-foreground/40"} disabled:opacity-50`}>{sp.label}</button>
                        })}
                      </div>
                      {curSh && curSh !== "none" && <Input className="h-7 text-xs font-mono mt-2" value={curSh} onChange={(e) => patchForm({ [shKey]: e.target.value } as any)} disabled={!canEdit} placeholder="0 8px 32px rgba(0,0,0,0.30)" />}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">백드롭 블러</p>
                        <div className="flex flex-wrap gap-1">
                          {[{ id:"none", label:"없음", val:0 }, { id:"light", label:"약하게", val:8 }, { id:"medium", label:"보통", val:18 }, { id:"strong", label:"강하게", val:32 }].map((b) => {
                            const sel = b.val === 0 ? !curBlur : curBlur === b.val
                            return <button key={b.id} type="button" disabled={!canEdit} onClick={() => patchForm({ [blurKey]: b.val === 0 ? undefined : b.val } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"} disabled:opacity-50`}>{b.label}</button>
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">모서리</p>
                        <div className="flex flex-wrap gap-1">
                          {[{ id:"sharp", label:"각지게", val:8 }, { id:"medium", label:"보통", val:16 }, { id:"round", label:"둥글게", val:24 }, { id:"pill", label:"최대", val:40 }].map((r) => {
                            const sel = curRad == null ? r.val === 24 : curRad === r.val
                            return <button key={r.id} type="button" disabled={!canEdit} onClick={() => patchForm({ [radKey]: r.val } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"} disabled:opacity-50`}>{r.label}</button>
                          })}
                        </div>
                      </div>
                    </div>
                    <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: undefined, [bdKey]: undefined, [shKey]: undefined, [blurKey]: undefined, [radKey]: undefined } as any)} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors disabled:opacity-50">
                      <RotateCcw className="h-2.5 w-2.5" />세부 설정 초기화 (프리셋으로 복귀)
                    </button>
                  </div>
                )
              })()}
            </div>

            {/* 섹션 이미지 */}
            <div className="pt-3 border-t space-y-2">
              <Label className="text-sm block">섹션 이미지</Label>
              <MultiImageUploader
                value={localForm.advantagesImages}
                onChange={(json) => patchForm({ advantagesImages: json })}
                disabled={!canEdit}
                label="장점 이미지"
              />
            </div>

            {/* 장점 섹션 배경 이미지 */}
            <div className="pt-3 border-t space-y-2 rounded-xl border border-border bg-muted/30 p-4">
              <Label className="text-sm font-medium block">섹션 배경 이미지</Label>
              <p className="text-xs text-muted-foreground mb-3">테마 색상(흰색/검정) 대신 이미지를 섹션 배경으로 사용합니다.</p>
              <SectionBgEditor
                imageUrl={localForm.advantagesBgImageUrl}
                cfg={localForm.advantagesBgImageCfg ? (() => { try { return JSON.parse(localForm.advantagesBgImageCfg!) } catch { return undefined } })() : undefined}
                onImageChange={(url) => patchForm({ advantagesBgImageUrl: url })}
                onCfgChange={(cfg: SectionBgImageCfg) => patchForm({ advantagesBgImageCfg: JSON.stringify(cfg) })}
                onClear={() => patchForm({ advantagesBgImageUrl: undefined, advantagesBgImageCfg: undefined })}
              />
            </div>

          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section ⑥ — 주의사항
            → 랜딩 반영: ⑤ precautions
        ══════════════════════════════════════════ */}
        <SectionCard
          title="⑥ 주의사항 — 시술 전후 · 금기"
          landingNum="⑥"
          isFocused={focusedSectionKey === "precautions"}
          onFocus={() => { setFocusedSectionKey("precautions"); setPreviewTab("landing") }}
          action={
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] bg-red-100 text-red-700">→ 랜딩 ⑤</Badge>
              {canEdit && (
                <button
                  onClick={() => handleAIFillSection("D")}
                  disabled={aiFillingSection === "D" || (treatmentData.aiExtractions.filter(i => i.status === "approved" || i.status === "modified").length === 0)}
                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-dashed border-primary/40 text-primary/60 hover:text-primary hover:border-primary disabled:opacity-30 transition-colors"
                >
                  {aiFillingSection === "D" ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                  AI 초안
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4">

            {/* 대제목 */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">섹션 대제목</Label>
              <Input
                className="text-sm"
                placeholder="안전한 시술을 위한 안내"
                value={localForm.precautionsTitle ?? ""}
                onChange={(e) => patchForm({ precautionsTitle: e.target.value })}
                disabled={!canEdit}
              />
            </div>

            {/* 상세 설명 */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">섹션 설명</Label>
              <RichTextEditor
                mode="floating"
                value={localForm.precautionsBody ?? ""}
                onChange={(html) => patchForm({ precautionsBody: html })}
                placeholder="시술 전후의 작은 흐름까지 함께 설계합니다."
                minHeight={60}
                disabled={!canEdit}
                style={{ fontSize: "12px" }}
              />
            </div>

            {/* 배경 테마 */}
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">배경 테마</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: "light", label: "화이트", bg: "#ffffff", fg: "#1a1a1a" },
                  { id: "dark",  label: "블랙",   bg: "#111111", fg: "#ffffff" },
                ] as const).map((th) => {
                  const sel = (localForm.precautionsTheme ?? "light") === th.id
                  return (
                    <button
                      key={th.id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => patchForm({ precautionsTheme: th.id })}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        sel ? "border-primary" : "border-border hover:border-muted-foreground/40"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="h-8 w-full" style={{ background: th.bg }} />
                      <p className="text-[9px] text-center py-1 leading-tight">{th.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 카드 박스 스타일 */}
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">카드 박스 스타일</p>
              <div className="grid grid-cols-5 gap-1.5">
                {([
                  { id: "default",       label: "글라스",        bg: "rgba(255,255,255,0.70)", border: "rgba(255,255,255,0.55)", shadow: "0 2px 20px rgba(0,0,0,0.06)" },
                  { id: "flat",          label: "플랫",          bg: "rgba(255,255,255,1)",    border: "rgba(0,0,0,0.08)",       shadow: "0 1px 4px rgba(0,0,0,0.06)" },
                  { id: "outline",       label: "아웃라인",      bg: "transparent",            border: "rgba(0,0,0,0.15)",       shadow: "none" },
                  { id: "glass-dark",    label: "다크 글라스",   bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.14)", shadow: "0 2px 20px rgba(0,0,0,0.35)" },
                  { id: "glass-gold",    label: "골드",          bg: "rgba(201,168,92,0.12)",  border: "rgba(201,168,92,0.28)",  shadow: "0 4px 16px rgba(201,168,92,0.18)" },
                  { id: "shadow-soft",   label: "소프트 쉐도우", bg: "rgba(255,255,255,0.98)", border: "transparent",           shadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" },
                  { id: "shadow-deep",   label: "딥 쉐도우",     bg: "rgba(255,255,255,1)",    border: "transparent",           shadow: "0 20px 60px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.10)" },
                  { id: "gradient-warm", label: "웜 그라데이션", bg: "linear-gradient(135deg, rgba(255,252,248,1) 0%, rgba(255,228,196,0.70) 100%)", border: "rgba(255,180,100,0.22)", shadow: "0 4px 20px rgba(255,150,80,0.12)" },
                  { id: "gradient-cool", label: "쿨 그라데이션", bg: "linear-gradient(135deg, rgba(240,249,255,1) 0%, rgba(206,238,255,0.80) 100%)", border: "rgba(100,180,255,0.22)", shadow: "0 4px 20px rgba(80,160,255,0.10)" },
                  { id: "gradient-rose", label: "로즈",          bg: "linear-gradient(135deg, rgba(255,245,248,1) 0%, rgba(255,212,226,0.75) 100%)", border: "rgba(255,140,170,0.22)", shadow: "0 4px 20px rgba(255,100,140,0.12)" },
                  { id: "neon-blue",     label: "네온 글로우",   bg: "rgba(240,248,255,0.85)", border: "rgba(80,160,255,0.55)",  shadow: "0 0 22px rgba(80,160,255,0.28), 0 0 8px rgba(80,160,255,0.16)" },
                  { id: "frosted",       label: "프로스티드",    bg: "rgba(255,255,255,0.38)", border: "rgba(255,255,255,0.75)", shadow: "0 8px 32px rgba(0,0,0,0.08)" },
                  { id: "inner-glow",    label: "인너 글로우",   bg: "rgba(255,255,255,0.96)", border: "rgba(190,170,255,0.38)", shadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 2px 20px rgba(180,150,255,0.18)" },
                ] as const).map((ps) => {
                  const sel = (localForm.precautionsBoxPreset ?? "default") === ps.id
                  return (
                    <button
                      key={ps.id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => patchForm({ precautionsBoxPreset: ps.id })}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        sel ? "border-primary" : "border-border hover:border-muted-foreground/40"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="h-10 w-full" style={{ background: ps.bg, border: `1px solid ${ps.border}`, boxShadow: ps.shadow }} />
                      <p className="text-[9px] text-center py-1 truncate px-1 leading-tight">{ps.label}</p>
                    </button>
                  )
                })}
              </div>
              {/* ⑤ 세부 박스 스타일 패널 */}
              <div className="flex items-center justify-between mt-2">
                <span />
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setShowPrecBoxPanel(!showPrecBoxPanel)}
                  className="text-[10px] text-primary hover:underline disabled:opacity-50"
                >
                  {showPrecBoxPanel ? "▲ 세부 설정 접기" : "▼ 세부 설정 열기"}
                </button>
              </div>
              {showPrecBoxPanel && (() => {
                const bgKey   = "precautionsCardBg" as const
                const bdKey   = "precautionsCardBorder" as const
                const shKey   = "precautionsCardShadow" as const
                const blurKey = "precautionsCardBlur" as const
                const radKey  = "precautionsCardRadius" as const
                const curBg   = localForm[bgKey] as string | undefined
                const curBd   = localForm[bdKey] as string | undefined
                const curSh   = localForm[shKey] as string | undefined
                const curBlur = localForm[blurKey] as number | undefined
                const curRad  = localForm[radKey]  as number | undefined
                const isGradient = curBg?.startsWith("linear-gradient") ?? false
                const buildGrad = (f: string, t: string, a: number) => `linear-gradient(${a}deg, ${f} 0%, ${t} 100%)`
                const PRECSHADOWS = [
                  { id: "none",    label: "없음",     css: "none" },
                  { id: "soft",    label: "부드럽게", css: "0 4px 20px rgba(0,0,0,0.18)" },
                  { id: "medium",  label: "보통",     css: "0 8px 32px rgba(0,0,0,0.30)" },
                  { id: "strong",  label: "강하게",   css: "0 12px 48px rgba(0,0,0,0.48), 0 2px 8px rgba(0,0,0,0.30)" },
                  { id: "glow-gold",   label: "골드 글로우",  css: "0 0 28px 4px rgba(201,168,92,0.45), 0 4px 16px rgba(201,168,92,0.25)" },
                  { id: "glow-teal",   label: "틸 글로우",    css: "0 0 28px 4px rgba(32,178,170,0.45), 0 4px 16px rgba(32,178,170,0.25)" },
                  { id: "glow-purple", label: "퍼플 글로우",  css: "0 0 28px 4px rgba(139,92,246,0.45), 0 4px 16px rgba(139,92,246,0.25)" },
                ]
                const matchedSh = PRECSHADOWS.find(s => s.css === curSh)
                return (
                  <div className="mt-3 space-y-4 rounded-xl border bg-muted/30 p-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">배경</p>
                        <div className="flex gap-1">
                          <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: curBg?.startsWith("linear-gradient") ? "#ffffff" : (curBg ?? "#ffffff") } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${!isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"}`}>단색</button>
                          <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: buildGrad(precGradFrom, precGradTo, precGradAngle) } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"}`}>그라데이션</button>
                        </div>
                      </div>
                      {!isGradient ? (
                        <div className="flex items-center gap-2">
                          <input type="color" value={curBg && !curBg.startsWith("rgba") && !curBg.startsWith("linear") ? curBg : "#ffffff"} onChange={(e) => patchForm({ [bgKey]: e.target.value } as any)} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" />
                          <Input className="h-7 text-xs font-mono flex-1" value={curBg ?? ""} onChange={(e) => patchForm({ [bgKey]: e.target.value } as any)} disabled={!canEdit} placeholder="rgba(255,255,255,0.70) 또는 #ffffff" />
                          {curBg && <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: undefined } as any)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="color" value={precGradFrom} onChange={(e) => { setPrecGradFrom(e.target.value); patchForm({ [bgKey]: buildGrad(e.target.value, precGradTo, precGradAngle) } as any) }} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" title="시작 색상" />
                            <span className="text-muted-foreground text-xs">→</span>
                            <input type="color" value={precGradTo} onChange={(e) => { setPrecGradTo(e.target.value); patchForm({ [bgKey]: buildGrad(precGradFrom, e.target.value, precGradAngle) } as any) }} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" title="끝 색상" />
                            <div className="flex-1 h-6 rounded" style={{ background: buildGrad(precGradFrom, precGradTo, precGradAngle) }} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-[10px] text-muted-foreground whitespace-nowrap">각도 {precGradAngle}°</Label>
                            <input type="range" min={0} max={360} step={15} value={precGradAngle} onChange={(e) => { const v = Number(e.target.value); setPrecGradAngle(v); patchForm({ [bgKey]: buildGrad(precGradFrom, precGradTo, v) } as any) }} disabled={!canEdit} className="flex-1 accent-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">테두리</p>
                      <div className="flex items-center gap-2">
                        <input type="color" value={curBd && !curBd.startsWith("rgba") ? curBd : "#ffffff"} onChange={(e) => patchForm({ [bdKey]: e.target.value } as any)} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" />
                        <Input className="h-7 text-xs font-mono flex-1" value={curBd ?? ""} onChange={(e) => patchForm({ [bdKey]: e.target.value } as any)} disabled={!canEdit} placeholder="rgba(255,255,255,0.55)" />
                        {curBd && <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bdKey]: undefined } as any)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">쉐도우</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PRECSHADOWS.map((sp) => {
                          const sel = matchedSh?.id === sp.id || (!curSh && sp.id === "none")
                          return <button key={sp.id} type="button" disabled={!canEdit} onClick={() => patchForm({ [shKey]: sp.css === "none" ? undefined : sp.css } as any)} className={`px-2.5 py-1 rounded-full border text-[10px] transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background hover:border-muted-foreground/40"} disabled:opacity-50`}>{sp.label}</button>
                        })}
                      </div>
                      {curSh && curSh !== "none" && <Input className="h-7 text-xs font-mono mt-2" value={curSh} onChange={(e) => patchForm({ [shKey]: e.target.value } as any)} disabled={!canEdit} placeholder="0 8px 32px rgba(0,0,0,0.30)" />}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">백드롭 블러</p>
                        <div className="flex flex-wrap gap-1">
                          {[{ id:"none", label:"없음", val:0 }, { id:"light", label:"약하게", val:8 }, { id:"medium", label:"보통", val:18 }, { id:"strong", label:"강하게", val:32 }].map((b) => {
                            const sel = b.val === 0 ? !curBlur : curBlur === b.val
                            return <button key={b.id} type="button" disabled={!canEdit} onClick={() => patchForm({ [blurKey]: b.val === 0 ? undefined : b.val } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"} disabled:opacity-50`}>{b.label}</button>
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">모서리</p>
                        <div className="flex flex-wrap gap-1">
                          {[{ id:"sharp", label:"각지게", val:8 }, { id:"medium", label:"보통", val:16 }, { id:"round", label:"둥글게", val:24 }, { id:"pill", label:"최대", val:40 }].map((r) => {
                            const sel = curRad == null ? r.val === 24 : curRad === r.val
                            return <button key={r.id} type="button" disabled={!canEdit} onClick={() => patchForm({ [radKey]: r.val } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"} disabled:opacity-50`}>{r.label}</button>
                          })}
                        </div>
                      </div>
                    </div>
                    <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: undefined, [bdKey]: undefined, [shKey]: undefined, [blurKey]: undefined, [radKey]: undefined } as any)} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors disabled:opacity-50">
                      <RotateCcw className="h-2.5 w-2.5" />세부 설정 초기화 (프리셋으로 복귀)
                    </button>
                  </div>
                )
              })()}
            </div>

            {/* 카드별 제목 커스터마이징 */}
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">카드 제목 커스터마이징</p>
              <div className="space-y-2">
                {([
                  { type: "before",           defaultTitle: "시술 전 안내",          placeholder: "시술 전 안내" },
                  { type: "after",            defaultTitle: "시술 후 케어",          placeholder: "시술 후 케어" },
                  { type: "contraindication", defaultTitle: "사전 상담이 필요한 경우", placeholder: "사전 상담이 필요한 경우" },
                  { type: "note",             defaultTitle: "기타 주의사항",         placeholder: "기타 주의사항" },
                ] as const).map((ct) => (
                  <div key={ct.type} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-16 shrink-0">
                      {ct.type === "before" ? "시술 전" : ct.type === "after" ? "시술 후" : ct.type === "contraindication" ? "금기" : "기타"}
                    </span>
                    <Input
                      className="text-xs h-7"
                      placeholder={ct.placeholder}
                      value={(localForm.precautionsCardTitles as Record<string,string> | undefined)?.[ct.type] ?? ""}
                      onChange={(e) => patchForm({
                        precautionsCardTitles: {
                          ...(localForm.precautionsCardTitles as Record<string,string> | undefined ?? {}),
                          [ct.type]: e.target.value,
                        }
                      })}
                      disabled={!canEdit}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 주의사항 항목 관리 */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">주의사항 항목 <span className="text-muted-foreground text-xs font-normal">(→ 랜딩 카드 내용)</span></Label>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddPrec(true)}>
                    <Plus className="h-3 w-3 mr-1" />카드 항목 추가
                  </Button>
                )}
              </div>
              {(["before","after","contraindication","note"] as TreatmentPrecautionType[]).map((ptype) => {
                const PREC_TYPE_LABELS: Record<TreatmentPrecautionType, string> = { before: "시술 전", after: "시술 후", contraindication: "금기", note: "기타 주의" }
                const items = [...treatmentData.precautions].filter((p) => p.type === ptype).sort((a, b) => a.sortOrder - b.sortOrder)
                if (items.length === 0) return null
                return (
                  <div key={ptype} className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{PREC_TYPE_LABELS[ptype]}</p>
                    <div className="space-y-1">
                      {items.map((prec, idx, arr) => (
                        <div key={prec.id} className="border rounded-md overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
                            <span className="flex-1 text-sm truncate">{prec.content}</span>
                            <Badge className={cn("text-xs shrink-0", prec.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>{prec.isPublic ? "공개" : "비공개"}</Badge>
                            <div className="flex items-center gap-1">
                              <button disabled={idx === 0 || !canEdit} onClick={() => movePrecaution(treatmentId, prec.id, "up")} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                              <button disabled={idx === arr.length - 1 || !canEdit} onClick={() => movePrecaution(treatmentId, prec.id, "down")} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                              <button onClick={() => { setExpandedPrecId(expandedPrecId === prec.id ? null : prec.id); setEditingPrec({ ...prec }) }} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                              {canEdit && <button onClick={() => deletePrecaution(treatmentId, prec.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>}
                            </div>
                          </div>
                          {expandedPrecId === prec.id && (
                            <div className="p-3 border-t space-y-2">
                              <div>
                                <Label className="text-xs mb-1 block">내용</Label>
                                <RichTextEditor mode="floating" value={(editingPrec.content as string) ?? ""} onChange={(html) => setEditingPrec((p) => ({ ...p, content: html }))} minHeight={60} disabled={!canEdit} style={{ fontSize: "12px" }} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch checked={!!(editingPrec.isPublic)} onCheckedChange={(v) => setEditingPrec((p) => ({ ...p, isPublic: v }))} disabled={!canEdit} />
                                <Label className="text-xs">공개</Label>
                              </div>
                              {canEdit && (
                                <div className="flex gap-2">
                                  <Button size="sm" className="h-7 text-xs" onClick={() => { updatePrecaution(treatmentId, prec.id, editingPrec as Partial<TreatmentPrecaution>); setExpandedPrecId(null) }}>저장</Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpandedPrecId(null)}>취소</Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {treatmentData.precautions.length === 0 && <p className="text-sm text-muted-foreground py-2 text-center">등록된 주의사항이 없습니다.</p>}
              {showAddPrec && (
                <div className="border rounded-md p-3 space-y-2 bg-muted/20 mt-2">
                  <p className="text-xs font-medium">항목 추가</p>
                  <div>
                    <Label className="text-xs mb-1 block">카드 유형</Label>
                    <Select value={newPrec.type} onValueChange={(v) => setNewPrec((p) => ({ ...p, type: v as TreatmentPrecautionType }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before">시술 전</SelectItem>
                        <SelectItem value="after">시술 후</SelectItem>
                        <SelectItem value="contraindication">금기</SelectItem>
                        <SelectItem value="note">기타 주의</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">내용</Label>
                    <RichTextEditor mode="floating" value={newPrec.content} onChange={(html) => setNewPrec((p) => ({ ...p, content: html }))} minHeight={60} style={{ fontSize: "12px" }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={newPrec.isPublic} onCheckedChange={(v) => setNewPrec((p) => ({ ...p, isPublic: v }))} />
                    <Label className="text-xs">공개 (랜딩 노출)</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={() => {
                      if (!newPrec.content.trim()) return
                      addPrecaution(treatmentId, { type: newPrec.type, content: newPrec.content, isPublic: newPrec.isPublic, sortOrder: treatmentData.precautions.length + 1 })
                      setNewPrec({ type: "before", content: "", isPublic: true })
                      setShowAddPrec(false)
                    }}>추가</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowAddPrec(false); setNewPrec({ type: "before", content: "", isPublic: true }) }}>취소</Button>
                  </div>
                </div>
              )}
            </div>

            {/* 섹션 이미지 */}
            <div className="pt-3 border-t space-y-2">
              <Label className="text-sm block">섹션 이미지</Label>
              <MultiImageUploader
                value={localForm.precautionsImages}
                onChange={(json) => patchForm({ precautionsImages: json })}
                disabled={!canEdit}
                label="주의사항 이미지"
              />
            </div>

            {/* 주의사항 섹션 배경 이미지 */}
            <div className="pt-3 border-t space-y-2 rounded-xl border border-border bg-muted/30 p-4">
              <Label className="text-sm font-medium block">섹션 배경 이미지</Label>
              <p className="text-xs text-muted-foreground mb-3">테마 색상(흰색/검정) 대신 이미지를 섹션 배경으로 사용합니다.</p>
              <SectionBgEditor
                imageUrl={localForm.precautionsBgImageUrl}
                cfg={localForm.precautionsBgImageCfg ? (() => { try { return JSON.parse(localForm.precautionsBgImageCfg!) } catch { return undefined } })() : undefined}
                onImageChange={(url) => patchForm({ precautionsBgImageUrl: url })}
                onCfgChange={(cfg: SectionBgImageCfg) => patchForm({ precautionsBgImageCfg: JSON.stringify(cfg) })}
                onClear={() => patchForm({ precautionsBgImageUrl: undefined, precautionsBgImageCfg: undefined })}
              />
            </div>

          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section ⑦ — 왜 타토아인가
            → 랜딩 반영: ⑥ why_tatoa
        ══════════════════════════════════════════ */}
        <SectionCard
          title="⑦ 왜 타토아인가"
          landingNum="⑦"
          isFocused={focusedSectionKey === "E"}
          onFocus={() => { setFocusedSectionKey("E"); setPreviewTab("landing") }}
          action={
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] bg-green-100 text-green-700">→ 랜딩 Why Tatoa</Badge>
              {canEdit && (
                <button
                  onClick={() => handleAIFillSection("E")}
                  disabled={aiFillingSection === "E" || (treatmentData.aiExtractions.filter(i => i.status === "approved" || i.status === "modified").length === 0)}
                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-dashed border-primary/40 text-primary/60 hover:text-primary hover:border-primary disabled:opacity-30 transition-colors"
                  title="승인된 AI 추출 항목으로 Why Tatoa 카드 채우기"
                >
                  {aiFillingSection === "E" ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                  AI 초안
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4">

            {/* 영어 제목 (eyebrow) */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">영어 제목 (eyebrow)</Label>
              <Input
                className="text-sm"
                placeholder="Why Tatoa"
                value={localForm.whyTatoaEyebrow ?? ""}
                onChange={(e) => patchForm({ whyTatoaEyebrow: e.target.value })}
                disabled={!canEdit}
              />
            </div>

            {/* 헤드라인 */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">헤드라인</Label>
              <Input
                className="text-sm"
                placeholder="왜 이 시술은 타토아여야 하는가"
                value={localForm.whyTatoaHeadline ?? ""}
                onChange={(e) => patchForm({ whyTatoaHeadline: e.target.value })}
                disabled={!canEdit}
              />
            </div>

            {/* 요약 문구 */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">요약 문구</Label>
              <RichTextEditor
                mode="floating"
                value={localForm.whyTatoaSummary ?? ""}
                onChange={(html) => patchForm({ whyTatoaSummary: html })}
                placeholder="장비가 아닌 철학이, 기술이 아닌 태도가 결과를 만듭니다."
                minHeight={60}
                disabled={!canEdit}
                style={{ fontSize: "12px" }}
              />
            </div>

            {/* 시술 철학 / 클리닉 강점 */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">시술 철학 / 클리닉 강점</Label>
              <RichTextEditor
                mode="floating"
                value={localForm.whyTatoaPhilosophy ?? ""}
                onChange={(html) => patchForm({ whyTatoaPhilosophy: html })}
                placeholder="타토아만의 시술 철학이나 의료 접근 방식을 서술하세요"
                minHeight={80}
                disabled={!canEdit}
                style={{ fontSize: "12px" }}
              />
            </div>

            {/* 배경 테마 */}
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">배경 테마</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: "dark",  label: "블랙 (기본)", bg: "#111111" },
                  { id: "light", label: "화이트",       bg: "#ffffff" },
                ] as const).map((th) => {
                  const sel = (localForm.whyTatoaTheme ?? "dark") === th.id
                  return (
                    <button
                      key={th.id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => patchForm({ whyTatoaTheme: th.id })}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        sel ? "border-primary" : "border-border hover:border-muted-foreground/40"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="h-8 w-full" style={{ background: th.bg }} />
                      <p className="text-[9px] text-center py-1 leading-tight">{th.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 카드 박스 스타일 */}
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">카드 박스 스타일</p>
              <div className="grid grid-cols-5 gap-1.5">
                {([
                  { id: "default",       label: "글라스",        bg: "rgba(255,255,255,0.70)", border: "rgba(255,255,255,0.55)", shadow: "0 2px 20px rgba(0,0,0,0.06)" },
                  { id: "flat",          label: "플랫",          bg: "rgba(255,255,255,1)",    border: "rgba(0,0,0,0.08)",       shadow: "0 1px 4px rgba(0,0,0,0.06)" },
                  { id: "outline",       label: "아웃라인",      bg: "transparent",            border: "rgba(0,0,0,0.15)",       shadow: "none" },
                  { id: "glass-dark",    label: "다크 글라스",   bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.14)", shadow: "0 2px 20px rgba(0,0,0,0.35)" },
                  { id: "glass-gold",    label: "골드",          bg: "rgba(201,168,92,0.12)",  border: "rgba(201,168,92,0.28)",  shadow: "0 4px 16px rgba(201,168,92,0.18)" },
                  { id: "shadow-soft",   label: "소프트 쉐도우", bg: "rgba(255,255,255,0.98)", border: "transparent",           shadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" },
                  { id: "shadow-deep",   label: "딥 쉐도우",     bg: "rgba(255,255,255,1)",    border: "transparent",           shadow: "0 20px 60px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.10)" },
                  { id: "gradient-warm", label: "웜 그라데이션", bg: "linear-gradient(135deg, rgba(255,252,248,1) 0%, rgba(255,228,196,0.70) 100%)", border: "rgba(255,180,100,0.22)", shadow: "0 4px 20px rgba(255,150,80,0.12)" },
                  { id: "gradient-cool", label: "쿨 그라데이션", bg: "linear-gradient(135deg, rgba(240,249,255,1) 0%, rgba(206,238,255,0.80) 100%)", border: "rgba(100,180,255,0.22)", shadow: "0 4px 20px rgba(80,160,255,0.10)" },
                  { id: "gradient-rose", label: "로즈",          bg: "linear-gradient(135deg, rgba(255,245,248,1) 0%, rgba(255,212,226,0.75) 100%)", border: "rgba(255,140,170,0.22)", shadow: "0 4px 20px rgba(255,100,140,0.12)" },
                  { id: "neon-blue",     label: "네온 글로우",   bg: "rgba(240,248,255,0.85)", border: "rgba(80,160,255,0.55)",  shadow: "0 0 22px rgba(80,160,255,0.28), 0 0 8px rgba(80,160,255,0.16)" },
                  { id: "frosted",       label: "프로스티드",    bg: "rgba(255,255,255,0.38)", border: "rgba(255,255,255,0.75)", shadow: "0 8px 32px rgba(0,0,0,0.08)" },
                  { id: "inner-glow",    label: "인너 글로우",   bg: "rgba(255,255,255,0.96)", border: "rgba(190,170,255,0.38)", shadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 2px 20px rgba(180,150,255,0.18)" },
                ] as const).map((ps) => {
                  const sel = (localForm.whyTatoaBoxPreset ?? "glass-dark") === ps.id
                  return (
                    <button
                      key={ps.id}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => patchForm({ whyTatoaBoxPreset: ps.id })}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        sel ? "border-primary" : "border-border hover:border-muted-foreground/40"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="h-10 w-full" style={{ background: ps.bg, border: `1px solid ${ps.border}`, boxShadow: ps.shadow }} />
                      <p className="text-[9px] text-center py-1 truncate px-1 leading-tight">{ps.label}</p>
                    </button>
                  )
                })}
              </div>
              {/* ⑥ 세부 박스 스타일 패널 */}
              <div className="flex items-center justify-between mt-2">
                <span />
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setShowWtBoxPanel(!showWtBoxPanel)}
                  className="text-[10px] text-primary hover:underline disabled:opacity-50"
                >
                  {showWtBoxPanel ? "▲ 세부 설정 접기" : "▼ 세부 설정 열기"}
                </button>
              </div>
              {showWtBoxPanel && (() => {
                const bgKey   = "whyTatoaCardBg" as const
                const bdKey   = "whyTatoaCardBorder" as const
                const shKey   = "whyTatoaCardShadow" as const
                const blurKey = "whyTatoaCardBlur" as const
                const radKey  = "whyTatoaCardRadius" as const
                const curBg   = localForm[bgKey] as string | undefined
                const curBd   = localForm[bdKey] as string | undefined
                const curSh   = localForm[shKey] as string | undefined
                const curBlur = localForm[blurKey] as number | undefined
                const curRad  = localForm[radKey]  as number | undefined
                const isGradient = curBg?.startsWith("linear-gradient") ?? false
                const buildGrad = (f: string, t: string, a: number) => `linear-gradient(${a}deg, ${f} 0%, ${t} 100%)`
                const WTSHADOWS = [
                  { id: "none",    label: "없음",     css: "none" },
                  { id: "soft",    label: "부드럽게", css: "0 4px 20px rgba(0,0,0,0.18)" },
                  { id: "medium",  label: "보통",     css: "0 8px 32px rgba(0,0,0,0.30)" },
                  { id: "strong",  label: "강하게",   css: "0 12px 48px rgba(0,0,0,0.48), 0 2px 8px rgba(0,0,0,0.30)" },
                  { id: "glow-gold",   label: "골드 글로우",  css: "0 0 28px 4px rgba(201,168,92,0.45), 0 4px 16px rgba(201,168,92,0.25)" },
                  { id: "glow-teal",   label: "틸 글로우",    css: "0 0 28px 4px rgba(32,178,170,0.45), 0 4px 16px rgba(32,178,170,0.25)" },
                  { id: "glow-purple", label: "퍼플 글로우",  css: "0 0 28px 4px rgba(139,92,246,0.45), 0 4px 16px rgba(139,92,246,0.25)" },
                ]
                const matchedSh = WTSHADOWS.find(s => s.css === curSh)
                return (
                  <div className="mt-3 space-y-4 rounded-xl border bg-muted/30 p-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">배경</p>
                        <div className="flex gap-1">
                          <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: curBg?.startsWith("linear-gradient") ? "#1a1a1a" : (curBg ?? "#1a1a1a") } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${!isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"}`}>단색</button>
                          <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: buildGrad(wtGradFrom, wtGradTo, wtGradAngle) } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"}`}>그라데이션</button>
                        </div>
                      </div>
                      {!isGradient ? (
                        <div className="flex items-center gap-2">
                          <input type="color" value={curBg && !curBg.startsWith("rgba") && !curBg.startsWith("linear") ? curBg : "#1a1a2e"} onChange={(e) => patchForm({ [bgKey]: e.target.value } as any)} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" />
                          <Input className="h-7 text-xs font-mono flex-1" value={curBg ?? ""} onChange={(e) => patchForm({ [bgKey]: e.target.value } as any)} disabled={!canEdit} placeholder="rgba(255,255,255,0.08) 또는 #1a1a2e" />
                          {curBg && <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: undefined } as any)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="color" value={wtGradFrom} onChange={(e) => { setWtGradFrom(e.target.value); patchForm({ [bgKey]: buildGrad(e.target.value, wtGradTo, wtGradAngle) } as any) }} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" title="시작 색상" />
                            <span className="text-muted-foreground text-xs">→</span>
                            <input type="color" value={wtGradTo} onChange={(e) => { setWtGradTo(e.target.value); patchForm({ [bgKey]: buildGrad(wtGradFrom, e.target.value, wtGradAngle) } as any) }} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" title="끝 색상" />
                            <div className="flex-1 h-6 rounded" style={{ background: buildGrad(wtGradFrom, wtGradTo, wtGradAngle) }} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-[10px] text-muted-foreground whitespace-nowrap">각도 {wtGradAngle}°</Label>
                            <input type="range" min={0} max={360} step={15} value={wtGradAngle} onChange={(e) => { const v = Number(e.target.value); setWtGradAngle(v); patchForm({ [bgKey]: buildGrad(wtGradFrom, wtGradTo, v) } as any) }} disabled={!canEdit} className="flex-1 accent-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">테두리</p>
                      <div className="flex items-center gap-2">
                        <input type="color" value={curBd && !curBd.startsWith("rgba") ? curBd : "#ffffff"} onChange={(e) => patchForm({ [bdKey]: e.target.value } as any)} disabled={!canEdit} className="h-8 w-10 rounded cursor-pointer border border-border disabled:opacity-50" />
                        <Input className="h-7 text-xs font-mono flex-1" value={curBd ?? ""} onChange={(e) => patchForm({ [bdKey]: e.target.value } as any)} disabled={!canEdit} placeholder="rgba(255,255,255,0.14)" />
                        {curBd && <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bdKey]: undefined } as any)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">쉐도우</p>
                      <div className="flex flex-wrap gap-1.5">
                        {WTSHADOWS.map((sp) => {
                          const sel = matchedSh?.id === sp.id || (!curSh && sp.id === "none")
                          return <button key={sp.id} type="button" disabled={!canEdit} onClick={() => patchForm({ [shKey]: sp.css === "none" ? undefined : sp.css } as any)} className={`px-2.5 py-1 rounded-full border text-[10px] transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background hover:border-muted-foreground/40"} disabled:opacity-50`}>{sp.label}</button>
                        })}
                      </div>
                      {curSh && curSh !== "none" && <Input className="h-7 text-xs font-mono mt-2" value={curSh} onChange={(e) => patchForm({ [shKey]: e.target.value } as any)} disabled={!canEdit} placeholder="0 8px 32px rgba(0,0,0,0.30)" />}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">백드롭 블러</p>
                        <div className="flex flex-wrap gap-1">
                          {[{ id:"none", label:"없음", val:0 }, { id:"light", label:"약하게", val:8 }, { id:"medium", label:"보통", val:18 }, { id:"strong", label:"강하게", val:32 }].map((b) => {
                            const sel = b.val === 0 ? !curBlur : curBlur === b.val
                            return <button key={b.id} type="button" disabled={!canEdit} onClick={() => patchForm({ [blurKey]: b.val === 0 ? undefined : b.val } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"} disabled:opacity-50`}>{b.label}</button>
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">모서리</p>
                        <div className="flex flex-wrap gap-1">
                          {[{ id:"sharp", label:"각지게", val:8 }, { id:"medium", label:"보통", val:16 }, { id:"round", label:"둥글게", val:24 }, { id:"pill", label:"최대", val:40 }].map((r) => {
                            const sel = curRad == null ? r.val === 24 : curRad === r.val
                            return <button key={r.id} type="button" disabled={!canEdit} onClick={() => patchForm({ [radKey]: r.val } as any)} className={`px-2 py-0.5 rounded text-[10px] border transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"} disabled:opacity-50`}>{r.label}</button>
                          })}
                        </div>
                      </div>
                    </div>
                    <button type="button" disabled={!canEdit} onClick={() => patchForm({ [bgKey]: undefined, [bdKey]: undefined, [shKey]: undefined, [blurKey]: undefined, [radKey]: undefined } as any)} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors disabled:opacity-50">
                      <RotateCcw className="h-2.5 w-2.5" />세부 설정 초기화 (프리셋으로 복귀)
                    </button>
                  </div>
                )
              })()}
            </div>

            {/* 섹션 이미지 */}
            <div className="pt-3 border-t space-y-2">
              <Label className="text-sm block">섹션 이미지</Label>
              <MultiImageUploader
                value={localForm.whyTatoaImages}
                onChange={(json) => patchForm({ whyTatoaImages: json })}
                disabled={!canEdit}
                label="타토아 이미지"
              />
            </div>

            {/* Why Tatoa 섹션 배경 이미지 */}
            <div className="pt-3 border-t space-y-2 rounded-xl border border-border bg-muted/30 p-4">
              <Label className="text-sm font-medium block">섹션 배경 이미지</Label>
              <p className="text-xs text-muted-foreground mb-3">테마 색상(흰색/검정) 대신 이미지를 섹션 배경으로 사용합니다.</p>
              <SectionBgEditor
                imageUrl={localForm.whyTatoaBgImageUrl}
                cfg={localForm.whyTatoaBgImageCfg ? (() => { try { return JSON.parse(localForm.whyTatoaBgImageCfg!) } catch { return undefined } })() : undefined}
                onImageChange={(url) => patchForm({ whyTatoaBgImageUrl: url })}
                onCfgChange={(cfg: SectionBgImageCfg) => patchForm({ whyTatoaBgImageCfg: JSON.stringify(cfg) })}
                onClear={() => patchForm({ whyTatoaBgImageUrl: undefined, whyTatoaBgImageCfg: undefined })}
              />
            </div>

            {/* 강점 카드 반복 항목 */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">강점 카드 <span className="text-muted-foreground text-xs font-normal">(랜딩 카드 항목)</span></Label>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddWhyTatoa(true)}>
                    <Plus className="h-3 w-3 mr-1" />카드 추가
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {[...treatmentData.whyTatoaCards].sort((a, b) => a.sortOrder - b.sortOrder).map((card, idx, arr) => (
                  <div key={card.id} className="border rounded-md overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
                      <span className="flex-1 text-sm font-medium truncate">{card.title}</span>
                      {card.description && <span className="text-xs text-muted-foreground truncate max-w-[160px]">{card.description}</span>}
                      <div className="flex items-center gap-1">
                        <button disabled={idx === 0 || !canEdit} onClick={() => moveWhyTatoaCard(treatmentId, card.id, "up")} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                        <button disabled={idx === arr.length - 1 || !canEdit} onClick={() => moveWhyTatoaCard(treatmentId, card.id, "down")} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                        <button onClick={() => { setExpandedWhyTatoaId(expandedWhyTatoaId === card.id ? null : card.id); setEditingWhyTatoa({ ...card }) }} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                        {canEdit && <button onClick={() => deleteWhyTatoaCard(treatmentId, card.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>}
                      </div>
                    </div>
                    {expandedWhyTatoaId === card.id && (
                      <div className="p-3 border-t space-y-2">
                        <div><Label className="text-xs mb-1 block">제목 *</Label><Input className="h-8 text-xs" value={(editingWhyTatoa.title as string) ?? ""} onChange={(e) => setEditingWhyTatoa((p) => ({ ...p, title: e.target.value }))} disabled={!canEdit} /></div>
                        <div><Label className="text-xs mb-1 block">설명</Label><RichTextEditor mode="floating" value={(editingWhyTatoa.description as string) ?? ""} onChange={(html) => setEditingWhyTatoa((p) => ({ ...p, description: html }))} minHeight={60} disabled={!canEdit} style={{ fontSize: "12px" }} /></div>
                        {canEdit && (
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7 text-xs" onClick={() => { updateWhyTatoaCard(treatmentId, card.id, editingWhyTatoa as Partial<TreatmentWhyTatoaCard>); setExpandedWhyTatoaId(null) }}>저장</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpandedWhyTatoaId(null)}>취소</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {treatmentData.whyTatoaCards.length === 0 && <p className="text-sm text-muted-foreground py-2 text-center">등록된 강점 카드가 없습니다.</p>}
              </div>
              {showAddWhyTatoa && (
                <div className="border rounded-md p-3 space-y-2 bg-muted/20 mt-2">
                  <p className="text-xs font-medium">강점 카드 추가</p>
                  <div><Label className="text-xs mb-1 block">제목 *</Label><Input className="h-8 text-xs" value={newWhyTatoa.title} onChange={(e) => setNewWhyTatoa((p) => ({ ...p, title: e.target.value }))} /></div>
                  <div><Label className="text-xs mb-1 block">설명</Label><RichTextEditor mode="floating" value={newWhyTatoa.description} onChange={(html) => setNewWhyTatoa((p) => ({ ...p, description: html }))} minHeight={60} style={{ fontSize: "12px" }} /></div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={() => {
                      if (!newWhyTatoa.title.trim()) return
                      addWhyTatoaCard(treatmentId, { title: newWhyTatoa.title, description: newWhyTatoa.description, sortOrder: treatmentData.whyTatoaCards.length + 1 })
                      setNewWhyTatoa({ title: "", description: "" })
                      setShowAddWhyTatoa(false)
                    }}>추가</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowAddWhyTatoa(false); setNewWhyTatoa({ title: "", description: "" }) }}>취소</Button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section ⑧ — FAQ
            → 랜딩 반영: ⑧ faq
        ══════════════════════════════════════════ */}
        <SectionCard
          title="⑧ FAQ"
          landingNum="⑧"
          isFocused={focusedSectionKey === "faq"}
          onFocus={() => { setFocusedSectionKey("faq"); setPreviewTab("landing") }}
          action={
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] bg-indigo-100 text-indigo-700">→ 랜딩 ⑧</Badge>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">AI 추출 항목 중 FAQ 카테고리가 여기에 표시됩니다. 직접 추가/수정 가능합니다.</p>
            {/* Show FAQ items from aiExtractions */}
            {treatmentData.aiExtractions
              .filter((it) => it.category === "faq" && (it.status === "approved" || it.status === "modified"))
              .map((item) => {
                const raw = item.modifiedContent ?? item.content
                const qMatch = raw.match(/Q[：:]\s*(.+?)(?:\n|A[：:])/i)
                const aMatch = raw.match(/A[：:]\s*([\s\S]+)/i)
                const q = qMatch?.[1]?.trim() ?? raw.split("\n")[0]?.trim() ?? raw.slice(0, 60)
                const a = aMatch?.[1]?.trim() ?? raw.slice(60)
                return (
                  <div key={item.id} className="border rounded-md p-3 space-y-1">
                    <p className="text-xs font-medium text-foreground">Q. {q}</p>
                    <p className="text-xs text-muted-foreground">A. {a}</p>
                  </div>
                )
              })
            }
            {treatmentData.aiExtractions.filter((it) => it.category === "faq" && (it.status === "approved" || it.status === "modified")).length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                FAQ 항목이 없습니다. AI 추출 패널에서 FAQ 카테고리 항목을 승인하거나, 위 AI 추출 섹션에서 생성하세요.
              </div>
            )}

            {/* 섹션 이미지 */}
            <div className="pt-3 border-t space-y-2">
              <Label className="text-sm block">섹션 이미지</Label>
              <MultiImageUploader
                value={localForm.faqImages}
                onChange={(json) => patchForm({ faqImages: json })}
                disabled={!canEdit}
                label="FAQ 이미지"
              />
            </div>

            {/* FAQ 섹션 배경 이미지 */}
            <div className="pt-3 border-t space-y-2 rounded-xl border border-border bg-muted/30 p-4">
              <Label className="text-sm font-medium block">섹션 배경 이미지</Label>
              <p className="text-xs text-muted-foreground mb-3">테마 색상(흰색/검정) 대신 이미지를 섹션 배경으로 사용합니다.</p>
              <SectionBgEditor
                imageUrl={localForm.faqBgImageUrl}
                cfg={localForm.faqBgImageCfg ? (() => { try { return JSON.parse(localForm.faqBgImageCfg!) } catch { return undefined } })() : undefined}
                onImageChange={(url) => patchForm({ faqBgImageUrl: url })}
                onCfgChange={(cfg: SectionBgImageCfg) => patchForm({ faqBgImageCfg: JSON.stringify(cfg) })}
                onClear={() => patchForm({ faqBgImageUrl: undefined, faqBgImageCfg: undefined })}
              />
            </div>
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section ⑨ — 마지막 CTA
            → 랜딩 반영: ⑨ final_cta
        ══════════════════════════════════════════ */}
        <SectionCard
          title="⑨ 마지막 CTA — 최종 전환 유도"
          landingNum="⑨"
          isFocused={focusedSectionKey === "cta"}
          onFocus={() => { setFocusedSectionKey("cta"); setPreviewTab("landing") }}
          action={
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] bg-pink-100 text-pink-700">→ 랜딩 ⑨</Badge>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">CTA 버튼은 ① 히어로 섹션에서 설정한 값이 자동 사용됩니다. 아래 문구만 이 섹션에서 커스터마이징하세요.</p>
            <div>
              <Label className="text-sm mb-1 block">최종 헤드라인</Label>
              <Input
                value={localForm.finalCtaHeadline ?? ""}
                onChange={(e) => patchForm({ finalCtaHeadline: e.target.value })}
                disabled={!canEdit}
                placeholder={`지금, ${localForm.name ?? "시술명"}을 시작하세요.`}
              />
              <p className="text-xs text-muted-foreground mt-0.5">비워두면 "지금, {"{시술명}"}을 시작하세요."가 자동 생성됩니다.</p>
            </div>
            <div>
              <Label className="text-sm mb-1 block">마지막 설명 문구</Label>
              <RichTextEditor
                mode="floating"
                value={localForm.whyTatoaSummary ?? ""}
                onChange={(html) => patchForm({ whyTatoaSummary: html })}
                placeholder="전담 의료진이 1:1 상담으로 가장 알맞은 흐름을 설계해드립니다."
                minHeight={60}
                disabled={!canEdit}
                style={{ fontSize: "12px" }}
              />
            </div>
            {/* Preview of composed CTA */}
            {localForm.name && (
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">미리보기</p>
                <p className="text-sm font-semibold">{localForm.finalCtaHeadline ?? `지금, ${localForm.name}을 시작하세요.`}</p>
                <p className="text-xs text-muted-foreground">{localForm.whyTatoaSummary || "전담 의료진이 1:1 상담으로 가장 알맞은 흐름을 설계해드립니다."}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-foreground text-background rounded-full px-3 py-1">{localForm.ctaPrimaryLabel || "예약 상담 신청"} →</span>
                  {(localForm.ctaSecondaryLabel || localForm.phoneUrl || localForm.kakaoUrl) && (
                    <span className="text-xs border rounded-full px-3 py-1">{localForm.ctaSecondaryLabel || "전화 문의"}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section — 하단 고정 CTA 바
        ══════════════════════════════════════════ */}
        <SectionCard
          title="하단 고정 CTA 바"
          action={<Badge className="text-[10px] bg-slate-100 text-slate-600">랜딩 하단 떠있는 버튼</Badge>}
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              랜딩 페이지 하단에 항상 떠 있는 전환 유도 바입니다.
              비워두면 ① 히어로 섹션의 CTA 버튼·링크가 그대로 사용됩니다.
            </p>

            {/* 주 버튼 (오른쪽 — 흰색 솔리드) */}
            <div className="space-y-2 p-3 rounded-lg border bg-muted/10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">주 버튼 (오른쪽 · 흰색)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs mb-1 block">버튼 문구</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder={localForm.ctaPrimaryLabel || "예약 상담 신청"}
                    value={localForm.ctaBarPrimaryLabel ?? ""}
                    onChange={(e) => patchForm({ ctaBarPrimaryLabel: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">연결 링크</Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    placeholder={localForm.bookingUrl || "https://..."}
                    value={localForm.ctaBarPrimaryHref ?? ""}
                    onChange={(e) => patchForm({ ctaBarPrimaryHref: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>

            {/* 보조 버튼 (왼쪽 — 아웃라인) */}
            <div className="space-y-2 p-3 rounded-lg border bg-muted/10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">보조 버튼 (왼쪽 · 아웃라인)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs mb-1 block">버튼 문구</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder={localForm.ctaSecondaryLabel || "전화 문의"}
                    value={localForm.ctaBarSecondaryLabel ?? ""}
                    onChange={(e) => patchForm({ ctaBarSecondaryLabel: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">연결 링크</Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    placeholder={localForm.phoneUrl || localForm.kakaoUrl || "tel:02-..."}
                    value={localForm.ctaBarSecondaryHref ?? ""}
                    onChange={(e) => patchForm({ ctaBarSecondaryHref: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>

            {/* 미리보기 */}
            <div className="rounded-xl overflow-hidden border" style={{ background: "rgba(8,8,8,0.84)" }}>
              <div className="flex gap-2 p-3">
                <div className="flex-1 h-10 rounded-full border border-white/25 flex items-center justify-center">
                  <span className="text-xs text-white/80">{localForm.ctaBarSecondaryLabel || localForm.ctaSecondaryLabel || "전화 문의"}</span>
                </div>
                <div className="flex-[2] h-10 rounded-full bg-white flex items-center justify-center gap-1.5">
                  <span className="text-xs font-semibold text-black">{localForm.ctaBarPrimaryLabel || localForm.ctaPrimaryLabel || "예약 상담 신청"}</span>
                  <span className="text-[10px] text-black/50">→</span>
                </div>
              </div>
              <p className="text-[9px] text-white/30 text-center pb-2">미리보기 (실제 랜딩 하단에 표시)</p>
            </div>
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section G-Link — 연결 콘텐츠 (관계 관리)
        ══════════════════════════════════════════ */}
        <SectionCard
          title="G-Link. 연결 콘텐츠"
          action={
            canEdit ? (
              <Button variant="outline" size="sm" onClick={() => setShowAddRelation(true)}>
                <Plus className="h-3 w-3 mr-1" />
                관계 추가
              </Button>
            ) : undefined
          }
        >
          <div className="space-y-2">
            {relations.length === 0 && (
              <p className="text-sm text-muted-foreground py-3 text-center">연결된 콘텐츠가 없습니다.</p>
            )}
            {[...relations].sort((a, b) => a.sortOrder - b.sortOrder).map((rel, idx, arr) => (
              <div key={rel.id} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="text-xs bg-blue-100 text-blue-700">
                    {CONTENT_NODE_TYPE_LABELS[rel.targetType] ?? rel.targetType}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">{rel.targetId}</span>
                  <Badge className="text-xs bg-purple-100 text-purple-700">
                    {RELATION_TYPE_LABELS[rel.relationType] ?? rel.relationType}
                  </Badge>
                  <div className="flex gap-1 ml-auto">
                    {["homepage", "landing", "chatbot", "internalOnly"].map((k) => (
                      <label key={k} className="flex items-center gap-0.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!(rel.use as Record<string, boolean>)[k]}
                          onChange={(e) => updateRelation(rel.id, { use: { ...rel.use, [k]: e.target.checked } })}
                          disabled={!canEdit}
                          className="h-3 w-3"
                        />
                        <span className="text-muted-foreground">{k === "homepage" ? "홈" : k === "landing" ? "랜딩" : k === "chatbot" ? "챗봇" : "내부"}</span>
                      </label>
                    ))}
                    <button disabled={idx === 0 || !canEdit} onClick={() => moveRelation(rel.id, "up")} className="text-muted-foreground hover:text-foreground disabled:opacity-30 ml-1">
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button disabled={idx === arr.length - 1 || !canEdit} onClick={() => moveRelation(rel.id, "down")} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {canEdit && (
                      <button onClick={() => removeRelation(rel.id)} className="text-red-400 hover:text-red-600 ml-1">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                {rel.note && <p className="text-xs text-muted-foreground">{rel.note}</p>}
              </div>
            ))}
            {showAddRelation && (
              <div className="border rounded-md p-3 space-y-2 bg-muted/20 mt-2">
                <p className="text-xs font-medium">관계 추가</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs mb-1 block">대상 유형</Label>
                    <Select value={(newRelation.targetType as string) ?? ""} onValueChange={(v) => setNewRelation((p) => ({ ...p, targetType: v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="선택" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTENT_NODE_TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">관계 유형</Label>
                    <Select value={(newRelation.relationType as string) ?? ""} onValueChange={(v) => setNewRelation((p) => ({ ...p, relationType: v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="선택" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(RELATION_TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">대상 ID</Label>
                  <Input className="h-8 text-xs" value={(newRelation.targetId as string) ?? ""} onChange={(e) => setNewRelation((p) => ({ ...p, targetId: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">메모</Label>
                  <Input className="h-8 text-xs" value={(newRelation.note as string) ?? ""} onChange={(e) => setNewRelation((p) => ({ ...p, note: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={() => {
                    if (!newRelation.targetType || !newRelation.targetId || !newRelation.relationType) return
                    addRelation({
                      sourceType: "treatment",
                      sourceId: treatmentId,
                      targetType: newRelation.targetType as ContentNodeType,
                      targetId: newRelation.targetId as string,
                      relationType: newRelation.relationType as RelationType,
                      use: { homepage: false, landing: false, chatbot: false, internalOnly: false },
                      note: newRelation.note as string | undefined,
                      sortOrder: relations.length + 1,
                      branchId: profile.branchId,
                    })
                    setNewRelation({})
                    setShowAddRelation(false)
                  }}>추가</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowAddRelation(false); setNewRelation({}) }}>취소</Button>
                </div>
              </div>
            )}

            {/* Legacy linked IDs (backwards compat) */}
            {(treatmentData.linkedEquipmentIds.length > 0 || treatmentData.linkedDoctorIds.length > 0 || treatmentData.linkedFaqIds.length > 0) && (
              <div className="pt-3 border-t mt-3">
                <p className="text-xs text-muted-foreground mb-2">아래 항목은 레거시 연결입니다. 위 관계 편집기를 사용하세요.</p>
                {treatmentData.linkedEquipmentIds.length > 0 && (
                  <div className="mb-1">
                    <span className="text-xs text-muted-foreground mr-2">장비:</span>
                    {treatmentData.linkedEquipmentIds.map((id) => (
                      <Badge key={id} className="text-xs bg-muted text-muted-foreground mr-1">{id}</Badge>
                    ))}
                  </div>
                )}
                {treatmentData.linkedDoctorIds.length > 0 && (
                  <div className="mb-1">
                    <span className="text-xs text-muted-foreground mr-2">의사:</span>
                    {treatmentData.linkedDoctorIds.map((id) => (
                      <Badge key={id} className="text-xs bg-muted text-muted-foreground mr-1">{id}</Badge>
                    ))}
                  </div>
                )}
                {treatmentData.linkedFaqIds.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground mr-2">FAQ:</span>
                    {treatmentData.linkedFaqIds.map((id) => (
                      <Badge key={id} className="text-xs bg-muted text-muted-foreground mr-1">{id}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section G — 홈페이지 카드 설정 (보조)
        ══════════════════════════════════════════ */}
        <SectionCard title="카드 설정 (보조)" supplementary={true}>
          <p className="text-xs text-muted-foreground mb-3">카드 제목/부제를 비워두면 시술명/한줄설명이 자동 사용됩니다</p>
          <div className="space-y-3">
            <div>
              <Label className="text-sm mb-1 block">카드 제목 (자동채움: 시술명)</Label>
              <Input value={localForm.cardTitle ?? ""} onChange={(e) => patchForm({ cardTitle: e.target.value })} disabled={!canEdit} placeholder={localForm.name ?? profile.name} />
            </div>
            <div>
              <Label className="text-sm mb-1 block">카드 부제 (자동채움: 한줄설명)</Label>
              <Input value={localForm.cardDescription ?? ""} onChange={(e) => patchForm({ cardDescription: e.target.value })} disabled={!canEdit} placeholder={localForm.oneLinePitch ?? profile.oneLinePitch} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1 block">가격 텍스트</Label>
                <Input value={localForm.cardPriceText ?? ""} onChange={(e) => patchForm({ cardPriceText: e.target.value })} disabled={!canEdit} placeholder="120만원~" />
              </div>
              <div>
                <Label className="text-sm mb-1 block">시간 텍스트</Label>
                <Input value={localForm.cardDurationText ?? ""} onChange={(e) => patchForm({ cardDurationText: e.target.value })} disabled={!canEdit} placeholder="약 60분" />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1 block">배지 텍스트</Label>
              <Input value={localForm.cardBadge ?? ""} onChange={(e) => patchForm({ cardBadge: e.target.value })} disabled={!canEdit} placeholder="EVENT, 베스트..." />
              {canEdit && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {["EVENT", "대표", "신상", "BEST", "인기", ""].map((b) => (
                    <button
                      key={b === "" ? "__clear" : b}
                      type="button"
                      onClick={() => patchForm({ cardBadge: b })}
                      className={cn(
                        "rounded px-2 py-0.5 text-xs border transition-colors",
                        localForm.cardBadge === b
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground hover:text-foreground border-border"
                      )}
                    >
                      {b === "" ? "없음" : b}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Thumbnail preview */}
            {effectiveAssets.find((a) => a.fileType === "image") && (
              <div>
                <Label className="text-sm mb-1 block">썸네일 미리보기</Label>
                <div className="w-24 h-24 rounded-md overflow-hidden bg-muted">
                  <img
                    src={effectiveAssets.find((a) => a.fileType === "image")!.fileUrl}
                    alt="썸네일"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section H — 랜딩 구조 설정 (보조 패널)
            역할: 섹션 노출/순서/잠금만 담당
            메인 콘텐츠 편집은 A-F 섹션 폼에서 함
        ══════════════════════════════════════════ */}
        <SectionCard
          title="랜딩 구조 설정 (보조)"
          supplementary={true}
          action={
            canEdit ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground"
                  onClick={() => setLandingStructureExpanded(!landingStructureExpanded)}
                >
                  {landingStructureExpanded ? "접기" : "고급 설정"}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", landingStructureExpanded && "rotate-180")} />
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1.5 bg-primary/90 hover:bg-primary"
                  onClick={() => setShowAiModal(true)}
                >
                  <Sparkles className="h-3 w-3" />AI 생성
                </Button>
              </div>
            ) : undefined
          }
        >
          <div className="space-y-3">
            {/* ── 안내 문구 ── */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              각 섹션의 콘텐츠는 위 <strong>A–F 섹션 폼</strong>에서 직접 입력하세요.
              여기서는 섹션 노출 여부와 순서만 설정합니다.
            </p>

            {/* ── 노출 preset 선택 ── */}
            {canEdit && (
              <div className="flex flex-wrap items-center gap-2 py-2 border-b">
                <span className="text-xs text-muted-foreground shrink-0">노출 구조 프리셋:</span>
                <button
                  onClick={() => applyPDFTemplate("full")}
                  className="px-2.5 py-1 rounded-full text-xs border border-primary/50 text-primary hover:bg-primary/5 transition-colors"
                  title="PDF 기준 Full 12섹션"
                >Full</button>
                <button
                  onClick={() => applyPDFTemplate("compact")}
                  className="px-2.5 py-1 rounded-full text-xs border border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                  title="핵심 7섹션만"
                >Compact</button>
                <button
                  onClick={() => applyPDFTemplate("extended")}
                  className="px-2.5 py-1 rounded-full text-xs border border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                  title="갤러리+지점 포함 14섹션"
                >Extended</button>
                <span className="text-[10px] text-muted-foreground/60 ml-auto">기존 섹션을 초기화하고 프리셋 적용</span>
              </div>
            )}

            {/* ── 섹션 체크리스트 (compact) ── */}
            {[...treatmentData.landingSections].sort((a, b) => a.sortOrder - b.sortOrder).map((sec, idx, arr) => {
              const locked = isSectionLocked(treatmentId, sec.id)
              return (
                <div key={sec.id} className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-colors",
                  locked ? "border-amber-200 bg-amber-50/30" : "border-transparent hover:border-muted",
                  !sec.isVisible && "opacity-50"
                )}>
                  {/* Visibility toggle */}
                  <Switch
                    checked={sec.isVisible}
                    onCheckedChange={(v) => updateLandingSection(treatmentId, sec.id, { isVisible: v })}
                    disabled={!canEdit}
                    className="h-4 w-7 shrink-0"
                  />
                  {/* Order */}
                  <span className="text-[10px] text-muted-foreground/50 w-4 shrink-0">{sec.sortOrder}</span>
                  {/* Section name */}
                  <span className="flex-1 text-xs truncate">{LANDING_SECTION_TYPE_LABELS[sec.sectionType] ?? sec.sectionType}</span>
                  {/* Edit (opens modal) */}
                  <button
                    onClick={() => setEditingLandingSection(sec)}
                    className="text-muted-foreground/40 hover:text-muted-foreground"
                    title="세부 스타일/레이아웃 편집"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {/* Lock */}
                  {canEdit && (
                    <button
                      onClick={() => toggleSectionLock(treatmentId, sec.id)}
                      className={cn("shrink-0 transition-colors", locked ? "text-amber-500" : "text-muted-foreground/30 hover:text-muted-foreground")}
                      title={locked ? "잠금 해제" : "AI 덮어쓰기 잠금"}
                    >
                      {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    </button>
                  )}
                  {/* Up/down */}
                  {canEdit && (
                    <div className="flex flex-col gap-0.5">
                      <button disabled={idx === 0} onClick={() => moveLandingSection(treatmentId, sec.id, "up")} className="text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 leading-none">
                        <ChevronUp className="h-2.5 w-2.5" />
                      </button>
                      <button disabled={idx === arr.length - 1} onClick={() => moveLandingSection(treatmentId, sec.id, "down")} className="text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 leading-none">
                        <ChevronDown className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Empty state */}
            {treatmentData.landingSections.length === 0 && (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-muted-foreground">프리셋 선택으로 기본 구조를 생성하거나 AI로 초안을 만드세요.</p>
                <div className="flex justify-center gap-2">
                  <button onClick={() => applyPDFTemplate("full")} className="text-xs px-3 py-1.5 rounded-full border border-primary/50 text-primary hover:bg-primary/5">Full 구조 적용</button>
                </div>
              </div>
            )}

            {/* ── 고급 설정 — collapsible full builder ── */}
            {landingStructureExpanded && (
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">고급 설정</p>
                  {canEdit && (
                    <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => setShowAddSection(true)}>
                      <Plus className="h-2.5 w-2.5" />섹션 추가
                    </Button>
                  )}
                </div>
                {/* Pending Draft Banner */}
                {getPendingDraft(treatmentId) && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                        <p className="text-xs font-medium">AI 초안 준비됨 — {getPendingDraft(treatmentId)!.sections.length}개 섹션</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setShowDraftPanel(!showDraftPanel)}><Eye className="h-2.5 w-2.5 mr-1" />미리보기</Button>
                        <Button size="sm" className="h-6 text-[10px] bg-primary" onClick={() => handleApplyDraft(getPendingDraft(treatmentId)!)}><Check className="h-2.5 w-2.5 mr-1" />적용</Button>
                        <button onClick={() => discardPendingDraft(treatmentId)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Add section form */}
                {showAddSection && (
                  <div className="border rounded-md p-3 space-y-2 bg-muted/20">
                    <p className="text-xs font-medium">섹션 추가</p>
                    <Select value={(newSection.sectionType as string) ?? ""} onValueChange={(v) => setNewSection((p) => ({ ...p, sectionType: v as LandingSectionType }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="유형 선택" /></SelectTrigger>
                      <SelectContent>
                        {ALL_LANDING_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{LANDING_SECTION_TYPE_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input className="h-8 text-xs" placeholder="제목" value={(newSection.title as string) ?? ""} onChange={(e) => setNewSection((p) => ({ ...p, title: e.target.value }))} />
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={() => {
                        if (!newSection.sectionType) return
                        addLandingSection(treatmentId, {
                          sectionType: newSection.sectionType as LandingSectionType,
                          title: newSection.title as string | undefined,
                          isVisible: true,
                          sortOrder: treatmentData.landingSections.length + 1,
                        })
                        setNewSection({})
                        setShowAddSection(false)
                      }}>추가</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowAddSection(false); setNewSection({}) }}>취소</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section I — 자산 라이브러리
        ══════════════════════════════════════════ */}
        <SectionCard title="I. 자산 라이브러리">
          <Tabs value={assetTab} onValueChange={(v) => setAssetTab(v as typeof assetTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="hq_common">본사 공통 ({hqAssets.length})</TabsTrigger>
              <TabsTrigger value="branch_specific">지점 전용 ({branchAssets.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="hq_common">
              {hqAssets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">본사 공통 자산이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {hqAssets.map((asset) => {
                    const isHidden = profile.hiddenMasterAssetIds.includes(asset.id)
                    return (
                      <div key={asset.id} className={cn("border rounded-md p-3 flex items-center gap-3", isHidden && "opacity-50")}>
                        {asset.fileType === "image" ? (
                          <div className="w-12 h-12 rounded overflow-hidden bg-muted shrink-0">
                            <img src={asset.fileUrl} alt={asset.title ?? asset.fileName} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                            {asset.fileType === "pdf" ? <FileText className="h-5 w-5 text-muted-foreground" /> : <Video className="h-5 w-5 text-muted-foreground" />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{asset.title ?? asset.fileName}</p>
                          <p className="text-xs text-muted-foreground">{asset.assetType}</p>
                        </div>
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => toggleMasterAssetVisibility(treatmentId, asset.id)}
                          >
                            {isHidden ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                            {isHidden ? "표시" : "숨기기"}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="branch_specific">
              <div className="space-y-3">
                {canUpload && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf,video/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      파일 업로드 (이미지 ≤20MB, PDF ≤50MB, 영상 ≤300MB)
                    </Button>
                  </div>
                )}
                {/* Image grid */}
                {branchAssets.filter((a) => a.fileType === "image").length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">이미지</p>
                    <div className="grid grid-cols-3 gap-2">
                      {branchAssets.filter((a) => a.fileType === "image").map((asset) => {
                        const usage = assetUsageMap.get(asset.id)
                        return (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            treatmentId={treatmentId}
                            canEdit={canEdit}
                            onUpdate={updateAsset}
                            onDelete={deleteAsset}
                            onReorder={reorderAsset}
                            onStyleEdit={setEditingStyleAsset}
                            variantCount={getVariants(asset.id).length}
                            connectionCount={usage ? countAssetConnections(usage) : 0}
                            connectionTooltip={usage ? assetConnectionTooltip(usage) : "연결 없음"}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
                {/* PDF/video list */}
                {branchAssets.filter((a) => a.fileType !== "image").length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">PDF / 영상</p>
                    <div className="space-y-2">
                      {branchAssets.filter((a) => a.fileType !== "image").map((asset) => (
                        <AssetListRow key={asset.id} asset={asset} treatmentId={treatmentId} canEdit={canEdit} onUpdate={updateAsset} onDelete={deleteAsset} />
                      ))}
                    </div>
                  </div>
                )}
                {branchAssets.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">업로드된 지점 전용 자산이 없습니다.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section J — URL / 배포 설정
        ══════════════════════════════════════════ */}
        <SectionCard
          title="J. URL / 배포 설정"
          action={
            canEdit ? (
              <Button variant="outline" size="sm" onClick={() => setShowAddUrl(true)}>
                <Plus className="h-3 w-3 mr-1" />
                URL 추가
              </Button>
            ) : undefined
          }
        >
          <div className="space-y-3">
            {primaryDomain && (
              <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <Globe className="h-3 w-3 inline mr-1" />
                기본 도메인: <span className="font-mono font-medium text-foreground">{primaryDomain.domain}</span>
              </div>
            )}
            {domainUrls.map((url) => {
              const basePath = url.pageType === "landing" ? (primaryDomain?.landingBasePath ?? "") : (primaryDomain?.homepageBasePath ?? "")
              const fullUrl = primaryDomain ? computeFullUrl(profile.branchId, basePath, url.slug) : `/${url.slug}`
              const isUnique = isSlugUnique(profile.branchId, url.pageType, url.slug, url.id)
              return (
                <div key={url.id} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="text-xs bg-teal-100 text-teal-700">{url.pageType}</Badge>
                    <Switch checked={url.isActive} onCheckedChange={(v) => updateUrl(url.id, { isActive: v })} disabled={!canEdit} />
                    <span className="text-xs text-muted-foreground">{url.isActive ? "활성" : "비활성"}</span>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">슬러그</Label>
                    <Input
                      className={cn("h-8 text-xs font-mono", !isUnique && "border-red-400")}
                      value={url.slug}
                      onChange={(e) => updateUrl(url.id, { slug: e.target.value })}
                      disabled={!canEdit}
                    />
                    {!isUnique && <p className="text-xs text-red-500 mt-0.5">이미 사용 중인 슬러그입니다</p>}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {fullUrl}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <Label className="text-xs mb-1 block">SEO 제목</Label>
                      <Input className="h-8 text-xs" value={url.seoTitle ?? ""} onChange={(e) => updateUrl(url.id, { seoTitle: e.target.value })} disabled={!canEdit} />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">SEO 설명</Label>
                      <RichTextEditor mode="floating" value={url.seoDescription ?? ""} onChange={(html) => updateUrl(url.id, { seoDescription: html })} minHeight={60} disabled={!canEdit} style={{ fontSize: "12px" }} />
                    </div>
                  </div>
                </div>
              )
            })}
            {domainUrls.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">등록된 URL이 없습니다.</p>}
            {showAddUrl && (
              <div className="border rounded-md p-3 space-y-2 bg-muted/20">
                <p className="text-xs font-medium">URL 추가</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs mb-1 block">페이지 유형</Label>
                    <Select value={(newUrl.pageType as string) ?? ""} onValueChange={(v) => setNewUrl((p) => ({ ...p, pageType: v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="선택" /></SelectTrigger>
                      <SelectContent>
                        {["detail", "landing", "external", "booking"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">슬러그</Label>
                    <Input className="h-8 text-xs font-mono" value={(newUrl.slug as string) ?? ""} onChange={(e) => setNewUrl((p) => ({ ...p, slug: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={() => {
                    if (!newUrl.pageType || !newUrl.slug) return
                    addUrl({
                      branchEquipmentId: treatmentId,
                      branchId: profile.branchId,
                      pageType: newUrl.pageType as PageType,
                      slug: newUrl.slug as string,
                      isActive: true,
                    })
                    setNewUrl({})
                    setShowAddUrl(false)
                  }}>추가</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowAddUrl(false); setNewUrl({}) }}>취소</Button>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════
            Section K — 챗봇 & 내부 설정
        ══════════════════════════════════════════ */}
        <SectionCard title="챗봇 & 내부 설정 (보조)" supplementary={true}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={!!localForm.chatbotPriority}
                onCheckedChange={(v) => patchForm({ chatbotPriority: v })}
                disabled={!canEdit}
              />
              <Label className="text-sm">챗봇 우선 응답</Label>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">챗봇 요약</Label>
                {profile.masterTreatmentId && (
                  <OverrideBadge
                    fieldName="chatbotSummary"
                    overriddenFields={overriddenFields}
                    onReset={() => resetFieldToMaster(treatmentId, "chatbotSummary")}
                    disabled={!canEdit}
                  />
                )}
              </div>
              <RichTextEditor
                mode="floating"
                value={localForm.chatbotSummary ?? ""}
                onChange={(html) => patchForm({ chatbotSummary: html })}
                minHeight={80}
                disabled={!canEdit}
                style={{ fontSize: "12px" }}
              />
            </div>
            <RichTextEditor
              mode="floating"
              value={localForm.chatbotForbiddenPhrases ?? ""}
              onChange={(html) => patchForm({ chatbotForbiddenPhrases: html })}
              minHeight={60}
              disabled={!canEdit}
              style={{ fontSize: "12px" }}
            />
            <RichTextEditor
              mode="floating"
              value={localForm.chatbotEmphasisPoints ?? ""}
              onChange={(html) => patchForm({ chatbotEmphasisPoints: html })}
              minHeight={60}
              disabled={!canEdit}
              style={{ fontSize: "12px" }}
            />
            <RichTextEditor
              mode="floating"
              value={localForm.consultReference ?? ""}
              onChange={(html) => patchForm({ consultReference: html })}
              minHeight={80}
              disabled={!canEdit}
              style={{ fontSize: "12px" }}
            />
            <RichTextEditor
              mode="floating"
              value={localForm.internalMemo ?? ""}
              onChange={(html) => patchForm({ internalMemo: html })}
              minHeight={80}
              disabled={!canEdit}
              style={{ fontSize: "12px" }}
            />
          </div>
        </SectionCard>
      </div>

      {/* ── Right sticky preview panel — PC 모드에서는 더 넓게 ── */}
      <div
        className="shrink-0 transition-[width] duration-300"
        style={{ width: previewViewport === "desktop" ? "clamp(400px, 40vw, 640px)" : "320px" }}
      >
        <div className="sticky top-0 h-screen flex flex-col overflow-hidden py-3">
          <Tabs value={previewTab} onValueChange={setPreviewTab} className="flex flex-col flex-1 min-h-0">
            <TabsList className="w-full grid grid-cols-4 mb-3 shrink-0">
              <TabsTrigger value="card" className="text-xs">카드</TabsTrigger>
              <TabsTrigger value="detail" className="text-xs">상세</TabsTrigger>
              <TabsTrigger value="landing" className="text-xs">랜딩</TabsTrigger>
              <TabsTrigger value="chatbot" className="text-xs">챗봇</TabsTrigger>
            </TabsList>

            {/* Tab 1 — 홈페이지 카드 */}
            <TabsContent value="card" className="flex-1 overflow-auto mt-0">
              <Card className="overflow-hidden">
                {/* Thumbnail */}
                <div className="relative h-36 bg-gradient-to-br from-muted to-muted/50">
                  {effectiveAssets.find((a) => a.fileType === "image") ? (
                    <img
                      src={effectiveAssets.find((a) => a.fileType === "image")!.fileUrl}
                      alt="카드 이미지"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  {localForm.cardBadge && (
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                      {localForm.cardBadge}
                    </Badge>
                  )}
                  {localForm.isFeatured && (
                    <div className="absolute top-2 right-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Badge className={cn("text-xs", CATEGORY_COLORS[localForm.category ?? ""] ?? "bg-gray-100 text-gray-700")}>
                      {localForm.category ?? "카테고리"}
                    </Badge>
                    {localForm.isPublic ? (
                      <Badge className="text-xs bg-green-100 text-green-700">공개</Badge>
                    ) : (
                      <Badge className="text-xs bg-gray-100 text-gray-500">비공개</Badge>
                    )}
                  </div>
                  <p className="font-semibold text-sm leading-tight">
                    {localForm.cardTitle || localForm.name || profile.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {localForm.cardDescription || localForm.oneLinePitch || profile.oneLinePitch || "한줄 설명 없음"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {localBenefits.slice(0, 3).map((b) => (
                      <span key={b} className="text-xs bg-muted rounded px-1.5 py-0.5">{b}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                    <span>
                      {localForm.useConsultInquiry
                        ? "가격문의"
                        : localForm.priceEvent
                          ? formatKoreanPrice(localForm.priceEvent)
                          : localForm.priceRegular
                            ? formatKoreanPrice(localForm.priceRegular)
                            : localForm.cardPriceText || "–"}
                    </span>
                    <span>
                      {localForm.durationMinutes ? `${localForm.durationMinutes}분` : localForm.cardDurationText || "–"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2 — 홈페이지 상세 */}
            <TabsContent value="detail" className="flex-1 overflow-auto mt-0">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm">{localForm.name || profile.name}</h3>
                    <Badge className={cn("text-xs mt-1", CATEGORY_COLORS[localForm.category ?? ""] ?? "bg-gray-100 text-gray-700")}>
                      {localForm.category || "–"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {localForm.oneLinePitch || "한줄 설명 없음"}
                  </p>
                  {localSpecialtyPoints.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">특화 포인트</p>
                      <ul className="space-y-0.5">
                        {localSpecialtyPoints.map((pt, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-primary mt-0.5">•</span> {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="text-xs space-y-1 pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">연결 장비</span>
                      <span>{treatmentData.linkedEquipmentIds.length}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">연결 의사</span>
                      <span>{treatmentData.linkedDoctorIds.length}개</span>
                    </div>
                    {domainUrls.find((u) => u.pageType === "detail") && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">URL</span>
                        <span className="font-mono text-xs truncate max-w-[140px]">
                          /{domainUrls.find((u) => u.pageType === "detail")!.slug}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3 — 랜딩 미리보기 (실제 템플릿 렌더 + 섹션 포커스 연동) */}
            <TabsContent value="landing" className="flex-1 flex flex-col min-h-0 mt-0">
              <div className="flex flex-col flex-1 min-h-0">
                  {/* ── 섹션 nav 스트립 ── */}
                  {(() => {
                    const SECTION_LABELS: Record<string, string> = {
                      "A": "히어로",
                      "B": "소개",
                      "C": "효과",
                      "D": "장점/주의",
                      "E": "Why Tatoa",
                      "F": "프로그램",
                    }
                    const sectionKeys = Object.keys(SECTION_LABELS)

                    // Build a preview-ready TreatmentProfile by merging localForm over the store profile
                    const previewProfile = {
                      ...(profile ?? {}),
                      ...localForm,
                    } as TreatmentProfile

                    // Build a preview-ready TreatmentData merging local state arrays
                    const previewData = treatmentData
                      ? {
                          ...treatmentData,
                          benefits:       localBenefits.length        ? localBenefits        : treatmentData.benefits,
                          specialtyPoints: localSpecialtyPoints.length ? localSpecialtyPoints : treatmentData.specialtyPoints,
                          targets:         localTargets.length         ? localTargets         : treatmentData.targets,
                        }
                      : null

                    return (
                      <div>
                        {/* Nav pills */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          <button
                            onClick={() => setFocusedSectionKey(null)}
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] border transition-colors",
                              !focusedSectionKey ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground"
                            )}
                          >전체</button>
                          {sectionKeys.map((key) => (
                            <button
                              key={key}
                              onClick={() => setFocusedSectionKey(focusedSectionKey === key ? null : key)}
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] border transition-colors",
                                focusedSectionKey === key ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground"
                              )}
                            >{key}: {SECTION_LABELS[key]}</button>
                          ))}
                        </div>

                        {/* ── 뷰포트 토글 ── */}
                        {(() => {
                          // panel inner width — PC mode uses clamp(400,40vw,640); mobile stays 312
                          const PANEL_W  = previewViewport === "desktop"
                            ? typeof window !== "undefined"
                              ? Math.max(396, Math.min(628, Math.round(window.innerWidth * 0.40))) - 12
                              : 540
                            : 312
                          // available height for mobile scrollable view
                          const PANEL_H  = typeof window !== "undefined"
                            ? Math.max(500, window.innerHeight - 160)
                            : 700
                          const vpWidth  = previewViewport === "mobile" ? 390 : 1280
                          const scale    = PANEL_W / vpWidth
                          // mobile: standard iPhone height; desktop: true 16:9 (1280×720)
                          const IFRAME_H = previewViewport === "mobile"
                            ? 844
                            : Math.round(vpWidth * 9 / 16)
                          // clip container height: mobile = full panel; desktop = scaled 16:9 height
                          const containerH = previewViewport === "desktop"
                            ? Math.round(IFRAME_H * scale)
                            : PANEL_H

                          return (
                            <>
                              {/* 뷰포트 토글 버튼 */}
                              <div className="flex items-center gap-1 mb-2">
                                <span className="text-[10px] text-muted-foreground mr-0.5">뷰:</span>
                                {(["mobile", "desktop"] as const).map((vp) => (
                                  <button
                                    key={vp}
                                    onClick={() => setPreviewViewport(vp)}
                                    className={cn(
                                      "flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] border transition-colors",
                                      previewViewport === vp
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground"
                                    )}
                                  >
                                    {vp === "mobile" ? "📱 모바일" : "🖥 PC"}
                                  </button>
                                ))}
                                <span className="ml-auto text-[9px] text-muted-foreground/50">
                                  {vpWidth}px · {Math.round(scale * 100)}%
                                </span>
                              </div>

                              {/* ── iframe 기반 랜딩 미리보기 ──
                                  - iframe = 독립 뷰포트 → 모바일/PC 브레이크포인트 정확 반영
                                  - transform: scale로 패널 너비에 맞게 축소
                                  - 외부 div가 overflow: auto → 전체 랜딩 스크롤 가능
                              ── */}
                              {previewProfile.name ? (
                                /*
                                  ── 디바이스 프레임 컨테이너 ──────────────────────────────
                                  • 외부 div: overflow hidden → 패널 경계 클리핑
                                  • scale-wrapper: position absolute, transform: scale
                                    → iframe 뷰포트 = vpWidth (390 / 1280px)
                                    → Tailwind lg: 등 미디어 쿼리가 iframe 실제 너비 기준으로 동작
                                  • iframe scrolling="yes" + overscroll 억제
                                    → 마우스 휠을 iframe 위에서 굴리면 랜딩 페이지 스크롤
                                  ──────────────────────────────────────────────────────────
                                */
                                <div
                                  className={previewViewport === "desktop" ? "rounded-md border-2 border-foreground/20 shadow-lg" : "rounded-lg border bg-muted/10 flex-1"}
                                  style={{
                                    width:      PANEL_W,
                                    height:     containerH,
                                    overflow:   "hidden",
                                    position:   "relative",
                                    flexShrink: 0,
                                  }}
                                >
                                  {/* 16:9 indicator label for desktop */}
                                  {previewViewport === "desktop" && (
                                    <div style={{
                                      position: "absolute", top: 4, right: 6, zIndex: 10,
                                      fontSize: 9, color: "rgba(0,0,0,0.35)", letterSpacing: "0.08em",
                                      fontVariantNumeric: "tabular-nums",
                                    }}>
                                      1280 × 720 · {Math.round(scale * 100)}%
                                    </div>
                                  )}
                                  <div
                                    style={{
                                      position:        "absolute",
                                      top:             0,
                                      left:            0,
                                      width:           vpWidth,
                                      height:          IFRAME_H,
                                      transform:       `scale(${scale})`,
                                      transformOrigin: "top left",
                                    }}
                                  >
                                    <iframe
                                      key={`${treatmentId}-${previewViewport}`}
                                      src={`/preview/landing/live/${treatmentId}`}
                                      style={{
                                        width:              vpWidth,
                                        height:             IFRAME_H,
                                        border:             "none",
                                        display:            "block",
                                        overscrollBehavior: "contain",
                                      }}
                                      scrolling="yes"
                                      title="landing-preview"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-40 text-xs text-muted-foreground rounded-lg border">
                                  시술명을 입력하면 미리보기가 표시됩니다.
                                </div>
                              )}
                            </>
                          )
                        })()}

                        {/* ── 섹션 이동 바텀 바 ── */}
                        {focusedSectionKey && (
                          <div className="flex items-center justify-between pt-1 border-t">
                            <button
                              onClick={() => {
                                const idx = sectionKeys.indexOf(focusedSectionKey)
                                if (idx > 0) setFocusedSectionKey(sectionKeys[idx - 1])
                              }}
                              disabled={sectionKeys.indexOf(focusedSectionKey) === 0}
                              className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-1"
                            >
                              <ChevronUp className="h-3 w-3" />이전
                            </button>
                            <span className="text-[10px] text-muted-foreground">
                              {sectionKeys.indexOf(focusedSectionKey) + 1} / {sectionKeys.length}
                            </span>
                            <button
                              onClick={() => {
                                const idx = sectionKeys.indexOf(focusedSectionKey)
                                if (idx < sectionKeys.length - 1) setFocusedSectionKey(sectionKeys[idx + 1])
                              }}
                              disabled={sectionKeys.indexOf(focusedSectionKey) === sectionKeys.length - 1}
                              className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-1"
                            >
                              다음<ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })()}
              </div>
            </TabsContent>

            {/* Tab 4 — 챗봇 & 누락항목 */}
            <TabsContent value="chatbot" className="flex-1 overflow-auto mt-0">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {/* Chatbot summary */}
                  {localForm.chatbotSummary && (
                    <div>
                      <p className="text-xs font-medium mb-1">챗봇 요약</p>
                      <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2 leading-relaxed">
                        {localForm.chatbotSummary}
                      </p>
                    </div>
                  )}
                  {/* Completeness bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium">완성도</p>
                      <span className="text-xs font-bold">{completenessPercent}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                      <div
                        className={cn("h-full rounded-full", completenessPercent >= 80 ? "bg-green-500" : completenessPercent >= 50 ? "bg-yellow-500" : "bg-red-400")}
                        style={{ width: `${completenessPercent}%` }}
                      />
                    </div>
                  </div>
                  {/* Required missing */}
                  <div>
                    <p className="text-xs font-medium mb-1 text-red-600">필수 누락 항목</p>
                    {[
                      { label: "시술명", ok: !!localForm.name },
                      { label: "카테고리", ok: !!localForm.category },
                      { label: "한줄설명", ok: !!localForm.oneLinePitch },
                      { label: "짧은소개", ok: !!localForm.shortDescription },
                    ].map(({ label, ok }) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs py-0.5">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", ok ? "bg-green-400" : "bg-red-500")} />
                        <span className={ok ? "text-muted-foreground line-through" : ""}>{label}</span>
                      </div>
                    ))}
                  </div>
                  {/* Recommended missing */}
                  <div>
                    <p className="text-xs font-medium mb-1 text-yellow-600">권장 항목</p>
                    {[
                      { label: "상세소개", ok: !!localForm.longDescription },
                      { label: "프로그램", ok: treatmentData.programs.length > 0 },
                      { label: "자산", ok: effectiveAssets.length > 0 },
                      { label: "효과 태그", ok: localBenefits.length > 0 },
                      { label: "키워드", ok: localKeywords.length > 0 },
                    ].map(({ label, ok }) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs py-0.5">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", ok ? "bg-green-400" : "bg-yellow-400")} />
                        <span className={ok ? "text-muted-foreground line-through" : ""}>{label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── AI Landing Generation Modal ── */}
      {showAiModal && treatmentData && (
        <AiLandingModal
          treatmentData={treatmentData}
          onClose={() => setShowAiModal(false)}
          onDraftReady={handleDraftReady}
        />
      )}

      {/* ── Image Style Editor Modal ── */}
      {editingStyleAsset && (
        <ImageEffectEditor
          imageUrl={editingStyleAsset.fileUrl}
          assetId={editingStyleAsset.id}
          assetTitle={editingStyleAsset.title ?? editingStyleAsset.fileName}
          onClose={() => setEditingStyleAsset(null)}
          onSaved={() => setEditingStyleAsset(null)}
        />
      )}

      {/* ── Landing Section Editor Modal ── */}
      {editingLandingSection && (
        <LandingSectionEditor
          section={editingLandingSection}
          allImageAssets={allImageAssets}
          hqImageAssets={hqAssets.filter((a) => a.fileType === "image")}
          programs={treatmentData.programs}
          canEdit={canEdit}
          onInlineUpload={canUpload ? handleInlineAssetUpload : undefined}
          onSave={(updates) => {
            updateLandingSection(treatmentId, editingLandingSection.id, updates)
            setEditingLandingSection(null)
          }}
          onClose={() => setEditingLandingSection(null)}
        />
      )}
    </div>
  )
}

// ─── Asset sub-components ─────────────────────────────────────────────────────

function AssetCard({
  asset, treatmentId, canEdit, onUpdate, onDelete, onReorder, onStyleEdit,
  variantCount, connectionCount, connectionTooltip,
}: {
  asset: TreatmentAsset
  treatmentId: string
  canEdit: boolean
  onUpdate: (tid: string, aid: string, u: Partial<TreatmentAsset>) => void
  onDelete: (tid: string, aid: string) => void
  onReorder: (tid: string, aid: string, dir: "up" | "down") => void
  onStyleEdit?: (asset: TreatmentAsset) => void
  variantCount?: number
  connectionCount?: number
  connectionTooltip?: string
}) {
  const CHANNEL_KEYS = ["useForHomepage", "useForLanding", "useForChatbot"] as const
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="relative aspect-square bg-muted group">
        <img src={asset.fileUrl} alt={asset.title ?? asset.fileName} className="w-full h-full object-cover" />
        {asset.isFeatured && (
          <Star className="absolute top-1 right-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
        )}
        {/* Top-left badges row */}
        <div className="absolute top-1 left-1 flex flex-col gap-0.5">
          {(variantCount ?? 0) > 0 && (
            <div className="bg-primary text-white text-[10px] font-medium rounded px-1.5 py-0.5 leading-tight">
              {variantCount}개 variant
            </div>
          )}
          {(connectionCount ?? 0) > 0 && (
            <div
              className="bg-emerald-600 text-white text-[10px] font-medium rounded px-1.5 py-0.5 leading-tight cursor-default"
              title={connectionTooltip}
            >
              {connectionCount}개 연결
            </div>
          )}
        </div>
        {/* Style edit overlay button */}
        {canEdit && onStyleEdit && (
          <button
            onClick={() => onStyleEdit(asset)}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          >
            <div className="flex items-center gap-1.5 bg-white/90 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground shadow">
              <Wand2 className="h-3 w-3" />
              스타일 편집
            </div>
          </button>
        )}
      </div>
      <div className="p-2 space-y-1.5">
        <p className="text-xs truncate font-medium">{asset.title ?? asset.fileName}</p>
        <Select
          value={asset.assetType}
          onValueChange={(v) => onUpdate(treatmentId, asset.id, { assetType: v as TreatmentAssetType })}
          disabled={!canEdit}
        >
          <SelectTrigger className="h-6 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ASSET_TYPE_LIST.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        {/* Channel labels — full Korean with title tooltip */}
        <div className="flex flex-col gap-0.5">
          {CHANNEL_KEYS.map((k) => (
            <label
              key={k}
              className="flex items-center gap-1 cursor-pointer group/ch"
              title={CHANNEL_LABELS[k]}
            >
              <input
                type="checkbox"
                checked={!!(asset as Record<string, unknown>)[k]}
                onChange={(e) => onUpdate(treatmentId, asset.id, { [k]: e.target.checked } as Partial<TreatmentAsset>)}
                disabled={!canEdit}
                className="h-3 w-3 shrink-0 accent-primary"
              />
              <span className={cn(
                "text-[10px] leading-tight truncate transition-colors",
                !!(asset as Record<string, unknown>)[k]
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}>
                {CHANNEL_SHORT_LABELS[k]}
              </span>
            </label>
          ))}
        </div>
        {canEdit && (
          <button
            onClick={() => onDelete(treatmentId, asset.id)}
            className="w-full flex items-center justify-center gap-1 text-red-400 hover:text-red-600 text-[10px] pt-0.5"
          >
            <Trash2 className="h-3 w-3" />
            삭제
          </button>
        )}
      </div>
    </div>
  )
}

function AssetListRow({
  asset, treatmentId, canEdit, onUpdate, onDelete,
}: {
  asset: TreatmentAsset
  treatmentId: string
  canEdit: boolean
  onUpdate: (tid: string, aid: string, u: Partial<TreatmentAsset>) => void
  onDelete: (tid: string, aid: string) => void
}) {
  return (
    <div className="border rounded-md p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
        {asset.fileType === "pdf" ? <FileText className="h-5 w-5 text-muted-foreground" /> : <Video className="h-5 w-5 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{asset.title ?? asset.fileName}</p>
        <Select
          value={asset.assetType}
          onValueChange={(v) => onUpdate(treatmentId, asset.id, { assetType: v as TreatmentAssetType })}
          disabled={!canEdit}
        >
          <SelectTrigger className="h-6 text-xs mt-1 w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ASSET_TYPE_LIST.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-0.5 text-xs">
        {(["useForHomepage", "useForLanding", "useForChatbot"] as const).map((k) => (
          <label key={k} className="flex items-center gap-1 cursor-pointer" title={CHANNEL_LABELS[k]}>
            <input
              type="checkbox"
              checked={!!(asset as Record<string, unknown>)[k]}
              onChange={(e) => onUpdate(treatmentId, asset.id, { [k]: e.target.checked } as Partial<TreatmentAsset>)}
              disabled={!canEdit}
              className="h-3 w-3 accent-primary"
            />
            <span className={cn("text-[11px]", !!(asset as Record<string, unknown>)[k] ? "text-foreground font-medium" : "text-muted-foreground")}>
              {CHANNEL_SHORT_LABELS[k]}
            </span>
          </label>
        ))}
      </div>
      {canEdit && (
        <button onClick={() => onDelete(treatmentId, asset.id)} className="text-red-400 hover:text-red-600 shrink-0">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
