"use client"

import React, { createContext, useCallback, useContext, useState } from "react"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type PlacementType =
  | "homepage_card"
  | "homepage_hero"
  | "landing_hero"
  | "doctor_profile"
  | "equipment_visual"
  | "treatment_thumbnail"
  | "before_after"
  | "decorative_background"

export const PLACEMENT_LABELS: Record<PlacementType, string> = {
  homepage_card: "홈 카드",
  homepage_hero: "홈 히어로",
  landing_hero: "랜딩 히어로",
  doctor_profile: "의료진 프로필",
  equipment_visual: "장비 비주얼",
  treatment_thumbnail: "시술 썸네일",
  before_after: "비포&애프터",
  decorative_background: "배경 데코",
}

export type OverlayConfig = {
  type: "linear_gradient" | "radial_gradient" | "solid"
  direction?: "top" | "bottom" | "left" | "right" | "center"
  color?: string // e.g. "0,0,0"
  opacity: number // 0–1
}

export type FadeConfig = {
  type: "edge" | "top" | "bottom" | "left" | "right"
  strength: number // 0–1
}

export type EffectRecipe = {
  crop?: { x: number; y: number; zoom: number }
  focal_point?: { x: number; y: number }
  overlay?: OverlayConfig
  fade?: FadeConfig
  glow?: { enabled: boolean; strength: number; color?: string }
  shadow?: { enabled: boolean; x?: number; y?: number; blur?: number; color?: string }
  vignette?: { enabled: boolean; strength: number }
  blur_bg?: { enabled: boolean; amount: number }
  text_gradient?: { enabled: boolean; direction: "top" | "bottom" }
  brightness: number  // –0.5 to +0.5
  contrast: number    // –0.5 to +0.5
  saturation: number  // –1 to +1
  radius?: number     // border-radius px
}

export const EMPTY_RECIPE: EffectRecipe = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
}

export type MediaEffectPreset = {
  id: string
  name: string
  description: string
  previewType: PlacementType
  recipe: EffectRecipe
  isSystem: boolean
  scope: "hq" | "branch"
  branchId?: string
  isActive: boolean
}

