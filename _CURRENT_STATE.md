---
## 📋 TATOA CMS 핸드오프 리포트
**날짜:** 2026-05-15
**작성:** Cowork (tatoa-handoff 자동 생성)

---

### ✅ 이번 세션 완료 작업

- **19-G 단계 — recruit 페이지 신설 시도**
  - `app/preview/site/[branchSlug]/recruit/page.tsx` 신규 생성 (18줄, 정상)
  - `components/site/sections/recruit-preview.tsx` 신규 작성 시도 (현재 52줄, **truncated**)
- **19-F StepBar 잘림 진단 종결**
  - 어드민 모바일 simulator 흰 카드(L400 booking-page.tsx) `flexShrink: 0` 미적용이 근본 원인으로 식별됨 (chain 1~5 정상, 외부 wrapper 단일 누락)
- **booking-preview.tsx, SiteNav.tsx, booking-page.tsx, complete/page.tsx, recruit-preview.tsx 5개 파일이 truncate/null-byte로 손상된 상태**

---

### 📁 핵심 파일 현재 상태

| 파일 | 줄 수 | 상태 |
|------|-------|------|
| `app/admin/branch/homepage/page.tsx` | 11,294줄 | ✅ |
| `app/preview/site/[branchSlug]/page.tsx` | 54줄 | ✅ |
| `lib/branch-website-store.tsx` | 584줄 | ✅ |
| `components/site/SiteNav.tsx` | 286줄 | ⚠️ EOF 후 null byte (L287) |
| `components/site/sections/booking-preview.tsx` | 1,945줄 | ❌ **truncated** — PreviewBooking 함수가 L1946 `if (mode === "pa` 에서 중단 |
| `components/site/sections/recruit-preview.tsx` | 52줄 | ❌ **truncated** — `rcIntroImage: "` 에서 중단, PreviewRecruit export 없음 |
| `app/admin/branch/homepage/booking-page.tsx` | 449줄 | ⚠️ EOF 후 null byte (L450) |
| `app/preview/site/[branchSlug]/booking/complete/page.tsx` | 73줄 | ❌ **truncated** — main/div/ThemeCtx.Provider 닫는 태그 없음 |
| `app/preview/site/[branchSlug]/recruit/page.tsx` | 18줄 | ✅ (import 대상이 깨져 있음) |

**TypeScript 오류:** 총 **16개**

핵심 오류 (파일별 그룹핑):

| 파일 | 오류 유형 | 라인 |
|---|---|---|
| `components/site/sections/booking-preview.tsx` | TS1002 Unterminated string literal | 1946 |
| `components/site/sections/recruit-preview.tsx` | TS1002 Unterminated string literal | 53 |
| `app/preview/site/.../booking/complete/page.tsx` | TS17008 / TS1005 (닫는 태그 누락) | 67~74 |
| `app/admin/branch/homepage/booking-page.tsx` | TS1127 Invalid character (×3, null byte) | 450 |
| `components/site/SiteNav.tsx` | TS1127 Invalid character (×4, null byte) | 287 |
| `.next/dev/types/routes.d.ts` / `validator.ts` | TS1005 (자동 생성 cascade) | — |

---

### ⚠️ 현재 알려진 문제

1. **booking-preview.tsx truncation (HIGH).**
   PreviewBooking export 함수 본문이 L1946 `if (mode === "pa` 에서 중단. PreviewBooking은 어드민 booking-page.tsx (3곳) + 테스트 사이트 booking/page.tsx (1곳)에서 호출되므로 booking 페이지 + 어드민 미리보기 전부 빌드 불가 상태.

2. **recruit-preview.tsx truncation (HIGH).**
   파일이 52줄 `rcIntroImage: "` 에서 잘림. **PreviewRecruit 함수 export 자체가 없음.** recruit/page.tsx (L15)가 `import { PreviewRecruit }` 하므로 recruit 페이지도 빌드 불가.

3. **booking/complete/page.tsx truncation (HIGH).**
   L73 `selectedTxIds` 직후 잘림. main/div/ThemeCtx.Provider 닫는 태그 모두 누락. 예약 완료 페이지 빌드 불가.

