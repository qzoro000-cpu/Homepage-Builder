"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Download,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Upload,
  X,
  Check,
  AlertCircle,
  Star,
  Globe,
  Link2,
  Settings2,
  Tag,
  Layers,
  ShieldAlert,
  Image as ImageIcon,
  FileText,
  Video,
  Pencil,
  RotateCcw,
  Building2,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useEquipment,
  EquipmentProfile,
  EquipmentProgram,
  EquipmentPrecaution,
  EquipmentAsset,
  AssetType,
} from "@/lib/equipment-store"
import { useContentRelation, ContentNodeType, RelationType } from "@/lib/content-relation-store"
import { useDomain, PageType } from "@/lib/domain-store"
import { useBranch, useSession } from "@/app/admin/layout"
import { hasPermission, canUploadAsset, canEditMaster } from "@/lib/rbac"
import { cn } from "@/lib/utils"
import { ImageEffectEditor } from "@/components/admin/image-effect-editor"
import { useMedia } from "@/lib/media-store"
import { Wand2 } from "lucide-react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ASSET_TYPES: AssetType[] = [
  "대표이미지",
  "상세이미지",
  "비포애프터",
  "제조사브로슈어",
  "시술안내PDF",
  "교육자료",
  "홍보영상",
  "시술영상",
  "홈페이지비주얼",
  "랜딩소스",
]

const RELATION_TYPE_LABELS: Record<RelationType, string> = {
  related: "연관",
  featured: "대표 연결",
  faq_for: "FAQ",
  recommended_by: "추천 의사",
  landing_source: "랜딩 소스",
  chatbot_reference: "챗봇 참조",
}

const CONTENT_NODE_TYPE_LABELS: Record<ContentNodeType, string> = {
  equipment: "장비",
  treatment: "시술",
  doctor: "의사",
  faq: "FAQ",
  event: "이벤트",
  notice: "공지",
  landing_page: "랜딩페이지",
}

const PAGE_TYPE_LABELS: Record<PageType, string> = {
  detail: "상세페이지",
  landing: "랜딩페이지",
  external: "외부링크",
  booking: "예약페이지",
}

// ---------------------------------------------------------------------------
// SectionCard
// ---------------------------------------------------------------------------

