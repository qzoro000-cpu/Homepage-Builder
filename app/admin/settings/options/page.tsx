"use client"

import { useState, useMemo } from "react"
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
  Plus,
  Check,
  X,
  Edit3,
  Trash2,
  EyeOff,
  Eye,
  ChevronRight,
  AlertTriangle,
  Settings2,
  GripVertical,
  ArrowLeft,
  Shield,
  Info,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useOptions } from "@/lib/option-context"
import { OptionItem } from "@/lib/option-system"
import { AddOptionModal } from "@/components/admin/add-option-modal"
import { cn } from "@/lib/utils"

// ─── 아이콘 맵 ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Phone,
  Link: LinkIcon,
  MessageSquare,
  MapPin,
  Globe,
  Smartphone,
  Calendar,
  Mail,
  Hash,
}

function OptionIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name ? ICON_MAP[name] : null) ?? Hash
  return <Icon className={className} />
}

// ─── 편집 모달 ────────────────────────────────────────────────────────────────

function EditItemModal({
  item,
  open,
  onClose,
  onSave,
}: {
  item: OptionItem | null
  open: boolean
  onClose: () => void
  onSave: (id: string, updates: Partial<OptionItem>) => void
}) {
  const [label, setLabel] = useState(item?.label ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [sortOrder, setSortOrder] = useState<number>(item?.sortOrder ?? 0)

  // item 변경 시 초기화
  const init = () => {
    setLabel(item?.label ?? "")
    setDescription(item?.description ?? "")
    setSortOrder(item?.sortOrder ?? 0)
  }

  if (!item) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
        else init()
      }}
    >
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">옵션 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">표시 라벨</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="rounded-xl"
              disabled={item.isSystem}
            />
            {item.isSystem && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />시스템 옵션의 라벨은 수정할 수 없습니다
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none min-h-[60px] text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">정렬 순서</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="rounded-xl w-24"
              min={1}
            />
          </div>
          <div className="rounded-xl bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">읽기 전용 정보</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>내부 키</span>
              <span className="font-mono text-foreground">{item.key}</span>
              <span>적용 범위</span>
              <span>{item.branchId ? `지점 전용 (${item.branchId})` : "전체 공통"}</span>
              <span>시스템 여부</span>
              <span>{item.isSystem ? "예 (수정 제한)" : "아니오"}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">취소</Button>
          <Button
            onClick={() => {
              onSave(item.id, {
                label: item.isSystem ? item.label : label.trim(),
                description: description.trim() || undefined,
                sortOrder,
              })
              onClose()
            }}
            className="rounded-xl gap-2"
          >
            <Check className="h-4 w-4" />저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OptionsManagementPage() {
  const { groups, getGroup, getItemsByGroup, toggleItem, canDeleteItem, deleteItem, updateItem, isItemInUse } = useOptions()

  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<OptionItem | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const selectedGroup = selectedGroupKey ? getGroup(selectedGroupKey) : null
  const allGroupItems = useMemo(
    () => (selectedGroupKey ? getItemsByGroup(selectedGroupKey, true) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedGroupKey, groups]
  )
  // getItemsByGroup은 매 렌더마다 새 함수이므로 강제 deps로 items 길이 대신 groups로 대략 추적
  // 실제 운영에서는 useMemo deps를 items로 할 것

  const activeCount = allGroupItems.filter((i) => i.isActive).length
  const inactiveCount = allGroupItems.filter((i) => !i.isActive).length

  function handleDelete(id: string) {
    if (canDeleteItem(id)) {
      deleteItem(id)
    }
    setConfirmDeleteId(null)
  }

  // 그룹 목록 화면
  if (!selectedGroupKey) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">옵션 관리</h1>
          <p className="text-sm text-muted-foreground">
            CMS 전반의 선택형 옵션을 관리합니다. 예약 방식, 지점 배지, FAQ 카테고리 등을 여기서 정의합니다.
          </p>
        </div>

        {/* Info Banner */}
        <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">관리형 옵션 시스템</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  여기서 옵션 항목을 추가·수정·비활성화하면 각 지점 화면에 즉시 반영됩니다.
                  사용 중인 옵션은 물리 삭제 대신 비활성화만 가능합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Group Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const gItems = getItemsByGroup(group.key, true)
            const gActive = gItems.filter((i) => i.isActive).length
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroupKey(group.key)}
                className="text-left"
              >
                <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Settings2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-foreground">
                            {group.name}
                          </CardTitle>
                          {group.isSystem && (
                            <Badge variant="outline" className="text-xs bg-muted text-muted-foreground mt-1">
                              <Shield className="h-2.5 w-2.5 mr-1" />시스템
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      {group.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-success" />
                        <span className="text-muted-foreground">활성</span>
                        <span className="font-semibold text-foreground">{gActive}개</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />
                        <span className="text-muted-foreground">비활성</span>
                        <span className="font-semibold text-foreground">{gItems.length - gActive}개</span>
                      </div>
                    </div>
                    {group.usedIn.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {group.usedIn.map((u) => (
                          <Badge key={u} variant="outline" className="text-xs text-muted-foreground">
                            {u}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>

        {/* Future groups placeholder */}
        <Card className="rounded-2xl border-dashed border-border bg-muted/20 shadow-sm">
          <CardContent className="p-6 text-center">
            <Settings2 className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">향후 확장 예정</p>
            <p className="text-xs text-muted-foreground mt-1">
              지점 배지 · 특성 태그 · FAQ 카테고리 · 이벤트 노출 위치 등
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 그룹 상세 화면
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedGroupKey(null)}
          className="rounded-xl gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {selectedGroup?.name}
            </h1>
            {selectedGroup?.isSystem && (
              <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                <Shield className="h-2.5 w-2.5 mr-1" />시스템
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{selectedGroup?.description}</p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="rounded-xl gap-2"
        >
          <Plus className="h-4 w-4" />
          옵션 추가
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
              <Hash className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{allGroupItems.length}</p>
              <p className="text-xs text-muted-foreground">전체 옵션</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10">
              <Eye className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{activeCount}</p>
              <p className="text-xs text-muted-foreground">활성</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{inactiveCount}</p>
              <p className="text-xs text-muted-foreground">비활성</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Option Items */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">옵션 항목</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            비활성화한 옵션은 새 입력에는 표시되지 않지만, 기존 데이터는 유지됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {allGroupItems.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">옵션 항목이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {allGroupItems.map((item) => {
                const inUse = isItemInUse(item.key)
                const canDel = canDeleteItem(item.id)

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 transition-colors",
                      !item.isActive && "opacity-50"
                    )}
                  >
                    {/* 드래그 핸들 (시각적) */}
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-grab" />

                    {/* 아이콘 */}
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl shrink-0",
                      item.isActive ? "bg-primary/10" : "bg-muted"
                    )}>
                      <OptionIcon
                        name={item.iconName}
                        className={cn("h-4 w-4", item.isActive ? "text-primary" : "text-muted-foreground")}
                      />
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        <span className="font-mono text-xs text-muted-foreground">({item.key})</span>
                        {item.isSystem && (
                          <Badge variant="outline" className="text-xs py-0 h-4 bg-muted text-muted-foreground">
                            <Shield className="h-2.5 w-2.5 mr-0.5" />시스템
                          </Badge>
                        )}
                        {!item.branchId && (
                          <Badge variant="outline" className="text-xs py-0 h-4">전체 공통</Badge>
                        )}
                        {item.branchId && (
                          <Badge variant="outline" className="text-xs py-0 h-4 bg-accent/10 text-accent border-accent/20">
                            지점 전용
                          </Badge>
                        )}
                        {inUse && !item.isActive && (
                          <Badge variant="outline" className="text-xs py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />비활성 옵션 사용 중
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                      )}
                      {item.metadata && (item.metadata.requiresUrl || item.metadata.requiresPhone) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.metadata.requiresUrl ? "🔗 링크 입력 필요" : "📞 전화번호 입력 필요"}
                          {item.metadata.inputLabel ? ` · ${item.metadata.inputLabel}` : ""}
                        </p>
                      )}
                    </div>

                    {/* 정렬 순서 */}
                    <span className="text-xs text-muted-foreground w-6 text-center shrink-0">
                      {item.sortOrder}
                    </span>

                    {/* 활성/비활성 토글 */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={() => toggleItem(item.id)}
                        title={item.isActive ? "비활성화" : "활성화"}
                      />
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                        onClick={() => { setEditItem(item); setEditModalOpen(true) }}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 rounded-lg",
                          canDel
                            ? "text-muted-foreground hover:text-destructive"
                            : "text-muted-foreground/30 cursor-not-allowed"
                        )}
                        onClick={() => canDel && setConfirmDeleteId(item.id)}
                        title={canDel ? "삭제" : inUse ? "사용 중인 옵션은 삭제할 수 없습니다" : "시스템 옵션은 삭제할 수 없습니다"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 삭제 정책 안내 */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">삭제 정책</p>
              <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>사용 이력이 없는 옵션만 물리 삭제 가능합니다</li>
                <li>사용 중인 옵션은 비활성화만 가능합니다 (기존 데이터 보존)</li>
                <li>시스템 기본 옵션(<Shield className="inline h-3 w-3 mx-0.5" />)은 삭제할 수 없습니다</li>
                <li>비활성 옵션이 지점에 연결되어 있으면 경고 배지가 표시됩니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddOptionModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        groupKey={selectedGroupKey}
      />

      <EditItemModal
        item={editItem}
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={updateItem}
      />

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(v) => !v && setConfirmDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">옵션 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            이 옵션을 영구 삭제합니다. 사용 이력이 없으므로 삭제 가능합니다.
            이 작업은 되돌릴 수 없습니다.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="rounded-xl">취소</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              className="rounded-xl"
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
