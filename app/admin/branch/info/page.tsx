"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Save, Check, Eye, EyeOff, AlertTriangle, Plus, X,
  MapPin, Phone, Clock, Car, Link as LinkIcon, FileText,
  Image as ImageIcon, Upload, Building2, Users, Cpu,
  Sparkles, Star, Languages, CheckCircle2, AlertCircle,
  Circle, Globe, Bot, Home, Zap, MessageSquare, Smartphone,
  Mail, Hash, Calendar as CalendarIcon, Settings2, Footprints,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { branches, doctors, equipment, treatments } from "@/lib/mock-data"
import { useBranch } from "../../layout"
import { useOptions } from "@/lib/option-context"
import { BranchContactMethod, LEGACY_BOOKING_METHOD_MAP, needsInlineInput, hasExistingField } from "@/lib/option-system"
import { AddOptionModal } from "@/components/admin/add-option-modal"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type DayHours = { open: string; close: string; closed: boolean }

type FormData = {
  internalName: string
  publicName: string
  handle: string
  tagline: string
  keywords: string[]
  isPublic: boolean
  badges: string[]
  roadAddress: string
  detailAddress: string
  buildingInfo: string
  landmark: string
  mapLink: string
  directions: string
  hasParking: boolean
  parkingType: string
  parkingDetail: string
  mainPhone: string
  consultPhone: string
  kakaoLink: string
  bookingLink: string
  contactMethods: BranchContactMethod[]
  bookingNote: string
  firstVisitNote: string
  hours: Record<string, DayHours>
  lunchBreak: string
  lastEntry: string
  holidayPolicy: string
  featureSummary: string
  targetCustomers: string[]
  strengths: string[]
  featuredTreatments: string[]
  featuredEquipment: string[]
  featuredDoctors: string[]
  consultingStyle: string
  foreignLanguage: boolean
  maleSpecialized: boolean
  femaleSpecialized: boolean
  shortIntro: string
  longIntro: string
  heroImage: string
  videoLink: string
  showHero: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
]

const PARKING_TYPES = ["무료", "유료", "발렛", "기계식", "건물 내"]
const TARGET_PRESETS = ["20대 여성", "30대 여성", "40대 이상", "남성 고객", "예민 피부", "첫 시술 고객"]
const STRENGTH_PRESETS = ["비수술", "통증 최소화", "자연스러운 결과", "당일 시술", "야간 진료", "원장 직접 시술", "최신 장비"]
const BADGE_PRESETS = ["프리미엄", "강남역 인근", "야간진료", "주차 편리", "남성 전문", "피부과 전문의"]

// ─── Completeness ─────────────────────────────────────────────────────────────

interface CheckItem { key: string; label: string; section: string; why?: string }

const REQUIRED: CheckItem[] = [
  { key: "publicName",  label: "고객 노출용 지점명",  section: "A" },
  { key: "handle",      label: "멘션 핸들",           section: "A" },
  { key: "tagline",     label: "한 줄 소개 문구",     section: "A" },
  { key: "roadAddress", label: "도로명 주소",          section: "B" },
  { key: "mainPhone",   label: "대표 전화번호",        section: "C", why: "고객 문의 응대에 필수" },
  { key: "bookingLink", label: "예약 링크",            section: "C", why: "고객 전환에 직접 영향" },
  { key: "shortIntro",  label: "짧은 소개 문구",       section: "F" },
]

const RECOMMENDED: CheckItem[] = [
  { key: "landmark",       label: "랜드마크 설명",      section: "B", why: "챗봇 위치 안내 품질 향상" },
  { key: "directions",     label: "오시는 길 설명",      section: "B", why: "챗봇 길 안내 정확도 향상" },
  { key: "featureSummary", label: "지점 특징 요약",      section: "E", why: "챗봇 지점 소개 품질 향상" },
  { key: "consultingStyle",label: "상담 스타일 한 줄",   section: "E" },
  { key: "longIntro",      label: "상세 소개 본문",      section: "F" },
]

function isFilled(val: unknown): boolean {
  if (Array.isArray(val)) return val.length > 0
  if (typeof val === "string") return val.trim() !== ""
  return val !== null && val !== undefined
}

function computeCompleteness(data: FormData) {
  const missingRequired = REQUIRED.filter(
    (item) => !isFilled((data as Record<string, unknown>)[item.key])
  )
  const missingRecommended = RECOMMENDED.filter(
    (item) => !isFilled((data as Record<string, unknown>)[item.key])
  )

  const hoursOk = DAYS.slice(0, 5).some(
    (d) => !data.hours[d.key].closed && data.hours[d.key].open && data.hours[d.key].close
  )
  const keywordsOk = data.keywords.length >= 2
  const strengthsOk = data.strengths.length >= 2
  const featuredOk = data.featuredTreatments.length > 0 || data.featuredDoctors.length > 0

  const extraRequired: CheckItem[] = hoursOk ? [] : [
    { key: "hours", label: "운영 시간 (평일)", section: "D", why: "챗봇 답변 정확도 저하 가능" },
  ]
  const extraRecommended: CheckItem[] = [
    ...(!keywordsOk ? [{ key: "keywords", label: "키워드 태그 (2개 이상)", section: "A" }] : []),
    ...(!strengthsOk ? [{ key: "strengths", label: "대표 강점 태그 (2개 이상)", section: "E" }] : []),
    ...(!featuredOk ? [{ key: "featured", label: "대표 시술/의료진 연결", section: "E" }] : []),
  ]

  const allMissingRequired = [...missingRequired, ...extraRequired]
  const allMissingRecommended = [...missingRecommended, ...extraRecommended]

  const totalRequired = REQUIRED.length + 1
  const totalRecommended = RECOMMENDED.length + 3
  const completedRequired = totalRequired - allMissingRequired.length
  const completedRecommended = totalRecommended - allMissingRecommended.length
  const percentage = Math.round(
    ((completedRequired + completedRecommended) / (totalRequired + totalRecommended)) * 100
  )

  return { percentage, missingRequired: allMissingRequired, missingRecommended: allMissingRecommended, completedRequired, totalRequired }
}

// ─── Reusable UI ──────────────────────────────────────────────────────────────

