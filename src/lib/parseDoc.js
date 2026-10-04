// 원본 HTML 문서에서 본문(main)과 목차(nav.toc)를 꺼낸다.
// 원본 파일은 그대로 두고 사이트가 읽기만 하므로, content/의 HTML을 고치면 사이트에 바로 반영된다.
export function parseDoc(raw) {
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  const toc = [];

  doc.querySelectorAll('nav.toc li').forEach((li) => {
    if (li.classList.contains('grp')) {
      toc.push({ type: 'group', label: li.textContent.trim() });
      return;
    }
    const a = li.querySelector('a');
    if (!a) return;
    const numEl = a.querySelector('.num');
    const num = numEl ? numEl.textContent.trim() : '';
    const label = [...a.childNodes]
      .filter((n) => n !== numEl)
      .map((n) => n.textContent)
      .join('')
      .trim();
    toc.push({
      type: 'link',
      id: a.getAttribute('href').slice(1),
      num,
      label,
      level: li.classList.contains('l2') ? 2 : 1,
    });
  });

  return { html: doc.querySelector('main').innerHTML, toc };
}
