# 할 일 관리 앱 — Claude Code 단계별 프롬프트

[PRD & 설계 스펙](superpowers/specs/2026-10-02-todo-app-prd.md)을 Claude Code에서 순서대로 실행할 5단계 프롬프트로 정리했다. 각 단계의 코드 블록을 그대로 복사해 Claude Code에 붙여 넣으면 된다.

**진행 규칙**

- 한 단계가 끝나고 완료 조건을 직접 확인한 뒤 다음 단계로 넘어간다.
- 단계마다 새 대화로 시작해도 되도록, 각 프롬프트는 스펙 경로와 필요한 맥락을 스스로 담고 있다.
- 각 단계는 커밋 1개로 끝난다. 문제가 생기면 그 커밋으로 되돌릴 수 있다.

| 단계 | 결과물 | 다루는 스펙 |
| --- | --- | --- |
| 1. 프로젝트 뼈대와 테스트 환경 | `index.html`, `style.css`, `app.js`(상수), `tests.html` | 5, 8, 9(상수), 12절 |
| 2. 상태 변경·계산 함수 | `addTodo` 등 순수 함수 7개 + 테스트 | 3, 9절 |
| 3. 저장소와 오류 처리 | localStorage 함수 4개 + 테스트 | 10, 11절 |
| 4. 화면 렌더링과 이벤트 | `render()`, `init()`, F1–F8 동작 | 3, 4절 |
| 5. 스타일·반응형·최종 검증 | 완성된 CSS, 접근성, 체크리스트 통과 | 4, 5, 6, 12절 |

---

## 1단계. 프로젝트 뼈대와 테스트 환경

```text
docs/superpowers/specs/2026-10-02-todo-app-prd.md 를 먼저 끝까지 읽어줘. 이 문서가 이 프로젝트의 유일한 기준이야.

이번 단계에서는 앱 기능 없이 "프로젝트 뼈대와 테스트 환경"만 만들어줘.

[만들 파일]
1. index.html
   - <div id="app"></div> 루트와 4절 화면 순서대로 빈 영역(헤더, 진행률, 입력, 필터 탭, 목록, 하단 버튼)을 둔다.
   - style.css 와 app.js 를 연결한다. app.js 는 일반 <script src="app.js"></script> 로 body 끝에서 불러온다. type="module" 금지.
   - <html lang="ko">, <meta charset="utf-8">, viewport 메타 태그 포함.
2. style.css
   - 지금은 기본 리셋, 최대 너비 640px 가운데 정렬, 카테고리 색상 CSS 변수 3개(--work #3B82F6, --personal #10B981, --study #F59E0B)만 넣는다.
3. app.js
   - 9절의 상수만 정의한다: CATEGORIES(work/personal/study 각각의 한글 이름과 색상), STORAGE_KEY = "todos.v1", FILTER_KEY = "todos.filter".
   - 파일 마지막 줄: if (document.getElementById('app')) init();
   - init() 은 지금은 빈 함수로 둔다.
4. tests.html
   - app.js 를 불러온 뒤, 페이지 안에 test(name, fn) 와 assertEqual(actual, expected) 헬퍼를 직접 구현한다.
   - assertEqual 은 객체·배열도 비교할 수 있도록 JSON.stringify 로 비교한다.
   - 결과를 "✔ 이름" / "✘ 이름 — 기대값 vs 실제값" 목록과 "통과 N / 전체 M" 합계로 화면에 출력한다.
   - 첫 테스트로 CATEGORIES 에 work, personal, study 3개가 있는지 확인한다.

[제약]
- 순수 HTML/CSS/JavaScript만. 외부 라이브러리, 프레임워크, 빌드 도구, npm 패키지 금지.
- index.html 을 더블클릭(file://)했을 때 콘솔 오류 없이 열려야 한다.

[완료 조건]
- tests.html 을 브라우저로 열면 "통과 1 / 전체 1" 이 보인다. 직접 열어서 결과를 확인하고 출력 내용을 나에게 보여줘.
- index.html 을 열었을 때 콘솔 오류가 없다.

확인이 끝나면 "chore: 프로젝트 뼈대와 테스트 페이지 추가" 로 커밋해줘.
```

---

## 2단계. 상태 변경·계산 함수 (TDD)

