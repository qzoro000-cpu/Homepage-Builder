"use client"

import { createContext, useContext, useState, useCallback } from "react"
import {
  OptionGroup,
  OptionItem,
  defaultOptionGroups,
  defaultOptionItems,
} from "./option-system"

// ─── Context Type ─────────────────────────────────────────────────────────────

type OptionContextType = {
  groups: OptionGroup[]
  items: OptionItem[]
  /** 그룹 key로 활성 옵션 항목 조회 */
  getItemsByGroup: (groupKey: string, includeInactive?: boolean) => OptionItem[]
  /** 특정 그룹 조회 */
  getGroup: (groupKey: string) => OptionGroup | undefined
  /** 새 옵션 항목 추가 */
  addItem: (item: Omit<OptionItem, "id" | "createdAt" | "updatedAt">) => OptionItem
  /** 옵션 항목 수정 */
  updateItem: (id: string, updates: Partial<OptionItem>) => void
  /** 활성/비활성 토글 */
  toggleItem: (id: string) => void
  /** 물리 삭제 가능 여부 (사용 이력 없고 시스템 항목 아닌 경우) */
  canDeleteItem: (id: string) => boolean
  /** 물리 삭제 (canDeleteItem이 true인 경우만) */
  deleteItem: (id: string) => void
  /** 특정 옵션 key가 현재 "사용 중"인지 (소프트 삭제만 허용 판단에 사용) */
  isItemInUse: (key: string) => boolean
}

const OptionContext = createContext<OptionContextType>({} as OptionContextType)
export const useOptions = () => useContext(OptionContext)

// ─── Mock "사용 중" 추적 ──────────────────────────────────────────────────────
// 실제 운영에서는 DB join으로 확인. 여기서는 기본 4개 채널이 어딘가에 쓰이고 있다고 가정.
const INITIALLY_USED_KEYS = new Set(["phone", "booking_link", "kakao", "walk_in"])

// ─── Provider ────────────────────────────────────────────────────────────────

export function OptionProvider({ children }: { children: React.ReactNode }) {
  const [groups] = useState<OptionGroup[]>(defaultOptionGroups)
  const [items, setItems] = useState<OptionItem[]>(defaultOptionItems)
  // 사용 중인 키 집합 (새 옵션이 선택되면 여기에 추가)
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set(INITIALLY_USED_KEYS))

  const getGroup = useCallback(
    (groupKey: string) => groups.find((g) => g.key === groupKey),
    [groups]
  )

  const getItemsByGroup = useCallback(
    (groupKey: string, includeInactive = false) => {
      const group = groups.find((g) => g.key === groupKey)
      if (!group) return []
      return items
        .filter((i) => i.groupId === group.id && (includeInactive || i.isActive))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    },
    [groups, items]
  )

  const addItem = useCallback(
    (item: Omit<OptionItem, "id" | "createdAt" | "updatedAt">): OptionItem => {
      const now = new Date().toISOString()
      const newItem: OptionItem = { ...item, id: `oi${Date.now()}`, createdAt: now, updatedAt: now }
      setItems((prev) => [...prev, newItem])
      return newItem
    },
    []
  )

  const updateItem = useCallback((id: string, updates: Partial<OptionItem>) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
      )
    )
  }, [])

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, isActive: !i.isActive, updatedAt: new Date().toISOString() } : i
      )
    )
  }, [])

  const isItemInUse = useCallback((key: string) => usedKeys.has(key), [usedKeys])

  const canDeleteItem = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id)
      if (!item) return false
      return !item.isSystem && !usedKeys.has(item.key)
    },
    [items, usedKeys]
  )

  const deleteItem = useCallback(
    (id: string) => {
      if (!canDeleteItem(id)) return
      setItems((prev) => prev.filter((i) => i.id !== id))
    },
    [canDeleteItem]
  )

  /** 지점 화면에서 채널 선택 시 호출 → 사용 중 집합에 추가 */
  const markAsUsed = useCallback((key: string) => {
    setUsedKeys((prev) => new Set([...prev, key]))
  }, [])

  return (
    <OptionContext.Provider
      value={{
        groups,
        items,
        getGroup,
        getItemsByGroup,
        addItem,
        updateItem,
        toggleItem,
        canDeleteItem,
        deleteItem,
        isItemInUse,
        // markAsUsed는 내부용이라 context에 노출하지 않음
        // 필요 시 확장 가능
      }}
    >
      {children}
    </OptionContext.Provider>
  )
}
