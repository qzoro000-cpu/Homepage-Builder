"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Pencil,
  Users,
  Cpu,
  Sparkles,
  Filter,
  ChevronRight,
  Archive,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStaff, DoctorData } from "@/lib/staff-store"
import { useEquipment, EquipmentData } from "@/lib/equipment-store"
import { useTreatment, TreatmentData } from "@/lib/treatment-store"
import { useBranch } from "../../layout"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    published: {
      label: "공개",
      className: "bg-success/10 text-success border-success/20",
    },
    draft: {
      label: "초안",
      className: "bg-muted text-muted-foreground",
    },
    hidden: {
      label: "숨김",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    archived: {
      label: "보관됨",
      className: "bg-red-50 text-red-600 border-red-200",
    },
    needs_review: {
      label: "검토필요",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
  }

  const { label, className } = config[status] ?? config.draft

  return (
    <Badge variant="outline" className={cn("text-xs", className)}>
      {label}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// DoctorCard
// ---------------------------------------------------------------------------

function DoctorCard({
  data,
  onEdit,
  onDuplicate,
  onTogglePublic,
  onToggleFeatured,
}: {
  data: DoctorData
  onEdit: () => void
  onDuplicate: () => void
  onTogglePublic: () => void
  onToggleFeatured: () => void
}) {
  const { profile, specialties } = data

  const updatedTime = (() => {
    try {
      const d = new Date(profile.updatedAt)
      return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
    } catch {
      return ""
    }
  })()

  const displaySpecialties = specialties.slice(0, 2)
  const pitch = profile.oneLinePitch || profile.shortIntro || ""

  return (
    <div
      className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm cursor-pointer"
      onClick={onEdit}
    >
      {/* Avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-base select-none">
        {profile.name.charAt(0)}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Row 1: name + featured star + status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground truncate">{profile.name}</span>
          {profile.isFeatured && (
            <Star className="h-3.5 w-3.5 fill-warning text-warning shrink-0" />
          )}
          <StatusBadge status={profile.status} />
        </div>

        {/* Row 2: title + specialty badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">{profile.title}</span>
          {displaySpecialties.map((sp) => (
            <Badge key={sp} variant="outline" className="text-xs px-1.5 py-0">
              {sp}
            </Badge>
          ))}
        </div>

        {/* Row 3: one-line pitch */}
        {pitch && (
          <p className="text-xs text-muted-foreground truncate max-w-sm">{pitch}</p>
        )}

        {/* Row 4: meta */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            수정 날짜: {updatedTime}
          </span>
          {profile.chatbotPriority && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 bg-violet-50 text-violet-700 border-violet-200">
              챗봇
            </Badge>
          )}
        </div>
      </div>

      {/* Right: dropdown + chevron */}
      <div className="flex items-center gap-1 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate()
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              복제
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onTogglePublic()
              }}
            >
              {profile.isPublic ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  비공개로 전환
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  공개로 전환
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFeatured()
              }}
            >
              {profile.isFeatured ? (
                <>
                  <StarOff className="mr-2 h-4 w-4" />
                  대표노출 해제
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  대표노출 설정
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EquipmentCard
// ---------------------------------------------------------------------------

function EquipmentCard({
  data,
  onEdit,
  onDuplicate,
  onTogglePublic,
  onToggleFeatured,
  onToggleTreatmentLike,
  onArchive,
}: {
  data: EquipmentData
  onEdit: () => void
  onDuplicate: () => void
  onTogglePublic: () => void
  onToggleFeatured: () => void
  onToggleTreatmentLike: () => void
  onArchive: () => void
}) {
  const { profile, assets, linkedTreatmentIds } = data

  const updatedTime = (() => {
    try {
      const d = new Date(profile.updatedAt)
      return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
    } catch {
      return ""
    }
  })()

  // Try to find the first image asset for thumbnail
  const firstImageAsset = assets.find((a) => a.fileType === "image")

  return (
    <div
      className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm cursor-pointer"
      onClick={onEdit}
    >
      {/* Thumbnail */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted overflow-hidden">
        {firstImageAsset ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstImageAsset.fileUrl}
            alt={firstImageAsset.title ?? profile.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Cpu className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Row 1: name + featured star + treatmentLike badge + status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground truncate">{profile.name}</span>
          {profile.isFeatured && (
            <Star className="h-3.5 w-3.5 fill-warning text-warning shrink-0" />
          )}
          {profile.isTreatmentLike && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 bg-accent/10 text-accent border-accent/30">
              시술형
            </Badge>
          )}
          <StatusBadge status={profile.status} />
        </div>

        {/* Row 2: category + manufacturer */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>{profile.category}</span>
          {profile.manufacturer && (
            <span>({profile.manufacturer})</span>
          )}
        </div>

        {/* Row 3: one-line pitch */}
        {profile.oneLinePitch && (
          <p className="text-xs text-muted-foreground truncate max-w-sm">{profile.oneLinePitch}</p>
        )}

        {/* Row 4: meta */}
        <div className="flex items-center gap-3 pt-0.5">
          <span className="text-xs text-muted-foreground">
            연결 시술 {linkedTreatmentIds.length}개
          </span>
          <span className="text-xs text-muted-foreground">
            자산 {assets.length}개
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {updatedTime}
          </span>
        </div>
      </div>

      {/* Right: dropdown + chevron */}
      <div className="flex items-center gap-1 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate()
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              복제
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onTogglePublic()
              }}
            >
              {profile.isPublic ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  비공개로 전환
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  공개로 전환
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFeatured()
              }}
            >
              {profile.isFeatured ? (
                <>
                  <StarOff className="mr-2 h-4 w-4" />
                  대표노출 해제
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  대표노출 설정
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onToggleTreatmentLike()
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {profile.isTreatmentLike ? "시술형 해제" : "시술형 설정"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer rounded-lg text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onArchive()
              }}
            >
              <Archive className="mr-2 h-4 w-4" />
              보관
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TreatmentCard
// ---------------------------------------------------------------------------

function TreatmentCard({
  data,
  onEdit,
  onDuplicate,
  onTogglePublic,
  onToggleFeatured,
  onArchive,
}: {
  data: TreatmentData
  onEdit: () => void
  onDuplicate: () => void
  onTogglePublic: () => void
  onToggleFeatured: () => void
  onArchive: () => void
}) {
  const { profile, benefits, programs } = data

  // Hydration-safe updated time
  const updatedTime = (() => {
    try {
      const d = new Date(profile.updatedAt)
      const h = String(d.getHours()).padStart(2, "0")
      const m = String(d.getMinutes()).padStart(2, "0")
      return `${h}:${m}`
    } catch {
      return ""
    }
  })()

  // Korean price formatting: 1200000 → "120만원"
  const formatPrice = (price?: number): string => {
    if (price == null) return ""
    const man = Math.floor(price / 10000)
    const remainder = price % 10000
    if (man > 0 && remainder === 0) return `${man}만원`
    if (man > 0) return `${man}만 ${remainder.toLocaleString()}원`
    return `${price.toLocaleString()}원`
  }

  const priceDisplay = profile.useConsultInquiry
    ? "가격문의"
    : profile.priceEvent != null
    ? formatPrice(profile.priceEvent)
    : profile.priceRegular != null
    ? formatPrice(profile.priceRegular)
    : ""

  const displayBenefits = benefits.slice(0, 2)

  return (
    <div
      className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm cursor-pointer"
      onClick={onEdit}
    >
      {/* Icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Sparkles className="h-5 w-5" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Row 1: name + featured star + status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground truncate">{profile.name}</span>
          {profile.isFeatured && (
            <Star className="h-3.5 w-3.5 fill-warning text-warning shrink-0" />
          )}
          <StatusBadge status={profile.status} />
          {profile.isLandingPublic && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
              랜딩공개
            </Badge>
          )}
        </div>

        {/* Row 2: category + price */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {profile.category}
          </Badge>
          {priceDisplay && (
            <span className="font-medium text-foreground text-xs">{priceDisplay}</span>
          )}
        </div>

        {/* Row 3: one-line pitch */}
        {profile.oneLinePitch && (
          <p className="text-xs text-muted-foreground truncate max-w-sm">{profile.oneLinePitch}</p>
        )}

        {/* Row 4: benefits + programs count + updated time */}
        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
          {displayBenefits.map((b, i) => (
            <Badge key={i} variant="outline" className="text-xs px-1.5 py-0 bg-muted">
              {b}
            </Badge>
          ))}
          {programs.length > 0 && (
            <span className="text-xs text-muted-foreground">프로그램 {programs.length}개</span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {updatedTime}
          </span>
        </div>
      </div>

      {/* Right: dropdown + chevron */}
      <div className="flex items-center gap-1 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate()
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              복제
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onTogglePublic()
              }}
            >
              {profile.isPublic ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  비공개로 전환
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  공개로 전환
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFeatured()
              }}
            >
              {profile.isFeatured ? (
                <>
                  <StarOff className="mr-2 h-4 w-4" />
                  대표노출 해제
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  대표노출 설정
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer rounded-lg text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onArchive()
              }}
            >
              <Archive className="mr-2 h-4 w-4" />
              보관
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DoctorsEquipmentPage() {
  const router = useRouter()
  const { selectedBranch } = useBranch()
  const { getDoctorsByBranch, duplicateDoctor, updateProfile } = useStaff()
  const {
    getEquipmentByBranch,
    archiveEquipment,
    duplicateEquipment,
    updateProfile: updateEquipmentProfile,
  } = useEquipment()
  const {
    getTreatmentsByBranch,
    archiveTreatment,
    duplicateTreatment,
    updateProfile: updateTreatmentProfile,
  } = useTreatment()

  // Doctor filters
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("doctors")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "hidden">("all")
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured">("all")
  const [sortBy, setSortBy] = useState<"updatedAt" | "name" | "status">("updatedAt")

  // Equipment filters
  const [equipmentSearch, setEquipmentSearch] = useState("")
  const [equipmentStatusFilter, setEquipmentStatusFilter] = useState<"all" | "published" | "draft" | "hidden">("all")
  const [equipmentFeaturedFilter, setEquipmentFeaturedFilter] = useState<"all" | "featured">("all")
  const [equipmentCategoryFilter, setEquipmentCategoryFilter] = useState<string>("all")

  const branchDoctors = getDoctorsByBranch(selectedBranch)
  const branchEquipment = getEquipmentByBranch(selectedBranch)
  const branchTreatments = getTreatmentsByBranch(selectedBranch).filter(
    (t) => t.profile.status !== "archived"
  )

  // --- Doctor filtering & sorting ---
  const filteredDoctors = branchDoctors
    .filter((d) => {
      if (statusFilter === "all" && d.profile.status === "archived") return false
      return true
    })
    .filter((d) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        d.profile.name.toLowerCase().includes(q) ||
        d.profile.title.toLowerCase().includes(q) ||
        d.specialties.join(" ").toLowerCase().includes(q)
      )
    })
    .filter((d) => {
      if (statusFilter === "all") return true
      return d.profile.status === statusFilter
    })
    .filter((d) => {
      if (featuredFilter === "all") return true
      return d.profile.isFeatured
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.profile.name.localeCompare(b.profile.name, "ko")
      if (sortBy === "status") return a.profile.status.localeCompare(b.profile.status)
      return new Date(b.profile.updatedAt).getTime() - new Date(a.profile.updatedAt).getTime()
    })

  // --- Equipment filtering ---
  const filteredEquipment = branchEquipment
    .filter((e) => {
      // Hide archived by default
      if (equipmentStatusFilter === "all" && e.profile.status === "archived") return false
      return true
    })
    .filter((e) => {
      if (!equipmentSearch) return true
      const q = equipmentSearch.toLowerCase()
      return (
        e.profile.name.toLowerCase().includes(q) ||
        e.profile.category.toLowerCase().includes(q) ||
        (e.profile.manufacturer ?? "").toLowerCase().includes(q)
      )
    })
    .filter((e) => {
      if (equipmentStatusFilter === "all") return true
      return e.profile.status === equipmentStatusFilter
    })
    .filter((e) => {
      if (equipmentFeaturedFilter === "all") return true
      return e.profile.isFeatured
    })
    .filter((e) => {
      if (equipmentCategoryFilter === "all") return true
      return e.profile.category === equipmentCategoryFilter
    })

  // --- Treatment filtering ---
  const filteredTreatments = branchTreatments.filter(
    (t) =>
      t.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.profile.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Active doctors count (excluding archived)
  const activeDoctorCount = branchDoctors.filter((d) => d.profile.status !== "archived").length
  // Active equipment count (excluding archived)
  const activeEquipmentCount = branchEquipment.filter((e) => e.profile.status !== "archived").length

  // Unique equipment categories for filter
  const equipmentCategories = Array.from(new Set(branchEquipment.map((e) => e.profile.category)))

  function handleAddNew() {
    if (activeTab === "doctors") {
      router.push("/admin/branch/staff/new")
    } else if (activeTab === "equipment") {
      router.push("/admin/branch/equipment/new")
    } else if (activeTab === "treatments") {
      router.push("/admin/branch/treatments/new")
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            의료진, 장비 및 시술
          </h1>
          <p className="text-sm text-muted-foreground">
            의료진, 장비 및 시술 항목 관리
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="rounded-xl bg-muted p-1">
            <TabsTrigger
              value="doctors"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <Users className="mr-2 h-4 w-4" />
              의료진 ({activeDoctorCount})
            </TabsTrigger>
            <TabsTrigger
              value="equipment"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <Cpu className="mr-2 h-4 w-4" />
              장비 ({activeEquipmentCount})
            </TabsTrigger>
            <TabsTrigger
              value="treatments"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              시술 ({branchTreatments.length})
            </TabsTrigger>
          </TabsList>

          <Button
            className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleAddNew}
          >
            <Plus className="h-4 w-4" />
            새로 추가
          </Button>
        </div>

        {/* Search and Filters — Doctors tab */}
        {activeTab === "doctors" && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl pl-10"
              />
            </div>

            {/* Status filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-xl">
                  <Filter className="h-4 w-4" />
                  {statusFilter === "all"
                    ? "전체 상태"
                    : statusFilter === "published"
                    ? "공개"
                    : statusFilter === "draft"
                    ? "초안"
                    : "숨김"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setStatusFilter("all")}>
                  전체 상태
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setStatusFilter("published")}>
                  공개
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setStatusFilter("draft")}>
                  초안
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setStatusFilter("hidden")}>
                  숨김
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Featured filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-xl">
                  <Star className="h-4 w-4" />
                  {featuredFilter === "all" ? "전체" : "대표노출"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setFeaturedFilter("all")}>
                  전체
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setFeaturedFilter("featured")}>
                  대표노출만
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-xl">
                  <Clock className="h-4 w-4" />
                  {sortBy === "updatedAt" ? "수정일" : sortBy === "name" ? "이름" : "상태"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setSortBy("updatedAt")}>
                  수정일순
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setSortBy("name")}>
                  이름순
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setSortBy("status")}>
                  상태순
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Search and Filters — Equipment tab */}
        {activeTab === "equipment" && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="장비명, 카테고리, 제조사 검색..."
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                className="rounded-xl pl-10"
              />
            </div>

            {/* Status filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-xl">
                  <Filter className="h-4 w-4" />
                  {equipmentStatusFilter === "all"
                    ? "전체 상태"
                    : equipmentStatusFilter === "published"
                    ? "공개"
                    : equipmentStatusFilter === "draft"
                    ? "초안"
                    : "숨김"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setEquipmentStatusFilter("all")}>
                  전체 상태
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setEquipmentStatusFilter("published")}>
                  공개
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setEquipmentStatusFilter("draft")}>
                  초안
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setEquipmentStatusFilter("hidden")}>
                  숨김
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Featured filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-xl">
                  <Star className="h-4 w-4" />
                  {equipmentFeaturedFilter === "all" ? "전체" : "대표노출"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setEquipmentFeaturedFilter("all")}>
                  전체
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setEquipmentFeaturedFilter("featured")}>
                  대표노출만
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Category filter */}
            {equipmentCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 rounded-xl">
                    <Cpu className="h-4 w-4" />
                    {equipmentCategoryFilter === "all" ? "전체 카테고리" : equipmentCategoryFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => setEquipmentCategoryFilter("all")}>
                    전체 카테고리
                  </DropdownMenuItem>
                  {equipmentCategories.map((cat) => (
                    <DropdownMenuItem
                      key={cat}
                      className="cursor-pointer rounded-lg"
                      onClick={() => setEquipmentCategoryFilter(cat)}
                    >
                      {cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Search — Treatments tab */}
        {activeTab === "treatments" && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl pl-10"
              />
            </div>
          </div>
        )}

        {/* Doctors Tab */}
        <TabsContent value="doctors" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">의료진</CardTitle>
              <CardDescription className="text-muted-foreground">
                이 지점에 {filteredDoctors.length}명의 의료진
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <DoctorCard
                    key={doctor.profile.id}
                    data={doctor}
                    onEdit={() => router.push(`/admin/branch/staff/${doctor.profile.id}`)}
                    onDuplicate={() => duplicateDoctor(doctor.profile.id)}
                    onTogglePublic={() =>
                      updateProfile(doctor.profile.id, { isPublic: !doctor.profile.isPublic })
                    }
                    onToggleFeatured={() =>
                      updateProfile(doctor.profile.id, { isFeatured: !doctor.profile.isFeatured })
                    }
                  />
                ))
              ) : (
                <div className="py-10 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {searchQuery || statusFilter !== "all" || featuredFilter !== "all"
                      ? "검색 조건에 맞는 의료진이 없습니다"
                      : "등록된 의료진이 없습니다"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {searchQuery || statusFilter !== "all" || featuredFilter !== "all"
                      ? "다른 검색어나 필터를 시도해 보세요"
                      : "아래 버튼을 눌러 첫 의료진을 등록하세요"}
                  </p>
                  {!(searchQuery || statusFilter !== "all" || featuredFilter !== "all") && (
                    <Button
                      variant="outline"
                      className="mt-4 rounded-xl"
                      onClick={() => router.push("/admin/branch/staff/new")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      + 첫 의료진 등록
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">의료 장비</CardTitle>
              <CardDescription className="text-muted-foreground">
                이 지점에 {filteredEquipment.length}대의 장비
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredEquipment.length > 0 ? (
                filteredEquipment.map((item) => (
                  <EquipmentCard
                    key={item.profile.id}
                    data={item}
                    onEdit={() => router.push(`/admin/branch/equipment/${item.profile.id}`)}
                    onDuplicate={() => duplicateEquipment(item.profile.id)}
                    onTogglePublic={() =>
                      updateEquipmentProfile(item.profile.id, {
                        isPublic: !item.profile.isPublic,
                        status: !item.profile.isPublic ? "published" : "hidden",
                      })
                    }
                    onToggleFeatured={() =>
                      updateEquipmentProfile(item.profile.id, { isFeatured: !item.profile.isFeatured })
                    }
                    onToggleTreatmentLike={() =>
                      updateEquipmentProfile(item.profile.id, { isTreatmentLike: !item.profile.isTreatmentLike })
                    }
                    onArchive={() => archiveEquipment(item.profile.id)}
                  />
                ))
              ) : (
                <div className="py-10 text-center">
                  <Cpu className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-medium text-foreground">
                    등록된 장비가 없습니다
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    + 새로 추가로 첫 장비를 등록하세요
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 rounded-xl"
                    onClick={() => router.push("/admin/branch/equipment/new")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    + 첫 장비 등록
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatments" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">시술 목록</CardTitle>
              <CardDescription className="text-muted-foreground">
                이 지점에 {filteredTreatments.length}개의 시술
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredTreatments.length > 0 ? (
                filteredTreatments.map((t) => (
                  <TreatmentCard
                    key={t.profile.id}
                    data={t}
                    onEdit={() => router.push(`/admin/branch/treatments/${t.profile.id}`)}
                    onDuplicate={() => duplicateTreatment(t.profile.id)}
                    onTogglePublic={() =>
                      updateTreatmentProfile(t.profile.id, { isPublic: !t.profile.isPublic })
                    }
                    onToggleFeatured={() =>
                      updateTreatmentProfile(t.profile.id, { isFeatured: !t.profile.isFeatured })
                    }
                    onArchive={() => archiveTreatment(t.profile.id)}
                  />
                ))
              ) : (
                <div className="py-8 text-center">
                  <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchQuery ? "검색 결과에 일치하는 시술이 없습니다" : "등록된 시술이 없습니다"}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 rounded-xl"
                    onClick={() => router.push("/admin/branch/treatments/new")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    시술 추가
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
