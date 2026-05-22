"use client"

import type { LandingPreviewData } from "@/lib/landing-preview-types"

type Props = Pick<LandingPreviewData, "finalCta" | "clinicInfo">

export function LPFinalCtaSection({ finalCta, clinicInfo }: Props) {
  if (!finalCta) return null

  return (
    <section
      id="reserve"
      className="relative w-full overflow-hidden"
      style={{ background: "var(--lp-grad-card-frost)", color: "var(--lp-fg)" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{ background: "var(--lp-grad-shine)" }}
      />
      <div className="relative mx-auto w-full max-w-5xl px-5 sm:px-8 py-24 sm:py-32 lg:py-40 text-center">
        <p
          className="text-[11px] uppercase tracking-[0.32em]"
          style={{ color: "color-mix(in oklch, var(--lp-fg) 55%, transparent)" }}
        >
          Begin Your Journey
        </p>
        <h2
          className="mt-6 lp-font-display text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
          style={{ color: "var(--lp-fg)" }}
        >
          {finalCta.headline}
        </h2>
        {finalCta.body && (
          <p
            className="mt-6 mx-auto max-w-xl text-base leading-relaxed sm:text-lg"
            style={{ color: "color-mix(in oklch, var(--lp-fg) 70%, transparent)" }}
          >
            {finalCta.body}
          </p>
        )}

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={finalCta.primary.href}
            className="inline-flex h-14 items-center justify-center rounded-full px-10 text-sm font-medium tracking-wide transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--lp-fg)", color: "var(--lp-bg)" }}
          >
            {finalCta.primary.label}
          </a>
          {finalCta.secondary && (
            <a
              href={finalCta.secondary.href}
              className="inline-flex h-14 items-center justify-center rounded-full border bg-transparent px-10 text-sm font-medium tracking-wide transition-all"
              style={{
                borderColor: "color-mix(in oklch, var(--lp-fg) 30%, transparent)",
                color: "var(--lp-fg)",
              }}
            >
              {finalCta.secondary.label}
            </a>
          )}
        </div>

        {clinicInfo && (
          <div
            className="mt-20 grid grid-cols-1 gap-8 border-t pt-12 text-left sm:grid-cols-3"
            style={{ borderColor: "color-mix(in oklch, var(--lp-fg) 10%, transparent)" }}
          >
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.28em]"
                style={{ color: "color-mix(in oklch, var(--lp-fg) 50%, transparent)" }}
              >
                Clinic
              </p>
              <p
                className="mt-3 lp-font-display text-lg"
                style={{ color: "var(--lp-fg)" }}
              >
                {clinicInfo.name}
              </p>
              {clinicInfo.address && (
                <p
                  className="mt-2 text-sm"
                  style={{ color: "color-mix(in oklch, var(--lp-fg) 65%, transparent)" }}
                >
                  {clinicInfo.address}
                </p>
              )}
            </div>
            {clinicInfo.hours?.length ? (
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.28em]"
                  style={{ color: "color-mix(in oklch, var(--lp-fg) 50%, transparent)" }}
                >
                  Hours
                </p>
                <ul className="mt-3 space-y-1 text-sm"
                  style={{ color: "color-mix(in oklch, var(--lp-fg) 70%, transparent)" }}>
                  {clinicInfo.hours.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {clinicInfo.phone && (
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.28em]"
                  style={{ color: "color-mix(in oklch, var(--lp-fg) 50%, transparent)" }}
                >
                  Contact
                </p>
                <a
                  href={`tel:${clinicInfo.phone.replace(/[^0-9]/g, "")}`}
                  className="mt-3 block lp-font-display text-lg hover:opacity-80"
                  style={{ color: "var(--lp-fg)" }}
                >
                  {clinicInfo.phone}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
