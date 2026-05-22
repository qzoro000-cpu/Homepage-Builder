# OdeClinic 예약 페이지 디자인 토큰 분석

URL: `https://odeclinicseoul.com/ko/reservation`
분석 일자: 2026-05-11
뷰포트: 모바일 (페이지 자체가 max-width 컨테이너 안에서 **390px**로 렌더링되고 있음 — 실제 모바일과 동일한 width 값)
기술: Next.js + **Tailwind CSS** (arbitrary values: `text-[18px]`, `text-[#483C32]` 등)

---

## Phase 1: 접근 결과

- 직접 `web_fetch` → 빈 응답 (SPA로 클라이언트 렌더링)
- Claude in Chrome으로 navigate → JavaScript 주입으로 computed style + Tailwind class 추출 성공
- **이점**: Tailwind arbitrary value가 그대로 클래스명에 노출되어 픽셀/색상이 가공 없이 추출됨

## Phase 1.5: 페이지 구조 정정 (중요)

사용자가 가정한 "6단계 분리 화면" 구조가 아닙니다. 실제 OdeClinic 예약은:

| 구분 | 사용자 가정 | OdeClinic 실제 |
|---|---|---|
| 화면 분리 | 6단계 페이지 전환 | **단일 페이지 내 누적 섹션** |
| Step 1 (지점 선택) | 있음 | **없음** (단일 지점 — 강남) |
| Step 2 (진료옵션) | 별도 화면 | 페이지 내 "초진/재진" 옵션 |
| Step 3 (시술 선택) | 별도 화면 | **이전 페이지(이벤트&가격)에서 선택 완료** — 예약 페이지에는 "선택한 시술" 요약 카드만 노출 |
| Step 4 (날짜+시간) | 별도 화면 | 페이지 최상단 캘린더 (시간 슬롯은 날짜 선택 후 조건부 노출 — 미선택 상태로는 노출되지 않음) |
| Step 5 (고객정보) | 별도 화면 | "예약 정보" 입력 폼 + "본인인증" |
| Step 6 (약관+완료) | 별도 화면 | "안내사항" + "약관 동의" + "예약 완료" CTA |

→ **본 분석은 실제 OdeClinic 페이지에 존재하는 섹션 기준**으로 정리하며, 부재한 단계는 "해당 없음"으로 명시합니다.

---

## Phase 2: 섹션별 디자인 토큰

### 공통 외곽 (페이지 전체)

| 항목 | 추출 값 | Tailwind 클래스 |
|---|---|---|
| 페이지 max-width | **390px** (모바일 컨테이너) | — |
| 페이지 배경 | `#FFFFFF` (white) | `bg-white` |
| 페이지 좌우 padding | **20px** | `px-5` |
| 페이지 상하 padding | **32px** | `py-8` |
| 섹션 간 세로 gap | **32px** | `space-y-8` |
| 섹션 내 헤더-콘텐츠 gap | **16px** | `space-y-4` |

### 공통 상단 헤더 ("예약하기")

| 항목 | 추출 값 |
|---|---|
| 포지셔닝 | `fixed top-[104px] z-40` |
| max-width | 600px (데스크탑) / 100% (모바일) |
| 배경 | `bg-white/80 backdrop-blur-md` (80% 흰색 + 블러) |
| 하단 보더 | `border-b border-[#483C32]/5` |
| 높이 | **56px** (`h-14`) |
| 좌우 padding | 16px (`px-4`) |
| 타이틀 H1 | `text-[15px] font-black tracking-tight text-[#483C32]` |
| 타이틀 폰트 | **15px / 900 / -tight** |

### 공통 정보 알림 박스 ("확정 대기 중인...")

| 항목 | 추출 값 | Tailwind |
|---|---|---|
| 배경 | `#483C32` @ 5% opacity | `bg-[#483C32]/5` |
| 보더 | `1px solid #483C32` @ 10% | `border border-[#483C32]/10` |
| borderRadius | **16px** | `rounded-2xl` |
| 좌우 padding | 20px | `px-5` |
| 상하 padding | 16px | `py-4` |
| 폰트 | 16px / 400 / `#483C32` | (default body) |

