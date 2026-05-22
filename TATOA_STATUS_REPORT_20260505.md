# TATOA CMS 코드 상태 보고서
**작성일:** 2026-05-08 (Phase 1C 진행 중)
**검증 방법:** grep + wc -l + tsc --noEmit (bash 실행 결과 기반)
**Phase 1B 베이스라인:** 2026-05-05 보고서 (`TATOA_STATUS_REPORT_20260505.md`)

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

## 핵심 파일 구조 (현재 실제 상태)

| 파일 | 줄 수 | 비고 |
|------|-------|------|
| `app/admin/branch/homepage/page.tsx` | **10,459** | Phase 1B 시점 10,539 대비 -80 (Phase 1C UI 정리 + 통일) |
| `components/site/sections/SectionPreviewBlock.tsx` | **1,790** | Phase 1B 시점 1,701 대비 +89 (PreviewInfo, 의료진/갤러리 강화) |
| `components/site/sections/shared.tsx` | **1,535** | Phase 1B 시점 1,479 대비 +56 (DoctorCard, S2StatCard 등) |
| `lib/staff-store.tsx` | **1,469** | `consultUrl?: string` 필드 추가 |
| `app/admin/branch/staff/new/page.tsx` | **255** | consultUrl Input 추가 |
| `app/admin/branch/staff/[staffId]/page.tsx` | **2,681** | consultUrl 편집 + 데이터 sync |

```
app/
  admin/branch/homepage/
    page.tsx           ← 메인 편집기 (10,459줄)
                         ✅ Phase 1B STEP 4~9.1 완료
                         ✅ Phase 1C STEP 2~9-3-1 진행 (아래 표 참고)
  admin/branch/staff/
    new/page.tsx       ← 의료진 신규 등록 (consultUrl 지원)
    [staffId]/page.tsx ← 의료진 수정 (consultUrl 지원)
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
    booking/page.tsx      ⚠️ Phase 1B STEP 9.2 통일 미완
    directions/
      page.tsx            ← 28줄 (PreviewInfo 사용)
    events/[slug]/page.tsx

lib/
  branch-website-store.tsx   ← 핵심 데이터 스토어
                               ✅ migrateTreatmentsPageValues 어드민 측 적용
                               ✅ snapshot packing에 badge + consultUrl 추가
  staff-store.tsx            ← StaffProfile (consultUrl 필드 포함)
  landing-preview-types.ts

components/site/
  SiteNav.tsx                ← Phase 1C에서 nav fixed overlay 변경
  sections/
    SectionPreviewBlock.tsx  ← 섹션별 미리보기 라우터 (1,790줄)
    shared.tsx               ← 공유 컴포넌트 (1,535줄)
                                PreviewTreatmentCard, SiteDoctorCardFull,
                                S2StatCard, BOX_PRESETS, DOCTOR_SIZE_MAP, …
    index.ts
```

---

## Phase 1B 진행 현황 (2026-05-05 시점, 그대로 유지)

### ✅ 완료된 STEP

| STEP | 내용 | 결과 |
|------|------|------|
| **4** | 옛 TreatmentCard 제거, PreviewTreatmentCard로 교체 | homepage/page.tsx -107줄 + IIFE 패턴 도입 |
| **5/6.1** | 시술 카드 데이터 흐름 진단 | 3개 원인 확정 (콘솔 검증) |
| **6.2** | badge packing + 어드민 측 migration + 테스트 사이트 하드코딩 제거 | 시술명 색·badge 양쪽 일치 |
| **7** | description fallback chain 통일 (3곳) | description 텍스트 양쪽 일치 |
| **8.1 D1** | TreatmentsPage PC 가상폭/scale 통일 (900→1280, 580→720) | PC 카드 본 사이트와 거의 픽셀 일치 |
| **8.1 E1** | TreatmentsPage 모바일 폰 프레임 scale (가상폭 375 + scale 0.528) | 모바일 폰트 비율 진짜 폰과 일치 |
| **9.0** | 디렉션 페이지 데이터 흐름 진단 | 어드민/테스트 사이트 별개 컴포넌트 확인 |
| **9.1** | 디렉션 페이지 컴포넌트 통일 (PreviewInfo export + page.tsx 재작성) | 양쪽 동일 컴포넌트·동일 데이터 (다크 박스형) |

