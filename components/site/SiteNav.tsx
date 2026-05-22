"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Phone } from "lucide-react"
import type { SiteSnapshot } from "@/lib/branch-website-store"
import { cn } from "@/lib/utils"

type NavProps = {
  snapshot: SiteSnapshot
  branchSlug: string
  isPreview?: boolean
  device?: "mobile" | "desktop"
  scrollContainer?: HTMLElement | null
  mobileScrollReveal?: boolean
  mobileRevealThreshold?: number
}

const NAV_LINKS = (slug: string) => [
  { label: "시술안내", href: `/preview/site/${slug}/treatments` },
  { label: "예약하기", href: `/preview/site/${slug}/booking` },
  { label: "상시채용", href: `/preview/site/${slug}/recruit` },
]

export function SiteNav({ snapshot, branchSlug, isPreview = true, device: deviceProp, scrollContainer, mobileScrollReveal = false, mobileRevealThreshold }: NavProps) {
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [scrolled,   setScrolled]   = useState(false)
  const [autoDevice, setAutoDevice] = useState<"mobile" | "desktop">("desktop")
  const [mounted,    setMounted]    = useState(false)
  const [visible,    setVisible]    = useState(true)
  const lastYRef             = useRef(0)
  const passedThresholdRef   = useRef(false)
  const passedAtRef          = useRef(0)
  const pathname = usePathname()

  const isMobile = deviceProp === "mobile" || (deviceProp === undefined && autoDevice === "mobile")

  // Scroll: background opacity + mobile reveal/hide
  useEffect(() => {
    const isRevealMode = isMobile && mobileScrollReveal

    if (isRevealMode) {
      setVisible(false)
      passedThresholdRef.current = false
      lastYRef.current = 0
    } else {
      setVisible(true)
      passedThresholdRef.current = false
    }

    const isWindow = !scrollContainer
    const target: Window | HTMLElement | null = isWindow
      ? (typeof window !== "undefined" ? window : null)
      : scrollContainer
    if (!target) return

    const getY  = () => isWindow ? window.scrollY : scrollContainer!.scrollTop
    const getH  = () => isWindow ? window.innerHeight : scrollContainer!.clientHeight
    const getThreshold = () =>
      mobileRevealThreshold !== undefined ? mobileRevealThreshold : getH() * (2 / 3)

    const SCROLL_DELTA = 5
    const REVEAL_GRACE_MS = 400

    const onScroll = () => {
      const y = getY()

      setScrolled(y > 60)

      if (!isRevealMode) return

      const t = getThreshold()
      if (y < t) {
        setVisible(false)
        passedThresholdRef.current = false
        lastYRef.current = y
      } else if (!passedThresholdRef.current) {
        setVisible(true)
        passedThresholdRef.current = true
        passedAtRef.current = Date.now()
        lastYRef.current = y
      } else {
        const sinceReveal = Date.now() - passedAtRef.current
        if (sinceReveal < REVEAL_GRACE_MS) {
          lastYRef.current = y
        } else {
          const delta = y - lastYRef.current
          if (Math.abs(delta) >= SCROLL_DELTA) setVisible(delta < 0)
          lastYRef.current = y
        }
      }
    }

    target.addEventListener("scroll", onScroll, { passive: true })
    onScroll()

    return () => {
      target.removeEventListener("scroll", onScroll)
    }
  }, [isMobile, scrollContainer, mobileScrollReveal, mobileRevealThreshold])

  // Auto device detection — runs only when deviceProp is not provided
  useEffect(() => {
    setMounted(true)
    if (deviceProp) return
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setAutoDevice(mq.matches ? "mobile" : "desktop")
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [deviceProp])

  // Effective device (kept for downstream use; className overrides below also use deviceProp directly)
  void (mounted ? (deviceProp ?? autoDevice) : "desktop")

  // Visibility class strings
  // - deviceProp === "mobile":  force mobile (hide desktop, show mobile, regardless of viewport)
  // - deviceProp === "desktop": force desktop (show desktop, hide mobile)
  // - undefined (auto):         use Tailwind md: media-query classes (real browser width)
  const desktopOnlyClass = deviceProp === "mobile"
    ? "hidden"
    : deviceProp === "desktop"
      ? "flex"
      : "hidden md:flex"
  const mobileOnlyClass = deviceProp === "desktop"
    ? "hidden"
    : deviceProp === "mobile"
      ? "flex"
      : "flex md:hidden"
  const drawerOnlyClass = deviceProp === "desktop"
    ? "hidden"
    : deviceProp === "mobile"
      ? ""
      : "md:hidden"

  const navLinks  = NAV_LINKS(branchSlug)
  const navTheme  = (snapshot.homepage.sectionValues["hero"]?.navTheme as string) || "dark"
  const isDarkNav = navTheme !== "light"

  // Background: transparent at top, solid on scroll
  const navBg = isDarkNav
    ? scrolled ? "rgba(10,8,5,0.97)" : "rgba(10,8,5,0.82)"
    : scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)"

  const textColor    = isDarkNav ? "#f5f0e8"          : "#111111"
  const textMuted    = isDarkNav ? "rgba(245,240,232,0.65)" : "#666666"
  const hoverBg      = isDarkNav ? "rgba(255,255,255,0.10)"  : "rgba(0,0,0,0.06)"
  const activeBg     = isDarkNav ? "rgba(201,168,92,0.22)"   : "#111111"
  const activeText   = isDarkNav ? "#c9a85c" : "#ffffff"
  const borderColor  = isDarkNav ? "rgba(255,255,255,0.08)"  : "rgba(0,0,0,0.08)"
  const drawerBg     = isDarkNav ? "#0a0805" : "#ffffff"

  return (
    <>
      {/* Preview badge — smaller, unobtrusive */}
      {isPreview && (
        <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, background:"rgba(201,168,92,0.92)", backdropFilter:"blur(4px)", color:"#0e0c09", fontSize:"11px", fontWeight:600, textAlign:"center", padding:"3px 0", letterSpacing:"0.05em" }}>
          테스트 미리보기
        </div>
      )}

      {/* Main nav */}
      <header
        style={{
          position:"fixed", left:0, right:0, zIndex:150,
          top: isPreview ? "23px" : 0,
          background: navBg,
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid " + borderColor,
          transform: (isMobile && mobileScrollReveal) ? (visible ? "translateY(0)" : "translateY(-100%)") : "translateY(0)",
          transition: "transform 250ms ease-out, background 300ms ease",
        }}
      >
        <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"0 1.5rem", height:"60px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {/* Logo */}
          <Link href={`/preview/site/${branchSlug}`} style={{ display:"flex", alignItems:"center", gap:"0.625rem", textDecoration:"none" }}>
            {/* T icon */}
            <div style={{ width:"32px", height:"32px", borderRadius:"8px", background: isDarkNav ? "rgba(201,168,92,0.18)" : "#111111", border: "1px solid " + (isDarkNav ? "rgba(201,168,92,0.35)" : "transparent"), display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:"14px", fontWeight:700, color: isDarkNav ? "#c9a85c" : "#ffffff", letterSpacing:"-0.02em" }}>T</span>
            </div>
            <div>
              <p style={{ fontSize:"13px", fontWeight:700, color:textColor, letterSpacing:"0.06em", lineHeight:1.1 }}>{snapshot.branch.name.toUpperCase()}</p>
              {snapshot.branch.shortIntro && (
                <p style={{ fontSize:"9px", fontWeight:400, color:textMuted, letterSpacing:"0.12em", textTransform:"uppercase", lineHeight:1 }}>DERMATOLOGY</p>
              )}
            </div>
          </Link>

          {/* Desktop nav links — centered */}
          <nav style={{ alignItems:"center", gap:"4px" }} className={desktopOnlyClass}>
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding:"6px 16px", borderRadius:"999px",
                    fontSize:"13px", fontWeight: isActive ? 600 : 400,
                    color: isActive ? activeText : textMuted,
                    background: isActive ? activeBg : "transparent",
                    textDecoration:"none",
                    transition:"all 0.15s ease",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.target as HTMLElement).style.background = hoverBg }}
                  onMouseLeave={e => { if (!isActive) (e.target as HTMLElement).style.background = "transparent" }}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop right side */}
          <div style={{ alignItems:"center", gap:"8px" }} className={desktopOnlyClass}>
            {snapshot.branch.phone && (
              <a href={`tel:${snapshot.branch.phone}`} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"13px", color:textMuted, textDecoration:"none", padding:"4px 8px" }}>
                <Phone size={13} />
                {snapshot.branch.phone}
              </a>
            )}
            {snapshot.branch.bookingLink && (
              <a
                href={snapshot.branch.bookingLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding:"7px 18px", borderRadius:"999px", background: isDarkNav ? "#c9a85c" : "#111111", color: isDarkNav ? "#0e0c09" : "#ffffff", fontSize:"13px", fontWeight:600, textDecoration:"none" }}
              >
                예약하기
              </a>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            style={{ alignItems:"center", justifyContent:"center", width:"36px", height:"36px", borderRadius:"8px", background:"transparent", border:"none", cursor:"pointer", color:textColor }}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="메뉴"
            className={mobileOnlyClass}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div style={{ background:drawerBg, borderTop:"1px solid " + borderColor }} className={drawerOnlyClass}>
            <nav style={{ display:"flex", flexDirection:"column", padding:"12px 16px", gap:"4px" }}>
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      padding:"12px 16px", borderRadius:"10px",
                      fontSize:"14px", fontWeight: isActive ? 600 : 400,
                      color: isActive ? activeText : textColor,
                      background: isActive ? activeBg : "transparent",
                      textDecoration:"none",
                    }}
                  >
                    {link.label}
                  </Link>
                )
              })}
              {snapshot.branch.bookingLink && (
                <a
                  href={snapshot.branch.bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  style={{ marginTop:"8px", padding:"13px", borderRadius:"10px", background: isDarkNav ? "#c9a85c" : "#111111", color: isDarkNav ? "#0e0c09" : "#ffffff", fontSize:"14px", fontWeight:600, textAlign:"center", textDecoration:"none" }}
                >
                  예약하기
                </a>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