### 공통 섹션 헤더 (모든 섹션 공용 — `날짜 선택`, `초진/재진` 등)

| 항목 | 추출 값 | Tailwind |
|---|---|---|
| 레이아웃 | flex 가로배치 | `flex items-center gap-2` |
| 좌측 강조 막대 | **4px × 16px**, `#483C32`, 완전 둥글 (pill) | `w-1 h-4 bg-[#483C32] rounded-full` |
| 막대 ↔ 텍스트 gap | **8px** | `gap-2` |
| 타이틀 텍스트 | **18px / 700 (bold) / `#483C32`** | `text-[18px] font-bold text-[#483C32]` |
| 헤더 아래 여백 | 16px (`space-y-4`의 자식 간격) | — |

---

### Section A: 날짜 선택 (Calendar)

#### A1. 캘린더 카드 (외곽)

| 항목 | 값 | Tailwind |
|---|---|---|
| 배경 | `#FFFFFF` | `bg-white` |
| borderRadius | **28px** | `rounded-[28px]` |
| 보더 | `1px solid #483C32` @ 10% | `border border-[#483C32]/10` |
| 패딩 | 0 (셀이 직접 채움) | — |
| 그림자 | 없음 | — |
| 너비 | 350px (페이지 내부 폭 = 390 - 40) | — |

#### A2. 월 라벨 ("2026.05") + 이동 버튼

| 항목 | 값 | 비고 |
|---|---|---|
| 월 텍스트 | (`2026.05`) | 클래스 일부 추출 불가 — 화면상 18px 가량 / bold / `#483C32` 로 추정되나 정확한 raw 클래스 미확보 |
| ◀ ▶ 버튼 | react-day-picker 기본 (`rdp-nav_button`) | 색상은 `#483C32`로 통일 |

> ⚠️ 월 라벨 자체의 raw Tailwind 클래스는 컴포넌트 내부에서 별도 wrapper로 감싸져있어 정확한 px 값 미추출. shadow DOM은 아니나 추가 셀렉터 필요.

#### A3. 요일 헤더 (일/월/화/...)

| 항목 | 값 | Tailwind |
|---|---|---|
| 폰트 | **12px / 600 / `#483C32` @ 40%** | `text-[12px] font-semibold text-[#483C32]/40` |
| 컬럼 너비 | flex-1 (균등 분할) | `flex-1` |
| 하단 padding | 12px | `pb-3` |
| **주말 색상 구분 없음** | 일/토 모두 동일한 muted brown | — |

#### A4. 날짜 셀

| 항목 | 값 | Tailwind |
|---|---|---|
| 셀 크기 | **40 × 40px** (정사각) | `w-full aspect-square max-w-[40px]` |
| 셀 모양 | 완전 원형 호버 영역 | `rounded-full` |
| 폰트 | **13px / 600 (semibold)** | `text-[13px] font-semibold` |
| 활성 평일 색 | `#483C32` (브랜드 브라운) | `text-[#483C32]` |
| **일요일 색** | **`#DC2626`** (red-600) | (조건부 적용) |
| **토요일 색** | **`#2563EB`** (blue-600) | (조건부 적용) |
| 비활성(과거/마감) 날짜 | **opacity 0.25** | `text-[#483C32]/10` (클래스명) + `opacity-25` (실제 컴퓨티드) |
| 호버 배경 | `#483C32` @ 10% | `hover:bg-[#483C32]/10` |
| 선택 표시 (선택 시) | **추출 불가** — 현재 페이지에서 날짜 미선택 상태이므로 selected 클래스 변화 확인 불가 |
| 예약 가능 표시 (dot) | **없음** — 현재 페이지에서 dot 표시 미발견 |

