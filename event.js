(function () {
  'use strict';
  var D = window.SITE_DATA;
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  function T(tag, ar, en, cls) { var c = cls ? ' class="' + cls + '"' : ''; return '<' + tag + c + ' data-l="ar">' + ar + '</' + tag + '><' + tag + c + ' data-l="en">' + en + '</' + tag + '>'; }
  var S = function (ar, en) { return T('span', ar, en); };

  var id = (new URLSearchParams(location.search).get('id') || '').toLowerCase();
  /* ---------- fairs: each one gets its own photos (from site-data.js) ---------- */
  var EV = {}; (D.events || []).forEach(function (e) { EV[e.name.toLowerCase()] = e.img; });
  var HERO = D.hero_imgs || [];
  var cafex25 = HERO.filter(function (u) { return /cafex-2025/.test(u); });
  var A4 = D.articles[4];
  function ed(y, ar, en, imgs, extra) {
    var o = { ar: { t: y + '', body: ar }, en: { t: y + '', body: en }, imgs: imgs.filter(Boolean) };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  /* Years shown on EVERY fair page, newest first. Add or remove years here. */
  var YEARS = [2026, 2025, 2024, 2022, 2021, 2019, 2018, 2017, 2016];
  /* A fair listed here shows ONLY these years instead of the list above. */
  var YEARS_BY = { horeca: [2024, 2023], iatf: [2018],
    cafex: [2026, 2025, 2024, 2023, 2022, 2021, 2019, 2018],
    hace:  [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2018] };
  var SOON_AR = ['سيتم إضافة صور هذه الدورة قريبًا.'], SOON_EN = ['Photos from this edition will be added soon.'];

  /* Content per fair and year. To add photos or text to a year, add/edit its line:
       2024: ed(2024, ['نص عربي'], ['English text'], ['images/events/cafex-2024-1.jpg', 'images/events/cafex-2024-2.jpg']),
     Years that are not listed here show the "photos soon" line. Years outside YEARS (like 2023) also appear if listed here. */
  var CONTENT = {
    cafex: {
      2025: ed(2025, ['صور من مشاركة الوستيل في معرض CAFEX 2025.'], ['Photos from Alusteel at CAFEX 2025.'], cafex25),
      2022: ed(2022, ['صورة من مشاركة الوستيل في معرض CAFEX 2022.'], ['A photo from Alusteel at CAFEX 2022.'], [EV.cafex])
    },
    hace: {
      2026: ed(2026, ['انتظرونا في معرض HACE 2026 من 19 إلى 21 أكتوبر 2026 في مركز مصر للمؤتمرات والمعارض الدولية، التجمع الخامس، قاعة 3.'],
                     ['Meet us at HACE 2026, 19–21 October 2026, Egypt International Exhibition Center, Fifth Settlement, Hall 3.'], []),
      2025: ed(2025, A4 ? [A4.ar.body[0].p] : [], A4 ? [A4.en.body[0].p] : [], [], A4 ? { article: 4 } : null),
      2023: ed(2023, ['صورة من مشاركة الوستيل في معرض HACE 2023.'], ['A photo from Alusteel at HACE 2023.'], [EV.hace])
    },
    horeca: {
      2023: ed(2023, ['صورة من مشاركة الوستيل في معرض HORECA 2023.'], ['A photo from Alusteel at HORECA 2023.'], [EV.horeca])
    },
    iatf: {
      2018: ed(2018, ['صورة من مشاركة الوستيل في معرض IATF 2018.'], ['A photo from Alusteel at IATF 2018.'], [EV.iatf])
    }
  };
  var NAMES = { cafex: 'CAFEX', hace: 'HACE', horeca: 'HORECA', iatf: 'IATF' };
  function editionsFor(k) {
    var c = CONTENT[k] || {}, ys = (YEARS_BY[k] || YEARS).slice();
    Object.keys(c).forEach(function (y) { if (ys.indexOf(+y) < 0) ys.push(+y); });
    Object.keys(((window.EVENT_PHOTOS || {})[k]) || {}).forEach(function (y) { if (ys.indexOf(+y) < 0) ys.push(+y); });
    ys.sort(function (x, y) { return y - x; });
    return ys.map(function (y) {
      var photos = ((window.EVENT_PHOTOS || {})[k] || {})[y] || [];      /* from photos.js (make_photos.py) */
      var e = c[y] || ed(y, photos.length ? [] : SOON_AR, photos.length ? [] : SOON_EN, []);
      photos.forEach(function (u) { if (e.imgs.indexOf(u) < 0) e.imgs.push(u); });
      return e;
    });
  }
  var FAIRS = {};
  Object.keys(NAMES).forEach(function (k) { FAIRS[k] = { name: NAMES[k], editions: editionsFor(k) }; });
  var fair = FAIRS[id];

  if (!fair) {
    $('crumbs').innerHTML = S('المعارض', 'Events');
    $('head').innerHTML = T('h1', 'المعرض غير موجود', 'Event not found');
    $('body').innerHTML = '<a class="btn" href="index.html#events">' + S('كل المعارض', 'All events') + '</a>';
  } else {
    document.title = fair.name + ' | Alusteel';
    $('crumbs').innerHTML = '<a href="index.html">' + S('الرئيسية', 'Home') + '</a> / <a href="index.html#events">' + S('المعارض', 'Events') + '</a> / ' + fair.name;
    $('head').innerHTML =
      '<div class="ev-logo"><img src="images/events/' + id + '.png" alt="' + fair.name + '" onload="this.nextElementSibling.hidden=true" onerror="if(!this.dataset.t){this.dataset.t=1;this.src=\'' + id + '.png\'}else this.remove()"><span class="ev-fb" style="font-size:1.1rem">' + fair.name + '</span></div>' +
      '<h1>' + fair.name + '</h1>';

    var eds = fair.editions;
    function paras(b) { return b.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''); }
    function shots(list) {
      return list.length ? '<div class="shots">' + list.map(function (u) {
        return '<button type="button" data-src="' + esc(u) + '" aria-label="Zoom"><img src="' + esc(u) + '" alt="" loading="lazy" onerror="this.parentNode.remove()"></button>';
      }).join('') + '</div>' : '';
    }
    $('body').innerHTML =
      '<div class="chipnav">' + eds.map(function (e, i) { return '<a href="#ed' + i + '">' + S(esc(e.ar.t), esc(e.en.t)) + '</a>'; }).join('') + '</div>' +
      eds.map(function (e, i) {
        return '<article class="edition card" id="ed' + i + '">' + T('h2', esc(e.ar.t), esc(e.en.t)) +
          T('div', paras(e.ar.body), paras(e.en.body)) + shots(e.imgs) +
          (e.article != null ? '<a class="btn alt" href="article.html?id=' + e.article + '">' + S('اقرأ المقال', 'Read the article') + '</a>' : '') + '</article>';
      }).join('');

    var others = ['cafex', 'hace', 'horeca', 'iatf'].filter(function (k) { return k !== id; });
    $('others').innerHTML = T('h2', 'معارض أخرى', 'Other events') + '<div style="height:18px"></div><div class="chipnav">' +
      others.map(function (k) { return '<a href="event.html?id=' + k + '">' + FAIRS[k].name + '</a>'; }).join('') + '</div>' +
      '<a class="btn" href="contact.html">' + S('تواصل معنا', 'Contact us') + '</a>';

    /* click a photo to see it large */
    var lb = $('lb');
    $('body').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-src]'); if (!b) return;
      $('lbImg').src = b.getAttribute('data-src'); lb.hidden = false;
    });
    lb.addEventListener('click', function () { lb.hidden = true; $('lbImg').src = ''; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.hidden = true; });
  }

  $('footerBox').innerHTML =
    '<span>' + S('© 2026 الوستيل للتجارة والصناعة. جميع الحقوق محفوظة.', '© 2026 Alusteel for trade and industry. All rights reserved.') + '</span>' + window.socialLinks(D.social);

  function setLang(l) {
    root.lang = l; root.dir = l === 'ar' ? 'rtl' : 'ltr';
    $('lang').textContent = l === 'ar' ? 'EN' : 'عربي';
    try { localStorage.setItem('lang', l); } catch (e) {}
  }
  $('lang').addEventListener('click', function () { setLang(root.lang === 'ar' ? 'en' : 'ar'); });
  var saved = 'ar'; try { saved = localStorage.getItem('lang') || 'ar'; } catch (e) {}
  setLang(saved);
})();