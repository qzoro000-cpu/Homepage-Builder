# TATOA CMS — Claude Chat 프로젝트 지식 (Project Knowledge)

> **이 파일을 Claude.ai → 프로젝트 → 지식에 업로드하세요.**
> 이 파일이 있으면 Chat이 항상 이 프로젝트의 맥락을 알고 있습니다.
> **마지막 업데이트: 2026-05-05 (Phase 1B STEP 4~9.1 완료)**

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
| PM + 아키텍트 + 프롬프트 작성 | **Claude Chat (나)** | 기획, 설계, 개발자 프롬프트 생성 |
| 시니어 개발자 | Claude Code | 코드 직접 구현, 파일 수정 |
| 테크 리포터 | Cowork | 코드 상태 스캔, 핸드오프 리포트 생성 |

---

## 핵심 파일 구조 (현재 실제 상태)

```
app/
  admin/branch/homepage/
    page.tsx          ← 메인 편집기 (~10,534줄, STEP 9.1 후)
                        ✅ STEP 4 완료: 옛 TreatmentCard 사라지고 PreviewTreatmentCard 사용
                        ✅ STEP 6.2 완료: badge packing + 어드민 migration
                        ✅ STEP 7 완료: description chain 통일
                        ✅ STEP 8.1 완료: TreatmentsPage 신형 시스템 (1280/720, 모바일 scale)
                        ⚠️ STEP 8.2-A 진행 중: DirectionsPreviewPage는 아직 구형 (900/580)
  admin/branch/
    events/page.tsx       ← 이벤트 관리
    faq/page.tsx          ← FAQ 관리
    equipment/page.tsx    ← 장비 관리
    equipment/new/page.tsx
    staff/new/page.tsx    ← 스태프 관리
    treatments/page.tsx   ← 시술 관리
  admin/settings/
    page.tsx              ← 설정 (TS 오류 2개)
    options/page.tsx
  admin/preview/
    chatbot/page.tsx      ← 챗봇 미리보기
  preview/site/[branchSlug]/
    layout.tsx            ← 테스트 사이트 레이아웃 (BroadcastChannel 수신, snapshot 로드)
    page.tsx              ← 홈페이지 (44줄, SectionPreviewBlock 렌더링, 정상 ✅)
    treatments/
      page.tsx            ← 시술안내 목록 (PreviewTreatmentCard 사용, badge 직접 사용)
      [slug]/page.tsx     ← 시술 상세 랜딩 페이지
    booking/
      page.tsx            ← 예약하기 (booking-page.tsx) ⚠️ 통일 미완
    directions/
      page.tsx            ← 오시는 길 (~30줄, PreviewInfo 사용) ✅ STEP 9.1 완료
    events/
      [slug]/page.tsx     ← 이벤트 상세

lib/
  branch-website-store.tsx  ← 핵심 데이터 스토어 (~495줄)
                              ✅ migrateTreatmentsPageValues 어드민 측에도 적용
                              ✅ snapshot packing에 badge 추가됨
  landing-preview-types.ts  ← 랜딩 미리보기 타입 (190줄, 정상 ✅)

components/site/
  SiteNav.tsx         ← 테스트 사이트 내비 (219줄, TS 오류 4개)
  sections/
    SectionPreviewBlock.tsx  ← 섹션별 미리보기 라우터 (~1,701줄)
                                ✅ STEP 9.1: PreviewInfo export 추가
    shared.tsx               ← 공유 컴포넌트 (1,479~1,480줄)
                                PreviewTreatmentCard, BOX_PRESETS, resolveCardStyle 등
    index.ts                 ← re-export
```

---

## Phase 1B 진행 현황 (2026-05-05)

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

### 🚧 진행 중 — STEP 8.2-A (F0 완료, F1+F2 대기)

DirectionsPreviewPage(line 8666~8751)에 STEP 8.1과 동일 패턴 적용 중.

