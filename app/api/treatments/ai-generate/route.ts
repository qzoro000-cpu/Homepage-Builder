import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic()

// Types matching the frontend treatment store
export type LandingSectionType =
  | "hero_image" | "hero_video" | "headline_copy" | "intro_text"
  | "feature_grid" | "diagnosis_section" | "treatment_process"
  | "program_pricing_table" | "before_after_gallery" | "quote_block"
  | "treatment_area_visual" | "faq_block" | "doctor_recommendation"
  | "equipment_highlight" | "differentiation_cards" | "clinic_info_block"
  | "map_block" | "cta_block" | "image_text_split" | "fullwidth_image"
  | "bullet_list" | "notice_block"

export type AiGenerateRequest = {
  treatment: {
    name: string
    category: string
    subcategory?: string
    oneLinePitch?: string
    shortDescription?: string
    longDescription?: string
    landingHeadline?: string
    landingSubheadline?: string
    differentiationCopy?: string
    chatbotSummary?: string
    durationMinutes?: number
    anesthesiaRequired?: boolean
    downtimeNote?: string
    painLevel?: string
    treatmentCycleGuide?: string
    maintenancePeriod?: string
    priceRegular?: number
    priceEvent?: number
    vatIncluded?: boolean
    useConsultInquiry?: boolean
    cardBadge?: string
  }
  benefits: string[]
  targets: string[]
  concernAreas: string[]
  keywords: string[]
  specialtyPoints: string[]
  programs: Array<{
    name: string
    targetArea?: string
    description?: string
    priceRegular?: number
    priceDiscount?: number
    durationMinutes?: number
  }>
  precautions: Array<{
    type: string
    content: string
  }>
  connectedEquipment: Array<{
    name: string
    category?: string
    oneLinePitch?: string
    energyType?: string
    benefits?: string[]
  }>
  connectedDoctors: Array<{
    name: string
    title?: string
    specialties?: string[]
    oneLinePitch?: string
  }>
  connectedFaqs: Array<{
    question: string
    answer?: string
  }>
  branchInfo: {
    name?: string
    address?: string
    phone?: string
    bookingUrl?: string
    primaryDomain?: string
  }
  availableAssets: Array<{
    id: string
    assetType: string
    fileType: string
    useForLanding: boolean
    useForHomepage: boolean
    isFeatured: boolean
    title?: string
  }>
  options: {
    templateType: "general" | "equipment_based" | "premium"
    tone: "premium" | "medical_info" | "consult_conversion" | "brand"
    length: "short" | "medium" | "long"
    emphasis: "effects" | "equipment" | "doctors" | "price" | "brand"
    includeEquipment: boolean
    includeDoctors: boolean
    includeFaq: boolean
    includeBranchInfo: boolean
    includeAssets: boolean
    excludeSections: LandingSectionType[]
  }
}

export type AiGeneratedSection = {
  section_type: LandingSectionType
  title: string
  subtitle?: string
  body?: string
  cta?: { label: string; url: string }
  linked_asset_ids: string[]
  linked_equipment_names: string[]
  linked_doctor_names: string[]
  linked_faq_questions: string[]
  style_variant?: string
  metadata?: Record<string, unknown>
  generation_source: string // which data was used
}

export type AiGenerateResponse = {
  success: boolean
  template_type: string
  page_title: string
  page_summary: string
  sections: AiGeneratedSection[]
  warnings: string[]
  used_sources: {
    treatment_fields: string[]
    equipment_fields: string[]
    doctor_fields: string[]
    faq_fields: string[]
    branch_fields: string[]
    asset_fields: string[]
  }
  error?: string
}

// ─────────────────────────────────────────────
// Template Section Definitions
// ─────────────────────────────────────────────

const TEMPLATE_SECTIONS: Record<string, LandingSectionType[]> = {
  general: [
    "hero_image", "headline_copy", "intro_text", "feature_grid",
    "program_pricing_table", "faq_block", "doctor_recommendation",
    "clinic_info_block", "cta_block"
  ],
  equipment_based: [
    "hero_image", "headline_copy", "equipment_highlight",
    "differentiation_cards", "treatment_area_visual",
    "program_pricing_table", "before_after_gallery",
    "doctor_recommendation", "cta_block"
  ],
  premium: [
    "hero_image", "headline_copy", "diagnosis_section",
    "image_text_split", "differentiation_cards",
    "program_pricing_table", "quote_block",
    "clinic_info_block", "map_block", "cta_block"
  ]
}

// ─────────────────────────────────────────────
// Prompt Builder
// ─────────────────────────────────────────────

