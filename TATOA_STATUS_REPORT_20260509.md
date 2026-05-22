# TATOA CMS 코드 상태 보고서
**작성일:** 2026-05-10 (Phase 1C 마무리 + STEP 19-A booking 통합 완료, STEP 19-B 와꾸 진입 직전)
**검증 방법:** grep + wc -l + tsc --noEmit (5/10 시점 bash 실행 결과 기반)
**Phase 1C 직전 베이스라인:** 2026-05-09 보고서 (`TATOA_STATUS_REPORT_20260509.md`)

---

## 프로젝트 정체

**TATOA CMS** — 피부미용 병원 체인 전용 콘텐츠 관리 시스템
- 각 지점(Branch)이 자신의 홈페이지를 CMS에서 직접 편집
- 어드민 UI에서 실시간 미리보기 하면서 작업하는 구조
- **비개발자(Jason)가 오너**, Claude들이 팀으로 개발

---

## 기술 스택 (변경 금지)

| 항목 | 버전/내용 |
|------|-----------|
| Framework | Next.js 16.2 (App Router) |
| UI Library | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + inline style 혼용 |
| Components | Radix UI + shadcn/ui |
| Icons | lucide-react |
| State | localStorage 기반 (Zustand 없음) |
| Backend | 없음 (전부 클라이언트) |
| Git | ❌ 없음 |
| 개발 서버 | localhost:7000 |

---

## 팀 역할 분담

| 역할 | 도구 | 담당 |
|------|------|------|
| 아이디어 제공 + 의사결정 | - | Jason |
| PM + 아키텍트 + 프롬프트 작성 | **Claude Chat** | 기획, 설계, 개발자 프롬프트 생성 |
| 시니어 개발자 | Claude Code | 코드 직접 구현, 파일 수정 |
| 테크 리포터 | Cowork | 코드 상태 스캔, 핸드오프 리포트 생성 |

---

## 핵심 파일 구조 (현재 실제 상태 — 5/10 wc -l 검증)

| 파일 | 줄 수 | 5/9 대비 변동 | 비고 |
|------|-------|---------------|------|
| `app/admin/branch/homepage/page.tsx` | **11,256** | (변경 없음) | 메인 편집기 (booking 외) |
| `components/site/sections/SectionPreviewBlock.tsx` | **2,058** | (변경 없음) | 섹션별 미리보기 라우터 |
| `components/site/sections/shared.tsx` | **1,569** | +5 (1,564→1,569) | 18-3-fix-3: `stripHtmlPreserveBreaks` `hadHtml` 분기 + `\n{3,}` 압축 + `^\n` 1개 trim |
| `lib/branch-website-store.tsx` | **584** | +30 (554→584) | 🆕 19-D-1: `migrateBookingValues` 신규 + `migrateSnapshot` booking 분기 추가 |
| `app/preview/homepage/[branchSlug]/page.tsx` | **1,558** | (변경 없음) | |
| `lib/staff-store.tsx` | **1,469** | (변경 없음) | |
| `app/admin/branch/staff/new/page.tsx` | **255** | (변경 없음) | |
| `app/admin/branch/staff/[staffId]/page.tsx` | **2,681** | (변경 없음) | |
| **🆕 `components/site/sections/booking-preview.tsx`** | **1,341** | (신규 — STEP 19-A-1-c+d + 19-A-4-fix 누적) | PreviewBooking + 15 서브컴포넌트 + 타입/상수/헬퍼 export 다수 |
| `app/admin/branch/homepage/booking-page.tsx` | **445** | **-1,275** (1,720→445) | booking-preview에서 import (자체 PreviewBooking 정의 제거) |
| `app/preview/site/[branchSlug]/booking/page.tsx` | **31** | **-124** (155→31) | useSiteData → snapshot.homepage.bookingValues → PreviewBooking |

