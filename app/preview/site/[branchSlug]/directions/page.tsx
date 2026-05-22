"use client"

import { useState, useEffect } from "react"
import { useSiteData } from "../layout"
import { PreviewInfo } from "@/components/site/sections/SectionPreviewBlock"

export default function DirectionsPage() {
  const { snapshot } = useSiteData()
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop")

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setDevice(e.matches ? "mobile" : "desktop")
    setDevice(mq.matches ? "mobile" : "desktop")
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  if (!snapshot) return null

  const lv = snapshot.homepage.sectionValues["location"] ?? {}

  return (
    <main className="min-h-screen bg-neutral-50">
      <PreviewInfo v={lv} device={device} />
    </main>
  )
}