function buildPrompt(req: AiGenerateRequest): string {
  const {
    treatment, benefits, targets, concernAreas, keywords, specialtyPoints,
    programs, precautions, connectedEquipment, connectedDoctors, connectedFaqs,
    branchInfo, availableAssets, options
  } = req

  const templateSections = TEMPLATE_SECTIONS[options.templateType]
    .filter(s => !options.excludeSections.includes(s))

  const toneMap = {
    premium: "고급스럽고 신뢰감 있는 의료 프리미엄 톤",
    medical_info: "의료 정보 중심, 전문적이고 설명적인 톤",
    consult_conversion: "상담 전환 유도 중심, 공감형 CTA가 강한 톤",
    brand: "브랜드 무드와 감성 중심, 차별화된 아이덴티티 표현"
  }

  const emphasisMap = {
    effects: "시술 효과와 기대 결과 중심",
    equipment: "장비 차별점과 기술력 중심",
    doctors: "의료진 전문성과 경험 중심",
    price: "가격 투명성과 프로그램 구성 중심",
    brand: "브랜드 무드와 클리닉 철학 중심"
  }

  const lengthMap = {
    short: "각 섹션 본문 2~3문장 이내",
    medium: "각 섹션 본문 4~6문장",
    long: "각 섹션 본문 6~10문장"
  }

  // Build data context
  const lines: string[] = []
  lines.push(`=== 시술 정보 ===`)
  lines.push(`시술명: ${treatment.name}`)
  lines.push(`카테고리: ${treatment.category}${treatment.subcategory ? ` / ${treatment.subcategory}` : ""}`)
  if (treatment.oneLinePitch) lines.push(`한줄설명: ${treatment.oneLinePitch}`)
  if (treatment.shortDescription) lines.push(`짧은소개: ${treatment.shortDescription}`)
  if (treatment.longDescription) lines.push(`상세소개: ${treatment.longDescription}`)
  if (treatment.landingHeadline) lines.push(`랜딩헤드라인: ${treatment.landingHeadline}`)
  if (treatment.landingSubheadline) lines.push(`서브헤드라인: ${treatment.landingSubheadline}`)
  if (treatment.differentiationCopy) lines.push(`차별화문구: ${treatment.differentiationCopy}`)
  if (treatment.durationMinutes) lines.push(`소요시간: ${treatment.durationMinutes}분`)
  if (treatment.anesthesiaRequired !== undefined) lines.push(`마취: ${treatment.anesthesiaRequired ? "필요" : "불필요"}`)
  if (treatment.painLevel) lines.push(`통증정도: ${treatment.painLevel}`)
  if (treatment.downtimeNote) lines.push(`회복기간: ${treatment.downtimeNote}`)
  if (treatment.treatmentCycleGuide) lines.push(`시술주기: ${treatment.treatmentCycleGuide}`)
  if (treatment.maintenancePeriod) lines.push(`유지기간: ${treatment.maintenancePeriod}`)
  if (treatment.useConsultInquiry) {
    lines.push(`가격: 상담 문의`)
  } else {
    if (treatment.priceEvent) lines.push(`이벤트가: ${treatment.priceEvent.toLocaleString()}원${treatment.vatIncluded ? " (VAT포함)" : ""}`)
    else if (treatment.priceRegular) lines.push(`정상가: ${treatment.priceRegular.toLocaleString()}원`)
  }
  if (benefits.length) lines.push(`효과태그: ${benefits.join(", ")}`)
  if (targets.length) lines.push(`추천대상: ${targets.join(", ")}`)
  if (concernAreas.length) lines.push(`고민부위: ${concernAreas.join(", ")}`)
  if (specialtyPoints.length) lines.push(`특화포인트: ${specialtyPoints.join(", ")}`)
  if (keywords.length) lines.push(`SEO키워드: ${keywords.join(", ")}`)

  if (programs.length) {
    lines.push(`\n=== 프로그램 구성 ===`)
    programs.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.name}${p.targetArea ? ` (${p.targetArea})` : ""}`)
      if (p.description) lines.push(`   설명: ${p.description}`)
      if (p.priceDiscount) lines.push(`   할인가: ${p.priceDiscount.toLocaleString()}원`)
      else if (p.priceRegular) lines.push(`   정가: ${p.priceRegular.toLocaleString()}원`)
      if (p.durationMinutes) lines.push(`   소요: ${p.durationMinutes}분`)
    })
  }

  const beforePrec = precautions.filter(p => p.type === "before")
  const afterPrec = precautions.filter(p => p.type === "after")
  if (beforePrec.length) lines.push(`\n시술전주의: ${beforePrec.map(p => p.content).join(" / ")}`)
  if (afterPrec.length) lines.push(`시술후주의: ${afterPrec.map(p => p.content).join(" / ")}`)

  if (options.includeEquipment && connectedEquipment.length) {
    lines.push(`\n=== 연결 장비 ===`)
    connectedEquipment.forEach(eq => {
      lines.push(`장비명: ${eq.name}${eq.category ? ` (${eq.category})` : ""}`)
      if (eq.oneLinePitch) lines.push(`  설명: ${eq.oneLinePitch}`)
      if (eq.energyType) lines.push(`  에너지: ${eq.energyType}`)
      if (eq.benefits?.length) lines.push(`  효과: ${eq.benefits.join(", ")}`)
    })
  }

  if (options.includeDoctors && connectedDoctors.length) {
    lines.push(`\n=== 연결 의료진 ===`)
    connectedDoctors.forEach(d => {
      lines.push(`${d.name} ${d.title || ""}`)
      if (d.specialties?.length) lines.push(`  전문: ${d.specialties.join(", ")}`)
      if (d.oneLinePitch) lines.push(`  소개: ${d.oneLinePitch}`)
    })
  }

  if (options.includeFaq && connectedFaqs.length) {
    lines.push(`\n=== FAQ ===`)
    connectedFaqs.slice(0, 5).forEach((f, i) => {
      lines.push(`Q${i + 1}: ${f.question}`)
      if (f.answer) lines.push(`A: ${f.answer}`)
    })
  }

  if (options.includeBranchInfo && (branchInfo.name || branchInfo.address)) {
    lines.push(`\n=== 지점 정보 ===`)
    if (branchInfo.name) lines.push(`지점명: ${branchInfo.name}`)
    if (branchInfo.address) lines.push(`주소: ${branchInfo.address}`)
    if (branchInfo.phone) lines.push(`전화: ${branchInfo.phone}`)
    if (branchInfo.bookingUrl) lines.push(`예약URL: ${branchInfo.bookingUrl}`)
  }

  if (options.includeAssets) {
    const landingAssets = availableAssets.filter(a => a.useForLanding || a.isFeatured)
    if (landingAssets.length) {
      lines.push(`\n=== 활용 가능 자산 ===`)
      landingAssets.forEach(a => {
        lines.push(`ID:${a.id} 유형:${a.assetType} 파일:${a.fileType}${a.title ? ` 제목:${a.title}` : ""}`)
      })
    }
  }

  const contextStr = lines.join("\n")

  return `당신은 한국 의료 피부과 랜딩페이지 콘텐츠 전문가입니다.
아래 CMS 데이터를 바탕으로 ${options.templateType === "general" ? "일반 시술형" : options.templateType === "equipment_based" ? "장비 기반 시술형" : "프리미엄 브랜드형"} 랜딩페이지 섹션을 생성하세요.

생성 규칙:
- 톤: ${toneMap[options.tone]}
- 강조점: ${emphasisMap[options.emphasis]}
- 분량: ${lengthMap[options.length]}
- 생성할 섹션 순서: ${templateSections.join(" → ")}
- 없는 정보는 절대 지어내지 마세요
- 의학적 효능을 과장하거나 단정하지 마세요
- 모바일 랜딩 기준 가독성을 고려해 작성하세요
- 의료광고 가이드라인을 준수하세요 (확정적 효과 표현 금지)
- 고객이 읽기 쉬운 한국어로 작성하세요
- 공개되지 않은 정보(internal_only, private 메모)는 포함하지 마세요

=== CMS 데이터 ===
${contextStr}

아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 순수 JSON만:
{
  "template_type": "${options.templateType}",
  "page_title": "...",
  "page_summary": "...",
  "sections": [
    {
      "section_type": "섹션타입",
      "title": "...",
      "subtitle": "...",
      "body": "...",
      "cta": { "label": "...", "url": "..." },
      "linked_asset_ids": [],
      "linked_equipment_names": [],
      "linked_doctor_names": [],
      "linked_faq_questions": [],
      "style_variant": "default",
      "metadata": {},
      "generation_source": "사용한 데이터 요약"
    }
  ],
  "warnings": ["데이터 부족 경고"],
  "used_sources": {
    "treatment_fields": [],
    "equipment_fields": [],
    "doctor_fields": [],
    "faq_fields": [],
    "branch_fields": [],
    "asset_fields": []
  }
}

데이터가 없어 섹션을 만들 수 없으면 해당 섹션을 warnings에 기록하고 생략하세요.`
}

// ─────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === "your_api_key_here") {
      return NextResponse.json(
        { success: false, error: "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 파일에 API 키를 입력하세요." },
        { status: 500 }
      )
    }

    const body = (await req.json()) as AiGenerateRequest

    const prompt = buildPrompt(body)

    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    })

    const responseText = message.content[0].type === "text" ? message.content[0].text : ""

    // Parse JSON from response (extract JSON if wrapped in markdown)
    let parsed: AiGenerateResponse
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("JSON not found in response")
      parsed = JSON.parse(jsonMatch[0]) as AiGenerateResponse
      parsed.success = true
    } catch {
      return NextResponse.json(
        { success: false, error: "AI 응답 파싱 실패", raw: responseText },
        { status: 500 }
      )
    }

    return NextResponse.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
