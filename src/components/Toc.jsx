import { useEffect, useRef } from 'react';

export default function Toc({ items, activeId, onNavigate }) {
  const listRef = useRef(null);

  // 현재 항목이 목차 영역 밖이면 목차만 스크롤 (본문은 건드리지 않음)
  useEffect(() => {
    const list = listRef.current?.closest('.sidebar');
    const active = listRef.current?.querySelector('[aria-current="location"]');
    if (!list || !active) return;
    const top = active.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    if (top < list.scrollTop + 60 || top > list.scrollTop + list.clientHeight - 60) {
      list.scrollTop = top - list.clientHeight / 3;
    }
  }, [activeId]);

  return (
    <ol className="toc" ref={listRef}>
      {items.map((item, i) =>
        item.type === 'group' ? (
          <li key={`g${i}`} className="toc-group">{item.label}</li>
        ) : (
          <li key={item.id} className={item.level === 2 ? 'toc-l2' : 'toc-l1'}>
            <a
              href={`#${item.id}`}
              aria-current={item.id === activeId ? 'location' : undefined}
              onClick={onNavigate}
            >
              {item.num && <span className="toc-num">{item.num}</span>}
              {item.label}
            </a>
          </li>
        ),
      )}
    </ol>
  );
}