```
app/
  admin/branch/homepage/
    page.tsx           ← 메인 편집기 (11,256줄)
                         ✅ Phase 1B STEP 4~9.1 완료
                         ✅ Phase 1C STEP 2~16-A-4-b-2 + 18-3-fix 시리즈 완료
                         ✅ Phase 1C STEP 19-A booking 통합 완료
                         🚧 STEP 17 (시각 검증 후), STEP 19-B 와꾸 정비 직전
    booking-page.tsx   ← 어드민 booking 편집기 (445줄)
                         🆕 PreviewBooking import (booking-preview.tsx)
                         🆕 singleBranches 계산 로직 (19-A-4)
  admin/branch/staff/
    new/page.tsx
    [staffId]/page.tsx
  admin/branch/
    events/page.tsx
    faq/page.tsx
    equipment/page.tsx
    equipment/new/page.tsx
    treatments/page.tsx
  admin/settings/
    page.tsx              ← TS 오류 2개 (기존)
    options/page.tsx
  admin/preview/
    chatbot/page.tsx
  preview/site/[branchSlug]/
    layout.tsx            ← 'use client' + usePathname (Phase 1C STEP 3)
    page.tsx              ← 홈
    treatments/
      page.tsx
      [slug]/page.tsx
    booking/page.tsx      ✅ STEP 19-A-3 완료 (31줄, PreviewBooking 호출만)
    directions/
      page.tsx            ← 28줄 (PreviewInfo 사용)
    events/[slug]/page.tsx
  preview/homepage/[branchSlug]/
    page.tsx              ← 1,558줄

lib/
  branch-website-store.tsx   ← 핵심 데이터 스토어 (584줄)
                               ✅ migrateTreatmentsPageValues 어드민 측 적용
                               ✅ snapshot packing에 badge + consultUrl 추가
                               ✅ FooterSocialExtra type export (16-A-1)
                               ✅ migrateFooterValues + migrateSnapshot 확장 (16-A-2-fix)
                               🆕 migrateBookingValues + migrateSnapshot booking 분기 (19-D-1)
  staff-store.tsx            ← StaffProfile (consultUrl 필드 포함)
  landing-preview-types.ts

components/site/
  SiteNav.tsx                ← Phase 1C에서 nav fixed overlay 변경
  sections/
    SectionPreviewBlock.tsx  ← 섹션별 미리보기 라우터 (2,058줄)
    shared.tsx               ← 공유 컴포넌트 (1,569줄)
                                ✅ renderTextWithLineBreaks (line 95, export)
                                🆕 stripHtmlPreserveBreaks 보강 (line 74, hadHtml 분기 + \n{3,} 압축 + ^\n trim)
    🆕 booking-preview.tsx   ← PreviewBooking 공유 컴포넌트 (1,341줄)
                                🆕 PreviewBooking export (line 1332)
                                🆕 BookingPhoneScreen + 15 서브컴포넌트 (private)
                                🆕 타입/상수/헬퍼/Context export 다수
    index.ts
```

---

## Phase 1B 진행 현황

### ✅ 완료된 STEP

| STEP | 내용 | 결과 |
|------|------|------|
| **4** | 옛 TreatmentCard 제거, PreviewTreatmentCard로 교체 | -107줄 + IIFE 패턴 도입 |
| **5/6.1** | 시술 카드 데이터 흐름 진단 | 3개 원인 확정 |
| **6.2** | badge packing + 어드민 측 migration + 테스트 사이트 하드코딩 제거 | 양쪽 일치 |
| **7** | description fallback chain 통일 (3곳) | description 양쪽 일치 |
| **8.1 D1** | TreatmentsPage PC 가상폭/scale 통일 (900→1280, 580→720) | PC 카드 픽셀 일치 |
| **8.1 E1** | TreatmentsPage 모바일 폰 프레임 scale (가상폭 375 + scale 0.528) | 모바일 폰트 비율 일치 |
| **9.0** | 디렉션 페이지 데이터 흐름 진단 | 별개 컴포넌트 확인 |
| **9.1** | 디렉션 페이지 컴포넌트 통일 (PreviewInfo export + page.tsx 재작성) | 양쪽 동일 컴포넌트 |
| **🆕 9.2 booking 부분** | Phase 1C STEP 19-A 시리즈로 해소 | 5/10 신규 완료 (아래 참조) |

### 🚧 Phase 1B 잔여 (미완)

| STEP | 내용 | 상태 |
|------|------|------|
| **8.2-A F1+F2** | DirectionsPreviewPage 가상폭/scale 통일 | F0 진단만 완료, 코드 미수정 |
| **9.2 cart/popup** | cart/popup 컴포넌트 통일 | booking 부분만 해소, cart/popup 미시작 |
| **8.2-B** | booking/cart/popup 가상폭/scale | booking은 19-C에서, cart/popup은 9.2 후 |
| BOX_PRESETS 잔존 | homepage/page.tsx 내 중복 정의 9참조 | 미제거 (절대 삭제 금지 식별자라 보존 정책) |

> ⚠️ STEP 8.2-A F0 진단 결과 (그대로 유효): DirectionsPreviewPage는 이미 900→1280 전환 완료, `innerWidth*0.38` 제거 완료. desktop 탭의 `DirectionsPhoneScreen` 호출(line ~8744)에만 `maxHeight` prop 누락 — F1+F2 코드 적용 대기.

---