> ⚠️ `text-[#483C32]/10` 클래스가 비활성 셀에 cascaded되지만 computed에서는 opacity 0.25로 나타나는 점은 디자인 시스템이 클래스명 자체가 아닌 별도 disabled 상태 CSS로 처리하고 있음을 시사. TATOA 이식 시 `opacity-25`로 통일 권장.

#### A5. 시간 슬롯 (Step4 가정)

**해당 없음** — 날짜 선택 전에는 시간 슬롯이 렌더링되지 않음. 날짜를 클릭해 확인하려 했으나 영업일이 선택돼야 하므로 페이지 상태 변경 없이는 추출 불가. (선택 후 별도 분석 필요)

---

### Section B: 초진/재진 (진료옵션)

#### B1. 섹션 카드 (외곽)

| 항목 | 값 | Tailwind |
|---|---|---|
| 배경 | `#FFFFFF` | `bg-white` |
| borderRadius | **28px** | `rounded-[28px]` |
| 보더 | `1px solid #483C32` @ 10% | `border border-[#483C32]/10` |
| 패딩 | **20px** (4방향) | `p-5` |
| 그림자 | 없음 | — |
| 옵션 간 gap | 추출 불가 (단, parent의 `space-y-4` 적용 시 16px) | — |

#### B2. 옵션 버튼 (내부 선택 카드)

| 항목 | 비선택 상태 | 선택 상태 (추정) |
|---|---|---|
| 배경 | `transparent` | (별도 클래스 적용 — 미확정) |
| 보더 | **2px solid `#483C32` @ 10%** | `border-[#483C32]` (full) 로 변경 |
| borderRadius | **16px** | `rounded-2xl` |
| 좌우 padding | 16px (`px-4`) | 동일 |
| 상하 padding | 16px (`py-4`) | 동일 |
| 카드 내부 gap | **12px** (`gap-3`) | 동일 |
| 폰트 | **16px / 400 / `#483C32`** | 동일 |
| 호버 | border opacity 30% | — |
| 정렬 | 좌측 정렬 (`text-left`) | — |
| 너비 | 100% | — |
| 높이 (자동) | **56px** (px-4 + 16+24 ≈) | — |

> ⚠️ 옵션 카드의 좌측 아이콘(이모지/SVG)이나 우측 선택 표시는 현재 코드 추출에서 별도 클래스 미확보 — 추출 불가 표시.

---

### Section C: 선택한 시술 카드

#### C1. 시술 카드 (선택된 상태 — 페이지 진입 시 이미 selected)

| 항목 | 값 | Tailwind |
|---|---|---|
| 배경 | `#FFFFFF` | `bg-white` |
| 보더 | **2px solid `#483C32`** (full) | `border-2 border-[#483C32]` |
| borderRadius | **28px** | `rounded-[28px]` |
| 패딩 | **24px** (4방향) | `p-6` |
| 그림자 | **shadow-lg** = `0 10px 15px -3px rgba(0,0,0,0.1)` (Tailwind 기본) | `shadow-lg` |
| 커서 | default (제거 불가 카드) | `cursor-default` |
| 카드 간 세로 gap | **12px** | `space-y-3` (부모) |
| 내부 layout | flex column gap 16px | `flex flex-col gap-4` |
| 카드 너비 | 350px (페이지 폭) | `w-full` |
| 카드 높이 | 130 ~ 170px (콘텐츠 가변) | — |

> ⚠️ 비선택 상태 카드는 이 페이지에서 노출되지 않음 — 비선택 톤은 추출 불가. (이벤트&가격 페이지에서 별도 분석 필요)

#### C2. 카드 내부 — 시술명 (제목)

| 항목 | 값 |
|---|---|
| 폰트 크기 | **추출 불가** — H3/타이틀 요소가 별도 셀렉터로 격리되어 raw 클래스 미추출 |
| 화면 추정 | 14-16px / 600~700 / `#483C32` |

#### C3. 카드 내부 — 가격 라벨 ("VAT 별도" 미니 라벨)

