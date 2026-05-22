"use client"

import { useState, useCallback, useRef } from "react"
import {
  X, Monitor, Smartphone, LayoutGrid, Image as ImageIcon,
  RotateCcw, Copy, Save, Loader2, Check, ChevronDown, ChevronUp,
  Sliders, Wand2, Layers
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  useMedia,
  SYSTEM_PRESETS,
  PLACEMENT_LABELS,
  EMPTY_RECIPE,
  buildCssFilter,
  buildOverlayLayers,
  generateCanvasOutput,
  type EffectRecipe,
  type PlacementType,
  type MediaEffectPreset,
  type MediaVariant,
} from "@/lib/media-store"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

type PreviewMode = "desktop" | "mobile" | "card" | "hero"

const PREVIEW_SIZES: Record<PreviewMode, { w: number; h: number; label: string; icon: React.ReactNode }> = {
  desktop: { w: 480, h: 270, label: "데스크톱", icon: <Monitor className="h-3.5 w-3.5" /> },
  mobile: { w: 200, h: 356, label: "모바일", icon: <Smartphone className="h-3.5 w-3.5" /> },
  card: { w: 240, h: 180, label: "카드", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  hero: { w: 480, h: 200, label: "히어로", icon: <ImageIcon className="h-3.5 w-3.5" /> },
}

const PLACEMENT_LIST = Object.entries(PLACEMENT_LABELS) as [PlacementType, string][]

function SliderRow({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format = (v: number) => (v >= 0 ? `+${(v * 100).toFixed(0)}` : `${(v * 100).toFixed(0)}`),
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs w-14 shrink-0 text-muted-foreground">{label}</Label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1.5 accent-primary cursor-pointer"
      />
      <span className="text-xs w-9 text-right font-mono tabular-nums">{format(value)}</span>
    </div>
  )
}

// Small preset thumbnail with CSS effect applied
function PresetThumb({
  preset,
  imageUrl,
  selected,
  onClick,
}: {
  preset: MediaEffectPreset
  imageUrl: string
  selected: boolean
  onClick: () => void
}) {
  const cssFilter = buildCssFilter(preset.recipe)
  const overlayLayers = buildOverlayLayers(preset.recipe)

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-lg overflow-hidden border-2 transition-all shrink-0 w-full aspect-video",
        selected ? "border-primary shadow-md shadow-primary/20" : "border-border hover:border-primary/50"
      )}
      title={preset.description}
    >
      <img
        src={imageUrl}
        alt={preset.name}
        className="w-full h-full object-cover"
        style={{ filter: cssFilter || undefined, borderRadius: preset.recipe.radius ? `${preset.recipe.radius}px` : undefined }}
      />
      {overlayLayers.map((layer) => (
        <div key={layer.key} style={layer.style} />
      ))}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3">
        <p className="text-white text-[10px] font-medium leading-tight truncate">{preset.name}</p>
      </div>
      {selected && (
        <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-white" />
        </div>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────
// Main Editor
// ─────────────────────────────────────────────

type ImageEffectEditorProps = {
  imageUrl: string
  assetId: string
  assetTitle?: string
  onClose: () => void
  onSaved?: (variant: MediaVariant) => void
}

export function ImageEffectEditor({
  imageUrl,
  assetId,
  assetTitle,
  onClose,
  onSaved,
}: ImageEffectEditorProps) {
  const {
    getActivePresets, getVariants, createVariant, updateVariant, deleteVariant, duplicateVariant,
  } = useMedia()

  const allPresets = getActivePresets()
  const existingVariants = getVariants(assetId)

  // State
  const [recipe, setRecipe] = useState<EffectRecipe>({ ...EMPTY_RECIPE })
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [placement, setPlacement] = useState<PlacementType>("homepage_card")
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop")
  const [isSaving, setIsSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeTab, setActiveTab] = useState<"presets" | "variants">("presets")
  const [dupVariantId, setDupVariantId] = useState<string | null>(null)

  const patch = useCallback(<K extends keyof EffectRecipe>(key: K, value: EffectRecipe[K]) => {
    setRecipe((prev) => ({ ...prev, [key]: value }))
    setSelectedPresetId(null) // custom — deselect preset
  }, [])

  function applyPreset(preset: MediaEffectPreset) {
    setRecipe({ ...preset.recipe })
    setSelectedPresetId(preset.id)
  }

  function resetRecipe() {
    setRecipe({ ...EMPTY_RECIPE })
    setSelectedPresetId(null)
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const outputUrl = await generateCanvasOutput(imageUrl, recipe)

      const presetId = selectedPresetId ?? undefined
      // Update existing variant for same placement or create new
      const existing = existingVariants.find((v) => v.placementType === placement)
      if (existing) {
        updateVariant(existing.id, {
          recipe: { ...recipe },
          presetId,
          outputFileUrl: outputUrl,
          isPrimary: existingVariants.length === 1,
        })
        setSavedId(existing.id)
        onSaved?.({ ...existing, recipe, outputFileUrl: outputUrl })
      } else {
        const v = createVariant({
          assetId,
          placementType: placement,
          presetId,
          recipe: { ...recipe },
          outputFileUrl: outputUrl,
          isPrimary: existingVariants.length === 0,
        })
        setSavedId(v.id)
        onSaved?.(v)
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Derived CSS for preview
  const cssFilter = buildCssFilter(recipe)
  const overlayLayers = buildOverlayLayers(recipe)
  const previewSize = PREVIEW_SIZES[previewMode]

  const selectedPreset = allPresets.find((p) => p.id === selectedPresetId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wand2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">이미지 스타일 편집</h2>
              <p className="text-xs text-muted-foreground">{assetTitle ?? "원본 이미지"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden flex">

          {/* ══ Left: Presets / Variants ══ */}
          <div className="w-52 shrink-0 border-r flex flex-col">
            {/* Tab switch */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("presets")}
                className={cn(
                  "flex-1 py-2.5 text-xs font-medium transition-colors",
                  activeTab === "presets"
                    ? "text-primary border-b-2 border-primary -mb-px bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Wand2 className="h-3 w-3 inline mr-1" />프리셋
              </button>
              <button
                onClick={() => setActiveTab("variants")}
                className={cn(
                  "flex-1 py-2.5 text-xs font-medium transition-colors",
                  activeTab === "variants"
                    ? "text-primary border-b-2 border-primary -mb-px bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="h-3 w-3 inline mr-1" />저장됨
                {existingVariants.length > 0 && (
                  <span className="ml-1 bg-muted rounded px-1 text-[10px]">{existingVariants.length}</span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {activeTab === "presets" && (
                <>
                  {/* No effect option */}
                  <button
                    onClick={resetRecipe}
                    className={cn(
                      "w-full rounded-lg border px-2.5 py-2 text-left text-xs transition-all",
                      selectedPresetId === null
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <span className="font-medium">효과 없음</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">원본 그대로</p>
                  </button>

                  {allPresets.map((preset) => (
                    <PresetThumb
                      key={preset.id}
                      preset={preset}
                      imageUrl={imageUrl}
                      selected={selectedPresetId === preset.id}
                      onClick={() => applyPreset(preset)}
                    />
                  ))}
                </>
              )}

              {activeTab === "variants" && (
                <>
                  {existingVariants.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6 px-2">
                      저장된 variant가 없습니다. 왼쪽에서 프리셋을 선택하고 저장하세요.
                    </p>
                  )}
                  {existingVariants.map((v) => (
                    <div key={v.id} className="rounded-lg border p-2 space-y-1.5">
                      <div className="relative aspect-video rounded overflow-hidden bg-muted">
                        <img
                          src={v.outputFileUrl}
                          alt={PLACEMENT_LABELS[v.placementType]}
                          className="w-full h-full object-cover"
                        />
                        {v.isPrimary && (
                          <Badge className="absolute top-1 left-1 text-[9px] bg-primary/90 text-white px-1 py-0">대표</Badge>
                        )}
                      </div>
                      <p className="text-xs font-medium">{PLACEMENT_LABELS[v.placementType]}</p>
                      {v.presetId && (
                        <p className="text-[10px] text-muted-foreground">
                          {allPresets.find((p) => p.id === v.presetId)?.name ?? v.presetId}
                        </p>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setRecipe({ ...v.recipe })
                            setSelectedPresetId(v.presetId ?? null)
                            setPlacement(v.placementType)
                            setActiveTab("presets")
                          }}
                          className="flex-1 rounded bg-muted text-[10px] text-muted-foreground hover:text-foreground py-1"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => deleteVariant(v.id)}
                          className="rounded bg-muted text-[10px] text-red-400 hover:text-red-600 px-2 py-1"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* ══ Center: Preview ══ */}
          <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
            {/* Preview mode switcher */}
            <div className="flex items-center gap-1 px-4 py-2.5 border-b bg-background">
              {(Object.entries(PREVIEW_SIZES) as [PreviewMode, typeof PREVIEW_SIZES[PreviewMode]][]).map(
                ([mode, info]) => (
                  <button
                    key={mode}
                    onClick={() => setPreviewMode(mode)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all",
                      previewMode === mode
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {info.icon}
                    {info.label}
                  </button>
                )
              )}
              {selectedPreset && (
                <Badge className="ml-auto text-xs bg-primary/10 text-primary border-0">
                  {selectedPreset.name}
                </Badge>
              )}
            </div>

            {/* Preview canvas */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
              <div
                className="relative overflow-hidden shadow-2xl"
                style={{
                  width: previewSize.w,
                  height: previewSize.h,
                  borderRadius: recipe.radius ? `${recipe.radius}px` : "12px",
                  flexShrink: 0,
                }}
              >
                <img
                  src={imageUrl}
                  alt="미리보기"
                  className="w-full h-full object-cover"
                  style={{
                    filter: cssFilter || undefined,
                    display: "block",
                  }}
                  draggable={false}
                />
                {overlayLayers.map((layer) => (
                  <div key={layer.key} style={layer.style} />
                ))}
              </div>
            </div>

            {/* Placement selector */}
            <div className="px-4 py-2.5 border-t bg-background flex items-center gap-3">
              <Label className="text-xs text-muted-foreground shrink-0">저장 위치:</Label>
              <Select value={placement} onValueChange={(v) => setPlacement(v as PlacementType)}>
                <SelectTrigger className="h-7 text-xs flex-1 max-w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENT_LIST.map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {existingVariants.find((v) => v.placementType === placement) && (
                <Badge className="text-xs bg-amber-100 text-amber-700">이미 저장됨 — 덮어씌웁니다</Badge>
              )}
            </div>
          </div>

          {/* ══ Right: Controls ══ */}
          <div className="w-56 shrink-0 border-l flex flex-col">
            <div className="px-3 py-2.5 border-b flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">세부 조절</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Basic tone */}
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-muted-foreground">색감 보정</p>
                <SliderRow label="밝기" value={recipe.brightness} min={-0.5} max={0.5} onChange={(v) => patch("brightness", v)} />
                <SliderRow label="대비" value={recipe.contrast} min={-0.5} max={0.5} onChange={(v) => patch("contrast", v)} />
                <SliderRow label="채도" value={recipe.saturation} min={-1} max={1} onChange={(v) => patch("saturation", v)} />
              </div>

              {/* Overlay */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">오버레이</p>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">유형</Label>
                  <Select
                    value={recipe.overlay?.type ?? "none"}
                    onValueChange={(v) => {
                      if (v === "none") {
                        patch("overlay", undefined)
                      } else {
                        patch("overlay", {
                          type: v as "linear_gradient" | "radial_gradient" | "solid",
                          direction: "bottom",
                          color: "0,0,0",
                          opacity: recipe.overlay?.opacity ?? 0.4,
                        })
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">없음</SelectItem>
                      <SelectItem value="linear_gradient">선형 그라디언트</SelectItem>
                      <SelectItem value="radial_gradient">방사형 그라디언트</SelectItem>
                      <SelectItem value="solid">단색</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {recipe.overlay && (
                  <>
                    {recipe.overlay.type === "linear_gradient" && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">방향</Label>
                        <Select
                          value={recipe.overlay.direction ?? "bottom"}
                          onValueChange={(v) =>
                            patch("overlay", { ...recipe.overlay!, direction: v as "top" | "bottom" | "left" | "right" })
                          }
                        >
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottom">아래에서 위로</SelectItem>
                            <SelectItem value="top">위에서 아래로</SelectItem>
                            <SelectItem value="left">왼쪽에서</SelectItem>
                            <SelectItem value="right">오른쪽에서</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <SliderRow
                      label="불투명도"
                      value={recipe.overlay.opacity}
                      min={0}
                      max={0.9}
                      onChange={(v) => patch("overlay", { ...recipe.overlay!, opacity: v })}
                      format={(v) => `${(v * 100).toFixed(0)}%`}
                    />
                  </>
                )}
              </div>

              {/* Fade */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">페이드</p>
                <Select
                  value={recipe.fade?.type ?? "none"}
                  onValueChange={(v) => {
                    if (v === "none") {
                      patch("fade", undefined)
                    } else {
                      patch("fade", { type: v as "edge" | "top" | "bottom" | "left" | "right", strength: recipe.fade?.strength ?? 0.4 })
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음</SelectItem>
                    <SelectItem value="edge">가장자리</SelectItem>
                    <SelectItem value="top">위 페이드</SelectItem>
                    <SelectItem value="bottom">아래 페이드</SelectItem>
                  </SelectContent>
                </Select>
                {recipe.fade && (
                  <SliderRow
                    label="강도"
                    value={recipe.fade.strength}
                    min={0}
                    max={1}
                    onChange={(v) => patch("fade", { ...recipe.fade!, strength: v })}
                    format={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                )}
              </div>

              {/* Advanced toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full"
              >
                {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                고급 효과 {showAdvanced ? "접기" : "펼치기"}
              </button>

              {showAdvanced && (
                <div className="space-y-4 border-t pt-3">
                  {/* Vignette */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">비네트</p>
                      <button
                        onClick={() =>
                          patch("vignette", {
                            enabled: !recipe.vignette?.enabled,
                            strength: recipe.vignette?.strength ?? 0.35,
                          })
                        }
                        className={cn(
                          "h-5 w-9 rounded-full border transition-colors",
                          recipe.vignette?.enabled ? "bg-primary border-primary" : "bg-muted border-border"
                        )}
                      >
                        <div
                          className={cn(
                            "h-3.5 w-3.5 rounded-full bg-white shadow transition-transform mx-0.5",
                            recipe.vignette?.enabled ? "translate-x-3.5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                    {recipe.vignette?.enabled && (
                      <SliderRow
                        label="강도"
                        value={recipe.vignette.strength}
                        min={0}
                        max={0.8}
                        onChange={(v) => patch("vignette", { ...recipe.vignette!, strength: v })}
                        format={(v) => `${(v * 100).toFixed(0)}%`}
                      />
                    )}
                  </div>

                  {/* Glow */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">글로우</p>
                      <button
                        onClick={() =>
                          patch("glow", {
                            enabled: !recipe.glow?.enabled,
                            strength: recipe.glow?.strength ?? 0.2,
                          })
                        }
                        className={cn(
                          "h-5 w-9 rounded-full border transition-colors",
                          recipe.glow?.enabled ? "bg-primary border-primary" : "bg-muted border-border"
                        )}
                      >
                        <div
                          className={cn(
                            "h-3.5 w-3.5 rounded-full bg-white shadow transition-transform mx-0.5",
                            recipe.glow?.enabled ? "translate-x-3.5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                    {recipe.glow?.enabled && (
                      <SliderRow
                        label="강도"
                        value={recipe.glow.strength}
                        min={0}
                        max={0.6}
                        onChange={(v) => patch("glow", { ...recipe.glow!, strength: v })}
                        format={(v) => `${(v * 100).toFixed(0)}%`}
                      />
                    )}
                  </div>

                  {/* Border Radius */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">라운드 코너</p>
                    <SliderRow
                      label="반경"
                      value={recipe.radius ?? 0}
                      min={0}
                      max={48}
                      step={2}
                      onChange={(v) => patch("radius", v)}
                      format={(v) => `${v}px`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t px-5 py-3 flex items-center justify-between gap-3 shrink-0 bg-background">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={resetRecipe}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              원본으로
            </Button>
            {existingVariants.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  const first = existingVariants[0]
                  if (first) duplicateVariant(first.id, placement)
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                복제
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl gap-2 min-w-[100px]"
            >
              {isSaving ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />생성 중...</>
              ) : savedId ? (
                <><Check className="h-3.5 w-3.5" />저장됨</>
              ) : (
                <><Save className="h-3.5 w-3.5" />variant 저장</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