```text
docs/superpowers/specs/2026-10-02-todo-app-prd.md 의 3절(기능 요구사항)과 9절(app.js 구조, 함수 계약)을 읽어줘.

이번 단계에서는 DOM 을 전혀 건드리지 않는 순수 함수 7개를 테스트 주도 개발(TDD)로 app.js 에 구현해줘.
superpowers:test-driven-development 스킬을 사용하고, 함수마다 "실패하는 테스트 작성 → tests.html 에서 실패 확인 → 최소 구현 → 통과 확인" 순서를 지켜줘.

[구현할 함수와 규칙]
1. addTodo(todos, title, category)
   - title.trim() 이 비었거나 100자를 넘으면 원래 배열을 그대로 반환.
   - category 가 work/personal/study 가 아니면 원래 배열 반환.
   - 새 항목: { id: Date.now() + "-" + 랜덤 4자, title: 공백 제거한 제목, category, completed: false, createdAt: new Date().toISOString() } 를 끝에 추가한 새 배열 반환.
2. updateTodo(todos, id, changes) — changes 는 { title?, category? }
   - title 이 공백뿐이면 제목은 바꾸지 않는다. 없는 id 면 원래 배열 반환.
3. toggleTodo(todos, id) — 해당 항목의 completed 를 반전.
4. deleteTodo(todos, id) — 해당 항목 제거.
5. clearCompleted(todos) — completed 가 true 인 항목만 제거.
6. getProgress(todos)
   - 반환: { overall: {done, total, percent}, byCategory: { work: {...}, personal: {...}, study: {...} } }
   - percent = total === 0 ? 0 : Math.round(done / total * 100)
7. getVisibleTodos(todos, filter)
   - filter 가 "all" 이면 전체, 아니면 해당 카테고리만.
   - 미완료가 먼저, 완료가 나중. 각 그룹 안에서는 createdAt 오름차순.

[공통 규칙]
- 모든 함수는 입력 배열과 항목 객체를 절대 변경하지 않고 새 배열/새 객체를 반환한다.
- 12절 표의 확인 내용을 모두 테스트로 만든다. 특히 "원본 배열 불변", "빈 제목·공백 제목·100자 초과", "0개일 때 0%", "반올림", "정렬 순서" 를 빠뜨리지 마.

[완료 조건]
- tests.html 의 모든 테스트가 통과한다. 통과/전체 숫자와 테스트 이름 목록을 보여줘.
- app.js 의 순수 함수 안에 document, window, localStorage 참조가 하나도 없다.

확인이 끝나면 "feat: 할 일 상태 변경·진행률 계산 함수 추가" 로 커밋해줘.
```

---

## 3단계. 저장소와 오류 처리

```text
docs/superpowers/specs/2026-10-02-todo-app-prd.md 의 10절(데이터와 저장)과 11절(오류 처리)을 읽어줘.

이번 단계에서는 localStorage 를 다루는 저장소 함수 4개를 TDD 로 app.js 에 추가해줘. superpowers:test-driven-development 스킬을 사용해.

[구현할 함수]
1. loadTodos()
   - STORAGE_KEY("todos.v1") 를 읽어 할 일 배열을 반환한다.
   - 값이 없거나 JSON 파싱에 실패하면 빈 배열 + console.warn.
   - 배열이 아니면 빈 배열.
   - 항목 검증: id·title 이 문자열, title.trim() 이 1–100자, category 가 work/personal/study, completed 가 boolean, createdAt 이 문자열. 하나라도 틀린 항목만 건너뛰고 나머지는 불러온다.
2. saveTodos(todos) — 배열 전체를 JSON 으로 저장.
3. loadFilter() — FILTER_KEY("todos.filter") 를 읽는다. "all"/"work"/"personal"/"study" 가 아니면 "all".
4. saveFilter(filter) — 필터 저장.

[저장소를 쓸 수 없을 때]
- localStorage 접근이 예외를 던지면(사생활 모드, 용량 초과) 앱이 멈추지 않아야 한다.
- 모듈 수준 변수 storageAvailable 을 두고, 예외가 나면 false 로 바꾼 뒤 로드 함수는 기본값을, 저장 함수는 아무것도 하지 않게 한다.
- isStorageAvailable() 함수로 이 값을 외부에 알려준다. 4단계에서 경고 배너 표시에 쓴다.

[테스트]
- 각 테스트 전후로 두 키를 지워 테스트끼리 서로 영향을 주지 않게 한다.
- 12절 "저장소" 행을 모두 다룬다: 저장 후 다시 읽기, 깨진 JSON → 빈 배열, 잘못된 항목만 건너뜀, 잘못된 필터 → "all".

[완료 조건]
- tests.html 의 모든 테스트(2단계 포함)가 통과한다. 결과를 보여줘.

확인이 끝나면 "feat: localStorage 저장소와 데이터 검증 추가" 로 커밋해줘.
```

---

## 4단계. 화면 렌더링과 이벤트 연결

