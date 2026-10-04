import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DOCS, PARTS, MOCKUP_URL, MOCKUP_AREAS, mockupUrl } from '../docs';

const PART_KEY = 'gotgan-docs-part';

export default function HomePage() {
  const [partKey, setPartKey] = useState(() => {
    try {
      return localStorage.getItem(PART_KEY) || PARTS[0].key;
    } catch {
      return PARTS[0].key;
    }
  });
  const part = PARTS.find((p) => p.key === partKey) || PARTS[0];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePartClick = (key) => {
    setPartKey(key);
    try {
      localStorage.setItem(PART_KEY, key);
    } catch {
      // 선택 기억은 편의 기능이므로 실패해도 무시
    }
  };

  // 선택한 파트의 링크를 문서별로 묶는다
  const grouped = DOCS.map((doc) => ({
    doc,
    links: part.links.filter(([slug]) => slug === doc.slug),
  })).filter((g) => g.links.length > 0);

  return (
    <main className="home">
      <section className="home-hero">
        <div className="kicker">GOTGAN · PROJECT DOCS</div>
        <h1>곳간 프로젝트 문서</h1>
        <p>스마트스토어형 멀티 스토어 오픈마켓 · MSA · AWS EKS · 4인 6주</p>
        <ul className="hero-facts">
          <li><b>서비스</b>게이트웨이 + 업무 5개</li>
          <li><b>백엔드</b>Java 21 · Spring Boot 4.1</li>
          <li><b>프론트</b>React · TanStack · Vercel</li>
          <li><b>인프라</b>Terraform · EKS · ArgoCD</li>
        </ul>
      </section>

      <section className="home-block">
        <h2>문서</h2>
        <p className="home-lead">왼쪽부터 순서대로 읽으면 결정 이유 → 만들 것 → 지킬 규칙 순서가 됩니다.</p>
        <div className="doc-cards">
          {DOCS.map((doc, i) => (
            <Link key={doc.slug} to={`/${doc.slug}`} className="doc-card">
              <span className="doc-card-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="doc-card-q">{doc.question}</span>
              <b className="doc-card-name">{doc.name}</b>
              <span className="doc-card-sum">{doc.summary}</span>
              <ul>
                {doc.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <span className="doc-card-go">열기 →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-block">
        <div className="mockup-banner">
          <div className="mockup-banner-text">
            <span className="mockup-tag">MOCKUP</span>
            <b>목업 화면 43개</b>
            <span>배포된 화면 목업 — 요구사항 · 화면 구현의 기준</span>
          </div>
          <a className="mockup-open" href={MOCKUP_URL} target="_blank" rel="noreferrer">
            목업 열기 <span aria-hidden="true">↗</span>
          </a>
        </div>
        <ul className="mockup-areas">
          {MOCKUP_AREAS.map((area) => (
            <li key={area.name}>
              <a href={mockupUrl(area.path)} target="_blank" rel="noreferrer">
                <span className="mockup-who">{area.who}</span>
                <b>{area.name} <span aria-hidden="true">↗</span></b>
                <code>{area.path}</code>
                <span className="mockup-desc">{area.desc}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="home-lead">화면 왼쪽 아래 <b>MOCK 화면 목록</b> 버튼으로 43개 화면 어디로든 이동할 수 있습니다. 데이터는 하드코딩이며 새로고침하면 초기화됩니다.</p>
      </section>

      <section className="home-block">
        <h2>파트별로 보기</h2>
        <p className="home-lead">맡은 파트를 고르면 세 문서에서 봐야 할 장만 모아 보여 줍니다.</p>
        <div className="part-tabs" role="tablist" aria-label="파트">
          {PARTS.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={p.key === part.key}
              onClick={() => handlePartClick(p.key)}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="part-panel" role="tabpanel">
          <div className="part-head">
            <b>{part.name}</b>
            <span>{part.desc}</span>
          </div>
          {grouped.map(({ doc, links }) => (
            <div key={doc.slug} className="part-group">
              <div className="part-doc">
                <span>{doc.question}</span>
                {doc.name}
              </div>
              <ul className="part-links">
                {links.map(([slug, id, num, title, desc]) => (
                  <li key={`${slug}-${id}`}>
                    <Link to={`/${slug}#${id}`}>
                      <span className="part-num">{num}</span>
                      <span className="part-title">{title}</span>
                      <span className="part-desc">{desc}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {part.mockup && (
            <div className="part-group">
              <div className="part-doc">
                <span>화면</span>
                목업
              </div>
              <ul className="part-links">
                {MOCKUP_AREAS.map((area) => (
                  <li key={area.name}>
                    <a href={mockupUrl(area.path)} target="_blank" rel="noreferrer">
                      <span className="part-num">↗</span>
                      <span className="part-title">{area.name}</span>
                      <span className="part-desc">{area.desc}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="home-block">
        <h2>회의 전에 볼 것</h2>
        <ul className="quick">
          <li><Link to="/convention#c0-3"><b>컨벤션 0-3</b>스펙과 달라지는 8가지 — 결정 칸이 있는 회의록용 표</Link></li>
          <li><Link to="/guideline#s3"><b>가이드라인 03</b>업무 분장 판단 자료 — 숙련도 · 난이도 · 참고안</Link></li>
          <li><Link to="/guideline#s15"><b>가이드라인 18</b>팀 회의 안건 — 결정할 것과 추천 기본값</Link></li>
          <li><Link to="/spec#s5"><b>스펙 06</b>P0 완료 기준 — 4주차까지 완주할 E2E 시나리오</Link></li>
        </ul>
      </section>

      <footer className="home-foot">
        <span>목업 화면 43개는 <a href={MOCKUP_URL} target="_blank" rel="noreferrer">mockup-page-sable.vercel.app ↗</a></span>
        <span>문서 원본은 저장소 <code>content/</code> — 수정 후 main에 push하면 자동 배포</span>
        <span>컨벤션 MD를 고쳤다면 <code>npm run convention</code>으로 HTML 재생성</span>
      </footer>
    </main>
  );
}