## 🆕 Phase 1C 진행 현황 (2026-05-10 갱신)

### ✅ Phase 1C 완료 STEP — 5/9 이전 (변경 없음, 그대로 유효)

| STEP | 내용 | 핵심 결과 |
|------|------|-----------|
| **2~9-3-3** | Preview Panel / Hero / Events / 철학 / 아이콘 / 의료진 / 갤러리 / 강점 / split div | (5/9 보고서 참조) |
| **10~15** | INFO/지점소개 사이즈 통일, 캐러셀 UX | (5/9 보고서 참조) |
| **16-A 시리즈** | 푸터 어드민 데이터/UI 인프라 | FooterSocialExtra + migrateFooterValues + 동적 소셜 CRUD |
| **16-B 시리즈** | 푸터 미리보기 ODE 패턴 적용 | 3 파일 통합 |
| **18-1 / 18-1-fix** | `renderTextWithLineBreaks` + `stripHtmlPreserveBreaks` 신규 | 빈 줄 보존 인프라 |

### 🆕 Phase 1C 완료 STEP — 5/9 → 5/10 신규

#### STEP 18-3 시리즈 — 줄바꿈 빈 줄 보존 회귀 fix ✅

| Sub-step | 내용 | 검증 위치 |
|----------|------|-----------|
| **18-3** | philosophy 빈 줄 보존 적용 (3 파일 6곳) | 1차 적용 완료 |
| **18-3-fix-1** | `stripHtmlPreserveBreaks` ②③ 정규식 swap (`</(p\|div\|h\|li)>` → `\n` / 시작 태그 제거) | RTE `<div>line</div>` 패턴 정상 처리 |
| **18-3-fix-2** | 선두 `\n` trim 정밀화 (`\n+` → 단일 `\n`) | 사용자 의도 첫 빈 줄 보존 |
| **18-3-fix-3** | `hadHtml` 분기 + `\n{3,}` → `\n\n` 압축 + preview 강점 보강 | 평문 Textarea 입력 트림 회귀 fix + 18-3 미완 보강 |

**최종 형태 (`shared.tsx:74-90`)**:
```tsx
function stripHtmlPreserveBreaks(s: string | undefined | null): string {
  if (!s) return ""
  const raw = String(s)
  const hadHtml = /<[^>]+>/.test(raw)
  let out = raw
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)\s*>/gi, "")
    .replace(/<(p|div|h[1-6]|li)[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
  if (hadHtml) out = out.replace(/^\n/, "")
  return out
}
```

#### 🆕 STEP 19-A 시리즈 — booking 컴포넌트 통합 ✅ (Phase 1B STEP 9.2 booking 부분 해소)

| Sub-step | 내용 | 핵심 결과 |
|----------|------|-----------|
| **19-A-1-a** | `booking-preview.tsx` 신규 파일 생성 (placeholder) | 42줄, tsc 0건 |
| **19-A-1-b** | 타입/상수/헬퍼/Context 이전 | booking-preview ~270줄, booking-page -200줄 |
| **19-A-1-c+d** | 서브컴포넌트 15개 + `BookingPhoneScreen` 이전 + `branches` props 주입화 | booking-page 1,720→438줄, booking-preview ~1,337줄 |
| **19-A-3 + 19-D-1** | 테스트 사이트 재작성 + `migrateBookingValues` 신규 | preview booking/page.tsx 155→31줄, branch-website-store +30줄 |
| **19-A-4** | Step1 단일 지점 통일 (어드민도 mock 전체 → 단일) | booking-page +7줄 (438→445) |
| **19-A-4-fix** | `Step1Branch` `isPublic` 잠복 필터 제거 | booking-preview +3줄, 책임 분리 명확화 |

**해소 항목**: 5/9 보고서 "Phase 1B STEP 9.2 booking 통일 미완" → ✅ 해소
**Migration 매핑 (19-D-1)**: `pageTitle` → `bkTitle` (단방향, 옛 키 keep)
**자연 소멸 옛 키**: `pageSubtitle`, `ctaHeadline`, `phoneLabel`, `kakaoLabel`, `onlineLabel`, `firstVisitText`, `cautionText` (채널 링크형 전용 — 6단계 폼에 의미적 대응 없음)

**미해결 잔여**:
- Phase 1B STEP 9.2 cart/popup 통일 (booking 외)
- Phase 1B STEP 8.2-A F1+F2 (디렉션)
- Phase 1B STEP 8.2-B booking 가상폭/scale → Phase 1C STEP 19-C로 이관 예정

#### STEP 19-B 진입 직전 (다음 작업)

