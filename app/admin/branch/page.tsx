"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Clock,
  Plus,
  Eye,
  Bot,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Calendar,
  Users,
  Zap,
  ExternalLink,
  Globe,
  Edit3,
  Send,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { branches, recentUpdates, events, notices, treatments, doctors, branchWebsites } from "@/lib/mock-data"
import { useBranch } from "../layout"
import { RealTimeNoticeModal } from "@/components/admin/notice-modal"
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

export default function BranchAdminHome() {
  const { selectedBranch } = useBranch()
  const [noticeModalOpen, setNoticeModalOpen] = useState(false)

  const branch = branches.find((b) => b.id === selectedBranch) || branches[0]
  const branchEvents = events.filter((e) => e.branchId === selectedBranch && e.status === "active")
  const branchNotices = notices.filter((n) => n.branchId === selectedBranch)
  const branchDoctors = doctors.filter((d) => d.branchId === selectedBranch)
  const branchTreatments = treatments.filter((t) => t.branchId === selectedBranch)
  const branchWebsite = branchWebsites.find((w) => w.branchId === selectedBranch)
  const branchUpdates = recentUpdates.filter(
    (u) => u.branch === branch.name || u.branch === "All Branches"
  )

  const todayItems = [
    { label: "만료 임박 이벤트 검토", count: branchEvents.filter(e => new Date(e.endDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length, icon: Calendar, href: "/admin/branch/events" },
    { label: "의사 프로필 업데이트", count: branchDoctors.filter(d => !d.isPublic).length, icon: Users, href: "/admin/branch/doctors" },
    { label: "대기 중인 시술", count: branchTreatments.filter(t => !t.isPublic).length, icon: FileText, href: "/admin/branch/doctors?tab=treatments" },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{branch.name}</h1>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                branch.isPublic
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {branch.isPublic ? "공개" : "비공개"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{branch.handle} • 지점 관리자 대시보드</p>
        </div>
        <Button
          onClick={() => setNoticeModalOpen(true)}
          className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Zap className="h-4 w-4" />
          빠른 공지
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{branchDoctors.length}</p>
              <p className="text-sm text-muted-foreground">의사</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{branchTreatments.length}</p>
              <p className="text-sm text-muted-foreground">시술</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
              <Calendar className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{branchEvents.length}</p>
              <p className="text-sm text-muted-foreground">활성 이벤트</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{branchNotices.length}</p>
              <p className="text-sm text-muted-foreground">활성 공지</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Today's Items & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Items to Update */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold text-foreground">오늘 검토할 항목</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayItems.map((item, i) => (
                <Link key={i} href={item.href}>
                  <div className="group flex items-center justify-between rounded-xl border border-border p-4 transition-all hover:border-primary/30 hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.count}개 항목 확인 필요</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">빠른 작업</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/admin/branch/homepage">
                  <Button variant="outline" className="h-auto w-full flex-col items-start gap-2 rounded-xl p-4 text-left hover:bg-muted">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">홈페이지 편집</p>
                      <p className="text-xs text-muted-foreground">지점 홈페이지 관리</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/admin/preview/homepage">
                  <Button variant="outline" className="h-auto w-full flex-col items-start gap-2 rounded-xl p-4 text-left hover:bg-muted">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">홈페이지 미리보기</p>
                      <p className="text-xs text-muted-foreground">공개 홈페이지 미리보기</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/admin/preview/chatbot">
                  <Button variant="outline" className="h-auto w-full flex-col items-start gap-2 rounded-xl p-4 text-left hover:bg-muted">
                    <Bot className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">챗봇 지식베이스</p>
                      <p className="text-xs text-muted-foreground">AI 지식베이스 보기</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/admin/branch/info">
                  <Button variant="outline" className="h-auto w-full flex-col items-start gap-2 rounded-xl p-4 text-left hover:bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">지점 정보 수정</p>
                      <p className="text-xs text-muted-foreground">지점 정보 업데이트</p>
                    </div>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setNoticeModalOpen(true)}
                  className="h-auto w-full flex-col items-start gap-2 rounded-xl p-4 text-left hover:bg-muted"
                >
                  <Zap className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">공지 작성</p>
                    <p className="text-xs text-muted-foreground">빠른 실시간 공지</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">최근 업데이트</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {branchUpdates.slice(0, 5).map((update) => (
                  <div
                    key={update.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {update.type}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{update.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{update.updatedBy}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(update.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Chatbot Status */}
        <div className="space-y-6">
          {/* Homepage Status */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">홈페이지 상태</CardTitle>
                {branchWebsite && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      branchWebsite.status === "published"
                        ? "bg-success/10 text-success border-success/20"
                        : branchWebsite.status === "review"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {branchWebsite.status === "published" && "공개 중"}
                    {branchWebsite.status === "draft" && "초안"}
                    {branchWebsite.status === "review" && "검토 중"}
                    {branchWebsite.status === "archived" && "보관됨"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!branchWebsite ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Globe className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">홈페이지 미생성</p>
                    <p className="text-xs text-muted-foreground mt-0.5">아직 홈페이지가 만들어지지 않았어요</p>
                  </div>
                  <Link href="/admin/branch/homepage" className="w-full">
                    <Button className="w-full rounded-xl gap-2">
                      <Plus className="h-4 w-4" />
                      홈페이지 생성 시작
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {branchWebsite.status === "published" && (
                      <div className="flex items-center gap-2 rounded-lg bg-success/5 border border-success/15 p-3">
                        <CheckCircle2 className="h-4 w-4 text-success flex-none" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">공개 중</p>
                          {branchWebsite.lastPublishedAt && (
                            <p className="text-xs text-muted-foreground">
                              마지막 반영: {formatRelativeTime(branchWebsite.lastPublishedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {branchWebsite.hasUnpublishedChanges && (
                      <div className="flex items-center gap-2 rounded-lg bg-warning/5 border border-warning/15 p-3">
                        <Edit3 className="h-4 w-4 text-warning-foreground flex-none" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">미반영 변경사항 있음</p>
                          <p className="text-xs text-muted-foreground">저장 후 공개하면 홈페이지에 반영됩니다</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href="/admin/branch/homepage">
                      <Button variant="outline" className="w-full rounded-xl gap-2">
                        <Edit3 className="h-4 w-4" />
                        홈페이지 편집
                      </Button>
                    </Link>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 rounded-xl gap-1.5 text-xs">
                        <Eye className="h-3.5 w-3.5" />
                        미리보기
                      </Button>
                      {branchWebsite.hasUnpublishedChanges && (
                        <Button size="sm" className="flex-1 rounded-xl gap-1.5 text-xs bg-primary text-primary-foreground">
                          <Send className="h-3.5 w-3.5" />
                          공개하기
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Chatbot Reflection Status */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">챗봇 상태</CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    branch.syncStatus === "synced"
                      ? "bg-success/10 text-success border-success/20"
                      : branch.syncStatus === "pending"
                      ? "bg-warning/10 text-warning-foreground border-warning/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  )}
                >
                  {branch.syncStatus === "synced" && "동기화됨"}
                  {branch.syncStatus === "pending" && "대기 중"}
                  {branch.syncStatus === "error" && "오류"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-4">
                {branch.syncStatus === "synced" ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                      <CheckCircle2 className="h-8 w-8 text-success" />
                    </div>
                    <p className="text-sm font-medium text-foreground">모든 콘텐츠 동기화됨</p>
                    <p className="text-xs text-muted-foreground">
                      마지막 동기화: {formatRelativeTime(branch.lastUpdated)}
                    </p>
                  </div>
                ) : branch.syncStatus === "pending" ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
                      <Clock className="h-8 w-8 text-warning-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">동기화 중</p>
                    <p className="text-xs text-muted-foreground">잠시 기다려주세요...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <p className="text-sm font-medium text-foreground">동기화 실패</p>
                    <p className="text-xs text-muted-foreground">다시 시도해주세요</p>
                  </div>
                )}
              </div>
              <Link href="/admin/preview/chatbot">
                <Button variant="outline" className="w-full rounded-xl">
                  <Bot className="mr-2 h-4 w-4" />
                  지식베이스 보기
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Active Notices */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">활성 공지</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNoticeModalOpen(true)}
                  className="h-8 rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {branchNotices.length > 0 ? (
                branchNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className={cn(
                      "rounded-lg border p-3",
                      notice.importance === "high"
                        ? "border-destructive/30 bg-destructive/5"
                        : notice.importance === "medium"
                        ? "border-warning/30 bg-warning/5"
                        : "border-border bg-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{notice.title}</p>
                      {notice.isTopBanner && (
                        <Badge variant="outline" className="shrink-0 text-xs">
                          배너
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(notice.startDate).toLocaleDateString()} - {new Date(notice.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  활성 공지 없음
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notice Modal */}
      <RealTimeNoticeModal
        open={noticeModalOpen}
        onOpenChange={setNoticeModalOpen}
        branchId={selectedBranch}
      />
    </div>
  )
}