### 🚧 Phase 1B 잔여 (Phase 1C 시작 후 미완료)

| STEP | 내용 | 상태 |
|------|------|------|
| **8.2-A F1+F2** | DirectionsPreviewPage 가상폭/scale 통일 | F0 진단만 완료, 코드 미수정 |
| **9.2** | booking/cart/popup 컴포넌트 통일 | 미시작 |
| **8.2-B** | booking/cart/popup 가상폭/scale | 9.2 후 |
| BOX_PRESETS 잔존 | homepage/page.tsx 내 중복 정의 9참조 | 미제거 (절대 삭제 금지 식별자라 보존 정책) |

> ⚠️ STEP 8.2-A F0 진단 결과 (그대로 유효): DirectionsPreviewPage는 이미 900→1280 전환 완료, `innerWidth*0.38` 제거 완료. desktop 탭의 `DirectionsPhoneScreen` 호출(line ~8744)에만 `maxHeight` prop 누락 — F1+F2 코드 적용 대기.

---

## 🆕 Phase 1C 진행 현황 (2026-05-08)

### ✅ Phase 1C 완료 STEP

| STEP | 내용 | 핵심 결과 |
|------|------|-----------|
| **2** | Preview Panel UI 정리 | S25 비율 0.462, 1280/375 viewport (Galaxy S25 375×812 mobile.height = 812 in line 9237) |
| **3** | Hero | PC 100dvh + Nav fixed overlay, 모바일 reveal/hide, Hero 폰트 2.25x, CTA 2x. layout.tsx `'use client'` + `usePathname` |
| **4** | Events carousel 자체 구현 | `display: flex` + `overflow-x: auto` + `scroll-snap`. slide flex-basis 26.25%, CARD_W_RATIO 0.905, 카드 2.5개 노출 |
| **5** | 철학소개 | PC 55:45, 이미지1 = 2:3 (line 509: `i === 0 ? "2/3" : "3/2"`). 라인높이 1.5x, PC 좌우 13% padding, PC 마진 250% |
| **6** | 아이콘 복수화 인프라 | `iconConfigs` 배열 + `parseIconConfigs` + `DraggableIconInPreview` 자체 드래그. STEP 6-3, 6-4 PENDING (어드민 UI 카드 + 섹션 경계 clamp) |
| **7** | 의료진 카드 시스템 | 7-2 카드 비율 (PC 10:4, 모바일 5:4), 7-4 데이터 sync (snapshot packing 보강), 7-5 삭제 UI + archive 제거, 7-6 store auto sync (useEffect deps), 7-7 카드 FontControls 3그룹 (docName/docMeta/docDetail), 7-7b 섹션 타이틀 통일, 7-7c 소개 줄바꿈 (Mixed A+C — Textarea + RTE 모두 처리), 7-8/7-9 간격 250%, 7-10 경력 위 간격 300% |
| **7-7d** | CTA 편집 기능 | 7-7d-2 섹션 패널 (docCtaText/Bg/Color + FontControls), 7-7d-3 의료진별 `consultUrl` + 클릭 동작 (`<a>` vs `<div>` conditional, target=_blank rel=noopener noreferrer) |
| **8** | GALLERY_SIZE_OPTIONS | xs=11/sm=15/md=19/lg=23/xl=27 (px), sizesOverride 5단계 노출 |
| **8-1** | 갤러리 메인 이미지 | PC `aspectRatio: "3/2"` + maxWidth `calc((100dvh - 165px) * 1.875)` (1.5×1.25=1.875), 모바일 `4/5` + cover. 썸네일 모바일 3.5개 가시 (flex-basis 28.57%) |
| **8-1b** | PC 메인 이미지 125% | maxWidth × 1.25 → factor 1.875 (line 1616) |
| **8-1c** | 갤러리 섹션 상단/타이틀 간격 | 200% (paddingTop + marginBottom 각각 ×2) — line 1611: `padding: isDesktop ? "64px 0 36px" : "36px 0 22px"` |
| **9** | STRENGTHS_SIZE_OPTIONS | 동일 5단계 (11/15/19/23/27) — homepage/page.tsx:218 |
| **9-1** | 브랜드 강점 입력 UI 통일 | 섹션 1/2 RTE/이상 컴포넌트 → Input/Textarea 패턴 통일 (focus loss fix) |
| **9-2** | 설명 텍스트 fix | 섹션 3 RTE → Textarea + stripHtml + whiteSpace pre-line, 누락 `sizesOverride` 추가 |
| **9-3-1** | 브랜드 강점 카드 박스 2배 | s1 카드 inline + S2StatCard + 사이드바 사본 모두 padding/fontSize/gap × 2 (3 파일 동기화) |

