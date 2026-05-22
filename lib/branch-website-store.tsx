"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

// ─── Snapshot Types ────────────────────────────────────────────────────────────

export type FieldValue = string | boolean | string[] | number

export type SiteSectionMeta = {
  id: string
  label: string
  isEnabled: boolean
  status: string
}

export type SitePopupItem = {
  id: string
  imageUrl: string
  brightness: number
  contrast: number
  saturate: number
  hue: number
}

export type SitePopupData = {
  enabled: boolean
  items: SitePopupItem[]
}

export type SiteDoctorCard = {
  id: string
  branchId: string
  name: string
  title: string
  specialty: string
  image: string
  isPublic: boolean
  isFeatured: boolean
  profileImageUrl?: string
  oneLinePitch?: string
  shortIntro?: string
  specialtySummary?: string
}

export type SiteEquipmentCard = {
  id: string
  branchId: string
  name: string
  description: string
  image: string
  isPublic: boolean
  isFeatured: boolean
  coverImageUrl?: string
}

export type SiteTreatmentCard = {
  id: string
  slug: string
  branchId: string
  name: string
  category: string
  description: string
  price: string
  duration: string
  image: string
  isPublic: boolean
  isFeatured: boolean
  sortOrder?: number
  landingProfile?: Record<string, unknown>
  landingData?: Record<string, unknown>
  landingAssets?: unknown[]
  badge?: string
  bookingUrl?: string
  kakaoUrl?: string
  landingPageUrl?: string
}

export type SiteEventCard = {
  id: string
  branchId: string
  title: string
  description: string
  startDate: string
  endDate: string
  thumbnail: string
  status: string
  isHomepage: boolean
  slug?: string
  content?: string
}

export type SiteBranchInfo = {
  id: string
  name: string
  address: string
  phone: string
  businessHours: string
  parkingInfo: string
  bookingLink: string
  shortIntro: string
  longIntro: string
  heroImage?: string
  kakaoLink?: string
  naverMapUrl?: string
  transportGuide?: string
  landmarkGuide?: string
}

export type SiteSnapshot = {
  // Metadata
  snapshotType: "draft" | "published"
  branchId: string
  generatedAt: string

  // Branch info
  branch: SiteBranchInfo

  // Homepage sections
  homepage: {
    sections: SiteSectionMeta[]
    sectionValues: Record<string, Record<string, FieldValue>>
    sectionImages: Record<string, string>
    popupData: SitePopupData
    bookingValues: Record<string, FieldValue>
    cartValues: Record<string, FieldValue>
    treatmentsPageValues: Record<string, FieldValue>
    recruitValues: Record<string, FieldValue>
  }

  // Linked data
  doctors: SiteDoctorCard[]
  equipment: SiteEquipmentCard[]
  treatments: SiteTreatmentCard[]
  events: SiteEventCard[]
}

export type WebsiteVersion = {
  id: string
  branchId: string
  snapshotType: "draft" | "published"
  snapshot: SiteSnapshot
  label: string
  createdAt: string
}

export type WebsiteState = {
  draft: SiteSnapshot | null
  published: SiteSnapshot | null
  versions: WebsiteVersion[]
  draftStatus: "none" | "generating" | "ready"
  publishStatus: "none" | "publishing" | "published"
  domainSettings: DomainSettings
}

export type DomainStatus = "unconfigured" | "pending" | "active" | "error"
export type SslStatus = "none" | "pending" | "active" | "error"

export type DomainSettings = {
  defaultPreviewUrl: string
  customDomain: string
  domainStatus: DomainStatus
  sslStatus: SslStatus
  lastCheckedAt: string | null
  dnsRecords: DnsRecord[]
}

export type DnsRecord = {
  type: string
  host: string
  value: string
  ttl: number
}