export type MediaVariant = {
  id: string
  assetId: string
  placementType: PlacementType
  presetId?: string
  recipe: EffectRecipe
  outputFileUrl: string   // data URL after canvas export, or original if export failed
  label?: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────
// System Presets
// ─────────────────────────────────────────────

export const SYSTEM_PRESETS: MediaEffectPreset[] = [
  {
    id: "preset_premium_hero",
    name: "Premium Hero",
    description: "고급 히어로용 — 따뜻한 톤, 하단 그라데이션, 비네트",
    previewType: "landing_hero",
    recipe: {
      brightness: 0.05,
      contrast: 0.08,
      saturation: 0.05,
      overlay: { type: "linear_gradient", direction: "bottom", color: "0,0,0", opacity: 0.45 },
      vignette: { enabled: true, strength: 0.3 },
    },
    isSystem: true,
    scope: "hq",
    isActive: true,
  },
  {
    id: "preset_soft_fade",
    name: "Soft Fade Portrait",
    description: "인물 사진용 — 가장자리 페이드, 밝기 소폭 상승",
    previewType: "doctor_profile",
    recipe: {
      brightness: 0.08,
      contrast: 0.02,
      saturation: -0.1,
      fade: { type: "edge", strength: 0.4 },
    },
    isSystem: true,
    scope: "hq",
    isActive: true,
  },
  {
    id: "preset_dark_overlay",
    name: "Dark Overlay CTA",
    description: "텍스트 가독성 최우선 — 짙은 하단 오버레이",
    previewType: "homepage_hero",
    recipe: {
      brightness: -0.05,
      contrast: 0.1,
      saturation: -0.2,
      overlay: { type: "linear_gradient", direction: "bottom", color: "0,0,0", opacity: 0.65 },
      text_gradient: { enabled: true, direction: "bottom" },
    },
    isSystem: true,
    scope: "hq",
    isActive: true,
  },
  {
    id: "preset_medical_clean",
    name: "Medical Clean Card",
    description: "카드용 — 선명한 의료 스타일, 라운드 처리",
    previewType: "treatment_thumbnail",
    recipe: {
      brightness: 0.05,
      contrast: 0.12,
      saturation: -0.05,
      radius: 16,
    },
    isSystem: true,
    scope: "hq",
    isActive: true,
  },
  {
    id: "preset_landing_glow",
    name: "Landing Glow Focus",
    description: "랜딩 주목도 강화 — 발광 효과, 중앙 집중",
    previewType: "landing_hero",
    recipe: {
      brightness: 0.1,
      contrast: 0.05,
      saturation: 0.08,
      glow: { enabled: true, strength: 0.25, color: "rgba(255,255,220,0.5)" },
      vignette: { enabled: true, strength: 0.2 },
    },
    isSystem: true,
    scope: "hq",
    isActive: true,
  },
  {
    id: "preset_before_after",
    name: "BeforeAfter Neutral",
    description: "비포&애프터용 — 고대비, 중성 색감, 오버레이 없음",
    previewType: "before_after",
    recipe: {
      brightness: 0,
      contrast: 0.15,
      saturation: -0.15,
    },
    isSystem: true,
    scope: "hq",
    isActive: true,
  },
]

// ─────────────────────────────────────────────
// CSS / Canvas Helpers (exported for editor)
// ─────────────────────────────────────────────

export function buildCssFilter(recipe: EffectRecipe): string {
  const parts: string[] = []
  if (recipe.brightness !== 0) parts.push(`brightness(${1 + recipe.brightness})`)
  if (recipe.contrast !== 0) parts.push(`contrast(${1 + recipe.contrast})`)
  if (recipe.saturation !== 0) parts.push(`saturate(${Math.max(0, 1 + recipe.saturation)})`)
  return parts.join(" ")
}

export type OverlayLayer = {
  key: string
  style: React.CSSProperties
}

export function buildOverlayLayers(recipe: EffectRecipe): OverlayLayer[] {
  const layers: OverlayLayer[] = []

  // Overlay gradient / solid
  if (recipe.overlay && recipe.overlay.opacity > 0) {
    const { type, direction, color, opacity } = recipe.overlay
    const c = color ?? "0,0,0"
    if (type === "linear_gradient") {
      const dirMap: Record<string, string> = {
        bottom: "to top",
        top: "to bottom",
        left: "to right",
        right: "to left",
        center: "ellipse at center",
      }
      const cssDir = dirMap[direction ?? "bottom"] ?? "to top"
      layers.push({
        key: "overlay",
        style: {
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${cssDir}, rgba(${c},${opacity}) 0%, rgba(${c},0) 100%)`,
          borderRadius: "inherit",
        },
      })
    } else if (type === "solid") {
      layers.push({
        key: "overlay",
        style: {
          position: "absolute",
          inset: 0,
          background: `rgba(${c},${opacity})`,
          borderRadius: "inherit",
        },
      })
    } else if (type === "radial_gradient") {
      layers.push({
        key: "overlay",
        style: {
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, rgba(${c},0) 30%, rgba(${c},${opacity}) 100%)`,
          borderRadius: "inherit",
        },
      })
    }
  }

  // Fade
  if (recipe.fade) {
    const { type, strength } = recipe.fade
    const s = strength
    const fadeStyles: Record<string, string> = {
      edge: `radial-gradient(ellipse at center, transparent 40%, rgba(255,255,255,${s}) 100%)`,
      top: `linear-gradient(to bottom, rgba(255,255,255,${s}) 0%, transparent 45%)`,
      bottom: `linear-gradient(to top, rgba(255,255,255,${s}) 0%, transparent 45%)`,
      left: `linear-gradient(to right, rgba(255,255,255,${s}) 0%, transparent 45%)`,
      right: `linear-gradient(to left, rgba(255,255,255,${s}) 0%, transparent 45%)`,
    }
    layers.push({
      key: "fade",
      style: {
        position: "absolute",
        inset: 0,
        background: fadeStyles[type] ?? "none",
        borderRadius: "inherit",
      },
    })
  }

  // Vignette
  if (recipe.vignette?.enabled) {
    const s = recipe.vignette.strength
    layers.push({
      key: "vignette",
      style: {
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${s}) 100%)`,
        borderRadius: "inherit",
      },
    })
  }

  // Glow
  if (recipe.glow?.enabled && recipe.glow.strength > 0) {
    const s = recipe.glow.strength
    const glowColor = recipe.glow.color ?? `rgba(255,255,200,${s * 0.6})`
    layers.push({
      key: "glow",
      style: {
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at 50% 40%, ${glowColor} 0%, transparent 65%)`,
        borderRadius: "inherit",
        mixBlendMode: "screen",
      },
    })
  }

  return layers
}

