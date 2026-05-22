"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Save,
  Check,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  BookOpen,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useTreatment } from "@/lib/treatment-store"
import { useBranch } from "@/app/admin/layout"
import { cn } from "@/lib/utils"

const CATEGORY_PRESETS = [
  "리프팅",
  "레이저",
  "RF 리프팅",
  "보톡스",
  "필러",
  "미세침 RF",
  "피부관리",
  "기타",
]

export default function NewTreatmentPage() {
  const router = useRouter()
  const { selectedBranch } = useBranch()
  const { createTreatment, getAllMasters, createTreatmentFromMaster } = useTreatment()

  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [oneLinePitch, setOneLinePitch] = useState("")
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadingMasterId, setLoadingMasterId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const masters = getAllMasters()

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = "시술명을 입력하세요"
    if (!category.trim()) e.category = "카테고리를 선택하거나 입력하세요"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleCreate() {
    if (!validate()) return
    setIsSaving(true)

    const newTreatment = createTreatment(selectedBranch, {
      name: name.trim(),
      category: category.trim(),
      oneLinePitch: oneLinePitch.trim() || undefined,
      isFeatured,
      isPublic,
      status: isPublic ? "published" : "draft",
    })

    router.push(`/admin/branch/treatments/${newTreatment.profile.id}`)
  }

  function handleLoadFromMaster(masterId: string) {
    setLoadingMasterId(masterId)
    const newTreatment = createTreatmentFromMaster(selectedBranch, masterId)
    router.push(`/admin/branch/treatments/${newTreatment.profile.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/branch/treatments")}
          className="rounded-xl gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          시술 목록
        </Button>
      </div>

      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">새 시술 추가</h1>
          <p className="text-sm text-muted-foreground">
            기본 정보를 입력하고 저장하면 상세 편집 페이지로 이동합니다
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-foreground">기본 정보</CardTitle>
          <CardDescription className="text-muted-foreground">
            최소 필수 정보를 입력하면 됩니다. 상세 정보는 이후 편집할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 시술명 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">시술명</Label>
              <span className="text-xs text-destructive font-semibold">필수</span>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 울쎄라 리프팅, 보톡스, 피코슈어"
              className={cn("rounded-xl", errors.name && "border-destructive")}
            />
            {errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* 카테고리 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">카테고리</Label>
              <span className="text-xs text-destructive font-semibold">필수</span>
            </div>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="예: 리프팅, 레이저, 보톡스"
              className={cn("rounded-xl", errors.category && "border-destructive")}
            />
            {errors.category && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.category}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {CATEGORY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCategory(preset)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs transition-all",
                    category === preset
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 한 줄 설명 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">한 줄 설명 (선택)</Label>
            <div className="relative">
              <Input
                value={oneLinePitch}
                onChange={(e) => setOneLinePitch(e.target.value)}
                maxLength={60}
                placeholder="예: FDA 승인 초음파 리프팅으로 자연스러운 타이트닝"
                className="rounded-xl pr-16"
              />
              <span
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                  oneLinePitch.length >= 60
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {oneLinePitch.length}/60
              </span>
            </div>
          </div>

          {/* 스위치 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">대표 노출</p>
                <p className="text-xs text-muted-foreground">홈페이지 상단 강조</p>
              </div>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">즉시 공개</p>
                <p className="text-xs text-muted-foreground">기본: 초안으로 저장</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-2.5">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">저장 후 상세 편집 가능</p>
              <p className="text-xs text-muted-foreground">
                저장하면 가격 정보, 시술 프로그램, 주의사항, 자산(이미지·영상),
                랜딩 섹션, 연결 장비 등을 상세 편집 페이지에서 관리할 수 있습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pb-2">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/branch/treatments")}
          className="rounded-xl gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          취소
        </Button>
        <Button
          onClick={handleCreate}
          disabled={isSaving}
          className="rounded-xl gap-2"
        >
          {isSaving ? (
            <><Check className="h-4 w-4" />저장 중...</>
          ) : (
            <><Save className="h-4 w-4" />저장 후 상세 편집</>
          )}
        </Button>
      </div>

      {/* Master treatments section */}
      {masters.length > 0 && (
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">본사 시술 불러오기</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground text-xs">
              본사에서 미리 구성한 시술을 불러오면 기본 정보·주의사항·혜택 태그가 자동 입력됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {masters.map((master) => (
              <button
                key={master.id}
                type="button"
                disabled={loadingMasterId === master.id}
                onClick={() => handleLoadFromMaster(master.id)}
                className={cn(
                  "group w-full flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5",
                  loadingMasterId === master.id && "opacity-60 pointer-events-none"
                )}
              >
                {/* Category badge */}
                <Badge
                  variant="outline"
                  className="shrink-0 text-xs bg-muted text-muted-foreground"
                >
                  {master.category}
                </Badge>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{master.name}</p>
                  {master.defaultOneLinePitch && (
                    <p className="text-xs text-muted-foreground truncate">
                      {master.defaultOneLinePitch}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="pb-6" />
    </div>
  )
}
