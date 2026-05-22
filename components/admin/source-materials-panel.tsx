"use client"

import { useState, useRef } from "react"
import {
  Upload, FileText, Image as ImageIcon, Video, StickyNote, MessageSquare,
  Users, Globe, Search, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Lock, Eye, Building2, MapPin, X, Check, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  TreatmentSourceMaterial, SourceMaterialCategory, AssetScope
} from "@/lib/treatment-store"

// ─── Category meta ─────────────────────────────────────────────────────────────

const CATEGORY_META: Record<SourceMaterialCategory, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  vendor_pdf:       { label: "업체 PDF",         icon: <FileText className="h-4 w-4" />,    color: "text-red-600",    description: "장비/제품 업체 자료 PDF" },
  brochure_image:   { label: "브로슈어 이미지",   icon: <ImageIcon className="h-4 w-4" />,   color: "text-blue-600",   description: "업체 브로슈어, 제품 카탈로그 이미지" },
  product_image:    { label: "제품/장비 이미지",  icon: <ImageIcon className="h-4 w-4" />,   color: "text-indigo-600", description: "제품 또는 장비 설명 이미지" },
  price_sheet:      { label: "가격표",            icon: <FileText className="h-4 w-4" />,    color: "text-green-600",  description: "가격표 이미지 또는 PDF" },
  video:            { label: "관련 영상",         icon: <Video className="h-4 w-4" />,       color: "text-purple-600", description: "시술 영상, 결과 영상 등" },
  internal_memo:    { label: "내부 참고 메모",    icon: <StickyNote className="h-4 w-4" />,  color: "text-yellow-600", description: "운영팀 내부 메모" },
  director_comment: { label: "원장 코멘트",       icon: <MessageSquare className="h-4 w-4" />, color: "text-orange-600", description: "원장 직접 코멘트 또는 강조 포인트" },
  staff_memo:       { label: "직원 운영 메모",    icon: <Users className="h-4 w-4" />,       color: "text-cyan-600",   description: "직원 경험 메모, 운영 특이사항" },
  existing_copy:    { label: "기존 홈페이지 문구",icon: <Globe className="h-4 w-4" />,       color: "text-teal-600",   description: "기존에 사용하던 홈페이지/SNS 문구" },
  search_keywords:  { label: "검색 키워드",       icon: <Search className="h-4 w-4" />,      color: "text-pink-600",   description: "SEO 보강용 검색 키워드 목록" },
}

