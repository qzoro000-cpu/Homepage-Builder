"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useTreatment } from "@/lib/treatment-store"
import type { TreatmentProfile, TreatmentData, TreatmentPrecaution, TreatmentWhyTatoaCard, TreatmentProgram } from "@/lib/treatment-store"
import { LandingPagePreview } from "@/components/landing-preview/LandingPagePreview"

// ─── CMS 실시간 랜딩 미리보기 ─────────────────────────────────────────────────
// Route: /preview/landing/live/[treatmentId]
// - iframe으로 임베드됨 (iframe의 뷰포트로 실제 모바일/PC 브레이크포인트 반영)
// - CMS에서 필드 수정 시 BroadcastChannel + localStorage로 실시간 갱신
// ─────────────────────────────────────────────────────────────────────────────

const liveFormKey   = (id: string) => `lp_live_form_${id}`
const liveBroadcast = (id: string) => `lp_live_${id}`

type DataOverride = {
  specialtyPoints?: string[]
  benefits?: string[]
  precautions?: TreatmentPrecaution[]
  whyTatoaCards?: TreatmentWhyTatoaCard[]
  programs?: TreatmentProgram[]
}

function parseStoredPayload(raw: string): {
  profileOverride: Partial<TreatmentProfile>
  dataOverride: DataOverride
} {
  const parsed = JSON.parse(raw) as Record<string, unknown>
  const { __specialtyPoints, __benefits, __precautions, __whyTatoaCards, __programs, ...profileFields } = parsed
  return {
    profileOverride: profileFields as Partial<TreatmentProfile>,
    dataOverride: {
      specialtyPoints: Array.isArray(__specialtyPoints) ? (__specialtyPoints as string[])              : undefined,
      benefits:        Array.isArray(__benefits)        ? (__benefits as string[])                     : undefined,
      precautions:     Array.isArray(__precautions)     ? (__precautions as TreatmentPrecaution[])     : undefined,
      whyTatoaCards:   Array.isArray(__whyTatoaCards)   ? (__whyTatoaCards as TreatmentWhyTatoaCard[]) : undefined,
      programs:        Array.isArray(__programs)        ? (__programs as TreatmentProgram[])           : undefined,
    },
  }
}

export default function LiveLandingPreviewPage() {
  const { treatmentId } = useParams<{ treatmentId: string }>()
  const { getTreatment, getEffectiveAssets } = useTreatment()
  const [profileOverride, setProfileOverride] = useState<Partial<TreatmentProfile> | null>(null)
  const [dataOverride, setDataOverride]       = useState<DataOverride | null>(null)
  const [mounted, setMounted]                 = useState(false)

  useEffect(() => {
    setMounted(true)

    function applyPayload(raw: string | null) {
      if (!raw) return
      try {
        const { profileOverride: po, dataOverride: dov } = parseStoredPayload(raw)
        setProfileOverride(po)
        setDataOverride(dov)
      } catch {}
    }

    // 최초 로드: CMS에서 마지막으로 저장한 draft form 읽기
    applyPayload(localStorage.getItem(liveFormKey(treatmentId)))

    // CMS에서 변경 알림 수신 → localForm 재로드
    const bc = new BroadcastChannel(liveBroadcast(treatmentId))
    bc.onmessage = () => applyPayload(localStorage.getItem(liveFormKey(treatmentId)))
    return () => bc.close()
  }, [treatmentId])

  // SSR 중에는 빈 화면 (TreatmentProvider가 클라이언트 전용)
  if (!mounted) return null

  const treatmentData = getTreatment(treatmentId)
  if (!treatmentData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-400">시술 데이터를 찾을 수 없습니다</p>
      </div>
    )
  }

  // CMS localForm 오버라이드를 store profile에 merge
  const profile: TreatmentProfile = profileOverride
    ? { ...treatmentData.profile, ...profileOverride }
    : treatmentData.profile

  // specialtyPoints / benefits / precautions는 TreatmentData 영역 → data에 merge
  const data: TreatmentData = dataOverride
    ? {
        ...treatmentData,
        specialtyPoints: dataOverride.specialtyPoints ?? treatmentData.specialtyPoints,
        benefits:        dataOverride.benefits        ?? treatmentData.benefits,
        precautions:     dataOverride.precautions     ?? treatmentData.precautions,
        whyTatoaCards:   dataOverride.whyTatoaCards   ?? treatmentData.whyTatoaCards,
        programs:        dataOverride.programs        ?? treatmentData.programs,
      }
    : treatmentData

  const assets = getEffectiveAssets(treatmentId)

  return (
    <LandingPagePreview
      profile={profile}
      data={data}
      assets={assets}
    />
  )
}