- 시술안내 톤 외곽 와꾸 (헤더 + max-w + 배경) 적용
- 참고 모델: `app/preview/site/[branchSlug]/treatments/page.tsx` (118줄)
- 적용 위치: `PreviewBooking` 외곽 또는 wrapper

---

## 코드 상태 검증 결과 (2026-05-10 grep/wc/tsc)

### 1. SIZE_MAP 정의 검증 — ✅ 5/9 그대로 유지 (6개 시스템 동일 픽셀 그리드)

| 식별자 | 정의 위치 | 값 |
|--------|-----------|----|
| `DOCTOR_SIZE_MAP` | `shared.tsx:53` (export) | xs:11, sm:15, md:19, lg:23, xl:27 |
| `DOCTOR_SIZE_MAP` (사본) | `homepage/page.tsx:4159` | 동일 |
| `PHILOSOPHY_SIZE_MAP` | `SectionPreviewBlock.tsx:58` | xs:11, sm:15, md:19, lg:23, xl:27, 2xl:31 |
| `GALLERY_SIZE_OPTIONS` | `homepage/page.tsx:210` (배열) | previewPx 11/15/19/23/27 |
| `STRENGTHS_SIZE_OPTIONS` | `homepage/page.tsx:218` (배열) | previewPx 11/15/19/23/27 |
| `INFO_SIZE_OPTIONS` | `homepage/page.tsx:228` (배열) | previewPx 11/15/19/23/27 |
| `BRANCH_INTRO_SIZE_OPTIONS` | `homepage/page.tsx:236` (배열) | previewPx 11/15/19/23/27 |

### 2. 푸터 시스템 검증 — ✅ 5/9 그대로 유지

(5/9 보고서 §2 참조 — 변경 없음)

### 3. 줄바꿈 보존 인프라 검증 — ✅ 18-3-fix-3 형태 갱신

| 검증 항목 | 위치 | 결과 |
|----------|------|------|
| `renderTextWithLineBreaks` 정의 | `shared.tsx:95` (export) | ✅ |
| `stripHtmlPreserveBreaks` 정의 | `shared.tsx:74` (private) | ✅ |
| 🆕 `hadHtml` 분기 (HTML/평문 모드 자동 판별) | `shared.tsx:77, 88` | ✅ 18-3-fix-3 |
| 🆕 `\n{3,}` → `\n\n` 압축 (3 빈 줄 이상 → 1 빈 줄) | `shared.tsx:87` | ✅ |
| 🆕 HTML일 때만 `^\n` 1개 trim | `shared.tsx:88` | ✅ |
| `renderTextWithLineBreaks` import (preview block) | `SectionPreviewBlock.tsx:52` | ✅ |
| 강점 섹션 사용 (s1/s2 헤드라인+설명) | `SectionPreviewBlock.tsx:1107, 1110, 1172, 1175` | ✅ |
| 의료진 shortIntro 사용 | `shared.tsx:1148` | ✅ |
| 사이드바 사본 적용 (philosophy 포함) | homepage/page.tsx 9곳 | ✅ 18-3-fix-3 |

### 4. consultUrl 적용 검증 — ✅ 5/9 그대로

(5/9 보고서 §4 참조 — 변경 없음)

### 5. 갤러리 메인 이미지 aspectRatio + 1.25배 검증 — ✅ 5/9 그대로

(5/9 보고서 §5 참조 — 변경 없음)

### 6. 브랜드 강점 카드 박스 2배 + 9-3-3 split div 검증 — ✅ 5/9 그대로

(5/9 보고서 §6 참조 — 변경 없음)

### 🆕 7. booking 통합 시스템 검증 — ✅ 신규 카테고리

