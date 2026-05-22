"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StaffStatus = "draft" | "published" | "hidden" | "archived"

export type StaffProfile = {
  id: string
  branchId: string
  name: string
  englishName?: string
  title: string
  specialtySummary?: string
  philosophy?: string
  oneLinePitch?: string
  shortIntro?: string
  longIntro?: string
  profileImageUrl?: string
  coverImageUrl?: string
  consultUrl?: string
  isFeatured: boolean
  isPublic: boolean
  status: StaffStatus
  displayOrder: number
  chatbotPriority: boolean
  homepageQuote?: string
  highlightPhrase?: string
  pinToTop: boolean
  needsReview: boolean
  privateNote?: string
  consultingStyle?: string
  homepageHighlight?: string
  chatbotSummary?: string
  createdAt: string
  updatedAt: string
}

export type CareerType = "경력" | "학력" | "수련" | "근무이력" | "이력"
export type DoctorCareer = {
  id: string
  doctorId: string
  type: CareerType
  organization: string
  roleOrDescription: string
  startYear?: number
  endYear?: number
  isCurrent: boolean
  sortOrder: number
  isPublic: boolean
}

export type AcademicType =
  | "학회"
  | "정회원"
  | "학술활동"
  | "연수"
  | "강연"
  | "발표"
export type DoctorAcademic = {
  id: string
  doctorId: string
  type: AcademicType
  name: string
  description?: string
  year?: number
  isCurrent: boolean
  sortOrder: number
  isPublic: boolean
}

export type PublicationType =
  | "논문"
  | "저서"
  | "기고"
  | "인터뷰"
  | "특허"
  | "학술발표"
export type DoctorPublication = {
  id: string
  doctorId: string
  type: PublicationType
  title: string
  publisherOrJournal?: string
  publishedYear?: number
  link?: string
  description?: string
  isFeatured: boolean
  isPublic: boolean
  sortOrder: number
}

export type CredentialType = "자격" | "인증" | "수상"
export type DoctorCredential = {
  id: string
  doctorId: string
  type: CredentialType
  name: string
  issuer?: string
  year?: number
  description?: string
  fileUrl?: string
  sortOrder: number
  isPublic: boolean
}

export type DoctorData = {
  profile: StaffProfile
  specialties: string[]
  strengths: string[]
  targetCustomers: string[]
  specialtyKeywords: string[]
  careers: DoctorCareer[]
  academics: DoctorAcademic[]
  publications: DoctorPublication[]
  credentials: DoctorCredential[]
  linkedTreatmentIds: string[]
  linkedEquipmentIds: string[]
  linkedFaqIds: string[]
}

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