**F0 진단 결과 (read-only 완료):**
| 변경 | 줄 | 현재 → 변경 후 |
|------|-----|---------------|
| 가상폭 | 8676 | `900` → `1280` |
| scale 초기값 | 8679 | `0.38, 580, 400` → `0.50, 720, 500` |
| CSS 그리드 | 8693 | `clamp(360px, 38vw, 580px)` → `clamp(500px, 50vw, 720px)` |

**모바일 폰 프레임 (line 8707~8722):**
- 스크린 div height: 429 (TreatmentsPage와 동일)
- `DirectionsPhoneScreen` (line 8295~)에 **maxHeight prop 없음** (TreatmentsPhoneScreen과 차이)
- 본문에 460 하드코딩 2곳

**F1+F2 적용 plan (Jason 승인 완료, Option A):**
1. F1: PC 3줄 교체 (위 표)
2. F2-1: DirectionsPhoneScreen 시그니처에 `maxHeight?: number = 460` 추가
3. F2-2: 본문 `maxHeight: 460` 2곳 → `maxHeight` 변수
4. F2-3: DirectionsPreviewPage 안 const 추출 (PHONE_INNER_W, PHONE_VIRTUAL_W, phoneScale)
5. F2-4: scroll wrapper → scale div 교체 + `maxHeight={Math.round(429 / phoneScale)}` 전달

### 📋 다음 세션 우선순위

1. **STEP 8.2-A F1+F2 진행** — 디렉션 가상폭/scale 통일 (프롬프트 준비됨)
2. **STEP 9.2** — booking/cart/popup 컴포넌트 통일 (디렉션과 동일 패턴 예상)
3. **STEP 8.2-B** — booking/cart/popup 가상폭/scale (9.2 후)
4. (지연) 페이지 외곽 통일, SiteFooter 추출, TS 오류 정리

---

## 핵심 데이터 타입

```typescript
type SiteSnapshot = {
  branch: BranchInfo
  homepage: {
    sections: HomeSection[]
    sectionValues: Record<string, Record<string, FieldValue>>
    treatmentsPageValues: Record<string, FieldValue>   // 시술 페이지 스타일 값
    bookingValues: Record<string, FieldValue>
    cartValues: Record<string, FieldValue>
    popupData: SitePopupData
  }
  doctors: SiteDoctorCard[]
  equipment: SiteEquipmentCard[]
  treatments: SiteTreatmentCard[]   // ✅ badge 필드 포함 (STEP 6.2)
  events: SiteEventCard[]
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
| **신형 PreviewPanel** | 1280px | clamp(500px, 50vw, 720px) | 메인 홈 편집기 + **TreatmentsPage(STEP 8.1 후)** |
| **구형** | 900px | Math.min(window.innerWidth*0.38, 580) | DirectionsPreviewPage⚠️ + booking-page + cart-page + popup-page |

**진행 계획**: 구형 4곳을 신형 시스템으로 통일 중. STEP 8.1로 TreatmentsPage 1곳 끝 → 8.2-A 디렉션 진행 중 → 이후 booking/cart/popup.

### 검증된 통일 패턴

**패턴 P1 (PC 가상폭+컨테이너)** — 3줄 in-place 수정:
```typescript
const DESKTOP_VIRTUAL_W = 1280  // 900에서
Math.min(window.innerWidth * 0.50, 720) / DESKTOP_VIRTUAL_W : 500 / DESKTOP_VIRTUAL_W
gridTemplateColumns: "1fr clamp(500px, 50vw, 720px)" : "1fr 260px"
```

**패턴 P2 (모바일 폰 프레임 scale)** — 폰 프레임 안 콘텐츠를 가상폭 375로 그린 후 scale 0.528 축소:
```typescript
const PHONE_INNER_W  = 198      // outer w-[210px] - border 12px
const PHONE_VIRTUAL_W = 375
const phoneScale = PHONE_INNER_W / PHONE_VIRTUAL_W  // ≈0.528
```
```jsx
<div style={{ width: PHONE_VIRTUAL_W + "px", transform: "scale(" + phoneScale + ")", transformOrigin: "top left" }}>
  <PhoneScreen ... maxHeight={Math.round(429 / phoneScale)} ... />
