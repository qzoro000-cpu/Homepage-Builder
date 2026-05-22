import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic()

// ─── Google Custom Search ─────────────────────────────────────────────────────

type GoogleSearchItem = {
  title: string
  snippet: string
  link: string
  displayLink: string
}

async function fetchGoogleSearchResults(
  queries: string[],
  apiKey: string,
  cx: string
): Promise<{ query: string; results: GoogleSearchItem[] }[]> {
  const searchResults: { query: string; results: GoogleSearchItem[] }[] = []

  for (const query of queries.slice(0, 3)) {   // max 3 queries to limit quota
    try {
      const url = new URL("https://www.googleapis.com/customsearch/v1")
      url.searchParams.set("key", apiKey)
      url.searchParams.set("cx", cx)
      url.searchParams.set("q", `${query} 시술 효과 주의사항`)
      url.searchParams.set("num", "5")
      url.searchParams.set("lr", "lang_ko")

      const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
      if (!res.ok) continue

      const data = await res.json() as { items?: GoogleSearchItem[] }
      searchResults.push({
        query,
        results: (data.items ?? []).map((item) => ({
          title: item.title,
          snippet: item.snippet,
          link: item.link,
          displayLink: item.displayLink,
        })),
      })
    } catch {
      // Skip failed queries silently
    }
  }

  return searchResults
}

function formatSearchResultsForPrompt(
  searchResults: { query: string; results: GoogleSearchItem[] }[]
): string {
  if (searchResults.length === 0) return ""

  const lines: string[] = ["\n=== 웹 검색 보강 결과 ==="]
  lines.push("⚠️ 아래는 웹 검색 결과입니다. 내부 자료와 충돌하면 반드시 conflictWarning을 표시하고, confidence는 'low' 또는 'medium'으로 설정하세요.")
  lines.push("내부 팩트 데이터(가격, 주의사항, 프로그램)와 다른 정보가 있으면 절대 자동 적용하지 마세요.\n")

  for (const { query, results } of searchResults) {
    lines.push(`[검색어: "${query}"]`)
    for (const r of results) {
      lines.push(`• ${r.title} (${r.displayLink})`)
      lines.push(`  ${r.snippet}`)
    }
  }

  return lines.join("\n")
}

// ─── Request/Response Types ───────────────────────────────────────────────────

export type AIExtractionCategory =
  | "treatment_intro" | "hook_copy" | "effect" | "progress"
  | "advantage" | "precaution" | "target_audience" | "contraindication"
  | "faq" | "why_tatoa" | "program_price" | "image_suggestion"
  | "data_warning" | "review_warning"

export type AIExtractionSource = "internal_data" | "uploaded_material" | "web_search" | "equipment_data"

export type AIConfidenceLevel = "high" | "medium" | "low" | "conflict"

export type ExtractedItem = {
  category: AIExtractionCategory
  content: string
  source: AIExtractionSource
  confidence: AIConfidenceLevel
  sourceRef?: string
  conflictWarning?: string
  usedInLanding: boolean
  usedInChatbot: boolean
  usedInDescription: boolean
  sortOrder: number
}

export type AIExtractRequest = {
  treatment: {
    name: string
    category: string
    subcategory?: string
    oneLinePitch?: string
    shortDescription?: string
    longDescription?: string
    hookCopy?: string
    differentiationCopy?: string
    whyTatoaHeadline?: string
    whyTatoaSummary?: string
    whyTatoaPhilosophy?: string
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
    landingHeroPriceText?: string
  }
  benefits: string[]
  targets: string[]
  concernAreas: string[]
  keywords: string[]
  specialtyPoints: string[]
  effectCards: Array<{ title: string; description?: string; icon?: string }>
  whyTatoaCards: Array<{ title: string; description?: string }>
  programs: Array<{ name: string; targetArea?: string; description?: string; priceRegular?: number; priceDiscount?: number; durationMinutes?: number }>
  precautions: Array<{ type: string; content: string }>
  sourceMaterials: Array<{
    category: string
    title?: string
    content?: string
    fileName?: string
    fileType?: string
    isPublic: boolean
  }>
  connectedEquipment: Array<{ name: string; category?: string; oneLinePitch?: string; energyType?: string; benefits?: string[] }>
  connectedFaqs: Array<{ question: string; answer?: string }>
  includeWebSearch: boolean
  webSearchTerms?: string[]   // treatment name, equipment names etc.
}

