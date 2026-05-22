import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic()

export type LandingSectionType =
  | "hero_image" | "hero_video" | "headline_copy" | "intro_text"
  | "feature_grid" | "diagnosis_section" | "treatment_process"
  | "program_pricing_table" | "before_after_gallery" | "quote_block"
  | "treatment_area_visual" | "faq_block" | "doctor_recommendation"
  | "equipment_highlight" | "differentiation_cards" | "clinic_info_block"
  | "map_block" | "cta_block" | "image_text_split" | "fullwidth_image"
  | "bullet_list" | "notice_block"

export type AiRegenerateSectionRequest = {
  sectionType: LandingSectionType
  existingContent?: {
    title?: string
    subtitle?: string
    body?: string
    metadata?: Record<string, unknown>
  }
  instructions?: string // user's custom instruction for this section
  treatment: {
    name: string
    category: string
    oneLinePitch?: string
    shortDescription?: string
    longDescription?: string
    landingHeadline?: string
    landingSubheadline?: string
    differentiationCopy?: string
    durationMinutes?: number
    painLevel?: string
    downtimeNote?: string
    priceRegular?: number
    priceEvent?: number
    useConsultInquiry?: boolean
  }
  benefits: string[]
  targets: string[]
  concernAreas: string[]
  specialtyPoints: string[]
  programs: Array<{
    name: string
    targetArea?: string
    description?: string
    priceRegular?: number
    priceDiscount?: number
    durationMinutes?: number
  }>
  precautions: Array<{ type: string; content: string }>
  connectedEquipment: Array<{
    name: string
    category?: string
    oneLinePitch?: string
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
  tone: "premium" | "medical_info" | "consult_conversion" | "brand"
}

export type AiRegenerateSectionResponse = {
  success: boolean
  section?: {
    section_type: LandingSectionType
    title: string
    subtitle?: string
    body?: string
    style_variant?: string
    metadata?: Record<string, unknown>
  }
  error?: string
}

const SECTION_NAME_MAP: Record<string, string> = {
  hero_image: "히어로 이미지",
  hero_video: "히어로 영상",
  headline_copy: "헤드라인 카피",
  intro_text: "시술 소개",
  feature_grid: "특징 그리드",
  diagnosis_section: "진단 섹션",
  treatment_process: "시술 프로세스",
  program_pricing_table: "가격/프로그램 표",
  before_after_gallery: "비포&애프터 갤러리",
  quote_block: "인용 블록",
  treatment_area_visual: "적용 부위 이미지",
  faq_block: "FAQ",
  doctor_recommendation: "의료진 추천",
  equipment_highlight: "장비 소개",
  differentiation_cards: "차별화 카드",
  clinic_info_block: "센터 정보",
  map_block: "오시는 길",
  cta_block: "CTA",
  image_text_split: "이미지+텍스트 분할",
  fullwidth_image: "전체 폭 이미지",
  bullet_list: "불릿 목록",
  notice_block: "안내 블록",
}

function buildSectionPrompt(req: AiRegenerateSectionRequest): string {
  const { sectionType, existingContent, instructions, treatment, benefits, targets, concernAreas,
    specialtyPoints, programs, precautions, connectedEquipment, connectedDoctors, connectedFaqs, tone } = req

  const toneMap = {
    premium: "고급스럽고 신뢰감 있는 프리미엄 톤",
    medical_info: "의료 정보 중심, 전문적이고 설명적인 톤",
    consult_conversion: "상담 전환 유도 중심, 공감형 톤",
    brand: "브랜드 무드와 감성 중심의 톤",
  }

  const sectionName = SECTION_NAME_MAP[sectionType] ?? sectionType

  const lines: string[] = []
  lines.push(`시술명: ${treatment.name} (${treatment.category})`)
  if (treatment.oneLinePitch) lines.push(`한줄설명: ${treatment.oneLinePitch}`)
  if (treatment.shortDescription) lines.push(`소개: ${treatment.shortDescription}`)
  if (treatment.longDescription) lines.push(`상세: ${treatment.longDescription}`)
  if (treatment.landingHeadline) lines.push(`헤드라인: ${treatment.landingHeadline}`)
  if (treatment.differentiationCopy) lines.push(`차별화문구: ${treatment.differentiationCopy}`)
  if (treatment.durationMinutes) lines.push(`소요시간: ${treatment.durationMinutes}분`)
  if (treatment.painLevel) lines.push(`통증: ${treatment.painLevel}`)
  if (treatment.downtimeNote) lines.push(`회복: ${treatment.downtimeNote}`)
  if (treatment.useConsultInquiry) {
    lines.push(`가격: 상담 문의`)
  } else {
    if (treatment.priceEvent) lines.push(`이벤트가: ${treatment.priceEvent.toLocaleString()}원`)
    else if (treatment.priceRegular) lines.push(`정가: ${treatment.priceRegular.toLocaleString()}원`)
  }
  if (benefits.length) lines.push(`효과: ${benefits.join(", ")}`)
  if (targets.length) lines.push(`추천대상: ${targets.join(", ")}`)
  if (concernAreas.length) lines.push(`고민부위: ${concernAreas.join(", ")}`)
  if (specialtyPoints.length) lines.push(`특화포인트: ${specialtyPoints.join(", ")}`)

  if (programs.length) {
    lines.push(`\n프로그램:`)
    programs.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.name}${p.targetArea ? ` (${p.targetArea})` : ""}${p.description ? ` - ${p.description}` : ""}`)
      if (p.priceDiscount) lines.push(`   할인가: ${p.priceDiscount.toLocaleString()}원`)
      else if (p.priceRegular) lines.push(`   정가: ${p.priceRegular.toLocaleString()}원`)
    })
  }

  const relevantPrec = precautions.filter(p => ["before", "after", "contraindication"].includes(p.type))
  if (relevantPrec.length) {
    lines.push(`\n주의사항: ${relevantPrec.map(p => p.content).join(" / ")}`)
  }

  if (connectedEquipment.length) {
    lines.push(`\n연결장비: ${connectedEquipment.map(e => `${e.name}${e.oneLinePitch ? ` - ${e.oneLinePitch}` : ""}`).join(", ")}`)
  }
  if (connectedDoctors.length) {
    lines.push(`연결의료진: ${connectedDoctors.map(d => `${d.name}${d.title ? ` (${d.title})` : ""}${d.specialties?.length ? " - " + d.specialties.join(", ") : ""}`).join(", ")}`)
  }
  if (connectedFaqs.length) {
    lines.push(`\nFAQ: ${connectedFaqs.map(f => `Q. ${f.question}`).join(" | ")}`)
  }

  const existingNote = existingContent
    ? `\n현재 섹션 내용 (참고용):\n제목: ${existingContent.title ?? "(없음)"}\n서브: ${existingContent.subtitle ?? "(없음)"}\n본문: ${existingContent.body ?? "(없음)"}`
    : ""

  const instructionNote = instructions ? `\n특별 지시사항: ${instructions}` : ""

  const metadataHint = sectionType === "feature_grid"
    ? `\n"metadata"에는 아래 형식의 features 배열을 포함하세요:\n{"features": [{"icon": "아이콘이름", "title": "특징제목", "desc": "설명"}]}`
    : sectionType === "faq_block"
    ? `\n"metadata"에는 아래 형식의 faqs 배열을 포함하세요:\n{"faqs": [{"q": "질문", "a": "답변"}]}`
    : sectionType === "differentiation_cards"
    ? `\n"metadata"에는 아래 형식의 cards 배열을 포함하세요:\n{"cards": [{"title": "제목", "desc": "설명", "icon": "아이콘"}]}`
    : sectionType === "treatment_process"
    ? `\n"metadata"에는 아래 형식의 steps 배열을 포함하세요:\n{"steps": [{"step": 1, "title": "단계", "desc": "설명"}]}`
    : ""

  return `한국 의료 피부과 랜딩페이지 섹션 재생성 전문가입니다.
아래 CMS 데이터를 바탕으로 "${sectionName}" (${sectionType}) 섹션 하나를 재생성하세요.

규칙:
- 톤: ${toneMap[tone]}
- 없는 정보는 절대 지어내지 마세요
- 의학적 효능을 과장하거나 단정하지 마세요
- 한국어로 작성하세요
- 의료광고 가이드라인 준수 (확정적 효과 표현 금지)
${metadataHint}

=== CMS 데이터 ===
${lines.join("\n")}
${existingNote}
${instructionNote}

아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "section_type": "${sectionType}",
  "title": "...",
  "subtitle": "...",
  "body": "...",
  "style_variant": "default",
  "metadata": {}
}`
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === "your_api_key_here") {
      return NextResponse.json(
        { success: false, error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      )
    }

    const body = (await req.json()) as AiRegenerateSectionRequest
    const prompt = buildSectionPrompt(body)

    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    })

    const responseText = message.content.find(b => b.type === "text")?.text ?? ""

    let section: AiRegenerateSectionResponse["section"]
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("JSON not found")
      section = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json(
        { success: false, error: "AI 응답 파싱 실패", raw: responseText },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, section })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
