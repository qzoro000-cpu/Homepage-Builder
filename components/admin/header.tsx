"use client"

import { useState } from "react"
import { Bell, ChevronDown, Search, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { branches } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface AdminHeaderProps {
  selectedBranch: string
  onBranchChange: (branchId: string) => void
}

export function AdminHeader({ selectedBranch, onBranchChange }: AdminHeaderProps) {
  const [hasNotifications] = useState(true)
  const currentBranch = branches.find((b) => b.id === selectedBranch) || branches[0]

  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 border-b border-border bg-card">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left: Branch Selector */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-xl border-border bg-card px-4 text-foreground hover:bg-muted"
              >
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{currentBranch.name}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-xl">
              {branches.map((branch) => (
                <DropdownMenuItem
                  key={branch.id}
                  onClick={() => onBranchChange(branch.id)}
                  className={cn(
                    "cursor-pointer rounded-lg",
                    selectedBranch === branch.id && "bg-muted"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{branch.name}</span>
                    <span className="text-xs text-muted-foreground">{branch.handle}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center: Search */}
        <div className="flex max-w-md flex-1 items-center px-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="콘텐츠, 의료진, 이벤트 검색..."
              className="h-10 w-full rounded-xl border border-border bg-muted/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-xl hover:bg-muted"
          >
            <Bell className="h-4.5 w-4.5 text-muted-foreground" />
            {hasNotifications && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
            )}
          </Button>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 gap-2 rounded-xl px-3 hover:bg-muted"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  AK
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem className="cursor-pointer rounded-lg">
                프로필 설정
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg">
                시스템 설정
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg text-destructive">
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
