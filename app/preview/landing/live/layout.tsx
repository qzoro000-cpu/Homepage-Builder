"use client"

import { TreatmentProvider } from "@/lib/treatment-store"

// /preview/landing/live/[treatmentId] 는 iframe 내부에서 렌더되므로
// 독립 라우트 세그먼트로 작동합니다. useTreatment() 훅이 동작하려면
// TreatmentProvider가 필요하므로 여기서 래핑합니다.
export default function LivePreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <TreatmentProvider>{children}</TreatmentProvider>
}
