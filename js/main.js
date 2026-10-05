(function () {
  'use strict';
  var d = document, w = window;
  w.dataLayer = w.dataLayer || [];
  function track(name, params) {
    var o = { event: name }; for (var k in params) o[k] = params[k];
    w.dataLayer.push(o);
  }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }

  /* Menu mobile */
  var burger = d.querySelector('.burger'), nav = d.getElementById('nav');
  function closeNav() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

  /* Item ativo do menu */
  var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
  if ('IntersectionObserver' in w) {
    var sec = links.map(function (a) { return d.querySelector(a.getAttribute('href')); }).filter(Boolean);
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sec.forEach(function (s) { spy.observe(s); });

    /* Revelar ao rolar */
    var rv = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rv.unobserve(en.target); } });
    }, { threshold: .12 });
    [].forEach.call(d.querySelectorAll('.rv'), function (el) { rv.observe(el); });
  } else {
    [].forEach.call(d.querySelectorAll('.rv'), function (el) { el.classList.add('in'); });
  }

  /* Dialogs (cases e privacidade) */
  function openDlg(dlg) {
    if (!dlg) return;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    d.body.classList.add('lock');
  }
  function closeDlg(dlg) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); d.body.classList.remove('lock'); }
  d.addEventListener('click', function (e) {
    var c = e.target.closest('[data-case]');
    if (c) { openDlg(d.getElementById('case-' + c.dataset.case)); track('case_view', { case_name: c.dataset.case }); return; }
    if (e.target.closest('[data-privacy]')) { openDlg(d.getElementById('privacy')); return; }
    var x = e.target.closest('[data-close]');
    if (x) { closeDlg(x.closest('dialog')); return; }
    if (e.target.tagName === 'DIALOG') closeDlg(e.target); /* clique no fundo */

    /* Eventos de conversão */
    var a = e.target.closest('a');
    if (!a) return;
    if (a.hasAttribute('data-wa')) track('whatsapp_click', { section: a.dataset.wa });
    else if (a.hasAttribute('data-cv')) track('cv_download');
    else if (a.hasAttribute('data-mail')) track('email_click');
    else if (a.dataset.social) track('social_click', { network: a.dataset.social });
  });
  [].forEach.call(d.querySelectorAll('dialog'), function (dl) {
    dl.addEventListener('close', function () { d.body.classList.remove('lock'); });
  });

  /* Consentimento + Google Tag Manager (só carrega após aceite) */
  var box = d.getElementById('consent');
  function loadGTM() {
    if (w.__gtm) return; w.__gtm = 1;
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var s = d.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-5H2NS7RF';
    d.head.appendChild(s);
  }
  var choice = store('consent');
  if (choice === 'yes') loadGTM();
  else if (choice !== 'no') box.classList.add('show');
  box.addEventListener('click', function (e) {
    var b = e.target.closest('[data-consent]'); if (!b) return;
    store('consent', b.dataset.consent); box.classList.remove('show');
    if (b.dataset.consent === 'yes') loadGTM();
  });
  d.addEventListener('click', function (e) {
    if (e.target.closest('[data-consent-reset]')) {
      store('consent', null); closeDlg(d.getElementById('privacy')); box.classList.add('show');
    }
  });
})();
