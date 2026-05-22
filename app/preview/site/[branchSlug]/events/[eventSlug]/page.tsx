"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useSiteData } from "../../layout"
import { ChevronLeft, Calendar, Clock, Phone, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function EventLandingPage() {
  const { snapshot } = useSiteData()
  const params = useParams<{ branchSlug: string; eventSlug: string }>()
  const branchSlug = params?.branchSlug  ?? ""
  const eventSlug  = params?.eventSlug   ?? ""

  if (!snapshot) return null

  const event = snapshot.events.find(
    (e) => e.id === eventSlug || e.slug === eventSlug,
  )

  if (!event) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="text-5xl block">🔍</span>
          <h2 className="text-lg font-semibold text-neutral-800">이벤트를 찾을 수 없습니다</h2>
          <Link
            href={`/preview/site/${branchSlug}`}
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> 홈으로
          </Link>
        </div>
      </main>
    )
  }

  const isActive    = event.status === "active"
  const isScheduled = event.status === "scheduled"
  const isEnded     = event.status === "ended"
  const branch      = snapshot.branch

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative bg-neutral-900 overflow-hidden">
        {event.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.thumbnail}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          <Link
            href={`/preview/site/${branchSlug}`}
            className="inline-flex items-center gap-1 text-white/60 text-sm mb-6 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> 홈으로
          </Link>

          <span className={cn(
            "inline-block px-3 py-1 text-xs font-semibold rounded-full mb-4",
            isActive ? "bg-emerald-500 text-white" :
            isScheduled ? "bg-sky-500 text-white" :
            "bg-neutral-500 text-white"
          )}>
            {isActive ? "진행중" : isScheduled ? "예정" : "종료"}
          </span>

          <h1 className="text-4xl font-bold text-white mb-4">{event.title}</h1>
          <p className="text-white/80 text-lg">{event.description}</p>

          <div className="flex flex-wrap gap-4 mt-6 text-white/70 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{event.startDate} ~ {event.endDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Event content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {event.content ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: event.content }} />
        ) : (
          <div className="bg-neutral-50 rounded-2xl p-8 text-center text-neutral-400">
            <p className="text-sm">이벤트 상세 내용이 준비 중입니다</p>
          </div>
        )}

        {/* Ended notice */}
        {isEnded && (
          <div className="mt-8 p-5 bg-neutral-100 rounded-2xl text-sm text-neutral-500 text-center">
            이 이벤트는 종료되었습니다. 다른 이벤트를 확인해보세요.
          </div>
        )}

        {/* CTA */}
        {!isEnded && (
          <div className="mt-10 bg-neutral-900 rounded-2xl p-8 text-center text-white">
            <h3 className="text-xl font-bold mb-2">지금 이 혜택을 받아보세요</h3>
            <p className="text-white/70 text-sm mb-6">전문 의료진과 상담하고 나에게 맞는 시술을 찾아보세요</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {branch.phone && (
                <a href={`tel:${branch.phone}`} className="flex items-center gap-2 px-5 py-2.5 bg-white text-neutral-900 rounded-full text-sm font-medium hover:bg-neutral-100 transition-colors">
                  <Phone className="h-4 w-4" /> 전화 상담
                </a>
              )}
              {branch.kakaoLink && (
                <a href={branch.kakaoLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-neutral-900 rounded-full text-sm font-medium hover:bg-yellow-300 transition-colors">
                  <MessageCircle className="h-4 w-4" /> 카카오 문의
                </a>
              )}
              {branch.bookingLink && (
                <a href={branch.bookingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-neutral-600 text-white rounded-full text-sm font-medium hover:bg-neutral-500 transition-colors">
                  온라인 예약
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