### 🚧 Phase 1C 진행 중 / 발급된 미실행 프롬프트

| STEP | 상태 | 다음 행동 |
|------|------|-----------|
| **9-3-2** | 프롬프트 발급, 코드 미실행 | 헤드라인 정렬(PC) + 타이틀↔헤드라인 150%. PC/모바일 분기 도입. SubLabel 픽셀 높이 H 측정 후 s2 PC paddingTop = 29 + H. 파일: `/mnt/user-data/outputs/Phase1C_STEP9-3-2_headline_align_150.md` |
| **9-3-3** | 미발급 | PC 좌우 여백 색 통일 (gradient 트릭 또는 split div, 양 섹션 다른 배경 색 처리) |

---

## 코드 상태 검증 결과 (이 보고서에 반영된 grep/wc/tsc)

### 1. SIZE_MAP 정의 검증 — ✅ 모두 동일 5단계 (11/15/19/23/27)

| 식별자 | 정의 위치 | 값 |
|--------|-----------|----|
| `DOCTOR_SIZE_MAP` | `components/site/sections/shared.tsx:53` (export) | xs:11, sm:15, md:19, lg:23, xl:27 |
| `DOCTOR_SIZE_MAP` (사본) | `app/admin/branch/homepage/page.tsx:4159` | xs:11, sm:15, md:19, lg:23, xl:27 |
| `PHILOSOPHY_SIZE_MAP` | `components/site/sections/SectionPreviewBlock.tsx:58` | xs:11, sm:15, md:19, lg:23, xl:27, 2xl:31 |
| `GALLERY_SIZE_OPTIONS` | `app/admin/branch/homepage/page.tsx:210` (배열) | previewPx 11/15/19/23/27 (5단계) |
| `STRENGTHS_SIZE_OPTIONS` | `app/admin/branch/homepage/page.tsx:218` (배열) | previewPx 11/15/19/23/27 (5단계) |

> 주의: 사용자가 "GALLERY_SIZE_MAP", "STRENGTHS_SIZE_MAP"이라 표기한 것은 실제 코드에서는 `GALLERY_SIZE_OPTIONS`, `STRENGTHS_SIZE_OPTIONS` 배열이다 (`FontControls`의 `sizesOverride` prop으로 전달됨). 실제 텍스트 크기 lookup은 `DOCTOR_SIZE_MAP`/`PHILOSOPHY_SIZE_MAP`이 담당하며, 옵션 배열의 previewPx와 동일한 5단계 (11/15/19/23/27)로 일관됨. **Phase 1C에서 4개 SIZE 시스템이 모두 동일 픽셀 그리드로 통일된 것이 핵심 검증 결과.**

### 2. consultUrl 적용 검증 — ✅ 8개 위치 모두 적용