// Generate canvas output variant
export async function generateCanvasOutput(
  imageUrl: string,
  recipe: EffectRecipe
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const W = img.naturalWidth
        const H = img.naturalHeight
        const canvas = document.createElement("canvas")
        canvas.width = W
        canvas.height = H
        const ctx = canvas.getContext("2d")
        if (!ctx) { resolve(imageUrl); return }

        // Apply CSS filters via canvas filter
        const filter = buildCssFilter(recipe)
        if (filter) ctx.filter = filter

        // Draw image (with crop)
        const crop = recipe.crop
        if (crop && crop.zoom !== 1) {
          const sw = W / crop.zoom
          const sh = H / crop.zoom
          const sx = (W - sw) * crop.x
          const sy = (H - sh) * crop.y
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H)
        } else {
          ctx.drawImage(img, 0, 0, W, H)
        }

        ctx.filter = "none"

        // Draw overlay
        if (recipe.overlay && recipe.overlay.opacity > 0) {
          const { type, direction, color, opacity } = recipe.overlay
          const c = color ?? "0,0,0"
          if (type === "linear_gradient") {
            const dirMap: Record<string, [number, number, number, number]> = {
              bottom: [0, H, 0, 0],
              top: [0, 0, 0, H],
              left: [0, 0, W, 0],
              right: [W, 0, 0, 0],
            }
            const [x0, y0, x1, y1] = dirMap[direction ?? "bottom"] ?? [0, H, 0, 0]
            const grad = ctx.createLinearGradient(x0, y0, x1, y1)
            grad.addColorStop(0, `rgba(${c},${opacity})`)
            grad.addColorStop(1, `rgba(${c},0)`)
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, W, H)
          } else if (type === "solid") {
            ctx.fillStyle = `rgba(${c},${opacity})`
            ctx.fillRect(0, 0, W, H)
          } else if (type === "radial_gradient") {
            const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7)
            grad.addColorStop(0, `rgba(${c},0)`)
            grad.addColorStop(1, `rgba(${c},${opacity})`)
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, W, H)
          }
        }

        // Vignette
        if (recipe.vignette?.enabled) {
          const s = recipe.vignette.strength
          const grad = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.8)
          grad.addColorStop(0, `rgba(0,0,0,0)`)
          grad.addColorStop(1, `rgba(0,0,0,${s})`)
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, W, H)
        }

        const dataUrl = canvas.toDataURL("image/webp", 0.92)
        resolve(dataUrl)
      } catch {
        // CORS or other error — fall back to original
        resolve(imageUrl)
      }
    }
    img.onerror = () => resolve(imageUrl)
    img.src = imageUrl
  })
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

type MediaContextType = {
  presets: MediaEffectPreset[]
  getPreset: (id: string) => MediaEffectPreset | undefined
  getActivePresets: () => MediaEffectPreset[]
  // Branch presets
  createPreset: (
    p: Omit<MediaEffectPreset, "id" | "isSystem">
  ) => MediaEffectPreset
  updatePreset: (id: string, updates: Partial<MediaEffectPreset>) => void
  deletePreset: (id: string) => void
  // Variants
  variants: MediaVariant[]
  getVariants: (assetId: string) => MediaVariant[]
  getVariantByPlacement: (assetId: string, placement: PlacementType) => MediaVariant | undefined
  getPrimaryVariant: (assetId: string) => MediaVariant | undefined
  createVariant: (v: Omit<MediaVariant, "id" | "createdAt" | "updatedAt">) => MediaVariant
  updateVariant: (id: string, updates: Partial<MediaVariant>) => void
  deleteVariant: (id: string) => void
  duplicateVariant: (id: string, newPlacement: PlacementType) => MediaVariant
}

