// 자료실: 드라이브 폴더를 embeddedfolderview로 보여 준다.
// 공개 저장소이므로 폴더 ID는 코드에 넣지 않는다. 팀에 전달한 주소의 #f=<ID>로 받아
// 이 브라우저에만 기억한다(해시는 서버로 전송되지 않는다).
(function () {
  var KEY_ID = 'prism.materials.folder';
  var KEY_MODE = 'prism.materials.mode';
  var ID_RE = /^[A-Za-z0-9_-]{20,}$/;

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) { return ''; }
  }

  function parseId(s) {
    s = (s || '').trim();
    var m = s.match(/folders\/([A-Za-z0-9_-]+)/) || s.match(/[?&#]id=([A-Za-z0-9_-]+)/) || s.match(/[#&]f=([A-Za-z0-9_-]+)/);
    var id = m ? m[1] : s;
    return ID_RE.test(id) ? id : '';
  }

  var $ = function (id) { return document.getElementById(id); };
  var hashId = (location.hash.match(/[#&]f=([A-Za-z0-9_-]+)/) || [])[1] || '';
  var folderId = ID_RE.test(hashId) ? hashId : store(KEY_ID);
  if (folderId === hashId && hashId) store(KEY_ID, hashId);
  var mode = store(KEY_MODE) === 'list' ? 'list' : 'grid';

  function shareUrl() {
    return location.origin + location.pathname + '#f=' + folderId;
  }

  function renderFrame() {
    var box = $('frame');
    box.innerHTML = '';
    var f = document.createElement('iframe');
    f.title = '자료실 폴더';
    f.referrerPolicy = 'no-referrer';
    f.src = 'https://drive.google.com/embeddedfolderview?id=' + encodeURIComponent(folderId) + '#' + mode;
    box.appendChild(f);
    document.querySelectorAll('#browser .seg button').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.dataset.mode === mode));
    });
  }

  function show() {
    var has = !!folderId;
    $('browser').hidden = !has;
    $('empty').hidden = has;
    $('open-drive').hidden = !has;
    if (!has) return;
    $('open-drive').href = 'https://drive.google.com/drive/folders/' + folderId;
    renderFrame();
  }

  document.querySelectorAll('#browser .seg button').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.dataset.mode;
      store(KEY_MODE, mode);
      renderFrame();
    });
  });

  $('reload').addEventListener('click', renderFrame);

  $('copy').addEventListener('click', function () {
    var btn = this, url = shareUrl();
    var done = function () { btn.textContent = '복사됨'; setTimeout(function () { btn.textContent = '공유 링크 복사'; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { prompt('자료실 주소', url); });
    } else {
      prompt('자료실 주소', url);
    }
  });

  $('set-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var id = parseId($('set-input').value);
    $('set-err').hidden = !!id;
    if (!id) return;
    folderId = id;
    store(KEY_ID, id);
    history.replaceState(null, '', '#f=' + id);
    show();
  });

  show();
})();
