"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { createPortal } from "react-dom"

// ── Types ─────────────────────────────────────────────────────────────────────

export type RichTextEditorMode = "block" | "floating"

export interface BlockSettings {
  padding?: string
  background?: string
  borderRadius?: string
  border?: string
}

export interface RichTextEditorProps {
  mode: RichTextEditorMode
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  disabled?: boolean
  minHeight?: number
  className?: string
  style?: React.CSSProperties
  blockSettings?: BlockSettings
  onBlockSettingsChange?: (s: BlockSettings) => void
  showBlockSettings?: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  { label: "기본 서체", value: "" },
  { label: "나눔바른고딕", value: "'Nanum Barun Gothic', sans-serif" },
  { label: "나눔명조", value: "'Nanum Myeongjo', serif" },
  { label: "나눔고딕", value: "'Nanum Gothic', sans-serif" },
  { label: "Pretendard", value: "'Pretendard', sans-serif" },
  { label: "고딕 (시스템)", value: "sans-serif" },
  { label: "명조 (시스템)", value: "serif" },
  { label: "고정폭", value: "monospace" },
]

const FONT_SIZES = ["6", "7", "8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "60", "72"]

const PRESET_COLORS = [
  "#000000", "#333333", "#555555", "#888888", "#aaaaaa", "#cccccc", "#ffffff",
  "#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00c7be", "#007aff", "#5856d6",
  "#af52de", "#ff2d55", "#8e8e93", "#636366",
]

// ── ColorPicker ───────────────────────────────────────────────────────────────

// ColorPicker: portal + fixed 포지셔닝으로 패널 클리핑 방지
function ColorPicker({
  value,
  onChange,
  onClose,
  anchor,
}: {
  value: string
  onChange: (c: string) => void
  onClose: () => void
  /** openColorPicker 호출 시 계산한 뷰포트 기준 좌표 */
  anchor: { top: number; left: number }
}) {
  const ref = useRef<HTMLDivElement>(null)
  const PICKER_W = 188
  const PICKER_H = 130

  // 뷰포트 밖으로 나가지 않도록 위치 보정
  const vw = typeof window !== "undefined" ? window.innerWidth  : 1920
  const vh = typeof window !== "undefined" ? window.innerHeight : 1080
  const left = Math.min(anchor.left, vw - PICKER_W - 8)
  const top  = anchor.top + PICKER_H > vh - 8
    ? anchor.top - PICKER_H - 44   // 위쪽으로 플립
    : anchor.top

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [onClose])

  const picker = (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top,
        left,
        zIndex: 99999,
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10,
        padding: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        width: PICKER_W,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onMouseDown={(e) => { e.preventDefault(); onChange(c) }}
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              background: c,
              border: value === c ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#aaa", fontSize: 11 }}>직접 입력</span>
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 32, height: 24, border: "none", padding: 0, borderRadius: 4, cursor: "pointer", background: "none" }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 5,
            color: "#fff",
            fontSize: 11,
            padding: "2px 5px",
            fontFamily: "monospace",
          }}
        />
      </div>
    </div>
  )

  if (typeof document === "undefined") return null
  return createPortal(picker, document.body)
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

type ColorTarget = "fore" | "hilite" | null

