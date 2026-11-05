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
  if(box){var bp=box.querySelector('p');if(bp)bp.textContent='Uso cookies de medição (Google Tag Manager e Microsoft Clarity) para entender como o site é usado, incluindo mapas de calor e gravações anônimas de sessão. Você pode recusar sem perder nenhum conteúdo.'}
  function loadClarity(){if(w.__clr)return;w.__clr=1;(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(w,d,'clarity','script','z6lw4hqz32')}
  function loadGTM() {
    if (w.__gtm) return; w.__gtm = 1; loadClarity();
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

  /* Carrossel de depoimentos */
  [].forEach.call(d.querySelectorAll('[data-car]'), function (car) {
    var tr = car.querySelector('.qtrack'), prev = car.querySelector('[data-dir="-1"]'), next = car.querySelector('[data-dir="1"]');
    if (!tr || !prev || !next) return;
    function step() { var q = tr.querySelector('.quote'); return q ? q.getBoundingClientRect().width + 16 : 0; }
    function sync() {
      prev.disabled = tr.scrollLeft <= 2;
      next.disabled = tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 2;
    }
    car.addEventListener('click', function (e) {
      var b = e.target.closest('.qbtn'); if (!b) return;
      tr.scrollBy({ left: Number(b.dataset.dir) * step(), behavior: 'smooth' });
      track('depoimentos_seta', { sentido: b.dataset.dir === '1' ? 'proximo' : 'anterior' });
    });
    /* Arrastar com o mouse (toque já rola nativamente) */
    var drag = null;
    tr.addEventListener('dragstart', function (e) { e.preventDefault(); });
    tr.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: tr.scrollLeft, moved: false };
    });
    w.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; tr.classList.add('dragging'); }
      if (drag.moved) tr.scrollLeft = drag.left - dx;
    });
    function endDrag() {
      if (!drag) return;
      var moved = drag.moved; drag = null;
      if (moved) { tr.classList.remove('dragging'); sync(); track('depoimentos_arrastar', {}); }
    }
    w.addEventListener('pointerup', endDrag);
    w.addEventListener('pointercancel', endDrag);
    tr.addEventListener('scroll', function () { w.requestAnimationFrame(sync); }, { passive: true });
    w.addEventListener('resize', sync);
    sync();
  });
})();

/* Contagem animada dos números da Trajetória */
(function () {
  var els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function run(el) {
    var end = parseFloat(el.getAttribute('data-count')), pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
    var dur = 1600, t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + Math.round(end * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (reduce || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (x) { if (x.isIntersecting) { run(x.target); io.unobserve(x.target); } });
  }, { threshold: 0.6 });
  els.forEach(function (el) {
    var pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
    el.textContent = pre + '0' + suf;
    io.observe(el);
  });
})();
