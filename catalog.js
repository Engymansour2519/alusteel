/* Product catalog. Data comes from products.js (made by make-products.py).
   - On the home page:      Catalog.home(element)   (called from main.js)
   - On products.html:      starts by itself when it finds #catalogRoot                    */
(function () {
  'use strict';
  var D = window.SITE_DATA || {}, P = window.PRODUCTS;
  var cats = (P && P.categories) || [];
  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  function T(tag, ar, en, cls, attr) {
    var c = cls ? ' class="' + cls + '"' : '', a = attr ? ' ' + attr : '';
    return '<' + tag + c + a + ' data-l="ar">' + ar + '</' + tag + '><' + tag + c + a + ' data-l="en">' + en + '</' + tag + '>';
  }
  var S = function (ar, en) { return T('span', ar, en); };
  var thumb = function (u) { return /\.webp$/.test(u) ? u.replace(/\.webp$/, '-s.webp') : u; };
  var normText = function (s) {
    return String(s).toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  };
  var phone = (D.contact && D.contact.phones && D.contact.phones[0]) || '01000869066';
  function wa(ar, en, isEn) {
    var msg = isEn ? 'Hello, I would like a quote for: ' + en : 'مرحبًا، أريد عرض سعر لـ: ' + ar;
    return 'https://wa.me/2' + phone + '?text=' + encodeURIComponent(msg);
  }
  function quoteBtn(p, cls) {
    return '<a class="btn ' + (cls || '') + '" data-l="ar" target="_blank" rel="noopener" href="' + wa(p.ar, p.en, false) + '">اطلب عرض سعر</a>' +
           '<a class="btn ' + (cls || '') + '" data-l="en" target="_blank" rel="noopener" href="' + wa(p.ar, p.en, true) + '">Get a quote</a>';
  }
  var byId = {};
  cats.forEach(function (c) { c.products.forEach(function (p) { p.cat = c.id; byId[p.id] = p; }); });

  function card(p) {
    return '<article class="pcard"><button class="pimg" type="button" data-pid="' + p.id + '" aria-label="' + esc(p.ar) + '">' +
      '<img src="' + esc(thumb(p.imgs[0])) + '" alt="" loading="lazy" onerror="this.style.opacity=.15"></button>' +
      '<div class="pbody">' + T('h3', esc(p.ar), esc(p.en)) + quoteBtn(p, 'pbtn') + '</div></article>';
  }
  function pills(withAll, counts) {
    var all = '<button class="pill on" type="button" data-cat="">' + S('الكل', 'All') + '</button>';
    return (withAll ? all : '') + cats.map(function (c) {
      return '<button class="pill" type="button" data-cat="' + c.id + '">' + T('span', esc(c.ar), esc(c.en)) +
        (counts ? ' <small>' + c.products.length + '</small>' : '') + '</button>';
    }).join('');
  }
  function setOn(box, id) {
    box.querySelectorAll('.pill').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-cat') === id); });
  }

  /* ---------- large view ---------- */
  var lb, cur, idx;
  function ensureLb() {
    if (lb) return;
    lb = document.createElement('div'); lb.className = 'plb'; lb.hidden = true;
    lb.innerHTML = '<div class="plb-box" role="dialog" aria-modal="true"><button class="plb-x" type="button" aria-label="Close">×</button>' +
      '<div class="plb-img"><button class="plb-nav plb-prev" type="button" aria-label="Previous">‹</button><img alt=""><button class="plb-nav plb-next" type="button" aria-label="Next">›</button></div>' +
      '<div class="plb-thumbs"></div><div class="plb-info"></div></div>';
    document.body.appendChild(lb);
    lb.addEventListener('click', function (e) {
      var t = e.target;
      if (t === lb || t.classList.contains('plb-x')) return close();
      if (t.classList.contains('plb-prev')) return go(idx - 1);
      if (t.classList.contains('plb-next')) return go(idx + 1);
      var th = t.closest('[data-i]'); if (th) go(+th.getAttribute('data-i'));
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      var rtl = root.dir === 'rtl';
      if (e.key === 'ArrowRight') go(idx + (rtl ? -1 : 1));
      if (e.key === 'ArrowLeft') go(idx + (rtl ? 1 : -1));
    });
  }
  function go(i) {
    var n = cur.imgs.length; idx = (i + n) % n;
    lb.querySelector('.plb-img img').src = cur.imgs[idx];
    lb.querySelectorAll('.plb-thumbs button').forEach(function (b, k) { b.classList.toggle('on', k === idx); });
  }
  function open(id) {
    ensureLb(); cur = byId[id]; if (!cur) return;
    lb.querySelector('.plb-thumbs').innerHTML = cur.imgs.length > 1 ? cur.imgs.map(function (u, i) {
      return '<button type="button" data-i="' + i + '"><img src="' + esc(thumb(u)) + '" alt=""></button>';
    }).join('') : '';
    lb.querySelectorAll('.plb-nav').forEach(function (b) { b.style.display = cur.imgs.length > 1 ? '' : 'none'; });
    lb.querySelector('.plb-info').innerHTML = T('h3', esc(cur.ar), esc(cur.en)) + '<div class="plb-acts">' + quoteBtn(cur) + '</div>';
    lb.hidden = false; document.body.style.overflow = 'hidden'; go(0);
  }
  function close() { lb.hidden = true; document.body.style.overflow = ''; lb.querySelector('.plb-img img').src = ''; }
  function bind(el) {
    el.addEventListener('click', function (e) { var b = e.target.closest('[data-pid]'); if (b) open(b.getAttribute('data-pid')); });
  }

  /* ---------- home page: first 8 products + filters ---------- */
  function home(box) {
    box.innerHTML =
      T('h2', 'منتجاتنا', 'Our products') +
      T('p', 'معدات طبخ عالية الجودة للمطاعم والفنادق بأسعار تنافسية. اختر القسم لتشاهد المنتجات.', 'High-quality cooking equipment for restaurants and hotels at competitive prices. Choose a category to see the products.', 'sub') +
      '<div class="pills" id="hPills">' + pills(true, false) + '</div>' +
      '<div class="pgrid" id="hGrid"></div>' +
      '<div class="more-row"><a class="btn" id="hMore" href="products.html">' + S('عرض كل المنتجات', 'View all products') + '</a></div>';
    var grid = $('hGrid');
    function show(id) {
      var list;
      if (!id) list = cats.map(function (c) { return c.products[0]; });           // one from each category
      else list = (cats.filter(function (c) { return c.id === id; })[0] || { products: [] }).products;
      grid.innerHTML = list.slice(0, 8).map(card).join('');
      $('hMore').href = 'products.html' + (id ? '?cat=' + id : '');
      setOn($('hPills'), id || '');
    }
    $('hPills').addEventListener('click', function (e) { var b = e.target.closest('.pill'); if (b) show(b.getAttribute('data-cat')); });
    bind(grid); show('');
  }

  /* ---------- products.html ---------- */
  function page() {
    var q = new URLSearchParams(location.search), catId = q.get('cat') || '', term = '';
    $('catalogRoot').innerHTML =
      '<div class="ptools"><input id="pSearch" type="search" data-ph-ar="ابحث عن منتج…" data-ph-en="Search for a product…"></div>' +
      '<div class="pills" id="pPills">' + pills(true, true) + '</div>' +
      '<p class="pcount" id="pCount"></p><div class="pgrid" id="pGrid"></div><p class="pempty" id="pEmpty" hidden>' +
      S('لا توجد منتجات مطابقة.', 'No matching products.') + '</p>';
    var grid = $('pGrid');
    function render() {
      var t = normText(term), list = [];
      cats.forEach(function (c) {
        if (catId && c.id !== catId) return;
        c.products.forEach(function (p) { if (!t || normText(p.ar + ' ' + p.en + ' ' + c.ar + ' ' + c.en).indexOf(t) >= 0) list.push(p); });
      });
      grid.innerHTML = list.map(card).join('');
      $('pEmpty').hidden = list.length > 0;
      $('pCount').innerHTML = S(list.length + ' منتج', list.length + ' products');
      setOn($('pPills'), catId);
    }
    $('pPills').addEventListener('click', function (e) { var b = e.target.closest('.pill'); if (b) { catId = b.getAttribute('data-cat'); render(); } });
    $('pSearch').addEventListener('input', function (e) { term = e.target.value; render(); });
    bind(grid); render(); setupChrome();
  }
  function setupChrome() {
    var foot = $('footerBox');
    if (foot) foot.innerHTML = '<span>' + S('© 2026 الوستيل للتجارة والصناعة. جميع الحقوق محفوظة.', '© 2026 Alusteel for trade and industry. All rights reserved.') + '</span>' +
      (window.socialLinks ? window.socialLinks(D.social || {}) : '');
    function setLang(l) {
      root.lang = l; root.dir = l === 'ar' ? 'rtl' : 'ltr';
      $('lang').textContent = l === 'ar' ? 'EN' : 'عربي';
      document.querySelectorAll('[data-ph-ar]').forEach(function (i) { i.placeholder = i.getAttribute('data-ph-' + l); i.setAttribute('aria-label', i.placeholder); });
      try { localStorage.setItem('lang', l); } catch (e) {}
    }
    $('lang').addEventListener('click', function () { setLang(root.lang === 'ar' ? 'en' : 'ar'); });
    var saved = 'ar'; try { saved = localStorage.getItem('lang') || 'ar'; } catch (e) {}
    setLang(saved);
  }

  window.Catalog = { ready: cats.length > 0, home: home };
  if ($('catalogRoot')) {
    if (cats.length) page();
    else { $('catalogRoot').innerHTML = '<p class="pempty">products.js is empty. Run make-products.py first.</p>'; setupChrome(); }
  }
})();