```text
docs/superpowers/specs/2026-10-02-todo-app-prd.md 의 3절(F1–F8 수용 기준)과 4절(화면 요구사항)을 읽어줘.
2–3단계에서 만든 순수 함수와 저장소 함수는 이미 테스트가 끝났으니 시그니처를 바꾸지 말고 그대로 써.

이번 단계에서는 render(state) 와 init() 을 구현해서 앱이 실제로 동작하게 만들어줘.

[상태]
- state = { todos, filter, lastCategory, editingId }
- lastCategory 는 메모리에만 두고 새로고침 시 "work" 로 시작한다(F1).
- 모든 변경은 "순수 함수로 새 상태 계산 → saveTodos/saveFilter → render(state)" 한 가지 흐름만 쓴다.

[render(state)]
- 진행률: getProgress 결과로 전체 막대 + "완료 / 전체 완료 (퍼센트%)" 문구, 카테고리별 미니 막대 3개. 할 일이 0개면 "할 일을 추가해 보세요".
- 필터 탭: 현재 필터에 선택 표시(aria-selected).
- 목록: getVisibleTodos 결과. 항목 한 줄 = 체크박스 · 카테고리 배지 · 제목 · 수정(✎) · 삭제(🗑).
- 빈 상태: 전체가 비면 "할 일이 없습니다", 필터 결과만 비면 "이 카테고리에 할 일이 없습니다".
- "완료 항목 지우기" 버튼은 완료 항목이 없으면 disabled.
- isStorageAvailable() 이 false 면 상단에 "저장되지 않습니다. 새로고침하면 사라집니다" 배너.
- 사용자 입력(제목)은 반드시 textContent 로만 넣는다. innerHTML 에 사용자 데이터 사용 금지.

[init() — 이벤트 위임]
- F1 추가: Enter 또는 "추가" 버튼. 추가 후 입력창 비우고 포커스 유지. 입력창에 maxlength="100".
- F2 수정: 제목 더블클릭 또는 ✎ → 그 자리에 입력창 + 카테고리 드롭다운. Enter/포커스 이탈 시 저장, Esc 시 취소.
- F3 삭제: 🗑 → confirm("이 할 일을 삭제할까요?") 확인 시에만 삭제.
- F4 체크: 체크박스로 완료 전환.
- F5 필터: 탭 클릭 → saveFilter.
- F7 완료 항목 지우기: confirm 확인 후 clearCompleted.
- 시작 시 loadTodos/loadFilter 로 상태를 복원한다(F8).

[완료 조건]
- tests.html 의 모든 테스트가 여전히 통과한다.
- 브라우저에서 index.html 을 열어 F1–F8 을 수용 기준대로 하나씩 직접 조작해 확인하고, 항목별로 확인 결과를 표로 보고해줘.
- 제목에 <b>굵게</b> 를 입력하면 태그가 글자 그대로 보인다.

확인이 끝나면 "feat: 화면 렌더링과 사용자 조작 연결" 로 커밋해줘.
```

---

## 5단계. 스타일·반응형·접근성 마무리와 최종 검증

```text
docs/superpowers/specs/2026-10-02-todo-app-prd.md 의 4절(화면), 5절(비기능 요구사항), 6절(완료 기준), 12절(수동 확인 체크리스트)을 읽어줘.

이번 단계에서는 화면을 다듬고, 스펙의 완료 기준을 모두 검증해줘. 기능 로직은 바꾸지 마.

[스타일]
- 카테고리 배지와 미니 막대에 CSS 변수 색상(--work, --personal, --study)을 쓴다.
- 완료 항목은 취소선 + 흐린 색.
- 진행률 막대는 width 전환 애니메이션(0.2초 정도)만 가볍게 넣는다.

[반응형]
- 폭 480px 이하: 입력 영역을 두 줄(제목 / 카테고리+추가 버튼)로 나눈다.
- ✎·🗑 버튼은 hover 없이 항상 보이고, 터치 영역은 최소 40×40px.
- 375px 폭에서 가로 스크롤이 생기지 않는다.

[접근성]
- 체크박스, ✎, 🗑, 필터 탭에 aria-label 을 단다(예: "‘주간 보고서’ 완료 표시", "‘주간 보고서’ 삭제").
- 키보드만으로 추가(Enter)·체크(Space)·삭제(Tab → Enter)가 가능하다.
- 포커스 표시(:focus-visible)가 보인다.

[최종 검증] superpowers:verification-before-completion 스킬을 사용해서 아래를 모두 실제로 확인하고, 증거(테스트 출력, 확인 결과)와 함께 보고해줘.
1. index.html 을 더블클릭(file://)하면 서버 없이 실행된다.
2. F1–F8 이 수용 기준대로 동작한다.
3. 할 일 20개를 넣고 새로고침해도 목록·완료 상태·필터가 그대로다.
4. tests.html 의 테스트가 모두 통과한다.
5. 375px 폭에서 레이아웃이 깨지지 않는다.
6. 12절 수동 확인 체크리스트를 모두 통과한다.

실패한 항목이 있으면 고치지 말고 먼저 나에게 알려줘.

[마무리]
- README.md 의 "현재 단계"를 "구현 완료"로 바꾸고, "예정된 파일 구성"을 "파일 구성"으로, "실행 방법 (구현 후)"를 "실행 방법"으로 고친다.
- "style: 반응형·접근성 마무리 및 README 갱신" 으로 커밋하고 origin main 에 push 해줘.
```