4. **SiteNav.tsx + booking-page.tsx EOF null bytes (MEDIUM).**
   파일 본문 자체는 정상으로 보이나 EOF에 null byte(`^@`)가 붙어 TS1127. 빌드 차단 가능성.

5. **.next/dev/types cascade (LOW).**
   위 source 오류로 인해 Next.js 자동 생성 타입이 손상됨. source 수정 후 `.next` 폴더 삭제 + 재빌드로 해결 가능.

6. **19-F StepBar 잘림 잔존 (사전 진단 종결).**
   booking-page.tsx L400 흰 카드(`width: 375`)가 grid 우측 컬럼 260px 안의 flex item으로 `flex-shrink: 1`이라 260px로 축소되어 StepBar 가용 폭 약 222px 대 자식 약 290px → 67px 초과. **수정안: L400에 `flexShrink: 0` 1줄 추가.** (단 위 truncation 5건 복구 후 적용 권장.)

---

### 💡 Chat에게: 다음 권장 작업

#### P0 — 빌드 복구 (즉시)

1. **booking-preview.tsx 복원**
   - 현재 L1946 에서 PreviewBooking 함수가 잘림. 직전 상태 (이전 검사 시 L1962까지 완전했던) 기준으로 다음 코드 누락:
   ```tsx
   if (mode === "page") {
     return (
       <BookingPhoneScreen ... mode={mode} forceNarrow={forceNarrow} />
     )
   }

   return (
     <BookingPhoneScreen ... mode={mode} forceNarrow={forceNarrow} />
   )
   }
   ```
   - 백업이 있다면 1962줄 전체 복원, 없다면 위 PreviewBooking 함수만 마저 작성.

2. **recruit-preview.tsx 완성**
   - 현재 L52 `rcIntroImage: "` 에서 잘림. RECRUIT_DEFAULT_VALUES 전체 키 정의 → PreviewRecruit 함수 → export 까지 마저 작성 필요.
   - PreviewRecruit props: `{ values, branchName }` (L34~L37에 타입 정의 있음).
   - maxWidth 1280 outer wrapper (L13 사전 확인됨).

3. **booking/complete/page.tsx 복원**
   - L73 `selectedTxIds` 직후가 잘림.
   - 누락: `selectedTxIds={draft?.selectedTxIds ?? []}` 닫기 + `branchId / date / time / onReset` props + `</Step6Confirm>` → `</ThemeCtx.Provider>` → `</div>` → `</main>` 닫기.

4. **SiteNav.tsx + booking-page.tsx EOF null byte 제거**
   - 파일 끝의 `\0\0\0...` 바이트만 제거. 본문은 정상.

#### P1 — 빌드 통과 후

5. **StepBar 잘림 fix 적용**
   - booking-page.tsx L400: `<div style={{ width: 375, height: 700, overflow: "hidden", border: "1px solid #e5e5e5", borderRadius: 12, background: "white", flexShrink: 0 }}>` (flexShrink: 0 추가).
   - 안전 마진 +37px 확보 — 19-F-2-fix-3 chain 정합과 결합되어 잘림 완전 해소 예상.

6. **PreviewBooking mode dead branch 제거** (5/12 진단 잔존)
   - L1946–L1950 if (mode === "page") 분기와 L1952–L1961 else 분기 출력이 동일. 한쪽 분기로 단순화 가능.

#### P2 — recruit 후속

7. **NAV_LINKS에 recruit 항목 추가 검토**
   - SiteNav.tsx L20–L24에 `{ label: "채용", href: \`/preview/site/${slug}/recruit\` }` 추가 여부 결정.

8. **HomeSectionId 에 "recruit" 추가 + 어드민 편집 UI 추가**
   - app/admin/branch/homepage/page.tsx L61–L63 HomeSectionId 타입에 "recruit" 추가.
   - sectionValues["recruit"] 편집기 추가 (InfoEditor 패턴 모방).

---
*이 리포트를 Claude Chat 프로젝트에 그대로 붙여넣으세요.*
