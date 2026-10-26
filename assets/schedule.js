(() => {
  const S = window.SCHEDULE || { milestones: [], assignments: [], range: {} };
  const T = window.TEAM || { people: [] };
  const DAY = 864e5;
  const DW = 26;          // 타임라인 하루 폭(px)
  const LH = 28;          // 타임라인 줄 높이(px)
  const LW = window.matchMedia('(max-width: 640px)').matches ? 92 : 132; // 이름 칸 폭

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const diff = (a, b) => Math.round((b - a) / DAY);
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const md = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  const mdw = (d) => `${md(d)} (${WD[d.getDay()]})`;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const KIND = {
    meeting: { label: '미팅', c: 'var(--k-meeting)' },
    review: { label: '제출·시사', c: 'var(--k-review)' },
    feedback: { label: '클라이언트 FB', c: 'var(--k-feedback)' },
    qc: { label: '화질검수', c: 'var(--k-qc)' },
    delivery: { label: '납품', c: 'var(--k-delivery)' },
    internal: { label: '내부', c: 'var(--k-internal)' },
    work: { label: '작업' },
    off: { label: '휴무·불가' },
    hold: { label: '홀드' },
  };
  const STATUS = { confirmed: '확정', tentative: '미확정', done: '완료' };
  const people = T.people || [];
  const P = Object.fromEntries(people.map((p) => [p.id, p]));

  const items = [
    ...(S.milestones || []).map((m, i) => ({ ...m, id: 'm' + i, type: 'ms', s: parse(m.date), e: parse(m.end || m.date) })),
    ...(S.assignments || []).map((a, i) => ({ ...a, id: 'a' + i, type: 'as', s: parse(a.start), e: parse(a.end || a.start) })),
  ].sort((a, b) => a.s - b.s || (a.type === 'ms' ? -1 : 1) - (b.type === 'ms' ? -1 : 1));
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  const store = {
    get(k, d) { try { const v = localStorage.getItem('prism.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('prism.' + k, JSON.stringify(v)); } catch { /* 저장 불가 환경 */ } },
  };
  const state = {
    view: store.get('view', 'timeline'),
    people: new Set(store.get('people', []).filter((id) => P[id])),
    ms: store.get('ms', true),
    month: null,
    sel: iso(today),
  };

  const colorOf = (it) => (it.type === 'ms' ? (KIND[it.kind] || KIND.internal).c : (P[it.person]?.color || 'var(--k-internal)'));
  const isTent = (it) => it.status === 'tentative';
  const isPast = (it) => it.status === 'done' || it.e < today;
  const visible = (it) => (it.type === 'ms' ? state.ms : state.people.size === 0 || state.people.has(it.person));
  const kindLabel = (it) => (KIND[it.kind] || { label: it.kind || '' }).label;
  const range = (it) => (+it.s === +it.e ? mdw(it.s) : `${mdw(it.s)} – ${mdw(it.e)}`);
  const dday = (it) => {
    if (it.status === 'done') return '완료';
    if (it.e < today) return '지남';
    if (it.s <= today) return +it.s === +it.e ? '오늘' : '진행 중';
    return 'D-' + diff(today, it.s);
  };
  const textW = (s) => [...String(s)].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? 12.2 : 7), 0);

  /* ---------- 상단 ---------- */
  $('#updated').textContent = `최종 갱신 ${S.updated ? md(parse(S.updated)) : '-'}`;

  function renderUpcoming() {
    const up = items.filter((i) => i.type === 'ms' && i.e >= today).slice(0, 4);
    $('#upcoming').innerHTML = up.length
      ? up.map((it, n) => `
        <button class="up${n === 0 ? ' first' : ''}" data-id="${it.id}">
          <span class="k"><i class="dot dia" style="--c:${colorOf(it)}"></i>${esc(kindLabel(it))}${isTent(it) ? ' · 미확정' : ''}</span>
          <span class="d">${dday(it)}</span>
          <span class="when">${range(it)}</span>
          <span class="t">${esc(it.title)}</span>
        </button>`).join('')
      : '<div class="up-empty">남은 일정이 없습니다.</div>';
  }

  /* ---------- 툴바 ---------- */
  function renderToolbar() {
    document.querySelectorAll('.seg button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === state.view)));
    $('#filters').innerHTML = `
      <button class="chip ghost" data-ms aria-pressed="${state.ms}"><i class="dot dia" style="--c:var(--ink-3)"></i>마일스톤</button>
      <span class="sep" aria-hidden="true"></span>
      <button class="chip" data-person="" aria-pressed="${state.people.size === 0}">전체</button>
      ${people.map((p) => `<button class="chip" data-person="${p.id}" aria-pressed="${state.people.has(p.id)}"><i class="dot" style="--c:${p.color}"></i>${esc(p.name)}</button>`).join('')}`;
  }

  /* ---------- 타임라인 ---------- */
  function pack(list, idx) {
    const ends = [];
    for (const it of list) {
      const x0 = Math.max(0, idx(it.s)) * DW;
      const x1 = (idx(it.e) + 1) * DW;
      const single = +it.s === +it.e && it.type === 'ms';
      const tw = textW(it.title);
      it._x0 = x0; it._x1 = x1; it._single = single;
      it._in = !single && x1 - x0 >= tw + 16;
      const ext = it._in ? x1 : x1 + tw + 8;
      let lane = ends.findIndex((e) => e + 6 <= x0);
      if (lane < 0) { lane = ends.length; ends.push(0); }
      ends[lane] = ext; it._lane = lane;
    }
    return Math.max(1, ends.length);
  }

  function itemHTML(it) {
    const cls = ['tl-it', it._in ? 'in' : '', isTent(it) ? 'tent' : '', it.kind === 'off' ? 'off' : '', isPast(it) ? 'past' : ''].join(' ');
    const top = it._lane * LH + 7;
    const label = `<span class="lbl">${esc(it.title)}</span>`;
    const tip = esc(`${it.title} · ${range(it)}`);
    if (it._single) {
      return `<button class="${cls}" data-id="${it.id}" title="${tip}" style="left:${it._x0}px;top:${top}px;--c:${colorOf(it)};--dw:${DW}px"><i class="dia"></i>${label}</button>`;
    }
    return `<button class="${cls}" data-id="${it.id}" title="${tip}" style="left:${it._x0}px;top:${top}px;--c:${colorOf(it)}"><i class="bar" style="width:${it._x1 - it._x0}px"></i>${label}</button>`;
  }

  function renderTimeline(el) {
    const start = parse(S.range.start), end = parse(S.range.end);
    const n = diff(start, end) + 1, W = n * DW;
    const idx = (d) => diff(start, d);
    const inRange = (it) => it.e >= start && it.s <= end;

    let months = '', days = '', cols = '';
    for (let i = 0; i < n;) {
      const d0 = addDays(start, i); let j = i;
      while (j < n && addDays(start, j).getMonth() === d0.getMonth()) j++;
      const label = (i === 0 || d0.getMonth() === 0) ? `${d0.getFullYear()}년 ${d0.getMonth() + 1}월` : `${d0.getMonth() + 1}월`;
      months += `<div class="tl-month" style="left:${i * DW}px;width:${(j - i) * DW}px"><span>${label}</span></div>`;
      i = j;
    }
    for (let i = 0; i < n; i++) {
      const d = addDays(start, i), w = d.getDay();
      const cls = ['tl-day', w === 0 || w === 6 ? 'we' : '', w === 1 ? 'mon' : '', +d === +today ? 'today' : ''].join(' ');
      days += `<div class="${cls}" style="width:${DW}px"><b>${d.getDate()}</b>${WD[w]}</div>`;
      if (w === 0 || w === 6) cols += `<i class="we" style="left:${i * DW}px;width:${DW}px"></i>`;
      if (w === 1) cols += `<i class="wk" style="left:${i * DW}px"></i>`;
    }
    const ti = idx(today);
    if (ti >= 0 && ti < n) cols += `<i class="now" style="left:${ti * DW + DW / 2 - 1}px"></i>`;

    const rows = [];
    if (state.ms) {
      const list = items.filter((i) => i.type === 'ms' && inRange(i));
      rows.push({ cls: 'ms', label: `<span class="n">마일스톤</span><span class="c">${list.length}건</span>`, list });
    }
    for (const p of people) {
      if (state.people.size && !state.people.has(p.id)) continue;
      const list = items.filter((i) => i.type === 'as' && i.person === p.id && inRange(i));
      rows.push({ cls: '', label: `<span class="n"><i class="dot" style="--c:${p.color}"></i>${esc(p.name)}</span><span class="c">${list.length ? list.length + '건' : '배정 전'}</span>`, list, empty: !list.length });
    }

    const body = rows.map((r) => {
      const lanes = pack(r.list, idx);
      const h = lanes * LH + 14;
      const emptyX = Math.max(0, Math.min(n - 1, ti)) * DW + 10;
      return `<div class="tl-row ${r.cls}">
        <div class="tl-label" style="--lw:${LW}px">${r.label}</div>
        <div class="tl-track" style="width:${W}px;height:${h}px">
          ${r.list.map(itemHTML).join('')}
          ${r.empty ? `<span class="tl-empty" style="left:${emptyX}px">배정 전 — 콘티 확정 후 입력</span>` : ''}
        </div></div>`;
    }).join('');

    el.innerHTML = `<div class="panel"><div class="tl" id="tl"><div class="tl-inner" style="width:${W + LW}px;--lw:${LW}px">
      <div class="tl-head">
        <div class="tl-row"><div class="tl-label" style="height:60px">날짜</div>
          <div style="width:${W}px"><div class="tl-months">${months}</div><div class="tl-days">${days}</div></div></div>
      </div>
      <div style="position:relative">
        <div class="tl-cols" style="left:${LW}px;width:${W}px">${cols}</div>
        ${body || '<div class="empty">표시할 항목이 없습니다.</div>'}
      </div>
    </div></div></div>`;

    const tl = $('#tl');
    if (ti > 0) tl.scrollLeft = Math.max(0, (ti - 4) * DW);
  }

  /* ---------- 월간 ---------- */
  function renderMonth(el) {
    const start = parse(S.range.start), end = parse(S.range.end);
    if (!state.month) {
      const base = today < start ? start : today > end ? end : today;
      state.month = { y: base.getFullYear(), m: base.getMonth() };
    }
    const { y, m } = state.month;
    const first = new Date(y, m, 1);
    const offset = (first.getDay() + 6) % 7;
    const nd = new Date(y, m + 1, 0).getDate();
    const cells = Math.ceil((offset + nd) / 7) * 7;
    const canPrev = new Date(y, m, 1) > new Date(start.getFullYear(), start.getMonth(), 1);
    const canNext = new Date(y, m, 1) < new Date(end.getFullYear(), end.getMonth(), 1);
    const vis = items.filter(visible);
    const on = (d) => vis.filter((it) => it.s <= d && d <= it.e);

    let grid = ['월', '화', '수', '목', '금', '토', '일'].map((w) => `<div class="cal-wd">${w}</div>`).join('');
    for (let i = 0; i < cells; i++) {
      const d = new Date(y, m, 1 - offset + i), w = d.getDay();
      const list = on(d);
      const cls = ['cal-day', d.getMonth() !== m ? 'out' : '', w === 0 || w === 6 ? 'we' : '', +d === +today ? 'today' : '', iso(d) === state.sel ? 'sel' : ''].join(' ');
      const shown = list.slice(0, 3);
      grid += `<button class="${cls}" data-day="${iso(d)}" aria-label="${mdw(d)} ${list.length}건">
        <span class="cal-n">${d.getDate()}</span>
        ${shown.map((it) => `<span class="cal-chip${isTent(it) ? ' tent' : ''}${isPast(it) ? ' past' : ''}" style="--c:${colorOf(it)}"><span>${it.type === 'as' ? esc(P[it.person]?.name || '') + ' · ' : ''}${esc(it.title)}</span></span>`).join('')}
        ${list.length > 3 ? `<span class="cal-more">+${list.length - 3}</span>` : ''}
      </button>`;
    }

    const sd = parse(state.sel);
    const selList = on(sd);
    el.innerHTML = `<div class="panel">
      <div class="cal-head">
        <button class="icon-btn" data-mnav="-1" ${canPrev ? '' : 'disabled'} aria-label="이전 달">‹</button>
        <h3>${y}년 ${m + 1}월</h3>
        <button class="icon-btn" data-mnav="1" ${canNext ? '' : 'disabled'} aria-label="다음 달">›</button>
        <button class="text-btn" data-mtoday style="margin-left:auto">오늘</button>
      </div>
      <div class="cal-grid">${grid}</div>
      <div class="cal-sel"><h4>${mdw(sd)}</h4>${selList.length ? listRows(selList) : '<div class="list-empty" style="padding:8px 0;text-align:left">일정 없음</div>'}</div>
    </div>`;
  }

  /* ---------- 목록 ---------- */
  function listRows(list) {
    return list.map((it) => {
      const p = it.type === 'as' ? P[it.person] : null;
      const dd = dday(it);
      const soon = it.s > today && diff(today, it.s) <= 7;
      return `<button class="row${isPast(it) ? ' past' : ''}" data-id="${it.id}">
        <span class="date">${range(it)}</span>
        <span class="dd${soon || dd === '오늘' || dd === '진행 중' ? ' soon' : ''}">${dd}</span>
        <span class="tt"><i class="dot${it.type === 'ms' ? ' dia' : ''}" style="--c:${colorOf(it)}"></i><span>${esc(it.title)}${it.note ? `<span class="note">${esc(it.note)}</span>` : ''}</span></span>
        <span class="who">${p ? `<i class="dot" style="--c:${p.color}"></i>${esc(p.name)}` : `<span class="tag" style="--c:${colorOf(it)}">${esc(kindLabel(it))}</span>`}${isTent(it) ? '<span class="tag st">미확정</span>' : ''}</span>
      </button>`;
    }).join('');
  }

  function renderList(el) {
    const vis = items.filter(visible);
    if (!vis.length) { el.innerHTML = '<div class="panel"><div class="list-empty">표시할 항목이 없습니다.</div></div>'; return; }
    const groups = [];
    for (const it of vis) {
      const key = `${it.s.getFullYear()}년 ${it.s.getMonth() + 1}월`;
      if (!groups.length || groups[groups.length - 1].key !== key) groups.push({ key, list: [] });
      groups[groups.length - 1].list.push(it);
    }
    el.innerHTML = `<div class="panel">${groups.map((g) => `<div class="list-month">${g.key}</div>${listRows(g.list)}`).join('')}</div>`;
  }

  /* ---------- 상세 ---------- */
  function showDetail(it) {
    const d = $('#detail');
    const p = it.type === 'as' ? P[it.person] : null;
    d.innerHTML = `
      <button class="icon-btn x" data-close aria-label="닫기">✕</button>
      <div class="tags">
        ${p ? `<span class="tag" style="--c:${p.color}">${esc(p.name)}</span>` : ''}
        <span class="tag" style="--c:${colorOf(it)}">${esc(kindLabel(it))}</span>
        ${it.status ? `<span class="tag st">${STATUS[it.status] || esc(it.status)}</span>` : ''}
      </div>
      <h3>${esc(it.title)}</h3>
      <div class="meta">${range(it)} · ${dday(it)}${+it.s !== +it.e ? ` · ${diff(it.s, it.e) + 1}일` : ''}</div>
      ${it.note ? `<div class="note">${esc(it.note)}</div>` : ''}`;
    d.hidden = false;
  }

  /* ---------- 렌더 ---------- */
  function render() {
    renderToolbar();
    const el = $('#view');
    if (state.view === 'month') renderMonth(el);
    else if (state.view === 'list') renderList(el);
    else renderTimeline(el);
  }

  function renderLegend() {
    const used = [...new Set((S.milestones || []).map((m) => m.kind))];
    $('#legend').innerHTML = used.map((k) => `<span><i class="dot dia" style="--c:${(KIND[k] || KIND.internal).c}"></i>${esc((KIND[k] || { label: k }).label)}</span>`).join('')
      + '<span><i class="dash"></i>점선 = 미확정</span>'
      + `<span>${esc(S.source || '')}</span>`;
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-id],[data-view],[data-person],[data-ms],[data-mnav],[data-mtoday],[data-day],[data-close]');
    if (!t) return;
    if (t.dataset.close !== undefined) { $('#detail').hidden = true; return; }
    if (t.dataset.id) { showDetail(byId[t.dataset.id]); return; }
    if (t.dataset.view) { state.view = t.dataset.view; store.set('view', state.view); render(); return; }
    if (t.dataset.ms !== undefined) { state.ms = !state.ms; store.set('ms', state.ms); render(); return; }
    if (t.dataset.person !== undefined) {
      const id = t.dataset.person;
      if (!id) state.people.clear();
      else if (state.people.has(id)) state.people.delete(id);
      else state.people.add(id);
      store.set('people', [...state.people]); render(); return;
    }
    if (t.dataset.mnav) { const d = new Date(state.month.y, state.month.m + Number(t.dataset.mnav), 1); state.month = { y: d.getFullYear(), m: d.getMonth() }; render(); return; }
    if (t.dataset.mtoday !== undefined) { state.month = null; state.sel = iso(today); render(); return; }
    if (t.dataset.day) { state.sel = t.dataset.day; render(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#detail').hidden = true; });

  renderUpcoming();
  renderLegend();
  render();
})();
