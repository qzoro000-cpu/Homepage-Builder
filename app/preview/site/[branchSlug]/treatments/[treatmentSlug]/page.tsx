"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useSiteData } from "../../layout"
import { LandingPagePreview } from "@/components/landing-preview/LandingPagePreview"
import type { TreatmentProfile, TreatmentData, TreatmentAsset } from "@/lib/treatment-store"
import { ChevronLeft, Phone, MessageCircle, Calendar } from "lucide-react"

// ─── Fallback landing when no rich CMS data exists ────────────────────────────

function SimpleTreatmentLanding({
  treatment,
  slug,
  branchSlug,
}: {
  treatment: {
    name: string
    category: string
    description: string
    price: string
    duration: string
    image: string
  }
  slug: string
  branchSlug: string
}) {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative min-h-[60vh] flex items-end bg-neutral-900 overflow-hidden">
        {treatment.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={treatment.image}
            alt={treatment.name}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-12 pt-16">
          <Link
            href={`/preview/site/${branchSlug}/treatments`}
            className="inline-flex items-center gap-1 text-white/70 text-sm mb-4 hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> 시술안내
          </Link>
          <span className="block text-xs font-semibold tracking-widest text-white/60 uppercase mb-2">{treatment.category}</span>
          <h1 className="text-4xl font-bold text-white mb-3">{treatment.name}</h1>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <span className="font-bold text-xl text-white">{treatment.price}</span>
            {treatment.duration && <span>· {treatment.duration}</span>}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-neutral-700 text-lg leading-relaxed">{treatment.description}</p>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={`/preview/site/${branchSlug}/booking`}
            className="px-7 py-3 bg-neutral-900 text-white font-medium rounded-full hover:bg-neutral-700 transition-colors"
          >
            예약하기
          </a>
          <a
            href={`/preview/site/${branchSlug}/booking`}
            className="px-7 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-full hover:bg-neutral-50 transition-colors"
          >
            상담 문의
          </a>
        </div>
      </div>
    </main>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TreatmentLandingPage() {
  const { snapshot } = useSiteData()
  const params = useParams<{ branchSlug: string; treatmentSlug: string }>()
  const branchSlug    = params?.branchSlug     ?? ""
  const treatmentSlug = params?.treatmentSlug  ?? ""

  if (!snapshot) return null

  // Find treatment by slug or id
  const treatment = snapshot.treatments.find(
    (t) => t.slug === treatmentSlug || t.id === treatmentSlug,
  )

  if (!treatment) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="text-5xl block">🔍</span>
          <h2 className="text-lg font-semibold text-neutral-800">시술 정보를 찾을 수 없습니다</h2>
          <Link
            href={`/preview/site/${branchSlug}/treatments`}
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> 시술 목록으로 돌아가기
          </Link>
        </div>
      </main>
    )
  }

  // If we have rich landing data (from CMS treatment store), use LandingPagePreview
  if (treatment.landingProfile && treatment.landingData) {
    const profile = treatment.landingProfile as unknown as TreatmentProfile
    const data    = treatment.landingData    as unknown as TreatmentData
    const assets  = (treatment.landingAssets ?? []) as TreatmentAsset[]

    return (
      <div className="min-h-screen">
        {/* Back button overlay */}
        <div className="fixed bottom-4 left-4 z-50">
          <Link
            href={`/preview/site/${branchSlug}/treatments`}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur border border-neutral-200 rounded-full text-sm font-medium shadow-md hover:bg-white transition-all"
          >
            <ChevronLeft className="h-4 w-4" /> 시술 목록
          </Link>
        </div>
        <LandingPagePreview profile={profile} data={data} assets={assets} />
      </div>
    )
  }

  // Fallback: simple layout from basic treatment card data
  return (
    <SimpleTreatmentLanding
      treatment={treatment}
      slug={treatmentSlug}
      branchSlug={branchSlug}
    />
  )
}
