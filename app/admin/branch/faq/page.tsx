"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Bot,
  GripVertical,
  Link as LinkIcon,
  HelpCircle,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { faqs, treatments, branches } from "@/lib/mock-data"
import { useBranch } from "../../layout"
import { cn } from "@/lib/utils"

function FAQItem({ faq, isExpanded, onToggle }: {
  faq: typeof faqs[0]
  isExpanded: boolean
  onToggle: () => void
}) {
  const linkedTreatmentNames = faq.linkedTreatments
    .map((id) => treatments.find((t) => t.id === id)?.name)
    .filter(Boolean)

  const linkedBranchNames = faq.linkedBranches
    .map((id) => branches.find((b) => b.id === id)?.name)
    .filter(Boolean)

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={cn(
        "group rounded-xl border border-border bg-card transition-all",
        isExpanded && "border-primary/30 shadow-sm"
      )}>
        <div className="flex items-start gap-3 p-4">
          {/* Drag Handle */}
          <button className="mt-1 cursor-grab text-muted-foreground/50 hover:text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Priority Badge */}
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {faq.priority}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <CollapsibleTrigger asChild>
              <button className="w-full text-left">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-medium text-foreground pr-2">{faq.question}</h3>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-3 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>

                {/* Links */}
                {(linkedTreatmentNames.length > 0 || linkedBranchNames.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {linkedTreatmentNames.map((name, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-accent/10 text-accent-foreground border-accent/20">
                        <LinkIcon className="mr-1 h-3 w-3" />
                        {name}
                      </Badge>
                    ))}
                    {linkedBranchNames.map((name, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>

          {/* Status Badges & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {faq.isChatbotPriority && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                <Bot className="mr-1 h-3 w-3" />
                챗봇
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                faq.isPublic
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {faq.isPublic ? "공개" : "비공개"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem className="cursor-pointer rounded-lg">
                  <Pencil className="mr-2 h-4 w-4" />
                  수정
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  시술 연결
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg">
                  {faq.isPublic ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      비공개로 변경
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      공개로 변경
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg">
                  {faq.isChatbotPriority ? (
                    <>
                      <Bot className="mr-2 h-4 w-4" />
                      챗봇 우선 해제
                    </>
                  ) : (
                    <>
                      <Bot className="mr-2 h-4 w-4" />
                      챗봇 우선 추가
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer rounded-lg text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Collapsible>
  )
}

export default function FAQPage() {
  const { selectedBranch } = useBranch()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const branchFAQs = faqs.filter(
    (f) => f.linkedBranches.includes(selectedBranch) || f.linkedBranches.length === 0
  ).sort((a, b) => a.priority - b.priority)

  const filteredFAQs = branchFAQs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = [...new Set(faqs.map((f) => f.category))]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">FAQ 관리</h1>
          <p className="text-sm text-muted-foreground">
            자주 묻는 질문 및 챗봇 지식베이스 관리
          </p>
        </div>
        <Button className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          FAQ 추가
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{branchFAQs.length}</p>
              <p className="text-sm text-muted-foreground">전체 FAQ</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
              <Eye className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {branchFAQs.filter((f) => f.isPublic).length}
              </p>
              <p className="text-sm text-muted-foreground">공개</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
              <Bot className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {branchFAQs.filter((f) => f.isChatbotPriority).length}
              </p>
              <p className="text-sm text-muted-foreground">챗봇 우선</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="FAQ 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2 rounded-xl">
          <Filter className="h-4 w-4" />
          카테고리
        </Button>
      </div>

      {/* FAQ List */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">FAQ 목록</CardTitle>
              <CardDescription className="text-muted-foreground">
                우선순위 변경을 위해 드래그하세요. 클릭하면 답변이 펼쳐집니다.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">카테고리:</span>
              <div className="flex gap-1">
                {categories.map((cat) => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => (
              <FAQItem
                key={faq.id}
                faq={faq}
                isExpanded={expandedId === faq.id}
                onToggle={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
              />
            ))
          ) : (
            <div className="py-12 text-center">
              <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery ? "검색 결과에 일치하는 FAQ가 없습니다" : "등록된 FAQ가 없습니다"}
              </p>
              <Button variant="outline" className="mt-4 rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                FAQ 추가
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chatbot Info */}
      <Card className="rounded-2xl border-border bg-muted/50 shadow-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">챗봇 연동</p>
            <p className="text-xs text-muted-foreground">
              &quot;챗봇 우선&quot;으로 표시된 FAQ는 AI 챗봇 지식베이스에 포함됩니다. 공개 FAQ는 지점 홈페이지에 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
