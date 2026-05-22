// ─── Option System ─────────────────────────────────────────────────────────────
// CMS 전반의 선택형 옵션을 관리하는 공통 데이터 구조.
// 예약 가능 방식(booking_channel)을 시작으로, 지점 배지·FAQ 카테고리 등에도 재사용 가능.

export type OptionGroup = {
  id: string
  key: string           // 예: "booking_channel"
  name: string          // 예: "예약 가능 방식"
  description: string
  usedIn: string[]      // 어느 화면에서 사용되는지 힌트
  isSystem: boolean     // true = 시스템 기본 그룹 (삭제 불가)
  createdAt: string
  updatedAt: string
}

export type OptionItemMetadata = {
  requiresUrl?: boolean      // 선택 시 URL 입력 필드 노출
  requiresPhone?: boolean    // 선택 시 전화번호 입력 필드 노출
  placeholder?: string       // 입력 필드 플레이스홀더
  inputLabel?: string        // 입력 필드 레이블
  /** 이미 폼 상단 전용 필드로 관리되는 채널 (phone, booking_link, kakao)
   *  → 선택 시 인라인 입력 미표시, 상단 필드를 사용 */
  usesExistingField?: "mainPhone" | "bookingLink" | "kakaoLink"
}

export type OptionItem = {
  id: string
  groupId: string
  key: string           // 예: "phone", "naver_booking"
  label: string         // 예: "전화", "네이버 예약"
  description?: string
  iconName?: string     // lucide-react 아이콘 이름
  colorToken?: string
  sortOrder: number
  isDefault: boolean    // 기본 시드 여부
  isActive: boolean     // false = 비활성(소프트 삭제)
  isSystem: boolean     // true = 시스템 옵션 (key·isSystem 수정 불가)
  branchId?: string     // null/undefined = 전체 공통, 값 있으면 지점 전용
  metadata?: OptionItemMetadata
  createdAt: string
  updatedAt: string
}

/** 지점별 예약/문의 채널 저장 구조 */
export type BranchContactMethod = {
  optionKey: string   // OptionItem.key 참조
  value: string       // URL 또는 전화번호
  isActive: boolean
}

// ─── 레거시 마이그레이션 맵 ────────────────────────────────────────────────────
/** 기존 하드코딩 문자열 → option key 변환 */
export const LEGACY_BOOKING_METHOD_MAP: Record<string, string> = {
  "전화": "phone",
  "예약링크": "booking_link",
  "카카오톡": "kakao",
  "현장방문": "walk_in",
}

// ─── 기본 시드 데이터 ─────────────────────────────────────────────────────────

export const defaultOptionGroups: OptionGroup[] = [
  {
    id: "og1",
    key: "booking_channel",
    name: "예약 가능 방식",
    description: "고객이 예약하거나 문의할 수 있는 채널 목록",
    usedIn: ["지점 정보 > 연락 및 예약 정보"],
    isSystem: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]

export const defaultOptionItems: OptionItem[] = [
  {
    id: "oi1",
    groupId: "og1",
    key: "phone",
    label: "전화",
    description: "대표 전화번호로 예약 및 문의",
    iconName: "Phone",
    sortOrder: 1,
    isDefault: true,
    isActive: true,
    isSystem: true,
    metadata: {
      requiresPhone: true,
      inputLabel: "전화번호",
      placeholder: "02-0000-0000",
      usesExistingField: "mainPhone",
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "oi2",
    groupId: "og1",
    key: "booking_link",
    label: "예약 링크",
    description: "온라인 예약 링크",
    iconName: "Link",
    sortOrder: 2,
    isDefault: true,
    isActive: true,
    isSystem: true,
    metadata: {
      requiresUrl: true,
      inputLabel: "예약 링크",
      placeholder: "https://booking.tatoa.kr/...",
      usesExistingField: "bookingLink",
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "oi3",
    groupId: "og1",
    key: "kakao",
    label: "카카오톡",
    description: "카카오톡 채널로 문의 및 예약",
    iconName: "MessageSquare",
    sortOrder: 3,
    isDefault: true,
    isActive: true,
    isSystem: true,
    metadata: {
      requiresUrl: true,
      inputLabel: "카카오 채널 링크",
      placeholder: "https://pf.kakao.com/...",
      usesExistingField: "kakaoLink",
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "oi4",
    groupId: "og1",
    key: "walk_in",
    label: "현장 방문",
    description: "직접 방문하여 예약 가능",
    iconName: "MapPin",
    sortOrder: 4,
    isDefault: true,
    isActive: true,
    isSystem: true,
    metadata: {},
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "oi5",
    groupId: "og1",
    key: "naver_booking",
    label: "네이버 예약",
    description: "네이버 예약 서비스",
    iconName: "Globe",
    sortOrder: 5,
    isDefault: false,
    isActive: true,
    isSystem: true,
    metadata: {
      requiresUrl: true,
      inputLabel: "네이버 예약 링크",
      placeholder: "https://booking.naver.com/...",
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "oi6",
    groupId: "og1",
    key: "gangnamunni",
    label: "강남언니",
    description: "강남언니 앱을 통한 예약",
    iconName: "Smartphone",
    sortOrder: 6,
    isDefault: false,
    isActive: true,
    isSystem: true,
    metadata: {
      requiresUrl: true,
      inputLabel: "강남언니 링크",
      placeholder: "https://gangnamunni.com/...",
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]

/** 옵션 키가 폼 상단 전용 필드를 이미 사용하는 채널인지 확인 */
export function hasExistingField(item: OptionItem): boolean {
  return !!item.metadata?.usesExistingField
}

/** 인라인 입력이 필요한 채널인지 확인 (상단 전용 필드 없이 URL/전화 입력이 필요한 경우) */
export function needsInlineInput(item: OptionItem): boolean {
  return (
    (!!item.metadata?.requiresUrl || !!item.metadata?.requiresPhone) &&
    !item.metadata?.usesExistingField
  )
}