type StaffContextType = {
  doctors: DoctorData[]
  getDoctor: (id: string) => DoctorData | undefined
  getDoctorsByBranch: (branchId: string) => DoctorData[]
  createDoctor: (
    branchId: string,
    profile: Partial<
      Omit<StaffProfile, "id" | "branchId" | "createdAt" | "updatedAt">
    >
  ) => DoctorData
  updateProfile: (doctorId: string, updates: Partial<StaffProfile>) => void
  updateDoctorExtras: (
    doctorId: string,
    updates: Partial<
      Omit<
        DoctorData,
        "profile" | "careers" | "academics" | "publications" | "credentials"
      >
    >
  ) => void
  // Careers
  addCareer: (
    doctorId: string,
    career: Omit<DoctorCareer, "id" | "doctorId">
  ) => void
  updateCareer: (
    doctorId: string,
    careerId: string,
    updates: Partial<DoctorCareer>
  ) => void
  deleteCareer: (doctorId: string, careerId: string) => void
  moveCareer: (
    doctorId: string,
    careerId: string,
    direction: "up" | "down"
  ) => void
  // Academics
  addAcademic: (
    doctorId: string,
    item: Omit<DoctorAcademic, "id" | "doctorId">
  ) => void
  updateAcademic: (
    doctorId: string,
    id: string,
    updates: Partial<DoctorAcademic>
  ) => void
  deleteAcademic: (doctorId: string, id: string) => void
  moveAcademic: (
    doctorId: string,
    id: string,
    direction: "up" | "down"
  ) => void
  // Publications
  addPublication: (
    doctorId: string,
    item: Omit<DoctorPublication, "id" | "doctorId">
  ) => void
  updatePublication: (
    doctorId: string,
    id: string,
    updates: Partial<DoctorPublication>
  ) => void
  deletePublication: (doctorId: string, id: string) => void
  // Credentials
  addCredential: (
    doctorId: string,
    item: Omit<DoctorCredential, "id" | "doctorId">
  ) => void
  updateCredential: (
    doctorId: string,
    id: string,
    updates: Partial<DoctorCredential>
  ) => void
  deleteCredential: (doctorId: string, id: string) => void
  // Bulk
  archiveDoctor: (doctorId: string) => void
  deleteDoctor: (doctorId: string) => void
  duplicateDoctor: (doctorId: string) => DoctorData
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const CREATED_AT = "2026-01-01T00:00:00Z"
const UPDATED_AT = "2026-04-10T00:00:00Z"

const seedDoctors: DoctorData[] = [
  // ── d1: 김민지 / main branch ─────────────────────────────────────────────
  {
    profile: {
      id: "d1",
      branchId: "main",
      name: "김민지",
      englishName: "Dr. Kim Min-ji",
      title: "대표원장",
      specialtySummary: "안면 윤곽 전문",
      oneLinePitch: "얼굴의 균형과 조화를 설계하는 안면 윤곽 전문의",
      philosophy:
        "자연스러운 아름다움을 최우선으로, 환자 한 명 한 명에게 맞춤 솔루션을 제공합니다.",
      shortIntro:
        "서울대학교 의과대학을 졸업하고 성형외과 전문의 자격을 취득하였습니다. 15년 이상의 안면 윤곽 시술 경험을 바탕으로 자연스럽고 균형 잡힌 결과를 추구합니다. 현재 본원 대표원장으로서 진료와 연구를 병행하고 있습니다.",
      isFeatured: true,
      isPublic: true,
      status: "published",
      displayOrder: 1,
      chatbotPriority: true,
      pinToTop: true,
      needsReview: false,
      highlightPhrase: "안면 윤곽 1,000케이스 이상",
      homepageQuote: "얼굴의 균형이 자신감의 시작입니다.",
      homepageHighlight: "안면 윤곽 대표 전문의",
      chatbotSummary:
        "안면 윤곽 전문 대표원장. 자연스러운 결과와 맞춤 상담이 강점.",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    },
    specialties: ["안면 윤곽", "V라인 성형", "광대 축소"],
    strengths: ["정밀한 분석력", "자연스러운 결과", "풍부한 임상 경험"],
    targetCustomers: ["윤곽 교정 희망자", "사각턱 고민", "대칭 불균형"],
    specialtyKeywords: ["안면윤곽", "브이라인", "광대축소", "사각턱"],
    careers: [
      {
        id: "career_d1_1",
        doctorId: "d1",
        type: "학력",
        organization: "서울대학교 의과대학",
        roleOrDescription: "의학과 졸업",
        startYear: 1999,
        endYear: 2005,
        isCurrent: false,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "career_d1_2",
        doctorId: "d1",
        type: "수련",
        organization: "서울대학교병원",
        roleOrDescription: "성형외과 전공의 수료",
        startYear: 2005,
        endYear: 2009,
        isCurrent: false,
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "career_d1_3",
        doctorId: "d1",
        type: "경력",
        organization: "강남 뷰티클리닉",
        roleOrDescription: "안면 윤곽 전임의 및 원장",
        startYear: 2010,
        endYear: 2020,
        isCurrent: false,
        sortOrder: 3,
        isPublic: true,
      },
    ],
    academics: [
      {
        id: "acad_d1_1",
        doctorId: "d1",
        type: "정회원",
        name: "대한성형외과학회",
        isCurrent: true,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "acad_d1_2",
        doctorId: "d1",
        type: "학회",
        name: "대한미용성형외과학회",
        isCurrent: true,
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "acad_d1_3",
        doctorId: "d1",
        type: "연수",
        name: "국제안면윤곽학회 (ISAPS) 연수",
        year: 2015,
        isCurrent: false,
        sortOrder: 3,
        isPublic: true,
      },
    ],
    publications: [],
    credentials: [
      {
        id: "cred_d1_1",
        doctorId: "d1",
        type: "자격",
        name: "성형외과 전문의",
        issuer: "대한의사협회",
        year: 2009,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "cred_d1_2",
        doctorId: "d1",
        type: "인증",
        name: "안면 윤곽 전문 인증의",
        issuer: "대한미용성형외과학회",
        year: 2013,
        sortOrder: 2,
        isPublic: true,
      },
    ],
    linkedTreatmentIds: [],
    linkedEquipmentIds: [],
    linkedFaqIds: [],
  },

  // ── d2: 박서연 / main branch ─────────────────────────────────────────────
  {
    profile: {
      id: "d2",
      branchId: "main",
      name: "박서연",
      englishName: "Dr. Park Seo-yeon",
      title: "원장",
      specialtySummary: "피부 재생 및 미백 전문",
      oneLinePitch: "건강하고 빛나는 피부로 되돌아가는 지름길",
      philosophy:
        "피부의 근본적인 건강을 회복시켜 진정한 아름다움을 만들어 냅니다.",
      shortIntro:
        "연세대학교 의과대학 졸업 후 피부과 전문의를 취득하였습니다. 피부 재생과 미백 분야에서 다양한 레이저 및 시술 경험을 보유하고 있습니다. 환자 개개인의 피부 상태를 면밀히 분석하여 최적의 치료 계획을 수립합니다.",
      isFeatured: true,
      isPublic: true,
      status: "published",
      displayOrder: 2,
      chatbotPriority: true,
      pinToTop: false,
      needsReview: false,
      highlightPhrase: "피부 재생 전문 10년 경력",
      homepageQuote: "피부가 건강해야 진짜 아름다움이 빛납니다.",
      homepageHighlight: "피부 재생·미백 전문",
      chatbotSummary: "피부 재생, 미백, 레이저 시술 전문 원장.",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    },
    specialties: ["피부 재생", "미백 시술", "레이저 토닝"],
    strengths: ["세밀한 피부 분석", "최신 레이저 장비 운용", "친절한 상담"],
    targetCustomers: ["잡티·칙칙한 피부", "피부 톤 불균형", "색소 침착"],
    specialtyKeywords: ["피부재생", "미백", "레이저토닝", "색소치료"],
    careers: [
      {
        id: "career_d2_1",
        doctorId: "d2",
        type: "학력",
        organization: "연세대학교 의과대학",
        roleOrDescription: "의학과 졸업",
        startYear: 2002,
        endYear: 2008,
        isCurrent: false,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "career_d2_2",
        doctorId: "d2",
        type: "수련",
        organization: "세브란스병원",
        roleOrDescription: "피부과 전공의 수료",
        startYear: 2008,
        endYear: 2012,
        isCurrent: false,
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "career_d2_3",
        doctorId: "d2",
        type: "경력",
        organization: "압구정 피부과의원",
        roleOrDescription: "피부 재생·미백 전담 진료",
        startYear: 2013,
        endYear: 2021,
        isCurrent: false,
        sortOrder: 3,
        isPublic: true,
      },
    ],
    academics: [
      {
        id: "acad_d2_1",
        doctorId: "d2",
        type: "정회원",
        name: "대한피부과학회",
        isCurrent: true,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "acad_d2_2",
        doctorId: "d2",
        type: "학회",
        name: "대한레이저피부모발학회",
        isCurrent: true,
        sortOrder: 2,
        isPublic: true,
      },
    ],
    publications: [],
    credentials: [
      {
        id: "cred_d2_1",
        doctorId: "d2",
        type: "자격",
        name: "피부과 전문의",
        issuer: "대한의사협회",
        year: 2012,
        sortOrder: 1,
        isPublic: true,
      },
    ],
    linkedTreatmentIds: [],
    linkedEquipmentIds: [],
    linkedFaqIds: [],
  },

  // ── d3: 이준호 / main branch ─────────────────────────────────────────────
  {
    profile: {
      id: "d3",
      branchId: "main",
      name: "이준호",
      englishName: "Dr. Lee Jun-ho",
      title: "원장",
      specialtySummary: "바디 윤곽 전문",
      oneLinePitch: "과학적 분석으로 완성하는 이상적인 바디라인",
      philosophy:
        "몸의 균형을 맞추는 것이 자신감 회복의 첫걸음이라 믿습니다.",
      shortIntro:
        "고려대학교 의과대학을 졸업하고 외과 전문의 수련 후 바디 윤곽 시술에 특화하였습니다. 지방흡입·복부 성형 등 다양한 바디 케어 시술을 전문으로 합니다. 꼼꼼한 사전 분석과 안전 중심의 시술로 신뢰받는 의사를 지향합니다.",
      isFeatured: false,
      isPublic: true,
      status: "published",
      displayOrder: 3,
      chatbotPriority: false,
      pinToTop: false,
      needsReview: false,
      highlightPhrase: "바디 윤곽 전문 임상 경험",
      homepageQuote: "이상적인 바디라인, 함께 설계합니다.",
      homepageHighlight: "바디 윤곽·지방흡입 전문",
      chatbotSummary: "바디 윤곽, 지방흡입, 복부 성형 전문 원장.",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    },
    specialties: ["바디 윤곽", "지방흡입", "복부 성형"],
    strengths: ["안전 중심 시술", "체계적 사전 분석", "빠른 회복 프로토콜"],
    targetCustomers: ["부분 비만", "바디라인 교정", "산후 체형 회복"],
    specialtyKeywords: ["바디윤곽", "지방흡입", "복부성형", "체형교정"],
    careers: [
      {
        id: "career_d3_1",
        doctorId: "d3",
        type: "학력",
        organization: "고려대학교 의과대학",
        roleOrDescription: "의학과 졸업",
        startYear: 2003,
        endYear: 2009,
        isCurrent: false,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "career_d3_2",
        doctorId: "d3",
        type: "수련",
        organization: "고려대학교 안암병원",
        roleOrDescription: "외과 전공의 수료",
        startYear: 2009,
        endYear: 2013,
        isCurrent: false,
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "career_d3_3",
        doctorId: "d3",
        type: "경력",
        organization: "강남 바디라인의원",
        roleOrDescription: "바디 윤곽 전담 원장",
        startYear: 2014,
        endYear: 2022,
        isCurrent: false,
        sortOrder: 3,
        isPublic: true,
      },
    ],
    academics: [
      {
        id: "acad_d3_1",
        doctorId: "d3",
        type: "정회원",
        name: "대한성형외과학회",
        isCurrent: true,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "acad_d3_2",
        doctorId: "d3",
        type: "학회",
        name: "대한체형관리학회",
        isCurrent: true,
        sortOrder: 2,
        isPublic: true,
      },
    ],
    publications: [],
    credentials: [
      {
        id: "cred_d3_1",
        doctorId: "d3",
        type: "자격",
        name: "외과 전문의",
        issuer: "대한의사협회",
        year: 2013,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "cred_d3_2",
        doctorId: "d3",
        type: "인증",
        name: "지방흡입 전문 인증의",
        issuer: "대한체형관리학회",
        year: 2016,
        sortOrder: 2,
        isPublic: true,
      },
    ],
    linkedTreatmentIds: [],
    linkedEquipmentIds: [],
    linkedFaqIds: [],
  },

  // ── d4: 최유나 / sinsa branch ────────────────────────────────────────────
  {
    profile: {
      id: "d4",
      branchId: "sinsa",
      name: "최유나",
      englishName: "Dr. Choi Yuna",
      title: "대표원장",
      specialtySummary: "안티에이징 전문",
      oneLinePitch: "시간을 되돌리는 안티에이징 솔루션의 전문가",
      philosophy:
        "나이는 숫자일 뿐, 피부는 언제든 새롭게 태어날 수 있습니다.",
      shortIntro:
        "이화여자대학교 의과대학을 졸업하고 피부과 전문의로서 안티에이징 분야에 집중해 왔습니다. 보톡스·필러·실 리프팅 등 비수술적 노화 방지 시술에서 탁월한 임상 성과를 보유하고 있습니다. 신사 지점 대표원장으로 환자 맞춤형 안티에이징 프로그램을 운영합니다.",
      isFeatured: true,
      isPublic: true,
      status: "published",
      displayOrder: 1,
      chatbotPriority: true,
      pinToTop: true,
      needsReview: false,
      highlightPhrase: "비수술 안티에이징 전문",
      homepageQuote: "가장 자연스럽게, 가장 젊게.",
      homepageHighlight: "안티에이징 대표 전문의",
      chatbotSummary: "안티에이징, 보톡스, 필러, 실 리프팅 전문 대표원장.",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    },
    specialties: ["안티에이징", "보톡스·필러", "실 리프팅"],
    strengths: ["비수술 노화 방지", "자연스러운 볼륨 회복", "정밀 주사 테크닉"],
    targetCustomers: ["노화 초기 대응", "주름·처짐 고민", "생기 있는 피부 원하는 분"],
    specialtyKeywords: ["안티에이징", "보톡스", "필러", "실리프팅", "노화방지"],
    careers: [
      {
        id: "career_d4_1",
        doctorId: "d4",
        type: "학력",
        organization: "이화여자대학교 의과대학",
        roleOrDescription: "의학과 졸업",
        startYear: 2001,
        endYear: 2007,
        isCurrent: false,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "career_d4_2",
        doctorId: "d4",
        type: "수련",
        organization: "이대목동병원",
        roleOrDescription: "피부과 전공의 수료",
        startYear: 2007,
        endYear: 2011,
        isCurrent: false,
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "career_d4_3",
        doctorId: "d4",
        type: "경력",
        organization: "청담 에스테틱 클리닉",
        roleOrDescription: "안티에이징 전문 원장",
        startYear: 2012,
        endYear: 2021,
        isCurrent: false,
        sortOrder: 3,
        isPublic: true,
      },
    ],
    academics: [
      {
        id: "acad_d4_1",
        doctorId: "d4",
        type: "정회원",
        name: "대한피부과학회",
        isCurrent: true,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "acad_d4_2",
        doctorId: "d4",
        type: "학술활동",
        name: "대한미용피부외과학회 정기학술대회 발표",
        year: 2019,
        isCurrent: false,
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "acad_d4_3",
        doctorId: "d4",
        type: "연수",
        name: "유럽 안티에이징학회 (EADV) 연수",
        year: 2017,
        isCurrent: false,
        sortOrder: 3,
        isPublic: true,
      },
    ],
    publications: [],
    credentials: [
      {
        id: "cred_d4_1",
        doctorId: "d4",
        type: "자격",
        name: "피부과 전문의",
        issuer: "대한의사협회",
        year: 2011,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "cred_d4_2",
        doctorId: "d4",
        type: "인증",
        name: "필러·보톡스 인증 교육의",
        issuer: "대한미용피부외과학회",
        year: 2015,
        sortOrder: 2,
        isPublic: true,
      },
    ],
    linkedTreatmentIds: [],
    linkedEquipmentIds: [],
    linkedFaqIds: [],
  },

  // ── d5: 정대원 / sinsa branch ────────────────────────────────────────────
  {
    profile: {
      id: "d5",
      branchId: "sinsa",
      name: "정대원",
      englishName: "Dr. Jung Dae-won",
      title: "원장",
      specialtySummary: "레이저 치료 전문",
      oneLinePitch: "레이저 하나로 모든 피부 고민을 해결하는 전문가",
      philosophy:
        "올바른 레이저 선택이 치료의 절반, 나머지 절반은 의사의 기술입니다.",
      shortIntro:
        "한양대학교 의과대학 졸업 후 피부과 전문의로 레이저 치료에 특화하였습니다. 다양한 레이저 기기를 활용한 색소 치료, 흉터 개선, 혈관 치료 분야에 풍부한 경험을 보유하고 있습니다. 개별 피부 타입에 최적화된 레이저 프로토콜을 설계합니다.",
      isFeatured: false,
      isPublic: true,
      status: "published",
      displayOrder: 2,
      chatbotPriority: false,
      pinToTop: false,
      needsReview: false,
      highlightPhrase: "레이저 치료 다수 케이스",
      homepageQuote: "정확한 레이저로 빠르고 확실하게.",
      homepageHighlight: "레이저 치료 전문",
      chatbotSummary: "레이저 색소·흉터·혈관 치료 전문 원장.",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    },
    specialties: ["레이저 치료", "색소 병변", "흉터 개선"],
    strengths: ["다종 레이저 운용 능력", "짧은 회복 기간", "섬세한 파라미터 조절"],
    targetCustomers: ["점·잡티 제거 희망자", "흉터 고민", "혈관 확장증"],
    specialtyKeywords: ["레이저치료", "색소병변", "흉터개선", "혈관치료"],
    careers: [
      {
        id: "career_d5_1",
        doctorId: "d5",
        type: "학력",
        organization: "한양대학교 의과대학",
        roleOrDescription: "의학과 졸업",
        startYear: 2003,
        endYear: 2009,
        isCurrent: false,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "career_d5_2",
        doctorId: "d5",
        type: "수련",
        organization: "한양대학교병원",
        roleOrDescription: "피부과 전공의 수료",
        startYear: 2009,
        endYear: 2013,
        isCurrent: false,
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "career_d5_3",
        doctorId: "d5",
        type: "경력",
        organization: "강남 레이저피부과",
        roleOrDescription: "레이저 전담 진료 원장",
        startYear: 2014,
        endYear: 2022,
        isCurrent: false,
        sortOrder: 3,
        isPublic: true,
      },
    ],
    academics: [
      {
        id: "acad_d5_1",
        doctorId: "d5",
        type: "정회원",
        name: "대한레이저피부모발학회",
        isCurrent: true,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "acad_d5_2",
        doctorId: "d5",
        type: "연수",
        name: "미국 레이저의학회 (ASLMS) 연수",
        year: 2018,
        isCurrent: false,
        sortOrder: 2,
        isPublic: true,
      },
    ],
    publications: [],
    credentials: [
      {
        id: "cred_d5_1",
        doctorId: "d5",
        type: "자격",
        name: "피부과 전문의",
        issuer: "대한의사협회",
        year: 2013,
        sortOrder: 1,
        isPublic: true,
      },
    ],
    linkedTreatmentIds: [],
    linkedEquipmentIds: [],
    linkedFaqIds: [],
  },

  // ── d6: 한수민 / gumi branch ─────────────────────────────────────────────
  {
    profile: {
      id: "d6",
      branchId: "gumi",
      name: "한수민",
      englishName: "Dr. Han Soo-min",
      title: "대표원장",
      specialtySummary: "종합 미용 피부과 전문",
      oneLinePitch: "피부 건강부터 미용 시술까지, 모든 피부 고민의 해답",
      philosophy:
        "피부과 전문의로서 정확한 진단과 근거 중심의 치료를 통해 환자의 삶의 질을 높입니다.",
      shortIntro:
        "경북대학교 의과대학을 졸업하고 피부과 전문의를 취득하였습니다. 구미 지역에서 10년 이상 종합 미용 피부과를 운영하며 지역 주민들의 신뢰를 받아왔습니다. 의료 피부과와 미용 피부과를 아우르는 통합적 접근으로 최상의 결과를 제공합니다.",
      isFeatured: true,
      isPublic: true,
      status: "published",
      displayOrder: 1,
      chatbotPriority: true,
      pinToTop: true,
      needsReview: false,
      highlightPhrase: "구미 지역 대표 피부과 전문의",
      homepageQuote: "정확한 진단, 올바른 치료가 최고의 미용입니다.",
      homepageHighlight: "종합 미용 피부과 대표원장",
      chatbotSummary: "종합 미용 피부과 전문 대표원장. 의료·미용 통합 접근.",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    },
    specialties: ["종합 미용 피부과", "피부 트러블 케어", "미백·보습 치료"],
    strengths: ["통합적 피부 진료", "친절하고 꼼꼼한 상담", "지역 밀착형 진료"],
    targetCustomers: ["여드름·트러블 고민", "피부 전반 관리", "생애주기별 피부 케어"],
    specialtyKeywords: ["미용피부과", "여드름치료", "피부트러블", "미백치료"],
    careers: [
      {
        id: "career_d6_1",
        doctorId: "d6",
        type: "학력",
        organization: "경북대학교 의과대학",
        roleOrDescription: "의학과 졸업",
        startYear: 2000,
        endYear: 2006,
        isCurrent: false,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "career_d6_2",
        doctorId: "d6",
        type: "수련",
        organization: "경북대학교병원",
        roleOrDescription: "피부과 전공의 수료",
        startYear: 2006,
        endYear: 2010,
        isCurrent: false,
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "career_d6_3",
        doctorId: "d6",
        type: "경력",
        organization: "구미 한수민피부과의원",
        roleOrDescription: "대표원장 (개원)",
        startYear: 2011,
        isCurrent: true,
        sortOrder: 3,
        isPublic: true,
      },
    ],
    academics: [
      {
        id: "acad_d6_1",
        doctorId: "d6",
        type: "정회원",
        name: "대한피부과학회",
        isCurrent: true,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "acad_d6_2",
        doctorId: "d6",
        type: "정회원",
        name: "대한미용피부외과학회",
        isCurrent: true,
        sortOrder: 2,
        isPublic: true,
      },
      {
        id: "acad_d6_3",
        doctorId: "d6",
        type: "강연",
        name: "경북 지역 의사회 피부과 학술강연",
        year: 2020,
        isCurrent: false,
        sortOrder: 3,
        isPublic: true,
      },
    ],
    publications: [],
    credentials: [
      {
        id: "cred_d6_1",
        doctorId: "d6",
        type: "자격",
        name: "피부과 전문의",
        issuer: "대한의사협회",
        year: 2010,
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "cred_d6_2",
        doctorId: "d6",
        type: "수상",
        name: "구미시 의료서비스 우수의원 표창",
        issuer: "구미시",
        year: 2022,
        sortOrder: 2,
        isPublic: true,
      },
    ],
    linkedTreatmentIds: [],
    linkedEquipmentIds: [],
    linkedFaqIds: [],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function swapSortOrder<T extends { id: string; sortOrder: number }>(
  items: T[],
  id: string,
  direction: "up" | "down"
): T[] {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder)
  const idx = sorted.findIndex((item) => item.id === id)
  if (idx === -1) return items
  const swapIdx = direction === "up" ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= sorted.length) return items

  const newItems = sorted.map((item) => ({ ...item }))
  const tmp = newItems[idx].sortOrder
  newItems[idx].sortOrder = newItems[swapIdx].sortOrder
  newItems[swapIdx].sortOrder = tmp
  return newItems
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const StaffContext = createContext<StaffContextType | null>(null)

export function useStaff(): StaffContextType {
  const ctx = useContext(StaffContext)
  if (!ctx) {
    throw new Error("useStaff must be used within a StaffProvider")
  }
  return ctx
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [doctors, setDoctors] = useState<DoctorData[]>(seedDoctors)

  // ── Reads ──────────────────────────────────────────────────────────────

  const getDoctor = useCallback(
    (id: string): DoctorData | undefined =>
      doctors.find((d) => d.profile.id === id),
    [doctors]
  )

  const getDoctorsByBranch = useCallback(
    (branchId: string): DoctorData[] =>
      doctors
        .filter((d) => d.profile.branchId === branchId)
        .sort((a, b) => a.profile.displayOrder - b.profile.displayOrder),
    [doctors]
  )

  // ── Create / Update / Delete profile ──────────────────────────────────

  const createDoctor = useCallback(
    (
      branchId: string,
      profile: Partial<
        Omit<StaffProfile, "id" | "branchId" | "createdAt" | "updatedAt">
      >
    ): DoctorData => {
      const now = new Date().toISOString()
      const newProfile: StaffProfile = {
        id: Date.now().toString(),
        branchId,
        name: "",
        title: "원장",
        isFeatured: false,
        isPublic: false,
        status: "draft",
        displayOrder: 99,
        chatbotPriority: false,
        pinToTop: false,
        needsReview: true,
        createdAt: now,
        updatedAt: now,
        ...profile,
      }
      const newDoctor: DoctorData = {
        profile: newProfile,
        specialties: [],
        strengths: [],
        targetCustomers: [],
        specialtyKeywords: [],
        careers: [],
        academics: [],
        publications: [],
        credentials: [],
        linkedTreatmentIds: [],
        linkedEquipmentIds: [],
        linkedFaqIds: [],
      }
      setDoctors((prev) => [...prev, newDoctor])
      return newDoctor
    },
    []
  )

  const updateProfile = useCallback(
    (doctorId: string, updates: Partial<StaffProfile>): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? {
                ...d,
                profile: {
                  ...d.profile,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                },
              }
            : d
        )
      )
    },
    []
  )

  const updateDoctorExtras = useCallback(
    (
      doctorId: string,
      updates: Partial<
        Omit<
          DoctorData,
          | "profile"
          | "careers"
          | "academics"
          | "publications"
          | "credentials"
        >
      >
    ): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId ? { ...d, ...updates } : d
        )
      )
    },
    []
  )

  // ── Careers ────────────────────────────────────────────────────────────

  const addCareer = useCallback(
    (doctorId: string, career: Omit<DoctorCareer, "id" | "doctorId">): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? {
                ...d,
                careers: [
                  ...d.careers,
                  { ...career, id: generateId(), doctorId },
                ],
              }
            : d
        )
      )
    },
    []
  )

  const updateCareer = useCallback(
    (
      doctorId: string,
      careerId: string,
      updates: Partial<DoctorCareer>
    ): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? {
                ...d,
                careers: d.careers.map((c) =>
                  c.id === careerId ? { ...c, ...updates } : c
                ),
              }
            : d
        )
      )
    },
    []
  )

  const deleteCareer = useCallback(
    (doctorId: string, careerId: string): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? { ...d, careers: d.careers.filter((c) => c.id !== careerId) }
            : d
        )
      )
    },
    []
  )

  const moveCareer = useCallback(
    (doctorId: string, careerId: string, direction: "up" | "down"): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? { ...d, careers: swapSortOrder(d.careers, careerId, direction) }
            : d
        )
      )
    },
    []
  )

  // ── Academics ──────────────────────────────────────────────────────────

  const addAcademic = useCallback(
    (
      doctorId: string,
      item: Omit<DoctorAcademic, "id" | "doctorId">
    ): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? {
                ...d,
                academics: [
                  ...d.academics,
                  { ...item, id: generateId(), doctorId },
                ],
              }
            : d
        )
      )
    },
    []
  )

  const updateAcademic = useCallback(
    (
      doctorId: string,
      id: string,
      updates: Partial<DoctorAcademic>
    ): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? {
                ...d,
                academics: d.academics.map((a) =>
                  a.id === id ? { ...a, ...updates } : a
                ),
              }
            : d
        )
      )
    },
    []
  )

  const deleteAcademic = useCallback(
    (doctorId: string, id: string): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? { ...d, academics: d.academics.filter((a) => a.id !== id) }
            : d
        )
      )
    },
    []
  )

  const moveAcademic = useCallback(
    (doctorId: string, id: string, direction: "up" | "down"): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? { ...d, academics: swapSortOrder(d.academics, id, direction) }
            : d
        )
      )
    },
    []
  )

  // ── Publications ───────────────────────────────────────────────────────

  const addPublication = useCallback(
    (
      doctorId: string,
      item: Omit<DoctorPublication, "id" | "doctorId">
    ): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? {
                ...d,
                publications: [
                  ...d.publications,
                  { ...item, id: generateId(), doctorId },
                ],
              }
            : d
        )
      )
    },
    []
  )

  const updatePublication = useCallback(
    (
      doctorId: string,
      id: string,
      updates: Partial<DoctorPublication>
    ): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? {
                ...d,
                publications: d.publications.map((p) =>
                  p.id === id ? { ...p, ...updates } : p
                ),
              }
            : d
        )
      )
    },
    []
  )

  const deletePublication = useCallback(
    (doctorId: string, id: string): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? {
                ...d,
                publications: d.publications.filter((p) => p.id !== id),
              }
            : d
        )
      )
    },
    []
  )

  // ── Credentials ────────────────────────────────────────────────────────

  const addCredential = useCallback(
    (
      doctorId: string,
      item: Omit<DoctorCredential, "id" | "doctorId">
    ): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? {
                ...d,
                credentials: [
                  ...d.credentials,
                  { ...item, id: generateId(), doctorId },
                ],
              }
            : d
        )
      )
    },
    []
  )

  const updateCredential = useCallback(
    (
      doctorId: string,
      id: string,
      updates: Partial<DoctorCredential>
    ): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? {
                ...d,
                credentials: d.credentials.map((c) =>
                  c.id === id ? { ...c, ...updates } : c
                ),
              }
            : d
        )
      )
    },
    []
  )

  const deleteCredential = useCallback(
    (doctorId: string, id: string): void => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.profile.id === doctorId
            ? {
                ...d,
                credentials: d.credentials.filter((c) => c.id !== id),
              }
            : d
        )
      )
    },
    []
  )

  // ── Bulk operations ────────────────────────────────────────────────────

  const archiveDoctor = useCallback((doctorId: string): void => {
    setDoctors((prev) =>
      prev.map((d) =>
        d.profile.id === doctorId
          ? {
              ...d,
              profile: {
                ...d.profile,
                status: "archived" as StaffStatus,
                updatedAt: new Date().toISOString(),
              },
            }
          : d
      )
    )
  }, [])

  const deleteDoctor = useCallback((doctorId: string): void => {
    setDoctors((prev) => prev.filter((d) => d.profile.id !== doctorId))
  }, [])

  const duplicateDoctor = useCallback(
    (doctorId: string): DoctorData => {
      const source = doctors.find((d) => d.profile.id === doctorId)
      if (!source) {
        throw new Error(`Doctor with id "${doctorId}" not found`)
      }
      const now = new Date().toISOString()
      const newId = Date.now().toString()

      const newDoctor: DoctorData = {
        profile: {
          ...source.profile,
          id: newId,
          name: `${source.profile.name}(복사)`,
          status: "draft",
          pinToTop: false,
          isFeatured: false,
          createdAt: now,
          updatedAt: now,
        },
        specialties: [...source.specialties],
        strengths: [...source.strengths],
        targetCustomers: [...source.targetCustomers],
        specialtyKeywords: [...source.specialtyKeywords],
        careers: source.careers.map((c) => ({
          ...c,
          id: generateId(),
          doctorId: newId,
        })),
        academics: source.academics.map((a) => ({
          ...a,
          id: generateId(),
          doctorId: newId,
        })),
        publications: source.publications.map((p) => ({
          ...p,
          id: generateId(),
          doctorId: newId,
        })),
        credentials: source.credentials.map((c) => ({
          ...c,
          id: generateId(),
          doctorId: newId,
        })),
        linkedTreatmentIds: [...source.linkedTreatmentIds],
        linkedEquipmentIds: [...source.linkedEquipmentIds],
        linkedFaqIds: [...source.linkedFaqIds],
      }

      setDoctors((prev) => [...prev, newDoctor])
      return newDoctor
    },
    [doctors]
  )

  // ── Value ──────────────────────────────────────────────────────────────

  const value: StaffContextType = {
    doctors,
    getDoctor,
    getDoctorsByBranch,
    createDoctor,
    updateProfile,
    updateDoctorExtras,
    addCareer,
    updateCareer,
    deleteCareer,
    moveCareer,
    addAcademic,
    updateAcademic,
    deleteAcademic,
    moveAcademic,
    addPublication,
    updatePublication,
    deletePublication,
    addCredential,
    updateCredential,
    deleteCredential,
    archiveDoctor,
    deleteDoctor,
    duplicateDoctor,
  }

  return (
    <StaffContext.Provider value={value}>{children}</StaffContext.Provider>
  )
}
