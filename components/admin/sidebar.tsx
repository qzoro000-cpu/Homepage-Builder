"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Building2,
  Home,
  Info,
  Users,
  Calendar,
  HelpCircle,
  Eye,
  Bot,
  Settings,
  LayoutDashboard,
  Sparkles,
  Sliders,
  Globe,
  ClipboardList,
} from "lucide-react"

const mainNavItems = [
  {
    title: "본사",
    href: "/admin",
    icon: LayoutDashboard,
    description: "전체 지점 현황",
  },
]

const branchNavItems = [
  {
    title: "지점 홈",
    href: "/admin/branch",
    icon: Home,
    description: "지점 대시보드",
  },
  {
    title: "지점 정보",
    href: "/admin/branch/info",
    icon: Info,
    description: "지점 정보 수정",
  },
  {
    title: "홈페이지 편집",
    href: "/admin/branch/homepage",
    icon: Globe,
    description: "지점 홈페이지 관리",
  },
  {
    title: "의료진 / 장비",
    href: "/admin/branch/doctors",
    icon: Users,
    description: "직원 및 장비 관리",
  },
  {
    title: "이벤트",
    href: "/admin/branch/events",
    icon: Calendar,
    description: "프로모션 및 이벤트",
  },
  {
    title: "FAQ",
    href: "/admin/branch/faq",
    icon: HelpCircle,
    description: "자주 묻는 질문",
  },
]

const branchManagerNavItems = [
  {
    title: "예약 관리",
    href: "/admin/branch/reservations",
    icon: ClipboardList,
    description: "예약 목록 및 스케줄",
  },
]

const previewNavItems = [
  {
    title: "홈페이지 미리보기",
    href: "/admin/preview/homepage",
    icon: Eye,
    description: "지점 홈페이지 미리보기",
  },
  {
    title: "챗봇 지식베이스",
    href: "/admin/preview/chatbot",
    icon: Bot,
    description: "AI 지식베이스",
  },
]

const settingsNavItems = [
  {
    title: "설정",
    href: "/admin/settings",
    icon: Settings,
    description: "시스템 설정",
  },
  {
    title: "옵션 관리",
    href: "/admin/settings/options",
    icon: Sliders,
    description: "선택형 옵션 관리",
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-sidebar-foreground">Tatoa</h1>
            <p className="text-xs text-muted-foreground">관리자 CMS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {/* Main Section */}
          <div className="mb-6">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              개요
            </p>
            <ul className="space-y-1">
              {mainNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Branch Section */}
          <div className="mb-6">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              지점 관리
            </p>
            <ul className="space-y-1">
              {branchNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Branch Manager Section */}
          <div className="mb-6">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              지점 관리자
            </p>
            <ul className="space-y-1">
              {branchManagerNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === item.href || pathname.startsWith(item.href + "/")
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Preview Section */}
          <div className="mb-6">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              미리보기
            </p>
            <ul className="space-y-1">
              {previewNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Settings Section */}
          <div>
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              시스템
            </p>
            <ul className="space-y-1">
              {settingsNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === item.href || pathname.startsWith(item.href + "/")
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* User Info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
              AK
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">관리자 김</p>
              <p className="truncate text-xs text-muted-foreground">본사 매니저</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
