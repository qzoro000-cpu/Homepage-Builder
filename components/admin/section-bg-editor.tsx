"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ImageIcon } from "lucide-react"
import type { SectionBgImageCfg } from "@/lib/landing-preview-types"

// ── 위치 프리셋 (3×3 그리드) ─────────────────────────────────────────────────
const POSITIONS: { value: string; label: string }[] = [
  { value: "top left",     label: "↖" },
  { value: "top center",   label: "위" },
  { value: "top right",    label: "↗" },
  { value: "center left",  label: "좌" },
  { value: "center",       label: "중앙" },
  { value: "center right", label: "우" },
  { value: "bottom left",  label: "↙" },
  { value: "bottom center",label: "아래" },
  { value: "bottom right", label: "↘" },
]

// ── 그라데이션 오버레이 프리셋 ────────────────────────────────────────────────
const GRADIENT_OPTIONS: { value: SectionBgImageCfg["overlayGradient"]; label: string }[] = [
  { value: "none",      label: "없음"    },
  { value: "to-bottom", label: "↓ 아래"  },
  { value: "to-top",    label: "↑ 위"    },
  { value: "to-right",  label: "→ 우측"  },
  { value: "to-left",   label: "← 좌측"  },
  { value: "radial",    label: "◉ 방사형" },
]

// ── 기본값 ────────────────────────────────────────────────────────────────────
const DEF = {
  position:       "center",
  blur:           0,
  opacity:        100,
  scale:          100,
  brightness:     100,
  contrast:       100,
  saturate:       100,
  hue:            0,
  overlayOpacity: 50,
} as const

