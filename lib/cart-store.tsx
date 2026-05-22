"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────

export type CartItem = {
  id: string                // treatmentId + "_" + programName (dedup key)
  treatmentId: string
  programName: string
  treatmentName: string
  category?: string
  description?: string      // first includes item, shown as subtitle
  image?: string
  price: string             // formatted "₩xxx,xxx"
  priceNum: number
  originalPrice?: string
  originalPriceNum?: number
}

type CartCtx = {
  items: CartItem[]
  lastAdded: CartItem | null
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
  totalNum: number
  count: number
  dismissPopup: () => void
}

const STORAGE_KEY = "tatoa-cart"

export const CartContext = createContext<CartCtx>({
  items: [],
  lastAdded: null,
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  totalNum: 0,
  count: 0,
  dismissPopup: () => {},
})

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setItems(JSON.parse(saved))
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, ready])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev
      return [...prev, item]
    })
    setLastAdded(item)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const dismissPopup = useCallback(() => setLastAdded(null), [])

  const totalNum = items.reduce((sum, i) => sum + i.priceNum, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        lastAdded,
        addItem,
        removeItem,
        clearCart,
        totalNum,
        count: items.length,
        dismissPopup,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
