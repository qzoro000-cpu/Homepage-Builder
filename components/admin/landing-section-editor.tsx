"use client"

import { useState } from "react"
import {
  X, Plus, Trash2, ChevronUp, ChevronDown, Check, ImageIcon,
  Video, Sparkles, Copy, RotateCcw, Eye, EyeOff, Sliders,
  AlignLeft, AlignCenter, AlignRight, GripVertical, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  TreatmentAsset, TreatmentLandingSection, LandingSectionType, TreatmentProgram,
} from "@/lib/treatment-store"
import { ImagePickerModal } from "@/components/admin/image-picker-modal"

// ─── Shared types ─────────────────────────────────────────────────────────────

type CTAButton = { label: string; url: string }

type GlassStyle = {
  glassmorphism?: boolean
  frostedIntensity?: number   // 0–100
  gradientColor?: string
  gradientIntensity?: number  // 0–100
  bgOpacity?: number          // 0–100
  borderRadius?: number       // px
  shadowIntensity?: number    // 0–100
}

// ─── Section metadata types ────────────────────────────────────────────────────

export type HeroMainVisualMeta = GlassStyle & {
  desktopImageAssetId?: string
  mobileImageAssetId?: string
  badgeText?: string
  showPriceCard?: boolean
  discountPrice?: number
  originalPrice?: number
  priceLabel?: string
  treatmentDuration?: string
  priceCardPosition?: "bottom-left" | "bottom-right" | "bottom-center"
  ctaPrimary?: CTAButton
  ctaSecondary?: CTAButton
}

export type IntroCTAMeta = {
  treatmentName?: string
  englishSubtitle?: string
  introParagraph?: string
  ctaPrimary?: CTAButton
  ctaSecondary?: CTAButton
  textAlign?: "left" | "center" | "right"
  paddingTop?: number
  paddingBottom?: number
}

export type OverviewCardItem = {
  id: string
  number?: number
  title: string
  description: string
  isVisible?: boolean
}

export type OverviewFeatureCardsMeta = {
  sectionLabel?: string
  headline?: string
  description?: string
  cards?: OverviewCardItem[]
  cardStyle?: GlassStyle
}

export type OverviewMediaBlockMeta = {
  mediaType?: "image" | "video"
  imageAssetId?: string
  videoAssetId?: string
  videoUrl?: string
  imageAlt?: string
  aspectRatio?: "16:9" | "4:3" | "1:1" | "3:2"
  borderRadius?: number
  showCTAButtons?: boolean
  ctaPrimary?: CTAButton
  ctaSecondary?: CTAButton
  useBeforeAfter?: boolean
  beforeAssetId?: string
  afterAssetId?: string
}

export type ProcessCard = {
  id: string
  title: string
  value: string
  description?: string
}

export type EffectsProcessMainMeta = {
  sectionLabel?: string
  headline?: string
  description?: string
  summaryTitle?: string
  summaryContent?: string
  effectPoints?: string[]
  processCards?: ProcessCard[]
  cardStyle?: GlassStyle & { dark?: boolean }
}

export type SupportingImage = { id: string; assetId: string; caption?: string }
export type BeforeAfterCard = {
  id: string
  beforeAssetId?: string
  afterAssetId?: string
  label?: string
  description?: string
}

export type EffectsSupportingMediaMeta = {
  images?: SupportingImage[]
  beforeAfterCards?: BeforeAfterCard[]
  layout?: "1col" | "2col"
  description?: string
}

export type AdvantageCard = {
  id: string
  number?: number
  title: string
  description: string
  imageAssetId?: string
}

export type AdvantagesSectionMeta = {
  sectionLabel?: string
  headline?: string
  description?: string
  cards?: AdvantageCard[]
  galleryAssetIds?: string[]
  showCTA?: boolean
  ctaPrimary?: CTAButton
}

export type PrecautionBox = {
  id: string
  type: "before" | "after" | "contraindication" | "note"
  title: string
  content: string
}

export type PrecautionsSectionMeta = {
  sectionLabel?: string
  headline?: string
  description?: string
  boxes?: PrecautionBox[]
  showCTA?: boolean
  ctaPrimary?: CTAButton
}

export type ProgramPricingCard = {
  id: string
  name: string
  badge?: string
  priceRegular?: number
  priceDiscount?: number
  bullets?: string[]
  ctaLabel?: string
  ctaUrl?: string
  isVisible?: boolean
}

export type ProgramPricingMeta = {
  headline?: string
  description?: string
  cards?: ProgramPricingCard[]
  cardLayout?: "vertical" | "2col"
  useLinkedPrograms?: boolean
  borderRadius?: number
  shadowIntensity?: number
  showBorder?: boolean
}

export type FinalCTAContactMeta = {
  headline?: string
  subtext?: string
  ctaPrimary?: CTAButton
  ctaPhone?: { label: string; tel: string }
  ctaKakao?: { label: string; url: string }
  branchName?: string
  address?: string
  hours?: string
  linkToFloatingCTA?: boolean
}

// Legacy types (kept for backward compat)
export type HeroImageMeta = {
  backgroundAssetId?: string; mobileAssetId?: string; overlayStrength?: number
  headline?: string; subheadline?: string; badgeText?: string
  ctaLabel?: string; ctaUrl?: string; ctaSecondaryLabel?: string; ctaSecondaryUrl?: string
  textAlign?: "left" | "center" | "right"; textColor?: "light" | "dark"
}
export type FaqItem = { q: string; a: string; category?: string }
export type FaqBlockMeta = { useAutoLinked?: boolean; faqs?: FaqItem[]; style?: "accordion" | "list"; maxShow?: number }
export type CtaBlockMeta = {
  ctaTitle?: string; ctaSubtitle?: string; btnLabel?: string; btnUrl?: string
  btnVariant?: "primary" | "outline" | "ghost"; secondaryBtnLabel?: string; secondaryBtnUrl?: string
  backgroundStyle?: "light" | "dark" | "gradient" | "image"; backgroundAssetId?: string; alignment?: "left" | "center" | "right"
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  section: TreatmentLandingSection
  allImageAssets: TreatmentAsset[]
  hqImageAssets?: TreatmentAsset[]
  programs?: TreatmentProgram[]
  canEdit: boolean
  onSave: (updates: Partial<TreatmentLandingSection>) => void
  onClose: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onAIRegenerate?: () => void
  onInlineUpload?: (file: File) => TreatmentAsset | Promise<TreatmentAsset>
}

// ─── Label map ────────────────────────────────────────────────────────────────

