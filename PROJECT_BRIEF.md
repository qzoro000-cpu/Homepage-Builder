# TATOA CMS — 프로젝트 브리핑 (Claude 프로젝트용)

> **목적:** 이 문서를 Claude 프로젝트 지식(Project Knowledge)에 업로드해서 앞으로 채팅으로 개발을 이어가기 위한 종합 브리핑입니다.

---

## 1. 프로젝트 개요

**TATOA CMS** — 피부미용 병원 체인(타토아) 전용 콘텐츠 관리 시스템

- 각 지점(Branch)이 자신의 홈페이지를 CMS에서 직접 편집하는 구조
- 어드민 UI에서 실시간으로 변경 사항을 미리보기(Preview)하면서 작업
- 테크 스택: **Next.js 16 / React 19 / TypeScript / Tailwind CSS / Radix UI / lucide-react**
- 백엔드 없음 — 모든 데이터는 **localStorage** 기반 (Zustand-like store)
- Git 없음 (버전 관리 없음)

---

## 2. 핵심 파일 구조

```
app/
  admin/
    branch/
      homepage/
        page.tsx          ← 메인 홈페이지 편집기 (525KB, ~10,512줄) — 핵심 파일
        booking-page.tsx
        cart-page.tsx
        icon-library.tsx
        popup-page.tsx
      doctors/page.tsx
      equipment/[equipmentId]/page.tsx
      staff/[staffId]/page.tsx
      treatments/[treatmentId]/page.tsx
      info/page.tsx
    preview/
      homepage/page.tsx   ← 구 어드민 홈페이지 미리보기 (별도 페이지)

  preview/
    site/
      [branchSlug]/
        layout.tsx        ← 테스트 사이트 레이아웃 (131줄, SiteNav 포함)
        page.tsx          ← ⚠️ 심각하게 손상된 파일 (466줄, 본래 1600줄이어야 함)
        booking/page.tsx
        directions/page.tsx
        treatments/page.tsx
    homepage/
      [branchSlug]/       ← 구 홈페이지 미리보기 라우트

components/
  site/
    SiteNav.tsx           ← 테스트 사이트 네비게이션 (111줄, TS 오류 있음)
  admin/
    (각종 관리자 UI 컴포넌트들)

lib/
  branch-website-store.tsx  ← 핵심 스토어 (432줄)
  landing-draft-store.tsx
  media-store.tsx
  treatment-store.tsx
```

---

## 3. 이번 세션에서 한 작업 (성공한 것들)

### ✅ 완료된 작업

| 작업 | 파일 | 내용 |
|------|------|------|
| `getPreviewUrl` 버그 수정 | `lib/branch-website-store.tsx` | 잘못된 URL 반환 수정 |
| 어드민 미리보기 iframe 교체 | `app/admin/branch/homepage/page.tsx` | 구 mock 홈페이지를 iframe 기반 실제 사이트 뷰어로 교체 |
| 지점 필드 누락 추가 | `lib/branch-website-store.tsx` | `kakaoLink`, `naverMapUrl` 등 누락 필드 추가 |
| 데스크톱 iframe 스케일 레이아웃 수정 | `app/admin/branch/homepage/page.tsx` | `LiveSitePreviewPanel` iframe 스케일 수정 |
| **우측 패널 PC 미리보기 롤백** | `app/admin/branch/homepage/page.tsx` | iframe 방식 → 컴포넌트 방식 PC 미리보기로 복원 |
| null byte 제거 | `homepage/page.tsx`, `layout.tsx` | 파일에 끼어든 null 바이트 제거, TS 오류 해결 |

### 현재 우측 패널 동작 방식 (최종 상태)

- **모바일 버튼 선택 시:** 갤럭시 S25 폰 프레임 안에서 `SectionPreviewBlock` 컴포넌트 렌더링
- **PC/데스크톱 버튼 선택 시:** 브라우저 크롬 프레임 + 가상 900px 너비 캔버스 + `SectionPreviewBlock device="desktop"` 렌더링 (scale 축소)
- **섹션 탭 / 페이지 탭:** 두 모드 모두 지원
- iframe 방식은 완전히 제거됨

---

## 4. 실패하거나 손상된 것들 ⚠️

### 4-1. `app/preview/site/[branchSlug]/page.tsx` — 심각하게 손상됨

**상태:** 본래 ~1,600줄이어야 하는데 현재 466줄만 남음. 나머지가 잘려나감.

**원인:** 세션 중 Write 툴로 전체 파일을 덮어쓰는 과정에서 파일이 중간에 잘림. Git이 없어서 복구 불가.

**잘린 위치:** `SiteEventTiltCard` 함수의 리턴 JSX 중간 (line 467, `opacity:active ? 1 :` 에서 중단)

**없어진 컴포넌트들 (467줄 이후):**
- `SiteEventTiltCard` 리턴 클로징 태그들
- `SiteEventPagination`
- `EventsSection`
- `DoctorsSection` (3D 틸트 + 림 글로우)
- `EquipmentSection`
- `GallerySection`
- `StrengthsSection` (S1/S2)
- `PhilosophySection`
- `InfoSection`
- `FeaturedTreatmentsSection`
- `LocationSection`
- `BookingCtaBar`
- `export default function Page()`

