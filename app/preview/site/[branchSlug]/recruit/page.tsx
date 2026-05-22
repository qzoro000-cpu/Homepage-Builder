"use client"

import { useSiteData } from "../layout"
import { PreviewRecruit } from "@/components/site/sections/recruit-preview"

export default function RecruitPage() {
  const { snapshot } = useSiteData()

  if (!snapshot) return null

  const recruitValues = snapshot.homepage.sectionValues["recruit"] ?? {}

  return (
    <main className="min-h-screen bg-white">
      <PreviewRecruit values={recruitValues} branchName={snapshot.branch.name} />
    </main>
  )
}