| 항목 | 값 | Tailwind |
|---|---|---|
| 폰트 | **11px / 500 / `#2C636A` @ 60%** | `text-[11px] font-medium text-[#2C636A]/60` |
| 하단 margin | 2px (`mb-0.5`) | — |

#### C4. 카드 내부 — 정가 (할인 전, 취소선)

| 항목 | 값 | Tailwind |
|---|---|---|
| 폰트 | **13px / 700 / `#483C32` @ 20%** | `text-[#483C32]/20 text-[13px] font-bold` |
| 텍스트 데코 | line-through, decoration 1px | `line-through decoration-1` |

#### C5. 카드 내부 — 현재가 (할인가 / 정가)

| 항목 | 값 | Tailwind |
|---|---|---|
| 폰트 | **20px / 900 (black)** | `text-[20px] font-black leading-none` |
| 색상 (할인가) | **`#2C636A`** (티얼/청록 — 강조 색) | `text-[#2C636A]` |
| line-height | 1.0 (붙임) | `leading-none` |

#### C6. 할인 배지 ("15% OFF" / "12% OFF")

| 항목 | 값 | Tailwind |
|---|---|---|
| **형태** | **배지 박스 아님** — pill/배경/패딩 없는 **순수 강조 텍스트** | — |
| 폰트 | **12px / 900 (black)** | `text-[12px] font-black` |
| 색상 | **`#FF4D4D`** (선명한 빨강) | `text-[#ff4d4d]` |
| 배경 | 없음 | — |
| padding/radius | 없음 | — |
| 위치 | 현재가 텍스트 옆 (inline) | — |

#### C7. 총 금액 행

| 항목 | 값 | Tailwind |
|---|---|---|
| "총 금액" 라벨 | **15px / 700 / `#483C32`** | `text-[15px] font-bold text-[#483C32]` |
| 금액 값 | **20px / 900 / `#483C32`** | `text-[20px] font-black text-[#483C32]` |
| VAT 별도 (하단) | 11px / 500 / `#2C636A` @ 60% | (위와 동일) |

---

### Section D: 예약 정보 (입력 폼)

#### D1. 섹션 카드 외곽

(Section B와 동일 패턴) — `bg-white rounded-[28px] p-5 border border-[#483C32]/10`

#### D2. 입력 필드 (이름/생년월일/이메일)

| 항목 | 값 | Tailwind |
|---|---|---|
| 너비 | 100% | `w-full` |
| 좌우 padding | 16px | `px-4` |
| 상하 padding | 12px | `py-3` |
| borderRadius | **12px** | `rounded-xl` |
| 보더 | **1px solid `#483C32` @ 10%** | `border border-[#483C32]/10` |
| 배경 | `#FFFFFF` | `bg-white` |
| 폰트 | **14px / 500 / `#483C32`** | `text-[14px] font-medium text-[#483C32]` |
| Focus 보더 | `#483C32` @ 30% | `focus:border-[#483C32]/30` |
| Focus outline | 제거 | `focus:outline-none` |
| 높이 (계산) | **47px** | — |

#### D3. 라벨 ("이름 *", "생년월일 *" 등)

| 항목 | 값 | 비고 |
|---|---|---|
| 폰트 | 16px / 400 (default) / `#483C32` | 별도 클래스 거의 없음 |
| 별표 `*` | 빨강 강조 (배지 색과 유사 `#FF4D4D` 추정) | 미확정 |

#### D4. 텍스트 영역 (요청사항)

추출 불가 — 미작성 상태에서 input과 동일 스타일로 보임. 위 D2 패턴 적용 추정.

---

### Section E: 본인인증

#### E1. 섹션 카드 외곽

(동일 패턴) — `bg-white rounded-[28px] p-5 border border-[#483C32]/10`

#### E2. 국가 코드 선택 ("+82")

| 항목 | 값 | Tailwind |
|---|---|---|
| 폰트 | **13px / 500 / `#483C32`** | `text-[13px] font-medium text-[#483C32]` |
| 레이아웃 | flex 가로 + gap 4px (드롭다운 화살표 포함) | `flex items-center gap-1` |
| 너비 | 42 × 24px (auto-sized) | — |

