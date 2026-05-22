"use client"

import React, { createContext, useCallback, useContext, useState } from "react"
import { LandingSectionType } from "./treatment-store"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type DraftSourceType = "manual" | "ai_generated" | "ai_regenerated"

export type DraftSection = {
  sectionType: LandingSectionType
  title?: string
  subtitle?: string
  body?: string
  styleVariant?: string
  metadata?: Record<string, unknown>
  isVisible: boolean
  sortOrder: number
}

export type LandingDraft = {
  id: string
  treatmentId: string
  source: DraftSourceType
  createdAt: string
  label: string
  sections: DraftSection[]
  templateType?: "general" | "equipment_based" | "premium"
  tone?: string
  pageTitle?: string
  pageSummary?: string
  warnings?: string[]
}

// ─────────────────────────────────────────────
// Context Type
// ─────────────────────────────────────────────

type LandingDraftContextType = {
  // Draft history (up to 10 per treatment)
  getDrafts: (treatmentId: string) => LandingDraft[]
  saveDraft: (draft: Omit<LandingDraft, "id" | "createdAt">) => LandingDraft
  deleteDraft: (draftId: string) => void

  // Pending draft (AI-generated, not yet applied)
  getPendingDraft: (treatmentId: string) => LandingDraft | null
  setPendingDraft: (treatmentId: string, draft: LandingDraft | null) => void
  discardPendingDraft: (treatmentId: string) => void

  // Locked section IDs (per treatment) — AI won't overwrite these
  getLockedSectionIds: (treatmentId: string) => Set<string>
  toggleSectionLock: (treatmentId: string, sectionId: string) => void
  isSectionLocked: (treatmentId: string, sectionId: string) => boolean
  clearAllLocks: (treatmentId: string) => void

  // AI generation state per treatment
  getIsGenerating: (treatmentId: string) => boolean
  setIsGenerating: (treatmentId: string, v: boolean) => void
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

// ─────────────────────────────────────────────
// Context & Provider
// ─────────────────────────────────────────────

const LandingDraftContext = createContext<LandingDraftContextType | null>(null)

export function LandingDraftProvider({ children }: { children: React.ReactNode }) {
  // draftHistory[treatmentId] = LandingDraft[]
  const [draftHistory, setDraftHistory] = useState<Record<string, LandingDraft[]>>({})
  // pendingDraft[treatmentId] = LandingDraft | null
  const [pendingDrafts, setPendingDrafts] = useState<Record<string, LandingDraft | null>>({})
  // lockedSections[treatmentId] = Set<sectionId>
  const [lockedSections, setLockedSections] = useState<Record<string, Set<string>>>({})
  // generatingState[treatmentId] = boolean
  const [generatingState, setGeneratingState] = useState<Record<string, boolean>>({})

  // ── Draft History ──

  const getDrafts = useCallback(
    (treatmentId: string): LandingDraft[] => draftHistory[treatmentId] ?? [],
    [draftHistory]
  )

  const saveDraft = useCallback(
    (draft: Omit<LandingDraft, "id" | "createdAt">): LandingDraft => {
      const newDraft: LandingDraft = {
        ...draft,
        id: generateId("draft"),
        createdAt: new Date().toISOString(),
      }
      setDraftHistory((prev) => {
        const existing = prev[draft.treatmentId] ?? []
        // Keep last 10 drafts
        const updated = [newDraft, ...existing].slice(0, 10)
        return { ...prev, [draft.treatmentId]: updated }
      })
      return newDraft
    },
    []
  )

  const deleteDraft = useCallback((draftId: string) => {
    setDraftHistory((prev) => {
      const updated: Record<string, LandingDraft[]> = {}
      for (const [tid, drafts] of Object.entries(prev)) {
        updated[tid] = drafts.filter((d) => d.id !== draftId)
      }
      return updated
    })
  }, [])

  // ── Pending Draft ──

  const getPendingDraft = useCallback(
    (treatmentId: string): LandingDraft | null => pendingDrafts[treatmentId] ?? null,
    [pendingDrafts]
  )

  const setPendingDraft = useCallback(
    (treatmentId: string, draft: LandingDraft | null) => {
      setPendingDrafts((prev) => ({ ...prev, [treatmentId]: draft }))
    },
    []
  )

  const discardPendingDraft = useCallback((treatmentId: string) => {
    setPendingDrafts((prev) => ({ ...prev, [treatmentId]: null }))
  }, [])

  // ── Locked Sections ──

  const getLockedSectionIds = useCallback(
    (treatmentId: string): Set<string> => lockedSections[treatmentId] ?? new Set(),
    [lockedSections]
  )

  const toggleSectionLock = useCallback((treatmentId: string, sectionId: string) => {
    setLockedSections((prev) => {
      const current = new Set(prev[treatmentId] ?? [])
      if (current.has(sectionId)) {
        current.delete(sectionId)
      } else {
        current.add(sectionId)
      }
      return { ...prev, [treatmentId]: current }
    })
  }, [])

  const isSectionLocked = useCallback(
    (treatmentId: string, sectionId: string): boolean =>
      lockedSections[treatmentId]?.has(sectionId) ?? false,
    [lockedSections]
  )

  const clearAllLocks = useCallback((treatmentId: string) => {
    setLockedSections((prev) => ({ ...prev, [treatmentId]: new Set() }))
  }, [])

  // ── Generation State ──

  const getIsGenerating = useCallback(
    (treatmentId: string): boolean => generatingState[treatmentId] ?? false,
    [generatingState]
  )

  const setIsGenerating = useCallback((treatmentId: string, v: boolean) => {
    setGeneratingState((prev) => ({ ...prev, [treatmentId]: v }))
  }, [])

  const value: LandingDraftContextType = {
    getDrafts,
    saveDraft,
    deleteDraft,
    getPendingDraft,
    setPendingDraft,
    discardPendingDraft,
    getLockedSectionIds,
    toggleSectionLock,
    isSectionLocked,
    clearAllLocks,
    getIsGenerating,
    setIsGenerating,
  }

  return (
    <LandingDraftContext.Provider value={value}>{children}</LandingDraftContext.Provider>
  )
}

export function useLandingDraft(): LandingDraftContextType {
  const ctx = useContext(LandingDraftContext)
  if (!ctx) {
    throw new Error("useLandingDraft must be used within a LandingDraftProvider")
  }
  return ctx
}
