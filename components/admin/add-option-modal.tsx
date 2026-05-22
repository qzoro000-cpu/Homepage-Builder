"use client"

import { useState, useEffect } from "react"
import {
  Phone,
  Link as LinkIcon,
  MessageSquare,
  MapPin,
  Globe,
  Smartphone,
  Calendar,
  Mail,
  Hash,
  X,
  Check,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useOptions } from "@/lib/option-context"
import { OptionItem } from "@/lib/option-system"
import { cn } from "@/lib/utils"

// ─── 아이콘 선택 목록 ─────────────────────────────────────────────────────────

const ICON_OPTIONS = [
  { name: "Phone", icon: Phone, label: "전화" },
  { name: "Link", icon: LinkIcon, label: "링크" },
  { name: "MessageSquare", icon: MessageSquare, label: "메시지" },
  { name: "MapPin", icon: MapPin, label: "지도" },
  { name: "Globe", icon: Globe, label: "웹" },
  { name: "Smartphone", icon: Smartphone, label: "앱" },
  { name: "Calendar", icon: Calendar, label: "캘린더" },
  { name: "Mail", icon: Mail, label: "이메일" },
  { name: "Hash", icon: Hash, label: "기타" },
]

// ─── Props ────────────────────────────────────────────────────────────────────

type AddOptionModalProps = {
  open: boolean
  onClose: () => void
  groupKey: string          // 어느 그룹에 추가할지 (예: "booking_channel")
  currentBranchId?: string  // 지점 전용 옵션 추가 시
  onAdded?: (item: OptionItem) => void  // 추가 완료 콜백
}

// ─── 키 자동 생성 ─────────────────────────────────────────────────────────────

function autoKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_가-힣]/g, "")
    .slice(0, 30)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddOptionModal({
  open,
  onClose,
  groupKey,
  currentBranchId,
  onAdded,
}: AddOptionModalProps) {
  const { groups, items, addItem } = useOptions()

  const group = groups.find((g) => g.key === groupKey)

  const [label, setLabel] = useState("")
  const [key, setKey] = useState("")
  const [keyManual, setKeyManual] = useState(false)
  const [description, setDescription] = useState("")
  const [iconName, setIconName] = useState("Globe")
  const [scope, setScope] = useState<"global" | "branch">("global")
  const [requiresUrl, setRequiresUrl] = useState(false)
  const [requiresPhone, setRequiresPhone] = useState(false)
  const [inputLabel, setInputLabel] = useState("")
  const [placeholder, setPlaceholder] = useState("")
  const [sortOrder, setSortOrder] = useState<number>(
    Math.max(0, ...items.filter((i) => i.groupId === group?.id).map((i) => i.sortOrder)) + 1
  )
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 라벨 변경 시 키 자동 생성
  useEffect(() => {
    if (!keyManual) {
      setKey(autoKey(label))
    }
  }, [label, keyManual])

  // 모달 열릴 때 sortOrder 재계산
  useEffect(() => {
    if (open && group) {
      const maxOrder = Math.max(0, ...items.filter((i) => i.groupId === group.id).map((i) => i.sortOrder))
      setSortOrder(maxOrder + 1)
    }
  }, [open, group, items])

  function reset() {
    setLabel("")
    setKey("")
    setKeyManual(false)
    setDescription("")
    setIconName("Globe")
    setScope("global")
    setRequiresUrl(false)
    setRequiresPhone(false)
    setInputLabel("")
    setPlaceholder("")
    setIsActive(true)
    setErrors({})
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!label.trim()) e.label = "표시 라벨을 입력하세요"
    if (!key.trim()) e.key = "내부 키를 입력하세요"
    const keyRegex = /^[a-z0-9_]+$/
    if (key && !keyRegex.test(key)) e.key = "영소문자, 숫자, 언더스코어만 사용 가능합니다"
    if (key && items.some((i) => i.key === key && i.groupId === group?.id)) {
      e.key = "이미 사용 중인 키입니다"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate() || !group) return

    const newItem = addItem({
      groupId: group.id,
      key: key.trim(),
      label: label.trim(),
      description: description.trim() || undefined,
      iconName,
      sortOrder,
      isDefault: false,
      isActive,
      isSystem: false,
      branchId: scope === "branch" ? currentBranchId : undefined,
      metadata: {
        requiresUrl: requiresUrl || undefined,
        requiresPhone: requiresPhone || undefined,
        inputLabel: inputLabel.trim() || undefined,
        placeholder: placeholder.trim() || undefined,
      },
    })

    onAdded?.(newItem)
    reset()
    onClose()
  }

  function handleClose() {
    reset()
    onClose()
  }

  const SelectedIcon = ICON_OPTIONS.find((o) => o.name === iconName)?.icon ?? Globe

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">예약 방식 추가</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {group?.name ?? "옵션"} 그룹에 새 채널을 추가합니다.
            추가된 옵션은 모든 지점 화면에서 즉시 선택 가능합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 표시 라벨 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              표시 라벨 <span className="text-destructive text-xs font-semibold">필수</span>
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예: 채널톡, 바비톡, 카카오 예약"
              className={cn("rounded-xl", errors.label && "border-destructive")}
            />
            {errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
          </div>

          {/* 내부 키 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                내부 키 <span className="text-destructive text-xs font-semibold">필수</span>
              </Label>
              <button
                type="button"
                onClick={() => setKeyManual(!keyManual)}
                className="text-xs text-primary hover:underline"
              >
                {keyManual ? "자동 생성" : "직접 입력"}
              </button>
            </div>
            <Input
              value={key}
              onChange={(e) => { setKeyManual(true); setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")) }}
              placeholder="예: channel_talk"
              className={cn("rounded-xl font-mono text-sm", errors.key && "border-destructive")}
              readOnly={!keyManual}
            />
            {errors.key
              ? <p className="text-xs text-destructive">{errors.key}</p>
              : <p className="text-xs text-muted-foreground">영소문자·숫자·언더스코어만 사용 가능</p>
            }
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">설명 (선택)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이 채널에 대한 간단한 설명"
              className="rounded-xl resize-none min-h-[60px] text-sm"
            />
          </div>

          {/* 아이콘 선택 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">아이콘</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const active = iconName === opt.name
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setIconName(opt.name)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-2 w-14 transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px]">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 적용 범위 */}
          {currentBranchId && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">적용 범위</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["global", "branch"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      scope === s
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {scope === s && <Check className="h-3 w-3 text-primary" />}
                      <span className="text-sm font-medium">
                        {s === "global" ? "전체 지점 공통" : "현재 지점만"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s === "global"
                        ? "모든 지점에서 선택 가능"
                        : "이 지점에서만 노출됨"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 추가 입력 필요 여부 */}
          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm font-medium text-foreground">선택 시 입력 필드</p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">URL 입력 필요</p>
                <p className="text-xs text-muted-foreground">선택 시 링크 입력 필드 노출</p>
              </div>
              <Switch checked={requiresUrl} onCheckedChange={(v) => { setRequiresUrl(v); if (v) setRequiresPhone(false) }} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">전화번호 입력 필요</p>
                <p className="text-xs text-muted-foreground">선택 시 전화번호 입력 필드 노출</p>
              </div>
              <Switch checked={requiresPhone} onCheckedChange={(v) => { setRequiresPhone(v); if (v) setRequiresUrl(false) }} />
            </div>

            {(requiresUrl || requiresPhone) && (
              <div className="space-y-3 pt-1 border-t border-border">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">입력 필드 레이블</Label>
                  <Input
                    value={inputLabel}
                    onChange={(e) => setInputLabel(e.target.value)}
                    placeholder={requiresUrl ? "예: 예약 링크" : "예: 상담 전화번호"}
                    className="rounded-lg h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">플레이스홀더</Label>
                  <Input
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                    placeholder={requiresUrl ? "https://..." : "010-0000-0000"}
                    className="rounded-lg h-8 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 활성 여부 */}
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">즉시 활성화</p>
              <p className="text-xs text-muted-foreground">비활성 상태로 추가하면 선택 목록에 미노출</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* 미리보기 배지 */}
          {label && (
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-2">추가 후 칩 미리보기</p>
              <div className="flex items-center gap-1.5 rounded-xl border border-primary bg-primary/5 px-3 py-1.5 w-fit">
                <Check className="h-3 w-3 text-primary" />
                <SelectedIcon className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm text-primary font-medium">{label}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} className="rounded-xl">
            취소
          </Button>
          <Button onClick={handleSubmit} className="rounded-xl gap-2">
            <Check className="h-4 w-4" />
            옵션 추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
