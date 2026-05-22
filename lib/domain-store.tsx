"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BranchDomain = {
  id: string
  branchId: string
  domain: string
  isPrimary: boolean
  homepageBasePath: string
  landingBasePath: string
  createdAt: string
  updatedAt: string
}

export type PageType = "detail" | "landing" | "external" | "booking"

export type BranchEquipmentUrl = {
  id: string
  branchEquipmentId: string
  branchId: string
  pageType: PageType
  slug: string
  fullUrl?: string
  canonicalUrl?: string
  isActive: boolean
  seoTitle?: string
  seoDescription?: string
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

type DomainContextType = {
  domains: BranchDomain[]
  urls: BranchEquipmentUrl[]
  getPrimaryDomain: (branchId: string) => BranchDomain | undefined
  getUrlsForEquipment: (branchEquipmentId: string) => BranchEquipmentUrl[]
  addDomain: (
    domain: Omit<BranchDomain, "id" | "createdAt" | "updatedAt">
  ) => BranchDomain
  updateDomain: (id: string, updates: Partial<BranchDomain>) => void
  deleteDomain: (id: string) => void
  addUrl: (
    url: Omit<BranchEquipmentUrl, "id" | "createdAt" | "updatedAt">
  ) => BranchEquipmentUrl
  updateUrl: (id: string, updates: Partial<BranchEquipmentUrl>) => void
  deleteUrl: (id: string) => void
  computeFullUrl: (
    branchId: string,
    basePath: string,
    slug: string
  ) => string
  isSlugUnique: (
    branchId: string,
    pageType: PageType,
    slug: string,
    excludeId?: string
  ) => boolean
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const NOW = new Date().toISOString()

const INITIAL_DOMAINS: BranchDomain[] = [
  {
    id: "dom_main",
    branchId: "main",
    domain: "https://gangnam.tatoa.kr",
    isPrimary: true,
    homepageBasePath: "/equipment",
    landingBasePath: "/landing",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "dom_sinsa",
    branchId: "sinsa",
    domain: "https://sinsa.tatoa.kr",
    isPrimary: true,
    homepageBasePath: "/equipment",
    landingBasePath: "/landing",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "dom_gumi",
    branchId: "gumi",
    domain: "https://gumi.tatoa.kr",
    isPrimary: true,
    homepageBasePath: "/equipment",
    landingBasePath: "/landing",
    createdAt: NOW,
    updatedAt: NOW,
  },
]

const INITIAL_URLS: BranchEquipmentUrl[] = [
  {
    id: "url_e1_detail",
    branchEquipmentId: "eq_e1",
    branchId: "main",
    pageType: "detail",
    slug: "ulthera",
    isActive: true,
    seoTitle: "울쎄라 리프팅 | 타토아 강남점",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "url_e1_landing",
    branchEquipmentId: "eq_e1",
    branchId: "main",
    pageType: "landing",
    slug: "ulthera-lifting",
    isActive: true,
    seoTitle: "울쎄라 리프팅 효과 | 타토아 강남점",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "url_e2_detail",
    branchEquipmentId: "eq_e2",
    branchId: "main",
    pageType: "detail",
    slug: "picosure",
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "url_e4_detail",
    branchEquipmentId: "eq_e4",
    branchId: "sinsa",
    pageType: "detail",
    slug: "morpheus8",
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const DomainContext = createContext<DomainContextType | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function DomainProvider({ children }: { children: ReactNode }) {
  const [domains, setDomains] = useState<BranchDomain[]>(INITIAL_DOMAINS)
  const [urls, setUrls] = useState<BranchEquipmentUrl[]>(INITIAL_URLS)

  // -- Domain helpers --------------------------------------------------------

  const getPrimaryDomain = useCallback(
    (branchId: string): BranchDomain | undefined => {
      return domains.find((d) => d.branchId === branchId && d.isPrimary)
    },
    [domains]
  )

  const addDomain = useCallback(
    (
      domain: Omit<BranchDomain, "id" | "createdAt" | "updatedAt">
    ): BranchDomain => {
      const now = new Date().toISOString()
      const newDomain: BranchDomain = {
        ...domain,
        id: generateId("dom"),
        createdAt: now,
        updatedAt: now,
      }
      setDomains((prev) => [...prev, newDomain])
      return newDomain
    },
    []
  )

  const updateDomain = useCallback(
    (id: string, updates: Partial<BranchDomain>): void => {
      setDomains((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, ...updates, updatedAt: new Date().toISOString() }
            : d
        )
      )
    },
    []
  )

  const deleteDomain = useCallback((id: string): void => {
    setDomains((prev) => prev.filter((d) => d.id !== id))
  }, [])

  // -- URL helpers -----------------------------------------------------------

  const getUrlsForEquipment = useCallback(
    (branchEquipmentId: string): BranchEquipmentUrl[] => {
      return urls.filter((u) => u.branchEquipmentId === branchEquipmentId)
    },
    [urls]
  )

  const addUrl = useCallback(
    (
      url: Omit<BranchEquipmentUrl, "id" | "createdAt" | "updatedAt">
    ): BranchEquipmentUrl => {
      const now = new Date().toISOString()
      const newUrl: BranchEquipmentUrl = {
        ...url,
        id: generateId("url"),
        createdAt: now,
        updatedAt: now,
      }
      setUrls((prev) => [...prev, newUrl])
      return newUrl
    },
    []
  )

  const updateUrl = useCallback(
    (id: string, updates: Partial<BranchEquipmentUrl>): void => {
      setUrls((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, ...updates, updatedAt: new Date().toISOString() }
            : u
        )
      )
    },
    []
  )

  const deleteUrl = useCallback((id: string): void => {
    setUrls((prev) => prev.filter((u) => u.id !== id))
  }, [])

  // -- Computed helpers ------------------------------------------------------

  const computeFullUrl = useCallback(
    (branchId: string, basePath: string, slug: string): string => {
      const primary = domains.find(
        (d) => d.branchId === branchId && d.isPrimary
      )
      if (!primary) return `${basePath}/${slug}`
      return `${primary.domain}${basePath}/${slug}`
    },
    [domains]
  )

  const isSlugUnique = useCallback(
    (
      branchId: string,
      pageType: PageType,
      slug: string,
      excludeId?: string
    ): boolean => {
      const matches = urls.filter(
        (u) =>
          u.branchId === branchId &&
          u.pageType === pageType &&
          u.slug === slug &&
          u.id !== excludeId
      )
      return matches.length === 0
    },
    [urls]
  )

  // -- Context value ---------------------------------------------------------

  const value: DomainContextType = {
    domains,
    urls,
    getPrimaryDomain,
    getUrlsForEquipment,
    addDomain,
    updateDomain,
    deleteDomain,
    addUrl,
    updateUrl,
    deleteUrl,
    computeFullUrl,
    isSlugUnique,
  }

  return (
    <DomainContext.Provider value={value}>{children}</DomainContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDomain(): DomainContextType {
  const ctx = useContext(DomainContext)
  if (!ctx) {
    throw new Error("useDomain must be used within a DomainProvider")
  }
  return ctx
}