| 검증 항목 | 위치 | 결과 |
|----------|------|------|
| `PreviewBooking` 정의 | `components/site/sections/booking-preview.tsx:1332` (export) | ✅ |
| `BookingPhoneScreen` (private) | `booking-preview.tsx` 내부 | ✅ |
| 15 서브컴포넌트 (PhoneNav, MenuDrawer, StepBar, PageHeader, StepHeader, PillLabel, SummaryBox, NavButtons, Step1Branch, Step2Option, Step3Treatments, Step4DateTime, Step5Info, Step6Confirm) | `booking-preview.tsx` 내부 (private) | ✅ |
| `BranchInfo` 타입 (export) | `booking-preview.tsx:29-34` | ✅ |
| `PreviewBookingProps` 타입 (export) | `booking-preview.tsx:36-41` | ✅ |
| 어드민 caller — 3 위치 | `booking-page.tsx:392, 418, 430` | ✅ (모바일/데스크톱/풀스크린) |
| 테스트 사이트 caller — 1 위치 | `app/preview/site/[branchSlug]/booking/page.tsx:24` | ✅ |
| `migrateBookingValues` 정의 | `lib/branch-website-store.tsx:279` (export) | ✅ |
| `migrateSnapshot` booking 분기 | `lib/branch-website-store.tsx:311-317` | ✅ |
| 옛 키 직접 참조 (booking 경로) | `app/preview/site/[branchSlug]/booking/`, `booking-preview.tsx` | **0건** ✅ |
| `singleBranches` 계산 로직 (어드민) | `booking-page.tsx` 내부 (mock 단일 지점 추출) | ✅ |
| BroadcastChannel 동기화 — 어드민 발신 | `homepage/page.tsx:10232, 10439` (`SITE_LIVE_BROADCAST(branch.id)`) | ✅ |
| BroadcastChannel 동기화 — 테스트 사이트 수신 | `preview/site/[branchSlug]/layout.tsx:92` | ✅ |
| snapshot packing — bookingValues | `homepage/page.tsx:10220, 10394` | ✅ |

> **데이터 흐름 (정적 추론)**: 어드민 `bkTitle` 변경 → `scheduleLiveSnapshot` → `bw_draft_${branch.id}` write → BroadcastChannel `bw_live_${branch.id}` 발신 → 테스트 사이트 `layout.tsx` 수신 → `loadDraftSnapshot` → `migrateSnapshot` → `migrateBookingValues` 통과 → `useSiteData` → `snapshot.homepage.bookingValues` → `<PreviewBooking values={...} />` ✅

---

## 핵심 데이터 타입 (5/10 갱신)

```typescript
type SiteSnapshot = {
  branch: BranchInfo
  homepage: {
    sections: HomeSection[]
    sectionValues: Record<string, Record<string, FieldValue>>
    treatmentsPageValues: Record<string, FieldValue>
    bookingValues: Record<string, FieldValue>      // ✅ 19-D-1 migrateBookingValues 적용
    cartValues: Record<string, FieldValue>
    popupData: SitePopupData
  }
  doctors: SiteDoctorCard[]              // ✅ Phase 1C: consultUrl
  equipment: SiteEquipmentCard[]
  treatments: SiteTreatmentCard[]        // ✅ Phase 1B STEP 6.2: badge
  events: SiteEventCard[]
}

// 🆕 Phase 1C STEP 19-A-1-b: booking-preview.tsx 공통 타입
export type FieldValue = string | boolean | string[] | number
export type PageId = "home" | "treatments" | "booking" | "directions"
export type TreatmentOption = "원장 상담만" | "상담 후 시술" | "시술만 진행"
export type VisitType = "초진" | "재진"
export type ThemeTokens = { gold; textPrimary; textSub; textMuted; border; borderGold; cardBg; cardBgGold; searchBg; divider; footerBg; stepMutedBg }

export type BranchInfo = {
  id: string
  name: string
  address?: string
  isPublic?: boolean
}

export type PreviewBookingProps = {
  values: Record<string, FieldValue>
  branchId: string
  branches: BranchInfo[]
  onNavigate?: (page: PageId) => void
}
```

---

## 어드민 미리보기 시스템 — 두 가지 시스템 공존 (5/10 갱신)

| 시스템 | 가상폭 | 컨테이너 | 사용 페이지 |
|--------|--------|----------|-------------|
| **신형 PreviewPanel** | 1280px | clamp(500px, 50vw, 720px) | 메인 홈 편집기 + TreatmentsPage(STEP 8.1 후) + Phase 1C 신규 작업물 |
| **구형** | 900px | Math.min(window.innerWidth*0.38, 580) | DirectionsPreviewPage⚠️(미적용 잔여) + **booking-page⚠️(19-C 적용 예정)** + cart-page + popup-page |

**진행 계획**: 구형 4곳을 신형 시스템으로 통일 중. STEP 8.1로 TreatmentsPage 1곳 끝 → 8.2-A 디렉션 진행 중(F1+F2 미적용) → STEP 19-A 컴포넌트 통합 완료 (booking) → STEP 19-C에서 booking 가상폭/scale 적용 예정 → 이후 cart/popup.

---

## 🆕 Phase 1C 패턴 라이브러리 (5/10 갱신)

### 패턴 P3~P13 — 5/9 그대로 유효

(5/9 보고서 §패턴 라이브러리 참조)

### 🆕 패턴 P14 — 별도 파일 + props 주입 (mock 의존 컴포넌트의 공유화)

**검증 위치**: STEP 19-A-1-d (`PreviewBooking` 신규 분리)

