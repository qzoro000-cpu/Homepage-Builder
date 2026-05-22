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
  Cpu,
  Sparkles,
  Archive,
  Clock,
  ChevronRight,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEquipment, EquipmentData } from "@/lib/equipment-store"
import { useBranch } from "../../layout"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    published: { label: "공개", className: "bg-success/10 text-success border-success/20" },
    draft: { label: "초안", className: "bg-muted text-muted-foreground" },
    hidden: { label: "숨김", className: "bg-amber-50 text-amber-700 border-amber-200" },
    archived: { label: "보관됨", className: "bg-red-50 text-red-600 border-red-200" },
    needs_review: { label: "검토필요", className: "bg-blue-50 text-blue-700 border-blue-200" },
  }
  const { label, className } = config[status] ?? config.draft
  return (
    <Badge variant="outline" className={cn("text-xs", className)}>
      {label}
    </Badge>
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
      return (
        d.getHours().toString().padStart(2, "0") +
        ":" +
        d.getMinutes().toString().padStart(2, "0")
      )
    } catch {
      return ""
    }
  })()

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
        {/* Row 1 */}
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
          {profile.manufacturer && <span>({profile.manufacturer})</span>}
        </div>

        {/* Row 3: one-line pitch */}
        {profile.oneLinePitch && (
          <p className="text-xs text-muted-foreground truncate max-w-sm">{profile.oneLinePitch}</p>
        )}

        {/* Row 4: meta */}
        <div className="flex items-center gap-3 pt-0.5">
          <span className="text-xs text-muted-foreground">연결 시술 {linkedTreatmentIds.length}개</span>
          <span className="text-xs text-muted-foreground">자산 {assets.length}개</span>
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
            <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={(e) => { e.stopPropagation(); onEdit() }}>
              <Pencil className="mr-2 h-4 w-4" />수정
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={(e) => { e.stopPropagation(); onDuplicate() }}>
              <Copy className="mr-2 h-4 w-4" />복제
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={(e) => { e.stopPropagation(); onTogglePublic() }}>
              {profile.isPublic ? (
                <><EyeOff className="mr-2 h-4 w-4" />비공개로 전환</>
              ) : (
                <><Eye className="mr-2 h-4 w-4" />공개로 전환</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={(e) => { e.stopPropagation(); onToggleFeatured() }}>
              {profile.isFeatured ? (
                <><StarOff className="mr-2 h-4 w-4" />대표노출 해제</>
              ) : (
                <><Star className="mr-2 h-4 w-4" />대표노출 설정</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={(e) => { e.stopPropagation(); onToggleTreatmentLike() }}>
              <Sparkles className="mr-2 h-4 w-4" />
              {profile.isTreatmentLike ? "시술형 해제" : "시술형 설정"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer rounded-lg text-destructive" onClick={(e) => { e.stopPropagation(); onArchive() }}>
              <Archive className="mr-2 h-4 w-4" />보관
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

export default function EquipmentListPage() {
  const router = useRouter()
  const { selectedBranch } = useBranch()
  const {
    getEquipmentByBranch,
    archiveEquipment,
    duplicateEquipment,
    updateProfile,
  } = useEquipment()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "hidden">("all")
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const branchEquipment = getEquipmentByBranch(selectedBranch)
  const activeCount = branchEquipment.filter((e) => e.profile.status !== "archived").length
  const categories = Array.from(new Set(branchEquipment.map((e) => e.profile.category)))

  const filtered = branchEquipment
    .filter((e) => {
      if (statusFilter === "all" && e.profile.status === "archived") return false
      return true
    })
    .filter((e) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        e.profile.name.toLowerCase().includes(q) ||
        e.profile.category.toLowerCase().includes(q) ||
        (e.profile.manufacturer ?? "").toLowerCase().includes(q)
      )
    })
    .filter((e) => {
      if (statusFilter === "all") return true
      return e.profile.status === statusFilter
    })
    .filter((e) => {
      if (featuredFilter === "all") return true
      return e.profile.isFeatured
    })
    .filter((e) => {
      if (categoryFilter === "all") return true
      return e.profile.category === categoryFilter
    })

  function handleTogglePublic(data: EquipmentData) {
    updateProfile(data.profile.id, { isPublic: !data.profile.isPublic })
  }

  function handleToggleFeatured(data: EquipmentData) {
    updateProfile(data.profile.id, { isFeatured: !data.profile.isFeatured })
  }

  function handleToggleTreatmentLike(data: EquipmentData) {
    updateProfile(data.profile.id, { isTreatmentLike: !data.profile.isTreatmentLike })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">장비 관리</h1>
          <p className="text-sm text-muted-foreground">
            지점 장비를 등록하고 홈페이지·챗봇 노출을 관리합니다
          </p>
        </div>
        <Button
          className="gap-2 rounded-xl"
          onClick={() => router.push("/admin/branch/equipment/new")}
        >
          <Plus className="h-4 w-4" />
          새 장비 추가
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">전체 장비</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10">
              <Eye className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {branchEquipment.filter((e) => e.profile.isPublic && e.profile.status !== "archived").length}
              </p>
              <p className="text-xs text-muted-foreground">공개 중</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10">
              <Star className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {branchEquipment.filter((e) => e.profile.isFeatured && e.profile.status !== "archived").length}
              </p>
              <p className="text-xs text-muted-foreground">대표 노출</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="장비명, 카테고리, 제조사 검색..."
            className="pl-9 rounded-xl"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          {(["all", "published", "draft", "hidden"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs transition-all",
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              {{ all: "전체", published: "공개", draft: "초안", hidden: "숨김" }[s]}
            </button>
          ))}
        </div>

        {/* Featured filter */}
        <button
          onClick={() => setFeaturedFilter(featuredFilter === "all" ? "featured" : "all")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all",
            featuredFilter === "featured"
              ? "bg-warning/10 text-warning border-warning/40"
              : "border-border text-muted-foreground hover:border-primary hover:text-primary"
          )}
        >
          <Star className="h-3 w-3" />
          대표만
        </button>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs transition-all",
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Equipment list */}
      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              장비 목록
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {filtered.length}개
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Cpu className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== "all" || categoryFilter !== "all"
                  ? "검색 조건에 맞는 장비가 없습니다"
                  : "아직 등록된 장비가 없습니다"}
              </p>
              {!search && statusFilter === "all" && categoryFilter === "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl gap-2"
                  onClick={() => router.push("/admin/branch/equipment/new")}
                >
                  <Plus className="h-4 w-4" />
                  첫 장비 추가하기
                </Button>
              )}
            </div>
          ) : (
            filtered.map((eq) => (
              <EquipmentCard
                key={eq.profile.id}
                data={eq}
                onEdit={() => router.push(`/admin/branch/equipment/${eq.profile.id}`)}
                onDuplicate={() => duplicateEquipment(eq.profile.id)}
                onTogglePublic={() => handleTogglePublic(eq)}
                onToggleFeatured={() => handleToggleFeatured(eq)}
                onToggleTreatmentLike={() => handleToggleTreatmentLike(eq)}
                onArchive={() => archiveEquipment(eq.profile.id)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
