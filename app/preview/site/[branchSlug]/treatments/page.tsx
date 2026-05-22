"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useSiteData } from "../layout"
import { PreviewTreatmentCard } from "@/components/site/sections/shared"
import { SlidersHorizontal } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TreatmentsPage() {
  const { snapshot } = useSiteData()
  const params = useParams<{ branchSlug: string }>()
  const slug = params?.branchSlug ?? ""

  const [activeCategory, setActiveCategory] = useState<string>("all")

  if (!snapshot) return null

  const publicTreatments = snapshot.treatments.filter((t) => t.isPublic)

  // Unique categories
  const categories = ["all", ...Array.from(new Set(publicTreatments.map((t) => t.category).filter(Boolean)))]

  const filtered = activeCategory === "all"
    ? publicTreatments
    : publicTreatments.filter((t) => t.category === activeCategory)

  // Sort: featured first, then sortOrder
  const sorted = [...filtered].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1
    if (!a.isFeatured && b.isFeatured) return 1
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  })

  const v = snapshot.homepage.treatmentsPageValues ?? {}
  const pageTitle    = (v.pageTitle as string) || "시술안내"
  const pageSubtitle = (v.pageSubtitle as string) || "전문 의료진과 함께하는 맞춤 시술을 확인해보세요"
  const isDark     = ((v.bgColor as string) || "light") === "dark"
  const cardValues = v

  return (
    <main className="min-h-screen bg-white">
      {/* Page header */}
      <div className="bg-neutral-50 border-b border-neutral-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-2">Treatments</p>
          <h1 className="text-3xl font-bold text-neutral-900">{pageTitle}</h1>
          {pageSubtitle && <p className="text-neutral-500 mt-2">{pageSubtitle}</p>}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Category filter */}
        {categories.length > 2 && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            <SlidersHorizontal className="h-4 w-4 text-neutral-400 flex-none" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  activeCategory === cat
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                )}
              >
                {cat === "all" ? "전체" : cat}
              </button>
            ))}
          </div>
        )}

        {/* Count */}
        <p className="text-sm text-neutral-400 mb-6">
          {sorted.length}개의 시술
        </p>

        {/* Grid */}
        {sorted.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sorted.map((t) => (
              <Link
                key={t.id}
                href={`/preview/site/${slug}/treatments/${t.slug || t.id}`}
                className="block"
              >
                <PreviewTreatmentCard
                  treatment={{
                    id: t.id,
                    name: t.name,
                    category: t.category,
                    description: t.description,
                    price: t.price,
                    duration: t.duration,
                    image: t.image,
                    badge: t.badge,
                  }}
                  isDark={isDark}
                  cardValues={cardValues}
                  href={`/preview/site/${slug}/treatments/${t.slug || t.id}`}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-neutral-400">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="text-sm">해당 카테고리의 시술이 없습니다</p>
          </div>
        )}
      </div>
    </main>
  )
}
