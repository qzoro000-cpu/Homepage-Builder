"use client"

import { useState, useEffect, useMemo, useRef, KeyboardEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  User,
  Sparkles,
  Briefcase,
  GraduationCap,
  BookOpen,
  Award,
  Link2,
  Settings2,
  ArrowLeft,
  Star,
  Check,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Upload,
  Users,
  Save,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useStaff,
  StaffProfile,
  StaffStatus,
  CareerType,
  AcademicType,
  PublicationType,
  CredentialType,
  DoctorCareer,
  DoctorAcademic,
  DoctorPublication,
  DoctorCredential,
} from "@/lib/staff-store"
import { useBranch } from "../../../layout"
import { cn } from "@/lib/utils"
import { treatments, equipment, faqs, branches } from "@/lib/mock-data"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    const h = d.getHours().toString().padStart(2, "0")
    const m = d.getMinutes().toString().padStart(2, "0")
    return `${h}:${m}`
  } catch {
    return "--:--"
  }
}

function formatYear(
  startYear?: number,
  endYear?: number,
  isCurrent?: boolean
): string {
  if (!startYear) return ""
  const end = isCurrent ? "현재" : endYear ? String(endYear) : ""
  return end ? `${startYear} ~ ${end}` : String(startYear)
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
  badge?: string
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
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
              {badge && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
                  {badge}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// TagInput
// ---------------------------------------------------------------------------

function TagInput({
  value,
  onChange,
  placeholder,
  presets,
  maxTags = 6,
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  presets?: string[]
  maxTags?: number
}) {
  const [inputVal, setInputVal] = useState("")

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || value.includes(trimmed) || value.length >= maxTags) return
    onChange([...value, trimmed])
    setInputVal("")
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputVal)
    } else if (e.key === "Backspace" && !inputVal && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-background p-2 min-h-[42px]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {value.length < maxTags && (
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => addTag(inputVal)}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        )}
      </div>
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {presets
            .filter((p) => !value.includes(p))
            .map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => addTag(preset)}
                className="rounded-lg border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
              >
                + {preset}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CharCountInput / CharCountTextarea
// ---------------------------------------------------------------------------

function CharCountInput({
  value,
  onChange,
  max,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  max: number
  placeholder?: string
  className?: string
}) {
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={max}
        className={cn("rounded-xl pr-16", className)}
      />
      <span
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums",
          value.length > max * 0.9 ? "text-amber-500" : "text-muted-foreground"
        )}
      >
        {value.length}/{max}
      </span>
    </div>
  )
}