#### E3. 휴대폰 번호 input

D2와 동일 패턴 추정 (raw 클래스 별도 셀렉터로 추출 안 됨, placeholder "01012345678" 화면 확인)

#### E4. "인증번호 전송" 버튼 (대기/비활성 상태)

| 항목 | 값 | Tailwind |
|---|---|---|
| 너비 | 100% | `w-full` |
| 상하 padding | 12px | `py-3` |
| 배경 | **`#483C32` @ 10%** (faded brand) | `bg-[#483C32]/10` |
| 폰트 색 | `#483C32` | `text-[#483C32]` |
| 폰트 | **13px / 700** | `text-[13px] font-bold` |
| borderRadius | **12px** | `rounded-xl` |
| 정렬 | 가운데 | `flex items-center justify-center` |
| 호버 | bg opacity 20% | `hover:bg-[#483C32]/20` |
| 비활성 시 | opacity 50% | `disabled:opacity-50` |
| 높이 | 44px | — |

---

### Section F: 안내사항 / 약관 동의 / 예약 완료

#### F1. 안내사항 카드 + 불릿

| 항목 | 값 | Tailwind |
|---|---|---|
| 카드 외곽 | 동일 패턴 (`bg-white rounded-[28px] p-5 border #483C32/10`) | — |
| 불릿 한 줄 layout | flex 가로, gap 8px, 상단 align | `flex items-start gap-2` |
| 불릿 "•" 점 | **13px / `#483C32` @ 30%**, mt 2px, shrink-0 | `text-[#483C32]/30 mt-0.5 shrink-0` |
| 본문 텍스트 | **13px / 400 / `#483C32` @ 70%**, line-height 1.5 (19.5px) | (별도 클래스 없음 — 부모로부터 cascade) |

#### F2. 약관 동의 — 커스텀 체크박스

| 항목 | 값 | Tailwind |
|---|---|---|
| 형태 | div (커스텀, native input 아님) | — |
| 크기 | **20 × 20px** | `w-5 h-5` |
| borderRadius | 4px (`rounded` 기본) | `rounded` |
| 보더 | **2px solid `#483C32` @ 20%** | `border-2 border-[#483C32]/20` |
| 호버 보더 | 40% opacity | `hover:border-[#483C32]/40` |
| 체크 표시 | 추출 불가 (미체크 상태) | — |
| 라벨 layout | flex 가로, gap 12px, cursor pointer | `flex items-center gap-3 cursor-pointer` |

#### F3. 약관 동의 — 라벨 텍스트

| 항목 | 값 | Tailwind |
|---|---|---|
| 본문 | **14px / 700 / `#483C32`** | `text-[14px] font-bold text-[#483C32]` |
| 별표 색 | 강조 빨강 추정 (`#FF4D4D` 계열) | — |
| 하단 부가 설명 | 13px / 400 / `#483C32` @ 50~70% 추정 — 정확한 클래스 미추출 | — |

#### F4. 예약 완료 CTA 버튼 (최종 Primary)

| 항목 | 값 | Tailwind |
|---|---|---|
| 너비 | 100% | `w-full` |
| 상하 padding | 16px | `py-4` |
| 배경 | **`#483C32`** (full brand) | `bg-[#483C32]` |
| 폰트 색 | `#FFFFFF` | `text-white` |
| 폰트 | **16px / 700 (bold)** | `text-[16px] font-bold` |
| borderRadius | **12px** | `rounded-xl` |
| 호버 배경 | `#483C32` @ 90% | `hover:bg-[#483C32]/90` |
| 클릭 효과 | scale 0.98 | `active:scale-[0.98]` |
| 상단 margin | 16px | `mt-4` |
| 비활성 opacity | 60% | `disabled:opacity-60` |
| 높이 | **56px** | — |
| 그림자 | 없음 | — |

---

## Phase 3: 종합 디자인 토큰