</div>
```

---

## 컴포넌트 통일 패턴 (STEP 4 / 9.1)

어드민/테스트 사이트가 별개 컴포넌트로 같은 페이지를 그리던 것을 통일.

**STEP 4 — PreviewTreatmentCard:**
- 어드민(homepage/page.tsx)에 옛 `TreatmentCard` 사본 → 삭제
- 양쪽 모두 `components/site/sections/shared.tsx`의 `PreviewTreatmentCard` import

**STEP 9.1 — PreviewInfo (디렉션):**
- `SectionPreviewBlock.tsx` line 1233: `function PreviewInfo` → `export function PreviewInfo`
- 테스트 사이트 `directions/page.tsx`: 158줄 → ~30줄로 축소, PreviewInfo import해서 사용
- device 자동 감지: `useEffect + matchMedia("(max-width: 767px)")`
- **디자인 정답 결정**: Jason → 어드민 다크 박스형 채택

---

## 데이터 동기화 패턴 (검증 완료)

### localStorage 키 구조

| 키 | 저장 주체 | 읽는 주체 | 포맷 |
|----|-----------|-----------|------|
| `tatoa-cms-homepage-v1-${branchId}` | 어드민 자동저장 | 어드민만 | BranchWebsiteDraft |
| `bw_draft_${branchId}` | 어드민 (2가지 경로) | 테스트 사이트 layout.tsx | SiteSnapshot |
| `bw_published_${branchId}` | `publishSite()` | 테스트 사이트 `?mode=live` | SiteSnapshot |
| `bw_versions_${branchId}` | `publishSite()` | 어드민 버전 히스토리 | SiteSnapshot[] |
| `bw_domain_${branchId}` | `updateDomainSettings()` | 어드민 설정 | DomainSettings |

### Migration 정책 (STEP 6.2 후 변경)

```typescript
// ✅ 어드민 측 load에도 migration 적용 (STEP 6.2)
loadDraftFromStorage("tatoa-cms-homepage-v1-${branchId}")
  → migrateTreatmentsPageValues(parsed.draft.pages.treatments)
  → 변환 결과가 다르면 localStorage에 다시 저장 (영속화)

// ✅ Snapshot 측 load도 migration (기존)
loadDraftSnapshot("bw_draft_${branchId}")
  → migrateSnapshot(snapshot)
```

### Snapshot Packing (STEP 6.2 후)

`scheduleLiveSnapshot` + `handleGeneratePreview` 두 곳의 treatmentCards 매핑:
```typescript
{
  id, slug, branchId, name, category,
  description: profile.cardDescription || profile.shortDescription || profile.oneLinePitch || "",  // ✅ STEP 7
  price, duration, image,
  isPublic, isFeatured, sortOrder,
  landingProfile, landingData, landingAssets,
  badge: profile.isFeatured ? "추천" : undefined,  // ✅ STEP 6.2
}
```

### Description fallback chain (STEP 7 통일)

3곳 모두 동일:
```typescript
profile.cardDescription || profile.shortDescription || profile.oneLinePitch || ""
```
- `app/admin/branch/homepage/page.tsx` line ~2998 (어드민 실시간 매핑, t.profile)
- `app/admin/branch/homepage/page.tsx` line ~9442 (handleGeneratePreview)
- `app/admin/branch/homepage/page.tsx` line ~9609 (scheduleLiveSnapshot)

---

## 현재 TS 오류 현황

| 파일 | 오류 수 | 상태 |
|------|---------|------|
| `app/admin/branch/homepage/page.tsx` | 0개 | ✅ Phase 1B 작업 중 baseline 유지 |
| `lib/landing-preview-types.ts` | 0개 | ✅ |
| `components/site/SiteNav.tsx` | 4개 | ⚠️ JSX style 안 템플릿 리터럴 미수정 |
| `app/admin/settings/page.tsx` | 2개 | ⚠️ 미파악 |
| `app/admin/branch/page.tsx` | 1개 | ⚠️ 미파악 |

**전체 baseline ~7개** — 모두 Phase 1B 작업 범위 외 기존 오류.

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

> **이유:** TypeScript JSX 파서가 `${}` 안의 `}`를 JSX 표현식 닫힘으로 오해해서
> 파일 전체에 cascade 오류 발생.

---

## Write 도구 사용 금지 규칙 ⚠️

```
❌ Write 도구로 대용량 파일(수백 줄 이상) 작성 금지
   → 파일이 중간에 잘려서 내용 유실됨

