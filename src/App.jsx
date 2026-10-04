import { Routes, Route, Navigate } from 'react-router-dom';
import TopNav from './components/TopNav';
import HomePage from './pages/HomePage';
import DocPage from './pages/DocPage';
import { DOCS } from './docs';

export default function App() {
  return (
    <>
      <TopNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        {DOCS.map((doc) => (
          <Route key={doc.slug} path={`/${doc.slug}`} element={<DocPage key={doc.slug} doc={doc} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
