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

export type ContentNodeType =
  | "equipment"
  | "treatment"
  | "doctor"
  | "faq"
  | "event"
  | "notice"
  | "landing_page"

export type RelationType =
  | "related"
  | "featured"
  | "faq_for"
  | "recommended_by"
  | "landing_source"
  | "chatbot_reference"

export type RelationUse = {
  homepage: boolean
  landing: boolean
  chatbot: boolean
  internalOnly: boolean
}

export type ContentRelation = {
  id: string
  sourceType: ContentNodeType
  sourceId: string
  targetType: ContentNodeType
  targetId: string
  relationType: RelationType
  relevanceScore?: number
  use: RelationUse
  note?: string
  sortOrder: number
  branchId?: string
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

type ContentRelationContextType = {
  relations: ContentRelation[]
  getRelationsFrom: (
    sourceId: string,
    sourceType?: ContentNodeType
  ) => ContentRelation[]
  getRelationsTo: (
    targetId: string,
    targetType?: ContentNodeType
  ) => ContentRelation[]
  addRelation: (
    relation: Omit<ContentRelation, "id" | "createdAt" | "updatedAt">
  ) => ContentRelation
  updateRelation: (id: string, updates: Partial<ContentRelation>) => void
  removeRelation: (id: string) => void
  moveRelation: (id: string, direction: "up" | "down") => void
  hasRelation: (
    sourceId: string,
    targetId: string,
    relationType: RelationType
  ) => boolean
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const NOW = new Date().toISOString()

const INITIAL_RELATIONS: ContentRelation[] = [
  {
    id: "rel_e1_t1",
    sourceType: "equipment",
    sourceId: "eq_e1",
    targetType: "treatment",
    targetId: "t1",
    relationType: "featured",
    use: { homepage: true, landing: true, chatbot: true, internalOnly: false },
    sortOrder: 1,
    branchId: "main",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "rel_e1_d1",
    sourceType: "equipment",
    sourceId: "eq_e1",
    targetType: "doctor",
    targetId: "d1",
    relationType: "recommended_by",
    use: { homepage: true, landing: false, chatbot: true, internalOnly: false },
    sortOrder: 2,
    branchId: "main",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "rel_e1_f1",
    sourceType: "equipment",
    sourceId: "eq_e1",
    targetType: "faq",
    targetId: "f1",
    relationType: "faq_for",
    use: {
      homepage: false,
      landing: false,
      chatbot: true,
      internalOnly: false,
    },
    note: "리프팅 관련 자주 묻는 질문",
    sortOrder: 3,
    branchId: "main",
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

const ContentRelationContext =
  createContext<ContentRelationContextType | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ContentRelationProvider({ children }: { children: ReactNode }) {
  const [relations, setRelations] =
    useState<ContentRelation[]>(INITIAL_RELATIONS)

  // -- Read helpers ----------------------------------------------------------

  const getRelationsFrom = useCallback(
    (sourceId: string, sourceType?: ContentNodeType): ContentRelation[] => {
      return relations.filter(
        (r) =>
          r.sourceId === sourceId &&
          (sourceType === undefined || r.sourceType === sourceType)
      )
    },
    [relations]
  )

  const getRelationsTo = useCallback(
    (targetId: string, targetType?: ContentNodeType): ContentRelation[] => {
      return relations.filter(
        (r) =>
          r.targetId === targetId &&
          (targetType === undefined || r.targetType === targetType)
      )
    },
    [relations]
  )

  const hasRelation = useCallback(
    (
      sourceId: string,
      targetId: string,
      relationType: RelationType
    ): boolean => {
      return relations.some(
        (r) =>
          r.sourceId === sourceId &&
          r.targetId === targetId &&
          r.relationType === relationType
      )
    },
    [relations]
  )

  // -- Write helpers ---------------------------------------------------------

  const addRelation = useCallback(
    (
      relation: Omit<ContentRelation, "id" | "createdAt" | "updatedAt">
    ): ContentRelation => {
      const now = new Date().toISOString()
      const newRelation: ContentRelation = {
        ...relation,
        id: generateId("rel"),
        createdAt: now,
        updatedAt: now,
      }
      setRelations((prev) => [...prev, newRelation])
      return newRelation
    },
    []
  )

  const updateRelation = useCallback(
    (id: string, updates: Partial<ContentRelation>): void => {
      setRelations((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, ...updates, updatedAt: new Date().toISOString() }
            : r
        )
      )
    },
    []
  )

  const removeRelation = useCallback((id: string): void => {
    setRelations((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const moveRelation = useCallback(
    (id: string, direction: "up" | "down"): void => {
      setRelations((prev) => {
        // Sort by sortOrder to find the target's neighbours
        const sorted = [...prev].sort((a, b) => a.sortOrder - b.sortOrder)
        const index = sorted.findIndex((r) => r.id === id)
        if (index === -1) return prev

        const swapIndex = direction === "up" ? index - 1 : index + 1
        if (swapIndex < 0 || swapIndex >= sorted.length) return prev

        const targetOrder = sorted[index].sortOrder
        const neighbourOrder = sorted[swapIndex].sortOrder
        const neighbourId = sorted[swapIndex].id
        const now = new Date().toISOString()

        return prev.map((r) => {
          if (r.id === id)
            return { ...r, sortOrder: neighbourOrder, updatedAt: now }
          if (r.id === neighbourId)
            return { ...r, sortOrder: targetOrder, updatedAt: now }
          return r
        })
      })
    },
    []
  )

  // -- Context value ---------------------------------------------------------

  const value: ContentRelationContextType = {
    relations,
    getRelationsFrom,
    getRelationsTo,
    addRelation,
    updateRelation,
    removeRelation,
    moveRelation,
    hasRelation,
  }

  return (
    <ContentRelationContext.Provider value={value}>
      {children}
    </ContentRelationContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useContentRelation(): ContentRelationContextType {
  const ctx = useContext(ContentRelationContext)
  if (!ctx) {
    throw new Error(
      "useContentRelation must be used within a ContentRelationProvider"
    )
  }
  return ctx
}