function Toolbar({
  editorRef,
  onExec,
  style,
}: {
  editorRef: React.RefObject<HTMLDivElement | null>
  onExec: (cmd: string, val?: string) => void
  style?: React.CSSProperties
}) {
  const [fontFamily, setFontFamily] = useState("")
  const [fontSize, setFontSize] = useState("16")
  const [colorTarget, setColorTarget] = useState<ColorTarget>(null)
  const [foreColor, setForeColor] = useState("#000000")
  const [hiliteColor, setHiliteColor] = useState("#ffff00")
  // 뷰포트 기준 절대 좌표 (portal + fixed 렌더링용)
  const [colorAnchor, setColorAnchor] = useState<{ top: number; left: number } | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  function exec(cmd: string, val?: string) {
    editorRef.current?.focus()
    onExec(cmd, val)
  }

  function handleFontFamily(val: string) {
    setFontFamily(val)
    if (val) exec("fontName", val)
  }

  function handleFontSize(val: string) {
    setFontSize(val)
    const editor = editorRef.current
    if (!editor) return
    editor.focus()

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (range.collapsed) return

    // execCommand('fontSize') creates <span style="font-size:xxx-large"> in modern browsers
    // (NOT <font size="7"> as documented), so querySelector patch never fires.
    // Fix: wrap selection directly in a <span style="font-size:Xpx"> via Range API.
    const span = document.createElement("span")
    span.style.fontSize = val + "px"
    try {
      range.surroundContents(span)
    } catch {
      // Selection spans multiple elements — extract and re-insert
      const fragment = range.extractContents()
      span.appendChild(fragment)
      range.insertNode(span)
    }
    // Restore selection inside the new span
    sel.removeAllRanges()
    const newRange = document.createRange()
    newRange.selectNodeContents(span)
    sel.addRange(newRange)

    // Notify parent of HTML change
    editor.dispatchEvent(new Event("input", { bubbles: true }))
  }

  function openColorPicker(target: ColorTarget, e: React.MouseEvent) {
    // getBoundingClientRect() → 뷰포트 기준 좌표 → fixed 포지셔닝에 직접 사용
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setColorTarget(target)
    setColorAnchor({
      top:  rect.bottom + 4,
      left: rect.left,
    })
  }

  function applyColor(color: string) {
    if (colorTarget === "fore") {
      setForeColor(color)
      exec("foreColor", color)
    } else if (colorTarget === "hilite") {
      setHiliteColor(color)
      exec("hiliteColor", color)
    }
    setColorTarget(null)
  }

  const sep = (
    <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)", margin: "0 2px", flexShrink: 0 }} />
  )

  const btn = (
    label: React.ReactNode,
    title: string,
    onClick: (e: React.MouseEvent) => void,
    active = false,
    extraStyle: React.CSSProperties = {}
  ) => (
    <button
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(e) }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 24,
        height: 24,
        padding: "0 4px",
        borderRadius: 5,
        border: "none",
        background: active ? "rgba(255,255,255,0.18)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.75)",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        flexShrink: 0,
        ...extraStyle,
      }}
    >
      {label}
    </button>
  )

  return (
    <div
      ref={toolbarRef}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
        padding: "5px 8px",
        background: "#141414",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        ...style,
      }}
    >
      {/* Font Family */}
      <select
        value={fontFamily}
        onChange={(e) => handleFontFamily(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 6,
          color: "#ddd",
          fontSize: 11,
          padding: "2px 4px",
          height: 24,
          cursor: "pointer",
          maxWidth: 110,
        }}
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>

      {/* Font Size */}
      <select
        value={fontSize}
        onChange={(e) => handleFontSize(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 6,
          color: "#ddd",
          fontSize: 11,
          padding: "2px 4px",
          height: 24,
          cursor: "pointer",
          width: 52,
        }}
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>{s}px</option>
        ))}
      </select>

      {sep}

      {btn(<b>B</b>, "굵게", () => exec("bold"))}
      {btn(<i style={{ fontStyle: "italic" }}>I</i>, "기울임", () => exec("italic"))}
      {btn(<u>U</u>, "밑줄", () => exec("underline"))}
      {btn(<s>S</s>, "취소선", () => exec("strikeThrough"))}

      {sep}

      {/* Text Color */}
      {btn(
        <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>A</span>
          <span style={{ width: 14, height: 3, borderRadius: 1, background: foreColor }} />
        </span>,
        "글자 색상",
        (e) => openColorPicker("fore", e)
      )}
      {colorTarget === "fore" && colorAnchor && (
        <ColorPicker value={foreColor} onChange={applyColor} onClose={() => setColorTarget(null)} anchor={colorAnchor} />
      )}

      {/* Background Color */}
      {btn(
        <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: hiliteColor, padding: "0 2px", borderRadius: 2 }}>A</span>
          <span style={{ width: 14, height: 3, borderRadius: 1, background: hiliteColor }} />
        </span>,
        "배경 색상",
        (e) => openColorPicker("hilite", e)
      )}
      {colorTarget === "hilite" && colorAnchor && (
        <ColorPicker value={hiliteColor} onChange={applyColor} onClose={() => setColorTarget(null)} anchor={colorAnchor} />
      )}

      {sep}

      {btn(
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="1" y="2" width="12" height="1.5" rx="0.75"/>
          <rect x="2" y="5.5" width="10" height="1.5" rx="0.75"/>
          <rect x="1" y="9" width="12" height="1.5" rx="0.75"/>
        </svg>,
        "왼쪽 정렬",
        () => exec("justifyLeft")
      )}
      {btn(
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="1" y="2" width="12" height="1.5" rx="0.75"/>
          <rect x="3" y="5.5" width="8" height="1.5" rx="0.75"/>
          <rect x="1" y="9" width="12" height="1.5" rx="0.75"/>
        </svg>,
        "가운데 정렬",
        () => exec("justifyCenter")
      )}
      {btn(
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="1" y="2" width="12" height="1.5" rx="0.75"/>
          <rect x="2" y="5.5" width="10" height="1.5" rx="0.75"/>
          <rect x="3" y="9" width="8" height="1.5" rx="0.75"/>
        </svg>,
        "오른쪽 정렬",
        () => exec("justifyRight")
      )}

      {sep}

      {btn(
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="2.5" cy="3.5" r="1.2"/>
          <rect x="5" y="2.75" width="8" height="1.5" rx="0.75"/>
          <circle cx="2.5" cy="7" r="1.2"/>
          <rect x="5" y="6.25" width="8" height="1.5" rx="0.75"/>
          <circle cx="2.5" cy="10.5" r="1.2"/>
          <rect x="5" y="9.75" width="8" height="1.5" rx="0.75"/>
        </svg>,
        "글머리 목록",
        () => exec("insertUnorderedList")
      )}
      {btn(
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <text x="1" y="5" fontSize="5" fontWeight="bold">1.</text>
          <rect x="5" y="2.75" width="8" height="1.5" rx="0.75"/>
          <text x="1" y="8.5" fontSize="5" fontWeight="bold">2.</text>
          <rect x="5" y="6.25" width="8" height="1.5" rx="0.75"/>
          <text x="1" y="12" fontSize="5" fontWeight="bold">3.</text>
          <rect x="5" y="9.75" width="8" height="1.5" rx="0.75"/>
        </svg>,
        "번호 목록",
        () => exec("insertOrderedList")
      )}

      {sep}

      {btn(
        <span style={{ fontSize: 11, display: "flex", alignItems: "baseline", gap: 0 }}>
          T<sup style={{ fontSize: 7, lineHeight: 1 }}>1</sup>
        </span>,
        "위 첨자",
        () => exec("superscript")
      )}
      {btn(
        <span style={{ fontSize: 11, display: "flex", alignItems: "baseline", gap: 0 }}>
          T<sub style={{ fontSize: 7, lineHeight: 1 }}>1</sub>
        </span>,
        "아래 첨자",
        () => exec("subscript")
      )}

      {sep}

      {btn(
        <span style={{ fontSize: 13 }}>✕</span>,
        "서식 지우기",
        () => exec("removeFormat"),
        false,
        { color: "rgba(255,100,100,0.8)" }
      )}
    </div>
  )
}

