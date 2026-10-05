(function () {
  'use strict';
  var D = window.SITE_DATA, C = D.contact;
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var S = function (ar, en) { return '<span data-l="ar">' + ar + '</span><span data-l="en">' + en + '</span>'; };

  /* Map: change MAP_QUERY to the exact place, or paste the "Embed a map" link
     from Google Maps (Share > Embed a map) into MAP_EMBED. */
  var MAP_QUERY = 'Obour City Industrial Area B/C Plot 22A Egypt';
  var MAP_EMBED = 'https://www.google.com/maps?q=' + encodeURIComponent(MAP_QUERY) + '&output=embed';
  $('mapFrame').src = MAP_EMBED;
  $('mapLink').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(MAP_QUERY);

  var wa = '2' + C.phones[0];
  $('info').innerHTML =
    '<div><h3>' + S('المصنع','Our factory') + '</h3><p>' + S('مدينة العبور، المنطقة الصناعية الثانية ب/ج، قطعة 22أ، بلوك 30000، أمام البوابة الجانبية لمصنع كريازي','Obour City, industrial area B/C, Plot 22 A, block 30000, next to Kraiazi') + '</p></div>' +
    '<div><h3>' + S('الهاتف','Phone') + '</h3><p dir="ltr">' + C.phones.join(' / ') + '<br>' + S('أرضي','Land-line') + ' ' + C.landline + ' · ' + S('فاكس','Fax') + ' ' + C.fax + '</p></div>' +
    '<div><h3>' + S('البريد الإلكتروني','Email') + '</h3><p>' + C.emails.map(function (m) { return '<a href="mailto:' + m + '">' + m + '</a>'; }).join('<br>') + '</p></div>';

  $('footerBox').innerHTML =
    '<span>' + S('© 2026 الوستيل للتجارة والصناعة. جميع الحقوق محفوظة.','© 2026 Alusteel for trade and industry. All rights reserved.') + '</span>' +
    '<span class="soc">' + Object.keys(D.social).filter(function (k) { return D.social[k]; }).map(function (k) { return '<a href="' + D.social[k] + '" target="_blank" rel="noopener">' + k + '</a>'; }).join('') + '</span>';

  function setLang(l) {
    root.lang = l; root.dir = l === 'ar' ? 'rtl' : 'ltr';
    $('lang').textContent = l === 'ar' ? 'EN' : 'عربي';
    document.querySelectorAll('[data-ph-ar]').forEach(function (i) {
      i.placeholder = i.getAttribute('data-ph-' + l); i.setAttribute('aria-label', i.placeholder);
    });
    try { localStorage.setItem('lang', l); } catch (e) {}
  }
  $('lang').addEventListener('click', function () { setLang(root.lang === 'ar' ? 'en' : 'ar'); });
  var saved = 'ar'; try { saved = localStorage.getItem('lang') || 'ar'; } catch (e) {}
  setLang(saved);

  /* form: WhatsApp or email, whichever button was pressed */
  var via = 'wa';
  document.querySelectorAll('[data-via]').forEach(function (b) { b.addEventListener('click', function () { via = b.getAttribute('data-via'); }); });
  $('f').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, ar = root.lang === 'ar';
    var msg = (ar ? 'الاسم: ' : 'Name: ') + f.n.value + '\n' + (ar ? 'الهاتف: ' : 'Phone: ') + f.p.value +
              (f.e.value ? '\n' + (ar ? 'البريد: ' : 'Email: ') + f.e.value : '') + '\n\n' + f.m.value;
    if (via === 'wa') window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    else location.href = 'mailto:' + C.emails[0] + '?subject=' + encodeURIComponent(ar ? 'طلب عرض سعر' : 'Quote request') + '&body=' + encodeURIComponent(msg);
    f.reset();
  });
})();