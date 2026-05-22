// ─── RBAC — Role-Based Access Control ────────────────────────────────────────
// Branch scope 기반 권한 시스템.
// 현재는 프론트엔드 Context 기반으로 시뮬레이션하며,
// 실제 백엔드 연동 시 API 레벨 검증으로 교체한다.

export type UserRole =
  | "super_admin"    // 전체 접근
  | "hq_admin"       // 본사 관리자 — EquipmentMaster 생성/수정
  | "branch_manager" // 지점 매니저 — 자기 지점 전체 편집 + 공개 전환
  | "branch_editor"  // 지점 에디터 — 자기 지점 편집, 공개 권한 제한
  | "branch_viewer"  // 읽기 전용

export type Permission =
  // Master level
  | "master:read"
  | "master:create"
  | "master:update"
  | "master:delete"
  // Branch equipment
  | "branch_equipment:read"
  | "branch_equipment:create"
  | "branch_equipment:update"
  | "branch_equipment:publish"
  | "branch_equipment:delete"
  | "branch_equipment:archive"
  // Assets
  | "asset:upload"
  | "asset:delete"
  // Relations
  | "relation:edit"
  // URL / Domain
  | "url:edit"
  // Other branch data
  | "other_branch:read"   // 다른 지점 데이터 열람 (super_admin, hq_admin만)

// ─── Role → Permission 매핑 ───────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    "master:read", "master:create", "master:update", "master:delete",
    "branch_equipment:read", "branch_equipment:create", "branch_equipment:update",
    "branch_equipment:publish", "branch_equipment:delete", "branch_equipment:archive",
    "asset:upload", "asset:delete",
    "relation:edit",
    "url:edit",
    "other_branch:read",
  ],
  hq_admin: [
    "master:read", "master:create", "master:update",
    "branch_equipment:read", "branch_equipment:create", "branch_equipment:update",
    "branch_equipment:publish", "branch_equipment:archive",
    "asset:upload", "asset:delete",
    "relation:edit",
    "url:edit",
    "other_branch:read",
  ],
  branch_manager: [
    "master:read",
    "branch_equipment:read", "branch_equipment:create", "branch_equipment:update",
    "branch_equipment:publish", "branch_equipment:archive",
    "asset:upload", "asset:delete",
    "relation:edit",
    "url:edit",
  ],
  branch_editor: [
    "master:read",
    "branch_equipment:read", "branch_equipment:create", "branch_equipment:update",
    "asset:upload",
    "relation:edit",
  ],
  branch_viewer: [
    "master:read",
    "branch_equipment:read",
  ],
}

// ─── Session User 타입 ────────────────────────────────────────────────────────

export type SessionUser = {
  id: string
  name: string
  role: UserRole
  /** 접근 가능한 branch id 목록. ["*"] = 전체 허용 (super_admin, hq_admin) */
  allowedBranchIds: string[]
}

// ─── 현재 세션 시뮬레이션 ──────────────────────────────────────────────────────
// 실제 운영에서는 JWT claims 또는 서버 session에서 가져온다.

export const MOCK_SESSION_USERS: SessionUser[] = [
  {
    id: "u_hq_admin",
    name: "관리자 김",
    role: "hq_admin",
    allowedBranchIds: ["*"],
  },
  {
    id: "u_branch_manager_main",
    name: "강남 매니저",
    role: "branch_manager",
    allowedBranchIds: ["main"],
  },
  {
    id: "u_branch_editor_sinsa",
    name: "신사 에디터",
    role: "branch_editor",
    allowedBranchIds: ["sinsa"],
  },
  {
    id: "u_viewer_gumi",
    name: "구미 뷰어",
    role: "branch_viewer",
    allowedBranchIds: ["gumi"],
  },
]

// 기본 세션: hq_admin (개발용)
export const DEFAULT_SESSION: SessionUser = MOCK_SESSION_USERS[0]

// ─── Permission 유틸 ──────────────────────────────────────────────────────────

export function hasPermission(user: SessionUser, permission: Permission): boolean {
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
}

export function canAccessBranch(user: SessionUser, branchId: string): boolean {
  if (user.allowedBranchIds.includes("*")) return true
  return user.allowedBranchIds.includes(branchId)
}

/**
 * Branch scope guard. 백엔드 API에서도 동일 로직 강제.
 * 접근 불가 시 throw (프론트에서는 router.push("/403") 처리).
 */
export function assertBranchAccess(user: SessionUser, branchId: string): void {
  if (!canAccessBranch(user, branchId)) {
    throw new Error(`ACCESS_DENIED: User ${user.id} cannot access branch ${branchId}`)
  }
}

export function isHQ(user: SessionUser): boolean {
  return user.role === "super_admin" || user.role === "hq_admin"
}

export function canPublish(user: SessionUser): boolean {
  return hasPermission(user, "branch_equipment:publish")
}

export function canEditRelations(user: SessionUser): boolean {
  return hasPermission(user, "relation:edit")
}

export function canUploadAsset(user: SessionUser): boolean {
  return hasPermission(user, "asset:upload")
}

export function canEditMaster(user: SessionUser): boolean {
  return hasPermission(user, "master:update")
}