// ── Block Settings Panel ──────────────────────────────────────────────────────

function BlockSettingsPanel({
  value,
  onChange,
}: {
  value: BlockSettings
  onChange: (s: BlockSettings) => void
}) {
  function patch(partial: Partial<BlockSettings>) {
    onChange({ ...value, ...partial })
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 6,
    color: "#ddd",
    fontSize: 11,
    padding: "3px 7px",
    width: "100%",
  }

  const label: React.CSSProperties = {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    marginBottom: 3,
    display: "block",
  }

  return (
    <div
      style={{
        background: "#111",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "10px 12px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px 12px",
        marginTop: 6,
      }}
    >
      <div>
        <span style={label}>안쪽 여백 (padding)</span>
        <input style={inputStyle} value={value.padding ?? ""} placeholder="예: 12px 20px" onChange={(e) => patch({ padding: e.target.value })} />
      </div>
      <div>
        <span style={label}>배경색 (background)</span>
        <div style={{ display: "flex", gap: 4 }}>
          <input type="color" value={value.background || "#ffffff"} onChange={(e) => patch({ background: e.target.value })} style={{ width: 30, height: 26, border: "none", borderRadius: 5, cursor: "pointer", padding: 0 }} />
          <input style={{ ...inputStyle, flex: 1 }} value={value.background ?? ""} placeholder="transparent" onChange={(e) => patch({ background: e.target.value })} />
        </div>
      </div>
      <div>
        <span style={label}>모서리 둥글기 (border-radius)</span>
        <input style={inputStyle} value={value.borderRadius ?? ""} placeholder="예: 8px" onChange={(e) => patch({ borderRadius: e.target.value })} />
      </div>
      <div>
        <span style={label}>테두리 (border)</span>
        <input style={inputStyle} value={value.border ?? ""} placeholder="예: 1px solid #ccc" onChange={(e) => patch({ border: e.target.value })} />
      </div>
    </div>
  )
}

