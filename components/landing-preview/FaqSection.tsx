"use client"

import { LPSection } from "./Section"
import { LPSectionImageStack } from "./SectionImageStack"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { LandingPreviewData } from "@/lib/landing-preview-types"

type Props = Pick<LandingPreviewData, "faqItems" | "faqImagesData" | "faqBgImage" | "faqBgImageCfg">

export function LPFaqSection({ faqItems, faqImagesData, faqBgImage, faqBgImageCfg }: Props) {
  if (!faqItems?.length) return null

  return (
    <LPSection
      id="faq"
      eyebrow="FAQ"
      title="자주 묻는 질문"
      description="궁금하신 부분을 정리했습니다. 더 깊은 안내가 필요하시다면 언제든 문의해 주세요."
      tone="elevated"
      align="center"
      className="bg-white"
      bgImage={faqBgImage}
      bgImageCfg={faqBgImageCfg}
    >
      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="last:border-b-0"
              style={{ borderBottomColor: "var(--lp-border)" }}
            >
              <AccordionTrigger
                className="py-7 text-left text-base font-semibold hover:no-underline sm:text-lg"
                style={{ color: "var(--lp-fg)" }}
              >
                {f.q}
              </AccordionTrigger>
              <AccordionContent
                className="pb-7 text-base leading-relaxed"
                style={{ color: "var(--lp-muted-fg)" }}
              >
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {faqImagesData && faqImagesData.length > 0 && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 mt-12">
          <LPSectionImageStack images={faqImagesData} />
        </div>
      )}
    </LPSection>
  )
}