| 위치 | 줄 | 역할 |
|------|----|------|
| `lib/staff-store.tsx` | 29 | `StaffProfile.consultUrl?: string` 필드 |
| `app/admin/branch/staff/new/page.tsx` | 30 | `useState("")` |
| `app/admin/branch/staff/new/page.tsx` | 53 | `consultUrl: consultUrl.trim() || undefined` 저장 |
| `app/admin/branch/staff/new/page.tsx` | 189 | Input value 바인딩 |
| `app/admin/branch/staff/[staffId]/page.tsx` | 398 | `consultUrl: string` 폼 타입 |
| `app/admin/branch/staff/[staffId]/page.tsx` | 424 | `profile.consultUrl ?? ""` 초기값 |
| `app/admin/branch/staff/[staffId]/page.tsx` | 572 | `consultUrl: localForm.consultUrl.trim() || undefined` 저장 |
| `app/admin/branch/staff/[staffId]/page.tsx` | 1134~1135 | Input value + onChange |
| `app/admin/branch/homepage/page.tsx` | 9313 | `scheduleLiveSnapshot` 측 packing |
| `app/admin/branch/homepage/page.tsx` | 9504 | `handleGeneratePreview` 측 packing |
| `components/site/sections/SectionPreviewBlock.tsx` | 16 | `DoctorItem.consultUrl?: string` |
| `components/site/sections/SectionPreviewBlock.tsx` | 568, 584 | DoctorItem 매핑 (scheduleLive + handleGenerate) |
| `components/site/sections/shared.tsx` | 283 | `SiteDoctorCardFull.consultUrl?: string` |
| `components/site/sections/shared.tsx` | 1179 | `cursor: doctor.consultUrl ? "pointer" : "default"` |
| `components/site/sections/shared.tsx` | 1184~1185 | Conditional `<a>` vs `<div>` (`target="_blank" rel="noopener noreferrer"`) |

### 3. 갤러리 메인 이미지 aspectRatio + 1.25배 검증

| 검증 항목 | 줄 | 결과 |
|----------|----|------|
| `mainRatio = isDesktop ? "3/2" : "4/5"` | `SectionPreviewBlock.tsx:1585` | ✅ |
| PC 메인 이미지 1.25배 적용 | `SectionPreviewBlock.tsx:1616` — `width: isDesktop ? "min(100%, calc((100dvh - 165px) * 1.875))"` | ✅ (1.5 × 1.25 = 1.875) |
| 갤러리 섹션 상단/타이틀 간격 200% | `SectionPreviewBlock.tsx:1611` — `padding: isDesktop ? "64px 0 36px" : "36px 0 22px"` | ✅ |

### 4. 브랜드 강점 카드 박스 2배 검증 — ✅ 3개 파일 동기화

| 위치 | 줄 | 값 |
|------|----|----|
| `SectionPreviewBlock.tsx` (s1 inline) | 1108, 1110 | `padding: "14px 8px"`, `fontSize: 24` |
| `shared.tsx` (S2StatCard) | 1360, 1370 | `padding: "20px 24px"`, `fontSize: 34` |
| `homepage/page.tsx` (어드민 사이드바 사본 — s1) | 3833, 3835 | `padding: "14px 8px"`, `fontSize: 24` |
| `homepage/page.tsx` (어드민 사이드바 사본 — S2) | 2821, 2832 | `padding: "20px 24px"`, `fontSize: 34` |

### 5. 아이콘 복수화 인프라 검증

| 검증 항목 | 위치 | 결과 |
|----------|------|------|
| `iconConfigs` 배열 사용 | `homepage/page.tsx:4663, 10448, 10450` | ✅ |
| `parseIconConfigs` import 및 사용 | `homepage/page.tsx:33, 4663, 10448` | ✅ |
| `DraggableIconInPreview` 어드민 적용 | `homepage/page.tsx:33, 4679` | ✅ |
| 미리보기 측은 단순 (드래그 없음) | `SectionPreviewBlock.tsx:1762` 주석: "shared — no DraggableIconInPreview" | ⚠️ STEP 6-3, 6-4 PENDING |

### 6. layout.tsx + Hero 검증 (Phase 1C STEP 3)

| 검증 항목 | 위치 | 결과 |
|----------|------|------|
| `'use client'` directive | `app/preview/site/[branchSlug]/layout.tsx:1` | ✅ |
| `usePathname` import + 사용 | `layout.tsx:4, 66` | ✅ |
| Hero `100dvh` (페이지뷰 시) | `SectionPreviewBlock.tsx:130` — `pageHeroHeight ?? "100dvh"` | ✅ |

---

## 핵심 데이터 타입

