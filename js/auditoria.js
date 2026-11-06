(function () {
  'use strict';
  var d = document, w = window;
  w.dataLayer = w.dataLayer || [];
  function track(name, params) { var o = { event: name }; for (var k in params) o[k] = params[k]; w.dataLayer.push(o); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }

  /* Menu mobile, WhatsApp, consentimento e GTM (igual ao restante do site) */
  var burger = d.querySelector('.burger'), nav = d.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () { var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
  }
  d.addEventListener('click', function (e) { var a = e.target.closest('a[data-wa]'); if (a) track('whatsapp_click', { section: a.dataset.wa, pagina: location.pathname }); });
  var box = d.getElementById('consent');
  if(box){var bp=box.querySelector('p');if(bp)bp.textContent='Uso cookies de medição (Google Tag Manager e Microsoft Clarity) para entender como o site é usado, incluindo mapas de calor e gravações anônimas de sessão. Você pode recusar sem perder nenhum conteúdo.'}
  function loadClarity(){if(w.__clr)return;w.__clr=1;(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(w,d,'clarity','script','z6lw4hqz32')}
  function loadGTM() {
    if (w.__gtm) return; w.__gtm = 1; loadClarity();
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var s = d.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-5H2NS7RF'; d.head.appendChild(s);
  }
  var choice = store('consent');
  if (choice === 'yes') loadGTM(); else if (choice !== 'no' && box) box.classList.add('show');
  if (box) box.addEventListener('click', function (e) {
    var b = e.target.closest('[data-consent]'); if (!b) return;
    store('consent', b.dataset.consent); box.classList.remove('show');
    if (b.dataset.consent === 'yes') loadGTM();
  });

  /* ---------- Quiz ---------- */
  var form = d.getElementById('quizform');
  if (!form) return;
  d.documentElement.classList.add('js');
  var secs = [].slice.call(form.querySelectorAll('.qsec'));
  var head = d.getElementById('qhead'), nav2 = d.getElementById('qnav');
  var steps = [].slice.call(d.querySelectorAll('#qsteps button'));
  var fill = d.getElementById('qfill'), count = d.getElementById('qcount');
  var prev = d.getElementById('qprev'), next = d.getElementById('qnext');
  var err = d.getElementById('qerr'), result = d.getElementById('result');
  var bar = d.querySelector('.qbar');
  var cur = 0, started = false, TOTAL = form.querySelectorAll('.q').length;
  head.hidden = false; nav2.hidden = false;

  function answered(q) { return !!q.querySelector('input:checked'); }
  function secDone(s) { return [].every.call(s.querySelectorAll('.q'), answered); }
  function updateProgress() {
    var n = form.querySelectorAll('.q input:checked').length;
    fill.style.width = (n / TOTAL * 100) + '%';
    bar.setAttribute('aria-valuenow', n);
    count.textContent = n + ' de ' + TOTAL + ' respondidas';
    steps.forEach(function (b, i) {
      b.classList.toggle('done', i !== cur && secDone(secs[i]));
      if (i === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
  }
  function show(i, scroll) {
    cur = i;
    secs.forEach(function (s, k) { s.hidden = k !== i; });
    prev.style.visibility = i === 0 ? 'hidden' : 'visible';
    next.textContent = i === secs.length - 1 ? 'Ver meu diagnóstico' : 'Próxima seção';
    err.hidden = true;
    updateProgress();
    if (scroll) { var t = d.getElementById('quiz'); if (t) w.scrollTo({ top: t.getBoundingClientRect().top + w.pageYOffset - 70, behavior: 'smooth' }); }
  }
  function missing(s) { return [].filter.call(s.querySelectorAll('.q'), function (q) { return !answered(q); }); }
  function flag(s) {
    var m = missing(s);
    [].forEach.call(s.querySelectorAll('.q'), function (q) { q.classList.toggle('miss', m.indexOf(q) > -1); });
    if (m.length) { err.hidden = false; m[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    return m.length === 0;
  }

  form.addEventListener('change', function (e) {
    var q = e.target.closest('.q'); if (q) q.classList.remove('miss');
    if (!started) { started = true; track('auditoria_iniciada', { pagina: location.pathname }); }
    if (secDone(secs[cur])) err.hidden = true;
    updateProgress();
  });
  next.addEventListener('click', function () {
    if (!flag(secs[cur])) return;
    if (cur < secs.length - 1) show(cur + 1, true); else finish();
  });
  prev.addEventListener('click', function () { if (cur > 0) show(cur - 1, true); });
  steps.forEach(function (b, i) {
    b.addEventListener('click', function () { if (i <= cur || secs.slice(0, i).every(secDone)) show(i, true); });
  });

  /* Pontuação: Sim=2, Em parte=1, Não e Não sei=0, Não se aplica sai da conta */
  function levelOf(s) {
    if (s < 40) return { c: 'bad', t: 'Atenção urgente', m: 'Há falhas importantes, principalmente na base da conta. Antes de aumentar a verba, vale corrigir as prioridades abaixo.' };
    if (s < 65) return { c: 'warn', t: 'Há bastante espaço para melhorar', m: 'A conta funciona, mas deve estar deixando resultado (e dinheiro) na mesa. As prioridades abaixo mostram por onde começar.' };
    if (s < 85) return { c: 'good', t: 'Boa base, faltam ajustes', m: 'Os fundamentos estão no lugar. Corrigir os pontos abaixo tende a melhorar custo e qualidade dos resultados.' };
    return { c: 'good', t: 'Conta bem cuidada', m: 'Poucos pontos de atenção. Mantenha a rotina de revisão e foque nos testes para continuar evoluindo.' };
  }
  function tone(p) { return p < 40 ? 'bad' : (p < 70 ? 'warn' : ''); }
  function el(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }

  function finish() {
    var items = [], secRes = [], gotAll = 0, maxAll = 0;
    secs.forEach(function (s) {
      var got = 0, max = 0;
      [].forEach.call(s.querySelectorAll('.q'), function (q) {
        var v = q.querySelector('input:checked').value;
        if (v === 'na') return;
        var wgt = +q.dataset.w, pts = v === 'x' ? 0 : +v;
        got += pts * wgt; max += 2 * wgt;
        if (pts < 2) items.push({ q: q.querySelector('.qt').textContent, fix: q.querySelector('template').content.textContent, loss: (2 - pts) * wgt, unknown: v === 'x', sec: s.querySelector('.qname').textContent, order: items.length });
      });
      gotAll += got; maxAll += max;
      secRes.push({ name: s.querySelector('.qname').textContent, pct: max ? Math.round(got / max * 100) : null });
    });
    var score = maxAll ? Math.round(gotAll / maxAll * 100) : 0, lv = levelOf(score);
    items.sort(function (a, b) { return b.loss - a.loss || a.order - b.order; });
    var top = items.slice(0, 5);

    result.textContent = '';
    var rt = el('div', 'rtop ' + lv.c);
    var ring = el('div', 'ring'); ring.style.setProperty('--p', score);
    ring.style.setProperty('--c', lv.c === 'bad' ? '#FF6B6B' : (lv.c === 'warn' ? '#F5B544' : '#3DDC84'));
    var inner = el('div'); inner.appendChild(el('b', '', String(score))); inner.appendChild(el('small', '', 'de 100')); ring.appendChild(inner);
    var tx = el('div'); tx.appendChild(el('h2', 'lvl', lv.t)); tx.appendChild(el('p', 'rtxt', lv.m));
    rt.appendChild(ring); rt.appendChild(tx); result.appendChild(rt);

    var s1 = el('div', 'rsec'); s1.appendChild(el('h3', '', 'Nota por área'));
    var bars = el('div', 'bars');
    secRes.forEach(function (s) {
      if (s.pct === null) return;
      var b = el('div', 'bar ' + tone(s.pct));
      var l = el('div', 'bl'); l.appendChild(el('span', '', s.name)); l.appendChild(el('span', '', s.pct + '%'));
      var t = el('div', 'bt'); var i = el('i'); i.style.width = s.pct + '%'; t.appendChild(i);
      b.appendChild(l); b.appendChild(t); bars.appendChild(b);
    });
    s1.appendChild(bars); result.appendChild(s1);

    var s2 = el('div', 'rsec');
    if (top.length) {
      s2.appendChild(el('h3', '', top.length === 1 ? 'Sua prioridade' : 'Suas ' + top.length + ' prioridades'));
      var ol = el('ol', 'prio');
      top.forEach(function (t) {
        var li = el('li');
        li.appendChild(el('span', 'ps', t.sec + (t.unknown ? ' · verificar' : '')));
        li.appendChild(el('p', 'pq', t.q));
        li.appendChild(el('p', 'pf', t.fix));
        ol.appendChild(li);
      });
      s2.appendChild(ol);
    } else {
      s2.appendChild(el('h3', '', 'Nenhum ponto de atenção'));
      var ok = el('div', 'okbox'); ok.appendChild(el('p', '', 'Você respondeu "Sim" em tudo. Vale confirmar com os números da conta, porque o checklist mostra as práticas, e não o resultado.')); s2.appendChild(ok);
    }
    result.appendChild(s2);

    var worst = secRes.filter(function (s) { return s.pct !== null; }).sort(function (a, b) { return a.pct - b.pct; }).slice(0, 2).map(function (s) { return s.name; });
    var msg = 'Olá Ana, fiz o checklist de auditoria do Google Ads e tirei ' + score + '/100 (' + lv.t + ').' + (worst.length && score < 85 ? ' Os pontos mais fracos foram: ' + worst.join(' e ') + '.' : '') + ' Gostaria de conversar sobre a minha conta.';
    var cta = el('div', 'rcta');
    cta.appendChild(el('h3', '', 'Quer uma segunda opinião sobre a sua conta?'));
    cta.appendChild(el('p', '', 'Me conte sobre a sua operação e a sua necessidade, e vamos trocar uma ideia.'));
    var acts = el('div', 'ractions');
    var wa = el('a', 'btn btn-primary', 'Conversar no WhatsApp');
    wa.href = 'https://wa.me/5562994141488?text=' + encodeURIComponent(msg); wa.target = '_blank'; wa.rel = 'noopener'; wa.setAttribute('data-wa', 'auditoria-resultado');
    var cp = el('button', 'btn btn-ghost', 'Copiar resultado'); cp.type = 'button';
    var pr = el('button', 'btn btn-ghost', 'Imprimir'); pr.type = 'button';
    var rs = el('button', 'btn btn-ghost', 'Refazer o checklist'); rs.type = 'button';
    acts.appendChild(wa); acts.appendChild(cp); acts.appendChild(pr); acts.appendChild(rs); cta.appendChild(acts);
    result.appendChild(cta);
    result.appendChild(el('p', 'rnote', 'Esta nota é uma autoavaliação baseada em boas práticas, e não uma avaliação oficial do Google. Ela mostra onde olhar primeiro, mas não substitui a análise da conta com os números reais de desempenho. Suas respostas ficam só no seu navegador.'));

    var summary = 'Auditoria de Google Ads: ' + score + '/100 (' + lv.t + ')\n' + secRes.filter(function (s) { return s.pct !== null; }).map(function (s) { return '- ' + s.name + ': ' + s.pct + '%'; }).join('\n') + (top.length ? '\n\nPrioridades:\n' + top.map(function (t, i) { return (i + 1) + '. ' + t.q; }).join('\n') : '') + '\n\nChecklist: https://anadomkt.com.br/auditoria-google-ads/';
    cp.addEventListener('click', function () {
      function ok() { cp.textContent = 'Copiado!'; setTimeout(function () { cp.textContent = 'Copiar resultado'; }, 2000); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(summary).then(ok, function () {});
    });
    pr.addEventListener('click', function () { w.print(); });
    rs.addEventListener('click', function () {
      form.reset(); [].forEach.call(form.querySelectorAll('.q'), function (q) { q.classList.remove('miss'); });
      result.hidden = true; form.hidden = false; head.hidden = false; started = false; show(0, true);
    });

    form.hidden = true; head.hidden = true; result.hidden = false;
    var t = d.getElementById('quiz'); if (t) w.scrollTo({ top: t.getBoundingClientRect().top + w.pageYOffset - 70, behavior: 'smooth' });
    result.focus({ preventScroll: true });
    track('auditoria_concluida', { nota: score, nivel: lv.t, pagina: location.pathname });
  }

  show(0, false);
})();