**결과:** `/preview/site/[branchSlug]` 라우트가 완전히 broken. TSC 오류 3개 남아있음.

**영향:** 우측 패널은 현재 iframe을 사용하지 않으므로 당장 CMS 동작에는 영향 없음. 하지만 테스트 사이트 기능 자체가 작동 안 함.

---

### 4-2. `components/site/SiteNav.tsx` — TS 오류 있음

**상태:** TSC 오류 4개. 템플릿 리터럴을 JSX `style={{}}` 속성 안에서 사용해서 TypeScript JSX 파서가 혼란스러워함.

**문제 패턴:**
```tsx
// 문제: style={{}} 안에서 ${} 템플릿 리터럴 사용
borderBottom: `1px solid ${borderColor}`,
border: `1px solid ${isDarkNav ? "rgba(...)" : "transparent"}`,
```

**해결 방법:** 템플릿 리터럴을 문자열 연결로 교체
```tsx
borderBottom: "1px solid " + borderColor,
border: "1px solid " + (isDarkNav ? "rgba(...)" : "transparent"),
```

**영향:** 테스트 사이트의 네비게이션. SWC 컴파일러는 TS 오류를 무시하므로 런타임에는 동작하지만, `page.tsx`가 손상되어 어차피 테스트 사이트 자체가 안 됨.

---

### 4-3. 템플릿 리터럴 JSX 파서 문제 — 핵심 교훈

**문제:** TypeScript의 JSX 파서(.tsx 파일)는 `style={{}}` 속성 안에서 `${}` 템플릿 리터럴을 만나면 파서 상태가 오염되어 이후 함수 전체에 cascading 오류가 발생함.

**증상:** 실제 문제 라인이 아닌 이후에 정의된 함수에서 "JSX element has no corresponding closing tag" 오류가 터짐.

**절대 하면 안 되는 패턴 (JSX style 속성 안에서):**
```tsx
// ❌ 절대 금지
<div style={{ background: `rgba(0,0,0,${opacity})` }} />
<div style={{ borderBottom: `1px solid ${color}` }} />
```

**올바른 패턴:**
```tsx
// ✅ 문자열 연결 사용
<div style={{ background: "rgba(0,0,0," + opacity + ")" }} />
<div style={{ borderBottom: "1px solid " + color }} />
```

**예외:** `href={`...${var}...`}` 같은 일반 JSX 속성은 괜찮음. `style={{}}` 이중 중괄호 안에서만 문제.

---

## 5. 현재 TSC 오류 현황

```
app/preview/site/[branchSlug]/page.tsx   — 3개 오류 (파일 손상 때문)
components/site/SiteNav.tsx              — 4개 오류 (템플릿 리터럴 패턴)
app/admin/branch/homepage/page.tsx       — 0개 오류 ✅
```

> Next.js는 SWC 컴파일러를 사용하므로 TS 오류가 있어도 개발 서버는 실행됨. 하지만 `preview/site` 라우트 자체가 파일 손상으로 런타임 오류 발생.

---

## 6. 주요 컴포넌트 구조 (homepage/page.tsx)

### 우측 미리보기 패널 (`PreviewPanel` 함수, ~line 4733)

```tsx
function PreviewPanel({
  activeSectionId, sections, homeData, activeSectionData,
  branchName, branchId, onNavigate, onIconDrag,
  device, onDeviceChange,
}: { ... })
```

**내부 상수:**
```tsx
const DESKTOP_VIRTUAL_W = 900  // 가상 PC 너비 (px)
const desktopColRef = useRef<HTMLDivElement>(null)
const [desktopScale, setDesktopScale] = useState(...)  // ResizeObserver로 자동 계산
```

**렌더 분기:**
- `device === "mobile"` → 폰 프레임 + `SectionPreviewBlock device="mobile"`
- `device === "desktop"` → 브라우저 크롬 + scaled `SectionPreviewBlock device="desktop"`
- `viewMode === "section"` → 현재 섹션만
- `viewMode === "page"` → 전체 페이지 (enabled 섹션 모두)

### `SectionPreviewBlock` 라우터 함수

각 `sectionId`에 맞는 Preview 컴포넌트를 라우팅:
- `hero` → `PreviewHero`
- `events` → `PreviewEvents`
- `doctors` → `PreviewLinked` (type="doctors")
- `equipment` → `PreviewLinked` (type="equipment")
- `philosophy` → `PreviewPhilosophy`
- `strengths` → `PreviewStrengths`
- `info` → `PreviewInfo`
- `gallery` → `PreviewGallery`
- `treatments` → `PreviewTreatments`

### `LiveSitePreviewPanel` 함수 (~line 8919)

별도의 테스트 사이트 패널 (iframe 기반, 현재는 우측 패널에서 사용 안 함)

### 데이터 흐름

