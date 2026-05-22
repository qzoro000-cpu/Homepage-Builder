"use client"

import React, { useState, useEffect, createContext, useContext } from "react"
import { OD, val, FONTS } from "@/components/site/sections/booking-preview"
import type { FieldValue } from "@/components/site/sections/booking-preview"
import {
  Shield, Calendar, Sparkles, Gift, Cake, Utensils, Shirt,
  GraduationCap, Users, Heart, Award, Clock, Coffee, BookOpen,
  DollarSign, Smile, Plane, MapPin, Briefcase, Star,
  type LucideIcon,
} from "lucide-react"

// ─── Recruit 헬퍼 (5/15 19-G-4-c) ──────────────────────────────────────────
// 사이즈 4종 카테고리:
// - Eyebrow: 작은 영문 (11~19px)
// - Hero: 헤더 메인 타이틀 (28~72px)
// - Section: 각 섹션 헤드라인 (20~40px)
// - Body: 본문 / 서브타이틀 (13~21px)

const RECRUIT_EYEBROW_PX: Record<string, number> = { xs: 11, s: 13, m: 15, l: 17, xl: 19 }
const RECRUIT_HERO_PX:    Record<string, number> = { xs: 28, s: 36, m: 44, l: 56, xl: 72 }
const RECRUIT_SECTION_PX: Record<string, number> = { xs: 20, s: 24, m: 28, l: 34, xl: 40 }
const RECRUIT_BODY_PX:    Record<string, number> = { xs: 13, s: 15, m: 17, l: 19, xl: 21 }

export function getRecruitEyebrowPx(key: string): number { return RECRUIT_EYEBROW_PX[key] ?? 11 }
export function getRecruitHeroPx(key: string):    number { return RECRUIT_HERO_PX[key] ?? 56 }
export function getRecruitSectionPx(key: string): number { return RECRUIT_SECTION_PX[key] ?? 28 }
export function getRecruitBodyPx(key: string):    number { return RECRUIT_BODY_PX[key] ?? 15 }

// 폰트: booking FONTS 재사용 (sans / serif / classic / mono)
export function getRecruitFontCss(key: string): string {
  const font = FONTS.find((f) => f.key === key)
  return font?.css ?? FONTS[0].css
}

// 19-G-4-f: 복지 아이콘 화이트리스트 (어드민 셀렉터에서도 사용)
export const RECRUIT_ICON_MAP: Record<string, LucideIcon> = {
  Shield, Calendar, Sparkles, Gift, Cake, Utensils, Shirt,
  GraduationCap, Users, Heart, Award, Clock, Coffee, BookOpen,
  DollarSign, Smile, Plane, MapPin, Briefcase, Star,
}

export function getRecruitIcon(name: string): LucideIcon {
  return RECRUIT_ICON_MAP[name] || Shield
}

export type PreviewRecruitProps = {
  values: Record<string, FieldValue>
  branchName: string
  forceNarrow?: boolean
}

