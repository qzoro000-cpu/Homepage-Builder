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
  Sparkles,
  Archive,
  Clock,
  ChevronRight,
  Filter,
  SortAsc,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useTreatment, TreatmentData } from "@/lib/treatment-store"
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
// Category badge color
// ---------------------------------------------------------------------------

function getCategoryClass(category: string): string {
  const map: Record<string, string> = {
    "리프팅": "bg-blue-50 text-blue-700 border-blue-200",
    "레이저": "bg-violet-50 text-violet-700 border-violet-200",
    "보톡스": "bg-amber-50 text-amber-700 border-amber-200",
    "필러": "bg-rose-50 text-rose-700 border-rose-200",
    "RF 리프팅": "bg-teal-50 text-teal-700 border-teal-200",
    "RF": "bg-teal-50 text-teal-700 border-teal-200",
    "미세침 RF": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "피부관리": "bg-green-50 text-green-700 border-green-200",
    "기타": "bg-muted text-muted-foreground",
  }
  return map[category] ?? "bg-muted text-muted-foreground"
}

// ---------------------------------------------------------------------------
// Price formatting
// ---------------------------------------------------------------------------

function formatKoreanPrice(amount: number): string {
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000)
    const rest = amount % 10000
    if (rest === 0) return `${man}만원`
    return `${man}만 ${rest.toLocaleString()}원`
  }
  return `${amount.toLocaleString()}원`
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
  const { profile, benefits, assets, linkedEquipmentIds } = data

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

  const displayPrice = (() => {
    if (profile.useConsultInquiry) return "가격문의"
    const price = profile.priceEvent ?? profile.priceRegular
    if (!price) return "가격문의"
    return formatKoreanPrice(price)
  })()

  const visibleBenefits = benefits.slice(0, 3)

  return (
    <div
      className="group relative flex items-start gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm cursor-pointer"
      onClick={onEdit}
    >
      {/* Category badge column */}
      <div className="shrink-0 pt-0.5">
        <Badge
          variant="outline"
          className={cn("text-xs font-medium", getCategoryClass(profile.category))}
        >
          {profile.category}
        </Badge>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Row 1: name + badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground">{profile.name}</span>
          {profile.isFeatured && (
            <Star className="h-3.5 w-3.5 fill-warning text-warning shrink-0" />
          )}
          {profile.isLandingPublic && (
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0 bg-violet-50 text-violet-700 border-violet-200"
            >
              랜딩
            </Badge>
          )}
          <StatusBadge status={profile.status} />
        </div>

        {/* Row 2: one-line pitch */}
        {profile.oneLinePitch && (
          <p className="text-xs text-muted-foreground truncate max-w-sm">
            {profile.oneLinePitch}
          </p>
        )}

        {/* Row 3: price + duration */}
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-foreground">{displayPrice}</span>
          {profile.durationMinutes && (
            <span className="text-xs text-muted-foreground">{profile.durationMinutes}분</span>
          )}
        </div>

        {/* Row 4: benefit tags */}
        {visibleBenefits.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {visibleBenefits.map((b) => (
              <span
                key={b}
                className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {b}
              </span>
            ))}
          </div>
        )}

        {/* Row 5: meta */}
        <div className="flex items-center gap-3 pt-0.5">
          <span className="text-xs text-muted-foreground">
            연결 장비 {linkedEquipmentIds.length}개
          </span>
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
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => { e.stopPropagation(); onEdit() }}
            >
              <Pencil className="mr-2 h-4 w-4" />수정
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => { e.stopPropagation(); onDuplicate() }}
            >
              <Copy className="mr-2 h-4 w-4" />복제
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => { e.stopPropagation(); onTogglePublic() }}
            >
              {profile.isPublic ? (
                <><EyeOff className="mr-2 h-4 w-4" />비공개로 전환</>
              ) : (
                <><Eye className="mr-2 h-4 w-4" />공개로 전환</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg"
              onClick={(e) => { e.stopPropagation(); onToggleFeatured() }}
            >
              {profile.isFeatured ? (
                <><StarOff className="mr-2 h-4 w-4" />대표노출 해제</>
              ) : (
                <><Star className="mr-2 h-4 w-4" />대표노출 설정</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer rounded-lg text-destructive"
              onClick={(e) => { e.stopPropagation(); onArchive() }}
            >
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

type SortKey = "updated" | "name" | "price"
type StatusFilterValue = "all" | "published" | "draft" | "hidden"

export default function TreatmentListPage() {
  const router = useRouter()
  const { selectedBranch } = useBranch()
  const {
    getTreatmentsByBranch,
    archiveTreatment,
    duplicateTreatment,
    updateProfile,
  } = useTreatment()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [hasLandingFilter, setHasLandingFilter] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("updated")

  const branchTreatments = getTreatmentsByBranch(selectedBranch)
  const activeCount = branchTreatments.filter((t) => t.profile.status !== "archived").length
  const publishedCount = branchTreatments.filter(
    (t) => t.profile.status === "published" && t.profile.isPublic
  ).length
  const featuredCount = branchTreatments.filter(
    (t) => t.profile.isFeatured && t.profile.status !== "archived"
  ).length

  const categories = Array.from(
    new Set(branchTreatments.map((t) => t.profile.category))
  )

  const filtered = branchTreatments
    .filter((t) => {
      // Hide archived unless explicitly viewing archived
      if (statusFilter === "all" && t.profile.status === "archived") return false
      return true
    })
    .filter((t) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        t.profile.name.toLowerCase().includes(q) ||
        t.profile.category.toLowerCase().includes(q) ||
        (t.profile.oneLinePitch ?? "").toLowerCase().includes(q)
      )
    })
    .filter((t) => {
      if (statusFilter === "all") return true
      return t.profile.status === statusFilter
    })
    .filter((t) => {
      if (featuredFilter === "all") return true
      return t.profile.isFeatured
    })
    .filter((t) => {
      if (categoryFilter === "all") return true
      return t.profile.category === categoryFilter
    })
    .filter((t) => {
      if (!hasLandingFilter) return true
      return t.profile.hasLandingPage
    })
    .sort((a, b) => {
      if (sortKey === "name") {
        return a.profile.name.localeCompare(b.profile.name, "ko")
      }
      if (sortKey === "price") {
        const priceA = a.profile.priceEvent ?? a.profile.priceRegular ?? 0
        const priceB = b.profile.priceEvent ?? b.profile.priceRegular ?? 0
        return priceB - priceA
      }
      // updated (default)
      return new Date(b.profile.updatedAt).getTime() - new Date(a.profile.updatedAt).getTime()
    })

  function handleTogglePublic(data: TreatmentData) {
    updateProfile(data.profile.id, { isPublic: !data.profile.isPublic })
  }

  function handleToggleFeatured(data: TreatmentData) {
    updateProfile(data.profile.id, { isFeatured: !data.profile.isFeatured })
  }

  const hasActiveFilters =
    search ||
    statusFilter !== "all" ||
    featuredFilter !== "all" ||
    categoryFilter !== "all" ||
    hasLandingFilter

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">시술 관리</h1>
          <p className="text-sm text-muted-foreground">
            지점 시술을 등록하고 홈페이지·랜딩·챗봇 노출을 관리합니다
          </p>
        </div>
        <Button
          className="gap-2 rounded-xl"
          onClick={() => router.push("/admin/branch/treatments/new")}
        >
          <Plus className="h-4 w-4" />
          새 시술 추가
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">전체 활성 시술</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10">
              <Eye className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{publishedCount}</p>
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
              <p className="text-2xl font-semibold">{featuredCount}</p>
              <p className="text-xs text-muted-foreground">대표 노출</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="시술명, 카테고리, 한 줄 설명 검색..."
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
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

        {/* Landing filter */}
        <button
          onClick={() => setHasLandingFilter(!hasLandingFilter)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all",
            hasLandingFilter
              ? "bg-violet-50 text-violet-700 border-violet-300"
              : "border-border text-muted-foreground hover:border-primary hover:text-primary"
          )}
        >
          랜딩 있음
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

        {/* Sort */}
        <div className="ml-auto flex items-center gap-1.5">
          <SortAsc className="h-3.5 w-3.5 text-muted-foreground" />
          {(["updated", "name", "price"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortKey(s)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs transition-all",
                sortKey === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              {{ updated: "최근수정순", name: "이름순", price: "가격순" }[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Treatment list */}
      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              시술 목록
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {filtered.length}개
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "검색 조건에 맞는 시술이 없습니다"
                  : "아직 등록된 시술이 없습니다"}
              </p>
              {!hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl gap-2"
                  onClick={() => router.push("/admin/branch/treatments/new")}
                >
                  <Plus className="h-4 w-4" />
                  첫 시술 추가하기
                </Button>
              )}
            </div>
          ) : (
            filtered.map((t) => (
              <TreatmentCard
                key={t.profile.id}
                data={t}
                onEdit={() => router.push(`/admin/branch/treatments/${t.profile.id}`)}
                onDuplicate={() => duplicateTreatment(t.profile.id)}
                onTogglePublic={() => handleTogglePublic(t)}
                onToggleFeatured={() => handleToggleFeatured(t)}
                onArchive={() => archiveTreatment(t.profile.id)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