const SECTION_LABELS: Partial<Record<LandingSectionType, string>> = {
  hero_main_visual: "히어로 메인 비주얼", intro_cta: "시술 소개 & CTA",
  overview_feature_cards: "주요 특징 카드", overview_media_block: "미디어 블록",
  effects_process_main: "시술 효과 & 경과", effects_supporting_media: "효과 미디어 보조",
  advantages_section: "시술 장점", precautions_section: "주의사항",
  program_pricing: "프로그램 & 가격", final_cta_contact: "마지막 CTA & 연락처",
  why_tatoa: "왜 타토아인가", faq_block: "FAQ", hero_image: "히어로 이미지",
  hero_price_cta: "히어로 가격 CTA", treatment_intro: "시술 소개",
  effects_progress: "효과 & 경과", treatment_advantages: "시술 장점",
  treatment_precautions: "주의사항", pricing_program_offer: "프로그램 & 특가",
  final_cta: "마지막 CTA",
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function uid() { return `i_${Date.now()}_${Math.random().toString(36).slice(2,6)}` }
function formatPrice(n?: number) { if (!n) return ""; if (n >= 10000) return `${Math.floor(n/10000)}만원`; return `${n.toLocaleString()}원` }

const PRECAUTION_TYPE_LABELS = { before: "시술 전", after: "시술 후", contraindication: "금기", note: "참고" }
const PRECAUTION_TYPE_COLORS = { before: "bg-blue-50 border-blue-300", after: "bg-green-50 border-green-300", contraindication: "bg-red-50 border-red-300", note: "bg-yellow-50 border-yellow-300" }

// ─── Shared sub-components ────────────────────────────────────────────────────

function FieldRow({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground font-normal">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-1">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function CTAFields({ label, value, onChange, disabled }: { label: string; value?: CTAButton; onChange: (v: CTAButton) => void; disabled?: boolean }) {
  return (
    <div className="space-y-1.5 p-2.5 border rounded-md bg-muted/20">
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
      <Input className="h-7 text-xs" placeholder="버튼 문구" value={value?.label ?? ""} onChange={e => onChange({ ...(value ?? { url: "" }), label: e.target.value })} disabled={disabled} />
      <Input className="h-7 text-xs font-mono" placeholder="URL 또는 tel:02-0000-0000" value={value?.url ?? ""} onChange={e => onChange({ ...(value ?? { label: "" }), url: e.target.value })} disabled={disabled} />
    </div>
  )
}

function GlassStylePanel({ value, onChange, disabled }: { value?: GlassStyle; onChange: (v: GlassStyle) => void; disabled?: boolean }) {
  const v = value ?? {}
  return (
    <div className="space-y-3 p-3 border rounded-md bg-muted/10">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">글래스모피즘 스타일</p>
        <Switch checked={!!v.glassmorphism} onCheckedChange={c => onChange({ ...v, glassmorphism: c })} disabled={disabled} />
      </div>
      {v.glassmorphism && (
        <>
          <FieldRow label={`프로스티드 강도 ${v.frostedIntensity ?? 60}%`}>
            <Slider value={[v.frostedIntensity ?? 60]} min={0} max={100} step={5} onValueChange={([n]) => onChange({ ...v, frostedIntensity: n })} disabled={disabled} />
          </FieldRow>
          <FieldRow label={`배경 투명도 ${v.bgOpacity ?? 70}%`}>
            <Slider value={[v.bgOpacity ?? 70]} min={10} max={100} step={5} onValueChange={([n]) => onChange({ ...v, bgOpacity: n })} disabled={disabled} />
          </FieldRow>
        </>
      )}
      <FieldRow label={`그라데이션 강도 ${v.gradientIntensity ?? 40}%`}>
        <Slider value={[v.gradientIntensity ?? 40]} min={0} max={100} step={5} onValueChange={([n]) => onChange({ ...v, gradientIntensity: n })} disabled={disabled} />
      </FieldRow>
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label={`모서리 ${v.borderRadius ?? 12}px`}>
          <Slider value={[v.borderRadius ?? 12]} min={0} max={32} step={2} onValueChange={([n]) => onChange({ ...v, borderRadius: n })} disabled={disabled} />
        </FieldRow>
        <FieldRow label={`그림자 ${v.shadowIntensity ?? 30}%`}>
          <Slider value={[v.shadowIntensity ?? 30]} min={0} max={100} step={5} onValueChange={([n]) => onChange({ ...v, shadowIntensity: n })} disabled={disabled} />
        </FieldRow>
      </div>
    </div>
  )
}

function ImagePickerField({ label, asset, onOpen, onClear, disabled }: { label: string; asset?: TreatmentAsset; onOpen: () => void; onClear: () => void; disabled?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground font-normal">{label}</Label>
      {asset ? (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/20">
          <img src={asset.fileUrl} alt={asset.title ?? asset.fileName} className="h-10 w-16 object-cover rounded" />
          <span className="flex-1 text-xs truncate">{asset.title ?? asset.fileName}</span>
          {!disabled && <button onClick={onClear} className="text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>}
        </div>
      ) : (
        <button onClick={onOpen} disabled={disabled} className="w-full border-2 border-dashed rounded-md p-3 text-xs text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors flex items-center justify-center gap-2">
          <ImageIcon className="h-4 w-4" />이미지 선택
        </button>
      )}
    </div>
  )
}

// ─── Section-specific forms ────────────────────────────────────────────────────

// [1] Hero Main Visual
function HeroMainVisualForm({ meta, assetById, onOpenPicker, onClear, onChange, disabled }: {
  meta: HeroMainVisualMeta; assetById: (id?: string) => TreatmentAsset | undefined
  onOpenPicker: (slot: string) => void; onClear: (slot: string) => void
  onChange: (p: Partial<HeroMainVisualMeta>) => void; disabled?: boolean
}) {
  return (
    <div className="space-y-4">
      <Divider label="배경 이미지" />
      <ImagePickerField label="데스크톱 배경" asset={assetById(meta.desktopImageAssetId)} onOpen={() => onOpenPicker("heroDesktop")} onClear={() => onClear("heroDesktop")} disabled={disabled} />
      <ImagePickerField label="모바일 배경" asset={assetById(meta.mobileImageAssetId)} onOpen={() => onOpenPicker("heroMobile")} onClear={() => onClear("heroMobile")} disabled={disabled} />

      <Divider label="뱃지 & 가격 카드" />
      <FieldRow label="뱃지 텍스트 (예: NEW / 2025 SIGNATURE)">
        <Input className="h-7 text-xs" value={meta.badgeText ?? ""} onChange={e => onChange({ badgeText: e.target.value })} disabled={disabled} placeholder="NEW" />
      </FieldRow>
      <div className="flex items-center gap-2">
        <Switch checked={!!meta.showPriceCard} onCheckedChange={c => onChange({ showPriceCard: c })} disabled={disabled} />
        <Label className="text-xs">가격 카드 표시</Label>
      </div>
      {meta.showPriceCard && (
        <div className="space-y-2 pl-2">
          <div className="grid grid-cols-2 gap-2">
            <FieldRow label="할인가 (원)">
              <Input className="h-7 text-xs" type="number" value={meta.discountPrice ?? ""} onChange={e => onChange({ discountPrice: Number(e.target.value) || undefined })} disabled={disabled} />
            </FieldRow>
            <FieldRow label="정가 (원)">
              <Input className="h-7 text-xs" type="number" value={meta.originalPrice ?? ""} onChange={e => onChange({ originalPrice: Number(e.target.value) || undefined })} disabled={disabled} />
            </FieldRow>
          </div>
          <FieldRow label="가격 레이블 (예: 이벤트가)">
            <Input className="h-7 text-xs" value={meta.priceLabel ?? ""} onChange={e => onChange({ priceLabel: e.target.value })} disabled={disabled} />
          </FieldRow>
          <FieldRow label="시술 시간 (예: 약 40분)">
            <Input className="h-7 text-xs" value={meta.treatmentDuration ?? ""} onChange={e => onChange({ treatmentDuration: e.target.value })} disabled={disabled} />
          </FieldRow>
          <FieldRow label="카드 위치">
            <Select value={meta.priceCardPosition ?? "bottom-left"} onValueChange={v => onChange({ priceCardPosition: v as HeroMainVisualMeta["priceCardPosition"] })} disabled={disabled}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-left" className="text-xs">좌하단</SelectItem>
                <SelectItem value="bottom-right" className="text-xs">우하단</SelectItem>
                <SelectItem value="bottom-center" className="text-xs">하단 중앙</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <GlassStylePanel value={meta} onChange={p => onChange(p)} disabled={disabled} />
        </div>
      )}

      <Divider label="CTA 버튼" />
      <CTAFields label="메인 CTA" value={meta.ctaPrimary} onChange={v => onChange({ ctaPrimary: v })} disabled={disabled} />
      <CTAFields label="보조 CTA" value={meta.ctaSecondary} onChange={v => onChange({ ctaSecondary: v })} disabled={disabled} />
    </div>
  )
}

// [2] Intro CTA
function IntroCTAForm({ meta, onChange, disabled }: { meta: IntroCTAMeta; onChange: (p: Partial<IntroCTAMeta>) => void; disabled?: boolean }) {
  return (
    <div className="space-y-4">
      <FieldRow label="시술명"><Input className="h-7 text-sm" value={meta.treatmentName ?? ""} onChange={e => onChange({ treatmentName: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="영문 서브 타이틀 (예: Lifting Treatment)"><Input className="h-7 text-xs" value={meta.englishSubtitle ?? ""} onChange={e => onChange({ englishSubtitle: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="소개 문단" hint="Enter로 줄바꿈 가능">
        <Textarea rows={5} className="text-sm resize-none" value={meta.introParagraph ?? ""} onChange={e => onChange({ introParagraph: e.target.value })} disabled={disabled} />
      </FieldRow>
      <Divider label="텍스트 정렬" />
      <div className="flex gap-2">
        {(["left","center","right"] as const).map(a => (
          <button key={a} onClick={() => onChange({ textAlign: a })} disabled={disabled}
            className={cn("flex-1 h-8 border rounded text-xs flex items-center justify-center gap-1 transition-colors", meta.textAlign === a ? "bg-primary text-white border-primary" : "text-muted-foreground hover:bg-muted")}>
            {a === "left" ? <AlignLeft className="h-3.5 w-3.5" /> : a === "center" ? <AlignCenter className="h-3.5 w-3.5" /> : <AlignRight className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>
      <Divider label="CTA 버튼" />
      <CTAFields label="메인 CTA" value={meta.ctaPrimary} onChange={v => onChange({ ctaPrimary: v })} disabled={disabled} />
      <CTAFields label="보조 CTA" value={meta.ctaSecondary} onChange={v => onChange({ ctaSecondary: v })} disabled={disabled} />
    </div>
  )
}

// [3] Overview Feature Cards
function OverviewFeatureCardsForm({ meta, onChange, disabled }: { meta: OverviewFeatureCardsMeta; onChange: (p: Partial<OverviewFeatureCardsMeta>) => void; disabled?: boolean }) {
  const cards = meta.cards ?? []
  function updateCard(id: string, p: Partial<OverviewCardItem>) {
    onChange({ cards: cards.map(c => c.id === id ? { ...c, ...p } : c) })
  }
  function deleteCard(id: string) { onChange({ cards: cards.filter(c => c.id !== id) }) }
  function addCard() {
    onChange({ cards: [...cards, { id: uid(), number: cards.length + 1, title: "", description: "", isVisible: true }] })
  }
  function moveCard(idx: number, dir: -1 | 1) {
    const arr = [...cards]; [arr[idx], arr[idx+dir]] = [arr[idx+dir], arr[idx]]; onChange({ cards: arr })
  }
  return (
    <div className="space-y-4">
      <FieldRow label="섹션 라벨 (예: OVERVIEW)"><Input className="h-7 text-xs" value={meta.sectionLabel ?? ""} onChange={e => onChange({ sectionLabel: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="헤드라인"><Input className="h-8 text-sm" value={meta.headline ?? ""} onChange={e => onChange({ headline: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="설명" hint="Enter로 줄바꿈 가능"><Textarea rows={3} className="text-sm resize-none" value={meta.description ?? ""} onChange={e => onChange({ description: e.target.value })} disabled={disabled} /></FieldRow>
      <Divider label="특징 카드" />
      <div className="space-y-2">
        {cards.map((card, idx) => (
          <div key={card.id} className="border rounded-md p-3 space-y-2 bg-muted/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground w-6">#{card.number ?? idx+1}</span>
              <Input className="flex-1 h-7 text-xs" placeholder="카드 제목" value={card.title} onChange={e => updateCard(card.id, { title: e.target.value })} disabled={disabled} />
              <div className="flex gap-0.5">
                <button onClick={() => moveCard(idx, -1)} disabled={idx===0||disabled} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                <button onClick={() => moveCard(idx, 1)} disabled={idx===cards.length-1||disabled} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                <button onClick={() => updateCard(card.id, { isVisible: !card.isVisible })} disabled={disabled} className="p-1 text-muted-foreground hover:text-foreground">
                  {card.isVisible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>
                {!disabled && <button onClick={() => deleteCard(card.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>}
              </div>
            </div>
            <Textarea rows={2} className="text-xs resize-none" placeholder="카드 설명" value={card.description} onChange={e => updateCard(card.id, { description: e.target.value })} disabled={disabled} />
          </div>
        ))}
      </div>
      {!disabled && <Button size="sm" variant="outline" className="h-7 text-xs w-full gap-1" onClick={addCard}><Plus className="h-3 w-3" />카드 추가</Button>}
      <Divider label="카드 스타일" />
      <GlassStylePanel value={meta.cardStyle} onChange={cs => onChange({ cardStyle: { ...(meta.cardStyle??{}), ...cs } })} disabled={disabled} />
    </div>
  )
}

// [4] Overview Media Block
function OverviewMediaBlockForm({ meta, assetById, onOpenPicker, onClear, onChange, disabled }: {
  meta: OverviewMediaBlockMeta; assetById: (id?: string) => TreatmentAsset | undefined
  onOpenPicker: (slot: string) => void; onClear: (slot: string) => void
  onChange: (p: Partial<OverviewMediaBlockMeta>) => void; disabled?: boolean
}) {
  return (
    <div className="space-y-4">
      <FieldRow label="미디어 유형">
        <Select value={meta.mediaType ?? "image"} onValueChange={v => onChange({ mediaType: v as "image"|"video" })} disabled={disabled}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="image" className="text-xs">이미지</SelectItem>
            <SelectItem value="video" className="text-xs">영상</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      {meta.mediaType !== "video"
        ? <ImagePickerField label="메인 이미지" asset={assetById(meta.imageAssetId)} onOpen={() => onOpenPicker("mediaMain")} onClear={() => onClear("mediaMain")} disabled={disabled} />
        : <FieldRow label="영상 URL (YouTube / Vimeo / 직접 업로드 URL)"><Input className="h-7 text-xs font-mono" value={meta.videoUrl ?? ""} onChange={e => onChange({ videoUrl: e.target.value })} disabled={disabled} /></FieldRow>
      }
      <FieldRow label="비율">
        <Select value={meta.aspectRatio ?? "16:9"} onValueChange={v => onChange({ aspectRatio: v as OverviewMediaBlockMeta["aspectRatio"] })} disabled={disabled}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["16:9","4:3","3:2","1:1"].map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label={`모서리 ${meta.borderRadius ?? 12}px`}>
        <Slider value={[meta.borderRadius ?? 12]} min={0} max={40} step={2} onValueChange={([n]) => onChange({ borderRadius: n })} disabled={disabled} />
      </FieldRow>
      <div className="flex items-center gap-2"><Switch checked={!!meta.showCTAButtons} onCheckedChange={c => onChange({ showCTAButtons: c })} disabled={disabled} /><Label className="text-xs">CTA 버튼 표시</Label></div>
      {meta.showCTAButtons && (
        <div className="pl-2 space-y-2">
          <CTAFields label="메인 CTA" value={meta.ctaPrimary} onChange={v => onChange({ ctaPrimary: v })} disabled={disabled} />
          <CTAFields label="보조 CTA" value={meta.ctaSecondary} onChange={v => onChange({ ctaSecondary: v })} disabled={disabled} />
        </div>
      )}
      <Divider label="비포/애프터" />
      <div className="flex items-center gap-2"><Switch checked={!!meta.useBeforeAfter} onCheckedChange={c => onChange({ useBeforeAfter: c })} disabled={disabled} /><Label className="text-xs">비포/애프터 사용</Label></div>
      {meta.useBeforeAfter && (
        <div className="pl-2 space-y-2">
          <ImagePickerField label="Before 이미지" asset={assetById(meta.beforeAssetId)} onOpen={() => onOpenPicker("mediaBefore")} onClear={() => onClear("mediaBefore")} disabled={disabled} />
          <ImagePickerField label="After 이미지" asset={assetById(meta.afterAssetId)} onOpen={() => onOpenPicker("mediaAfter")} onClear={() => onClear("mediaAfter")} disabled={disabled} />
        </div>
      )}
    </div>
  )
}

// [5] Effects Process Main
function EffectsProcessMainForm({ meta, onChange, disabled }: { meta: EffectsProcessMainMeta; onChange: (p: Partial<EffectsProcessMainMeta>) => void; disabled?: boolean }) {
  const effectPoints = meta.effectPoints ?? []
  const processCards = meta.processCards ?? []
  function updateProcess(id: string, p: Partial<ProcessCard>) {
    onChange({ processCards: processCards.map(c => c.id === id ? { ...c, ...p } : c) })
  }
  return (
    <div className="space-y-4">
      <FieldRow label="섹션 라벨 (예: EFFECTS & PROCESS)"><Input className="h-7 text-xs" value={meta.sectionLabel ?? ""} onChange={e => onChange({ sectionLabel: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="헤드라인"><Input className="h-8 text-sm" value={meta.headline ?? ""} onChange={e => onChange({ headline: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="설명 문단" hint="Enter 줄바꿈 가능"><Textarea rows={3} className="text-sm resize-none" value={meta.description ?? ""} onChange={e => onChange({ description: e.target.value })} disabled={disabled} /></FieldRow>
      <Divider label="요약 카드" />
      <FieldRow label="요약 카드 제목"><Input className="h-7 text-xs" value={meta.summaryTitle ?? ""} onChange={e => onChange({ summaryTitle: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="요약 카드 내용" hint="Enter 줄바꿈 가능"><Textarea rows={3} className="text-sm resize-none" value={meta.summaryContent ?? ""} onChange={e => onChange({ summaryContent: e.target.value })} disabled={disabled} /></FieldRow>
      <Divider label="기대 효과 리스트" />
      <div className="space-y-1.5">
        {effectPoints.map((pt, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input className="flex-1 h-7 text-xs" value={pt} onChange={e => { const arr=[...effectPoints]; arr[i]=e.target.value; onChange({ effectPoints: arr }) }} disabled={disabled} />
            {!disabled && <button onClick={() => onChange({ effectPoints: effectPoints.filter((_,j)=>j!==i) })} className="text-red-400 hover:text-red-600"><X className="h-3 w-3" /></button>}
          </div>
        ))}
      </div>
      {!disabled && <Button size="sm" variant="outline" className="h-7 text-xs w-full gap-1" onClick={() => onChange({ effectPoints: [...effectPoints, ""] })}><Plus className="h-3 w-3" />효과 추가</Button>}
      <Divider label="경과 카드" />
      <div className="space-y-2">
        {processCards.map((card) => (
          <div key={card.id} className="grid grid-cols-3 gap-1.5 p-2 border rounded-md bg-muted/10">
            <Input className="h-7 text-xs" placeholder="제목 (예: 붓기)" value={card.title} onChange={e => updateProcess(card.id, { title: e.target.value })} disabled={disabled} />
            <Input className="h-7 text-xs" placeholder="값 (예: 3~5일)" value={card.value} onChange={e => updateProcess(card.id, { value: e.target.value })} disabled={disabled} />
            <div className="flex gap-1">
              <Input className="flex-1 h-7 text-xs" placeholder="설명" value={card.description ?? ""} onChange={e => updateProcess(card.id, { description: e.target.value })} disabled={disabled} />
              {!disabled && <button onClick={() => onChange({ processCards: processCards.filter(c=>c.id!==card.id) })} className="text-red-400 hover:text-red-600 shrink-0"><X className="h-3 w-3" /></button>}
            </div>
          </div>
        ))}
      </div>
      {!disabled && <Button size="sm" variant="outline" className="h-7 text-xs w-full gap-1" onClick={() => onChange({ processCards: [...processCards, { id: uid(), title: "", value: "", description: "" }] })}><Plus className="h-3 w-3" />경과 카드 추가</Button>}
      <Divider label="카드 스타일" />
      <GlassStylePanel value={meta.cardStyle} onChange={cs => onChange({ cardStyle: { ...(meta.cardStyle??{}), ...cs } })} disabled={disabled} />
    </div>
  )
}

// [6] Effects Supporting Media
function EffectsSupportingMediaForm({ meta, assetById, onOpenPicker, onClear, onChange, disabled }: {
  meta: EffectsSupportingMediaMeta; assetById: (id?: string) => TreatmentAsset | undefined
  onOpenPicker: (slot: string) => void; onClear: (slot: string) => void
  onChange: (p: Partial<EffectsSupportingMediaMeta>) => void; disabled?: boolean
}) {
  const images = meta.images ?? []
  const baCards = meta.beforeAfterCards ?? []
  return (
    <div className="space-y-4">
      <FieldRow label="레이아웃">
        <Select value={meta.layout ?? "2col"} onValueChange={v => onChange({ layout: v as "1col"|"2col" })} disabled={disabled}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1col" className="text-xs">1열</SelectItem>
            <SelectItem value="2col" className="text-xs">2열</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="설명 문구" hint="Enter 줄바꿈 가능"><Textarea rows={2} className="text-sm resize-none" value={meta.description ?? ""} onChange={e => onChange({ description: e.target.value })} disabled={disabled} /></FieldRow>
      <Divider label="지지 이미지" />
      <div className="space-y-2">
        {images.map((img, i) => (
          <div key={img.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/10">
            {assetById(img.assetId) ? (
              <img src={assetById(img.assetId)!.fileUrl} className="h-8 w-12 object-cover rounded" alt="" />
            ) : (
              <button onClick={() => onOpenPicker(`suppImg_${i}`)} disabled={disabled} className="h-8 w-12 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground hover:border-primary/50">
                <ImageIcon className="h-3 w-3" />
              </button>
            )}
            <Input className="flex-1 h-7 text-xs" placeholder="캡션" value={img.caption ?? ""} onChange={e => onChange({ images: images.map((im,j)=>j===i?{...im,caption:e.target.value}:im) })} disabled={disabled} />
            {!disabled && <button onClick={() => onChange({ images: images.filter((_,j)=>j!==i) })} className="text-red-400 hover:text-red-600"><X className="h-3 w-3" /></button>}
          </div>
        ))}
      </div>
      {!disabled && <Button size="sm" variant="outline" className="h-7 text-xs w-full gap-1" onClick={() => onChange({ images: [...images, { id: uid(), assetId: "" }] })}><Plus className="h-3 w-3" />이미지 추가</Button>}
      <Divider label="비포/애프터 카드" />
      <div className="space-y-2">
        {baCards.map((card, i) => (
          <div key={card.id} className="p-2 border rounded-md space-y-1.5 bg-muted/10">
            <div className="grid grid-cols-2 gap-2">
              <ImagePickerField label="Before" asset={assetById(card.beforeAssetId)} onOpen={() => onOpenPicker(`ba_before_${i}`)} onClear={() => onChange({ beforeAfterCards: baCards.map((c,j)=>j===i?{...c,beforeAssetId:undefined}:c) })} disabled={disabled} />
              <ImagePickerField label="After" asset={assetById(card.afterAssetId)} onOpen={() => onOpenPicker(`ba_after_${i}`)} onClear={() => onChange({ beforeAfterCards: baCards.map((c,j)=>j===i?{...c,afterAssetId:undefined}:c) })} disabled={disabled} />
            </div>
            <div className="flex gap-1.5">
              <Input className="flex-1 h-7 text-xs" placeholder="레이블" value={card.label ?? ""} onChange={e => onChange({ beforeAfterCards: baCards.map((c,j)=>j===i?{...c,label:e.target.value}:c) })} disabled={disabled} />
              {!disabled && <button onClick={() => onChange({ beforeAfterCards: baCards.filter((_,j)=>j!==i) })} className="text-red-400 hover:text-red-600 shrink-0 h-7 px-1"><X className="h-3 w-3" /></button>}
            </div>
          </div>
        ))}
      </div>
      {!disabled && <Button size="sm" variant="outline" className="h-7 text-xs w-full gap-1" onClick={() => onChange({ beforeAfterCards: [...baCards, { id: uid() }] })}><Plus className="h-3 w-3" />비포/애프터 추가</Button>}
    </div>
  )
}

// [7] Advantages Section
function AdvantagesSectionForm({ meta, assetById, onOpenPicker, onClear, onChange, disabled }: {
  meta: AdvantagesSectionMeta; assetById: (id?: string) => TreatmentAsset | undefined
  onOpenPicker: (slot: string) => void; onClear: (slot: string) => void
  onChange: (p: Partial<AdvantagesSectionMeta>) => void; disabled?: boolean
}) {
  const cards = meta.cards ?? []
  function updateCard(id: string, p: Partial<AdvantageCard>) { onChange({ cards: cards.map(c => c.id===id?{...c,...p}:c) }) }
  return (
    <div className="space-y-4">
      <FieldRow label="섹션 라벨 (예: ADVANTAGES)"><Input className="h-7 text-xs" value={meta.sectionLabel ?? ""} onChange={e => onChange({ sectionLabel: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="헤드라인"><Input className="h-8 text-sm" value={meta.headline ?? ""} onChange={e => onChange({ headline: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="설명" hint="Enter 줄바꿈 가능"><Textarea rows={2} className="text-sm resize-none" value={meta.description ?? ""} onChange={e => onChange({ description: e.target.value })} disabled={disabled} /></FieldRow>
      <Divider label="장점 카드" />
      <div className="space-y-2">
        {cards.map((card, i) => (
          <div key={card.id} className="border rounded-md p-3 space-y-2 bg-muted/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground w-6">#{card.number ?? i+1}</span>
              <Input className="flex-1 h-7 text-xs" placeholder="장점 제목" value={card.title} onChange={e => updateCard(card.id, { title: e.target.value })} disabled={disabled} />
              {!disabled && <button onClick={() => onChange({ cards: cards.filter(c=>c.id!==card.id) })} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>}
            </div>
            <Textarea rows={2} className="text-xs resize-none" placeholder="장점 설명" value={card.description} onChange={e => updateCard(card.id, { description: e.target.value })} disabled={disabled} />
            <ImagePickerField label="이미지 (선택)" asset={assetById(card.imageAssetId)} onOpen={() => onOpenPicker(`adv_${i}`)} onClear={() => updateCard(card.id, { imageAssetId: undefined })} disabled={disabled} />
          </div>
        ))}
      </div>
      {!disabled && <Button size="sm" variant="outline" className="h-7 text-xs w-full gap-1" onClick={() => onChange({ cards: [...cards, { id: uid(), number: cards.length+1, title: "", description: "" }] })}><Plus className="h-3 w-3" />장점 추가</Button>}
      <Divider label="하단 CTA" />
      <div className="flex items-center gap-2"><Switch checked={!!meta.showCTA} onCheckedChange={c => onChange({ showCTA: c })} disabled={disabled} /><Label className="text-xs">CTA 버튼 표시</Label></div>
      {meta.showCTA && <CTAFields label="CTA" value={meta.ctaPrimary} onChange={v => onChange({ ctaPrimary: v })} disabled={disabled} />}
    </div>
  )
}

// [8] Precautions Section
function PrecautionsSectionForm({ meta, onChange, disabled }: { meta: PrecautionsSectionMeta; onChange: (p: Partial<PrecautionsSectionMeta>) => void; disabled?: boolean }) {
  const boxes = meta.boxes ?? []
  function updateBox(id: string, p: Partial<PrecautionBox>) { onChange({ boxes: boxes.map(b => b.id===id?{...b,...p}:b) }) }
  function moveBox(idx: number, dir: -1|1) { const arr=[...boxes]; [arr[idx],arr[idx+dir]]=[arr[idx+dir],arr[idx]]; onChange({ boxes: arr }) }
  return (
    <div className="space-y-4">
      <FieldRow label="섹션 라벨 (예: PRECAUTIONS)"><Input className="h-7 text-xs" value={meta.sectionLabel ?? ""} onChange={e => onChange({ sectionLabel: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="헤드라인"><Input className="h-8 text-sm" value={meta.headline ?? ""} onChange={e => onChange({ headline: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="설명" hint="Enter 줄바꿈 가능"><Textarea rows={2} className="text-sm resize-none" value={meta.description ?? ""} onChange={e => onChange({ description: e.target.value })} disabled={disabled} /></FieldRow>
      <Divider label="주의사항 박스" />
      <div className="space-y-2">
        {boxes.map((box, i) => (
          <div key={box.id} className={cn("border rounded-md p-3 space-y-2", PRECAUTION_TYPE_COLORS[box.type])}>
            <div className="flex items-center gap-2">
              <Select value={box.type} onValueChange={v => updateBox(box.id, { type: v as PrecautionBox["type"] })} disabled={disabled}>
                <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRECAUTION_TYPE_LABELS).map(([k,v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="flex-1 h-7 text-xs" placeholder="박스 제목" value={box.title} onChange={e => updateBox(box.id, { title: e.target.value })} disabled={disabled} />
              <div className="flex gap-0.5">
                <button onClick={() => moveBox(i,-1)} disabled={i===0||disabled} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                <button onClick={() => moveBox(i,1)} disabled={i===boxes.length-1||disabled} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                {!disabled && <button onClick={() => onChange({ boxes: boxes.filter(b=>b.id!==box.id) })} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>}
              </div>
            </div>
            <Textarea rows={2} className="text-xs resize-none bg-white/60" placeholder="박스 내용 (Enter로 줄바꿈)" value={box.content} onChange={e => updateBox(box.id, { content: e.target.value })} disabled={disabled} />
          </div>
        ))}
      </div>
      {!disabled && (
        <div className="flex gap-2">
          {(["before","after","contraindication","note"] as const).map(t => (
            <Button key={t} size="sm" variant="outline" className="flex-1 h-7 text-[10px]" onClick={() => onChange({ boxes: [...boxes, { id: uid(), type: t, title: PRECAUTION_TYPE_LABELS[t], content: "" }] })}>
              +{PRECAUTION_TYPE_LABELS[t]}
            </Button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2"><Switch checked={!!meta.showCTA} onCheckedChange={c => onChange({ showCTA: c })} disabled={disabled} /><Label className="text-xs">CTA 버튼 표시</Label></div>
      {meta.showCTA && <CTAFields label="CTA" value={meta.ctaPrimary} onChange={v => onChange({ ctaPrimary: v })} disabled={disabled} />}
    </div>
  )
}

// [10] Program Pricing
function ProgramPricingForm({ meta, programs, onChange, disabled }: {
  meta: ProgramPricingMeta; programs?: TreatmentProgram[]
  onChange: (p: Partial<ProgramPricingMeta>) => void; disabled?: boolean
}) {
  const cards = meta.cards ?? []
  function updateCard(id: string, p: Partial<ProgramPricingCard>) { onChange({ cards: cards.map(c=>c.id===id?{...c,...p}:c) }) }
  function importFromPrograms() {
    if (!programs) return
    const newCards: ProgramPricingCard[] = programs.map(p => ({
      id: uid(), name: p.name, badge: "", priceRegular: p.priceRegular, priceDiscount: p.priceDiscount,
      bullets: p.description ? [p.description] : [], ctaLabel: "상담 신청", ctaUrl: "", isVisible: p.isPublic,
    }))
    onChange({ cards: newCards })
  }
  return (
    <div className="space-y-4">
      <FieldRow label="헤드라인"><Input className="h-8 text-sm" value={meta.headline ?? ""} onChange={e => onChange({ headline: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="설명 문구" hint="Enter 줄바꿈 가능"><Textarea rows={2} className="text-sm resize-none" value={meta.description ?? ""} onChange={e => onChange({ description: e.target.value })} disabled={disabled} /></FieldRow>
      <div className="flex items-center gap-2">
        <FieldRow label="카드 레이아웃">
          <Select value={meta.cardLayout ?? "vertical"} onValueChange={v => onChange({ cardLayout: v as "vertical"|"2col" })} disabled={disabled}>
            <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vertical" className="text-xs">세로형 기본</SelectItem>
              <SelectItem value="2col" className="text-xs">2열 카드형</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
      {programs && programs.length > 0 && !disabled && (
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 w-full" onClick={importFromPrograms}>
          <RefreshCw className="h-3 w-3" />시술 프로그램에서 가져오기 ({programs.length}개)
        </Button>
      )}
      <Divider label="프로그램 카드" />
      <div className="space-y-3">
        {cards.map((card) => (
          <div key={card.id} className="border rounded-lg p-3 space-y-2 bg-muted/10">
            <div className="flex items-center gap-2">
              <Input className="flex-1 h-7 text-sm font-medium" placeholder="프로그램명" value={card.name} onChange={e => updateCard(card.id, { name: e.target.value })} disabled={disabled} />
              <button onClick={() => updateCard(card.id, { isVisible: !card.isVisible })} disabled={disabled} className="p-1 text-muted-foreground hover:text-foreground">
                {card.isVisible!==false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-red-400" />}
              </button>
              {!disabled && <button onClick={() => onChange({ cards: cards.filter(c=>c.id!==card.id) })} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <FieldRow label="뱃지"><Input className="h-7 text-xs" placeholder="추천 / 인기" value={card.badge??""} onChange={e => updateCard(card.id,{badge:e.target.value})} disabled={disabled} /></FieldRow>
              <FieldRow label="정가(원)"><Input className="h-7 text-xs" type="number" value={card.priceRegular??""} onChange={e => updateCard(card.id,{priceRegular:Number(e.target.value)||undefined})} disabled={disabled} /></FieldRow>
              <FieldRow label="할인가(원)"><Input className="h-7 text-xs" type="number" value={card.priceDiscount??""} onChange={e => updateCard(card.id,{priceDiscount:Number(e.target.value)||undefined})} disabled={disabled} /></FieldRow>
            </div>
            <FieldRow label="설명 bullet (한 줄씩)">
              <Textarea rows={3} className="text-xs resize-none" placeholder={"첫 번째 포인트\n두 번째 포인트"} value={(card.bullets??[]).join("\n")} onChange={e => updateCard(card.id, { bullets: e.target.value.split("\n") })} disabled={disabled} />
            </FieldRow>
            <CTAFields label="카드 CTA" value={{ label: card.ctaLabel ?? "상담 신청", url: card.ctaUrl ?? "" }} onChange={v => updateCard(card.id, { ctaLabel: v.label, ctaUrl: v.url })} disabled={disabled} />
          </div>
        ))}
      </div>
      {!disabled && <Button size="sm" variant="outline" className="h-7 text-xs w-full gap-1" onClick={() => onChange({ cards: [...cards, { id: uid(), name: "", bullets: [], ctaLabel: "상담 신청", ctaUrl: "", isVisible: true }] })}><Plus className="h-3 w-3" />프로그램 카드 추가</Button>}
    </div>
  )
}

// [11] FAQ Block (enhanced)
function FaqForm({ meta, onChange, disabled }: {
  meta: { faqs?: FaqItem[]; headline?: string; description?: string; style?: "accordion"|"list"; useAutoLinked?: boolean }
  onChange: (p: Partial<typeof meta>) => void; disabled?: boolean
}) {
  const faqs = meta.faqs ?? []
  function updateFaq(i: number, p: Partial<FaqItem>) { const arr=[...faqs]; arr[i]={...arr[i],...p}; onChange({faqs:arr}) }
  return (
    <div className="space-y-4">
      <FieldRow label="헤드라인"><Input className="h-8 text-sm" value={meta.headline ?? ""} onChange={e => onChange({ headline: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="설명 문구" hint="Enter 줄바꿈 가능"><Textarea rows={2} className="text-sm resize-none" value={meta.description ?? ""} onChange={e => onChange({ description: e.target.value })} disabled={disabled} /></FieldRow>
      <Divider label="FAQ 목록" />
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="border rounded-md p-3 space-y-1.5 bg-muted/10">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-primary w-5">Q{i+1}</span>
              <Input className="flex-1 h-7 text-xs" placeholder="질문" value={faq.q} onChange={e => updateFaq(i,{q:e.target.value})} disabled={disabled} />
              {!disabled && <button onClick={() => onChange({faqs:faqs.filter((_,j)=>j!==i)})} className="text-red-400 hover:text-red-600"><X className="h-3 w-3" /></button>}
            </div>
            <Textarea rows={2} className="text-xs resize-none" placeholder="답변 (Enter 줄바꿈 가능)" value={faq.a} onChange={e => updateFaq(i,{a:e.target.value})} disabled={disabled} />
          </div>
        ))}
      </div>
      {!disabled && <Button size="sm" variant="outline" className="h-7 text-xs w-full gap-1" onClick={() => onChange({faqs:[...faqs,{q:"",a:""}]})}><Plus className="h-3 w-3" />FAQ 추가</Button>}
    </div>
  )
}

// [12] Final CTA Contact
function FinalCTAContactForm({ meta, onChange, disabled }: { meta: FinalCTAContactMeta; onChange: (p: Partial<FinalCTAContactMeta>) => void; disabled?: boolean }) {
  return (
    <div className="space-y-4">
      <FieldRow label="CTA 헤드라인"><Input className="h-8 text-sm" value={meta.headline ?? ""} onChange={e => onChange({ headline: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="보조 문구" hint="Enter 줄바꿈 가능"><Textarea rows={2} className="text-sm resize-none" value={meta.subtext ?? ""} onChange={e => onChange({ subtext: e.target.value })} disabled={disabled} /></FieldRow>
      <Divider label="CTA 버튼" />
      <CTAFields label="메인 버튼 (상담/예약)" value={meta.ctaPrimary} onChange={v => onChange({ ctaPrimary: v })} disabled={disabled} />
      <div className="space-y-1.5 p-2.5 border rounded-md bg-muted/20">
        <p className="text-[10px] font-medium text-muted-foreground">전화 문의</p>
        <Input className="h-7 text-xs" placeholder="버튼 문구" value={meta.ctaPhone?.label ?? ""} onChange={e => onChange({ ctaPhone: { ...(meta.ctaPhone??{tel:""}), label: e.target.value } })} disabled={disabled} />
        <Input className="h-7 text-xs font-mono" placeholder="tel:02-0000-0000" value={meta.ctaPhone?.tel ?? ""} onChange={e => onChange({ ctaPhone: { ...(meta.ctaPhone??{label:"전화 문의"}), tel: e.target.value } })} disabled={disabled} />
      </div>
      <div className="space-y-1.5 p-2.5 border rounded-md bg-muted/20">
        <p className="text-[10px] font-medium text-muted-foreground">카카오 문의</p>
        <Input className="h-7 text-xs" placeholder="버튼 문구" value={meta.ctaKakao?.label ?? ""} onChange={e => onChange({ ctaKakao: { ...(meta.ctaKakao??{url:""}), label: e.target.value } })} disabled={disabled} />
        <Input className="h-7 text-xs font-mono" placeholder="카카오 링크" value={meta.ctaKakao?.url ?? ""} onChange={e => onChange({ ctaKakao: { ...(meta.ctaKakao??{label:"카카오 문의"}), url: e.target.value } })} disabled={disabled} />
      </div>
      <Divider label="지점 정보" />
      <FieldRow label="지점명"><Input className="h-7 text-xs" value={meta.branchName ?? ""} onChange={e => onChange({ branchName: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="주소"><Input className="h-7 text-xs" value={meta.address ?? ""} onChange={e => onChange({ address: e.target.value })} disabled={disabled} /></FieldRow>
      <FieldRow label="운영시간" hint="Enter 줄바꿈 가능"><Textarea rows={2} className="text-sm resize-none" value={meta.hours ?? ""} onChange={e => onChange({ hours: e.target.value })} disabled={disabled} /></FieldRow>
      <div className="flex items-center gap-2"><Switch checked={!!meta.linkToFloatingCTA} onCheckedChange={c => onChange({ linkToFloatingCTA: c })} disabled={disabled} /><Label className="text-xs">하단 고정 CTA와 연결</Label></div>
    </div>
  )
}

// ─── Preview ──────────────────────────────────────────────────────────────────

// NOTE: All text uses whitespace-pre-wrap to render \n as line breaks in real time
function SectionPreview({
  sectionType, title, subtitle, body, meta,
  assetById, programs,
}: {
  sectionType: LandingSectionType
  title: string; subtitle: string; body: string
  meta: Record<string, unknown>
  assetById: (id?: string) => TreatmentAsset | undefined
  programs?: TreatmentProgram[]
}) {
  const m = meta as Record<string, unknown>

  // Hero Main Visual preview
  if (sectionType === "hero_main_visual") {
    const hm = m as HeroMainVisualMeta
    const bgAsset = assetById(hm.desktopImageAssetId)
    return (
      <div className="rounded-lg overflow-hidden border bg-gray-900 text-white" style={{ minHeight: 200 }}>
        {bgAsset ? (
          <div className="relative">
            <img src={bgAsset.fileUrl} alt="" className="w-full object-cover max-h-48" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-3 left-3 right-3">
              {hm.badgeText && <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full mb-1">{hm.badgeText}</span>}
              <p className="font-bold text-sm whitespace-pre-wrap">{title || "시술명"}</p>
              <p className="text-xs opacity-80 whitespace-pre-wrap">{subtitle}</p>
              {hm.showPriceCard && (
                <div className="mt-2 inline-block bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  {hm.discountPrice && <span className="text-sm font-bold">{formatPrice(hm.discountPrice)}</span>}
                  {hm.originalPrice && <span className="text-[10px] line-through opacity-60 ml-1">{formatPrice(hm.originalPrice)}</span>}
                  {hm.treatmentDuration && <span className="text-[10px] ml-2 opacity-70">{hm.treatmentDuration}</span>}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-xs">이미지 선택 전</div>
        )}
        {(hm.ctaPrimary?.label || hm.ctaSecondary?.label) && (
          <div className="flex gap-2 p-3">
            {hm.ctaPrimary?.label && <span className="flex-1 text-center text-xs bg-primary text-white rounded py-1.5">{hm.ctaPrimary.label}</span>}
            {hm.ctaSecondary?.label && <span className="flex-1 text-center text-xs border border-white/40 rounded py-1.5">{hm.ctaSecondary.label}</span>}
          </div>
        )}
      </div>
    )
  }

  // Intro CTA preview
  if (sectionType === "intro_cta") {
    const im = m as IntroCTAMeta
    const align = im.textAlign ?? "center"
    return (
      <div className={cn("p-4 space-y-2 border rounded-lg", align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left")}>
        {im.treatmentName && <p className="font-bold text-base">{im.treatmentName}</p>}
        {im.englishSubtitle && <p className="text-xs text-muted-foreground">{im.englishSubtitle}</p>}
        {im.introParagraph && <p className="text-xs leading-relaxed whitespace-pre-wrap">{im.introParagraph}</p>}
        {(im.ctaPrimary?.label || im.ctaSecondary?.label) && (
          <div className="flex gap-2 justify-center pt-1">
            {im.ctaPrimary?.label && <span className="text-xs bg-primary text-white px-3 py-1.5 rounded">{im.ctaPrimary.label}</span>}
            {im.ctaSecondary?.label && <span className="text-xs border border-border px-3 py-1.5 rounded">{im.ctaSecondary.label}</span>}
          </div>
        )}
      </div>
    )
  }

  // Overview Feature Cards preview
  if (sectionType === "overview_feature_cards") {
    const om = m as OverviewFeatureCardsMeta
    return (
      <div className="space-y-2 p-3 border rounded-lg">
        {om.sectionLabel && <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{om.sectionLabel}</p>}
        {om.headline && <p className="font-bold text-sm">{om.headline}</p>}
        {om.description && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{om.description}</p>}
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {(om.cards ?? []).filter(c => c.isVisible !== false).map((card, i) => (
            <div key={card.id || i} className="border rounded-md p-2 bg-muted/20">
              <p className="text-[10px] font-bold text-primary mb-0.5">0{card.number ?? i+1}</p>
              <p className="text-xs font-semibold">{card.title || "카드 제목"}</p>
              <p className="text-[10px] text-muted-foreground whitespace-pre-wrap">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Effects Process Main preview
  if (sectionType === "effects_process_main") {
    const em = m as EffectsProcessMainMeta
    return (
      <div className="space-y-2 p-3 border rounded-lg">
        {em.sectionLabel && <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{em.sectionLabel}</p>}
        {em.headline && <p className="font-bold text-sm">{em.headline}</p>}
        {em.description && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{em.description}</p>}
        {(em.summaryTitle || em.summaryContent) && (
          <div className="bg-primary/10 border border-primary/30 rounded-md p-2">
            {em.summaryTitle && <p className="text-xs font-semibold">{em.summaryTitle}</p>}
            {em.summaryContent && <p className="text-[10px] text-muted-foreground whitespace-pre-wrap">{em.summaryContent}</p>}
          </div>
        )}
        {(em.effectPoints ?? []).length > 0 && (
          <ul className="space-y-0.5 pl-2">{(em.effectPoints ?? []).map((pt,i) => <li key={i} className="text-[10px] flex gap-1"><span className="text-primary">✓</span>{pt}</li>)}</ul>
        )}
        {(em.processCards ?? []).length > 0 && (
          <div className="grid grid-cols-3 gap-1 mt-1">
            {(em.processCards ?? []).map((card,i) => (
              <div key={card.id||i} className="border rounded p-1.5 text-center bg-muted/20">
                <p className="text-[10px] text-muted-foreground">{card.title}</p>
                <p className="text-xs font-bold">{card.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Advantages Section preview
  if (sectionType === "advantages_section") {
    const am = m as AdvantagesSectionMeta
    return (
      <div className="space-y-2 p-3 border rounded-lg">
        {am.sectionLabel && <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{am.sectionLabel}</p>}
        {am.headline && <p className="font-bold text-sm">{am.headline}</p>}
        {am.description && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{am.description}</p>}
        <div className="space-y-1.5 mt-1">
          {(am.cards ?? []).map((card,i) => (
            <div key={card.id||i} className="flex gap-2 items-start p-2 border rounded bg-muted/10">
              <span className="text-xs font-bold text-primary shrink-0">0{card.number??i+1}</span>
              <div><p className="text-xs font-semibold">{card.title||"장점"}</p><p className="text-[10px] text-muted-foreground whitespace-pre-wrap">{card.description}</p></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Precautions preview
  if (sectionType === "precautions_section") {
    const pm = m as PrecautionsSectionMeta
    return (
      <div className="space-y-2 p-3 border rounded-lg">
        {pm.headline && <p className="font-bold text-sm">{pm.headline}</p>}
        <div className="space-y-1.5">
          {(pm.boxes ?? []).map((box,i) => (
            <div key={box.id||i} className={cn("border rounded p-2", PRECAUTION_TYPE_COLORS[box.type])}>
              <p className="text-[10px] font-bold text-muted-foreground mb-0.5">{PRECAUTION_TYPE_LABELS[box.type]}</p>
              {box.title && <p className="text-xs font-semibold">{box.title}</p>}
              {box.content && <p className="text-[10px] whitespace-pre-wrap">{box.content}</p>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Program Pricing preview
  if (sectionType === "program_pricing") {
    const pm = m as ProgramPricingMeta
    return (
      <div className="space-y-2 p-3 border rounded-lg">
        {pm.headline && <p className="font-bold text-sm">{pm.headline}</p>}
        {pm.description && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{pm.description}</p>}
        <div className={cn("gap-2 mt-1", pm.cardLayout === "2col" ? "grid grid-cols-2" : "space-y-2")}>
          {(pm.cards ?? []).filter(c => c.isVisible !== false).map((card,i) => (
            <div key={card.id||i} className="border rounded-lg p-2 bg-muted/10">
              {card.badge && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{card.badge}</span>}
              <p className="text-xs font-semibold mt-1">{card.name||"프로그램명"}</p>
              {card.priceDiscount && <p className="text-sm font-bold text-primary">{formatPrice(card.priceDiscount)}</p>}
              {card.priceRegular && <p className="text-[10px] line-through text-muted-foreground">{formatPrice(card.priceRegular)}</p>}
              {(card.bullets??[]).filter(Boolean).length > 0 && (
                <ul className="mt-1 space-y-0.5">{(card.bullets??[]).filter(Boolean).map((b,j) => <li key={j} className="text-[10px] flex gap-1"><span className="text-primary">·</span><span className="whitespace-pre-wrap">{b}</span></li>)}</ul>
              )}
              {card.ctaLabel && <div className="mt-1.5 text-center text-[10px] bg-primary text-white rounded py-1">{card.ctaLabel}</div>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Final CTA Contact preview
  if (sectionType === "final_cta_contact") {
    const fm = m as FinalCTAContactMeta
    return (
      <div className="space-y-2 p-4 border rounded-lg bg-muted/20 text-center">
        {fm.headline && <p className="font-bold text-sm">{fm.headline}</p>}
        {fm.subtext && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{fm.subtext}</p>}
        <div className="flex gap-2 justify-center mt-2">
          {fm.ctaPrimary?.label && <span className="text-xs bg-primary text-white px-3 py-1.5 rounded">{fm.ctaPrimary.label}</span>}
          {fm.ctaPhone?.label && <span className="text-xs border px-3 py-1.5 rounded">{fm.ctaPhone.label}</span>}
          {fm.ctaKakao?.label && <span className="text-xs bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded">{fm.ctaKakao.label}</span>}
        </div>
        {(fm.branchName || fm.address || fm.hours) && (
          <div className="text-left text-[10px] text-muted-foreground mt-2 space-y-0.5 border-t pt-2">
            {fm.branchName && <p className="font-medium">{fm.branchName}</p>}
            {fm.address && <p>{fm.address}</p>}
            {fm.hours && <p className="whitespace-pre-wrap">{fm.hours}</p>}
          </div>
        )}
      </div>
    )
  }

  // Generic fallback — whitespace-pre-wrap for all text
  return (
    <div className="space-y-2 p-3 border rounded-lg">
      {title && <p className="font-bold text-sm">{title}</p>}
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      {body && <p className="text-xs leading-relaxed whitespace-pre-wrap">{body}</p>}
      {!title && !subtitle && !body && (
        <p className="text-xs text-muted-foreground text-center py-4">미리보기 없음</p>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function LandingSectionEditor({
  section, allImageAssets, hqImageAssets = [], programs = [],
  canEdit, onSave, onClose, onDuplicate, onDelete, onAIRegenerate, onInlineUpload,
}: Props) {
  // ── Common fields ──
  const [title, setTitle] = useState(section.title ?? "")
  const [subtitle, setSubtitle] = useState(section.subtitle ?? "")
  const [body, setBody] = useState(section.body ?? "")
  const [isVisible, setIsVisible] = useState(section.isVisible)

  // ── Metadata state — initialise from section.metadata ──
  const [meta, setMeta] = useState<Record<string, unknown>>(section.metadata ?? {})
  function patchMeta(patch: Record<string, unknown>) { setMeta(prev => ({ ...prev, ...patch })) }

  // ── Image picker ──
  const [pickerOpen, setPickerOpen] = useState<string | null>(null)
  const branchAssets = allImageAssets.filter(a => a.scope !== "hq_common" && !a.inheritedFromMaster)

  function assetById(id?: string): TreatmentAsset | undefined {
    if (!id) return undefined
    return allImageAssets.find(a => a.id === id)
  }

  // Picker slot → metadata key mapping for simple cases
  const PICKER_META_KEYS: Record<string, string> = {
    heroDesktop: "desktopImageAssetId",
    heroMobile: "mobileImageAssetId",
    mediaMain: "imageAssetId",
    mediaBefore: "beforeAssetId",
    mediaAfter: "afterAssetId",
  }

  function handlePickerSelect(asset: TreatmentAsset) {
    if (!pickerOpen) return
    const key = PICKER_META_KEYS[pickerOpen]
    if (key) {
      patchMeta({ [key]: asset.id })
    } else if (pickerOpen.startsWith("adv_")) {
      const i = Number(pickerOpen.replace("adv_", ""))
      const cards = (meta.cards ?? []) as AdvantageCard[]
      setMeta(prev => ({ ...prev, cards: cards.map((c, j) => j===i ? { ...c, imageAssetId: asset.id } : c) }))
    } else if (pickerOpen.startsWith("suppImg_")) {
      const i = Number(pickerOpen.replace("suppImg_", ""))
      const images = (meta.images ?? []) as SupportingImage[]
      setMeta(prev => ({ ...prev, images: images.map((img, j) => j===i ? { ...img, assetId: asset.id } : img) }))
    } else if (pickerOpen.startsWith("ba_before_")) {
      const i = Number(pickerOpen.replace("ba_before_", ""))
      const cards = (meta.beforeAfterCards ?? []) as BeforeAfterCard[]
      setMeta(prev => ({ ...prev, beforeAfterCards: cards.map((c, j) => j===i ? { ...c, beforeAssetId: asset.id } : c) }))
    } else if (pickerOpen.startsWith("ba_after_")) {
      const i = Number(pickerOpen.replace("ba_after_", ""))
      const cards = (meta.beforeAfterCards ?? []) as BeforeAfterCard[]
      setMeta(prev => ({ ...prev, beforeAfterCards: cards.map((c, j) => j===i ? { ...c, afterAssetId: asset.id } : c) }))
    }
    setPickerOpen(null)
  }

  function handlePickerClear(slot: string) {
    const key = PICKER_META_KEYS[slot]
    if (key) patchMeta({ [key]: undefined })
  }

  function handleSave() {
    onSave({ title: title || undefined, subtitle: subtitle || undefined, body: body || undefined, isVisible, metadata: meta })
  }

  // Decide which section form to render
  const sectionLabel = SECTION_LABELS[section.sectionType] ?? section.sectionType

  function renderSectionForm() {
    const t = section.sectionType

    if (t === "hero_main_visual") return <HeroMainVisualForm meta={meta as HeroMainVisualMeta} assetById={assetById} onOpenPicker={setPickerOpen} onClear={handlePickerClear} onChange={patchMeta} disabled={!canEdit} />
    if (t === "intro_cta") return <IntroCTAForm meta={meta as IntroCTAMeta} onChange={patchMeta} disabled={!canEdit} />
    if (t === "overview_feature_cards") return <OverviewFeatureCardsForm meta={meta as OverviewFeatureCardsMeta} onChange={patchMeta} disabled={!canEdit} />
    if (t === "overview_media_block") return <OverviewMediaBlockForm meta={meta as OverviewMediaBlockMeta} assetById={assetById} onOpenPicker={setPickerOpen} onClear={handlePickerClear} onChange={patchMeta} disabled={!canEdit} />
    if (t === "effects_process_main") return <EffectsProcessMainForm meta={meta as EffectsProcessMainMeta} onChange={patchMeta} disabled={!canEdit} />
    if (t === "effects_supporting_media") return <EffectsSupportingMediaForm meta={meta as EffectsSupportingMediaMeta} assetById={assetById} onOpenPicker={setPickerOpen} onClear={handlePickerClear} onChange={patchMeta} disabled={!canEdit} />
    if (t === "advantages_section") return <AdvantagesSectionForm meta={meta as AdvantagesSectionMeta} assetById={assetById} onOpenPicker={setPickerOpen} onClear={handlePickerClear} onChange={patchMeta} disabled={!canEdit} />
    if (t === "precautions_section") return <PrecautionsSectionForm meta={meta as PrecautionsSectionMeta} onChange={patchMeta} disabled={!canEdit} />
    if (t === "program_pricing") return <ProgramPricingForm meta={meta as ProgramPricingMeta} programs={programs} onChange={patchMeta} disabled={!canEdit} />
    if (t === "faq_block" || t === "faq_section") return <FaqForm meta={meta as FaqBlockMeta & { headline?: string; description?: string }} onChange={patchMeta} disabled={!canEdit} />
    if (t === "final_cta_contact") return <FinalCTAContactForm meta={meta as FinalCTAContactMeta} onChange={patchMeta} disabled={!canEdit} />
    if (t === "why_tatoa") return (
      <div className="space-y-4">
        <FieldRow label="섹션 라벨 (예: WHY TATOA)"><Input className="h-7 text-xs" value={(meta.sectionLabel as string) ?? ""} onChange={e => patchMeta({ sectionLabel: e.target.value })} disabled={!canEdit} /></FieldRow>
        <FieldRow label="헤드라인"><Input className="h-8 text-sm" value={(meta.headline as string) ?? title} onChange={e => patchMeta({ headline: e.target.value })} disabled={!canEdit} /></FieldRow>
        <FieldRow label="설명" hint="Enter 줄바꿈 가능"><Textarea rows={4} className="text-sm resize-none" value={(meta.description as string) ?? body} onChange={e => patchMeta({ description: e.target.value })} disabled={!canEdit} /></FieldRow>
      </div>
    )
    // Generic fallback
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">이 섹션 유형은 공통 필드로 편집합니다.</p>
        <div><Label className="text-xs mb-1 block text-muted-foreground">스타일 변형</Label><Input value={(meta.styleVariant as string) ?? ""} onChange={e => patchMeta({ styleVariant: e.target.value })} disabled={!canEdit} className="h-8 text-sm" /></div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-6">
      <div className="bg-background rounded-xl shadow-2xl w-[980px] min-h-0 flex flex-col mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Badge className="bg-slate-100 text-slate-700 text-xs">{sectionLabel}</Badge>
            <h2 className="font-semibold text-base">섹션 편집</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">표시</span>
              <Switch checked={isVisible} onCheckedChange={setIsVisible} disabled={!canEdit} />
            </div>
            {/* Common action buttons */}
            {onAIRegenerate && canEdit && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onAIRegenerate}>
                <Sparkles className="h-3 w-3 text-blue-500" />AI 재생성
              </Button>
            )}
            {onDuplicate && canEdit && (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={onDuplicate}>
                <Copy className="h-3 w-3" />복제
              </Button>
            )}
            {onDelete && canEdit && (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-red-500 hover:text-red-600" onClick={() => { if (window.confirm("이 섹션을 삭제하시겠습니까?")) onDelete!() }}>
                <Trash2 className="h-3 w-3" />삭제
              </Button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-1">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body: 2-column */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* Left: Form */}
          <div className="w-[56%] border-r overflow-y-auto px-6 py-5">
            <Tabs defaultValue="content">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="content" className="flex-1 text-xs">콘텐츠 편집</TabsTrigger>
                <TabsTrigger value="common" className="flex-1 text-xs">공통 필드</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-0 space-y-1">
                {renderSectionForm()}
              </TabsContent>

              <TabsContent value="common" className="mt-0 space-y-4">
                <p className="text-xs text-muted-foreground">섹션 공통 메타 필드 (선택 사항)</p>
                <FieldRow label="섹션 제목 (내부 구분용)">
                  <Input value={title} onChange={e => setTitle(e.target.value)} disabled={!canEdit} className="h-8 text-sm" />
                </FieldRow>
                <FieldRow label="서브제목">
                  <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} disabled={!canEdit} className="h-8 text-sm" />
                </FieldRow>
                <FieldRow label="본문 텍스트 (Enter로 줄바꿈 가능)" hint="whitespace-pre-wrap으로 렌더링됩니다">
                  <Textarea value={body} onChange={e => setBody(e.target.value)} disabled={!canEdit} rows={5} className="text-sm resize-none" />
                </FieldRow>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Preview */}
          <div className="w-[44%] overflow-y-auto px-5 py-5 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">실시간 미리보기</p>
            <SectionPreview
              sectionType={section.sectionType}
              title={title} subtitle={subtitle} body={body}
              meta={meta}
              assetById={assetById}
              programs={programs}
            />
            {/* Body text preview with pre-wrap (always shown when body exists) */}
            {body && !["hero_main_visual","intro_cta","overview_feature_cards","effects_process_main","advantages_section","precautions_section","program_pricing","final_cta_contact"].includes(section.sectionType) && (
              <div className="mt-3 p-3 border rounded-md bg-white text-xs leading-relaxed whitespace-pre-wrap">
                {body}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3.5 flex items-center justify-between shrink-0 bg-muted/10">
          <p className="text-xs text-muted-foreground">
            줄바꿈(Enter)은 미리보기와 랜딩 출력에 그대로 반영됩니다.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>취소</Button>
            {canEdit && (
              <Button size="sm" onClick={handleSave}>
                <Check className="h-3.5 w-3.5 mr-1.5" />저장
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Image Picker */}
      {pickerOpen && (
        <ImagePickerModal
          libraryAssets={branchAssets}
          hqAssets={hqImageAssets}
          onUploadAndSelect={onInlineUpload}
          currentAssetId={pickerOpen in PICKER_META_KEYS ? (meta[PICKER_META_KEYS[pickerOpen]] as string) : undefined}
          onSelect={handlePickerSelect}
          onClose={() => setPickerOpen(null)}
          title="이미지 선택"
          initialTab="library"
        />
      )}
    </div>
  )
}
