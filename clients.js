(function () {
  'use strict';
  var D = window.SITE_DATA;
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var S = function (ar, en) { return '<span data-l="ar">' + ar + '</span><span data-l="en">' + en + '</span>'; };

  $('allLogos').innerHTML = D.logos.map(function (u) {
    return '<div class="logo-i"><img src="' + esc(u) + '" alt="" loading="lazy" onerror="this.parentNode.remove()"></div>';
  }).join('');

  $('footerBox').innerHTML =
    '<span>' + S('© 2026 الوستيل للتجارة والصناعة. جميع الحقوق محفوظة.', '© 2026 Alusteel for trade and industry. All rights reserved.') + '</span>' +
    window.socialLinks(D.social);

  function setLang(l) {
    root.lang = l; root.dir = l === 'ar' ? 'rtl' : 'ltr';
    $('lang').textContent = l === 'ar' ? 'EN' : 'عربي';
    try { localStorage.setItem('lang', l); } catch (e) {}
  }
  $('lang').addEventListener('click', function () { setLang(root.lang === 'ar' ? 'en' : 'ar'); });
  var saved = 'ar'; try { saved = localStorage.getItem('lang') || 'ar'; } catch (e) {}
  setLang(saved);
})();