// ── 슬라이더 행 ───────────────────────────────────────────────────────────────
function SliderRow({
  label, value, min, max, step = 1, defaultVal, unit = "", onChange,
}: {
  label: string; value: number; min: number; max: number
  step?: number; defaultVal: number; unit?: string; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <Slider
        min={min} max={max} step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="flex-1"
      />
      <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-foreground/70">
        {value}{unit}
      </span>
      {value !== defaultVal && (
        <button
          type="button"
          onClick={() => onChange(defaultVal)}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          title="초기화"
        >↺</button>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
type Props = {
  imageUrl?: string
  cfg?: SectionBgImageCfg
  onImageChange: (url: string) => void
  onCfgChange:   (cfg: SectionBgImageCfg) => void
  onClear:       () => void
}

export function SectionBgEditor({ imageUrl, cfg, onImageChange, onCfgChange, onClear }: Props) {
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const [showAdj,     setShowAdj]     = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [showUrl,     setShowUrl]     = useState(false)
  const [urlInput,    setUrlInput]    = useState("")
  const [dragging,    setDragging]    = useState(false)

  const c = cfg ?? {}
  const pos            = c.position       ?? DEF.position
  const blur           = c.blur           ?? DEF.blur
  const opacity        = c.opacity        ?? DEF.opacity
  const scale          = c.scale          ?? DEF.scale
  const brightness     = c.brightness     ?? DEF.brightness
  const contrast       = c.contrast       ?? DEF.contrast
  const saturate       = c.saturate       ?? DEF.saturate
  const hue            = c.hue            ?? DEF.hue
  const overlayColor   = c.overlayColor   ?? "#000000"
  const overlayOpacity = c.overlayOpacity ?? DEF.overlayOpacity
  const overlayGradient = c.overlayGradient ?? "none"

  const patch = (fields: Partial<SectionBgImageCfg>) => onCfgChange({ ...c, ...fields })
  const adjActive     = brightness !== 100 || contrast !== 100 || saturate !== 100 || hue !== 0 || scale !== 100
  const overlayActive = !!(c.overlayColor && overlayOpacity > 0)

  // 파일 → blob URL
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    onImageChange(URL.createObjectURL(file))
  }

  const applyUrl = () => {
    const t = urlInput.trim()
    if (t) { onImageChange(t); setUrlInput(""); setShowUrl(false) }
  }

  // ── 이미지 없을 때: 업로드 존 ─────────────────────────────────────────────
  if (!imageUrl) {
    return (
      <div className="space-y-2">
        {/* 드래그&드롭 / 클릭 업로드 */}
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/40"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault(); setDragging(false)
            const f = e.dataTransfer.files[0]; if (f) handleFile(f)
          }}
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">배경 이미지 업로드</p>
            <p className="text-xs text-muted-foreground mt-0.5">클릭 또는 드래그 · JPG / PNG / WebP</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }}
          />
        </div>

        {/* URL 입력 (토글) */}
        <button
          type="button"
          onClick={() => setShowUrl(!showUrl)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showUrl ? "▾ URL 닫기" : "▸ URL로 직접 입력"}
        </button>
        {showUrl && (
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applyUrl()}
              placeholder="https://... 이미지 URL 붙여넣기"
              className="h-8 text-xs"
            />
            <Button type="button" size="sm" onClick={applyUrl} disabled={!urlInput.trim()} className="h-8 shrink-0 text-xs">
              적용
            </Button>
          </div>
        )}
      </div>
    )
  }

  // ── 이미지 있을 때: 미리보기 + 편집 컨트롤 ──────────────────────────────────
  return (
    <div className="space-y-3">

      {/* 미리보기 썸네일 */}
      <div className="relative w-full h-28 overflow-hidden rounded-xl border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
          style={{
            filter: [
              blur        > 0   ? `blur(${blur}px)`         : "",
              brightness !== 100 ? `brightness(${brightness}%)` : "",
              contrast   !== 100 ? `contrast(${contrast}%)`     : "",
              saturate   !== 100 ? `saturate(${saturate}%)`     : "",
              hue        !== 0   ? `hue-rotate(${hue}deg)`      : "",
            ].filter(Boolean).join(" ") || undefined,
            opacity: opacity / 100,
            objectPosition: pos,
          }}
        />
        {overlayActive && (
          <div className="absolute inset-0" style={{ background: overlayColor, opacity: overlayOpacity / 100 }} />
        )}
        {/* 이미지 교체 버튼 (호버 시) */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-black hover:bg-white transition-colors"
          >
            📁 교체
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 transition-colors"
          >
            ✕ 제거
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }}
        />
      </div>

      {/* URL로 변경 (토글) */}
      <button
        type="button"
        onClick={() => setShowUrl(!showUrl)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showUrl ? "▾ URL 닫기" : "▸ URL로 변경"}
      </button>
      {showUrl && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && applyUrl()}
            placeholder="https://... 이미지 URL"
            className="h-7 text-xs"
          />
          <Button type="button" size="sm" onClick={applyUrl} disabled={!urlInput.trim()} className="h-7 shrink-0 text-xs px-2">
            적용
          </Button>
        </div>
      )}

      {/* ── 위치 3×3 ── */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">이미지 위치</Label>
        <div className="grid grid-cols-3 gap-1">
          {POSITIONS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => patch({ position: p.value })}
              className={`h-7 rounded text-[11px] transition-colors ${
                pos === p.value
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 기본 조정 ── */}
      <div className="space-y-1.5 pt-1">
        <SliderRow label="블러"     value={blur}    min={0} max={30}  defaultVal={0}   unit="px" onChange={v => patch({ blur: v })} />
        <SliderRow label="불투명도" value={opacity}  min={0} max={100} defaultVal={100} unit="%" onChange={v => patch({ opacity: v })} />
      </div>

      {/* ── 이미지 조정 (펼침/접힘) ── */}
      <button
        type="button"
        onClick={() => setShowAdj(!showAdj)}
        className="flex w-full items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
      >
        <span className={`transition-transform duration-150 ${showAdj ? "rotate-90" : ""}`}>▶</span>
        <span>이미지 조정</span>
        {adjActive && (
          <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium text-primary">편집됨</span>
        )}
      </button>
      {showAdj && (
        <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-3">
          <SliderRow label="확대"  value={scale}      min={100} max={150} defaultVal={100} unit="%" onChange={v => patch({ scale: v })} />
          <SliderRow label="밝기"  value={brightness} min={0}   max={200} defaultVal={100} unit="%" onChange={v => patch({ brightness: v })} />
          <SliderRow label="대비"  value={contrast}   min={0}   max={200} defaultVal={100} unit="%" onChange={v => patch({ contrast: v })} />
          <SliderRow label="채도"  value={saturate}   min={0}   max={200} defaultVal={100} unit="%" onChange={v => patch({ saturate: v })} />
          <SliderRow label="색조"  value={hue}        min={-180} max={180} defaultVal={0}  unit="°" onChange={v => patch({ hue: v })} />
        </div>
      )}

      {/* ── 색상 오버레이 (펼침/접힘) ── */}
      <button
        type="button"
        onClick={() => setShowOverlay(!showOverlay)}
        className="flex w-full items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
      >
        <span className={`transition-transform duration-150 ${showOverlay ? "rotate-90" : ""}`}>▶</span>
        <span>색상 오버레이</span>
        {overlayActive && (
          <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium text-primary">활성</span>
        )}
      </button>
      {showOverlay && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
          {/* 색상 + 강도 */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 shrink-0">색상</span>
            <input
              type="color"
              value={overlayColor}
              onChange={e => patch({ overlayColor: e.target.value })}
              className="w-9 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5"
            />
            <div className="flex-1">
              <SliderRow
                label="강도"
                value={overlayOpacity}
                min={0} max={100} defaultVal={50} unit="%"
                onChange={v => patch({ overlayOpacity: v })}
              />
            </div>
          </div>
          {/* 그라데이션 방향 */}
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">그라데이션 방향</span>
            <div className="grid grid-cols-3 gap-1">
              {GRADIENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => patch({ overlayGradient: opt.value })}
                  className={`h-7 rounded text-[11px] transition-colors ${
                    overlayGradient === opt.value
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
