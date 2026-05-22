"use client"

import {
  Bot,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  HelpCircle,
  Bell,
  Building2,
  FileText,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { branches, events, faqs, notices, treatments } from "@/lib/mock-data"
import { useBranch } from "../../layout"
import { cn } from "@/lib/utils"

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  return `${diffDays}일 전`
}

export default function ChatbotPreviewPage() {
  const { selectedBranch } = useBranch()

  const branch = branches.find((b) => b.id === selectedBranch) || branches[0]
  const branchEvents = events.filter((e) => e.branchId === selectedBranch && e.status === "active")
  const branchFAQs = faqs.filter(
    (f) => f.isChatbotPriority && (f.linkedBranches.includes(selectedBranch) || f.linkedBranches.length === 0)
  )
  const branchNotices = notices.filter((n) => n.branchId === selectedBranch && n.isChatbotPriority)
  const branchTreatments = treatments.filter((t) => t.branchId === selectedBranch && t.isPublic)

  // Excluded content (private items)
  const excludedTreatments = treatments.filter((t) => t.branchId === selectedBranch && !t.isPublic)
  const excludedFAQs = faqs.filter(
    (f) => !f.isChatbotPriority && (f.linkedBranches.includes(selectedBranch) || f.linkedBranches.length === 0)
  )

  const syncStatusConfig = {
    synced: {
      label: "동기화됨",
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
    },
    pending: {
      label: "대기 중",
      icon: Clock,
      color: "text-warning-foreground",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20",
    },
    error: {
      label: "오류",
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/20",
    },
  }

  const status = syncStatusConfig[branch.syncStatus]
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">챗봇 지식베이스 미리보기</h1>
          <p className="text-sm text-muted-foreground">
            {branch.name}의 AI 챗봇이 접근할 수 있는 정보 확인
          </p>
        </div>
        <Button className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
          <RefreshCw className="h-4 w-4" />
          지금 동기화
        </Button>
      </div>

      {/* Sync Status Card */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", status.bgColor)}>
                <StatusIcon className={cn("h-7 w-7", status.color)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">동기화 상태</h2>
                  <Badge variant="outline" className={cn("text-xs", status.bgColor, status.color, status.borderColor)}>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  마지막 동기화: {formatRelativeTime(branch.lastUpdated)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-foreground">
                {branchFAQs.length + branchEvents.length + branchNotices.length + branchTreatments.length + 1}
              </p>
              <p className="text-sm text-muted-foreground">지식 항목</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Source Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">1</p>
              <p className="text-xs text-muted-foreground">지점 정보</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <Calendar className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{branchEvents.length}</p>
              <p className="text-xs text-muted-foreground">활성 이벤트</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <HelpCircle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{branchFAQs.length}</p>
              <p className="text-xs text-muted-foreground">우선 FAQ</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <Bell className="h-5 w-5 text-warning-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{branchNotices.length}</p>
              <p className="text-xs text-muted-foreground">실시간 공지</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{branchTreatments.length}</p>
              <p className="text-xs text-muted-foreground">시술</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Knowledge Panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Branch Summary */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">지점 요약</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              챗봇이 접근할 수 있는 핵심 지점 정보
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-muted/50 p-4 font-mono text-sm">
              <div className="space-y-2 text-muted-foreground">
                <p><span className="text-foreground font-medium">지점:</span> {branch.name}</p>
                <p><span className="text-foreground font-medium">핸들:</span> {branch.handle}</p>
                <p><span className="text-foreground font-medium">주소:</span> {branch.address}</p>
                <p><span className="text-foreground font-medium">전화:</span> {branch.phone}</p>
                <p><span className="text-foreground font-medium">영업 시간:</span> {branch.businessHours}</p>
                <p><span className="text-foreground font-medium">주차:</span> {branch.parkingInfo}</p>
                <p><span className="text-foreground font-medium">소개:</span> {branch.shortIntro}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Events Snapshot */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-success" />
              <CardTitle className="text-base font-semibold text-foreground">활성 이벤트 스냅샷</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              챗봇이 파악하고 있는 현재 프로모션
            </CardDescription>
          </CardHeader>
          <CardContent>
            {branchEvents.length > 0 ? (
              <div className="space-y-3">
                {branchEvents.map((event) => (
                  <div key={event.id} className="rounded-xl bg-muted/50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                        활성
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      유효 기간: {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-muted/50 p-6 text-center">
                <Calendar className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">활성 이벤트 없음</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ Snapshot */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-accent" />
              <CardTitle className="text-base font-semibold text-foreground">FAQ 스냅샷</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              챗봇 지식에 포함된 우선 FAQ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {branchFAQs.length > 0 ? (
              <div className="space-y-3">
                {branchFAQs.map((faq) => (
                  <div key={faq.id} className="rounded-xl bg-muted/50 p-4">
                    <p className="font-medium text-foreground">{faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {faq.category}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-muted/50 p-6 text-center">
                <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">우선 FAQ 없음</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Notices Snapshot */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning-foreground" />
              <CardTitle className="text-base font-semibold text-foreground">실시간 공지 스냅샷</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              챗봇 우선 활성 공지
            </CardDescription>
          </CardHeader>
          <CardContent>
            {branchNotices.length > 0 ? (
              <div className="space-y-3">
                {branchNotices.map((notice) => (
                  <div key={notice.id} className={cn(
                    "rounded-xl p-4",
                    notice.importance === "high" ? "bg-destructive/10 border border-destructive/20" :
                    notice.importance === "medium" ? "bg-warning/10 border border-warning/20" :
                    "bg-muted/50"
                  )}>
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-foreground">{notice.title}</p>
                      <Badge variant="outline" className={cn(
                        "text-xs capitalize",
                        notice.importance === "high" ? "bg-destructive/10 text-destructive border-destructive/20" :
                        notice.importance === "medium" ? "bg-warning/10 text-warning-foreground border-warning/20" :
                        ""
                      )}>
                        {notice.importance === "high" ? "높음" : notice.importance === "medium" ? "보통" : "낮음"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notice.startDate).toLocaleDateString()} - {new Date(notice.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-muted/50 p-6 text-center">
                <Bell className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">실시간 공지 없음</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Excluded Content */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold text-foreground">제외된 콘텐츠</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            챗봇 지식에 포함되지 않은 콘텐츠 (비공개 또는 비우선)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {excludedTreatments.map((t) => (
              <Badge key={t.id} variant="outline" className="text-xs bg-muted text-muted-foreground">
                <EyeOff className="mr-1 h-3 w-3" />
                {t.name} (비공개)
              </Badge>
            ))}
            {excludedFAQs.map((f) => (
              <Badge key={f.id} variant="outline" className="text-xs bg-muted text-muted-foreground">
                <EyeOff className="mr-1 h-3 w-3" />
                FAQ: {f.question.substring(0, 30)}...
              </Badge>
            ))}
            {excludedTreatments.length === 0 && excludedFAQs.length === 0 && (
              <p className="text-sm text-muted-foreground">제외된 콘텐츠 없음</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