// ─── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  treatmentId: string
  materials: TreatmentSourceMaterial[]
  canEdit: boolean
  onAdd: (item: Omit<TreatmentSourceMaterial, "id" | "treatmentId" | "createdAt" | "updatedAt">) => void
  onUpdate: (id: string, updates: Partial<TreatmentSourceMaterial>) => void
  onDelete: (id: string) => void
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function SourceMaterialsPanel({ treatmentId, materials, canEdit, onAdd, onUpdate, onDelete }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<TreatmentSourceMaterial>>({})
  const [filterScope, setFilterScope] = useState<"all" | AssetScope>("all")

  const [newForm, setNewForm] = useState<{
    category: SourceMaterialCategory
    title: string
    content: string
    scope: AssetScope
    isPublic: boolean
    fileName?: string
    fileType?: "pdf" | "image" | "video" | "other"
    fileUrl?: string
  }>({
    category: "internal_memo",
    title: "",
    content: "",
    scope: "branch_specific",
    isPublic: false,
  })

  const sorted = [...materials].sort((a, b) => a.sortOrder - b.sortOrder)
  const filtered = filterScope === "all" ? sorted : sorted.filter(m => m.scope === filterScope)

  const counts = {
    all: materials.length,
    hq_common: materials.filter(m => m.scope === "hq_common").length,
    branch_specific: materials.filter(m => m.scope === "branch_specific").length,
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fileType = file.type.startsWith("image/") ? "image"
      : file.type === "application/pdf" ? "pdf"
      : file.type.startsWith("video/") ? "video"
      : "other"
    const fakeUrl = URL.createObjectURL(file)
    setNewForm(p => ({ ...p, fileName: file.name, fileType, fileUrl: fakeUrl }))
  }

  function handleAdd() {
    if (!newForm.title.trim() && !newForm.content.trim() && !newForm.fileName) return
    onAdd({
      category: newForm.category,
      title: newForm.title || newForm.fileName || undefined,
      content: newForm.content || undefined,
      fileUrl: newForm.fileUrl,
      fileName: newForm.fileName,
      fileType: newForm.fileType,
      scope: newForm.scope,
      isPublic: newForm.isPublic,
      sortOrder: materials.length + 1,
    })
    setNewForm({ category: "internal_memo", title: "", content: "", scope: "branch_specific", isPublic: false })
    setShowAddForm(false)
  }

  function startEdit(m: TreatmentSourceMaterial) {
    setEditingId(m.id)
    setEditForm({ ...m })
    setExpandedId(m.id)
  }

  function saveEdit() {
    if (!editingId) return
    onUpdate(editingId, editForm)
    setEditingId(null)
    setEditForm({})
  }

  const isTextCategory = (cat: SourceMaterialCategory) =>
    ["internal_memo", "director_comment", "staff_memo", "existing_copy", "search_keywords"].includes(cat)

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {([["all", "전체"], ["hq_common", "본사 공통"], ["branch_specific", "지점 자료"]] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilterScope(v)}
            className={cn(
              "text-xs px-3 py-1 rounded-full border transition-colors",
              filterScope === v
                ? "bg-primary text-white border-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            {l} <span className="opacity-70">({counts[v]})</span>
          </button>
        ))}
        <div className="flex-1" />
        {canEdit && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowAddForm(true)}>
            <Plus className="h-3 w-3" />자료 추가
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">새 원천 자료 추가</p>
            <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">자료 유형 *</Label>
              <Select value={newForm.category} onValueChange={(v) => setNewForm(p => ({ ...p, category: v as SourceMaterialCategory }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_META) as [SourceMaterialCategory, typeof CATEGORY_META[SourceMaterialCategory]][]).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className={v.color}>{v.icon}</span>
                        {v.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-0.5">{CATEGORY_META[newForm.category].description}</p>
            </div>
            <div>
              <Label className="text-xs mb-1 block">제목 / 파일명</Label>
              <Input className="h-8 text-xs" value={newForm.title} onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))} placeholder="예: 업체 제품 설명서 v2" />
            </div>
          </div>

          {isTextCategory(newForm.category) ? (
            <div>
              <Label className="text-xs mb-1 block">내용 *</Label>
              <Textarea
                rows={4}
                className="text-xs"
                value={newForm.content}
                onChange={e => setNewForm(p => ({ ...p, content: e.target.value }))}
                placeholder={
                  newForm.category === "search_keywords" ? "키워드1, 키워드2, 키워드3..."
                  : newForm.category === "existing_copy" ? "기존에 사용하던 홈페이지/SNS 문구를 붙여넣으세요"
                  : "내용을 입력하세요"
                }
              />
            </div>
          ) : (
            <div>
              <Label className="text-xs mb-1 block">파일 업로드</Label>
              <input ref={fileRef} type="file" accept="image/*,application/pdf,video/*" className="hidden" onChange={handleFileSelect} />
              {newForm.fileName ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs truncate flex-1">{newForm.fileName}</span>
                  <button onClick={() => setNewForm(p => ({ ...p, fileName: undefined, fileUrl: undefined, fileType: undefined }))} className="text-muted-foreground hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed rounded-md p-3 text-xs text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  클릭하여 파일 선택
                </button>
              )}
              {/* Also allow text notes alongside file */}
              <div className="mt-2">
                <Label className="text-xs mb-1 block">파일 설명 메모 (선택)</Label>
                <Textarea rows={2} className="text-xs" value={newForm.content} onChange={e => setNewForm(p => ({ ...p, content: e.target.value }))} placeholder="이 파일에 대한 간단한 설명" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Select value={newForm.scope} onValueChange={(v) => setNewForm(p => ({ ...p, scope: v as AssetScope }))}>
                <SelectTrigger className="h-7 text-xs w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="branch_specific" className="text-xs">지점 자료</SelectItem>
                  <SelectItem value="hq_common" className="text-xs">본사 공통</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch checked={newForm.isPublic} onCheckedChange={v => setNewForm(p => ({ ...p, isPublic: v }))} />
              <Label className="text-xs">{newForm.isPublic ? "공개용" : "내부 참고용"}</Label>
            </div>
            <div className="flex-1" />
            <Button size="sm" className="h-7 text-xs" onClick={handleAdd}>추가</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddForm(false)}>취소</Button>
          </div>
        </div>
      )}

      {/* Material list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
          <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">원천 자료가 없습니다.</p>
          <p className="text-xs mt-1">업체 자료, 내부 메모, 기존 문구를 추가하면 AI가 랜딩 초안을 자동으로 생성합니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const meta = CATEGORY_META[m.category]
            const isEditing = editingId === m.id
            const isExpanded = expandedId === m.id
            return (
              <div key={m.id} className="border rounded-lg overflow-hidden">
                {/* Row header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className={cn("shrink-0", meta.color)}>{meta.icon}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{meta.label}</Badge>
                  <span className="flex-1 text-sm truncate">{m.title ?? m.fileName ?? "제목 없음"}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                    {m.scope === "hq_common" ? <><Building2 className="h-2.5 w-2.5" />본사</> : <><MapPin className="h-2.5 w-2.5" />지점</>}
                  </span>
                  {m.isPublic
                    ? <Badge className="text-[10px] bg-green-100 text-green-700 shrink-0">공개용</Badge>
                    : <Badge className="text-[10px] bg-gray-100 text-gray-600 shrink-0 flex items-center gap-0.5"><Lock className="h-2.5 w-2.5" />내부</Badge>
                  }
                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit && (
                      <>
                        <button onClick={() => startEdit(m)} className="text-muted-foreground hover:text-foreground p-0.5">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={() => onDelete(m.id)} className="text-red-400 hover:text-red-600 p-0.5">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}
                      className="text-muted-foreground hover:text-foreground p-0.5"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded / edit */}
                {isExpanded && (
                  <div className="px-3 py-3 border-t space-y-3">
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs mb-1 block">제목</Label>
                            <Input className="h-7 text-xs" value={(editForm.title ?? "")} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                          </div>
                          <div className="flex items-center gap-3 pt-5">
                            <div className="flex items-center gap-1.5">
                              <Switch checked={!!editForm.isPublic} onCheckedChange={v => setEditForm(p => ({ ...p, isPublic: v }))} />
                              <Label className="text-xs">공개용</Label>
                            </div>
                          </div>
                        </div>
                        {(m.content !== undefined || isTextCategory(m.category)) && (
                          <div>
                            <Label className="text-xs mb-1 block">내용</Label>
                            <Textarea rows={4} className="text-xs" value={(editForm.content ?? "")} onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))} />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs" onClick={saveEdit}><Check className="h-3 w-3 mr-1" />저장</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditingId(null); setEditForm({}) }}>취소</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {m.fileName && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span>{m.fileName}</span>
                            {m.fileSizeBytes && <span className="opacity-60">({(m.fileSizeBytes / 1024).toFixed(0)} KB)</span>}
                          </div>
                        )}
                        {m.content && (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-5">{m.content}</p>
                        )}
                        {!m.fileName && !m.content && (
                          <p className="text-xs text-muted-foreground italic">내용이 없습니다.</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Summary bar */}
      {materials.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-md px-3 py-2 bg-blue-50 border-blue-200">
          <AlertCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span>
            총 <strong className="text-blue-700">{materials.length}개</strong> 자료 등록됨 — 자료가 많을수록 AI 초안 품질이 향상됩니다.
            {materials.filter(m => !m.isPublic).length > 0 && (
              <span className="ml-1">내부 참고용 {materials.filter(m => !m.isPublic).length}개는 공개 랜딩에 직접 노출되지 않습니다.</span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
