"use client"

import { useState, useRef, useLayoutEffect } from "react"
import { X, Plus, Trash2, ChevronLeft, ChevronRight, RotateCcw, Upload, Link, Smartphone, Monitor } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export type PopupItem = {
  id: string
  imageUrl: string
  brightness: number
  contrast: number
  saturate: number
  hue: number
}

export type PopupData = {
  enabled: boolean
  items: PopupItem[]
}

export type PopupPageProps = {
  data: PopupData
  onChange: (data: PopupData) => void
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_POPUP_DATA: PopupData = {
  enabled: true,
  items: [
    {
      id: "demo-popup-1",
      imageUrl: "https://images.unsplash.com/photo-1490750967868-88df5691cc28?w=400&h=560&fit=crop&q=80",
      brightness: 100, contrast: 100, saturate: 100, hue: 0,
    },
  ],
}

function newItem(): PopupItem {
  return { id: crypto.randomUUID(), imageUrl: "", brightness: 100, contrast: 100, saturate: 100, hue: 0 }
}

// ─── PopupOverlayUI — shared between mobile & desktop previews ────────────────

export function PopupOverlayUI({
  items, scale = 1, boxW, boxH,
  current, onClose, onPrev, onNext,
  skipToday, onSkipToday,
}: {
  items: PopupItem[]
  scale?: number
  boxW: number
  boxH: number
  current: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  skipToday: boolean
  onSkipToday: (v: boolean) => void
}) {
  const item = items[current] ?? items[0]
  const total = items.length
  const imageH = boxH * 0.9
  const barH   = boxH * 0.1

  const filter = [
    `brightness(${item.brightness}%)`,
    `contrast(${item.contrast}%)`,
    `saturate(${item.saturate}%)`,
    `hue-rotate(${item.hue}deg)`,
  ].join(" ")

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ position: "relative", width: boxW, height: boxH }}>

        {/* Counter + X — floating above box, top-right */}
        <div style={{
          position: "absolute", top: -(22 * scale), right: 0,
          display: "flex", alignItems: "center", gap: 8 * scale,
        }}>
          <span style={{
            fontSize: 10 * scale, color: "rgba(255,255,255,0.85)",
            fontFamily: "system-ui", letterSpacing: "0.04em",
          }}>
            {current + 1} / {total}
          </span>
          <button type="button" onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}>
            <X size={13 * scale} color="rgba(255,255,255,0.9)" />
          </button>
        </div>

        {/* Box */}
        <div style={{
          width: "100%", height: "100%",
          borderRadius: 16 * scale,
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: "0 12px 48px rgba(0,0,0,0.55)",
        }}>

          {/* Image area — 90% */}
          <div style={{ height: imageH, position: "relative", flexShrink: 0, overflow: "hidden" }}>
            {item.imageUrl ? (
              <img
                src={item.imageUrl} alt="popup"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                background: "linear-gradient(160deg, #ddd0b8 0%, #a07840 40%, #3a2510 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 8 * scale, color: "rgba(255,255,255,0.55)", fontFamily: "system-ui" }}>
                  이미지를 추가해주세요
                </span>
              </div>
            )}

            {/* Prev / Next arrows */}
            {total > 1 && (
              <>
                <button type="button" onClick={onPrev} style={{
                  position: "absolute", left: 6 * scale, top: "50%", transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.32)", border: "none", borderRadius: "50%",
                  width: 18 * scale, height: 18 * scale,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}>
                  <ChevronLeft size={10 * scale} color="white" />
                </button>
                <button type="button" onClick={onNext} style={{
                  position: "absolute", right: 6 * scale, top: "50%", transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.32)", border: "none", borderRadius: "50%",
                  width: 18 * scale, height: 18 * scale,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}>
                  <ChevronRight size={10 * scale} color="white" />
                </button>
              </>
            )}
          </div>

          {/* Bottom bar — 10% */}
          <div style={{
            height: barH, flexShrink: 0, background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: `0 ${12 * scale}px`,
          }}>
            {/* Checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 * scale, cursor: "pointer" }}
              onClick={() => onSkipToday(!skipToday)}>
              <div style={{
                width: 11 * scale, height: 11 * scale,
                border: `1.5px solid ${skipToday ? "#333" : "#bbb"}`,
                borderRadius: 2 * scale,
                background: skipToday ? "#333" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {skipToday && (
                  <span style={{ fontSize: 7 * scale, color: "white", lineHeight: 1, fontWeight: 700 }}>✓</span>
                )}
              </div>
              <span style={{ fontSize: 7.5 * scale, color: "#555", fontFamily: "system-ui", whiteSpace: "nowrap" }}>
                오늘 하루 보지 않기
              </span>
            </div>

            {/* Close button */}
            <button type="button" onClick={onClose} style={{
              background: "#1a1a1a", border: "none",
              borderRadius: 6 * scale, padding: `${4 * scale}px ${10 * scale}px`,
              fontSize: 8 * scale, fontWeight: 600, color: "#fff",
              cursor: "pointer", fontFamily: "system-ui", whiteSpace: "nowrap",
            }}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Phone popup screen (198 × 429 phone screen) ─────────────────────────────

