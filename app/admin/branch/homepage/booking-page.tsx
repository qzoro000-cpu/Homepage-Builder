"use client"

import { useState, useRef, useLayoutEffect } from "react"
import {
  ChevronRight, Maximize2, X, Smartphone, Monitor,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { branches } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { SiteSnapshot } from "@/lib/branch-website-store"
import { SiteNav } from "@/components/site/SiteNav"
import {
  type FieldValue, type PageId,
  FONTS, EYEBROW_SIZES, TITLE_SIZES, DESC_SIZES, WEIGHTS,
  DEFAULT_VALUES,
  val,
  PreviewBooking,
} from "@/components/site/sections/booking-preview"

// ─── Types (local — editor only) ─────────────────────────────────────────────

type BookingPageProps = {
  values: Record<string, FieldValue>
  onChange: (k: string, v: FieldValue) => void
  branchId: string
  onNavigate?: (page: PageId) => void
  snapshot?: SiteSnapshot
  branchSlug?: string
}

// ─── BookingEditor (left panel) ───────────────────────────────────────────────

type EditorSectionProps = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function EditorSection({ title, children, defaultOpen = false }: EditorSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: "1px solid rgba(201,168,92,0.15)", borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
        style={{ background: "rgba(201,168,92,0.05)", border: "none", cursor: "pointer" }}
      >
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <ChevronRight
          size={12}
          className="text-muted-foreground transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && <div className="px-3 py-3 space-y-3">{children}</div>}
    </div>
  )
}

