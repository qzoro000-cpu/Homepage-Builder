"use client"

import { useEffect, useState } from "react"
import { useSiteData } from "./layout"
import { SectionPreviewBlock } from "@/components/site/sections"
import type { HomeSectionId } from "@/components/site/sections"
import { parseIconConfigs, RenderSectionIcon } from "@/app/admin/branch/homepage/icon-library"

const MOBILE_BREAKPOINT = 767  // Tailwind md breakpoint: ≤767 mobile, ≥768 desktop

export default function PreviewSiteHome() {
  const { snapshot } = useSiteData()
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia("(max-width: " + MOBILE_BREAKPOINT + "px)")
    const update = () => setDevice(mq.matches ? "mobile" : "desktop")
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  if (!mounted || !snapshot) return null

  const enabledSections = snapshot.homepage.sections.filter(s => s.isEnabled)

  return (
    <div style={{ width: "100%", minHeight: "100vh" }}>
      {enabledSections.map(section => {
        const v = snapshot.homepage.sectionValues[section.id] ?? {}
        const cfgs = parseIconConfigs((v.iconConfigs ?? v.iconConfig) as unknown)
        return (
          <div key={section.id} style={{ position: "relative" }}>
            <SectionPreviewBlock
              sectionId={section.id as HomeSectionId}
              values={v}
              branchName={snapshot.branch.name}
              branchId={snapshot.branchId}
              isFullscreen={false}
              device={device}
              isPageView
              doctors={snapshot.doctors}
            />
            {cfgs.map((cfg, idx) => (
              <RenderSectionIcon key={idx} config={cfg} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
