import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic()

// ─── Types ────────────────────────────────────────────────────────────────────

export type LandingSectionType =
  | "hero_price_cta" | "treatment_intro" | "effects_progress"
  | "treatment_advantages" | "treatment_precautions" | "why_tatoa"
  | "pricing_program_offer" | "faq_block" | "final_cta"
  | "optional_gallery" | "optional_doctor_highlight" | "optional_equipment_highlight"
  | "hero_image" | "hero_video" | "headline_copy" | "intro_text"
  | "feature_grid" | "diagnosis_section" | "treatment_process"
  | "program_pricing_table" | "before_after_gallery" | "quote_block"
  | "treatment_area_visual" | "doctor_recommendation" | "equipment_highlight"
  | "differentiation_cards" | "clinic_info_block" | "map_block" | "cta_block"
  | "image_text_split" | "fullwidth_image" | "bullet_list" | "notice_block"

export type AIExtractionSource = "internal_data" | "uploaded_material" | "web_search" | "equipment_data"

export type DraftSectionRequest = {
  sectionType: LandingSectionType
  treatmentName: string
  treatmentCategory: string
  // Relevant extraction items for this section (already filtered by caller)
  extractionItems: Array<{
    category: string
    content: string
    source: AIExtractionSource
    confidence: string
    sourceRef?: string
  }>
  // Fact fields that should be used verbatim (not AI-generated)
  factData: {
    priceText?: string
    durationMinutes?: number
    anesthesiaRequired?: boolean
    downtimeNote?: string
    ctaPrimaryLabel?: string
    ctaSecondaryLabel?: string
    bookingUrl?: string
    programs?: Array<{ name: string; priceDiscount?: number; priceRegular?: number }>
  }
  // Existing draft to improve (optional — for "regenerate" use case)
  existingDraft?: {
    title?: string
    subtitle?: string
    body?: string
  }
  // How many alternative drafts to generate (1–3)
  draftCount: number
  tone: "premium" | "medical_info" | "consult_conversion" | "brand"
}

export type GeneratedDraft = {
  draftIndex: number
  title?: string
  subtitle?: string
  body?: string
  metadata?: Record<string, unknown>
  sources: AIExtractionSource[]
  warnings: string[]
}

export type DraftSectionResponse = {
  success: boolean
  sectionType: LandingSectionType
  drafts: GeneratedDraft[]
  error?: string
}

// ─── Section-specific prompt instructions ─────────────────────────────────────