기존 디렉션 패턴(P3 = `PreviewInfo`를 `SectionPreviewBlock`에 직접 export)은 외부 데이터 의존 없는 경우만 적용 가능. mock 데이터 의존 컴포넌트는 `SectionPreviewBlock`에 직접 export 시 테스트 사이트에 mock 혼입 위험.

**해법**: 신규 별도 파일 + 데이터를 props로 주입.

```tsx
// caller (어드민 booking-page.tsx)
const singleBranches = [branches.find(b => b.id === branchId) ?? fallback]
<PreviewBooking branches={singleBranches} ... />

// caller (테스트 사이트 preview/site/.../booking/page.tsx)
const branches = [{ id: snapshot.branch.id, name: snapshot.branch.name, address: snapshot.branch.address, isPublic: true }]
<PreviewBooking branches={branches} ... />
```

**원칙**: 컴포넌트는 받은 데이터만 표시. 필터링/매핑은 caller 책임.

**학습 (19-A-4-fix)**: `Step1Branch` 내부에 `branches.filter(b => b.isPublic)` 잠복 → caller가 단일 지점 줘도 컴포넌트가 다시 필터해서 0건 됨. **책임 분리 위반 사례** — caller가 이미 정제한 배열을 컴포넌트가 또 정제하면 의도와 어긋남. 컴포넌트는 받은 그대로 표시할 것.

---

## 데이터 동기화 — BroadcastChannel (5/10 그대로)

```
채널명: bw_live_${branchId}
발신: 어드민이 저장할 때 "update" 메시지 전송
수신: 테스트 사이트 layout.tsx가 수신 → snapshot 즉시 reload
```

### localStorage 키 구조 (5/9 그대로)

(5/9 보고서 참조)

> **migrate 호환**: 16-A-2-fix `migrateFooterValues` + 🆕 19-D-1 `migrateBookingValues`가 `migrateSnapshot`에서 자동 적용되므로, 옛 키(`clinicLegalName`, `pageTitle` 등) 보유한 기존 사용자 데이터도 무손실 호환.

---

## Migration 매핑 테이블 (절대 변경 금지) — 5/10 확장

### `migrateTreatmentsPageValues` (기존, 5/9 그대로)

(5/9 보고서 참조)

### `migrateFooterValues` (16-A-2-fix, 5/9 그대로)

(5/9 보고서 참조)

### 🆕 `migrateBookingValues` (19-D-1, `lib/branch-website-store.tsx:279`)

| 옛 키 | → | 새 키 | 비고 |
|-------|---|-------|------|
| pageTitle | → | bkTitle | 단방향 sync (옛 키 keep) |

**자연 소멸 옛 키 (매핑 안 함)**:
- `pageSubtitle`
- `ctaHeadline`
- `phoneLabel`
- `kakaoLabel`
- `onlineLabel`
- `firstVisitText`
- `cautionText`

> 채널 링크형(옛) → 6단계 폼(신) 전환 시 데이터 모델 자체가 변경됨. 의미 동일한 키만 매핑하고, 나머지 옛 키들은 객체에 잔존하되 신규 컴포넌트가 읽지 않음. 신규 컴포넌트가 옛 키를 직접 참조하지 않음을 grep으로 검증 (0건).
>
> ⚠️ 향후 데이터 cleanup migration 필요성은 **후속 검토 항목**으로 등재 (현 시점 기능 영향 없음).

⚠️ 이 매핑 자체를 변경하면 모든 사용자의 기존 데이터 깨짐.

---

## 컬러 시스템 (5/9 그대로)

(5/9 보고서 참조)

---

## 현재 TS 오류 현황 (tsc --noEmit, 2026-05-10)

**총 7건** — Phase 1B 베이스라인과 동일. **STEP 18-3 시리즈 + 19-A 시리즈 작업으로 신규 TS 오류 발생 없음.**

| 파일 | 오류 수 | 비고 |
|------|---------|------|
| `app/admin/branch/page.tsx` | 1 | `'archived'` type overlap (기존) |
| `app/admin/settings/page.tsx` | 2 | `hasToggle`/`defaultOn` 누락 (기존) |
| `app/admin/branch/treatments/[treatmentId]/page.tsx` | 1 | `LandingSectionType` 불일치 |
| `app/preview/landing/[draftId]/page.tsx` | 1 | Props `progressInfo` 타입 불일치 |
| `components/admin/ai-landing-modal.tsx` | 1 | `Record<LandingSectionType, string>` 누락 키 |
| `components/admin/landing-section-editor.tsx` | 1 | `'faq_section'` type overlap |

