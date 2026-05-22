# TATOA 3자 협업 세팅 가이드
# Claude Chat + Claude Code + Cowork

---

## 한 번만 하는 초기 세팅

### Step 1 — Claude Chat 프로젝트 만들기

1. claude.ai 접속
2. 왼쪽 메뉴 → **Projects** → **New Project**
3. 프로젝트 이름: `TATOA CMS 개발`
4. **Project Knowledge** → 파일 추가:
   - `CHAT_PROJECT_KNOWLEDGE.md` (이 폴더 안에 있음)
5. 저장

> 이제 이 프로젝트에서 대화하면 Chat이 항상 TATOA 코드베이스 맥락을 알고 있음.

---

### Step 2 — tatoa-handoff 스킬 설치

1. Cowork 열기
2. 이 폴더 안의 `tatoa-handoff.skill` 파일을 Cowork에 드래그하거나 설치
3. 설치 확인: Cowork에서 "상태 보고서 만들어줘" 라고 입력해보기

---

### Step 3 — Claude Code 준비

Claude Code (터미널 CLI)가 프로젝트 폴더에서 실행되도록 설정:
```bash
cd "C:\Users\qzoro\Contoller_T V1"
claude
```

---

## 매번 쓰는 워크플로우

```
① 아이디어
    Jason → Chat에 아이디어 공유
    "이런 기능을 만들고 싶어"

② 기획
    Chat이 → 개발자 프롬프트 작성해서 제공
    Jason이 → 프롬프트 복사

③ 구현  
    Jason이 → 프롬프트를 Claude Code에 붙여넣기
    Code가 → 파일 직접 수정, 기능 구현

④ 보고
    Cowork에서 → "상태 보고서 만들어줘"
    리포트 자동 생성 → Jason이 복사

⑤ 동기화
    Chat에 → 리포트 붙여넣기
    Chat이 → 현재 상태 파악 + 다음 작업 설계 준비 완료

⑥ 반복
    다시 ①로
```

---

## 각 도구 사용법

### Claude Chat 프로젝트에서 할 것

**아이디어 공유 시:**
```
"이벤트 섹션에서 카드를 클릭하면 상세 모달이 뜨게 하고 싶어.
모달 안에는 이미지, 제목, 설명, 예약 버튼이 있어야 해."
```

**개발자 프롬프트 요청 시:**
```
"위 아이디어를 Claude Code가 바로 실행할 수 있는
개발자 프롬프트로 작성해줘."
```

**리포트 받은 후:**
```
[리포트 내용 붙여넣기]

"이 상태 기반으로 다음에 뭘 해야 할지 우선순위 정해줘."
```

---

### Claude Code에서 할 것

Chat이 준 프롬프트를 그대로 붙여넣기. 추가 지시사항:

```
[Chat 프롬프트 내용]

추가 주의사항:
- JSX style={{}} 안에서 템플릿 리터럴 절대 금지
- 큰 파일은 Write 대신 Edit(부분 수정) 사용
- 수정 후 wc -l 파일명 으로 줄 수 확인
- 작업 폴더: C:\Users\qzoro\Contoller_T V1
```

---

### Cowork에서 할 것

코드 작업이 끝나면:
```
상태 보고서 만들어줘
```
또는:
```
chat에 전달할 핸드오프 리포트 만들어줘
```

Cowork가 자동으로:
- 핵심 파일 줄 수 체크
- TS 오류 집계
- 최근 변경 파일 확인
- 구조화된 리포트 출력

---

## 파일 구조 (이 폴더)

```
Contoller_T V1/
  ├── SETUP_GUIDE.md              ← 지금 읽고 있는 파일 (워크플로우 가이드)
  ├── CHAT_PROJECT_KNOWLEDGE.md   ← Chat 프로젝트에 업로드할 지식 파일
  ├── PROJECT_BRIEF.md            ← 전체 프로젝트 브리핑 (상세 버전)
  ├── HANDOFF_TEMPLATE.md         ← 리포트 형식 참고용
  ├── tatoa-handoff.skill         ← Cowork에 설치할 스킬 파일
  └── [프로젝트 소스 파일들...]
```

---

## 자주 쓰는 Chat 프롬프트 모음

### 새 기능 기획 시
```
TATOA CMS에 [기능명] 기능을 추가하려고 해.
[기능 설명]
이걸 Claude Code가 바로 구현할 수 있도록
파일명, 함수명, 데이터 구조까지 구체적으로 적힌
개발자 프롬프트를 작성해줘.
```

### 버그 수정 요청 시
```
[증상 설명]
[어느 화면에서 발생하는지]
이 버그를 수정하는 개발자 프롬프트 써줘.
```

### 현재 상태 분석 요청 시
```
[핸드오프 리포트 붙여넣기]
현재 상태에서 가장 먼저 해야 할 작업 3개를 
우선순위 순으로 알려줘. 이유도 간단히.
```

---

## 팁

- Chat은 **기획과 설계**만. 코드는 Code가 함
- 리포트는 **매 작업 세션 끝날 때마다** 생성해서 Chat에 전달
- `CHAT_PROJECT_KNOWLEDGE.md`는 프로젝트 구조가 크게 바뀔 때마다 업데이트
- 큰 작업 전에는 Chat에서 먼저 방향 합의 후 Code에 전달

---

*최초 작성: 2026-04-27*
