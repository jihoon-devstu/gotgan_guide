// project-convention.md → project-convention.html (project-spec.html과 같은 스타일)
import { readFileSync, writeFileSync } from 'node:fs';

const [, , src, out] = process.argv;
const lines = readFileSync(src, 'utf8').replace(/\r\n/g, '\n').split('\n');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(s) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
}

let html = '', title = '', kicker = [], toc = [], i = 0, h2n = 0, h3n = 0;
const isTable = (l) => /^\|.*\|$/.test(l.trim());
const isList = (l) => /^(\s*)([-*]|\d+\.)\s+/.test(l);

while (i < lines.length) {
  const l = lines[i];
  if (!l.trim() || l.trim() === '---') { i++; continue; }

  if (l.startsWith('# ')) { title = inline(l.slice(2)); i++; continue; }
  if (l.startsWith('> ')) {
    const buf = [];
    while (i < lines.length && lines[i].startsWith('>')) buf.push(inline(lines[i].replace(/^>\s?/, ''))), i++;
    if (!html) kicker = buf; else html += `<div class="note">${buf.join('<br>')}</div>\n`;
    continue;
  }
  let m;
  if ((m = l.match(/^## (\d+)\. (.+)/))) {
    h2n++; h3n = 0;
    const id = `c${m[1]}`;
    toc.push({ lv: 2, id, num: m[1].padStart(2, '0'), text: m[2] });
    html += `${h2n > 1 ? '</section>\n' : ''}<section id="${id}">\n<h2><span class="n">${m[1].padStart(2, '0')}</span>${inline(m[2])}</h2>\n`;
    i++; continue;
  }
  if ((m = l.match(/^### ([\d-]+)\. (.+)/))) {
    const id = `c${m[1]}`;
    toc.push({ lv: 3, id, num: m[1], text: m[2] });
    html += `<h3 id="${id}"><span class="n">${m[1]}</span>${inline(m[2])}</h3>\n`;
    i++; continue;
  }
  if (l.startsWith('```')) {
    const buf = []; i++;
    while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i]), i++;
    i++;
    html += `<pre><code>${esc(buf.join('\n'))}</code></pre>\n`;
    continue;
  }
  if (isTable(l)) {
    const rows = [];
    while (i < lines.length && isTable(lines[i])) rows.push(lines[i].trim()), i++;
    const cells = (r) => r.slice(1, -1).split(/(?<!\\)\|/).map((c) => inline(c.trim()));
    let t = '<div class="tbl"><table>\n<tr>' + cells(rows[0]).map((c) => `<th>${c}</th>`).join('') + '</tr>\n';
    for (const r of rows.slice(2)) t += '<tr>' + cells(r).map((c) => `<td>${c}</td>`).join('') + '</tr>\n';
    html += t + '</table></div>\n';
    continue;
  }
  if (isList(l)) {
    // 들여쓰기 2칸 = 한 단계
    const stack = [];
    let out = '';
    while (i < lines.length && (isList(lines[i]) || (lines[i].startsWith('  ') && lines[i].trim() && stack.length))) {
      const lm = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
      if (!lm) { out += ' ' + inline(lines[i].trim()); i++; continue; }
      const depth = Math.floor(lm[1].length / 2);
      const tag = /\d/.test(lm[2]) ? 'ol' : 'ul';
      while (stack.length > depth + 1) out += `</li></${stack.pop()}>`;
      if (stack.length === depth + 1 && stack[depth] !== tag) out += `</li></${stack.pop()}>`;
      if (stack.length < depth + 1) { out += `<${tag} class="b">`; stack.push(tag); }
      else out += '</li>';
      let text = lm[3];
      const chk = text.match(/^\[ \]\s+(.*)/);
      out += chk ? `<li class="chk">${inline(chk[1])}` : `<li>${inline(text)}`;
      i++;
    }
    while (stack.length) out += `</li></${stack.pop()}>`;
    html += out + '\n';
    continue;
  }
  // 문단 (한 줄 전체가 굵은 글씨면 소제목)
  const buf = [];
  while (i < lines.length && lines[i].trim() && !isTable(lines[i]) && !isList(lines[i]) && !lines[i].startsWith('```') && !lines[i].startsWith('#') && !lines[i].startsWith('>')) buf.push(lines[i]), i++;
  const p = buf.join(' ');
  html += /^\*\*[^*]+\*\*$/.test(p.trim()) ? `<h4>${inline(p.trim().slice(2, -2))}</h4>\n` : `<p>${inline(p)}</p>\n`;
}
html += '</section>\n';

const tocHtml = toc.map((t) => t.lv === 2
  ? `<li><a href="#${t.id}"><span class="num">${t.num}</span>${inline(t.text)}</a></li>`
  : `<li class="l2"><a href="#${t.id}">${t.num} ${inline(t.text)}</a></li>`).join('\n    ');

const tpl = readFileSync(new URL('./conv-template.html', import.meta.url), 'utf8');
writeFileSync(out, tpl
  .replace('{{TITLE}}', title)
  .replace('{{KICKER}}', kicker.map((k) => `<div>${k}</div>`).join(''))
  .replace('{{TOC}}', tocHtml)
  .replace('{{BODY}}', html));
console.log('ok', toc.length, 'headings');
