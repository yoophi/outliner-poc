import React, { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { branchEnd, indentNode, outdentNode, removeEmptyNode, splitNode, visibleNodes } from './outline';
import './style.css';

const initialNodes = [
  { text: '작은 생각에서, 다음 가지로.', depth: 0 },
  { text: '떠오르는 생각을 한 줄씩 적어보세요.', depth: 1 },
  { text: 'Enter로 다음 항목을 만들고', depth: 2 },
  { text: 'Tab으로 이전 항목 아래에 놓습니다.', depth: 2 },
  { text: '구조를 바꾸며 생각 정리하기', depth: 0 },
  { text: 'Shift + Tab으로 한 단계 꺼내기', depth: 1 },
  { text: '삼각형을 눌러 하위 항목 접기', depth: 1 },
  { text: '접어도 안쪽의 생각은 그대로 남아요.', depth: 2 },
  { text: '여기서부터 새로 시작해도 좋아요.', depth: 0 },
].map((node, i) => ({ ...node, id: `initial-${i}`, collapsed: false }));

function OutlineRow({ node, hasChildren, childCount, active, register, onChange, onKeyDown, onFocus, onToggle, onPaste }) {
  const input = useRef(null);
  useLayoutEffect(() => {
    const element = input.current;
    const resize = () => {
      element.style.height = '0px';
      element.style.height = `${element.scrollHeight}px`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [node.text]);

  return <div className={`outline-row ${active ? 'is-active' : ''}`} style={{ '--depth': node.depth }}>
    <div className="node-gutter">
      {hasChildren ? <button className={`fold-toggle ${node.collapsed ? 'is-folded' : ''}`}
        aria-label={`${node.text || '빈 항목'} 하위 항목 ${node.collapsed ? '펼치기' : '접기'}`}
        aria-expanded={!node.collapsed} onClick={() => onToggle(node.id)}>
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="m3 4 3 4 3-4" /></svg>
      </button> : <span className="node-dot" aria-hidden="true" />}
    </div>
    <textarea ref={element => { input.current = element; register(node.id, element); }}
      aria-label={`깊이 ${node.depth + 1} 항목`} rows={1} spellCheck={false}
      placeholder="생각을 적어보세요…" value={node.text}
      onChange={event => onChange(node.id, event.target.value)}
      onKeyDown={event => onKeyDown(event, node.id)}
      onFocus={() => onFocus(node.id)} onPaste={event => onPaste(event, node.id)} />
    {hasChildren && node.collapsed && <button className="fold-count" onClick={() => onToggle(node.id)}
      aria-label={`${childCount}개 하위 항목 펼치기`}>{childCount}</button>}
  </div>;
}

function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [activeId, setActiveId] = useState(null);
  const inputs = useRef(new Map());
  const pendingFocus = useRef(null);
  const visible = visibleNodes(nodes);

  useLayoutEffect(() => {
    if (!pendingFocus.current) return;
    const { id, offset } = pendingFocus.current;
    const input = inputs.current.get(id);
    if (input) {
      input.focus();
      const position = offset === 'end' ? input.value.length : offset;
      input.setSelectionRange(position, position);
    }
    pendingFocus.current = null;
  }, [nodes]);

  function focusNext(id, offset = 0) { pendingFocus.current = { id, offset }; }

  function handleKeyDown(event, id) {
    if ((event.metaKey || event.ctrlKey) && ['z', 'y'].includes(event.key.toLowerCase())) {
      event.preventDefault();
      return;
    }
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const input = event.currentTarget;
    if (event.key === 'Enter') {
      event.preventDefault();
      const newId = crypto.randomUUID();
      focusNext(newId);
      setNodes(splitNode(nodes, id, input.selectionStart, input.selectionEnd, newId));
    } else if (event.key === 'Tab') {
      event.preventDefault();
      focusNext(id, input.selectionStart);
      const next = event.shiftKey ? outdentNode(nodes, id) : indentNode(nodes, id);
      if (next !== nodes) setNodes(next);
      else pendingFocus.current = null;
    } else if (event.key === 'Backspace' && input.value === '') {
      const index = visible.findIndex(node => node.id === id);
      const next = removeEmptyNode(nodes, id);
      if (next !== nodes) {
        event.preventDefault();
        const target = visible[index - 1] || visible[index + 1];
        focusNext(target.id, 'end');
        setNodes(next);
      }
    } else if (input.selectionStart === input.selectionEnd) {
      const index = visible.findIndex(node => node.id === id);
      const atStart = input.selectionStart === 0;
      const atEnd = input.selectionEnd === input.value.length;
      const previous = ['ArrowUp', 'ArrowLeft'].includes(event.key) && atStart;
      const following = ['ArrowDown', 'ArrowRight'].includes(event.key) && atEnd;
      const target = previous ? visible[index - 1] : following ? visible[index + 1] : null;
      if (target && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        const element = inputs.current.get(target.id);
        element.focus();
        const position = previous ? element.value.length : 0;
        element.setSelectionRange(position, position);
      }
    }
  }

  function handlePaste(event, id) {
    const text = event.clipboardData.getData('text/plain').replace(/\r\n?/g, '\n');
    if (!text.includes('\n')) return;
    event.preventDefault();
    const index = nodes.findIndex(node => node.id === id);
    const input = event.currentTarget;
    const lines = text.split('\n');
    const next = [...nodes];
    const rest = nodes[index].text.slice(input.selectionEnd);
    next[index] = { ...nodes[index], text: nodes[index].text.slice(0, input.selectionStart) + lines[0] };
    const added = lines.slice(1).map((line, i) => ({ id: crypto.randomUUID(),
      depth: nodes[index].depth, collapsed: false, text: line + (i === lines.length - 2 ? rest : '') }));
    next.splice(branchEnd(nodes, index), 0, ...added);
    focusNext(added.at(-1).id, lines.at(-1).length);
    setNodes(next);
  }

  return <div className="workspace">
    <header className="app-header">
      <a className="wordmark" href="#" aria-label="가지 아웃라이너">가지<span className="brand-mark">↳</span></a>
      <span className="edition">OUTLINE STUDY / 001</span>
      <span className="session-indicator"><i /> 이번 세션</span>
    </header>
    <main>
      <div className="document-heading">
        <span className="eyebrow">A PLACE FOR YOUR THOUGHTS</span>
        <h1>생각의 가지</h1>
        <p>한 줄을 적고, 연결하고, 접어보세요.</p>
      </div>
      <section className="editor" aria-label="아웃라이너 편집기">
        {visible.map(node => {
          const index = nodes.findIndex(item => item.id === node.id);
          const childCount = branchEnd(nodes, index) - index - 1;
          return <OutlineRow key={node.id} node={node} active={activeId === node.id}
            hasChildren={childCount > 0} childCount={childCount}
            register={(id, element) => element ? inputs.current.set(id, element) : inputs.current.delete(id)}
            onFocus={setActiveId} onChange={(id, text) => setNodes(previous => previous.map(item => item.id === id ? { ...item, text } : item))}
            onKeyDown={handleKeyDown} onPaste={handlePaste}
            onToggle={id => setNodes(previous => previous.map(item => item.id === id ? { ...item, collapsed: !item.collapsed } : item))} />;
        })}
        <button className="add-item" onClick={() => {
          const id = crypto.randomUUID();
          focusNext(id);
          setNodes([...nodes, { id, text: '', depth: 0, collapsed: false }]);
        }}><span>＋</span> 새 가지</button>
      </section>
      <footer className="editor-footer">
        <span>{nodes.length}개 항목<span className="count-divider">/</span>{visible.length}개 표시</span>
        <span>새로고침하면 초기화됩니다.</span>
      </footer>
    </main>
    <aside className="keyboard-guide" aria-label="키보드 사용법">
      <span><kbd>Enter</kbd> 새 항목</span>
      <span><kbd>Tab</kbd> 들여쓰기</span>
      <span><kbd>Shift</kbd><kbd>Tab</kbd> 내어쓰기</span>
      <span><kbd>⌫</kbd> 빈 항목 삭제</span>
    </aside>
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