function BookingEditor({
  values, onChange,
}: {
  values: Record<string, FieldValue>
  onChange: (k: string, v: FieldValue) => void
}) {
  const isDark   = val<string>(values, "bkBgTheme") !== "light"
  const interval = val<number>(values, "bkInterval")

  return (
    <div className="space-y-1">
      {/* 배경 테마 */}
      <EditorSection title="배경 테마" defaultOpen>
        <div className="flex items-center justify-between">
          <Label className="text-xs">다크 모드</Label>
          <Switch
            checked={isDark}
            onCheckedChange={v => onChange("bkBgTheme", v ? "dark" : "light")}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          현재: {isDark ? "다크 (골드 글로우)" : "라이트 (화이트)"}
        </p>
      </EditorSection>

      {/* 텍스트 스타일 */}
      <EditorSection title="텍스트 스타일" defaultOpen>
        <div className="space-y-5">

          {/* 영어 제목 (RESERVATION) */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">영어 제목</p>
            <Input
              value={val<string>(values, "bkEyebrow")}
              onChange={e => onChange("bkEyebrow", e.target.value)}
              className="h-7 text-xs font-mono"
              placeholder="RESERVATION"
            />
            <div className="flex gap-1 flex-wrap">
              {FONTS.map(f => (
                <button key={f.key} type="button"
                  onClick={() => onChange("bkEyebrowFont", f.key)}
                  className={cn("px-2 py-0.5 rounded-full border text-[10px] transition-all",
                    val<string>(values, "bkEyebrowFont") === f.key
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-border bg-background hover:border-muted-foreground/40"
                  )}>{f.label}</button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              {EYEBROW_SIZES.map(s => (
                <button key={s.key} type="button"
                  onClick={() => onChange("bkEyebrowSize", s.key)}
                  className={cn("px-2 py-0.5 rounded-full border text-[10px] transition-all",
                    val<string>(values, "bkEyebrowSize") === s.key
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-border bg-background hover:border-muted-foreground/40"
                  )}>{s.label} ({s.px}px)</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="color"
                value={val<string>(values, "bkEyebrowColor").startsWith("#") ? val<string>(values, "bkEyebrowColor") : "#c9a85c"}
                onChange={e => onChange("bkEyebrowColor", e.target.value)}
                className="h-7 w-8 rounded cursor-pointer border border-border shrink-0" />
              <Input value={val<string>(values, "bkEyebrowColor")}
                onChange={e => onChange("bkEyebrowColor", e.target.value)}
                className="h-7 text-xs font-mono flex-1" placeholder="#c9a85c" />
            </div>
          </div>

          <Separator />

          {/* 메인 제목 */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">메인 제목</p>
            <Input
              value={val<string>(values, "bkTitle")}
              onChange={e => onChange("bkTitle", e.target.value)}
              className="h-7 text-xs"
              placeholder="온라인 예약"
            />
            <div className="flex gap-1 flex-wrap">
              {FONTS.map(f => (
                <button key={f.key} type="button"
                  onClick={() => onChange("bkTitleFont", f.key)}
                  className={cn("px-2 py-0.5 rounded-full border text-[10px] transition-all",
                    val<string>(values, "bkTitleFont") === f.key
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-border bg-background hover:border-muted-foreground/40"
                  )}>{f.label}</button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              {TITLE_SIZES.map(s => (
                <button key={s.key} type="button"
                  onClick={() => onChange("bkTitleSize", s.key)}
                  className={cn("px-2 py-0.5 rounded-full border text-[10px] transition-all",
                    val<string>(values, "bkTitleSize") === s.key
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-border bg-background hover:border-muted-foreground/40"
                  )}>{s.label} ({s.px}px)</button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              {WEIGHTS.map(w => (
                <button key={w.key} type="button"
                  onClick={() => onChange("bkTitleWeight", w.key)}
                  className={cn("px-2 py-0.5 rounded-full border text-[10px] transition-all",
                    val<string>(values, "bkTitleWeight") === w.key
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-border bg-background hover:border-muted-foreground/40"
                  )}>{w.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="color"
                value={val<string>(values, "bkTitleColor").startsWith("#") ? val<string>(values, "bkTitleColor") : "#ffffff"}
                onChange={e => onChange("bkTitleColor", e.target.value)}
                className="h-7 w-8 rounded cursor-pointer border border-border shrink-0" />
              <Input value={val<string>(values, "bkTitleColor")}
                onChange={e => onChange("bkTitleColor", e.target.value)}
                className="h-7 text-xs font-mono flex-1" placeholder="#ffffff" />
            </div>
          </div>

          <Separator />

          {/* 설명 텍스트 (공통 스타일) */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">설명 텍스트 스타일</p>
            <p className="text-[10px] text-muted-foreground">각 단계 설명에 공통 적용됩니다.</p>
            <div className="flex gap-1 flex-wrap">
              {FONTS.map(f => (
                <button key={f.key} type="button"
                  onClick={() => onChange("bkDescFont", f.key)}
                  className={cn("px-2 py-0.5 rounded-full border text-[10px] transition-all",
                    val<string>(values, "bkDescFont") === f.key
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-border bg-background hover:border-muted-foreground/40"
                  )}>{f.label}</button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              {DESC_SIZES.map(s => (
                <button key={s.key} type="button"
                  onClick={() => onChange("bkDescSize", s.key)}
                  className={cn("px-2 py-0.5 rounded-full border text-[10px] transition-all",
                    val<string>(values, "bkDescSize") === s.key
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-border bg-background hover:border-muted-foreground/40"
                  )}>{s.label} ({s.px}px)</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="color"
                value={val<string>(values, "bkDescColor").startsWith("#") ? val<string>(values, "bkDescColor") : "#aaaaaa"}
                onChange={e => onChange("bkDescColor", e.target.value)}
                className="h-7 w-8 rounded cursor-pointer border border-border shrink-0" />
              <Input value={val<string>(values, "bkDescColor")}
                onChange={e => onChange("bkDescColor", e.target.value)}
                className="h-7 text-xs font-mono flex-1" placeholder="rgba(255,255,255,0.55)" />
            </div>
          </div>

        </div>
      </EditorSection>

      {/* 단계별 설명 */}
      <EditorSection title="단계별 설명">
        {[
          { key: "bkDesc1", label: "Step 1 — 지점 선택" },
          { key: "bkDesc2", label: "Step 2 — 진료 옵션" },
          { key: "bkDesc3", label: "Step 3 — 시술 선택" },
          { key: "bkDesc4", label: "Step 4 — 날짜/시간" },
          { key: "bkDesc5", label: "Step 5 — 고객 정보" },
          { key: "bkDesc6", label: "Step 6 — 완료 메시지" },
        ].map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">{label}</Label>
            <RichTextEditor
              mode="floating"
              value={val<string>(values, key)}
              onChange={(html) => onChange(key, html)}
              placeholder={DEFAULT_VALUES[key] as string}
              minHeight={60}
              style={{ fontSize: "12px" }}
            />
          </div>
        ))}
      </EditorSection>

      {/* 시간 설정 */}
      <EditorSection title="시간 설정 (예약 슬롯)">
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">진료 시작 시간</Label>
            <Input
              value={val<string>(values, "bkStartHour")}
              onChange={e => onChange("bkStartHour", e.target.value)}
              className="h-7 text-xs"
              placeholder="09:00"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">마감 시간</Label>
            <Input
              value={val<string>(values, "bkEndHour")}
              onChange={e => onChange("bkEndHour", e.target.value)}
              className="h-7 text-xs"
              placeholder="19:00"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">예약 간격 (분)</Label>
            <div className="flex gap-1">
              {[10, 15, 30, 60].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onChange("bkInterval", mins)}
                  className={`h-7 px-2 text-xs rounded border ${
                    interval === mins
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-input hover:bg-accent"
                  }`}
                >{mins}분</button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            예) 09:00 ~ 19:00, 30분 간격 → 슬롯 20개
          </p>
        </div>
      </EditorSection>

      {/* 운영 지점 목록 */}
      <EditorSection title="운영 지점 목록">
        <p className="text-[10px] text-muted-foreground mb-2">
          아래 지점은 지점 정보에서 자동으로 불러옵니다. (공개 설정된 지점만 표시됩니다)
        </p>
        <div className="space-y-1.5">
          {branches.filter(b => b.isPublic).map(b => (
            <div key={b.id} className="flex items-start gap-2 p-2 rounded border border-border bg-muted/20">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-foreground truncate">{b.name}</div>
                <div className="text-[9px] text-muted-foreground truncate">{b.address}</div>
                <div className="text-[9px] text-muted-foreground">{b.phone}</div>
              </div>
              <Badge variant="outline" className="text-[8px] h-4 px-1 shrink-0">공개</Badge>
            </div>
          ))}
          {branches.filter(b => !b.isPublic).map(b => (
            <div key={b.id} className="flex items-start gap-2 p-2 rounded border border-border bg-muted/10 opacity-50">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-muted-foreground truncate">{b.name}</div>
              </div>
              <Badge variant="outline" className="text-[8px] h-4 px-1 shrink-0 text-muted-foreground">비공개</Badge>
            </div>
          ))}
        </div>
      </EditorSection>
    </div>
  )
}

// ─── Main export: BookingPage ─────────────────────────────────────────────────

export default function BookingPage({ values, onChange, branchId, onNavigate, snapshot, branchSlug }: BookingPageProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile")
  const branchName = (branchId ?? "").replace(/-/g, " ")
  // STEP 19-A-4 (2026-05-09): 어드민도 테스트 사이트와 동일하게 단일 지점만 미리보기.
  // 멀티브랜치 도입 시 재검토.
  const currentBranch =
    branches.find((b) => b.id === branchId) ??
    { id: branchId, name: branchName }
  const singleBranches = [currentBranch]

  const DESKTOP_VIRTUAL_W = 1280
  const desktopColRef = useRef<HTMLDivElement>(null)
  const [desktopScale, setDesktopScale] = useState(() =>
    typeof window !== "undefined" ? Math.min(window.innerWidth * 0.38, 580) / DESKTOP_VIRTUAL_W : 400 / DESKTOP_VIRTUAL_W
  )
  useLayoutEffect(() => {
    const el = desktopColRef.current
    if (!el) return
    const update = () => { const w = el.getBoundingClientRect().width; if (w > 0) setDesktopScale(w / DESKTOP_VIRTUAL_W) }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      className="grid gap-5 transition-[grid-template-columns] duration-300"
      style={{ gridTemplateColumns: "1fr clamp(395px, 38vw, 580px)" }}
    >
      {/* Left: Editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">예약 페이지 설정</CardTitle>
          <CardDescription className="text-xs">
            예약 플로우 텍스트·테마·시간 슬롯을 편집합니다.
            미리보기에서 각 단계를 직접 클릭해 확인하세요.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <BookingEditor values={values} onChange={onChange} />
        </CardContent>
      </Card>

      {/* Right: Preview */}
      <div className={cn("sticky top-20 space-y-3 self-start", device === "desktop" && "w-full")}>
        {/* Controls */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">미리보기</p>
          <div className="flex items-center gap-1.5">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setDevice("mobile")} className={cn("p-1.5 transition-colors", device === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Smartphone className="h-3 w-3" /></button>
              <button onClick={() => setDevice("desktop")} className={cn("p-1.5 transition-colors", device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Monitor className="h-3 w-3" /></button>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFullscreen(f => !f)} title="전체화면">
              <Maximize2 size={12} />
            </Button>
          </div>
        </div>

        {/* Mobile viewport simulator */}
        {device === "mobile" && (
          <div className="flex justify-center">
            <div style={{ width: 375, height: 700, overflow: "hidden", border: "1px solid #e5e5e5", borderRadius: 12, background: "white", flexShrink: 0 }}>
              <div style={{ height: "100%", overflowY: "auto" }}>
                <div style={{ height: 60, background: "#ffffff", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }} />
                <PreviewBooking values={values} branchId={branchId} branches={singleBranches} onNavigate={onNavigate} mode="page" forceNarrow={true} />
              </div>
            </div>
          </div>
        )}

        {/* Desktop 1280px viewport — scaled to fit panel */}
        {device === "desktop" && (
          <div ref={desktopColRef} style={{ position: "relative", width: "100%", height: 600, overflow: "hidden", border: "1px solid #e5e5e5", borderRadius: 12 }}>
            <div style={{
              position: "absolute", top: 0, left: 0,
              width: 1280,
              height: desktopScale > 0 ? Math.round(600 / desktopScale) : 1333,
              transform: `scale(${desktopScale})`,
              transformOrigin: "top left",
              overflowY: "auto",
            }}>
              {snapshot && branchSlug && (
                <SiteNav snapshot={snapshot} branchSlug={branchSlug} isPreview={false} device="desktop" />
              )}
              <div style={{ paddingTop: 60 }}>
                <PreviewBooking values={values} branchId={branchId} branches={singleBranches} onNavigate={onNavigate} mode="page" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-white" style={{ transform: "translateZ(0)" }} onClick={() => setFullscreen(false)}>
          <div onClick={e => e.stopPropagation()}>
            {snapshot && branchSlug && (
              <SiteNav snapshot={snapshot} branchSlug={branchSlug} isPreview={false} device="desktop" />
            )}
            <div className="pt-[60px]">
              <PreviewBooking values={values} branchId={branchId} branches={singleBranches} onNavigate={onNavigate} mode="page" />
            </div>
          </div>
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 text-foreground opacity-70 hover:opacity-100" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  )
}
