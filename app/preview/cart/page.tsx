"use client"

import { CartProvider, useCart, type CartItem } from "@/lib/cart-store"

export default function CartPageWrapper() {
  return (
    <CartProvider>
      <CartPage />
    </CartProvider>
  )
}

function CartPage() {
  const { items, removeItem, clearCart, totalNum } = useCart()

  const originalTotal = items.reduce((sum, i) => sum + (i.originalPriceNum ?? i.priceNum), 0)
  const hasDiscount   = originalTotal > totalNum

  return (
    <div
      style={{
        minHeight:  "100vh",
        background: "var(--cart-bg, #f7f5f2)",
        fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
      }}
    >
      {/* 최상단 eyebrow */}
      <div style={{ textAlign: "center", paddingTop: 40, paddingBottom: 4 }}>
        <span
          style={{
            fontSize:      11,
            letterSpacing: "0.30em",
            textTransform: "uppercase",
            color:         "#b0956a",
            fontWeight:    600,
          }}
        >
          장 바 구 니
        </span>
      </div>

      {/* 페이지 헤드라인 */}
      <div style={{ textAlign: "center", paddingBottom: 8 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em", margin: 0 }}>
          장바구니
        </h1>
        <p style={{ marginTop: 8, fontSize: 13, color: "#888", fontWeight: 400 }}>
          선택하신 시술을 확인하고 예약을 진행하세요.
        </p>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 120px" }}>

        {/* 아이템 수 + 전체 삭제 */}
        {items.length > 0 && (
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              marginBottom:   16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>담긴 시술</span>
              <span
                style={{
                  display:        "inline-flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  minWidth:       22,
                  height:         22,
                  borderRadius:   9999,
                  background:     "#1a1a1a",
                  color:          "#fff",
                  fontSize:       11,
                  fontWeight:     700,
                  padding:        "0 6px",
                }}
              >
                {items.length}건
              </span>
            </div>
            <button
              onClick={clearCart}
              style={{
                background:  "none",
                border:      "none",
                cursor:      "pointer",
                fontSize:    12,
                color:       "#aaa",
                fontWeight:  500,
                padding:     "4px 0",
              }}
            >
              전체 삭제
            </button>
          </div>
        )}

        {/* 빈 카트 */}
        {items.length === 0 && (
          <div
            style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              padding:        "60px 20px",
              gap:            16,
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <p style={{ color: "#bbb", fontSize: 14, margin: 0 }}>담긴 시술이 없습니다.</p>
            <a
              href="/"
              style={{
                display:        "inline-flex",
                alignItems:     "center",
                justifyContent: "center",
                height:         42,
                padding:        "0 24px",
                borderRadius:   9999,
                background:     "#1a1a1a",
                color:          "#fff",
                fontSize:       13,
                fontWeight:     600,
                textDecoration: "none",
              }}
            >
              시술 둘러보기
            </a>
          </div>
        )}

        {/* 시술 목록 */}
        {items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((item) => (
              <CartItemCard key={item.id} item={item} onRemove={() => removeItem(item.id)} />
            ))}
          </div>
        )}

        {/* 예상 결제 금액 */}
        {items.length > 0 && (
          <div
            style={{
              marginTop:    24,
              background:   "#fff",
              borderRadius: 20,
              padding:      "20px 20px",
              boxShadow:    "0 2px 16px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 14 }}>
              예상 결제 금액
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#555" }}>{item.programName}</span>
                  <span style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500 }}>
                    {item.price}
                  </span>
                </div>
              ))}
            </div>

            {/* 구분선 */}
            <div style={{ borderTop: "1px solid #eee", margin: "14px 0" }} />

            {/* 합계 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>예상 합계</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                {hasDiscount && (
                  <span style={{ fontSize: 12, color: "#bbb", textDecoration: "line-through" }}>
                    {`₩${originalTotal.toLocaleString()}`}
                  </span>
                )}
                <span style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>
                  {`₩${totalNum.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        {items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            <a
              href="/"
              style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                gap:            6,
                height:         50,
                borderRadius:   16,
                border:         "1px solid rgba(0,0,0,0.12)",
                background:     "#fff",
                color:          "#333",
                fontSize:       13,
                fontWeight:     600,
                textDecoration: "none",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              시술 더 추가하기
            </a>
            <a
              href="#reserve"
              style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                gap:            6,
                height:         54,
                borderRadius:   16,
                background:     "#2d2318",
                color:          "#fff",
                fontSize:       14,
                fontWeight:     700,
                textDecoration: "none",
                letterSpacing:  "0.01em",
              }}
            >
              예약 계속하기
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function CartItemCard({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const hasDiscount = Boolean(item.originalPrice && item.originalPriceNum && item.originalPriceNum > item.priceNum)

  return (
    <div
      style={{
        background:   "#fff",
        borderRadius: 20,
        padding:      16,
        display:      "flex",
        gap:          14,
        boxShadow:    "0 2px 12px rgba(0,0,0,0.06)",
        position:     "relative",
      }}
    >
      {/* 썸네일 */}
      {item.image ? (
        <img
          src={item.image}
          alt={item.treatmentName}
          style={{
            width:        72,
            height:       72,
            borderRadius: 14,
            objectFit:    "cover",
            flexShrink:   0,
          }}
        />
      ) : (
        <div
          style={{
            width:        72,
            height:       72,
            borderRadius: 14,
            background:   "#f0ece6",
            flexShrink:   0,
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a85c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
      )}

      {/* 정보 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.programName}
          </span>
          {item.treatmentName !== item.programName && (
            <span
              style={{
                display:     "inline-block",
                padding:     "1px 7px",
                borderRadius: 9999,
                background:  "#f0564a",
                color:       "#fff",
                fontSize:    10,
                fontWeight:  700,
                flexShrink:  0,
              }}
            >
              Event
            </span>
          )}
        </div>
        {item.category && (
          <p style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>{item.category}</p>
        )}
        {item.description && (
          <p
            style={{
              fontSize:     12,
              color:        "#888",
              marginBottom: 6,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}
          >
            {item.description}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{item.price}</span>
          {hasDiscount && item.originalPrice && (
            <span style={{ fontSize: 12, color: "#bbb", textDecoration: "line-through" }}>
              {item.originalPrice}
            </span>
          )}
        </div>
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={onRemove}
        style={{
          position:       "absolute",
          top:            14,
          right:          14,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          28,
          height:         28,
          borderRadius:   9999,
          border:         "1px solid #eee",
          background:     "#fafafa",
          cursor:         "pointer",
          color:          "#aaa",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    </div>
  )
}