// ─── Footer types ─────────────────────────────────────────────────────────────
// Footer sectionValues uses generic Record<string, FieldValue> (string|boolean|string[]|number).
// Object arrays must be JSON.stringify'd to string. FooterSocialExtra[] is one such array.
// Stored as: values.footerSocialExtras = JSON.stringify(FooterSocialExtra[])
// Read with: try { JSON.parse(values.footerSocialExtras as string) } catch { return [] }
export type FooterSocialExtra = {
  id: string         // generated via `social_${Date.now()}_${Math.random().toString(36).slice(2)}`
  platform: string   // "facebook" | "twitter" | "tiktok" | "linkedin" | "custom" — identifier
  label: string      // display name (e.g. "Facebook", "X (Twitter)")
  url: string        // link
  iconKey?: string   // optional icon identifier — mapped to SVG in PreviewFooter (16-B)
  enabled: boolean   // visibility toggle
}

// ─── BroadcastChannel key ─────────────────────────────────────────────────────

export const SITE_LIVE_BROADCAST = (branchId: string) => `bw_live_${branchId}`

// ─── localStorage helpers ──────────────────────────────────────────────────────

const DRAFT_KEY    = (branchId: string) => `bw_draft_${branchId}`
const PUBLISHED_KEY = (branchId: string) => `bw_published_${branchId}`
const VERSIONS_KEY  = (branchId: string) => `bw_versions_${branchId}`
const DOMAIN_KEY    = (branchId: string) => `bw_domain_${branchId}`
const MAX_VERSIONS  = 10

// Migrate treatmentsPageValues from tr* keys → standard keys (one-time, idempotent)
export function migrateTreatmentsPageValues(tpv: Record<string, unknown>): Record<string, unknown> {
  const MAP: Record<string, string> = {
    trBgColor:       "bgColor",
    trEyebrow:       "pageEyebrow",
    trEyebrowColor:  "pageEyebrowColor",
    trEyebrowSize:   "pageEyebrowSize",
    trEyebrowWeight: "pageEyebrowWeight",
    trEyebrowFont:   "pageEyebrowFont",
    trTitle:         "pageTitle",
    trTitleColor:    "pageTitleColor",
    trTitleSize:     "pageTitleSize",
    trTitleWeight:   "pageTitleWeight",
    trTitleFont:     "pageTitleFont",
    trDesc:          "pageSubtitle",
    trDescColor:     "pageSubtitleColor",
    trDescSize:      "pageSubtitleSize",
    trDescWeight:    "pageSubtitleWeight",
    trDescFont:      "pageSubtitleFont",
    trCategories:    "categories",
    trCardNameColor:  "cardNameColor",
    trCardDescColor:  "cardDescColor",
    trCardPriceColor: "cardPriceColor",
    trCardAction:    "cardAction",
    trCardBaseUrl:   "cardBaseUrl",
    trCardTarget:    "cardTarget",
  }
  const hasOldKeys = Object.keys(MAP).some(k => k in tpv)
  if (!hasOldKeys) return tpv
  const migrated = { ...tpv }
  for (const [oldKey, newKey] of Object.entries(MAP)) {
    if (oldKey in migrated) {
      if (!(newKey in migrated)) migrated[newKey] = migrated[oldKey]
      delete migrated[oldKey]
    }
  }
  return migrated
}

// Migrate footer sectionValues: legacy keys (no prefix) → footer* prefix.
// Keeps legacy keys (no delete) for backward-compat with `app/preview/homepage/[branchSlug]/page.tsx`
// which still reads legacy keys directly from snapshot.
export function migrateFooterValues(values: Record<string, FieldValue>): Record<string, FieldValue> {
  const MAP: Record<string, string> = {
    clinicLegalName:      "footerHospitalName",
    businessNumber:       "footerBusinessNumber",
    representative:       "footerCEOName",
    medicalLicenseNumber: "footerLicenseNumber",
    showPrivacyLink:      "footerPrivacyToggle",
  }
  const hasAnyOld = Object.keys(MAP).some(k => k in values)
  const hasAnyNew = Object.values(MAP).some(k => k in values)
  if (!hasAnyOld && !hasAnyNew) return values
  const migrated = { ...values }
  for (const [oldKey, newKey] of Object.entries(MAP)) {
    // legacy → new (forward migration for old data)
    if (oldKey in migrated && !(newKey in migrated)) {
      migrated[newKey] = migrated[oldKey]
    }
    // new → legacy (back-fill for `preview/homepage/[branchSlug]/page.tsx` compatibility)
    if (newKey in migrated && !(oldKey in migrated)) {
      migrated[oldKey] = migrated[newKey]
    }
  }
  return migrated
}

