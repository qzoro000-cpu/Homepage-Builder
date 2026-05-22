"use client"

import { useState } from "react"
import {
  CheckCircle2, XCircle, Pencil, AlertTriangle, Globe,
  Database, Upload, Cpu, ChevronDown, ChevronUp,
  RefreshCw, Check, X, ThumbsUp, ThumbsDown,
  Zap, Info, Filter, BookOpen, MessageSquare,
  TrendingUp, Target, Shield, HelpCircle, DollarSign, Image as ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  AIExtractionItem, AIExtractionCategory,
  AIExtractionStatus, AIExtractionSource, AIConfidenceLevel,
  AIExtractionRun
} from "@/lib/treatment-store"

// ─── Category meta ─────────────────────────────────────────────────────────────

const CATEGORY_META: Record<AIExtractionCategory, { label: string; icon: React.ReactNode; color: string; badgeClass: string }> = {
  treatment_intro:  { label: "시술 소개",        icon: <BookOpen className="h-3.5 w-3.5" />,     color: "text-blue-600",   badgeClass: "bg-blue-100 text-blue-700" },
  hook_copy:        { label: "후킹 카피",         icon: <Zap className="h-3.5 w-3.5" />,          color: "text-yellow-600", badgeClass: "bg-yellow-100 text-yellow-700" },
  effect:           { label: "핵심 효과",         icon: <TrendingUp className="h-3.5 w-3.5" />,   color: "text-green-600",  badgeClass: "bg-green-100 text-green-700" },
  progress:         { label: "일반 경과",         icon: <RefreshCw className="h-3.5 w-3.5" />,    color: "text-teal-600",   badgeClass: "bg-teal-100 text-teal-700" },
  advantage:        { label: "장점",              icon: <ThumbsUp className="h-3.5 w-3.5" />,     color: "text-indigo-600", badgeClass: "bg-indigo-100 text-indigo-700" },
  precaution:       { label: "주의사항",          icon: <Shield className="h-3.5 w-3.5" />,       color: "text-orange-600", badgeClass: "bg-orange-100 text-orange-700" },
  target_audience:  { label: "추천 대상",         icon: <Target className="h-3.5 w-3.5" />,       color: "text-purple-600", badgeClass: "bg-purple-100 text-purple-700" },
  contraindication: { label: "금기/상담 필요",    icon: <XCircle className="h-3.5 w-3.5" />,      color: "text-red-600",    badgeClass: "bg-red-100 text-red-700" },
  faq:              { label: "FAQ 후보",           icon: <HelpCircle className="h-3.5 w-3.5" />,   color: "text-cyan-600",   badgeClass: "bg-cyan-100 text-cyan-700" },
  why_tatoa:        { label: "Why Tatoa",         icon: <MessageSquare className="h-3.5 w-3.5" />, color: "text-pink-600",   badgeClass: "bg-pink-100 text-pink-700" },
  program_price:    { label: "프로그램/가격",     icon: <DollarSign className="h-3.5 w-3.5" />,   color: "text-emerald-600",badgeClass: "bg-emerald-100 text-emerald-700" },
  image_suggestion: { label: "이미지 추천",       icon: <ImageIcon className="h-3.5 w-3.5" />,    color: "text-violet-600", badgeClass: "bg-violet-100 text-violet-700" },
  data_warning:     { label: "자료 부족",         icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-amber-600",  badgeClass: "bg-amber-100 text-amber-700" },
  review_warning:   { label: "검토 필요",         icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-red-500",    badgeClass: "bg-red-100 text-red-600" },
}

const SOURCE_META: Record<AIExtractionSource, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  internal_data:    { label: "내부 데이터",   icon: <Database className="h-3 w-3" />,  badgeClass: "bg-slate-100 text-slate-700" },
  uploaded_material:{ label: "업로드 자료",   icon: <Upload className="h-3 w-3" />,    badgeClass: "bg-blue-100 text-blue-700" },
  web_search:       { label: "웹 검색",       icon: <Globe className="h-3 w-3" />,     badgeClass: "bg-orange-100 text-orange-700" },
  equipment_data:   { label: "장비 데이터",   icon: <Cpu className="h-3 w-3" />,       badgeClass: "bg-purple-100 text-purple-700" },
}

const CONFIDENCE_META: Record<AIConfidenceLevel, { label: string; dotClass: string }> = {
  high:    { label: "높음", dotClass: "bg-green-500" },
  medium:  { label: "보통", dotClass: "bg-yellow-500" },
  low:     { label: "낮음", dotClass: "bg-orange-500" },
  conflict:{ label: "충돌", dotClass: "bg-red-500" },
}

// ─── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  treatmentId: string
  items: AIExtractionItem[]
  runs: AIExtractionRun[]
  canEdit: boolean
  isExtracting: boolean
  onExtract: (includeWebSearch: boolean) => void
  onUpdateItem: (id: string, updates: Partial<AIExtractionItem>) => void
  onClearRun: (runId: string) => void
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function AIExtractionPanel({
  treatmentId, items, runs, canEdit, isExtracting, onExtract, onUpdateItem, onClearRun
}: Props) {
  const [filterCategory, setFilterCategory] = useState<AIExtractionCategory | "all">("all")
  const [filterStatus, setFilterStatus] = useState<AIExtractionStatus | "all">("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const latestRun = runs.length > 0 ? runs[runs.length - 1] : null

  const filtered = items.filter(item => {
    if (filterCategory !== "all" && item.category !== filterCategory) return false
    if (filterStatus !== "all" && item.status !== filterStatus) return false
    return true
  }).sort((a, b) => a.sortOrder - b.sortOrder)

  const approvedCount = items.filter(i => i.status === "approved" || i.status === "modified").length
  const pendingCount = items.filter(i => i.status === "pending").length
  const rejectedCount = items.filter(i => i.status === "rejected").length
  const warningCount = items.filter(i => i.category === "review_warning" || i.category === "data_warning" || i.confidence === "conflict").length

  const categoryCounts: Partial<Record<AIExtractionCategory, number>> = {}
  items.forEach(i => { categoryCounts[i.category] = (categoryCounts[i.category] ?? 0) + 1 })

  function approve(id: string) { onUpdateItem(id, { status: "approved" }) }
  function reject(id: string) { onUpdateItem(id, { status: "rejected" }) }

  function startEdit(item: AIExtractionItem) {
    setEditingId(item.id)
    setEditContent(item.modifiedContent ?? item.content)
  }

  function saveEdit(id: string) {
    onUpdateItem(id, { modifiedContent: editContent, status: "modified" })
    setEditingId(null)
  }

  function toggleUsage(item: AIExtractionItem, field: "usedInLanding" | "usedInChatbot" | "usedInDescription") {
    onUpdateItem(item.id, { [field]: !item[field] })
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {!isExtracting ? (
          <>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => onExtract(false)}
              disabled={!canEdit}
            >
              <Database className="h-3.5 w-3.5" />
              내부 자료로 추출
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={() => onExtract(true)}
              disabled={!canEdit}
            >
              <Globe className="h-3.5 w-3.5" />
              자료 + 웹 검색으로 추출
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            AI가 자료를 분석 중입니다...
          </div>
        )}

        {latestRun && (
          <div className="flex-1 text-xs text-muted-foreground text-right">
            마지막 추출: {new Date(latestRun.runAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            {latestRun.includeWebSearch && <Badge className="ml-1.5 text-[10px] bg-orange-100 text-orange-700">웹 검색 포함</Badge>}
          </div>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && !isExtracting && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">아직 추출된 항목이 없습니다</p>
          <p className="text-xs mt-1 max-w-xs mx-auto">
            위 버튼을 눌러 AI 추출을 실행하면 랜딩페이지에 필요한 정보를 카테고리별로 자동 정리합니다.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "승인됨", count: approvedCount, cls: "bg-green-50 border-green-200 text-green-700" },
              { label: "검토 대기", count: pendingCount, cls: "bg-yellow-50 border-yellow-200 text-yellow-700" },
              { label: "제외됨", count: rejectedCount, cls: "bg-gray-50 border-gray-200 text-gray-500" },
              { label: "경고", count: warningCount, cls: "bg-red-50 border-red-200 text-red-600" },
            ].map(s => (
              <div key={s.label} className={cn("border rounded-md px-3 py-2 text-center", s.cls)}>
                <div className="text-lg font-bold">{s.count}</div>
                <div className="text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <button
              onClick={() => setFilterCategory("all")}
              className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", filterCategory === "all" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50")}
            >
              전체 ({items.length})
            </button>
            {(Object.keys(categoryCounts) as AIExtractionCategory[])
              .filter(k => (categoryCounts[k] ?? 0) > 0 && CATEGORY_META[k] != null)
              .map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1", filterCategory === cat ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50")}
                >
                  {CATEGORY_META[cat].label} {categoryCounts[cat]}
                </button>
              ))}
            <div className="w-px h-4 bg-border mx-1" />
            {(["all", "pending", "approved", "modified", "rejected"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", filterStatus === s ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50")}
              >
                {s === "all" ? "상태 전체" : s === "pending" ? "대기" : s === "approved" ? "승인" : s === "modified" ? "수정됨" : "제외"}
              </button>
            ))}
          </div>

          {/* Warnings */}
          {latestRun?.warnings && latestRun.warnings.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />추출 경고
              </p>
              {latestRun.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-600 pl-5">{w}</p>
              ))}
            </div>
          )}

          {/* Item list */}
          <div className="space-y-2">
            {filtered.map(item => {
              const cat = CATEGORY_META[item.category] ?? { label: item.category, icon: null, color: "text-muted-foreground", badgeClass: "bg-muted text-muted-foreground" }
              const src = SOURCE_META[item.source] ?? { label: item.source, icon: null, badgeClass: "bg-muted text-muted-foreground" }
              const conf = CONFIDENCE_META[item.confidence] ?? { label: item.confidence, dotClass: "bg-gray-400" }
              const isEditing = editingId === item.id
              const isExpanded = expandedId === item.id
              const isWarning = item.category === "data_warning" || item.category === "review_warning" || item.confidence === "conflict"
              const displayContent = item.modifiedContent ?? item.content

              return (
                <div
                  key={item.id}
                  className={cn(
                    "border rounded-lg overflow-hidden transition-all",
                    item.status === "approved" ? "border-green-200 bg-green-50/30" :
                    item.status === "modified" ? "border-blue-200 bg-blue-50/30" :
                    item.status === "rejected" ? "border-gray-200 bg-gray-50/30 opacity-60" :
                    isWarning ? "border-amber-200 bg-amber-50/30" :
                    "border-border"
                  )}
                >
                  {/* Item header */}
                  <div className="flex items-start gap-2 px-3 py-2.5">
                    {/* Status icon */}
                    <div className="shrink-0 mt-0.5">
                      {item.status === "approved" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {item.status === "modified" && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                      {item.status === "rejected" && <XCircle className="h-4 w-4 text-gray-400" />}
                      {item.status === "pending" && (
                        isWarning
                          ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                          : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <Badge className={cn("text-[10px] flex items-center gap-1", cat.badgeClass)}>
                          {cat.icon}{cat.label}
                        </Badge>
                        <Badge className={cn("text-[10px] flex items-center gap-1", src.badgeClass)}>
                          {src.icon}{src.label}
                        </Badge>
                        <span className={cn("flex items-center gap-1 text-[10px]", conf.dotClass === "bg-red-500" ? "text-red-600" : "text-muted-foreground")}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", conf.dotClass)} />
                          신뢰도 {conf.label}
                        </span>
                        {item.status === "modified" && <Badge className="text-[10px] bg-blue-100 text-blue-700">수정됨</Badge>}
                      </div>

                      {/* Content */}
                      {!isEditing ? (
                        <p className={cn("text-xs leading-relaxed", item.status === "rejected" ? "line-through text-muted-foreground" : "")}>
                          {displayContent.length > 120 && !isExpanded
                            ? displayContent.slice(0, 120) + "..."
                            : displayContent}
                        </p>
                      ) : (
                        <Textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          rows={3}
                          className="text-xs mt-1"
                          autoFocus
                        />
                      )}

                      {/* Conflict warning */}
                      {item.conflictWarning && (
                        <div className="mt-1 flex items-start gap-1 text-[10px] text-red-600">
                          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                          <span>{item.conflictWarning}</span>
                        </div>
                      )}

                      {/* Source ref */}
                      {item.sourceRef && !isEditing && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Info className="h-2.5 w-2.5" />출처: {item.sourceRef}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!isEditing ? (
                        <>
                          {item.status !== "approved" && item.status !== "modified" && (
                            <button
                              onClick={() => approve(item.id)}
                              title="승인"
                              className="p-1 text-green-500 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {item.status !== "rejected" && (
                            <button
                              onClick={() => reject(item.id)}
                              title="제외"
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => startEdit(item)}
                              title="수정"
                              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => saveEdit(item.id)} className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded: usage toggles */}
                  {isExpanded && !isEditing && item.status !== "rejected" && (
                    <div className="px-3 pb-2.5 border-t pt-2 flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground">사용처:</span>
                      {([
                        ["usedInLanding", "랜딩"],
                        ["usedInChatbot", "챗봇"],
                        ["usedInDescription", "상세설명"],
                      ] as const).map(([field, label]) => (
                        <button
                          key={field}
                          onClick={() => toggleUsage(item, field)}
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                            item[field]
                              ? "bg-primary text-white border-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          )}
                        >
                          {item[field] && <Check className="h-2.5 w-2.5 inline mr-0.5" />}
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2 pt-1 border-t">
            <span className="text-xs text-muted-foreground">일괄:</span>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px]"
              onClick={() => items.filter(i => i.status === "pending").forEach(i => approve(i.id))}
            >
              대기 전체 승인
            </Button>
            {latestRun && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] text-muted-foreground"
                onClick={() => onClearRun(latestRun.id)}
              >
                추출 결과 초기화
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
