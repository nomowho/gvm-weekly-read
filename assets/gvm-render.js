/**
 * gvm-render.js — 產生器（index.html）與分享頁（view.html）共用
 *
 * 放在這裡是為了避免兩邊的版型各自演化，改一次兩邊同步。
 *   GVM.buildPage(payload)   把資料組成完整成品 HTML
 *   GVM.encode(payload)      把資料壓進網址（回傳 Promise<string>）
 *   GVM.decode(str)          從網址還原資料（回傳 Promise<payload>）
 *
 * payload 只存「文章 id ＋ 人寫的文字」，
 * 標題、期別、作者、配圖一律由分享頁自己去索引查，
 * 所以網址不會太長，也維持了「文章只能來自紙本索引」這個保證。
 */
(function (global) {
  'use strict';

  var BRAND = { blue:'#00479D', blueDark:'#003B8F', blueLight:'#E8EFF7', ink:'#1A1A1A', grey:'#6B7280', line:'#DDE3EC' };

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function paragraphs(text){
    return String(text || '').trim().split(/\n\s*\n+/).map(function (p) {
      return '<p>' + esc(p.replace(/\n/g,' ')).trim() + '</p>';
    }).join('');
  }

  function utmQuery(campaign, date){
    var camp = (campaign || 'gvm_digital_AIA').trim();
    var parts = String(date || '').split('-');
    var mmdd = (parts[1] || '') + (parts[2] || '');
    return 'utm_source=line&utm_medium=social&utm_campaign=' + camp +
           '&utm_content=' + camp + '_' + mmdd + '&from=line';
  }

  function articleUrl(id, campaign, date){
    return 'https://www.gvm.com.tw/article/' + id + '?' + utmQuery(campaign, date);
  }

  /**
   * payload = { title, keyword, date, campaign, note,
   *             articles: [{ i, t, y, n, m, s, a, g, summary }] }
   * g 已還原為完整圖片網址。
   */
  function buildPage(p){
    var d = p.date || new Date().toISOString().slice(0,10);
    var dp = d.split('-');
    var dateLabel = dp[0] + '.' + dp[1] + '.' + dp[2];
    var title = p.title || '本週精選';
    var note = p.note || '';
    var arts = p.articles || [];

    var cards = arts.map(function (a) {
      var href = esc(articleUrl(a.i, p.campaign, d));
      return '<article class="card">' +
        // 刻意不用 loading="lazy"：全頁只有四張圖，延遲載入幾乎沒有好處，
        // 而且分享頁是動態插入 DOM 的，lazy 的觀察器在那種情境下不一定會觸發。
        (a.g ? '<a class="card-thumb" href="' + href + '" target="_blank" rel="noopener">' +
               '<img src="' + esc(a.g) + '" alt="' + esc(a.t) + '" decoding="async"></a>' : '') +
        '<div class="card-body">' +
          '<div class="card-tags">' +
            (a.s ? '<span class="tag-section">' + esc(a.s) + '</span>' : '') +
            '<span class="tag-issue">' + esc((a.y || '') + '　' + (a.n || '')) + '</span>' +
          '</div>' +
          '<h3 class="card-title"><a href="' + href + '" target="_blank" rel="noopener">' + esc(a.t) + '</a></h3>' +
          '<p class="card-summary">' + esc(a.summary || '') + '</p>' +
          '<p class="card-meta">' + esc(a.a || '遠見編輯部') + '　｜　《' + esc(a.m || '') + '》</p>' +
          '<div class="card-cta"><a class="btn" href="' + href + '" target="_blank" rel="noopener">閱讀全文<span class="arrow">➔</span></a></div>' +
        '</div></article>';
    }).join('');

    return '<!DOCTYPE html>\n<html lang="zh-Hant-TW"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>' + esc(title) + '｜遠見線上讀 ' + dateLabel + '</title>' +
      '<meta name="description" content="' + esc(note.replace(/\s+/g,' ').slice(0,110)) + '">' +
      '<meta property="og:title" content="' + esc(title) + '">' +
      '<meta property="og:description" content="' + esc(note.replace(/\s+/g,' ').slice(0,110)) + '">' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">' +
      '<style>' + pageCss() + '</style></head><body><div class="wrap">' +
      '<header class="masthead"><div class="masthead-top">' +
      '<div class="brand">遠見線上讀<small>GLOBAL VIEWS MONTHLY</small></div>' +
      '<div class="issue-meta">' + dateLabel + '<br>每週智能策展</div></div>' +
      '<h1 class="headline">' + esc(title) + '</h1>' +
      '<div class="kw">本週主題　' + esc(p.keyword || '—') + '</div></header>' +
      '<section class="editor"><div class="editor-label"><span>編者的話</span><i></i></div>' +
      '<div class="editor-body">' +
        (note ? paragraphs(note) : '<p style="color:#8A94A2">（尚未填寫編者的話）</p>') +
      '</div></section>' +
      '<div class="section-label"><span>本週精選　' + arts.length + ' 篇</span><i></i></div>' +
      '<div class="grid">' + cards + '</div>' +
      '<footer class="foot"><strong>遠見線上讀｜每週智能策展</strong>' +
      '本期文章全數選自《遠見雜誌》紙本內容，點擊卡片即可閱讀全文。' +
      '訂閱紙本雜誌請洽 <a href="https://www.gvm.com.tw/magazine">遠見雜誌</a>。' +
      '<div class="foot-src">選文來源：gvm.com.tw/magazine/published（紙本期別目錄）｜產出日 ' + esc(d) + '</div>' +
      '</footer></div></body></html>';
  }

  function pageCss(){
    return ':root{--blue:' + BRAND.blue + ';--blue-dark:' + BRAND.blueDark + ';--blue-light:' + BRAND.blueLight +
      ';--ink:' + BRAND.ink + ';--grey:' + BRAND.grey + ';--line:' + BRAND.line + ';--radius:4px}' +
      '*{box-sizing:border-box;margin:0;padding:0}' +
      'body{font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;color:var(--ink);background:#F4F6F9;-webkit-font-smoothing:antialiased;line-height:1.75}' +
      '.wrap{max-width:960px;margin:0 auto;background:#fff}' +
      '.masthead{background:var(--blue);color:#fff;padding:28px 32px 24px}' +
      '.masthead-top{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap}' +
      '.brand{font-size:26px;font-weight:900;letter-spacing:.14em;line-height:1.2}' +
      '.brand small{display:block;font-size:11px;font-weight:400;letter-spacing:.3em;opacity:.75;margin-top:6px}' +
      '.issue-meta{font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:.08em;opacity:.9;text-align:right}' +
      '.headline{margin-top:22px;font-size:29px;font-weight:900;line-height:1.4}' +
      '.kw{display:inline-block;margin-top:14px;padding:4px 12px;border:1px solid rgba(255,255,255,.55);font-size:12px;letter-spacing:.12em;border-radius:100px}' +
      '.editor{padding:32px;background:var(--blue-light);border-bottom:1px solid var(--line)}' +
      '.editor-label{display:flex;align-items:center;gap:10px;margin-bottom:14px}' +
      '.editor-label span{font-size:13px;font-weight:700;letter-spacing:.2em;color:var(--blue)}' +
      '.editor-label i{flex:1;height:1px;background:var(--blue);opacity:.28}' +
      '.editor-body{font-size:15.5px;line-height:2.05;color:#26303C;text-align:justify}' +
      '.editor-body p+p{margin-top:14px}' +
      '.section-label{display:flex;align-items:center;gap:10px;padding:32px 32px 0}' +
      '.section-label span{font-size:13px;font-weight:700;letter-spacing:.2em;color:var(--blue)}' +
      '.section-label i{flex:1;height:1px;background:var(--line)}' +
      '.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px 32px 32px}' +
      '.card{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;background:#fff;transition:box-shadow .2s,transform .2s}' +
      '.card:hover{box-shadow:0 8px 24px rgba(0,71,157,.12);transform:translateY(-2px)}' +
      '.card-thumb{display:block;aspect-ratio:16/9;background:var(--blue-light);overflow:hidden}' +
      '.card-thumb img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.card-body{flex:1;display:flex;flex-direction:column;padding:16px 18px 18px}' +
      '.card-tags{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}' +
      '.tag-section{background:var(--blue);color:#fff;font-size:11px;font-weight:500;padding:2px 8px;letter-spacing:.06em}' +
      '.tag-issue{font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--grey)}' +
      '.card-title{font-size:17px;font-weight:700;line-height:1.55}' +
      '.card-title a{color:var(--ink);text-decoration:none}.card-title a:hover{color:var(--blue)}' +
      '.card-summary{margin-top:10px;font-size:13.5px;line-height:1.9;color:#4A5563;text-align:justify}' +
      '.card-meta{margin-top:12px;font-size:12px;color:var(--grey)}' +
      '.card-cta{margin-top:16px}' +
      '.btn{display:inline-flex;align-items:center;gap:6px;background:var(--blue);color:#fff;font-size:13px;font-weight:500;letter-spacing:.06em;padding:9px 16px;text-decoration:none;border-radius:var(--radius)}' +
      '.btn:hover{background:var(--blue-dark)}' +
      '.foot{background:#1C2430;color:#9AA6B4;padding:26px 32px;font-size:12px;line-height:1.9}' +
      '.foot strong{color:#fff;font-weight:700;letter-spacing:.1em;display:block;margin-bottom:8px;font-size:13px}' +
      '.foot a{color:#8FB6E6;text-decoration:none}' +
      '.foot-src{margin-top:12px;padding-top:12px;border-top:1px solid #2C3745;font-family:"JetBrains Mono",monospace;font-size:11px;color:#6C7A8A}' +
      '@media (max-width:720px){.masthead{padding:22px 20px 20px}.brand{font-size:22px}.headline{font-size:23px;margin-top:18px}' +
      '.issue-meta{text-align:left}.editor{padding:24px 20px}.section-label{padding:24px 20px 0}' +
      '.grid{grid-template-columns:1fr;gap:16px;padding:16px 20px 24px}.foot{padding:22px 20px}}';
  }

  // ── 網址編碼 ──────────────────────────────────────────────────────────────
  // 只存 id 與人寫的文字，其餘由分享頁查索引補上，網址才不會爆長。

  function toB64url(bytes){
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function fromB64url(str){
    var s = str.replace(/-/g,'+').replace(/_/g,'/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function slim(p){
    return {
      t: p.title || '', k: p.keyword || '', d: p.date || '',
      c: p.campaign || '', n: p.note || '',
      a: (p.articles || []).map(function (x) { return [x.i, x.summary || '']; })
    };
  }

  async function encode(payload){
    var json = JSON.stringify(slim(payload));
    var bytes = new TextEncoder().encode(json);
    if (typeof CompressionStream === 'function') {
      try {
        var cs = new CompressionStream('deflate-raw');
        var buf = await new Response(new Blob([bytes]).stream().pipeThrough(cs)).arrayBuffer();
        return 'z1.' + toB64url(new Uint8Array(buf));
      } catch (e) { /* 不支援就退回未壓縮 */ }
    }
    return 'v1.' + toB64url(bytes);
  }

  async function decode(str){
    var s = String(str || '').replace(/^#/, '');
    var dot = s.indexOf('.');
    if (dot === -1) throw new Error('連結格式不正確');
    var tag = s.slice(0, dot), body = fromB64url(s.slice(dot + 1));
    var bytes = body;
    if (tag === 'z1') {
      if (typeof DecompressionStream !== 'function') throw new Error('這個瀏覽器不支援壓縮連結，請改用較新的瀏覽器');
      var ds = new DecompressionStream('deflate-raw');
      var buf = await new Response(new Blob([body]).stream().pipeThrough(ds)).arrayBuffer();
      bytes = new Uint8Array(buf);
    } else if (tag !== 'v1') {
      throw new Error('不認得的連結版本：' + tag);
    }
    var o = JSON.parse(new TextDecoder().decode(bytes));
    return {
      title: o.t || '', keyword: o.k || '', date: o.d || '',
      campaign: o.c || '', note: o.n || '',
      articles: (o.a || []).map(function (x) { return { i: x[0], summary: x[1] }; })
    };
  }

  global.GVM = {
    buildPage: buildPage, encode: encode, decode: decode,
    esc: esc, articleUrl: articleUrl, utmQuery: utmQuery, BRAND: BRAND
  };
})(window);
