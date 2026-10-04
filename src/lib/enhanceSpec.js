// 스펙 문서의 우선순위 필터 · 도메인별 요구사항 수 집계.
// 원본 HTML의 <script>는 innerHTML로 넣으면 실행되지 않으므로 같은 동작을 여기서 붙인다.
export function enhanceSpec(root) {
  const rows = [...root.querySelectorAll('.req tr[data-p]')];
  const cnt = root.querySelector('#fcnt');
  const buttons = [...root.querySelectorAll('.filter button')];

  const apply = (filter) => {
    let shown = 0;
    rows.forEach((r) => {
      const on = filter === 'all' || r.dataset.p === filter;
      r.style.display = on ? '' : 'none';
      if (on) shown++;
    });
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === filter)));
    if (cnt) cnt.textContent = `${shown}건 표시`;
  };
  const handlers = buttons.map((b) => {
    const h = () => apply(b.dataset.f);
    b.addEventListener('click', h);
    return [b, h];
  });
  apply('all');

  const sum = root.querySelector('#sumTable');
  if (sum && !sum.dataset.done) {
    sum.dataset.done = '1';
    const total = { 0: 0, 1: 0, 2: 0, x: 0 };
    const row = (cells) => {
      const tr = document.createElement('tr');
      tr.innerHTML = cells.map((c) => `<td>${c}</td>`).join('');
      sum.appendChild(tr);
    };
    root.querySelectorAll('h3[id^="d-"]').forEach((h) => {
      let el = h.nextElementSibling;
      while (el && !el.classList.contains('req')) el = el.nextElementSibling;
      if (!el) return;
      const c = { 0: 0, 1: 0, 2: 0, x: 0 };
      el.querySelectorAll('tr[data-p]').forEach((r) => {
        c[r.dataset.p]++;
        total[r.dataset.p]++;
      });
      const name = h.textContent.replace(/^([A-Z]+)/, '$1 ');
      row([`<a href="#${h.id}">${name}</a>`, c[0], c[1], c[2], c.x, c[0] + c[1] + c[2] + c.x]);
    });
    const t = total;
    row(['<b>합계</b>', `<b>${t[0]}</b>`, `<b>${t[1]}</b>`, `<b>${t[2]}</b>`, `<b>${t.x}</b>`, `<b>${t[0] + t[1] + t[2] + t.x}</b>`]);
  }

  return () => handlers.forEach(([b, h]) => b.removeEventListener('click', h));
}