export const RECRUIT_DEFAULT_VALUES: Record<string, FieldValue> = {
  // Header (섹션 1)
  rcEyebrow: "TATOA CLINIC",
  rcEyebrowSize: "xs",
  rcEyebrowColor: "#c9a85c",
  rcTitle: "상시 채용",
  rcTitleSize: "lg",
  rcTitleWeight: "700",
  rcTitleColor: "#ffffff",
  rcSubtitle: "함께 성장하는 타토아",
  rcSubtitleSize: "sm",
  rcSubtitleColor: "rgba(255,255,255,0.7)",
  rcEyebrowFont: "sans",
  rcEyebrowWeight: "500",
  rcTitleFont: "sans",
  rcSubtitleFont: "sans",
  rcSubtitleWeight: "400",
  rcHeaderBgType: "color",
  rcHeaderBgColor: "#0e0c09",
  rcHeaderBgGradient: "linear-gradient(135deg, #0e0c09 0%, #2a2520 100%)",
  rcHeaderBgImage: "",

  // Intro (섹션 2)
  rcIntroImage: "",
  rcIntroHeadline: "당신의 성장을 응원하고 함께 합니다.",
  rcIntroHeadlineSize: "lg",
  rcIntroHeadlineColor: "#1a1a1a",
  rcIntroBody: "안녕하세요. 타토아입니다. 함께 성장해 나갈 인재를 모집합니다.",
  rcIntroBodySize: "sm",
  rcIntroBodyColor: "rgba(26,26,26,0.7)",
  rcIntroHeadlineFont: "sans",
  rcIntroHeadlineWeight: "700",
  rcIntroBodyFont: "sans",
  rcIntroBodyWeight: "400",

  // Talents (섹션 3) — 인재상 4개
  rcTalentsEyebrow: "REMEET CLINIC",
  rcTalentsTitle: "우리가 함께 하고싶은 인재상",
  rcTalentsTitleSize: "l",
  rcTalentsTitleColor: "#1a1a1a",
  rcTalent1: "설득보다 설명을 중요하게 생각하는 분",
  rcTalent2: "매출보다 고객 신뢰를 우선하는 분",
  rcTalent3: "다시 찾는 이유를 만들고 싶은 분",
  rcTalent4: "고객의 시각에서 문제를 이해하고 해결할 줄 아는 분",
  rcTalentTextSize: "m",
  rcTalentTextColor: "#1a1a1a",
  rcTalentNumberSize: "m",
  rcTalentNumberColor: "#c9a85c",
  rcTalentsTitleFont: "sans",
  rcTalentsTitleWeight: "700",
  rcTalentTextFont: "sans",
  rcTalentTextWeight: "500",
  rcTalentNumberFont: "sans",
  rcTalentNumberWeight: "600",

  // Positions (섹션 4) — 19-G-4-d
  rcPositionsEyebrow: "POSITIONS",
  rcPositionsEyebrowSize: "sm",
  rcPositionsEyebrowColor: "#c9a961",
  rcPositionsTitle: "함께할 직군",
  rcPositionsTitleSize: "xl",
  rcPositionsTitleColor: "#1a1a1a",

  rcPosition1Image: "",
  rcPosition1Title: "간호조무사",
  rcPosition1Body: "환자 케어와 진료 보조, 시술 어시스트 업무를 담당합니다.",
  rcPosition2Image: "",
  rcPosition2Title: "코디네이터",
  rcPosition2Body: "고객 상담과 예약, 시술 안내까지 병원 전반의 흐름을 책임집니다.",
  rcPosition3Image: "",
  rcPosition3Title: "상담실장",
  rcPosition3Body: "맞춤 상담과 시술 큐레이션으로 고객의 만족을 이끌어냅니다.",

  rcPositionCardTitleSize: "lg",
  rcPositionCardTitleColor: "#1a1a1a",
  rcPositionCardBodySize: "sm",
  rcPositionCardBodyColor: "#666666",
  rcPositionsEyebrowFont: "sans",
  rcPositionsEyebrowWeight: "400",
  rcPositionsTitleFont: "sans",
  rcPositionsTitleWeight: "600",
  rcPositionCardTitleFont: "sans",
  rcPositionCardTitleWeight: "600",
  rcPositionCardBodyFont: "sans",
  rcPositionCardBodyWeight: "400",

  // Banner (섹션 5) — 19-G-4-e
  rcBannerImage: "",
  rcBannerOverlay: 40,
  rcBannerHeadline: "당신의 성장이 곧 우리의 성장",
  rcBannerHeadlineSize: "xl",
  rcBannerHeadlineColor: "#ffffff",
  rcBannerSubtext: "지금, 새로운 도전을 시작하세요.",
  rcBannerSubtextSize: "md",
  rcBannerSubtextColor: "#e0e0e0",
  rcBannerHeadlineFont: "sans",
  rcBannerHeadlineWeight: "600",
  rcBannerSubtextFont: "sans",
  rcBannerSubtextWeight: "400",

  // Welfare (섹션 6) — 19-G-4-f
  rcWelfareEyebrow: "BENEFITS",
  rcWelfareEyebrowSize: "sm",
  rcWelfareEyebrowColor: "#c9a961",
  rcWelfareTitle: "구성원을 위한 복지",
  rcWelfareTitleSize: "xl",
  rcWelfareTitleColor: "#1a1a1a",

  rcWelfare1Icon: "Shield",
  rcWelfare1Title: "4대보험·퇴직금",
  rcWelfare1Body: "안정적인 근무 환경을 위한 기본 보장",
  rcWelfare2Icon: "Calendar",
  rcWelfare2Title: "연차·반차 자유 사용",
  rcWelfare2Body: "필요할 때 자유롭게 쉴 수 있어요",
  rcWelfare3Icon: "Sparkles",
  rcWelfare3Title: "시술 직원할인",
  rcWelfare3Body: "타토아의 시술을 합리적인 가격에",
  rcWelfare4Icon: "Gift",
  rcWelfare4Title: "명절 상여금",
  rcWelfare4Body: "설·추석 명절마다 상여금 지급",
  rcWelfare5Icon: "Cake",
  rcWelfare5Title: "생일 축하금",
  rcWelfare5Body: "생일을 맞은 구성원에게 축하금 지급",
  rcWelfare6Icon: "Utensils",
  rcWelfare6Title: "식대 지원",
  rcWelfare6Body: "근무 중 식사는 회사가 책임집니다",
  rcWelfare7Icon: "Shirt",
  rcWelfare7Title: "유니폼 제공",
  rcWelfare7Body: "깔끔한 근무복을 매 시즌 지급",
  rcWelfare8Icon: "GraduationCap",
  rcWelfare8Title: "정기 직무교육",
  rcWelfare8Body: "성장을 위한 교육 기회를 제공합니다",
  rcWelfare9Icon: "Users",
  rcWelfare9Title: "워크샵·회식",
  rcWelfare9Body: "동료와 어울리며 활력을 채우세요",
  rcWelfare10Icon: "Heart",
  rcWelfare10Title: "경조사 휴가·지원금",
  rcWelfare10Body: "기쁜 일도 슬픈 일도 함께합니다",

  rcWelfareCardTitleSize: "md",
  rcWelfareCardTitleColor: "#1a1a1a",
  rcWelfareCardBodySize: "sm",
  rcWelfareCardBodyColor: "#666666",
  rcWelfareIconColor: "#c9a961",
  rcWelfareEyebrowFont: "sans",
  rcWelfareEyebrowWeight: "400",
  rcWelfareTitleFont: "sans",
  rcWelfareTitleWeight: "600",
  rcWelfareCardTitleFont: "sans",
  rcWelfareCardTitleWeight: "600",
  rcWelfareCardBodyFont: "sans",
  rcWelfareCardBodyWeight: "400",

  // Process (섹션 7) — 19-G-4-g
  rcProcessEyebrow: "PROCESS",
  rcProcessEyebrowSize: "sm",
  rcProcessEyebrowColor: "#c9a961",
  rcProcessTitle: "채용 절차",
  rcProcessTitleSize: "xl",
  rcProcessTitleColor: "#1a1a1a",

  rcProcess1Title: "서류 접수",
  rcProcess1Body: "이력서와 자기소개서를 제출해주세요",
  rcProcess2Title: "서류 검토",
  rcProcess2Body: "지원 서류를 면밀히 검토합니다",
  rcProcess3Title: "면접 진행",
  rcProcess3Body: "대표 원장님과 직접 만나뵙는 시간",
  rcProcess4Title: "처우 협의",
  rcProcess4Body: "근무 조건과 처우를 함께 조율합니다",
  rcProcess5Title: "최종 합격",
  rcProcess5Body: "타토아의 새 가족이 되어주세요",

  rcProcessNumberColor: "#c9a961",
  rcProcessStepTitleSize: "md",
  rcProcessStepTitleColor: "#1a1a1a",
  rcProcessStepBodySize: "sm",
  rcProcessStepBodyColor: "#666666",

  rcProcessNotesTitle: "유의사항",
  rcProcessNotesTitleSize: "md",
  rcProcessNotesTitleColor: "#1a1a1a",
  rcProcessNote1: "지원 서류는 반환되지 않습니다.",
  rcProcessNote2: "제출 서류에 허위 사실이 있을 경우 합격이 취소될 수 있습니다.",
  rcProcessNote3: "보훈 대상자 및 장애인은 관련 법령에 따라 우대합니다.",
  rcProcessNote4: "",
  rcProcessNoteBodySize: "sm",
  rcProcessNoteBodyColor: "#666666",
  rcProcessEyebrowFont: "sans",
  rcProcessEyebrowWeight: "400",
  rcProcessTitleFont: "sans",
  rcProcessTitleWeight: "600",
  rcProcessStepTitleFont: "sans",
  rcProcessStepTitleWeight: "600",
  rcProcessStepBodyFont: "sans",
  rcProcessStepBodyWeight: "400",
  rcProcessNotesTitleFont: "sans",
  rcProcessNotesTitleWeight: "600",
  rcProcessNoteBodyFont: "sans",
  rcProcessNoteBodyWeight: "400",

  // CTA (섹션 8) — 19-G-4-h
  rcCtaBgImage: "",
  rcCtaBgColor: "#1a1a1a",
  rcCtaOverlay: 50,
  rcCtaHeadline: "타토아와 함께 성장할 당신을 기다립니다",
  rcCtaHeadlineSize: "xl",
  rcCtaHeadlineColor: "#ffffff",
  rcCtaSubtext: "지금 바로 지원하세요.",
  rcCtaSubtextSize: "md",
  rcCtaSubtextColor: "#e0e0e0",

  rcCtaButton1Text: "지원하기",
  rcCtaButton1Link: "mailto:recruit@tatoa.co.kr",
  rcCtaButton1Bg: "#c9a961",
  rcCtaButton1Color: "#ffffff",

  rcCtaButton2Text: "전화 문의",
  rcCtaButton2Link: "tel:02-1234-5678",
  rcCtaButton2Bg: "transparent",
  rcCtaButton2Color: "#ffffff",
  rcCtaHeadlineFont: "sans",
  rcCtaHeadlineWeight: "600",
  rcCtaSubtextFont: "sans",
  rcCtaSubtextWeight: "400",
}