/**
 * STEP 19-D-1 (2026-05-09): bookingValues 옛 키 → 신규 bk* 키 매핑.
 *
 * 변경 배경: booking 페이지가 채널 링크형(옛) → 6단계 폼(신)으로 전환되며 데이터 모델 자체가 변경됨.
 * 의미 동일한 키만 매핑하고, 나머지 옛 키들은 자연 소멸 (객체에 남되 신규 컴포넌트가 읽지 않음).
 *
 * 매핑:
 *   pageTitle → bkTitle (페이지 메인 타이틀, 의미 동일)
 *
 * 자연 소멸 (매핑 안 함):
 *   pageSubtitle, ctaHeadline, phoneLabel, kakaoLabel, onlineLabel, firstVisitText, cautionText
 *   (채널 링크형 전용 필드 — 6단계 폼에 의미적 대응 필드 없음)
 */
export function migrateBookingValues(values: Record<string, FieldValue>): Record<string, FieldValue> {
  if (!values || typeof values !== "object") return values
  const out = { ...values }
  // 양방향 sync: 옛 키 → 새 키 (footer migration과 동일 정책)
  if (out.pageTitle != null && out.bkTitle == null) {
    out.bkTitle = out.pageTitle
  }
  return out
}

export function migrateRecruitValues(values: Record<string, FieldValue>): Record<string, FieldValue> {
  if (!values || typeof values !== "object") return values
  const next = { ...values }
  // 현재 recruit 은 옛 키 매핑 없음 (rc* prefix 로 신규 시작)
  // 향후 키 rename 시 여기 매핑 추가
  return next
}

function migrateSnapshot(snap: SiteSnapshot): SiteSnapshot {
  let next = snap
  const tpv = snap.homepage?.treatmentsPageValues
  if (tpv && typeof tpv === "object") {
    const migrated = migrateTreatmentsPageValues(tpv as Record<string, unknown>)
    if (migrated !== tpv) {
      next = { ...next, homepage: { ...next.homepage, treatmentsPageValues: migrated as Record<string, FieldValue> } }
    }
  }
  const footerValues = next.homepage?.sectionValues?.footer
  if (footerValues && typeof footerValues === "object") {
    const migratedFooter = migrateFooterValues(footerValues as Record<string, FieldValue>)
    if (migratedFooter !== footerValues) {
      next = {
        ...next,
        homepage: {
          ...next.homepage,
          sectionValues: { ...next.homepage.sectionValues, footer: migratedFooter },
        },
      }
    }
  }
  const bookingValues = next.homepage?.bookingValues
  if (bookingValues && typeof bookingValues === "object") {
    const migratedBooking = migrateBookingValues(bookingValues as Record<string, FieldValue>)
    if (migratedBooking !== bookingValues) {
      next = { ...next, homepage: { ...next.homepage, bookingValues: migratedBooking } }
    }
  }
  const recruitValues = next.homepage?.recruitValues
  if (recruitValues && typeof recruitValues === "object") {
    const migratedRecruit = migrateRecruitValues(recruitValues as Record<string, FieldValue>)
    if (migratedRecruit !== recruitValues) {
      next = { ...next, homepage: { ...next.homepage, recruitValues: migratedRecruit } }
    }
  }
  return next
}

export function loadDraftSnapshot(branchId: string): SiteSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY(branchId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as SiteSnapshot
    const migrated = migrateSnapshot(parsed)
    if (migrated !== parsed) {
      try { localStorage.setItem(DRAFT_KEY(branchId), JSON.stringify(migrated)) } catch { /* quota */ }
    }
    return migrated
  } catch { return null }
}