```
localStorage
  → loadDraftSnapshot(branchSlug) / loadPublishedSnapshot(branchSlug)
  → SiteSnapshot 객체
  → snapshot.homepage.sectionValues[sectionId]
  → 각 Preview 컴포넌트에 값 전달
```

---

## 7. 브랜치 웹사이트 스토어 (`lib/branch-website-store.tsx`)

**핵심 타입:**
```typescript
type SiteSnapshot = {
  branch: BranchInfo        // name, address, phone, kakaoLink, naverMapUrl, ...
  homepage: HomepageData    // sections[], sectionValues, publishedAt
}

type BranchInfo = {
  id: string
  name: string
  address: string
  phone: string
  heroImage: string
  shortIntro: string
  kakaoLink: string         // 추가됨
  naverMapUrl: string       // 추가됨
  bookingLink: string
  // ...
}
```

**핵심 함수:**
- `loadDraftSnapshot(branchSlug)` → 드래프트 스냅샷 로드
- `loadPublishedSnapshot(branchSlug)` → 발행된 스냅샷 로드
- `SITE_LIVE_BROADCAST(branchSlug)` → BroadcastChannel 이름 (실시간 동기화용)

---

## 8. 앞으로 해야 할 작업

### 최우선 (당장 필요한 것)

1. **`app/preview/site/[branchSlug]/page.tsx` 재건축**
   - 파일이 466줄에서 잘려있음 (원본 ~1,600줄)
   - `admin/branch/homepage/page.tsx`의 각 Preview 컴포넌트를 참조해서 재작성 필요
   - 각 섹션의 PC 렌더링 버전 (device="desktop" 기준으로 작성)

2. **`components/site/SiteNav.tsx` TS 오류 수정**
   - 템플릿 리터럴 → 문자열 연결로 교체
   - 약 4곳 수정

### 향후 개발 방향

3. **테스트 사이트 완성도 향상**
   - 갤러리 섹션 blob URL 문제 (다른 컨텍스트에서 깨짐)
   - 모바일 반응형 완성도

4. **발행(Publish) 플로우**
   - Draft → Published 전환 UI
   - 실제 도메인 연결 고려

---

## 9. 클로드가 이 프로젝트에서 실수한 패턴들

### 실수 1: 파일 전체를 Write로 덮어쓸 때 잘림
- **상황:** 큰 파일(1600줄)을 전체 Write로 쓸 때 중간에 잘림
- **교훈:** 큰 파일은 Write 대신 Edit(부분 수정)을 사용해야 함. 꼭 Write를 써야 한다면 쓴 후 즉시 줄 수 확인.
- **검증 방법:** `wc -l 파일명` 으로 즉시 확인

### 실수 2: TS 오류 원인 파악 지연
- **상황:** cascade TS 오류의 근본 원인(line 332 템플릿 리터럴)을 찾는 데 너무 오래 걸림
- **교훈:** JSX `style={{}}` 안에서는 처음부터 템플릿 리터럴 금지 규칙 적용

### 실수 3: 롤백해야 할 방향을 계속 진행
- **상황:** 테스트 사이트 iframe 방식이 복잡해지고 파일이 손상됐는데도 계속 수정 시도
- **교훈:** 파일이 크게 손상됐을 때는 빨리 롤백 결정을 내려야 함

### 실수 4: Git 없는 환경에서 안전망 부재
- **상황:** Git이 없어서 파일 손상 시 복구 수단이 세션 JSONL 파일뿐이었음
- **교훈:** 큰 작업 전에 중요 파일을 `.bak` 파일로 백업하거나, `cp` 명령으로 복사본 만들기

---

## 10. 개발 환경 정보

- **개발 서버:** `npm run dev` (포트 7000으로 설정된 것 같음, `localhost:7000`)
- **작업 폴더:** `C:\Users\qzoro\Contoller_T V1`
- **Git:** ❌ 없음 (버전 관리 없음)
- **패키지 매니저:** npm
- **Next.js:** 16.2.0 (App Router)
- **React:** 19.2.4
- **TypeScript:** tsconfig 있음, but SWC가 TS 오류 무시하고 컴파일

---

## 11. 코딩 컨벤션 & 주의사항

1. **JSX style 속성에서 템플릿 리터럴 절대 금지** (위 4-3 참조)
2. **`as React.CSSProperties["mixBlendMode"]`** 같은 subscript 타입 단언을 JSX 컨텍스트 가까이서 쓰지 말 것 → `as any` 또는 변수로 빼기
3. **대형 파일 수정 시** Edit 툴(부분 수정)을 우선 사용
4. **한국어 UI:** 모든 사용자 facing 텍스트는 한국어
5. **컬러 시스템:** `GOLD = "#c9a85c"` (챔페인 골드) — 다크 테마 핵심 색상
6. **섹션 ID 목록:** `hero`, `events`, `doctors`, `equipment`, `philosophy`, `strengths`, `info`, `gallery`, `treatments`, `footer`

---

*마지막 업데이트: 2026-04-27 (Cowork 세션 기준)*
