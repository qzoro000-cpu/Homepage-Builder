"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Home,
  Filter,
  Image as ImageIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { events } from "@/lib/mock-data"
import { useBranch } from "../../layout"
import { cn } from "@/lib/utils"

function EventCard({ event }: { event: typeof events[0] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20"
      case "scheduled":
        return "bg-primary/10 text-primary border-primary/20"
      case "ended":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "진행 중"
      case "scheduled": return "예정됨"
      case "ended": return "종료됨"
      default: return status
    }
  }

  const isExpiringSoon = event.status === "active" &&
    new Date(event.endDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-sm">
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
        <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
        {event.isHomepage && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs">
            <Home className="mr-1 h-3 w-3" />
            홈페이지
          </Badge>
        )}
        {isExpiringSoon && (
          <Badge className="absolute top-2 right-2 bg-warning text-warning-foreground text-xs">
            만료 임박
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium text-foreground line-clamp-1">{event.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{event.description}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem className="cursor-pointer rounded-lg">
                <Pencil className="mr-2 h-4 w-4" />
                수정
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg">
                <Copy className="mr-2 h-4 w-4" />
                복제
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg">
                <ImageIcon className="mr-2 h-4 w-4" />
                썸네일 변경
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg">
                {event.isHomepage ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    홈페이지에서 제거
                  </>
                ) : (
                  <>
                    <Home className="mr-2 h-4 w-4" />
                    홈페이지에 추가
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(event.startDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
              {" - "}
              {new Date(event.endDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <Badge variant="outline" className={cn("text-xs", getStatusColor(event.status))}>
            {getStatusLabel(event.status)}
          </Badge>
        </div>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const { selectedBranch } = useBranch()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("active")

  const branchEvents = events.filter((e) => e.branchId === selectedBranch)

  const scheduledEvents = branchEvents.filter((e) => e.status === "scheduled")
  const activeEvents = branchEvents.filter((e) => e.status === "active")
  const endedEvents = branchEvents.filter((e) => e.status === "ended")

  const getFilteredEvents = (eventList: typeof events) => {
    return eventList.filter(
      (e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const currentEvents = activeTab === "scheduled"
    ? getFilteredEvents(scheduledEvents)
    : activeTab === "active"
    ? getFilteredEvents(activeEvents)
    : getFilteredEvents(endedEvents)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">이벤트 관리</h1>
          <p className="text-sm text-muted-foreground">
            지점의 프로모션 및 특별 이벤트 관리
          </p>
        </div>
        <Button className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          이벤트 작성
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="rounded-xl bg-muted p-1">
            <TabsTrigger
              value="scheduled"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <Clock className="mr-2 h-4 w-4" />
              예정됨 ({scheduledEvents.length})
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <Calendar className="mr-2 h-4 w-4" />
              진행 중 ({activeEvents.length})
            </TabsTrigger>
            <TabsTrigger
              value="ended"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              종료됨 ({endedEvents.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="이벤트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2 rounded-xl">
            <Filter className="h-4 w-4" />
            필터
          </Button>
        </div>

        {/* Event Content */}
        <TabsContent value="scheduled" className="mt-0">
          {currentEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardContent className="py-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery ? "검색 결과에 일치하는 예정된 이벤트가 없습니다" : "예정된 이벤트가 없습니다"}
                </p>
                <Button variant="outline" className="mt-4 rounded-xl">
                  <Plus className="mr-2 h-4 w-4" />
                  이벤트 예약
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {currentEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery ? "검색 결과에 일치하는 진행 중인 이벤트가 없습니다" : "진행 중인 이벤트가 없습니다"}
                </p>
                <Button variant="outline" className="mt-4 rounded-xl">
                  <Plus className="mr-2 h-4 w-4" />
                  이벤트 작성
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ended" className="mt-0">
          {currentEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery ? "검색 결과에 일치하는 종료된 이벤트가 없습니다" : "종료된 이벤트가 없습니다"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Auto-expire notice */}
      <Card className="rounded-2xl border-border bg-muted/50 shadow-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">자동 만료 설정</p>
            <p className="text-xs text-muted-foreground">
              종료일이 지나면 이벤트가 자동으로 &quot;종료됨&quot; 상태로 변경됩니다. 진행 중인 이벤트는 챗봇 지식베이스에 동기화됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