export function loadPublishedSnapshot(branchId: string): SiteSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(PUBLISHED_KEY(branchId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as SiteSnapshot
    const migrated = migrateSnapshot(parsed)
    if (migrated !== parsed) {
      try { localStorage.setItem(PUBLISHED_KEY(branchId), JSON.stringify(migrated)) } catch { /* quota */ }
    }
    return migrated
  } catch { return null }
}

export function loadVersions(branchId: string): WebsiteVersion[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(VERSIONS_KEY(branchId))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function loadDomainSettings(branchId: string): DomainSettings {
  if (typeof window === "undefined") return defaultDomainSettings(branchId)
  try {
    const raw = localStorage.getItem(DOMAIN_KEY(branchId))
    return raw ? JSON.parse(raw) : defaultDomainSettings(branchId)
  } catch { return defaultDomainSettings(branchId) }
}

function defaultDomainSettings(branchId: string): DomainSettings {
  return {
    defaultPreviewUrl: `http://localhost:3000/preview/site/${branchId}`,
    customDomain: "",
    domainStatus: "unconfigured",
    sslStatus: "none",
    lastCheckedAt: null,
    dnsRecords: [],
  }
}

function saveDraftSnapshot(branchId: string, snapshot: SiteSnapshot) {
  localStorage.setItem(DRAFT_KEY(branchId), JSON.stringify(snapshot))
}

function savePublishedSnapshot(branchId: string, snapshot: SiteSnapshot) {
  localStorage.setItem(PUBLISHED_KEY(branchId), JSON.stringify(snapshot))
}

function saveVersions(branchId: string, versions: WebsiteVersion[]) {
  localStorage.setItem(VERSIONS_KEY(branchId), JSON.stringify(versions))
}

function saveDomainSettingsToStorage(branchId: string, settings: DomainSettings) {
  localStorage.setItem(DOMAIN_KEY(branchId), JSON.stringify(settings))
}

// ─── Context ───────────────────────────────────────────────────────────────────

type BranchWebsiteContextType = {
  websiteState: WebsiteState
  generatePreview: (branchId: string, snapshot: Omit<SiteSnapshot, "snapshotType" | "generatedAt">) => void
  publishSite: (branchId: string) => Promise<boolean>
  rollbackToVersion: (branchId: string, versionId: string) => void
  updateDomainSettings: (branchId: string, settings: Partial<DomainSettings>) => void
  loadForBranch: (branchId: string) => void
  getPreviewUrl: (branchId: string) => string
  getLiveUrl: (branchId: string) => string
  hasUnpublishedChanges: (branchId: string) => boolean
}

const BranchWebsiteContext = createContext<BranchWebsiteContextType>({
  websiteState: {
    draft: null,
    published: null,
    versions: [],
    draftStatus: "none",
    publishStatus: "none",
    domainSettings: defaultDomainSettings(""),
  },
  generatePreview: () => {},
  publishSite: async () => false,
  rollbackToVersion: () => {},
  updateDomainSettings: () => {},
  loadForBranch: () => {},
  getPreviewUrl: (id) => `/preview/site/${id}`,
  getLiveUrl: (id) => `/preview/site/${id}?mode=live`,
  hasUnpublishedChanges: () => false,
})

export const useBranchWebsite = () => useContext(BranchWebsiteContext)

// ─── Provider ──────────────────────────────────────────────────────────────────

export function BranchWebsiteProvider({ children }: { children: React.ReactNode }) {
  const [websiteState, setWebsiteState] = useState<WebsiteState>({
    draft: null,
    published: null,
    versions: [],
    draftStatus: "none",
    publishStatus: "none",
    domainSettings: defaultDomainSettings(""),
  })

  const loadForBranch = useCallback((branchId: string) => {
    const draft      = loadDraftSnapshot(branchId)
    const published  = loadPublishedSnapshot(branchId)
    const versions   = loadVersions(branchId)
    const domain     = loadDomainSettings(branchId)

    setWebsiteState({
      draft,
      published,
      versions,
      draftStatus: draft ? "ready" : "none",
      publishStatus: published ? "published" : "none",
      domainSettings: domain,
    })
  }, [])

  const generatePreview = useCallback(
    (branchId: string, data: Omit<SiteSnapshot, "snapshotType" | "generatedAt">) => {
      const snapshot: SiteSnapshot = {
        ...data,
        snapshotType: "draft",
        generatedAt: new Date().toISOString(),
      }
      saveDraftSnapshot(branchId, snapshot)
      setWebsiteState((prev) => ({
        ...prev,
        draft: snapshot,
        draftStatus: "ready",
      }))
    },
    [],
  )

  const publishSite = useCallback(async (branchId: string): Promise<boolean> => {
    const draft = loadDraftSnapshot(branchId)
    if (!draft) return false

    setWebsiteState((prev) => ({ ...prev, publishStatus: "publishing" }))
    await new Promise((r) => setTimeout(r, 600))

    // Snapshot the current published version before replacing
    const currentPublished = loadPublishedSnapshot(branchId)
    const currentVersions  = loadVersions(branchId)
    let updatedVersions    = currentVersions

    if (currentPublished) {
      const version: WebsiteVersion = {
        id:           `v_${Date.now()}`,
        branchId,
        snapshotType: "published",
        snapshot:     currentPublished,
        label:        `${new Date(currentPublished.generatedAt).toLocaleString("ko-KR")} 공개본`,
        createdAt:    new Date().toISOString(),
      }
      updatedVersions = [version, ...currentVersions].slice(0, MAX_VERSIONS)
      saveVersions(branchId, updatedVersions)
    }

    const published: SiteSnapshot = {
      ...draft,
      snapshotType: "published",
      generatedAt:  new Date().toISOString(),
    }
    savePublishedSnapshot(branchId, published)

    setWebsiteState((prev) => ({
      ...prev,
      published,
      versions: updatedVersions,
      publishStatus: "published",
    }))
    return true
  }, [])

  const rollbackToVersion = useCallback((branchId: string, versionId: string) => {
    const versions = loadVersions(branchId)
    const target   = versions.find((v) => v.id === versionId)
    if (!target) return

    const rolled: SiteSnapshot = {
      ...target.snapshot,
      snapshotType: "published",
      generatedAt:  new Date().toISOString(),
    }
    savePublishedSnapshot(branchId, rolled)

    setWebsiteState((prev) => ({
      ...prev,
      published: rolled,
      publishStatus: "published",
    }))
  }, [])

  const updateDomainSettings = useCallback(
    (branchId: string, settings: Partial<DomainSettings>) => {
      setWebsiteState((prev) => {
        const updated = { ...prev.domainSettings, ...settings }
        saveDomainSettingsToStorage(branchId, updated)
        return { ...prev, domainSettings: updated }
      })
    },
    [],
  )

  const getPreviewUrl = useCallback(
    (branchId: string) => `/preview/site/${branchId}`,
    [],
  )

  const getLiveUrl = useCallback(
    (branchId: string) => {
      const domain = loadDomainSettings(branchId)
      if (domain.customDomain && domain.domainStatus === "active") {
        return `https://${domain.customDomain}`
      }
      return `/preview/site/${branchId}?mode=live`
    },
    [],
  )

  const hasUnpublishedChanges = useCallback((branchId: string): boolean => {
    const draft     = loadDraftSnapshot(branchId)
    const published = loadPublishedSnapshot(branchId)
    if (!draft) return false
    if (!published) return true
    return new Date(draft.generatedAt) > new Date(published.generatedAt)
  }, [])

  return (
    <BranchWebsiteContext.Provider
      value={{
        websiteState,
        generatePreview,
        publishSite,
        rollbackToVersion,
        updateDomainSettings,
        loadForBranch,
        getPreviewUrl,
        getLiveUrl,
        hasUnpublishedChanges,
      }}
    >
      {children}
    </BranchWebsiteContext.Provider>
  )
}
