"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Zap, Calendar, AlertCircle, Bot, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface RealTimeNoticeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string
}

type ImportanceLevel = "low" | "medium" | "high"

export function RealTimeNoticeModal({ open, onOpenChange, branchId }: RealTimeNoticeModalProps) {
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [importance, setImportance] = useState<ImportanceLevel>("medium")
  const [isTopBanner, setIsTopBanner] = useState(false)
  const [isChatbotPriority, setIsChatbotPriority] = useState(true)

  const handleSubmit = () => {
    // Handle form submission
    console.log({
      title,
      startDate,
      endDate,
      importance,
      isTopBanner,
      isChatbotPriority,
      branchId,
    })
    onOpenChange(false)
    // Reset form
    setTitle("")
    setStartDate("")
    setEndDate("")
    setImportance("medium")
    setIsTopBanner(false)
    setIsChatbotPriority(true)
  }

  const importanceLevels: { value: ImportanceLevel; label: string; color: string }[] = [
    { value: "low", label: "낮음", color: "bg-muted text-muted-foreground" },
    { value: "medium", label: "보통", color: "bg-warning/20 text-warning-foreground" },
    { value: "high", label: "높음", color: "bg-destructive/20 text-destructive" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">빠른 공지</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                30초 안에 실시간 공지 작성
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              공지 제목
            </Label>
            <Input
              id="title"
              placeholder="예: 연휴 안내: 12월 25-26일 휴무"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">
                시작일
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium">
                종료일
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl pl-10"
                />
              </div>
            </div>
          </div>

          {/* Importance Level */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">중요도</Label>
            <div className="flex gap-2">
              {importanceLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setImportance(level.value)}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                    importance === level.value
                      ? `${level.color} border-transparent ring-2 ring-ring ring-offset-2`
                      : "border-border bg-card hover:bg-muted"
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="topBanner" className="text-sm font-medium cursor-pointer">
                  홈페이지 상단 배너로 표시
                </Label>
              </div>
              <Switch
                id="topBanner"
                checked={isTopBanner}
                onCheckedChange={setIsTopBanner}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="chatbot" className="text-sm font-medium cursor-pointer">
                  챗봇 우선 적용
                </Label>
              </div>
              <Switch
                id="chatbot"
                checked={isChatbotPriority}
                onCheckedChange={setIsChatbotPriority}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title || !startDate || !endDate}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Zap className="mr-2 h-4 w-4" />
            공지 작성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