✅ 항상 Edit 도구로 부분 수정
✅ 수정 후 반드시 wc -l [파일명] 으로 줄 수 확인
✅ 줄 수가 예상보다 적으면 즉시 중단하고 Jason에게 보고
```

---

## 절대 삭제 금지 식별자 ⚠️

`homepage/page.tsx` 내 다음 식별자들은 6~7개 컴포넌트가 의존하므로 절대 삭제 금지:

| 식별자 | 줄 (대략) | 의존 컴포넌트 |
|--------|-----------|--------------|
| `BOX_PRESETS_DARK` | 2060 | resolveCardStyle, resolveStatCardStyle, TreatmentCardStyleEditor, resolveInfoBoxStyle, LinkedDataEditor, StrengthStatEditor, InfoBoxStylePanel |
| `BOX_PRESETS_LIGHT` | 2070 | (위와 동일) |
| `SHADOW_PRESETS` | 2080 | TreatmentCardStyleEditor, LinkedDataEditor, StrengthStatEditor, InfoBoxStylePanel |
| `resolveCardStyle` | 2090 | DoctorTiltCard, EquipmentTiltCard, TreatmentCard 옛(이미 삭제) |

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

## 다음 세션 시작 시 가장 먼저 할 일

1. **코워크에 코드 상태 스캔 의뢰** (이 문서가 실제 코드와 일치하는지 검증)
2. **STEP 8.2-A F1+F2 프롬프트 코드한테 보내기** (이전 세션에 준비됨)
3. F1+F2 끝나면 Jason 시각 검증 → STEP 8.2-A 종결
4. **STEP 9.2 결정**: booking/cart/popup도 디렉션처럼 컴포넌트 통일 필요 여부 read-only 일괄 스캔

---

## 데이터 동기화 — BroadcastChannel

```
채널명: bw_live_${branchId}
발신: 어드민이 저장할 때 "update" 메시지 전송
수신: 테스트 사이트 layout.tsx가 수신 → snapshot 즉시 reload
```

### 어드민 → 테스트 사이트 저장 경로

```
경로 1 (수동): "테스트 홈페이지 생성" 버튼
  → handleGeneratePreview()
  → bw_draft_${branchId} write

경로 2 (자동): 편집 시 300ms 디바운스
  → scheduleLiveSnapshot()
  → bw_draft_${branchId} 직접 write
```

### 테스트 사이트가 데이터 못 읽을 때 체크리스트

```
1. bw_draft_${branchId} 키가 localStorage에 존재하는가?
   → "테스트 홈페이지 생성" 버튼을 한 번 눌러야 최초 생성됨

2. URL의 branchSlug가 branch.id와 일치하는가?
   → /preview/site/[branchSlug] 에서 branchSlug = branchId 여야 함

3. BroadcastChannel 연결 여부
   → 어드민과 테스트 사이트를 같은 브라우저에서 열어야 함
```

---

## 컬러 시스템

```
GOLD    = "#c9a85c"  (챔페인 골드 — 다크 테마 핵심 강조색)
다크 배경 = "#0e0b06", "#0f0f0f"
라이트 텍스트 = "#f5f0e8"
```

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

예시 (STEP 6.2 패턴):
```
STEP X.0  read-only 진단 (그렙·view만, 수정 X)
          ↓ Chat 검토 + Jason 결정
STEP X.1  fix mini-step 1 → wc -l + grep + tsc 검증
          ↓ Jason 시각 검증 (필요 시)
STEP X.2  fix mini-step 2 → 검증
          ↓ ...
```