export function PopupPhoneScreen({ data, resetKey }: { data: PopupData; resetKey?: number }) {
  const [current,   setCurrent]   = useState(0)
  const [skipToday, setSkipToday] = useState(false)
  const [closed,    setClosed]    = useState(false)

  if (!data.enabled || closed || data.items.length === 0) return null

  return (
    <PopupOverlayUI
      items={data.items}
      scale={1}
      boxW={164}
      boxH={290}
      current={current}
      onClose={() => setClosed(true)}
      onPrev={() => setCurrent(i => (i - 1 + data.items.length) % data.items.length)}
      onNext={() => setCurrent(i => (i + 1) % data.items.length)}
      skipToday={skipToday}
      onSkipToday={setSkipToday}
    />
  )
}

// ─── Desktop popup preview (390 × 219 desktop frame) ─────────────────────────

function PopupDesktopScreen({ data }: { data: PopupData }) {
  const [current,   setCurrent]   = useState(0)
  const [skipToday, setSkipToday] = useState(false)
  const [closed,    setClosed]    = useState(false)

  if (!data.enabled || closed || data.items.length === 0) return null

  // Height: 80% of 219 = ~175px, width: portrait 3:4.5 ratio
  const boxH = Math.round(219 * 0.80)
  const boxW = Math.round(boxH * (3 / 4.5))

  return (
    <PopupOverlayUI
      items={data.items}
      scale={0.82}
      boxW={boxW}
      boxH={boxH}
      current={current}
      onClose={() => setClosed(true)}
      onPrev={() => setCurrent(i => (i - 1 + data.items.length) % data.items.length)}
      onNext={() => setCurrent(i => (i + 1) % data.items.length)}
      skipToday={skipToday}
      onSkipToday={setSkipToday}
    />
  )
}

// ─── Item Editor ──────────────────────────────────────────────────────────────

