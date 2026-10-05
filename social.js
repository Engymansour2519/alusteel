/* Social icons for the footer. Usage: window.socialLinks(D.social) */
(function () {
  'use strict';
  var F = 'fill="currentColor"', K = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    Facebook:  [F, '<path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.7V3.5c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.2H7.5V13h2.8v8h3.2z"/>'],
    Instagram: [K, '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>'],
    TikTok:    [F, '<path d="M16.5 3c.3 2.3 1.7 3.9 4 4.1v3.1c-1.5 0-2.9-.5-4-1.3v6.1c0 3.2-2.5 5.5-5.5 5.5S6 18.2 6 15.2c0-3.2 2.8-5.7 6.1-5.2v3.2c-1.6-.5-2.9.6-2.9 2 0 1.2.9 2.2 2.1 2.2 1.3 0 2.2-.9 2.2-2.4V3z"/>'],
    LinkedIn:  [F, '<circle cx="6.5" cy="6.5" r="1.9"/><rect x="4.9" y="9.5" width="3.2" height="10"/><path d="M10.3 9.5h3v1.4c.5-.9 1.6-1.7 3.2-1.7 3 0 3.6 2 3.6 4.6v5.7h-3.2v-5.2c0-1.3 0-2.7-1.7-2.7s-1.9 1.3-1.9 2.6v5.3h-3.2z"/>'],
    YouTube:   [F, '<path fill-rule="evenodd" d="M6.5 5.5h11a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4h-11a4 4 0 0 1-4-4v-5a4 4 0 0 1 4-4zM10 9v6l5.2-3z"/>'],
    X:         [K, '<path d="M5 4l14 16M19 4L5 20"/>']
  };
  window.socialLinks = function (social) {
    var html = Object.keys(social).filter(function (k) { return social[k] && ICONS[k]; }).map(function (k) {
      return '<a href="' + social[k] + '" target="_blank" rel="noopener" aria-label="' + k + '" title="' + k + '" class="si si-' + k.toLowerCase() + '">' +
             '<svg viewBox="0 0 24 24" width="18" height="18" ' + ICONS[k][0] + ' aria-hidden="true">' + ICONS[k][1] + '</svg></a>';
    }).join('');
    return '<span class="soc-i">' + html + '</span>';
  };
})();