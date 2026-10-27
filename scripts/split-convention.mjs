// 정본 project-convention.md → 세 저장소 docs/CONVENTION.md 발췌본 다시 만들기
// 발췌본의 머리말(첫 "## " 앞)은 그대로 두고, 발췌본에 있는 "## " 절을 정본의 같은 절로 바꾼다.
// - "## 6. 리뷰 체크리스트": 발췌본에 있던 **그룹**만 남긴다
// - 정본에 없는 절(config "## 2. 로그 (백엔드 2-8 발췌)"): 안의 "### " 소절을 정본 소절로 바꾼다
import fs from 'node:fs';
const [canonPath, ...targets] = process.argv.slice(2);
const canon = fs.readFileSync(canonPath, 'utf8').replace(/\r\n/g, '\n');
const split = (s, lvl) => {
  const re = new RegExp('^' + '#'.repeat(lvl) + ' .*$', 'gm');
  const idx = [...s.matchAll(re)].map((m) => m.index);
  return { head: s.slice(0, idx[0] ?? s.length), parts: idx.map((st, i) => s.slice(st, idx[i + 1] ?? s.length)) };
};
const title = (b) => b.split('\n')[0];
const SEP = /(\n+(---\n*)*)$/;
const canonH2 = Object.fromEntries(split(canon, 2).parts.map((b) => [title(b), b]));
const canonH3 = Object.fromEntries(split(canon, 3).parts.map((b) => [title(b), b.split(/\n(?=## )/)[0]]));
const groups = (b) => {
  const m = [...b.matchAll(/^\*\*(.+?)\*\*\s*$/gm)];
  return m.map((x, i) => [x[1], b.slice(x.index, m[i + 1]?.index ?? b.length)]);
};
for (const t of targets) {
  const src = fs.readFileSync(t, 'utf8');
  const crlf = src.includes('\r\n');
  const s = src.replace(/\r\n/g, '\n');
  const { head, parts } = split(s, 2);
  const out = parts.map((b) => {
    const h = title(b);
    const c = canonH2[h];
    if (h.startsWith('## 6. 리뷰 체크리스트') && c) {
      const keep = new Set(groups(b).map(([g]) => g));
      const cg = groups(c);
      const pre = c.slice(0, cg[0]?.[1] ? c.indexOf(cg[0][1]) : c.length);
      const tail = cg.filter(([g]) => keep.has(g)).map(([, x]) => x).join('');
      return (pre + tail).replace(/\n*$/, '\n\n');
    }
    // 절 끝의 구분선 · 빈 줄은 발췌본 모양 그대로
    if (c) return c.replace(SEP, '') + (b.match(SEP)?.[0] ?? '\n');
    const { head: h3head, parts: subs } = split(b, 3);
    return h3head + subs.map((x) => (canonH3[title(x)] ? canonH3[title(x)].replace(SEP, '') + (x.match(SEP)?.[0] ?? '\n') : x)).join('');
  });
  let res = head + out.join('');
  if (!res.endsWith('\n')) res += '\n';
  fs.writeFileSync(t, crlf ? res.replace(/\n/g, '\r\n') : res);
  console.log('updated', t);
}
