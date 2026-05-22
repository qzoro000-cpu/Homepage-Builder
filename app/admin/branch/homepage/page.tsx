"use client"

import { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo, createContext, useContext } from "react"
import Link from "next/link"
import {
  Save, Send, RotateCcw, Sparkles, ChevronRight, ChevronLeft,
  Globe, Image as ImageIcon, Users, Cpu, Building2,
  Star, MapPin, Footprints, CheckCircle2,
  Edit3, AlertTriangle, ArrowLeft, Diff,
  FileText, CalendarDays, Lock, Smartphone, Monitor, Tablet, MonitorSmartphone,
  Layers, AlignLeft, AlignCenter, AlignRight,
  EyeOff, Eye as EyeIcon, Trash2, PlayCircle, X, Plus, Minus, Maximize2,
  Syringe, Activity, Heart, Zap, Sun, Leaf, Droplets, MessageCircle, Bell, Upload, Search, ShoppingCart,
  Rocket, Link2, History, Settings2, RefreshCw, ExternalLink, Copy, CheckSquare, XCircle,
  BookOpen, Youtube, Instagram, MessageSquare,
  Facebook, Twitter, Linkedin, Music,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { branches, branchWebsites, events as mockEvents, type Branch, type Treatment } from "@/lib/mock-data"
import { SiteNav } from "@/components/site/SiteNav"
import { useStaff } from "@/lib/staff-store"
import { useEquipment } from "@/lib/equipment-store"
import { useTreatment } from "@/lib/treatment-store"
import { useBranch } from "../../layout"
import { useBranchWebsite, SITE_LIVE_BROADCAST, type SiteSnapshot, migrateTreatmentsPageValues, type FooterSocialExtra } from "@/lib/branch-website-store"
import { cn } from "@/lib/utils"
import { IconField, RenderSectionIcon, DraggableIconInPreview, parseIconConfig, parseIconConfigs } from "./icon-library"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import BookingPage from "./booking-page"
import RecruitPage from "./recruit-page"
import CartPageEditor from "./cart-page"
import PopupPage, { type PopupData, DEFAULT_POPUP_DATA, PopupPhoneScreen } from "./popup-page"
import { SectionPreviewBlock as SectionPreviewBlockShared } from "@/components/site/sections"
import { PreviewTreatmentCard, type PreviewTreatmentCardData, renderTextWithLineBreaks } from "@/components/site/sections/shared"

// ─── Page-level types ────────────────────────────────────────────────────────

type PageId = "home" | "treatments" | "booking" | "directions" | "recruit" | "popup" | "cart"
type PageMeta = {
  id: PageId; label: string; icon: React.ElementType
  status: "active" | "coming-soon" | "auto"; statusLabel?: string; description: string
}
const PAGES: PageMeta[] = [
  { id: "home",       label: "홈",       icon: Globe,        status: "active",      description: "지점 홈 화면 — 히어로부터 푸터까지" },
  { id: "treatments", label: "시술안내", icon: FileText,     status: "active",                                             description: "시술 카테고리·카드 목록·랜딩 연동" },
  { id: "booking",    label: "예약하기", icon: CalendarDays, status: "auto",        statusLabel: "연락/예약 정보 자동 반영", description: "지점 정보 C섹션 데이터 재사용" },
  { id: "recruit",    label: "상시채용", icon: Users,        status: "active",                                             description: "채용 페이지 편집" },
  { id: "popup",      label: "팝업창 설정", icon: Bell,      status: "active",                                             description: "홈 방문 시 첫 화면 팝업 이미지 관리" },
  { id: "cart",       label: "장바구니",    icon: ShoppingCart, status: "active",                                           description: "장바구니 페이지 텍스트 및 스타일 설정" },
]

// ─── Home section types ───────────────────────────────────────────────────────

type HomeSectionId =
  | "hero" | "events" | "philosophy" | "doctors" | "equipment"
  | "gallery" | "strengths" | "branch-info" | "location" | "footer"
type SectionStatus = "empty" | "draft" | "ready" | "published"
type HomeSection = {
  id: HomeSectionId; label: string; icon: React.ElementType
  description: string; status: SectionStatus; isEnabled: boolean; sortOrder: number
}
type FieldValue = string | boolean | string[] | number
type BranchWebsiteDraft = {
  pages: {
    home: Record<string, Record<string, FieldValue>>
    treatments: Record<string, FieldValue>
    booking: Record<string, unknown>
    directions: Record<string, unknown>
    cart?: Record<string, FieldValue>
    recruit?: Record<string, FieldValue>
  }
}

// Context that bypasses prop drilling to deliver live image URLs directly to preview components
const SectionImagesContext = createContext<Record<string, string>>({})

const HOME_SECTIONS: HomeSection[] = [
  { id: "hero",        label: "히어로",       icon: ImageIcon,   description: "첫인상 섹션 — 풀스크린 배경 + 텍스트 오버레이", status: "draft",  isEnabled: true,  sortOrder: 1 },
  { id: "events",      label: "이벤트",       icon: CalendarDays, description: "이벤트·프로모션 카드 슬라이더",                status: "draft",  isEnabled: true,  sortOrder: 2 },
  { id: "philosophy",  label: "철학 소개",    icon: Star,         description: "클리닉 철학·가치관 소개",                      status: "draft",  isEnabled: true,  sortOrder: 3 },
  { id: "doctors",     label: "의료진",       icon: Users,        description: "대표 의료진 프로필 연동",                      status: "ready",  isEnabled: true,  sortOrder: 4 },
  { id: "equipment",   label: "장비",         icon: Cpu,          description: "주요 의료 장비 연동",                          status: "ready",  isEnabled: true,  sortOrder: 5 },
  { id: "gallery",     label: "병원 둘러보기", icon: Building2,   description: "공간·분위기 이미지 갤러리",                    status: "empty",  isEnabled: false, sortOrder: 6 },
  { id: "strengths",   label: "브랜드 강점",  icon: Star,         description: "타토아만의 차별화 포인트",                     status: "draft",  isEnabled: true,  sortOrder: 7 },
  { id: "location",    label: "정보 / 위치",  icon: MapPin,       description: "구글 지도·주소·연락처·진료시간",              status: "ready",  isEnabled: true,  sortOrder: 8 },
  { id: "branch-info", label: "지점 소개",    icon: Building2,    description: "지점 특화 정보 및 전문 분야",                  status: "draft",  isEnabled: true,  sortOrder: 9 },
  { id: "footer",      label: "푸터",         icon: Footprints,   description: "사업자 정보·링크 모음",                        status: "draft",  isEnabled: true,  sortOrder: 10 },
]
const STATUS_CONFIG: Record<SectionStatus, { label: string; className: string }> = {
  empty:     { label: "미작성",  className: "bg-muted text-muted-foreground border-transparent" },
  draft:     { label: "초안",    className: "bg-warning/10 text-warning-foreground border-warning/20" },
  ready:     { label: "준비됨",  className: "bg-success/10 text-success border-success/20" },
  published: { label: "공개 중", className: "bg-primary/10 text-primary border-primary/20" },
}

// ─── Hero style constants ────────────────────────────────────────────────────

const FONTS = [
  { key: "sans",    label: "고딕",   css: "system-ui, -apple-system, 'Apple SD Gothic Neo', sans-serif" },
  { key: "serif",   label: "명조",   css: "Georgia, 'Noto Serif KR', serif" },
  { key: "classic", label: "클래식", css: "'Playfair Display', Georgia, serif" },
  { key: "mono",    label: "모노",   css: "ui-monospace, 'Courier New', monospace" },
]
const BLOCK_SIZES: Record<string, { key: string; label: string; previewPx: number; editorLabel: string }[]> = {
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
const WEIGHTS = [
  { key: "300", label: "Thin" },
  { key: "400", label: "Regular" },
  { key: "500", label: "Medium" },
  { key: "600", label: "SemiBold" },
  { key: "700", label: "Bold" },
]
const COLOR_PRESETS = [
  { key: "#ffffff",   label: "흰색",    bg: "#ffffff", ring: true },
  { key: "#f5f0e8",   label: "크림",    bg: "#f5f0e8", ring: true },
  { key: "#c9a85c",   label: "골드",    bg: "#c9a85c", ring: false },
  { key: "#1a1a1a",   label: "검정",    bg: "#1a1a1a", ring: false },
  { key: "rgba(255,255,255,0.65)", label: "흰색/65", bg: "rgba(255,255,255,0.65)", ring: true },
]

function getSizePx(group: string, key: string): number {
  return BLOCK_SIZES[group]?.find(s => s.key === key)?.previewPx ?? 10
}
function getFontCss(key: string): string {
  return FONTS.find(f => f.key === key)?.css ?? FONTS[0].css
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(dateString: string) {
  const now = new Date()
  const diffMs = now.getTime() - new Date(dateString).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  return `${diffDays}일 전`
}


// ─── Sub-components for hero editor ──────────────────────────────────────────

function ColorPicker({
  value, onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
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

const DOCTOR_SIZE_OPTIONS = [
  { key: "xs", label: "XS", previewPx: 11, editorLabel: "극소" },
  { key: "sm", label: "S",  previewPx: 15, editorLabel: "소" },
  { key: "md", label: "M",  previewPx: 19, editorLabel: "중" },
  { key: "lg", label: "L",  previewPx: 23, editorLabel: "대" },
  { key: "xl", label: "XL", previewPx: 27, editorLabel: "특대" },
]

const GALLERY_SIZE_OPTIONS = [
  { key: "xs", label: "XS", previewPx: 11, editorLabel: "극소" },
  { key: "sm", label: "S",  previewPx: 15, editorLabel: "소" },
  { key: "md", label: "M",  previewPx: 19, editorLabel: "중" },
  { key: "lg", label: "L",  previewPx: 23, editorLabel: "대" },
  { key: "xl", label: "XL", previewPx: 27, editorLabel: "특대" },
]

const STRENGTHS_SIZE_OPTIONS = [
  { key: "xs", label: "XS", previewPx: 11, editorLabel: "극소" },
  { key: "sm", label: "S",  previewPx: 15, editorLabel: "소" },
  { key: "md", label: "M",  previewPx: 19, editorLabel: "중" },
  { key: "lg", label: "L",  previewPx: 23, editorLabel: "대" },
  { key: "xl", label: "XL", previewPx: 27, editorLabel: "특대" },
]

const INFO_SIZE_OPTIONS = [
  { key: "xs", label: "XS", previewPx: 11, editorLabel: "극소" },
  { key: "sm", label: "S",  previewPx: 15, editorLabel: "소" },
  { key: "md", label: "M",  previewPx: 19, editorLabel: "중" },
  { key: "lg", label: "L",  previewPx: 23, editorLabel: "대" },
  { key: "xl", label: "XL", previewPx: 27, editorLabel: "특대" },
]

const BRANCH_INTRO_SIZE_OPTIONS = [
  { key: "xs", label: "XS", previewPx: 11, editorLabel: "극소" },
  { key: "sm", label: "S",  previewPx: 15, editorLabel: "소" },
  { key: "md", label: "M",  previewPx: 19, editorLabel: "중" },
  { key: "lg", label: "L",  previewPx: 23, editorLabel: "대" },
  { key: "xl", label: "XL", previewPx: 27, editorLabel: "특대" },
]

// stripHtml: legacy RTE HTML → plain text with \n preserved
function stripHtmlInline(s: string | undefined | null): string {
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

function FontControls({
  prefix,
  group,
  values,
  onChange,
  sizesOverride,
}: {
  prefix: string
  group: string
  values: Record<string, FieldValue>
  onChange: (k: string, v: FieldValue) => void
  sizesOverride?: { key: string; label: string; previewPx: number; editorLabel: string }[]
}) {
  const sizes = sizesOverride ?? BLOCK_SIZES[group] ?? BLOCK_SIZES.headline
  const currentSize   = (values[`${prefix}Size`]   as string) || sizes[1].key
  const currentWeight = (values[`${prefix}Weight`] as string) || "400"
  const currentFont   = (values[`${prefix}Font`]   as string) || "sans"
  const currentColor  = (values[`${prefix}Color`]  as string) || "#ffffff"

  return (
    <div className="space-y-2.5 rounded-xl bg-muted/40 p-3">
      {/* Font family */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-10 shrink-0">폰트</span>
        <div className="flex gap-1">
          {FONTS.map((f) => (
            <button key={f.key} type="button" onClick={() => onChange(`${prefix}Font`, f.key)}
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

      {/* Size */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-10 shrink-0">크기</span>
        <div className="flex gap-1">
          {sizes.map((s) => (
            <button key={s.key} type="button" onClick={() => onChange(`${prefix}Size`, s.key)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[10px] font-medium border transition-all",
                currentSize === s.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weight */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-10 shrink-0">굵기</span>
        <div className="flex gap-1">
          {WEIGHTS.map((w) => (
            <button key={w.key} type="button" onClick={() => onChange(`${prefix}Weight`, w.key)}
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
        </div>
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-10 shrink-0">색상</span>
        <ColorPicker value={currentColor} onChange={(v) => onChange(`${prefix}Color`, v)} />
      </div>
    </div>
  )
}

function ImageUploadZone({
  dataUrl,
  onUpload,
  onClear,
  label,
}: {
  dataUrl: string
  onUpload: (url: string) => void
  onClear: () => void
  label: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    const url = URL.createObjectURL(file)
    onUpload(url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (dataUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={label} className="w-full h-28 object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}
            className="rounded-xl h-7 text-xs bg-white/90 text-foreground border-0 gap-1">
            <Edit3 className="h-3 w-3" />변경
          </Button>
          <Button size="sm" variant="destructive" onClick={onClear}
            className="rounded-xl h-7 text-xs gap-1">
            <Trash2 className="h-3 w-3" />삭제
          </Button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-5 text-center cursor-pointer hover:bg-muted/50 hover:border-primary/40 transition-all"
      onClick={() => fileRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <ImageIcon className="h-7 w-7 text-muted-foreground mb-2" />
      <p className="text-xs font-medium text-foreground">{label} 업로드</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">클릭 또는 드래그 · JPG/WebP/PNG</p>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

function VideoUploadZone({
  src,
  onUpload,
  onClear,
  label,
}: {
  src: string
  onUpload: (url: string) => void
  onClear: () => void
  label: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith("video/")) return
    const url = URL.createObjectURL(file)
    onUpload(url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (src) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-border">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={src} muted loop className="w-full h-28 object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}
            className="rounded-xl h-7 text-xs bg-white/90 text-foreground border-0 gap-1">
            <Edit3 className="h-3 w-3" />변경
          </Button>
          <Button size="sm" variant="destructive" onClick={onClear}
            className="rounded-xl h-7 text-xs gap-1">
            <Trash2 className="h-3 w-3" />삭제
          </Button>
        </div>
        <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-5 text-center cursor-pointer hover:bg-muted/50 hover:border-primary/40 transition-all"
      onClick={() => fileRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <PlayCircle className="h-7 w-7 text-muted-foreground mb-2" />
      <p className="text-xs font-medium text-foreground">{label} 업로드</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">클릭 또는 드래그 · MP4/WebM</p>
      <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

// ─── Hero Image Config (per-device) ──────────────────────────────────────────

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

function parseHeroImgCfg(raw: FieldValue): HeroImgCfg {
  try {
    const p = JSON.parse((raw as string) || "{}")
    if (p && typeof p === "object") return { ...DEFAULT_HERO_IMG_CFG, ...p }
  } catch {}
  return { ...DEFAULT_HERO_IMG_CFG }
}

function buildHeroImgFilter(cfg: HeroImgCfg): string {
  const parts: string[] = []
  if (cfg.brightness !== 100) parts.push(`brightness(${cfg.brightness}%)`)
  if (cfg.contrast   !== 100) parts.push(`contrast(${cfg.contrast}%)`)
  if (cfg.saturate   !== 100) parts.push(`saturate(${cfg.saturate}%)`)
  if (cfg.hue        !== 0)   parts.push(`hue-rotate(${cfg.hue}deg)`)
  const eff = IMG_EFFECTS.find(e => e.id === cfg.effectId)
  if (eff?.filter) parts.push(eff.filter)
  return parts.join(" ")
}

function HeroImgCfgEditor({ value, onChange: onCfgChange }: { value: HeroImgCfg; onChange: (v: HeroImgCfg) => void }) {
  const patch = (u: Partial<HeroImgCfg>) => onCfgChange({ ...value, ...u })
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* 이미지 효과 프리셋 */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">이미지 효과</p>
        <div className="flex flex-wrap gap-1">
          {IMG_EFFECTS.map(eff => (
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
          {IMG_POSITIONS.map(pos => (
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
              { v: "to bottom",       label: "↓" },
              { v: "to top",          label: "↑" },
              { v: "to right",        label: "→" },
              { v: "to left",         label: "←" },
              { v: "to bottom right", label: "↘" },
              { v: "to bottom left",  label: "↙" },
              { v: "radial",          label: "⊙" },
              { v: "radial-edge",     label: "◎" },
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
                className="w-5 h-5 rounded cursor-pointer border border-border/60 shrink-0"
                style={{ background: c }} />
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
          <div className="w-full h-6 rounded-lg border border-border overflow-hidden"
            style={{ background: value.gradDir === "radial" || value.gradDir === "radial-edge" ? undefined : `linear-gradient(to right, transparent, rgba(${hexToRgb(value.gradColor || "#000000")},${value.gradOpacity / 100}))` }}>
            {(value.gradDir === "radial" || value.gradDir === "radial-edge") && (
              <div className="w-full h-full" style={{ background: value.gradDir === "radial"
                ? `radial-gradient(ellipse at center, rgba(${hexToRgb(value.gradColor || "#000000")},${value.gradOpacity / 100}) 0%, transparent 100%)`
                : `radial-gradient(ellipse at center, transparent 30%, rgba(${hexToRgb(value.gradColor || "#000000")},${value.gradOpacity / 100}) 100%)` }} />
            )}
          </div>
        )}
      </div>

      {/* 그림자 */}
      <div className="space-y-2.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">그림자 (Shadow)</p>
        <div className="grid grid-cols-3 gap-1">
          {([
            { v: "none", label: "없음" },
            { v: "sm",   label: "약하게" },
            { v: "md",   label: "중간" },
            { v: "lg",   label: "강하게" },
            { v: "xl",   label: "매우강" },
            { v: "glow", label: "글로우" },
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
                  className="w-5 h-5 rounded cursor-pointer border border-border/60 shrink-0"
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Hero Editor ─────────────────────────────────────────────────────────────

function HeroEditor({ values, onChange }: {
  values: Record<string, FieldValue>
  onChange: (k: string, v: FieldValue) => void
}) {
  const overlayOpacity = (values.overlayOpacity as number) ?? 50
  const textAlignH    = (values.textAlignH as string) || "left"
  const textPositionV = (values.textPositionV as string) || "center"

  const block1Visible = (values.block1Visible as boolean) ?? true
  const block2Visible = (values.block2Visible as boolean) ?? true
  const block3Visible = (values.block3Visible as boolean) ?? true

  return (
    <div className="space-y-6">

      {/* ── 1. 배경 미디어 ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-0.5 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold text-foreground">배경 미디어</h3>
          <span className="text-xs text-muted-foreground">모바일·PC 각각 별도 설정</span>
        </div>
        <Tabs defaultValue="mobile">
          <TabsList className="rounded-xl bg-muted p-1 w-full">
            <TabsTrigger value="mobile" className="flex-1 rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5">
              <Smartphone className="h-3 w-3" />모바일
            </TabsTrigger>
            <TabsTrigger value="pc" className="flex-1 rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5">
              <Monitor className="h-3 w-3" />PC
            </TabsTrigger>
          </TabsList>

          {/* Mobile */}
          <TabsContent value="mobile" className="mt-3 space-y-2">
            <Tabs defaultValue="image">
              <TabsList className="rounded-lg bg-muted/60 p-0.5 h-7">
                <TabsTrigger value="image" className="rounded-md px-3 h-6 text-[11px] gap-1 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <ImageIcon className="h-3 w-3" />이미지
                </TabsTrigger>
                <TabsTrigger value="video" className="rounded-md px-3 h-6 text-[11px] gap-1 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <PlayCircle className="h-3 w-3" />영상
                </TabsTrigger>
              </TabsList>
              <TabsContent value="image" className="mt-2 space-y-3">
                <ImageUploadZone
                  dataUrl={(values.bgImageMobile as string) || ""}
                  onUpload={(url) => onChange("bgImageMobile", url)}
                  onClear={() => onChange("bgImageMobile", "")}
                  label="모바일 배경 이미지"
                />
                <p className="text-[10px] text-muted-foreground">권장: 1080×1920 이상 · 9:16 세로 이미지</p>
                <HeroImgCfgEditor
                  value={parseHeroImgCfg(values.heroMobileImgCfg)}
                  onChange={(cfg) => onChange("heroMobileImgCfg", JSON.stringify(cfg))}
                />
              </TabsContent>
              <TabsContent value="video" className="mt-2 space-y-1">
                <VideoUploadZone
                  src={(values.bgVideoMobile as string) || ""}
                  onUpload={(url) => onChange("bgVideoMobile", url)}
                  onClear={() => onChange("bgVideoMobile", "")}
                  label="모바일 배경 영상"
                />
                <p className="text-[10px] text-muted-foreground">영상이 있으면 이미지보다 우선 표시 · MP4/WebM</p>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* PC */}
          <TabsContent value="pc" className="mt-3 space-y-2">
            <Tabs defaultValue="image">
              <TabsList className="rounded-lg bg-muted/60 p-0.5 h-7">
                <TabsTrigger value="image" className="rounded-md px-3 h-6 text-[11px] gap-1 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <ImageIcon className="h-3 w-3" />이미지
                </TabsTrigger>
                <TabsTrigger value="video" className="rounded-md px-3 h-6 text-[11px] gap-1 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <PlayCircle className="h-3 w-3" />영상
                </TabsTrigger>
              </TabsList>
              <TabsContent value="image" className="mt-2 space-y-3">
                <ImageUploadZone
                  dataUrl={(values.bgImagePc as string) || ""}
                  onUpload={(url) => onChange("bgImagePc", url)}
                  onClear={() => onChange("bgImagePc", "")}
                  label="PC 배경 이미지"
                />
                <p className="text-[10px] text-muted-foreground">권장: 1920×1080 이상 · 16:9 가로 이미지</p>
                <HeroImgCfgEditor
                  value={parseHeroImgCfg(values.heroPcImgCfg)}
                  onChange={(cfg) => onChange("heroPcImgCfg", JSON.stringify(cfg))}
                />
              </TabsContent>
              <TabsContent value="video" className="mt-2 space-y-1">
                <VideoUploadZone
                  src={(values.bgVideoPc as string) || ""}
                  onUpload={(url) => onChange("bgVideoPc", url)}
                  onClear={() => onChange("bgVideoPc", "")}
                  label="PC 배경 영상"
                />
                <p className="text-[10px] text-muted-foreground">영상이 있으면 이미지보다 우선 표시 · MP4/WebM</p>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Overlay opacity */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">배경 어둡게 (오버레이)</Label>
            <span className="text-xs font-medium text-foreground">{overlayOpacity}%</span>
          </div>
          <input
            type="range" min={0} max={85} step={5}
            value={overlayOpacity}
            onChange={(e) => onChange("overlayOpacity", Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>

      <Separator />

      {/* ── 2. 텍스트 블록 3개 ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-0.5 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold text-foreground">텍스트 블록</h3>
          <span className="text-xs text-muted-foreground">배경 없이 이미지 위에 직접 표시</span>
        </div>

        {/* Block 1 — 영어 제목 (eyebrow) */}
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">1</span>
              <span className="text-sm font-medium text-foreground">영어 제목 (Eyebrow)</span>
            </div>
            <button type="button" onClick={() => onChange("block1Visible", !block1Visible)}
              className={cn("rounded-lg p-1.5 transition-colors", block1Visible ? "text-foreground hover:bg-muted" : "text-muted-foreground hover:bg-muted")}>
              {block1Visible ? <EyeIcon className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
          {block1Visible && (
            <div className="space-y-3">
              <Input
                value={(values.block1Text as string) || ""}
                onChange={(e) => onChange("block1Text", e.target.value)}
                placeholder="예: TATOA DERMATOLOGY CLINIC"
                className="rounded-xl text-sm"
              />
              <FontControls prefix="block1" group="eyebrow" values={values} onChange={onChange} />
            </div>
          )}
        </div>

        {/* Block 2 — 메인 히어로 카피 */}
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">2</span>
              <span className="text-sm font-medium text-foreground">메인 히어로 카피</span>
            </div>
            <button type="button" onClick={() => onChange("block2Visible", !block2Visible)}
              className={cn("rounded-lg p-1.5 transition-colors", block2Visible ? "text-foreground hover:bg-muted" : "text-muted-foreground hover:bg-muted")}>
              {block2Visible ? <EyeIcon className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
          {block2Visible && (
            <div className="space-y-3">
              <div className="space-y-1">
                <RichTextEditor
                  mode="floating"
                  value={(values.block2Text as string) || ""}
                  onChange={(html) => onChange("block2Text", html)}
                  placeholder={"예:\n15년간 원장이 상담하여\n효과 위주의 맞춤형 시술을 하는\n프리미엄 병원"}
                  minHeight={90}
                />
                <p className="text-[10px] text-muted-foreground">Enter 키로 줄바꿈 — 그대로 화면에 반영됩니다</p>
              </div>
              <FontControls prefix="block2" group="headline" values={values} onChange={onChange} />
            </div>
          )}
        </div>

        {/* Block 3 — 부가 설명 및 부카피 */}
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">3</span>
              <span className="text-sm font-medium text-foreground">부가 설명 / 부카피</span>
            </div>
            <button type="button" onClick={() => onChange("block3Visible", !block3Visible)}
              className={cn("rounded-lg p-1.5 transition-colors", block3Visible ? "text-foreground hover:bg-muted" : "text-muted-foreground hover:bg-muted")}>
              {block3Visible ? <EyeIcon className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
          {block3Visible && (
            <div className="space-y-3">
              <div className="space-y-1">
                <RichTextEditor
                  mode="floating"
                  value={(values.block3Text as string) || ""}
                  onChange={(html) => onChange("block3Text", html)}
                  placeholder={"예:\n타토아 클리닉은 최신장비와 전문 의료진이\n함께하는 프리미엄 피부과 클리닉입니다."}
                  minHeight={72}
                />
                <p className="text-[10px] text-muted-foreground">Enter 키로 줄바꿈</p>
              </div>
              <FontControls prefix="block3" group="subcopy" values={values} onChange={onChange} />
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* ── 3. 텍스트 위치 ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-0.5 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold text-foreground">텍스트 블록 위치</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">가로 정렬</Label>
            <div className="flex gap-1">
              {[
                { key: "left",   icon: AlignLeft,   label: "좌" },
                { key: "center", icon: AlignCenter, label: "중" },
                { key: "right",  icon: AlignRight,  label: "우" },
              ].map(({ key, icon: Icon, label }) => (
                <button key={key} type="button" onClick={() => onChange("textAlignH", key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 rounded-xl border py-2 text-xs font-medium transition-all",
                    textAlignH === key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  )}>
                  <Icon className="h-3.5 w-3.5" />{label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">세로 위치</Label>
            <div className="flex gap-1">
              {[
                { key: "top",    label: "상단" },
                { key: "center", label: "중앙" },
                { key: "bottom", label: "하단" },
              ].map(({ key, label }) => (
                <button key={key} type="button" onClick={() => onChange("textPositionV", key)}
                  className={cn(
                    "flex-1 rounded-xl border py-2 text-xs font-medium transition-all",
                    textPositionV === key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── 4. CTA 버튼 ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-0.5 rounded-full bg-primary" />
            <h3 className="text-sm font-semibold text-foreground">CTA 버튼</h3>
          </div>
          <Switch checked={(values.ctaVisible as boolean) ?? true}
            onCheckedChange={(v) => onChange("ctaVisible", v)} />
        </div>
        {((values.ctaVisible as boolean) ?? true) && (
          <div className="space-y-4">
            {/* 문구 + 링크 */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">버튼 문구</Label>
                <Input value={(values.ctaLabel as string) || ""}
                  onChange={(e) => onChange("ctaLabel", e.target.value)}
                  placeholder="예: 지금 상담 예약하기" className="rounded-xl h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">연결 링크</Label>
                <Input value={(values.ctaHref as string) || ""}
                  onChange={(e) => onChange("ctaHref", e.target.value)}
                  placeholder="https://booking.tatoa.kr/..." className="rounded-xl h-9 text-sm" />
              </div>
            </div>

            {/* 버튼 스타일 */}
            <div className="space-y-2.5 rounded-xl bg-muted/40 p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">버튼 스타일</p>

              {/* 버튼 배경색 */}
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-muted-foreground w-10 shrink-0 pt-0.5">배경색</span>
                <ColorPicker
                  value={(values.ctaBgColor as string) || "rgba(255,255,255,0.95)"}
                  onChange={(v) => onChange("ctaBgColor", v)}
                />
              </div>

              {/* 글씨체 */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-10 shrink-0">글씨체</span>
                <div className="flex gap-1 flex-wrap">
                  {FONTS.map((f) => (
                    <button key={f.key} type="button"
                      onClick={() => onChange("ctaFont", f.key)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[10px] font-medium border transition-all",
                        ((values.ctaFont as string) || "sans") === f.key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40"
                      )}
                      style={{ fontFamily: f.css }}
                    >{f.label}</button>
                  ))}
                </div>
              </div>

              {/* 글씨 색상 */}
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-muted-foreground w-10 shrink-0 pt-0.5">글씨색</span>
                <ColorPicker
                  value={(values.ctaTextColor as string) || "#1a1a1a"}
                  onChange={(v) => onChange("ctaTextColor", v)}
                />
              </div>

              {/* 굵기 + 기울기 */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-10 shrink-0">굵기</span>
                <div className="flex gap-1 flex-wrap">
                  {WEIGHTS.map((w) => (
                    <button key={w.key} type="button"
                      onClick={() => onChange("ctaWeight", w.key)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[10px] border transition-all",
                        ((values.ctaWeight as string) || "600") === w.key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40"
                      )}
                      style={{ fontWeight: Number(w.key) }}
                    >{w.label}</button>
                  ))}
                  <button type="button"
                    onClick={() => onChange("ctaItalic", !((values.ctaItalic as boolean) ?? false))}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[10px] border transition-all italic",
                      (values.ctaItalic as boolean)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >Italic</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Preview components ───────────────────────────────────────────────────────

// Hamburger icon
function HamburgerIcon({ size = 14, color = "rgba(255,255,255,0.88)" }: { size?: number; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: size * 0.18, cursor: "pointer" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: size, height: Math.max(1, size * 0.1),
          background: color, borderRadius: 1,
          ...(i === 1 ? { width: size * 0.72 } : {}),
        }} />
      ))}
    </div>
  )
}

// Phone nav bar — glassmorphism, reversed (dark bg + white elements)
function PhoneNavBar({ onMenuToggle }: { onMenuToggle: () => void }) {
  return (
    <div style={{
      // Glassmorphism dark
      background: "rgba(8,6,3,0.72)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      // Gradient border: bright top-left specular, fades to transparent
      boxShadow: [
        "inset 0 1px 0 rgba(255,255,255,0.20)",   // top inner highlight
        "inset 1px 0 0 rgba(255,255,255,0.10)",    // left inner highlight
        "inset 0 -1px 0 rgba(255,255,255,0.04)",   // bottom subtle
        "0 0 0 1px rgba(255,255,255,0.07)",         // outer border
        "0 2px 12px rgba(0,0,0,0.35)",              // drop shadow
      ].join(","),
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 12px",
    }}>
      {/* Left: T box + TATOA + DERMATOLOGY */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 17, height: 17,
          border: "1px solid rgba(255,255,255,0.55)",
          borderRadius: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          // White specular glow at corner
          boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.25), 0 0 5px rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.04)",
        }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: "#ffffff",
            fontFamily: "system-ui, sans-serif", lineHeight: 1,
          }}>T</span>
        </div>
        <div>
          <p style={{
            fontSize: 7.5, fontWeight: 600, letterSpacing: "0.12em",
            color: "#ffffff", lineHeight: 1.1,
            fontFamily: "system-ui, sans-serif",
          }}>TATOA</p>
          <p style={{
            fontSize: 5, fontWeight: 300, letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.45)", lineHeight: 1,
            fontFamily: "system-ui, sans-serif",
          }}>DERMATOLOGY</p>
        </div>
      </div>
      {/* Right: hamburger */}
      <button type="button" onClick={onMenuToggle}
        style={{ background: "none", border: "none", padding: "3px 0", cursor: "pointer", lineHeight: 0 }}>
        <HamburgerIcon size={14} />
      </button>
    </div>
  )
}

// Desktop nav bar — logo left / nav items center / black high-opacity
function DesktopNavBar({ onMenuToggle: _onMenuToggle, onNavigate }: { onMenuToggle: () => void; onNavigate?: (page: PageId) => void }) {
  return (
    <div style={{
      background: "rgba(8,6,3,0.90)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      boxShadow: [
        "inset 0 1px 0 rgba(255,255,255,0.20)",
        "inset 1px 0 0 rgba(255,255,255,0.10)",
        "inset 0 -1px 0 rgba(255,255,255,0.04)",
        "0 0 0 1px rgba(255,255,255,0.07)",
        "0 2px 12px rgba(0,0,0,0.50)",
      ].join(","),
      display: "flex",
      alignItems: "center",
      padding: "0 14px",
      height: 28,
    }}>
      {/* Logo + brand — far left (모바일과 동일한 UI) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{
          width: 17, height: 17,
          border: "1px solid rgba(255,255,255,0.55)",
          borderRadius: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.25), 0 0 5px rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.04)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#ffffff", fontFamily: "system-ui, sans-serif", lineHeight: 1 }}>T</span>
        </div>
        <div>
          <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: "0.12em", color: "#ffffff", lineHeight: 1.1, fontFamily: "system-ui, sans-serif" }}>TATOA</p>
          <p style={{ fontSize: 5, fontWeight: 300, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", lineHeight: 1, fontFamily: "system-ui, sans-serif" }}>DERMATOLOGY</p>
        </div>
      </div>

      {/* Spacer — logo를 좌측, 메뉴를 중앙으로 */}
      <div style={{ flex: 1 }} />

      {/* Center: nav items */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
        {([
          { label: "시술안내", pageId: "treatments" as PageId },
          { label: "예약하기", pageId: "booking"    as PageId },
          { label: "오시는길", pageId: "directions" as PageId },
        ]).map(({ label, pageId }) => (
          <span key={label}
            onClick={() => onNavigate?.(pageId)}
            style={{
              fontSize: 7,
              fontWeight: 400,
              color: "rgba(255,255,255,0.72)",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}>
            {label}
          </span>
        ))}
      </div>

      {/* Right spacer — nav items 중앙 정렬 유지 */}
      <div style={{ flex: 1 }} />
    </div>
  )
}

// Menu drawer — grey glassmorphism, slides over the screen
function PhoneMenuDrawer({ onClose, onNavigate }: { onClose: () => void; onNavigate?: (page: PageId) => void }) {
  return (
    <div style={{
      position: "absolute" as const, inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.28)",
    }} onClick={onClose}>
      {/* Panel unfolds from top-right */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "70%", height: "80%",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: "0 0 0 16px",
        display: "flex", flexDirection: "column" as const,
        boxShadow: "-4px 4px 24px rgba(0,0,0,0.22)",
        overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 12px 8px",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
        }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", color: "#111", fontFamily: "system-ui" }}>TATOA</span>
          <button type="button" onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 10, color: "#888", lineHeight: 1, padding: "2px",
          }}>✕</button>
        </div>

        {/* Menu items */}
        <div style={{ padding: "4px 6px", flex: 1 }}>
          {[
            { label: "홈",      pageId: "home"       as PageId, active: true  },
            { label: "시술 안내", pageId: "treatments" as PageId, active: false },
            { label: "예약하기", pageId: "booking"    as PageId, active: false },
            { label: "오시는 길", pageId: "directions" as PageId, active: false },
          ].map(({ label, pageId, active }) => (
            <button key={label} type="button"
              onClick={() => { onNavigate?.(pageId); onClose() }}
              style={{
                display: "block", width: "100%", textAlign: "left" as const,
                padding: "7px 8px",
                borderRadius: 5,
                background: active ? "rgba(0,0,0,0.06)" : "transparent",
                marginBottom: 1,
                border: "none", cursor: "pointer",
              }}>
              <span style={{
                fontSize: 8, fontWeight: active ? 600 : 400,
                color: active ? "#111" : "#555",
                fontFamily: "system-ui",
              }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Language selector */}
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

        {/* CTA */}
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

// TATOA nav text — overlaid on hero image, no logo
function TatoaNavOverlay() {
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

const HERO_HEIGHT_PAGE = 392

function PreviewHero({
  v, branchName, isFullscreen, device = "mobile", isPageView = false,
}: {
  v: Record<string, FieldValue>; branchName: string; isFullscreen: boolean; device?: "mobile" | "desktop"; isPageView?: boolean
}) {
  const [ctaHovered, setCtaHovered] = useState(false)
  const bgVideo = device === "desktop"
    ? ((v.bgVideoPc as string) || "")
    : ((v.bgVideoMobile as string) || "")
  const bgImage = device === "desktop"
    ? ((v.bgImagePc as string) || "")
    : ((v.bgImageMobile as string) || "")
  const imgCfg       = parseHeroImgCfg(device === "desktop" ? v.heroPcImgCfg : v.heroMobileImgCfg)
  const heroImgFilter = buildHeroImgFilter(imgCfg)
  const heroGrad = (() => {
    if (!imgCfg.gradOpacity) return ""
    const rgba = `rgba(${hexToRgb(imgCfg.gradColor || "#000000")},${(imgCfg.gradOpacity / 100).toFixed(2)})`
    if (imgCfg.gradDir === "radial")      return `radial-gradient(ellipse at center, ${rgba} 0%, transparent 70%)`
    if (imgCfg.gradDir === "radial-edge") return `radial-gradient(ellipse at center, transparent 30%, ${rgba} 100%)`
    return `linear-gradient(${imgCfg.gradDir || "to bottom"}, transparent 0%, ${rgba} 100%)`
  })()
  const heroShadow = (() => {
    const rgb = hexToRgb(imgCfg.shadowColor || "#000000")
    switch (imgCfg.shadowPreset) {
      case "sm":   return `0 2px 10px rgba(${rgb},0.25)`
      case "md":   return `0 4px 20px rgba(${rgb},0.38), 0 2px 8px rgba(${rgb},0.18)`
      case "lg":   return `0 8px 36px rgba(${rgb},0.48), 0 4px 14px rgba(${rgb},0.24)`
      case "xl":   return `0 16px 56px rgba(${rgb},0.56), 0 8px 24px rgba(${rgb},0.3)`
      case "glow": return `0 0 28px rgba(${rgb},0.65), 0 0 10px rgba(${rgb},0.45)`
      default:     return ""
    }
  })()
  const overlayOp    = ((v.overlayOpacity as number) ?? 50) / 100
  const textAlignH   = (v.textAlignH as string) || "left"
  const textPositionV = (v.textPositionV as string) || "center"

  const b1Visible = (v.block1Visible as boolean) ?? true
  const b2Visible = (v.block2Visible as boolean) ?? true
  const b3Visible = (v.block3Visible as boolean) ?? true
  const ctaVisible = (v.ctaVisible as boolean) ?? true

  const b1Text = (v.block1Text as string) || ""
  const b2Text = (v.block2Text as string) || (isFullscreen ? `${branchName}\n히어로 카피를 입력하세요` : branchName)
  const b3Text = (v.block3Text as string) || ""
  const ctaLabel = (v.ctaLabel as string) || "지금 상담 예약하기"

  // Vertical alignment CSS
  const vAlign = textPositionV === "top" ? "flex-start" : textPositionV === "bottom" ? "flex-end" : "center"
  const hAlignCSS = textAlignH === "center" ? "center" : textAlignH === "right" ? "flex-end" : "flex-start"
  const textAlign = textAlignH as "left" | "center" | "right"

  const heroHeight = isFullscreen ? "100%" : isPageView ? HERO_HEIGHT_PAGE : 160

  return (
    <div
      className="relative overflow-hidden shrink-0"
      style={{ height: heroHeight, minHeight: isFullscreen ? 0 : 160, boxShadow: heroShadow || undefined }}
    >
      {/* Background media */}
      {bgVideo ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={bgVideo} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : bgImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bgImage} alt="hero bg" className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: heroImgFilter || undefined, objectPosition: imgCfg.position || "center" }} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-800 via-neutral-700 to-neutral-900" />
      )}
      {/* Hero image gradient overlay */}
      {heroGrad && <div className="absolute inset-0 pointer-events-none" style={{ background: heroGrad }} />}
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlayOp})` }} />
      {/* TATOA nav text overlay */}
      <TatoaNavOverlay />

      {/* Text + CTA */}
      <div
        className="absolute inset-0 flex flex-col p-4"
        style={{ justifyContent: vAlign, alignItems: hAlignCSS, paddingTop: "10%", paddingBottom: "10%", paddingLeft: device === "desktop" ? "15%" : undefined, paddingRight: device === "desktop" ? "15%" : undefined }}
      >
        <div style={{ textAlign, maxWidth: "100%" }} className="space-y-1.5">
          {/* Block 1: eyebrow */}
          {b1Visible && b1Text && (
            <p style={{
              fontFamily: getFontCss((v.block1Font as string) || "sans"),
              fontSize: getSizePx("eyebrow", (v.block1Size as string) || "sm") * 1.5 * (device === "desktop" ? 1.5 : 1),
              fontWeight: Number((v.block1Weight as string) || "400"),
              color: (v.block1Color as string) || "#ffffff",
              letterSpacing: "0.15em",
              lineHeight: 1.3,
            }}>
              {b1Text}
            </p>
          )}
          {/* Block 2: headline */}
          {b2Visible && (
            <p style={{
              fontFamily: getFontCss((v.block2Font as string) || "sans"),
              fontSize: getSizePx("headline", (v.block2Size as string) || "lg") * 1.5 * (device === "desktop" ? 1.5 : 1),
              fontWeight: Number((v.block2Weight as string) || "700"),
              color: (v.block2Color as string) || "#ffffff",
              lineHeight: 1.35,
              whiteSpace: "pre-line",
            }}>
              {b2Text || (isFullscreen ? "메인 카피를 입력하세요" : "")}
            </p>
          )}
          {/* Block 3: sub-copy */}
          {b3Visible && b3Text && (
            <p style={{
              fontFamily: getFontCss((v.block3Font as string) || "sans"),
              fontSize: getSizePx("subcopy", (v.block3Size as string) || "xs") * 1.5 * (device === "desktop" ? 1.5 : 1),
              fontWeight: Number((v.block3Weight as string) || "400"),
              color: (v.block3Color as string) || "rgba(255,255,255,0.65)",
              lineHeight: 1.5,
              whiteSpace: "pre-line",
              marginTop: 4,
            }}>
              {b3Text}
            </p>
          )}
          {/* CTA */}
          {ctaVisible && (
            <div style={{ marginTop: 8, display: "flex", justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start", width: "100%" }}>
              <span
                onMouseEnter={() => setCtaHovered(true)}
                onMouseLeave={() => setCtaHovered(false)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  width: "80%",
                  background: (v.ctaBgColor as string) || "rgba(255,255,255,0.95)",
                  color: (v.ctaTextColor as string) || "#1a1a1a",
                  fontSize: 16,
                  fontFamily: getFontCss((v.ctaFont as string) || "sans"),
                  fontWeight: Number((v.ctaWeight as string) || "600"),
                  fontStyle: (v.ctaItalic as boolean) ? "italic" : "normal",
                  padding: "10px 20px",
                  borderRadius: 999,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  transform: ctaHovered ? "translateY(-3px)" : "translateY(0)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: ctaHovered ? "0 6px 18px rgba(0,0,0,0.22)" : "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                <MessageCircle size={14} />
                {ctaLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Next-section peek hint (only in fullscreen mode) */}
      {isFullscreen && (
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-1 pointer-events-none">
          <div className="flex flex-col items-center gap-0.5 opacity-60">
            <div className="h-px w-8 bg-white/40 rounded-full" />
            <div className="h-px w-4 bg-white/20 rounded-full" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Events section types & helpers ──────────────────────────────────────────

type EventCard = {
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

const DEFAULT_EVENT_CARDS: EventCard[] = [
  { id:"ev1", title:"엘라비에 리투오 특가", subtitle:"사람 콜라겐을 직접 주입, 즉각적인 강한 효과", url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:25, imgFade:55, imgBlend:"normal" },
  { id:"ev2", title:"봄 리프팅 패키지",     subtitle:"V라인 완성의 시작",                          url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:25, imgFade:55, imgBlend:"normal" },
  { id:"ev3", title:"피부 재생 스페셜",     subtitle:"최상의 컨디션으로 되돌아오세요",              url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:25, imgFade:55, imgBlend:"normal" },
]

function parseEventCards(raw: FieldValue): EventCard[] {
  try {
    const parsed = JSON.parse((raw as string) || "[]")
    if (Array.isArray(parsed) && parsed.length > 0) {
      return (parsed as EventCard[]).map(c => ({
        id: c.id || `ev${Date.now()}`,
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

// ─── Philosophy image types ───────────────────────────────────────────────────

type PhiloImage = {
  id: string
  mobile: string    // primary / mobile URL
  pc: string        // PC URL (optional; falls back to mobile if empty)
  effectId: string
  brightness: number
  contrast: number
  saturate: number
  hue: number
  position: string
  // gradient overlay
  gradDir:     string   // CSS direction e.g. "to bottom", "to top right", "radial"
  gradColor:   string   // hex color
  gradOpacity: number   // 0–100
  // shadow
  shadowPreset: string  // "none" | "sm" | "md" | "lg" | "xl" | "glow"
  shadowColor:  string  // hex color
}

function parsePhiloImages(raw: FieldValue, legacyImage?: string): PhiloImage[] {
  const hasExplicit = raw !== undefined && raw !== null && raw !== ""
  try {
    const parsed = JSON.parse((raw as string) || "[]")
    if (Array.isArray(parsed)) {
      if (parsed.length > 0) {
        return (parsed as Partial<PhiloImage>[]).map(img => ({
          id: img.id || `phi${Date.now()}`,
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
      if (hasExplicit) return [] // explicit empty list — skip legacy fallback
    }
  } catch {}
  if (!hasExplicit && legacyImage) return [{ id: "phi-legacy", mobile: legacyImage, pc: "", effectId: "none", brightness: 100, contrast: 100, saturate: 100, hue: 0, position: "center", gradDir: "to bottom", gradColor: "#000000", gradOpacity: 0, shadowPreset: "none", shadowColor: "#000000" }]
  return []
}

function buildPhiloImgFilter(img: PhiloImage): string {
  const parts: string[] = []
  if (img.brightness !== 100) parts.push(`brightness(${img.brightness}%)`)
  if (img.contrast   !== 100) parts.push(`contrast(${img.contrast}%)`)
  if (img.saturate   !== 100) parts.push(`saturate(${img.saturate}%)`)
  if (img.hue        !== 0)   parts.push(`hue-rotate(${img.hue}deg)`)
  const eff = IMG_EFFECTS.find(e => e.id === img.effectId)
  if (eff?.filter) parts.push(eff.filter)
  return parts.join(" ")
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16) || 0
  const g = parseInt(h.slice(2, 4), 16) || 0
  const b = parseInt(h.slice(4, 6), 16) || 0
  return `${r},${g},${b}`
}

function buildPhiloGradient(img: PhiloImage): string {
  if (!img.gradOpacity) return ""
  const rgba = `rgba(${hexToRgb(img.gradColor || "#000000")},${(img.gradOpacity / 100).toFixed(2)})`
  if (img.gradDir === "radial")
    return `radial-gradient(ellipse at center, ${rgba} 0%, transparent 70%)`
  if (img.gradDir === "radial-edge")
    return `radial-gradient(ellipse at center, transparent 30%, ${rgba} 100%)`
  return `linear-gradient(${img.gradDir || "to bottom"}, transparent 0%, ${rgba} 100%)`
}

function buildPhiloShadow(img: PhiloImage): string {
  const rgb = hexToRgb(img.shadowColor || "#000000")
  switch (img.shadowPreset) {
    case "sm":   return `0 2px 10px rgba(${rgb},0.25)`
    case "md":   return `0 4px 20px rgba(${rgb},0.38), 0 2px 8px rgba(${rgb},0.18)`
    case "lg":   return `0 8px 36px rgba(${rgb},0.48), 0 4px 14px rgba(${rgb},0.24)`
    case "xl":   return `0 16px 56px rgba(${rgb},0.56), 0 8px 24px rgba(${rgb},0.3)`
    case "glow": return `0 0 28px rgba(${rgb},0.65), 0 0 10px rgba(${rgb},0.45)`
    default:     return "none"
  }
}

// ─── EventTiltCard: luxury parallax tilt + rim glow (gold dark / silver light) ─

function EventTiltCard({ card, isDark }: {
  card: EventCard; isDark: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rot,    setRot]    = useState({ x: 0, y: 0 })
  const [glow,   setGlow]   = useState({ x: 50, y: 50 })
  const [active, setActive] = useState(false)

  // 4:5 ratio — 168px × 210px
  const CARD_W = 168
  const CARD_H = 210

  // Dark → champagne gold  |  Light → cool platinum silver
  const ac = isDark
    ? { r: 201, g: 168, b: 92 }   // gold
    : { r: 168, g: 175, b: 190 }  // silver

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
  const overlayColor = `rgba(${hexToRgb(card.imgOverlay || "#000000")},${overlayAlpha})`
  const fadeStop     = Math.max(0, 100 - (card.imgFade ?? 55))
  const gradBottom   = `linear-gradient(to top,rgba(0,0,0,0.70) 0%,rgba(0,0,0,0) ${fadeStop}%)`

  // Rim glow follows cursor — gold or silver
  const rimGlow = `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(${ac.r},${ac.g},${ac.b},0.65) 0%, rgba(${ac.r},${ac.g},${ac.b},0.22) 38%, transparent 65%)`
  const ease    = "transform 0.65s cubic-bezier(0.23,1,0.32,1)"
  const acStr   = `rgba(${ac.r},${ac.g},${ac.b}`

  return (
    <div
      ref={cardRef}
      onMouseMove={(e) => { setActive(true); track(e.clientX, e.clientY) }}
      onMouseLeave={() => { setActive(false); setRot({ x: 0, y: 0 }) }}
      onTouchMove={(e) => { setActive(true); const t = e.touches[0]; track(t.clientX, t.clientY) }}
      onTouchEnd={() => { setActive(false); setRot({ x: 0, y: 0 }) }}
      style={{
        width: `${CARD_W}px`, height: `${CARD_H}px`,
        borderRadius: "16px", overflow: "hidden", position: "relative",
        background: isDark ? "#181818" : "#e2e2e2",
        transform: `perspective(700px) rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${active ? 1.028 : 1})`,
        transition: active
          ? "transform 0.08s ease-out, box-shadow 0.15s ease"
          : `${ease}, box-shadow 0.55s ease`,
        boxShadow: active
          ? `0 28px 72px rgba(0,0,0,0.75), 0 0 52px ${acStr},0.24), 0 0 0 1.5px ${acStr},0.32)`
          : (isDark
            ? "0 12px 40px rgba(0,0,0,0.62), 0 0 0 1px rgba(255,255,255,0.06)"
            : "0 8px 28px rgba(0,0,0,0.14)"),
        cursor: "pointer",
        willChange: "transform",
      }}
    >
      {/* Background image — subtle parallax */}
      {card.imgUrl ? (
        <img src={card.imgUrl} alt="" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: card.imgPosition || "center",
          filter: finalFilter || undefined, display: "block",
          transform: active
            ? `scale(1.07) translate(${-rot.y * 0.20}px, ${-rot.x * 0.20}px)`
            : "scale(1) translate(0,0)",
          transition: active ? "transform 0.08s ease-out" : ease,
        }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "5px" }}>
          <CalendarDays style={{ width: "22px", height: "22px", color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }} />
          <span style={{ fontSize: "6px", color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)" }}>이벤트 이미지</span>
        </div>
      )}

      {/* Overlay */}
      <div style={{
        position: "absolute", inset: 0, background: overlayColor,
        mixBlendMode: (card.imgBlend || "normal") as React.CSSProperties["mixBlendMode"],
      }} />

      {/* Gradient fade bottom */}
      <div style={{ position: "absolute", inset: 0, background: gradBottom }} />

      {/* Rim glow — cursor-tracked */}
      <div style={{
        position: "absolute", inset: 0,
        background: rimGlow,
        opacity: active ? 1 : 0,
        transition: "opacity 0.2s ease",
        pointerEvents: "none",
      }} />

      {/* Glassmorphic inner border */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "16px",
        border: active
          ? `1.5px solid ${acStr},0.50)`
          : `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.52)"}`,
        pointerEvents: "none",
        transition: "border-color 0.3s ease",
      }} />

      {/* Corner accent brackets (appear on hover) */}
      {active && (
        <>
          <div style={{ position:"absolute", top:10, left:10,  width:14, height:14, borderTop:`1.5px solid ${acStr},0.75)`, borderLeft:`1.5px solid ${acStr},0.75)`,  borderRadius:"3px 0 0 0", pointerEvents:"none" }} />
          <div style={{ position:"absolute", top:10, right:10, width:14, height:14, borderTop:`1.5px solid ${acStr},0.75)`, borderRight:`1.5px solid ${acStr},0.75)`, borderRadius:"0 3px 0 0", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:10, left:10,  width:14, height:14, borderBottom:`1.5px solid ${acStr},0.75)`, borderLeft:`1.5px solid ${acStr},0.75)`,  borderRadius:"0 0 0 3px", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:10, right:10, width:14, height:14, borderBottom:`1.5px solid ${acStr},0.75)`, borderRight:`1.5px solid ${acStr},0.75)`, borderRadius:"0 0 3px 0", pointerEvents:"none" }} />
        </>
      )}
    </div>
  )
}

// ─── Smart pagination: dots (≤5) → windowed dots (6-9) → counter+bar (10+) ───

function EventPagination({ total, active, isDark, gold, onSelect }: {
  total: number; active: number; isDark: boolean; gold: string
  onSelect: (i: number) => void
}) {
  const accentActive = isDark ? gold : "#2a2a2a"
  const accentInactive = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)"

  // ── ≤ 5: show all dots ──────────────────────────────────────────────────────
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

  // ── 6-9: sliding window of 5 dots ───────────────────────────────────────────
  if (total < 10) {
    const MAX = 5
    // window start: clamp so active stays at index 2 (center) when possible
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

  // ── 10+: counter pill + thin progress track ──────────────────────────────────
  const progress = total > 1 ? active / (total - 1) : 0
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"5px" }}>
      {/* Counter */}
      <span style={{
        fontSize: "7px", fontFamily: "system-ui", letterSpacing: "0.08em",
        color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
      }}>
        <span style={{ color: accentActive, fontWeight:600 }}>{active + 1}</span>
        {" / "}{total}
      </span>
      {/* Progress track */}
      <div style={{ width: "60px", height: "3px", borderRadius: "2px", background: accentInactive, overflow:"hidden" }}>
        <div style={{
          height: "100%", borderRadius: "2px",
          background: accentActive,
          width: `${progress * 100}%`,
          transition: "width 0.3s ease",
        }} />
      </div>
    </div>
  )
}

// ─── Preview: Events ─────────────────────────────────────────────────────────

function PreviewEvents({ v }: { v: Record<string, FieldValue> }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDark = ((v.evBgColor as string) || "dark") === "dark"
  const gold   = "#c9a85c"

  // Mouse drag-to-scroll
  const dragState = useRef({ dragging: false, startX: 0, scrollLeft: 0 })
  const [isCursorGrab, setIsCursorGrab] = useState(false)

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
    const SNAP = 198
    const total = parseEventCards(v.eventCards).length
    const idx = Math.max(0, Math.min(Math.round(scrollRef.current.scrollLeft / SNAP), total - 1))
    setActiveIdx(idx)
    scrollRef.current.scrollTo({ left: idx * SNAP, behavior: "smooth" })
  }, [v.eventCards])
  const bgStyle = sectionBgStyle(isDark)
  const cards   = parseEventCards(v.eventCards)

  // Font settings (global across all cards)
  const titleColor  = (v.evTitleColor  as string) || (isDark ? "#f5f0e8" : "#1a1a1a")
  const titleSize   = INFO_SIZE_MAP[(v.evTitleSize   as string) || "md"]  || "9px"
  const titleWeight = (v.evTitleWeight as string) || "700"
  const titleFont   = INFO_FONT_MAP[(v.evTitleFont   as string) || "sans"] || INFO_FONT_MAP.sans
  const subColor  = (v.evSubColor  as string) || (isDark ? "rgba(255,255,255,0.55)" : "#666")
  const subSize   = INFO_SIZE_MAP[(v.evSubSize   as string) || "xs"]  || "7px"
  const subWeight = (v.evSubWeight as string) || "400"
  const subFont   = INFO_FONT_MAP[(v.evSubFont   as string) || "sans"] || INFO_FONT_MAP.sans

  // Each "slide" = full screen width (198px). Card (168px) is centered inside with 15px padding each side.
  // → exactly ONE card visible per page, equal left/right margins.
  const SLIDE_W = 198 // px — scroll snap unit

  const scrollTo = (idx: number) => {
    setActiveIdx(idx)
    scrollRef.current?.scrollTo({ left: idx * SLIDE_W, behavior: "smooth" })
  }

  const active = cards[activeIdx] ?? cards[0]

  // Section title font
  const stColor  = (v.evSectionTitleColor  as string) || (isDark ? "rgba(201,168,92,0.80)" : "#555555")
  const stSize   = INFO_SIZE_MAP[(v.evSectionTitleSize   as string) || "xs"] || "7px"
  const stWeight = (v.evSectionTitleWeight as string) || "500"
  const stFont   = INFO_FONT_MAP[(v.evSectionTitleFont   as string) || "serif"] || INFO_FONT_MAP.serif

  return (
    <div style={{
      ...bgStyle,
      paddingBottom: "20px",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* Section title — fixed-height block, title vertically centred */}
      <div style={{
        height: "76px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <p style={{
          textAlign: "center",
          fontSize: stSize,
          fontWeight: stWeight,
          color: stColor,
          fontFamily: stFont,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          margin: 0,
        }}>
          {(v.evSectionTitle as string) || "— Events —"}
        </p>
      </div>

      {/*
        Horizontal scroll — one card per snap.
        ─ WHY the negative-margin wrapper exists ───────────────────────────────
        CSS spec forces overflow-y → auto whenever overflow-x is set to auto/scroll.
        Auto overflow clips the 3D-tilted card at the scroll container's bounds.
        Fix: slide items get paddingTop/Bottom (24px) so the scroll container is
        tall enough to contain the tilted card (rotateX ±8° + scale 1.028 extends
        the card ~18 px beyond its layout box on each side).
        The outer wrapper uses a negative vertical margin (-24px) to cancel the
        extra space in the section layout so visual proportions stay identical.
        ────────────────────────────────────────────────────────────────────────
      */}
      <div style={{ margin: "-24px 0 0" }}>
        <div
          ref={scrollRef}
          onScroll={(e) => {
            if (dragState.current.dragging) return
            const el = e.currentTarget
            setActiveIdx(Math.round(el.scrollLeft / SLIDE_W))
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{
            display: "flex",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            cursor: isCursorGrab ? "grabbing" : "grab",
            userSelect: "none",
          } as React.CSSProperties}
        >
          {cards.map(card => (
            <div key={card.id} style={{
              flexShrink: 0, width: `${SLIDE_W}px`,
              scrollSnapAlign: "start",
              // 24px top padding → tilt room (rotateX ±8° + scale 1.028 ≈ +18px per side)
              // No bottom padding — text block below card provides natural spacing
              padding: "24px 15px 0",
              // perspective context must be on parent for 3D to render correctly
              perspective: "700px",
            }}>
              <EventTiltCard card={card} isDark={isDark} />

              {/* ── Text block below card ── */}
              <div style={{
                width: "168px",       // same width as card
                paddingTop: "10px",
                paddingBottom: "14px",
              }}>
                <p style={{
                  fontSize: titleSize,
                  fontWeight: titleWeight,
                  color: titleColor,
                  fontFamily: titleFont,
                  lineHeight: 1.4,
                  margin: 0,
                  marginBottom: "4px",
                  whiteSpace: "pre-line",
                }}>
                  {card.title || "이벤트 제목"}
                </p>
                <p style={{
                  fontSize: subSize,
                  fontWeight: subWeight,
                  color: subColor,
                  fontFamily: subFont,
                  lineHeight: 1.55,
                  margin: 0,
                  whiteSpace: "pre-line",
                }}>
                  {card.subtitle || "이벤트 부제목"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart pagination */}
      <div style={{ paddingTop:"10px", paddingBottom:"6px" }}>
        <EventPagination
          total={cards.length}
          active={activeIdx}
          isDark={isDark}
          gold={gold}
          onSelect={scrollTo}
        />
      </div>
    </div>
  )
}

// (Unchanged other preview blocks)
function PreviewPhilosophy({ v, device = "mobile" }: { v: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const isDesktop = device === "desktop"
  const isDark   = (v.bgTheme as string) !== "light"
  const eyebrow  = (v.eyebrow  as string) || "OUR PHILOSOPHY"
  const headline = (v.headline as string) || "아름다움은 교정이 아닙니다.\n그것은 본연의 가치를\n드러내는 일입니다."
  const body     = (v.body     as string) || "타토아는 모든 얼굴에 아직 들려주지 않은 저마다의 이야기가 담겨 있다고 믿습니다. 정교한 과학과 예술적 심미안을 결합한 타토아만의 접근 방식은, 꾸미지 않은 듯 본연의 자연스러운 아름다움을 완성합니다."
  const images   = parsePhiloImages(v.philoImages, (v.image as string) || "")

  const tc   = isDark ? "#ffffff" : "#111111"
  const tcm  = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)"
  const gold = "#c9a85c"

  // Mesh gradient — silk-like organic curves with deep shadows
  const bg = isDark
    ? [
        "radial-gradient(ellipse 90% 55% at 88% 6%,  rgba(201,168,92,0.20) 0%, transparent 52%)",
        "radial-gradient(ellipse 75% 90% at 10% 96%, rgba(201,168,92,0.12) 0%, transparent 52%)",
        "radial-gradient(ellipse 55% 45% at 62% 38%, rgba(28,22,12,0.88) 0%, transparent 65%)",
        "radial-gradient(ellipse 80% 60% at 20% 60%, rgba(18,14,8,0.95) 0%, transparent 70%)",
        "radial-gradient(ellipse 100% 100% at 50% 50%, #0e0b06 0%, #080604 100%)",
      ].join(",")
    : "#ffffff"

  const grain = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E\")"

  // Shared image slot styles — no nested component, just inline JSX helpers
  const slotBg   = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"
  const slotBd   = isDark ? "1px dashed rgba(255,255,255,0.12)" : "1px dashed rgba(0,0,0,0.12)"
  const slotTxt  = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.25)"

  // aspectRatio box: width 100%, ratio-driven height via paddingTop trick
  const mobileImgStyle: React.CSSProperties = { width: "100%", aspectRatio: "4/5", borderRadius: 12, overflow: "hidden", flexShrink: 0, position: "relative" }
  const pcImg1Style: React.CSSProperties = { width: "100%", aspectRatio: "4/5", borderRadius: 10, overflow: "hidden", flexShrink: 0, position: "relative" }
  const pcExtraImgStyle: React.CSSProperties = { width: "100%", aspectRatio: "3/2", borderRadius: 10, overflow: "hidden", flexShrink: 0, position: "relative" }

  const renderImg = (img: PhiloImage, forDesktop: boolean, wrapStyle: React.CSSProperties, key: string, label: string) => {
    const url    = forDesktop ? (img.pc || img.mobile) : img.mobile
    const shadow = buildPhiloShadow(img)
    const grad   = buildPhiloGradient(img)
    return (
      <div key={key} style={{ ...wrapStyle, boxShadow: shadow !== "none" ? shadow : undefined }}>
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: img.position, display: "block", filter: buildPhiloImgFilter(img) || undefined }} />
            {grad && <div style={{ position: "absolute", inset: 0, background: grad, pointerEvents: "none" }} />}
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: slotBg, border: slotBd, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
            <span style={{ fontSize: 12, opacity: 0.3 }}>🖼</span>
            <span style={{ fontSize: 6.5, color: slotTxt }}>{label}</span>
          </div>
        )}
      </div>
    )
  }

  const emptyMain = (
    <div style={{ ...mobileImgStyle, background: slotBg, border: slotBd, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
      <span style={{ fontSize: 16, opacity: 0.3 }}>🖼</span>
      <span style={{ fontSize: 7, color: slotTxt }}>이미지를 추가해주세요</span>
    </div>
  )

  const textBlock = (
    <div style={{ position: "relative", padding: "18px 14px 14px" }}>
      <p style={{ fontFamily: getFontCss((v.eyebrowFont as string) || "sans"), fontSize: getSizePx("eyebrow", (v.eyebrowSize as string) || "sm"), fontWeight: Number((v.eyebrowWeight as string) || "400"), color: (v.eyebrowColor as string) || gold, letterSpacing: "0.24em", paddingLeft: "0.24em", textTransform: "uppercase" as const, marginBottom: 10 }}>{eyebrow}</p>
      <p style={{ fontFamily: getFontCss((v.headlineFont as string) || "sans"), fontSize: getSizePx("headline", (v.headlineSize as string) || "sm"), fontWeight: Number((v.headlineWeight as string) || "700"), color: (v.headlineColor as string) || tc, lineHeight: 1.38, marginBottom: 10, letterSpacing: "-0.01em" }}>{renderTextWithLineBreaks(String(headline ?? ""))}</p>
      <p style={{ fontFamily: getFontCss((v.bodyFont as string) || "sans"), fontSize: getSizePx("subcopy", (v.bodySize as string) || "xs"), fontWeight: Number((v.bodyWeight as string) || "400"), color: (v.bodyColor as string) || tcm, lineHeight: 1.65 }}>{renderTextWithLineBreaks(String(body ?? ""))}</p>
    </div>
  )

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: bg }} />
      {isDark && <div style={{ position: "absolute", inset: 0, backgroundImage: grain, backgroundSize: "180px 180px", opacity: 0.055, mixBlendMode: "overlay", pointerEvents: "none" }} />}
      {isDark && <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 80, background: "radial-gradient(ellipse at center,rgba(201,168,92,0.22) 0%,transparent 70%)", filter: "blur(8px)", pointerEvents: "none" }} />}

      {isDesktop ? (
        /* ── PC: text 50% left + images 50% right, 좌우 8% 여백 ── */
        <div style={{ position: "relative", padding: "0 10%" }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {/* Left: text block */}
            <div style={{ width: "50%", flexShrink: 0 }}>
              {textBlock}
            </div>
            {/* Right: images column, fixed max-height per image to prevent oversizing */}
            <div style={{ width: "50%", flexShrink: 0, padding: "12px 14px 12px 0", display: "flex", flexDirection: "column", gap: 8 }}>
              {images.length === 0
                ? <div style={{ ...mobileImgStyle, maxHeight: 220, background: slotBg, border: slotBd, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 7, color: slotTxt }}>이미지 1</span></div>
                : images.map((img, i) => {
                    const ratio = i === 0 ? "4/5" : "3/2"
                    const style: React.CSSProperties = { width: "100%", aspectRatio: ratio, borderRadius: 10, overflow: "hidden", flexShrink: 0, position: "relative", maxHeight: i === 0 ? 280 : 180 }
                    return renderImg(img, true, style, img.id, `이미지 ${i + 1}`)
                  })
              }
            </div>
          </div>
        </div>
      ) : (
        /* ── Mobile: text then all images stacked ── */
        <div style={{ position: "relative" }}>
          {textBlock}
          <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {images.length === 0
              ? emptyMain
              : images.map((img, i) =>
                  renderImg(img, false, mobileImgStyle, img.id, `이미지 ${i + 1}`)
                )
            }
          </div>
        </div>
      )}
    </div>
  )
}
type DoctorItem = {
  id: string; name: string; title: string; specialty: string; specialties: string[]
  image: string; isFeatured: boolean; description?: string; shortIntro?: string
  homepageQuote?: string
  careers: Array<{ id: string; organization: string; roleOrDescription: string; sortOrder: number }>
  academics: Array<{ id: string; name: string; sortOrder: number }>
  strengths: string[]
}
type EquipItem  = { id: string; name: string; image: string; isFeatured: boolean; description: string }

// ── Box style presets (shared between editor + preview) ──────────────────────
const BOX_PRESETS_DARK = [
  { id: "default",         label: "글라스",          bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", shadow: "none" },
  { id: "glass-gold",      label: "글라스 골드",     bg: "rgba(201,168,92,0.15)",  border: "rgba(201,168,92,0.30)",  shadow: "0 4px 16px rgba(201,168,92,0.20)" },
  { id: "gradient-gold",   label: "그라데이션 골드",  bg: "linear-gradient(135deg,rgba(201,168,92,0.35) 0%,rgba(100,70,20,0.18) 100%)", border: "rgba(201,168,92,0.35)", shadow: "0 6px 24px rgba(201,168,92,0.25)" },
  { id: "gradient-teal",   label: "그라데이션 틸",    bg: "linear-gradient(135deg,rgba(32,178,170,0.32) 0%,rgba(0,100,100,0.18) 100%)", border: "rgba(32,178,170,0.30)", shadow: "0 6px 24px rgba(32,178,170,0.20)" },
  { id: "gradient-purple", label: "그라데이션 퍼플",  bg: "linear-gradient(135deg,rgba(139,92,246,0.32) 0%,rgba(80,20,160,0.18) 100%)", border: "rgba(139,92,246,0.30)", shadow: "0 6px 24px rgba(139,92,246,0.20)" },
  { id: "solid-dark",      label: "솔리드 다크",      bg: "rgba(8,8,8,0.90)",       border: "rgba(255,255,255,0.08)", shadow: "0 8px 24px rgba(0,0,0,0.45)" },
  { id: "outline",         label: "아웃라인",          bg: "transparent",            border: "rgba(255,255,255,0.22)", shadow: "none" },
] as const

const BOX_PRESETS_LIGHT = [
  { id: "default",         label: "기본",             bg: "#ffffff",                border: "rgba(0,0,0,0.08)",  shadow: "0 2px 12px rgba(0,0,0,0.07)" },
  { id: "glass-gold",      label: "골드 포인트",      bg: "rgba(201,168,92,0.08)",  border: "rgba(201,168,92,0.25)", shadow: "0 4px 16px rgba(201,168,92,0.12)" },
  { id: "gradient-gold",   label: "그라데이션 골드",  bg: "linear-gradient(135deg,rgba(201,168,92,0.15) 0%,rgba(255,252,240,0.9) 100%)", border: "rgba(201,168,92,0.22)", shadow: "0 6px 24px rgba(201,168,92,0.12)" },
  { id: "gradient-teal",   label: "그라데이션 틸",    bg: "linear-gradient(135deg,rgba(32,178,170,0.14) 0%,rgba(245,255,255,0.95) 100%)", border: "rgba(32,178,170,0.20)", shadow: "0 6px 24px rgba(32,178,170,0.10)" },
  { id: "gradient-purple", label: "그라데이션 퍼플",  bg: "linear-gradient(135deg,rgba(139,92,246,0.14) 0%,rgba(248,245,255,0.95) 100%)", border: "rgba(139,92,246,0.20)", shadow: "0 6px 24px rgba(139,92,246,0.10)" },
  { id: "solid-cream",     label: "크림",             bg: "#faf8f3",                border: "rgba(0,0,0,0.06)",  shadow: "0 4px 20px rgba(0,0,0,0.08)" },
  { id: "outline",         label: "아웃라인",          bg: "transparent",            border: "rgba(0,0,0,0.15)",  shadow: "none" },
] as const

const SHADOW_PRESETS = [
  { id: "none",        label: "없음",       css: "none" },
  { id: "soft",        label: "부드럽게",   css: "0 4px 20px rgba(0,0,0,0.18)" },
  { id: "medium",      label: "보통",       css: "0 8px 32px rgba(0,0,0,0.30)" },
  { id: "strong",      label: "강하게",     css: "0 12px 48px rgba(0,0,0,0.48), 0 2px 8px rgba(0,0,0,0.30)" },
  { id: "glow-gold",   label: "골드 글로우", css: "0 0 28px 4px rgba(201,168,92,0.45), 0 4px 16px rgba(201,168,92,0.25)" },
  { id: "glow-teal",   label: "틸 글로우",   css: "0 0 28px 4px rgba(32,178,170,0.45), 0 4px 16px rgba(32,178,170,0.25)" },
  { id: "glow-purple", label: "퍼플 글로우", css: "0 0 28px 4px rgba(139,92,246,0.45), 0 4px 16px rgba(139,92,246,0.25)" },
] as const

function resolveCardStyle(v: Record<string, FieldValue>, isDark: boolean, active: boolean) {
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
    border: `1px solid ${border}`,
    shadow: shadow === "none" ? (active ? "0 8px 32px rgba(0,0,0,0.4)" : "none") : shadow,
    blur,
    radius,
  }
}

function DoctorTiltCard({ doctor, showCta, isDark = true, cardValues = {}, device = "mobile" }: { doctor: DoctorItem; showCta: boolean; isDark?: boolean; cardValues?: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
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
  const ac  = isDark ? { r: 201, g: 168, b: 92 } : { r: 168, g: 175, b: 190 }  // gold | silver
  const acStr = `rgba(${ac.r},${ac.g},${ac.b}`
  const textColor   = isDark ? "#f5f0e8" : "#1a1a1a"
  const subColor    = isDark ? "rgba(255,255,255,0.45)" : "#555"
  const subColor2   = isDark ? "rgba(255,255,255,0.28)" : "#999"
  const accentColor = isDark ? gold : `rgb(${ac.r},${ac.g},${ac.b})`
  const divColor    = isDark ? `rgba(201,168,92,${active ? 0.6 : 0.22})` : `rgba(0,0,0,${active ? 0.12 : 0.06})`

  // Per-doctor image overrides (url / position / filter)
  const overrides = (() => { try { return JSON.parse((cardValues.imgOverrides as string) || "{}") } catch { return {} } })()
  const imgOvr    = (overrides[doctor.id] || {}) as { url?: string; position?: string; filter?: string; gradDir?: string; gradColor?: string; gradOpacity?: number }
  const photoSrc  = imgOvr.url || doctor.image
  const photoPos  = imgOvr.position || "center top"
  const photoFx   = imgOvr.filter || undefined
  const photoGrad = (() => {
    const op = imgOvr.gradOpacity ?? 0
    if (!op) return ""
    const rgba = `rgba(${hexToRgb(imgOvr.gradColor || "#000000")},${(op / 100).toFixed(2)})`
    const dir   = imgOvr.gradDir || "to bottom"
    if (dir === "radial")      return `radial-gradient(ellipse at center, ${rgba} 0%, transparent 70%)`
    if (dir === "radial-edge") return `radial-gradient(ellipse at center, transparent 30%, ${rgba} 100%)`
    return `linear-gradient(${dir}, transparent 0%, ${rgba} 100%)`
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
        transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${active ? 1.025 : 1})`,
        transition: active ? "transform 0.09s ease" : ease,
        transformStyle: "preserve-3d",
        borderRadius: cs.radius, position: "relative", overflow: "hidden",
        background: cs.bg, border: cs.border,
        boxShadow: active
          ? `0 20px 60px rgba(0,0,0,${isDark ? 0.7 : 0.15}), 0 0 40px ${acStr},${isDark ? 0.22 : 0.26}), 0 0 0 1.5px ${acStr},${isDark ? 0.32 : 0.38})`
          : cs.shadow,
        backdropFilter: cs.blur ? `blur(${cs.blur}px)` : undefined,
        display: "flex", flexDirection: isDesktop ? "row" : "column" as const,
        minHeight: isDesktop ? 220 : undefined,
      }}>

        {/* Cursor-tracking glow */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: cs.radius,
          background: `radial-gradient(ellipse 80% 65% at ${glow.x}% ${glow.y}%, ${acStr},${active ? (isDark ? 0.18 : 0.22) : 0}) 0%, transparent 65%)`,
          transition: active ? "none" : "background 0.65s", pointerEvents: "none", zIndex: 1,
        }} />

        {/* ── Photo ── mobile: paddingTop portrait / PC: flex column fills height ── */}
        <div style={{
          transform: active ? `translate(${(glow.x-50)*0.06}px,${(glow.y-50)*0.06}px)` : "none",
          transition: active ? "none" : ease, position: "relative", zIndex: 2, flexShrink: 0,
          // PC: fixed left-column width; height stretches via flex align-items:stretch
          ...(isDesktop ? { width: "50%" } : {}),
        }}>
          {isDesktop ? (
            /* PC: image fills the column height absolutely */
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
              {/* fade at bottom */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, pointerEvents: "none",
                background: `linear-gradient(to top,${isDark ? "rgba(8,7,5,0.92)" : "rgba(245,243,240,0.92)"},transparent)` }} />
              {/* title badge */}
              <div style={{ position: "absolute", bottom: 14, left: 14, display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: accentColor, flexShrink: 0,
                  boxShadow: active && isDark ? `0 0 8px ${gold}` : "none", transition: "box-shadow 0.3s" }} />
                <span style={{ fontSize: 8.5, letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: 600,
                  color: isDark ? "rgba(201,168,92,0.9)" : `${acStr},0.85)`,
                  textShadow: isDark ? "0 1px 4px rgba(0,0,0,0.9)" : "none" }}>{doctor.title}</span>
              </div>
            </div>
          ) : (
            /* Mobile: paddingTop trick for 4:5 portrait */
            <div style={{ width: "100%", paddingTop: "130%", position: "relative", overflow: "hidden",
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
                background: `linear-gradient(to top,${isDark ? "rgba(8,7,5,0.92)" : "rgba(245,243,240,0.92)"},transparent)` }} />
              <div style={{ position: "absolute", bottom: 8, left: 9, display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: accentColor, flexShrink: 0,
                  boxShadow: active && isDark ? `0 0 6px ${gold}` : "none", transition: "box-shadow 0.3s" }} />
                <span style={{ fontSize: 5.5, letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: 600,
                  color: isDark ? "rgba(201,168,92,0.9)" : `${acStr},0.85)`,
                  textShadow: isDark ? "0 1px 4px rgba(0,0,0,0.9)" : "none" }}>{doctor.title}</span>
              </div>
            </div>
          )}
        </div>

        {/* Divider — vertical for PC row layout, horizontal for mobile */}
        {isDesktop ? (
          <div style={{ width: 1, flexShrink: 0, position: "relative", zIndex: 2,
            background: `linear-gradient(180deg,transparent,${divColor},transparent)` }} />
        ) : (
          <div style={{ height: 1, flexShrink: 0, position: "relative", zIndex: 2,
            background: `linear-gradient(90deg,transparent,${divColor},transparent)` }} />
        )}

        {/* ── Content area ── */}
        <div style={{
          padding: isDesktop ? "18px 20px 22px" : "9px 10px 11px",
          transform: active ? `translate(${(glow.x-50)*0.04}px,${(glow.y-50)*0.04}px)` : "none",
          transition: active ? "none" : ease,
          position: "relative", zIndex: 2,
          display: "flex", flexDirection: "column" as const,
          gap: isDesktop ? 12 : 7,
          flex: 1,  // fills remaining width in row mode
          justifyContent: "center",
        }}>

          {/* Name + shortIntro */}
          <div>
            <p style={{ fontSize: isDesktop ? 17 : 11, fontWeight: 700, color: textColor, letterSpacing: "-0.02em", marginBottom: isDesktop ? 5 : 3, lineHeight: 1.2 }}>{doctor.name}</p>
            {doctor.shortIntro && (
              <p style={{ fontSize: isDesktop ? 10 : 6.5, color: subColor, lineHeight: 1.5 }}>{doctor.shortIntro}</p>
            )}
          </div>

          {/* Specialty tags */}
          {doctor.specialties.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: isDesktop ? 5 : 3 }}>
              {doctor.specialties.slice(0, 4).map((sp, i) => (
                <span key={i} style={{
                  fontSize: isDesktop ? 8.5 : 5.5, padding: isDesktop ? "3px 8px" : "2px 5px", borderRadius: 4,
                  background: isDark ? "rgba(201,168,92,0.1)" : `${acStr},0.07)`,
                  border: `1px solid ${isDark ? "rgba(201,168,92,0.22)" : `${acStr},0.20)`}`,
                  color: isDark ? "rgba(201,168,92,0.85)" : `${acStr},0.85)`,
                }}>{sp}</span>
              ))}
            </div>
          )}

          {/* Career */}
          {doctor.careers.length > 0 && (
            <div>
              <p style={{ fontSize: isDesktop ? 7.5 : 5, letterSpacing: "0.22em", textTransform: "uppercase" as const, fontWeight: 600,
                color: isDark ? "rgba(255,255,255,0.28)" : "#ccc", marginBottom: isDesktop ? 6 : 4 }}>경력</p>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: isDesktop ? 5.5 : 3.5 }}>
                {doctor.careers.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: isDesktop ? 5 : 3 }}>
                    <div style={{ width: isDesktop ? 3.5 : 2.5, height: isDesktop ? 3.5 : 2.5, borderRadius: "50%", background: accentColor,
                      flexShrink: 0, marginTop: isDesktop ? 4 : 3, opacity: 0.65 }} />
                    <span style={{ fontSize: isDesktop ? 9 : 6, color: subColor, lineHeight: 1.45 }}>
                      <span style={{ color: textColor, fontWeight: 500 }}>{c.organization}</span>
                      {c.roleOrDescription && <span style={{ opacity: 0.6 }}> · {c.roleOrDescription}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Academics */}
          {doctor.academics.length > 0 && (
            <div>
              <p style={{ fontSize: isDesktop ? 7.5 : 5, letterSpacing: "0.22em", textTransform: "uppercase" as const, fontWeight: 600,
                color: isDark ? "rgba(255,255,255,0.28)" : "#ccc", marginBottom: isDesktop ? 6 : 4 }}>학회/학술</p>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: isDesktop ? 5.5 : 3.5 }}>
                {doctor.academics.slice(0, 3).map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: isDesktop ? 5 : 3 }}>
                    <div style={{ width: isDesktop ? 3.5 : 2.5, height: isDesktop ? 3.5 : 2.5, borderRadius: "50%", background: accentColor,
                      flexShrink: 0, marginTop: isDesktop ? 4 : 3, opacity: 0.65 }} />
                    <span style={{ fontSize: isDesktop ? 9 : 6, color: subColor, lineHeight: 1.45 }}>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quote */}
          {doctor.homepageQuote && (
            <div style={{ borderLeft: `${isDesktop ? 3 : 2}px solid ${isDark ? "rgba(201,168,92,0.32)" : `${acStr},0.28)`}`, paddingLeft: isDesktop ? 10 : 6 }}>
              <p style={{ fontSize: isDesktop ? 9 : 6, color: subColor2, fontStyle: "italic", lineHeight: 1.6 }}>
                &ldquo;{doctor.homepageQuote}&rdquo;
              </p>
            </div>
          )}

          {/* CTA */}
          {showCta && (
            <div style={{ padding: isDesktop ? "9px 0" : "5px 0", textAlign: "center" as const, borderRadius: 7,
              background: isDark ? `rgba(201,168,92,${active ? 0.14 : 0.07})` : `${acStr},${active ? 0.1 : 0.05})`,
              border: `1px solid ${isDark ? `rgba(201,168,92,${active ? 0.4 : 0.2})` : `${acStr},${active ? 0.35 : 0.18})`}`,
              transition: "all 0.3s" }}>
              <span style={{ fontSize: isDesktop ? 10 : 6.5, color: accentColor, letterSpacing: "0.16em", textTransform: "uppercase" as const }}>상담 예약</span>
            </div>
          )}
        </div>

        {/* Glassmorphic inner border */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: cs.radius,
          border: active
            ? `1.5px solid ${acStr},${isDark ? 0.50 : 0.55})`
            : `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.52)"}`,
          pointerEvents: "none",
          transition: "border-color 0.3s ease",
          zIndex: 3,
        }} />

        {/* Corner accent brackets (appear on hover) */}
        {active && (
          <>
            <div style={{ position:"absolute", top:10, left:10,  width:14, height:14, borderTop:`1.5px solid ${acStr},0.75)`, borderLeft:`1.5px solid ${acStr},0.75)`,  borderRadius:"3px 0 0 0", pointerEvents:"none", zIndex:3 }} />
            <div style={{ position:"absolute", top:10, right:10, width:14, height:14, borderTop:`1.5px solid ${acStr},0.75)`, borderRight:`1.5px solid ${acStr},0.75)`, borderRadius:"0 3px 0 0", pointerEvents:"none", zIndex:3 }} />
            <div style={{ position:"absolute", bottom:10, left:10,  width:14, height:14, borderBottom:`1.5px solid ${acStr},0.75)`, borderLeft:`1.5px solid ${acStr},0.75)`,  borderRadius:"0 0 0 3px", pointerEvents:"none", zIndex:3 }} />
            <div style={{ position:"absolute", bottom:10, right:10, width:14, height:14, borderBottom:`1.5px solid ${acStr},0.75)`, borderRight:`1.5px solid ${acStr},0.75)`, borderRadius:"0 0 3px 0", pointerEvents:"none", zIndex:3 }} />
          </>
        )}
      </div>
    </div>
  )
}

function EquipmentTiltCard({ item, isDark = true, cardValues = {} }: { item: EquipItem; isDark?: boolean; cardValues?: Record<string, FieldValue> }) {
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
        transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${active ? 1.025 : 1})`,
        transition: active ? "transform 0.09s ease" : ease,
        transformStyle: "preserve-3d",
        borderRadius: cs.radius, position: "relative", overflow: "hidden",
        background: cs.bg, border: cs.border, boxShadow: cs.shadow,
        backdropFilter: cs.blur ? `blur(${cs.blur}px)` : undefined,
        height: "100%", display: "flex", flexDirection: "column" as const,
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: cs.radius,
          background: `radial-gradient(ellipse 75% 60% at ${glow.x}% ${glow.y}%, rgba(201,168,92,${active ? 0.15 : 0}) 0%, transparent 65%)`,
          transition: active ? "none" : "background 0.65s", pointerEvents: "none", zIndex: 1,
        }} />
        <div style={{
          transform: active ? `translate(${(glow.x-50)*0.08}px,${(glow.y-50)*0.08}px)` : "none",
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
        <div style={{ height: 1, flexShrink: 0, background: `linear-gradient(90deg,transparent,${isDark ? `rgba(201,168,92,${active ? 0.6 : 0.22})` : `rgba(0,0,0,${active ? 0.12 : 0.06})`},transparent)`, zIndex: 2, position: "relative" }} />
        <div style={{
          padding: "7px 9px 10px",
          transform: active ? `translate(${(glow.x-50)*0.04}px,${(glow.y-50)*0.04}px)` : "none",
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

function PreviewLinked({ v, type, branchId, device = "mobile" }: { v: Record<string, FieldValue>; type: "doctors" | "equipment"; branchId: string; device?: "mobile" | "desktop" }) {
  const { getDoctorsByBranch } = useStaff()
  const { getEquipmentByBranch } = useEquipment()

  const title   = (v.title as string) || (type === "doctors" ? "— TATOA DOCTORS —" : "— OUR EQUIPMENT —")
  const showCta = (v.showCta as boolean) ?? true
  const bgColor = (v.bgColor as string) || "dark"
  const gold    = "#c9a85c"
  const isDark  = bgColor === "dark"

  // 섹션 타이틀 폰트 — 이벤트 섹션과 동일한 구조
  const stColor  = (v.docSectionTitleColor  as string) || (isDark ? "rgba(201,168,92,0.80)" : "#555555")
  const stSize   = (DOCTOR_SIZE_MAP[(v.docSectionTitleSize as string) || "xs"] ?? 11) + "px"
  const stWeight = (v.docSectionTitleWeight as string) || "500"
  const stFont   = INFO_FONT_MAP[(v.docSectionTitleFont  as string) || "serif"] || INFO_FONT_MAP.serif

  const rawDoctors   = getDoctorsByBranch(branchId)
  const rawEquipment = getEquipmentByBranch(branchId)

  const items = type === "doctors"
    ? rawDoctors.filter((d) => d.profile.isPublic).map((d) => ({
        id: d.profile.id,
        name: d.profile.name,
        title: d.profile.title || "",
        specialty: d.specialties[0] || "",
        specialties: d.specialties,
        image: d.profile.profileImageUrl || "",
        isFeatured: d.profile.isFeatured,
        description: d.profile.shortIntro || "",
        shortIntro: d.profile.shortIntro || "",
        homepageQuote: d.profile.homepageQuote || "",
        careers: d.careers
          .filter((c) => c.isPublic)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((c) => ({ id: c.id, organization: c.organization, roleOrDescription: c.roleOrDescription, sortOrder: c.sortOrder })),
        academics: d.academics
          .filter((a) => a.isPublic)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((a) => ({ id: a.id, name: a.name, sortOrder: a.sortOrder })),
        strengths: d.strengths,
      }))
    : rawEquipment.filter((e) => e.profile.isPublic).map((e) => ({
        id: e.profile.id,
        name: e.profile.name,
        image: e.assets[0]?.fileUrl || "",
        isFeatured: e.profile.isFeatured,
        description: e.profile.shortDescription || e.profile.oneLinePitch || "",
      }))

  const cols = "1fr"
  const sectionPad = device === "desktop" ? "28px 15% 32px" : "16px 12px 20px"

  return (
    <div style={{
      padding: sectionPad,
      backgroundColor: isDark ? "#0e0c09" : "#ffffff",
      backgroundImage: isDark
        ? [
            "linear-gradient(rgba(201,168,92,0.055) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(201,168,92,0.055) 1px, transparent 1px)",
          ].join(",")
        : "none",
      backgroundSize: isDark ? "22px 22px" : "auto",
      position: "relative",
    }}>
      <div>
        {/* Section header — 이벤트 섹션과 동일한 구조: 고정 높이 + 가운데 정렬 */}
        <div style={{ height: 76, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
          <p style={{
            textAlign: "center" as const,
            fontSize: stSize,
            fontWeight: stWeight,
            color: stColor,
            fontFamily: stFont,
            letterSpacing: "0.18em",
            textTransform: "uppercase" as const,
            margin: 0,
          }}>
            {title}
          </p>
        </div>

        {(v.description as string) && (
          <p style={{ fontSize: 7, color: isDark ? "rgba(255,255,255,0.38)" : "#666", textAlign: "center" as const, marginBottom: 12, letterSpacing: "0.04em" }}>
            {v.description as string}
          </p>
        )}

        {items.length === 0 ? (
          <div style={{
            borderRadius: 10, border: `1px dashed ${isDark ? "rgba(201,168,92,0.2)" : "#ddd"}`, padding: "16px 0",
            textAlign: "center" as const, background: isDark ? "rgba(201,168,92,0.03)" : "#f9f9f9",
          }}>
            <p style={{ fontSize: 7.5, color: isDark ? "rgba(255,255,255,0.25)" : "#999" }}>
              {type === "doctors" ? "등록된 의료진이 없습니다" : "등록된 장비가 없습니다"}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8, alignItems: "stretch" }}>
            {items.slice(0, 6).map((item) =>
              type === "doctors" ? (
                <DoctorTiltCard key={item.id} doctor={item as Parameters<typeof DoctorTiltCard>[0]["doctor"]} showCta={showCta} isDark={isDark} cardValues={v} device={device} />
              ) : (
                <EquipmentTiltCard key={item.id} item={item as Parameters<typeof EquipmentTiltCard>[0]["item"]} isDark={isDark} cardValues={v} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
// ─── Strengths types & helpers ───────────────────────────────────────────────

type StrengthStat = {
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

type S1MapImg = {
  id: string; url: string
  effectId: string; brightness: number; contrast: number; saturate: number; hue: number
  position: string
  gradDir: string; gradColor: string; gradOpacity: number
  shadowPreset: string; shadowColor: string
}

function parseS1MapImages(raw: FieldValue, legacyUrl?: string): S1MapImg[] {
  try {
    const p = JSON.parse((raw as string) || "[]")
    if (Array.isArray(p) && p.length > 0) {
      return p.map((img: Partial<S1MapImg>) => ({
        id: img.id || `s1i${Date.now()}`,
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

function buildS1ImgFilter(img: S1MapImg): string {
  const parts: string[] = []
  if (img.brightness !== 100) parts.push(`brightness(${img.brightness}%)`)
  if (img.contrast   !== 100) parts.push(`contrast(${img.contrast}%)`)
  if (img.saturate   !== 100) parts.push(`saturate(${img.saturate}%)`)
  if (img.hue        !== 0)   parts.push(`hue-rotate(${img.hue}deg)`)
  const eff = IMG_EFFECTS.find(e => e.id === img.effectId)
  if (eff?.filter) parts.push(eff.filter)
  return parts.join(" ")
}
function buildS1Gradient(img: S1MapImg): string {
  if (!img.gradOpacity) return ""
  const rgba = `rgba(${hexToRgb(img.gradColor || "#000000")},${(img.gradOpacity / 100).toFixed(2)})`
  if (img.gradDir === "radial")      return `radial-gradient(ellipse at center, ${rgba} 0%, transparent 70%)`
  if (img.gradDir === "radial-edge") return `radial-gradient(ellipse at center, transparent 30%, ${rgba} 100%)`
  return `linear-gradient(${img.gradDir || "to bottom"}, transparent 0%, ${rgba} 100%)`
}
function buildS1Shadow(img: S1MapImg): string {
  const rgb = hexToRgb(img.shadowColor || "#000000")
  switch (img.shadowPreset) {
    case "sm":   return `0 2px 10px rgba(${rgb},0.25)`
    case "md":   return `0 4px 20px rgba(${rgb},0.38), 0 2px 8px rgba(${rgb},0.18)`
    case "lg":   return `0 8px 36px rgba(${rgb},0.48), 0 4px 14px rgba(${rgb},0.24)`
    case "xl":   return `0 16px 56px rgba(${rgb},0.56), 0 8px 24px rgba(${rgb},0.3)`
    case "glow": return `0 0 28px rgba(${rgb},0.65), 0 0 10px rgba(${rgb},0.45)`
    default:     return "none"
  }
}

const DEFAULT_S1_STATS: StrengthStat[] = [
  { id: "s1a", label: "운영 연차",   value: "15",      unit: "년",   preset: "glass-gold" },
  { id: "s1b", label: "글로벌 지점", value: "17",      unit: "개",   preset: "glass-gold" },
  { id: "s1c", label: "진출 국가",   value: "3",       unit: "개국", preset: "glass-gold" },
]
const DEFAULT_S2_STATS: StrengthStat[] = [
  { id: "s2a", label: "누적 내원 고객", value: "223,496", unit: "명", preset: "glass-gold", chartType: "line"   },
  { id: "s2b", label: "재방문율",       value: "78",      unit: "%",  preset: "glass-gold", chartType: "circle" },
  { id: "s2c", label: "기존 고객 비중", value: "82.3",    unit: "%",  preset: "glass-gold", chartType: "bar"    },
]

function parseSStats(raw: FieldValue | undefined, defaults: StrengthStat[]): StrengthStat[] {
  if (!raw) return defaults
  try { return JSON.parse(raw as string) as StrengthStat[] } catch { return defaults }
}
function resolveStatCardStyle(stat: StrengthStat, isDark: boolean) {
  const presets = isDark ? BOX_PRESETS_DARK : BOX_PRESETS_LIGHT
  const ps = presets.find(p => p.id === (stat.preset || "glass-gold")) ?? presets[1]
  return {
    bg:     stat.bgOverride     || ps.bg,
    border: `1px solid ${stat.borderOverride || ps.border}`,
    shadow: (stat.shadowOverride === "none" ? undefined : stat.shadowOverride) || (ps.shadow === "none" ? undefined : ps.shadow),
    blur:   stat.blurOverride   ?? 0,
    radius: stat.radiusOverride ?? 12,
  }
}

function MiniLineChart({ color }: { color: string }) {
  return (
    <svg width="56" height="24" viewBox="0 0 56 24" fill="none">
      <polyline points="0,22 10,16 22,18 32,9 44,5 56,2"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="56" cy="2" r="2.5" fill={color} />
    </svg>
  )
}
function MiniCircleChart({ value, color }: { value: number; color: string }) {
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
function MiniBarChart({ color }: { color: string }) {
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

// Matte fractal-noise grain as a repeating SVG tile (opacity ~3.8%, luminance-only)
const LIGHT_GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E" +
  "%3Cfilter id='g'%3E" +
  "%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E" +
  "%3CfeColorMatrix type='saturate' values='0'/%3E" +
  "%3C/filter%3E" +
  "%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.038'/%3E" +
  "%3C/svg%3E\")"

function sectionBgStyle(isDark: boolean) {
  return isDark
    ? {
        backgroundColor: "#0e0c09",
        backgroundImage: [
          "radial-gradient(ellipse at 85% 10%, rgba(201,168,92,0.28) 0%, transparent 55%)",
          "radial-gradient(ellipse at 15% 92%, rgba(201,168,92,0.20) 0%, transparent 50%)",
        ].join(","),
      }
    : {
        // Warm off-white base, not pure white — gives the grain something to land on
        backgroundColor: "#f8f8f6",
        backgroundImage: [
          // ① Matte grain tile (repeats, ~3.8% opacity, grey-only)
          LIGHT_GRAIN_URL,
          // ② Organic mesh blobs — white-to-light-grey, soft & large
          "radial-gradient(ellipse 85% 60% at 6%  8%,  rgba(200,200,198,0.38) 0%, transparent 60%)",
          "radial-gradient(ellipse 60% 75% at 94% 14%, rgba(192,194,198,0.26) 0%, transparent 56%)",
          "radial-gradient(ellipse 70% 45% at 48% 96%, rgba(204,202,200,0.32) 0%, transparent 58%)",
          "radial-gradient(ellipse 50% 65% at 80% 72%, rgba(196,196,194,0.20) 0%, transparent 52%)",
          "radial-gradient(ellipse 65% 55% at 18% 62%, rgba(202,200,198,0.18) 0%, transparent 60%)",
          "radial-gradient(ellipse 40% 40% at 58% 42%, rgba(210,208,206,0.14) 0%, transparent 50%)",
        ].join(","),
        // Grain tile repeats; all gradient layers are cover-size / no-repeat
        backgroundSize: "256px 256px, auto, auto, auto, auto, auto, auto",
        backgroundRepeat: "repeat, no-repeat, no-repeat, no-repeat, no-repeat, no-repeat, no-repeat",
      }
}

function S2StatCard({ stat, isDark, gold }: { stat: StrengthStat; isDark: boolean; gold: string }) {
  const [hovered, setHovered] = useState(false)
  const cs = resolveStatCardStyle(stat, isDark)
  const valC = stat.valueColor || gold
  const lblC = stat.labelColor || (isDark ? "rgba(255,255,255,0.42)" : "#888")
  const ct   = stat.chartType || "line"
  const numericVal = parseFloat(stat.value.replace(/,/g, "")) || 0

  const hoverShadow = isDark
    ? `0 12px 36px rgba(0,0,0,0.55), 0 0 20px rgba(201,168,92,0.18)`
    : `0 12px 36px rgba(0,0,0,0.14)`

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: cs.radius,
        background: cs.bg,
        border: cs.border,
        backdropFilter: cs.blur ? `blur(${cs.blur}px)` : undefined,
        padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "default",
        /* ── hover motion ── */
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

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────
// Dynamically finds the nearest scrollable ancestor and uses it as the
// IntersectionObserver root — so it works correctly inside the admin preview's
// overflow-y:auto container, not just the browser viewport.
function RevealBox({
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

    // Walk up the DOM to find the nearest scrollable ancestor
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
        transition: `opacity 1.3s cubic-bezier(0.22,1,0.36,1) ${delay}ms,
                     transform 1.3s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Treatments section types & helpers ──────────────────────────────────────

type TreatmentCategory = {
  id: string
  label: string
  icon: string       // key into TREATMENT_ICON_OPTIONS
  description: string
}

type TreatmentPreviewItem = {
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

const TREATMENT_ICON_OPTIONS: { key: string; label: string; Icon: React.FC<{ size?: number; color?: string }> }[] = [
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

const DEFAULT_TREATMENT_CATS: TreatmentCategory[] = [
  { id: "tc_all",    label: "전체",        icon: "layers",   description: "모든 시술" },
  { id: "tc_botox",  label: "보톡스",      icon: "syringe",  description: "보툴리눔 시술" },
  { id: "tc_filler", label: "필러/콜라겐", icon: "sparkles", description: "볼륨 & 탄력" },
  { id: "tc_laser",  label: "레이저",      icon: "zap",      description: "피부 리프팅" },
  { id: "tc_skin",   label: "피부케어",    icon: "sun",      description: "스킨케어" },
  { id: "tc_body",   label: "바디",        icon: "activity", description: "바디 슬리밍" },
]

function parseTreatmentCats(raw: FieldValue): TreatmentCategory[] {
  try {
    const parsed = JSON.parse((raw as string) || "[]")
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as TreatmentCategory[]
  } catch {}
  return DEFAULT_TREATMENT_CATS
}

function TreatmentCatIcon({ iconKey, size, color }: { iconKey: string; size: number; color: string }) {
  const found = TREATMENT_ICON_OPTIONS.find(o => o.key === iconKey)
  const { Icon } = found ?? TREATMENT_ICON_OPTIONS[0]
  return <Icon size={size} color={color} />
}


// ─── Preview: Treatments ──────────────────────────────────────────────────────

function PreviewTreatments({ v, branchId, device = "mobile" }: { v: Record<string, FieldValue>; branchId: string; device?: "mobile" | "desktop" }) {
  const isDesktop = device === "desktop"
  const isDark   = ((v.bgColor as string) || "light") === "dark"
  const bgStyle  = sectionBgStyle(isDark)
  const gold     = "#c9a85c"
  const cats     = parseTreatmentCats(v.categories)
  const [activeCat, setActiveCat] = useState<string>(cats[0]?.id ?? "")
  const [searchQuery, setSearchQuery] = useState("")
  const catScrollRef = useRef<HTMLDivElement>(null)
  const dragRef      = useRef({ active: false, startX: 0, scrollLeft: 0 })
  const [catScroll,  setCatScroll]  = useState({ atStart: true, atEnd: false })

  // Track scroll position → show/hide left·right arrows
  const updateScrollState = () => {
    const el = catScrollRef.current
    if (!el) return
    setCatScroll({
      atStart: el.scrollLeft <= 2,
      atEnd:   el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    })
  }

  const scrollCatBy = (delta: number) => {
    catScrollRef.current?.scrollBy({ left: delta, behavior: "smooth" })
  }

  const handleCatWheel = (e: React.WheelEvent) => {
    if (catScrollRef.current) {
      e.preventDefault()
      catScrollRef.current.scrollLeft += e.deltaY + e.deltaX
    }
  }

  // Mouse drag-to-scroll
  const onMouseDown = (e: React.MouseEvent) => {
    const el = catScrollRef.current
    if (!el) return
    dragRef.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    el.style.cursor = "grabbing"
    el.style.userSelect = "none"
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.active) return
    const el = catScrollRef.current
    if (!el) return
    const x    = e.pageX - el.offsetLeft
    const walk = x - dragRef.current.startX
    el.scrollLeft = dragRef.current.scrollLeft - walk
  }
  const onMouseUp = () => {
    dragRef.current.active = false
    if (catScrollRef.current) {
      catScrollRef.current.style.cursor = "grab"
      catScrollRef.current.style.userSelect = ""
    }
  }

  // Sync active cat if categories change
  useEffect(() => {
    if (!cats.find(c => c.id === activeCat)) setActiveCat(cats[0]?.id ?? "")
  }, [v.categories]) // eslint-disable-line react-hooks/exhaustive-deps

  // Linked treatment data from store (same data as 시술안내 관리 메뉴)
  const { getTreatmentsByBranch, getEffectiveAssets } = useTreatment()
  const linked: TreatmentPreviewItem[] = getTreatmentsByBranch(branchId)
    .filter(t => t.profile.isPublic)
    .map(t => {
      const assets = getEffectiveAssets(t.profile.id)
      // 히어로 이미지: profile.heroImageAssetId → asset.fileUrl
      const heroAsset  = t.profile.heroImageAssetId
        ? assets.find(a => a.id === t.profile.heroImageAssetId)
        : undefined
      // 폴백: 카드썸네일
      const thumbAsset = assets.find(a => a.assetType === "카드썸네일")
      return {
        id: t.profile.id,
        name: t.profile.cardTitle || t.profile.name,
        category: t.profile.category,
        description: t.profile.cardDescription || t.profile.shortDescription || t.profile.oneLinePitch || "",
        price: t.profile.cardPriceText || (t.profile.priceRegular ? `${t.profile.priceRegular.toLocaleString()}원~` : ""),
        duration: t.profile.cardDurationText || (t.profile.durationMinutes ? `약 ${t.profile.durationMinutes}분` : ""),
        image: (heroAsset ?? thumbAsset)?.fileUrl ?? "",
        badge: t.profile.cardBadge,
        isPublic: t.profile.isPublic,
        isFeatured: t.profile.isFeatured,
        branchId: t.profile.branchId,
        bookingUrl: t.profile.bookingUrl,
        kakaoUrl: t.profile.kakaoUrl,
        landingPageUrl: t.profile.landingPageUrl,
      }
    })
  const firstCatId = cats[0]?.id ?? ""
  const catFiltered = activeCat === firstCatId
    ? linked
    : linked.filter(t => {
        const cat = cats.find(c => c.id === activeCat)
        return cat ? t.category.toLowerCase().includes(cat.label.toLowerCase()) : true
      })
  const q = searchQuery.trim().toLowerCase()
  const visibleCards = q
    ? catFiltered.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    : catFiltered

  // Text styles
  const eyebrowColor  = (v.pageEyebrowColor  as string) || (isDark ? gold : "#888888")
  const eyebrowSize   = INFO_SIZE_MAP[(v.pageEyebrowSize as string)  || "xs"] || "7px"
  const eyebrowWeight = (v.pageEyebrowWeight as string)  || "600"
  const eyebrowFont   = INFO_FONT_MAP[(v.pageEyebrowFont as string)  || "sans"] || INFO_FONT_MAP.sans
  const titleColor    = (v.pageTitleColor    as string) || (isDark ? "#f5f0e8" : "#1a1a1a")
  const titleSize     = INFO_SIZE_MAP[(v.pageTitleSize   as string)   || "xl"]  || "14px"
  const titleWeight   = (v.pageTitleWeight   as string) || "700"
  const titleFont     = INFO_FONT_MAP[(v.pageTitleFont   as string)   || "sans"] || INFO_FONT_MAP.sans
  const descColor     = (v.pageSubtitleColor     as string) || (isDark ? "rgba(255,255,255,0.52)" : "#666")
  const descSize      = INFO_SIZE_MAP[(v.pageSubtitleSize    as string)   || "sm"]  || "8px"

  // Glassmorphism bar
  const barBg = isDark
    ? "linear-gradient(135deg,rgba(255,255,255,0.09) 0%,rgba(255,255,255,0.04) 100%)"
    : "linear-gradient(135deg,rgba(255,255,255,0.82) 0%,rgba(255,255,255,0.60) 100%)"
  const barBorder = isDark ? "1px solid rgba(255,255,255,0.13)" : "1px solid rgba(255,255,255,0.85)"
  const barShadow = isDark
    ? "0 4px 28px rgba(0,0,0,0.40),inset 0 1px 0 rgba(255,255,255,0.08)"
    : "0 4px 28px rgba(0,0,0,0.09),inset 0 1px 0 rgba(255,255,255,1)"

  return (
    <div style={{ ...bgStyle, padding: "24px 0 20px" }}>

      {/* ── Header ── */}
      <div style={{ padding: "0 16px 18px" }}>
        <p style={{
          fontSize: eyebrowSize, fontWeight: eyebrowWeight, fontFamily: eyebrowFont,
          color: eyebrowColor, letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: 7,
        }}>
          {(v.pageEyebrow as string) || "OUR SERVICES"}
        </p>
        <p style={{
          fontSize: titleSize, fontWeight: titleWeight, fontFamily: titleFont,
          color: titleColor, lineHeight: 1.35, marginBottom: 9, paddingTop: 6,
        }}>
          {(v.pageTitle as string) || "시술 안내"}
        </p>
        <p style={{
          fontSize: descSize, color: descColor, lineHeight: 1.65, whiteSpace: "pre-line",
        }}>
          {(v.pageSubtitle as string) || "타토아 클리닉의 다양한 시술 프로그램을 확인해보세요.\n모든 시술은 전문 의료진의 1:1 상담 후 진행됩니다."}
        </p>
      </div>

      {/* ── Search bar ── */}
      <div style={{ padding: "0 12px 10px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
          borderRadius: 12, padding: "6px 10px",
          border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.09)",
        }}>
          <Search style={{ width: 10, height: 10, flexShrink: 0, color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.30)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="시술명, 카테고리 검색..."
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontSize: 8, color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.70)",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, lineHeight: 1 }}
            >
              <X style={{ width: 9, height: 9, color: isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.25)" }} />
            </button>
          )}
        </div>
      </div>

      {/* ── Glassmorphism category floating bar ── */}
      <div style={{ padding: "0 12px 16px" }}>
        <div style={{
          display: "flex", alignItems: "stretch", position: "relative",
          background: barBg, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
          border: barBorder, borderRadius: 18,
          boxShadow: barShadow, overflow: "hidden",
        }}>
          {/* Scrollable tabs */}
          <div
            ref={catScrollRef}
            onWheel={handleCatWheel}
            onScroll={updateScrollState}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ flex: 1, display: "flex", overflowX: "auto", scrollbarWidth: "none", cursor: "grab" }}
          >
            {cats.map(cat => {
              const isActive = cat.id === activeCat
              const iconC = isActive
                ? (isDark ? gold : "#111111")
                : (isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.28)")
              const labelC = isActive
                ? (isDark ? "#f5f0e8" : "#111111")
                : (isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.28)")
              return (
                <button key={cat.id} type="button" onClick={() => setActiveCat(cat.id)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "8px 13px", minWidth: 52, flexShrink: 0,
                  background: isActive
                    ? (isDark ? "rgba(201,168,92,0.14)" : "rgba(0,0,0,0.055)")
                    : "transparent",
                  border: "none", cursor: "pointer",
                  borderBottom: `2px solid ${isActive ? (isDark ? gold : "#111") : "transparent"}`,
                  transition: "all 0.2s ease",
                }}>
                  <TreatmentCatIcon iconKey={cat.icon} size={15} color={iconC} />
                  <span style={{ fontSize: 7, color: labelC, fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap" }}>
                    {cat.label}
                  </span>
                </button>
              )
            })}
          </div>
          {/* Left arrow — appears when not at start */}
          {!catScroll.atStart && (
            <button type="button" onClick={() => scrollCatBy(-80)} style={{
              position: "absolute", left: 0, top: 0, bottom: 0,
              display: "flex", alignItems: "center", paddingLeft: 9, paddingRight: 22,
              background: isDark
                ? "linear-gradient(to left, transparent, rgba(14,12,9,0.70) 55%)"
                : "linear-gradient(to left, transparent, rgba(248,248,246,0.70) 55%)",
              border: "none", cursor: "pointer",
            }}>
              <ChevronLeft size={13} color={isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)"} />
            </button>
          )}
          {/* Right arrow — appears when not at end */}
          {!catScroll.atEnd && (
            <button type="button" onClick={() => scrollCatBy(80)} style={{
              position: "absolute", right: 0, top: 0, bottom: 0,
              display: "flex", alignItems: "center", paddingRight: 9, paddingLeft: 22,
              background: isDark
                ? "linear-gradient(to right, transparent, rgba(14,12,9,0.70) 55%)"
                : "linear-gradient(to right, transparent, rgba(248,248,246,0.70) 55%)",
              border: "none", cursor: "pointer",
            }}>
              <ChevronRight size={13} color={isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)"} />
            </button>
          )}
        </div>
      </div>

      {/* ── Treatment cards — 반응형 그리드 (모바일 1열 / PC 3열) ── */}
      <div style={{
        padding: isDesktop ? "28px 80px 40px" : "0 16px 20px",
        display: "grid",
        gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr",
        gap: 20,
      }}>
        {visibleCards.slice(0, isDesktop ? 9 : 8).map((t, i) => (
          <RevealBox key={t.id} delay={i * 60}>
            {(() => {
              const action = (v.cardAction as string) || "landing"
              const href =
                action === "landing" ? (t.landingPageUrl ?? `/preview/landing/live/${t.id}`) :
                action === "booking" ? (t.bookingUrl ?? undefined) :
                action === "kakao"   ? (t.kakaoUrl   ?? undefined) :
                undefined
              return (
                <PreviewTreatmentCard
                  treatment={t as PreviewTreatmentCardData}
                  isDark={isDark}
                  gold={gold}
                  cardValues={v}
                  href={href}
                />
              )
            })()}
          </RevealBox>
        ))}
        {visibleCards.length === 0 && q && (
          <div style={{
            padding: "20px 0", textAlign: "center",
            color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.25)", fontSize: 8,
          }}>
            &ldquo;{searchQuery}&rdquo; 검색 결과가 없습니다
          </div>
        )}
        {linked.length === 0 && (
          <div style={{
            padding: "24px 0", textAlign: "center",
            color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.22)", fontSize: 8,
          }}>
            의료진/장비 메뉴 → 시술에서 등록한 시술이 여기에 연동됩니다
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Editor: Treatments ───────────────────────────────────────────────────────

// ─── 카드 스타일 에디터 (의료진과 동일한 BOX_PRESETS 사용) ─────────────────────

function TreatmentCardStyleEditor({
  values, onChange, isDark,
}: { values: Record<string, FieldValue>; onChange: (k: string, v: FieldValue) => void; isDark: boolean }) {
  const presets    = isDark ? BOX_PRESETS_DARK : BOX_PRESETS_LIGHT
  const cardPreset = (values.cardPreset as string) || "glass-gold"
  const [showFine, setShowFine] = useState(false)

  // Gradient state (mirroring LinkedDataEditor)
  const [gradFrom,  setGradFrom]  = useState(isDark ? "#0e0c09" : "#ffffff")
  const [gradTo,    setGradTo]    = useState(isDark ? "#1a1710" : "#f5f3ef")
  const [gradAngle, setGradAngle] = useState(135)
  const buildGrad = (f: string, t: string, a: number) => `linear-gradient(${a}deg,${f} 0%,${t} 100%)`

  const curBg  = values.cardBg     as string | undefined
  const curBd  = values.cardBorder as string | undefined
  const curSh  = values.cardShadow as string | undefined
  const curBlur  = (values.cardBlur   as number) || 0
  const curRad   = (values.cardRadius as number) || 12
  const isGradient    = curBg?.startsWith("linear-gradient") ?? false
  const matchedShadow = SHADOW_PRESETS.find(s => s.css === curSh)

  function applyPreset(id: string) {
    onChange("cardPreset", id)
    onChange("cardBg",     "")
    onChange("cardBorder", "")
    onChange("cardShadow", "")
    onChange("cardBlur",   0)
    onChange("cardRadius", 12)
  }

  const nameColor  = (values.cardNameColor  as string) || ""
  const descColor  = (values.cardDescColor  as string) || ""
  const priceColor = (values.cardPriceColor as string) || ""

  return (
    <div className="space-y-4">
      <InfoSubLabel title="카드 스타일" />

      {/* ── 프리셋 그리드 ── */}
      <div className="grid grid-cols-4 gap-2">
        {presets.map(ps => {
          const sel = cardPreset === ps.id
          return (
            <button key={ps.id} type="button" onClick={() => applyPreset(ps.id)}
              className={cn("relative rounded-xl border-2 overflow-hidden text-left transition-all aspect-square",
                sel ? "border-primary" : "border-border hover:border-muted-foreground/40"
              )}>
              <div className="absolute inset-0" style={{ background: ps.bg }} />
              {sel && <div className="absolute inset-0 border-[3px] border-primary rounded-xl pointer-events-none" />}
              <div className="relative p-1.5 flex flex-col justify-end h-full">
                <span className="text-[8px] font-semibold leading-tight" style={{
                  color: isDark ? "#f5f0e8" : "#111",
                  textShadow: isDark ? "0 1px 4px rgba(0,0,0,0.8)" : "0 1px 2px rgba(255,255,255,0.9)",
                }}>{ps.label}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── 세부 조정 토글 ── */}
      <button type="button" onClick={() => setShowFine(v => !v)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
        <ChevronRight className={cn("h-3 w-3 transition-transform", showFine && "rotate-90")} />
        세부 조정
      </button>

      {showFine && (
        <div className="space-y-4 rounded-xl border bg-muted/30 p-3">

          {/* 배경 — 단색 / 그라데이션 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">배경</p>
              <div className="flex gap-1">
                <button type="button"
                  onClick={() => { const nb = curBg?.startsWith("linear-gradient") ? (isDark ? "#0e0c09" : "#ffffff") : (curBg ?? (isDark ? "#0e0c09" : "#ffffff")); onChange("cardBg", nb) }}
                  className={cn("px-2 py-0.5 rounded text-[10px] border transition-all", !isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background")}>
                  단색
                </button>
                <button type="button"
                  onClick={() => onChange("cardBg", buildGrad(gradFrom, gradTo, gradAngle))}
                  className={cn("px-2 py-0.5 rounded text-[10px] border transition-all", isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background")}>
                  그라데이션
                </button>
              </div>
            </div>
            {!isGradient ? (
              <div className="flex items-center gap-2">
                <input type="color"
                  value={curBg && !curBg.startsWith("rgba") && !curBg.startsWith("linear") ? curBg : (isDark ? "#0e0c09" : "#ffffff")}
                  onChange={e => onChange("cardBg", e.target.value)}
                  className="h-8 w-10 rounded cursor-pointer border border-border" />
                <Input className="h-7 text-xs font-mono flex-1" value={curBg ?? ""}
                  onChange={e => onChange("cardBg", e.target.value)}
                  placeholder="rgba(255,255,255,0.08) 또는 #000000" />
                {curBg && <button type="button" onClick={() => onChange("cardBg", "")}
                  className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="color" value={gradFrom}
                    onChange={e => { setGradFrom(e.target.value); onChange("cardBg", buildGrad(e.target.value, gradTo, gradAngle)) }}
                    className="h-8 w-10 rounded cursor-pointer border border-border" title="시작 색상" />
                  <span className="text-muted-foreground text-xs">→</span>
                  <input type="color" value={gradTo}
                    onChange={e => { setGradTo(e.target.value); onChange("cardBg", buildGrad(gradFrom, e.target.value, gradAngle)) }}
                    className="h-8 w-10 rounded cursor-pointer border border-border" title="끝 색상" />
                  <div className="flex-1 h-6 rounded" style={{ background: buildGrad(gradFrom, gradTo, gradAngle) }} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] text-muted-foreground whitespace-nowrap">각도 {gradAngle}°</Label>
                  <input type="range" min={0} max={360} step={15} value={gradAngle}
                    onChange={e => { const a = Number(e.target.value); setGradAngle(a); onChange("cardBg", buildGrad(gradFrom, gradTo, a)) }}
                    className="flex-1 accent-primary" />
                </div>
              </div>
            )}
          </div>

          {/* 테두리 */}
          <div>
            <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">테두리</p>
            <div className="flex items-center gap-2">
              <input type="color"
                value={curBd && !curBd.startsWith("rgba") ? curBd : "#888888"}
                onChange={e => onChange("cardBorder", e.target.value)}
                className="h-8 w-10 rounded cursor-pointer border border-border" />
              <Input className="h-7 text-xs font-mono flex-1" value={curBd ?? ""}
                onChange={e => onChange("cardBorder", e.target.value)}
                placeholder="rgba(255,255,255,0.22)" />
              {curBd && <button type="button" onClick={() => onChange("cardBorder", "")}
                className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
            </div>
          </div>

          {/* 그림자 */}
          <div>
            <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">그림자</p>
            <div className="flex flex-wrap gap-1.5">
              {SHADOW_PRESETS.map(sp => {
                const sel = matchedShadow?.id === sp.id || (!curSh && sp.id === "none")
                return (
                  <button key={sp.id} type="button"
                    onClick={() => onChange("cardShadow", sp.css === "none" ? "" : sp.css)}
                    className={cn("px-2.5 py-1 rounded-full border text-[10px] transition-all",
                      sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background hover:border-muted-foreground/40"
                    )}>
                    {sp.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 백드롭 블러 */}
          <div>
            <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">백드롭 블러</p>
            <div className="flex gap-1.5 flex-wrap">
              {[{val:0,label:"없음"},{val:4,label:"4px"},{val:8,label:"8px"},{val:14,label:"14px"},{val:20,label:"20px"}].map(b => (
                <button key={b.val} type="button" onClick={() => onChange("cardBlur", b.val)}
                  className={cn("px-2.5 py-1 rounded-full border text-[10px] transition-all",
                    curBlur === b.val ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background hover:border-muted-foreground/40"
                  )}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* 모서리 라운드 */}
          <div>
            <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">모서리 라운드</p>
            <div className="flex gap-1.5 flex-wrap">
              {[{val:4,label:"4"},{val:8,label:"8"},{val:12,label:"12"},{val:16,label:"16"},{val:20,label:"20"},{val:24,label:"24"}].map(r => (
                <button key={r.val} type="button" onClick={() => onChange("cardRadius", r.val)}
                  className={cn("px-2.5 py-1 rounded-full border text-[10px] transition-all",
                    curRad === r.val ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background hover:border-muted-foreground/40"
                  )}>
                  {r.label}px
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => applyPreset(cardPreset)}
            className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2">
            프리셋으로 초기화
          </button>
        </div>
      )}

      {/* ── 카드 텍스트 색상 ── */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">텍스트 색상</p>
        {[
          { label: "시술명", key: "cardNameColor",  val: nameColor,  placeholder: isDark ? "#f5f0e8" : "#111111" },
          { label: "설명",   key: "cardDescColor",  val: descColor,  placeholder: isDark ? "rgba(255,255,255,0.48)" : "#888888" },
          { label: "가격",   key: "cardPriceColor", val: priceColor, placeholder: isDark ? "#c9a85c" : "#111111" },
        ].map(({ label, key, val, placeholder }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-10 shrink-0">{label}</span>
            <input type="color" value={val || "#888888"}
              onChange={e => onChange(key, e.target.value)}
              className="h-7 w-7 cursor-pointer rounded border border-border shrink-0" />
            <Input value={val} placeholder={placeholder}
              onChange={e => onChange(key, e.target.value)}
              className="rounded-xl flex-1 text-xs h-7" />
            {val && <button type="button" onClick={() => onChange(key, "")} className="text-[10px] text-muted-foreground hover:text-destructive shrink-0">초기화</button>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Editor: Treatments ───────────────────────────────────────────────────────

function TreatmentsEditor({ values, onChange }: { values: Record<string, FieldValue>; onChange: (k: string, v: FieldValue) => void }) {
  const isDark = ((values.bgColor as string) || "light") === "dark"
  const cats   = parseTreatmentCats(values.categories)

  const saveCats = (updated: TreatmentCategory[]) => onChange("categories", JSON.stringify(updated))
  const patchCat = (i: number, patch: Partial<TreatmentCategory>) =>
    saveCats(cats.map((c, idx) => idx === i ? { ...c, ...patch } : c))
  const deleteCat = (i: number) => saveCats(cats.filter((_, idx) => idx !== i))
  const addCat    = () => saveCats([...cats, {
    id: `tc_${Date.now()}`, label: "새 카테고리", icon: "sparkles", description: "",
  }])

  return (
    <div className="space-y-6">

      {/* ── 배경 ── */}
      <div className="space-y-3">
        <InfoSubLabel title="배경" />
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="h-8 w-8 rounded-lg flex-none" style={{
            background: isDark
              ? "linear-gradient(135deg,rgba(201,168,92,0.3) 0%,#0e0c09 100%)"
              : "linear-gradient(135deg,rgba(180,180,180,0.2) 0%,#ffffff 100%)",
            border: "1px solid rgba(128,128,128,0.2)",
          }} />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">배경 테마</p>
            <p className="text-[10px] text-muted-foreground">
              {isDark ? "블랙 · 골드 앰비언트 글로우" : "화이트 · 메쉬 그라데이션"}
            </p>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-medium">
            <button type="button" onClick={() => onChange("bgColor","dark")}
              className={cn("px-3 py-1.5 transition-colors",
                isDark ? "bg-neutral-900 text-white" : "text-muted-foreground hover:bg-muted")}>
              블랙
            </button>
            <button type="button" onClick={() => onChange("bgColor","light")}
              className={cn("px-3 py-1.5 border-l border-border transition-colors",
                !isDark ? "bg-white text-neutral-900" : "text-muted-foreground hover:bg-muted")}>
              화이트
            </button>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── 텍스트 스타일 ── */}
      <div className="space-y-4">
        <InfoSubLabel title="텍스트 스타일" />
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-5">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">영어 서브타이틀</p>
            <Input placeholder="OUR SERVICES" value={(values.pageEyebrow as string) ?? ""}
              onChange={e => onChange("pageEyebrow", e.target.value)} className="rounded-xl" />
            <FontControls prefix="pageEyebrow" group="eyebrow" values={values} onChange={onChange} />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">메인 제목</p>
            <Input placeholder="시술 안내" value={(values.pageTitle as string) ?? ""}
              onChange={e => onChange("pageTitle", e.target.value)} className="rounded-xl" />
            <FontControls prefix="pageTitle" group="headline" values={values} onChange={onChange} />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">섹션 설명</p>
            <RichTextEditor
              mode="floating"
              placeholder={"타토아 클리닉의 다양한 시술 프로그램을 확인해보세요.\n모든 시술은 전문 의료진의 1:1 상담 후 진행됩니다."}
              value={(values.pageSubtitle as string) ?? ""}
              onChange={(html) => onChange("pageSubtitle", html)}
              minHeight={72}
            />
            <FontControls prefix="pageSubtitle" group="body" values={values} onChange={onChange} />
          </div>
        </div>
      </div>

      <Separator />

      {/* ── 카테고리 설정 ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <InfoSubLabel title="카테고리 설정" />
          <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{cats.length}개</span>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            첫 번째 카테고리는 <strong>전체 보기</strong>로 사용됩니다. 각 카테고리의 라벨이 시술 카테고리명과 일치해야 연동됩니다.
          </p>
        </div>

        <div className="space-y-2">
          {cats.map((cat, i) => (
            <div key={cat.id} className="rounded-xl border border-border bg-card p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Icon preview */}
                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                    <TreatmentCatIcon iconKey={cat.icon} size={13} color="currentColor" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{cat.label || "카테고리"}</span>
                </div>
                {i > 0 && (
                  <button type="button" onClick={() => deleteCat(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {/* Label + Description */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">카테고리명</p>
                  <Input value={cat.label} placeholder="보톡스"
                    onChange={e => patchCat(i, { label: e.target.value })} className="rounded-lg h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">설명 (아이콘 하단)</p>
                  <Input value={cat.description} placeholder="보툴리눔 시술"
                    onChange={e => patchCat(i, { description: e.target.value })} className="rounded-lg h-8 text-xs" />
                </div>
              </div>
              {/* Icon picker */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground">아이콘 선택</p>
                <div className="flex flex-wrap gap-1.5">
                  {TREATMENT_ICON_OPTIONS.map(opt => (
                    <button key={opt.key} type="button"
                      onClick={() => patchCat(i, { icon: opt.key })}
                      title={opt.label}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center border transition-all",
                        cat.icon === opt.key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50"
                      )}>
                      <opt.Icon size={13} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addCat}
          className="w-full rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />카테고리 추가
        </button>
      </div>

      <Separator />

      {/* ── 카드 스타일 ── */}
      <TreatmentCardStyleEditor values={values} onChange={onChange} isDark={isDark} />

      <Separator />

      {/* ── 카드 클릭 동작 ── */}
      {(() => {
        const action = (values.cardAction as string) || "landing"
        const target = (values.cardTarget as string) || "_blank"
        const baseUrl = (values.cardBaseUrl as string) || "/treatments/"
        return (
          <div className="space-y-4">
            <InfoSubLabel title="카드 클릭 동작" />

            {/* 동작 선택 2×2 그리드 */}
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { val: "landing", label: "시술 랜딩페이지", desc: "/treatments/{id}", Icon: FileText },
                { val: "booking", label: "예약 바로가기",   desc: "bookingUrl 연동",  Icon: CalendarDays },
                { val: "kakao",   label: "카카오 상담",     desc: "kakaoUrl 연동",    Icon: Globe },
                { val: "none",    label: "비활성",          desc: "클릭 반응 없음",   Icon: EyeOff },
              ] as const).map(({ val, label, desc, Icon }) => {
                const sel = action === val
                return (
                  <button key={val} type="button" onClick={() => onChange("cardAction", val)}
                    className={cn(
                      "flex items-start gap-2 rounded-xl border p-2.5 text-left transition-all",
                      sel ? "border-primary bg-primary/8" : "border-border bg-muted/20 hover:border-primary/40"
                    )}>
                    <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", sel ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <p className={cn("text-[11px] font-semibold leading-tight", sel ? "text-foreground" : "text-muted-foreground")}>{label}</p>
                      <p className="text-[9px] text-muted-foreground/60 font-mono mt-0.5">{desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* 랜딩 선택 시: 기본 경로 설정 */}
            {action === "landing" && (
              <div>
                <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider mb-1.5">랜딩 기본 경로</p>
                <Input
                  value={baseUrl}
                  onChange={e => onChange("cardBaseUrl", e.target.value)}
                  placeholder="/treatments/"
                  className="h-8 text-xs font-mono rounded-xl"
                />
                <p className="text-[9px] text-muted-foreground mt-1">
                  예: <code className="bg-muted px-1 rounded">/treatments/</code> → 클릭 시 <code className="bg-muted px-1 rounded">/treatments/tr_t1</code> 이동
                </p>
              </div>
            )}

            {/* 링크 타겟 */}
            {action !== "none" && (
              <div>
                <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">링크 열기</p>
                <div className="flex gap-1.5">
                  {([
                    { val: "_blank", label: "새 탭" },
                    { val: "_self",  label: "현재 탭" },
                  ] as const).map(({ val, label }) => (
                    <button key={val} type="button" onClick={() => onChange("cardTarget", val)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-[10px] transition-all",
                        target === val
                          ? "border-primary bg-primary/10 font-semibold text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40"
                      )}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 공개 랜딩페이지 미구축 안내 */}
            {action === "landing" && (
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/30 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">공개 랜딩페이지 미구축</p>
                    <p className="text-[9px] text-amber-600/80 dark:text-amber-500/80 leading-relaxed mt-0.5">
                      현재 <code className="bg-amber-100 dark:bg-amber-900/50 px-0.5 rounded">/treatments/[id]</code> 공개 라우트가 없습니다.
                      관리자 내부 미리보기(<code className="bg-amber-100 dark:bg-amber-900/50 px-0.5 rounded">/preview/landing/live/[id]</code>)는 동작합니다.
                      공개 배포 전 라우트 구축이 필요합니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      <Separator />

      {/* ── 연동 안내 ── */}
      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-xs font-medium text-foreground">시술 데이터 연동</p>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          시술 카드는 <strong>의료진/장비 메뉴 → 시술</strong>에서 등록한 항목이 자동 연동됩니다.
          카드 내용(이미지·제목·가격·뱃지)을 수정하려면 해당 메뉴에서 시술 정보를 편집하세요.
        </p>
      </div>

    </div>
  )
}

function PreviewStrengths({ v, device = "mobile" }: { v: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const isDesktop = device === "desktop"
  const gold = "#c9a85c"

  // ── Section 1 ──
  const s1Dark   = ((v.s1BgColor as string) || "dark") === "dark"
  const s1Stats  = parseSStats(v.s1Stats, DEFAULT_S1_STATS)
  const s1SubLabel    = (v.s1SubLabel    as string) || "TATOA IN NUMBERS"
  const s1Headline    = (v.s1Headline    as string) || "시간이 증명한\n아름다움의 기준"
  const s1Description = (v.s1Description as string) || "15년간 쌓아온 신뢰와 결과로\n증명하는 타토아의 브랜드 파워"
  const s1MapImages = parseS1MapImages(v.s1MapImages, (v.s1MapImage as string) || "")

  const s1SubColor   = (v.s1SubLabelColor    as string) || gold
  const s1HColor     = (v.s1HeadlineColor    as string) || (s1Dark ? "#f5f0e8" : "#1a1a1a")
  const s1DColor     = (v.s1DescriptionColor as string) || (s1Dark ? "rgba(255,255,255,0.55)" : "#666")
  const s1HSize      = DOCTOR_SIZE_MAP[(v.s1HeadlineSize as string) || "md"] ?? 19
  const s1HWeight    = (v.s1HeadlineWeight   as string) || "600"
  const s1HFont      = getFontCss((v.s1HeadlineFont as string) || "sans")

  // ── Section 2 ──
  const s2Dark   = ((v.s2BgColor as string) || "dark") === "dark"
  const s2Stats  = parseSStats(v.s2Stats, DEFAULT_S2_STATS)
  const s2Headline    = (v.s2Headline    as string) || "숫자로 보는 신뢰"
  const s2Description = (v.s2Description as string) || "타토아를 선택한 고객들의\n진실된 재방문 데이터"

  const s2HColor  = (v.s2HeadlineColor    as string) || (s2Dark ? "#f5f0e8" : "#1a1a1a")
  const s2DColor  = (v.s2DescriptionColor as string) || (s2Dark ? "rgba(255,255,255,0.55)" : "#666")
  const s2HSize   = DOCTOR_SIZE_MAP[(v.s2HeadlineSize as string) || "md"] ?? 19
  const s2HWeight = (v.s2HeadlineWeight  as string) || "600"
  const s2HFont   = getFontCss((v.s2HeadlineFont as string) || "sans")
  const s2MapImages = parseS1MapImages(v.s2MapImages)

  // Dynamic SubLabel height for s2 paddingTop alignment (PC only)
  const subLabelRef = useRef<HTMLParagraphElement>(null)
  const [subLabelH, setSubLabelH] = useState(14)
  useLayoutEffect(() => {
    if (subLabelRef.current) {
      const h = subLabelRef.current.offsetHeight
      if (h > 0) setSubLabelH(h)
    }
  }, [v.s1SubLabel, v.s1SubLabelSize, v.s1SubLabelWeight, v.s1SubLabelFont])

  return (
    <div style={{ display: isDesktop ? "flex" : "block" }}>
      {/* ── Section 1: TATOA IN NUMBERS ── */}
      <div style={{ ...sectionBgStyle(s1Dark), flex: isDesktop ? "0 0 50%" : undefined }}>
        <div style={{ maxWidth: isDesktop ? 600 : undefined, marginLeft: isDesktop ? "auto" : undefined, padding: isDesktop ? "20px 14px 18px 15%" : "20px 14px 18px" }}>
        {/* Sub-label */}
        <p ref={subLabelRef} style={{
          fontSize: DOCTOR_SIZE_MAP[(v.s1SubLabelSize as string) || "xs"] ?? 11,
          fontWeight: Number((v.s1SubLabelWeight as string) || "600"),
          fontFamily: getFontCss((v.s1SubLabelFont as string) || "sans"),
          color: s1SubColor,
          letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 9,
        }}>
          {s1SubLabel}
        </p>
        {/* Headline */}
        <p style={{
          fontSize: s1HSize, fontWeight: Number(s1HWeight), fontFamily: s1HFont,
          color: s1HColor, lineHeight: 1.3, marginBottom: 8,
        }}>
          {renderTextWithLineBreaks(s1Headline)}
        </p>
        {/* Description */}
        <p style={{ fontSize: DOCTOR_SIZE_MAP[(v.s1DescriptionSize as string) || "xs"] ?? 11, color: s1DColor, lineHeight: 1.5, marginBottom: 12 }}>
          {renderTextWithLineBreaks(s1Description)}
        </p>
        {/* Mini stat cards — sequential reveal */}
        <div style={{ display: "flex", gap: 10 }}>
          {s1Stats.slice(0, 4).map((stat, i) => {
            const cs = resolveStatCardStyle(stat, s1Dark)
            const valC = stat.valueColor || gold
            const lblC = stat.labelColor || (s1Dark ? "rgba(255,255,255,0.42)" : "#888")
            return (
              <RevealBox key={stat.id} delay={i * 120} style={{ flex: 1 }}>
                <div style={{
                  borderRadius: cs.radius, background: cs.bg, border: cs.border,
                  boxShadow: cs.shadow, backdropFilter: cs.blur ? `blur(${cs.blur}px)` : undefined,
                  padding: "14px 8px", textAlign: "center", height: "100%",
                }}>
                  <p style={{ fontSize: 24, fontWeight: 700, color: valC, lineHeight: 1 }}>
                    {stat.value}<span style={{ fontSize: 12 }}>{stat.unit}</span>
                  </p>
                  <p style={{ fontSize: 12, color: lblC, marginTop: 6, lineHeight: 1.2 }}>{stat.label}</p>
                </div>
              </RevealBox>
            )
          })}
        </div>
        {/* Section images */}
        {s1MapImages.length === 0 ? (
          <div style={{ width: "100%", marginTop: 12, borderRadius: 8, overflow: "hidden",
            background: s1Dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            minHeight: 88, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 7, color: s1Dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)" }}>이미지 없음</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {s1MapImages.map((img, idx) => {
              const shadow = buildS1Shadow(img)
              const grad   = buildS1Gradient(img)
              const ratio  = idx === 0 ? "5/4" : "3/2"
              return (
                <div key={img.id} style={{ width: "100%", aspectRatio: ratio, borderRadius: 8, overflow: "hidden", position: "relative", flexShrink: 0, boxShadow: shadow !== "none" ? shadow : undefined }}>
                  {img.url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: img.position, filter: buildS1ImgFilter(img) || undefined }} />
                      {grad && <div style={{ position: "absolute", inset: 0, background: grad, pointerEvents: "none" }} />}
                    </>
                  ) : (
                    <div style={{ position: "absolute", inset: 0, background: s1Dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 7, color: s1Dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>이미지 {idx + 1}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        </div>
      </div>

      {/* ── Section 2: 신뢰 지표 ── */}
      <div style={{ ...sectionBgStyle(s2Dark), flex: isDesktop ? "0 0 50%" : undefined }}>
        <div style={{ maxWidth: isDesktop ? 600 : undefined, marginRight: isDesktop ? "auto" : undefined, padding: isDesktop ? (20 + subLabelH + 9) + "px 15% 18px 14px" : "30px 14px 18px" }}>
        <p style={{
          fontSize: s2HSize, fontWeight: Number(s2HWeight), fontFamily: s2HFont,
          color: s2HColor, lineHeight: 1.3, marginBottom: 6,
        }}>
          {renderTextWithLineBreaks(s2Headline)}
        </p>
        <p style={{ fontSize: DOCTOR_SIZE_MAP[(v.s2DescriptionSize as string) || "xs"] ?? 11, color: s2DColor, lineHeight: 1.5, marginBottom: 14 }}>
          {renderTextWithLineBreaks(s2Description)}
        </p>
        {/* Big stat cards — sequential reveal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {s2Stats.map((stat, i) => (
            <RevealBox key={stat.id} delay={i * 130}>
              <S2StatCard stat={stat} isDark={s2Dark} gold={gold} />
            </RevealBox>
          ))}
        </div>
        {/* Section images — bottom */}
        {s2MapImages.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {s2MapImages.map((img, idx) => {
              const shadow = buildS1Shadow(img)
              const grad   = buildS1Gradient(img)
              const ratio  = idx === 0 ? "5/4" : "3/2"
              return (
                <div key={img.id} style={{ width: "100%", aspectRatio: ratio, borderRadius: 8, overflow: "hidden", position: "relative", flexShrink: 0, boxShadow: shadow !== "none" ? shadow : undefined }}>
                  {img.url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: img.position, filter: buildS1ImgFilter(img) || undefined }} />
                      {grad && <div style={{ position: "absolute", inset: 0, background: grad, pointerEvents: "none" }} />}
                    </>
                  ) : (
                    <div style={{ position: "absolute", inset: 0, background: s2Dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 7, color: s2Dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>이미지 {idx + 1}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
// ─── Branch Info / Global Network section types & helpers ────────────────────

type BranchCard = {
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

const DEFAULT_BRANCH_CARDS: BranchCard[] = [
  { id:"bc1", region:"SEOUL · KOREA",  name:"TATOA Gangnam",  feature:"The Flagship Experience", url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:30, imgFade:65, imgBlend:"normal" },
  { id:"bc2", region:"BUSAN · KOREA",  name:"TATOA Haeundae", feature:"Coastal Luxury Clinic",   url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:30, imgFade:65, imgBlend:"normal" },
  { id:"bc3", region:"TOKYO · JAPAN",  name:"TATOA Shibuya",  feature:"Precision & Elegance",    url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:30, imgFade:65, imgBlend:"normal" },
  { id:"bc4", region:"OSAKA · JAPAN",  name:"TATOA Namba",    feature:"Modern Beauty Hub",       url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:30, imgFade:65, imgBlend:"normal" },
  { id:"bc5", region:"DUBAI · UAE",    name:"TATOA Dubai",    feature:"Global Premium Care",     url:"", imgUrl:"", imgPosition:"center", imgEffectId:"none", imgBrightness:100, imgContrast:100, imgSaturate:100, imgHue:0, imgOverlay:"#000000", imgOverlayOpacity:30, imgFade:65, imgBlend:"normal" },
]

function parseBranchCards(raw: FieldValue): BranchCard[] {
  try {
    const parsed = JSON.parse((raw as string) || "[]")
    if (Array.isArray(parsed) && parsed.length > 0) {
      return (parsed as BranchCard[]).map(c => ({
        id: c.id || `bc${Date.now()}`,
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

function buildCardFilter(card: BranchCard | EventCard): string {
  const effectFilter = IMG_EFFECTS.find(e => e.id === (card.imgEffectId || "none"))?.filter || ""
  const manualParts: string[] = []
  if (card.imgBrightness !== 100) manualParts.push(`brightness(${card.imgBrightness}%)`)
  if (card.imgContrast  !== 100) manualParts.push(`contrast(${card.imgContrast}%)`)
  if (card.imgSaturate  !== 100) manualParts.push(`saturate(${card.imgSaturate}%)`)
  if (card.imgHue       !== 0)   manualParts.push(`hue-rotate(${card.imgHue}deg)`)
  return [effectFilter, manualParts.join(" ")].filter(Boolean).join(" ")
}

// ─── Preview: Branch Info / Global Network ───────────────────────────────────

function PreviewBranchInfo({ v, device = "mobile" }: { v: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const isDesktop = device === "desktop"
  const isDark  = ((v.biBgColor as string) || "dark") === "dark"
  const gold    = "#c9a85c"
  const bgStyle = sectionBgStyle(isDark)
  const cards   = parseBranchCards(v.branchCards)

  const subText   = (v.biSubLabel      as string) || "OUR BRANCHES"
  const subColor  = (v.biSubLabelColor as string) || gold
  const subSize   = (DOCTOR_SIZE_MAP[(v.biSubLabelSize as string) || "xs"] ?? 11) + "px"
  const subWeight = (v.biSubLabelWeight as string) || "600"

  const titleText   = (v.biTitle       as string) || "Global Network"
  const titleColor  = (v.biTitleColor  as string) || (isDark ? "#f5f0e8" : "#1a1a1a")
  const titleSize   = (DOCTOR_SIZE_MAP[(v.biTitleSize as string) || "xl"] ?? 27) + "px"
  const titleWeight = (v.biTitleWeight as string) || "700"
  const titleFont   = INFO_FONT_MAP[(v.biTitleFont   as string) || "sans"] || INFO_FONT_MAP.sans

  const visibleCards = cards.slice(0, 5)
  const extraCount   = Math.max(0, cards.length - 5)

  // Card dims: doubled (×2) per STEP 14 — width 308, height 428
  const CARD_W = 308
  const CARD_H = 428

  // Drag-to-scroll for branch carousel (PC mouse + works on touch via native scroll)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ isDown: false, startX: 0, startScrollLeft: 0 })
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollerRef.current) return
    dragRef.current.isDown = true
    dragRef.current.startX = e.pageX - scrollerRef.current.offsetLeft
    dragRef.current.startScrollLeft = scrollerRef.current.scrollLeft
    scrollerRef.current.style.cursor = "grabbing"
    scrollerRef.current.style.userSelect = "none"
  }
  const handleMouseLeave = () => {
    if (!scrollerRef.current) return
    dragRef.current.isDown = false
    scrollerRef.current.style.cursor = "grab"
    scrollerRef.current.style.removeProperty("user-select")
  }
  const handleMouseUp = () => {
    if (!scrollerRef.current) return
    dragRef.current.isDown = false
    scrollerRef.current.style.cursor = "grab"
    scrollerRef.current.style.removeProperty("user-select")
  }
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDown || !scrollerRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollerRef.current.offsetLeft
    const walk = (x - dragRef.current.startX) * 1.2
    scrollerRef.current.scrollLeft = dragRef.current.startScrollLeft - walk
  }

  return (
    <div style={{ ...bgStyle, paddingTop: "28px", paddingBottom: "16px", paddingLeft: isDesktop ? "15%" : 0, paddingRight: isDesktop ? "15%" : 0 }}>
      {/* Header text */}
      <div style={{ paddingLeft: "16px", paddingRight: "14px", marginBottom: "12px" }}>
        <p style={{
          fontSize: subSize, fontWeight: subWeight, color: subColor,
          letterSpacing: "0.12em", marginBottom: "4px", textTransform: "uppercase",
        }}>
          {subText}
        </p>
        <p style={{
          fontSize: titleSize, fontWeight: titleWeight, color: titleColor,
          fontFamily: titleFont, lineHeight: 1.18,
        }}>
          {titleText}
        </p>
      </div>

      {/* Horizontal scroll row */}
      <div style={{ position: "relative" }}>
      <div
        ref={scrollerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onDragStart={(e) => e.preventDefault()}
        style={{
        display: "flex", gap: "28px",
        overflowX: "auto", paddingRight: "10px",
        scrollSnapType: "x mandatory",
        scrollPaddingLeft: "16px",
        scrollbarWidth: "none",
        cursor: "grab",
      } as React.CSSProperties}>

        {visibleCards.map((card, idx) => {
          const finalFilter  = buildCardFilter(card)
          const overlayAlpha = ((card.imgOverlayOpacity ?? 30) / 100).toFixed(2)
          const overlayRgb   = hexToRgb(card.imgOverlay || "#000000")
          const overlayColor = `rgba(${overlayRgb},${overlayAlpha})`
          const fadeStop     = Math.max(0, 100 - (card.imgFade ?? 65))
          const gradBottom   = `linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0) ${fadeStop}%)`

          return (
            <div key={card.id} style={{
              flexShrink: 0, width: `${CARD_W}px`, height: `${CARD_H}px`,
              borderRadius: "10px", overflow: "hidden", position: "relative",
              scrollSnapAlign: "start",
              background: isDark ? "#1c1c1c" : "#d8d8d8",
              ...(idx === 0 ? { marginLeft: "16px" } : {}),
            }}>
              {/* Image */}
              {card.imgUrl ? (
                <img src={card.imgUrl} alt="" style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  objectFit: "cover", objectPosition: card.imgPosition || "center",
                  filter: finalFilter || undefined, display: "block",
                }} />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Building2 style={{ width: "22px", height: "22px", color: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.13)" }} />
                </div>
              )}
              {/* Overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: overlayColor,
                mixBlendMode: (card.imgBlend || "normal") as React.CSSProperties["mixBlendMode"],
              }} />
              {/* Gradient fade bottom */}
              <div style={{ position: "absolute", inset: 0, background: gradBottom }} />
              {/* Text */}
              <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px" }}>
                <p style={{ fontSize: "5.5px", fontWeight: "500", color: "rgba(255,255,255,0.58)", letterSpacing: "0.1em", marginBottom: "2px", textTransform: "uppercase" }}>
                  {card.region || "REGION · COUNTRY"}
                </p>
                <p style={{ fontSize: "9px", fontWeight: "700", color: "#fff", lineHeight: 1.2, marginBottom: "2px" }}>
                  {card.name || "Branch Name"}
                </p>
                <p style={{ fontSize: "6px", color: "rgba(255,255,255,0.52)", lineHeight: 1.3 }}>
                  {card.feature || "Feature tagline"}
                </p>
              </div>
            </div>
          )
        })}

        {/* 더보기 card */}
        {extraCount > 0 && (
          <div style={{
            flexShrink: 0, width: "176px", height: `${CARD_H}px`,
            borderRadius: "10px", scrollSnapAlign: "start",
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px",
          }}>
            <p style={{ fontSize: "15px", fontWeight: "700", color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.22)" }}>+{extraCount}</p>
            <p style={{ fontSize: "5.5px", color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)" }}>더보기</p>
          </div>
        )}
      </div>
        {isDesktop && (
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 80,
            pointerEvents: "none",
            background: "linear-gradient(to right, transparent, " + (isDark ? "#0e0c09" : "#f8f8f6") + ")",
          }} />
        )}
      </div>
    </div>
  )
}
// ── Info/Location helpers ────────────────────────────────────────────────────

function normalizeMapUrl(raw: string, zoom?: number): string {
  if (!raw) return ""
  const trimmed = raw.trim()
  // Strip iframe tag if user pasted full HTML
  const srcMatch = trimmed.match(/src="([^"]+)"/)
  if (srcMatch) return srcMatch[1]
  // Already an embed URL — apply zoom if q-format
  if (trimmed.includes("/maps/embed")) {
    try {
      const u = new URL(trimmed)
      if (zoom !== undefined && u.searchParams.has("q")) u.searchParams.set("z", String(zoom))
      return u.toString()
    } catch { return trimmed }
  }
  // Regular Google Maps URL → convert to embed
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

function resolveInfoBoxStyle(
  prefix: string,
  values: Record<string, FieldValue>,
  isDark: boolean
) {
  const presets = isDark ? BOX_PRESETS_DARK : BOX_PRESETS_LIGHT
  const presetId = (values[`${prefix}Preset`] as string) || "glass-gold"
  const ps = presets.find(p => p.id === presetId) ?? presets[1]
  const bg     = (values[`${prefix}Bg`]     as string) || ps.bg
  const border = (values[`${prefix}Border`] as string) || ps.border
  const shadow = (values[`${prefix}Shadow`] as string) || ps.shadow
  const blur   = (values[`${prefix}Blur`]   as number) ?? 0
  const radius = (values[`${prefix}Radius`] as number) ?? 12
  return { bg, border: `1px solid ${border}`, shadow, blur, radius }
}

const INFO_FONT_MAP: Record<string, string> = {
  sans: "system-ui,sans-serif",
  serif: "Georgia,serif",
  mono: "monospace",
  korean: "'Noto Serif KR',serif",
}
const INFO_SIZE_MAP: Record<string, string> = {
  xs: "7px", sm: "8px", md: "9px", lg: "10px", xl: "12px", "2xl": "14px",
}
const DOCTOR_SIZE_MAP: Record<string, number> = {
  xs: 11, sm: 15, md: 19, lg: 23, xl: 27,
}

function PreviewInfo({ v, device = "mobile" }: { v: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const isDesktop = device === "desktop"
  const isDark = ((v.infoBgColor as string) || "dark") === "dark"
  const gold   = "#c9a85c"
  const bgStyle = sectionBgStyle(isDark)

  // ── Title ────────────────────────────────────────────────────────────────
  const titleColor  = (v.infoTitleColor  as string) || (isDark ? gold : "#1a1a1a")
  const titleSize   = (DOCTOR_SIZE_MAP[(v.infoTitleSize as string) || "lg"] ?? 23) + "px"
  const titleWeight = (v.infoTitleWeight as string) || "700"
  const titleFont   = INFO_FONT_MAP[(v.infoTitleFont as string) || "sans"] || INFO_FONT_MAP.sans

  // ── Address box ──────────────────────────────────────────────────────────
  const addrBox      = resolveInfoBoxStyle("addr", v, isDark)
  const addrTitle    = (v.addrTitle as string) || "주소 / 연락처"
  const addrBody     = (v.addrBody  as string) || "서울특별시 강남구 테헤란로 123"
  const addrPhone    = (v.addrPhone as string) || "02-1234-5678"
  const addrTitleC   = (v.addrTitleColor  as string) || (isDark ? gold : "#1a1a1a")
  const addrBodyC    = (v.addrBodyColor   as string) || (isDark ? "rgba(255,255,255,0.72)" : "#555")
  const addrPhoneC   = (v.addrPhoneColor  as string) || (isDark ? gold : "#1a1a1a")
  const addrTitleSize = INFO_SIZE_MAP[(v.addrTitleSize as string) || "sm"] || "8px"
  const addrBodySize  = INFO_SIZE_MAP[(v.addrBodySize  as string) || "xs"] || "7px"
  const addrPhoneSize = INFO_SIZE_MAP[(v.addrPhoneSize as string) || "xs"] || "7px"
  const addrTitleW   = (v.addrTitleWeight as string) || "700"
  const addrBodyW    = (v.addrBodyWeight  as string) || "400"
  const addrPhoneW   = (v.addrPhoneWeight as string) || "600"

  // ── Hours box ────────────────────────────────────────────────────────────
  const hoursBox      = resolveInfoBoxStyle("hours", v, isDark)
  const hoursTitle    = (v.hoursTitle as string) || "진료 시간"
  const hoursLines    = parseHoursLines(v.hoursBody || "월~금  10:00 – 19:00\n토        10:00 – 17:00\n일·공휴일  휴진")
  const hoursTitleC   = (v.hoursTitleColor as string) || (isDark ? gold : "#1a1a1a")
  const hoursBodyC    = (v.hoursBodyColor  as string) || (isDark ? "rgba(255,255,255,0.72)" : "#555")
  const hoursTitleSize = INFO_SIZE_MAP[(v.hoursTitleSize as string) || "sm"] || "8px"
  const hoursBodySize  = INFO_SIZE_MAP[(v.hoursBodySize  as string) || "xs"] || "7px"
  const hoursTitleW   = (v.hoursTitleWeight as string) || "700"
  const hoursBodyW    = (v.hoursBodyWeight  as string) || "400"

  const mapUrl = (v.mapEmbedUrl as string) || ""

  // ── Shared sub-components ────────────────────────────────────────────────
  const mapBlock = (height: string) => (
    <div style={{ height, overflow: "hidden", position: "relative", borderRadius: isDesktop ? "12px" : 0 }}>
      {mapUrl ? (
        isDesktop ? (
          // PC: natural scale iframe, no transform trick
          <iframe
            src={mapUrl}
            width="100%" height="100%"
            style={{ border: 0, display: "block", touchAction: "pan-x pan-y" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          // Mobile: scale(0.7) trick to shrink map UI chrome
          <div style={{ position: "absolute", top: 0, left: 0, width: "143%", height: `${parseInt(height) * (1 / 0.7)}px`, transform: "scale(0.7)", transformOrigin: "top left" }}>
            <iframe src={mapUrl} width="100%" height="100%" style={{ border: 0, display: "block", touchAction: "pan-x pan-y" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          </div>
        )
      ) : (
        <div style={{ width: "100%", height: "100%", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px dashed ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`, borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px" }}>
          <MapPin style={{ width: "14px", height: "14px", color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }} />
          <span style={{ fontSize: "6px", color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)" }}>Google Maps 미연결</span>
        </div>
      )}
    </div>
  )

  const infoBoxes = (
    <>
      {/* Address box */}
      <div style={{ background: addrBox.bg, border: addrBox.border, boxShadow: addrBox.shadow === "none" ? "none" : addrBox.shadow, backdropFilter: addrBox.blur > 0 ? `blur(${addrBox.blur}px)` : undefined, borderRadius: addrBox.radius, padding: isDesktop ? "20px 24px" : "8px 10px", marginBottom: isDesktop ? "12px" : "6px", textAlign: isDesktop ? "center" : undefined }}>
        <p style={{ fontSize: isDesktop ? "11px" : addrTitleSize, fontWeight: addrTitleW, color: addrTitleC, marginBottom: isDesktop ? "10px" : "4px", letterSpacing: "0.04em" }}>{addrTitle}</p>
        <p style={{ fontSize: isDesktop ? "10px" : addrBodySize, fontWeight: addrBodyW, color: addrBodyC, lineHeight: 1.6, marginBottom: isDesktop ? "8px" : "3px", whiteSpace: "pre-line" }}>{addrBody}</p>
        <p style={{ fontSize: isDesktop ? "13px" : addrPhoneSize, fontWeight: "700", color: addrPhoneC }}>{addrPhone}</p>
      </div>
      {/* Hours box — structured rich-text lines */}
      <div style={{ background: hoursBox.bg, border: hoursBox.border, boxShadow: hoursBox.shadow === "none" ? "none" : hoursBox.shadow, backdropFilter: hoursBox.blur > 0 ? `blur(${hoursBox.blur}px)` : undefined, borderRadius: hoursBox.radius, padding: isDesktop ? "20px 24px" : "8px 10px" }}>
        <p style={{ fontSize: isDesktop ? "11px" : hoursTitleSize, fontWeight: hoursTitleW, color: hoursTitleC, marginBottom: isDesktop ? "10px" : "4px", letterSpacing: "0.04em", textAlign: isDesktop ? "center" : undefined }}>{hoursTitle}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, alignItems: isDesktop ? "center" : undefined }}>
          {hoursLines.map((line) => {
            const mainSize  = line.size === "sm" ? (isDesktop ? "8px" : "6px") : (isDesktop ? "10px" : hoursBodySize)
            const mainColor = resolveHoursColor(line.color, isDark, hoursBodyC)
            const sufColor  = resolveHoursColor(line.suffixColor, isDark, isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)")
            return (
              <div key={line.id} style={{ fontSize: mainSize, lineHeight: 1.55 }}>
                <span style={{ fontWeight: hoursBodyW, color: mainColor }}>{line.text}</span>
                {line.suffix && (
                  <span style={{ fontSize: isDesktop ? "8px" : "5.5px", color: sufColor, marginLeft: "4px" }}>{line.suffix}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )

  if (isDesktop) {
    return (
      <div style={{ ...bgStyle }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px 32px" }}>
          {/* Section title */}
          <p style={{ fontSize: titleSize, fontWeight: titleWeight, color: titleColor, fontFamily: titleFont, marginBottom: "20px", letterSpacing: "0.12em", textAlign: "center" }}>
            {(v.infoTitle as string) || "INFO"}
          </p>
          {/* Map (60%) + Info boxes (40%) side by side */}
          <div style={{ display: "flex", gap: "20px", alignItems: "stretch" }}>
            <div style={{ flex: "0 0 60%", minHeight: "480px" }}>
              {mapBlock("100%")}
            </div>
            <div style={{ flex: "0 0 calc(40% - 20px)", display: "flex", flexDirection: "column", justifyContent: "center", gap: "18px" }}>
              {infoBoxes}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...bgStyle, padding: "14px 14px 16px" }}>
      {/* Section title */}
      <p style={{ fontSize: titleSize, fontWeight: titleWeight, color: titleColor, fontFamily: titleFont, marginBottom: "10px", letterSpacing: "0.06em", textAlign: "center" }}>
        {(v.infoTitle as string) || "— 정보 / 위치 —"}
      </p>
      {/* Map — full-width */}
      <div style={{ marginLeft: "-14px", marginRight: "-14px", marginBottom: "8px" }}>
        {mapBlock("230px")}
      </div>
      {infoBoxes}
    </div>
  )
}
// ── Gallery types + helpers ───────────────────────────────────────────────────
type GalleryImage = { id: string; url: string; label?: string }

function parseGalleryImages(raw: FieldValue): GalleryImage[] {
  try {
    const arr = JSON.parse((raw as string) || "[]")
    if (Array.isArray(arr)) return arr.filter((x: unknown) => x && typeof x === "object")
  } catch {}
  return []
}

function PreviewGallery({ v, device = "mobile" }: { v: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const images  = parseGalleryImages(v.galleryImages)
  const title   = (v.title as string) || "병원 둘러보기"
  const isDark  = ((v.galleryBg as string) || "dark") === "dark"
  const isDesktop = device === "desktop"

  const bg      = isDark ? "#0e0c09" : "#f5f5f5"
  const tc      = isDark ? "rgba(255,255,255,0.80)" : "#111"
  const gold    = "#c9a85c"

  // Title font settings
  const titleSizeKey = (v.titleSize as string) || "sm"
  const titleWeight  = (v.titleWeight as string) || "700"
  const titleFont    = getFontCss((v.titleFont as string) || "sans")
  const titleColor   = (v.titleColor as string) || (isDark ? gold : tc)
  const titlePx      = getSizePx("eyebrow", titleSizeKey) * (isDesktop ? 1.7 : 1)

  const safeIdx = images.length > 0 ? Math.min(activeIdx, images.length - 1) : 0
  const prev = () => setActiveIdx(i => (i - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1))
  const next = () => setActiveIdx(i => (i + 1) % Math.max(images.length, 1))

  // ── Mobile thumbnail strip: Pointer Events drag-to-scroll ─────────────
  const mobileStripRef = useRef<HTMLDivElement>(null)
  const mobileDrag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false })
  const onMobilePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = mobileStripRef.current; if (!el) return
    e.currentTarget.setPointerCapture(e.pointerId)
    mobileDrag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false }
    el.style.cursor = "grabbing"
  }
  const onMobilePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = mobileDrag.current; if (!d.active) return
    const el = mobileStripRef.current; if (!el) return
    const dx = e.clientX - d.startX
    if (Math.abs(dx) > 3) d.moved = true
    el.scrollLeft = d.scrollLeft - dx
  }
  const onMobilePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    mobileDrag.current.active = false
    e.currentTarget.style.cursor = "grab"
  }

  // ── PC overlay thumbnails: continuous inertia scroll ────────────────────
  // Virtual dimensions (900 px canvas, 30% container = 270 vp wide, 3 visible)
  const PC_THUMB_W   = 88   // vp per thumbnail
  const PC_GAP       = 3    // vp gap
  const PC_STEP      = 91   // PC_THUMB_W + PC_GAP
  const PC_CONTAINER = 270  // 30 % × 900 vp

  const pcThumbRef   = useRef<HTMLDivElement>(null)
  const pcInnerRef   = useRef<HTMLDivElement>(null)
  const pcWasDrag    = useRef(false)
  const pcScrollX    = useRef(0)      // current virtual-px scroll offset
  const pcIsDragging = useRef(false)
  const pcImagesLen  = useRef(images.length)
  pcImagesLen.current = images.length  // keep in sync every render

  // When safeIdx changes via arrow/click (not drag) → smoothly scroll to thumbnail
  useEffect(() => {
    if (pcIsDragging.current) return
    const inner = pcInnerRef.current
    if (!inner) return
    const n = pcImagesLen.current
    if (n <= 3) { pcScrollX.current = 0; inner.style.transform = "translateX(0)"; return }
    const maxScroll = (n - 3) * PC_STEP
    const target = Math.min(safeIdx * PC_STEP, maxScroll)
    inner.style.transition = "transform 0.25s ease"
    inner.style.transform  = `translateX(${-target}px)`
    pcScrollX.current = target
    const t = setTimeout(() => { if (inner) inner.style.transition = "" }, 260)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx])

  // Native drag + momentum/inertia (bypasses React synthetic events)
  useEffect(() => {
    const container = pcThumbRef.current
    const inner     = pcInnerRef.current
    if (!container || !inner) return

    let velocity  = 0   // virtual px / ms
    let rafHandle = 0

    const cancelAnim = () => { if (rafHandle) { cancelAnimationFrame(rafHandle); rafHandle = 0 } }

    // real-to-virtual scale: container rendered width / virtual width
    const getScale     = () => { const w = container.getBoundingClientRect().width; return w > 0 ? w / PC_CONTAINER : 1 }
    const getMaxScroll = () => Math.max(0, (pcImagesLen.current - 3) * PC_STEP)

    function applyPos(x: number) {
      const clamped = Math.max(0, Math.min(getMaxScroll(), x))
      pcScrollX.current = clamped
      inner!.style.transform = `translateX(${-clamped}px)`
      return clamped
    }

    // Inertia loop with time-normalised friction (90 % per 16 ms)
    let lastTs = 0
    function runInertia(ts: number) {
      if (!lastTs) lastTs = ts
      const dt      = Math.min(ts - lastTs, 50)
      lastTs        = ts
      velocity     *= Math.pow(0.90, dt / 16)
      const newPos  = applyPos(pcScrollX.current + velocity * dt)
      const maxS    = getMaxScroll()

      if (Math.abs(velocity) < 0.05 || newPos <= 0 || newPos >= maxS) {
        // Snap to nearest thumbnail
        const snapped = Math.min(Math.round(pcScrollX.current / PC_STEP), pcImagesLen.current - 1)
        inner!.style.transition = "transform 0.18s ease"
        inner!.style.transform  = `translateX(${-(snapped * PC_STEP)}px)`
        pcScrollX.current      = snapped * PC_STEP
        setTimeout(() => { if (inner) inner.style.transition = "" }, 200)
        setActiveIdx(Math.min(snapped, pcImagesLen.current - 1))
        velocity = 0; rafHandle = 0
        return
      }
      rafHandle = requestAnimationFrame(runInertia)
    }

    function handleDown(e: PointerEvent) {
      // NOTE: no setPointerCapture (redirects click to container, breaking button onClick)
      //       no e.preventDefault() (suppresses click in some browsers)
      //       → use window listeners instead for reliable global move/up tracking
      cancelAnim()
      inner!.style.transition = ""
      pcIsDragging.current   = true
      pcWasDrag.current      = false
      velocity               = 0
      container!.style.cursor = "grabbing"

      const startX      = e.clientX
      const startScroll = pcScrollX.current
      let lastX         = e.clientX
      let lastT         = e.timeStamp

      function handleMove(ev: PointerEvent) {
        const scale = getScale()
        const dt    = ev.timeStamp - lastT
        if (dt > 0) { velocity = -(ev.clientX - lastX) / (dt * scale); lastX = ev.clientX; lastT = ev.timeStamp }
        applyPos(startScroll + (startX - ev.clientX) / scale)
        if (Math.abs(ev.clientX - startX) > 5) pcWasDrag.current = true
      }
      function handleUp() {
        container!.style.cursor = "grab"
        window.removeEventListener("pointermove", handleMove)
        window.removeEventListener("pointerup",   handleUp)
        pcIsDragging.current = false
        lastTs = 0
        // Only run inertia when the user actually dragged — a plain click must not
        // trigger runInertia, which would call setActiveIdx(snapped) and override
        // the button's own onClick handler.
        if (pcWasDrag.current) rafHandle = requestAnimationFrame(runInertia)
        setTimeout(() => { pcWasDrag.current = false }, 0)
      }
      window.addEventListener("pointermove", handleMove)
      window.addEventListener("pointerup",   handleUp)
    }

    container.addEventListener("pointerdown", handleDown, { passive: false })
    return () => { container.removeEventListener("pointerdown", handleDown); cancelAnim() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mainRatio = isDesktop ? "16/9" : "4/3"
  const thumbW   = isDesktop ? "20%" : "25%"

  const arrowStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    [side]: isDesktop ? 12 : 6,
    width: isDesktop ? 36 : 22, height: isDesktop ? 36 : 22,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", zIndex: 4, color: "#fff",
    fontSize: isDesktop ? 18 : 12, fontWeight: 300, lineHeight: 1,
    userSelect: "none",
  })

  const emptySlot = (
    <div style={{ width: "100%", aspectRatio: mainRatio, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
      <Building2 style={{ width: isDesktop ? 32 : 18, height: isDesktop ? 32 : 18, color: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)" }} />
      <span style={{ fontSize: isDesktop ? 11 : 7, color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)" }}>이미지를 추가해주세요</span>
    </div>
  )

  return (
    <div style={{ background: bg, padding: isDesktop ? "32px 0 36px" : "18px 0 22px" }}>
      {/* Section title */}
      <p style={{ fontSize: titlePx, fontWeight: Number(titleWeight), fontFamily: titleFont, color: titleColor, letterSpacing: "0.10em", textTransform: "uppercase", textAlign: "center", marginBottom: isDesktop ? 16 : 10 }}>
        {title}
      </p>

      {/* Main image */}
      <div style={{ position: "relative", width: "100%", aspectRatio: mainRatio, overflow: "hidden" }}>
        {images.length > 0 && images[safeIdx].url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[safeIdx].url} alt={images[safeIdx].label || ""}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : emptySlot}

        {/* Prev arrow */}
        {images.length > 1 && (
          <button type="button" onClick={prev} style={arrowStyle("left")}>‹</button>
        )}
        {/* Next arrow */}
        {images.length > 1 && (
          <button type="button" onClick={next} style={arrowStyle("right")}>›</button>
        )}

        {/* PC: Image counter — top-left */}
        {images.length > 1 && !isDesktop && (
          <div style={{ position: "absolute", bottom: 5, right: 7, background: "rgba(0,0,0,0.45)", borderRadius: 20, padding: "1px 5px", fontSize: 6, color: "#fff", backdropFilter: "blur(4px)" }}>
            {safeIdx + 1} / {images.length}
          </div>
        )}

        {/* PC: thumbnail strip overlay — inertia scroll, grab cursor, 3 visible at a time */}
        {isDesktop && images.length > 1 && (
          <div
            ref={pcThumbRef}
            style={{
              position: "absolute",
              bottom: "14%",
              right: 10,
              width: "30%",
              overflow: "hidden",
              zIndex: 5,
              cursor: "grab",
              userSelect: "none",
              touchAction: "none",
            }}
          >
            {/* Inner row — all thumbnails; translateX driven by inertia engine */}
            <div
              ref={pcInnerRef}
              style={{ display: "flex", gap: PC_GAP, willChange: "transform" }}
            >
              {images.map((thumb, imgIdx) => {
                const isActive = imgIdx === safeIdx
                return (
                  <button
                    key={thumb.id || imgIdx}
                    type="button"
                    onClick={(e) => {
                      if (pcWasDrag.current) { e.preventDefault(); return }
                      setActiveIdx(imgIdx)
                    }}
                    style={{
                      flexShrink: 0,
                      width: PC_THUMB_W,
                      aspectRatio: "4/3",
                      overflow: "hidden",
                      cursor: "inherit",
                      padding: 0,
                      border: isActive ? `2px solid ${gold}` : "1.5px solid rgba(255,255,255,0.30)",
                      opacity: isActive ? 1 : 0.65,
                      transition: "opacity 0.2s, border-color 0.2s",
                      borderRadius: 3,
                      background: "#111",
                      pointerEvents: "auto",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {thumb.url
                      ? <img src={thumb.url} alt={thumb.label || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
                      : <div style={{ width: "100%", height: "100%", background: "#222" }} />
                    }
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile: thumbnail strip below main image — mouse-grab + touch scroll */}
      {!isDesktop && images.length > 1 && (
        <div
          ref={mobileStripRef}
          onPointerDown={onMobilePointerDown}
          onPointerMove={onMobilePointerMove}
          onPointerUp={onMobilePointerUp}
          onPointerCancel={onMobilePointerUp}
          style={{
            display: "flex", gap: 2, padding: "3px 0 0",
            overflowX: "auto", scrollbarWidth: "none",
            cursor: "grab", userSelect: "none",
            touchAction: "none",
          }}
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={(e) => {
                if (mobileDrag.current.moved) { e.preventDefault(); return }
                setActiveIdx(i)
              }}
              style={{
                flexShrink: 0, width: thumbW, aspectRatio: "4/3",
                overflow: "hidden", cursor: "inherit", padding: 0, border: "none",
                outline: i === safeIdx ? `1.5px solid ${gold}` : "none",
                outlineOffset: "-1.5px",
                opacity: i === safeIdx ? 1 : 0.55,
                transition: "opacity 0.2s, outline 0.2s",
                borderRadius: 2,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {img.url
                ? <img src={img.url} alt={img.label || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
                : <div style={{ width: "100%", height: "100%", background: "#333" }} />
              }
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
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

function PreviewFooter({ v, device = "mobile" }: { v: Record<string, FieldValue>; device?: "mobile" | "desktop" }) {
  const isDesktop = device === "desktop"

  // ── 사업자 정보
  const hospitalName   = (v.footerHospitalName   as string) ?? ""
  const corporateName  = (v.footerCorporateName  as string) ?? ""
  const businessNumber = (v.footerBusinessNumber as string) ?? ""
  const ceoName        = (v.footerCEOName        as string) ?? ""
  const licenseNumber  = (v.footerLicenseNumber  as string) ?? ""
  const phone          = (v.footerPhone          as string) ?? ""
  const address        = (v.footerAddress        as string) ?? ""

  // ── 정책 링크 (toggle on만 렌더)
  const policies = [
    { enabled: (v.footerTermsToggle        as boolean) ?? false, url: (v.footerTermsUrl        as string) ?? "", label: "이용약관" },
    { enabled: (v.footerPrivacyToggle      as boolean) ?? true,  url: (v.footerPrivacyUrl      as string) ?? "", label: "개인정보처리방침" },
    { enabled: (v.footerEmailRefuseToggle  as boolean) ?? false, url: (v.footerEmailRefuseUrl  as string) ?? "", label: "이메일수집거부" },
    { enabled: (v.footerNonCoveredToggle   as boolean) ?? false, url: (v.footerNonCoveredUrl   as string) ?? "", label: "비급여진료비용안내" },
  ]

  // ── 소셜 미디어 (toggle on만 렌더)
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

  // ── 카피라이트 (custom/auto 분기)
  const currentYear = new Date().getFullYear()
  const copyrightMode = (v.footerCopyrightMode as string) ?? "auto"
  const copyrightText = (v.footerCopyrightText as string) ?? ""
  const copyright = copyrightMode === "custom" && copyrightText
    ? copyrightText
    : "© " + currentYear + " " + (hospitalName || "TATOA") + ". All rights reserved."

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
    <div style={{
      backgroundColor: bgColor,
      padding: isDesktop ? "60px 15%" : "40px 24px",
      color: linkColor,
    }}>
      {/* 1. 정책 링크 가로 나열 */}
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
            marginLeft: !isDesktop ? "auto" : undefined,
            marginRight: !isDesktop ? "auto" : undefined,
          }} />
      ) : (
        hospitalName && (
          <div style={{
            fontSize: isDesktop ? 24 : 20, fontWeight: 600,
            marginBottom: 16,
            textAlign: isDesktop ? "left" : "center",
          }}>
            {hospitalName}
          </div>
        )
      )}

      {/* 5. 사업자 정보 */}
      <div style={{
        fontSize: 13, color: mutedColor, lineHeight: 1.7,
        textAlign: isDesktop ? "left" : "center",
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
        textAlign: isDesktop ? "left" : "center",
      }}>
        {copyright}
      </div>
    </div>
  )
}

function SectionPreviewBlock({
  sectionId, values, branchName, branchId, isFullscreen, device = "mobile", isPageView = false, pageHeroHeight, onIconDrag,
}: {
  sectionId: HomeSectionId
  values: Record<string, FieldValue>
  branchName: string
  branchId: string
  isFullscreen: boolean
  device?: "mobile" | "desktop"
  isPageView?: boolean
  pageHeroHeight?: string | number
  onIconDrag?: (idx: number, posX: number, posY: number) => void
}) {
  // ─── 共有コンポーネントに委譲 (admin 専用 drag overlay のみここで追加) ───
  const containerRef = useRef<HTMLDivElement>(null)
  const iconCfgs = parseIconConfigs(values.iconConfigs ?? values.iconConfig)
  if (iconCfgs.length === 0) {
    return (
      <SectionPreviewBlockShared
        sectionId={sectionId} values={values} branchName={branchName}
        branchId={branchId} isFullscreen={isFullscreen} device={device} isPageView={isPageView} pageHeroHeight={pageHeroHeight}
      />
    )
  }
  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <SectionPreviewBlockShared
        sectionId={sectionId} values={values} branchName={branchName}
        branchId={branchId} isFullscreen={isFullscreen} device={device} isPageView={isPageView} pageHeroHeight={pageHeroHeight}
      />
      {iconCfgs.map((cfg, idx) => (
        <DraggableIconInPreview
          key={idx}
          config={cfg}
          containerRef={containerRef}
          onDrag={(x, y) => onIconDrag?.(idx, x, y)}
        />
      ))}
    </div>
  )
}

// ─── Preview Panel ────────────────────────────────────────────────────────────

function PreviewPanel({
  activeSectionId, sections, homeData, activeSectionData, branchName, branchId, branch, onNavigate, onIconDrag,
  device, onDeviceChange,
  viewport, onViewportChange, zoom, onZoomChange,
}: {
  activeSectionId: HomeSectionId
  sections: HomeSection[]
  homeData: Record<string, Record<string, FieldValue>>
  activeSectionData: Record<string, FieldValue>
  branchName: string
  branchId: string
  branch: Branch
  onNavigate?: (page: PageId) => void
  onIconDrag?: (idx: number, posX: number, posY: number) => void
  device: "mobile" | "desktop"
  onDeviceChange: (d: "mobile" | "desktop") => void
  viewport: ViewportPreset
  onViewportChange: (v: ViewportPreset) => void
  zoom: number
  onZoomChange: (z: number) => void
}) {
  const viewMode = "page" as const
  const [navVisible, setNavVisible] = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null)
  const setScrollRef = useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = node
    setScrollEl(node)
  }, [])

  // ── Virtual viewport scale calculation ──
  const [panelWidth, setPanelWidth] = useState(0)
  const scaledInnerRef = useRef<HTMLDivElement>(null)
  const [scaledHeight, setScaledHeight] = useState(0)

  const viewportWidth  = VIEWPORT_WIDTHS[viewport]
  const viewportHeight = VIEWPORT_HEIGHTS[viewport]
  const isHeroActive   = activeSectionId === "hero"
  const isFullscreen   = (viewMode as string) === "section" && isHeroActive
  const isPageView     = viewMode === "page"
  // Scroll container max-height: viewport-aware, capped by available panel height
  const maxAvailableHeight = viewport === "mobile" ? 589 : isFullscreen ? 800 : 440
  const widthScale   = panelWidth > 0 ? panelWidth / viewportWidth : 0.5
  const heightScale  = maxAvailableHeight / viewportHeight
  const autoFitScale = Math.min(widthScale, heightScale)
  const effectiveScale = zoom > 0 ? zoom : autoFitScale
  const isAutoFit = zoom === 0
  const enabledSections = sections.filter((s) => s.isEnabled).sort((a, b) => a.sortOrder - b.sortOrder)
  const currentSection  = sections.find((s) => s.id === activeSectionId)!
  const scaledViewportHeight = viewportHeight * effectiveScale
  const scrollMaxHeight = Math.min(scaledViewportHeight, maxAvailableHeight)

  // Minimal SiteSnapshot for SiteNav rendering inside virtual viewport (page mode only)
  const siteNavSnapshot = useMemo<SiteSnapshot>(() => ({
    snapshotType: "draft",
    branchId,
    generatedAt: "",
    branch: {
      id: branch.id,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      businessHours: branch.businessHours,
      parkingInfo: branch.parkingInfo,
      bookingLink: branch.bookingLink,
      shortIntro: branch.shortIntro,
      longIntro: branch.longIntro,
      heroImage: branch.heroImage,
      kakaoLink: branch.kakaoLink,
      naverMapUrl: branch.naverMapUrl,
      transportGuide: branch.transportGuide,
      landmarkGuide: branch.landmarkGuide,
    },
    homepage: {
      sections: sections.map(s => ({ id: s.id, label: s.label, isEnabled: s.isEnabled, status: s.status })),
      sectionValues: homeData,
      sectionImages: {},
      popupData: { enabled: false, items: [] },
      bookingValues: {},
      cartValues: {},
      treatmentsPageValues: {},
      recruitValues: {},
    },
    doctors: [],
    equipment: [],
    treatments: [],
    events: [],
  }), [branch, branchId, sections, homeData])

  // Nav appears after scrolling 60% of hero height
  const handleScroll = useCallback(() => {
    if (scrollRef.current && isPageView) {
      setNavVisible(scrollRef.current.scrollTop > viewportHeight * (2 / 3))
    }
  }, [isPageView, viewportHeight])

  // Reset on mode/device change
  useEffect(() => {
    setNavVisible(false)
    setMenuOpen(false)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [device])

  // Measure panel (canvas) width for autoFit scale
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setPanelWidth(w)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Measure scaled inner content height (post-transform bounding box)
  useLayoutEffect(() => {
    const el = scaledInnerRef.current
    if (!el) return
    const update = () => {
      const h = el.getBoundingClientRect().height
      if (h > 0) setScaledHeight(h)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [effectiveScale, viewport, activeSectionId])

  return (
    <div
      className="sticky top-20 space-y-3 self-start w-full overflow-y-auto"
      style={{ maxHeight: "calc(100vh - 5rem)" }}
    >
      {/* Top row: title */}
      <p className="text-xs font-semibold text-foreground">미리보기</p>

      {/* Viewport + Zoom Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {VIEWPORT_PRESETS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onViewportChange(id)}
              title={id + " · " + label + "px"}
              className={cn(
                "flex items-center gap-1 px-1.5 py-1 text-[10px] font-medium transition-colors",
                viewport === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-3 w-3" />
              <span className="tabular-nums">{label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onZoomChange(0)}
            className={cn(
              "px-1.5 py-1 text-[10px] font-medium rounded border border-border transition-colors",
              isAutoFit ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
            title="Auto fit"
          >Auto</button>
          <button
            onClick={() => onZoomChange(Math.max(0.3, (zoom > 0 ? zoom : autoFitScale) - 0.1))}
            className="p-1 rounded border border-border text-muted-foreground hover:bg-muted"
            title="줌 축소"
          ><Minus className="h-3 w-3" /></button>
          <span className="text-[10px] tabular-nums w-9 text-center text-muted-foreground">
            {Math.round(effectiveScale * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.0, (zoom > 0 ? zoom : autoFitScale) + 0.1))}
            className="p-1 rounded border border-border text-muted-foreground hover:bg-muted"
            title="줌 확대"
          ><Plus className="h-3 w-3" /></button>
        </div>
      </div>

      {/* Section indicator pill */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
          <currentSection.icon className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-medium text-primary">{currentSection.label}</span>
        </div>
        {isPageView && (
          <span className="text-[10px] text-muted-foreground">외 {enabledSections.length - 1}개 섹션</span>
        )}
      </div>

      {/* ── Unified Virtual Viewport Canvas ── */}
      <div className="rounded-xl border-2 border-foreground/20 bg-neutral-900 shadow-lg overflow-hidden w-full">
        {/* Browser chrome — hidden on mobile viewport */}
        {viewport !== "mobile" && (
          <div className="flex items-center gap-2 border-b border-neutral-700 bg-neutral-800 px-3 py-2">
            <div className="flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500/70" />
              <div className="h-2 w-2 rounded-full bg-yellow-500/70" />
              <div className="h-2 w-2 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 rounded bg-neutral-700 border border-neutral-600 px-2 py-1">
              <span className="text-[9px] text-neutral-400">tatoa.kr/{branchName.toLowerCase().replace(/\s/g, "")}</span>
            </div>
            <span className="text-[9px] text-neutral-500 tabular-nums shrink-0">
              {viewport} · {viewportWidth}px
            </span>
          </div>
        )}
        {/* Canvas: scrollable + flex-center, ref doubles as scroll source + width measurement */}
        <div
          ref={setScrollRef}
          onScroll={handleScroll}
          className="bg-neutral-100 dark:bg-neutral-950 w-full"
          style={{
            maxHeight: scrollMaxHeight + "px",
            overflow: "auto",
            display: "flex",
            justifyContent: "center",
            scrollbarWidth: "none",
          }}
        >
          {/* Middle wrapper — takes scaled dimensions so flex-center positions the visible visual */}
          <div style={{
            width: (viewportWidth * effectiveScale) + "px",
            minWidth: (viewportWidth * effectiveScale) + "px",
            flexShrink: 0,
            height: scaledHeight > 0 ? (scaledHeight + "px") : "auto",
            minHeight: scrollMaxHeight + "px",
            position: "relative",
          }}>
            {/* Inner scaled box (transformOrigin: top-left → visual fills middle wrapper exactly) */}
            <div
              ref={scaledInnerRef}
              style={{
                width: viewportWidth + "px",
                minHeight: viewportHeight + "px",
                transform: "scale(" + effectiveScale.toFixed(4) + ")",
                transformOrigin: "top left",
                background: "white",
                borderRadius: viewport === "mobile" ? "16px" : viewport === "tablet" ? "8px" : "0",
                boxShadow: (viewport === "mobile" || viewport === "tablet")
                  ? "0 0 0 1px rgba(0,0,0,0.06), 0 10px 30px rgba(0,0,0,0.10)"
                  : "none",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Page-mode WYSIWYG nav (matches /preview/site rendering) */}
              {isPageView && (
                <SiteNav
                  snapshot={siteNavSnapshot}
                  branchSlug={branch.id}
                  isPreview={true}
                  device={viewport === "mobile" ? "mobile" : "desktop"}
                  scrollContainer={scrollEl}
                  mobileScrollReveal={true}
                />
              )}
              {isPageView ? (
                enabledSections.map((s) => (
                  <div key={s.id} className={cn(
                    "transition-all",
                    s.id === activeSectionId && "ring-2 ring-primary ring-inset"
                  )}>
                    <SectionPreviewBlock
                      sectionId={s.id}
                      values={(homeData[s.id] ?? {}) as Record<string, FieldValue>}
                      branchName={branchName}
                      branchId={branchId}
                      isFullscreen={false}
                      device={viewport === "mobile" ? "mobile" : "desktop"}
                      isPageView
                      pageHeroHeight={viewportHeight + "px"}
                    />
                  </div>
                ))
              ) : (
                <div className={cn("flex flex-col", isFullscreen && "h-full")}>
                  <SectionPreviewBlock
                    sectionId={activeSectionId}
                    values={activeSectionData}
                    branchName={branchName}
                    branchId={branchId}
                    isFullscreen={isFullscreen}
                    device={viewport === "mobile" ? "mobile" : "desktop"}
                    isPageView={false}
                    onIconDrag={onIconDrag}
                  />
                </div>
              )}

              {/* Mobile-only: scroll-triggered nav + menu drawer */}
              {viewport === "mobile" && (
                <>
                  <div
                    className="absolute top-0 left-0 right-0 z-50 transition-all duration-300"
                    style={{
                      opacity: isPageView ? (navVisible ? 1 : 0) : 0,
                      transform: isPageView && navVisible ? "translateY(0)" : "translateY(-100%)",
                      pointerEvents: navVisible ? "auto" : "none",
                    }}
                  >
                    <PhoneNavBar onMenuToggle={() => setMenuOpen(true)} />
                  </div>
                  {menuOpen && (
                    <PhoneMenuDrawer onClose={() => setMenuOpen(false)} onNavigate={onNavigate} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
        <p className="text-[10px] text-muted-foreground">왼쪽에서 편집하면 여기에 바로 반영됩니다</p>
      </div>
    </div>
  )
}

// ── EventCardEditor: module-level ────────────────────────────────────────────

function EventCardEditor({
  card, index, isDark, onPatch, onDelete, onUploadClick,
}: {
  card: EventCard
  index: number
  isDark: boolean
  onPatch: (c: EventCard) => void
  onDelete: () => void
  onUploadClick: () => void
}) {
  const [open,   setOpen]   = useState(false)
  const [imgTab, setImgTab] = useState<"basic" | "color" | "overlay" | "advanced">("basic")
  const patch = (partial: Partial<EventCard>) => onPatch({ ...card, ...partial })
  const ovlHex = (card.imgOverlay || "#000000").startsWith("#") ? (card.imgOverlay || "#000000") : "#000000"
  const previewFilter = buildCardFilter(card)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Collapsed header */}
      <div className="flex items-center gap-2.5 p-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-none border border-border bg-muted relative">
          {card.imgUrl ? (
            <img src={card.imgUrl} alt="" className="w-full h-full object-cover"
              style={{ filter: previewFilter || undefined }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute top-0.5 left-0.5 bg-primary/80 text-primary-foreground text-[7px] font-bold rounded px-0.5 leading-tight">
            {index + 1}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{card.title || `이벤트 ${index + 1}`}</p>
          <p className="text-[10px] text-muted-foreground truncate">{card.subtitle || "부제목 미입력"}</p>
        </div>
        <button type="button" onClick={() => setOpen(!open)}
          className="rounded-lg px-2.5 py-1 text-[10px] text-primary border border-primary/30 hover:bg-primary/5 transition-colors flex-none">
          {open ? "접기" : "편집"}
        </button>
        <button type="button" onClick={onDelete}
          className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-none">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="border-t border-border p-3 space-y-4 bg-muted/10">
          {/* Text fields */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">카드 텍스트</p>
            <Input value={card.title} onChange={e => patch({ title: e.target.value })}
              placeholder="이벤트 제목  예: 엘라비에 리투오 특가" className="rounded-lg h-7 text-xs" />
            <Input value={card.subtitle} onChange={e => patch({ subtitle: e.target.value })}
              placeholder="부제목  예: 사람 콜라겐을 직접 주입" className="rounded-lg h-7 text-xs" />
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">클릭 이동 URL (랜딩페이지)</p>
            <Input value={card.url} onChange={e => patch({ url: e.target.value })}
              placeholder="https://tatoa.com/event/rituo" className="rounded-lg h-7 text-[10px] font-mono" />
          </div>

          {/* Image section */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">이미지 편집</p>
            <div className="flex gap-2">
              {card.imgUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-border flex-none">
                  <img src={card.imgUrl} alt="" className="w-full h-full object-cover"
                    style={{ filter: previewFilter || undefined }} />
                </div>
              )}
              <div className="flex-1 flex flex-col gap-1.5 justify-center">
                <button type="button" onClick={onUploadClick}
                  className="w-full rounded-lg border border-dashed border-border bg-muted/30 py-2 text-[10px] text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  📁 이미지 선택
                </button>
                {card.imgUrl && (
                  <button type="button" onClick={() => patch({ imgUrl: "" })}
                    className="w-full rounded-lg border border-border py-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors">
                    ✕ 이미지 제거
                  </button>
                )}
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex rounded-lg border border-border overflow-hidden text-[9px] font-medium">
              {(["basic", "color", "overlay", "advanced"] as const).map(tab => (
                <button key={tab} type="button" onClick={() => setImgTab(tab)}
                  className={cn("flex-1 py-1.5 transition-colors",
                    imgTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                  {tab === "basic" ? "위치·효과" : tab === "color" ? "색감보정" : tab === "overlay" ? "오버레이" : "고급"}
                </button>
              ))}
            </div>

            {imgTab === "basic" && (
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] text-muted-foreground mb-1.5">사진 위치</p>
                  <div className="grid grid-cols-3 gap-1 w-24">
                    {IMG_POSITIONS.map(pos => (
                      <button key={pos.v} type="button" onClick={() => patch({ imgPosition: pos.v })}
                        className={cn("h-6 rounded text-sm border transition-all",
                          (card.imgPosition || "center") === pos.v
                            ? "border-primary bg-primary/10 font-bold text-primary"
                            : "border-border bg-muted/40 text-muted-foreground hover:border-muted-foreground/40"
                        )}>
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground mb-1.5">이미지 효과 프리셋</p>
                  <div className="flex flex-wrap gap-1">
                    {IMG_EFFECTS.map(fx => (
                      <button key={fx.id} type="button" onClick={() => patch({ imgEffectId: fx.id })}
                        className={cn("px-2 py-0.5 rounded-full border text-[9px] transition-all",
                          (card.imgEffectId || "none") === fx.id
                            ? "border-primary bg-primary/10 font-semibold text-primary"
                            : "border-border bg-background hover:border-muted-foreground/40"
                        )}>
                        {fx.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {imgTab === "color" && (
              <div className="space-y-3">
                {([
                  { k: "imgBrightness" as const, label: "밝기", min: 0, max: 200, def: 100, unit: "%" },
                  { k: "imgContrast"   as const, label: "대비", min: 0, max: 200, def: 100, unit: "%" },
                  { k: "imgSaturate"   as const, label: "채도", min: 0, max: 200, def: 100, unit: "%" },
                  { k: "imgHue"        as const, label: "색조", min: 0, max: 360, def: 0,   unit: "°" },
                ]).map(({ k, label, min, max, def, unit }) => (
                  <div key={k} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] text-muted-foreground">{label}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-muted-foreground">{card[k] ?? def}{unit}</span>
                        {(card[k] ?? def) !== def && (
                          <button type="button" onClick={() => patch({ [k]: def })}
                            className="text-[8px] text-primary hover:underline">↩</button>
                        )}
                      </div>
                    </div>
                    <input type="range" min={min} max={max} step={1}
                      value={card[k] ?? def}
                      onChange={e => patch({ [k]: Number(e.target.value) })}
                      className="w-full accent-primary" />
                  </div>
                ))}
                <button type="button"
                  onClick={() => patch({ imgBrightness: 100, imgContrast: 100, imgSaturate: 100, imgHue: 0 })}
                  className="text-[9px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                  <RotateCcw className="h-2.5 w-2.5" />색감 보정 초기화
                </button>
              </div>
            )}

            {imgTab === "overlay" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[9px] text-muted-foreground">오버레이 색상</p>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md border border-border flex-none" style={{ background: card.imgOverlay || "#000000" }} />
                    <input type="color" value={ovlHex}
                      onChange={e => patch({ imgOverlay: e.target.value })}
                      className="h-6 w-6 rounded cursor-pointer border border-border" />
                    <span className="text-[9px] text-muted-foreground font-mono">{card.imgOverlay || "#000000"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <p className="text-[9px] text-muted-foreground">오버레이 농도</p>
                    <span className="text-[9px] text-muted-foreground">{card.imgOverlayOpacity ?? 25}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={1}
                    value={card.imgOverlayOpacity ?? 25}
                    onChange={e => patch({ imgOverlayOpacity: Number(e.target.value) })}
                    className="w-full accent-primary" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <p className="text-[9px] text-muted-foreground">하단 페이드 강도</p>
                    <span className="text-[9px] text-muted-foreground">{card.imgFade ?? 55}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={5}
                    value={card.imgFade ?? 55}
                    onChange={e => patch({ imgFade: Number(e.target.value) })}
                    className="w-full accent-primary" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] text-muted-foreground">블렌드 모드</p>
                  <div className="flex flex-wrap gap-1">
                    {(["normal","multiply","screen","overlay","soft-light","color","luminosity"] as const).map(bm => (
                      <button key={bm} type="button" onClick={() => patch({ imgBlend: bm })}
                        className={cn("px-2 py-0.5 rounded border text-[8px] transition-all",
                          (card.imgBlend || "normal") === bm
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border bg-muted/40 text-muted-foreground hover:border-muted-foreground/40"
                        )}>
                        {bm}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {imgTab === "advanced" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                  <p className="text-[9px] font-semibold text-foreground/70 uppercase tracking-wider">현재 최종 CSS filter</p>
                  <p className="text-[9px] font-mono text-muted-foreground break-all leading-relaxed">
                    {previewFilter || "(없음 — 원본)"}
                  </p>
                </div>
                <button type="button"
                  onClick={() => patch({
                    imgEffectId: "none", imgBrightness: 100, imgContrast: 100,
                    imgSaturate: 100, imgHue: 0,
                    imgOverlay: "#000000", imgOverlayOpacity: 25, imgFade: 55, imgBlend: "normal",
                  })}
                  className="rounded-lg border border-border px-3 py-2 text-[10px] text-muted-foreground hover:text-destructive hover:border-destructive transition-colors flex items-center gap-1.5 w-full justify-center">
                  <RotateCcw className="h-3 w-3" />이미지 설정 전체 초기화
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Events editor ────────────────────────────────────────────────────────────

function EventsEditor({ values, onChange }: { values: Record<string, FieldValue>; onChange: (k: string, v: FieldValue) => void }) {
  const isDark    = ((values.evBgColor as string) || "dark") === "dark"
  const cards     = parseEventCards(values.eventCards)
  const fileRef   = useRef<HTMLInputElement>(null)
  const [pendingIdx, setPendingIdx] = useState<number | null>(null)

  const save = (updated: EventCard[]) => onChange("eventCards", JSON.stringify(updated))

  const patchCard  = (i: number, updated: EventCard) => save(cards.map((c, idx) => idx === i ? updated : c))
  const deleteCard = (i: number) => save(cards.filter((_, idx) => idx !== i))
  const addCard    = () => save([...cards, {
    id: `ev${Date.now()}`, title: "", subtitle: "", url: "",
    imgUrl: "", imgPosition: "center", imgEffectId: "none",
    imgBrightness: 100, imgContrast: 100, imgSaturate: 100, imgHue: 0,
    imgOverlay: "#000000", imgOverlayOpacity: 25, imgFade: 55, imgBlend: "normal",
  }])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/") || pendingIdx === null) return
    patchCard(pendingIdx, { ...cards[pendingIdx], imgUrl: URL.createObjectURL(file) })
    e.target.value = ""
    setPendingIdx(null)
  }

  return (
    <div className="space-y-6">

      {/* ── 배경 ────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <InfoSubLabel title="배경" />
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="h-8 w-8 rounded-lg flex-none" style={{
            background: isDark
              ? "linear-gradient(135deg,rgba(201,168,92,0.3) 0%,#0e0c09 100%)"
              : "linear-gradient(135deg,rgba(180,180,180,0.2) 0%,#ffffff 100%)",
            border: "1px solid rgba(128,128,128,0.2)",
          }} />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">배경 테마</p>
            <p className="text-[10px] text-muted-foreground">
              {isDark ? "블랙 · 골드 앰비언트 글로우" : "화이트 · 그레이 앰비언트 글로우"}
            </p>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-medium">
            <button type="button" onClick={() => onChange("evBgColor", "dark")}
              className={cn("px-3 py-1.5 transition-colors",
                isDark ? "bg-neutral-900 text-white" : "text-muted-foreground hover:bg-muted")}>
              블랙
            </button>
            <button type="button" onClick={() => onChange("evBgColor", "light")}
              className={cn("px-3 py-1.5 border-l border-border transition-colors",
                !isDark ? "bg-white text-neutral-900" : "text-muted-foreground hover:bg-muted")}>
              화이트
            </button>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── 섹션 타이틀 ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <InfoSubLabel title="섹션 타이틀" />
        <Input
          placeholder="— Events —"
          value={(values.evSectionTitle as string) ?? ""}
          onChange={e => onChange("evSectionTitle", e.target.value)}
          className="rounded-xl"
        />
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <FontControls prefix="evSectionTitle" group="eyebrow" values={values} onChange={onChange} />
        </div>
      </div>

      <Separator />

      {/* ── 카드 텍스트 폰트 설정 (전체 적용) ──────────────────────────── */}
      <div className="space-y-4">
        <InfoSubLabel title="텍스트 스타일 (전체 카드 공통)" />
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-5">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">이벤트 제목</p>
            <FontControls prefix="evTitle" group="body" values={values} onChange={onChange} />
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">부제목</p>
            <FontControls prefix="evSub" group="eyebrow" values={values} onChange={onChange} />
          </div>
        </div>
      </div>

      <Separator />

      {/* ── 이벤트 카드 목록 ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <InfoSubLabel title="이벤트 카드" />
          <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {cards.length}개
          </span>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            카드를 옆으로 스와이프하는 슬라이더입니다. 카드 순서 = 목록 순서.
            각 카드를 클릭하면 지정한 URL로 이동합니다.
          </p>
        </div>

        <div className="space-y-2">
          {cards.map((card, i) => (
            <EventCardEditor
              key={card.id}
              card={card}
              index={i}
              isDark={isDark}
              onPatch={updated => patchCard(i, updated)}
              onDelete={() => deleteCard(i)}
              onUploadClick={() => { setPendingIdx(i); fileRef.current?.click() }}
            />
          ))}
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        <button type="button" onClick={addCard}
          className="w-full rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />이벤트 카드 추가
        </button>
      </div>

    </div>
  )
}

// ─── Other section editors (unchanged) ───────────────────────────────────────

function PhilosophyEditor({ values, onChange }: { values: Record<string, FieldValue>; onChange: (k: string, v: FieldValue) => void }) {
  const isDark  = ((values.bgTheme as string) || "dark") !== "light"
  const images  = parsePhiloImages(values.philoImages, (values.image as string) || "")
  const [selIdx, setSelIdx] = useState(0)
  const mobileRef = useRef<HTMLInputElement>(null)
  const pcRef     = useRef<HTMLInputElement>(null)

  const saveImages = (imgs: PhiloImage[]) => onChange("philoImages", JSON.stringify(imgs))
  const patch      = (i: number, u: Partial<PhiloImage>) => saveImages(images.map((img, idx) => idx === i ? { ...img, ...u } : img))
  const addImage   = () => { saveImages([...images, { id: `phi${Date.now()}`, mobile: "", pc: "", effectId: "none", brightness: 100, contrast: 100, saturate: 100, hue: 0, position: "center", gradDir: "to bottom", gradColor: "#000000", gradOpacity: 0, shadowPreset: "none", shadowColor: "#000000" }]); setSelIdx(images.length) }
  const removeImage = (i: number) => { saveImages(images.filter((_, idx) => idx !== i)); setSelIdx(Math.max(0, Math.min(selIdx, images.length - 2))) }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, field: "mobile" | "pc") {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    patch(selIdx, { [field]: URL.createObjectURL(file) })
    e.target.value = ""
  }

  const sel = images[selIdx]

  return (
    <div className="space-y-6">

      {/* ── 배경 테마 (Events-style row) ── */}
      <div className="space-y-3">
        <InfoSubLabel title="배경" />
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="h-8 w-8 rounded-lg flex-none" style={{
            background: isDark
              ? "linear-gradient(135deg,rgba(201,168,92,0.3) 0%,#0e0c09 100%)"
              : "linear-gradient(135deg,rgba(180,180,180,0.2) 0%,#ffffff 100%)",
            border: "1px solid rgba(128,128,128,0.2)",
          }} />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">배경 테마</p>
            <p className="text-[10px] text-muted-foreground">{isDark ? "블랙 · 골드 앰비언트 글로우" : "화이트 · 그레이 앰비언트 글로우"}</p>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-medium">
            <button type="button" onClick={() => onChange("bgTheme", "dark")}
              className={cn("px-3 py-1.5 transition-colors", isDark ? "bg-neutral-900 text-white" : "text-muted-foreground hover:bg-muted")}>
              블랙
            </button>
            <button type="button" onClick={() => onChange("bgTheme", "light")}
              className={cn("px-3 py-1.5 border-l border-border transition-colors", !isDark ? "bg-white text-neutral-900" : "text-muted-foreground hover:bg-muted")}>
              화이트
            </button>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Block 1: Eyebrow ── */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">1</span>
          <span className="text-sm font-medium text-foreground">영어 소제목 (Eyebrow)</span>
        </div>
        <Input placeholder="예: OUR PHILOSOPHY" value={(values.eyebrow as string) ?? ""} onChange={(e) => onChange("eyebrow", e.target.value)} className="rounded-xl tracking-widest uppercase" />
        <FontControls prefix="eyebrow" group="eyebrow" values={values} onChange={onChange} />
      </div>

      {/* ── Block 2: Headline ── */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">2</span>
          <span className="text-sm font-medium text-foreground">메인 카피</span>
        </div>
        <RichTextEditor
          mode="floating"
          placeholder={"예:\n아름다움은 교정이 아닙니다.\n그것은 본연의 가치를 드러내는 일입니다."}
          value={(values.headline as string) ?? ""}
          onChange={(html) => onChange("headline", html)}
          minHeight={90}
        />
        <p className="text-[10px] text-muted-foreground">Enter 키로 줄바꿈</p>
        <FontControls prefix="headline" group="headline" values={values} onChange={onChange} />
      </div>

      {/* ── Block 3: Body ── */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">3</span>
          <span className="text-sm font-medium text-foreground">상세 설명</span>
        </div>
        <RichTextEditor
          mode="floating"
          placeholder="타토아의 의료 철학, 환자를 대하는 방식, 추구하는 가치관을 자유롭게 서술해주세요."
          value={(values.body as string) ?? ""}
          onChange={(html) => onChange("body", html)}
          minHeight={110}
        />
        <FontControls prefix="body" group="subcopy" values={values} onChange={onChange} />
      </div>

      <Separator />

      {/* ── 섹션 이미지 ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <InfoSubLabel title="섹션 이미지" />
          <button type="button" onClick={addImage}
            className="flex items-center gap-1 rounded-xl border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Plus className="h-3 w-3" />이미지 추가
          </button>
        </div>

        {/* 이미지 목록 */}
        {images.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border py-8 text-center">
            <p className="text-xs text-muted-foreground">이미지가 없습니다.</p>
            <p className="text-[10px] text-muted-foreground mt-1">위 추가 버튼을 눌러 이미지를 등록하세요.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {images.map((img, idx) => (
              <div key={img.id} onClick={() => setSelIdx(idx)}
                className={cn("flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer transition-all",
                  selIdx === idx ? "border-primary bg-primary/5" : "border-border hover:bg-muted")}>
                <div className="h-11 w-8 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                  {img.mobile ? (
                    <img src={img.mobile} alt="" className="w-full h-full object-cover" style={{ filter: buildPhiloImgFilter(img) }} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-stone-200 to-stone-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">이미지 {idx + 1}{idx === 0 ? " (메인)" : idx === 1 ? " (하단 — PC 별도)" : ""}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{img.mobile || "이미지 미설정"}</p>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); removeImage(idx) }}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 rounded">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 선택된 이미지 편집 */}
        {sel && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <p className="text-xs font-semibold text-foreground">이미지 {selIdx + 1} 편집</p>

            {/* 모바일 URL / 파일 */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {images.length > 1 && selIdx > 0 ? "모바일 이미지" : "이미지"}
              </p>
              <div className="flex gap-1.5">
                <input type="text" value={sel.mobile.startsWith("blob:") ? "" : sel.mobile}
                  onChange={e => patch(selIdx, { mobile: e.target.value })}
                  placeholder="https:// URL 입력"
                  className="flex-1 rounded-xl border border-border px-3 py-2 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                <button type="button" onClick={() => mobileRef.current?.click()}
                  className="flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted transition-colors shrink-0">
                  <Upload className="h-3 w-3" />파일
                </button>
                <input ref={mobileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, "mobile")} />
              </div>
            </div>

            {/* PC URL (2번째 이미지부터) */}
            {images.length > 1 && selIdx > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">PC 이미지 <span className="normal-case font-normal">(없으면 모바일 이미지 사용)</span></p>
                <div className="flex gap-1.5">
                  <input type="text" value={sel.pc.startsWith("blob:") ? "" : sel.pc}
                    onChange={e => patch(selIdx, { pc: e.target.value })}
                    placeholder="https:// URL 입력 (선택)"
                    className="flex-1 rounded-xl border border-border px-3 py-2 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                  <button type="button" onClick={() => pcRef.current?.click()}
                    className="flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted transition-colors shrink-0">
                    <Upload className="h-3 w-3" />파일
                  </button>
                  <input ref={pcRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, "pc")} />
                </div>
              </div>
            )}

            {/* 미리보기 썸네일 */}
            {sel.mobile && (
              <div className="relative w-full h-28 rounded-xl overflow-hidden border border-border group">
                <img src={sel.mobile} alt="" className="w-full h-full object-cover"
                  style={{ filter: buildPhiloImgFilter(sel), objectPosition: sel.position }} />
                <button type="button" onClick={() => patch(selIdx, { mobile: "", pc: "" })}
                  className="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            )}

            {/* 이미지 효과 프리셋 */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">이미지 효과</p>
              <div className="flex flex-wrap gap-1">
                {IMG_EFFECTS.map(eff => (
                  <button key={eff.id} type="button" onClick={() => patch(selIdx, { effectId: eff.id })}
                    className={cn("rounded-lg px-2 py-1 text-[10px] border transition-all",
                      sel.effectId === eff.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                    {eff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 세부 조정 슬라이더 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">세부 조정</p>
                <button type="button" onClick={() => patch(selIdx, { brightness: 100, contrast: 100, saturate: 100, hue: 0, gradOpacity: 0, shadowPreset: "none" })}
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
                  <input type="range" min={min} max={max} value={sel[key]}
                    onChange={e => patch(selIdx, { [key]: Number(e.target.value) })}
                    className="flex-1 accent-primary h-1.5" />
                  <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{sel[key]}{unit}</span>
                </div>
              ))}
            </div>

            {/* 이미지 위치 */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">이미지 위치</p>
              <div className="grid grid-cols-3 gap-1 w-24">
                {IMG_POSITIONS.map(pos => (
                  <button key={pos.v} type="button" onClick={() => patch(selIdx, { position: pos.v })}
                    className={cn("h-7 rounded text-xs border transition-all",
                      sel.position === pos.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 그라데이션 오버레이 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">그라데이션</p>
                {sel.gradOpacity > 0 && (
                  <button type="button" onClick={() => patch(selIdx, { gradOpacity: 0 })}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <RotateCcw className="h-2.5 w-2.5" />끄기
                  </button>
                )}
              </div>
              {/* 방향 */}
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">방향</p>
                <div className="grid grid-cols-4 gap-1">
                  {([
                    { v: "to bottom",       label: "↓" },
                    { v: "to top",          label: "↑" },
                    { v: "to right",        label: "→" },
                    { v: "to left",         label: "←" },
                    { v: "to bottom right", label: "↘" },
                    { v: "to bottom left",  label: "↙" },
                    { v: "radial",          label: "⊙" },
                    { v: "radial-edge",     label: "◎" },
                  ] as const).map(d => (
                    <button key={d.v} type="button" onClick={() => patch(selIdx, { gradDir: d.v })}
                      className={cn("h-7 rounded text-sm border transition-all",
                        sel.gradDir === d.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* 색상 + 강도 */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-8 shrink-0">색상</span>
                <input type="color" value={sel.gradColor || "#000000"} onChange={e => patch(selIdx, { gradColor: e.target.value })}
                  className="w-8 h-7 rounded border border-border cursor-pointer p-0.5 shrink-0" />
                <div className="flex gap-1">
                  {["#000000","#ffffff","#c9a85c","#1a0e00","#0a1a2e"].map(c => (
                    <div key={c} onClick={() => patch(selIdx, { gradColor: c })}
                      className="w-5 h-5 rounded cursor-pointer border border-border/60 shrink-0"
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground w-8 shrink-0">강도</span>
                <input type="range" min={0} max={100} value={sel.gradOpacity}
                  onChange={e => patch(selIdx, { gradOpacity: Number(e.target.value) })}
                  className="flex-1 accent-primary h-1.5" />
                <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{sel.gradOpacity}%</span>
              </div>
              {/* 미리보기 바 */}
              {sel.gradOpacity > 0 && (
                <div className="w-full h-6 rounded-lg border border-border overflow-hidden"
                  style={{ background: sel.gradDir === "radial" || sel.gradDir === "radial-edge" ? undefined : `linear-gradient(to right, transparent, rgba(${hexToRgb(sel.gradColor || "#000000")},${sel.gradOpacity/100}))` }}>
                  {(sel.gradDir === "radial" || sel.gradDir === "radial-edge") && (
                    <div className="w-full h-full"
                      style={{ background: sel.gradDir === "radial"
                        ? `radial-gradient(ellipse at center, rgba(${hexToRgb(sel.gradColor || "#000000")},${sel.gradOpacity/100}) 0%, transparent 100%)`
                        : `radial-gradient(ellipse at center, transparent 30%, rgba(${hexToRgb(sel.gradColor || "#000000")},${sel.gradOpacity/100}) 100%)` }} />
                  )}
                </div>
              )}
            </div>

            {/* 이미지 섀도우 */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">그림자 (Shadow)</p>
              <div className="grid grid-cols-3 gap-1">
                {([
                  { v: "none", label: "없음" },
                  { v: "sm",   label: "약하게" },
                  { v: "md",   label: "중간" },
                  { v: "lg",   label: "강하게" },
                  { v: "xl",   label: "매우강" },
                  { v: "glow", label: "글로우" },
                ] as const).map(s => (
                  <button key={s.v} type="button" onClick={() => patch(selIdx, { shadowPreset: s.v })}
                    className={cn("h-7 rounded text-[11px] border transition-all",
                      sel.shadowPreset === s.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                    {s.label}
                  </button>
                ))}
              </div>
              {sel.shadowPreset !== "none" && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-8 shrink-0">색상</span>
                  <input type="color" value={sel.shadowColor || "#000000"} onChange={e => patch(selIdx, { shadowColor: e.target.value })}
                    className="w-8 h-7 rounded border border-border cursor-pointer p-0.5 shrink-0" />
                  <div className="flex gap-1">
                    {["#000000","#c9a85c","#ffffff","#2563eb","#dc2626"].map(c => (
                      <div key={c} onClick={() => patch(selIdx, { shadowColor: c })}
                        className="w-5 h-5 rounded cursor-pointer border border-border/60 shrink-0"
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              )}
              {/* 섀도우 미리보기 */}
              {sel.shadowPreset !== "none" && (
                <div className="flex justify-center py-2">
                  <div className="w-16 h-10 rounded-lg bg-muted"
                    style={{ boxShadow: buildPhiloShadow(sel) }} />
                </div>
              )}
            </div>
          </div>
        )}

        {images.length > 0 && (
          <div className="rounded-xl bg-muted/40 px-3 py-2.5 text-[10px] text-muted-foreground space-y-1">
            <p>· <strong>이미지 1</strong>: 모바일 하단 + PC 텍스트 우측 (40%)</p>
            <p>· <strong>이미지 2+</strong>: 모바일·PC 각각 하단에 추가 표시, PC는 별도 이미지 지정 가능</p>
          </div>
        )}
      </div>

    </div>
  )
}
const IMG_EFFECTS = [
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

const IMG_POSITIONS = [
  { v: "top left",    label: "↖" }, { v: "top center",    label: "↑" }, { v: "top right",    label: "↗" },
  { v: "center left", label: "←" }, { v: "center",        label: "⊙" }, { v: "center right", label: "→" },
  { v: "bottom left", label: "↙" }, { v: "bottom center", label: "↓" }, { v: "bottom right", label: "↘" },
] as const

function LinkedDataEditor({ type, values, onChange, branchId }: {
  type: "doctors" | "equipment"; values: Record<string, FieldValue>; onChange: (k: string, v: FieldValue) => void; branchId: string
}) {
  const label    = type === "doctors" ? "의료진" : "장비"
  const bgColor  = (values.bgColor   as string) || "dark"
  const isDark   = bgColor === "dark"
  const presets  = isDark ? BOX_PRESETS_DARK : BOX_PRESETS_LIGHT
  const cardPreset = (values.cardPreset as string) || "glass-gold"
  const [showFine, setShowFine] = useState(false)

  // Gradient state for fine controls
  const [gradFrom,  setGradFrom]  = useState("#1a1a2e")
  const [gradTo,    setGradTo]    = useState("#0e0c09")
  const [gradAngle, setGradAngle] = useState(135)
  const buildGrad = (f: string, t: string, a: number) => `linear-gradient(${a}deg,${f} 0%,${t} 100%)`

  const curBg  = values.cardBg     as string | undefined
  const curBd  = values.cardBorder as string | undefined
  const curSh  = values.cardShadow as string | undefined
  const curBlur  = values.cardBlur   as number | undefined
  const curRad   = values.cardRadius as number | undefined
  const isGradient = curBg?.startsWith("linear-gradient") ?? false
  const matchedShadow = SHADOW_PRESETS.find((s) => s.css === curSh)

  // ── Per-doctor image overrides ──
  const { getDoctorsByBranch } = useStaff()
  const rawDoctors = type === "doctors" ? getDoctorsByBranch(branchId).filter((d) => d.profile.isPublic) : []
  type DocImgOvr = { url?: string; position?: string; filter?: string; gradDir?: string; gradColor?: string; gradOpacity?: number }
  const imgOverrides = (() => { try { return JSON.parse((values.imgOverrides as string) || "{}") } catch { return {} } })() as Record<string, DocImgOvr>
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const imgFileRef = useRef<HTMLInputElement>(null)
  const [pendingDocId, setPendingDocId] = useState<string | null>(null)

  function updateImgOvr(docId: string, patch: Partial<DocImgOvr>) {
    const next = { ...imgOverrides, [docId]: { ...imgOverrides[docId], ...patch } }
    onChange("imgOverrides", JSON.stringify(next))
  }
  function resetImgOvr(docId: string) {
    const next = { ...imgOverrides }
    delete next[docId]
    onChange("imgOverrides", JSON.stringify(next))
  }
  function handleImgFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/") || !pendingDocId) return
    updateImgOvr(pendingDocId, { url: URL.createObjectURL(file) })
    e.target.value = ""
    setPendingDocId(null)
  }

  // When preset changes, clear overrides
  function applyPreset(id: string) {
    onChange("cardPreset",  id)
    onChange("cardBg",      "")
    onChange("cardBorder",  "")
    onChange("cardShadow",  "")
    onChange("cardBlur",    0)
    onChange("cardRadius",  12)
  }

  return (
    <div className="space-y-5">
      {/* Auto-link notice */}
      <div className="rounded-xl border border-border bg-success/5 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <p className="text-sm font-medium text-foreground">의료진/장비 메뉴 변경 시 실시간 반영됩니다</p>
        </div>
      </div>

      {/* 섹션 타이틀 — 이벤트 섹션과 동일한 편집 UI */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">섹션 타이틀</Label>
        <Input
          placeholder={type === "doctors" ? "예: — TATOA DOCTORS —" : "예: — OUR EQUIPMENT —"}
          value={(values.title as string) ?? ""}
          onChange={(e) => onChange("title", e.target.value)}
          className="rounded-xl"
        />
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <FontControls prefix="docSectionTitle" group="eyebrow" values={values} onChange={onChange} sizesOverride={DOCTOR_SIZE_OPTIONS} />
        </div>
        {type === "doctors" && (
          <>
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">의료진 카드 — 이름</Label>
              <FontControls prefix="docName" group="headline" values={values} onChange={onChange} sizesOverride={DOCTOR_SIZE_OPTIONS} />
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">의료진 카드 — 직함 / 전문분야 / 인용문</Label>
              <FontControls prefix="docMeta" group="eyebrow" values={values} onChange={onChange} sizesOverride={DOCTOR_SIZE_OPTIONS} />
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">의료진 카드 — 소개 / 경력 / 학회</Label>
              <FontControls prefix="docDetail" group="subcopy" values={values} onChange={onChange} sizesOverride={DOCTOR_SIZE_OPTIONS} />
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <Label className="text-xs font-medium text-muted-foreground">의료진 카드 — CTA 바</Label>
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground">버튼 텍스트</span>
                <Input
                  value={(values.docCtaText as string) ?? "상담 예약"}
                  onChange={(e) => onChange("docCtaText", e.target.value)}
                  placeholder="상담 예약"
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-muted-foreground w-10 shrink-0 pt-0.5">배경색</span>
                <ColorPicker
                  value={(values.docCtaBg as string) || ""}
                  onChange={(v) => onChange("docCtaBg", v)}
                />
              </div>
              <FontControls prefix="docCta" group="eyebrow" values={values} onChange={onChange} sizesOverride={DOCTOR_SIZE_OPTIONS} />
            </div>
          </>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">섹션 설명</Label>
        <RichTextEditor
          mode="floating"
          placeholder="섹션 상단에 표시될 짧은 설명 문구"
          value={(values.description as string) ?? ""}
          onChange={(html) => onChange("description", html)}
          minHeight={80}
        />
      </div>

      {/* ── 섹션 배경 테마 ── */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">섹션 배경 테마</Label>
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="h-8 w-8 rounded-lg flex-none" style={{
            background: isDark
              ? "linear-gradient(135deg,rgba(201,168,92,0.3) 0%,#0e0c09 100%)"
              : "linear-gradient(135deg,rgba(180,180,180,0.2) 0%,#ffffff 100%)",
            border: "1px solid rgba(128,128,128,0.2)",
          }} />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">배경 테마</p>
            <p className="text-[10px] text-muted-foreground">{isDark ? "블랙 · 골드 글로우" : "화이트 · 그레이 글로우"}</p>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-medium">
            <button type="button" onClick={() => onChange("bgColor", "dark")}
              className={cn("px-3 py-1.5 transition-colors", isDark ? "bg-neutral-900 text-white" : "text-muted-foreground hover:bg-muted")}>
              블랙
            </button>
            <button type="button" onClick={() => onChange("bgColor", "light")}
              className={cn("px-3 py-1.5 border-l border-border transition-colors", !isDark ? "bg-white text-neutral-900" : "text-muted-foreground hover:bg-muted")}>
              화이트
            </button>
          </div>
        </div>
      </div>

      {/* ── 박스 스타일 ── */}
      <div className="space-y-3 pb-3 border-b">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">박스 스타일</p>

        {/* Preset palette */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs text-muted-foreground">효과 목록 패널</Label>
            <button type="button" onClick={() => setShowFine(!showFine)}
              className="text-[10px] text-primary hover:underline">
              {showFine ? "▲ 세부 설정 접기" : "▼ 세부 설정 열기"}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {presets.map((ps) => {
              const sel = cardPreset === ps.id
              return (
                <button key={ps.id} type="button" onClick={() => applyPreset(ps.id)}
                  className={cn("relative rounded-lg overflow-hidden border-2 transition-all",
                    sel ? "border-primary" : "border-border hover:border-muted-foreground/40"
                  )}>
                  <div className="h-10 w-full" style={{ background: ps.bg, boxShadow: ps.shadow }} />
                  <p className="text-[9px] text-center py-1 truncate px-1 leading-tight">{ps.label}</p>
                </button>
              )
            })}
          </div>

          {/* Fine controls */}
          {showFine && (
            <div className="mt-3 space-y-4 rounded-xl border bg-muted/30 p-3">
              {/* 배경 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">배경</p>
                  <div className="flex gap-1">
                    <button type="button"
                      onClick={() => { const nb = curBg?.startsWith("linear-gradient") ? "#1a1a2e" : (curBg ?? "#1a1a2e"); onChange("cardBg", nb) }}
                      className={cn("px-2 py-0.5 rounded text-[10px] border transition-all", !isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background")}>
                      단색
                    </button>
                    <button type="button"
                      onClick={() => onChange("cardBg", buildGrad(gradFrom, gradTo, gradAngle))}
                      className={cn("px-2 py-0.5 rounded text-[10px] border transition-all", isGradient ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background")}>
                      그라데이션
                    </button>
                  </div>
                </div>
                {!isGradient ? (
                  <div className="flex items-center gap-2">
                    <input type="color"
                      value={curBg && !curBg.startsWith("rgba") && !curBg.startsWith("linear") ? curBg : "#1a1a2e"}
                      onChange={(e) => onChange("cardBg", e.target.value)}
                      className="h-8 w-10 rounded cursor-pointer border border-border" title="배경 색상" />
                    <Input className="h-7 text-xs font-mono flex-1" value={curBg ?? ""}
                      onChange={(e) => onChange("cardBg", e.target.value)}
                      placeholder="rgba(255,255,255,0.08) 또는 #1a1a2e" />
                    {curBg && <button type="button" onClick={() => onChange("cardBg", "")}
                      className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="color" value={gradFrom}
                        onChange={(e) => { setGradFrom(e.target.value); onChange("cardBg", buildGrad(e.target.value, gradTo, gradAngle)) }}
                        className="h-8 w-10 rounded cursor-pointer border border-border" title="시작 색상" />
                      <span className="text-muted-foreground text-xs">→</span>
                      <input type="color" value={gradTo}
                        onChange={(e) => { setGradTo(e.target.value); onChange("cardBg", buildGrad(gradFrom, e.target.value, gradAngle)) }}
                        className="h-8 w-10 rounded cursor-pointer border border-border" title="끝 색상" />
                      <div className="flex-1 h-6 rounded" style={{ background: buildGrad(gradFrom, gradTo, gradAngle) }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] text-muted-foreground whitespace-nowrap">각도 {gradAngle}°</Label>
                      <input type="range" min={0} max={360} step={15} value={gradAngle}
                        onChange={(e) => { const v2 = Number(e.target.value); setGradAngle(v2); onChange("cardBg", buildGrad(gradFrom, gradTo, v2)) }}
                        className="flex-1 accent-primary" />
                    </div>
                  </div>
                )}
              </div>

              {/* 테두리 */}
              <div>
                <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">테두리</p>
                <div className="flex items-center gap-2">
                  <input type="color"
                    value={curBd && !curBd.startsWith("rgba") ? curBd : "#ffffff"}
                    onChange={(e) => onChange("cardBorder", e.target.value)}
                    className="h-8 w-10 rounded cursor-pointer border border-border" title="테두리 색상" />
                  <Input className="h-7 text-xs font-mono flex-1" value={curBd ?? ""}
                    onChange={(e) => onChange("cardBorder", e.target.value)}
                    placeholder="rgba(255,255,255,0.22)" />
                  {curBd && <button type="button" onClick={() => onChange("cardBorder", "")}
                    className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                </div>
              </div>

              {/* 쉐도우 */}
              <div>
                <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">쉐도우</p>
                <div className="flex flex-wrap gap-1.5">
                  {SHADOW_PRESETS.map((sp) => {
                    const sel = matchedShadow?.id === sp.id || (!curSh && sp.id === "none")
                    return (
                      <button key={sp.id} type="button"
                        onClick={() => onChange("cardShadow", sp.css === "none" ? "" : sp.css)}
                        className={cn("px-2.5 py-1 rounded-full border text-[10px] transition-all",
                          sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background hover:border-muted-foreground/40"
                        )}>
                        {sp.label}
                      </button>
                    )
                  })}
                </div>
                {curSh && curSh !== "none" && (
                  <Input className="h-7 text-xs font-mono mt-2" value={curSh}
                    onChange={(e) => onChange("cardShadow", e.target.value)}
                    placeholder="0 8px 32px rgba(0,0,0,0.30)" />
                )}
              </div>

              {/* 백드롭 블러 & 모서리 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">백드롭 블러</p>
                  <div className="flex flex-wrap gap-1">
                    {[{id:"none",label:"없음",val:0},{id:"light",label:"약하게",val:8},{id:"medium",label:"보통",val:18},{id:"strong",label:"강하게",val:32}].map((b) => {
                      const sel = b.val === 0 ? !curBlur : curBlur === b.val
                      return (
                        <button key={b.id} type="button"
                          onClick={() => onChange("cardBlur", b.val === 0 ? 0 : b.val)}
                          className={cn("px-2 py-0.5 rounded text-[10px] border transition-all",
                            sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background")}>
                          {b.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">모서리</p>
                  <div className="flex flex-wrap gap-1">
                    {[{id:"sharp",label:"각지게",val:8},{id:"medium",label:"보통",val:16},{id:"round",label:"둥글게",val:24},{id:"pill",label:"최대",val:40}].map((r) => {
                      const sel = curRad == null ? r.val === 12 : curRad === r.val
                      return (
                        <button key={r.id} type="button"
                          onClick={() => onChange("cardRadius", r.val)}
                          className={cn("px-2 py-0.5 rounded text-[10px] border transition-all",
                            sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background")}>
                          {r.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* 초기화 */}
              <button type="button"
                onClick={() => { applyPreset(cardPreset); setShowFine(false) }}
                className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                <RotateCcw className="h-2.5 w-2.5" />
                세부 설정 초기화 (프리셋으로 복귀)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CTA toggle */}
      {type === "doctors" && (
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <p className="text-sm font-medium text-foreground">예약 CTA 표시</p>
            <p className="text-xs text-muted-foreground">각 {label} 카드 하단에 상담 버튼을 추가합니다</p>
          </div>
          <Switch checked={(values.showCta as boolean) ?? true} onCheckedChange={(v) => onChange("showCta", v)} />
        </div>
      )}

      {/* ── 의료진 이미지 편집 ── */}
      {type === "doctors" && rawDoctors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">의료진 이미지 편집</p>
            <p className="text-[10px] text-muted-foreground">카드별 사진·위치·효과 설정</p>
          </div>

          {/* Hidden file input */}
          <input ref={imgFileRef} type="file" accept="image/*" className="hidden" onChange={handleImgFile} />

          <div className="space-y-2">
            {rawDoctors.map((d) => {
              const docId  = d.profile.id
              const ovr    = imgOverrides[docId] || {}
              const thumb  = ovr.url || d.profile.profileImageUrl || ""
              const isOpen = editingDocId === docId

              return (
                <div key={docId} className="rounded-xl border border-border overflow-hidden">
                  {/* Row header */}
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/30">
                    {/* Thumbnail */}
                    <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={d.profile.name}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: ovr.position || "center top", filter: ovr.filter }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">👤</div>
                      )}
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.profile.name}</p>
                      <p className="text-[10px] text-muted-foreground">{d.profile.title}</p>
                    </div>
                    {/* Edit button */}
                    <button type="button"
                      onClick={() => setEditingDocId(isOpen ? null : docId)}
                      className={cn("text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                        isOpen ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40"
                      )}>
                      {isOpen ? "접기" : "이미지 편집"}
                    </button>
                  </div>

                  {/* Expanded editor */}
                  {isOpen && (
                    <div className="p-3 space-y-4 bg-background border-t border-border">

                      {/* Upload + preview */}
                      <div className="flex gap-3 items-start">
                        <div className="h-24 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt={d.profile.name}
                              className="w-full h-full object-cover"
                              style={{ objectPosition: ovr.position || "center top", filter: ovr.filter }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">👤</div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">이미지 업로드</p>
                          <button type="button"
                            onClick={() => { setPendingDocId(docId); imgFileRef.current?.click() }}
                            className="w-full rounded-lg border border-dashed border-border bg-muted/30 py-2 text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                            📁 홈페이지 전용 사진 선택
                          </button>
                          {ovr.url && (
                            <button type="button" onClick={() => updateImgOvr(docId, { url: "" })}
                              className="w-full rounded-lg border border-border bg-background py-1.5 text-[10px] text-muted-foreground hover:text-destructive transition-colors">
                              ↩ 원본 사진으로 복원
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Image position */}
                      <div>
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">사진 위치 (크롭 기준)</p>
                        <div className="grid grid-cols-3 gap-1 w-28">
                          {IMG_POSITIONS.map((pos) => {
                            const sel = (ovr.position || "center top") === pos.v
                            return (
                              <button key={pos.v} type="button"
                                onClick={() => updateImgOvr(docId, { position: pos.v })}
                                className={cn("h-7 rounded text-sm border transition-all",
                                  sel ? "border-primary bg-primary/10 font-bold text-primary" : "border-border bg-muted/40 text-muted-foreground hover:border-muted-foreground/40"
                                )}>
                                {pos.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Effect presets */}
                      <div>
                        <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">이미지 효과</p>
                        <div className="flex flex-wrap gap-1.5">
                          {IMG_EFFECTS.map((fx) => {
                            const sel = (ovr.filter || "") === fx.filter
                            return (
                              <button key={fx.id} type="button"
                                onClick={() => updateImgOvr(docId, { filter: fx.filter })}
                                className={cn("px-2.5 py-1 rounded-full border text-[10px] transition-all",
                                  sel ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border bg-background hover:border-muted-foreground/40"
                                )}>
                                {fx.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* 그라데이션 오버레이 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">그라데이션</p>
                          {(ovr.gradOpacity ?? 0) > 0 && (
                            <button type="button" onClick={() => updateImgOvr(docId, { gradOpacity: 0 })}
                              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                              <RotateCcw className="h-2.5 w-2.5" />끄기
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-1 mb-2">
                          {([
                            { v: "to bottom",       label: "↓" },
                            { v: "to top",          label: "↑" },
                            { v: "to right",        label: "→" },
                            { v: "to left",         label: "←" },
                            { v: "to bottom right", label: "↘" },
                            { v: "to bottom left",  label: "↙" },
                            { v: "radial",          label: "⊙" },
                            { v: "radial-edge",     label: "◎" },
                          ] as const).map(d => (
                            <button key={d.v} type="button" onClick={() => updateImgOvr(docId, { gradDir: d.v })}
                              className={cn("h-7 rounded text-sm border transition-all",
                                (ovr.gradDir || "to bottom") === d.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                              {d.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] text-muted-foreground w-8 shrink-0">색상</span>
                          <input type="color" value={ovr.gradColor || "#000000"} onChange={e => updateImgOvr(docId, { gradColor: e.target.value })}
                            className="w-8 h-7 rounded border border-border cursor-pointer p-0.5 shrink-0" />
                          <div className="flex gap-1">
                            {["#000000","#ffffff","#c9a85c","#1a0e00","#0a1a2e"].map(c => (
                              <div key={c} onClick={() => updateImgOvr(docId, { gradColor: c })}
                                className="w-5 h-5 rounded cursor-pointer border border-border/60 shrink-0"
                                style={{ background: c }} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-muted-foreground w-8 shrink-0">강도</span>
                          <input type="range" min={0} max={100} value={ovr.gradOpacity ?? 0}
                            onChange={e => updateImgOvr(docId, { gradOpacity: Number(e.target.value) })}
                            className="flex-1 accent-primary h-1.5" />
                          <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{ovr.gradOpacity ?? 0}%</span>
                        </div>
                      </div>

                      {/* Reset all */}
                      <button type="button" onClick={() => { resetImgOvr(docId); setEditingDocId(null) }}
                        className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                        <RotateCcw className="h-2.5 w-2.5" />
                        이 의료진 이미지 설정 초기화
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
// ─── Stat card individual editor ─────────────────────────────────────────────

function StrengthStatEditor({
  stat, isDark, onChange, onDelete, showChartType,
}: {
  stat: StrengthStat
  isDark: boolean
  onChange: (updated: StrengthStat) => void
  onDelete: () => void
  showChartType: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const presets = isDark ? BOX_PRESETS_DARK : BOX_PRESETS_LIGHT
  const matchedShadow = SHADOW_PRESETS.find(s => s.css === stat.shadowOverride)
  const patch = (partial: Partial<StrengthStat>) => onChange({ ...stat, ...partial })

  const valColorSafe = (stat.valueColor || "#c9a85c").startsWith("#") ? (stat.valueColor || "#c9a85c") : "#c9a85c"
  const lblColorSafe = (stat.labelColor || (isDark ? "#aaaaaa" : "#888888")).startsWith("#")
    ? (stat.labelColor || (isDark ? "#aaaaaa" : "#888888")) : "#aaaaaa"

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-3 space-y-2.5">
        {/* Label / Value / Unit */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <p className="text-[9px] text-muted-foreground">레이블</p>
            <Input value={stat.label} onChange={e => patch({ label: e.target.value })}
              className="rounded-lg h-7 text-xs" placeholder="운영 연차" />
          </div>
          <div className="w-16 space-y-1">
            <p className="text-[9px] text-muted-foreground">수치</p>
            <Input value={stat.value} onChange={e => patch({ value: e.target.value })}
              className="rounded-lg h-7 text-xs" placeholder="15" />
          </div>
          <div className="w-14 space-y-1">
            <p className="text-[9px] text-muted-foreground">단위</p>
            <Input value={stat.unit} onChange={e => patch({ unit: e.target.value })}
              className="rounded-lg h-7 text-xs" placeholder="년" />
          </div>
          <button type="button" onClick={onDelete}
            className="mb-0.5 rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Chart type (section 2 only) */}
        {showChartType && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-8 shrink-0">차트</span>
            {(["line", "circle", "bar"] as const).map(ct => (
              <button key={ct} type="button" onClick={() => patch({ chartType: ct })}
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[9px] border transition-all",
                  stat.chartType === ct
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted border-border text-muted-foreground hover:border-primary/40"
                )}>
                {ct === "line" ? "꺾은선" : ct === "circle" ? "원형" : "막대"}
              </button>
            ))}
          </div>
        )}

        {/* Box preset — visual grid matching doctors' style */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-muted-foreground">박스 스타일</span>
            <button type="button" onClick={() => setExpanded(!expanded)}
              className="text-[9px] text-primary hover:underline">
              {expanded ? "▲ 세부 설정 접기" : "▼ 세부 설정 열기"}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {presets.map(p => {
              const sel = stat.preset === p.id
              return (
                <button key={p.id} type="button"
                  onClick={() => patch({ preset: p.id, bgOverride: undefined, borderOverride: undefined, shadowOverride: undefined })}
                  className={cn("relative rounded-lg overflow-hidden border-2 transition-all",
                    sel ? "border-primary" : "border-border hover:border-muted-foreground/40")}>
                  <div className="h-8 w-full" style={{ background: p.bg, boxShadow: p.shadow === "none" ? undefined : p.shadow }} />
                  <p className="text-[8px] text-center py-0.5 truncate px-0.5 leading-tight">{p.label}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Color pickers */}
        <div className="flex gap-4">
          <div className="space-y-1">
            <p className="text-[9px] text-muted-foreground">수치 색상</p>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-full border border-border" style={{ background: stat.valueColor || "#c9a85c" }} />
              <input type="color" value={valColorSafe}
                onChange={e => patch({ valueColor: e.target.value })}
                className="h-4 w-4 rounded cursor-pointer border border-border" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] text-muted-foreground">레이블 색상</p>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-full border border-border" style={{ background: stat.labelColor || (isDark ? "#aaa" : "#888") }} />
              <input type="color" value={lblColorSafe}
                onChange={e => patch({ labelColor: e.target.value })}
                className="h-4 w-4 rounded cursor-pointer border border-border" />
            </div>
          </div>
        </div>
      </div>

      {/* Fine controls */}
      {expanded && (
        <div className="border-t border-border p-3 space-y-3 bg-muted/20">
          {/* 배경 */}
          <div>
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">배경</p>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded border border-border flex-none"
                style={{ background: stat.bgOverride || (presets.find(p => p.id === stat.preset) || presets[1]).bg }} />
              <Input value={stat.bgOverride || ""}
                onChange={e => patch({ bgOverride: e.target.value || undefined })}
                placeholder="프리셋 사용"
                className="flex-1 h-6 text-[10px] rounded-lg px-2" />
              <input type="color"
                value={(stat.bgOverride || "#111111").startsWith("#") ? stat.bgOverride || "#111111" : "#111111"}
                onChange={e => patch({ bgOverride: e.target.value })}
                className="h-6 w-6 rounded cursor-pointer border border-border" />
            </div>
          </div>
          {/* 테두리 */}
          <div>
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">테두리</p>
            <div className="flex items-center gap-2">
              <input type="color"
                value={(stat.borderOverride || "#c9a85c").startsWith("#") ? stat.borderOverride || "#c9a85c" : "#c9a85c"}
                onChange={e => patch({ borderOverride: e.target.value })}
                className="h-7 w-10 rounded cursor-pointer border border-border" />
              <Input className="h-7 text-xs font-mono flex-1" value={stat.borderOverride || ""}
                onChange={e => patch({ borderOverride: e.target.value || undefined })}
                placeholder="rgba(201,168,92,0.30)" />
              {stat.borderOverride && <button type="button" onClick={() => patch({ borderOverride: undefined })} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
            </div>
          </div>
          {/* 쉐도우 */}
          <div>
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">쉐도우</p>
            <div className="flex flex-wrap gap-1.5">
              {SHADOW_PRESETS.map(sp => {
                const sel = matchedShadow?.id === sp.id || (!stat.shadowOverride && sp.id === "none")
                return (
                  <button key={sp.id} type="button"
                    onClick={() => patch({ shadowOverride: sp.css === "none" ? undefined : sp.css })}
                    className={cn("px-2.5 py-1 rounded-full border text-[10px] transition-all",
                      sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background hover:border-muted-foreground/40")}>
                    {sp.label}
                  </button>
                )
              })}
            </div>
          </div>
          {/* 백드롭 블러 & 모서리 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">백드롭 블러</p>
              <div className="flex flex-wrap gap-1">
                {[{id:"none",label:"없음",val:0},{id:"light",label:"약하게",val:8},{id:"medium",label:"보통",val:18},{id:"strong",label:"강하게",val:32}].map(b => {
                  const sel = b.val === 0 ? !(stat.blurOverride) : stat.blurOverride === b.val
                  return (
                    <button key={b.id} type="button"
                      onClick={() => patch({ blurOverride: b.val === 0 ? undefined : b.val })}
                      className={cn("px-2 py-0.5 rounded text-[10px] border transition-all",
                        sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background")}>
                      {b.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider mb-2">모서리</p>
              <div className="flex flex-wrap gap-1">
                {[{id:"sharp",label:"각지게",val:8},{id:"medium",label:"보통",val:16},{id:"round",label:"둥글게",val:24},{id:"pill",label:"최대",val:40}].map(r => {
                  const sel = (stat.radiusOverride ?? 12) === r.val
                  return (
                    <button key={r.id} type="button"
                      onClick={() => patch({ radiusOverride: r.val })}
                      className={cn("px-2 py-0.5 rounded text-[10px] border transition-all",
                        sel ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background")}>
                      {r.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          {/* 초기화 */}
          <button type="button"
            onClick={() => { patch({ preset: stat.preset, bgOverride: undefined, borderOverride: undefined, shadowOverride: undefined, blurOverride: undefined, radiusOverride: undefined }); setExpanded(false) }}
            className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
            <RotateCcw className="h-2.5 w-2.5" />세부 설정 초기화 (프리셋으로 복귀)
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Strengths two-tab editor ─────────────────────────────────────────────────

// ── Helpers for StrengthsEditor (module-level — no inner component issue) ────

function StrengthsBgToggle({
  prefix, isDark, onChange,
}: {
  prefix: "s1" | "s2"
  isDark: boolean
  onChange: (k: string, v: FieldValue) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <div className="h-8 w-8 rounded-lg flex-none" style={{
        background: isDark
          ? "linear-gradient(135deg,rgba(201,168,92,0.3) 0%,#0e0c09 100%)"
          : "linear-gradient(135deg,rgba(180,180,180,0.2) 0%,#ffffff 100%)",
        border: "1px solid rgba(128,128,128,0.2)",
      }} />
      <div className="flex-1">
        <p className="text-xs font-medium text-foreground">배경 테마</p>
        <p className="text-[10px] text-muted-foreground">
          {isDark ? "블랙 · 골드 앰비언트 글로우" : "화이트 · 그레이 앰비언트 글로우"}
        </p>
      </div>
      <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-medium">
        <button type="button"
          onClick={() => onChange(`${prefix}BgColor`, "dark")}
          className={cn("px-3 py-1.5 transition-colors",
            isDark ? "bg-neutral-900 text-white" : "text-muted-foreground hover:bg-muted")}>
          블랙
        </button>
        <button type="button"
          onClick={() => onChange(`${prefix}BgColor`, "light")}
          className={cn("px-3 py-1.5 border-l border-border transition-colors",
            !isDark ? "bg-white text-neutral-900" : "text-muted-foreground hover:bg-muted")}>
          화이트
        </button>
      </div>
    </div>
  )
}

function StrengthsSubLabel({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-5 w-0.5 rounded-full bg-primary" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  )
}

// Numbered block wrapper shared by both strengths sections.
// Defined at module scope so it doesn't get re-created on every parent render
// (which would unmount/remount children and cause input focus loss).
function StrengthsTextBlock({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">{n}</span>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      {children}
    </div>
  )
}

// ─── Strengths two-section editor (always-visible scroll) ─────────────────────

function StrengthsEditor({ values, onChange }: { values: Record<string, FieldValue>; onChange: (k: string, v: FieldValue) => void }) {
  const s1Dark  = ((values.s1BgColor as string) || "dark") === "dark"
  const s2Dark  = ((values.s2BgColor as string) || "dark") === "dark"
  const s1Stats = parseSStats(values.s1Stats, DEFAULT_S1_STATS)
  const s2Stats = parseSStats(values.s2Stats, DEFAULT_S2_STATS)
  const [s1ImgSelIdx, setS1ImgSelIdx] = useState(0)
  const s1ImgRef = useRef<HTMLInputElement>(null)
  const [s2ImgSelIdx, setS2ImgSelIdx] = useState(0)
  const s2ImgRef = useRef<HTMLInputElement>(null)

  const setS1Stats = (stats: StrengthStat[]) => onChange("s1Stats", JSON.stringify(stats))
  const setS2Stats = (stats: StrengthStat[]) => onChange("s2Stats", JSON.stringify(stats))

  const addS1Stat = () =>
    setS1Stats([...s1Stats, { id: `s1x${Date.now()}`, label: "새 항목", value: "0", unit: "", preset: "glass-gold" }])
  const addS2Stat = () =>
    setS2Stats([...s2Stats, { id: `s2x${Date.now()}`, label: "새 항목", value: "0", unit: "", preset: "glass-gold", chartType: "line" }])

  return (
    <div className="space-y-0">

      {/* ══════════════════════════════════════════
          섹션 1 · TATOA IN NUMBERS
      ══════════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-muted/30 mb-1">
        {/* Section header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex-none">1</div>
          <div>
            <p className="text-sm font-semibold text-foreground">섹션 1 · IN NUMBERS</p>
            <p className="text-[10px] text-muted-foreground">서브레이블 · 헤드라인 · 세계지도 · 수치카드</p>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* 배경 */}
          <StrengthsSubLabel title="배경" />
          <StrengthsBgToggle prefix="s1" isDark={s1Dark} onChange={onChange} />

          <Separator />

          {/* 텍스트 블록 */}
          <StrengthsSubLabel title="텍스트 블록" />
          <div className="space-y-3">
            <StrengthsTextBlock n={1} title="영문 서브레이블">
              <Input
                value={(values.s1SubLabel as string) || ""}
                onChange={e => onChange("s1SubLabel", e.target.value)}
                placeholder="예: TATOA IN NUMBERS"
                className="rounded-xl text-sm"
              />
              <FontControls prefix="s1SubLabel" group="eyebrow" values={values} onChange={onChange} sizesOverride={STRENGTHS_SIZE_OPTIONS} />
            </StrengthsTextBlock>

            <StrengthsTextBlock n={2} title="헤드라인">
              <div className="space-y-1">
                <RichTextEditor
                  mode="floating"
                  value={(values.s1Headline as string) || ""}
                  onChange={(html) => onChange("s1Headline", html)}
                  placeholder={"예:\n시간이 증명한\n아름다움의 기준"}
                  minHeight={72}
                />
                <p className="text-[10px] text-muted-foreground">Enter 키로 줄바꿈</p>
              </div>
              <FontControls prefix="s1Headline" group="headline" values={values} onChange={onChange} sizesOverride={STRENGTHS_SIZE_OPTIONS} />
            </StrengthsTextBlock>

            <StrengthsTextBlock n={3} title="설명 텍스트">
              <div className="space-y-1">
                <Textarea
                  value={(values.s1Description as string) ?? ""}
                  onChange={(e) => onChange("s1Description", e.target.value)}
                  placeholder={"예:\n15년간 쌓아온 신뢰와 결과로\n증명하는 타토아의 브랜드 파워"}
                  rows={3}
                  className="rounded-xl resize-none text-sm"
                />
                <p className="text-[10px] text-muted-foreground">Enter 키로 줄바꿈</p>
              </div>
              <FontControls prefix="s1Description" group="subcopy" values={values} onChange={onChange} sizesOverride={STRENGTHS_SIZE_OPTIONS} />
            </StrengthsTextBlock>
          </div>

          <Separator />

          {/* 섹션 이미지 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <StrengthsSubLabel title="섹션 이미지" />
              <button type="button"
                onClick={() => {
                  const imgs = parseS1MapImages(values.s1MapImages, (values.s1MapImage as string) || "")
                  const next = [...imgs, { id: `s1i${Date.now()}`, url: "", effectId: "none", brightness: 100, contrast: 100, saturate: 100, hue: 0, position: "center", gradDir: "to bottom", gradColor: "#000000", gradOpacity: 0, shadowPreset: "none", shadowColor: "#000000" }]
                  onChange("s1MapImages", JSON.stringify(next))
                  setS1ImgSelIdx(imgs.length)
                }}
                className="flex items-center gap-1 rounded-xl border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Plus className="h-3 w-3" />이미지 추가
              </button>
            </div>

            {(() => {
              const imgs = parseS1MapImages(values.s1MapImages, (values.s1MapImage as string) || "")
              const sel  = imgs[s1ImgSelIdx]
              const save = (next: S1MapImg[]) => onChange("s1MapImages", JSON.stringify(next))
              const patch = (u: Partial<S1MapImg>) => save(imgs.map((img, i) => i === s1ImgSelIdx ? { ...img, ...u } : img))

              return (
                <>
                  {imgs.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-border py-8 text-center">
                      <p className="text-xs text-muted-foreground">이미지 없음</p>
                      <p className="text-[10px] text-muted-foreground mt-1">위 추가 버튼으로 이미지를 등록하세요.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {imgs.map((img, idx) => (
                        <div key={img.id} onClick={() => setS1ImgSelIdx(idx)}
                          className={cn("flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer transition-all",
                            s1ImgSelIdx === idx ? "border-primary bg-primary/5" : "border-border hover:bg-muted")}>
                          <div className="h-11 w-9 rounded-lg overflow-hidden bg-muted shrink-0 border border-border" style={{ aspectRatio: idx === 0 ? "5/4" : "3/2", height: 44, width: "auto" }}>
                            {img.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img.url} alt="" className="w-full h-full object-cover" style={{ filter: buildS1ImgFilter(img) }} />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-b from-stone-200 to-stone-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground">이미지 {idx + 1}{idx === 0 ? " (5:4)" : " (3:2)"}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{img.url || "이미지 미설정"}</p>
                          </div>
                          <button type="button" onClick={e => { e.stopPropagation(); save(imgs.filter((_, i) => i !== idx)); setS1ImgSelIdx(Math.max(0, Math.min(s1ImgSelIdx, imgs.length - 2))) }}
                            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 rounded">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {sel && (
                    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                      <p className="text-xs font-semibold text-foreground">이미지 {s1ImgSelIdx + 1} 편집</p>

                      {/* URL / upload */}
                      <div className="space-y-1.5">
                        <div className="flex gap-1.5">
                          <input type="text" value={sel.url.startsWith("blob:") ? "" : sel.url}
                            onChange={e => patch({ url: e.target.value })}
                            placeholder="https:// URL 입력"
                            className="flex-1 rounded-xl border border-border px-3 py-2 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                          <button type="button" onClick={() => s1ImgRef.current?.click()}
                            className="flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted transition-colors shrink-0">
                            <Upload className="h-3 w-3" />파일
                          </button>
                          <input ref={s1ImgRef} type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (!f) return; patch({ url: URL.createObjectURL(f) }); e.target.value = "" }} />
                        </div>
                      </div>

                      {/* Preview thumbnail */}
                      {sel.url && (
                        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-border group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={sel.url} alt="" className="w-full h-full object-cover"
                            style={{ filter: buildS1ImgFilter(sel), objectPosition: sel.position }} />
                          <button type="button" onClick={() => patch({ url: "" })}
                            className="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      )}

                      {/* Effect presets */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">이미지 효과</p>
                        <div className="flex flex-wrap gap-1">
                          {IMG_EFFECTS.map(eff => (
                            <button key={eff.id} type="button" onClick={() => patch({ effectId: eff.id })}
                              className={cn("rounded-lg px-2 py-1 text-[10px] border transition-all",
                                sel.effectId === eff.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                              {eff.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fine sliders */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">세부 조정</p>
                          <button type="button" onClick={() => patch({ brightness: 100, contrast: 100, saturate: 100, hue: 0, gradOpacity: 0, shadowPreset: "none" })}
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
                            <input type="range" min={min} max={max} value={sel[key]}
                              onChange={e => patch({ [key]: Number(e.target.value) })}
                              className="flex-1 accent-primary h-1.5" />
                            <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{sel[key]}{unit}</span>
                          </div>
                        ))}
                      </div>

                      {/* Image position */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">이미지 위치</p>
                        <div className="grid grid-cols-3 gap-1 w-24">
                          {IMG_POSITIONS.map(pos => (
                            <button key={pos.v} type="button" onClick={() => patch({ position: pos.v })}
                              className={cn("h-7 rounded text-xs border transition-all",
                                sel.position === pos.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Gradient overlay */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">그라데이션</p>
                          {sel.gradOpacity > 0 && (
                            <button type="button" onClick={() => patch({ gradOpacity: 0 })}
                              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                              <RotateCcw className="h-2.5 w-2.5" />끄기
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {([
                            { v: "to bottom", label: "↓" }, { v: "to top", label: "↑" },
                            { v: "to right", label: "→" }, { v: "to left", label: "←" },
                            { v: "to bottom right", label: "↘" }, { v: "to bottom left", label: "↙" },
                            { v: "radial", label: "⊙" }, { v: "radial-edge", label: "◎" },
                          ] as const).map(d => (
                            <button key={d.v} type="button" onClick={() => patch({ gradDir: d.v })}
                              className={cn("h-7 rounded text-sm border transition-all",
                                sel.gradDir === d.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                              {d.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground w-8 shrink-0">색상</span>
                          <input type="color" value={sel.gradColor || "#000000"} onChange={e => patch({ gradColor: e.target.value })}
                            className="w-8 h-7 rounded border border-border cursor-pointer p-0.5 shrink-0" />
                          <div className="flex gap-1">
                            {["#000000","#ffffff","#c9a85c","#1a0e00","#0a1a2e"].map(c => (
                              <div key={c} onClick={() => patch({ gradColor: c })}
                                className="w-5 h-5 rounded cursor-pointer border border-border/60 shrink-0"
                                style={{ background: c }} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-muted-foreground w-8 shrink-0">강도</span>
                          <input type="range" min={0} max={100} value={sel.gradOpacity}
                            onChange={e => patch({ gradOpacity: Number(e.target.value) })}
                            className="flex-1 accent-primary h-1.5" />
                          <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{sel.gradOpacity}%</span>
                        </div>
                      </div>

                      {/* Shadow */}
                      <div className="space-y-2.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">그림자 (Shadow)</p>
                        <div className="grid grid-cols-3 gap-1">
                          {([
                            { v: "none", label: "없음" }, { v: "sm", label: "약하게" }, { v: "md", label: "중간" },
                            { v: "lg", label: "강하게" }, { v: "xl", label: "매우강" }, { v: "glow", label: "글로우" },
                          ] as const).map(s => (
                            <button key={s.v} type="button" onClick={() => patch({ shadowPreset: s.v })}
                              className={cn("h-7 rounded text-[11px] border transition-all",
                                sel.shadowPreset === s.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                        {sel.shadowPreset !== "none" && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground w-8 shrink-0">색상</span>
                            <input type="color" value={sel.shadowColor || "#000000"} onChange={e => patch({ shadowColor: e.target.value })}
                              className="w-8 h-7 rounded border border-border cursor-pointer p-0.5 shrink-0" />
                            <div className="flex gap-1">
                              {["#000000","#c9a85c","#ffffff","#2563eb","#dc2626"].map(c => (
                                <div key={c} onClick={() => patch({ shadowColor: c })}
                                  className="w-5 h-5 rounded cursor-pointer border border-border/60 shrink-0"
                                  style={{ background: c }} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>

          <Separator />

          {/* 수치 카드 */}
          <div className="flex items-center justify-between">
            <StrengthsSubLabel title="수치 카드" />
            <span className="text-[10px] text-muted-foreground">{s1Stats.length}개</span>
          </div>
          <div className="space-y-3">
            {s1Stats.map((stat, idx) => (
              <StrengthStatEditor
                key={stat.id}
                stat={stat}
                isDark={s1Dark}
                onChange={updated => {
                  const next = [...s1Stats]; next[idx] = updated; setS1Stats(next)
                }}
                onDelete={() => setS1Stats(s1Stats.filter((_, i) => i !== idx))}
                showChartType={false}
              />
            ))}
            {s1Stats.length < 5 && (
              <button type="button" onClick={addS1Stat}
                className="w-full rounded-xl border-2 border-dashed border-border py-2.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
                <span className="text-sm leading-none font-light">+</span> 카드 추가
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          섹션 2 · 신뢰 지표 (숫자로 보는 신뢰)
      ══════════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-muted/30">
        {/* Section header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex-none">2</div>
          <div>
            <p className="text-sm font-semibold text-foreground">섹션 2 · 신뢰 지표</p>
            <p className="text-[10px] text-muted-foreground">이미지 · 헤드라인 · 설명 · 통계 카드 (차트 포함)</p>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* 배경 */}
          <StrengthsSubLabel title="배경" />
          <StrengthsBgToggle prefix="s2" isDark={s2Dark} onChange={onChange} />

          <Separator />

          {/* 텍스트 블록 */}
          <StrengthsSubLabel title="텍스트 블록" />
          <div className="space-y-3">
            <StrengthsTextBlock n={1} title="헤드라인">
              <div className="space-y-1">
                <RichTextEditor
                  mode="floating"
                  value={(values.s2Headline as string) || ""}
                  onChange={(html) => onChange("s2Headline", html)}
                  placeholder={"예:\n숫자로 보는 신뢰"}
                  minHeight={72}
                />
                <p className="text-[10px] text-muted-foreground">Enter 키로 줄바꿈</p>
              </div>
              <FontControls prefix="s2Headline" group="headline" values={values} onChange={onChange} sizesOverride={STRENGTHS_SIZE_OPTIONS} />
            </StrengthsTextBlock>

            <StrengthsTextBlock n={2} title="설명 텍스트">
              <div className="space-y-1">
                <Textarea
                  value={(values.s2Description as string) ?? ""}
                  onChange={(e) => onChange("s2Description", e.target.value)}
                  placeholder={"예:\n타토아를 선택한 고객들의\n진실된 재방문 데이터"}
                  rows={3}
                  className="rounded-xl resize-none text-sm"
                />
                <p className="text-[10px] text-muted-foreground">Enter 키로 줄바꿈</p>
              </div>
              <FontControls prefix="s2Description" group="subcopy" values={values} onChange={onChange} sizesOverride={STRENGTHS_SIZE_OPTIONS} />
            </StrengthsTextBlock>
          </div>

          <Separator />

          {/* 통계 카드 */}
          <div className="flex items-center justify-between">
            <StrengthsSubLabel title="통계 카드" />
            <span className="text-[10px] text-muted-foreground">{s2Stats.length}개 · 차트 포함</span>
          </div>
          <div className="space-y-3">
            {s2Stats.map((stat, idx) => (
              <StrengthStatEditor
                key={stat.id}
                stat={stat}
                isDark={s2Dark}
                onChange={updated => {
                  const next = [...s2Stats]; next[idx] = updated; setS2Stats(next)
                }}
                onDelete={() => setS2Stats(s2Stats.filter((_, i) => i !== idx))}
                showChartType={true}
              />
            ))}
            {s2Stats.length < 5 && (
              <button type="button" onClick={addS2Stat}
                className="w-full rounded-xl border-2 border-dashed border-border py-2.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
                <span className="text-sm leading-none font-light">+</span> 카드 추가
              </button>
            )}
          </div>

          <Separator />

          {/* 섹션 이미지 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <StrengthsSubLabel title="섹션 이미지" />
              <button type="button"
                onClick={() => {
                  const imgs = parseS1MapImages(values.s2MapImages)
                  const next = [...imgs, { id: `s2i${Date.now()}`, url: "", effectId: "none", brightness: 100, contrast: 100, saturate: 100, hue: 0, position: "center", gradDir: "to bottom", gradColor: "#000000", gradOpacity: 0, shadowPreset: "none", shadowColor: "#000000" }]
                  onChange("s2MapImages", JSON.stringify(next))
                  setS2ImgSelIdx(imgs.length)
                }}
                className="flex items-center gap-1 rounded-xl border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Plus className="h-3 w-3" />이미지 추가
              </button>
            </div>

            {(() => {
              const imgs = parseS1MapImages(values.s2MapImages)
              const sel  = imgs[s2ImgSelIdx]
              const save = (next: S1MapImg[]) => onChange("s2MapImages", JSON.stringify(next))
              const patch = (u: Partial<S1MapImg>) => save(imgs.map((img, i) => i === s2ImgSelIdx ? { ...img, ...u } : img))

              return (
                <>
                  {imgs.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-border py-8 text-center">
                      <p className="text-xs text-muted-foreground">이미지 없음</p>
                      <p className="text-[10px] text-muted-foreground mt-1">위 추가 버튼으로 이미지를 등록하세요.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {imgs.map((img, idx) => (
                        <div key={img.id} onClick={() => setS2ImgSelIdx(idx)}
                          className={cn("flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer transition-all",
                            s2ImgSelIdx === idx ? "border-primary bg-primary/5" : "border-border hover:bg-muted")}>
                          <div className="h-11 w-9 rounded-lg overflow-hidden bg-muted shrink-0 border border-border" style={{ aspectRatio: idx === 0 ? "5/4" : "3/2", height: 44, width: "auto" }}>
                            {img.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img.url} alt="" className="w-full h-full object-cover" style={{ filter: buildS1ImgFilter(img) }} />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-b from-stone-200 to-stone-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground">이미지 {idx + 1}{idx === 0 ? " (5:4)" : " (3:2)"}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{img.url || "이미지 미설정"}</p>
                          </div>
                          <button type="button" onClick={e => { e.stopPropagation(); save(imgs.filter((_, i) => i !== idx)); setS2ImgSelIdx(Math.max(0, Math.min(s2ImgSelIdx, imgs.length - 2))) }}
                            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 rounded">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {sel && (
                    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                      <p className="text-xs font-semibold text-foreground">이미지 {s2ImgSelIdx + 1} 편집</p>

                      {/* URL / upload */}
                      <div className="space-y-1.5">
                        <div className="flex gap-1.5">
                          <input type="text" value={sel.url.startsWith("blob:") ? "" : sel.url}
                            onChange={e => patch({ url: e.target.value })}
                            placeholder="https:// URL 입력"
                            className="flex-1 rounded-xl border border-border px-3 py-2 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                          <button type="button" onClick={() => s2ImgRef.current?.click()}
                            className="flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted transition-colors shrink-0">
                            <Upload className="h-3 w-3" />파일
                          </button>
                          <input ref={s2ImgRef} type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (!f) return; patch({ url: URL.createObjectURL(f) }); e.target.value = "" }} />
                        </div>
                      </div>

                      {/* Preview thumbnail */}
                      {sel.url && (
                        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-border group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={sel.url} alt="" className="w-full h-full object-cover"
                            style={{ filter: buildS1ImgFilter(sel), objectPosition: sel.position }} />
                          <button type="button" onClick={() => patch({ url: "" })}
                            className="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      )}

                      {/* Effect presets */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">이미지 효과</p>
                        <div className="flex flex-wrap gap-1">
                          {IMG_EFFECTS.map(eff => (
                            <button key={eff.id} type="button" onClick={() => patch({ effectId: eff.id })}
                              className={cn("rounded-lg px-2 py-1 text-[10px] border transition-all",
                                sel.effectId === eff.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                              {eff.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fine sliders */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">세부 조정</p>
                          <button type="button" onClick={() => patch({ brightness: 100, contrast: 100, saturate: 100, hue: 0, gradOpacity: 0, shadowPreset: "none" })}
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
                            <input type="range" min={min} max={max} value={sel[key]}
                              onChange={e => patch({ [key]: Number(e.target.value) })}
                              className="flex-1 accent-primary h-1.5" />
                            <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{sel[key]}{unit}</span>
                          </div>
                        ))}
                      </div>

                      {/* Image position */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">이미지 위치</p>
                        <div className="grid grid-cols-3 gap-1 w-24">
                          {IMG_POSITIONS.map(pos => (
                            <button key={pos.v} type="button" onClick={() => patch({ position: pos.v })}
                              className={cn("h-7 rounded text-xs border transition-all",
                                sel.position === pos.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Gradient overlay */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">그라데이션</p>
                          {sel.gradOpacity > 0 && (
                            <button type="button" onClick={() => patch({ gradOpacity: 0 })}
                              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                              <RotateCcw className="h-2.5 w-2.5" />끄기
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {([
                            { v: "to bottom", label: "↓" }, { v: "to top", label: "↑" },
                            { v: "to right", label: "→" }, { v: "to left", label: "←" },
                            { v: "to bottom right", label: "↘" }, { v: "to bottom left", label: "↙" },
                            { v: "radial", label: "⊙" }, { v: "radial-edge", label: "◎" },
                          ] as const).map(d => (
                            <button key={d.v} type="button" onClick={() => patch({ gradDir: d.v })}
                              className={cn("h-7 rounded text-sm border transition-all",
                                sel.gradDir === d.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                              {d.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground w-8 shrink-0">색상</span>
                          <input type="color" value={sel.gradColor || "#000000"} onChange={e => patch({ gradColor: e.target.value })}
                            className="w-8 h-7 rounded border border-border cursor-pointer p-0.5 shrink-0" />
                          <div className="flex gap-1">
                            {["#000000","#ffffff","#c9a85c","#1a0e00","#0a1a2e"].map(c => (
                              <div key={c} onClick={() => patch({ gradColor: c })}
                                className="w-5 h-5 rounded cursor-pointer border border-border/60 shrink-0"
                                style={{ background: c }} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-muted-foreground w-8 shrink-0">강도</span>
                          <input type="range" min={0} max={100} value={sel.gradOpacity}
                            onChange={e => patch({ gradOpacity: Number(e.target.value) })}
                            className="flex-1 accent-primary h-1.5" />
                          <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{sel.gradOpacity}%</span>
                        </div>
                      </div>

                      {/* Shadow */}
                      <div className="space-y-2.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">그림자 (Shadow)</p>
                        <div className="grid grid-cols-3 gap-1">
                          {([
                            { v: "none", label: "없음" }, { v: "sm", label: "약하게" }, { v: "md", label: "중간" },
                            { v: "lg", label: "강하게" }, { v: "xl", label: "매우강" }, { v: "glow", label: "글로우" },
                          ] as const).map(s => (
                            <button key={s.v} type="button" onClick={() => patch({ shadowPreset: s.v })}
                              className={cn("h-7 rounded text-[11px] border transition-all",
                                sel.shadowPreset === s.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40")}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                        {sel.shadowPreset !== "none" && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground w-8 shrink-0">색상</span>
                            <input type="color" value={sel.shadowColor || "#000000"} onChange={e => patch({ shadowColor: e.target.value })}
                              className="w-8 h-7 rounded border border-border cursor-pointer p-0.5 shrink-0" />
                            <div className="flex gap-1">
                              {["#000000","#c9a85c","#ffffff","#2563eb","#dc2626"].map(c => (
                                <div key={c} onClick={() => patch({ shadowColor: c })}
                                  className="w-5 h-5 rounded cursor-pointer border border-border/60 shrink-0"
                                  style={{ background: c }} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      </div>

    </div>
  )
}
// ── BranchCardEditor: module-level (avoids inner-component anti-pattern) ────────

function BranchCardEditor({
  card, index, isDark, onPatch, onDelete, onUploadClick,
}: {
  card: BranchCard
  index: number
  isDark: boolean
  onPatch: (c: BranchCard) => void
  onDelete: () => void
  onUploadClick: () => void
}) {
  const [open,   setOpen]   = useState(false)
  const [imgTab, setImgTab] = useState<"basic" | "color" | "overlay" | "advanced">("basic")
  const patch = (partial: Partial<BranchCard>) => onPatch({ ...card, ...partial })
  const ovlHex = (card.imgOverlay || "#000000").startsWith("#") ? (card.imgOverlay || "#000000") : "#000000"
  const previewFilter = buildCardFilter(card)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Collapsed header */}
      <div className="flex items-center gap-2.5 p-3">
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-none border border-border bg-muted relative">
          {card.imgUrl ? (
            <img src={card.imgUrl} alt="" className="w-full h-full object-cover"
              style={{ filter: previewFilter || undefined }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-4 w-4 text-muted-foreground/40" />
            </div>
          )}
          {index < 5 && (
            <div className="absolute top-0.5 left-0.5 bg-primary/80 text-primary-foreground text-[7px] font-bold rounded px-0.5 leading-tight">
              {index + 1}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{card.name || `카드 ${index + 1}`}</p>
          <p className="text-[10px] text-muted-foreground truncate">{card.region || "지역 미입력"}</p>
        </div>
        <button type="button" onClick={() => setOpen(!open)}
          className="rounded-lg px-2.5 py-1 text-[10px] text-primary border border-primary/30 hover:bg-primary/5 transition-colors flex-none">
          {open ? "접기" : "편집"}
        </button>
        <button type="button" onClick={onDelete}
          className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-none">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded editor */}
      {open && (
        <div className="border-t border-border p-3 space-y-4 bg-muted/10">

          {/* ① 텍스트 3줄 */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">카드 텍스트 (3줄)</p>
            <div className="space-y-1.5">
              <Input value={card.region} onChange={e => patch({ region: e.target.value })}
                placeholder="① 지역명  예: SEOUL · KOREA" className="rounded-lg h-7 text-xs" />
              <Input value={card.name} onChange={e => patch({ name: e.target.value })}
                placeholder="② 지점명  예: TATOA Gangnam" className="rounded-lg h-7 text-xs font-semibold" />
              <Input value={card.feature} onChange={e => patch({ feature: e.target.value })}
                placeholder="③ 특징    예: The Flagship Experience" className="rounded-lg h-7 text-xs" />
            </div>
          </div>

          {/* ② 클릭 URL */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">클릭 이동 URL</p>
            <Input value={card.url} onChange={e => patch({ url: e.target.value })}
              placeholder="https://gangnam.tatoa.com" className="rounded-lg h-7 text-[10px] font-mono" />
          </div>

          {/* ③ 이미지 편집 */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">이미지 편집</p>

            {/* Upload + preview row */}
            <div className="flex gap-2">
              {card.imgUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-border flex-none">
                  <img src={card.imgUrl} alt="" className="w-full h-full object-cover"
                    style={{ filter: previewFilter || undefined }} />
                </div>
              )}
              <div className="flex-1 flex flex-col gap-1.5 justify-center">
                <button type="button" onClick={onUploadClick}
                  className="w-full rounded-lg border border-dashed border-border bg-muted/30 py-2 text-[10px] text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  📁 이미지 선택
                </button>
                {card.imgUrl && (
                  <button type="button" onClick={() => patch({ imgUrl: "" })}
                    className="w-full rounded-lg border border-border py-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors">
                    ✕ 이미지 제거
                  </button>
                )}
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex rounded-lg border border-border overflow-hidden text-[9px] font-medium">
              {(["basic", "color", "overlay", "advanced"] as const).map(tab => (
                <button key={tab} type="button" onClick={() => setImgTab(tab)}
                  className={cn("flex-1 py-1.5 transition-colors",
                    imgTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                  {tab === "basic" ? "위치·효과" : tab === "color" ? "색감보정" : tab === "overlay" ? "오버레이" : "고급"}
                </button>
              ))}
            </div>

            {/* Tab: 위치·효과 */}
            {imgTab === "basic" && (
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] text-muted-foreground mb-1.5">사진 위치 (크롭 기준)</p>
                  <div className="grid grid-cols-3 gap-1 w-24">
                    {IMG_POSITIONS.map(pos => (
                      <button key={pos.v} type="button" onClick={() => patch({ imgPosition: pos.v })}
                        className={cn("h-6 rounded text-sm border transition-all",
                          (card.imgPosition || "center") === pos.v
                            ? "border-primary bg-primary/10 font-bold text-primary"
                            : "border-border bg-muted/40 text-muted-foreground hover:border-muted-foreground/40"
                        )}>
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground mb-1.5">이미지 효과 프리셋</p>
                  <div className="flex flex-wrap gap-1">
                    {IMG_EFFECTS.map(fx => (
                      <button key={fx.id} type="button" onClick={() => patch({ imgEffectId: fx.id })}
                        className={cn("px-2 py-0.5 rounded-full border text-[9px] transition-all",
                          (card.imgEffectId || "none") === fx.id
                            ? "border-primary bg-primary/10 font-semibold text-primary"
                            : "border-border bg-background hover:border-muted-foreground/40"
                        )}>
                        {fx.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: 색감보정 */}
            {imgTab === "color" && (
              <div className="space-y-3">
                {([
                  { k: "imgBrightness" as const, label: "밝기 (Brightness)", min: 0, max: 200, def: 100, unit: "%" },
                  { k: "imgContrast"   as const, label: "대비 (Contrast)",   min: 0, max: 200, def: 100, unit: "%" },
                  { k: "imgSaturate"   as const, label: "채도 (Saturate)",   min: 0, max: 200, def: 100, unit: "%" },
                  { k: "imgHue"        as const, label: "색조 (Hue-Rotate)", min: 0, max: 360, def: 0,   unit: "°" },
                ]).map(({ k, label, min, max, def, unit }) => (
                  <div key={k} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] text-muted-foreground">{label}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-muted-foreground">{card[k] ?? def}{unit}</span>
                        {(card[k] ?? def) !== def && (
                          <button type="button" onClick={() => patch({ [k]: def })}
                            className="text-[8px] text-primary hover:underline">↩</button>
                        )}
                      </div>
                    </div>
                    <input type="range" min={min} max={max} step={1}
                      value={card[k] ?? def}
                      onChange={e => patch({ [k]: Number(e.target.value) })}
                      className="w-full accent-primary" />
                  </div>
                ))}
                <button type="button"
                  onClick={() => patch({ imgBrightness: 100, imgContrast: 100, imgSaturate: 100, imgHue: 0 })}
                  className="text-[9px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                  <RotateCcw className="h-2.5 w-2.5" />색감 보정 초기화
                </button>
              </div>
            )}

            {/* Tab: 오버레이·페이드 */}
            {imgTab === "overlay" && (
              <div className="space-y-3">
                {/* Overlay color */}
                <div className="space-y-1.5">
                  <p className="text-[9px] text-muted-foreground">오버레이 색상</p>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md border border-border flex-none" style={{ background: card.imgOverlay || "#000000" }} />
                    <input type="color" value={ovlHex}
                      onChange={e => patch({ imgOverlay: e.target.value })}
                      className="h-6 w-6 rounded cursor-pointer border border-border" />
                    <span className="text-[9px] text-muted-foreground font-mono">{card.imgOverlay || "#000000"}</span>
                  </div>
                </div>
                {/* Overlay opacity */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <p className="text-[9px] text-muted-foreground">오버레이 농도</p>
                    <span className="text-[9px] text-muted-foreground">{card.imgOverlayOpacity ?? 30}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={1}
                    value={card.imgOverlayOpacity ?? 30}
                    onChange={e => patch({ imgOverlayOpacity: Number(e.target.value) })}
                    className="w-full accent-primary" />
                </div>
                {/* Bottom fade */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <p className="text-[9px] text-muted-foreground">하단 페이드 강도</p>
                    <span className="text-[9px] text-muted-foreground">{card.imgFade ?? 65}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={5}
                    value={card.imgFade ?? 65}
                    onChange={e => patch({ imgFade: Number(e.target.value) })}
                    className="w-full accent-primary" />
                </div>
                {/* Blend mode */}
                <div className="space-y-1.5">
                  <p className="text-[9px] text-muted-foreground">블렌드 모드</p>
                  <div className="flex flex-wrap gap-1">
                    {(["normal","multiply","screen","overlay","soft-light","color","luminosity"] as const).map(bm => (
                      <button key={bm} type="button" onClick={() => patch({ imgBlend: bm })}
                        className={cn("px-2 py-0.5 rounded border text-[8px] transition-all",
                          (card.imgBlend || "normal") === bm
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border bg-muted/40 text-muted-foreground hover:border-muted-foreground/40"
                        )}>
                        {bm}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: 고급 */}
            {imgTab === "advanced" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                  <p className="text-[9px] font-semibold text-foreground/70 uppercase tracking-wider">현재 최종 CSS filter</p>
                  <p className="text-[9px] font-mono text-muted-foreground break-all leading-relaxed">
                    {previewFilter || "(없음 — 원본)"}
                  </p>
                  <p className="text-[8px] text-muted-foreground">위치·효과 탭의 프리셋 + 색감보정 탭의 슬라이더 값이 결합된 최종 값입니다.</p>
                </div>
                <button type="button"
                  onClick={() => patch({
                    imgEffectId: "none", imgBrightness: 100, imgContrast: 100,
                    imgSaturate: 100, imgHue: 0,
                    imgOverlay: "#000000", imgOverlayOpacity: 30, imgFade: 65, imgBlend: "normal",
                  })}
                  className="rounded-lg border border-border px-3 py-2 text-[10px] text-muted-foreground hover:text-destructive hover:border-destructive transition-colors flex items-center gap-1.5 w-full justify-center">
                  <RotateCcw className="h-3 w-3" />이미지 설정 전체 초기화
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Branch Info editor ───────────────────────────────────────────────────────

function BranchInfoEditor({ values, onChange }: { values: Record<string, FieldValue>; onChange: (k: string, v: FieldValue) => void }) {
  const isDark    = ((values.biBgColor as string) || "dark") === "dark"
  const cards     = parseBranchCards(values.branchCards)
  const fileRef   = useRef<HTMLInputElement>(null)
  const [pendingIdx, setPendingIdx] = useState<number | null>(null)

  const save = (updated: BranchCard[]) => onChange("branchCards", JSON.stringify(updated))

  const patchCard  = (i: number, updated: BranchCard) => save(cards.map((c, idx) => idx === i ? updated : c))
  const deleteCard = (i: number) => save(cards.filter((_, idx) => idx !== i))
  const addCard    = () => save([...cards, {
    id: `bc${Date.now()}`, region: "", name: "", feature: "",
    url: "", imgUrl: "", imgPosition: "center", imgEffectId: "none",
    imgBrightness: 100, imgContrast: 100, imgSaturate: 100, imgHue: 0,
    imgOverlay: "#000000", imgOverlayOpacity: 30, imgFade: 65, imgBlend: "normal",
  }])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/") || pendingIdx === null) return
    patchCard(pendingIdx, { ...cards[pendingIdx], imgUrl: URL.createObjectURL(file) })
    e.target.value = ""
    setPendingIdx(null)
  }

  return (
    <div className="space-y-6">

      {/* ── 배경 ────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <InfoSubLabel title="배경" />
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="h-8 w-8 rounded-lg flex-none" style={{
            background: isDark
              ? "linear-gradient(135deg,rgba(201,168,92,0.3) 0%,#0e0c09 100%)"
              : "linear-gradient(135deg,rgba(180,180,180,0.2) 0%,#ffffff 100%)",
            border: "1px solid rgba(128,128,128,0.2)",
          }} />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">배경 테마</p>
            <p className="text-[10px] text-muted-foreground">
              {isDark ? "블랙 · 골드 앰비언트 글로우" : "화이트 · 그레이 앰비언트 글로우"}
            </p>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-medium">
            <button type="button" onClick={() => onChange("biBgColor", "dark")}
              className={cn("px-3 py-1.5 transition-colors",
                isDark ? "bg-neutral-900 text-white" : "text-muted-foreground hover:bg-muted")}>
              블랙
            </button>
            <button type="button" onClick={() => onChange("biBgColor", "light")}
              className={cn("px-3 py-1.5 border-l border-border transition-colors",
                !isDark ? "bg-white text-neutral-900" : "text-muted-foreground hover:bg-muted")}>
              화이트
            </button>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── 소제목 ──────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <InfoSubLabel title="소제목" />
        <Input placeholder="OUR BRANCHES" value={(values.biSubLabel as string) ?? ""}
          onChange={e => onChange("biSubLabel", e.target.value)} className="rounded-xl" />
        <FontControls prefix="biSubLabel" group="eyebrow" values={values} onChange={onChange} sizesOverride={BRANCH_INTRO_SIZE_OPTIONS} />
      </div>

      <Separator />

      {/* ── 대제목 ──────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <InfoSubLabel title="대제목" />
        <Input placeholder="Global Network" value={(values.biTitle as string) ?? ""}
          onChange={e => onChange("biTitle", e.target.value)} className="rounded-xl" />
        <FontControls prefix="biTitle" group="headline" values={values} onChange={onChange} sizesOverride={BRANCH_INTRO_SIZE_OPTIONS} />
      </div>

      <Separator />

      {/* ── 지점 카드 ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <InfoSubLabel title="지점 카드" />
          <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {cards.length}개 · 5개 노출
          </span>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            최초 <strong>5개</strong> 카드가 홈페이지에 표시되고, 나머지는 <strong>+N 더보기</strong> 카드로 표현됩니다.
            카드 순서 = 목록 순서입니다.
          </p>
        </div>

        {/* Card list */}
        <div className="space-y-2">
          {cards.map((card, i) => (
            <BranchCardEditor
              key={card.id}
              card={card}
              index={i}
              isDark={isDark}
              onPatch={updated => patchCard(i, updated)}
              onDelete={() => deleteCard(i)}
              onUploadClick={() => { setPendingIdx(i); fileRef.current?.click() }}
            />
          ))}
        </div>

        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {/* Add card */}
        <button type="button" onClick={addCard}
          className="w-full rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />지점 카드 추가
        </button>
      </div>

    </div>
  )
}
// ── HoursLine rich-text type + helpers ───────────────────────────────────────

type HoursLineColor = "default" | "red" | "gold" | "gray"
type HoursLine = {
  id: string
  text: string
  color: HoursLineColor
  size: "normal" | "sm"
  suffix: string
  suffixColor: HoursLineColor
}

const DEFAULT_HOURS_LINE: Omit<HoursLine, "id" | "text"> = {
  color: "default", size: "normal", suffix: "", suffixColor: "default",
}

function makeHoursLine(text = ""): HoursLine {
  return { id: Math.random().toString(36).slice(2), text, ...DEFAULT_HOURS_LINE }
}

function parseHoursLines(raw: FieldValue): HoursLine[] {
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
  // Legacy plain text fallback — split by newline
  if (!str.trim()) return [makeHoursLine()]
  return str.split("\n").filter(Boolean).map(t => makeHoursLine(t))
}

const HOURS_COLOR_OPTIONS: { value: HoursLineColor; label: string; color: string }[] = [
  { value: "default", label: "기본",  color: "transparent" },
  { value: "red",     label: "빨강",  color: "#ef4444" },
  { value: "gold",    label: "골드",  color: "#c9a85c" },
  { value: "gray",    label: "회색",  color: "#9ca3af" },
]

function resolveHoursColor(color: HoursLineColor, isDark: boolean, defaultColor: string): string {
  if (color === "red")  return "#ef4444"
  if (color === "gold") return "#c9a85c"
  if (color === "gray") return isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"
  return defaultColor
}

function HoursLinesEditor({
  value, onChange: onSave,
}: { value: FieldValue; onChange: (v: string) => void }) {
  const lines = parseHoursLines(value)
  const save = (next: HoursLine[]) => onSave(JSON.stringify(next))
  const patch = (id: string, u: Partial<HoursLine>) =>
    save(lines.map(l => l.id === id ? { ...l, ...u } : l))
  const addLine  = () => save([...lines, makeHoursLine()])
  const del      = (id: string) => save(lines.filter(l => l.id !== id))
  const moveUp   = (idx: number) => { if (idx === 0) return; const n = [...lines]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; save(n) }
  const moveDown = (idx: number) => { if (idx === lines.length - 1) return; const n = [...lines]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; save(n) }

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => (
        <div key={line.id} className="rounded-xl border border-border bg-card p-3 space-y-2.5">
          {/* Row 1: text + delete */}
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="예: 월~금  10:00 – 19:00"
              value={line.text}
              onChange={e => patch(line.id, { text: e.target.value })}
            />
            <div className="flex gap-0.5">
              <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0}
                className="h-6 w-6 rounded text-muted-foreground hover:bg-muted disabled:opacity-30 flex items-center justify-center text-[10px]">▲</button>
              <button type="button" onClick={() => moveDown(idx)} disabled={idx === lines.length - 1}
                className="h-6 w-6 rounded text-muted-foreground hover:bg-muted disabled:opacity-30 flex items-center justify-center text-[10px]">▼</button>
              <button type="button" onClick={() => del(line.id)}
                className="h-6 w-6 rounded text-destructive hover:bg-destructive/10 flex items-center justify-center">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Row 2: color chips + size toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Color */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-muted-foreground mr-0.5">색상</span>
              {HOURS_COLOR_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => patch(line.id, { color: opt.value })}
                  title={opt.label}
                  className={cn("h-5 w-5 rounded-full border-2 transition-all",
                    line.color === opt.value ? "border-primary scale-110" : "border-border hover:border-muted-foreground/40")}
                  style={{ background: opt.value === "default" ? "linear-gradient(135deg,#e5e7eb 50%,#9ca3af 50%)" : opt.color }}
                />
              ))}
            </div>
            {/* Size */}
            <div className="flex rounded-lg border border-border overflow-hidden text-[9px] font-medium">
              <button type="button" onClick={() => patch(line.id, { size: "normal" })}
                className={cn("px-2 py-0.5 transition-colors", line.size === "normal" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                보통
              </button>
              <button type="button" onClick={() => patch(line.id, { size: "sm" })}
                className={cn("px-2 py-0.5 transition-colors", line.size === "sm" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                작게
              </button>
            </div>
          </div>

          {/* Row 3: suffix (optional small annotation) */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground whitespace-nowrap">보조 텍스트</span>
            <input
              className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[10px] text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="예: (점심시간 없이 진료)  — 자동으로 작게 표시"
              value={line.suffix}
              onChange={e => patch(line.id, { suffix: e.target.value })}
            />
            {/* Suffix color */}
            <div className="flex gap-1">
              {HOURS_COLOR_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => patch(line.id, { suffixColor: opt.value })}
                  title={opt.label}
                  className={cn("h-4 w-4 rounded-full border-2 transition-all",
                    line.suffixColor === opt.value ? "border-primary scale-110" : "border-border/60")}
                  style={{ background: opt.value === "default" ? "linear-gradient(135deg,#e5e7eb 50%,#9ca3af 50%)" : opt.color }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Add row */}
      <button type="button" onClick={addLine}
        className="w-full rounded-xl border border-dashed border-border py-2 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1.5">
        <Plus className="h-3.5 w-3.5" />줄 추가
      </button>
    </div>
  )
}

// ── Module-level helpers for InfoEditor (avoids inner-component anti-pattern) ──

function InfoSubLabel({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-5 w-0.5 rounded-full bg-primary" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  )
}

function InfoBoxStylePanel({
  prefix, isDark, values, onChange,
}: {
  prefix: string
  isDark: boolean
  values: Record<string, FieldValue>
  onChange: (k: string, v: FieldValue) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const presets = isDark ? BOX_PRESETS_DARK : BOX_PRESETS_LIGHT
  const curPreset = (values[`${prefix}Preset`] as string) || "glass-gold"
  const curShadow = (values[`${prefix}Shadow`] as string) || ""
  const curBg     = (values[`${prefix}Bg`]     as string) || ""
  const curBorder = (values[`${prefix}Border`] as string) || ""
  const curBlur   = (values[`${prefix}Blur`]   as number) ?? 0
  const curRadius = (values[`${prefix}Radius`] as number) ?? 12
  const matchedShadow = SHADOW_PRESETS.find(s => s.css === curShadow)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">박스 스타일</span>
        <button type="button" onClick={() => setExpanded(!expanded)}
          className="text-[9px] text-primary hover:underline">
          {expanded ? "접기" : "세부 설정 ▾"}
        </button>
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map(p => (
          <button key={p.id} type="button"
            onClick={() => {
              onChange(`${prefix}Preset`, p.id)
              onChange(`${prefix}Bg`,     "")
              onChange(`${prefix}Border`, "")
              onChange(`${prefix}Shadow`, "")
            }}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[10px] border transition-all",
              curPreset === p.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/40"
            )}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Shadow row */}
      <div className="space-y-1.5">
        <p className="text-[9px] text-muted-foreground">쉐도우</p>
        <div className="flex flex-wrap gap-1">
          {SHADOW_PRESETS.map(sp => {
            const sel = matchedShadow?.id === sp.id || (!curShadow && sp.id === "none")
            return (
              <button key={sp.id} type="button"
                onClick={() => onChange(`${prefix}Shadow`, sp.css === "none" ? "" : sp.css)}
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[9px] border transition-all",
                  sel ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                )}>
                {sp.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Fine controls */}
      {expanded && (
        <div className="space-y-3 rounded-xl border border-border p-3 bg-muted/20">
          {/* BG */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">박스 배경</p>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded border border-border flex-none"
                style={{ background: curBg || (presets.find(p => p.id === curPreset) || presets[1]).bg }} />
              <Input value={curBg} onChange={e => onChange(`${prefix}Bg`, e.target.value)}
                placeholder="프리셋 사용" className="flex-1 h-6 text-[10px] rounded-lg px-2" />
              <input type="color"
                value={(curBg || "#111111").startsWith("#") ? curBg || "#111111" : "#111111"}
                onChange={e => onChange(`${prefix}Bg`, e.target.value)}
                className="h-6 w-6 rounded cursor-pointer border border-border" />
            </div>
          </div>
          {/* Border */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">테두리 색상</p>
            <div className="flex items-center gap-2">
              <Input value={curBorder} onChange={e => onChange(`${prefix}Border`, e.target.value)}
                placeholder="rgba(201,168,92,0.30)" className="flex-1 h-6 text-[10px] rounded-lg px-2" />
              <input type="color"
                value={(curBorder || "#c9a85c").startsWith("#") ? curBorder || "#c9a85c" : "#c9a85c"}
                onChange={e => onChange(`${prefix}Border`, e.target.value)}
                className="h-6 w-6 rounded cursor-pointer border border-border" />
            </div>
          </div>
          {/* Blur + Radius */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between">
                <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">블러</p>
                <span className="text-[9px] text-muted-foreground">{curBlur}px</span>
              </div>
              <input type="range" min={0} max={40} step={2} value={curBlur}
                onChange={e => onChange(`${prefix}Blur`, Number(e.target.value) || 0)}
                className="w-full accent-primary" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">둥글기</p>
                <span className="text-[9px] text-muted-foreground">{curRadius}px</span>
              </div>
              <input type="range" min={0} max={32} step={2} value={curRadius}
                onChange={e => onChange(`${prefix}Radius`, Number(e.target.value))}
                className="w-full accent-primary" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Info / Location editor ───────────────────────────────────────────────────

function InfoEditor({ values, onChange }: { values: Record<string, FieldValue>; onChange: (k: string, v: FieldValue) => void }) {
  const isDark = ((values.infoBgColor as string) || "dark") === "dark"

  return (
    <div className="space-y-6">

      {/* ── 배경 ─────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <InfoSubLabel title="배경" />
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="h-8 w-8 rounded-lg flex-none" style={{
            background: isDark
              ? "linear-gradient(135deg,rgba(201,168,92,0.3) 0%,#0e0c09 100%)"
              : "linear-gradient(135deg,rgba(180,180,180,0.2) 0%,#ffffff 100%)",
            border: "1px solid rgba(128,128,128,0.2)",
          }} />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">배경 테마</p>
            <p className="text-[10px] text-muted-foreground">
              {isDark ? "블랙 · 골드 앰비언트 글로우" : "화이트 · 그레이 앰비언트 글로우"}
            </p>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-medium">
            <button type="button" onClick={() => onChange("infoBgColor", "dark")}
              className={cn("px-3 py-1.5 transition-colors",
                isDark ? "bg-neutral-900 text-white" : "text-muted-foreground hover:bg-muted")}>
              블랙
            </button>
            <button type="button" onClick={() => onChange("infoBgColor", "light")}
              className={cn("px-3 py-1.5 border-l border-border transition-colors",
                !isDark ? "bg-white text-neutral-900" : "text-muted-foreground hover:bg-muted")}>
              화이트
            </button>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── 섹션 타이틀 ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <InfoSubLabel title="섹션 타이틀" />
        <Input
          placeholder="예: — 정보 / 위치 —"
          value={(values.infoTitle as string) ?? ""}
          onChange={e => onChange("infoTitle", e.target.value)}
          className="rounded-xl"
        />
        <FontControls prefix="infoTitle" group="headline" values={values} onChange={onChange} sizesOverride={INFO_SIZE_OPTIONS} />
      </div>

      <Separator />

      {/* ── 구글 지도 ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <InfoSubLabel title="구글 지도" />
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="rounded-lg bg-blue-500/10 p-1.5 flex-none mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground mb-0.5">Google Maps 임베드 URL</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Google Maps에서 장소를 열고 <strong>공유 → 지도 퍼가기</strong>를 선택한 후,
                iframe 코드 안의 <code className="bg-muted px-1 py-0.5 rounded text-[9px] font-mono">src="..."</code> 값만 복사하세요.
              </p>
            </div>
          </div>
          <Input
            placeholder="https://www.google.com/maps/embed?pb=..."
            value={(values.mapEmbedUrl as string) ?? ""}
            onChange={e => {
              const zoom = (values.mapZoomLevel as number) ?? 15
              const normalized = normalizeMapUrl(e.target.value, zoom)
              onChange("mapEmbedUrl", normalized)
            }}
            className="rounded-xl font-mono text-xs"
          />
          {(values.mapEmbedUrl as string) && !(values.mapEmbedUrl as string).includes("/maps/embed") && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 flex items-start gap-2">
              <span className="text-amber-500 text-xs mt-0.5">⚠</span>
              <p className="text-[10px] text-amber-600 leading-relaxed">
                일반 Google Maps URL이 감지되었습니다. 지도가 제대로 표시되지 않을 수 있어요.<br />
                Google Maps에서 <strong>공유 → 지도 퍼가기</strong> 후 <code className="bg-amber-100 px-1 rounded font-mono">src="..."</code> 값만 붙여넣으세요.
              </p>
            </div>
          )}
          {/* Zoom level — only effective for q= format URLs */}
          <div className="flex items-center gap-3">
            <p className="text-[10px] text-muted-foreground whitespace-nowrap flex-none">확대 수준 (축소 ←→ 확대)</p>
            <input
              type="range" min={10} max={20} step={1}
              value={(values.mapZoomLevel as number) ?? 15}
              onChange={e => {
                const z = Number(e.target.value)
                onChange("mapZoomLevel", z)
                const current = (values.mapEmbedUrl as string) ?? ""
                if (current) onChange("mapEmbedUrl", normalizeMapUrl(current, z))
              }}
              className="flex-1 accent-blue-500"
            />
            <span className="text-[10px] font-mono text-foreground w-5 text-right">{(values.mapZoomLevel as number) ?? 15}</span>
          </div>
          <p className="text-[9px] text-muted-foreground/70 -mt-1">※ 지도 퍼가기(pb=) 형식 URL은 원본 줌 고정, 일반 URL은 이 슬라이더로 조절 가능</p>
          {(values.mapEmbedUrl as string) ? (
            <div className="rounded-lg overflow-hidden border border-border" style={{ height: "350px" }}>
              <iframe
                src={values.mapEmbedUrl as string}
                width="100%" height="100%"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="rounded-lg bg-muted/50 border border-dashed border-border flex items-center justify-center gap-2" style={{ height: "80px" }}>
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">URL 입력 시 미리보기 표시</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* ── 주소 / 연락처 박스 ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <InfoSubLabel title="주소 / 연락처 박스" />
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-5">
          {/* Box title */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">박스 제목</p>
            <Input placeholder="주소 / 연락처" value={(values.addrTitle as string) ?? ""}
              onChange={e => onChange("addrTitle", e.target.value)} className="rounded-xl" />
            <FontControls prefix="addrTitle" group="body" values={values} onChange={onChange} />
          </div>
          {/* Address */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">주소</p>
            <RichTextEditor
              mode="floating"
              placeholder="서울특별시 강남구 테헤란로 123"
              value={(values.addrBody as string) ?? ""}
              onChange={(html) => onChange("addrBody", html)}
              minHeight={72}
            />
            <FontControls prefix="addrBody" group="body" values={values} onChange={onChange} />
          </div>
          {/* Phone */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">연락처</p>
            <Input placeholder="02-1234-5678" value={(values.addrPhone as string) ?? ""}
              onChange={e => onChange("addrPhone", e.target.value)} className="rounded-xl" />
            <FontControls prefix="addrPhone" group="body" values={values} onChange={onChange} />
          </div>
          <Separator />
          {/* Box style */}
          <InfoBoxStylePanel prefix="addr" isDark={isDark} values={values} onChange={onChange} />
        </div>
      </div>

      <Separator />

      {/* ── 진료 시간 박스 ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <InfoSubLabel title="진료 시간 박스" />
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-5">
          {/* Box title */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">박스 제목</p>
            <Input placeholder="진료 시간" value={(values.hoursTitle as string) ?? ""}
              onChange={e => onChange("hoursTitle", e.target.value)} className="rounded-xl" />
            <FontControls prefix="hoursTitle" group="body" values={values} onChange={onChange} />
          </div>
          {/* Hours content — structured line editor */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">진료 시간 내용</p>
            <HoursLinesEditor
              value={values.hoursBody ?? ""}
              onChange={v => onChange("hoursBody", v)}
            />
          </div>
          <Separator />
          {/* Box style */}
          <InfoBoxStylePanel prefix="hours" isDark={isDark} values={values} onChange={onChange} />
        </div>
      </div>

    </div>
  )
}
const SOCIAL_PLATFORMS = [
  { key: "facebook",  label: "Facebook",    Icon: Facebook },
  { key: "twitter",   label: "X (Twitter)", Icon: Twitter },
  { key: "tiktok",    label: "TikTok",      Icon: Music },
  { key: "linkedin",  label: "LinkedIn",    Icon: Linkedin },
  { key: "other",     label: "기타",         Icon: Globe },
] as const

function readExtras(values: Record<string, FieldValue>): FooterSocialExtra[] {
  try {
    const raw = (values.footerSocialExtras as string) ?? "[]"
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
function writeExtras(extras: FooterSocialExtra[], onChange: (k: string, v: FieldValue) => void) {
  onChange("footerSocialExtras", JSON.stringify(extras))
}
function addExtra(values: Record<string, FieldValue>, onChange: (k: string, v: FieldValue) => void, partial: Omit<FooterSocialExtra, "id">) {
  const extras = readExtras(values)
  const newItem: FooterSocialExtra = {
    ...partial,
    id: "social_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
  }
  writeExtras([...extras, newItem], onChange)
}
function updateExtra(values: Record<string, FieldValue>, onChange: (k: string, v: FieldValue) => void, id: string, patch: Partial<FooterSocialExtra>) {
  const extras = readExtras(values)
  writeExtras(extras.map(e => e.id === id ? { ...e, ...patch } : e), onChange)
}
function removeExtra(values: Record<string, FieldValue>, onChange: (k: string, v: FieldValue) => void, id: string) {
  const extras = readExtras(values)
  writeExtras(extras.filter(e => e.id !== id), onChange)
}
function toggleExtra(values: Record<string, FieldValue>, onChange: (k: string, v: FieldValue) => void, id: string) {
  const extras = readExtras(values)
  writeExtras(extras.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e), onChange)
}

function FooterEditor({ values, onChange }: { values: Record<string, FieldValue>; onChange: (k: string, v: FieldValue) => void }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formPlatform, setFormPlatform] = useState("facebook")
  const [formLabel, setFormLabel] = useState("Facebook")
  const [formUrl, setFormUrl] = useState("")

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium">병원 공식 명칭</Label>
          <Input placeholder="예: 의료법인 타토아의원" value={(values.footerHospitalName as string) ?? ""}
            onChange={(e) => onChange("footerHospitalName", e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">사업자등록번호</Label>
          <Input placeholder="예: 000-00-00000" value={(values.footerBusinessNumber as string) ?? ""}
            onChange={(e) => onChange("footerBusinessNumber", e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">대표자</Label>
          <Input placeholder="예: 김원장" value={(values.footerCEOName as string) ?? ""}
            onChange={(e) => onChange("footerCEOName", e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">의료기관 신고번호</Label>
          <Input placeholder="예: 제2024-강남-0001호" value={(values.footerLicenseNumber as string) ?? ""}
            onChange={(e) => onChange("footerLicenseNumber", e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">대표번호</Label>
          <Input placeholder="예: 02-1234-5678" value={(values.footerPhone as string) ?? ""}
            onChange={(e) => onChange("footerPhone", e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm font-medium">주소</Label>
          <Input placeholder="예: 서울특별시 강남구 테헤란로 123" value={(values.footerAddress as string) ?? ""}
            onChange={(e) => onChange("footerAddress", e.target.value)} className="rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        <Label className="text-sm font-medium">정책 링크</Label>

        {/* 이용약관 */}
        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">이용약관</p>
              <p className="text-xs text-muted-foreground">서비스 이용약관 페이지 링크</p>
            </div>
            <Switch checked={(values.footerTermsToggle as boolean) ?? false}
              onCheckedChange={(c) => onChange("footerTermsToggle", c)} />
          </div>
          <Input placeholder="예: https://example.com/terms"
            value={(values.footerTermsUrl as string) ?? ""}
            onChange={(e) => onChange("footerTermsUrl", e.target.value)}
            disabled={!((values.footerTermsToggle as boolean) ?? false)}
            className="rounded-lg text-sm" />
        </div>

        {/* 개인정보처리방침 — 기존 토글 흡수 + URL 추가 */}
        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">개인정보처리방침</p>
              <p className="text-xs text-muted-foreground">개인정보 처리 정책 페이지 링크</p>
            </div>
            <Switch checked={(values.footerPrivacyToggle as boolean) ?? true}
              onCheckedChange={(c) => onChange("footerPrivacyToggle", c)} />
          </div>
          <Input placeholder="예: https://example.com/privacy"
            value={(values.footerPrivacyUrl as string) ?? ""}
            onChange={(e) => onChange("footerPrivacyUrl", e.target.value)}
            disabled={!((values.footerPrivacyToggle as boolean) ?? true)}
            className="rounded-lg text-sm" />
        </div>

        {/* 이메일수집거부 */}
        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">이메일수집거부</p>
              <p className="text-xs text-muted-foreground">이메일 무단수집 거부 페이지 링크</p>
            </div>
            <Switch checked={(values.footerEmailRefuseToggle as boolean) ?? false}
              onCheckedChange={(c) => onChange("footerEmailRefuseToggle", c)} />
          </div>
          <Input placeholder="예: https://example.com/email-refuse"
            value={(values.footerEmailRefuseUrl as string) ?? ""}
            onChange={(e) => onChange("footerEmailRefuseUrl", e.target.value)}
            disabled={!((values.footerEmailRefuseToggle as boolean) ?? false)}
            className="rounded-lg text-sm" />
        </div>

        {/* 비급여진료비용안내 */}
        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">비급여진료비용안내</p>
              <p className="text-xs text-muted-foreground">비급여 진료비용 고지 페이지 링크</p>
            </div>
            <Switch checked={(values.footerNonCoveredToggle as boolean) ?? false}
              onCheckedChange={(c) => onChange("footerNonCoveredToggle", c)} />
          </div>
          <Input placeholder="예: https://example.com/non-covered-fees"
            value={(values.footerNonCoveredUrl as string) ?? ""}
            onChange={(e) => onChange("footerNonCoveredUrl", e.target.value)}
            disabled={!((values.footerNonCoveredToggle as boolean) ?? false)}
            className="rounded-lg text-sm" />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">소셜 미디어</Label>

        {/* 네이버 블로그 */}
        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">네이버 블로그</p>
              <p className="text-xs text-muted-foreground">네이버 블로그 페이지 링크</p>
            </div>
            <Switch checked={(values.footerSocialBlogToggle as boolean) ?? false}
              onCheckedChange={(c) => onChange("footerSocialBlogToggle", c)} />
          </div>
          <Input placeholder="예: https://blog.naver.com/your_blog_id"
            value={(values.footerSocialBlogUrl as string) ?? ""}
            onChange={(e) => onChange("footerSocialBlogUrl", e.target.value)}
            disabled={!((values.footerSocialBlogToggle as boolean) ?? false)}
            className="rounded-lg text-sm" />
        </div>

        {/* 유튜브 */}
        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">유튜브</p>
              <p className="text-xs text-muted-foreground">유튜브 채널 링크</p>
            </div>
            <Switch checked={(values.footerSocialYoutubeToggle as boolean) ?? false}
              onCheckedChange={(c) => onChange("footerSocialYoutubeToggle", c)} />
          </div>
          <Input placeholder="예: https://youtube.com/@your_channel"
            value={(values.footerSocialYoutubeUrl as string) ?? ""}
            onChange={(e) => onChange("footerSocialYoutubeUrl", e.target.value)}
            disabled={!((values.footerSocialYoutubeToggle as boolean) ?? false)}
            className="rounded-lg text-sm" />
        </div>

        {/* 인스타그램 */}
        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">인스타그램</p>
              <p className="text-xs text-muted-foreground">인스타그램 프로필 링크</p>
            </div>
            <Switch checked={(values.footerSocialInstagramToggle as boolean) ?? false}
              onCheckedChange={(c) => onChange("footerSocialInstagramToggle", c)} />
          </div>
          <Input placeholder="예: https://instagram.com/your_account"
            value={(values.footerSocialInstagramUrl as string) ?? ""}
            onChange={(e) => onChange("footerSocialInstagramUrl", e.target.value)}
            disabled={!((values.footerSocialInstagramToggle as boolean) ?? false)}
            className="rounded-lg text-sm" />
        </div>

        {/* 카카오 채널 */}
        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">카카오 채널</p>
              <p className="text-xs text-muted-foreground">카카오톡 채널 (플러스친구) 링크</p>
            </div>
            <Switch checked={(values.footerSocialKakaoChannelToggle as boolean) ?? false}
              onCheckedChange={(c) => onChange("footerSocialKakaoChannelToggle", c)} />
          </div>
          <Input placeholder="예: https://pf.kakao.com/_xxxxxx"
            value={(values.footerSocialKakaoChannelUrl as string) ?? ""}
            onChange={(e) => onChange("footerSocialKakaoChannelUrl", e.target.value)}
            disabled={!((values.footerSocialKakaoChannelToggle as boolean) ?? false)}
            className="rounded-lg text-sm" />
        </div>

        {/* 카카오 톡톡 */}
        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">카카오 톡톡</p>
              <p className="text-xs text-muted-foreground">카카오 톡톡 1:1 상담 링크</p>
            </div>
            <Switch checked={(values.footerSocialKakaoTalkToggle as boolean) ?? false}
              onCheckedChange={(c) => onChange("footerSocialKakaoTalkToggle", c)} />
          </div>
          <Input placeholder="예: https://talk.kakao.com/..."
            value={(values.footerSocialKakaoTalkUrl as string) ?? ""}
            onChange={(e) => onChange("footerSocialKakaoTalkUrl", e.target.value)}
            disabled={!((values.footerSocialKakaoTalkToggle as boolean) ?? false)}
            className="rounded-lg text-sm" />
        </div>
      </div>

      {/* ── 추가한 소셜 미디어 섹션 ── */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">추가한 소셜 미디어</Label>
        <div className="space-y-2 rounded-xl border border-border p-3">
          {readExtras(values).map(extra => {
            const platform = SOCIAL_PLATFORMS.find(p => p.key === extra.platform) ?? SOCIAL_PLATFORMS[4]
            const Icon = platform.Icon
            const isEditing = editingId === extra.id
            return (
              <div key={extra.id} className="space-y-2 rounded-lg border border-border p-2">
                {!isEditing ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={16} />
                        <span className="text-sm font-medium">{extra.label}</span>
                      </div>
                      <Switch
                        checked={extra.enabled}
                        onCheckedChange={() => toggleExtra(values, onChange, extra.id)}
                      />
                    </div>
                    {extra.url && <p className="text-xs text-muted-foreground truncate">{extra.url}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(extra.id)
                          setFormPlatform(extra.platform)
                          setFormLabel(extra.label)
                          setFormUrl(extra.url)
                        }}
                        className="text-xs px-2 py-1 rounded border border-border hover:bg-muted"
                      >
                        편집
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("정말 삭제하시겠습니까?")) {
                            removeExtra(values, onChange, extra.id)
                          }
                        }}
                        className="text-xs px-2 py-1 rounded border border-border text-destructive hover:bg-destructive/10"
                      >
                        삭제
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs">플랫폼</Label>
                    <div className="flex gap-1 flex-wrap">
                      {SOCIAL_PLATFORMS.map(p => {
                        const PIcon = p.Icon
                        const isActive = formPlatform === p.key
                        return (
                          <button
                            key={p.key}
                            onClick={() => {
                              setFormPlatform(p.key)
                              setFormLabel(p.label)
                            }}
                            className={"flex items-center gap-1 px-2 py-1 rounded border text-xs " + (isActive ? "border-primary bg-primary/10" : "border-border")}
                          >
                            <PIcon size={14} />
                            {p.label}
                          </button>
                        )
                      })}
                    </div>
                    <Label className="text-xs">이름</Label>
                    <Input
                      placeholder="예: Facebook"
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                      className="rounded-lg text-sm"
                    />
                    <Label className="text-xs">URL</Label>
                    <Input
                      placeholder="예: https://facebook.com/..."
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      className="rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!formLabel.trim() || !formUrl.trim()) return
                          updateExtra(values, onChange, extra.id, {
                            platform: formPlatform,
                            label: formLabel.trim(),
                            url: formUrl.trim(),
                          })
                          setEditingId(null)
                          setFormPlatform("facebook")
                          setFormLabel("Facebook")
                          setFormUrl("")
                        }}
                        className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null)
                          setFormPlatform("facebook")
                          setFormLabel("Facebook")
                          setFormUrl("")
                        }}
                        className="text-xs px-3 py-1.5 rounded border border-border"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {showAddForm && (
            <div className="space-y-2 rounded-lg border border-border p-2 bg-muted/30">
              <Label className="text-xs">플랫폼</Label>
              <div className="flex gap-1 flex-wrap">
                {SOCIAL_PLATFORMS.map(p => {
                  const PIcon = p.Icon
                  const isActive = formPlatform === p.key
                  return (
                    <button
                      key={p.key}
                      onClick={() => {
                        setFormPlatform(p.key)
                        setFormLabel(p.label)
                      }}
                      className={"flex items-center gap-1 px-2 py-1 rounded border text-xs " + (isActive ? "border-primary bg-primary/10" : "border-border")}
                    >
                      <PIcon size={14} />
                      {p.label}
                    </button>
                  )
                })}
              </div>
              <Label className="text-xs">이름</Label>
              <Input
                placeholder="예: Facebook"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                className="rounded-lg text-sm"
              />
              <Label className="text-xs">URL</Label>
              <Input
                placeholder="예: https://facebook.com/..."
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                className="rounded-lg text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!formLabel.trim() || !formUrl.trim()) return
                    addExtra(values, onChange, {
                      platform: formPlatform,
                      label: formLabel.trim(),
                      url: formUrl.trim(),
                      enabled: true,
                    })
                    setShowAddForm(false)
                    setFormPlatform("facebook")
                    setFormLabel("Facebook")
                    setFormUrl("")
                  }}
                  className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setFormPlatform("facebook")
                    setFormLabel("Facebook")
                    setFormUrl("")
                  }}
                  className="text-xs px-3 py-1.5 rounded border border-border"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {!showAddForm && (
            <button
              onClick={() => {
                setEditingId(null)
                setShowAddForm(true)
              }}
              className="w-full py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted"
            >
              + 소셜 미디어 추가
            </button>
          )}
        </div>
      </div>

      {/* ── 브랜드 로고 섹션 ── */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">브랜드 로고</Label>
        <div className="space-y-3 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">로고 표시</p>
              <p className="text-xs text-muted-foreground">푸터에 브랜드 로고를 표시합니다</p>
            </div>
            <Switch checked={(values.footerLogoToggle as boolean) ?? false}
              onCheckedChange={(c) => onChange("footerLogoToggle", c)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">로고 이미지</Label>
            <ImageUploadZone
              dataUrl={(values.footerLogoImage as string) ?? ""}
              onUpload={(url) => onChange("footerLogoImage", url)}
              onClear={() => onChange("footerLogoImage", "")}
              label="로고 이미지" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">크기</Label>
            <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium w-fit">
              {(["sm", "md", "lg"] as const).map((sz, i) => {
                const active = ((values.footerLogoSize as string) || "md") === sz
                const labelMap = { sm: "S", md: "M", lg: "L" } as const
                return (
                  <button key={sz} type="button"
                    onClick={() => onChange("footerLogoSize", sz)}
                    className={cn("px-4 py-1.5 transition-colors",
                      i > 0 && "border-l border-border",
                      active ? "bg-neutral-900 text-white" : "text-muted-foreground hover:bg-muted")}>
                    {labelMap[sz]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 카피라이트 섹션 ── */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">카피라이트</Label>
        <div className="space-y-3 rounded-xl border border-border p-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">표시 방식</Label>
            <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium w-fit">
              {(["auto", "custom"] as const).map((mode, i) => {
                const active = ((values.footerCopyrightMode as string) || "auto") === mode
                const labelMap = { auto: "자동 (병원명 기반)", custom: "직접 입력" } as const
                return (
                  <button key={mode} type="button"
                    onClick={() => onChange("footerCopyrightMode", mode)}
                    className={cn("px-3 py-1.5 transition-colors",
                      i > 0 && "border-l border-border",
                      active ? "bg-neutral-900 text-white" : "text-muted-foreground hover:bg-muted")}>
                    {labelMap[mode]}
                  </button>
                )
              })}
            </div>
          </div>
          <Input placeholder="예: © 2026 TATOA Clinic. All rights reserved."
            value={(values.footerCopyrightText as string) ?? ""}
            onChange={(e) => onChange("footerCopyrightText", e.target.value)}
            disabled={((values.footerCopyrightMode as string) || "auto") !== "custom"}
            className="rounded-lg text-sm" />
        </div>
      </div>

      {/* ── 디자인 (배경색) 섹션 ── */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">디자인</Label>
        <div className="rounded-xl border border-border p-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex-none" style={{
              background: ((values.footerBgColor as string) || "dark") === "dark"
                ? "linear-gradient(135deg,rgba(201,168,92,0.3) 0%,#0e0c09 100%)"
                : "linear-gradient(135deg,rgba(180,180,180,0.2) 0%,#ffffff 100%)",
              border: "1px solid rgba(128,128,128,0.2)",
            }} />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">푸터 배경</p>
              <p className="text-[10px] text-muted-foreground">밝은 톤 또는 어두운 톤 선택</p>
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-medium">
              <button type="button" onClick={() => onChange("footerBgColor", "dark")}
                className={cn("px-3 py-1.5 transition-colors",
                  ((values.footerBgColor as string) || "dark") === "dark" ? "bg-neutral-900 text-white" : "text-muted-foreground hover:bg-muted")}>
                블랙
              </button>
              <button type="button" onClick={() => onChange("footerBgColor", "light")}
                className={cn("px-3 py-1.5 border-l border-border transition-colors",
                  ((values.footerBgColor as string) || "dark") === "light" ? "bg-white text-neutral-900" : "text-muted-foreground hover:bg-muted")}>
                화이트
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
function GalleryEditor({ values, onChange }: { values: Record<string, FieldValue>; onChange: (k: string, v: FieldValue) => void }) {
  const isDark = ((values.galleryBg as string) || "dark") !== "light"
  const images = parseGalleryImages(values.galleryImages)
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])

  const saveImages = (imgs: GalleryImage[]) => onChange("galleryImages", JSON.stringify(imgs))

  const addImage = () => {
    const next: GalleryImage = { id: `gal${Date.now()}`, url: "", label: "" }
    saveImages([...images, next])
  }

  const removeImage = (i: number) => saveImages(images.filter((_, idx) => idx !== i))

  const moveUp = (i: number) => {
    if (i === 0) return
    const arr = [...images]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; saveImages(arr)
  }

  const moveDown = (i: number) => {
    if (i === images.length - 1) return
    const arr = [...images]; [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; saveImages(arr)
  }

  const patch = (i: number, u: Partial<GalleryImage>) =>
    saveImages(images.map((img, idx) => idx === i ? { ...img, ...u } : img))

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, i: number) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    patch(i, { url: URL.createObjectURL(file) })
    e.target.value = ""
  }

  return (
    <div className="space-y-6">

      {/* ── 배경 테마 ── */}
      <div className="space-y-3">
        <InfoSubLabel title="배경 테마" />
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="h-8 w-8 rounded-lg flex-none" style={{
            background: isDark
              ? "linear-gradient(135deg,rgba(201,168,92,0.3) 0%,#0e0c09 100%)"
              : "linear-gradient(135deg,rgba(180,180,180,0.2) 0%,#ffffff 100%)",
            border: "1px solid rgba(128,128,128,0.2)",
          }} />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">배경 테마</p>
            <p className="text-[10px] text-muted-foreground">{isDark ? "블랙 (다크)" : "화이트 (라이트)"}</p>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-medium">
            <button type="button" onClick={() => onChange("galleryBg", "dark")}
              className={cn("px-3 py-1.5 transition-colors", isDark ? "bg-neutral-900 text-white" : "text-muted-foreground hover:bg-muted")}>
              블랙
            </button>
            <button type="button" onClick={() => onChange("galleryBg", "light")}
              className={cn("px-3 py-1.5 border-l border-border transition-colors", !isDark ? "bg-white text-neutral-900" : "text-muted-foreground hover:bg-muted")}>
              화이트
            </button>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── 섹션 타이틀 ── */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">1</span>
          <span className="text-sm font-medium">섹션 타이틀</span>
        </div>
        <Input placeholder="예: 병원 둘러보기" value={(values.title as string) ?? ""}
          onChange={(e) => onChange("title", e.target.value)} className="rounded-xl" />
        <FontControls prefix="title" group="eyebrow" values={values} onChange={onChange} sizesOverride={GALLERY_SIZE_OPTIONS} />
      </div>

      <Separator />

      {/* ── 갤러리 이미지 ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <InfoSubLabel title="갤러리 이미지" />
          <button type="button" onClick={addImage}
            className="flex items-center gap-1 rounded-xl border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Plus className="h-3 w-3" />이미지 추가
          </button>
        </div>

        {images.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border py-10 text-center">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">이미지가 없습니다.</p>
            <p className="text-[10px] text-muted-foreground mt-1">위 추가 버튼을 눌러 이미지를 등록하세요.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {images.map((img, i) => (
              <div key={img.id} className="rounded-xl border border-border bg-card p-3 space-y-3">
                {/* Header row */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1" />
                  {/* Move buttons */}
                  <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                    className="h-6 w-6 flex items-center justify-center rounded border border-border text-[11px] disabled:opacity-30 hover:bg-muted transition-colors">▲</button>
                  <button type="button" onClick={() => moveDown(i)} disabled={i === images.length - 1}
                    className="h-6 w-6 flex items-center justify-center rounded border border-border text-[11px] disabled:opacity-30 hover:bg-muted transition-colors">▼</button>
                  <button type="button" onClick={() => removeImage(i)}
                    className="h-6 w-6 flex items-center justify-center rounded border border-red-200 text-red-400 text-[11px] hover:bg-red-50 transition-colors">✕</button>
                </div>

                {/* Image preview + upload */}
                <div className="flex gap-3 items-start">
                  <div className="h-20 w-28 rounded-lg overflow-hidden bg-muted shrink-0 border border-border relative cursor-pointer"
                    onClick={() => fileRefs.current[i]?.click()}>
                    {img.url ? (
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">클릭하여 업로드</span>
                      </div>
                    )}
                    <input
                      ref={el => { fileRefs.current[i] = el }}
                      type="file" accept="image/*" className="hidden"
                      onChange={(e) => handleFile(e, i)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">이미지 라벨 (선택)</p>
                      <Input placeholder="예: 상담실" value={img.label ?? ""}
                        onChange={(e) => patch(i, { label: e.target.value })}
                        className="rounded-lg h-8 text-xs" />
                    </div>
                    <button type="button" onClick={() => fileRefs.current[i]?.click()}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-muted transition-colors w-full justify-center">
                      <Upload className="h-3 w-3" />{img.url ? "이미지 변경" : "이미지 업로드"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionEditor({ sectionId, values, onChange, branchId }: {
  sectionId: HomeSectionId; values: Record<string, FieldValue>; onChange: (k: string, v: FieldValue) => void; branchId: string
}) {
  const iconCfg = parseIconConfig(values.iconConfig)
  const inner = (() => {
    switch (sectionId) {
      case "hero":        return <HeroEditor        values={values} onChange={onChange} />
      case "events":      return <EventsEditor      values={values} onChange={onChange} />
      case "philosophy":  return <PhilosophyEditor  values={values} onChange={onChange} />
      case "doctors":     return <LinkedDataEditor  values={values} onChange={onChange} type="doctors"   branchId={branchId} />
      case "equipment":   return <LinkedDataEditor  values={values} onChange={onChange} type="equipment" branchId={branchId} />
      case "gallery":     return <GalleryEditor     values={values} onChange={onChange} />
      case "strengths":   return <StrengthsEditor   values={values} onChange={onChange} />
      case "branch-info": return <BranchInfoEditor  values={values} onChange={onChange} />
      case "location":    return <InfoEditor         values={values} onChange={onChange} />
      case "footer":      return <FooterEditor      values={values} onChange={onChange} />
      default:            return null
    }
  })()
  return (
    <div>
      {inner}
      <div style={{ padding: "12px 16px 10px", borderTop: "1px solid #f3f3f3", marginTop: 6 }}>
        <p style={{ fontSize: 10, color: "#bbb", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" as const, marginBottom: 8 }}>섹션 아이콘</p>
        <IconField value={iconCfg} onChange={cfg => onChange("iconConfig", JSON.stringify(cfg))} label="" />
      </div>
    </div>
  )
}

// ─── Non-home placeholder ─────────────────────────────────────────────────────

function PagePlaceholder({ page }: { page: PageMeta }) {
  const isAuto = page.status === "auto"
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl mb-4", isAuto ? "bg-success/10" : "bg-muted")}>
        {isAuto ? <CheckCircle2 className="h-8 w-8 text-success" /> : <Lock className="h-8 w-8 text-muted-foreground" />}
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-1">{page.label} 페이지</h2>
      {isAuto ? (
        <>
          <p className="text-sm text-muted-foreground max-w-sm">{page.description}</p>
          <div className="mt-4 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success font-medium">
            지점 정보 입력 완료 시 자동으로 구성됩니다
          </div>
          <Link href="/admin/branch/info" className="mt-3">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
              <Edit3 className="h-3.5 w-3.5" />지점 정보 편집
            </Button>
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground max-w-sm">{page.description}</p>
          <Badge variant="outline" className="mt-3 text-xs bg-warning/10 text-warning-foreground border-warning/20">
            {page.statusLabel}
          </Badge>
        </>
      )}
    </div>
  )
}

// ─── 오시는 길 폰 스크린 ────────────────────────────────────────────────────

function DirectionsPhoneScreen({
  homeData, branchName, branchId, onNavigate, maxHeight = 460,
}: {
  homeData: Record<string, Record<string, FieldValue>>
  branchName: string
  branchId: string
  onNavigate?: (page: PageId) => void
  maxHeight?: number
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", maxHeight, background: "#0e0c09" }}>
      <div style={{ maxHeight, overflowY: "auto", scrollbarWidth: "none" as const, background: "inherit" }}>
        {/* 네비게이션 바 */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "rgba(8,6,3,0.92)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          boxShadow: [
            "inset 0 1px 0 rgba(255,255,255,0.20)",
            "inset 1px 0 0 rgba(255,255,255,0.10)",
            "inset 0 -1px 0 rgba(255,255,255,0.04)",
            "0 0 0 1px rgba(255,255,255,0.07)",
            "0 2px 12px rgba(0,0,0,0.35)",
          ].join(","),
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 17, height: 17, border: "1px solid rgba(255,255,255,0.55)", borderRadius: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)",
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: "system-ui", lineHeight: 1 }}>T</span>
            </div>
            <div>
              <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: "0.12em", color: "#fff", lineHeight: 1.1, fontFamily: "system-ui" }}>TATOA</p>
              <p style={{ fontSize: 5, fontWeight: 300, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", lineHeight: 1, fontFamily: "system-ui" }}>DERMATOLOGY</p>
            </div>
          </div>
          <button type="button" onClick={() => setMenuOpen(true)}
            style={{ background: "none", border: "none", padding: "3px 0", cursor: "pointer", lineHeight: 0 }}>
            <HamburgerIcon size={14} />
          </button>
        </div>

        {/* 컨텐츠: 지점 정보 섹션 재사용 */}
        <SectionPreviewBlock
          sectionId="location"
          values={(homeData["location"] ?? {}) as Record<string, FieldValue>}
          branchName={branchName}
          branchId={branchId}
          isFullscreen={false}
          device="mobile"
          isPageView
        />
      </div>

      {/* 메뉴 드로어 (우측 상단 펼침) */}
      {menuOpen && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.28)",
        }} onClick={() => setMenuOpen(false)}>
          <div style={{
            position: "absolute", top: 0, right: 0,
            width: "70%", height: "80%",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
            borderRadius: "0 0 0 16px",
            display: "flex", flexDirection: "column" as const,
            boxShadow: "-4px 4px 24px rgba(0,0,0,0.22)",
            overflow: "hidden",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px 8px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", color: "#111", fontFamily: "system-ui" }}>TATOA</span>
              <button type="button" onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#888", lineHeight: 1, padding: "2px" }}>✕</button>
            </div>
            <div style={{ padding: "4px 6px", flex: 1 }}>
              {([
                { label: "홈",      pageId: "home"       as PageId, active: false },
                { label: "시술안내", pageId: "treatments" as PageId, active: false },
                { label: "예약하기", pageId: "booking"    as PageId, active: false },
                { label: "오시는길", pageId: "directions" as PageId, active: true  },
              ] as const).map(({ label, pageId, active }) => (
                <button key={label} type="button"
                  onClick={() => { onNavigate?.(pageId); setMenuOpen(false) }}
                  style={{
                    display: "block", width: "100%", textAlign: "left" as const,
                    padding: "7px 8px", borderRadius: 5,
                    background: active ? "rgba(0,0,0,0.06)" : "transparent",
                    marginBottom: 1, border: "none", cursor: "pointer",
                    fontSize: 8, fontWeight: active ? 600 : 400,
                    color: active ? "#111" : "#555", fontFamily: "system-ui",
                  }}>
                  {label}
                </button>
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
      )}
    </div>
  )
}

// ─── 시술안내 폰 스크린 (다크 네비 + 메뉴 드로어 + 컨텐츠) ─────────────────

function TreatmentsPhoneScreen({
  values, branchId, scale = 1, maxHeight = 460, borderRadius = 24, onNavigate,
}: {
  values: Record<string, FieldValue>
  branchId: string
  scale?: number
  maxHeight?: number
  borderRadius?: number
  onNavigate?: (page: PageId) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ position: "relative", borderRadius, overflow: "hidden", maxHeight, background: "#0e0c09" }}>
      {/* ── 스크롤 영역 ── */}
      <div style={{ maxHeight, overflowY: "auto", scrollbarWidth: "none" as const, background: "inherit" }}>

        {/* 다크 글래스모피즘 네비게이션 바 */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "rgba(8,6,3,0.92)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          boxShadow: [
            "inset 0 1px 0 rgba(255,255,255,0.20)",
            "inset 1px 0 0 rgba(255,255,255,0.10)",
            "inset 0 -1px 0 rgba(255,255,255,0.04)",
            "0 0 0 1px rgba(255,255,255,0.07)",
            "0 2px 12px rgba(0,0,0,0.35)",
          ].join(","),
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: `${6 * scale}px ${12 * scale}px`,
        }}>
          {/* 왼쪽: T 박스 + TATOA + DERMATOLOGY */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 * scale }}>
            <div style={{
              width: 17 * scale, height: 17 * scale,
              border: "1px solid rgba(255,255,255,0.55)",
              borderRadius: 2 * scale,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.25), 0 0 5px rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.04)",
            }}>
              <span style={{ fontSize: 9 * scale, fontWeight: 700, color: "#ffffff", fontFamily: "system-ui", lineHeight: 1 }}>T</span>
            </div>
            <div>
              <p style={{ fontSize: 7.5 * scale, fontWeight: 600, letterSpacing: "0.12em", color: "#ffffff", lineHeight: 1.1, fontFamily: "system-ui" }}>TATOA</p>
              <p style={{ fontSize: 5 * scale, fontWeight: 300, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", lineHeight: 1, fontFamily: "system-ui" }}>DERMATOLOGY</p>
            </div>
          </div>
          {/* 오른쪽: 햄버거 */}
          <button type="button" onClick={() => setMenuOpen(true)}
            style={{ background: "none", border: "none", padding: `${3 * scale}px 0`, cursor: "pointer", lineHeight: 0 }}>
            <HamburgerIcon size={14 * scale} />
          </button>
        </div>

        {/* 컨텐츠 */}
        <PreviewTreatments v={values} branchId={branchId} />
      </div>

      {/* ── 메뉴 드로어 (우측 상단 펼침) ── */}
      {menuOpen && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.28)",
        }} onClick={() => setMenuOpen(false)}>
          <div style={{
            position: "absolute", top: 0, right: 0,
            width: "70%", height: "80%",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
            borderRadius: `0 0 0 ${16 * scale}px`,
            display: "flex", flexDirection: "column" as const,
            boxShadow: "-4px 4px 24px rgba(0,0,0,0.22)",
            overflow: "hidden",
          }} onClick={e => e.stopPropagation()}>
            {/* 드로어 헤더 */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: `${10 * scale}px ${12 * scale}px ${8 * scale}px`,
              borderBottom: "1px solid rgba(0,0,0,0.07)",
            }}>
              <span style={{ fontSize: 8 * scale, fontWeight: 700, letterSpacing: "0.12em", color: "#111", fontFamily: "system-ui" }}>TATOA</span>
              <button type="button" onClick={() => setMenuOpen(false)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 10 * scale, color: "#888", lineHeight: 1, padding: `${2 * scale}px`,
              }}>✕</button>
            </div>
            {/* 메뉴 아이템 */}
            <div style={{ padding: `${4 * scale}px ${6 * scale}px`, flex: 1 }}>
              {[
                { label: "홈",      pageId: "home"       as PageId, active: false },
                { label: "시술안내", pageId: "treatments" as PageId, active: true  },
                { label: "예약하기", pageId: "booking"    as PageId, active: false },
                { label: "오시는길", pageId: "directions" as PageId, active: false },
              ].map(({ label, pageId, active }) => (
                <button key={label} type="button"
                  onClick={() => { onNavigate?.(pageId); setMenuOpen(false) }}
                  style={{
                    display: "block", width: "100%", textAlign: "left" as const,
                    padding: `${7 * scale}px ${8 * scale}px`,
                    borderRadius: 5 * scale,
                    background: active ? "rgba(0,0,0,0.06)" : "transparent",
                    marginBottom: 1 * scale,
                    border: "none", cursor: "pointer",
                    fontSize: 8 * scale, fontWeight: active ? 600 : 400,
                    color: active ? "#111" : "#555",
                    fontFamily: "system-ui",
                  }}>
                  {label}
                </button>
              ))}
            </div>
            {/* 언어 선택 */}
            <div style={{ padding: `${7 * scale}px ${10 * scale}px ${8 * scale}px`, borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <p style={{ fontSize: 6 * scale, color: "#999", marginBottom: 5 * scale, fontFamily: "system-ui", letterSpacing: "0.05em" }}>언어 선택</p>
              <div style={{ display: "flex", gap: 4 * scale, flexWrap: "wrap" as const }}>
                {["한국어", "English", "日本語", "中文"].map((lang, i) => (
                  <div key={lang} style={{
                    padding: `${3 * scale}px ${6 * scale}px`, borderRadius: 20,
                    background: i === 0 ? "#7a5c2e" : "transparent",
                    border: i === 0 ? "none" : "1px solid rgba(0,0,0,0.18)",
                    fontSize: 6 * scale, color: i === 0 ? "#fff" : "#666",
                    fontFamily: "system-ui",
                  }}>{lang}</div>
                ))}
              </div>
            </div>
            {/* 상담하기 CTA */}
            <div style={{ padding: `0 ${10 * scale}px ${10 * scale}px` }}>
              <div style={{
                background: "linear-gradient(135deg, #8B6E3A 0%, #6b5228 100%)",
                borderRadius: 8 * scale, padding: `${7 * scale}px ${10 * scale}px`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                boxShadow: "0 2px 6px rgba(122,92,46,0.30)",
              }}>
                <span style={{ fontSize: 7 * scale, fontWeight: 600, color: "#fff", letterSpacing: "0.06em", fontFamily: "system-ui" }}>상담하기</span>
                <MessageCircle size={8 * scale} color="rgba(255,255,255,0.85)" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 시술안내 전체화면 미리보기 오버레이 ─────────────────────────────────────

function TreatmentsFullscreenOverlay({
  values, branchId, onClose,
}: {
  values: Record<string, FieldValue>
  branchId: string
  onClose: () => void
}) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile")

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-sm flex flex-col">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-3 bg-neutral-900/70 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">시술안내</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/55">전체 미리보기</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/15 overflow-hidden text-xs">
            <button onClick={() => setDevice("mobile")} className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 transition-colors",
              device === "mobile" ? "bg-white/20 text-white" : "text-white/40 hover:bg-white/10 hover:text-white/70"
            )}><Smartphone className="h-3 w-3" />모바일</button>
            <button onClick={() => setDevice("desktop")} className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 border-l border-white/15 transition-colors",
              device === "desktop" ? "bg-white/20 text-white" : "text-white/40 hover:bg-white/10 hover:text-white/70"
            )}><Monitor className="h-3 w-3" />데스크톱</button>
          </div>
          <span className="text-[10px] text-white/25 hidden sm:block">ESC</span>
          <button onClick={onClose}
            className="flex items-center justify-center h-7 w-7 rounded-lg border border-white/15 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Preview area ── */}
      <div className="flex-1 overflow-y-auto flex justify-center items-start py-10 px-4">

        {device === "mobile" ? (
          <div style={{ zoom: 360 / 220, flexShrink: 0 }}>
            <div style={{
              width: 220, borderRadius: 36,
              background: "linear-gradient(145deg,#2a2a2a 0%,#1a1a1a 100%)",
              padding: "14px 6px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}>
              <div style={{ width: 72, height: 22, borderRadius: 12, background: "#000", margin: "0 auto 10px" }} />
              <TreatmentsPhoneScreen values={values} branchId={branchId} maxHeight={460} borderRadius={24} />
              <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
                <div style={{ height: 4, width: 32, borderRadius: 4, background: "rgba(255,255,255,0.3)" }} />
              </div>
            </div>
          </div>
        ) : (
          /* ── Desktop treatments fullscreen: same phone frame, zoom 1.8 ── */
          <div style={{ zoom: 1.8, flexShrink: 0 }}>
            <div style={{
              width: 220, borderRadius: 36,
              background: "linear-gradient(145deg,#2a2a2a 0%,#1a1a1a 100%)",
              padding: "14px 6px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}>
              <div style={{ width: 72, height: 22, borderRadius: 12, background: "#000", margin: "0 auto 10px" }} />
              <TreatmentsPhoneScreen values={values} branchId={branchId} maxHeight={460} borderRadius={24} />
              <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
                <div style={{ height: 4, width: 32, borderRadius: 4, background: "rgba(255,255,255,0.3)" }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 시술안내 독립 페이지 에디터 ──────────────────────────────────────────────

// ─── DirectionsPreviewPage ────────────────────────────────────────────────────
function DirectionsPreviewPage({
  homeData, branchName, branchId, onNavigate, currentPageMeta,
}: {
  homeData: Record<string, Record<string, FieldValue>>
  branchName: string
  branchId: string
  onNavigate?: (page: PageId) => void
  currentPageMeta: PageMeta
}) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile")
  const DESKTOP_VIRTUAL_W = 1280
  const desktopColRef = useRef<HTMLDivElement>(null)
  const [desktopScale, setDesktopScale] = useState(() =>
    typeof window !== "undefined" ? Math.min(window.innerWidth * 0.50, 720) / DESKTOP_VIRTUAL_W : 500 / DESKTOP_VIRTUAL_W
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

  const PHONE_INNER_W  = 198
  const PHONE_VIRTUAL_W = 375
  const phoneScale = PHONE_INNER_W / PHONE_VIRTUAL_W

  return (
    <div className="grid gap-5 transition-[grid-template-columns] duration-300"
      style={{ gridTemplateColumns: device === "desktop" ? "1fr clamp(500px, 50vw, 720px)" : "1fr 260px" }}>
      <PagePlaceholder page={currentPageMeta} />
      <div className={cn("sticky top-20 space-y-3 self-start", device === "desktop" && "w-full")}>
        {/* Controls */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">미리보기</p>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setDevice("mobile")} className={cn("p-1.5 transition-colors", device === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Smartphone className="h-3 w-3" /></button>
            <button onClick={() => setDevice("desktop")} className={cn("p-1.5 transition-colors", device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Monitor className="h-3 w-3" /></button>
          </div>
        </div>
        {/* Mobile */}
        {device === "mobile" && (
          <div className="flex justify-center">
            <div className="w-[210px]">
              <div className="rounded-[30px] border-[6px] border-neutral-800 bg-neutral-800 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-center bg-neutral-800 py-1.5">
                  <div className="h-1.5 w-12 rounded-full bg-neutral-900" />
                </div>
                <div className="bg-black relative overflow-hidden" style={{ height: 429 }}>
                  <div style={{ width: PHONE_VIRTUAL_W + "px", transform: "scale(" + phoneScale + ")", transformOrigin: "top left" }}>
                    <DirectionsPhoneScreen homeData={homeData} branchName={branchName} branchId={branchId} onNavigate={onNavigate} maxHeight={Math.round(429 / phoneScale)} />
                  </div>
                </div>
                <div className="flex justify-center bg-neutral-800 py-1.5">
                  <div className="h-1 w-8 rounded-full bg-neutral-600" />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Desktop */}
        {device === "desktop" && (
          <div className="rounded-xl border-2 border-foreground/20 bg-neutral-900 shadow-lg overflow-hidden w-full">
            <div className="flex items-center gap-2 border-b border-neutral-700 bg-neutral-800 px-3 py-2">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500/70" /><div className="h-2 w-2 rounded-full bg-yellow-500/70" /><div className="h-2 w-2 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 rounded bg-neutral-700 border border-neutral-600 px-2 py-1">
                <span className="text-[9px] text-neutral-400">tatoa.kr/{branchName.toLowerCase().replace(/\s/g, "")}/directions</span>
              </div>
              <span className="text-[9px] text-neutral-500 tabular-nums shrink-0">{DESKTOP_VIRTUAL_W}px · {Math.round(desktopScale * 100)}%</span>
            </div>
            <div ref={desktopColRef} className="relative overflow-hidden" style={{ paddingBottom: `${(9/16)*100}%` }}>
              <div className="absolute inset-0 overflow-hidden">
                <div className="overflow-y-auto" style={{ scrollbarWidth: "none", width: DESKTOP_VIRTUAL_W, height: `${((1/desktopScale)*100).toFixed(4)}%`, transform: `scale(${desktopScale.toFixed(4)})`, transformOrigin: "top left" }}>
                  <DirectionsPhoneScreen homeData={homeData} branchName={branchName} branchId={branchId} onNavigate={onNavigate} />
                </div>
                <DesktopNavBar onMenuToggle={() => {}} onNavigate={onNavigate} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TreatmentsPage ───────────────────────────────────────────────────────────
function TreatmentsPage({
  values,
  onChange,
  branchId,
  onNavigate,
}: {
  values: Record<string, FieldValue>
  onChange: (k: string, v: FieldValue) => void
  branchId: string
  onNavigate?: (page: PageId) => void
}) {
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile")
  const branchName = branches.find(b => b.id === branchId)?.name ?? ""

  const DESKTOP_VIRTUAL_W = 1280
  const desktopColRef = useRef<HTMLDivElement>(null)
  const [desktopScale, setDesktopScale] = useState(() =>
    typeof window !== "undefined" ? Math.min(window.innerWidth * 0.50, 720) / DESKTOP_VIRTUAL_W : 500 / DESKTOP_VIRTUAL_W
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

  const PHONE_INNER_W  = 198   // outer w-[210px] - border 6px×2
  const PHONE_VIRTUAL_W = 375
  const phoneScale = PHONE_INNER_W / PHONE_VIRTUAL_W

  return (
    <div
      className="grid gap-5 transition-[grid-template-columns] duration-300"
      style={{ gridTemplateColumns: device === "desktop" ? `1fr clamp(500px, 50vw, 720px)` : "1fr 260px" }}
    >

      {/* ── 좌측: 에디터 패널 (넓게) ── */}
      <Card className="rounded-2xl border-border bg-card shadow-sm self-start sticky top-20">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">시술안내 설정</CardTitle>
              <CardDescription className="text-[10px]">카테고리·텍스트·연동 데이터 관리</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 max-h-[calc(100vh-220px)] overflow-y-auto">
          <TreatmentsEditor values={values} onChange={onChange} />
        </CardContent>
      </Card>

      {/* ── 우측: 미리보기 패널 ── */}
      <div className={cn("sticky top-20 space-y-3 self-start", device === "desktop" && "w-full")}>
        {/* Controls bar */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">미리보기</p>
          <div className="flex items-center gap-1.5">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setDevice("mobile")} className={cn("p-1.5 transition-colors", device === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Smartphone className="h-3 w-3" /></button>
              <button onClick={() => setDevice("desktop")} className={cn("p-1.5 transition-colors", device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Monitor className="h-3 w-3" /></button>
            </div>
            <button onClick={() => setShowFullscreen(true)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground rounded-lg px-2 py-1 hover:bg-muted transition-colors">
              <Maximize2 className="h-3 w-3" />전체화면
            </button>
          </div>
        </div>

        {/* ── Mobile phone frame ── */}
        {device === "mobile" && (
          <div className="flex justify-center">
            <div className="w-[210px]">
              <div className="rounded-[30px] border-[6px] border-neutral-800 bg-neutral-800 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-center bg-neutral-800 py-1.5">
                  <div className="h-1.5 w-12 rounded-full bg-neutral-900" />
                </div>
                <div className="bg-black relative overflow-hidden" style={{ height: 429 }}>
                  <div style={{ width: PHONE_VIRTUAL_W + "px", transform: "scale(" + phoneScale + ")", transformOrigin: "top left" }}>
                    <TreatmentsPhoneScreen values={values} branchId={branchId} maxHeight={Math.round(429 / phoneScale)} borderRadius={0} onNavigate={onNavigate} />
                  </div>
                </div>
                <div className="flex justify-center bg-neutral-800 py-1.5">
                  <div className="h-1 w-8 rounded-full bg-neutral-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Desktop browser frame ── */}
        {device === "desktop" && (
          <div className="rounded-xl border-2 border-foreground/20 bg-neutral-900 shadow-lg overflow-hidden w-full">
            <div className="flex items-center gap-2 border-b border-neutral-700 bg-neutral-800 px-3 py-2">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500/70" />
                <div className="h-2 w-2 rounded-full bg-yellow-500/70" />
                <div className="h-2 w-2 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 rounded bg-neutral-700 border border-neutral-600 px-2 py-1">
                <span className="text-[9px] text-neutral-400">tatoa.kr/{branchName.toLowerCase().replace(/\s/g, "")}/treatments</span>
              </div>
              <span className="text-[9px] text-neutral-500 tabular-nums shrink-0">{DESKTOP_VIRTUAL_W}px · {Math.round(desktopScale * 100)}%</span>
            </div>
            <div ref={desktopColRef} className="relative overflow-hidden" style={{ paddingBottom: `${(9/16)*100}%` }}>
              <div className="absolute inset-0 overflow-hidden">
                <div className="overflow-y-auto" style={{ scrollbarWidth: "none", width: DESKTOP_VIRTUAL_W, height: `${((1/desktopScale)*100).toFixed(4)}%`, transform: `scale(${desktopScale.toFixed(4)})`, transformOrigin: "top left" }}>
                  <PreviewTreatments v={values} branchId={branchId} device="desktop" />
                </div>
                <DesktopNavBar onMenuToggle={() => {}} onNavigate={onNavigate} />
              </div>
            </div>
          </div>
        )}
      </div>

      {showFullscreen && (
        <TreatmentsFullscreenOverlay
          values={values}
          branchId={branchId}
          onClose={() => setShowFullscreen(false)}
        />
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── Live Site Preview Panel (iframe-based) ───────────────────────────────────
// This IS the test site — same URL as "테스트 열기" button.
// Changes in the editor auto-sync via BroadcastChannel within 300ms.

type LivePreviewPage = "home" | "treatments" | "booking" | "recruit"

const LIVE_PREVIEW_PAGES: Array<{ id: LivePreviewPage; label: string }> = [
  { id: "home",       label: "홈" },
  { id: "treatments", label: "시술안내" },
  { id: "booking",    label: "예약" },
  { id: "recruit",    label: "상시채용" },
]

function LiveSitePreviewPanel({
  branchId,
  device,
  onDeviceChange,
  activePage,
  onPageChange,
  hasDraft,
  onGeneratePreview,
  isGenerating,
}: {
  branchId: string
  device: "mobile" | "desktop"
  onDeviceChange: (d: "mobile" | "desktop") => void
  activePage: LivePreviewPage
  onPageChange: (p: LivePreviewPage) => void
  hasDraft: boolean
  onGeneratePreview: () => void
  isGenerating: boolean
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const pagePath: Record<LivePreviewPage, string> = {
    home:       `/preview/site/${branchId}`,
    treatments: `/preview/site/${branchId}/treatments`,
    booking:    `/preview/site/${branchId}/booking`,
    recruit:    `/preview/site/${branchId}/recruit`,
  }

  // Reload iframe when page tab changes
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = pagePath[activePage]
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, branchId])

  const mobileW     = 375
  const desktopW    = 1280
  const containerRef = useRef<HTMLDivElement>(null)
  const [panelW, setPanelW] = useState(580)

  // Measure the actual panel width so the desktop scale is always correct
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setPanelW(entry.contentRect.width)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const desktopScale = Math.min(1, panelW / desktopW)

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        {/* Page tabs */}
        <div className="flex items-center gap-0.5 bg-muted rounded-xl p-0.5">
          {LIVE_PREVIEW_PAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => onPageChange(p.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activePage === p.id
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Device + refresh */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDeviceChange("mobile")}
            className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-all",
              device === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
            title="모바일"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDeviceChange("desktop")}
            className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-all",
              device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
            title="데스크톱"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <button
            onClick={() => { if (iframeRef.current) iframeRef.current.src = pagePath[activePage] }}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-all"
            title="새로고침"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => window.open(pagePath[activePage], "_blank")}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-all"
            title="새 탭으로 열기"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* iframe wrapper */}
      <div ref={containerRef} className="relative flex-1 rounded-2xl border border-border bg-muted/20 overflow-hidden flex flex-col items-center">
        {!hasDraft ? (
          // No snapshot yet
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Rocket className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">테스트 사이트 미생성</p>
              <p className="text-xs text-muted-foreground mt-1">
                버튼을 눌러 CMS 데이터를 합쳐<br/>실제 동작하는 테스트 사이트를 만드세요
              </p>
            </div>
            <button
              onClick={onGeneratePreview}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isGenerating
                ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />생성 중...</>
                : <><Rocket className="h-3.5 w-3.5" />테스트 사이트 생성</>
              }
            </button>
          </div>
        ) : device === "mobile" ? (
          /* Mobile frame */
          <div className="flex-1 w-full overflow-hidden flex justify-center py-3">
            <div
              className="relative rounded-[2rem] border-[3px] border-neutral-800 bg-white shadow-2xl overflow-hidden flex-none"
              style={{ width: mobileW, height: "calc(100% - 0px)" }}
            >
              {/* Notch decoration */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-24 h-5 bg-neutral-800 rounded-b-2xl" />
              <iframe
                ref={iframeRef}
                src={pagePath[activePage]}
                title="테스트 사이트 미리보기"
                className="w-full h-full border-0"
                style={{ marginTop: 0 }}
              />
            </div>
          </div>
        ) : (
          /* Desktop frame — scale to fit panel width dynamically */
          <div className="flex-1 w-full overflow-hidden relative">
            <div
              style={{
                width: desktopW,
                height: `${(1 / desktopScale) * 100}%`,
                transform: `scale(${desktopScale.toFixed(4)})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              <iframe
                ref={iframeRef}
                src={pagePath[activePage]}
                title="테스트 사이트 미리보기"
                className="border-0"
                style={{ width: desktopW, height: "100%" }}
              />
            </div>
          </div>
        )}

        {/* Live badge */}
        {hasDraft && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-0.5 bg-black/60 text-white text-[10px] font-medium rounded-full backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            실시간 연동
          </div>
        )}
      </div>
    </div>
  )
}



// ─── localStorage persistence helpers ────────────────────────────────────────
function draftKey(branchId: string) { return `tatoa-cms-homepage-v1-${branchId}` }

function loadDraftFromStorage(branchId: string): {
  draft?: BranchWebsiteDraft; sections?: HomeSection[]; sectionImages?: Record<string, string>; savedAt?: string
} {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(draftKey(branchId))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as { draft?: BranchWebsiteDraft; sections?: HomeSection[]; sectionImages?: Record<string, string>; savedAt?: string }
    const originalTreatments = parsed.draft?.pages?.treatments
    if (originalTreatments && typeof originalTreatments === "object") {
      const migratedTreatments = migrateTreatmentsPageValues(originalTreatments as Record<string, unknown>)
      if (migratedTreatments !== originalTreatments) {
        parsed.draft!.pages.treatments = migratedTreatments as Record<string, FieldValue>
        try { localStorage.setItem(draftKey(branchId), JSON.stringify(parsed)) } catch { /* quota */ }
      }
    }
    return parsed
  } catch { return {} }
}

function saveDraftToStorage(
  branchId: string,
  draft: BranchWebsiteDraft,
  sections: HomeSection[],
  sectionImages: Record<string, string>,
) {
  if (typeof window === "undefined") return
  try {
    // Strip icon (React component / function) — not JSON-serializable
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const serializableSections = sections.map(({ icon: _icon, ...rest }) => rest)
    localStorage.setItem(draftKey(branchId), JSON.stringify({ draft, sections: serializableSections, sectionImages, savedAt: new Date().toISOString() }))
  } catch { /* quota exceeded – ignore */ }
}

// ─── Virtual Viewport System (Figma/Webflow-style) ─────────────────────────────

type ViewportPreset = "mobile" | "tablet" | "desktop" | "full"

const VIEWPORT_WIDTHS: Record<ViewportPreset, number> = {
  mobile:  375,
  tablet:  768,
  desktop: 1280,
  full:    1920,
}

const VIEWPORT_HEIGHTS: Record<ViewportPreset, number> = {
  mobile:  812,   // 375 × 812 ≈ 9:19.5 (Galaxy S25)
  tablet:  1024,  // iPad 표준
  desktop: 720,   // 16:9
  full:    1080,  // 16:9
}

const PANEL_WIDTHS: Record<ViewportPreset, string> = {
  mobile:  "272px",
  tablet:  "480px",
  desktop: "480px",
  full:    "clamp(500px, 50vw, 720px)",
}

const VIEWPORT_PRESETS: { id: ViewportPreset; label: string; icon: typeof Smartphone }[] = [
  { id: "mobile",  label: "375",  icon: Smartphone },
  { id: "tablet",  label: "768",  icon: Tablet },
  { id: "desktop", label: "1280", icon: Monitor },
  { id: "full",    label: "1920", icon: MonitorSmartphone },
]

export default function BranchHomepagePage() {
  const { selectedBranch } = useBranch()
  const branch  = branches.find((b) => b.id === selectedBranch) || branches[0]
  const website = branchWebsites.find((w) => w.branchId === selectedBranch)

  // ── Branch website deploy system ──
  const {
    websiteState,
    generatePreview,
    publishSite,
    rollbackToVersion,
    updateDomainSettings,
    loadForBranch,
    getPreviewUrl,
    getLiveUrl,
    hasUnpublishedChanges,
  } = useBranchWebsite()
  const { doctors, getDoctorsByBranch } = useStaff()
  const { equipmentList, getEquipmentByBranch, getEffectiveAssets: getEquipmentAssets } = useEquipment()
  const { treatmentList, getTreatmentsByBranch, getTreatment, getEffectiveAssets: getTreatmentAssets } = useTreatment()

  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [isPublishing, setIsPublishing]               = useState(false)
  const [showDeployPanel, setShowDeployPanel]         = useState(false)
  const [showDomainPanel, setShowDomainPanel]         = useState(false)
  const [showVersionHistory, setShowVersionHistory]   = useState(false)
  const [domainInput, setDomainInput]                 = useState("")
  const [previewGenerated, setPreviewGenerated]       = useState(false)
  const [publishSuccess, setPublishSuccess]           = useState(false)
  const [copiedUrl, setCopiedUrl]                     = useState(false)

  // Load website state for current branch
  useEffect(() => { loadForBranch(branch.id) }, [branch.id, loadForBranch])

  // ── Collect all CMS data and generate preview snapshot ──
  const handleGeneratePreview = useCallback(async () => {
    setIsGeneratingPreview(true)
    await new Promise((r) => setTimeout(r, 800))

    // Collect doctors (use staff store)
    const staffDoctors = getDoctorsByBranch(branch.id)
    const doctorCards = staffDoctors.map((d) => ({
      id: d.profile.id,
      branchId: d.profile.branchId,
      name: d.profile.name,
      title: d.profile.title,
      specialty: d.profile.specialtySummary || d.profile.title,
      image: d.profile.profileImageUrl || "",
      isPublic: d.profile.isPublic,
      isFeatured: d.profile.isFeatured,
      profileImageUrl: d.profile.profileImageUrl,
      oneLinePitch: d.profile.oneLinePitch,
      shortIntro: d.profile.shortIntro,
      specialtySummary: d.profile.specialtySummary,
      specialties: d.specialties,
      homepageQuote: d.profile.homepageQuote,
      consultUrl: d.profile.consultUrl,
      careers: d.careers
        .filter((c) => c.isPublic)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) => ({ id: c.id, organization: c.organization, roleOrDescription: c.roleOrDescription, sortOrder: c.sortOrder })),
      academics: d.academics
        .filter((a) => a.isPublic)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((a) => ({ id: a.id, name: a.name, sortOrder: a.sortOrder })),
      strengths: d.strengths,
    }))

    // Collect equipment
    const equipmentList = getEquipmentByBranch(branch.id)
    const equipmentCards = equipmentList.map((e) => {
      const assets = getEquipmentAssets(e.profile.id)
      const coverAsset = assets.find((a) => a.assetType === "대표이미지")
      const imageUrl = coverAsset?.fileUrl || coverAsset?.thumbnailUrl || ""
      return {
        id: e.profile.id,
        branchId: e.profile.branchId,
        name: e.profile.name,
        description: e.profile.shortDescription || e.profile.longDescription || "",
        image: imageUrl,
        isPublic: e.profile.isPublic,
        isFeatured: e.profile.isFeatured,
        coverImageUrl: imageUrl || undefined,
      }
    })

    // Collect treatments (rich landing data)
    const treatmentList = getTreatmentsByBranch(branch.id)
    const treatmentCards = treatmentList.map((t) => {
      const profile = t.profile
      const assets  = getTreatmentAssets(profile.id)
      const heroAsset = assets.find((a) => a.assetType === "히어로이미지") || assets.find((a) => a.assetType === "카드썸네일")
      // Build price display string
      const priceDisplay = profile.cardPriceText
        || (profile.priceRegular ? `${profile.priceRegular.toLocaleString()}원` : "")
        || ""
      const durationDisplay = profile.cardDurationText
        || (profile.durationMinutes ? `${profile.durationMinutes}분` : "")
        || ""
      return {
        id: profile.id,
        slug: profile.id,  // use id as slug since TreatmentProfile has no slug field
        branchId: profile.branchId || branch.id,
        name: profile.name,
        category: profile.category || "",
        description: profile.cardDescription || profile.shortDescription || profile.oneLinePitch || "",
        price: priceDisplay,
        duration: durationDisplay,
        image: profile.heroImageUrl || heroAsset?.fileUrl || heroAsset?.thumbnailUrl || "",
        isPublic: profile.status === "published",
        isFeatured: profile.isFeatured || false,
        sortOrder: profile.displayOrder || 0,
        badge: profile.cardBadge || undefined,
        // Serialize landing data for preview site rendering
        landingProfile: JSON.parse(JSON.stringify(profile)),
        landingData: JSON.parse(JSON.stringify({
          ...t,
          profile: undefined,
        })),
        landingAssets: JSON.parse(JSON.stringify(assets)),
      }
    })

    // Collect events for this branch
    const branchEvents = mockEvents
      .filter((e) => e.branchId === branch.id)
      .map((e) => ({
        id: e.id,
        branchId: e.branchId,
        title: e.title,
        description: e.description,
        startDate: e.startDate,
        endDate: e.endDate,
        thumbnail: e.thumbnail,
        status: e.status,
        isHomepage: e.isHomepage,
      }))

    const snapshot: Omit<SiteSnapshot, "snapshotType" | "generatedAt"> = {
      branchId: branch.id,
      branch: {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        businessHours: branch.businessHours,
        parkingInfo: branch.parkingInfo,
        bookingLink: branch.bookingLink,
        shortIntro: branch.shortIntro,
        longIntro: branch.longIntro,
        heroImage: branch.heroImage,
        kakaoLink: branch.kakaoLink,
        naverMapUrl: branch.naverMapUrl,
        transportGuide: branch.transportGuide,
        landmarkGuide: branch.landmarkGuide,
      },
      homepage: {
        sections: sectionsRef.current.map((s) => ({
          id: s.id,
          label: s.label,
          isEnabled: s.isEnabled,
          status: s.status,
        })),
        sectionValues: draftRef.current.pages.home as Record<string, Record<string, FieldValue>>,
        sectionImages: sectionImagesRef.current,
        popupData: popupDataRef.current,
        bookingValues: (draftRef.current.pages.booking ?? {}) as Record<string, FieldValue>,
        cartValues: (draftRef.current.pages.cart ?? {}) as Record<string, FieldValue>,
        treatmentsPageValues: (draftRef.current.pages.treatments ?? {}) as Record<string, FieldValue>,
        recruitValues: (draftRef.current.pages.recruit ?? {}) as Record<string, FieldValue>,
      },
      doctors: doctorCards,
      equipment: equipmentCards,
      treatments: treatmentCards,
      events: branchEvents,
    }

    generatePreview(branch.id, snapshot)
    // BroadcastChannel 알림 → iframe이 즉시 새 snapshot을 읽어 갱신
    const bc = new BroadcastChannel(SITE_LIVE_BROADCAST(branch.id))
    bc.postMessage("update")
    bc.close()
    setIsGeneratingPreview(false)
    setPreviewGenerated(true)
    setTimeout(() => setPreviewGenerated(false), 3000)
  }, [branch, getDoctorsByBranch, getEquipmentByBranch, getTreatmentsByBranch, getTreatmentAssets, generatePreview])

  const handlePublish = useCallback(async () => {
    setIsPublishing(true)
    const ok = await publishSite(branch.id)
    setIsPublishing(false)
    if (ok) {
      setPublishSuccess(true)
      setTimeout(() => setPublishSuccess(false), 3000)
    }
  }, [branch.id, publishSite])

  const handleCopyPreviewUrl = useCallback(() => {
    const url = `${window.location.origin}${getPreviewUrl(branch.id)}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    })
  }, [branch.id, getPreviewUrl])

  // handleOpenPreview is declared below, after triggerLiveSnapshot
  const handleOpenLive = useCallback(() => {
    window.open(getLiveUrl(branch.id), "_blank")
  }, [branch.id, getLiveUrl])

  const handleDomainSave = useCallback(() => {
    if (!domainInput.trim()) return
    updateDomainSettings(branch.id, {
      customDomain: domainInput.trim(),
      domainStatus: "pending",
      sslStatus: "pending",
      lastCheckedAt: new Date().toISOString(),
      dnsRecords: [
        { type: "A", host: "@", value: "76.76.19.19", ttl: 3600 },
        { type: "CNAME", host: "www", value: `${domainInput.trim()}`, ttl: 3600 },
      ],
    })
    setShowDomainPanel(false)
  }, [branch.id, domainInput, updateDomainSettings])

  // ── Live snapshot: debounced, runs on every field change ──────────────────
  const liveSnapshotTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleLiveSnapshot = useCallback(() => {
    if (liveSnapshotTimer.current) clearTimeout(liveSnapshotTimer.current)
    liveSnapshotTimer.current = setTimeout(async () => {
      // Collect data from current refs (same logic as handleGeneratePreview but sync + lightweight)
      const staffDoctors = getDoctorsByBranch(branchIdRef.current)
      const doctorCards = staffDoctors.map((d) => ({
        id: d.profile.id,
        branchId: d.profile.branchId,
        name: d.profile.name,
        title: d.profile.title,
        specialty: d.profile.specialtySummary || d.profile.title,
        image: d.profile.profileImageUrl || "",
        isPublic: d.profile.isPublic,
        isFeatured: d.profile.isFeatured,
        profileImageUrl: d.profile.profileImageUrl,
        oneLinePitch: d.profile.oneLinePitch,
        shortIntro: d.profile.shortIntro,
        specialtySummary: d.profile.specialtySummary,
        specialties: d.specialties,
        homepageQuote: d.profile.homepageQuote,
        consultUrl: d.profile.consultUrl,
        careers: d.careers
          .filter((c) => c.isPublic)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((c) => ({ id: c.id, organization: c.organization, roleOrDescription: c.roleOrDescription, sortOrder: c.sortOrder })),
        academics: d.academics
          .filter((a) => a.isPublic)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((a) => ({ id: a.id, name: a.name, sortOrder: a.sortOrder })),
        strengths: d.strengths,
      }))

      const equipmentList = getEquipmentByBranch(branchIdRef.current)
      const equipmentCards = equipmentList.map((e) => ({
        id: e.profile.id,
        branchId: e.profile.branchId,
        name: e.profile.name,
        description: e.profile.shortDescription || e.profile.longDescription || "",
        image: "",
        isPublic: e.profile.isPublic,
        isFeatured: e.profile.isFeatured,
        coverImageUrl: undefined as string | undefined,
      }))

      const treatmentList = getTreatmentsByBranch(branchIdRef.current)
      const treatmentCards = treatmentList.map((t) => {
        const profile = t.profile
        const assets  = getTreatmentAssets(profile.id)
        const heroAsset = assets.find((a) => a.assetType === "히어로이미지") || assets.find((a) => a.assetType === "카드썸네일")
        const priceDisplay = profile.cardPriceText || (profile.priceRegular ? `${profile.priceRegular.toLocaleString()}원` : "")
        const durationDisplay = profile.cardDurationText || (profile.durationMinutes ? `${profile.durationMinutes}분` : "")
        return {
          id: profile.id,
          slug: profile.id,
          branchId: profile.branchId || branchIdRef.current,
          name: profile.name,
          category: profile.category || "",
          description: profile.cardDescription || profile.shortDescription || profile.oneLinePitch || "",
          price: priceDisplay,
          duration: durationDisplay,
          image: profile.heroImageUrl || heroAsset?.fileUrl || heroAsset?.thumbnailUrl || "",
          isPublic: profile.status === "published",
          isFeatured: profile.isFeatured || false,
          sortOrder: profile.displayOrder || 0,
          badge: profile.cardBadge || undefined,
          landingProfile: profile as unknown as Record<string, unknown>,
          landingData: { ...t, profile: undefined } as unknown as Record<string, unknown>,
          landingAssets: assets as unknown[],
        }
      })

      const currentBranch = branches.find((b) => b.id === branchIdRef.current) || branches[0]
      const branchEvents = mockEvents
        .filter((e) => e.branchId === branchIdRef.current)
        .map((e) => ({
          id: e.id,
          branchId: e.branchId,
          title: e.title,
          description: e.description,
          startDate: e.startDate,
          endDate: e.endDate,
          thumbnail: e.thumbnail,
          status: e.status,
          isHomepage: e.isHomepage,
        }))

      const snapshot: SiteSnapshot = {
        snapshotType: "draft",
        generatedAt: new Date().toISOString(),
        branchId: branchIdRef.current,
        branch: {
          id: currentBranch.id,
          name: currentBranch.name,
          address: currentBranch.address,
          phone: currentBranch.phone,
          businessHours: currentBranch.businessHours,
          parkingInfo: currentBranch.parkingInfo,
          bookingLink: currentBranch.bookingLink,
          shortIntro: currentBranch.shortIntro,
          longIntro: currentBranch.longIntro,
          heroImage: currentBranch.heroImage,
          kakaoLink: currentBranch.kakaoLink,
          naverMapUrl: currentBranch.naverMapUrl,
          transportGuide: currentBranch.transportGuide,
          landmarkGuide: currentBranch.landmarkGuide,
        },
        homepage: {
          sections: sectionsRef.current.map((s) => ({
            id: s.id, label: s.label, isEnabled: s.isEnabled, status: s.status,
          })),
          sectionValues: draftRef.current.pages.home as Record<string, Record<string, FieldValue>>,
          sectionImages: sectionImagesRef.current,
          popupData: popupDataRef.current,
          bookingValues: (draftRef.current.pages.booking ?? {}) as Record<string, FieldValue>,
          cartValues: (draftRef.current.pages.cart ?? {}) as Record<string, FieldValue>,
          treatmentsPageValues: (draftRef.current.pages.treatments ?? {}) as Record<string, FieldValue>,
          recruitValues: (draftRef.current.pages.recruit ?? {}) as Record<string, FieldValue>,
        },
        doctors: doctorCards,
        equipment: equipmentCards,
        treatments: treatmentCards,
        events: branchEvents,
      }

      // ── blob: URL → base64 변환 (테스트 사이트에서도 이미지가 보이도록) ──────
      // blob: URL은 생성된 탭에서만 유효. base64로 변환하면 localStorage를 통해
      // 다른 탭(테스트 사이트)에서도 동일한 이미지를 렌더링할 수 있음.
      const blobToBase64 = (url: string): Promise<string> =>
        fetch(url)
          .then(r => r.blob())
          .then(blob => new Promise<string>((resolve) => {
            // 3MB 이상이면 건너뜀 (localStorage 용량 초과 방지)
            if (blob.size > 3 * 1024 * 1024) { resolve(url); return }
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror   = () => resolve(url)
            reader.readAsDataURL(blob)
          }))
          .catch(() => url)

      // JSON에서 blob: URL을 추출해 병렬 변환
      let snapshotJson = JSON.stringify(snapshot)
      const blobUrls = [...new Set((snapshotJson.match(/"blob:[^"]+"/g) || []).map(s => s.slice(1, -1)))]
      if (blobUrls.length > 0) {
        const pairs = await Promise.all(blobUrls.map(async url => [url, await blobToBase64(url)] as [string, string]))
        for (const [blob, b64] of pairs) {
          if (blob !== b64) {
            snapshotJson = snapshotJson.replaceAll(JSON.stringify(blob), JSON.stringify(b64))
          }
        }
      }

      // Save to localStorage and notify preview iframe
      try {
        localStorage.setItem(`bw_draft_${branchIdRef.current}`, snapshotJson)
      } catch {
        // QuotaExceededError → base64 없이 원본 저장
        localStorage.setItem(`bw_draft_${branchIdRef.current}`, JSON.stringify(snapshot))
      }
      const bc = new BroadcastChannel(SITE_LIVE_BROADCAST(branchIdRef.current))
      bc.postMessage("update")
      bc.close()
    }, 300)
  }, [getDoctorsByBranch, getEquipmentByBranch, getTreatmentsByBranch, getTreatmentAssets])

  // Expose live snapshot trigger so handleGeneratePreview can also use it
  const triggerLiveSnapshot = useCallback(() => {
    scheduleLiveSnapshot()
  }, [scheduleLiveSnapshot])

  // staff / equipment / treatment store 변경 시 snapshot 자동 갱신
  // 초기 마운트는 skip (다른 useEffect들이 이미 초기 snapshot을 다룸)
  const isFirstStoreSyncMount = useRef(true)
  useEffect(() => {
    if (isFirstStoreSyncMount.current) {
      isFirstStoreSyncMount.current = false
      return
    }
    scheduleLiveSnapshot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors, equipmentList, treatmentList])

  // Open preview — flush snapshot (300ms debounce), then open after 350ms so data is fresh
  const handleOpenPreview = useCallback(() => {
    triggerLiveSnapshot()
    setTimeout(() => {
      window.open(getPreviewUrl(branch.id), "_blank")
    }, 350)
  }, [branch.id, getPreviewUrl, triggerLiveSnapshot])

  // ── Preview iframe page state ─────────────────────────────────────────────
  const [iframePage, setIframePage] = useState<"home" | "treatments" | "booking" | "recruit">("home")

  const [activePage, setActivePage]       = useState<PageId>("home")
  const [activeSection, setActiveSection] = useState<HomeSectionId>("hero")
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile")
  const [previewViewport, setPreviewViewport] = useState<ViewportPreset>("mobile")
  const [previewZoom, setPreviewZoom] = useState<number>(0)  // 0 = autoFit, else direct scale
  useEffect(() => {
    setPreviewDevice(previewViewport === "mobile" ? "mobile" : "desktop")
  }, [previewViewport])
  const [sections, setSections]           = useState<HomeSection[]>(HOME_SECTIONS)
  const [draft, setDraft]                 = useState<BranchWebsiteDraft>({
    pages: { home: {}, treatments: {}, booking: {}, directions: {}, recruit: {} },
  })
  const [isDirty, setIsDirty]                         = useState(false)
  const [isSaving, setIsSaving]                       = useState(false)
  const [isGenerating, setIsGenerating]               = useState<HomeSectionId | null>(null)
  const [sectionImages, setSectionImages]             = useState<Record<string, string>>({})
  const [lastSaved, setLastSaved]                     = useState<Date | null>(null)
  const [autoSaveLabel, setAutoSaveLabel]             = useState<string>("")
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Refs to latest state for use inside callbacks without adding them to dep arrays
  const sectionsRef     = useRef(sections)
  const sectionImagesRef = useRef(sectionImages)
  const branchIdRef     = useRef(branch.id)
  useEffect(() => { sectionsRef.current      = sections },      [sections])
  useEffect(() => { sectionImagesRef.current = sectionImages }, [sectionImages])
  useEffect(() => { branchIdRef.current      = branch.id },     [branch.id])

  // ── Load persisted draft from localStorage on mount / branch switch ──
  useEffect(() => {
    const stored = loadDraftFromStorage(branch.id)
    if (stored.draft) setDraft(stored.draft)
    if (stored.sections) {
      // Restore icon (React component) from HOME_SECTIONS — it's not JSON-serializable
      setSections(
        HOME_SECTIONS.map((base) => {
          const saved = (stored.sections as Array<Partial<HomeSection>>).find((s) => s.id === base.id)
          // sortOrder & label always come from HOME_SECTIONS (code is source of truth)
          return saved ? { ...base, ...saved, icon: base.icon, sortOrder: base.sortOrder, label: base.label } : base
        })
      )
    }
    if (stored.sectionImages) setSectionImages(stored.sectionImages)
    if (stored.savedAt) {
      const d = new Date(stored.savedAt)
      setLastSaved(d)
      setAutoSaveLabel(`임시저장됨 · ${d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`)
    }
    setIsDirty(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch.id])

  // ── Debounced auto-save: writes latest ref values to localStorage ──
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      // Read latest values from refs — avoids stale closure, avoids dep-array churn
      saveDraftToStorage(branchIdRef.current, draftRef.current, sectionsRef.current, sectionImagesRef.current)
      const now = new Date()
      setLastSaved(now)
      setAutoSaveLabel(`임시저장됨 · ${now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`)
    }, 600)
  }, []) // stable — reads from refs

  // Keep a ref to draft so scheduleAutoSave can read it without being in deps
  const draftRef = useRef(draft)
  useEffect(() => { draftRef.current = draft }, [draft])

  const currentSection = sections.find((s) => s.id === activeSection)!
  const currentValues  = (draft.pages.home[activeSection] ?? {}) as Record<string, FieldValue>

  // ── Treatments page values & change handler ──
  const treatmentsValues = (draft.pages.treatments ?? {}) as Record<string, FieldValue>

  const handleTreatmentsChange = useCallback((key: string, val: FieldValue) => {
    setDraft((prev) => ({
      ...prev,
      pages: { ...prev.pages, treatments: { ...(prev.pages.treatments ?? {}), [key]: val } },
    }))
    setIsDirty(true)
    scheduleAutoSave()
    scheduleLiveSnapshot()
  }, [scheduleAutoSave, scheduleLiveSnapshot])

  const bookingValues  = (draft.pages.booking ?? {}) as Record<string, FieldValue>
  const cartValues     = (draft.pages.cart    ?? {}) as Record<string, FieldValue>
  const recruitValues  = (draft.pages.recruit ?? {}) as Record<string, FieldValue>

  // Minimal SiteSnapshot for SiteNav inside booking admin preview
  const bookingNavSnapshot: SiteSnapshot = {
    snapshotType: "draft",
    branchId: branch.id,
    generatedAt: "",
    branch: {
      id: branch.id,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      businessHours: branch.businessHours,
      parkingInfo: branch.parkingInfo,
      bookingLink: branch.bookingLink,
      shortIntro: branch.shortIntro,
      longIntro: branch.longIntro,
      heroImage: branch.heroImage,
      kakaoLink: branch.kakaoLink,
      naverMapUrl: branch.naverMapUrl,
      transportGuide: branch.transportGuide,
      landmarkGuide: branch.landmarkGuide,
    },
    homepage: {
      sections: [],
      sectionValues: {},
      sectionImages: {},
      popupData: { enabled: false, items: [] },
      bookingValues: {},
      cartValues: {},
      treatmentsPageValues: {},
      recruitValues: {},
    },
    doctors: [],
    equipment: [],
    treatments: [],
    events: [],
  }

  const [popupData, setPopupData] = useState<PopupData>(DEFAULT_POPUP_DATA)
  const popupDataRef = useRef(popupData)
  useEffect(() => { popupDataRef.current = popupData }, [popupData])

  const handleBookingChange = useCallback((key: string, val: FieldValue) => {
    setDraft((prev) => ({
      ...prev,
      pages: { ...prev.pages, booking: { ...(prev.pages.booking ?? {}), [key]: val } },
    }))
    setIsDirty(true)
    scheduleAutoSave()
    scheduleLiveSnapshot()
  }, [scheduleAutoSave, scheduleLiveSnapshot])

  const handleCartChange = useCallback((key: string, val: FieldValue) => {
    setDraft((prev) => ({
      ...prev,
      pages: { ...prev.pages, cart: { ...(prev.pages.cart ?? {}), [key]: val } },
    }))
    setIsDirty(true)
    scheduleAutoSave()
    scheduleLiveSnapshot()
  }, [scheduleAutoSave, scheduleLiveSnapshot])

  const handleRecruitChange = useCallback((key: string, val: FieldValue) => {
    setDraft((prev) => ({
      ...prev,
      pages: { ...prev.pages, recruit: { ...(prev.pages.recruit ?? {}), [key]: val } },
    }))
    setIsDirty(true)
    scheduleAutoSave()
    scheduleLiveSnapshot()
  }, [scheduleAutoSave, scheduleLiveSnapshot])

  const handleFieldChange = useCallback((key: string, val: FieldValue) => {
    setDraft((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          [activeSection]: { ...(prev.pages.home[activeSection] ?? {}), [key]: val },
        },
      },
    }))
    setIsDirty(true)
    scheduleAutoSave()
    scheduleLiveSnapshot()
    // Mirror image/video URLs into flat sectionImages so PreviewPhilosophy can read them via context
    if (key === "image" && typeof val === "string") {
      setSectionImages((prev) => ({ ...prev, [activeSection]: val }))
    }
  }, [activeSection, scheduleAutoSave, scheduleLiveSnapshot])

  const handleSave = async () => {
    setIsSaving(true)
    // Flush any pending auto-save timer immediately and save now
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    saveDraftToStorage(branchIdRef.current, draftRef.current, sectionsRef.current, sectionImagesRef.current)
    await new Promise((r) => setTimeout(r, 400))
    setIsSaving(false)
    setIsDirty(false)
    const now = new Date()
    setLastSaved(now)
    setAutoSaveLabel(`저장됨 · ${now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`)
    setSections((prev) => prev.map((s) => s.id === activeSection && s.status === "empty" ? { ...s, status: "draft" } : s))
  }

  const handleResetDraft = () => {
    if (!confirm("모든 편집 내용을 초기화하시겠어요? 이 작업은 되돌릴 수 없습니다.")) return
    localStorage.removeItem(draftKey(branchIdRef.current))
    setDraft({ pages: { home: {}, treatments: {}, booking: {}, directions: {}, recruit: {} } })
    setSections(HOME_SECTIONS)
    setSectionImages({})
    setIsDirty(false)
    setLastSaved(null)
    setAutoSaveLabel("")
  }

  const handleAiGenerate = async (sectionId: HomeSectionId) => {
    setIsGenerating(sectionId)
    await new Promise((r) => setTimeout(r, 1600))
    setDraft((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          [sectionId]: {
            ...(prev.pages.home[sectionId] ?? {}),
            block1Text: "TATOA DERMATOLOGY CLINIC",
            block1Visible: true,
            block2Text: `${branch.name}\nAI 생성 메인 카피`,
            block2Visible: true,
            block3Text: "AI가 지점 정보를 분석해 작성한 초안입니다.\n내용을 검토하고 수정해주세요.",
            block3Visible: true,
            overlayOpacity: 50,
            textAlignH: "left",
            textPositionV: "center",
            ctaLabel: "지금 상담 예약하기",
            ctaVisible: true,
          },
        },
      },
    }))
    setSections((prev) => prev.map((s) => s.id === sectionId && s.status === "empty" ? { ...s, status: "draft" } : s))
    setIsGenerating(null)
    setIsDirty(true)
  }

  const readySections  = sections.filter((s) => s.isEnabled && s.status === "ready").length
  const totalEnabled   = sections.filter((s) => s.isEnabled).length
  const readinessScore = totalEnabled > 0 ? Math.round((readySections / totalEnabled) * 100) : 0
  const currentPageMeta = PAGES.find((p) => p.id === activePage)!

  // Deploy panel computed values
  const hasDraft        = !!websiteState.draft
  const hasPublished    = !!websiteState.published
  const domainSettings  = websiteState.domainSettings
  const versions        = websiteState.versions

  // These read from localStorage / window — must be computed client-side only (after hydration)
  // to avoid React hydration mismatch between SSR and client.
  const [unpublishedChanges, setUnpublishedChanges] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  const [liveUrl,    setLiveUrl]    = useState("")
  useEffect(() => {
    setUnpublishedChanges(hasUnpublishedChanges(branch.id))
    setPreviewUrl(`${window.location.origin}${getPreviewUrl(branch.id)}`)
    setLiveUrl(`${window.location.origin}${getLiveUrl(branch.id)}`)
  }, [branch.id, websiteState.draft, websiteState.published, hasUnpublishedChanges, getPreviewUrl, getLiveUrl])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/branch">
            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-0.5">
              <span>홈페이지 편집</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className={cn("font-medium", activePage === "home" ? "text-foreground" : "text-muted-foreground")}>
                {currentPageMeta.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{branch.name}</h1>
              {hasPublished ? (
                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">공개 중</Badge>
              ) : hasDraft ? (
                <Badge variant="outline" className="text-xs bg-warning/10 text-warning-foreground border-warning/20">테스트 생성됨</Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">미생성</Badge>
              )}
              {unpublishedChanges && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">미반영 변경사항</Badge>
              )}
            </div>
          </div>
        </div>
        {(activePage === "home" || activePage === "treatments") && (
          <div className="flex items-center gap-2">
            {/* Auto-save status */}
            {autoSaveLabel && !isDirty && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-success" />
                {autoSaveLabel}
              </span>
            )}
            {isDirty && (
              <span className="text-[11px] text-warning-foreground flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse inline-block" />
                저장되지 않은 변경사항
              </span>
            )}
            {/* Manual save */}
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}
              className="rounded-xl gap-1.5">
              <Save className="h-3.5 w-3.5" />{isSaving ? "저장 중..." : "저장"}
            </Button>
            {/* Reset draft */}
            {lastSaved && (
              <Button variant="ghost" size="sm" onClick={handleResetDraft}
                className="rounded-xl gap-1.5 text-muted-foreground hover:text-destructive text-xs px-2">
                <RotateCcw className="h-3 w-3" />초기화
              </Button>
            )}
            {/* ── Deploy bar ── */}
            <div className="flex items-center gap-1.5 border-l border-border pl-2">
              {/* Generate preview */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePreview}
                disabled={isGeneratingPreview}
                className="rounded-xl gap-1.5 text-xs"
                title="CMS 데이터를 모아 테스트 홈페이지를 생성합니다"
              >
                {isGeneratingPreview ? (
                  <><RefreshCw className="h-3.5 w-3.5 animate-spin" />생성 중...</>
                ) : previewGenerated ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-success" />생성 완료!</>
                ) : (
                  <><Rocket className="h-3.5 w-3.5" />테스트 사이트 생성</>
                )}
              </Button>

              {/* Open preview */}
              {hasDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenPreview}
                  className="rounded-xl gap-1.5 text-xs"
                  title="테스트 URL 열기"
                >
                  <ExternalLink className="h-3.5 w-3.5" />테스트 열기
                </Button>
              )}

              {/* Publish */}
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={isPublishing || !hasDraft}
                className={cn(
                  "rounded-xl gap-1.5 text-xs",
                  publishSuccess
                    ? "bg-success text-success-foreground hover:bg-success"
                    : "bg-primary text-primary-foreground",
                )}
                title="테스트 사이트를 실사이트로 공개합니다"
              >
                {isPublishing ? (
                  <><RefreshCw className="h-3.5 w-3.5 animate-spin" />배포 중...</>
                ) : publishSuccess ? (
                  <><CheckCircle2 className="h-3.5 w-3.5" />배포 완료!</>
                ) : (
                  <><Send className="h-3.5 w-3.5" />공개 배포</>
                )}
              </Button>

              {/* More options */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeployPanel((v) => !v)}
                className="rounded-xl text-xs text-muted-foreground h-8 w-8 p-0"
                title="배포 옵션"
              >
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Deploy Status Bar ─────────────────────────────────────────────── */}
      {(hasDraft || hasPublished) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          {/* Draft info */}
          <div className="flex items-center gap-2 text-xs">
            <div className={cn("h-2 w-2 rounded-full", hasDraft ? "bg-blue-500" : "bg-neutral-300")} />
            <span className="text-muted-foreground">테스트:</span>
            {websiteState.draft
              ? <span className="font-medium">{new Date(websiteState.draft.generatedAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              : <span className="text-muted-foreground">없음</span>
            }
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Published info */}
          <div className="flex items-center gap-2 text-xs">
            <div className={cn("h-2 w-2 rounded-full", hasPublished ? "bg-success" : "bg-neutral-300")} />
            <span className="text-muted-foreground">공개:</span>
            {websiteState.published
              ? <span className="font-medium">{new Date(websiteState.published.generatedAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              : <span className="text-muted-foreground">없음</span>
            }
          </div>

          {unpublishedChanges && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                <span>미반영 변경사항 있음</span>
              </div>
            </>
          )}

          {/* URLs */}
          <div className="ml-auto flex items-center gap-2">
            {hasDraft && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyPreviewUrl}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded-lg px-2 py-1 hover:bg-muted transition-all"
                  title="테스트 URL 복사"
                >
                  {copiedUrl ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  테스트 URL
                </button>
                <button
                  onClick={handleOpenPreview}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 rounded-lg px-2 py-1 hover:bg-blue-50 transition-all"
                >
                  <ExternalLink className="h-3 w-3" />열기
                </button>
              </div>
            )}
            {hasPublished && (
              <button
                onClick={handleOpenLive}
                className="flex items-center gap-1 text-xs text-success hover:text-success/80 rounded-lg px-2 py-1 hover:bg-success/5 transition-all"
              >
                <Globe className="h-3 w-3" />실사이트 열기
              </button>
            )}
            {versions.length > 0 && (
              <button
                onClick={() => setShowVersionHistory((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded-lg px-2 py-1 hover:bg-muted transition-all"
              >
                <History className="h-3 w-3" />배포 이력 ({versions.length})
              </button>
            )}
            <button
              onClick={() => setShowDomainPanel((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded-lg px-2 py-1 hover:bg-muted transition-all"
            >
              <Settings2 className="h-3 w-3" />도메인 설정
            </button>
          </div>
        </div>
      )}

      {/* ── Deploy Options Panel ─────────────────────────────────────────── */}
      {showDeployPanel && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">배포 옵션</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setShowDeployPanel(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {/* Generate preview */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-foreground">테스트 홈페이지 생성</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">현재 CMS 데이터를 합쳐 실제 클릭 가능한 테스트 사이트를 생성합니다.</p>
              <Button size="sm" variant="outline" className="rounded-xl w-full gap-1.5 text-xs"
                onClick={handleGeneratePreview} disabled={isGeneratingPreview}>
                <Rocket className="h-3.5 w-3.5" />{isGeneratingPreview ? "생성 중..." : "테스트 사이트 생성"}
              </Button>
            </div>
            {/* Publish */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Send className="h-4 w-4 text-success" />
                <p className="text-sm font-medium text-foreground">공개 배포</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">테스트 사이트를 실사이트로 반영합니다. 이전 버전은 자동 보관됩니다.</p>
              <Button size="sm" className="rounded-xl w-full gap-1.5 text-xs bg-success text-white hover:bg-success/90"
                onClick={handlePublish} disabled={isPublishing || !hasDraft}>
                <Send className="h-3.5 w-3.5" />{isPublishing ? "배포 중..." : "공개 배포"}
              </Button>
            </div>
          </div>
          {/* Domain settings shortcut */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3 text-sm">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">도메인: </span>
              <span className="text-muted-foreground">
                {domainSettings.customDomain || "설정되지 않음"}
              </span>
              {domainSettings.domainStatus === "active" && <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">연결됨</Badge>}
              {domainSettings.domainStatus === "pending" && <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning-foreground border-warning/20">확인 중</Badge>}
            </div>
            <Button variant="ghost" size="sm" className="rounded-lg text-xs gap-1" onClick={() => { setShowDeployPanel(false); setShowDomainPanel(true) }}>
              <Settings2 className="h-3 w-3" />설정
            </Button>
          </div>
        </div>
      )}

      {/* ── Domain Settings Panel ─────────────────────────────────────────── */}
      {showDomainPanel && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">도메인 설정</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setShowDomainPanel(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Current URLs */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border">
              <Globe className="h-3.5 w-3.5 text-muted-foreground flex-none" />
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground">기본 테스트 URL</p>
                <p className="font-medium text-foreground truncate">{previewUrl}</p>
              </div>
              <button onClick={handleCopyPreviewUrl} className="flex-none text-muted-foreground hover:text-foreground">
                {copiedUrl ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            {hasPublished && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-success/5 border border-success/20">
                <Globe className="h-3.5 w-3.5 text-success flex-none" />
                <div className="min-w-0 flex-1">
                  <p className="text-success/80">현재 실사이트 URL</p>
                  <p className="font-medium text-success truncate">{liveUrl}</p>
                </div>
                <button onClick={handleOpenLive} className="flex-none text-success hover:text-success/80">
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Custom domain input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">사용자 지정 도메인</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={domainInput || domainSettings.customDomain}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="예: clinic.tatoa.kr"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button size="sm" className="rounded-xl px-4 text-xs" onClick={handleDomainSave}
                disabled={!domainInput.trim() && !domainSettings.customDomain}>
                저장
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              도메인 등록 후 아래 DNS 레코드를 도메인 관리 페이지에 설정하세요.
            </p>
          </div>

          {/* DNS records */}
          {domainSettings.dnsRecords.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">DNS 설정 안내</p>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">타입</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">호스트</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">값</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {domainSettings.dnsRecords.map((rec, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono font-semibold text-primary">{rec.type}</td>
                        <td className="px-3 py-2 font-mono text-foreground">{rec.host}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{rec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">연결 상태:</span>
                {domainSettings.domainStatus === "active"
                  ? <span className="text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />연결됨</span>
                  : domainSettings.domainStatus === "pending"
                  ? <span className="text-warning-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" />확인 중...</span>
                  : <span className="text-muted-foreground">미설정</span>
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Version History Panel ─────────────────────────────────────────── */}
      {showVersionHistory && versions.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">배포 이력</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setShowVersionHistory(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                <div>
                  <p className="text-xs font-medium text-foreground">{v.label}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(v.createdAt).toLocaleString("ko-KR")}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs gap-1 h-7"
                  onClick={() => {
                    if (confirm("이 버전으로 롤백하시겠습니까? 현재 공개 버전이 교체됩니다.")) {
                      rollbackToVersion(branch.id, v.id)
                      setShowVersionHistory(false)
                    }
                  }}
                >
                  <RotateCcw className="h-3 w-3" />롤백
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page tabs */}
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1.5 w-fit">
        {PAGES.map((page) => (
          <button key={page.id} onClick={() => setActivePage(page.id)} className={cn(
            "relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
            activePage === page.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}>
            <page.icon className="h-3.5 w-3.5" />
            {page.label}
            {page.status !== "active" && activePage !== page.id && (
              <span className={cn(
                "absolute -top-1.5 -right-1 text-[9px] px-1 rounded-full font-medium",
                page.status === "auto" ? "bg-success text-white" : "bg-muted-foreground/20 text-muted-foreground"
              )}>{page.status === "auto" ? "자동" : "준비 중"}</span>
            )}
          </button>
        ))}
      </div>

      {/* Page content */}
      {activePage === "treatments" ? (
        <TreatmentsPage
          values={treatmentsValues}
          onChange={handleTreatmentsChange}
          branchId={branch.id}
          onNavigate={setActivePage}
        />
      ) : activePage === "booking" ? (
        <BookingPage
          values={bookingValues}
          onChange={handleBookingChange}
          branchId={branch.id}
          onNavigate={setActivePage}
          snapshot={bookingNavSnapshot}
          branchSlug={branch.id}
        />
      ) : activePage === "popup" ? (
        <PopupPage data={popupData} onChange={setPopupData} />
      ) : activePage === "cart" ? (
        <CartPageEditor
          values={cartValues}
          onChange={handleCartChange}
          branchId={branch.id}
          onNavigate={setActivePage}
        />
      ) : activePage === "recruit" ? (
        <RecruitPage
          values={recruitValues}
          onChange={handleRecruitChange}
          branchId={branch.id}
          onNavigate={setActivePage}
          snapshot={bookingNavSnapshot}
          branchSlug={branch.id}
        />
      ) : activePage === "directions" ? (
        <DirectionsPreviewPage
          homeData={draft.pages.home}
          branchName={branch.name}
          branchId={branch.id}
          onNavigate={setActivePage}
          currentPageMeta={currentPageMeta}
        />
      ) : activePage !== "home" ? (
        <PagePlaceholder page={currentPageMeta} />
      ) : (
        <div
          className="grid gap-5 transition-[grid-template-columns] duration-300"
          style={{
            gridTemplateColumns: "180px 1fr " + PANEL_WIDTHS[previewViewport],
          }}
        >

          {/* Col 1 — Section list */}
          <div>
            <Card className="rounded-2xl border-border bg-card shadow-sm sticky top-20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-semibold text-foreground">홈 섹션</CardTitle>
                    <p className="text-[10px] text-muted-foreground mt-0.5">홈 페이지 전용</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{readySections}/{totalEnabled}</span>
                </div>
                <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all",
                      readinessScore >= 80 ? "bg-success" : readinessScore >= 50 ? "bg-warning" : "bg-destructive"
                    )}
                    style={{ width: `${readinessScore}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-0.5 p-2 pt-0">
                {sections.map((section) => (
                  <button key={section.id} onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all",
                      activeSection === section.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground",
                      !section.isEnabled && "opacity-40"
                    )}>
                    <div className="flex items-center gap-2">
                      <section.icon className="h-3.5 w-3.5 flex-none" />
                      <span className="text-xs font-medium">{section.label}</span>
                    </div>
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border shrink-0", STATUS_CONFIG[section.status].className)}>
                      {STATUS_CONFIG[section.status].label}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Col 2 — Editor */}
          <div className="space-y-4 min-w-0">
            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <currentSection.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">{currentSection.label}</CardTitle>
                      <CardDescription className="text-xs">{currentSection.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleAiGenerate(activeSection)}
                      disabled={isGenerating !== null} className="rounded-xl gap-1.5 text-xs">
                      <Sparkles className="h-3.5 w-3.5" />
                      {isGenerating === activeSection ? "생성 중..." : "AI 초안"}
                    </Button>
                    <div className="flex items-center gap-1.5 border-l border-border pl-2">
                      <span className="text-xs text-muted-foreground">노출</span>
                      <Switch checked={currentSection.isEnabled}
                        onCheckedChange={(v) => {
                          setSections((prev) => prev.map((s) => s.id === activeSection ? { ...s, isEnabled: v } : s))
                          setIsDirty(true)
                          scheduleAutoSave()
                        }} />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <SectionEditor sectionId={activeSection} values={currentValues} onChange={handleFieldChange} branchId={branch.id} />
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border bg-muted/30 shadow-none">
              <CardContent className="flex items-start gap-3 p-4">
                <Building2 className="h-4 w-4 text-muted-foreground flex-none mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">본사 기본값 사용 중</p>
                  <p className="text-xs text-muted-foreground mt-0.5">이 섹션에 값을 입력하면 본사 기본값을 덮어씁니다.</p>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto rounded-lg text-xs h-7 shrink-0">
                  <RotateCcw className="h-3 w-3 mr-1" />초기화
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Col 3 — Preview Panel (mobile=component preview, desktop=실제 iframe) */}
          <SectionImagesContext.Provider value={sectionImages}>
            <PreviewPanel
              activeSectionId={activeSection}
              sections={sections}
              homeData={draft.pages.home}
              activeSectionData={currentValues}
              branchName={branch.name}
              branchId={branch.id}
              branch={branch}
              onNavigate={setActivePage}
              device={previewDevice}
              onDeviceChange={setPreviewDevice}
              viewport={previewViewport}
              onViewportChange={setPreviewViewport}
              zoom={previewZoom}
              onZoomChange={setPreviewZoom}
              onIconDrag={(idx, posX, posY) => {
                const cfgs = parseIconConfigs(currentValues.iconConfigs ?? currentValues.iconConfig)
                const next = cfgs.map((c, i) => i === idx ? { ...c, posX, posY } : c)
                handleFieldChange("iconConfigs", JSON.stringify(next))
              }}
            />
          </SectionImagesContext.Provider>

        </div>
      )}
    </div>
  )
}
