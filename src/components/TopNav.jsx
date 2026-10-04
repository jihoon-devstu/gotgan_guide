import { Link, NavLink } from 'react-router-dom';
import { DOCS, MOCKUP_URL } from '../docs';
import ThemeToggle from './ThemeToggle';

export default function TopNav() {
  return (
    <header className="topbar">
      <Link to="/" className="brand" aria-label="홈">
        곳간 <span>GOTGAN</span>
        <small>프로젝트 문서</small>
      </Link>
      <nav className="topnav" aria-label="문서">
        <NavLink to="/" end>홈</NavLink>
        {DOCS.map((doc, i) => (
          <NavLink key={doc.slug} to={`/${doc.slug}`}>
            <span className="topnav-num">{String(i + 1).padStart(2, '0')}</span>
            {doc.name}
          </NavLink>
        ))}
      </nav>
      <div className="topbar-actions">
        <a className="ext" href={MOCKUP_URL} target="_blank" rel="noreferrer">
          목업 <span aria-hidden="true">↗</span>
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