const MediaContext = createContext<MediaContextType | null>(null)

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [presets, setPresets] = useState<MediaEffectPreset[]>(SYSTEM_PRESETS)
  const [variants, setVariants] = useState<MediaVariant[]>([])

  const getPreset = useCallback(
    (id: string) => presets.find((p) => p.id === id),
    [presets]
  )

  const getActivePresets = useCallback(
    () => presets.filter((p) => p.isActive),
    [presets]
  )

  const createPreset = useCallback(
    (p: Omit<MediaEffectPreset, "id" | "isSystem">): MediaEffectPreset => {
      const preset: MediaEffectPreset = { ...p, id: generateId("preset"), isSystem: false }
      setPresets((prev) => [...prev, preset])
      return preset
    },
    []
  )

  const updatePreset = useCallback((id: string, updates: Partial<MediaEffectPreset>) => {
    setPresets((prev) =>
      prev.map((p) => (p.id === id && !p.isSystem ? { ...p, ...updates } : p))
    )
  }, [])

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id || p.isSystem))
  }, [])

  const getVariants = useCallback(
    (assetId: string) => variants.filter((v) => v.assetId === assetId),
    [variants]
  )

  const getVariantByPlacement = useCallback(
    (assetId: string, placement: PlacementType) =>
      variants.find((v) => v.assetId === assetId && v.placementType === placement),
    [variants]
  )

  const getPrimaryVariant = useCallback(
    (assetId: string) =>
      variants.find((v) => v.assetId === assetId && v.isPrimary),
    [variants]
  )

  const createVariant = useCallback(
    (v: Omit<MediaVariant, "id" | "createdAt" | "updatedAt">): MediaVariant => {
      const now = new Date().toISOString()
      const variant: MediaVariant = { ...v, id: generateId("var"), createdAt: now, updatedAt: now }
      setVariants((prev) => {
        // If isPrimary, remove primary flag from others of same assetId
        const updated = v.isPrimary
          ? prev.map((x) =>
              x.assetId === v.assetId ? { ...x, isPrimary: false } : x
            )
          : [...prev]
        return [...updated, variant]
      })
      return variant
    },
    []
  )

  const updateVariant = useCallback(
    (id: string, updates: Partial<MediaVariant>) => {
      setVariants((prev) => {
        let list = prev
        if (updates.isPrimary) {
          const target = prev.find((v) => v.id === id)
          if (target) {
            list = prev.map((v) =>
              v.assetId === target.assetId ? { ...v, isPrimary: false } : v
            )
          }
        }
        return list.map((v) =>
          v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
        )
      })
    },
    []
  )

  const deleteVariant = useCallback((id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id))
  }, [])

  const duplicateVariant = useCallback(
    (id: string, newPlacement: PlacementType): MediaVariant => {
      const original = variants.find((v) => v.id === id)
      if (!original) throw new Error(`Variant ${id} not found`)
      const now = new Date().toISOString()
      const dup: MediaVariant = {
        ...original,
        id: generateId("var"),
        placementType: newPlacement,
        isPrimary: false,
        label: `${original.label ?? PLACEMENT_LABELS[original.placementType]} (복사)`,
        createdAt: now,
        updatedAt: now,
      }
      setVariants((prev) => [...prev, dup])
      return dup
    },
    [variants]
  )

  const value: MediaContextType = {
    presets,
    getPreset,
    getActivePresets,
    createPreset,
    updatePreset,
    deletePreset,
    variants,
    getVariants,
    getVariantByPlacement,
    getPrimaryVariant,
    createVariant,
    updateVariant,
    deleteVariant,
    duplicateVariant,
  }

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
}

export function useMedia(): MediaContextType {
  const ctx = useContext(MediaContext)
  if (!ctx) throw new Error("useMedia must be used within a MediaProvider")
  return ctx
}