### 색상 팔레트

| 토큰 | 값 | 용도 |
|---|---|---|
| `brand-primary` | **`#483C32`** | 본문 텍스트, 보더, 1차 버튼 배경, 강조 막대, 섹션 헤더 |
| `brand-accent` | **`#2C636A`** | 시술 할인 가격 강조, VAT 라벨 |
| `accent-red` | **`#FF4D4D`** | 할인율 텍스트 ("15% OFF") |
| `weekend-sun` | **`#DC2626`** (red-600) | 일요일 날짜 셀 |
| `weekend-sat` | **`#2563EB`** (blue-600) | 토요일 날짜 셀 |
| `surface` | **`#FFFFFF`** | 페이지 배경, 카드 배경 |
| `border-subtle` | `#483C32` @ **10% alpha** | 모든 카드/입력 보더 |
| `border-medium` | `#483C32` @ **20%** | 체크박스, 옵션 카드 보더 |
| `text-muted-1` | `#483C32` @ **70%** | 안내사항 본문 |
| `text-muted-2` | `#483C32` @ **40%** | 요일 헤더 |
| `text-muted-3` | `#483C32` @ **30%** | 불릿 점, 호버 보더 |
| `text-muted-4` | `#483C32` @ **20%** | 취소선 정가 |
| `surface-tinted` | `#483C32` @ **5%** | 정보 알림 박스 배경, 비활성 버튼 |
| `surface-tinted-2` | `#483C32` @ **10%** | "인증번호 전송" 비활성 버튼 |

### 타이포그래피 스케일

| 토큰 | px | 용도 | font-weight |
|---|---|---|---|
| `xs-mini` | **11px** | VAT 라벨 | 500 |
| `xs` | **12px** | 요일 헤더, 할인 배지 | 600 / 900 |
| `sm` | **13px** | 날짜 셀, 보조 텍스트, 부가 안내, 보조 버튼 | 500~700 |
| `base` | **14px** | 입력 필드, 약관 텍스트 | 500~700 |
| `md` | **15px** | 상단 헤더 H1, 총금액 라벨 | 700~900 |
| `lg` | **16px** | 본문 default, 옵션 카드, 1차 버튼, 정보 알림 | 400 / 700 |
| `xl` | **18px** | **섹션 헤더 (`날짜 선택` 등)** | 700 |
| `2xl` | **20px** | 가격 표시, 총금액 값 | 900 |

> Weight 사용: **400 / 500 / 600 / 700 / 900** (800 미사용)

### Border Radius 스케일

| 토큰 | 값 | 적용 |
|---|---|---|
| `radius-md` | **12px** | 버튼 (`rounded-xl`), 입력 필드 |
| `radius-lg` | **16px** | 옵션 버튼, 정보 알림 박스 (`rounded-2xl`) |
| `radius-xl` | **28px** | **섹션 카드 외곽** (`rounded-[28px]`) |
| `radius-full` | **9999px** | 캘린더 셀, 좌측 강조 막대, 검색 input |

> ⚠️ **28px**는 Tailwind 기본 스케일 외 — 디자인 시스템 고유값. 모든 큰 카드에 일관 적용.

### Spacing 스케일 (Tailwind `space-N` 환산)

| 토큰 | px | 사용처 |
|---|---|---|
| `space-0.5` | 2px | 미세 정렬 (`mt-0.5`) |
| `space-1` | 4px | 좌측 막대 너비 |
| `space-2` | 8px | 헤더 내 gap |
| `space-3` | 12px | 카드 간 gap, 옵션 내부 gap, 버튼 상하 패딩 |
| `space-4` | 16px | 옵션 카드 padding, 입력 좌우 padding, 안내 박스 상하 패딩 |
| `space-5` | 20px | 페이지 좌우 padding, 섹션 카드 padding, 정보 알림 좌우 padding |
| `space-6` | 24px | 시술 카드 padding (`p-6`) |
| `space-8` | 32px | 페이지 상하 padding, 섹션 간 gap |