function SectionCard({
  id,
  icon: Icon,
  title,
  description,
  badge,
  children,
}: {
  id?: string
  icon: React.ElementType
  title: string
  description?: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card id={id} className="rounded-2xl border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              {badge}
            </div>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "초안", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    published: { label: "공개", className: "bg-green-100 text-green-800 border-green-200" },
    hidden: { label: "숨김", className: "bg-gray-100 text-gray-600 border-gray-200" },
    archived: { label: "보관", className: "bg-red-100 text-red-700 border-red-200" },
  }
  const info = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" }
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", info.className)}>
      {info.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// TagInput
// ---------------------------------------------------------------------------

function TagInput({
  label,
  tags,
  onChange,
  disabled,
}: {
  label: string
  tags: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
}) {
  const [input, setInput] = useState("")

  function addTag() {
    const v = input.trim()
    if (v && !tags.includes(v)) {
      onChange([...tags, v])
    }
    setInput("")
  }

  function removeTag(idx: number) {
    onChange(tags.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1.5 min-h-[36px] rounded-lg border border-border bg-background px-2 py-1.5">
        {tags.map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {t}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="ml-0.5 text-primary/60 hover:text-primary"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            className="flex-1 min-w-[120px] bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="입력 후 Enter"
          />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FieldRow — master/override UI wrapper
// ---------------------------------------------------------------------------

function FieldRow({
  label,
  fieldName,
  isMasterLinked,
  isOverridden,
  canReset,
  onReset,
  children,
}: {
  label: string
  fieldName: string
  isMasterLinked: boolean
  isOverridden: boolean
  canReset: boolean
  onReset: (field: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">{label}</Label>
        {isMasterLinked && (
          isOverridden ? (
            <Badge variant="outline" className="text-[10px] py-0 border-orange-300 text-orange-700 bg-orange-50">
              지점 수정됨
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] py-0 border-blue-300 text-blue-700 bg-blue-50">
              본사 기본값
            </Badge>
          )
        )}
        {isMasterLinked && isOverridden && canReset && (
          <button
            type="button"
            onClick={() => onReset(fieldName)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            본사 값으로 되돌리기
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function EquipmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const equipmentId = params.equipmentId as string
  const { selectedBranch } = useBranch()
  const { currentUser } = useSession()
  const { getVariants } = useMedia()

  const {
    getEquipment,
    updateProfile,
    updateExtras,
    resetFieldToMaster,
    syncFromMaster,
    createEquipmentFromMaster,
    getAllMasters,
    addPrecaution,
    updatePrecaution,
    deletePrecaution,
    movePrecaution,
    addProgram,
    updateProgram,
    deleteProgram,
    addAsset,
    updateAsset,
    deleteAsset,
    getEffectiveAssets,
    toggleMasterAssetVisibility,
  } = useEquipment()

  const {
    getRelationsFrom,
    addRelation,
    updateRelation,
    removeRelation,
    moveRelation,
  } = useContentRelation()

  const {
    getPrimaryDomain,
    getUrlsForEquipment,
    addUrl,
    updateUrl,
    deleteUrl,
    computeFullUrl,
    isSlugUnique,
  } = useDomain()

  // RBAC
  const canEdit = hasPermission(currentUser, "branch_equipment:update")
  const canUpload = canUploadAsset(currentUser)
  const canMaster = canEditMaster(currentUser)

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------

  const equipmentData = getEquipment(equipmentId)
  const profile = equipmentData?.profile

  // Profile form state
  const [localForm, setLocalForm] = useState<Partial<EquipmentProfile>>({})
  const [isDirty, setIsDirty] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // Extras
  const [localBenefits, setLocalBenefits] = useState<string[]>([])
  const [localTargets, setLocalTargets] = useState<string[]>([])
  const [localConcernAreas, setLocalConcernAreas] = useState<string[]>([])
  const [localKeywords, setLocalKeywords] = useState<string[]>([])
  const [localCustomerSearchTerms, setLocalCustomerSearchTerms] = useState<string[]>([])
  const [localSpecialtyPoints, setLocalSpecialtyPoints] = useState<string[]>([])
  const [localCompanionTreatments, setLocalCompanionTreatments] = useState<string[]>([])
  const [isExtrasDirty, setIsExtrasDirty] = useState(false)

  // Programs
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null)
  const [programDrafts, setProgramDrafts] = useState<Record<string, Partial<EquipmentProgram>>>({})

  // Precautions
  const [expandedPrecautionId, setExpandedPrecautionId] = useState<string | null>(null)
  const [precautionDrafts, setPrecautionDrafts] = useState<Record<string, Partial<EquipmentPrecaution>>>({})

  // Master picker
  const [showMasterPicker, setShowMasterPicker] = useState(false)
  const [masterSearch, setMasterSearch] = useState("")

  // Asset upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType>("대표이미지")
  const [assetTab, setAssetTab] = useState<"hq" | "branch">("hq")
  const [assetEditId, setAssetEditId] = useState<string | null>(null)
  const [assetDrafts, setAssetDrafts] = useState<Record<string, Partial<EquipmentAsset>>>({})
  const [editingStyleAsset, setEditingStyleAsset] = useState<EquipmentAsset | null>(null)

  // Relations
  const [showAddRelation, setShowAddRelation] = useState(false)
  const [newRelation, setNewRelation] = useState<{
    targetType: ContentNodeType
    targetId: string
    relationType: RelationType
    use: { homepage: boolean; landing: boolean; chatbot: boolean; internalOnly: boolean }
    note: string
  }>({
    targetType: "treatment",
    targetId: "",
    relationType: "related",
    use: { homepage: false, landing: false, chatbot: false, internalOnly: false },
    note: "",
  })

  // URLs
  const [showAddUrl, setShowAddUrl] = useState(false)
  const [newUrl, setNewUrl] = useState<{
    pageType: PageType
    slug: string
    seoTitle: string
  }>({
    pageType: "detail",
    slug: "",
    seoTitle: "",
  })
  const [urlSlugs, setUrlSlugs] = useState<Record<string, string>>({})
  const [urlSlugErrors, setUrlSlugErrors] = useState<Record<string, boolean>>({})

  // ---------------------------------------------------------------------------
  // Reset on equipmentId change
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const data = getEquipment(equipmentId)
    if (!data) return
    const p = data.profile
    setLocalForm({ ...p })
    setLocalBenefits([...data.benefits])
    setLocalTargets([...data.targets])
    setLocalConcernAreas([...data.concernAreas])
    setLocalKeywords([...data.keywords])
    setLocalCustomerSearchTerms([...data.customerSearchTerms])
    setLocalSpecialtyPoints([...data.specialtyPoints])
    setLocalCompanionTreatments([...data.companionTreatments])
    setIsDirty(false)
    setIsSaved(false)
    setIsExtrasDirty(false)
    const urls = getUrlsForEquipment(equipmentId)
    const slugMap: Record<string, string> = {}
    urls.forEach((u) => { slugMap[u.id] = u.slug })
    setUrlSlugs(slugMap)
  }, [equipmentId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function updateField<K extends keyof EquipmentProfile>(key: K, value: EquipmentProfile[K]) {
    setLocalForm((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
    setIsSaved(false)
  }

  function handleSave() {
    updateProfile(equipmentId, localForm as Partial<EquipmentProfile>)
    setIsDirty(false)
    setIsSaved(true)
    setLastSavedAt(new Date())
  }

  function handleSaveExtras() {
    updateExtras(equipmentId, {
      benefits: localBenefits,
      targets: localTargets,
      concernAreas: localConcernAreas,
      keywords: localKeywords,
      customerSearchTerms: localCustomerSearchTerms,
      specialtyPoints: localSpecialtyPoints,
      companionTreatments: localCompanionTreatments,
    })
    setIsExtrasDirty(false)
  }

  function handleResetField(fieldName: string) {
    resetFieldToMaster(equipmentId, fieldName)
    const updated = getEquipment(equipmentId)
    if (updated) setLocalForm({ ...updated.profile })
  }

  function handleSync() {
    syncFromMaster(equipmentId)
    const updated = getEquipment(equipmentId)
    if (updated) setLocalForm({ ...updated.profile })
  }

  function handleCreateFromMaster(masterId: string) {
    createEquipmentFromMaster(selectedBranch, masterId)
    setShowMasterPicker(false)
  }

  const isOverridden = useCallback(
    (fieldName: string) => {
      return profile?.override?.overriddenFields?.includes(fieldName) ?? false
    },
    [profile]
  )

  const isMasterLinked = !!profile?.masterEquipmentId

  // ---------------------------------------------------------------------------
  // Asset helpers
  // ---------------------------------------------------------------------------

  function getFileType(mimeType: string): "image" | "pdf" | "video" | "other" {
    if (mimeType.startsWith("image/")) return "image"
    if (mimeType === "application/pdf") return "pdf"
    if (mimeType.startsWith("video/")) return "video"
    return "other"
  }

  function validateFileSize(file: File): string | null {
    const ft = getFileType(file.type)
    if (ft === "image" && file.size > 20 * 1024 * 1024) return "이미지는 20MB 이하여야 합니다."
    if (ft === "pdf" && file.size > 50 * 1024 * 1024) return "PDF는 50MB 이하여야 합니다."
    if (ft === "video" && file.size > 300 * 1024 * 1024) return "동영상은 300MB 이하여야 합니다."
    return null
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const existingAssets = getEffectiveAssets(equipmentId).filter(
      (a) => a.scope === "branch_specific"
    )
    files.forEach((file) => {
      const err = validateFileSize(file)
      if (err) { alert(err); return }
      const fileType = getFileType(file.type)
      addAsset(equipmentId, {
        scope: "branch_specific",
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileType,
        mimeType: file.type,
        assetType: selectedAssetType,
        isFeatured: false,
        isPublic: true,
        useForHomepage: false,
        useForLanding: false,
        useForChatbot: false,
        sortOrder: existingAssets.length + 1,
      })
    })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ---------------------------------------------------------------------------
  // Completeness calculation
  // ---------------------------------------------------------------------------

  function calcCompleteness() {
    if (!equipmentData) return { score: 0, missing: [] as string[] }
    const p = localForm as Partial<EquipmentProfile>
    const missing: string[] = []
    let score = 0

    if (p.name) score += 15; else missing.push("장비명 (필수)")
    if (p.category) score += 15; else missing.push("카테고리 (필수)")
    if (p.oneLinePitch) score += 15; else missing.push("한 줄 소개 (필수)")
    if (p.shortDescription) score += 15; else missing.push("짧은 설명 (필수)")

    if (p.manufacturer) score += 10; else missing.push("제조사 (권장)")
    if (p.longDescription) score += 10; else missing.push("상세 설명 (권장)")
    if (localBenefits.length > 0) score += 10; else missing.push("효과 태그 (권장)")
    if (localKeywords.length > 0) score += 10; else missing.push("키워드 (권장)")
    const assetCount = getEffectiveAssets(equipmentId).length
    if (assetCount > 0) score += 10; else missing.push("자산 파일 (권장)")

    const pct = Math.min(100, Math.round(score))
    return { score: pct, missing }
  }

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const effectiveAssets = equipmentData ? getEffectiveAssets(equipmentId) : []
  const hqAssets = effectiveAssets.filter(
    (a) => a.inheritedFromMaster || a.scope === "hq_common"
  )
  const branchAssets = effectiveAssets.filter((a) => a.scope === "branch_specific")
  const hiddenIds = profile?.hiddenMasterAssetIds ?? []

  const relations = getRelationsFrom(equipmentId, "equipment").sort(
    (a, b) => a.sortOrder - b.sortOrder
  )

  const equipmentUrls = getUrlsForEquipment(equipmentId)
  const primaryDomain = getPrimaryDomain(selectedBranch)

  const allMasters = getAllMasters()
  const filteredMasters = allMasters.filter(
    (m) =>
      !masterSearch ||
      m.name.toLowerCase().includes(masterSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(masterSearch.toLowerCase())
  )

  const { score: completenessScore, missing: completenessItems } = calcCompleteness()

  const featuredAsset =
    effectiveAssets.find((a) => a.isFeatured && a.fileType === "image" && !a.hiddenInBranch) ??
    effectiveAssets.find((a) => a.useForHomepage && a.fileType === "image" && !a.hiddenInBranch)

  // ---------------------------------------------------------------------------
  // Early return — not found
  // ---------------------------------------------------------------------------

  if (!equipmentData || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">장비를 찾을 수 없습니다. (ID: {equipmentId})</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/branch/equipment")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/branch/equipment")}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            목록
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{profile.name}</h1>
              <StatusBadge status={profile.status} />
              {isDirty && (
                <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-700 bg-orange-50">
                  미저장
                </Badge>
              )}
              {isSaved && (
                <Badge variant="outline" className="text-[10px] border-green-300 text-green-700 bg-green-50">
                  <Check className="mr-1 h-2.5 w-2.5" />
                  저장됨
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profile.category}
              {lastSavedAt && ` · 마지막 저장: ${lastSavedAt.toLocaleTimeString("ko-KR")}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMasterLinked && canEdit && (
            <Button variant="outline" size="sm" onClick={handleSync} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              본사 업데이트 동기화
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={handleSave} disabled={!isDirty} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              저장
            </Button>
          )}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">

          {/* ════════════════════════════════════════════
              Section A — 기본 정보
          ════════════════════════════════════════════ */}
          <SectionCard
            id="section-basic"
            icon={Zap}
            title="기본 정보"
            description="장비의 핵심 정보를 입력합니다."
            badge={
              isMasterLinked ? (
                <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700 bg-blue-50">
                  <Building2 className="mr-1 h-2.5 w-2.5" />
                  본사 연동
                </Badge>
              ) : undefined
            }
          >
            <div className="space-y-5">
              {/* Master picker */}
              {!isMasterLinked && canEdit && (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      이 장비는 본사 마스터와 연동되어 있지 않습니다.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowMasterPicker((v) => !v)}
                      className="shrink-0 text-xs"
                    >
                      <Download className="mr-1.5 h-3 w-3" />
                      본사 장비 불러오기
                    </Button>
                  </div>
                  {showMasterPicker && (
                    <div className="mt-3 space-y-2">
                      <Input
                        placeholder="검색..."
                        value={masterSearch}
                        onChange={(e) => setMasterSearch(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border border-border bg-background p-1">
                        {filteredMasters.length === 0 && (
                          <p className="px-2 py-1 text-xs text-muted-foreground">결과 없음</p>
                        )}
                        {filteredMasters.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            className="w-full text-left rounded px-2 py-1.5 text-xs hover:bg-muted transition-colors"
                            onClick={() => handleCreateFromMaster(m.id)}
                          >
                            <span className="font-medium">{m.name}</span>
                            <span className="ml-2 text-muted-foreground">{m.category}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* name */}
                <FieldRow
                  label="장비명 *"
                  fieldName="name"
                  isMasterLinked={isMasterLinked}
                  isOverridden={isOverridden("name")}
                  canReset={canMaster}
                  onReset={handleResetField}
                >
                  <Input
                    value={localForm.name ?? ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    disabled={!canEdit}
                    placeholder="예: 울쎄라"
                  />
                </FieldRow>

                {/* category */}
                <FieldRow
                  label="카테고리 *"
                  fieldName="category"
                  isMasterLinked={isMasterLinked}
                  isOverridden={isOverridden("category")}
                  canReset={canMaster}
                  onReset={handleResetField}
                >
                  <Input
                    value={localForm.category ?? ""}
                    onChange={(e) => updateField("category", e.target.value)}
                    disabled={!canEdit}
                    placeholder="예: 리프팅"
                  />
                </FieldRow>

                {/* manufacturer */}
                <FieldRow
                  label="제조사"
                  fieldName="manufacturer"
                  isMasterLinked={isMasterLinked}
                  isOverridden={isOverridden("manufacturer")}
                  canReset={canMaster}
                  onReset={handleResetField}
                >
                  <Input
                    value={localForm.manufacturer ?? ""}
                    onChange={(e) => updateField("manufacturer", e.target.value)}
                    disabled={!canEdit}
                    placeholder="예: Merz"
                  />
                </FieldRow>

                {/* energyType */}
                <FieldRow
                  label="에너지 타입"
                  fieldName="energyType"
                  isMasterLinked={isMasterLinked}
                  isOverridden={isOverridden("energyType")}
                  canReset={canMaster}
                  onReset={handleResetField}
                >
                  <Input
                    value={localForm.energyType ?? ""}
                    onChange={(e) => updateField("energyType", e.target.value)}
                    disabled={!canEdit}
                    placeholder="예: HIFU"
                  />
                </FieldRow>

                {/* shotUnitLabel */}
                <FieldRow
                  label="샷 단위 명칭"
                  fieldName="shotUnitLabel"
                  isMasterLinked={false}
                  isOverridden={false}
                  canReset={false}
                  onReset={() => {}}
                >
                  <Input
                    value={localForm.shotUnitLabel ?? ""}
                    onChange={(e) => updateField("shotUnitLabel", e.target.value)}
                    disabled={!canEdit}
                    placeholder="예: 샷"
                  />
                </FieldRow>

                {/* standardShotCount */}
                <FieldRow
                  label="기본 샷 수"
                  fieldName="standardShotCount"
                  isMasterLinked={false}
                  isOverridden={false}
                  canReset={false}
                  onReset={() => {}}
                >
                  <Input
                    type="number"
                    value={localForm.standardShotCount ?? ""}
                    onChange={(e) => updateField("standardShotCount", Number(e.target.value))}
                    disabled={!canEdit}
                    placeholder="예: 300"
                  />
                </FieldRow>

                {/* averageDurationMinutes */}
                <FieldRow
                  label="평균 시술 시간 (분)"
                  fieldName="averageDurationMinutes"
                  isMasterLinked={false}
                  isOverridden={false}
                  canReset={false}
                  onReset={() => {}}
                >
                  <Input
                    type="number"
                    value={localForm.averageDurationMinutes ?? ""}
                    onChange={(e) => updateField("averageDurationMinutes", Number(e.target.value))}
                    disabled={!canEdit}
                    placeholder="예: 60"
                  />
                </FieldRow>

                {/* painLevel */}
                <FieldRow
                  label="통증 수준"
                  fieldName="painLevel"
                  isMasterLinked={false}
                  isOverridden={false}
                  canReset={false}
                  onReset={() => {}}
                >
                  <Select
                    value={localForm.painLevel ?? "없음"}
                    onValueChange={(v) => updateField("painLevel", v as EquipmentProfile["painLevel"])}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["없음", "경미", "보통", "강함"] as const).map((pl) => (
                        <SelectItem key={pl} value={pl}>{pl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
              </div>

              {/* oneLinePitch */}
              <FieldRow
                label="한 줄 소개 *"
                fieldName="oneLinePitch"
                isMasterLinked={isMasterLinked}
                isOverridden={isOverridden("oneLinePitch")}
                canReset={canMaster}
                onReset={handleResetField}
              >
                <Input
                  value={localForm.oneLinePitch ?? ""}
                  onChange={(e) => updateField("oneLinePitch", e.target.value)}
                  disabled={!canEdit}
                  placeholder="예: 초음파 리프팅의 대명사"
                />
              </FieldRow>

              {/* shortDescription */}
              <FieldRow
                label="짧은 설명 *"
                fieldName="shortDescription"
                isMasterLinked={isMasterLinked}
                isOverridden={isOverridden("shortDescription")}
                canReset={canMaster}
                onReset={handleResetField}
              >
                <RichTextEditor
                  mode="floating"
                  value={localForm.shortDescription ?? ""}
                  onChange={(html) => updateField("shortDescription", html)}
                  disabled={!canEdit}
                  placeholder="짧은 설명 (100자 내외)"
                  minHeight={60}
                />
              </FieldRow>

              {/* longDescription */}
              <FieldRow
                label="상세 설명"
                fieldName="longDescription"
                isMasterLinked={isMasterLinked}
                isOverridden={isOverridden("longDescription")}
                canReset={canMaster}
                onReset={handleResetField}
              >
                <RichTextEditor
                  mode="floating"
                  value={localForm.longDescription ?? ""}
                  onChange={(html) => updateField("longDescription", html)}
                  disabled={!canEdit}
                  placeholder="장비 상세 설명"
                  minHeight={120}
                />
              </FieldRow>

              {/* anesthesiaRequired */}
              <div className="flex items-center gap-3">
                <Switch
                  id="anesthesia"
                  checked={localForm.anesthesiaRequired ?? false}
                  onCheckedChange={(v) => updateField("anesthesiaRequired", v)}
                  disabled={!canEdit}
                />
                <Label htmlFor="anesthesia">마취 필요</Label>
              </div>

              {/* downtimeNote */}
              <FieldRow
                label="다운타임 안내"
                fieldName="downtimeNote"
                isMasterLinked={false}
                isOverridden={false}
                canReset={false}
                onReset={() => {}}
              >
                <Input
                  value={localForm.downtimeNote ?? ""}
                  onChange={(e) => updateField("downtimeNote", e.target.value)}
                  disabled={!canEdit}
                  placeholder="예: 시술 후 약간의 발적 1~2일"
                />
              </FieldRow>

              {/* treatmentCycleGuide */}
              <FieldRow
                label="시술 주기 안내"
                fieldName="treatmentCycleGuide"
                isMasterLinked={false}
                isOverridden={false}
                canReset={false}
                onReset={() => {}}
              >
                <Input
                  value={localForm.treatmentCycleGuide ?? ""}
                  onChange={(e) => updateField("treatmentCycleGuide", e.target.value)}
                  disabled={!canEdit}
                  placeholder="예: 6개월~1년 간격 권장"
                />
              </FieldRow>

              {/* contraindications */}
              <FieldRow
                label="금기 사항"
                fieldName="contraindications"
                isMasterLinked={false}
                isOverridden={false}
                canReset={false}
                onReset={() => {}}
              >
                <RichTextEditor
                  mode="floating"
                  value={localForm.contraindications ?? ""}
                  onChange={(html) => updateField("contraindications", html)}
                  disabled={!canEdit}
                  placeholder="금기 사항을 입력하세요"
                  minHeight={60}
                />
              </FieldRow>

              {canEdit && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleSave} disabled={!isDirty} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    기본 정보 저장
                  </Button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ════════════════════════════════════════════
              Section B — 태그 & 키워드
          ════════════════════════════════════════════ */}
          <SectionCard id="section-tags" icon={Tag} title="태그 & 키워드">
            <div className="space-y-4">
              <TagInput
                label="효과 (benefits)"
                tags={localBenefits}
                onChange={(v) => { setLocalBenefits(v); setIsExtrasDirty(true) }}
                disabled={!canEdit}
              />
              <TagInput
                label="타겟 고객 (targets)"
                tags={localTargets}
                onChange={(v) => { setLocalTargets(v); setIsExtrasDirty(true) }}
                disabled={!canEdit}
              />
              <TagInput
                label="고민 부위 (concernAreas)"
                tags={localConcernAreas}
                onChange={(v) => { setLocalConcernAreas(v); setIsExtrasDirty(true) }}
                disabled={!canEdit}
              />
              <TagInput
                label="키워드 (keywords)"
                tags={localKeywords}
                onChange={(v) => { setLocalKeywords(v); setIsExtrasDirty(true) }}
                disabled={!canEdit}
              />
              <TagInput
                label="고객 검색어 (customerSearchTerms)"
                tags={localCustomerSearchTerms}
                onChange={(v) => { setLocalCustomerSearchTerms(v); setIsExtrasDirty(true) }}
                disabled={!canEdit}
              />
              <TagInput
                label="특장점 (specialtyPoints)"
                tags={localSpecialtyPoints}
                onChange={(v) => { setLocalSpecialtyPoints(v); setIsExtrasDirty(true) }}
                disabled={!canEdit}
              />
              <TagInput
                label="병행 시술 (companionTreatments)"
                tags={localCompanionTreatments}
                onChange={(v) => { setLocalCompanionTreatments(v); setIsExtrasDirty(true) }}
                disabled={!canEdit}
              />
              {canEdit && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveExtras}
                    disabled={!isExtrasDirty}
                    className="gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    태그 저장
                  </Button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ════════════════════════════════════════════
              Section C — 프로그램
          ════════════════════════════════════════════ */}
          <SectionCard id="section-programs" icon={Layers} title="프로그램">
            <div className="space-y-3">
              {equipmentData.programs.length === 0 && expandedProgramId !== "new" && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  등록된 프로그램이 없습니다.
                </p>
              )}

              {[...equipmentData.programs]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((prog, idx) => {
                  const isExpanded = expandedProgramId === prog.id
                  const draft = programDrafts[prog.id] ?? prog
                  const sortedAll = [...equipmentData.programs].sort((a, b) => a.sortOrder - b.sortOrder)

                  return (
                    <div key={prog.id} className="rounded-lg border border-border bg-background">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={!canEdit || idx === 0}
                            onClick={() => {
                              if (idx > 0) {
                                const prev = sortedAll[idx - 1]
                                updateProgram(equipmentId, prog.id, { sortOrder: prev.sortOrder })
                                updateProgram(equipmentId, prev.id, { sortOrder: prog.sortOrder })
                              }
                            }}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={!canEdit || idx === sortedAll.length - 1}
                            onClick={() => {
                              if (idx < sortedAll.length - 1) {
                                const next = sortedAll[idx + 1]
                                updateProgram(equipmentId, prog.id, { sortOrder: next.sortOrder })
                                updateProgram(equipmentId, next.id, { sortOrder: prog.sortOrder })
                              }
                            }}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{prog.programName}</p>
                          {prog.isFeatured && (
                            <Badge variant="outline" className="text-[10px] border-yellow-300 text-yellow-700 mt-0.5">
                              대표
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                if (isExpanded) {
                                  setExpandedProgramId(null)
                                } else {
                                  setProgramDrafts((d) => ({ ...d, [prog.id]: { ...prog } }))
                                  setExpandedProgramId(prog.id)
                                }
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteProgram(equipmentId, prog.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border px-3 py-3 space-y-3 bg-muted/20">
                          <div className="space-y-1">
                            <Label className="text-xs">프로그램명</Label>
                            <Input
                              value={draft.programName ?? ""}
                              onChange={(e) =>
                                setProgramDrafts((d) => ({
                                  ...d,
                                  [prog.id]: { ...d[prog.id], programName: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">설명</Label>
                            <RichTextEditor
                              mode="floating"
                              value={draft.description ?? ""}
                              onChange={(html) =>
                                setProgramDrafts((d) => ({
                                  ...d,
                                  [prog.id]: { ...d[prog.id], description: html },
                                }))
                              }
                              minHeight={60}
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              id={`prog-feat-${prog.id}`}
                              checked={draft.isFeatured ?? false}
                              onCheckedChange={(v) =>
                                setProgramDrafts((d) => ({
                                  ...d,
                                  [prog.id]: { ...d[prog.id], isFeatured: v },
                                }))
                              }
                            />
                            <Label htmlFor={`prog-feat-${prog.id}`} className="text-sm">대표 프로그램</Label>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => setExpandedProgramId(null)}>
                              취소
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                updateProgram(equipmentId, prog.id, draft)
                                setExpandedProgramId(null)
                              }}
                            >
                              저장
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

              {/* New program form */}
              {expandedProgramId === "new" && (
                <div className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-3 space-y-3">
                  <p className="text-xs font-semibold text-primary">새 프로그램</p>
                  <div className="space-y-1">
                    <Label className="text-xs">프로그램명</Label>
                    <Input
                      value={programDrafts["new"]?.programName ?? ""}
                      onChange={(e) =>
                        setProgramDrafts((d) => ({
                          ...d,
                          new: { ...d["new"], programName: e.target.value },
                        }))
                      }
                      placeholder="예: 기본 프로그램"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">설명</Label>
                    <RichTextEditor
                      mode="floating"
                      value={programDrafts["new"]?.description ?? ""}
                      onChange={(html) =>
                        setProgramDrafts((d) => ({
                          ...d,
                          new: { ...d["new"], description: html },
                        }))
                      }
                      minHeight={60}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="new-prog-feat"
                      checked={programDrafts["new"]?.isFeatured ?? false}
                      onCheckedChange={(v) =>
                        setProgramDrafts((d) => ({
                          ...d,
                          new: { ...d["new"], isFeatured: v },
                        }))
                      }
                    />
                    <Label htmlFor="new-prog-feat" className="text-sm">대표 프로그램</Label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setExpandedProgramId(null)
                        setProgramDrafts((d) => { const n = { ...d }; delete n["new"]; return n })
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const d = programDrafts["new"] ?? {}
                        if (!d.programName?.trim()) return
                        addProgram(equipmentId, {
                          branchId: selectedBranch,
                          programName: d.programName,
                          description: d.description,
                          isFeatured: d.isFeatured ?? false,
                          sortOrder: equipmentData.programs.length + 1,
                        })
                        setExpandedProgramId(null)
                        setProgramDrafts((prev) => { const n = { ...prev }; delete n["new"]; return n })
                      }}
                    >
                      추가
                    </Button>
                  </div>
                </div>
              )}

              {canEdit && expandedProgramId !== "new" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setProgramDrafts((d) => ({ ...d, new: {} }))
                    setExpandedProgramId("new")
                  }}
                  className="gap-1.5 w-full"
                >
                  <Plus className="h-3.5 w-3.5" />
                  프로그램 추가
                </Button>
              )}
            </div>
          </SectionCard>

          {/* ════════════════════════════════════════════
              Section D — 주의사항
          ════════════════════════════════════════════ */}
          <SectionCard id="section-precautions" icon={ShieldAlert} title="주의사항">
            <div className="space-y-3">
              {equipmentData.precautions.length === 0 && expandedPrecautionId !== "new" && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  등록된 주의사항이 없습니다.
                </p>
              )}

              {[...equipmentData.precautions]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((prec, idx) => {
                  const isExpanded = expandedPrecautionId === prec.id
                  const draft = precautionDrafts[prec.id] ?? prec

                  return (
                    <div key={prec.id} className="rounded-lg border border-border bg-background">
                      <div className="flex items-start gap-2 px-3 py-2">
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <button
                            type="button"
                            disabled={!canEdit || idx === 0}
                            onClick={() => movePrecaution(equipmentId, prec.id, "up")}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={!canEdit || idx === equipmentData.precautions.length - 1}
                            onClick={() => movePrecaution(equipmentId, prec.id, "down")}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="flex-1 text-sm py-0.5 whitespace-pre-wrap">{prec.content}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() =>
                              updatePrecaution(equipmentId, prec.id, { isPublic: !prec.isPublic })
                            }
                            className={cn(
                              "p-1 rounded transition-colors",
                              prec.isPublic
                                ? "text-green-600 hover:text-green-700"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            title={prec.isPublic ? "공개" : "비공개"}
                          >
                            {prec.isPublic ? (
                              <Eye className="h-3.5 w-3.5" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {canEdit && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                if (isExpanded) {
                                  setExpandedPrecautionId(null)
                                } else {
                                  setPrecautionDrafts((d) => ({ ...d, [prec.id]: { ...prec } }))
                                  setExpandedPrecautionId(prec.id)
                                }
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deletePrecaution(equipmentId, prec.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border px-3 py-3 space-y-3 bg-muted/20">
                          <div className="space-y-1">
                            <Label className="text-xs">내용</Label>
                            <RichTextEditor
                              mode="floating"
                              value={draft.content ?? ""}
                              onChange={(html) =>
                                setPrecautionDrafts((d) => ({
                                  ...d,
                                  [prec.id]: { ...d[prec.id], content: html },
                                }))
                              }
                              minHeight={80}
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              id={`prec-pub-${prec.id}`}
                              checked={draft.isPublic ?? true}
                              onCheckedChange={(v) =>
                                setPrecautionDrafts((d) => ({
                                  ...d,
                                  [prec.id]: { ...d[prec.id], isPublic: v },
                                }))
                              }
                            />
                            <Label htmlFor={`prec-pub-${prec.id}`} className="text-sm">공개</Label>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedPrecautionId(null)}
                            >
                              취소
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                updatePrecaution(equipmentId, prec.id, draft)
                                setExpandedPrecautionId(null)
                              }}
                            >
                              저장
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

              {/* New precaution form */}
              {expandedPrecautionId === "new" && (
                <div className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-3 space-y-3">
                  <p className="text-xs font-semibold text-primary">새 주의사항</p>
                  <div className="space-y-1">
                    <Label className="text-xs">내용</Label>
                    <RichTextEditor
                      mode="floating"
                      value={precautionDrafts["new"]?.content ?? ""}
                      onChange={(html) =>
                        setPrecautionDrafts((d) => ({
                          ...d,
                          new: { ...d["new"], content: html },
                        }))
                      }
                      placeholder="주의사항 내용"
                      minHeight={80}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="new-prec-pub"
                      checked={precautionDrafts["new"]?.isPublic ?? true}
                      onCheckedChange={(v) =>
                        setPrecautionDrafts((d) => ({
                          ...d,
                          new: { ...d["new"], isPublic: v },
                        }))
                      }
                    />
                    <Label htmlFor="new-prec-pub" className="text-sm">공개</Label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setExpandedPrecautionId(null)
                        setPrecautionDrafts((d) => { const n = { ...d }; delete n["new"]; return n })
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const d = precautionDrafts["new"] ?? {}
                        if (!d.content?.trim()) return
                        addPrecaution(equipmentId, {
                          content: d.content,
                          isPublic: d.isPublic ?? true,
                          sortOrder: equipmentData.precautions.length + 1,
                        })
                        setExpandedPrecautionId(null)
                        setPrecautionDrafts((prev) => { const n = { ...prev }; delete n["new"]; return n })
                      }}
                    >
                      추가
                    </Button>
                  </div>
                </div>
              )}

              {canEdit && expandedPrecautionId !== "new" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPrecautionDrafts((d) => ({ ...d, new: { isPublic: true } }))
                    setExpandedPrecautionId("new")
                  }}
                  className="gap-1.5 w-full"
                >
                  <Plus className="h-3.5 w-3.5" />
                  주의사항 추가
                </Button>
              )}
            </div>
          </SectionCard>

          {/* ════════════════════════════════════════════
              Section E — 표시 설정
          ════════════════════════════════════════════ */}
          <SectionCard id="section-display" icon={Settings2} title="표시 설정">
            <div className="space-y-5">
              {/* Switches grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {(
                  [
                    ["isFeatured", "대표 장비"],
                    ["isPublic", "공개"],
                    ["isTreatmentLike", "시술형 표시"],
                    ["pinToTop", "상단 고정"],
                    ["chatbotPriority", "챗봇 우선"],
                    ["needsReview", "검토 필요"],
                    ["branchOwned", "지점 소유"],
                    ["branchAvailable", "지점 운영"],
                    ["operationSuspended", "운영 중단"],
                  ] as [keyof EquipmentProfile, string][]
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3">
                    <Switch
                      id={`switch-${key}`}
                      checked={(localForm[key] as boolean) ?? false}
                      onCheckedChange={(v) => updateField(key, v as never)}
                      disabled={!canEdit}
                    />
                    <Label htmlFor={`switch-${key}`} className="text-sm">{label}</Label>
                  </div>
                ))}
              </div>

              {/* suspensionReason */}
              {localForm.operationSuspended && (
                <div className="space-y-1">
                  <Label className="text-sm">운영 중단 사유</Label>
                  <RichTextEditor
                    mode="floating"
                    value={localForm.suspensionReason ?? ""}
                    onChange={(html) => updateField("suspensionReason", html)}
                    disabled={!canEdit}
                    placeholder="운영 중단 사유를 입력하세요"
                    minHeight={60}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* status */}
                <div className="space-y-1">
                  <Label className="text-sm">상태</Label>
                  <Select
                    value={localForm.status ?? "draft"}
                    onValueChange={(v) => updateField("status", v as EquipmentProfile["status"])}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">초안</SelectItem>
                      <SelectItem value="published">공개</SelectItem>
                      <SelectItem value="hidden">숨김</SelectItem>
                      <SelectItem value="archived">보관</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* displayOrder */}
                <div className="space-y-1">
                  <Label className="text-sm">표시 순서</Label>
                  <Input
                    type="number"
                    value={localForm.displayOrder ?? 0}
                    onChange={(e) => updateField("displayOrder", Number(e.target.value))}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              {/* Memos */}
              <div className="grid grid-cols-1 gap-4">
                {(
                  [
                    ["internalMemo", "내부 메모"],
                    ["consultReference", "상담 참고"],
                    ["chatbotExcludeNote", "챗봇 제외 노트"],
                    ["privateNote", "비공개 메모"],
                  ] as [keyof EquipmentProfile, string][]
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-sm">{label}</Label>
                    <RichTextEditor
                      mode="floating"
                      value={(localForm[key] as string) ?? ""}
                      onChange={(html) => updateField(key, html as never)}
                      disabled={!canEdit}
                      placeholder={label}
                      minHeight={60}
                    />
                  </div>
                ))}
              </div>

              {/* Copy fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(
                  [
                    ["homepageQuote", "홈페이지 인용구"],
                    ["highlightCopy", "하이라이트 카피"],
                    ["ctaExample", "CTA 예시"],
                  ] as [keyof EquipmentProfile, string][]
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-sm">{label}</Label>
                    <Input
                      value={(localForm[key] as string) ?? ""}
                      onChange={(e) => updateField(key, e.target.value as never)}
                      disabled={!canEdit}
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>

              {canEdit && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleSave} disabled={!isDirty} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    표시 설정 저장
                  </Button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ════════════════════════════════════════════
              Section F — 자산 라이브러리
          ════════════════════════════════════════════ */}
          <SectionCard id="section-assets" icon={ImageIcon} title="자산 라이브러리">
            <Tabs value={assetTab} onValueChange={(v) => setAssetTab(v as "hq" | "branch")}>
              <TabsList className="mb-4">
                <TabsTrigger value="hq">본사 공통 자산 ({hqAssets.length})</TabsTrigger>
                <TabsTrigger value="branch">지점 전용 자산 ({branchAssets.length})</TabsTrigger>
              </TabsList>

              {/* HQ Assets */}
              <TabsContent value="hq">
                {hqAssets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    본사 공통 자산이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Image grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {hqAssets
                        .filter((a) => a.fileType === "image")
                        .map((asset) => {
                          const isHidden = hiddenIds.includes(asset.id)
                          return (
                            <div
                              key={asset.id}
                              className={cn(
                                "relative rounded-lg border border-border overflow-hidden group",
                                isHidden && "opacity-40"
                              )}
                            >
                              <img
                                src={asset.fileUrl}
                                alt={asset.title ?? asset.fileName}
                                className="w-full h-28 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              <div className="absolute top-1.5 left-1.5 flex gap-1">
                                <Badge className="text-[9px] py-0 px-1.5 bg-black/60 text-white border-0">
                                  {asset.assetType}
                                </Badge>
                                {isHidden && (
                                  <Badge className="text-[9px] py-0 px-1.5 bg-red-600 text-white border-0">
                                    숨김
                                  </Badge>
                                )}
                              </div>
                              {canEdit && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => toggleMasterAssetVisibility(equipmentId, asset.id)}
                                    className="absolute top-1.5 right-1.5 rounded bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    title={isHidden ? "표시" : "숨기기"}
                                  >
                                    {isHidden ? (
                                      <Eye className="h-3.5 w-3.5" />
                                    ) : (
                                      <EyeOff className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingStyleAsset(asset)}
                                    className="absolute bottom-8 left-0 right-0 bg-black/60 text-white text-[10px] py-0.5 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Wand2 className="h-2.5 w-2.5" />스타일 편집
                                    {getVariants(asset.id).length > 0 && (
                                      <span className="bg-primary rounded px-1 text-[9px]">{getVariants(asset.id).length}</span>
                                    )}
                                  </button>
                                </>
                              )}
                              <div className="px-2 py-1.5">
                                <p className="text-xs truncate">{asset.title ?? asset.fileName}</p>
                              </div>
                            </div>
                          )
                        })}
                    </div>

                    {/* PDF / Video list */}
                    {hqAssets
                      .filter((a) => a.fileType !== "image")
                      .map((asset) => {
                        const isHidden = hiddenIds.includes(asset.id)
                        const FileIcon = asset.fileType === "pdf" ? FileText : Video
                        return (
                          <div
                            key={asset.id}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border border-border p-2.5",
                              isHidden && "opacity-40"
                            )}
                          >
                            <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{asset.title ?? asset.fileName}</p>
                              <p className="text-xs text-muted-foreground">{asset.assetType}</p>
                            </div>
                            {isHidden && (
                              <Badge variant="outline" className="text-[10px] border-red-300 text-red-700">
                                숨김
                              </Badge>
                            )}
                            {canEdit && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 shrink-0"
                                onClick={() => toggleMasterAssetVisibility(equipmentId, asset.id)}
                                title={isHidden ? "표시" : "숨기기"}
                              >
                                {isHidden ? (
                                  <Eye className="h-3.5 w-3.5" />
                                ) : (
                                  <EyeOff className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </TabsContent>

              {/* Branch Assets */}
              <TabsContent value="branch">
                {/* Upload controls */}
                {canUpload && (
                  <div className="mb-4 flex items-center gap-3 flex-wrap">
                    <Select
                      value={selectedAssetType}
                      onValueChange={(v) => setSelectedAssetType(v as AssetType)}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      파일 업로드
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf,video/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      이미지 ≤20MB · PDF ≤50MB · 동영상 ≤300MB
                    </p>
                  </div>
                )}

                {branchAssets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    지점 전용 자산이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Image grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {branchAssets
                        .filter((a) => a.fileType === "image")
                        .map((asset) => {
                          const isEditing = assetEditId === asset.id
                          const draft = assetDrafts[asset.id] ?? asset

                          return (
                            <div key={asset.id} className="rounded-lg border border-border overflow-hidden">
                              <div className="relative group">
                                <img
                                  src={asset.fileUrl}
                                  alt={asset.title ?? asset.fileName}
                                  className="w-full h-28 object-cover"
                                />
                                <div className="absolute top-1.5 left-1.5">
                                  <Badge className="text-[9px] py-0 px-1.5 bg-black/60 text-white border-0">
                                    {asset.assetType}
                                  </Badge>
                                </div>
                                {canEdit && (
                                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isEditing) {
                                          setAssetEditId(null)
                                        } else {
                                          setAssetDrafts((d) => ({ ...d, [asset.id]: { ...asset } }))
                                          setAssetEditId(asset.id)
                                        }
                                      }}
                                      className="rounded bg-black/60 p-1 text-white"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteAsset(equipmentId, asset.id)}
                                      className="rounded bg-red-600/80 p-1 text-white"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {isEditing ? (
                                <div className="p-2 space-y-2 bg-muted/20 border-t border-border">
                                  <Select
                                    value={draft.assetType ?? asset.assetType}
                                    onValueChange={(v) =>
                                      setAssetDrafts((d) => ({
                                        ...d,
                                        [asset.id]: { ...d[asset.id], assetType: v as AssetType },
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ASSET_TYPES.map((t) => (
                                        <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="제목"
                                    value={draft.title ?? ""}
                                    onChange={(e) =>
                                      setAssetDrafts((d) => ({
                                        ...d,
                                        [asset.id]: { ...d[asset.id], title: e.target.value },
                                      }))
                                    }
                                    className="h-7 text-xs"
                                  />
                                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                                    {(
                                      [
                                        ["useForHomepage", "홈"],
                                        ["useForLanding", "랜딩"],
                                        ["useForChatbot", "챗봇"],
                                        ["isFeatured", "대표"],
                                        ["isPublic", "공개"],
                                      ] as [keyof EquipmentAsset, string][]
                                    ).map(([key, label]) => (
                                      <label
                                        key={key}
                                        className="flex items-center gap-1 text-xs cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={(draft[key] as boolean) ?? false}
                                          onChange={(e) =>
                                            setAssetDrafts((d) => ({
                                              ...d,
                                              [asset.id]: {
                                                ...d[asset.id],
                                                [key]: e.target.checked,
                                              },
                                            }))
                                          }
                                          className="h-3 w-3"
                                        />
                                        {label}
                                      </label>
                                    ))}
                                  </div>
                                  <div className="flex gap-1.5 justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-xs px-2"
                                      onClick={() => setAssetEditId(null)}
                                    >
                                      취소
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-6 text-xs px-2"
                                      onClick={() => {
                                        updateAsset(equipmentId, asset.id, draft)
                                        setAssetEditId(null)
                                      }}
                                    >
                                      저장
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="px-2 py-1.5">
                                  <p className="text-xs truncate">{asset.title ?? asset.fileName}</p>
                                  <div className="flex gap-1 flex-wrap mt-0.5">
                                    {asset.isFeatured && (
                                      <span className="text-[9px] text-yellow-700 bg-yellow-50 rounded px-1">
                                        대표
                                      </span>
                                    )}
                                    {asset.isPublic && (
                                      <span className="text-[9px] text-green-700 bg-green-50 rounded px-1">
                                        공개
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>

                    {/* PDF / Video list */}
                    {branchAssets
                      .filter((a) => a.fileType !== "image")
                      .map((asset) => {
                        const isEditing = assetEditId === asset.id
                        const draft = assetDrafts[asset.id] ?? asset
                        const FileIcon = asset.fileType === "pdf" ? FileText : Video

                        return (
                          <div key={asset.id} className="rounded-lg border border-border bg-background">
                            <div className="flex items-center gap-3 p-2.5">
                              <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{asset.title ?? asset.fileName}</p>
                                <p className="text-xs text-muted-foreground">{asset.assetType}</p>
                              </div>
                              {canEdit && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      if (isEditing) {
                                        setAssetEditId(null)
                                      } else {
                                        setAssetDrafts((d) => ({ ...d, [asset.id]: { ...asset } }))
                                        setAssetEditId(asset.id)
                                      }
                                    }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => deleteAsset(equipmentId, asset.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            {isEditing && (
                              <div className="border-t border-border px-3 py-2.5 space-y-2 bg-muted/20">
                                <Select
                                  value={draft.assetType ?? asset.assetType}
                                  onValueChange={(v) =>
                                    setAssetDrafts((d) => ({
                                      ...d,
                                      [asset.id]: { ...d[asset.id], assetType: v as AssetType },
                                    }))
                                  }
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ASSET_TYPES.map((t) => (
                                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  placeholder="제목"
                                  value={draft.title ?? ""}
                                  onChange={(e) =>
                                    setAssetDrafts((d) => ({
                                      ...d,
                                      [asset.id]: { ...d[asset.id], title: e.target.value },
                                    }))
                                  }
                                  className="h-7 text-xs"
                                />
                                <div className="flex flex-wrap gap-x-3 gap-y-1">
                                  {(
                                    [
                                      ["useForHomepage", "홈"],
                                      ["useForLanding", "랜딩"],
                                      ["useForChatbot", "챗봇"],
                                      ["isFeatured", "대표"],
                                      ["isPublic", "공개"],
                                    ] as [keyof EquipmentAsset, string][]
                                  ).map(([key, label]) => (
                                    <label
                                      key={key}
                                      className="flex items-center gap-1 text-xs cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={(draft[key] as boolean) ?? false}
                                        onChange={(e) =>
                                          setAssetDrafts((d) => ({
                                            ...d,
                                            [asset.id]: {
                                              ...d[asset.id],
                                              [key]: e.target.checked,
                                            },
                                          }))
                                        }
                                        className="h-3 w-3"
                                      />
                                      {label}
                                    </label>
                                  ))}
                                </div>
                                <div className="flex gap-1.5 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-xs px-2"
                                    onClick={() => setAssetEditId(null)}
                                  >
                                    취소
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={() => {
                                      updateAsset(equipmentId, asset.id, draft)
                                      setAssetEditId(null)
                                    }}
                                  >
                                    저장
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </SectionCard>

          {/* ════════════════════════════════════════════
              Section G — 콘텐츠 관계
          ════════════════════════════════════════════ */}
          <SectionCard id="section-relations" icon={Link2} title="콘텐츠 관계">
            <div className="space-y-3">
              {relations.length === 0 && !showAddRelation && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  등록된 콘텐츠 관계가 없습니다.
                </p>
              )}

              {relations.map((rel, idx) => (
                <div key={rel.id} className="flex items-start gap-2 rounded-lg border border-border p-2.5">
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <button
                      type="button"
                      disabled={!canEdit || idx === 0}
                      onClick={() => moveRelation(rel.id, "up")}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit || idx === relations.length - 1}
                      onClick={() => moveRelation(rel.id, "down")}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {CONTENT_NODE_TYPE_LABELS[rel.targetType]}
                      </Badge>
                      <span className="text-sm font-mono text-muted-foreground truncate max-w-[150px]">
                        {rel.targetId}
                      </span>
                      {canEdit ? (
                        <Select
                          value={rel.relationType}
                          onValueChange={(v) =>
                            updateRelation(rel.id, { relationType: v as RelationType })
                          }
                        >
                          <SelectTrigger className="h-6 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(RELATION_TYPE_LABELS) as [RelationType, string][]).map(
                              ([k, v]) => (
                                <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          {RELATION_TYPE_LABELS[rel.relationType]}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {(
                        [
                          ["homepage", "홈페이지"],
                          ["landing", "랜딩"],
                          ["chatbot", "챗봇"],
                          ["internalOnly", "내부전용"],
                        ] as [keyof typeof rel.use, string][]
                      ).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rel.use[key]}
                            disabled={!canEdit}
                            onChange={(e) =>
                              updateRelation(rel.id, {
                                use: { ...rel.use, [key]: e.target.checked },
                              })
                            }
                            className="h-3 w-3"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    {canEdit && (
                      <Input
                        placeholder="메모"
                        value={rel.note ?? ""}
                        onChange={(e) => updateRelation(rel.id, { note: e.target.value })}
                        className="h-7 text-xs"
                      />
                    )}
                    {!canEdit && rel.note && (
                      <p className="text-xs text-muted-foreground">{rel.note}</p>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => removeRelation(rel.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Add relation form */}
              {showAddRelation && (
                <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-3">
                  <p className="text-xs font-semibold text-primary">관계 추가</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">대상 타입</Label>
                      <Select
                        value={newRelation.targetType}
                        onValueChange={(v) =>
                          setNewRelation((r) => ({ ...r, targetType: v as ContentNodeType }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.entries(CONTENT_NODE_TYPE_LABELS) as [ContentNodeType, string][]
                          ).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">대상 ID</Label>
                      <Input
                        value={newRelation.targetId}
                        onChange={(e) =>
                          setNewRelation((r) => ({ ...r, targetId: e.target.value }))
                        }
                        placeholder="예: t1"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">관계 타입</Label>
                      <Select
                        value={newRelation.relationType}
                        onValueChange={(v) =>
                          setNewRelation((r) => ({ ...r, relationType: v as RelationType }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.entries(RELATION_TYPE_LABELS) as [RelationType, string][]
                          ).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">메모</Label>
                      <Input
                        value={newRelation.note}
                        onChange={(e) =>
                          setNewRelation((r) => ({ ...r, note: e.target.value }))
                        }
                        placeholder="메모 (선택)"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {(
                      [
                        ["homepage", "홈페이지"],
                        ["landing", "랜딩"],
                        ["chatbot", "챗봇"],
                        ["internalOnly", "내부전용"],
                      ] as [keyof typeof newRelation.use, string][]
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRelation.use[key]}
                          onChange={(e) =>
                            setNewRelation((r) => ({
                              ...r,
                              use: { ...r.use, [key]: e.target.checked },
                            }))
                          }
                          className="h-3 w-3"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setShowAddRelation(false)}>
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!newRelation.targetId.trim()) return
                        addRelation({
                          sourceType: "equipment",
                          sourceId: equipmentId,
                          targetType: newRelation.targetType,
                          targetId: newRelation.targetId.trim(),
                          relationType: newRelation.relationType,
                          use: newRelation.use,
                          note: newRelation.note || undefined,
                          sortOrder: relations.length + 1,
                          branchId: selectedBranch,
                        })
                        setShowAddRelation(false)
                        setNewRelation({
                          targetType: "treatment",
                          targetId: "",
                          relationType: "related",
                          use: { homepage: false, landing: false, chatbot: false, internalOnly: false },
                          note: "",
                        })
                      }}
                    >
                      추가
                    </Button>
                  </div>
                </div>
              )}

              {canEdit && !showAddRelation && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddRelation(true)}
                  className="gap-1.5 w-full"
                >
                  <Plus className="h-3.5 w-3.5" />
                  관계 추가
                </Button>
              )}
            </div>
          </SectionCard>

          {/* ════════════════════════════════════════════
              Section H — URL / 배포 설정
          ════════════════════════════════════════════ */}
          <SectionCard id="section-urls" icon={Globe} title="URL / 배포 설정">
            <div className="space-y-4">
              {/* Domain info */}
              {primaryDomain ? (
                <div className="rounded-lg bg-muted/40 border border-border p-3 text-xs space-y-1">
                  <p className="font-semibold text-foreground">{primaryDomain.domain}</p>
                  <p className="text-muted-foreground">
                    홈페이지 기본 경로:{" "}
                    <code className="bg-muted px-1 rounded">{primaryDomain.homepageBasePath}</code>
                  </p>
                  <p className="text-muted-foreground">
                    랜딩 기본 경로:{" "}
                    <code className="bg-muted px-1 rounded">{primaryDomain.landingBasePath}</code>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  이 지점에 등록된 도메인이 없습니다.
                </p>
              )}

              {/* URL list */}
              {equipmentUrls.length === 0 && !showAddUrl && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  등록된 URL이 없습니다.
                </p>
              )}

              {equipmentUrls.map((urlEntry) => {
                const basePath =
                  urlEntry.pageType === "landing"
                    ? primaryDomain?.landingBasePath ?? ""
                    : primaryDomain?.homepageBasePath ?? ""
                const slugValue = urlSlugs[urlEntry.id] ?? urlEntry.slug
                const fullUrlPreview = primaryDomain
                  ? computeFullUrl(selectedBranch, basePath, slugValue)
                  : ""
                const hasSlugError = urlSlugErrors[urlEntry.id] ?? false

                return (
                  <div
                    key={urlEntry.id}
                    className="rounded-lg border border-border bg-background space-y-2 p-3"
                  >
                    <div className="flex items-center gap-2 justify-between">
                      <Badge variant="outline" className="text-[10px]">
                        {PAGE_TYPE_LABELS[urlEntry.pageType]}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`url-active-${urlEntry.id}`}
                          checked={urlEntry.isActive}
                          onCheckedChange={(v) => updateUrl(urlEntry.id, { isActive: v })}
                          disabled={!canEdit}
                        />
                        <Label htmlFor={`url-active-${urlEntry.id}`} className="text-xs">
                          활성
                        </Label>
                        {canEdit && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteUrl(urlEntry.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Slug */}
                    <div className="space-y-1">
                      <Label className="text-xs">슬러그</Label>
                      <Input
                        value={slugValue}
                        onChange={(e) => {
                          const v = e.target.value
                          setUrlSlugs((prev) => ({ ...prev, [urlEntry.id]: v }))
                          const unique = isSlugUnique(
                            selectedBranch,
                            urlEntry.pageType,
                            v,
                            urlEntry.id
                          )
                          setUrlSlugErrors((prev) => ({ ...prev, [urlEntry.id]: !unique }))
                          if (unique) updateUrl(urlEntry.id, { slug: v })
                        }}
                        disabled={!canEdit}
                        className={cn(
                          "h-8 text-xs font-mono",
                          hasSlugError && "border-red-500 focus-visible:ring-red-500"
                        )}
                        placeholder="예: ulthera"
                      />
                      {hasSlugError && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          이미 사용 중인 슬러그입니다.
                        </p>
                      )}
                    </div>

                    {/* SEO Title */}
                    <div className="space-y-1">
                      <Label className="text-xs">SEO 타이틀</Label>
                      <Input
                        value={urlEntry.seoTitle ?? ""}
                        onChange={(e) => updateUrl(urlEntry.id, { seoTitle: e.target.value })}
                        disabled={!canEdit}
                        className="h-8 text-xs"
                        placeholder="SEO 타이틀"
                      />
                    </div>

                    {/* SEO Description */}
                    <div className="space-y-1">
                      <Label className="text-xs">SEO 설명</Label>
                      <RichTextEditor
                        mode="floating"
                        value={urlEntry.seoDescription ?? ""}
                        onChange={(html) => updateUrl(urlEntry.id, { seoDescription: html })}
                        disabled={!canEdit}
                        placeholder="SEO 설명"
                        minHeight={60}
                      />
                    </div>

                    {/* Full URL preview */}
                    {fullUrlPreview && (
                      <div className="rounded bg-muted/40 px-2 py-1.5 text-[10px] font-mono text-muted-foreground break-all">
                        {fullUrlPreview}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add URL form */}
              {showAddUrl && (
                <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-3">
                  <p className="text-xs font-semibold text-primary">URL 추가</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">페이지 타입</Label>
                      <Select
                        value={newUrl.pageType}
                        onValueChange={(v) =>
                          setNewUrl((u) => ({ ...u, pageType: v as PageType }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(PAGE_TYPE_LABELS) as [PageType, string][]).map(
                            ([k, v]) => (
                              <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">슬러그</Label>
                      <Input
                        value={newUrl.slug}
                        onChange={(e) => setNewUrl((u) => ({ ...u, slug: e.target.value }))}
                        placeholder="예: ulthera"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">SEO 타이틀</Label>
                      <Input
                        value={newUrl.seoTitle}
                        onChange={(e) => setNewUrl((u) => ({ ...u, seoTitle: e.target.value }))}
                        placeholder="SEO 타이틀 (선택)"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setShowAddUrl(false)}>
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!newUrl.slug.trim()) return
                        addUrl({
                          branchEquipmentId: equipmentId,
                          branchId: selectedBranch,
                          pageType: newUrl.pageType,
                          slug: newUrl.slug.trim(),
                          isActive: true,
                          seoTitle: newUrl.seoTitle || undefined,
                        })
                        setShowAddUrl(false)
                        setNewUrl({ pageType: "detail", slug: "", seoTitle: "" })
                      }}
                    >
                      추가
                    </Button>
                  </div>
                </div>
              )}

              {canEdit && !showAddUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddUrl(true)}
                  className="gap-1.5 w-full"
                >
                  <Plus className="h-3.5 w-3.5" />
                  URL 추가
                </Button>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMN — Sticky Preview ── */}
        <div className="xl:sticky xl:top-20 space-y-4">
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                미리보기
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="homepage">
                <TabsList className="w-full mb-4 text-xs">
                  <TabsTrigger value="homepage" className="flex-1 text-xs">
                    홈페이지 카드
                  </TabsTrigger>
                  <TabsTrigger value="chatbot" className="flex-1 text-xs">
                    챗봇 요약
                  </TabsTrigger>
                  <TabsTrigger value="missing" className="flex-1 text-xs">
                    누락 항목
                  </TabsTrigger>
                </TabsList>

                {/* 홈페이지 카드 */}
                <TabsContent value="homepage">
                  <div className="rounded-xl border border-border overflow-hidden bg-background shadow-sm">
                    {featuredAsset ? (
                      <img
                        src={featuredAsset.fileUrl}
                        alt={localForm.name ?? ""}
                        className="w-full h-36 object-cover"
                      />
                    ) : (
                      <div className="w-full h-36 bg-muted flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm leading-tight truncate">
                            {localForm.name || "장비명 없음"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {localForm.category || "카테고리 없음"}
                            {localForm.manufacturer && ` · ${localForm.manufacturer}`}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                          {localForm.isFeatured && (
                            <Badge className="text-[9px] py-0 px-1.5 bg-yellow-500 text-white border-0">
                              <Star className="mr-0.5 h-2.5 w-2.5" />
                              대표
                            </Badge>
                          )}
                          {localForm.isPublic ? (
                            <Badge className="text-[9px] py-0 px-1.5 bg-green-600 text-white border-0">
                              공개
                            </Badge>
                          ) : (
                            <Badge className="text-[9px] py-0 px-1.5 bg-gray-400 text-white border-0">
                              비공개
                            </Badge>
                          )}
                        </div>
                      </div>
                      {localForm.oneLinePitch && (
                        <p className="text-xs text-muted-foreground leading-snug">
                          {localForm.oneLinePitch}
                        </p>
                      )}
                      {localBenefits.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {localBenefits.slice(0, 4).map((b, i) => (
                            <span
                              key={i}
                              className="text-[9px] bg-primary/10 text-primary rounded-full px-2 py-0.5"
                            >
                              {b}
                            </span>
                          ))}
                          {localBenefits.length > 4 && (
                            <span className="text-[9px] text-muted-foreground">
                              +{localBenefits.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* 챗봇 요약 */}
                <TabsContent value="chatbot">
                  <div className="rounded-xl border border-border bg-background p-3 space-y-2.5 text-xs">
                    <div>
                      <p className="font-semibold text-sm">{localForm.name || "장비명 없음"}</p>
                      {localForm.shortDescription && (
                        <p className="text-muted-foreground mt-1 leading-snug">
                          {localForm.shortDescription.slice(0, 100)}
                          {localForm.shortDescription.length > 100 && "..."}
                        </p>
                      )}
                    </div>
                    {localKeywords.length > 0 && (
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">키워드</p>
                        <p className="text-muted-foreground">
                          {localKeywords.slice(0, 6).join(", ")}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
                        <p className="text-lg font-bold text-primary">
                          {equipmentData.programs.length}
                        </p>
                        <p className="text-[10px] text-muted-foreground">프로그램</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
                        <p className="text-lg font-bold text-primary">{effectiveAssets.length}</p>
                        <p className="text-[10px] text-muted-foreground">자산</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 누락 항목 */}
                <TabsContent value="missing">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">완성도</span>
                        <span className="font-bold text-primary">{completenessScore}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            completenessScore >= 80
                              ? "bg-green-500"
                              : completenessScore >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          )}
                          style={{ width: `${completenessScore}%` }}
                        />
                      </div>
                    </div>

                    {completenessItems.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5">
                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                        <p className="text-xs text-green-700 font-medium">
                          모든 항목이 완성되었습니다!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {completenessItems.map((item, i) => {
                          const isRequired = item.includes("필수")
                          return (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <div
                                className={cn(
                                  "h-2 w-2 rounded-full shrink-0",
                                  isRequired ? "bg-red-500" : "bg-yellow-400"
                                )}
                              />
                              <span className={isRequired ? "text-red-700" : "text-yellow-700"}>
                                {item}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Image Style Editor ── */}
      {editingStyleAsset && (
        <ImageEffectEditor
          imageUrl={editingStyleAsset.fileUrl}
          assetId={editingStyleAsset.id}
          assetTitle={editingStyleAsset.title ?? editingStyleAsset.fileName}
          onClose={() => setEditingStyleAsset(null)}
          onSaved={() => setEditingStyleAsset(null)}
        />
      )}
    </div>
  )
}
