# outliner-poc

React + Vite 기반의 메모리 내 아웃라이너 편집 UI입니다.

```sh
npm install
npm run dev
```

- 항목을 클릭해 입력. Enter는 커서 위치에서 나누고 새 형제 항목을 만듭니다.
- Tab은 이전 형제 아래로 subtree를 들여쓰기, Shift+Tab은 부모 다음으로 subtree를 꺼냅니다.
- 삼각형은 하위 항목 접기/펼치기. 빈 항목에서 Backspace는 삭제하며 자식을 승격합니다.
- 여러 줄 붙여넣기는 같은 깊이의 항목으로 나눕니다.
- 항목 시작/끝의 방향키는 앞/뒤의 표시된 항목으로 이동합니다.
- 파일 저장/불러오기, 영속 저장, undo/redo, 노드 간 텍스트 선택은 포함하지 않습니다. 새로고침 시 초기화됩니다.

`npm test`로 트리 명령의 경계 사례를, `npm run build`로 배포 빌드를 확인합니다.

편집 모델은 `src/outline.js`, React UI는 `src/main.jsx`에 있습니다. 노드별 textarea를 사용하는 UI PoC입니다.