### 그림자 시스템

| 토큰 | 값 | 사용 |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | 시술 카드 (비선택?) |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | **시술 카드 선택 상태** |
| 외 | 대부분 그림자 없이 보더만으로 분리 | — |

### 보더 시스템

| 두께 | 사용 |
|---|---|
| **1px** | 섹션 카드 외곽, 입력 필드 |
| **2px** | 옵션 버튼, 체크박스, 시술 카드 (강조 필요 영역) |

---

## Phase 4: 핵심 디자인 원칙 (TATOA 이식용 요약)

1. **Single Brand Color Dominance**: 거의 모든 UI 요소가 `#483C32` 하나의 색상의 **opacity 변주**로 표현됨. 0%(완전 white surface) → 5/10/20/30/40/70/100% 8단계로 위계 형성.

2. **No Heavy Decoration**: 그림자 거의 없음, 배지에 배경도 없음 (단순 강조 텍스트), 보더 + opacity만으로 모든 위계를 만듦.

3. **Card-in-Card Pattern**:
   - 외곽 큰 카드(`rounded-[28px] p-5 border-#483C32/10`)
   - 내부 작은 액션 카드(`rounded-2xl p-4 border-2`)
   - 더 내부 입력/버튼(`rounded-xl p-3`)
   → **28 → 16 → 12** radius hierarchy로 시각적 nesting 구분

4. **Brand vs Accent Color 분리**:
   - `#483C32`(브라운): UI 구조 (텍스트/보더/CTA)
   - `#2C636A`(티얼): **가격(돈)** 강조 전용
   - `#FF4D4D`: 할인율
   - 두 메인 색은 거의 섞이지 않음

5. **Typography Pyramid**:
   - 본문 14~16px / 섹션 헤더 18px / 가격 강조 20px
   - 작은 보조 정보 11~13px (대부분 muted opacity와 결합)

6. **No Step Indicator**: 단계 표시기(1/2/3, 진행도 바) **없음**. 섹션 헤더 + 좌측 막대(`w-1 h-4 rounded-full`)만으로 구분.

---

## 추가 발견

- **단계 간 전환 효과**: 화면 분리 없음 → 단일 페이지에서 사용자가 위에서 아래로 작성하는 흐름. 시간 슬롯 등 일부 영역은 **조건부 렌더링**(날짜 선택 후 노출).
- **상단 헤더 sticky 패턴**: `fixed top-[104px] bg-white/80 backdrop-blur-md` → 글래스모피즘 sticky 헤더.
- **Floating Action**: 우측 하단에 + 버튼(장바구니/카트 추정) + scroll-to-top 버튼 noted. 예약 흐름 외 글로벌 UI.
- **체크박스 커스텀**: native input 사용 안 함 → 모든 상태가 CSS class로 제어됨 (구현 시 동일하게 div + state로 처리 권장).

---

## 추출 불가 항목 (정직한 한계)

다음 항목은 페이지 상태/구조상 추출이 불가능하여 **추측하지 않음**:

1. **날짜 선택 후 상태**: selected 셀의 배경/색, "오늘" 표시, 예약 가능 dot, 다음 단계로의 전환
2. **시간 슬롯 그리드**: 날짜 미선택 상태 → 렌더링되지 않음
3. **비선택 시술 카드**: 페이지 진입 시 이미 selected 상태로 들어옴 → 비선택 톤 추출 불가 (이벤트&가격 페이지에서 별도 분석 필요)
4. **체크박스 체크 표시**: 미체크 상태 → 체크 후 아이콘/색 추출 불가
5. **시술 카드 제목/부제 raw 클래스**: 별도 nested 셀렉터로 격리되어 직접 추출 안 됨 (대략적 크기는 화면에서 확인 가능하나 정확한 px 단위 미확정)
6. **에러/경고 토스트 톤**: 페이지에서 노출되지 않음
7. **드롭다운 열린 상태 (+82 클릭 시)**: 미클릭 상태
