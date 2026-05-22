"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Save, Check, ArrowLeft, Cpu, AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useEquipment } from "@/lib/equipment-store"
import { useBranch } from "../../../layout"
import { cn } from "@/lib/utils"

const CATEGORY_PRESETS = [
  "고주파", "레이저", "피코레이저", "초음파", "냉각지방분해",
  "미세침", "RF", "IPL", "리프팅", "보톡스장비", "기타",
]

export default function NewEquipmentPage() {
  const router = useRouter()
  const { selectedBranch } = useBranch()
  const { createEquipment } = useEquipment()

  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [manufacturer, setManufacturer] = useState("")
  const [oneLinePitch, setOneLinePitch] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isTreatmentLike, setIsTreatmentLike] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = "장비명을 입력하세요"
    if (!category.trim()) e.category = "카테고리를 선택하거나 입력하세요"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleCreate() {
    if (!validate()) return
    setIsSaving(true)

    const newEquipment = createEquipment(selectedBranch, {
      name: name.trim(),
      category: category.trim(),
      manufacturer: manufacturer.trim() || undefined,
      oneLinePitch: oneLinePitch.trim() || undefined,
      isPublic,
      isFeatured,
      isTreatmentLike,
      status: "draft",
    })

    router.push(`/admin/branch/equipment/${newEquipment.profile.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/branch/equipment")}
          className="rounded-xl gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          장비 목록
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Cpu className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">새 장비 추가</h1>
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
          {/* 장비명 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">장비명</Label>
              <span className="text-xs text-destructive font-semibold">필수</span>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 울쎄라, 써마지 FLX"
              className={cn("rounded-xl", errors.name && "border-destructive")}
            />
            {errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />{errors.name}
              </p>
            )}
          </div>

          {/* 카테고리 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">장비 카테고리</Label>
              <span className="text-xs text-destructive font-semibold">필수</span>
            </div>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="예: 고주파, 레이저"
              className={cn("rounded-xl", errors.category && "border-destructive")}
            />
            {errors.category && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />{errors.category}
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

          {/* 제조사 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">제조사 / 브랜드 (선택)</Label>
            <Input
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="예: Merz, Cutera, Inmode"
              className="rounded-xl"
            />
          </div>

          {/* 한 줄 어필 문구 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">한 줄 어필 문구 (선택)</Label>
            <div className="relative">
              <Input
                value={oneLinePitch}
                onChange={(e) => setOneLinePitch(e.target.value)}
                maxLength={60}
                placeholder="예: 600샷 탄력·윤곽 관리 특화 고주파 리프팅"
                className="rounded-xl pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {oneLinePitch.length}/60
              </span>
            </div>
          </div>

          {/* 스위치 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">대표 노출</p>
                <p className="text-xs text-muted-foreground">홈페이지 상단</p>
              </div>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">시술형 노출</p>
                <p className="text-xs text-muted-foreground">시술처럼 표시</p>
              </div>
              <Switch checked={isTreatmentLike} onCheckedChange={setIsTreatmentLike} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">즉시 공개</p>
                <p className="text-xs text-muted-foreground">기본: 초안</p>
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
              <p className="text-sm font-medium text-foreground">저장 후 자산 업로드 가능</p>
              <p className="text-xs text-muted-foreground">
                저장하면 이미지, PDF 브로슈어, 시술 영상 등을 업로드하고
                효과 태그, 연결 시술, 지점 운영 정보를 상세 편집할 수 있습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/branch/equipment")}
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
    </div>
  )
}
