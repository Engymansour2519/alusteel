(function () {
  'use strict';
  var D = window.SITE_DATA;
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  function T(tag, ar, en, cls) {
    var c = cls ? ' class="' + cls + '"' : '';
    return '<' + tag + c + ' data-l="ar">' + ar + '</' + tag + '><' + tag + c + ' data-l="en">' + en + '</' + tag + '>';
  }
  var S = function (ar, en) { return T('span', ar, en); };

  var id = parseInt(new URLSearchParams(location.search).get('id'), 10);
  var a = D.articles[id];

  function body(blocks) {
    return blocks.map(function (b) {
      return b.h ? '<h2 class="sec">' + esc(b.h) + '</h2>' : '<p>' + esc(b.p) + '</p>';
    }).join('');
  }

  if (!a) {
    $('crumbs').innerHTML = S('المقالات', 'Articles');
    $('articleBox').innerHTML = T('h1', 'المقال غير موجود', 'Article not found') +
      '<a class="btn" href="index.html#articles">' + S('كل المقالات', 'All articles') + '</a>';
  } else {
    document.title = a.ar.t + ' | ' + a.en.t + ' | Alusteel';
    $('crumbs').innerHTML = '<a href="index.html">' + S('الرئيسية', 'Home') + '</a> / <a href="index.html#articles">' + S('المقالات', 'Articles') + '</a> / ' + S(esc(a.ar.t), esc(a.en.t));

    var prev = D.articles[id - 1], next = D.articles[id + 1];
    var nav = '<div class="pn"><span>' + (prev ? '<a class="btn alt" href="article.html?id=' + (id - 1) + '">' + S('المقال السابق', 'Previous article') + '</a>' : '') + '</span>' +
              '<span>' + (next ? '<a class="btn alt" href="article.html?id=' + (id + 1) + '">' + S('المقال التالي', 'Next article') + '</a>' : '') + '</span></div>';

    $('articleBox').innerHTML =
      T('h1', esc(a.ar.t), esc(a.en.t)) +
      T('div', body(a.ar.body), body(a.en.body), 'text') +
      (a.imgs.length ? '<div class="gallery">' + a.imgs.map(function (u) { return '<img src="' + esc(u) + '" alt="" loading="lazy" onerror="this.remove()">'; }).join('') + '</div>' : '') +
      '<div style="margin-top:26px"><a class="btn" href="contact.html">' + S('تواصل معنا', 'Contact us') + '</a></div>' + nav;

    $('moreBox').innerHTML = T('h2', 'مقالات أخرى', 'More articles') + '<div style="height:18px"></div><div class="grid">' +
      D.articles.map(function (x, i) { return i === id ? '' : { x: x, i: i }; }).filter(Boolean).slice(0, 3).map(function (o) {
        return '<a class="card art" href="article.html?id=' + o.i + '">' + T('h3', esc(o.x.ar.t), esc(o.x.en.t)) + T('p', esc(o.x.ar.d), esc(o.x.en.d)) + T('span', 'اقرأ المزيد', 'Read more', 'more') + '</a>';
      }).join('') + '</div>';
  }

  $('footerBox').innerHTML =
    '<span>' + S('© 2026 الوستيل للتجارة والصناعة. جميع الحقوق محفوظة.', '© 2026 Alusteel for trade and industry. All rights reserved.') + '</span>' +
    '<span class="soc">' + Object.keys(D.social).filter(function (k) { return D.social[k]; }).map(function (k) { return '<a href="' + D.social[k] + '" target="_blank" rel="noopener">' + k + '</a>'; }).join('') + '</span>';

  function setLang(l) {
    root.lang = l; root.dir = l === 'ar' ? 'rtl' : 'ltr';
    $('lang').textContent = l === 'ar' ? 'EN' : 'عربي';
    try { localStorage.setItem('lang', l); } catch (e) {}
  }
  $('lang').addEventListener('click', function () { setLang(root.lang === 'ar' ? 'en' : 'ar'); });
  var saved = 'ar'; try { saved = localStorage.getItem('lang') || 'ar'; } catch (e) {}
  setLang(saved);
})();