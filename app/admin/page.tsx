"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Calendar,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Zap,
  Globe,
  Edit3,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  branches,
  recentUpdates,
  events,
  kpiData,
  branchWebsites,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { RealTimeNoticeModal } from "@/components/admin/notice-modal"

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

function SyncStatusBadge({ status }: { status: "synced" | "pending" | "error" }) {
  const statusConfig = {
    synced: { label: "동기화됨", className: "bg-success/10 text-success border-success/20" },
    pending: { label: "대기 중", className: "bg-warning/10 text-warning-foreground border-warning/20" },
    error: { label: "오류", className: "bg-destructive/10 text-destructive border-destructive/20" },
  }

  const config = statusConfig[status]

  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}

export default function HeadquartersDashboard() {
  const [noticeModalOpen, setNoticeModalOpen] = useState(false)

  const expiringEvents = events.filter(
    (e) => e.status === "active" && new Date(e.endDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  )

  const staleContent = branches.filter(
    (b) => new Date(b.lastUpdated) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )

  const publishedWebsites      = branchWebsites.filter((w) => w.status === "published").length
  const unpublishedChanges     = branchWebsites.filter((w) => w.hasUnpublishedChanges).length
  const reviewNeeded           = branchWebsites.filter((w) => w.status === "review").length
  const notCreated             = branches.length - branchWebsites.length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">본사 대시보드</h1>
          <p className="text-sm text-muted-foreground">전체 타토아 지점 및 콘텐츠 현황</p>
        </div>
        <Button
          onClick={() => setNoticeModalOpen(true)}
          className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Zap className="h-4 w-4" />
          빠른 공지
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">전체 지점</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">{kpiData.totalBranches}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">오늘 업데이트</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">{kpiData.updatedToday}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">만료 임박</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">{kpiData.expiringSoon}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/10">
                <Calendar className="h-5 w-5 text-warning-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">오래된 콘텐츠</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">{kpiData.staleContent}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">마지막 동기화</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatRelativeTime(kpiData.lastSyncTime)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Homepage Status KPIs */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold text-foreground">홈페이지 현황</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl bg-success/5 border border-success/15 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 flex-none">
                <Globe className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">{publishedWebsites}</p>
                <p className="text-xs text-muted-foreground">공개 중</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-warning/5 border border-warning/15 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 flex-none">
                <Edit3 className="h-4 w-4 text-warning-foreground" />
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">{unpublishedChanges}</p>
                <p className="text-xs text-muted-foreground">미반영 변경</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/15 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-none">
                <Eye className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">{reviewNeeded}</p>
                <p className="text-xs text-muted-foreground">검토 필요</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 border border-border p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted flex-none">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">{notCreated}</p>
                <p className="text-xs text-muted-foreground">미생성</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Branch Cards */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">지점 현황</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    전체 클리닉 지점 관리 및 모니터링
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Plus className="mr-1.5 h-4 w-4" />
                  지점 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {branches.map((branch) => (
                <Link
                  key={branch.id}
                  href={`/admin/branch?id=${branch.id}`}
                  className="block"
                >
                  <div className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-lg font-semibold text-muted-foreground">
                        {branch.name.split(" ")[1]?.[0] || branch.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{branch.name}</h3>
                          {!branch.isPublic && (
                            <Badge variant="outline" className="text-xs">비공개</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{branch.handle}</p>
                        {(() => {
                          const ws = branchWebsites.find((w) => w.branchId === branch.id)
                          if (!ws) return <span className="text-xs text-muted-foreground">홈페이지 미생성</span>
                          return (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {ws.status === "published"
                                ? <span className="inline-flex items-center gap-1 text-xs text-success"><Globe className="h-3 w-3" />공개 중</span>
                                : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Edit3 className="h-3 w-3" />초안</span>
                              }
                              {ws.hasUnpublishedChanges && (
                                <span className="text-xs text-warning-foreground">· 미반영 변경 있음</span>
                              )}
                              {ws.lastPublishedAt && (
                                <span className="text-xs text-muted-foreground">· {formatRelativeTime(ws.lastPublishedAt)} 반영</span>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <SyncStatusBadge status={branch.syncStatus} />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatRelativeTime(branch.lastUpdated)} 업데이트
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Chatbot Sync Status */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-foreground">챗봇 동기화 상태</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                >
                  <span className="text-sm font-medium text-foreground">{branch.name}</span>
                  <div className="flex items-center gap-2">
                    {branch.syncStatus === "synced" && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                    {branch.syncStatus === "pending" && (
                      <Clock className="h-4 w-4 text-warning-foreground" />
                    )}
                    {branch.syncStatus === "error" && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <SyncStatusBadge status={branch.syncStatus} />
                  </div>
                </div>
              ))}
              <Button variant="outline" className="mt-2 w-full rounded-xl">
                <RefreshCw className="mr-2 h-4 w-4" />
                전체 지점 동기화
              </Button>
            </CardContent>
          </Card>

          {/* Expiring Events */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">만료 임박</CardTitle>
                <Badge variant="outline" className="bg-warning/10 text-warning-foreground">
                  {expiringEvents.length}개 이벤트
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {expiringEvents.length > 0 ? (
                expiringEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        종료 {new Date(event.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  만료 임박 이벤트 없음
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Updates Table */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">최근 업데이트</CardTitle>
              <CardDescription className="text-muted-foreground">
                전체 지점 최신 콘텐츠 변경사항
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl">
              전체 보기
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-sm font-medium text-muted-foreground">유형</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">콘텐츠</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">지점</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">수정자</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">시간</th>
                </tr>
              </thead>
              <tbody>
                {recentUpdates.map((update) => (
                  <tr key={update.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <Badge variant="outline" className="text-xs font-medium">
                        {update.type}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm font-medium text-foreground">{update.title}</td>
                    <td className="py-3 text-sm text-muted-foreground">{update.branch}</td>
                    <td className="py-3 text-sm text-muted-foreground">{update.updatedBy}</td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {formatRelativeTime(update.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Notice Modal */}
      <RealTimeNoticeModal
        open={noticeModalOpen}
        onOpenChange={setNoticeModalOpen}
        branchId="main"
      />
    </div>
  )
}
