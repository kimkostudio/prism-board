(() => {
  const T = window.TEAM || { people: [] };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (u) => (/^https:\/\//.test(u || '') ? u : '');

  const cta = document.getElementById('sheet-cta');
  const sheet = safeUrl(T.sheetUrl);
  if (sheet) cta.href = sheet;
  else { cta.removeAttribute('href'); cta.style.opacity = '.4'; cta.firstChild.textContent = '전달 시트 준비 중 '; }

  document.getElementById('people').innerHTML = (T.people || []).map((p) => {
    const url = safeUrl(p.driveFolder);
    return `<div class="person">
      <span class="av" style="--c:${esc(p.color)}">${esc(p.name.slice(-2))}</span>
      <span class="who"><b>${esc(p.name)}</b><code>${esc(p.id)}</code></span>
      ${url ? `<a class="go" href="${esc(url)}" target="_blank" rel="noopener">폴더 열기 ↗</a>` : '<span class="go">폴더 준비 중</span>'}
    </div>`;
  }).join('');
})();