```typescript
type SiteSnapshot = {
  branch: BranchInfo
  homepage: {
    sections: HomeSection[]
    sectionValues: Record<string, Record<string, FieldValue>>
    treatmentsPageValues: Record<string, FieldValue>
    bookingValues: Record<string, FieldValue>
    cartValues: Record<string, FieldValue>
    popupData: SitePopupData
  }
  doctors: SiteDoctorCard[]              // ✅ Phase 1C: consultUrl 필드 포함
  equipment: SiteEquipmentCard[]
  treatments: SiteTreatmentCard[]        // ✅ Phase 1B STEP 6.2: badge 필드 포함
  events: SiteEventCard[]
}

// Phase 1C 추가/변경
type StaffProfile = {
  // ... 기존 필드 ...
  consultUrl?: string                    // ✅ Phase 1C STEP 7-7d-3
}

type SiteDoctorCardFull = {
  // ...
  consultUrl?: string                    // ✅ Phase 1C
}

// 섹션 ID 목록
type HomeSectionId =
  "hero" | "events" | "doctors" | "equipment" |
  "philosophy" | "strengths" | "info" | "gallery" |
  "treatments" | "footer"
```

---

## 어드민 미리보기 시스템 — 두 가지 시스템 공존 ⚠️

| 시스템 | 가상폭 | 컨테이너 | 사용 페이지 |
|--------|--------|----------|-------------|
| **신형 PreviewPanel** | 1280px | clamp(500px, 50vw, 720px) | 메인 홈 편집기 + TreatmentsPage(STEP 8.1 후) + Phase 1C 신규 작업물 |
| **구형** | 900px | Math.min(window.innerWidth*0.38, 580) | DirectionsPreviewPage⚠️(미적용 잔여) + booking-page + cart-page + popup-page |

**진행 계획**: 구형 4곳을 신형 시스템으로 통일 중. STEP 8.1로 TreatmentsPage 1곳 끝 → 8.2-A 디렉션 진행 중(F1+F2 미적용) → 이후 booking/cart/popup.

### 검증된 통일 패턴

**패턴 P1 (PC 가상폭+컨테이너)** — 3줄 in-place 수정:
```typescript
const DESKTOP_VIRTUAL_W = 1280  // 900에서
Math.min(window.innerWidth * 0.50, 720) / DESKTOP_VIRTUAL_W : 500 / DESKTOP_VIRTUAL_W
gridTemplateColumns: "1fr clamp(500px, 50vw, 720px)" : "1fr 260px"
```

**패턴 P2 (모바일 폰 프레임 scale)** — 폰 프레임 안 콘텐츠를 가상폭 375로 그린 후 scale 0.528 축소:
```typescript
const PHONE_INNER_W   = 198      // outer w-[210px] - border 12px
const PHONE_VIRTUAL_W = 375
const phoneScale = PHONE_INNER_W / PHONE_VIRTUAL_W  // ≈0.528
```

---

## 🆕 Phase 1C 패턴 라이브러리

Phase 1C 작업에서 정착된 재사용 패턴들 — 향후 STEP에 동일하게 적용.

### 패턴 P3 — SIZE_MAP 통일 (4개 섹션)
- 4개 섹션 (DOCTOR / PHILOSOPHY / GALLERY / STRENGTHS) 모두 픽셀 배율 동일 (xs:11, sm:15, md:19, lg:23, xl:27)
- `*_SIZE_OPTIONS` 배열은 `FontControls`의 `sizesOverride` prop으로 노출, 실제 lookup은 `*_SIZE_MAP`이 담당.

### 패턴 P4 — sizesOverride 5단계 노출
```tsx
<FontControls prefix="..." group="..." values={values} onChange={onChange}
  sizesOverride={GALLERY_SIZE_OPTIONS} />
```
- 옵션 배열 형식: `{ key, label, previewPx, editorLabel }[]`

### 패턴 P5 — FontControls 통합 (5속성)
- size + weight + font + style + color 한 컴포넌트에서 묶어 처리
- 의료진 카드 3그룹 (docName / docMeta / docDetail)에서 검증

