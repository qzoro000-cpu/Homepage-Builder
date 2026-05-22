"use client"

import { useState } from "react"
import {
  Sparkles, X, ChevronRight, AlertTriangle, CheckCircle2,
  Loader2, Lock, Unlock, Eye, RefreshCw, Wand2, Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { AiGenerateRequest, AiGeneratedSection } from "@/app/api/treatments/ai-generate/route"
import type { DraftSection, LandingDraft } from "@/lib/landing-draft-store"
import type { LandingSectionType, TreatmentData } from "@/lib/treatment-store"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type TemplateType = "general" | "equipment_based" | "premium"
type ToneType = "premium" | "medical_info" | "consult_conversion" | "brand"
type LengthType = "short" | "medium" | "long"
type EmphasisType = "effects" | "equipment" | "doctors" | "price" | "brand"

const TEMPLATES: { value: TemplateType; label: string; desc: string; badge?: string }[] = [
  {
    value: "general",
    label: "템플릿 A — 일반 시술형",
    desc: "히어로 → 소개 → 특징 → 가격 → FAQ → CTA",
  },
  {
    value: "equipment_based",
    label: "템플릿 B — 장비 기반",
    desc: "히어로 → 헤드라인 → 장비소개 → 차별화 → 가격 → 비포&애프터 → 의료진 → CTA",
    badge: "장비연결시",
  },
  {
    value: "premium",
    label: "템플릿 C — 프리미엄 브랜드",
    desc: "히어로 → 헤드라인 → 진단 → 이미지+텍스트 → 차별화 → 가격 → 인용 → 위치 → CTA",
    badge: "고급형",
  },
]

const TONES: { value: ToneType; label: string; desc: string }[] = [
  { value: "premium", label: "프리미엄", desc: "고급스럽고 신뢰감 있는 의료 프리미엄 톤" },
  { value: "medical_info", label: "의료 정보", desc: "전문적이고 정보 중심적인 설명체" },
  { value: "consult_conversion", label: "상담 유도", desc: "공감형·CTA 중심, 상담 전환 최적화" },
  { value: "brand", label: "브랜드 무드", desc: "감성적·차별화된 브랜드 아이덴티티" },
]

const LENGTHS: { value: LengthType; label: string; desc: string }[] = [
  { value: "short", label: "간결", desc: "2~3문장" },
  { value: "medium", label: "표준", desc: "4~6문장" },
  { value: "long", label: "상세", desc: "6~10문장" },
]

const EMPHASES: { value: EmphasisType; label: string }[] = [
  { value: "effects", label: "시술 효과" },
  { value: "equipment", label: "장비 기술력" },
  { value: "doctors", label: "의료진 전문성" },
  { value: "price", label: "가격 투명성" },
  { value: "brand", label: "브랜드 철학" },
]

const LANDING_SECTION_LABELS: Record<LandingSectionType, string> = {
  hero_image: "히어로 이미지",
  hero_video: "히어로 영상",
  headline_copy: "헤드라인 카피",
  intro_text: "시술 소개",
  feature_grid: "특징 그리드",
  diagnosis_section: "진단 섹션",
  treatment_process: "시술 프로세스",
  program_pricing_table: "가격/프로그램 표",
  before_after_gallery: "비포&애프터",
  quote_block: "인용 블록",
  treatment_area_visual: "적용 부위",
  faq_block: "FAQ",
  doctor_recommendation: "의료진 추천",
  equipment_highlight: "장비 소개",
  differentiation_cards: "차별화 카드",
  clinic_info_block: "센터 정보",
  map_block: "오시는 길",
  cta_block: "CTA",
  image_text_split: "이미지+텍스트",
  fullwidth_image: "전체 폭 이미지",
  bullet_list: "불릿 목록",
  notice_block: "안내 블록",
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

type AiLandingModalProps = {
  treatmentData: TreatmentData
  onClose: () => void
  onDraftReady: (draft: LandingDraft) => void
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function AiLandingModal({ treatmentData, onClose, onDraftReady }: AiLandingModalProps) {
  const [step, setStep] = useState<"config" | "generating" | "review">("config")

  // Config state
  const [template, setTemplate] = useState<TemplateType>("general")
  const [tone, setTone] = useState<ToneType>("premium")
  const [length, setLength] = useState<LengthType>("medium")
  const [emphasis, setEmphasis] = useState<EmphasisType>("effects")
  const [includeEquipment, setIncludeEquipment] = useState(true)
  const [includeDoctors, setIncludeDoctors] = useState(true)
  const [includeFaq, setIncludeFaq] = useState(true)
  const [includeBranchInfo, setIncludeBranchInfo] = useState(true)

  // Result state
  const [generatedDraft, setGeneratedDraft] = useState<LandingDraft | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState("")

  const profile = treatmentData.profile

  // ── Build request ──
  function buildRequest(): AiGenerateRequest {
    return {
      treatment: {
        name: profile.name,
        category: profile.category,
        subcategory: profile.subcategory,
        oneLinePitch: profile.oneLinePitch,
        shortDescription: profile.shortDescription,
        longDescription: profile.longDescription,
        landingHeadline: profile.landingHeadline,
        landingSubheadline: profile.landingSubheadline,
        differentiationCopy: profile.differentiationCopy,
        chatbotSummary: profile.chatbotSummary,
        durationMinutes: profile.durationMinutes,
        anesthesiaRequired: profile.anesthesiaRequired,
        downtimeNote: profile.downtimeNote,
        painLevel: profile.painLevel,
        treatmentCycleGuide: profile.treatmentCycleGuide,
        maintenancePeriod: profile.maintenancePeriod,
        priceRegular: profile.priceRegular,
        priceEvent: profile.priceEvent,
        vatIncluded: profile.vatIncluded,
        useConsultInquiry: profile.useConsultInquiry,
        cardBadge: profile.cardBadge,
      },
      benefits: treatmentData.benefits,
      targets: treatmentData.targets,
      concernAreas: treatmentData.concernAreas,
      keywords: treatmentData.keywords,
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
      branchInfo: {
        name: profile.branchId,
      },
      availableAssets: treatmentData.assets
        .filter((a) => a.isPublic)
        .map((a) => ({
          id: a.id,
          assetType: a.assetType,
          fileType: a.fileType,
          useForLanding: a.useForLanding,
          useForHomepage: a.useForHomepage,
          isFeatured: a.isFeatured,
          title: a.title,
        })),
      options: {
        templateType: template,
        tone,
        length,
        emphasis,
        includeEquipment,
        includeDoctors,
        includeFaq,
        includeBranchInfo,
        includeAssets: true,
        excludeSections: [],
      },
    }
  }

  // ── Generate ──
  async function handleGenerate() {
    setStep("generating")
    setError(null)
    setProgress("CMS 데이터 수집 중...")

    try {
      const requestBody = buildRequest()
      setProgress("AI가 랜딩 섹션을 생성하고 있습니다...")

      const res = await fetch("/api/treatments/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? "생성 중 오류가 발생했습니다.")
        setStep("config")
        return
      }

      // Convert AI sections to DraftSection format
      const draftSections: DraftSection[] = (data.sections as AiGeneratedSection[]).map((s, i) => ({
        sectionType: s.section_type as LandingSectionType,
        title: s.title,
        subtitle: s.subtitle,
        body: s.body,
        styleVariant: s.style_variant,
        metadata: s.metadata,
        isVisible: true,
        sortOrder: i + 1,
      }))

      const now = new Date()
      const timeStr =
        now.getHours().toString().padStart(2, "0") +
        ":" +
        now.getMinutes().toString().padStart(2, "0")

      const draft: LandingDraft = {
        id: `draft_${Date.now().toString(36)}`,
        treatmentId: profile.id,
        source: "ai_generated",
        createdAt: now.toISOString(),
        label: `AI 생성 (${template === "general" ? "A" : template === "equipment_based" ? "B" : "C"} · ${timeStr})`,
        sections: draftSections,
        templateType: template,
        tone,
        pageTitle: data.page_title,
        pageSummary: data.page_summary,
        warnings: data.warnings ?? [],
      }

      setGeneratedDraft(draft)
      setWarnings(data.warnings ?? [])
      setStep("review")
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류가 발생했습니다.")
      setStep("config")
    }
  }

  // ── Apply ──
  function handleApply() {
    if (!generatedDraft) return
    onDraftReady(generatedDraft)
    onClose()
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">AI 랜딩 섹션 생성</h2>
              <p className="text-xs text-muted-foreground">{profile.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step: Config ── */}
          {step === "config" && (
            <div className="p-6 space-y-6">

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Data notice */}
              <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  AI는 CMS에 등록된 시술 정보, 프로그램, 주의사항, 연결 데이터만 사용합니다. 없는 정보는 생성하지 않습니다.
                </p>
              </div>

              {/* Template */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">템플릿 선택</Label>
                <div className="space-y-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTemplate(t.value)}
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-all",
                        template === t.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                          template === t.value ? "border-primary" : "border-muted-foreground/30"
                        )}>
                          {template === t.value && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{t.label}</span>
                        {t.badge && (
                          <Badge className="text-xs bg-muted text-muted-foreground ml-auto">{t.badge}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">톤 & 무드</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all",
                        tone === t.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Length & Emphasis */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">섹션 분량</Label>
                  <div className="flex gap-1.5">
                    {LENGTHS.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLength(l.value)}
                        className={cn(
                          "flex-1 rounded-lg border py-2 text-xs font-medium transition-all",
                          length === l.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">강조 포인트</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {EMPHASES.map((e) => (
                      <button
                        key={e.value}
                        type="button"
                        onClick={() => setEmphasis(e.value)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                          emphasis === e.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">포함 데이터</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "equipment", label: "연결 장비", value: includeEquipment, set: setIncludeEquipment },
                    { key: "doctors", label: "연결 의료진", value: includeDoctors, set: setIncludeDoctors },
                    { key: "faq", label: "연결 FAQ", value: includeFaq, set: setIncludeFaq },
                    { key: "branch", label: "지점 정보", value: includeBranchInfo, set: setIncludeBranchInfo },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => item.set(!item.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all",
                        item.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {item.value ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-current" />
                      )}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step: Generating ── */}
          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-16 px-8 gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-16 w-16 text-primary/30 animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">{progress}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Claude Opus가 CMS 데이터를 분석하고 있습니다
                </p>
              </div>
            </div>
          )}

          {/* ── Step: Review ── */}
          {step === "review" && generatedDraft && (
            <div className="p-6 space-y-4">

              {/* Summary */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">생성 완료 — {generatedDraft.sections.length}개 섹션</span>
                </div>
                {generatedDraft.pageTitle && (
                  <p className="text-sm font-semibold text-foreground mt-2">{generatedDraft.pageTitle}</p>
                )}
                {generatedDraft.pageSummary && (
                  <p className="text-xs text-muted-foreground mt-1">{generatedDraft.pageSummary}</p>
                )}
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">데이터 부족 경고</span>
                  </div>
                  {warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-600 ml-5">{w}</p>
                  ))}
                </div>
              )}

              {/* Section list preview */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">생성된 섹션</p>
                {generatedDraft.sections.map((s, i) => (
                  <div key={i} className="border rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <Badge className="text-xs bg-slate-100 text-slate-700 shrink-0">
                        {LANDING_SECTION_LABELS[s.sectionType] ?? s.sectionType}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{s.title || "–"}</p>
                        {s.subtitle && (
                          <p className="text-xs text-muted-foreground mt-0.5">{s.subtitle}</p>
                        )}
                        {s.body && (
                          <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{s.body}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          {step === "config" && (
            <>
              <Button variant="ghost" onClick={onClose} className="rounded-xl">
                취소
              </Button>
              <Button
                onClick={handleGenerate}
                className="rounded-xl gap-2"
              >
                <Wand2 className="h-4 w-4" />
                AI 생성 시작
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {step === "generating" && (
            <Button
              variant="ghost"
              onClick={() => setStep("config")}
              className="rounded-xl w-full"
              disabled
            >
              생성 중...
            </Button>
          )}

          {step === "review" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedDraft(null)
                  setStep("config")
                }}
                className="rounded-xl gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                다시 생성
              </Button>
              <Button
                onClick={handleApply}
                className="rounded-xl gap-2 bg-primary"
              >
                <Check className="h-4 w-4" />
                적용하기
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

