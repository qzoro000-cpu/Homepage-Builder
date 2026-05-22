"use client"

import { TreatmentAsset, TreatmentLandingSection, LandingSectionType } from "@/lib/treatment-store"

// ─── Channel & Binding Types ──────────────────────────────────────────────────

export type ChannelTag = "homepage" | "landing" | "chatbot"

/**
 * A reference from a landing section's metadata to a specific asset.
 * e.g. hero_image.metadata.backgroundAssetId → { sectionId, sectionType, role: "background" }
 */
export type SectionAssetBinding = {
  sectionId: string
  sectionType: LandingSectionType
  role: string
}

/**
 * Aggregated usage summary for a single asset.
 */
export type AssetUsageSummary = {
  assetId: string
  /** Which broadcast channels this asset is tagged for */
  channels: ChannelTag[]
  /** Landing sections that directly reference this asset in their metadata */
  sectionBindings: SectionAssetBinding[]
  /** Whether this asset's assetType is "카드썸네일" */
  isCardThumbnail: boolean
}

// ─── Section metadata binding keys ───────────────────────────────────────────
//
// For each section type, list the metadata keys that hold a TreatmentAsset ID.
// key format: "roleLabel:metadataKey" (role is used for display in the binding list)

const SECTION_ASSET_KEYS: Partial<Record<LandingSectionType, { role: string; key: string }[]>> = {
  hero_image: [
    { role: "background", key: "backgroundAssetId" },
    { role: "mobile", key: "mobileAssetId" },
  ],
  hero_video: [
    { role: "thumbnail", key: "thumbnailAssetId" },
  ],
  cta_block: [
    { role: "background", key: "backgroundAssetId" },
  ],
  image_text_split: [
    { role: "image", key: "assetId" },
  ],
  fullwidth_image: [
    { role: "image", key: "assetId" },
  ],
  treatment_area_visual: [
    { role: "visual", key: "assetId" },
  ],
  doctor_recommendation: [
    { role: "portrait", key: "portraitAssetId" },
  ],
  before_after_gallery: [
    { role: "before", key: "beforeAssetId" },
    { role: "after", key: "afterAssetId" },
  ],
}

// ─── Core utilities ───────────────────────────────────────────────────────────

/**
 * Scans all landing sections and returns a map of assetId → list of section bindings.
 */
export function extractSectionAssetRefs(
  sections: TreatmentLandingSection[]
): Map<string, SectionAssetBinding[]> {
  const result = new Map<string, SectionAssetBinding[]>()

  for (const section of sections) {
    if (!section.metadata) continue

    // Type-specific top-level keys
    const keys = SECTION_ASSET_KEYS[section.sectionType] ?? []
    for (const { role, key } of keys) {
      const val = section.metadata[key]
      if (typeof val === "string" && val) {
        const existing = result.get(val) ?? []
        existing.push({ sectionId: section.id, sectionType: section.sectionType, role })
        result.set(val, existing)
      }
    }

    // feature_grid — each item can have imageAssetId
    if (section.sectionType === "feature_grid" && Array.isArray(section.metadata.features)) {
      const features = section.metadata.features as Array<{ imageAssetId?: string }>
      features.forEach((f, i) => {
        if (f.imageAssetId && typeof f.imageAssetId === "string") {
          const existing = result.get(f.imageAssetId) ?? []
          existing.push({
            sectionId: section.id,
            sectionType: section.sectionType,
            role: `feature_${i + 1}번 아이템`,
          })
          result.set(f.imageAssetId, existing)
        }
      })
    }
  }

  return result
}

/**
 * Computes a full usage summary for every asset.
 */
export function computeAssetUsageTags(
  assets: TreatmentAsset[],
  sections: TreatmentLandingSection[]
): Map<string, AssetUsageSummary> {
  const sectionRefs = extractSectionAssetRefs(sections)
  const result = new Map<string, AssetUsageSummary>()

  for (const asset of assets) {
    const channels: ChannelTag[] = []
    if (asset.useForHomepage) channels.push("homepage")
    if (asset.useForLanding) channels.push("landing")
    if (asset.useForChatbot) channels.push("chatbot")

    result.set(asset.id, {
      assetId: asset.id,
      channels,
      sectionBindings: sectionRefs.get(asset.id) ?? [],
      isCardThumbnail: asset.assetType === "카드썸네일",
    })
  }

  return result
}

/**
 * Total number of places an asset is connected to
 * (channels + section bindings + card slot).
 */
export function countAssetConnections(summary: AssetUsageSummary): number {
  return (
    summary.channels.length +
    summary.sectionBindings.length +
    (summary.isCardThumbnail ? 1 : 0)
  )
}

/**
 * Human-readable summary string for tooltips.
 */
export function assetConnectionTooltip(summary: AssetUsageSummary): string {
  const parts: string[] = []

  if (summary.isCardThumbnail) parts.push("카드 썸네일")

  const channelLabels: Record<ChannelTag, string> = {
    homepage: "홈페이지",
    landing: "랜딩페이지",
    chatbot: "챗봇",
  }
  for (const ch of summary.channels) parts.push(channelLabels[ch])

  for (const b of summary.sectionBindings) {
    parts.push(`섹션 "${b.sectionId.slice(0, 6)}…" (${b.role})`)
  }

  return parts.length > 0 ? `연결: ${parts.join(", ")}` : "연결 없음"
}

// ─── Channel label helpers (used in AssetCard / AssetListRow) ─────────────────

export const CHANNEL_LABELS: Record<"useForHomepage" | "useForLanding" | "useForChatbot", string> = {
  useForHomepage: "홈페이지 사용 가능",
  useForLanding: "랜딩페이지 사용 가능",
  useForChatbot: "챗봇 참조 가능",
}

export const CHANNEL_SHORT_LABELS: Record<"useForHomepage" | "useForLanding" | "useForChatbot", string> = {
  useForHomepage: "홈",
  useForLanding: "랜딩",
  useForChatbot: "챗봇",
}