// ── FloatingToolbar ───────────────────────────────────────────────────────────

function FloatingToolbar({
  editorRef,
  containerRef,
  onExec,
}: {
  editorRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  onExec: (cmd: string, val?: string) => void
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const savedRange = useRef<Range | null>(null)

  useEffect(() => {
    function onSelChange() {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setPos(null)
        return
      }
      const range = sel.getRangeAt(0)
      if (!editorRef.current?.contains(range.commonAncestorContainer)) {
        setPos(null)
        return
      }
      savedRange.current = range.cloneRange()
      const rect = range.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return
      setPos({
        top: rect.top - containerRect.top - 46,
        left: Math.max(0, rect.left + rect.width / 2 - containerRect.left - 160),
      })
    }
    document.addEventListener("selectionchange", onSelChange)
    return () => document.removeEventListener("selectionchange", onSelChange)
  }, [editorRef, containerRef])

  function execWithRestore(cmd: string, val?: string) {
    if (savedRange.current) {
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(savedRange.current)
    }
    onExec(cmd, val)
  }

  if (!pos) return null

  return (
    <div
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        zIndex: 9000,
        pointerEvents: "auto",
      }}
    >
      <Toolbar editorRef={editorRef} onExec={execWithRestore} />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function RichTextEditor({
  mode,
  value = "",
  onChange,
  placeholder = "텍스트를 입력하세요...",
  minHeight = 80,
  disabled = false,
  className,
  style,
  blockSettings = {},
  onBlockSettingsChange,
  showBlockSettings = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (el.innerHTML !== value) {
      el.innerHTML = value
    }
  }, [value])

  function exec(cmd: string, val?: string) {
    if (disabled) return
    // styleWithCSS makes the browser output <span style="..."> instead of deprecated <font>/<b> etc.
    // This ensures inline styles have proper CSS specificity and aren't overridden by parent classes.
    try { document.execCommand("styleWithCSS", false, "true") } catch (_) {}
    document.execCommand(cmd, false, val)
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  function handleInput() {
    if (disabled || !onChange || !editorRef.current) return
    onChange(editorRef.current.innerHTML)
  }

  const editorStyle: React.CSSProperties = {
    outline: "none",
    minHeight,
    padding: blockSettings.padding ?? "8px 10px",
    background: blockSettings.background ?? "transparent",
    borderRadius: blockSettings.borderRadius ?? undefined,
    border: blockSettings.border ?? undefined,
    color: "inherit",
    lineHeight: 1.6,
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "text",
    userSelect: disabled ? "none" : "text",
  }

  if (mode === "block") {
    return (
      <div ref={containerRef} className={className} style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
        {!disabled && <Toolbar editorRef={editorRef} onExec={exec} />}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={handleInput}
          style={{
            ...editorStyle,
            border: blockSettings.border ?? "1px solid rgba(255,255,255,0.1)",
            borderRadius: blockSettings.borderRadius ?? "8px",
            background: blockSettings.background ?? "rgba(255,255,255,0.04)",
          }}
          className="rte-editor"
        />
        {showBlockSettings && onBlockSettingsChange && (
          <BlockSettingsPanel value={blockSettings} onChange={onBlockSettingsChange} />
        )}
      </div>
    )
  }

  // floating mode
  return (
    <div ref={containerRef} className={className} style={{ position: "relative", ...style }}>
      {!disabled && <FloatingToolbar editorRef={editorRef} containerRef={containerRef} onExec={exec} />}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
        style={{
          border: "1px solid hsl(var(--border))",
          borderRadius: "0.75rem",
          background: "transparent",
          fontSize: "0.875rem",
          ...editorStyle,
        }}
        className="rte-editor"
      />
    </div>
  )
}

export default RichTextEditor