function CharCountTextarea({
  value,
  onChange,
  max,
  placeholder,
  minHeight,
  helper,
}: {
  value: string
  onChange: (v: string) => void
  max: number
  placeholder?: string
  minHeight?: string
  helper?: string
}) {
  return (
    <div className="space-y-1">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={max}
          className={cn("rounded-xl resize-none pr-16", minHeight)}
        />
        <span
          className={cn(
            "absolute right-3 bottom-3 text-xs tabular-nums",
            value.length > max * 0.9 ? "text-amber-500" : "text-muted-foreground"
          )}
        >
          {value.length}/{max}
        </span>
      </div>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// MultiSelectChips
// ---------------------------------------------------------------------------

function MultiSelectChips({
  options,
  selected,
  onToggle,
  maxVisible = 20,
}: {
  options: { id: string; label: string }[]
  selected: string[]
  onToggle: (id: string) => void
  maxVisible?: number
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.slice(0, maxVisible).map((opt) => {
        const isSelected = selected.includes(opt.id)
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={cn(
              "rounded-xl border px-2.5 py-1 text-xs transition-colors",
              isSelected
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Type badge color map
// ---------------------------------------------------------------------------

const careerTypeBg: Record<CareerType, string> = {
  경력: "bg-blue-50 text-blue-700 border-blue-200",
  학력: "bg-green-50 text-green-700 border-green-200",
  수련: "bg-violet-50 text-violet-700 border-violet-200",
  근무이력: "bg-amber-50 text-amber-700 border-amber-200",
  이력: "bg-gray-50 text-gray-600 border-gray-200",
}

const academicTypeBg: Record<AcademicType, string> = {
  학회: "bg-indigo-50 text-indigo-700 border-indigo-200",
  정회원: "bg-teal-50 text-teal-700 border-teal-200",
  학술활동: "bg-cyan-50 text-cyan-700 border-cyan-200",
  연수: "bg-sky-50 text-sky-700 border-sky-200",
  강연: "bg-orange-50 text-orange-700 border-orange-200",
  발표: "bg-pink-50 text-pink-700 border-pink-200",
}

const pubTypeBg: Record<PublicationType, string> = {
  논문: "bg-blue-50 text-blue-700 border-blue-200",
  저서: "bg-emerald-50 text-emerald-700 border-emerald-200",
  기고: "bg-amber-50 text-amber-700 border-amber-200",
  인터뷰: "bg-pink-50 text-pink-700 border-pink-200",
  특허: "bg-violet-50 text-violet-700 border-violet-200",
  학술발표: "bg-indigo-50 text-indigo-700 border-indigo-200",
}

const credTypeBg: Record<CredentialType, string> = {
  자격: "bg-blue-50 text-blue-700 border-blue-200",
  인증: "bg-green-50 text-green-700 border-green-200",
  수상: "bg-yellow-50 text-yellow-700 border-yellow-200",
}

// ---------------------------------------------------------------------------
// Status label map
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<StaffStatus, string> = {
  draft: "초안",
  published: "공개",
  hidden: "숨김",
  archived: "보관됨",
}

// ---------------------------------------------------------------------------
// Local form shape mirrors StaffProfile editable fields
// ---------------------------------------------------------------------------

type LocalForm = {
  name: string
  englishName: string
  title: string
  oneLinePitch: string
  philosophy: string
  shortIntro: string
  longIntro: string
  profileImageUrl: string
  consultUrl: string
  isPublic: boolean
  isFeatured: boolean
  status: StaffStatus
  displayOrder: number
  chatbotPriority: boolean
  homepageQuote: string
  highlightPhrase: string
  pinToTop: boolean
  needsReview: boolean
  privateNote: string
  consultingStyle: string
  homepageHighlight: string
  chatbotSummary: string
}

function makeLocalForm(profile: StaffProfile): LocalForm {
  return {
    name: profile.name ?? "",
    englishName: profile.englishName ?? "",
    title: profile.title ?? "",
    oneLinePitch: profile.oneLinePitch ?? "",
    philosophy: profile.philosophy ?? "",
    shortIntro: profile.shortIntro ?? "",
    longIntro: profile.longIntro ?? "",
    profileImageUrl: profile.profileImageUrl ?? "",
    consultUrl: profile.consultUrl ?? "",
    isPublic: profile.isPublic ?? false,
    isFeatured: profile.isFeatured ?? false,
    status: profile.status ?? "draft",
    displayOrder: profile.displayOrder ?? 99,
    chatbotPriority: profile.chatbotPriority ?? false,
    homepageQuote: profile.homepageQuote ?? "",
    highlightPhrase: profile.highlightPhrase ?? "",
    pinToTop: profile.pinToTop ?? false,
    needsReview: profile.needsReview ?? false,
    privateNote: profile.privateNote ?? "",
    consultingStyle: profile.consultingStyle ?? "",
    homepageHighlight: profile.homepageHighlight ?? "",
    chatbotSummary: profile.chatbotSummary ?? "",
  }
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StaffDetailPage() {
  const params = useParams()
  const staffId = params.staffId as string
  const router = useRouter()
  const { selectedBranch } = useBranch()

  const {
    getDoctor,
    updateProfile,
    updateDoctorExtras,
    addCareer,
    updateCareer,
    deleteCareer,
    moveCareer,
    addAcademic,
    updateAcademic,
    deleteAcademic,
    moveAcademic,
    addPublication,
    updatePublication,
    deletePublication,
    addCredential,
    updateCredential,
    deleteCredential,
    deleteDoctor,
  } = useStaff()

  const doctorData = getDoctor(staffId)

  // ── Local form state ─────────────────────────────────────────────────────
  const [localForm, setLocalForm] = useState<LocalForm>(() =>
    doctorData ? makeLocalForm(doctorData.profile) : makeLocalForm({} as StaffProfile)
  )
  const [isDirty, setIsDirty] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string>(
    doctorData?.profile.updatedAt ?? new Date().toISOString()
  )

  // Sync localForm when doctorData loads / changes externally (e.g. first mount)
  useEffect(() => {
    if (doctorData) {
      setLocalForm(makeLocalForm(doctorData.profile))
      setLastSavedAt(doctorData.profile.updatedAt)
    }
    // Only re-init on staffId change to avoid clobbering in-progress edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId])

  function patchForm(patch: Partial<LocalForm>) {
    setLocalForm((prev) => ({ ...prev, ...patch }))
    setIsDirty(true)
    setIsSaved(false)
  }

  // ── Photo upload ref ─────────────────────────────────────────────────────
  const photoInputRef = useRef<HTMLInputElement>(null)
  function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    const url = URL.createObjectURL(file)
    patchForm({ profileImageUrl: url })
    e.target.value = ""
  }

  // ── Repeatable list editing state ────────────────────────────────────────
  // Careers
  const [careerExpandedId, setCareerExpandedId] = useState<string | null>(null)
  const [careerEditing, setCareerEditing] = useState<Partial<DoctorCareer>>({})

  // Academics
  const [academicExpandedId, setAcademicExpandedId] = useState<string | null>(null)
  const [academicEditing, setAcademicEditing] = useState<Partial<DoctorAcademic>>({})

  // Publications
  const [pubExpandedId, setPubExpandedId] = useState<string | null>(null)
  const [pubEditing, setPubEditing] = useState<Partial<DoctorPublication>>({})

  // Credentials
  const [credExpandedId, setCredExpandedId] = useState<string | null>(null)
  const [credEditing, setCredEditing] = useState<Partial<DoctorCredential>>({})

  // ── Preview tab ──────────────────────────────────────────────────────────
  const [previewTab, setPreviewTab] = useState("homepage")

  // ── Completeness calculation ─────────────────────────────────────────────
  const completeness = useMemo(() => {
    const required = [
      { key: "name", label: "이름", filled: !!localForm.name },
      { key: "title", label: "직책", filled: !!localForm.title },
      { key: "shortIntro", label: "짧은 소개", filled: !!localForm.shortIntro },
    ]
    const recommended = [
      { key: "profileImage", label: "프로필 사진", filled: !!localForm.profileImageUrl },
      {
        key: "specialties",
        label: "전문 분야 태그",
        filled: (doctorData?.specialties.length ?? 0) >= 1,
      },
      {
        key: "careers",
        label: "경력 사항",
        filled: (doctorData?.careers.length ?? 0) >= 1,
      },
      { key: "oneLinePitch", label: "한 줄 어필 문구", filled: !!localForm.oneLinePitch },
      { key: "longIntro", label: "상세 소개 본문", filled: !!localForm.longIntro },
    ]
    const filledRequired = required.filter((r) => r.filled).length
    const filledRec = recommended.filter((r) => r.filled).length
    const pct = Math.round(
      ((filledRequired + filledRec) / (required.length + recommended.length)) * 100
    )
    return { required, recommended, pct }
  }, [localForm, doctorData])

  // ── Save / temp save ─────────────────────────────────────────────────────
  function handleSave() {
    if (!doctorData) return
    updateProfile(staffId, {
      name: localForm.name,
      englishName: localForm.englishName,
      title: localForm.title,
      oneLinePitch: localForm.oneLinePitch,
      philosophy: localForm.philosophy,
      shortIntro: localForm.shortIntro,
      longIntro: localForm.longIntro,
      profileImageUrl: localForm.profileImageUrl,
      consultUrl: localForm.consultUrl.trim() || undefined,
      isPublic: localForm.isPublic,
      isFeatured: localForm.isFeatured,
      status: localForm.status,
      displayOrder: localForm.displayOrder,
      chatbotPriority: localForm.chatbotPriority,
      homepageQuote: localForm.homepageQuote,
      highlightPhrase: localForm.highlightPhrase,
      pinToTop: localForm.pinToTop,
      needsReview: localForm.needsReview,
      privateNote: localForm.privateNote,
      consultingStyle: localForm.consultingStyle,
      homepageHighlight: localForm.homepageHighlight,
      chatbotSummary: localForm.chatbotSummary,
    })
    const now = new Date().toISOString()
    setLastSavedAt(now)
    setIsDirty(false)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2500)
  }

  // ── Branch name resolution ───────────────────────────────────────────────
  const branchName = useMemo(() => {
    const branchId = doctorData?.profile.branchId ?? selectedBranch
    return branches.find((b) => b.id === branchId)?.name ?? branchId
  }, [doctorData, selectedBranch])

  // ── Branch-filtered linked content ───────────────────────────────────────
  const branchId = doctorData?.profile.branchId ?? selectedBranch
  const branchTreatments = treatments.filter((t) => t.branchId === branchId)
  const branchEquipment = equipment.filter((e) => e.branchId === branchId)

  // ── Not found ────────────────────────────────────────────────────────────
  if (!doctorData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Users className="h-16 w-16 text-muted-foreground/40" />
        <p className="text-lg font-semibold text-foreground">의료진을 찾을 수 없습니다</p>
        <p className="text-sm text-muted-foreground">
          ID <code className="font-mono">{staffId}</code>에 해당하는 의료진이 없습니다
        </p>
        <Button
          variant="outline"
          className="gap-2 rounded-xl"
          onClick={() => router.push("/admin/branch/doctors")}
        >
          <ArrowLeft className="h-4 w-4" />
          의료진 목록으로
        </Button>
      </div>
    )
  }

  // ── Sorted list helpers ───────────────────────────────────────────────────
  const sortedCareers = [...doctorData.careers].sort((a, b) => a.sortOrder - b.sortOrder)
  const sortedAcademics = [...doctorData.academics].sort((a, b) => a.sortOrder - b.sortOrder)
  const sortedPublications = [...doctorData.publications].sort((a, b) => a.sortOrder - b.sortOrder)
  const sortedCredentials = [...doctorData.credentials].sort((a, b) => a.sortOrder - b.sortOrder)

  // ── Career inline handlers ────────────────────────────────────────────────
  function openNewCareer() {
    setCareerExpandedId("new")
    setCareerEditing({
      type: "경력",
      organization: "",
      roleOrDescription: "",
      startYear: undefined,
      endYear: undefined,
      isCurrent: false,
      sortOrder: sortedCareers.length + 1,
      isPublic: true,
    })
  }

  function openEditCareer(career: DoctorCareer) {
    setCareerExpandedId(career.id)
    setCareerEditing({ ...career })
  }

  function saveCareer() {
    if (!careerEditing.organization || !careerEditing.roleOrDescription) return
    if (careerExpandedId === "new") {
      addCareer(staffId, {
        type: careerEditing.type as CareerType ?? "경력",
        organization: careerEditing.organization!,
        roleOrDescription: careerEditing.roleOrDescription!,
        startYear: careerEditing.startYear,
        endYear: careerEditing.isCurrent ? undefined : careerEditing.endYear,
        isCurrent: careerEditing.isCurrent ?? false,
        sortOrder: sortedCareers.length + 1,
        isPublic: careerEditing.isPublic ?? true,
      })
    } else if (careerExpandedId) {
      updateCareer(staffId, careerExpandedId, careerEditing)
    }
    setCareerExpandedId(null)
    setCareerEditing({})
  }

  // ── Academic inline handlers ──────────────────────────────────────────────
  function openNewAcademic() {
    setAcademicExpandedId("new")
    setAcademicEditing({
      type: "학회",
      name: "",
      description: "",
      year: undefined,
      isCurrent: false,
      sortOrder: sortedAcademics.length + 1,
      isPublic: true,
    })
  }

  function openEditAcademic(item: DoctorAcademic) {
    setAcademicExpandedId(item.id)
    setAcademicEditing({ ...item })
  }

  function saveAcademic() {
    if (!academicEditing.name) return
    if (academicExpandedId === "new") {
      addAcademic(staffId, {
        type: academicEditing.type as AcademicType ?? "학회",
        name: academicEditing.name!,
        description: academicEditing.description,
        year: academicEditing.isCurrent ? undefined : academicEditing.year,
        isCurrent: academicEditing.isCurrent ?? false,
        sortOrder: sortedAcademics.length + 1,
        isPublic: academicEditing.isPublic ?? true,
      })
    } else if (academicExpandedId) {
      updateAcademic(staffId, academicExpandedId, academicEditing)
    }
    setAcademicExpandedId(null)
    setAcademicEditing({})
  }

  // ── Publication inline handlers ────────────────────────────────────────────
  function openNewPublication() {
    setPubExpandedId("new")
    setPubEditing({
      type: "논문",
      title: "",
      publisherOrJournal: "",
      publishedYear: undefined,
      link: "",
      description: "",
      isFeatured: false,
      isPublic: true,
      sortOrder: sortedPublications.length + 1,
    })
  }

  function openEditPublication(item: DoctorPublication) {
    setPubExpandedId(item.id)
    setPubEditing({ ...item })
  }

  function savePublication() {
    if (!pubEditing.title) return
    if (pubExpandedId === "new") {
      addPublication(staffId, {
        type: pubEditing.type as PublicationType ?? "논문",
        title: pubEditing.title!,
        publisherOrJournal: pubEditing.publisherOrJournal,
        publishedYear: pubEditing.publishedYear,
        link: pubEditing.link,
        description: pubEditing.description,
        isFeatured: pubEditing.isFeatured ?? false,
        isPublic: pubEditing.isPublic ?? true,
        sortOrder: sortedPublications.length + 1,
      })
    } else if (pubExpandedId) {
      updatePublication(staffId, pubExpandedId, pubEditing)
    }
    setPubExpandedId(null)
    setPubEditing({})
  }

  // ── Credential inline handlers ─────────────────────────────────────────────
  function openNewCredential() {
    setCredExpandedId("new")
    setCredEditing({
      type: "자격",
      name: "",
      issuer: "",
      year: undefined,
      description: "",
      sortOrder: sortedCredentials.length + 1,
      isPublic: true,
    })
  }

  function openEditCredential(item: DoctorCredential) {
    setCredExpandedId(item.id)
    setCredEditing({ ...item })
  }

  function saveCredential() {
    if (!credEditing.name) return
    if (credExpandedId === "new") {
      addCredential(staffId, {
        type: credEditing.type as CredentialType ?? "자격",
        name: credEditing.name!,
        issuer: credEditing.issuer,
        year: credEditing.year,
        description: credEditing.description,
        sortOrder: sortedCredentials.length + 1,
        isPublic: credEditing.isPublic ?? true,
      })
    } else if (credExpandedId) {
      updateCredential(staffId, credExpandedId, credEditing)
    }
    setCredExpandedId(null)
    setCredEditing({})
  }

  // ── Chatbot preview text ───────────────────────────────────────────────────
  const chatbotText = useMemo(() => {
    const linkedTreatmentNames = doctorData.linkedTreatmentIds
      .map((id) => treatments.find((t) => t.id === id)?.name)
      .filter(Boolean)
      .join(", ")

    const topCareers = sortedCareers.slice(0, 2)
    const topAcademics = sortedAcademics.slice(0, 2)

    return [
      `📋 ${localForm.name || "(이름 없음)"}은(는) ${branchName} 소속 ${localForm.title || "(직책 없음)"}입니다.`,
      `🔬 주요 전문 분야는 ${doctorData.specialties.join(", ") || "(미입력)"}입니다.`,
      localForm.oneLinePitch ? `💡 ${localForm.oneLinePitch}` : null,
      topCareers.length > 0
        ? `📈 대표 경력: ${topCareers.map((c) => `${c.organization} (${c.roleOrDescription})`).join(" / ")}`
        : null,
      topAcademics.length > 0
        ? `🏛 학회/학술: ${topAcademics.map((a) => a.name).join(", ")}`
        : null,
      linkedTreatmentNames
        ? `💊 관련 시술: ${linkedTreatmentNames}`
        : null,
    ]
      .filter(Boolean)
      .join("\n")
  }, [localForm, doctorData, branchName, sortedCareers, sortedAcademics])

  // ── Linked content names ────────────────────────────────────────────────────
  const linkedTreatmentNames = doctorData.linkedTreatmentIds
    .map((id) => treatments.find((t) => t.id === id)?.name)
    .filter(Boolean) as string[]

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative">
      {/* ── Unsaved changes banner ─────────────────────────────────────────── */}
      {isDirty && (
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 rounded-b-2xl bg-amber-50 border border-amber-200 border-t-0 px-4 py-2.5 shadow-sm">
          <span className="text-sm font-medium text-amber-800">
            저장되지 않은 변경사항이 있습니다
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100"
              onClick={handleSave}
            >
              임시저장
            </Button>
            <Button
              size="sm"
              className="rounded-lg bg-amber-600 text-white hover:bg-amber-700"
              onClick={handleSave}
            >
              지금 저장
            </Button>
          </div>
        </div>
      )}

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="mb-6 space-y-4">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push("/admin/branch/doctors")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          의료진 목록
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Left: name + branch + status */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {localForm.name || "(이름 없음)"}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-muted-foreground">{branchName}</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  localForm.status === "published"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : localForm.status === "hidden"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : localForm.status === "archived"
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {STATUS_LABELS[localForm.status]}
              </Badge>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Featured star toggle */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-1.5 rounded-xl",
                localForm.isFeatured && "border-yellow-300 bg-yellow-50 text-yellow-700"
              )}
              onClick={() => patchForm({ isFeatured: !localForm.isFeatured })}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  localForm.isFeatured ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                )}
              />
              {localForm.isFeatured ? "대표노출 중" : "대표노출"}
            </Button>

            {/* Temp save */}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={handleSave}
              disabled={!isDirty}
            >
              임시저장
            </Button>

            {/* Save */}
            <Button
              size="sm"
              className={cn(
                "gap-1.5 rounded-xl",
                isSaved
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={handleSave}
              disabled={!isDirty && !isSaved}
            >
              {isSaved ? (
                <>
                  <Check className="h-4 w-4" />
                  저장됨
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  저장
                </>
              )}
            </Button>

            {/* Status dropdown */}
            <Select
              value={localForm.status}
              onValueChange={(v) => patchForm({ status: v as StaffStatus })}
            >
              <SelectTrigger className="h-8 w-28 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="draft">초안</SelectItem>
                <SelectItem value="published">공개</SelectItem>
                <SelectItem value="hidden">숨김</SelectItem>
                <SelectItem value="archived">보관됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Completeness bar ───────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-border bg-card shadow-sm mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">프로필 완성도</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {completeness.pct}%
                </span>
              </div>
              <Progress value={completeness.pct} className="h-2 rounded-full" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {completeness.required.filter((r) => !r.filled).length > 0 && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                  필수 누락 {completeness.required.filter((r) => !r.filled).length}개
                </Badge>
              )}
              {completeness.recommended.filter((r) => !r.filled).length > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-amber-50 text-amber-600 border-amber-200"
                >
                  권장 누락 {completeness.recommended.filter((r) => !r.filled).length}개
                </Badge>
              )}

              <span className="text-xs text-muted-foreground">
                마지막 저장 {formatTime(lastSavedAt)}
              </span>

              {localForm.status === "published" && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200"
                >
                  홈페이지 반영됨
                </Badge>
              )}

              <button
                type="button"
                onClick={() => patchForm({ chatbotPriority: !localForm.chatbotPriority })}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs transition-colors",
                  localForm.chatbotPriority
                    ? "border-violet-300 bg-violet-50 text-violet-700"
                    : "border-border bg-muted/40 text-muted-foreground"
                )}
              >
                챗봇 우선
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="grid xl:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ── LEFT: Section cards ─────────────────────────────────────────── */}
        <div className="space-y-6 min-w-0">

          {/* ── Section A: 기본 프로필 ────────────────────────────────────── */}
          <SectionCard id="section-a" icon={User} title="기본 프로필">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* 이름 (required) */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={localForm.name}
                  onChange={(e) => patchForm({ name: e.target.value })}
                  placeholder="예: 김민지"
                  className="rounded-xl"
                />
              </div>

              {/* 직책/호칭 (required) */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  직책/호칭 <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={localForm.title}
                  onChange={(e) => patchForm({ title: e.target.value })}
                  placeholder="예: 대표원장"
                  className="rounded-xl"
                />
                <div className="flex flex-wrap gap-1">
                  {["대표원장", "원장", "부원장", "진료원장", "전임의"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => patchForm({ title: preset })}
                      className={cn(
                        "rounded-lg border px-2 py-0.5 text-xs transition-colors",
                        localForm.title === preset
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* 영문 표기 */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">영문 표기</Label>
                <Input
                  value={localForm.englishName}
                  onChange={(e) => patchForm({ englishName: e.target.value })}
                  placeholder="Dr. Kim Min-ji"
                  className="rounded-xl"
                />
              </div>

              {/* 한 줄 어필 문구 (recommended) */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-amber-700">
                  한 줄 어필 문구{" "}
                  <span className="text-xs font-normal text-muted-foreground">(권장)</span>
                </Label>
                <CharCountInput
                  value={localForm.oneLinePitch}
                  onChange={(v) => patchForm({ oneLinePitch: v })}
                  max={60}
                  placeholder="예: 얼굴의 균형을 설계하는 전문의"
                />
              </div>

              {/* 진료 철학 한 줄 */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm font-medium">진료 철학 한 줄</Label>
                <CharCountInput
                  value={localForm.philosophy}
                  onChange={(v) => patchForm({ philosophy: v })}
                  max={80}
                  placeholder="예: 자연스러운 아름다움을 최우선으로 합니다"
                />
              </div>

              {/* 짧은 소개 문구 (required) */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm font-medium">
                  짧은 소개 문구 <span className="text-destructive">*</span>
                </Label>
                <RichTextEditor
                  mode="floating"
                  value={localForm.shortIntro ?? ""}
                  onChange={(html) => patchForm({ shortIntro: html })}
                  placeholder="의료진에 대한 짧은 소개를 입력하세요"
                  minHeight={72}
                />
              </div>

              {/* 상담 예약 URL */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm font-medium">상담 예약 URL (선택)</Label>
                <Input
                  type="url"
                  value={localForm.consultUrl ?? ""}
                  onChange={(e) => patchForm({ consultUrl: e.target.value })}
                  placeholder="https://booking.example.com — 비워두면 카드 CTA는 클릭 무동작"
                  className="rounded-xl"
                />
              </div>

              {/* 상세 소개 본문 */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm font-medium">상세 소개 본문</Label>
                <RichTextEditor
                  mode="floating"
                  value={localForm.longIntro ?? ""}
                  onChange={(html) => patchForm({ longIntro: html })}
                  placeholder="의료진에 대한 상세 소개를 입력하세요"
                  minHeight={100}
                />
              </div>
            </div>

            {/* 프로필 사진 upload area */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">프로필 사진</Label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoFile}
              />
              <div
                className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => photoInputRef.current?.click()}
              >
                {localForm.profileImageUrl ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={localForm.profileImageUrl}
                      alt={localForm.name}
                      className="h-16 w-16 rounded-full object-cover border border-border"
                    />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">사진 변경하려면 클릭</p>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); patchForm({ profileImageUrl: "" }) }}
                      >
                        제거
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">클릭하여 프로필 사진 업로드</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP · 최대 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* 공개 여부 + 대표 노출 여부 */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="isPublic"
                  checked={localForm.isPublic}
                  onCheckedChange={(v) => patchForm({ isPublic: v })}
                />
                <Label htmlFor="isPublic" className="text-sm cursor-pointer">
                  공개 여부
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isFeatured"
                  checked={localForm.isFeatured}
                  onCheckedChange={(v) => patchForm({ isFeatured: v })}
                />
                <Label htmlFor="isFeatured" className="text-sm cursor-pointer">
                  대표 노출 여부
                </Label>
              </div>
            </div>
          </SectionCard>

          {/* ── Section B: 전문 분야 및 대표 역량 ───────────────────────── */}
          <SectionCard id="section-b" icon={Sparkles} title="전문 분야 및 대표 역량">
            <div className="space-y-4">
              {/* 전문 분야 태그 */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">전문 분야 태그</Label>
                <TagInput
                  value={doctorData.specialties}
                  onChange={(v) => updateDoctorExtras(staffId, { specialties: v })}
                  placeholder="전문 분야 입력 후 Enter"
                  presets={["피부과", "성형외과", "비수술", "레이저", "리프팅", "피부미용", "비만", "항노화", "줄기세포"]}
                  maxTags={8}
                />
              </div>

              {/* 대표 시술 태그 */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">대표 시술 태그</Label>
                <TagInput
                  value={doctorData.targetCustomers}
                  onChange={(v) => updateDoctorExtras(staffId, { targetCustomers: v })}
                  placeholder="대표 시술 입력 후 Enter"
                  presets={["리프팅", "보톡스", "필러", "레이저", "스킨케어", "지방분해", "실리프팅"]}
                />
              </div>

              {/* 특화 키워드 */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">특화 키워드</Label>
                <TagInput
                  value={doctorData.specialtyKeywords}
                  onChange={(v) => updateDoctorExtras(staffId, { specialtyKeywords: v })}
                  placeholder="특화 키워드 입력 후 Enter"
                  maxTags={10}
                />
              </div>

              {/* 추천 고객 유형 */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">추천 고객 유형</Label>
                <TagInput
                  value={doctorData.targetCustomers}
                  onChange={(v) => updateDoctorExtras(staffId, { targetCustomers: v })}
                  placeholder="고객 유형 입력 후 Enter"
                  presets={["30대 여성", "40대 이상", "민감성 피부", "자연스러운 결과 선호", "첫 시술"]}
                />
              </div>

              {/* 상담 스타일 */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">상담 스타일</Label>
                <Input
                  value={localForm.consultingStyle}
                  onChange={(e) => patchForm({ consultingStyle: e.target.value })}
                  placeholder="예: 과잉 권유 없는 솔직한 피드백"
                  className="rounded-xl"
                />
              </div>

              {/* 대표 강점 (bullet 입력) */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">대표 강점</Label>
                <div className="space-y-2">
                  {doctorData.strengths.map((strength, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm w-4 shrink-0">
                        {idx + 1}.
                      </span>
                      <Input
                        value={strength}
                        onChange={(e) => {
                          const next = [...doctorData.strengths]
                          next[idx] = e.target.value
                          updateDoctorExtras(staffId, { strengths: next })
                        }}
                        className="rounded-xl flex-1"
                        placeholder="강점 입력"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => {
                          const next = doctorData.strengths.filter((_, i) => i !== idx)
                          updateDoctorExtras(staffId, { strengths: next })
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {doctorData.strengths.length < 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-xl text-xs"
                      onClick={() =>
                        updateDoctorExtras(staffId, {
                          strengths: [...doctorData.strengths, ""],
                        })
                      }
                    >
                      <Plus className="h-3.5 w-3.5" />
                      강점 추가
                    </Button>
                  )}
                </div>
              </div>

              {/* 홈페이지 강조 문구 */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">홈페이지 강조 문구</Label>
                <CharCountInput
                  value={localForm.homepageHighlight}
                  onChange={(v) => patchForm({ homepageHighlight: v })}
                  max={80}
                  placeholder="예: 안면 윤곽 1,000케이스 이상"
                />
              </div>

              {/* 챗봇 요약 문장 */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">챗봇 요약 문장</Label>
                <RichTextEditor
                  mode="floating"
                  value={localForm.chatbotSummary ?? ""}
                  onChange={(html) => patchForm({ chatbotSummary: html })}
                  placeholder="챗봇이 이 의료진을 소개할 때 사용하는 문장"
                  minHeight={80}
                />
              </div>
            </div>
          </SectionCard>

          {/* ── Section C: 경력 사항 ─────────────────────────────────────── */}
          <SectionCard id="section-c" icon={Briefcase} title="경력 사항">
            <div className="space-y-2">
              {sortedCareers.length === 0 && careerExpandedId !== "new" ? (
                <div className="py-8 text-center space-y-2">
                  <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground">
                    아직 등록된 경력이 없습니다
                  </p>
                  <p className="text-xs text-muted-foreground">
                    학력, 근무 이력, 대표 경력을 추가해 전문성을 표현하세요
                  </p>
                </div>
              ) : (
                sortedCareers.map((career) => (
                  <div key={career.id}>
                    {/* Row */}
                    <div className="flex items-center gap-2 rounded-xl p-2 hover:bg-muted/40 group">
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", careerTypeBg[career.type])}
                      >
                        {career.type}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {career.organization}
                          {career.roleOrDescription && (
                            <span className="font-normal text-muted-foreground">
                              {" "}
                              · {career.roleOrDescription}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatYear(career.startYear, career.endYear, career.isCurrent)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {career.isPublic ? (
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => moveCareer(staffId, career.id, "up")}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => moveCareer(staffId, career.id, "down")}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => openEditCareer(career)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                          onClick={() => deleteCareer(staffId, career.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Inline expand for editing */}
                    {careerExpandedId === career.id && (
                      <CareerInlineForm
                        value={careerEditing}
                        onChange={setCareerEditing}
                        onSave={saveCareer}
                        onCancel={() => {
                          setCareerExpandedId(null)
                          setCareerEditing({})
                        }}
                      />
                    )}
                  </div>
                ))
              )}

              {/* New career inline form */}
              {careerExpandedId === "new" && (
                <CareerInlineForm
                  value={careerEditing}
                  onChange={setCareerEditing}
                  onSave={saveCareer}
                  onCancel={() => {
                    setCareerExpandedId(null)
                    setCareerEditing({})
                  }}
                />
              )}

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl text-xs w-full"
                onClick={openNewCareer}
              >
                <Plus className="h-3.5 w-3.5" />
                경력 추가
              </Button>
            </div>
          </SectionCard>

          {/* ── Section D: 학회 / 학술 활동 ──────────────────────────────── */}
          <SectionCard id="section-d" icon={GraduationCap} title="학회 / 학술 활동">
            <div className="space-y-2">
              {sortedAcademics.length === 0 && academicExpandedId !== "new" ? (
                <div className="py-8 text-center space-y-2">
                  <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground">
                    아직 등록된 학회/학술 활동이 없습니다
                  </p>
                  <p className="text-xs text-muted-foreground">
                    정회원, 연수, 발표, 강연 이력을 추가할 수 있습니다
                  </p>
                </div>
              ) : (
                sortedAcademics.map((item) => (
                  <div key={item.id}>
                    <div className="flex items-center gap-2 rounded-xl p-2 hover:bg-muted/40 group">
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", academicTypeBg[item.type])}
                      >
                        {item.type}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        {(item.year || item.isCurrent) && (
                          <p className="text-xs text-muted-foreground">
                            {item.isCurrent ? "현재" : item.year}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.isPublic ? (
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => moveAcademic(staffId, item.id, "up")}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => moveAcademic(staffId, item.id, "down")}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => openEditAcademic(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                          onClick={() => deleteAcademic(staffId, item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {academicExpandedId === item.id && (
                      <AcademicInlineForm
                        value={academicEditing}
                        onChange={setAcademicEditing}
                        onSave={saveAcademic}
                        onCancel={() => {
                          setAcademicExpandedId(null)
                          setAcademicEditing({})
                        }}
                      />
                    )}
                  </div>
                ))
              )}

              {academicExpandedId === "new" && (
                <AcademicInlineForm
                  value={academicEditing}
                  onChange={setAcademicEditing}
                  onSave={saveAcademic}
                  onCancel={() => {
                    setAcademicExpandedId(null)
                    setAcademicEditing({})
                  }}
                />
              )}

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl text-xs w-full"
                onClick={openNewAcademic}
              >
                <Plus className="h-3.5 w-3.5" />
                학회/학술활동 추가
              </Button>
            </div>
          </SectionCard>

          {/* ── Section E: 논문 / 저서 / 학술 성과 ─────────────────────── */}
          <SectionCard
            id="section-e"
            icon={BookOpen}
            title="논문 / 저서 / 학술 성과"
            badge="선택"
          >
            <div className="space-y-2">
              {sortedPublications.length === 0 && pubExpandedId !== "new" ? (
                <div className="py-8 text-center space-y-2">
                  <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground">
                    아직 등록된 논문/저서가 없습니다
                  </p>
                  <p className="text-xs text-muted-foreground">
                    있는 경우에만 추가해도 됩니다
                  </p>
                </div>
              ) : (
                sortedPublications.map((pub) => (
                  <div key={pub.id}>
                    <div className="flex items-center gap-2 rounded-xl p-2 hover:bg-muted/40 group">
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", pubTypeBg[pub.type])}
                      >
                        {pub.type}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{pub.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {[pub.publisherOrJournal, pub.publishedYear].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {pub.isFeatured && (
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => openEditPublication(pub)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                          onClick={() => deletePublication(staffId, pub.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {pubExpandedId === pub.id && (
                      <PublicationInlineForm
                        value={pubEditing}
                        onChange={setPubEditing}
                        onSave={savePublication}
                        onCancel={() => {
                          setPubExpandedId(null)
                          setPubEditing({})
                        }}
                      />
                    )}
                  </div>
                ))
              )}

              {pubExpandedId === "new" && (
                <PublicationInlineForm
                  value={pubEditing}
                  onChange={setPubEditing}
                  onSave={savePublication}
                  onCancel={() => {
                    setPubExpandedId(null)
                    setPubEditing({})
                  }}
                />
              )}

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl text-xs w-full"
                onClick={openNewPublication}
              >
                <Plus className="h-3.5 w-3.5" />
                논문/저서 추가
              </Button>
            </div>
          </SectionCard>

          {/* ── Section F: 수상 / 인증 / 자격 ─────────────────────────── */}
          <SectionCard id="section-f" icon={Award} title="수상 / 인증 / 자격">
            <div className="space-y-2">
              {sortedCredentials.length === 0 && credExpandedId !== "new" ? (
                <div className="py-6 text-center space-y-2">
                  <Award className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground">
                    아직 등록된 수상/인증/자격이 없습니다
                  </p>
                </div>
              ) : (
                sortedCredentials.map((cred) => (
                  <div key={cred.id}>
                    <div className="flex items-center gap-2 rounded-xl p-2 hover:bg-muted/40 group">
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", credTypeBg[cred.type])}
                      >
                        {cred.type}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{cred.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[cred.issuer, cred.year].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => openEditCredential(cred)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                          onClick={() => deleteCredential(staffId, cred.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {credExpandedId === cred.id && (
                      <CredentialInlineForm
                        value={credEditing}
                        onChange={setCredEditing}
                        onSave={saveCredential}
                        onCancel={() => {
                          setCredExpandedId(null)
                          setCredEditing({})
                        }}
                      />
                    )}
                  </div>
                ))
              )}

              {credExpandedId === "new" && (
                <CredentialInlineForm
                  value={credEditing}
                  onChange={setCredEditing}
                  onSave={saveCredential}
                  onCancel={() => {
                    setCredExpandedId(null)
                    setCredEditing({})
                  }}
                />
              )}

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl text-xs w-full"
                onClick={openNewCredential}
              >
                <Plus className="h-3.5 w-3.5" />
                수상/인증/자격 추가
              </Button>
            </div>
          </SectionCard>

          {/* ── Section G: 연결 콘텐츠 ─────────────────────────────────── */}
          <SectionCard id="section-g" icon={Link2} title="연결 콘텐츠">
            <div className="space-y-4">
              {/* 관련 시술 */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">관련 시술 연결</Label>
                <MultiSelectChips
                  options={branchTreatments.map((t) => ({ id: t.id, label: t.name }))}
                  selected={doctorData.linkedTreatmentIds}
                  onToggle={(id) => {
                    const current = doctorData.linkedTreatmentIds
                    const next = current.includes(id)
                      ? current.filter((i) => i !== id)
                      : [...current, id]
                    updateDoctorExtras(staffId, { linkedTreatmentIds: next })
                  }}
                />
                {branchTreatments.length === 0 && (
                  <p className="text-xs text-muted-foreground">이 지점에 등록된 시술이 없습니다</p>
                )}
              </div>

              {/* 관련 장비 */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">관련 장비 연결</Label>
                <MultiSelectChips
                  options={branchEquipment.map((e) => ({ id: e.id, label: e.name }))}
                  selected={doctorData.linkedEquipmentIds}
                  onToggle={(id) => {
                    const current = doctorData.linkedEquipmentIds
                    const next = current.includes(id)
                      ? current.filter((i) => i !== id)
                      : [...current, id]
                    updateDoctorExtras(staffId, { linkedEquipmentIds: next })
                  }}
                />
                {branchEquipment.length === 0 && (
                  <p className="text-xs text-muted-foreground">이 지점에 등록된 장비가 없습니다</p>
                )}
              </div>

              {/* 관련 FAQ */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">관련 FAQ</Label>
                <MultiSelectChips
                  options={faqs.map((f) => ({
                    id: f.id,
                    label:
                      f.question.length > 28
                        ? f.question.slice(0, 28) + "…"
                        : f.question,
                  }))}
                  selected={doctorData.linkedFaqIds}
                  onToggle={(id) => {
                    const current = doctorData.linkedFaqIds
                    const next = current.includes(id)
                      ? current.filter((i) => i !== id)
                      : [...current, id]
                    updateDoctorExtras(staffId, { linkedFaqIds: next })
                  }}
                />
              </div>
            </div>
          </SectionCard>

          {/* ── Section H: 노출 / 표현 설정 ──────────────────────────── */}
          <SectionCard id="section-h" icon={Settings2} title="노출 / 표현 설정">
            <div className="space-y-4">
              {/* Switches grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <Label htmlFor="pinToTop" className="text-sm cursor-pointer">
                    소개 섹션 상단 고정
                  </Label>
                  <Switch
                    id="pinToTop"
                    checked={localForm.pinToTop}
                    onCheckedChange={(v) => patchForm({ pinToTop: v })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <Label htmlFor="chatbotPriorityH" className="text-sm cursor-pointer">
                    챗봇 우선 반영
                  </Label>
                  <Switch
                    id="chatbotPriorityH"
                    checked={localForm.chatbotPriority}
                    onCheckedChange={(v) => patchForm({ chatbotPriority: v })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <Label htmlFor="needsReview" className="text-sm cursor-pointer">
                    내부 검토 필요
                  </Label>
                  <Switch
                    id="needsReview"
                    checked={localForm.needsReview}
                    onCheckedChange={(v) => patchForm({ needsReview: v })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <Label htmlFor="isFeaturedH" className="text-sm cursor-pointer">
                    홈페이지 대표 노출
                  </Label>
                  <Switch
                    id="isFeaturedH"
                    checked={localForm.isFeatured}
                    onCheckedChange={(v) => patchForm({ isFeatured: v })}
                  />
                </div>
              </div>

              {/* 정렬 순서 */}
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium shrink-0">정렬 순서</Label>
                <Input
                  type="number"
                  value={localForm.displayOrder}
                  onChange={(e) =>
                    patchForm({ displayOrder: parseInt(e.target.value) || 1 })
                  }
                  className="w-24 rounded-xl"
                  min={1}
                />
              </div>

              {/* 비공개 사유 메모 (shown when !isPublic) */}
              {!localForm.isPublic && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">비공개 사유 메모</Label>
                  <RichTextEditor
                    mode="floating"
                    value={localForm.privateNote ?? ""}
                    onChange={(html) => patchForm({ privateNote: html })}
                    placeholder="비공개 처리 사유를 입력하세요 (내부용)"
                    minHeight={72}
                  />
                </div>
              )}

              {/* 홈페이지용 인용문 */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">홈페이지용 인용문</Label>
                <CharCountInput
                  value={localForm.homepageQuote}
                  onChange={(v) => patchForm({ homepageQuote: v })}
                  max={100}
                  placeholder='예: "얼굴의 균형이 자신감의 시작입니다."'
                />
              </div>

              {/* 강조 키비주얼 문구 */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">강조 키비주얼 문구</Label>
                <CharCountInput
                  value={localForm.highlightPhrase}
                  onChange={(v) => patchForm({ highlightPhrase: v })}
                  max={80}
                  placeholder="예: 안면 윤곽 1,000케이스 이상"
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── RIGHT: Sticky preview panel ─────────────────────────────────── */}
        <div className="sticky top-24 space-y-3">
          <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
            <Tabs value={previewTab} onValueChange={setPreviewTab}>
              <div className="px-4 pt-4">
                <TabsList className="w-full rounded-xl bg-muted p-1">
                  <TabsTrigger
                    value="homepage"
                    className="flex-1 rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    홈페이지
                  </TabsTrigger>
                  <TabsTrigger
                    value="chatbot"
                    className="flex-1 rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    챗봇 요약
                  </TabsTrigger>
                  <TabsTrigger
                    value="missing"
                    className="flex-1 rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    누락 항목
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab 1: 홈페이지 미리보기 */}
              <TabsContent value="homepage" className="px-4 pb-4 pt-3 space-y-3">
                {/* Avatar + name + title */}
                <div className="flex items-center gap-3">
                  {localForm.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={localForm.profileImageUrl}
                      alt={localForm.name}
                      className="h-16 w-16 shrink-0 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                      {localForm.name ? localForm.name.charAt(0) : "?"}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">
                      {localForm.name || "(이름 없음)"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {localForm.title || "(직책 없음)"}
                    </p>
                  </div>
                </div>

                {/* oneLinePitch or shortIntro */}
                {(localForm.oneLinePitch || localForm.shortIntro) && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {localForm.oneLinePitch || localForm.shortIntro}
                  </p>
                )}

                {/* Specialties */}
                {doctorData.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doctorData.specialties.slice(0, 2).map((sp) => (
                      <Badge
                        key={sp}
                        variant="outline"
                        className="text-xs px-1.5 py-0"
                      >
                        {sp}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Strengths */}
                {doctorData.strengths.filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doctorData.strengths
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((s, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs px-1.5 py-0 bg-primary/5"
                        >
                          {s}
                        </Badge>
                      ))}
                  </div>
                )}

                {/* Careers — all public */}
                {sortedCareers.filter((c) => c.isPublic).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">경력</p>
                    {sortedCareers.filter((c) => c.isPublic).map((c) => (
                      <p key={c.id} className="text-xs text-foreground">
                        {c.organization}{" "}
                        <span className="text-muted-foreground">· {c.roleOrDescription}</span>
                      </p>
                    ))}
                  </div>
                )}

                {/* Academics — all public */}
                {sortedAcademics.filter((a) => a.isPublic).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">학회/학술</p>
                    {sortedAcademics.filter((a) => a.isPublic).map((a) => (
                      <p key={a.id} className="text-xs text-foreground">
                        {a.name}
                      </p>
                    ))}
                  </div>
                )}

                {/* Homepage quote */}
                {localForm.homepageQuote && (
                  <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-3">
                    "{localForm.homepageQuote}"
                  </p>
                )}

                {/* Linked treatments */}
                {linkedTreatmentNames.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">연결 시술</p>
                    <div className="flex flex-wrap gap-1">
                      {linkedTreatmentNames.map((name) => (
                        <Badge
                          key={name}
                          variant="outline"
                          className="text-xs px-1.5 py-0"
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {!localForm.name && !localForm.shortIntro && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    프로필을 입력하면 미리보기가 표시됩니다
                  </p>
                )}
              </TabsContent>

              {/* Tab 2: 챗봇 요약 */}
              <TabsContent value="chatbot" className="px-4 pb-4 pt-3">
                <div className="rounded-xl bg-muted/50 border border-border p-3">
                  <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {chatbotText}
                  </pre>
                </div>
                {localForm.chatbotSummary && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">챗봇 요약 문장</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      {localForm.chatbotSummary}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: 누락 항목 */}
              <TabsContent value="missing" className="px-4 pb-4 pt-3 space-y-3">
                {/* 필수 누락 */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground">필수 누락</p>
                  {completeness.required.filter((r) => !r.filled).length === 0 ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      필수 항목이 모두 완료됐습니다
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {completeness.required
                        .filter((r) => !r.filled)
                        .map((r) => (
                          <Badge
                            key={r.key}
                            variant="outline"
                            className="text-xs bg-red-50 text-red-600 border-red-200"
                          >
                            {r.label}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>

                {/* 권장 누락 */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground">권장 누락</p>
                  {completeness.recommended.filter((r) => !r.filled).length === 0 ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      권장 항목이 모두 완료됐습니다
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {completeness.recommended
                        .filter((r) => !r.filled)
                        .map((r) => (
                          <Badge
                            key={r.key}
                            variant="outline"
                            className="text-xs bg-amber-50 text-amber-600 border-amber-200"
                          >
                            {r.label}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>

                {/* Completeness summary */}
                <div className="rounded-xl bg-muted/40 px-3 py-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">완성도</span>
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {completeness.pct}%
                    </span>
                  </div>
                  <Progress value={completeness.pct} className="h-1.5 rounded-full" />
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* ── Danger zone: delete doctor ──────────────────────────────────── */}
      <Card className="mt-6 border-destructive/30">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-destructive mb-1">의료진 삭제</h3>
          <p className="text-sm text-muted-foreground mb-4">
            이 의료진을 영구 삭제합니다. 삭제 후 복구할 수 없습니다.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              if (!window.confirm("이 의료진을 영구 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.")) return
              deleteDoctor(staffId)
              router.push("/admin/branch/doctors")
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            의료진 삭제
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline form components
// ---------------------------------------------------------------------------

function InlineFormWrapper({
  children,
  onSave,
  onCancel,
  saveLabel = "저장",
}: {
  children: React.ReactNode
  onSave: () => void
  onCancel: () => void
  saveLabel?: string
}) {
  return (
    <div className="mt-1 mb-2 rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      {children}
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          className="rounded-lg gap-1.5"
          onClick={onSave}
        >
          <Check className="h-3.5 w-3.5" />
          {saveLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-lg"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  )
}

// Career inline form
function CareerInlineForm({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: Partial<DoctorCareer>
  onChange: (v: Partial<DoctorCareer>) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <InlineFormWrapper onSave={onSave} onCancel={onCancel}>
      <div className="grid sm:grid-cols-2 gap-3">
        {/* type */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">유형</Label>
          <Select
            value={value.type ?? "경력"}
            onValueChange={(v) => onChange({ ...value, type: v as CareerType })}
          >
            <SelectTrigger className="h-8 rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {(["경력", "학력", "수련", "근무이력", "이력"] as CareerType[]).map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* organization */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            기관명 <span className="text-destructive">*</span>
          </Label>
          <Input
            value={value.organization ?? ""}
            onChange={(e) => onChange({ ...value, organization: e.target.value })}
            placeholder="기관명 입력"
            className="h-8 rounded-lg text-xs"
          />
        </div>

        {/* roleOrDescription */}
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">
            역할/설명 <span className="text-destructive">*</span>
          </Label>
          <Input
            value={value.roleOrDescription ?? ""}
            onChange={(e) => onChange({ ...value, roleOrDescription: e.target.value })}
            placeholder="예: 피부과 전공의 수료"
            className="h-8 rounded-lg text-xs"
          />
        </div>

        {/* startYear */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">시작 연도</Label>
          <Input
            type="number"
            value={value.startYear ?? ""}
            onChange={(e) =>
              onChange({ ...value, startYear: parseInt(e.target.value) || undefined })
            }
            placeholder="2010"
            className="h-8 rounded-lg text-xs"
            maxLength={4}
          />
        </div>

        {/* endYear */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">종료 연도</Label>
          <Input
            type="number"
            value={value.isCurrent ? "" : (value.endYear ?? "")}
            onChange={(e) =>
              onChange({ ...value, endYear: parseInt(e.target.value) || undefined })
            }
            placeholder="2015"
            className="h-8 rounded-lg text-xs"
            disabled={!!value.isCurrent}
            maxLength={4}
          />
        </div>
      </div>

      {/* isCurrent + isPublic */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="careerIsCurrent"
            checked={value.isCurrent ?? false}
            onCheckedChange={(v) => onChange({ ...value, isCurrent: v })}
          />
          <Label htmlFor="careerIsCurrent" className="text-xs cursor-pointer">
            현재 재직/재학 중
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="careerIsPublic"
            checked={value.isPublic ?? true}
            onCheckedChange={(v) => onChange({ ...value, isPublic: v })}
          />
          <Label htmlFor="careerIsPublic" className="text-xs cursor-pointer">
            공개
          </Label>
        </div>
      </div>
    </InlineFormWrapper>
  )
}

// Academic inline form
function AcademicInlineForm({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: Partial<DoctorAcademic>
  onChange: (v: Partial<DoctorAcademic>) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <InlineFormWrapper onSave={onSave} onCancel={onCancel}>
      <div className="grid sm:grid-cols-2 gap-3">
        {/* type */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">유형</Label>
          <Select
            value={value.type ?? "학회"}
            onValueChange={(v) => onChange({ ...value, type: v as AcademicType })}
          >
            <SelectTrigger className="h-8 rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {(["학회", "정회원", "학술활동", "연수", "강연", "발표"] as AcademicType[]).map(
                (t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {/* name */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            명칭 <span className="text-destructive">*</span>
          </Label>
          <Input
            value={value.name ?? ""}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="예: 대한피부과학회"
            className="h-8 rounded-lg text-xs"
          />
        </div>

        {/* description */}
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">설명 (선택)</Label>
          <Input
            value={value.description ?? ""}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
            placeholder="부가 설명 입력"
            className="h-8 rounded-lg text-xs"
          />
        </div>

        {/* year */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">연도</Label>
          <Input
            type="number"
            value={value.isCurrent ? "" : (value.year ?? "")}
            onChange={(e) =>
              onChange({ ...value, year: parseInt(e.target.value) || undefined })
            }
            placeholder="2019"
            className="h-8 rounded-lg text-xs"
            disabled={!!value.isCurrent}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="academicIsCurrent"
            checked={value.isCurrent ?? false}
            onCheckedChange={(v) => onChange({ ...value, isCurrent: v })}
          />
          <Label htmlFor="academicIsCurrent" className="text-xs cursor-pointer">
            현재 재직/재학 중
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="academicIsPublic"
            checked={value.isPublic ?? true}
            onCheckedChange={(v) => onChange({ ...value, isPublic: v })}
          />
          <Label htmlFor="academicIsPublic" className="text-xs cursor-pointer">
            공개
          </Label>
        </div>
      </div>
    </InlineFormWrapper>
  )
}

// Publication inline form
function PublicationInlineForm({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: Partial<DoctorPublication>
  onChange: (v: Partial<DoctorPublication>) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <InlineFormWrapper onSave={onSave} onCancel={onCancel}>
      <div className="grid sm:grid-cols-2 gap-3">
        {/* type */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">유형</Label>
          <Select
            value={value.type ?? "논문"}
            onValueChange={(v) => onChange({ ...value, type: v as PublicationType })}
          >
            <SelectTrigger className="h-8 rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {(["논문", "저서", "기고", "인터뷰", "특허", "학술발표"] as PublicationType[]).map(
                (t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {/* title */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            제목 <span className="text-destructive">*</span>
          </Label>
          <Input
            value={value.title ?? ""}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="논문/저서 제목"
            className="h-8 rounded-lg text-xs"
          />
        </div>

        {/* publisherOrJournal */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">출판사/학술지</Label>
          <Input
            value={value.publisherOrJournal ?? ""}
            onChange={(e) => onChange({ ...value, publisherOrJournal: e.target.value })}
            placeholder="예: 대한피부과학회지"
            className="h-8 rounded-lg text-xs"
          />
        </div>

        {/* publishedYear */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">출판 연도</Label>
          <Input
            type="number"
            value={value.publishedYear ?? ""}
            onChange={(e) =>
              onChange({ ...value, publishedYear: parseInt(e.target.value) || undefined })
            }
            placeholder="2022"
            className="h-8 rounded-lg text-xs"
          />
        </div>

        {/* link */}
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">링크</Label>
          <Input
            value={value.link ?? ""}
            onChange={(e) => onChange({ ...value, link: e.target.value })}
            placeholder="https://..."
            className="h-8 rounded-lg text-xs"
          />
        </div>

        {/* description */}
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">설명</Label>
          <RichTextEditor
            mode="floating"
            value={value.description ?? ""}
            onChange={(html) => onChange({ ...value, description: html })}
            placeholder="간략한 설명"
            minHeight={60}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="pubIsFeatured"
            checked={value.isFeatured ?? false}
            onCheckedChange={(v) => onChange({ ...value, isFeatured: v })}
          />
          <Label htmlFor="pubIsFeatured" className="text-xs cursor-pointer">
            대표 노출
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="pubIsPublic"
            checked={value.isPublic ?? true}
            onCheckedChange={(v) => onChange({ ...value, isPublic: v })}
          />
          <Label htmlFor="pubIsPublic" className="text-xs cursor-pointer">
            공개
          </Label>
        </div>
      </div>
    </InlineFormWrapper>
  )
}

// Credential inline form
function CredentialInlineForm({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: Partial<DoctorCredential>
  onChange: (v: Partial<DoctorCredential>) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <InlineFormWrapper onSave={onSave} onCancel={onCancel}>
      <div className="grid sm:grid-cols-2 gap-3">
        {/* type */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">유형</Label>
          <Select
            value={value.type ?? "자격"}
            onValueChange={(v) => onChange({ ...value, type: v as CredentialType })}
          >
            <SelectTrigger className="h-8 rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {(["자격", "인증", "수상"] as CredentialType[]).map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* name */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            명칭 <span className="text-destructive">*</span>
          </Label>
          <Input
            value={value.name ?? ""}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="예: 피부과 전문의"
            className="h-8 rounded-lg text-xs"
          />
        </div>

        {/* issuer */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">발급 기관</Label>
          <Input
            value={value.issuer ?? ""}
            onChange={(e) => onChange({ ...value, issuer: e.target.value })}
            placeholder="예: 대한의사협회"
            className="h-8 rounded-lg text-xs"
          />
        </div>

        {/* year */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">연도</Label>
          <Input
            type="number"
            value={value.year ?? ""}
            onChange={(e) =>
              onChange({ ...value, year: parseInt(e.target.value) || undefined })
            }
            placeholder="2015"
            className="h-8 rounded-lg text-xs"
          />
        </div>

        {/* description */}
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">설명</Label>
          <RichTextEditor
            mode="floating"
            value={value.description ?? ""}
            onChange={(html) => onChange({ ...value, description: html })}
            placeholder="부가 설명"
            minHeight={56}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="credIsPublic"
          checked={value.isPublic ?? true}
          onCheckedChange={(v) => onChange({ ...value, isPublic: v })}
        />
        <Label htmlFor="credIsPublic" className="text-xs cursor-pointer">
          공개
        </Label>
      </div>
    </InlineFormWrapper>
  )
}
