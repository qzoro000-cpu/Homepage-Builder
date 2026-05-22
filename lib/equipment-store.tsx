"use client"

import React, { createContext, useCallback, useContext, useState } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EquipmentStatus = "draft" | "published" | "hidden" | "archived"

export type AssetType =
  | "대표이미지"
  | "상세이미지"
  | "비포애프터"
  | "제조사브로슈어"
  | "시술안내PDF"
  | "교육자료"
  | "홍보영상"
  | "시술영상"
  | "홈페이지비주얼"
  | "랜딩소스"

export type AssetScope = "hq_common" | "branch_specific"

export type EquipmentAsset = {
  id: string
  equipmentId: string        // BranchEquipment.id or EquipmentMaster.id
  scope: AssetScope          // "hq_common" = 본사 공통, "branch_specific" = 지점 전용
  branchId?: string
  inheritedFromMaster: boolean
  hiddenInBranch: boolean    // 지점에서 본사 자산 숨김 처리
  fileUrl: string
  fileName: string
  fileType: "image" | "pdf" | "video" | "other"
  mimeType: string
  assetType: AssetType
  title?: string
  description?: string
  thumbnailUrl?: string
  durationSeconds?: number
  pageCount?: number
  fileSizeBytes?: number
  sourceName?: string
  copyrightNote?: string
  isFeatured: boolean
  isPublic: boolean
  useForHomepage: boolean
  useForLanding: boolean
  useForChatbot: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type EquipmentProgram = {
  id: string
  equipmentId: string
  branchId: string
  programName: string
  description?: string
  isFeatured: boolean
  sortOrder: number
}

export type EquipmentPrecaution = {
  id: string
  equipmentId: string
  content: string
  sortOrder: number
  isPublic: boolean
}

/**
 * HQ-level master definition.
 * Contains default values that branch equipment can inherit or override.
 */
export type EquipmentMaster = {
  id: string               // "master_e1", "master_e2", etc.
  name: string
  englishName?: string
  modelName?: string
  category: string
  manufacturer?: string
  defaultOneLinePitch?: string
  defaultShortDescription?: string
  defaultLongDescription?: string
  defaultEnergyType?: string
  defaultBenefits: string[]
  defaultTargets: string[]
  defaultConcernAreas: string[]
  defaultKeywords: string[]
  defaultSpecialtyPoints: string[]
  defaultPrecautions: EquipmentPrecaution[]
  assets: EquipmentAsset[]  // scope: "hq_common"
  createdAt: string
  updatedAt: string
}

/**
 * Branch-level override. References a master or is standalone.
 * Fields with "local" prefix override the master's default when set.
 * When null/undefined, the master default is used (inherited).
 */
export type BranchEquipmentOverride = {
  localName?: string
  localOneLinePitch?: string
  localShortDescription?: string
  localLongDescription?: string
  localEnergyType?: string
  localProgramName?: string
  localHomepageQuote?: string
  localHighlightCopy?: string
  localCtaText?: string
  // Track which fields have been overridden
  overriddenFields: string[]  // list of field names that have local values
}

export type EquipmentProfile = {
  id: string
  branchId: string
  masterEquipmentId?: string  // null = standalone (not linked to master)
  override: BranchEquipmentOverride
  // Resolved display values (computed from master + override)
  // These are the "effective" values used for display/save
  name: string
  englishName?: string
  modelName?: string
  category: string
  manufacturer?: string
  oneLinePitch?: string
  shortDescription?: string
  longDescription?: string
  energyType?: string
  shotUnitLabel?: string
  standardShotCount?: number
  averageDurationMinutes?: number
  anesthesiaRequired?: boolean
  downtimeNote?: string
  painLevel?: "없음" | "경미" | "보통" | "강함"
  treatmentCycleGuide?: string
  contraindications?: string
  internalMemo?: string
  consultReference?: string
  chatbotExcludeNote?: string
  privateNote?: string
  manufacturerOriginalText?: string
  homepageQuote?: string
  highlightCopy?: string
  ctaExample?: string
  isFeatured: boolean
  isPublic: boolean
  isTreatmentLike: boolean
  pinToTop: boolean
  status: EquipmentStatus
  displayOrder: number
  chatbotPriority: boolean
  needsReview: boolean
  branchOwned: boolean
  branchAvailable: boolean
  introducedAt?: string
  operationSuspended: boolean
  suspensionReason?: string
  branchSpecificDescription?: string
  branchSpecificPitch?: string
  useMasterAssetsDefault: boolean  // true = 본사 자산 기본 표시
  hiddenMasterAssetIds: string[]   // master asset IDs hidden for this branch
  createdAt: string
  updatedAt: string
}

export type EquipmentData = {
  profile: EquipmentProfile
  benefits: string[]
  targets: string[]
  concernAreas: string[]
  keywords: string[]
  customerSearchTerms: string[]
  specialtyPoints: string[]
  companionTreatments: string[]
  precautions: EquipmentPrecaution[]
  programs: EquipmentProgram[]
  assets: EquipmentAsset[]          // branch-specific assets
  linkedTreatmentIds: string[]
  linkedDoctorIds: string[]
  linkedFaqIds: string[]
  linkedEventIds: string[]
}

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

type EquipmentContextType = {
  masters: EquipmentMaster[]
  equipmentList: EquipmentData[]
  // Master operations
  getMaster: (masterId: string) => EquipmentMaster | undefined
  getAllMasters: () => EquipmentMaster[]
  createMaster: (partial: Partial<Omit<EquipmentMaster, "id" | "createdAt" | "updatedAt">>) => EquipmentMaster
  updateMaster: (masterId: string, updates: Partial<EquipmentMaster>) => void
  // Branch equipment
  getEquipment: (id: string) => EquipmentData | undefined
  getEquipmentByBranch: (branchId: string) => EquipmentData[]
  createEquipment: (
    branchId: string,
    partial: Partial<Omit<EquipmentProfile, "id" | "branchId" | "createdAt" | "updatedAt">>
  ) => EquipmentData
  /** Create branch equipment from a master (inherits defaults) */
  createEquipmentFromMaster: (branchId: string, masterId: string) => EquipmentData
  updateProfile: (equipmentId: string, updates: Partial<EquipmentProfile>) => void
  updateExtras: (
    equipmentId: string,
    updates: Partial<Omit<EquipmentData, "profile" | "precautions" | "programs" | "assets">>
  ) => void
  /** Override a field in branch equipment (adds to overriddenFields) */
  setFieldOverride: (equipmentId: string, fieldName: string, value: string) => void
  /** Reset a field to master default (removes from overriddenFields) */
  resetFieldToMaster: (equipmentId: string, fieldName: string) => void
  /** Sync all overrideable fields from master (only non-overridden ones) */
  syncFromMaster: (equipmentId: string) => void
  // Precautions
  addPrecaution: (equipmentId: string, item: Omit<EquipmentPrecaution, "id" | "equipmentId">) => void
  updatePrecaution: (equipmentId: string, id: string, updates: Partial<EquipmentPrecaution>) => void
  deletePrecaution: (equipmentId: string, id: string) => void
  movePrecaution: (equipmentId: string, id: string, direction: "up" | "down") => void
  // Programs
  addProgram: (equipmentId: string, item: Omit<EquipmentProgram, "id" | "equipmentId">) => void
  updateProgram: (equipmentId: string, id: string, updates: Partial<EquipmentProgram>) => void
  deleteProgram: (equipmentId: string, id: string) => void
  // Assets (unlimited, no cap)
  addAsset: (
    equipmentId: string,
    item: Omit<EquipmentAsset, "id" | "equipmentId" | "createdAt" | "updatedAt">
  ) => EquipmentAsset
  updateAsset: (equipmentId: string, assetId: string, updates: Partial<EquipmentAsset>) => void
  deleteAsset: (equipmentId: string, assetId: string) => void
  reorderAsset: (equipmentId: string, assetId: string, direction: "up" | "down") => void
  /** Get combined assets: master HQ assets + branch assets (respecting hiddenMasterAssetIds) */
  getEffectiveAssets: (equipmentId: string) => EquipmentAsset[]
  /** Hide/show a master asset for this branch */
  toggleMasterAssetVisibility: (equipmentId: string, masterAssetId: string) => void
  // Lifecycle
  archiveEquipment: (equipmentId: string) => void
  deleteEquipment: (equipmentId: string) => void
  duplicateEquipment: (equipmentId: string) => EquipmentData
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const NOW = "2026-04-16T00:00:00.000Z"

// ---------------------------------------------------------------------------
// EquipmentMaster seed records
// ---------------------------------------------------------------------------

const seedMasters: EquipmentMaster[] = [
  // -------------------------------------------------------------------------
  // master_e1: 울쎄라
  // -------------------------------------------------------------------------
  {
    id: "master_e1",
    name: "울쎄라",
    englishName: "Ulthera",
    modelName: "Ulthera® System",
    category: "초음파 리프팅",
    manufacturer: "Merz",
    defaultOneLinePitch: "FDA 승인 초음파 리프팅 — 피부 진피층 직접 자극",
    defaultShortDescription:
      "울쎄라는 고집적 초음파(HIFU) 기술로 피부 진피층과 근막층(SMAS)에 직접 에너지를 전달하여 자연스러운 리프팅 효과를 제공하는 FDA 승인 장비입니다.",
    defaultLongDescription:
      "울쎄라는 의료용 초음파 이미징 기술을 결합한 세계 최초 FDA 승인 비수술 리프팅 장비입니다. 1.5mm·3.0mm·4.5mm 세 가지 깊이 카트리지로 표피 손상 없이 진피 깊은 곳과 SMAS 근막층에 열 응고점을 형성합니다. 콜라겐 신생 합성을 유도해 시술 후 2~3개월에 걸쳐 점진적인 리프팅 효과가 나타나며, 결과는 1~1.5년 지속됩니다.",
    defaultEnergyType: "집속 초음파(HIFU)",
    defaultBenefits: ["탄력 개선", "리프팅", "윤곽 정리"],
    defaultTargets: ["탄력 저하 고객", "30~50대 여성", "초기 노화"],
    defaultConcernAreas: ["얼굴 전체", "목", "이마"],
    defaultKeywords: ["울쎄라", "HIFU", "초음파 리프팅"],
    defaultSpecialtyPoints: [
      "FDA 승인 비수술 리프팅",
      "SMAS층 직접 자극",
      "당일 시술·일상 복귀 가능",
    ],
    defaultPrecautions: [
      {
        id: "pre_m_e1_1",
        equipmentId: "master_e1",
        content: "임산부·수유 중인 경우 시술 불가",
        sortOrder: 1,
        isPublic: true,
      },
    ],
    assets: [
      {
        id: "hq_asset_e1_1",
        equipmentId: "master_e1",
        scope: "hq_common",
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: "/assets/ulthera_hq.jpg",
        fileName: "ulthera_hq.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
        assetType: "대표이미지",
        isFeatured: true,
        isPublic: true,
        useForHomepage: true,
        useForLanding: true,
        useForChatbot: false,
        sortOrder: 1,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },

  // -------------------------------------------------------------------------
  // master_e2: 피코슈어
  // -------------------------------------------------------------------------
  {
    id: "master_e2",
    name: "피코슈어",
    englishName: "PicoSure",
    modelName: "PicoSure® Pro",
    category: "피코레이저",
    manufacturer: "Cynosure",
    defaultOneLinePitch: "피코초 레이저로 색소·잡티 개선",
    defaultShortDescription:
      "피코슈어는 755nm 피코초 레이저 에너지를 극초단파로 조사해 색소 병변 파괴와 피부 재생을 동시에 유도하는 차세대 레이저 장비입니다.",
    defaultEnergyType: "피코초 레이저 (755nm / 532nm / 1064nm)",
    defaultBenefits: ["색소 개선", "모공 축소", "피부 재생"],
    defaultTargets: ["잡티·색소 고민", "피부 결 개선"],
    defaultConcernAreas: ["얼굴 전체", "손등"],
    defaultKeywords: ["피코슈어", "피코레이저", "색소 제거", "기미"],
    defaultSpecialtyPoints: [
      "세계 최초 피코초 레이저로 색소 정밀 파괴",
      "FLA 어플리케이터로 피부 재생 동시 가능",
      "짧은 회복 기간",
    ],
    defaultPrecautions: [
      {
        id: "pre_m_e2_1",
        equipmentId: "master_e2",
        content: "광과민성 약물 복용 시 상담 필요",
        sortOrder: 1,
        isPublic: true,
      },
    ],
    assets: [],
    createdAt: NOW,
    updatedAt: NOW,
  },

  // -------------------------------------------------------------------------
  // master_e3: 써마지 FLX
  // -------------------------------------------------------------------------
  {
    id: "master_e3",
    name: "써마지 FLX",
    englishName: "Thermage FLX",
    modelName: "Thermage FLX™",
    category: "고주파 리프팅",
    manufacturer: "Solta Medical",
    defaultOneLinePitch: "단회 고주파 피부 탄력 강화",
    defaultShortDescription:
      "써마지 FLX는 단극성 고주파(RF) 에너지로 피부 콜라겐을 즉각 수축시키고 장기적인 재생을 유도하는 피부 탄력 개선 장비입니다.",
    defaultEnergyType: "단극성 고주파(Monopolar RF)",
    defaultBenefits: ["탄력 개선", "피부 타이트닝"],
    defaultTargets: ["피부 처짐 고민", "40대 이상"],
    defaultConcernAreas: ["얼굴", "눈가", "복부"],
    defaultKeywords: ["써마지", "써마지FLX", "고주파 리프팅", "RF"],
    defaultSpecialtyPoints: [
      "진동 기능(Vibration) 추가로 시술 편안함 향상",
      "1회 시술로 최대 2년 효과 지속",
      "눈가 전용 팁으로 섬세한 눈 주변 리프팅 가능",
    ],
    defaultPrecautions: [],
    assets: [],
    createdAt: NOW,
    updatedAt: NOW,
  },

  // -------------------------------------------------------------------------
  // master_e4: 모피어스8
  // -------------------------------------------------------------------------
  {
    id: "master_e4",
    name: "모피어스8",
    englishName: "Morpheus8",
    modelName: "Morpheus8™",
    category: "고주파 미세침",
    manufacturer: "InMode",
    defaultOneLinePitch: "RF 미세침 복합 리모델링",
    defaultShortDescription:
      "모피어스8은 마이크로니들링과 고주파 에너지를 결합해 진피 깊은 층까지 콜라겐 재생을 촉진하는 피부 리모델링 장비입니다.",
    defaultEnergyType: "마이크로니들 RF (고주파 미세침)",
    defaultBenefits: ["피부 리모델링", "탄력 개선", "흉터 개선"],
    defaultTargets: ["피부 결 고민", "흉터·여드름 흔적"],
    defaultConcernAreas: ["볼", "턱선", "이마"],
    defaultKeywords: ["모피어스8", "RF 미세침", "마이크로니들링", "모공", "흉터"],
    defaultSpecialtyPoints: [
      "1~7mm 깊이 조절로 다층 피부 리모델링 가능",
      "Burst Mode로 열 손상 최소화",
      "마이크로니들 + RF 시너지로 콜라겐 재생 극대화",
    ],
    defaultPrecautions: [],
    assets: [],
    createdAt: NOW,
    updatedAt: NOW,
  },

  // -------------------------------------------------------------------------
  // master_e5: 쿨스컬프팅 엘리트
  // -------------------------------------------------------------------------
  {
    id: "master_e5",
    name: "쿨스컬프팅 엘리트",
    englishName: "CoolSculpting Elite",
    modelName: "CoolSculpting® Elite",
    category: "냉각지방분해",
    manufacturer: "Allergan",
    defaultOneLinePitch: "비수술 냉각 지방 분해",
    defaultShortDescription:
      "쿨스컬프팅 엘리트는 FDA 승인 냉각 기술(Cryolipolysis)로 피부 손상 없이 지방 세포를 선택적으로 사멸시키는 비수술 지방 감소 장비입니다.",
    defaultEnergyType: "냉각 지방분해 (Cryolipolysis)",
    defaultBenefits: ["지방 분해", "체형 교정"],
    defaultTargets: ["비수술 체형 관리", "복부·허벅지 고민"],
    defaultConcernAreas: ["복부", "허벅지", "팔"],
    defaultKeywords: ["쿨스컬프팅", "냉각지방분해", "Cryolipolysis", "비수술 다이어트"],
    defaultSpecialtyPoints: [
      "FDA 승인 냉각 기술로 안전하게 지방 세포 사멸",
      "듀얼 어플리케이터 동시 적용으로 시술 시간 50% 단축",
      "C형 어플리케이터로 접촉 면적 18% 향상",
    ],
    defaultPrecautions: [],
    assets: [],
    createdAt: NOW,
    updatedAt: NOW,
  },

  // -------------------------------------------------------------------------
  // master_e6: 젠틀맥스 프로
  // -------------------------------------------------------------------------
  {
    id: "master_e6",
    name: "젠틀맥스 프로",
    englishName: "Gentle Max Pro",
    modelName: "GentleMax Pro®",
    category: "듀얼 파장 레이저",
    manufacturer: "Syneron-Candela",
    defaultOneLinePitch: "755nm + 1064nm 듀얼 파장 제모·색소 레이저",
    defaultShortDescription:
      "젠틀맥스 프로는 755nm 알렉산드라이트와 1064nm Nd:YAG 레이저를 하나의 기기에 탑재한 듀얼 파장 플랫폼으로, 제모·색소·혈관 시술 모두 가능합니다.",
    defaultEnergyType: "알렉산드라이트 755nm + Nd:YAG 1064nm 듀얼 레이저",
    defaultBenefits: ["제모", "색소 개선", "혈관 치료"],
    defaultTargets: ["제모 희망 고객", "색소 고민"],
    defaultConcernAreas: ["얼굴", "다리", "겨드랑이"],
    defaultKeywords: ["젠틀맥스프로", "레이저 제모", "알렉산드라이트", "Nd:YAG", "혈관 레이저"],
    defaultSpecialtyPoints: [
      "755nm + 1064nm 듀얼 파장으로 모든 피부 타입 대응",
      "DCD 냉각 시스템으로 시술 중 표피 보호 및 통증 최소화",
      "제모·색소·혈관을 한 기기로 원스톱 처리",
    ],
    defaultPrecautions: [],
    assets: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
]

// ---------------------------------------------------------------------------
// BranchEquipment (EquipmentData) seed records
// ---------------------------------------------------------------------------

const seedEquipment: EquipmentData[] = [
  // -------------------------------------------------------------------------
  // eq_e1: 울쎄라 — main branch (has oneLinePitch override)
  // -------------------------------------------------------------------------
  {
    profile: {
      id: "eq_e1",
      branchId: "main",
      masterEquipmentId: "master_e1",
      override: {
        localOneLinePitch: "타토아 강남 전용 600샷 울쎄라 프로그램",
        overriddenFields: ["oneLinePitch"],
      },
      name: "울쎄라",
      englishName: "Ulthera",
      modelName: "Ulthera® System",
      category: "초음파 리프팅",
      manufacturer: "Merz",
      oneLinePitch: "타토아 강남 전용 600샷 울쎄라 프로그램",
      shortDescription:
        "울쎄라는 고집적 초음파(HIFU) 기술로 피부 진피층과 근막층(SMAS)에 직접 에너지를 전달하여 자연스러운 리프팅 효과를 제공하는 FDA 승인 장비입니다.",
      longDescription:
        "울쎄라는 의료용 초음파 이미징 기술을 결합한 세계 최초 FDA 승인 비수술 리프팅 장비입니다. 1.5mm·3.0mm·4.5mm 세 가지 깊이 카트리지로 표피 손상 없이 진피 깊은 곳과 SMAS 근막층에 열 응고점을 형성합니다. 콜라겐 신생 합성을 유도해 시술 후 2~3개월에 걸쳐 점진적인 리프팅 효과가 나타나며, 결과는 1~1.5년 지속됩니다.",
      energyType: "집속 초음파(HIFU)",
      shotUnitLabel: "라인",
      standardShotCount: 600,
      averageDurationMinutes: 60,
      anesthesiaRequired: true,
      downtimeNote: "다운타임 거의 없음, 시술 직후 일시적 홍조 가능",
      painLevel: "보통",
      treatmentCycleGuide: "1회 시술 후 6~12개월 유지, 필요 시 추가 시술",
      contraindications: "임산부, 금속 임플란트 삽입 부위, 활성 여드름 및 피부 감염 부위",
      internalMemo: "카트리지 소모품 재고 주기적 확인 필요",
      consultReference: "상담 시 쇼트 수 및 카트리지 조합 설명 필수",
      homepageQuote: "당신의 피부 속 콜라겐이 깨어납니다",
      highlightCopy: "1회로 느끼는 정통 리프팅의 차이",
      ctaExample: "지금 울쎄라 상담 예약하기",
      isFeatured: true,
      isPublic: true,
      isTreatmentLike: false,
      pinToTop: false,
      status: "published",
      displayOrder: 1,
      chatbotPriority: true,
      needsReview: false,
      branchOwned: true,
      branchAvailable: true,
      introducedAt: "2020-03",
      operationSuspended: false,
      useMasterAssetsDefault: true,
      hiddenMasterAssetIds: [],
      createdAt: NOW,
      updatedAt: NOW,
    },
    benefits: ["탄력 개선", "리프팅", "윤곽 정리"],
    targets: ["탄력 저하 고객", "30~50대 여성", "초기 노화"],
    concernAreas: ["얼굴 전체", "목", "이마"],
    keywords: ["울쎄라", "HIFU", "초음파 리프팅"],
    customerSearchTerms: ["처진 피부 리프팅", "비수술 얼굴 당김", "울쎄라 가격", "HIFU 시술"],
    specialtyPoints: [
      "FDA 승인 비수술 리프팅",
      "SMAS층 직접 자극",
      "당일 시술·일상 복귀 가능",
    ],
    companionTreatments: ["써마지 FLX", "보톡스 (이마·눈가)", "필러 (볼·팔자)"],
    precautions: [
      {
        id: "pre_e1_1",
        equipmentId: "eq_e1",
        content: "임산부·수유 중인 경우 시술 불가",
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pre_e1_2",
        equipmentId: "eq_e1",
        content: "시술 후 2주간 사우나·찜질방 등 고열 환경 노출을 피해 주세요.",
        sortOrder: 2,
        isPublic: true,
      },
    ],
    programs: [
      {
        id: "prog_e1_1",
        equipmentId: "eq_e1",
        branchId: "main",
        programName: "울쎄라 풀페이스 600샷 패키지",
        description: "얼굴 전체 600샷 + 넥 100샷 포함, 마취 크림 기본 제공",
        isFeatured: true,
        sortOrder: 1,
      },
    ],
    assets: [
      {
        id: "asset_e1_1",
        equipmentId: "eq_e1",
        scope: "branch_specific",
        branchId: "main",
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: "/assets/ulthera_main_ba.jpg",
        fileName: "ulthera_before_after.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
        assetType: "비포애프터",
        title: "울쎄라 비포애프터",
        isFeatured: false,
        isPublic: true,
        useForHomepage: true,
        useForLanding: false,
        useForChatbot: false,
        sortOrder: 1,
        createdAt: "2026-03-01T00:00:00Z",
        updatedAt: "2026-03-01T00:00:00Z",
      },
    ],
    linkedTreatmentIds: [],
    linkedDoctorIds: [],
    linkedFaqIds: [],
    linkedEventIds: [],
  },

  // -------------------------------------------------------------------------
  // eq_e2: 피코슈어 — main branch (no overrides, inherits all)
  // -------------------------------------------------------------------------
  {
    profile: {
      id: "eq_e2",
      branchId: "main",
      masterEquipmentId: "master_e2",
      override: { overriddenFields: [] },
      name: "피코슈어",
      englishName: "PicoSure",
      modelName: "PicoSure® Pro",
      category: "피코레이저",
      manufacturer: "Cynosure",
      oneLinePitch: "피코초 레이저로 색소·잡티 개선",
      shortDescription:
        "피코슈어는 755nm 피코초 레이저 에너지를 극초단파로 조사해 색소 병변 파괴와 피부 재생을 동시에 유도하는 차세대 레이저 장비입니다.",
      energyType: "피코초 레이저 (755nm / 532nm / 1064nm)",
      shotUnitLabel: "샷",
      standardShotCount: 500,
      averageDurationMinutes: 30,
      anesthesiaRequired: false,
      downtimeNote: "시술 후 1~3일 발적, 가피(딱지) 형성 가능",
      painLevel: "경미",
      treatmentCycleGuide: "색소 병변: 3~5회 권장 / 피부 재생(FLA): 3~4회 권장",
      contraindications: "광과민성 약물 복용자, 임산부, 켈로이드 체질",
      internalMemo: "FLA 렌즈 교체 주기 관리 필요",
      consultReference: "파장 선택(755/532/1064) 및 적응증 안내 중요",
      homepageQuote: "잡티 없는 맑은 피부, 피코슈어로 시작하세요",
      highlightCopy: "피코초의 속도로, 결점 없는 피부로",
      ctaExample: "피코슈어 피부 톤업 상담 신청",
      isFeatured: true,
      isPublic: true,
      isTreatmentLike: false,
      pinToTop: false,
      status: "published",
      displayOrder: 2,
      chatbotPriority: true,
      needsReview: false,
      branchOwned: true,
      branchAvailable: true,
      introducedAt: "2021-06",
      operationSuspended: false,
      useMasterAssetsDefault: true,
      hiddenMasterAssetIds: [],
      createdAt: NOW,
      updatedAt: NOW,
    },
    benefits: ["색소 개선", "모공 축소", "피부 재생"],
    targets: ["잡티·색소 고민", "피부 결 개선"],
    concernAreas: ["얼굴 전체", "손등"],
    keywords: ["피코슈어", "피코레이저", "색소 제거", "기미"],
    customerSearchTerms: ["기미 레이저", "주근깨 없애는 법", "피코레이저 가격", "잡티 제거"],
    specialtyPoints: [
      "세계 최초 피코초 레이저로 색소 정밀 파괴",
      "FLA 어플리케이터로 피부 재생 동시 가능",
      "짧은 회복 기간",
    ],
    companionTreatments: ["이온토포레시스 미백", "비타민C 수액", "물광 주사"],
    precautions: [
      {
        id: "pre_e2_1",
        equipmentId: "eq_e2",
        content: "광과민성 약물 복용 시 상담 필요",
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pre_e2_2",
        equipmentId: "eq_e2",
        content: "시술 후 1주간 자외선 차단제(SPF 50 이상)를 반드시 사용하고 직사광선을 피해 주세요.",
        sortOrder: 2,
        isPublic: true,
      },
    ],
    programs: [
      {
        id: "prog_e2_1",
        equipmentId: "eq_e2",
        branchId: "main",
        programName: "피코슈어 토닝 + FLA 콤비 패키지",
        description: "전안면 토닝 + FLA 재생 동시 시술, 3회 패키지 구성",
        isFeatured: true,
        sortOrder: 1,
      },
    ],
    assets: [
      {
        id: "asset_e2_1",
        equipmentId: "eq_e2",
        scope: "branch_specific",
        branchId: "main",
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: "/assets/placeholder.jpg",
        fileName: "picosure_main.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
        assetType: "대표이미지",
        title: "피코슈어 대표 이미지",
        isFeatured: true,
        isPublic: true,
        useForHomepage: true,
        useForLanding: true,
        useForChatbot: false,
        sortOrder: 1,
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: "asset_e2_2",
        equipmentId: "eq_e2",
        scope: "branch_specific",
        branchId: "main",
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: "/assets/placeholder.jpg",
        fileName: "picosure_detail.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
        assetType: "상세이미지",
        title: "피코슈어 상세 이미지",
        isFeatured: false,
        isPublic: true,
        useForHomepage: false,
        useForLanding: false,
        useForChatbot: false,
        sortOrder: 2,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    linkedTreatmentIds: [],
    linkedDoctorIds: [],
    linkedFaqIds: [],
    linkedEventIds: [],
  },

  // -------------------------------------------------------------------------
  // eq_e3: 써마지 FLX — main branch (no overrides)
  // -------------------------------------------------------------------------
  {
    profile: {
      id: "eq_e3",
      branchId: "main",
      masterEquipmentId: "master_e3",
      override: { overriddenFields: [] },
      name: "써마지 FLX",
      englishName: "Thermage FLX",
      modelName: "Thermage FLX™",
      category: "고주파 리프팅",
      manufacturer: "Solta Medical",
      oneLinePitch: "단회 고주파 피부 탄력 강화",
      shortDescription:
        "써마지 FLX는 단극성 고주파(RF) 에너지로 피부 콜라겐을 즉각 수축시키고 장기적인 재생을 유도하는 피부 탄력 개선 장비입니다.",
      energyType: "단극성 고주파(Monopolar RF)",
      shotUnitLabel: "패스",
      standardShotCount: 900,
      averageDurationMinutes: 75,
      anesthesiaRequired: false,
      downtimeNote: "시술 직후 일시적 홍조·부기, 다운타임 없음",
      painLevel: "경미",
      treatmentCycleGuide: "1년 1~2회 시술 권장",
      contraindications: "체내 금속 임플란트, 심박조율기 착용자, 임산부",
      internalMemo: "팁 소모품 단가 관리 중요, 패스 수 기록 유지",
      consultReference: "팁 종류 및 패스 수에 따른 가격 안내 필요",
      homepageQuote: "콜라겐이 다시 살아나는 순간",
      highlightCopy: "단 1회, 2년을 바라보는 리프팅",
      ctaExample: "써마지 FLX 1회 체험 예약",
      isFeatured: false,
      isPublic: true,
      isTreatmentLike: false,
      pinToTop: false,
      status: "published",
      displayOrder: 3,
      chatbotPriority: false,
      needsReview: false,
      branchOwned: true,
      branchAvailable: true,
      introducedAt: "2019-09",
      operationSuspended: false,
      useMasterAssetsDefault: true,
      hiddenMasterAssetIds: [],
      createdAt: NOW,
      updatedAt: NOW,
    },
    benefits: ["탄력 개선", "피부 타이트닝"],
    targets: ["피부 처짐 고민", "40대 이상"],
    concernAreas: ["얼굴", "눈가", "복부"],
    keywords: ["써마지", "써마지FLX", "고주파 리프팅", "RF"],
    customerSearchTerms: ["써마지 가격", "고주파 피부 리프팅", "눈꺼풀 처짐", "피부 탄력 강화"],
    specialtyPoints: [
      "진동 기능(Vibration) 추가로 시술 편안함 향상",
      "1회 시술로 최대 2년 효과 지속",
      "눈가 전용 팁으로 섬세한 눈 주변 리프팅 가능",
    ],
    companionTreatments: ["울쎄라", "보톡스 (이마·미간)", "필러 (눈가·팔자)"],
    precautions: [
      {
        id: "pre_e3_1",
        equipmentId: "eq_e3",
        content: "시술 후 충분한 보습과 자외선 차단이 효과 유지에 도움이 됩니다.",
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pre_e3_2",
        equipmentId: "eq_e3",
        content: "체내 금속 임플란트, 심박조율기가 있는 경우 시술이 불가합니다. 반드시 사전 고지 바랍니다.",
        sortOrder: 2,
        isPublic: true,
      },
    ],
    programs: [
      {
        id: "prog_e3_1",
        equipmentId: "eq_e3",
        branchId: "main",
        programName: "써마지 FLX 풀페이스 + 아이 콤보",
        description: "얼굴 전체(Face Tip) + 눈가(Total Tip) 동시 시술 패키지",
        isFeatured: true,
        sortOrder: 1,
      },
    ],
    assets: [
      {
        id: "asset_e3_1",
        equipmentId: "eq_e3",
        scope: "branch_specific",
        branchId: "main",
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: "/assets/placeholder.jpg",
        fileName: "thermage_flx_main.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
        assetType: "대표이미지",
        title: "써마지 FLX 대표 이미지",
        isFeatured: true,
        isPublic: true,
        useForHomepage: true,
        useForLanding: true,
        useForChatbot: false,
        sortOrder: 1,
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: "asset_e3_2",
        equipmentId: "eq_e3",
        scope: "branch_specific",
        branchId: "main",
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: "/assets/placeholder.jpg",
        fileName: "thermage_flx_brochure.pdf",
        fileType: "pdf",
        mimeType: "application/pdf",
        assetType: "제조사브로슈어",
        title: "써마지 FLX 제조사 브로슈어",
        pageCount: 8,
        isFeatured: false,
        isPublic: false,
        useForHomepage: false,
        useForLanding: false,
        useForChatbot: false,
        sortOrder: 2,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    linkedTreatmentIds: [],
    linkedDoctorIds: [],
    linkedFaqIds: [],
    linkedEventIds: [],
  },

  // -------------------------------------------------------------------------
  // eq_e4: 모피어스8 — sinsa branch
  // -------------------------------------------------------------------------
  {
    profile: {
      id: "eq_e4",
      branchId: "sinsa",
      masterEquipmentId: "master_e4",
      override: { overriddenFields: [] },
      name: "모피어스8",
      englishName: "Morpheus8",
      modelName: "Morpheus8™",
      category: "고주파 미세침",
      manufacturer: "InMode",
      oneLinePitch: "RF 미세침 복합 리모델링",
      shortDescription:
        "모피어스8은 마이크로니들링과 고주파 에너지를 결합해 진피 깊은 층까지 콜라겐 재생을 촉진하는 피부 리모델링 장비입니다.",
      longDescription:
        "모피어스8은 24개의 미세침이 피부에 균일하게 삽입되면서 동시에 고주파 에너지를 방출해 피부 리모델링 효과를 극대화합니다. 침의 깊이는 1~7mm까지 조절 가능하여 표피부터 피하지방층 경계까지 다양한 깊이를 타깃으로 할 수 있습니다. 여드름 흉터·넓은 모공·주름·피부 처짐·이중턱 시술에 효과적이며, 열 피해를 최소화하는 Burst Mode로 안전성을 높였습니다.",
      energyType: "마이크로니들 RF (고주파 미세침)",
      shotUnitLabel: "패스",
      standardShotCount: 200,
      averageDurationMinutes: 50,
      anesthesiaRequired: true,
      downtimeNote: "시술 후 3~5일 발적·부기, 미세 가피 형성",
      painLevel: "보통",
      treatmentCycleGuide: "3~4주 간격 3회 기본, 이후 유지 시술",
      contraindications: "금속 임플란트, 켈로이드 체질, 활성 여드름·피부 감염",
      internalMemo: "팁 1회용 교체 철저히 준수",
      consultReference: "침 깊이·에너지 레벨 조합 설명으로 차별화",
      homepageQuote: "피부 리모델링의 새로운 기준",
      highlightCopy: "깊이 차원이 다른 RF 미세침 시술",
      ctaExample: "모피어스8 모공·흉터 상담 예약",
      isFeatured: true,
      isPublic: true,
      isTreatmentLike: false,
      pinToTop: false,
      status: "published",
      displayOrder: 1,
      chatbotPriority: true,
      needsReview: false,
      branchOwned: true,
      branchAvailable: true,
      introducedAt: "2022-01",
      operationSuspended: false,
      useMasterAssetsDefault: true,
      hiddenMasterAssetIds: [],
      createdAt: NOW,
      updatedAt: NOW,
    },
    benefits: ["피부 리모델링", "탄력 개선", "흉터 개선"],
    targets: ["피부 결 고민", "흉터·여드름 흔적"],
    concernAreas: ["볼", "턱선", "이마"],
    keywords: ["모피어스8", "RF 미세침", "마이크로니들링", "모공", "흉터"],
    customerSearchTerms: ["여드름 흉터 치료", "넓은 모공 없애는 법", "RF 미세침 가격", "모피어스8 효과"],
    specialtyPoints: [
      "1~7mm 깊이 조절로 다층 피부 리모델링 가능",
      "Burst Mode로 열 손상 최소화",
      "마이크로니들 + RF 시너지로 콜라겐 재생 극대화",
    ],
    companionTreatments: ["피코레이저 (색소 정리)", "스킨보어 (피부 진정)", "LED 광치료"],
    precautions: [
      {
        id: "pre_e4_1",
        equipmentId: "eq_e4",
        content: "시술 후 3~5일간 심한 운동, 사우나, 음주를 피해 주세요.",
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pre_e4_2",
        equipmentId: "eq_e4",
        content: "시술 부위 미세 가피는 억지로 제거하지 말고 자연 탈락을 기다려 주세요.",
        sortOrder: 2,
        isPublic: true,
      },
    ],
    programs: [
      {
        id: "prog_e4_1",
        equipmentId: "eq_e4",
        branchId: "sinsa",
        programName: "모피어스8 흉터케어 3회 패키지",
        description: "여드름 흉터 집중 케어, 3주 간격 3회, 고주파 물광 마무리 포함",
        isFeatured: true,
        sortOrder: 1,
      },
    ],
    assets: [
      {
        id: "asset_e4_1",
        equipmentId: "eq_e4",
        scope: "branch_specific",
        branchId: "sinsa",
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: "/assets/placeholder.jpg",
        fileName: "morpheus8_main.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
        assetType: "대표이미지",
        title: "모피어스8 대표 이미지",
        isFeatured: true,
        isPublic: true,
        useForHomepage: true,
        useForLanding: true,
        useForChatbot: false,
        sortOrder: 1,
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: "asset_e4_2",
        equipmentId: "eq_e4",
        scope: "branch_specific",
        branchId: "sinsa",
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: "/assets/placeholder.jpg",
        fileName: "morpheus8_before_after.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
        assetType: "비포애프터",
        title: "모피어스8 비포애프터",
        isFeatured: false,
        isPublic: true,
        useForHomepage: false,
        useForLanding: true,
        useForChatbot: false,
        sortOrder: 2,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    linkedTreatmentIds: [],
    linkedDoctorIds: [],
    linkedFaqIds: [],
    linkedEventIds: [],
  },

  // -------------------------------------------------------------------------
  // eq_e5: 쿨스컬프팅 엘리트 — sinsa branch
  // -------------------------------------------------------------------------
  {
    profile: {
      id: "eq_e5",
      branchId: "sinsa",
      masterEquipmentId: "master_e5",
      override: { overriddenFields: [] },
      name: "쿨스컬프팅 엘리트",
      englishName: "CoolSculpting Elite",
      modelName: "CoolSculpting® Elite",
      category: "냉각지방분해",
      manufacturer: "Allergan",
      oneLinePitch: "비수술 냉각 지방 분해",
      shortDescription:
        "쿨스컬프팅 엘리트는 FDA 승인 냉각 기술(Cryolipolysis)로 피부 손상 없이 지방 세포를 선택적으로 사멸시키는 비수술 지방 감소 장비입니다.",
      longDescription:
        "쿨스컬프팅 엘리트는 지방 세포가 일반 세포보다 낮은 온도에서 손상된다는 원리(Cryolipolysis)를 이용합니다. 2개의 듀얼 어플리케이터를 동시에 적용해 시술 시간을 단축했으며, 개선된 C형 어플리케이터로 접촉 면적을 18% 넓혀 더 넓은 부위를 효율적으로 커버합니다. 시술 후 4~12주에 걸쳐 지방 세포가 자연 배출되고 최대 20~25%의 지방 감소 효과가 나타납니다.",
      energyType: "냉각 지방분해 (Cryolipolysis)",
      shotUnitLabel: "사이클",
      standardShotCount: 2,
      averageDurationMinutes: 75,
      anesthesiaRequired: false,
      downtimeNote: "시술 직후 부기·멍·일시적 감각 저하 가능, 일상생활 바로 가능",
      painLevel: "경미",
      treatmentCycleGuide: "1부위 1~2회, 간격 8주 이상",
      contraindications: "임산부, 한랭글로불린혈증, 레이노 증후군, 냉각 두드러기",
      internalMemo: "어플리케이터 크기 및 부위별 매핑 사전 준비 필요",
      consultReference: "부위별 어플리케이터 선택 및 사이클 수 안내 중요",
      homepageQuote: "얼리면 빠진다, 과학이 증명한 비수술 체형 교정",
      highlightCopy: "듀얼 어플리케이터로 더 빠르게, 더 넓게",
      ctaExample: "쿨스컬프팅 엘리트 체형 상담 예약",
      isFeatured: false,
      isPublic: true,
      isTreatmentLike: false,
      pinToTop: false,
      status: "published",
      displayOrder: 2,
      chatbotPriority: false,
      needsReview: false,
      branchOwned: true,
      branchAvailable: true,
      introducedAt: "2022-05",
      operationSuspended: false,
      useMasterAssetsDefault: true,
      hiddenMasterAssetIds: [],
      createdAt: NOW,
      updatedAt: NOW,
    },
    benefits: ["지방 분해", "체형 교정"],
    targets: ["비수술 체형 관리", "복부·허벅지 고민"],
    concernAreas: ["복부", "허벅지", "팔"],
    keywords: ["쿨스컬프팅", "냉각지방분해", "Cryolipolysis", "비수술 다이어트"],
    customerSearchTerms: ["뱃살 빼는 시술", "냉각 지방분해 가격", "비수술 체형 교정", "쿨스컬프팅 효과"],
    specialtyPoints: [
      "FDA 승인 냉각 기술로 안전하게 지방 세포 사멸",
      "듀얼 어플리케이터 동시 적용으로 시술 시간 50% 단축",
      "C형 어플리케이터로 접촉 면적 18% 향상",
    ],
    companionTreatments: ["인모드 Emtone (셀룰라이트)", "고주파 바디 (탄력)", "슈링크 바디 (리프팅)"],
    precautions: [
      {
        id: "pre_e5_1",
        equipmentId: "eq_e5",
        content: "시술 직후 마사지가 효과 극대화에 도움이 되므로 시술 후 안내에 따라 충분히 받아 주세요.",
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pre_e5_2",
        equipmentId: "eq_e5",
        content: "한랭글로불린혈증, 냉각 두드러기 등 냉각 과민 병력이 있으면 반드시 사전 고지 바랍니다.",
        sortOrder: 2,
        isPublic: true,
      },
    ],
    programs: [
      {
        id: "prog_e5_1",
        equipmentId: "eq_e5",
        branchId: "sinsa",
        programName: "쿨스컬프팅 복부+옆구리 듀얼 패키지",
        description: "복부 상·하 + 양쪽 옆구리 동시 4사이클 패키지, 시술 시간 약 75분",
        isFeatured: true,
        sortOrder: 1,
      },
    ],
    assets: [
      {
        id: "asset_e5_1",
        equipmentId: "eq_e5",
        scope: "branch_specific",
        branchId: "sinsa",
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: "/assets/placeholder.jpg",
        fileName: "coolsculpting_elite_main.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
        assetType: "대표이미지",
        title: "쿨스컬프팅 엘리트 대표 이미지",
        isFeatured: true,
        isPublic: true,
        useForHomepage: true,
        useForLanding: true,
        useForChatbot: false,
        sortOrder: 1,
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: "asset_e5_2",
        equipmentId: "eq_e5",
        scope: "branch_specific",
        branchId: "sinsa",
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: "/assets/placeholder.jpg",
        fileName: "coolsculpting_elite_guide.pdf",
        fileType: "pdf",
        mimeType: "application/pdf",
        assetType: "시술안내PDF",
        title: "쿨스컬프팅 엘리트 시술 안내",
        pageCount: 4,
        isFeatured: false,
        isPublic: true,
        useForHomepage: false,
        useForLanding: false,
        useForChatbot: false,
        sortOrder: 2,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    linkedTreatmentIds: [],
    linkedDoctorIds: [],
    linkedFaqIds: [],
    linkedEventIds: [],
  },

  // -------------------------------------------------------------------------
  // eq_e6: 젠틀맥스 프로 — gumi branch
  // -------------------------------------------------------------------------
  {
    profile: {
      id: "eq_e6",
      branchId: "gumi",
      masterEquipmentId: "master_e6",
      override: { overriddenFields: [] },
      name: "젠틀맥스 프로",
      englishName: "Gentle Max Pro",
      modelName: "GentleMax Pro®",
      category: "듀얼 파장 레이저",
      manufacturer: "Syneron-Candela",
      oneLinePitch: "755nm + 1064nm 듀얼 파장 제모·색소 레이저",
      shortDescription:
        "젠틀맥스 프로는 755nm 알렉산드라이트와 1064nm Nd:YAG 레이저를 하나의 기기에 탑재한 듀얼 파장 플랫폼으로, 제모·색소·혈관 시술 모두 가능합니다.",
      longDescription:
        "젠틀맥스 프로는 세계적으로 검증된 알렉산드라이트(755nm)와 Nd:YAG(1064nm) 레이저를 동시에 보유해 피부 타입에 관계없이 폭넓은 시술을 제공합니다. 755nm는 밝은 피부의 모발 및 색소 병변에 탁월하고, 1064nm는 어두운 피부 타입이나 깊은 색소, 혈관 질환 치료에 적합합니다. 특허받은 DCD(Dynamic Cooling Device) 기술로 표피를 보호하면서 안전하게 시술할 수 있습니다.",
      energyType: "알렉산드라이트 755nm + Nd:YAG 1064nm 듀얼 레이저",
      shotUnitLabel: "샷",
      standardShotCount: 800,
      averageDurationMinutes: 40,
      anesthesiaRequired: false,
      downtimeNote: "제모: 다운타임 없음 / 혈관·색소: 1~3일 발적 가능",
      painLevel: "경미",
      treatmentCycleGuide: "제모: 4~6주 간격 6~8회 / 색소·혈관: 4주 간격 3~5회",
      contraindications: "임산부, 광과민성 약물 복용자, 선탠 직후",
      internalMemo: "DCD 냉각 가스 잔량 주기적 확인",
      consultReference: "피부 타입별 파장 선택 및 적응증 안내 중요",
      homepageQuote: "두 가지 레이저, 하나의 완벽한 솔루션",
      highlightCopy: "제모부터 혈관까지, 젠틀맥스 프로 하나로",
      ctaExample: "젠틀맥스 프로 제모 상담 예약",
      isFeatured: true,
      isPublic: true,
      isTreatmentLike: false,
      pinToTop: false,
      status: "published",
      displayOrder: 1,
      chatbotPriority: true,
      needsReview: false,
      branchOwned: true,
      branchAvailable: true,
      introducedAt: "2021-11",
      operationSuspended: false,
      useMasterAssetsDefault: true,
      hiddenMasterAssetIds: [],
      createdAt: NOW,
      updatedAt: NOW,
    },
    benefits: ["제모", "색소 개선", "혈관 치료"],
    targets: ["제모 희망 고객", "색소 고민"],
    concernAreas: ["얼굴", "다리", "겨드랑이"],
    keywords: ["젠틀맥스프로", "레이저 제모", "알렉산드라이트", "Nd:YAG", "혈관 레이저"],
    customerSearchTerms: ["레이저 제모 가격", "영구 제모", "실핏줄 없애는 법", "붉은 피부 치료"],
    specialtyPoints: [
      "755nm + 1064nm 듀얼 파장으로 모든 피부 타입 대응",
      "DCD 냉각 시스템으로 시술 중 표피 보호 및 통증 최소화",
      "제모·색소·혈관을 한 기기로 원스톱 처리",
    ],
    companionTreatments: ["피코레이저 (잔여 색소)", "진정 관리", "SPF 집중 케어"],
    precautions: [
      {
        id: "pre_e6_1",
        equipmentId: "eq_e6",
        content: "시술 2주 전부터 선탠(자외선·태닝 침대)을 삼가 주세요. 태닝 후 시술 시 화상 위험이 있습니다.",
        sortOrder: 1,
        isPublic: true,
      },
      {
        id: "pre_e6_2",
        equipmentId: "eq_e6",
        content: "제모 시술 당일 면도는 가능하나 왁싱·제모 크림은 1주 전부터 중단 바랍니다.",
        sortOrder: 2,
        isPublic: true,
      },
    ],
    programs: [
      {
        id: "prog_e6_1",
        equipmentId: "eq_e6",
        branchId: "gumi",
        programName: "젠틀맥스 프로 전신 제모 6회 패키지",
        description: "전신 주요 부위 6회 패키지, 4~6주 간격, 무료 터치업 1회 포함",
        isFeatured: true,
        sortOrder: 1,
      },
    ],
    assets: [
      {
        id: "asset_e6_1",
        equipmentId: "eq_e6",
        scope: "branch_specific",
        branchId: "gumi",
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: "/assets/placeholder.jpg",
        fileName: "gentlemax_pro_main.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
        assetType: "대표이미지",
        title: "젠틀맥스 프로 대표 이미지",
        isFeatured: true,
        isPublic: true,
        useForHomepage: true,
        useForLanding: true,
        useForChatbot: false,
        sortOrder: 1,
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: "asset_e6_2",
        equipmentId: "eq_e6",
        scope: "branch_specific",
        branchId: "gumi",
        inheritedFromMaster: false,
        hiddenInBranch: false,
        fileUrl: "/assets/placeholder.jpg",
        fileName: "gentlemax_pro_before_after.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
        assetType: "비포애프터",
        title: "젠틀맥스 프로 비포애프터",
        isFeatured: false,
        isPublic: true,
        useForHomepage: false,
        useForLanding: true,
        useForChatbot: false,
        sortOrder: 2,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    linkedTreatmentIds: [],
    linkedDoctorIds: [],
    linkedFaqIds: [],
    linkedEventIds: [],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return Date.now().toString() + "_" + Math.random().toString(36).slice(2, 7)
}

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Map of overrideable profile field name -> master default field name.
 * Used by setFieldOverride / resetFieldToMaster / syncFromMaster.
 */
const OVERRIDE_FIELD_MAP: Record<string, keyof EquipmentMaster> = {
  name: "name",
  oneLinePitch: "defaultOneLinePitch",
  shortDescription: "defaultShortDescription",
  longDescription: "defaultLongDescription",
  energyType: "defaultEnergyType",
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const EquipmentContext = createContext<EquipmentContextType | null>(null)

export function useEquipment(): EquipmentContextType {
  const ctx = useContext(EquipmentContext)
  if (!ctx) {
    throw new Error("useEquipment must be used inside <EquipmentProvider>")
  }
  return ctx
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function EquipmentProvider({ children }: { children: React.ReactNode }) {
  const [masters, setMasters] = useState<EquipmentMaster[]>(seedMasters)
  const [equipmentList, setEquipmentList] = useState<EquipmentData[]>(seedEquipment)

  // ---- Master operations --------------------------------------------------

  const getMaster = useCallback(
    (masterId: string): EquipmentMaster | undefined => {
      return masters.find((m) => m.id === masterId)
    },
    [masters]
  )

  const getAllMasters = useCallback((): EquipmentMaster[] => {
    return masters
  }, [masters])

  const createMaster = useCallback(
    (partial: Partial<Omit<EquipmentMaster, "id" | "createdAt" | "updatedAt">>): EquipmentMaster => {
      const now = nowIso()
      const newMaster: EquipmentMaster = {
        id: "master_" + uid(),
        name: partial.name ?? "",
        englishName: partial.englishName,
        modelName: partial.modelName,
        category: partial.category ?? "",
        manufacturer: partial.manufacturer,
        defaultOneLinePitch: partial.defaultOneLinePitch,
        defaultShortDescription: partial.defaultShortDescription,
        defaultLongDescription: partial.defaultLongDescription,
        defaultEnergyType: partial.defaultEnergyType,
        defaultBenefits: partial.defaultBenefits ?? [],
        defaultTargets: partial.defaultTargets ?? [],
        defaultConcernAreas: partial.defaultConcernAreas ?? [],
        defaultKeywords: partial.defaultKeywords ?? [],
        defaultSpecialtyPoints: partial.defaultSpecialtyPoints ?? [],
        defaultPrecautions: partial.defaultPrecautions ?? [],
        assets: partial.assets ?? [],
        createdAt: now,
        updatedAt: now,
      }
      setMasters((prev) => [...prev, newMaster])
      return newMaster
    },
    []
  )

  const updateMaster = useCallback((masterId: string, updates: Partial<EquipmentMaster>) => {
    setMasters((prev) =>
      prev.map((m) =>
        m.id !== masterId
          ? m
          : { ...m, ...updates, id: m.id, updatedAt: nowIso() }
      )
    )
  }, [])

  // ---- Branch equipment queries -------------------------------------------

  const getEquipment = useCallback(
    (id: string): EquipmentData | undefined => {
      return equipmentList.find((e) => e.profile.id === id)
    },
    [equipmentList]
  )

  const getEquipmentByBranch = useCallback(
    (branchId: string): EquipmentData[] => {
      return equipmentList.filter((e) => e.profile.branchId === branchId)
    },
    [equipmentList]
  )

  // ---- Create branch equipment (standalone) -------------------------------

  const createEquipment = useCallback(
    (
      branchId: string,
      partial: Partial<Omit<EquipmentProfile, "id" | "branchId" | "createdAt" | "updatedAt">>
    ): EquipmentData => {
      const now = nowIso()
      const id = "eq_" + Date.now().toString()

      const profile: EquipmentProfile = {
        id,
        branchId,
        masterEquipmentId: partial.masterEquipmentId,
        override: partial.override ?? { overriddenFields: [] },
        name: partial.name ?? "",
        englishName: partial.englishName,
        modelName: partial.modelName,
        category: partial.category ?? "",
        manufacturer: partial.manufacturer,
        oneLinePitch: partial.oneLinePitch,
        shortDescription: partial.shortDescription,
        longDescription: partial.longDescription,
        energyType: partial.energyType,
        shotUnitLabel: partial.shotUnitLabel,
        standardShotCount: partial.standardShotCount,
        averageDurationMinutes: partial.averageDurationMinutes,
        anesthesiaRequired: partial.anesthesiaRequired ?? false,
        downtimeNote: partial.downtimeNote,
        painLevel: partial.painLevel,
        treatmentCycleGuide: partial.treatmentCycleGuide,
        contraindications: partial.contraindications,
        internalMemo: partial.internalMemo,
        consultReference: partial.consultReference,
        chatbotExcludeNote: partial.chatbotExcludeNote,
        privateNote: partial.privateNote,
        manufacturerOriginalText: partial.manufacturerOriginalText,
        homepageQuote: partial.homepageQuote,
        highlightCopy: partial.highlightCopy,
        ctaExample: partial.ctaExample,
        isFeatured: partial.isFeatured ?? false,
        isPublic: partial.isPublic ?? false,
        isTreatmentLike: partial.isTreatmentLike ?? false,
        pinToTop: partial.pinToTop ?? false,
        status: partial.status ?? "draft",
        displayOrder: partial.displayOrder ?? 999,
        chatbotPriority: partial.chatbotPriority ?? false,
        needsReview: partial.needsReview ?? false,
        branchOwned: true,
        branchAvailable: partial.branchAvailable ?? true,
        introducedAt: partial.introducedAt,
        operationSuspended: partial.operationSuspended ?? false,
        suspensionReason: partial.suspensionReason,
        branchSpecificDescription: partial.branchSpecificDescription,
        branchSpecificPitch: partial.branchSpecificPitch,
        useMasterAssetsDefault: partial.useMasterAssetsDefault ?? true,
        hiddenMasterAssetIds: partial.hiddenMasterAssetIds ?? [],
        createdAt: now,
        updatedAt: now,
      }

      const newEquipment: EquipmentData = {
        profile,
        benefits: [],
        targets: [],
        concernAreas: [],
        keywords: [],
        customerSearchTerms: [],
        specialtyPoints: [],
        companionTreatments: [],
        precautions: [],
        programs: [],
        assets: [],
        linkedTreatmentIds: [],
        linkedDoctorIds: [],
        linkedFaqIds: [],
        linkedEventIds: [],
      }

      setEquipmentList((prev) => [...prev, newEquipment])
      return newEquipment
    },
    []
  )

  // ---- Create branch equipment from master --------------------------------

  const createEquipmentFromMaster = useCallback(
    (branchId: string, masterId: string): EquipmentData => {
      const master = masters.find((m) => m.id === masterId)
      if (!master) throw new Error(`Master not found: ${masterId}`)

      const now = nowIso()
      const newProfile: EquipmentProfile = {
        id: "eq_" + Date.now().toString(),
        branchId,
        masterEquipmentId: masterId,
        override: { overriddenFields: [] },
        name: master.name,
        englishName: master.englishName,
        modelName: master.modelName,
        category: master.category,
        manufacturer: master.manufacturer,
        oneLinePitch: master.defaultOneLinePitch,
        shortDescription: master.defaultShortDescription,
        longDescription: master.defaultLongDescription,
        energyType: master.defaultEnergyType,
        isFeatured: false,
        isPublic: false,
        isTreatmentLike: false,
        pinToTop: false,
        status: "draft",
        displayOrder: 999,
        chatbotPriority: false,
        needsReview: false,
        branchOwned: true,
        branchAvailable: true,
        operationSuspended: false,
        useMasterAssetsDefault: true,
        hiddenMasterAssetIds: [],
        createdAt: now,
        updatedAt: now,
      }

      const newData: EquipmentData = {
        profile: newProfile,
        benefits: [...master.defaultBenefits],
        targets: [...master.defaultTargets],
        concernAreas: [...master.defaultConcernAreas],
        keywords: [...master.defaultKeywords],
        specialtyPoints: [...master.defaultSpecialtyPoints],
        companionTreatments: [],
        customerSearchTerms: [],
        precautions: master.defaultPrecautions.map((p) => ({
          ...p,
          id: "pre_" + uid(),
          equipmentId: newProfile.id,
        })),
        programs: [],
        assets: [],
        linkedTreatmentIds: [],
        linkedDoctorIds: [],
        linkedFaqIds: [],
        linkedEventIds: [],
      }

      setEquipmentList((prev) => [...prev, newData])
      return newData
    },
    [masters]
  )

  // ---- Update profile -----------------------------------------------------

  const updateProfile = useCallback((equipmentId: string, updates: Partial<EquipmentProfile>) => {
    setEquipmentList((prev) =>
      prev.map((e) =>
        e.profile.id !== equipmentId
          ? e
          : {
              ...e,
              profile: {
                ...e.profile,
                ...updates,
                updatedAt: nowIso(),
              },
            }
      )
    )
  }, [])

  // ---- Update extras (arrays) ---------------------------------------------

  const updateExtras = useCallback(
    (
      equipmentId: string,
      updates: Partial<Omit<EquipmentData, "profile" | "precautions" | "programs" | "assets">>
    ) => {
      setEquipmentList((prev) =>
        prev.map((e) =>
          e.profile.id !== equipmentId
            ? e
            : { ...e, ...updates }
        )
      )
    },
    []
  )

  // ---- Field override / reset / sync --------------------------------------

  const setFieldOverride = useCallback(
    (equipmentId: string, fieldName: string, value: string) => {
      setEquipmentList((prev) =>
        prev.map((e) => {
          if (e.profile.id !== equipmentId) return e
          const currentOverride = e.profile.override
          const alreadyOverridden = currentOverride.overriddenFields.includes(fieldName)
          const newOverride: BranchEquipmentOverride = {
            ...currentOverride,
            overriddenFields: alreadyOverridden
              ? currentOverride.overriddenFields
              : [...currentOverride.overriddenFields, fieldName],
          }
          return {
            ...e,
            profile: {
              ...e.profile,
              [fieldName]: value,
              override: newOverride,
              updatedAt: nowIso(),
            },
          }
        })
      )
    },
    []
  )

  const resetFieldToMaster = useCallback(
    (equipmentId: string, fieldName: string) => {
      setEquipmentList((prev) =>
        prev.map((e) => {
          if (e.profile.id !== equipmentId) return e
          const masterId = e.profile.masterEquipmentId
          if (!masterId) return e

          const master = masters.find((m) => m.id === masterId)
          if (!master) return e

          const masterKey = OVERRIDE_FIELD_MAP[fieldName]
          const masterValue = masterKey ? (master[masterKey] as string | undefined) : undefined

          const newOverride: BranchEquipmentOverride = {
            ...e.profile.override,
            overriddenFields: e.profile.override.overriddenFields.filter((f) => f !== fieldName),
          }

          return {
            ...e,
            profile: {
              ...e.profile,
              [fieldName]: masterValue,
              override: newOverride,
              updatedAt: nowIso(),
            },
          }
        })
      )
    },
    [masters]
  )

  const syncFromMaster = useCallback(
    (equipmentId: string) => {
      setEquipmentList((prev) =>
        prev.map((e) => {
          if (e.profile.id !== equipmentId) return e
          const masterId = e.profile.masterEquipmentId
          if (!masterId) return e

          const master = masters.find((m) => m.id === masterId)
          if (!master) return e

          const overriddenFields = e.profile.override.overriddenFields
          const syncedUpdates: Partial<EquipmentProfile> = {}

          // Sync only fields that are NOT overridden
          for (const [profileField, masterKey] of Object.entries(OVERRIDE_FIELD_MAP)) {
            if (!overriddenFields.includes(profileField)) {
              ;(syncedUpdates as Record<string, unknown>)[profileField] = master[masterKey]
            }
          }

          return {
            ...e,
            profile: {
              ...e.profile,
              ...syncedUpdates,
              updatedAt: nowIso(),
            },
          }
        })
      )
    },
    [masters]
  )

  // ---- Precautions --------------------------------------------------------

  const addPrecaution = useCallback(
    (equipmentId: string, item: Omit<EquipmentPrecaution, "id" | "equipmentId">) => {
      setEquipmentList((prev) =>
        prev.map((e) => {
          if (e.profile.id !== equipmentId) return e
          const newItem: EquipmentPrecaution = {
            ...item,
            id: "pre_" + uid(),
            equipmentId,
          }
          return { ...e, precautions: [...e.precautions, newItem] }
        })
      )
    },
    []
  )

  const updatePrecaution = useCallback(
    (equipmentId: string, id: string, updates: Partial<EquipmentPrecaution>) => {
      setEquipmentList((prev) =>
        prev.map((e) => {
          if (e.profile.id !== equipmentId) return e
          return {
            ...e,
            precautions: e.precautions.map((p) =>
              p.id !== id ? p : { ...p, ...updates }
            ),
          }
        })
      )
    },
    []
  )

  const deletePrecaution = useCallback((equipmentId: string, id: string) => {
    setEquipmentList((prev) =>
      prev.map((e) => {
        if (e.profile.id !== equipmentId) return e
        return {
          ...e,
          precautions: e.precautions.filter((p) => p.id !== id),
        }
      })
    )
  }, [])

  const movePrecaution = useCallback(
    (equipmentId: string, id: string, direction: "up" | "down") => {
      setEquipmentList((prev) =>
        prev.map((e) => {
          if (e.profile.id !== equipmentId) return e

          const sorted = [...e.precautions].sort((a, b) => a.sortOrder - b.sortOrder)
          const idx = sorted.findIndex((p) => p.id === id)
          if (idx === -1) return e

          const swapIdx = direction === "up" ? idx - 1 : idx + 1
          if (swapIdx < 0 || swapIdx >= sorted.length) return e

          const newPrecautions = sorted.map((p, i) => {
            if (i === idx) return { ...p, sortOrder: sorted[swapIdx].sortOrder }
            if (i === swapIdx) return { ...p, sortOrder: sorted[idx].sortOrder }
            return p
          })

          return { ...e, precautions: newPrecautions }
        })
      )
    },
    []
  )

  // ---- Programs -----------------------------------------------------------

  const addProgram = useCallback(
    (equipmentId: string, item: Omit<EquipmentProgram, "id" | "equipmentId">) => {
      setEquipmentList((prev) =>
        prev.map((e) => {
          if (e.profile.id !== equipmentId) return e
          const newItem: EquipmentProgram = {
            ...item,
            id: "prog_" + uid(),
            equipmentId,
          }
          return { ...e, programs: [...e.programs, newItem] }
        })
      )
    },
    []
  )

  const updateProgram = useCallback(
    (equipmentId: string, id: string, updates: Partial<EquipmentProgram>) => {
      setEquipmentList((prev) =>
        prev.map((e) => {
          if (e.profile.id !== equipmentId) return e
          return {
            ...e,
            programs: e.programs.map((p) =>
              p.id !== id ? p : { ...p, ...updates }
            ),
          }
        })
      )
    },
    []
  )

  const deleteProgram = useCallback((equipmentId: string, id: string) => {
    setEquipmentList((prev) =>
      prev.map((e) => {
        if (e.profile.id !== equipmentId) return e
        return { ...e, programs: e.programs.filter((p) => p.id !== id) }
      })
    )
  }, [])

  // ---- Assets (unlimited, no cap) -----------------------------------------

  const addAsset = useCallback(
    (
      equipmentId: string,
      item: Omit<EquipmentAsset, "id" | "equipmentId" | "createdAt" | "updatedAt">
    ): EquipmentAsset => {
      const now = nowIso()
      const newAsset: EquipmentAsset = {
        ...item,
        id: "asset_" + uid(),
        equipmentId,
        createdAt: now,
        updatedAt: now,
      }

      setEquipmentList((prev) =>
        prev.map((e) => {
          if (e.profile.id !== equipmentId) return e
          return { ...e, assets: [...e.assets, newAsset] }
        })
      )

      return newAsset
    },
    []
  )

  const updateAsset = useCallback(
    (equipmentId: string, assetId: string, updates: Partial<EquipmentAsset>) => {
      const now = nowIso()
      setEquipmentList((prev) =>
        prev.map((e) => {
          if (e.profile.id !== equipmentId) return e
          return {
            ...e,
            assets: e.assets.map((a) =>
              a.id !== assetId ? a : { ...a, ...updates, updatedAt: now }
            ),
          }
        })
      )
    },
    []
  )

  const deleteAsset = useCallback((equipmentId: string, assetId: string) => {
    setEquipmentList((prev) =>
      prev.map((e) => {
        if (e.profile.id !== equipmentId) return e
        return { ...e, assets: e.assets.filter((a) => a.id !== assetId) }
      })
    )
  }, [])

  const reorderAsset = useCallback(
    (equipmentId: string, assetId: string, direction: "up" | "down") => {
      setEquipmentList((prev) =>
        prev.map((e) => {
          if (e.profile.id !== equipmentId) return e

          const sorted = [...e.assets].sort((a, b) => a.sortOrder - b.sortOrder)
          const idx = sorted.findIndex((a) => a.id === assetId)
          if (idx === -1) return e

          const swapIdx = direction === "up" ? idx - 1 : idx + 1
          if (swapIdx < 0 || swapIdx >= sorted.length) return e

          const newAssets = sorted.map((a, i) => {
            if (i === idx) return { ...a, sortOrder: sorted[swapIdx].sortOrder }
            if (i === swapIdx) return { ...a, sortOrder: sorted[idx].sortOrder }
            return a
          })

          return { ...e, assets: newAssets }
        })
      )
    },
    []
  )

  // ---- Effective assets (master HQ + branch, respecting hidden list) -------

  const getEffectiveAssets = useCallback(
    (equipmentId: string): EquipmentAsset[] => {
      const equipment = equipmentList.find((e) => e.profile.id === equipmentId)
      if (!equipment) return []

      const branchAssets = equipment.assets
      const { masterEquipmentId, useMasterAssetsDefault, hiddenMasterAssetIds } = equipment.profile

      let masterAssets: EquipmentAsset[] = []
      if (useMasterAssetsDefault && masterEquipmentId) {
        const master = masters.find((m) => m.id === masterEquipmentId)
        if (master) {
          masterAssets = master.assets
            .filter((a) => !hiddenMasterAssetIds.includes(a.id))
            .map((a) => ({ ...a, inheritedFromMaster: true }))
        }
      }

      return [...masterAssets, ...branchAssets].sort((a, b) => a.sortOrder - b.sortOrder)
    },
    [equipmentList, masters]
  )

  // ---- Toggle master asset visibility for a branch ------------------------

  const toggleMasterAssetVisibility = useCallback(
    (equipmentId: string, masterAssetId: string) => {
      setEquipmentList((prev) =>
        prev.map((e) => {
          if (e.profile.id !== equipmentId) return e

          const hidden = e.profile.hiddenMasterAssetIds
          const isCurrentlyHidden = hidden.includes(masterAssetId)
          const newHidden = isCurrentlyHidden
            ? hidden.filter((id) => id !== masterAssetId)
            : [...hidden, masterAssetId]

          return {
            ...e,
            profile: {
              ...e.profile,
              hiddenMasterAssetIds: newHidden,
              updatedAt: nowIso(),
            },
          }
        })
      )
    },
    []
  )

  // ---- Lifecycle ----------------------------------------------------------

  const archiveEquipment = useCallback((equipmentId: string) => {
    setEquipmentList((prev) =>
      prev.map((e) =>
        e.profile.id !== equipmentId
          ? e
          : {
              ...e,
              profile: {
                ...e.profile,
                status: "archived" as EquipmentStatus,
                updatedAt: nowIso(),
              },
            }
      )
    )
  }, [])

  const deleteEquipment = useCallback((equipmentId: string) => {
    setEquipmentList((prev) => prev.filter((e) => e.profile.id !== equipmentId))
  }, [])

  const duplicateEquipment = useCallback(
    (equipmentId: string): EquipmentData => {
      const source = equipmentList.find((e) => e.profile.id === equipmentId)
      if (!source) {
        throw new Error(`Equipment not found: ${equipmentId}`)
      }

      const now = nowIso()
      const newId = "eq_" + Date.now().toString()

      const newProfile: EquipmentProfile = {
        ...source.profile,
        id: newId,
        name: source.profile.name + " (복사)",
        status: "draft",
        override: { ...source.profile.override, overriddenFields: [...source.profile.override.overriddenFields] },
        hiddenMasterAssetIds: [...source.profile.hiddenMasterAssetIds],
        createdAt: now,
        updatedAt: now,
      }

      const newPrecautions: EquipmentPrecaution[] = source.precautions.map((p) => ({
        ...p,
        id: "pre_" + uid(),
        equipmentId: newId,
      }))

      const newPrograms: EquipmentProgram[] = source.programs.map((p) => ({
        ...p,
        id: "prog_" + uid(),
        equipmentId: newId,
      }))

      const newAssets: EquipmentAsset[] = source.assets.map((a) => ({
        ...a,
        id: "asset_" + uid(),
        equipmentId: newId,
        createdAt: now,
        updatedAt: now,
      }))

      const duplicate: EquipmentData = {
        profile: newProfile,
        benefits: [...source.benefits],
        targets: [...source.targets],
        concernAreas: [...source.concernAreas],
        keywords: [...source.keywords],
        customerSearchTerms: [...source.customerSearchTerms],
        specialtyPoints: [...source.specialtyPoints],
        companionTreatments: [...source.companionTreatments],
        precautions: newPrecautions,
        programs: newPrograms,
        assets: newAssets,
        linkedTreatmentIds: [...source.linkedTreatmentIds],
        linkedDoctorIds: [...source.linkedDoctorIds],
        linkedFaqIds: [...source.linkedFaqIds],
        linkedEventIds: [...source.linkedEventIds],
      }

      setEquipmentList((prev) => [...prev, duplicate])
      return duplicate
    },
    [equipmentList]
  )

  // ---- Context value ------------------------------------------------------

  const value: EquipmentContextType = {
    masters,
    equipmentList,
    getMaster,
    getAllMasters,
    createMaster,
    updateMaster,
    getEquipment,
    getEquipmentByBranch,
    createEquipment,
    createEquipmentFromMaster,
    updateProfile,
    updateExtras,
    setFieldOverride,
    resetFieldToMaster,
    syncFromMaster,
    addPrecaution,
    updatePrecaution,
    deletePrecaution,
    movePrecaution,
    addProgram,
    updateProgram,
    deleteProgram,
    addAsset,
    updateAsset,
    deleteAsset,
    reorderAsset,
    getEffectiveAssets,
    toggleMasterAssetVisibility,
    archiveEquipment,
    deleteEquipment,
    duplicateEquipment,
  }

  return <EquipmentContext.Provider value={value}>{children}</EquipmentContext.Provider>
}
