"use client"

import { useEffect, useState } from "react"
import { useSiteData } from "../../layout"
import { Step6Confirm, OD, ThemeCtx, val } from "@/components/site/sections/booking-preview"
import type { FieldValue, TreatmentOption } from "@/components/site/sections/booking-preview"

type BookingDraft = {
  branchId: string
  selectedTxIds: string[]
  option: TreatmentOption | ""
  date: string
  time: string
  createdAt: number
}

function readBookingDraft(branchId: string): BookingDraft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(`tatoa_booking_draft_${branchId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BookingDraft
    if (!parsed || typeof parsed !== "object") return null
    if (typeof parsed.branchId !== "string") return null
    return parsed
  } catch {
    return null
  }
}

export default function BookingCompletePage() {
  const { snapshot } = useSiteData()
  const [draft, setDraft] = useState<BookingDraft | null>(null)
  const [draftLoaded, setDraftLoaded] = useState(false)

  useEffect(() => {
    if (!snapshot) return
    setDraft(readBookingDraft(snapshot.branch.id))
    setDraftLoaded(true)
  }, [snapshot])

  if (!snapshot) return null

  const bookingValues = (snapshot.homepage.bookingValues ?? {}) as Record<string, FieldValue>
  const branch = snapshot.branch

  if (!draftLoaded) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div style={{ padding: "40px 20px", textAlign: "center", color: OD.brand40 }}>
          불러오는 중...
        </div>
      </main>
    )
  }

  const isDark = val<string>(bookingValues, "bkBgTheme") !== "light"
  const [isNarrow, setIsNarrow] = useState(false)
  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 540)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <main className="min-h-screen bg-neutral-50">
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 20px" }}>
        <ThemeCtx.Provider value={{ isDark, isPage: true, isNarrow }}>
          <Step6Confirm
            values={bookingValues}
            branchName={branch.name}
            option={draft?.option ?? ""}
            selectedTxIds={draft?.selectedTxIds ?? []}
            branchId={branch.id}
            date={draft?.date ?? ""}
            time={draft?.time ?? ""}
            onReset={() => { /* 19-E-5에서 구현 */ }}
          />
        </ThemeCtx.Provider>
      </div>
    </main>
  )
}