const SECTION_INSTRUCTIONS: Partial<Record<LandingSectionType, string>> = {
  hero_price_cta: `
히어로 섹션입니다. 아래를 생성하세요:
- title: 시술명 기반 강렬한 헤드라인 (10~20자, 효과/감성 중심)
- subtitle: 후킹 카피 1~2문장 (고객 공감, 의료광고 준수)
- body: 핵심 어필 요약 1~2문장
가격/CTA/링크는 factData에서 그대로 metadata에 포함하세요. 절대 지어내지 마세요.`,
  treatment_intro: `
시술 전반 소개 섹션입니다.
- title: 섹션 제목 (예: "이 시술이 필요한 이유")
- subtitle: 핵심 포지셔닝 1문장
- body: 시술 소개 본문 150~250자. 효과/특징 중심, 의료광고 가이드 준수.`,
  effects_progress: `
시술 효과와 일반 경과 섹션입니다.
- title: 섹션 제목
- subtitle: 핵심 효과 요약 1문장
- body: 기대 효과와 일반적인 경과를 나누어 서술 (150~300자)
metadata.effectPoints: 핵심 효과 포인트 배열 (3~5개)
metadata.progressTimeline: 경과 단계 배열 (예: ["당일", "1주일", "1개월"])`,
  treatment_advantages: `
시술 장점 카드 섹션입니다.
- title: 섹션 제목
- body: 리드 문장
metadata.advantageCards: 장점 카드 배열 [{title, description}] (3~5개)`,
  treatment_precautions: `
주의사항 섹션입니다.
- title: "시술 전·후 주의사항" 등
- body: 안내 문구
precautions는 factData에서 가져오세요. 추가로 지어내지 마세요.`,
  why_tatoa: `
"왜 타토아인가" 섹션입니다.
- title: 강렬한 차별화 헤드라인
- subtitle: 타토아만의 포지셔닝 1문장
- body: 타토아의 차별점/철학 설명 (150~250자)
metadata.reasonCards: 이유 카드 배열 [{title, description}] (3~4개)`,
  pricing_program_offer: `
프로그램 및 가격 섹션입니다.
- title: 섹션 제목
- subtitle: 리드 문구
프로그램/가격은 factData에서 그대로 가져오세요. 절대 지어내지 마세요.`,
  faq_block: `
FAQ 섹션입니다.
- title: "자주 묻는 질문"
metadata.faqs: FAQ 배열 [{question, answer}] (4~6개)
extractionItems의 faq 카테고리를 우선 사용하고 부족하면 자연스럽게 보완하세요.`,
  final_cta: `
마지막 CTA 섹션입니다.
- title: 행동 유도 헤드라인 (짧고 강렬하게)
- subtitle: 부가 메시지
CTA 버튼 라벨/URL은 factData에서 그대로 사용하세요.`,
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildDraftPrompt(req: DraftSectionRequest): string {
  const instructions = SECTION_INSTRUCTIONS[req.sectionType] ?? `
섹션 타입: ${req.sectionType}
- title, subtitle, body를 자연스럽게 생성하세요.`

  const toneMap = {
    premium: "고급스럽고 신뢰감 있는 의료 프리미엄 톤",
    medical_info: "의료 정보 중심, 전문적이고 설명적인 톤",
    consult_conversion: "상담 전환 유도 중심, 공감형 CTA가 강한 톤",
    brand: "브랜드 무드와 감성 중심, 차별화된 아이덴티티 표현",
  }

  const extractionContext = req.extractionItems.length > 0
    ? `\n=== 추출된 콘텐츠 후보 ===\n${req.extractionItems.map((e, i) =>
      `[${i + 1}] 카테고리:${e.category} 출처:${e.source} 신뢰도:${e.confidence}\n${e.content}`
    ).join("\n\n")}`
    : "\n※ 추출된 콘텐츠 후보가 없습니다. 팩트 데이터만 사용하세요."

  const factContext = Object.keys(req.factData).length > 0
    ? `\n=== 팩트 데이터 (절대 변경 금지) ===\n${JSON.stringify(req.factData, null, 2)}`
    : ""

  const existingContext = req.existingDraft
    ? `\n=== 기존 초안 (개선 참고) ===\ntitle: ${req.existingDraft.title ?? ""}\nsubtitle: ${req.existingDraft.subtitle ?? ""}\nbody: ${req.existingDraft.body ?? ""}`
    : ""

  return `당신은 한국 의료 피부과 랜딩페이지 섹션 초안 작성 전문가입니다.

시술명: ${req.treatmentName} (${req.treatmentCategory})
섹션 타입: ${req.sectionType}
톤: ${toneMap[req.tone]}
생성할 초안 수: ${req.draftCount}개

섹션별 가이드:
${instructions}
${extractionContext}
${factContext}
${existingContext}

=== 규칙 ===
- 의학적 효능 과장/확정 표현 금지 (의료광고 가이드라인)
- 팩트 데이터(가격/링크/주의사항)는 그대로 사용, 절대 변경 금지
- web_search 출처 항목은 내부 데이터와 충돌 시 warnings에 표기
- 한국어로 작성, 모바일 가독성 고려
- ${req.draftCount}개의 서로 다른 버전 생성 (톤/각도/강조점 다르게)

다음 JSON 형식으로만 응답하세요:
{
  "drafts": [
    {
      "draftIndex": 1,
      "title": "...",
      "subtitle": "...",
      "body": "...",
      "metadata": {},
      "sources": ["internal_data"],
      "warnings": []
    }
  ]
}`
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === "your_api_key_here") {
      return NextResponse.json(
        { success: false, error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      )
    }

    const body = (await req.json()) as DraftSectionRequest

    const prompt = buildDraftPrompt(body)

    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    })

    const responseText = message.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("")

    let parsed: { drafts: GeneratedDraft[] }
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("JSON not found in response")
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json(
        { success: false, error: "AI 응답 파싱 실패", raw: responseText },
        { status: 500 }
      )
    }

    const response: DraftSectionResponse = {
      success: true,
      sectionType: body.sectionType,
      drafts: parsed.drafts ?? [],
    }

    return NextResponse.json(response)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    )
  }
}
