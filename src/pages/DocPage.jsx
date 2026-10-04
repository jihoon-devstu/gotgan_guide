import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DOCS } from '../docs';
import { parseDoc } from '../lib/parseDoc';
import Toc from '../components/Toc';

const HEADER_OFFSET = 160; // 상단바 + 스펙 필터 바 + 여유 — 이 위치를 지난 제목을 "현재 위치"로 본다

export default function DocPage({ doc }) {
  const { html, toc } = useMemo(() => parseDoc(doc.raw), [doc]);
  const articleRef = useRef(null);
  const { hash } = useLocation();
  const [activeId, setActiveId] = useState(null);
  const [tocOpen, setTocOpen] = useState(false);

  const index = DOCS.indexOf(doc);
  const prev = DOCS[index - 1];
  const next = DOCS[index + 1];

  // 원본 스크립트 대체 (스펙의 우선순위 필터 등)
  useEffect(() => {
    if (!doc.enhance) return undefined;
    return doc.enhance(articleRef.current);
  }, [doc]);

  // 문서에 처음 들어올 때만 #앵커로 바로 이동 (없으면 맨 위).
  // 문서 안의 앵커 클릭은 브라우저가 부드럽게 스크롤하므로 여기서 다시 처리하지 않는다.
  const entryHash = useRef(hash);
  useEffect(() => {
    const target = entryHash.current && document.getElementById(decodeURIComponent(entryHash.current.slice(1)));
    if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [doc]);

  // 스크롤 위치에 따라 목차의 현재 항목 표시
  useEffect(() => {
    const ids = toc.filter((t) => t.type === 'link').map((t) => t.id);
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= HEADER_OFFSET) current = id;
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [toc]);

  const activeItem = toc.find((t) => t.id === activeId);

  return (
    <div className="doc-layout">
      <aside className={`sidebar${tocOpen ? ' open' : ''}`} aria-label={`${doc.name} 목차`}>
        <div className="sidebar-head">
          <span className="sidebar-q">{doc.question}</span>
          <b>{doc.name}</b>
          <button type="button" className="sidebar-close" onClick={() => setTocOpen(false)} aria-label="목차 닫기">
            닫기
          </button>
        </div>
        <Toc items={toc} activeId={activeId} onNavigate={() => setTocOpen(false)} />
      </aside>
      {tocOpen && <div className="sidebar-dim" onClick={() => setTocOpen(false)} aria-hidden="true" />}

      <div className="doc-main">
        <button type="button" className="toc-toggle" onClick={() => setTocOpen(true)}>
          <span>목차</span>
          <em>{activeItem ? `${activeItem.num} ${activeItem.label}`.trim() : doc.name}</em>
        </button>

        <article
          ref={articleRef}
          className={`doc ${doc.scope}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <nav className="doc-pager" aria-label="이전 · 다음 문서">
          {prev ? (
            <Link to={`/${prev.slug}`} className="pager-prev">
              <small>이전 문서</small>
              <b>{prev.name}</b>
            </Link>
          ) : (
            <Link to="/" className="pager-prev">
              <small>처음으로</small>
              <b>홈 · 파트별 보기</b>
            </Link>
          )}
          {next && (
            <Link to={`/${next.slug}`} className="pager-next">
              <small>다음 문서</small>
              <b>{next.name}</b>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