> 핵심 파일 (homepage/page.tsx, SectionPreviewBlock.tsx, shared.tsx, lib/branch-website-store.tsx, lib/staff-store.tsx, staff/new/page.tsx, staff/[staffId]/page.tsx, preview/homepage/[branchSlug]/page.tsx, **🆕 booking-preview.tsx**, **🆕 booking-page.tsx**, **🆕 preview/site/[branchSlug]/booking/page.tsx**) 11개 파일 모두 0건 유지.

---

## 절대 금지 코딩 규칙 ⚠️ (5/9 그대로)

```tsx
// ❌ JSX style 속성 안에서 템플릿 리터럴 절대 금지
// ✅ 반드시 문자열 연결 사용
```

### Write 도구 사용 금지 규칙

```
❌ Write 도구로 대용량 파일(수백 줄 이상) 작성 금지 → 파일 중간 잘림
✅ 항상 Edit 도구로 부분 수정
✅ 수정 후 반드시 wc -l [파일명] 으로 줄 수 확인
✅ 줄 수가 예상보다 적으면 즉시 중단하고 Jason에게 보고
```

> ⚠️ **5/10 신규 검토 항목**: 19-A-1-c+d 시점 booking-page.tsx가 1,720→438줄로 1,275줄 감소했고, Code가 응답에 "clean final version" 표현을 사용한 정황이 있어 Write 도구 사용 흔적 의심. Git이 없는 프로젝트라 직접 추적은 어려우나, 현재 파일 무결성(import 순서, 식별자 정합성, tsc 0건) 기준으로는 회귀 없음을 확인. **다음 세션에서 Code에 "Write 사용 금지 + Edit 우선" 룰을 프롬프트 헤더에 명시할 것**.

### 🆕 Code 자체 판단 단계 합치기 금지 규칙 (5/10 신규)

```
❌ Chat이 명시한 sub-step을 Code가 임의로 합쳐서 한 단계로 진행 금지
✅ 단계 합치기 필요 시 Code → Chat 승인 요청 → 합쳐도 OK 답변 후 진행
```

> 19-A-1-c와 19-A-1-d를 Code가 Chat 승인 없이 한 단계로 통합한 사례 발생. 다음 작업에서도 발생 가능성 — 개발자 프롬프트 헤더에 명시 권장.

---

## 절대 삭제 금지 식별자 ⚠️ (5/10 갱신)

(5/9 식별자 그대로 유지 + 아래 신규 추가)

### 🆕 5/10 신규 식별자

| 식별자 | 위치 | 의존 컴포넌트 |
|--------|------|--------------|
| **🆕 `PreviewBooking`** | `components/site/sections/booking-preview.tsx:1332` (export) | booking-page.tsx (3곳), preview/site/.../booking/page.tsx |
| **🆕 `BookingPhoneScreen`** | `booking-preview.tsx` 내부 (private) | PreviewBooking |
| **🆕 15 서브컴포넌트** | `booking-preview.tsx` 내부 (private) | PhoneNav, MenuDrawer, StepBar, PageHeader, StepHeader, PillLabel, SummaryBox, NavButtons, Step1Branch, Step2Option, Step3Treatments, Step4DateTime, Step5Info, Step6Confirm |
| **🆕 `BranchInfo` 타입** | `booking-preview.tsx:29` (export) | PreviewBookingProps + 양 caller |
| **🆕 `PreviewBookingProps` 타입** | `booking-preview.tsx:36` (export) | PreviewBooking |
| **🆕 booking 공통 export 식별자** | `booking-preview.tsx` (export) | `FieldValue`, `PageId`, `TreatmentOption`, `VisitType`, `ThemeTokens`, `GOLD`, `DARK_BG`, `DARK_TO_LIGHT`, `STEP_ICONS`, `STEP_LABELS`, `TREATMENT_OPTIONS`, `DAYS_KO`, `FONTS`, `EYEBROW_SIZES`, `TITLE_SIZES`, `DESC_SIZES`, `WEIGHTS`, `DEFAULT_VALUES`, `val`, `makeTokens`, `resolveUserColor`, `getFontCss`, `getEyebrowPx`, `getTitlePx`, `getDescPx`, `generateTimeSlots`, `getCalendarDays`, `ThemeCtx`, `useTheme` |
| **🆕 `migrateBookingValues`** | `lib/branch-website-store.tsx:279` (export) | STEP 19-D-1, migrateSnapshot booking 분기에서 호출 |
| **🆕 `singleBranches` 계산 로직** | `booking-page.tsx` 내부 | 19-A-4 어드민 단일 지점 통일 |
| **🆕 bk\* prefix 키들** | `sectionValues.bookingValues` 스키마 | `bkBgTheme`, `bkEyebrow`, `bkEyebrowFont`, `bkEyebrowSize`, `bkEyebrowColor`, `bkTitle`, `bkTitleFont`, `bkTitleSize`, `bkTitleWeight`, `bkTitleColor`, `bkDescFont`, `bkDescSize`, `bkDescColor`, `bkDesc1`~`bkDesc6`, `bkStartHour`, `bkEndHour`, `bkInterval` |