export type AIExtractResponse = {
  success: boolean
  runId: string
  items: ExtractedItem[]
  warnings: string[]
  sourcesUsed: AIExtractionSource[]
  webSearchQueries?: string[]
  error?: string
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildExtractionPrompt(
  req: AIExtractRequest,
  webSearchContext?: string
): string {
  const lines: string[] = []

  lines.push("=== 시술 기본 팩트 데이터 ===")
  lines.push(`시술명: ${req.treatment.name}`)
  lines.push(`카테고리: ${req.treatment.category}${req.treatment.subcategory ? ` / ${req.treatment.subcategory}` : ""}`)
  if (req.treatment.oneLinePitch) lines.push(`한줄소개: ${req.treatment.oneLinePitch}`)
  if (req.treatment.shortDescription) lines.push(`짧은설명: ${req.treatment.shortDescription}`)
  if (req.treatment.longDescription) lines.push(`상세설명: ${req.treatment.longDescription}`)
  if (req.treatment.hookCopy) lines.push(`후킹카피(기존): ${req.treatment.hookCopy}`)
  if (req.treatment.differentiationCopy) lines.push(`차별화문구: ${req.treatment.differentiationCopy}`)
  if (req.treatment.whyTatoaHeadline) lines.push(`왜타토아헤드라인: ${req.treatment.whyTatoaHeadline}`)
  if (req.treatment.whyTatoaSummary) lines.push(`왜타토아요약: ${req.treatment.whyTatoaSummary}`)
  if (req.treatment.whyTatoaPhilosophy) lines.push(`시술철학: ${req.treatment.whyTatoaPhilosophy}`)
  if (req.treatment.durationMinutes) lines.push(`소요시간: ${req.treatment.durationMinutes}분`)
  if (req.treatment.anesthesiaRequired !== undefined) lines.push(`마취: ${req.treatment.anesthesiaRequired ? "필요" : "불필요"}`)
  if (req.treatment.painLevel) lines.push(`통증정도: ${req.treatment.painLevel}`)
  if (req.treatment.downtimeNote) lines.push(`다운타임: ${req.treatment.downtimeNote}`)
  if (req.treatment.treatmentCycleGuide) lines.push(`시술주기: ${req.treatment.treatmentCycleGuide}`)
  if (req.treatment.maintenancePeriod) lines.push(`유지기간: ${req.treatment.maintenancePeriod}`)
  if (req.treatment.useConsultInquiry) lines.push(`가격: 상담 문의`)
  else {
    if (req.treatment.priceEvent) lines.push(`이벤트가: ${req.treatment.priceEvent.toLocaleString()}원${req.treatment.vatIncluded ? " (VAT포함)" : ""}`)
    else if (req.treatment.priceRegular) lines.push(`정가: ${req.treatment.priceRegular.toLocaleString()}원`)
    if (req.treatment.landingHeroPriceText) lines.push(`가격표기텍스트: ${req.treatment.landingHeroPriceText}`)
  }
  if (req.benefits.length) lines.push(`효과태그: ${req.benefits.join(", ")}`)
  if (req.targets.length) lines.push(`추천대상: ${req.targets.join(", ")}`)
  if (req.concernAreas.length) lines.push(`고민부위: ${req.concernAreas.join(", ")}`)
  if (req.specialtyPoints.length) lines.push(`특화포인트: ${req.specialtyPoints.join(", ")}`)
  if (req.keywords.length) lines.push(`SEO키워드: ${req.keywords.join(", ")}`)

  if (req.effectCards.length) {
    lines.push("\n=== 효과 카드 (기 등록) ===")
    req.effectCards.forEach((c, i) => lines.push(`${i + 1}. ${c.icon ?? ""} ${c.title}${c.description ? ` — ${c.description}` : ""}`))
  }

  if (req.whyTatoaCards.length) {
    lines.push("\n=== Why Tatoa 카드 (기 등록) ===")
    req.whyTatoaCards.forEach((c, i) => lines.push(`${i + 1}. ${c.title}${c.description ? ` — ${c.description}` : ""}`))
  }

  if (req.programs.length) {
    lines.push("\n=== 프로그램 구성 ===")
    req.programs.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.name}${p.targetArea ? ` (${p.targetArea})` : ""}`)
      if (p.description) lines.push(`   설명: ${p.description}`)
      if (p.priceDiscount) lines.push(`   할인가: ${p.priceDiscount.toLocaleString()}원`)
      else if (p.priceRegular) lines.push(`   정가: ${p.priceRegular.toLocaleString()}원`)
      if (p.durationMinutes) lines.push(`   소요: ${p.durationMinutes}분`)
    })
  }

  const beforePrec = req.precautions.filter(p => p.type === "before")
  const afterPrec = req.precautions.filter(p => p.type === "after")
  const contraPrec = req.precautions.filter(p => p.type === "contraindication")
  if (beforePrec.length) lines.push(`\n시술전주의: ${beforePrec.map(p => p.content).join(" / ")}`)
  if (afterPrec.length) lines.push(`시술후주의: ${afterPrec.map(p => p.content).join(" / ")}`)
  if (contraPrec.length) lines.push(`금기사항: ${contraPrec.map(p => p.content).join(" / ")}`)

  if (req.connectedEquipment.length) {
    lines.push("\n=== 연결 장비 ===")
    req.connectedEquipment.forEach(eq => {
      lines.push(`장비명: ${eq.name}${eq.category ? ` (${eq.category})` : ""}`)
      if (eq.oneLinePitch) lines.push(`  설명: ${eq.oneLinePitch}`)
      if (eq.energyType) lines.push(`  에너지: ${eq.energyType}`)
      if (eq.benefits?.length) lines.push(`  효과: ${eq.benefits.join(", ")}`)
    })
  }

  if (req.connectedFaqs.length) {
    lines.push("\n=== 연결 FAQ ===")
    req.connectedFaqs.slice(0, 8).forEach((f, i) => {
      lines.push(`Q${i + 1}: ${f.question}`)
      if (f.answer) lines.push(`A: ${f.answer}`)
    })
  }

  // Source materials (text-only — files are described by metadata)
  const textMaterials = req.sourceMaterials.filter(m => m.content && m.content.trim().length > 0)
  if (textMaterials.length) {
    lines.push("\n=== 업로드된 원천 자료 (텍스트) ===")
    textMaterials.forEach((m, i) => {
      lines.push(`[자료 ${i + 1}] 유형:${m.category} 제목:${m.title ?? "제목없음"} 공개:${m.isPublic ? "공개용" : "내부참고"}`)
      lines.push(m.content!.slice(0, 600))  // limit per material
      if (m.content!.length > 600) lines.push("...(이하 생략)")
    })
  }

  const fileMaterials = req.sourceMaterials.filter(m => m.fileName && !m.content)
  if (fileMaterials.length) {
    lines.push("\n=== 업로드된 파일 목록 (내용 미파싱) ===")
    fileMaterials.forEach((m) => {
      lines.push(`- ${m.category}: ${m.fileName} (${m.fileType})`)
    })
    lines.push("※ 파일 내용은 별도 파싱이 필요합니다. 파일명/유형만 참조하세요.")
  }

  // Use actual web search results if provided, otherwise just a note
  const webSearchNote = webSearchContext
    ? webSearchContext
    : req.includeWebSearch
      ? `\n=== 웹 검색 보강 ===\n검색 키워드: ${(req.webSearchTerms ?? [req.treatment.name]).join(", ")}\n(검색 API 미설정 — 키워드만 참고하여 일반적인 의료 정보 보강 가능)\n※ 내부 자료와 충돌하면 반드시 conflict 경고를 표시하세요.`
      : ""

  return `당신은 한국 의료 피부과 랜딩페이지 제작을 위한 AI 콘텐츠 추출 전문가입니다.

아래 시술 데이터와 원천 자료를 분석하여, 랜딩페이지 제작에 필요한 핵심 정보를 카테고리별로 추출하세요.
${webSearchNote}

=== 데이터 ===
${lines.join("\n")}

=== 추출 규칙 ===
1. 내부 팩트 데이터(가격, 소요시간, 주의사항, 프로그램) 우선 — 웹 정보와 충돌 시 conflict 표시
2. 의학적 효능 과장 금지 — "확실히", "반드시", "100%" 등 확정적 표현 경고(review_warning)
3. 출처가 업로드 자료면 source: "uploaded_material", 내부 CMS면 "internal_data", 장비면 "equipment_data"
4. 웹 검색 보강이면 source: "web_search", confidence: "low" 또는 "medium"
5. 자료가 부족한 카테고리는 data_warning 항목으로 명시
6. 한국어로 작성, 공개용(landing) 문구는 의료광고 가이드라인 준수
7. 각 카테고리당 최소 1개, 최대 4개 항목 추출
8. hook_copy: 1~2문장, 강한 어필, 고객 공감 유도
9. treatment_intro: 시술 전반 설명, 200자 이내
10. effect/advantage: 간결한 포인트형 문장
11. why_tatoa: 타토아만의 차별점, 직접적이고 구체적으로

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "items": [
    {
      "category": "카테고리",
      "content": "추출된 내용",
      "source": "소스유형",
      "confidence": "신뢰도",
      "sourceRef": "출처 필드명/파일명",
      "conflictWarning": "충돌 내용 (없으면 null)",
      "usedInLanding": true,
      "usedInChatbot": false,
      "usedInDescription": false,
      "sortOrder": 0
    }
  ],
  "warnings": ["경고 메시지들"],
  "sourcesUsed": ["internal_data"],
  "webSearchQueries": []
}`
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey || anthropicKey === "your_anthropic_key_here") {
      return NextResponse.json(
        { success: false, error: "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local을 확인하세요." },
        { status: 500 }
      )
    }

    const body = (await req.json()) as AIExtractRequest

    // ── Google Custom Search (optional) ──────────────────────────────────────
    let webSearchContext: string | undefined
    const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY
    const googleCx = process.env.GOOGLE_SEARCH_ENGINE_ID

    if (body.includeWebSearch && googleApiKey && googleApiKey !== "your_google_api_key_here" && googleCx && googleCx !== "your_search_engine_id_here") {
      const queries = body.webSearchTerms ?? [body.treatment.name]
      const searchResults = await fetchGoogleSearchResults(queries, googleApiKey, googleCx)
      if (searchResults.length > 0) {
        webSearchContext = formatSearchResultsForPrompt(searchResults)
      }
    }

    const prompt = buildExtractionPrompt(body, webSearchContext)

    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    })

    // Extract text from response (skip thinking blocks)
    const responseText = message.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("")

    let parsed: { items: ExtractedItem[]; warnings: string[]; sourcesUsed: AIExtractionSource[]; webSearchQueries?: string[] }
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

    const runId = `run_${Date.now()}`

    const response: AIExtractResponse = {
      success: true,
      runId,
      items: parsed.items ?? [],
      warnings: parsed.warnings ?? [],
      sourcesUsed: parsed.sourcesUsed ?? ["internal_data"],
      webSearchQueries: parsed.webSearchQueries,
    }

    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
