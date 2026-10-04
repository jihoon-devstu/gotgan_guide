const KEY = 'gotgan-docs-theme';

export default function ThemeToggle() {
  const handleClick = () => {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const isDark = current ? current === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = isDark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // 저장소를 못 쓰는 환경이어도 이번 화면에는 적용된다
    }
  };

  return (
    <button type="button" className="theme-btn" onClick={handleClick} aria-label="밝은 · 어두운 테마 전환">
      테마
    </button>
  );
}
