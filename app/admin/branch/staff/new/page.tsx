"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Save, Check, ArrowLeft, UserPlus, AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useStaff } from "@/lib/staff-store"
import { useBranch } from "../../../layout"
import { cn } from "@/lib/utils"

const TITLE_PRESETS = ["대표원장", "원장", "부원장", "진료원장", "전임의", "원장님"]

export default function NewStaffPage() {
  const router = useRouter()
  const { selectedBranch } = useBranch()
  const { createDoctor } = useStaff()

  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [oneLinePitch, setOneLinePitch] = useState("")
  const [shortIntro, setShortIntro] = useState("")
  const [consultUrl, setConsultUrl] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = "이름을 입력하세요"
    if (!title.trim()) e.title = "직책/호칭을 입력하세요"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleCreate() {
    if (!validate()) return
    setIsSaving(true)

    const newDoctor = createDoctor(selectedBranch, {
      name: name.trim(),
      title: title.trim(),
      oneLinePitch: oneLinePitch.trim() || undefined,
      shortIntro: shortIntro.trim() || undefined,
      consultUrl: consultUrl.trim() || undefined,
      isPublic,
      isFeatured,
      status: "draft",
    })

    // 생성 완료 → 상세 페이지로 이동
    router.push(`/admin/branch/staff/${newDoctor.profile.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/branch/doctors")}
          className="rounded-xl gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          의료진 목록
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <UserPlus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">새 의료진 추가</h1>
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
            최소 필수 정보를 입력하면 됩니다. 나머지 상세 정보는 이후 편집할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 이름 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">이름</Label>
              <span className="text-xs text-destructive font-semibold">필수</span>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 김민지"
              className={cn("rounded-xl", errors.name && "border-destructive")}
            />
            {errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />{errors.name}
              </p>
            )}
          </div>

          {/* 직책 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">직책 / 호칭</Label>
              <span className="text-xs text-destructive font-semibold">필수</span>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 대표원장"
              className={cn("rounded-xl", errors.title && "border-destructive")}
            />
            {errors.title && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />{errors.title}
              </p>
            )}
            {/* 직책 프리셋 */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {TITLE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs transition-all",
                    title === preset
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 한 줄 어필 문구 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">한 줄 어필 문구 (선택)</Label>
            <div className="relative">
              <Input
                value={oneLinePitch}
                onChange={(e) => setOneLinePitch(e.target.value)}
                maxLength={60}
                placeholder="예: 자연스러운 결과를 추구하는 비수술 전문 원장"
                className="rounded-xl pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {oneLinePitch.length}/60
              </span>
            </div>
          </div>

          {/* 짧은 소개 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">짧은 소개 (선택)</Label>
            <Textarea
              value={shortIntro}
              onChange={(e) => setShortIntro(e.target.value)}
              placeholder="예: 강남 소재 타토아 클리닉 소속 피부과 전문의&#10;여러 줄 입력 가능"
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>

          {/* 상담 예약 URL */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">상담 예약 URL (선택)</Label>
            <Input
              type="url"
              value={consultUrl}
              onChange={(e) => setConsultUrl(e.target.value)}
              placeholder="https://booking.example.com"
              className="rounded-xl"
            />
          </div>

          {/* 스위치들 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">대표 노출</p>
                <p className="text-xs text-muted-foreground">홈페이지 상단 노출</p>
              </div>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">즉시 공개</p>
                <p className="text-xs text-muted-foreground">기본값: 초안</p>
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
                저장하면 경력, 학회, 논문, 수상, 연결 시술 등 상세 정보를 입력할 수 있는 페이지로 이동합니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/branch/doctors")}
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