---

## 🆕 다음 세션 우선순위 (5/10 갱신)

### 즉시 (새 세션 시작 시)

1. **STEP 19-B-1 진단** — 시술안내 톤 외곽 와꾸 (헤더 + max-w + 배경)
   - 참고 모델: `app/preview/site/[branchSlug]/treatments/page.tsx` (118줄)
   - 적용 위치: `PreviewBooking` 외곽 또는 wrapper

### 그 다음

2. **STEP 19-B-2** — 6단계 폼 카드 톤 정비
3. **STEP 19-B-3** — 모바일/PC 반응
4. **STEP 19-C** — 가상폭/scale 신형 1280/375 (Phase 1B STEP 8.2-B booking 부분)

### Phase 1B 잔여 (지연)

5. **STEP 8.2-A F1+F2** — DirectionsPreviewPage 가상폭/scale 통일 (프롬프트 준비됨)
6. **STEP 9.2 cart/popup** — booking 외 잔여 (cart-page, popup-page)
7. **STEP 6-3, 6-4** — 아이콘 복수화 어드민 UI 카드 + 섹션 경계 clamp

### 검토 사항 (새 세션 시작 시 Jason과 결정)

1. **Code 자체 판단 단계 합치기** — 개발자 프롬프트 헤더에 룰 추가 시점 결정
2. **booking-page.tsx 1,275줄 감소 시점 Write 사용 흔적** — 가능한 방법으로 재검증 (mtime/diff)
3. **자연 소멸 옛 booking 키 cleanup migration** — 시점 결정 (현 시점 기능 영향 없음)
4. **STEP 17** — 카피라이트 이중 노출 처리 결정 (`preview/homepage/[branchSlug]/page.tsx`)

### 지연

- 페이지 외곽 통일, SiteFooter 추출, 잔존 TS 오류 7건 정리

---

## 다음 세션 시작 시 가장 먼저 할 일

1. **코워크에 코드 상태 스캔 의뢰** (이 5/10 문서가 실제 코드와 일치하는지 검증)
2. **STEP 19-B-1 진단 프롬프트 작성** — 시술안내 톤 와꾸 분석 (read-only)
3. Jason 시각 검증 → 19-B-2 / 19-B-3 분기 결정
4. 19-B 시리즈 마무리 후 19-C (가상폭/scale) 진행

---

## 개발자 프롬프트 작성 규칙 (Chat의 역할)

(5/9 그대로 유지)

### 🆕 5/10 신규 헤더 룰 (검토 항목)

다음 sub-step부터 개발자 프롬프트 헤더에 추가 권장:

```
### Code 작업 룰

1. **Edit 도구 우선** — Write 도구로 대용량 파일 작성 금지 (파일 중간 잘림 위험).
2. **단계 분리 준수** — Chat이 명시한 sub-step을 임의로 합치지 말 것. 합치기 필요 시 Chat 승인 후 진행.
3. **모든 수정 후 검증** — wc -l + grep + tsc --noEmit 실행, 결과를 응답에 포함.
```

### 큰 변경 시 작업 분할 패턴 (그대로 유효)

```
STEP X.0  read-only 진단 (그렙·view만, 수정 X)
          ↓ Chat 검토 + Jason 결정
STEP X.1  fix mini-step 1 → wc -l + grep + tsc 검증
          ↓ Jason 시각 검증 (필요 시)
STEP X.2  fix mini-step 2 → 검증
          ↓ ...
```

> **5/10 시점 학습 (19-A 시리즈)**: booking 통합처럼 "별도 파일 신설 + 컴포넌트 이전 + caller 마이그레이션 + 데이터 마이그레이션" 4축 작업은 **a(파일 생성) → b(타입/상수 이전) → c(컴포넌트 이전) → d(props 주입화) → 3(테스트 사이트 caller) → D-1(데이터 migration) → 4(UX 통일) → 4-fix(잠복 필터 제거)** 순서가 적합. 핵심은 컴포넌트 이전 후 양 caller가 PreviewX를 호출하는 시점에 양쪽 시각 검증을 한 번 하고, 데이터 migration은 마지막 단계에서 별도로 분리. caller 책임 분리 원칙 준수 (P14).