// 19-G-5-b: container-based narrow 모드 Context
type RecruitCtxValue = { isNarrow: boolean }

const RecruitCtx = createContext<RecruitCtxValue>({ isNarrow: false })

export function useRecruit(): RecruitCtxValue {
  return useContext(RecruitCtx)
}

export function PreviewRecruit({ values, branchName, forceNarrow }: PreviewRecruitProps): React.JSX.Element {
  const [viewportNarrow, setViewportNarrow] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setViewportNarrow(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const isNarrow = forceNarrow !== undefined ? forceNarrow : viewportNarrow

  return (
    <RecruitCtx.Provider value={{ isNarrow }}>
      <div style={{ width: "100%" }}>
        <RecruitHeader values={values} branchName={branchName} />
        <RecruitIntro values={values} />
        <RecruitTalents values={values} />
        <RecruitPositions values={values} />
        <RecruitMidBanner values={values} />
        <RecruitWelfare values={values} />
        <RecruitProcess values={values} />
        <RecruitCta values={values} />
      </div>
    </RecruitCtx.Provider>
  )
}

function RecruitHeader({ values, branchName }: { values: Record<string, FieldValue>; branchName: string }) {
  const { isNarrow } = useRecruit()
  // 사이즈 맵 (booking 패턴 차용)
  const EYEBROW_SIZE_MAP: Record<string, number> = { xs: 11, s: 13, m: 15, l: 17, xl: 19 }
  const TITLE_SIZE_MAP: Record<string, number> = { xs: 28, s: 36, m: 44, l: 56, xl: 72 }
  const SUBTITLE_SIZE_MAP: Record<string, number> = { xs: 13, s: 15, m: 17, l: 19, xl: 21 }

  const eyebrow      = val<string>(values, "rcEyebrow") || "TATOA CLINIC"
  const eyebrowSize  = EYEBROW_SIZE_MAP[val<string>(values, "rcEyebrowSize") || "xs"] ?? 11
  const eyebrowColor = val<string>(values, "rcEyebrowColor") || "#c9a85c"

  const title        = val<string>(values, "rcTitle") || "상시 채용"
  const titleSize    = TITLE_SIZE_MAP[val<string>(values, "rcTitleSize") || "lg"] ?? 56
  const titleWeight  = val<string>(values, "rcTitleWeight") || "700"
  const titleColor   = val<string>(values, "rcTitleColor") || "#ffffff"

  const subtitle      = val<string>(values, "rcSubtitle") || "함께 성장하는 타토아"
  const subtitleSize  = SUBTITLE_SIZE_MAP[val<string>(values, "rcSubtitleSize") || "sm"] ?? 15
  const subtitleColor = val<string>(values, "rcSubtitleColor") || "rgba(255,255,255,0.7)"

  const eyebrowFont    = val<string>(values, "rcEyebrowFont") || "sans"
  const eyebrowWeight  = val<string>(values, "rcEyebrowWeight") || "500"
  const titleFont      = val<string>(values, "rcTitleFont") || "sans"
  const subtitleFont   = val<string>(values, "rcSubtitleFont") || "sans"
  const subtitleWeight = val<string>(values, "rcSubtitleWeight") || "400"

  // 배경 결정
  const bgType     = val<string>(values, "rcHeaderBgType") || "color"
  const bgColor    = val<string>(values, "rcHeaderBgColor") || "#0e0c09"
  const bgGradient = val<string>(values, "rcHeaderBgGradient") || "linear-gradient(135deg, #0e0c09 0%, #2a2520 100%)"
  const bgImage    = val<string>(values, "rcHeaderBgImage") || ""

  let bgStyle: React.CSSProperties = {}
  if (bgType === "image" && bgImage) {
    bgStyle = { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
  } else if (bgType === "gradient") {
    bgStyle = { background: bgGradient }
  } else {
    bgStyle = { background: bgColor }
  }

  return (
    <section style={{
      width: "100%",
      paddingTop: "clamp(60px, 10vw, 120px)",
      paddingBottom: "clamp(60px, 10vw, 120px)",
      ...bgStyle,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        paddingLeft: "clamp(16px, 5vw, 80px)",
        paddingRight: "clamp(16px, 5vw, 80px)",
        textAlign: "center" as const,
      }}>
        <div style={{
          fontSize: eyebrowSize,
          fontFamily: getRecruitFontCss(eyebrowFont),
          color: eyebrowColor,
          letterSpacing: "0.2em",
          fontWeight: Number(eyebrowWeight),
          marginBottom: 16,
        }}>{eyebrow}</div>
        <h1 style={{
          fontSize: titleSize,
          fontFamily: getRecruitFontCss(titleFont),
          color: titleColor,
          fontWeight: Number(titleWeight),
          lineHeight: 1.1,
          margin: "0 0 20px 0",
        }}>{title}</h1>
        <div style={{
          fontSize: subtitleSize,
          fontFamily: getRecruitFontCss(subtitleFont),
          color: subtitleColor,
          fontWeight: Number(subtitleWeight),
          lineHeight: 1.5,
        }}>{subtitle}</div>
      </div>
    </section>
  )
}

function RecruitIntro({ values }: { values: Record<string, FieldValue> }) {
  const { isNarrow } = useRecruit()
  // 사이즈 맵 (RecruitHeader 와 동일 정의 — 향후 19-G-4-c 진행 시 모듈 레벨 끌어올림 결정)
  const HEADLINE_SIZE_MAP: Record<string, number> = { xs: 20, s: 24, m: 28, l: 34, xl: 40 }
  const BODY_SIZE_MAP: Record<string, number> = { xs: 13, s: 15, m: 17, l: 19, xl: 21 }

  const image         = val<string>(values, "rcIntroImage") || ""
  const headline      = val<string>(values, "rcIntroHeadline") || "당신의 성장을 응원하고 함께 합니다."
  const headlineSize  = HEADLINE_SIZE_MAP[val<string>(values, "rcIntroHeadlineSize") || "lg"] ?? 34
  const headlineColor = val<string>(values, "rcIntroHeadlineColor") || "#1a1a1a"
  const body          = val<string>(values, "rcIntroBody") || "안녕하세요. 타토아입니다. 함께 성장해 나갈 인재를 모집합니다."
  const bodySize      = BODY_SIZE_MAP[val<string>(values, "rcIntroBodySize") || "sm"] ?? 15
  const bodyColor     = val<string>(values, "rcIntroBodyColor") || "rgba(26,26,26,0.7)"

  const headlineFont   = val<string>(values, "rcIntroHeadlineFont") || "sans"
  const headlineWeight = val<string>(values, "rcIntroHeadlineWeight") || "700"
  const bodyFont       = val<string>(values, "rcIntroBodyFont") || "sans"
  const bodyWeight     = val<string>(values, "rcIntroBodyWeight") || "400"

  return (
    <section style={{
      width: "100%",
      paddingTop: "clamp(60px, 10vw, 100px)",
      paddingBottom: "clamp(60px, 10vw, 100px)",
      background: "#ffffff",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        paddingLeft: "clamp(16px, 5vw, 80px)",
        paddingRight: "clamp(16px, 5vw, 80px)",
      }}>
        <div style={{
          display: "flex",
          flexDirection: isNarrow ? "column" : "row",
          gap: "clamp(24px, 4vw, 48px)",
          alignItems: "stretch",
        }}>
          {/* 이미지 */}
          <div style={{
            flex: 1,
            minWidth: 0,
            aspectRatio: "4 / 3",
            background: image ? "transparent" : "#e5e5e5",
            backgroundImage: image ? `url(${image})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
            fontSize: 13,
          }}>
            {!image && "이미지를 추가하세요"}
          </div>

          {/* 텍스트 */}
          <div style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 16,
          }}>
            <h2 style={{
              fontSize: headlineSize,
              fontFamily: getRecruitFontCss(headlineFont),
              color: headlineColor,
              fontWeight: Number(headlineWeight),
              lineHeight: 1.3,
              margin: 0,
            }}>{headline}</h2>
            <p style={{
              fontSize: bodySize,
              fontFamily: getRecruitFontCss(bodyFont),
              color: bodyColor,
              fontWeight: Number(bodyWeight),
              lineHeight: 1.7,
              margin: 0,
              whiteSpace: "pre-wrap",
            }}>{body}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function RecruitTalents({ values }: { values: Record<string, FieldValue> }) {
  const { isNarrow } = useRecruit()
  const eyebrow    = val<string>(values, "rcTalentsEyebrow") || "REMEET CLINIC"
  const eyebrowPx  = getRecruitEyebrowPx("xs")
  const title      = val<string>(values, "rcTalentsTitle") || "우리가 함께 하고싶은 인재상"
  const titleSize  = getRecruitSectionPx(val<string>(values, "rcTalentsTitleSize") || "l")
  const titleColor = val<string>(values, "rcTalentsTitleColor") || "#1a1a1a"

  const talents = [
    val<string>(values, "rcTalent1") || "설득보다 설명을 중요하게 생각하는 분",
    val<string>(values, "rcTalent2") || "매출보다 고객 신뢰를 우선하는 분",
    val<string>(values, "rcTalent3") || "다시 찾는 이유를 만들고 싶은 분",
    val<string>(values, "rcTalent4") || "고객의 시각에서 문제를 이해하고 해결할 줄 아는 분",
  ]

  const textSize    = getRecruitBodyPx(val<string>(values, "rcTalentTextSize") || "m")
  const textColor   = val<string>(values, "rcTalentTextColor") || "#1a1a1a"
  const numberSize  = getRecruitBodyPx(val<string>(values, "rcTalentNumberSize") || "m")
  const numberColor = val<string>(values, "rcTalentNumberColor") || "#c9a85c"

  const talentsTitleFont   = val<string>(values, "rcTalentsTitleFont") || "sans"
  const talentsTitleWeight = val<string>(values, "rcTalentsTitleWeight") || "700"
  const talentTextFont     = val<string>(values, "rcTalentTextFont") || "sans"
  const talentTextWeight   = val<string>(values, "rcTalentTextWeight") || "500"
  const talentNumberFont   = val<string>(values, "rcTalentNumberFont") || "sans"
  const talentNumberWeight = val<string>(values, "rcTalentNumberWeight") || "600"

  return (
    <section style={{
      width: "100%",
      paddingTop: "clamp(60px, 10vw, 100px)",
      paddingBottom: "clamp(60px, 10vw, 100px)",
      background: "#ffffff",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        paddingLeft: "clamp(16px, 5vw, 80px)",
        paddingRight: "clamp(16px, 5vw, 80px)",
        textAlign: "center" as const,
      }}>
        {/* 섹션 eyebrow + 헤드라인 */}
        <div style={{
          fontSize: eyebrowPx,
          color: "#c9a85c",
          letterSpacing: "0.2em",
          fontWeight: 500,
          marginBottom: 12,
        }}>{eyebrow}</div>
        <h2 style={{
          fontSize: titleSize,
          fontFamily: getRecruitFontCss(talentsTitleFont),
          color: titleColor,
          fontWeight: Number(talentsTitleWeight),
          lineHeight: 1.3,
          margin: "0 0 clamp(40px, 6vw, 64px) 0",
        }}>{title}</h2>

        {/* 4개 카드 그리드 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
          gap: "clamp(24px, 4vw, 40px)",
          textAlign: "left" as const,
        }}>
          {talents.map((text, i) => (
            <div key={i} style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              <div style={{
                fontSize: numberSize,
                fontFamily: getRecruitFontCss(talentNumberFont),
                color: numberColor,
                fontWeight: Number(talentNumberWeight),
                letterSpacing: "0.05em",
              }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{
                fontSize: textSize,
                fontFamily: getRecruitFontCss(talentTextFont),
                color: textColor,
                fontWeight: Number(talentTextWeight),
                lineHeight: 1.5,
              }}>
                {text}
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  )
}

function RecruitPositions({ values }: { values: Record<string, FieldValue> }) {
  const { isNarrow } = useRecruit()
  const eyebrowText = (val<string>(values, "rcPositionsEyebrow") || "POSITIONS")
  const titleText = (val<string>(values, "rcPositionsTitle") || "함께할 직군")

  const eyebrowSize = (val<string>(values, "rcPositionsEyebrowSize") || "sm")
  const eyebrowColor = (val<string>(values, "rcPositionsEyebrowColor") || "#c9a961")
  const titleSize = (val<string>(values, "rcPositionsTitleSize") || "xl")
  const titleColor = (val<string>(values, "rcPositionsTitleColor") || "#1a1a1a")

  const cardTitleSize = (val<string>(values, "rcPositionCardTitleSize") || "lg")
  const cardTitleColor = (val<string>(values, "rcPositionCardTitleColor") || "#1a1a1a")
  const cardBodySize = (val<string>(values, "rcPositionCardBodySize") || "sm")
  const cardBodyColor = (val<string>(values, "rcPositionCardBodyColor") || "#666666")

  const posEyebrowFont   = val<string>(values, "rcPositionsEyebrowFont") || "sans"
  const posEyebrowWeight = val<string>(values, "rcPositionsEyebrowWeight") || "400"
  const posTitleFont     = val<string>(values, "rcPositionsTitleFont") || "sans"
  const posTitleWeight   = val<string>(values, "rcPositionsTitleWeight") || "600"
  const posCardTitleFont   = val<string>(values, "rcPositionCardTitleFont") || "sans"
  const posCardTitleWeight = val<string>(values, "rcPositionCardTitleWeight") || "600"
  const posCardBodyFont   = val<string>(values, "rcPositionCardBodyFont") || "sans"
  const posCardBodyWeight = val<string>(values, "rcPositionCardBodyWeight") || "400"

  const positions = [1, 2, 3].map((n) => ({
    image: (val<string>(values, "rcPosition" + n + "Image") || ""),
    title: (val<string>(values, "rcPosition" + n + "Title") || "포지션 " + n),
    body: (val<string>(values, "rcPosition" + n + "Body") || "직군 설명을 입력하세요."),
  }))

  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        paddingTop: "clamp(60px, 10vw, 120px)",
        paddingBottom: "clamp(60px, 10vw, 120px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          paddingLeft: "clamp(16px, 5vw, 80px)",
          paddingRight: "clamp(16px, 5vw, 80px)",
        }}
      >
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(40px, 6vw, 64px)" }}>
          <div
            style={{
              fontSize: getRecruitEyebrowPx(eyebrowSize),
              fontFamily: getRecruitFontCss(posEyebrowFont),
              color: eyebrowColor,
              letterSpacing: "0.15em",
              fontWeight: Number(posEyebrowWeight),
              marginBottom: 12,
            }}
          >
            {eyebrowText}
          </div>
          <div
            style={{
              fontSize: getRecruitHeroPx(titleSize),
              fontFamily: getRecruitFontCss(posTitleFont),
              color: titleColor,
              fontWeight: Number(posTitleWeight),
            }}
          >
            {titleText}
          </div>
        </div>

        {/* Position cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, 1fr)",
            gap: "clamp(24px, 4vw, 40px)",
          }}
        >
          {positions.map((p, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column" }}>
              {/* Image (3:4 portrait) */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "3 / 4",
                  backgroundColor: "#f3f3f3",
                  overflow: "hidden",
                  marginBottom: 20,
                }}
              >
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#bbbbbb",
                      fontSize: 14,
                    }}
                  >
                    이미지 없음
                  </div>
                )}
              </div>

              {/* Title */}
              <div
                style={{
                  fontSize: getRecruitSectionPx(cardTitleSize),
                  fontFamily: getRecruitFontCss(posCardTitleFont),
                  color: cardTitleColor,
                  fontWeight: Number(posCardTitleWeight),
                  marginBottom: 8,
                }}
              >
                {p.title}
              </div>

              {/* Body */}
              <div
                style={{
                  fontSize: getRecruitBodyPx(cardBodySize),
                  fontFamily: getRecruitFontCss(posCardBodyFont),
                  color: cardBodyColor,
                  fontWeight: Number(posCardBodyWeight),
                  lineHeight: 1.7,
                }}
              >
                {p.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function RecruitMidBanner({ values }: { values: Record<string, FieldValue> }) {
  const { isNarrow } = useRecruit()
  const image = val<string>(values, "rcBannerImage") || ""
  const overlayRaw = val<number>(values, "rcBannerOverlay")
  const overlay = typeof overlayRaw === "number" ? overlayRaw : 40
  const headlineText = val<string>(values, "rcBannerHeadline") || "당신의 성장이 곧 우리의 성장"
  const subtextText = val<string>(values, "rcBannerSubtext") || "지금, 새로운 도전을 시작하세요."

  const headlineSize = val<string>(values, "rcBannerHeadlineSize") || "xl"
  const headlineColor = val<string>(values, "rcBannerHeadlineColor") || "#ffffff"
  const subtextSize = val<string>(values, "rcBannerSubtextSize") || "md"
  const subtextColor = val<string>(values, "rcBannerSubtextColor") || "#e0e0e0"

  const bannerHeadlineFont   = val<string>(values, "rcBannerHeadlineFont") || "sans"
  const bannerHeadlineWeight = val<string>(values, "rcBannerHeadlineWeight") || "600"
  const bannerSubtextFont    = val<string>(values, "rcBannerSubtextFont") || "sans"
  const bannerSubtextWeight  = val<string>(values, "rcBannerSubtextWeight") || "400"

  const overlayAlpha = Math.max(0, Math.min(100, overlay)) / 100

  return (
    <section
      style={{
        width: "100%",
        position: "relative",
        height: "clamp(280px, 40vw, 420px)",
        backgroundColor: "#1a1a1a",
        backgroundImage: image ? "url(" + image + ")" : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, " + overlayAlpha + ")",
        }}
      />

      {/* Placeholder hint when no image */}
      {!image && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            color: "#888888",
            fontSize: 12,
            zIndex: 1,
          }}
        >
          배경 이미지 없음
        </div>
      )}

      {/* Text content */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          paddingLeft: "clamp(16px, 5vw, 80px)",
          paddingRight: "clamp(16px, 5vw, 80px)",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: getRecruitHeroPx(headlineSize),
            fontFamily: getRecruitFontCss(bannerHeadlineFont),
            color: headlineColor,
            fontWeight: Number(bannerHeadlineWeight),
            lineHeight: 1.4,
            marginBottom: 12,
          }}
        >
          {headlineText}
        </div>
        {subtextText && (
          <div
            style={{
              fontSize: getRecruitBodyPx(subtextSize),
              fontFamily: getRecruitFontCss(bannerSubtextFont),
              color: subtextColor,
              fontWeight: Number(bannerSubtextWeight),
              lineHeight: 1.6,
            }}
          >
            {subtextText}
          </div>
        )}
      </div>
    </section>
  )
}

function RecruitWelfare({ values }: { values: Record<string, FieldValue> }) {
  const { isNarrow } = useRecruit()
  const eyebrowText = val<string>(values, "rcWelfareEyebrow") || "BENEFITS"
  const titleText = val<string>(values, "rcWelfareTitle") || "구성원을 위한 복지"

  const eyebrowSize = val<string>(values, "rcWelfareEyebrowSize") || "sm"
  const eyebrowColor = val<string>(values, "rcWelfareEyebrowColor") || "#c9a961"
  const titleSize = val<string>(values, "rcWelfareTitleSize") || "xl"
  const titleColor = val<string>(values, "rcWelfareTitleColor") || "#1a1a1a"

  const cardTitleSize = val<string>(values, "rcWelfareCardTitleSize") || "md"
  const cardTitleColor = val<string>(values, "rcWelfareCardTitleColor") || "#1a1a1a"
  const cardBodySize = val<string>(values, "rcWelfareCardBodySize") || "sm"
  const cardBodyColor = val<string>(values, "rcWelfareCardBodyColor") || "#666666"
  const iconColor = val<string>(values, "rcWelfareIconColor") || "#c9a961"

  const welfEyebrowFont    = val<string>(values, "rcWelfareEyebrowFont") || "sans"
  const welfEyebrowWeight  = val<string>(values, "rcWelfareEyebrowWeight") || "400"
  const welfTitleFont      = val<string>(values, "rcWelfareTitleFont") || "sans"
  const welfTitleWeight    = val<string>(values, "rcWelfareTitleWeight") || "600"
  const welfCardTitleFont  = val<string>(values, "rcWelfareCardTitleFont") || "sans"
  const welfCardTitleWeight = val<string>(values, "rcWelfareCardTitleWeight") || "600"
  const welfCardBodyFont   = val<string>(values, "rcWelfareCardBodyFont") || "sans"
  const welfCardBodyWeight = val<string>(values, "rcWelfareCardBodyWeight") || "400"

  const welfareItems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
    icon: (val<string>(values, "rcWelfare" + n + "Icon") || "Shield") as string,
    title: (val<string>(values, "rcWelfare" + n + "Title") || ("복지 " + n)) as string,
    body: (val<string>(values, "rcWelfare" + n + "Body") || "") as string,
  }))

  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "#fafafa",
        paddingTop: "clamp(60px, 10vw, 120px)",
        paddingBottom: "clamp(60px, 10vw, 120px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          paddingLeft: "clamp(16px, 5vw, 80px)",
          paddingRight: "clamp(16px, 5vw, 80px)",
        }}
      >
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(40px, 6vw, 64px)" }}>
          <div
            style={{
              fontSize: getRecruitEyebrowPx(eyebrowSize),
              fontFamily: getRecruitFontCss(welfEyebrowFont),
              color: eyebrowColor,
              letterSpacing: "0.15em",
              fontWeight: Number(welfEyebrowWeight),
              marginBottom: 12,
            }}
          >
            {eyebrowText}
          </div>
          <div
            style={{
              fontSize: getRecruitHeroPx(titleSize),
              fontFamily: getRecruitFontCss(welfTitleFont),
              color: titleColor,
              fontWeight: Number(welfTitleWeight),
            }}
          >
            {titleText}
          </div>
        </div>

        {/* Welfare grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "repeat(2, 1fr)" : "repeat(5, 1fr)",
            gap: "clamp(20px, 3vw, 32px)",
          }}
        >
          {welfareItems.map((w, i) => {
            const Icon = getRecruitIcon(w.icon)
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  textAlign: "left",
                  padding: "clamp(16px, 2.5vw, 24px) 0",
                }}
              >
                <Icon
                  size={32}
                  color={iconColor}
                  strokeWidth={1.5}
                  style={{ marginBottom: 16 }}
                />
                <div
                  style={{
                    fontSize: getRecruitSectionPx(cardTitleSize),
                    fontFamily: getRecruitFontCss(welfCardTitleFont),
                    color: cardTitleColor,
                    fontWeight: Number(welfCardTitleWeight),
                    marginBottom: 6,
                    lineHeight: 1.4,
                  }}
                >
                  {w.title}
                </div>
                <div
                  style={{
                    fontSize: getRecruitBodyPx(cardBodySize),
                    fontFamily: getRecruitFontCss(welfCardBodyFont),
                    color: cardBodyColor,
                    fontWeight: Number(welfCardBodyWeight),
                    lineHeight: 1.6,
                  }}
                >
                  {w.body}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function RecruitProcess({ values }: { values: Record<string, FieldValue> }) {
  const { isNarrow } = useRecruit()
  const eyebrowText = val<string>(values, "rcProcessEyebrow") || "PROCESS"
  const titleText = val<string>(values, "rcProcessTitle") || "채용 절차"

  const eyebrowSize = val<string>(values, "rcProcessEyebrowSize") || "sm"
  const eyebrowColor = val<string>(values, "rcProcessEyebrowColor") || "#c9a961"
  const titleSize = val<string>(values, "rcProcessTitleSize") || "xl"
  const titleColor = val<string>(values, "rcProcessTitleColor") || "#1a1a1a"

  const numberColor = val<string>(values, "rcProcessNumberColor") || "#c9a961"
  const stepTitleSize = val<string>(values, "rcProcessStepTitleSize") || "md"
  const stepTitleColor = val<string>(values, "rcProcessStepTitleColor") || "#1a1a1a"
  const stepBodySize = val<string>(values, "rcProcessStepBodySize") || "sm"
  const stepBodyColor = val<string>(values, "rcProcessStepBodyColor") || "#666666"

  const notesTitle = val<string>(values, "rcProcessNotesTitle") || "유의사항"
  const notesTitleSize = val<string>(values, "rcProcessNotesTitleSize") || "md"
  const notesTitleColor = val<string>(values, "rcProcessNotesTitleColor") || "#1a1a1a"
  const noteBodySize = val<string>(values, "rcProcessNoteBodySize") || "sm"
  const noteBodyColor = val<string>(values, "rcProcessNoteBodyColor") || "#666666"

  const procEyebrowFont    = val<string>(values, "rcProcessEyebrowFont") || "sans"
  const procEyebrowWeight  = val<string>(values, "rcProcessEyebrowWeight") || "400"
  const procTitleFont      = val<string>(values, "rcProcessTitleFont") || "sans"
  const procTitleWeight    = val<string>(values, "rcProcessTitleWeight") || "600"
  const procStepTitleFont  = val<string>(values, "rcProcessStepTitleFont") || "sans"
  const procStepTitleWeight = val<string>(values, "rcProcessStepTitleWeight") || "600"
  const procStepBodyFont   = val<string>(values, "rcProcessStepBodyFont") || "sans"
  const procStepBodyWeight = val<string>(values, "rcProcessStepBodyWeight") || "400"
  const procNotesTitleFont  = val<string>(values, "rcProcessNotesTitleFont") || "sans"
  const procNotesTitleWeight = val<string>(values, "rcProcessNotesTitleWeight") || "600"
  const procNoteBodyFont   = val<string>(values, "rcProcessNoteBodyFont") || "sans"
  const procNoteBodyWeight = val<string>(values, "rcProcessNoteBodyWeight") || "400"

  const steps = [1, 2, 3, 4, 5].map((n) => ({
    num: String(n).padStart(2, "0"),
    title: (val<string>(values, "rcProcess" + n + "Title") || ("단계 " + n)) as string,
    body: (val<string>(values, "rcProcess" + n + "Body") || "") as string,
  }))

  const notes = [1, 2, 3, 4]
    .map((n) => val<string>(values, "rcProcessNote" + n) || "")
    .filter((s) => s.length > 0)

  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        paddingTop: "clamp(60px, 10vw, 120px)",
        paddingBottom: "clamp(60px, 10vw, 120px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          paddingLeft: "clamp(16px, 5vw, 80px)",
          paddingRight: "clamp(16px, 5vw, 80px)",
        }}
      >
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(40px, 6vw, 64px)" }}>
          <div
            style={{
              fontSize: getRecruitEyebrowPx(eyebrowSize),
              fontFamily: getRecruitFontCss(procEyebrowFont),
              color: eyebrowColor,
              letterSpacing: "0.15em",
              fontWeight: Number(procEyebrowWeight),
              marginBottom: 12,
            }}
          >
            {eyebrowText}
          </div>
          <div
            style={{
              fontSize: getRecruitHeroPx(titleSize),
              fontFamily: getRecruitFontCss(procTitleFont),
              color: titleColor,
              fontWeight: Number(procTitleWeight),
            }}
          >
            {titleText}
          </div>
        </div>

        {/* Steps grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, 1fr)",
            gap: "clamp(28px, 4vw, 40px)",
            marginBottom: "clamp(48px, 7vw, 80px)",
          }}
        >
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(28px, 4vw, 40px)",
                  color: numberColor,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                  marginBottom: 16,
                }}
              >
                {s.num}
              </div>
              <div
                style={{
                  fontSize: getRecruitSectionPx(stepTitleSize),
                  fontFamily: getRecruitFontCss(procStepTitleFont),
                  color: stepTitleColor,
                  fontWeight: Number(procStepTitleWeight),
                  marginBottom: 8,
                  lineHeight: 1.4,
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  fontSize: getRecruitBodyPx(stepBodySize),
                  fontFamily: getRecruitFontCss(procStepBodyFont),
                  color: stepBodyColor,
                  fontWeight: Number(procStepBodyWeight),
                  lineHeight: 1.6,
                }}
              >
                {s.body}
              </div>
            </div>
          ))}
        </div>

        {/* Notes box */}
        {notes.length > 0 && (
          <div
            style={{
              maxWidth: 800,
              margin: "0 auto",
              backgroundColor: "#fafafa",
              padding: "clamp(24px, 4vw, 36px)",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontSize: getRecruitSectionPx(notesTitleSize),
                fontFamily: getRecruitFontCss(procNotesTitleFont),
                color: notesTitleColor,
                fontWeight: Number(procNotesTitleWeight),
                marginBottom: 16,
              }}
            >
              {notesTitle}
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {notes.map((note, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: getRecruitBodyPx(noteBodySize),
                    fontFamily: getRecruitFontCss(procNoteBodyFont),
                    color: noteBodyColor,
                    fontWeight: Number(procNoteBodyWeight),
                    lineHeight: 1.6,
                    paddingLeft: 16,
                    position: "relative",
                  }}
                >
                  <span style={{ position: "absolute", left: 0, top: 0 }}>•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function RecruitCta({ values }: { values: Record<string, FieldValue> }) {
  const { isNarrow } = useRecruit()
  const bgImage = val<string>(values, "rcCtaBgImage") || ""
  const bgColor = val<string>(values, "rcCtaBgColor") || "#1a1a1a"
  const overlayRaw = val<number>(values, "rcCtaOverlay")
  const overlay = typeof overlayRaw === "number" ? overlayRaw : 50

  const headlineText = val<string>(values, "rcCtaHeadline") || "타토아와 함께 성장할 당신을 기다립니다"
  const subtextText = val<string>(values, "rcCtaSubtext") || ""

  const headlineSize = val<string>(values, "rcCtaHeadlineSize") || "xl"
  const headlineColor = val<string>(values, "rcCtaHeadlineColor") || "#ffffff"
  const subtextSize = val<string>(values, "rcCtaSubtextSize") || "md"
  const subtextColor = val<string>(values, "rcCtaSubtextColor") || "#e0e0e0"

  const ctaHeadlineFont   = val<string>(values, "rcCtaHeadlineFont") || "sans"
  const ctaHeadlineWeight = val<string>(values, "rcCtaHeadlineWeight") || "600"
  const ctaSubtextFont    = val<string>(values, "rcCtaSubtextFont") || "sans"
  const ctaSubtextWeight  = val<string>(values, "rcCtaSubtextWeight") || "400"

  const btn1Text = val<string>(values, "rcCtaButton1Text") || ""
  const btn1Link = val<string>(values, "rcCtaButton1Link") || "#"
  const btn1Bg = val<string>(values, "rcCtaButton1Bg") || "#c9a961"
  const btn1Color = val<string>(values, "rcCtaButton1Color") || "#ffffff"

  const btn2Text = val<string>(values, "rcCtaButton2Text") || ""
  const btn2Link = val<string>(values, "rcCtaButton2Link") || "#"
  const btn2Bg = val<string>(values, "rcCtaButton2Bg") || "transparent"
  const btn2Color = val<string>(values, "rcCtaButton2Color") || "#ffffff"

  const overlayAlpha = Math.max(0, Math.min(100, overlay)) / 100
  const hasImage = bgImage.length > 0
  const isBtn2Outline = btn2Bg === "transparent" || btn2Bg === "rgba(0,0,0,0)"

  return (
    <section
      style={{
        width: "100%",
        position: "relative",
        minHeight: "clamp(320px, 45vw, 480px)",
        backgroundColor: bgColor,
        backgroundImage: hasImage ? "url(" + bgImage + ")" : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
      }}
    >
      {/* Dark overlay (only when image) */}
      {hasImage && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, " + overlayAlpha + ")",
          }}
        />
      )}

      {/* Placeholder hint when no image */}
      {!hasImage && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            color: "#888888",
            fontSize: 12,
            zIndex: 1,
          }}
        >
          배경 이미지 없음 (단색 fallback)
        </div>
      )}

      {/* Content */}
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "clamp(320px, 45vw, 480px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          paddingTop: "clamp(48px, 8vw, 80px)",
          paddingBottom: "clamp(48px, 8vw, 80px)",
          paddingLeft: "clamp(16px, 5vw, 80px)",
          paddingRight: "clamp(16px, 5vw, 80px)",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: getRecruitHeroPx(headlineSize),
            fontFamily: getRecruitFontCss(ctaHeadlineFont),
            color: headlineColor,
            fontWeight: Number(ctaHeadlineWeight),
            lineHeight: 1.4,
            marginBottom: subtextText ? 16 : 32,
            maxWidth: 900,
          }}
        >
          {headlineText}
        </div>

        {subtextText && (
          <div
            style={{
              fontSize: getRecruitBodyPx(subtextSize),
              fontFamily: getRecruitFontCss(ctaSubtextFont),
              color: subtextColor,
              fontWeight: Number(ctaSubtextWeight),
              lineHeight: 1.6,
              marginBottom: 32,
              maxWidth: 800,
            }}
          >
            {subtextText}
          </div>
        )}

        {/* Buttons */}
        {(btn1Text || btn2Text) && (
          <div
            style={{
              display: "flex",
              flexDirection: isNarrow ? "column" : "row",
              justifyContent: isNarrow ? "stretch" : "center",
              gap: 12,
              width: "100%",
              maxWidth: 400,
              alignItems: "stretch",
            }}
          >
            {btn1Text && (
              <a
                href={btn1Link}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: isNarrow ? "100%" : "auto",
                  minWidth: isNarrow ? undefined : 180,
                  padding: "14px 28px",
                  backgroundColor: btn1Bg,
                  color: btn1Color,
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: "none",
                  borderRadius: 4,
                  letterSpacing: "0.02em",
                  transition: "opacity 0.2s",
                }}
              >
                {btn1Text}
              </a>
            )}
            {btn2Text && (
              <a
                href={btn2Link}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: isNarrow ? "100%" : "auto",
                  minWidth: isNarrow ? undefined : 180,
                  padding: "14px 28px",
                  backgroundColor: btn2Bg,
                  color: btn2Color,
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: "none",
                  borderRadius: 4,
                  letterSpacing: "0.02em",
                  border: isBtn2Outline ? ("1px solid " + btn2Color) : "none",
                  transition: "opacity 0.2s",
                }}
              >
                {btn2Text}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function SectionPlaceholder({ label }: { label: string }) {
  return (
    <div style={{
      padding: "60px 20px",
      textAlign: "center" as const,
      color: "#999",
      fontSize: 14,
      borderBottom: "1px dashed #e5e5e5",
    }}>
      {label}
    </div>
  )
}