function SectionCard({
  id, icon: Icon, title, description, required, badge, children,
}: {
  id: string; icon: React.ElementType; title: string; description: string
  required?: boolean; badge?: string; children: React.ReactNode
}) {
  return (
    <Card id={`section-${id}`} className="rounded-2xl border-border bg-card shadow-sm scroll-mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
                {required && (
                  <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">필수</Badge>
                )}
                {badge && (
                  <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">{badge}</Badge>
                )}
              </div>
              <CardDescription className="text-sm text-muted-foreground mt-0.5">{description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function Field({
  label, required, recommended, helper, warning, children,
}: {
  label: string; required?: boolean; recommended?: boolean
  helper?: string; warning?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {required && <span className="text-xs font-semibold text-destructive">필수</span>}
        {recommended && !required && <span className="text-xs font-semibold text-amber-600">권장</span>}
      </div>
      {children}
      {warning && (
        <p className="flex items-center gap-1 text-xs text-amber-600">
          <AlertTriangle className="h-3 w-3 shrink-0" />{warning}
        </p>
      )}
      {helper && !warning && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
    </div>
  )
}

function TagInput({
  value, onChange, placeholder, presets, maxTags = 5,
}: {
  value: string[]; onChange: (v: string[]) => void
  placeholder: string; presets?: string[]; maxTags?: number
}) {
  const [input, setInput] = useState("")
  const add = (tag: string) => {
    const t = tag.trim()
    if (t && value.length < maxTags && !value.includes(t)) {
      onChange([...value, t])
      setInput("")
    }
  }
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1 pr-1 text-xs">
              {tag}
              <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))}
                className="hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {value.length < maxTags && (
        <div className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(input) } }}
            placeholder={placeholder} className="rounded-xl h-9 text-sm" />
          <Button type="button" variant="outline" size="sm" onClick={() => add(input)} className="rounded-xl h-9">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
      {presets && (
        <div className="flex flex-wrap gap-1.5">
          {presets.filter((p) => !value.includes(p)).map((p) => (
            <button key={p} type="button" onClick={() => add(p)}
              className="rounded-lg border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              + {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MultiSelect<T extends { id: string; name: string }>({
  items, selected, onChange, renderLabel,
}: {
  items: T[]; selected: string[]; onChange: (ids: string[]) => void
  renderLabel: (item: T) => React.ReactNode
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = selected.includes(item.id)
        return (
          <button key={item.id} type="button"
            onClick={() => onChange(active ? selected.filter((id) => id !== item.id) : [...selected, item.id])}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition-all",
              active ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:bg-muted"
            )}>
            {active && <Check className="h-3 w-3" />}
            {renderLabel(item)}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── 아이콘 매핑 ──────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Phone,
  Link: LinkIcon,
  MessageSquare,
  MapPin,
  Globe,
  Smartphone,
  Calendar: CalendarIcon,
  Mail,
  Hash,
}

function OptionIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name ? ICON_MAP[name] : null) ?? Hash
  return <Icon className={className} />
}

export default function BranchInfoPage() {
  const { selectedBranch } = useBranch()
  const { getItemsByGroup, addItem: addOptionItem } = useOptions()
  const branch = branches.find((b) => b.id === selectedBranch) || branches[0]
  const branchDoctors = doctors.filter((d) => d.branchId === selectedBranch)
  const branchEquipment = equipment.filter((e) => e.branchId === selectedBranch)
  const branchTreatments = treatments.filter((t) => t.branchId === selectedBranch)

  const [addOptionOpen, setAddOptionOpen] = useState(false)

  const [isDirty, setIsDirty] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(new Date(branch.lastUpdated))
  const [previewTab, setPreviewTab] = useState("homepage")

  const [form, setForm] = useState<FormData>({
    internalName: branch.name,
    publicName: branch.name,
    handle: branch.handle,
    tagline: branch.shortIntro,
    keywords: [],
    isPublic: branch.isPublic,
    badges: [],
    roadAddress: branch.address,
    detailAddress: "",
    buildingInfo: "",
    landmark: "",
    mapLink: "",
    directions: "",
    hasParking: true,
    parkingType: "무료",
    parkingDetail: branch.parkingInfo,
    mainPhone: branch.phone,
    consultPhone: "",
    kakaoLink: "",
    bookingLink: branch.bookingLink,
    // 레거시 마이그레이션: 기존 문자열 배열 → BranchContactMethod 구조
    contactMethods: ["전화", "예약링크"].map((label) => ({
      optionKey: LEGACY_BOOKING_METHOD_MAP[label] ?? label,
      value: "",
      isActive: true,
    })),
    bookingNote: "",
    firstVisitNote: "",
    hours: {
      mon: { open: "10:00", close: "19:00", closed: false },
      tue: { open: "10:00", close: "19:00", closed: false },
      wed: { open: "10:00", close: "19:00", closed: false },
      thu: { open: "10:00", close: "19:00", closed: false },
      fri: { open: "10:00", close: "19:00", closed: false },
      sat: { open: "10:00", close: "17:00", closed: false },
      sun: { open: "", close: "", closed: true },
    },
    lunchBreak: "",
    lastEntry: "",
    holidayPolicy: "",
    featureSummary: "",
    targetCustomers: [],
    strengths: [],
    featuredTreatments: [],
    featuredEquipment: [],
    featuredDoctors: [],
    consultingStyle: "",
    foreignLanguage: false,
    maleSpecialized: false,
    femaleSpecialized: false,
    shortIntro: branch.shortIntro,
    longIntro: branch.longIntro,
    heroImage: "",
    videoLink: "",
    showHero: true,
  })

  const update = useCallback((key: keyof FormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
    setIsSaved(false)
  }, [])

  const updateHours = (day: string, field: keyof DayHours, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      hours: { ...prev.hours, [day]: { ...prev.hours[day], [field]: value } },
    }))
    setIsDirty(true)
  }

  const completeness = useMemo(() => computeCompleteness(form), [form])

  const handleSave = () => {
    setIsDirty(false)
    setIsSaved(true)
    setLastSaved(new Date())
    setTimeout(() => setIsSaved(false), 2500)
  }

  const scrollTo = (sectionId: string) => {
    document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: "smooth" })
  }

  const chatbotSummary = useMemo(() => {
    const lines: string[] = []
    if (form.publicName) lines.push(`📍 ${form.publicName}`)
    if (form.tagline) lines.push(`→ ${form.tagline}`)
    if (form.roadAddress) lines.push(`🏠 위치: ${form.roadAddress}${form.buildingInfo ? " " + form.buildingInfo : ""}`)
    if (form.landmark) lines.push(`   (${form.landmark})`)
    const openDays = DAYS.filter((d) => !form.hours[d.key].closed && form.hours[d.key].open)
    if (openDays.length) {
      lines.push(`⏰ 운영: ${openDays.map((d) => `${d.label} ${form.hours[d.key].open}~${form.hours[d.key].close}`).join(", ")}`)
    }
    if (form.lunchBreak) lines.push(`   점심시간: ${form.lunchBreak}`)
    if (form.mainPhone) lines.push(`📞 전화: ${form.mainPhone}`)
    if (form.bookingLink) lines.push(`📅 예약: ${form.bookingLink}`)
    if (form.featureSummary) lines.push(`✨ 특징: ${form.featureSummary}`)
    if (form.strengths.length) lines.push(`💪 강점: ${form.strengths.join(" · ")}`)
    if (form.targetCustomers.length) lines.push(`👥 추천 고객: ${form.targetCustomers.join(" · ")}`)
    if (form.hasParking) lines.push(`🚗 주차: ${form.parkingType}${form.parkingDetail ? " (" + form.parkingDetail + ")" : ""}`)
    if (form.contactMethods.length) {
      const allChannelItems = getItemsByGroup("booking_channel", true)
      const labels = form.contactMethods.map((m) => {
        const item = allChannelItems.find((i) => i.key === m.optionKey)
        return item?.label ?? m.optionKey
      })
      lines.push(`📌 예약 방법: ${labels.join(", ")}`)
    }
    return lines
  }, [form])

  return (
    <div className="space-y-0">
      {/* ── Unsaved Banner ── */}
      {isDirty && (
        <div className="sticky top-16 z-20 -mx-6 flex items-center justify-between border-b border-amber-200 bg-amber-50 px-6 py-2 dark:border-amber-800/30 dark:bg-amber-900/10">
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            저장되지 않은 변경사항이 있습니다
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setIsDirty(false); setLastSaved(new Date()) }}
              className="h-7 rounded-lg text-xs">임시저장</Button>
            <Button size="sm" onClick={handleSave} className="h-7 rounded-lg text-xs bg-primary">지금 저장</Button>
          </div>
        </div>
      )}

      <div className="space-y-6 pt-6">
        {/* ── Page Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">지점 정보</h1>
            <p className="text-sm text-muted-foreground">
              {branch.name} · 홈페이지 및 챗봇에 활용되는 구조화 정보 관리
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={() => { setIsDirty(false); setLastSaved(new Date()) }}
              className="rounded-xl gap-2 h-9">
              <FileText className="h-4 w-4" />임시저장
            </Button>
            <Button onClick={handleSave}
              className={cn("gap-2 rounded-xl h-9 transition-all",
                isSaved ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}>
              {isSaved ? <><Check className="h-4 w-4" />저장됨</> : <><Save className="h-4 w-4" />변경사항 저장</>}
            </Button>
          </div>
        </div>

        {/* ── Status Summary Bar ── */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-5">
              {/* Progress */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">입력 완성도</span>
                    <span className={cn("text-sm font-bold",
                      completeness.percentage >= 80 ? "text-success" :
                      completeness.percentage >= 50 ? "text-amber-600" : "text-destructive"
                    )}>{completeness.percentage}%</span>
                  </div>
                  <Progress value={completeness.percentage} className="h-2" />
                </div>
              </div>

              <div className="h-8 w-px bg-border hidden sm:block" />

              {/* Missing counts */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
                  <span className="text-xs text-muted-foreground">필수 누락</span>
                  <span className={cn("text-sm font-bold",
                    completeness.missingRequired.length > 0 ? "text-destructive" : "text-success"
                  )}>{completeness.missingRequired.length}개</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-xs text-muted-foreground">권장 누락</span>
                  <span className="text-sm font-bold text-amber-600">{completeness.missingRecommended.length}개</span>
                </div>
              </div>

              <div className="h-8 w-px bg-border hidden sm:block" />

              {/* Last saved */}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {lastSaved
                    ? `마지막 저장 ${lastSaved.getHours().toString().padStart(2, "0")}:${lastSaved.getMinutes().toString().padStart(2, "0")}`
                    : "미저장"}
                </span>
              </div>

              <div className="h-8 w-px bg-border hidden sm:block" />

              {/* Public toggle */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs gap-1",
                  form.isPublic ? "bg-success/10 text-success border-success/20"
                  : completeness.missingRequired.length > 0 ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-muted text-muted-foreground"
                )}>
                  {form.isPublic ? <><Eye className="h-3 w-3" />공개 중</>
                    : completeness.missingRequired.length > 0 ? <><AlertTriangle className="h-3 w-3" />검토 필요</>
                    : <><EyeOff className="h-3 w-3" />비공개</>}
                </Badge>
                <Switch checked={form.isPublic}
                  onCheckedChange={(v) => {
                    if (v && completeness.missingRequired.length > 0) {
                      alert(`필수 항목 ${completeness.missingRequired.length}개가 누락되었습니다.\n누락 탭에서 확인해주세요.`)
                      return
                    }
                    update("isPublic", v)
                  }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Two-column layout ── */}
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

          {/* ═══ LEFT: Form Sections ═══ */}
          <div className="space-y-6">

            {/* ── A: Identity ── */}
            <SectionCard id="A" icon={Building2} title="A. 지점 식별 정보"
              description="지점의 기본 정체성 — 홈페이지 타이틀과 챗봇 요약에 직접 반영됩니다" required>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="내부 관리용 지점명" helper="본사 관리자만 보는 명칭 (고객에게 미노출)">
                  <Input value={form.internalName} onChange={(e) => update("internalName", e.target.value)}
                    className="rounded-xl" placeholder="예: 타토아 강남 메인" />
                </Field>
                <Field label="고객 노출용 지점명" required helper="홈페이지·챗봇에 표시되는 실제 이름">
                  <Input value={form.publicName} onChange={(e) => update("publicName", e.target.value)}
                    className="rounded-xl" placeholder="예: 타토아 강남점" />
                </Field>
              </div>

              <Field label="멘션 핸들" required helper="@tatoa_main 형식으로 입력">
                <Input value={form.handle} onChange={(e) => update("handle", e.target.value)}
                  className="rounded-xl max-w-xs" placeholder="@tatoa_main" />
              </Field>

              <Field label="한 줄 소개 문구" required helper="30자 내외 · 홈페이지 히어로 서브텍스트 및 챗봇 첫 소개">
                <div className="relative">
                  <Input value={form.tagline} onChange={(e) => update("tagline", e.target.value)}
                    className="rounded-xl pr-16" maxLength={50}
                    placeholder="예: 강남 중심부의 프리미엄 미용 클리닉" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {form.tagline.length}/50
                  </span>
                </div>
              </Field>

              <Field label="대표 키워드 태그" recommended
                warning={form.keywords.length < 2 ? "2개 이상 입력 시 챗봇 검색 매칭 정확도가 향상됩니다" : undefined}
                helper="3~6개 권장 · 검색 및 챗봇 매칭에 활용">
                <TagInput value={form.keywords} onChange={(v) => update("keywords", v)}
                  placeholder="태그 입력 후 Enter"
                  presets={["피부과", "비수술", "리프팅", "레이저", "피부미용", "강남역"]} maxTags={6} />
              </Field>

              <Field label="지점 배지 / 라벨" helper="홈페이지 카드에 표시되는 특징 뱃지 (최대 4개)">
                <TagInput value={form.badges} onChange={(v) => update("badges", v)}
                  placeholder="배지 추가" presets={BADGE_PRESETS} maxTags={4} />
              </Field>
            </SectionCard>

            {/* ── B: Visit ── */}
            <SectionCard id="B" icon={MapPin} title="B. 방문 안내 정보"
              description="고객이 실제 방문할 때 필요한 모든 정보 — 챗봇 길 안내에 바로 활용" required>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="도로명 주소" required>
                  <Input value={form.roadAddress} onChange={(e) => update("roadAddress", e.target.value)}
                    className="rounded-xl" placeholder="예: 서울 강남구 강남대로 123" />
                </Field>
                <Field label="상세 주소" helper="호수, 층수 등">
                  <Input value={form.detailAddress} onChange={(e) => update("detailAddress", e.target.value)}
                    className="rounded-xl" placeholder="예: 4층 401호" />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="건물명 / 층수">
                  <Input value={form.buildingInfo} onChange={(e) => update("buildingInfo", e.target.value)}
                    className="rounded-xl" placeholder="예: OO빌딩 5층" />
                </Field>
                <Field label="랜드마크 설명" recommended
                  warning={!form.landmark ? "챗봇 위치 안내 품질에 영향합니다" : undefined}>
                  <Input value={form.landmark} onChange={(e) => update("landmark", e.target.value)}
                    className="rounded-xl" placeholder="예: 강남역 10번 출구 도보 2분" />
                </Field>
              </div>

              <Field label="지도 링크" helper="네이버지도 또는 카카오맵 링크 붙여넣기">
                <Input value={form.mapLink} onChange={(e) => update("mapLink", e.target.value)}
                  className="rounded-xl" placeholder="https://naver.me/..." />
              </Field>

              <Field label="오시는 길 (지하철 / 버스 / 도보)" recommended
                warning={!form.directions ? "이 항목이 없으면 챗봇이 길 안내를 제공할 수 없습니다" : undefined}>
                <Textarea value={form.directions} onChange={(e) => update("directions", e.target.value)}
                  className="rounded-xl resize-none min-h-[80px]"
                  placeholder={"[지하철] 2호선 강남역 10번 출구 도보 3분\n[버스] 146, 341번 강남역 하차 후 도보 2분"} />
              </Field>

              {/* Parking */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />주차 가능
                  </Label>
                  <Switch checked={form.hasParking} onCheckedChange={(v) => update("hasParking", v)} />
                </div>
                {form.hasParking && (
                  <div className="grid gap-3 pt-1 sm:grid-cols-2">
                    <Field label="주차 방식">
                      <div className="flex flex-wrap gap-1.5">
                        {PARKING_TYPES.map((type) => (
                          <button key={type} type="button" onClick={() => update("parkingType", type)}
                            className={cn("rounded-lg border px-3 py-1 text-sm transition-all",
                              form.parkingType === type
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:bg-muted")}>
                            {type}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="주차 상세 안내">
                      <Input value={form.parkingDetail} onChange={(e) => update("parkingDetail", e.target.value)}
                        className="rounded-xl" placeholder="예: 건물 B1~B2 무료 2시간" />
                    </Field>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* ── C: Contact & Booking ── */}
            <SectionCard id="C" icon={Phone} title="C. 연락 및 예약 정보"
              description="고객이 문의하고 예약하는 방법 구조화 — 고객 전환에 직접 영향" required>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="대표 전화번호" required
                  warning={!form.mainPhone ? "고객 문의 응대에 필수 항목입니다" : undefined}>
                  <Input value={form.mainPhone} onChange={(e) => update("mainPhone", e.target.value)}
                    className="rounded-xl" placeholder="02-0000-0000" />
                </Field>
                <Field label="상담 전화번호" helper="선택 · 별도 상담 번호가 있는 경우">
                  <Input value={form.consultPhone} onChange={(e) => update("consultPhone", e.target.value)}
                    className="rounded-xl" placeholder="02-0000-0001" />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="예약 링크" required
                  warning={!form.bookingLink ? "고객 전환에 직접 영향을 주는 항목입니다" : undefined}>
                  <Input value={form.bookingLink} onChange={(e) => update("bookingLink", e.target.value)}
                    className="rounded-xl" placeholder="https://booking.tatoa.kr/..." />
                </Field>
                <Field label="카카오톡 / 채널톡 링크" helper="선택">
                  <Input value={form.kakaoLink} onChange={(e) => update("kakaoLink", e.target.value)}
                    className="rounded-xl" placeholder="https://pf.kakao.com/..." />
                </Field>
              </div>

              <Field
                label="예약 가능 방식"
                helper="고객이 실제로 예약하거나 문의할 수 있는 채널을 선택하세요. 필요한 채널이 없으면 새 옵션을 추가할 수 있습니다."
              >
                {/* 채널 칩 목록 */}
                <div className="flex flex-wrap gap-2">
                  {getItemsByGroup("booking_channel").map((opt) => {
                    const method = form.contactMethods.find((m) => m.optionKey === opt.key)
                    const active = !!method

                    const toggleChannel = () => {
                      if (active) {
                        update("contactMethods", form.contactMethods.filter((m) => m.optionKey !== opt.key))
                      } else {
                        update("contactMethods", [
                          ...form.contactMethods,
                          { optionKey: opt.key, value: "", isActive: true },
                        ])
                      }
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={toggleChannel}
                        className={cn(
                          "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition-all",
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {active && <Check className="h-3 w-3" />}
                        <OptionIcon name={opt.iconName} className="h-3.5 w-3.5" />
                        {opt.label}
                      </button>
                    )
                  })}

                  {/* 옵션 추가 버튼 */}
                  <button
                    type="button"
                    onClick={() => setAddOptionOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    옵션 추가
                  </button>
                </div>

                {/* 선택된 채널 중 인라인 입력이 필요한 것들 */}
                {form.contactMethods.length > 0 && (() => {
                  const allItems = getItemsByGroup("booking_channel", true)
                  const inlineItems = form.contactMethods.filter((m) => {
                    const opt = allItems.find((i) => i.key === m.optionKey)
                    return opt && needsInlineInput(opt)
                  })
                  if (inlineItems.length === 0) return null
                  return (
                    <div className="space-y-3 mt-3 rounded-xl border border-border p-4 bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Settings2 className="h-3.5 w-3.5" />
                        선택된 채널 링크 입력
                      </p>
                      {inlineItems.map((m) => {
                        const opt = allItems.find((i) => i.key === m.optionKey)!
                        return (
                          <div key={m.optionKey} className="space-y-1.5">
                            <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                              <OptionIcon name={opt.iconName} className="h-3.5 w-3.5 text-muted-foreground" />
                              {opt.metadata?.inputLabel ?? opt.label}
                            </Label>
                            <Input
                              value={m.value}
                              onChange={(e) => {
                                update(
                                  "contactMethods",
                                  form.contactMethods.map((cm) =>
                                    cm.optionKey === m.optionKey
                                      ? { ...cm, value: e.target.value }
                                      : cm
                                  )
                                )
                              }}
                              placeholder={opt.metadata?.placeholder ?? ""}
                              className="rounded-xl h-9 text-sm"
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}

                {/* 전화/예약링크/카카오 선택 시 기존 필드 사용 힌트 */}
                {form.contactMethods.some((m) => hasExistingField(
                  getItemsByGroup("booking_channel", true).find((i) => i.key === m.optionKey) ?? {} as never
                )) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Check className="h-3 w-3 text-success" />
                    전화 · 예약 링크 · 카카오는 위 필드에서 입력한 값이 자동 연결됩니다
                  </p>
                )}
              </Field>

              {/* AddOptionModal */}
              <AddOptionModal
                open={addOptionOpen}
                onClose={() => setAddOptionOpen(false)}
                groupKey="booking_channel"
                currentBranchId={selectedBranch}
                onAdded={(item) => {
                  // 추가 즉시 선택 상태로 만들기
                  update("contactMethods", [
                    ...form.contactMethods,
                    { optionKey: item.key, value: "", isActive: true },
                  ])
                }}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="예약 관련 안내 문구" recommended>
                  <Textarea value={form.bookingNote} onChange={(e) => update("bookingNote", e.target.value)}
                    className="rounded-xl resize-none min-h-[72px]"
                    placeholder="예: 당일 예약 가능 · 전화 상담 후 예약 권장" />
                </Field>
                <Field label="첫 방문 안내 문구" recommended>
                  <Textarea value={form.firstVisitNote} onChange={(e) => update("firstVisitNote", e.target.value)}
                    className="rounded-xl resize-none min-h-[72px]"
                    placeholder="예: 15분 일찍 방문해 주세요 · 신분증 지참 필수" />
                </Field>
              </div>
            </SectionCard>

            {/* ── D: Business Hours ── */}
            <SectionCard id="D" icon={Clock} title="D. 운영 시간 정보"
              description="요일별 구조화 입력 — 챗봇이 정확한 운영 시간을 안내합니다" required>
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-[60px_1fr_1fr_76px] gap-2 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>요일</span><span>오픈</span><span>마감</span><span className="text-center">휴무일</span>
                </div>
                {DAYS.map((day) => (
                  <div key={day.key}
                    className={cn("grid grid-cols-[60px_1fr_1fr_76px] items-center gap-2 border-t border-border px-4 py-2.5",
                      form.hours[day.key].closed && "opacity-40")}>
                    <span className="text-sm font-medium text-foreground">{day.label}요일</span>
                    <Input type="time" value={form.hours[day.key].open}
                      onChange={(e) => updateHours(day.key, "open", e.target.value)}
                      disabled={form.hours[day.key].closed} className="rounded-lg h-8 text-sm" />
                    <Input type="time" value={form.hours[day.key].close}
                      onChange={(e) => updateHours(day.key, "close", e.target.value)}
                      disabled={form.hours[day.key].closed} className="rounded-lg h-8 text-sm" />
                    <div className="flex items-center justify-center gap-1">
                      <Switch checked={form.hours[day.key].closed}
                        onCheckedChange={(v) => updateHours(day.key, "closed", v)}
                        className="scale-[0.7]" />
                      <span className="text-xs text-muted-foreground">휴무</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="점심시간" helper="예: 13:00~14:00">
                  <Input value={form.lunchBreak} onChange={(e) => update("lunchBreak", e.target.value)}
                    className="rounded-xl" placeholder="13:00~14:00" />
                </Field>
                <Field label="마지막 접수 시간" helper="예: 18:30">
                  <Input value={form.lastEntry} onChange={(e) => update("lastEntry", e.target.value)}
                    className="rounded-xl" placeholder="18:30" />
                </Field>
                <Field label="공휴일 운영 정책" helper="예: 공휴일 휴무">
                  <Input value={form.holidayPolicy} onChange={(e) => update("holidayPolicy", e.target.value)}
                    className="rounded-xl" placeholder="공휴일 휴무" />
                </Field>
              </div>
            </SectionCard>

            {/* ── E: Differentiation ── */}
            <SectionCard id="E" icon={Star} title="E. 지점 차별화 정보"
              description="이 지점만의 개별성 — 챗봇 추천 로직과 홈페이지 차별화의 핵심"
              badge="핵심 섹션">
              <Field label="지점 특징 요약 (1~2문장)" recommended
                warning={!form.featureSummary ? "이 항목이 없으면 챗봇이 지점 소개를 제대로 할 수 없습니다" : undefined}>
                <div className="relative">
                  <Textarea value={form.featureSummary} onChange={(e) => update("featureSummary", e.target.value)}
                    className="rounded-xl resize-none min-h-[72px] pr-14" maxLength={120}
                    placeholder="예: 강남 도심에 위치한 비수술 전문 클리닉으로, 자연스러운 결과와 빠른 회복을 추구합니다" />
                  <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                    {form.featureSummary.length}/120
                  </span>
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="추천 고객 유형" helper="이 지점에 잘 맞는 고객 특성 태그">
                  <TagInput value={form.targetCustomers} onChange={(v) => update("targetCustomers", v)}
                    placeholder="고객 유형 추가" presets={TARGET_PRESETS} maxTags={5} />
                </Field>
                <Field label="대표 강점 태그" recommended
                  warning={form.strengths.length < 2 ? "2개 이상 입력하면 챗봇 추천 정확도가 향상됩니다" : undefined}>
                  <TagInput value={form.strengths} onChange={(v) => update("strengths", v)}
                    placeholder="강점 추가" presets={STRENGTH_PRESETS} maxTags={5} />
                </Field>
              </div>

              {/* Featured Content Links */}
              <div className="rounded-xl border border-border p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">대표 콘텐츠 연결</span>
                  <span className="text-xs text-muted-foreground">· 중복 입력 없이 기존 데이터에서 선택</span>
                </div>

                <Field label="대표 시술 연결"
                  warning={form.featuredTreatments.length === 0 ? "대표 시술 연결 시 챗봇 추천 정확도가 향상됩니다" : undefined}
                  helper="홈페이지 추천 시술로 표시됩니다">
                  {branchTreatments.length > 0 ? (
                    <MultiSelect items={branchTreatments} selected={form.featuredTreatments}
                      onChange={(v) => update("featuredTreatments", v)}
                      renderLabel={(item) => (
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />{item.name}
                        </span>
                      )} />
                  ) : (
                    <p className="text-sm text-muted-foreground py-1">시술 관리에서 먼저 시술을 추가해주세요.</p>
                  )}
                </Field>

                <Field label="대표 장비 연결" helper="홈페이지 및 챗봇 장비 소개에 활용">
                  {branchEquipment.length > 0 ? (
                    <MultiSelect items={branchEquipment} selected={form.featuredEquipment}
                      onChange={(v) => update("featuredEquipment", v)}
                      renderLabel={(item) => (
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />{item.name}
                        </span>
                      )} />
                  ) : (
                    <p className="text-sm text-muted-foreground py-1">장비 관리에서 먼저 장비를 추가해주세요.</p>
                  )}
                </Field>

                <Field label="대표 의료진 연결" helper="홈페이지 의료진 카드에 우선 표시">
                  {branchDoctors.length > 0 ? (
                    <MultiSelect items={branchDoctors} selected={form.featuredDoctors}
                      onChange={(v) => update("featuredDoctors", v)}
                      renderLabel={(item) => (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />{item.name}
                        </span>
                      )} />
                  ) : (
                    <p className="text-sm text-muted-foreground py-1">의료진 관리에서 먼저 의료진을 추가해주세요.</p>
                  )}
                </Field>
              </div>

              <Field label="상담 / 진료 스타일 한 줄" recommended>
                <Input value={form.consultingStyle} onChange={(e) => update("consultingStyle", e.target.value)}
                  className="rounded-xl"
                  placeholder="예: 원장 직접 상담 · 과잉 시술 없는 솔직한 피드백" />
              </Field>

              <div className="grid gap-3 sm:grid-cols-3">
                {([
                  { key: "foreignLanguage" as const, label: "외국어 상담 가능", icon: Languages },
                  { key: "maleSpecialized" as const, label: "남성 고객 특화", icon: Users },
                  { key: "femaleSpecialized" as const, label: "여성 고객 특화", icon: Globe },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <Switch checked={form[key]} onCheckedChange={(v) => update(key, v)} />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── F: Media ── */}
            <SectionCard id="F" icon={ImageIcon} title="F. 소개 및 미디어"
              description="홈페이지 비주얼 재료 — 히어로 이미지와 소개 텍스트 관리">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="짧은 소개 문구" required helper="홈페이지 히어로 서브텍스트 (100자 이내)">
                  <div className="relative">
                    <Textarea value={form.shortIntro} onChange={(e) => update("shortIntro", e.target.value)}
                      className="rounded-xl resize-none min-h-[80px] pr-12" maxLength={100}
                      placeholder="한두 문장의 핵심 소개..." />
                    <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                      {form.shortIntro.length}/100
                    </span>
                  </div>
                </Field>
                <Field label="상세 소개 본문" recommended helper="지점 철학, 특징, 히스토리 등">
                  <Textarea value={form.longIntro} onChange={(e) => update("longIntro", e.target.value)}
                    className="rounded-xl resize-none min-h-[80px]"
                    placeholder="지점의 철학, 특징, 히스토리 등..." />
                </Field>
              </div>

              <Field label="대표 이미지 (히어로)" helper="권장 해상도 1920×1080 · PNG, JPG, MP4 최대 10MB">
                <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">히어로 이미지 또는 영상 업로드</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, MP4 · 최대 10MB</p>
                    <Button variant="outline" className="rounded-xl mt-1 h-8 text-xs" type="button">
                      파일 선택
                    </Button>
                  </div>
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="대표 영상 링크" helper="YouTube 또는 Vimeo (선택)">
                  <Input value={form.videoLink} onChange={(e) => update("videoLink", e.target.value)}
                    className="rounded-xl" placeholder="https://youtube.com/..." />
                </Field>
                <Field label="홈페이지 히어로 노출 여부">
                  <div className="flex items-center gap-3 pt-2">
                    <Switch checked={form.showHero} onCheckedChange={(v) => update("showHero", v)} />
                    <span className="text-sm text-muted-foreground">
                      {form.showHero ? "히어로 섹션에 표시됨" : "히어로 섹션 미표시"}
                    </span>
                  </div>
                </Field>
              </div>
            </SectionCard>

            {/* ── G: Doctor / Equipment / Gallery links ── */}
            <SectionCard id="G" icon={Users} title="G. 의료진 · 장비 · 갤러리 연동"
              description="홈페이지 각 섹션에 노출할 콘텐츠를 지정합니다">
              <div className="rounded-xl border border-border bg-success/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <p className="text-sm font-medium text-foreground">의료진 · 장비 데이터는 별도 등록 페이지와 자동 연동됩니다</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  홈페이지 편집 페이지에서 각 섹션별 노출 순서·문구를 추가로 설정할 수 있습니다.
                </p>
              </div>
              <Field label="대표 의료진 노출 순서" helper="홈페이지 의료진 섹션에 표시할 의사를 순서대로 선택">
                {branchDoctors.length > 0 ? (
                  <MultiSelect items={branchDoctors} selected={form.featuredDoctors}
                    onChange={(v) => update("featuredDoctors", v)}
                    renderLabel={(item) => (
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{item.name}</span>
                    )} />
                ) : (
                  <p className="text-sm text-muted-foreground py-1">의료진/장비 페이지에서 먼저 의료진을 추가해주세요.</p>
                )}
              </Field>
              <Field label="대표 장비 노출 순서" helper="홈페이지 장비 섹션에 표시할 장비를 순서대로 선택">
                {branchEquipment.length > 0 ? (
                  <MultiSelect items={branchEquipment} selected={form.featuredEquipment}
                    onChange={(v) => update("featuredEquipment", v)}
                    renderLabel={(item) => (
                      <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{item.name}</span>
                    )} />
                ) : (
                  <p className="text-sm text-muted-foreground py-1">의료진/장비 페이지에서 먼저 장비를 추가해주세요.</p>
                )}
              </Field>
            </SectionCard>

            {/* ── H: Homepage Structure Settings ── */}
            <SectionCard id="H" icon={Globe} title="H. 홈페이지 구조 설정"
              description="지점 홈페이지에 표시할 섹션과 도메인을 설정합니다">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="홈페이지 슬러그" helper="예: sinsa → tatoa.kr/sinsa">
                  <div className="flex items-center gap-0 rounded-xl border border-border overflow-hidden">
                    <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r border-border shrink-0">tatoa.kr/</span>
                    <Input
                      value={(form as unknown as Record<string, string>).websiteSlug ?? ""}
                      onChange={(e) => update("websiteSlug" as keyof FormData, e.target.value as unknown as FormData[keyof FormData])}
                      className="rounded-none border-0 shadow-none"
                      placeholder="branch-slug"
                    />
                  </div>
                </Field>
                <Field label="커스텀 도메인" helper="별도 도메인 연결 시 입력 (선택)">
                  <Input
                    value={(form as unknown as Record<string, string>).customDomain ?? ""}
                    onChange={(e) => update("customDomain" as keyof FormData, e.target.value as unknown as FormData[keyof FormData])}
                    className="rounded-xl"
                    placeholder="예: gangnam.tatoa.kr"
                  />
                </Field>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">홈페이지 활성 섹션</p>
                {[
                  { key: "sectionHero",       label: "히어로 섹션",       desc: "첫인상 헤드라인·CTA" },
                  { key: "sectionPhilosophy", label: "철학 소개",         desc: "클리닉 철학·가치관" },
                  { key: "sectionDoctors",    label: "의료진 섹션",       desc: "의사 프로필 연동" },
                  { key: "sectionEquipment",  label: "장비 섹션",         desc: "의료 장비 연동" },
                  { key: "sectionGallery",    label: "갤러리/둘러보기",   desc: "공간 이미지" },
                  { key: "sectionStrengths",  label: "브랜드 강점",       desc: "차별화 포인트" },
                  { key: "sectionLocation",   label: "오시는 길",         desc: "지도·운영시간" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── I: Footer / Business ── */}
            <SectionCard id="I" icon={Footprints} title="I. 푸터 · 사업자 정보"
              description="홈페이지 하단에 표시될 법적 필수 정보">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="병원 공식 명칭" helper="예: 의료법인 타토아의원">
                  <Input
                    value={(form as unknown as Record<string, string>).clinicLegalName ?? ""}
                    onChange={(e) => update("clinicLegalName" as keyof FormData, e.target.value as unknown as FormData[keyof FormData])}
                    className="rounded-xl"
                    placeholder="의료법인 타토아의원"
                  />
                </Field>
                <Field label="사업자등록번호">
                  <Input
                    value={(form as unknown as Record<string, string>).businessNumber ?? ""}
                    onChange={(e) => update("businessNumber" as keyof FormData, e.target.value as unknown as FormData[keyof FormData])}
                    className="rounded-xl"
                    placeholder="000-00-00000"
                  />
                </Field>
                <Field label="대표자">
                  <Input
                    value={(form as unknown as Record<string, string>).representative ?? ""}
                    onChange={(e) => update("representative" as keyof FormData, e.target.value as unknown as FormData[keyof FormData])}
                    className="rounded-xl"
                    placeholder="대표자 이름"
                  />
                </Field>
                <Field label="의료기관 신고번호">
                  <Input
                    value={(form as unknown as Record<string, string>).medicalLicenseNumber ?? ""}
                    onChange={(e) => update("medicalLicenseNumber" as keyof FormData, e.target.value as unknown as FormData[keyof FormData])}
                    className="rounded-xl"
                    placeholder="제2024-강남-0001호"
                  />
                </Field>
              </div>
              <Field label="개인정보처리방침 링크">
                <Input
                  value={(form as unknown as Record<string, string>).privacyPolicyUrl ?? ""}
                  onChange={(e) => update("privacyPolicyUrl" as keyof FormData, e.target.value as unknown as FormData[keyof FormData])}
                  className="rounded-xl"
                  placeholder="https://tatoa.kr/privacy"
                />
              </Field>
            </SectionCard>
          </div>

          {/* ═══ RIGHT: Sticky Preview + Checklist ═══ */}
          <div>
            <div className="sticky top-24 space-y-3">
              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <TabsList className="w-full rounded-xl bg-muted p-1">
                  <TabsTrigger value="homepage"
                    className="flex-1 rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <Home className="mr-1 h-3 w-3" />홈페이지
                  </TabsTrigger>
                  <TabsTrigger value="chatbot"
                    className="flex-1 rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <Bot className="mr-1 h-3 w-3" />챗봇 요약
                  </TabsTrigger>
                  <TabsTrigger value="checklist"
                    className="flex-1 rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <CheckCircle2 className="mr-1 h-3 w-3" />누락 항목
                    {completeness.missingRequired.length > 0 && (
                      <span className="ml-1 rounded-full bg-destructive px-1 text-xs text-destructive-foreground">
                        {completeness.missingRequired.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* ── Tab 1: Homepage Preview ── */}
                <TabsContent value="homepage" className="mt-3">
                  <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
                    {/* Hero */}
                    <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                      {form.badges.length > 0 && (
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                          {form.badges.slice(0, 2).map((b) => (
                            <Badge key={b} className="text-xs bg-primary/80 text-primary-foreground">{b}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {form.publicName || <span className="text-muted-foreground italic text-sm">지점명 미입력</span>}
                        </h3>
                        <p className="text-xs text-muted-foreground">{form.handle || "@handle"}</p>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {form.tagline || <span className="text-muted-foreground italic text-xs">한 줄 소개를 입력해주세요</span>}
                      </p>
                      {form.strengths.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {form.strengths.slice(0, 3).map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="space-y-1.5 pt-2 border-t border-border">
                        {form.roadAddress && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{form.roadAddress}</span>
                          </div>
                        )}
                        {form.mainPhone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{form.mainPhone}</span>
                          </div>
                        )}
                        {DAYS.some((d) => !form.hours[d.key].closed && form.hours[d.key].open) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {DAYS.filter((d) => !form.hours[d.key].closed && form.hours[d.key].open)
                                .slice(0, 2)
                                .map((d) => `${d.label} ${form.hours[d.key].open}~${form.hours[d.key].close}`)
                                .join(" / ")}
                            </span>
                          </div>
                        )}
                        {form.hasParking && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Car className="h-3 w-3 shrink-0" />
                            <span>주차 {form.parkingType}</span>
                          </div>
                        )}
                      </div>
                      {form.featuredTreatments.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">대표 시술</p>
                          <div className="flex flex-wrap gap-1">
                            {form.featuredTreatments.map((id) => {
                              const t = branchTreatments.find((t) => t.id === id)
                              return t ? (
                                <Badge key={id} variant="outline" className="text-xs gap-1">
                                  <Sparkles className="h-2.5 w-2.5" />{t.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                      {form.featuredDoctors.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">대표 의료진</p>
                          <div className="flex flex-wrap gap-1">
                            {form.featuredDoctors.map((id) => {
                              const d = branchDoctors.find((d) => d.id === id)
                              return d ? (
                                <Badge key={id} variant="outline" className="text-xs gap-1">
                                  <Users className="h-2.5 w-2.5" />{d.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                      {form.bookingLink && (
                        <Button size="sm" className="w-full rounded-xl h-8 text-xs mt-1">
                          예약하기
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ── Tab 2: Chatbot Summary ── */}
                <TabsContent value="chatbot" className="mt-3">
                  <Card className="rounded-2xl border-border bg-card shadow-sm">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-semibold">챗봇 자동 요약</CardTitle>
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        입력값 기반 자동 생성 미리보기
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      {chatbotSummary.length > 0 ? (
                        <div className="rounded-xl bg-muted/50 p-3 font-mono text-xs space-y-1.5">
                          {chatbotSummary.map((line, i) => (
                            <p key={i} className="text-muted-foreground leading-relaxed">{line}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl bg-muted/50 p-4 text-center">
                          <p className="text-xs text-muted-foreground">
                            정보를 입력하면 챗봇 요약이 자동 생성됩니다
                          </p>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">챗봇 데이터 품질</p>
                          <span className="text-xs font-bold text-foreground">{completeness.percentage}%</span>
                        </div>
                        <Progress value={completeness.percentage} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ── Tab 3: Checklist ── */}
                <TabsContent value="checklist" className="mt-3">
                  <Card className="rounded-2xl border-border bg-card shadow-sm">
                    <CardContent className="p-4 space-y-4">
                      {/* Required */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                            공개 필수 항목
                          </p>
                          <span className={cn("text-xs font-bold tabular-nums",
                            completeness.missingRequired.length > 0 ? "text-destructive" : "text-success"
                          )}>
                            {completeness.completedRequired}/{completeness.totalRequired}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {[...REQUIRED, { key: "hours", label: "운영 시간 (평일)", section: "D", why: "챗봇 답변 정확도 저하 가능" }].map((item) => {
                            const missing = completeness.missingRequired.some((m) => m.key === item.key)
                            return (
                              <button key={item.key} type="button" onClick={() => scrollTo(item.section)}
                                className="w-full flex items-center gap-2 rounded-lg p-2 text-left hover:bg-muted/50 transition-colors group">
                                {missing
                                  ? <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                                  : <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-xs font-medium truncate",
                                    missing ? "text-destructive" : "text-muted-foreground line-through"
                                  )}>{item.label}</p>
                                  {missing && item.why && (
                                    <p className="text-xs text-muted-foreground truncate">{item.why}</p>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0 opacity-60 group-hover:opacity-100">
                                  {item.section}
                                </Badge>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="border-t border-border" />

                      {/* Recommended */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            품질 강화 권장 항목
                          </p>
                          <span className="text-xs font-bold text-amber-600">
                            {completeness.missingRecommended.length}개 누락
                          </span>
                        </div>
                        <div className="space-y-1">
                          {[
                            ...RECOMMENDED,
                            { key: "keywords", label: "키워드 태그 (2개 이상)", section: "A", why: "챗봇 검색 매칭" },
                            { key: "strengths", label: "대표 강점 태그", section: "E", why: "챗봇 추천 정확도" },
                            { key: "featuredTreatments", label: "대표 시술 연결", section: "E", why: "홈페이지 추천 시술" },
                          ].map((item) => {
                            const missing = completeness.missingRecommended.some((m) => m.key === item.key)
                            return (
                              <button key={item.key} type="button" onClick={() => scrollTo(item.section)}
                                className="w-full flex items-center gap-2 rounded-lg p-2 text-left hover:bg-muted/50 transition-colors group">
                                {missing
                                  ? <Circle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                  : <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-xs font-medium truncate",
                                    missing ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground line-through"
                                  )}>{item.label}</p>
                                  {missing && item.why && (
                                    <p className="text-xs text-muted-foreground truncate">{item.why}</p>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0 opacity-60 group-hover:opacity-100">
                                  {item.section}
                                </Badge>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {completeness.missingRequired.length === 0 && completeness.missingRecommended.length === 0 && (
                        <div className="rounded-xl bg-success/5 border border-success/20 p-4 text-center">
                          <CheckCircle2 className="mx-auto h-6 w-6 text-success mb-1.5" />
                          <p className="text-sm font-medium text-success">모든 항목 입력 완료!</p>
                          <p className="text-xs text-muted-foreground mt-1">공개 전환 준비가 되었습니다</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
