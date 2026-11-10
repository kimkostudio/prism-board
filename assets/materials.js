// 자료실: 드라이브 폴더를 사이트 스타일로 보여 준다.
// 공개 저장소이므로 폴더·스크립트 ID는 코드에 넣지 않는다. 팀에 전달한 주소의 해시로 받아
// 이 브라우저에만 기억한다(해시는 서버로 전송되지 않는다).
//   #s=<Apps Script 배포 ID>&d=<하위 폴더 ID>  목록 API(tools/materials_index/Code.gs)로 직접 그림
//   #f=<드라이브 폴더 ID>                        API가 없을 때 드라이브 임베드로 대체
(function () {
  var K = { s: 'prism.materials.script', f: 'prism.materials.folder', mode: 'prism.materials.mode', sort: 'prism.materials.sort' };
  var ID_RE = /^[A-Za-z0-9_-]{20,}$/;
  var IS_LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var $ = function (id) { return document.getElementById(id); };

  function get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  function readHash() {
    var o = {};
    location.hash.replace(/^#/, '').split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i > 0) o[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1));
    });
    return o;
  }

  // 붙여 넣은 링크에서 스크립트 ID나 폴더 ID를 꺼낸다.
  function parseInput(s) {
    s = (s || '').trim();
    var m;
    if ((m = s.match(/[#&]s=([A-Za-z0-9_-]+)/)) || (m = s.match(/macros\/s\/([A-Za-z0-9_-]+)/))) return { s: m[1] };
    if ((m = s.match(/[#&]f=([A-Za-z0-9_-]+)/)) || (m = s.match(/folders\/([A-Za-z0-9_-]+)/)) || (m = s.match(/[?&]id=([A-Za-z0-9_-]+)/))) return { f: m[1] };
    if (/^AKfy[A-Za-z0-9_-]+$/.test(s)) return { s: s };
    if (ID_RE.test(s)) return { f: s };
    return null;
  }

  var st = {
    s: '', f: '', d: '',
    mode: get(K.mode) === 'list' ? 'list' : 'grid',
    sort: get(K.sort) === 'name' ? 'name' : 'new',
    data: null, seq: 0, images: [], lbi: 0,
  };

  function syncFromHash() {
    var h = readHash();
    if (h.s && ID_RE.test(h.s)) { st.s = h.s; put(K.s, h.s); }
    if (h.f && ID_RE.test(h.f)) { st.f = h.f; put(K.f, h.f); }
    if (!st.s) st.s = get(K.s);
    if (!st.f) st.f = get(K.f);
    st.d = h.d && ID_RE.test(h.d) ? h.d : '';
    st.dev = IS_LOCAL && h.e ? h.e : '';
  }

  function endpoint(force) {
    var base = st.dev || ('https://script.google.com/macros/s/' + st.s + '/exec');
    var q = [];
    if (st.d) q.push('d=' + encodeURIComponent(st.d));
    if (force) q.push('nocache=1');
    return base + (q.length ? '?' + q.join('&') : '');
  }

  function hashFor(folderId) {
    var parts = [];
    if (st.dev) parts.push('e=' + encodeURIComponent(st.dev));
    if (st.s) parts.push('s=' + st.s);
    if (folderId) parts.push('d=' + folderId);
    return '#' + parts.join('&');
  }

  function shareUrl() {
    if (st.s) return location.origin + location.pathname + '#s=' + st.s + (st.d ? '&d=' + st.d : '');
    return location.origin + location.pathname + '#f=' + st.f;
  }

  // ---------- 표시 형식 ----------
  function fmtSize(n) {
    if (!n) return '';
    var u = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return (n >= 10 || i === 0 ? Math.round(n) : n.toFixed(1)) + ' ' + u[i];
  }
  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var now = new Date();
    var md = (d.getMonth() + 1) + '/' + d.getDate();
    var hm = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    if (d.toDateString() === now.toDateString()) return '오늘 ' + hm;
    return (d.getFullYear() !== now.getFullYear() ? d.getFullYear() + '/' : '') + md;
  }
  var GKIND = {
    'application/vnd.google-apps.document': ['DOC', 'doc'],
    'application/vnd.google-apps.spreadsheet': ['SHEET', 'sheet'],
    'application/vnd.google-apps.presentation': ['SLIDE', 'slide'],
    'application/vnd.google-apps.shortcut': ['LINK', 'other'],
  };
  function kindOf(f) {
    if (GKIND[f.mime]) return { label: GKIND[f.mime][0], cls: GKIND[f.mime][1] };
    var ext = (f.name.match(/\.([A-Za-z0-9]{1,5})$/) || [])[1];
    var m = f.mime || '';
    var cls = /^image\//.test(m) ? 'image' : /^video\//.test(m) ? 'video' : /^audio\//.test(m) ? 'audio'
      : m === 'application/pdf' ? 'pdf' : /zip|rar|7z|tar|gzip/.test(m) ? 'archive'
      : /^(exr|hdr|tif|tiff|psd|dpx)$/i.test(ext || '') ? 'image'
      : /^(abc|usd|usda|usdc|usdz|fbx|obj|glb|gltf|blend|hip|hiplc|hipnc|c4d|vdb|bgeo|stp|step)$/i.test(ext || '') ? 'model'
      : /^(ppt|pptx|key)$/i.test(ext || '') ? 'slide' : /^(doc|docx|hwp|txt|md)$/i.test(ext || '') ? 'doc'
      : /^(xls|xlsx|csv)$/i.test(ext || '') ? 'sheet' : 'other';
    return { label: (ext || m.split('/').pop() || 'FILE').toUpperCase().slice(0, 5), cls: cls };
  }
  function isViewable(f) { return /^image\//.test(f.mime || ''); }

  function sorted(arr) {
    var a = arr.slice();
    if (st.sort === 'name') a.sort(function (x, y) { return x.name.localeCompare(y.name, 'ko', { numeric: true }); });
    else a.sort(function (x, y) { return (y.updated || '').localeCompare(x.updated || ''); });
    return a;
  }

  // ---------- 그리기 ----------
  var FOLDER_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2h8.4A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" fill="currentColor"/></svg>';

  function renderCrumbs() {
    var path = (st.data && st.data.path) || [{ id: '', name: '자료실' }];
    $('crumbs').innerHTML = path.map(function (p, i) {
      var last = i === path.length - 1;
      var target = i === 0 ? '' : p.id;
      return (i ? '<span class="sep" aria-hidden="true">/</span>' : '') +
        (last ? '<span aria-current="page">' + esc(p.name) + '</span>' : '<a href="' + hashFor(target) + '">' + esc(p.name) + '</a>');
    }).join('');
  }

  function renderSegs() {
    document.querySelectorAll('#mode-seg button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.mode === st.mode)); });
    document.querySelectorAll('#sort-seg button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.sort === st.sort)); });
    $('sort-seg').hidden = !(st.s || st.dev);
  }

  function renderListing() {
    var box = $('listing');
    var data = st.data;
    if (!data) return;
    var folders = sorted(data.folders || []);
    var files = sorted(data.files || []);
    st.images = files.filter(isViewable);

    if (!folders.length && !files.length) {
      box.innerHTML = '<div class="mat-state"><div class="ic">' + FOLDER_SVG + '</div><b>아직 올린 자료가 없습니다</b><p>드라이브 폴더에 올리면 새로고침했을 때 여기 바로 보입니다.</p></div>';
      return;
    }

    var html = '';
    if (folders.length) {
      html += '<div class="mat-sec">폴더 <span>' + folders.length + '</span></div><div class="mfo-grid">' +
        folders.map(function (f) {
          return '<a class="mfo" href="' + hashFor(f.id) + '"><span class="ic">' + FOLDER_SVG + '</span><b title="' + esc(f.name) + '">' + esc(f.name) + '</b><small>' + fmtDate(f.updated) + '</small></a>';
        }).join('') + '</div>';
    }
    if (files.length) {
      html += '<div class="mat-sec">파일 <span>' + files.length + '</span></div>';
      if (st.mode === 'grid') {
        html += '<div class="mf-grid">' + files.map(function (f) {
          var k = kindOf(f);
          var img = f.thumb && k.cls !== 'archive' && k.cls !== 'audio' && k.cls !== 'model'
            ? '<img loading="lazy" referrerpolicy="no-referrer" src="' + esc(f.thumb) + '" alt="" onerror="this.remove()">' : '';
          return '<a class="mf" data-id="' + esc(f.id) + '" href="' + esc(f.url) + '" target="_blank" rel="noopener noreferrer">' +
            '<span class="th k-' + k.cls + '"><span class="ext">' + esc(k.label) + '</span>' + img +
            (k.cls === 'video' ? '<span class="play" aria-hidden="true">▶</span>' : '') + '</span>' +
            '<span class="meta"><b title="' + esc(f.name) + '">' + esc(f.name) + '</b><small>' + [fmtDate(f.updated), fmtSize(f.size)].filter(Boolean).join(' · ') + '</small></span></a>';
        }).join('') + '</div>';
      } else {
        html += '<div class="mf-list">' + files.map(function (f) {
          var k = kindOf(f);
          return '<a class="mfl" data-id="' + esc(f.id) + '" href="' + esc(f.url) + '" target="_blank" rel="noopener noreferrer">' +
            '<span class="tag-k k-' + k.cls + '">' + esc(k.label) + '</span><b title="' + esc(f.name) + '">' + esc(f.name) + '</b>' +
            '<small class="sz">' + fmtSize(f.size) + '</small><small>' + fmtDate(f.updated) + '</small></a>';
        }).join('') + '</div>';
      }
    }
    box.innerHTML = html;
  }

  function renderLoading() {
    var n = 8, cells = '';
    for (var i = 0; i < n; i++) cells += '<span class="sk"></span>';
    $('listing').innerHTML = '<div class="mf-grid sk-grid" aria-label="불러오는 중">' + cells + '</div>';
  }

  function renderError(msg) {
    $('listing').innerHTML = '<div class="mat-state err"><b>목록을 불러오지 못했습니다</b><p>' + esc(msg) + '</p>' +
      '<div class="row-btns"><button class="ghost" type="button" data-act="retry">다시 시도</button>' +
      (st.f ? '<button class="ghost" type="button" data-act="embed">드라이브 화면으로 보기</button>' : '') + '</div></div>';
  }

  // API가 없을 때: 드라이브 임베드(목록 보기, 어두운 테마에서는 색 반전)
  function renderEmbed() {
    $('listing').innerHTML = '<div class="mat-frame"><iframe title="자료실 폴더" referrerpolicy="no-referrer" src="https://drive.google.com/embeddedfolderview?id=' +
      encodeURIComponent(st.f) + '#list"></iframe></div><p class="hint">드라이브 기본 화면입니다. 폴더가 비어 있으면 빈 화면으로 보입니다.</p>';
  }

  function openDriveHref() {
    var id = st.d || (st.data && st.data.path && st.data.path[0] && st.data.path[0].id) || st.f;
    return id ? 'https://drive.google.com/drive/folders/' + id : '';
  }

  function load(force) {
    var my = ++st.seq;
    renderLoading();
    fetch(endpoint(force), { redirect: 'follow' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        if (my !== st.seq) return;
        if (data.error) throw new Error(data.error);
        st.data = data;
        $('stamp').textContent = fmtDate(data.at) ? '갱신 ' + fmtDate(data.at) : '';
        renderCrumbs();
        renderListing();
        var href = openDriveHref();
        $('open-drive').hidden = !href;
        if (href) $('open-drive').href = href;
      })
      .catch(function (e) {
        if (my !== st.seq) return;
        renderError(e && e.message ? e.message : '연결 오류');
      });
  }

  function show() {
    syncFromHash();
    var has = !!(st.s || st.f || st.dev);
    $('browser').hidden = !has;
    $('setup').hidden = has;
    renderSegs();
    if (!has) { $('open-drive').hidden = true; return; }
    if (st.s || st.dev) {
      $('mode-seg').hidden = false;
      renderCrumbs();
      load(false);
    } else {
      $('mode-seg').hidden = true;
      $('crumbs').innerHTML = '<span aria-current="page">자료실</span>';
      $('stamp').textContent = '';
      $('open-drive').hidden = false;
      $('open-drive').href = 'https://drive.google.com/drive/folders/' + st.f;
      renderEmbed();
    }
  }

  // ---------- 이미지 크게 보기 ----------
  function lbShow(i) {
    var n = st.images.length;
    if (!n) return;
    st.lbi = (i + n) % n;
    var f = st.images[st.lbi];
    $('lb-img').src = (f.thumb || '').replace(/sz=w\d+/, 'sz=w2400');
    $('lb-img').alt = f.name;
    $('lb-name').textContent = f.name + (n > 1 ? '  ·  ' + (st.lbi + 1) + ' / ' + n : '');
    $('lb-open').href = f.url;
    $('lb-prev').hidden = $('lb-next').hidden = n < 2;
    $('lb').hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function lbClose() { $('lb').hidden = true; $('lb-img').removeAttribute('src'); document.body.style.overflow = ''; }

  // ---------- 이벤트 ----------
  $('listing').addEventListener('click', function (e) {
    var act = e.target.closest('[data-act]');
    if (act) {
      if (act.dataset.act === 'retry') load(true);
      if (act.dataset.act === 'embed') renderEmbed();
      return;
    }
    var a = e.target.closest('a[data-id]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var idx = st.images.findIndex(function (f) { return f.id === a.dataset.id; });
    if (idx >= 0) { e.preventDefault(); lbShow(idx); }
  });

  document.querySelectorAll('#mode-seg button').forEach(function (b) {
    b.addEventListener('click', function () { st.mode = b.dataset.mode; put(K.mode, st.mode); renderSegs(); renderListing(); });
  });
  document.querySelectorAll('#sort-seg button').forEach(function (b) {
    b.addEventListener('click', function () { st.sort = b.dataset.sort; put(K.sort, st.sort); renderSegs(); renderListing(); });
  });
  $('reload').addEventListener('click', function () { if (st.s || st.dev) load(true); else renderEmbed(); });
  $('copy').addEventListener('click', function () {
    var btn = this, url = shareUrl();
    var done = function () { btn.textContent = '복사됨'; setTimeout(function () { btn.textContent = '공유 링크 복사'; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt('자료실 주소', url); });
    else prompt('자료실 주소', url);
  });
  $('set-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var r = parseInput($('set-input').value);
    $('set-err').hidden = !!r;
    if (!r) return;
    if (r.s) { put(K.s, r.s); location.hash = 's=' + r.s; }
    else { put(K.f, r.f); location.hash = 'f=' + r.f; }
  });

  $('lb-x').addEventListener('click', lbClose);
  $('lb-prev').addEventListener('click', function () { lbShow(st.lbi - 1); });
  $('lb-next').addEventListener('click', function () { lbShow(st.lbi + 1); });
  $('lb').addEventListener('click', function (e) { if (e.target === this) lbClose(); });
  document.addEventListener('keydown', function (e) {
    if ($('lb').hidden) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft') lbShow(st.lbi - 1);
    if (e.key === 'ArrowRight') lbShow(st.lbi + 1);
  });

  window.addEventListener('hashchange', function () { st.data = null; show(); });
  show();
})();