### 패턴 P6 — 반응형 이미지 (aspect-ratio + maxHeight + maxWidth)
```tsx
const mainRatio = isDesktop ? "3/2" : "4/5"
<div style={{
  width: isDesktop ? "min(100%, calc((100dvh - 165px) * 1.875))" : "100%",
  aspectRatio: mainRatio, overflow: "hidden",
  margin: isDesktop ? "0 auto" : undefined,
}} />
```
- 1.875 = 1.5 (가로:세로 = 3:2) × 1.25 (PC 메인 1.25배)
- PC: 100dvh 기준 → nav/title 165px 차감 후 ratio 곱하기
- 모바일: 단순 4:5 + width 100%

### 패턴 P7 — Conditional `<a>` vs `<div>`
```tsx
return doctor.consultUrl ? (
  <a href={doctor.consultUrl} target="_blank" rel="noopener noreferrer" style={ctaWrapStyle}>
    {ctaInner}
  </a>
) : (
  <div style={ctaWrapStyle}>{ctaInner}</div>
)
```
- URL 유무에 따른 클릭 동작 분기. cursor도 분기: `doctor.consultUrl ? "pointer" : "default"`

### 패턴 P8 — stripHtml + whiteSpace pre-line (RTE 호환 + 줄바꿈 보존)
```tsx
<p style={{ ..., whiteSpace: "pre-line", lineHeight: 1.5 }}>
  {stripHtml(htmlOrPlain)}
</p>
```
- RTE 입력 (`<br>`, `<p>` 등) → `\n` 보존
- 일반 textarea 입력 (`\n`) → 그대로 보존
- 양쪽 입력 모두 동일 렌더 결과

### 패턴 P9 — Store auto sync via useEffect deps + 첫 마운트 skip ref
```tsx
const firstRun = useRef(true)
useEffect(() => {
  if (firstRun.current) { firstRun.current = false; return }
  // 실제 sync 로직
}, [keyDeps...])
```
- 첫 마운트 시 store 덮어쓰기 방지
- 사용자 액션에 의한 변경만 sync 트리거

---

## 데이터 동기화 — BroadcastChannel

```
채널명: bw_live_${branchId}
발신: 어드민이 저장할 때 "update" 메시지 전송
수신: 테스트 사이트 layout.tsx가 수신 → snapshot 즉시 reload
```

### localStorage 키 구조

| 키 | 저장 주체 | 읽는 주체 | 포맷 |
|----|-----------|-----------|------|
| `tatoa-cms-homepage-v1-${branchId}` | 어드민 자동저장 | 어드민만 | BranchWebsiteDraft |
| `bw_draft_${branchId}` | 어드민 (2가지 경로) | 테스트 사이트 layout.tsx | SiteSnapshot |
| `bw_published_${branchId}` | `publishSite()` | 테스트 사이트 `?mode=live` | SiteSnapshot |
| `bw_versions_${branchId}` | `publishSite()` | 어드민 버전 히스토리 | SiteSnapshot[] |
| `bw_domain_${branchId}` | `updateDomainSettings()` | 어드민 설정 | DomainSettings |

### 어드민 → 테스트 사이트 저장 경로

```
경로 1 (수동): "테스트 홈페이지 생성" 버튼 → handleGeneratePreview() → bw_draft_${branchId} write
경로 2 (자동): 편집 시 300ms 디바운스 → scheduleLiveSnapshot() → bw_draft_${branchId} 직접 write
```

### Snapshot Packing (Phase 1C 추가 분 포함)

```typescript
{
  id, slug, branchId, name, category,
  description: profile.cardDescription || profile.shortDescription || profile.oneLinePitch || "",  // STEP 7
  price, duration, image,
  isPublic, isFeatured, sortOrder,
  landingProfile, landingData, landingAssets,
  badge: profile.isFeatured ? "추천" : undefined,    // STEP 6.2
}

// 의료진 (Phase 1C)
{
  id, name, role, photo, bio, specialties, careers,
  consultUrl: d.profile.consultUrl,                  // ✅ Phase 1C STEP 7-7d-3
  // ... 카드 스타일 필드
}
```

---

## 컬러 시스템