function ItemEditor({ item, onChange }: { item: PopupItem; onChange: (item: PopupItem) => void }) {
  const [tab, setTab] = useState<"url" | "file">("url")
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function patch(u: Partial<PopupItem>) { onChange({ ...item, ...u }) }

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return
    const url = URL.createObjectURL(file)
    patch({ imageUrl: url })
  }

  return (
    <div className="space-y-4">
      {/* Image section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">이미지</p>

        {/* Tab switcher */}
        <div className="flex rounded-xl border border-border overflow-hidden text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setTab("url")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 transition-colors",
              tab === "url" ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            <Link className="h-3 w-3" />URL
          </button>
          <button
            type="button"
            onClick={() => setTab("file")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 transition-colors border-l border-border",
              tab === "file" ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            <Upload className="h-3 w-3" />파일 첨부
          </button>
        </div>

        {tab === "url" ? (
          <input
            type="text"
            value={item.imageUrl.startsWith("blob:") ? "" : item.imageUrl}
            onChange={e => patch({ imageUrl: e.target.value })}
            placeholder="https:// 이미지 URL 입력"
            className="w-full rounded-xl border border-border px-3 py-2 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault(); setDragging(false)
              const file = e.dataTransfer.files[0]
              if (file) handleFile(file)
            }}
            className={cn(
              "w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-6 cursor-pointer transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">클릭하거나 파일을 여기에 드롭하세요</p>
            <p className="text-[10px] text-muted-foreground/70">JPG, PNG, WebP, GIF 지원</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>
        )}

        {/* Preview thumbnail */}
        {item.imageUrl && (
          <div className="relative w-full h-28 rounded-xl overflow-hidden border border-border group">
            <img
              src={item.imageUrl} alt=""
              className="w-full h-full object-cover"
              style={{
                filter: [
                  `brightness(${item.brightness}%)`,
                  `contrast(${item.contrast}%)`,
                  `saturate(${item.saturate}%)`,
                  `hue-rotate(${item.hue}deg)`,
                ].join(" ")
              }}
            />
            <button
              type="button"
              onClick={() => patch({ imageUrl: "" })}
              className="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Effects */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">이미지 효과</p>
          <button type="button"
            onClick={() => patch({ brightness: 100, contrast: 100, saturate: 100, hue: 0 })}
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
            <RotateCcw className="h-2.5 w-2.5" />초기화
          </button>
        </div>
        {([
          { key: "brightness", label: "밝기", min: 50,  max: 150, unit: "%" },
          { key: "contrast",   label: "대비", min: 50,  max: 200, unit: "%" },
          { key: "saturate",   label: "채도", min: 0,   max: 200, unit: "%" },
          { key: "hue",        label: "색조", min: 0,   max: 360, unit: "°" },
        ] as const).map(({ key, label, min, max, unit }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground w-8 shrink-0">{label}</span>
            <input
              type="range" min={min} max={max}
              value={item[key]}
              onChange={e => patch({ [key]: Number(e.target.value) })}
              className="flex-1 accent-primary h-1.5"
            />
            <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">
              {item[key]}{unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main PopupPage ───────────────────────────────────────────────────────────

export default function PopupPage({ data, onChange }: PopupPageProps) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [previewKey,  setPreviewKey]  = useState(0)
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile")

  const DESKTOP_VIRTUAL_W = 900
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

  function addItem() {
    const item = newItem()
    onChange({ ...data, items: [...data.items, item] })
    setSelectedIdx(data.items.length)
  }

  function removeItem(idx: number) {
    const items = data.items.filter((_, i) => i !== idx)
    onChange({ ...data, items })
    setSelectedIdx(Math.min(selectedIdx, Math.max(0, items.length - 1)))
  }

  function updateItem(idx: number, item: PopupItem) {
    onChange({ ...data, items: data.items.map((x, i) => i === idx ? item : x) })
  }

  const selectedItem = data.items[selectedIdx]

  return (
    <div
      className="grid gap-5 transition-[grid-template-columns] duration-300"
      style={{ gridTemplateColumns: device === "desktop" ? "1fr clamp(360px, 38vw, 580px)" : "1fr 320px" }}
    >

      {/* ── 좌측: 에디터 ── */}
      <div className="space-y-4">

        {/* 기본 설정 카드 */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">팝업창 설정</CardTitle>
                <CardDescription className="text-[10px]">홈 첫 진입 시 자동으로 표시됩니다</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{data.enabled ? "활성" : "비활성"}</span>
                <Switch checked={data.enabled} onCheckedChange={v => onChange({ ...data, enabled: v })} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">팝업 목록</p>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 rounded-xl border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-3 w-3" />팝업 추가
              </button>
            </div>

            {data.items.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border py-8 text-center">
                <p className="text-xs text-muted-foreground">팝업이 없습니다.</p>
                <p className="text-[10px] text-muted-foreground mt-1">위 추가 버튼을 눌러 팝업을 만드세요.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {data.items.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedIdx(idx)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer transition-all",
                      selectedIdx === idx
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="h-11 w-8 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-amber-200 to-amber-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">팝업 {idx + 1}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.imageUrl ? item.imageUrl : "이미지 미설정"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeItem(idx) }}
                      className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 선택된 팝업 편집 카드 */}
        {selectedItem && (
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm">팝업 {selectedIdx + 1} 편집</CardTitle>
              <CardDescription className="text-[10px]">이미지 URL 입력 또는 파일 첨부 후 효과를 설정하세요</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ItemEditor item={selectedItem} onChange={item => updateItem(selectedIdx, item)} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── 우측: 미리보기 ── */}
      <div className={cn("sticky top-20 space-y-3 self-start", device === "desktop" && "w-full")}>
        {/* Controls */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">미리보기</p>
          <div className="flex items-center gap-1.5">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setDevice("mobile")} className={cn("p-1.5 transition-colors", device === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Smartphone className="h-3 w-3" /></button>
              <button onClick={() => setDevice("desktop")} className={cn("p-1.5 transition-colors", device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Monitor className="h-3 w-3" /></button>
            </div>
            <button type="button" onClick={() => setPreviewKey(k => k + 1)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground rounded-lg px-2 py-1 hover:bg-muted transition-colors">
              <RotateCcw className="h-2.5 w-2.5" />다시 표시
            </button>
          </div>
        </div>

        {/* Mobile phone frame */}
        {device === "mobile" && (
          <div className="flex justify-center">
            <div className="w-[210px]">
              <div className="rounded-[30px] border-[6px] border-neutral-800 bg-neutral-800 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-center bg-neutral-800 py-1.5">
                  <div className="h-1.5 w-12 rounded-full bg-neutral-900" />
                </div>
                <div className="relative overflow-hidden" style={{ height: 429, background: "#1a1a1a" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #2a2520 0%, #1a1510 100%)" }} />
                  <div style={{ position: "absolute", top: 20, left: 0, right: 0, textAlign: "center", fontFamily: "system-ui" }}>
                    <p style={{ fontSize: 7, color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em" }}>TATOA HOMEPAGE</p>
                  </div>
                  <PopupPhoneScreen key={previewKey} data={data} />
                </div>
                <div className="flex justify-center bg-neutral-800 py-1.5">
                  <div className="h-1 w-8 rounded-full bg-neutral-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop browser frame */}
        {device === "desktop" && (
          <div className="rounded-xl border-2 border-foreground/20 bg-neutral-900 shadow-lg overflow-hidden w-full">
            <div className="flex items-center gap-2 border-b border-neutral-700 bg-neutral-800 px-3 py-2">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500/70" /><div className="h-2 w-2 rounded-full bg-yellow-500/70" /><div className="h-2 w-2 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 rounded bg-neutral-700 border border-neutral-600 px-2 py-1">
                <span className="text-[9px] text-neutral-400">tatoa.kr</span>
              </div>
              <span className="text-[9px] text-neutral-500 tabular-nums shrink-0">{DESKTOP_VIRTUAL_W}px · {Math.round(desktopScale * 100)}%</span>
            </div>
            <div ref={desktopColRef} className="relative overflow-hidden" style={{ paddingBottom: `${(9/16)*100}%` }}>
              <div className="absolute inset-0 overflow-hidden">
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #2a2520 0%, #1a1510 100%)" }} />
                <div style={{ position: "absolute", inset: 0, width: DESKTOP_VIRTUAL_W, height: `${((1/desktopScale)*100).toFixed(4)}%`, transform: `scale(${desktopScale.toFixed(4)})`, transformOrigin: "top left" }}>
                  <PopupDesktopScreen key={previewKey} data={data} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-[10px] text-muted-foreground space-y-1">
          <p>· 팝업은 홈 화면 첫 진입 시 자동으로 표시됩니다</p>
          <p>· 방문자가 &apos;오늘 하루 보지 않기&apos; 체크 시 24시간 미노출</p>
          <p>· 팝업 여러 개 등록 시 좌우 화살표로 전환 가능</p>
        </div>
      </div>
    </div>
  )
}
