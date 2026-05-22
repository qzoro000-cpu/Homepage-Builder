"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/lib/cart-store"
import { useRouter } from "next/navigation"

function CartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

export function CartPopup() {
  const { lastAdded, count, dismissPopup, totalNum } = useCart()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (lastAdded) {
      setVisible(true)
    }
  }, [lastAdded])

  function close() {
    setVisible(false)
    setTimeout(dismissPopup, 300)
  }

  if (!lastAdded) return null

  const totalText = totalNum > 0
    ? `₩${totalNum.toLocaleString()}`
    : lastAdded.price

  return (
    <div
      style={{
        position:   "fixed",
        bottom:     visible ? 18 : -120,
        left:       14,
        right:      14,
        zIndex:     200,
        transition: "bottom 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <div
        style={{
          background:           "rgba(8,8,8,0.92)",
          backdropFilter:       "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius:         24,
          border:               "1px solid rgba(255,255,255,0.11)",
          boxShadow:            "0 12px 48px rgba(0,0,0,0.40), inset 0 0.5px 0 rgba(255,255,255,0.12)",
          overflow:             "hidden",
        }}
      >
        {/* 상단 행: 가격 + 예약하기 */}
        <div
          style={{
            display:     "flex",
            alignItems:  "center",
            gap:         8,
            padding:     "10px 12px 8px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* 가격 */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                {totalText}
              </span>
              {count > 1 && (
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                  외 {count - 1}건
                </span>
              )}
            </div>
            {lastAdded.originalPrice && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textDecoration: "line-through" }}>
                {lastAdded.originalPrice}
              </span>
            )}
          </div>

          {/* 예약하기 버튼 */}
          <a
            href="#reserve"
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            5,
              height:         40,
              padding:        "0 18px",
              borderRadius:   "9999px",
              background:     "rgba(255,255,255,0.97)",
              color:          "#0a0a0a",
              fontSize:       12,
              fontWeight:     700,
              textDecoration: "none",
              whiteSpace:     "nowrap",
              letterSpacing:  "0.01em",
              flexShrink:     0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            예약하기
          </a>

          {/* 전화 */}
          <a
            href="tel:"
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              width:          40,
              height:         40,
              borderRadius:   "9999px",
              border:         "1px solid rgba(255,255,255,0.14)",
              color:          "rgba(255,255,255,0.70)",
              textDecoration: "none",
              flexShrink:     0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </a>

          {/* 카카오 */}
          <a
            href="#kakao"
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              width:          40,
              height:         40,
              borderRadius:   "9999px",
              background:     "#FEE500",
              flexShrink:     0,
              textDecoration: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#3A1D1D">
              <path d="M12 3C6.477 3 2 6.582 2 11c0 2.828 1.696 5.304 4.264 6.86l-.854 3.18a.375.375 0 0 0 .55.418L9.5 19.36A12.014 12.014 0 0 0 12 19.5c5.523 0 10-3.582 10-8s-4.477-8.5-10-8.5z"/>
            </svg>
          </a>
        </div>

        {/* 하단 행: 액션 */}
        <div
          style={{
            display:     "flex",
            alignItems:  "center",
            gap:         4,
            padding:     "8px 12px 10px",
          }}
        >
          {/* 담김 확인 */}
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              width:          32,
              height:         32,
              borderRadius:   "9999px",
              background:     "rgba(52,199,89,0.15)",
              color:          "rgb(52,199,89)",
              flexShrink:     0,
            }}
          >
            <CheckIcon />
          </div>

          {/* 시술 더 보기 */}
          <button
            onClick={close}
            style={{
              flex:           1,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              height:         36,
              borderRadius:   "9999px",
              border:         "1px solid rgba(255,255,255,0.14)",
              background:     "transparent",
              color:          "rgba(255,255,255,0.80)",
              fontSize:       12,
              fontWeight:     500,
              cursor:         "pointer",
              gap:            5,
              whiteSpace:     "nowrap",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            시술 더 보기
          </button>

          {/* 장바구니 가기 */}
          <a
            href="/preview/cart"
            style={{
              flex:           1.4,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            5,
              height:         36,
              borderRadius:   "9999px",
              background:     "rgba(255,255,255,0.12)",
              color:          "rgba(255,255,255,0.92)",
              fontSize:       12,
              fontWeight:     600,
              textDecoration: "none",
              whiteSpace:     "nowrap",
            }}
          >
            <CartIcon />
            장바구니 가기
          </a>

          {/* 닫기 */}
          <button
            onClick={close}
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              width:          32,
              height:         32,
              borderRadius:   "9999px",
              border:         "1px solid rgba(255,255,255,0.14)",
              background:     "transparent",
              color:          "rgba(255,255,255,0.50)",
              fontSize:       14,
              cursor:         "pointer",
              flexShrink:     0,
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