```
GOLD       = "#c9a85c"   (챔페인 골드 — 다크 테마 핵심 강조색)
다크 배경  = "#0e0b06", "#0f0f0f"
라이트 텍스트 = "#f5f0e8"
```

---

## 현재 TS 오류 현황 (tsc --noEmit, 2026-05-08)

**총 7건** — Phase 1B 베이스라인과 동일 (homepage/page.tsx 0건 유지).

| 파일 | 오류 수 | 비고 |
|------|---------|------|
| `app/admin/branch/page.tsx` | 1 | `'archived'` type overlap (기존) |
| `app/admin/settings/page.tsx` | 2 | `hasToggle`/`defaultOn` 누락 (기존) |
| `app/admin/branch/treatments/[treatmentId]/page.tsx` | 1 | `LandingSectionType` 불일치 |
| `app/preview/landing/[draftId]/page.tsx` | 1 | Props `progressInfo` 타입 불일치 |
| `components/admin/ai-landing-modal.tsx` | 1 | `Record<LandingSectionType, string>` 누락 키 |
| `components/admin/landing-section-editor.tsx` | 1 | `'faq_section'` type overlap |

> Phase 1C 작업으로 신규 TS 오류 발생 없음. homepage/page.tsx, SectionPreviewBlock.tsx, shared.tsx, lib/staff-store.tsx, staff/new/page.tsx, staff/[staffId]/page.tsx 6개 파일 모두 0건 유지.

---

## 절대 금지 코딩 규칙 ⚠️

```tsx
// ❌ JSX style 속성 안에서 템플릿 리터럴 절대 금지
<div style={{ background: `rgba(0,0,0,${opacity})` }} />
<div style={{ borderBottom: `1px solid ${color}` }} />

// ✅ 반드시 문자열 연결 사용
<div style={{ background: "rgba(0,0,0," + opacity + ")" }} />
<div style={{ borderBottom: "1px solid " + color }} />

// ✅ href, className 등 style 밖에서는 템플릿 리터럴 사용 가능
<a href={`/preview/${slug}`} />
```

> **이유:** TypeScript JSX 파서가 `${}` 안의 `}`를 JSX 표현식 닫힘으로 오해해서 파일 전체에 cascade 오류 발생.

### Write 도구 사용 금지 규칙
```
❌ Write 도구로 대용량 파일(수백 줄 이상) 작성 금지 → 파일 중간 잘림
✅ 항상 Edit 도구로 부분 수정
✅ 수정 후 반드시 wc -l [파일명] 으로 줄 수 확인
✅ 줄 수가 예상보다 적으면 즉시 중단하고 Jason에게 보고
```

---

## 절대 삭제 금지 식별자 ⚠️ (Phase 1C 갱신)

`homepage/page.tsx` 내 다음 식별자들은 6~7개 컴포넌트가 의존하므로 절대 삭제 금지:

| 식별자 | 줄 (대략) | 의존 컴포넌트 |
|--------|-----------|--------------|
| `BOX_PRESETS_DARK` | 2060 | resolveCardStyle, resolveStatCardStyle, TreatmentCardStyleEditor, resolveInfoBoxStyle, LinkedDataEditor, StrengthStatEditor, InfoBoxStylePanel |
| `BOX_PRESETS_LIGHT` | 2070 | (위와 동일) |
| `SHADOW_PRESETS` | 2080 | TreatmentCardStyleEditor, LinkedDataEditor, StrengthStatEditor, InfoBoxStylePanel |
| `resolveCardStyle` | 2090 | DoctorTiltCard, EquipmentTiltCard |
| **🆕 `DOCTOR_SIZE_MAP`** | 4159 (homepage) / shared.tsx:53 | Phase 1C 의료진 카드 시스템 전반 |
| **🆕 `PHILOSOPHY_SIZE_MAP`** | SectionPreviewBlock.tsx:58 | 철학소개 섹션 (5단계 + 2xl) |
| **🆕 `GALLERY_SIZE_OPTIONS`** | 210 | 갤러리 FontControls sizesOverride |
| **🆕 `STRENGTHS_SIZE_OPTIONS`** | 218 | 브랜드 강점 FontControls sizesOverride |
| **🆕 `iconConfigs` / `parseIconConfigs`** | 33 (import) | Phase 1C STEP 6 아이콘 복수화 |
| **🆕 `DraggableIconInPreview`** | 33 (import), 4679 (사용) | 어드민 미리보기 드래그 |
| **🆕 `consultUrl`** (StaffProfile, DoctorItem, SiteDoctorCardFull) | staff-store.tsx:29, SectionPreviewBlock.tsx:16, shared.tsx:283 | Phase 1C STEP 7-7d-3 CTA 클릭 동작 |

---

## Migration 매핑 테이블 (절대 변경 금지)

`migrateTreatmentsPageValues`가 적용하는 옛 키 → 새 키 매핑:
- `trBgColor` → `bgColor`
- `trTitle` → `pageTitle`
- `trCardNameColor` → `cardNameColor`
- `trCardPriceColor` → `cardPriceColor`
- `trCardAction` → `cardAction`
- `trDesc` → `pageSubtitle`
- `trCategories` → `categories`
- 기타 (코드 참조)

⚠️ 이 매핑 자체를 변경하면 모든 사용자의 기존 데이터 깨짐.

---

## 🆕 다음 세션 우선순위

### 즉시 (Chat → Code)
1. **STEP 9-3-2 코드 발송** — `Phase1C_STEP9-3-2_headline_align_150.md` 프롬프트 Code에 전달
   - 헤드라인 정렬(PC) + 타이틀↔헤드라인 150%
   - PC/모바일 분기 + SubLabel 픽셀 높이 H 측정 후 s2 PC `paddingTop = 29 + H`

### 그 다음
2. **STEP 9-3-3** — PC 좌우 여백 색 통일 (gradient 트릭 또는 split div)
3. **STEP 6-3, 6-4** — 아이콘 복수화 어드민 UI 카드 + 섹션 경계 clamp

### Phase 1B 잔여
4. **STEP 8.2-A F1+F2** — DirectionsPreviewPage 가상폭/scale 통일 (프롬프트 준비됨)
5. **STEP 9.2** — booking/cart/popup 컴포넌트 통일 (디렉션과 동일 패턴 예상)
6. **STEP 8.2-B** — booking/cart/popup 가상폭/scale (9.2 후)

### 지연
- 페이지 외곽 통일, SiteFooter 추출, 잔존 TS 오류 7건 정리

---

## 다음 세션 시작 시 가장 먼저 할 일

1. **코워크에 코드 상태 스캔 의뢰** (이 문서가 실제 코드와 일치하는지 검증)
2. **Phase 1C STEP 9-3-2 프롬프트 Code에 발송** (이미 발급된 .md 사용)
3. 9-3-2 끝나면 Jason 시각 검증 → 9-3-3 발급
4. 9-3 시리즈 마무리 후 STEP 6-3, 6-4 또는 Phase 1B 잔여로 분기 결정

---

## 개발자 프롬프트 작성 규칙 (Chat의 역할)

Jason이 아이디어를 주면, Chat은 아래 형식으로 Claude Code가 바로 실행할 수 있는 프롬프트를 작성:

```
## 작업: [작업명]

### 목적
[왜 이 작업을 하는지]

### 수정할 파일
- `[파일 경로]` → [무엇을 어떻게 수정]

### 구현 상세
[구체적인 코드 로직, 컴포넌트 구조, 데이터 흐름 설명]

### 절대 금지 ⚠️
- [구체적 금지 사항]

### 완료 기준
- [ ] [확인 항목 1]
- [ ] [확인 항목 2]
```

### 큰 변경 시 작업 분할 패턴 (검증됨)

복잡한 fix는 **read-only 진단 → Jason 검토 → fix mini-step 분할 → 각 단계 검증** 사이클로 진행.

```
STEP X.0  read-only 진단 (그렙·view만, 수정 X)
          ↓ Chat 검토 + Jason 결정
STEP X.1  fix mini-step 1 → wc -l + grep + tsc 검증
          ↓ Jason 시각 검증 (필요 시)
STEP X.2  fix mini-step 2 → 검증
          ↓ ...
```