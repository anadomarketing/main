/* Calculadora de KPIs — Ana D'avilla
   Sem dependências. Todo o cálculo acontece no navegador; nada é enviado a servidor. */
(function (root) {
  'use strict';

  /* ---------- Leitura e formatação de números (pt-BR) ---------- */
  function num(s) {
    if (s === null || s === undefined) return null;
    s = String(s).trim().replace(/[R$\s%x]/gi, '');
    if (s === '') return null;
    if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    if (!/^\d*\.?\d+$|^\d+\.$/.test(s)) return NaN;
    var n = Number(s);
    return isFinite(n) ? n : NaN;
  }
  function fmt(n, d) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function pct(n, d) { return fmt(n, d === undefined ? 2 : d) + '%'; }
  function brl(n) { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function xx(n) { return fmt(n, 2) + 'x'; }
  function n1(n) { return fmt(n, n >= 100 ? 0 : 1); }
  function zero(nome) { return { error: 'O campo "' + nome + '" precisa ser maior que zero.' }; }
  function has(v) { return v !== null && v !== undefined; }

  /* ---------- Fórmulas ----------
     need: campos obrigatórios | run(v): devolve { value, lines[], tone } ou { error } */
  var F = {
    ctr: {
      need: ['clicks', 'imp'],
      run: function (v) {
        if (v.imp === 0) return zero('Impressões');
        if (v.clicks > v.imp) return { error: 'Cliques não podem ser maiores que as impressões.' };
        var r = v.clicks / v.imp * 100;
        return { value: pct(r), lines: ['A cada 1.000 impressões, cerca de ' + n1(r * 10) + ' pessoas clicaram.'] };
      }
    },
    cpm: {
      need: ['spend', 'imp'],
      run: function (v) {
        if (v.imp === 0) return zero('Impressões');
        var r = v.spend / v.imp * 1000;
        return { value: brl(r), lines: ['É quanto você paga para o anúncio aparecer 1.000 vezes.'] };
      }
    },
    freq: {
      need: ['imp', 'reach'],
      run: function (v) {
        if (v.reach === 0) return zero('Alcance');
        if (v.imp < v.reach) return { error: 'As impressões não podem ser menores que o alcance.' };
        var r = v.imp / v.reach;
        var out = { value: xx(r), lines: ['Em média, cada pessoa viu o anúncio ' + fmt(r, 1) + ' vez(es).'] };
        if (r >= 4) { out.tone = 'warn'; out.lines.push('Frequência alta: observe se o CTR está caindo ou o CPM subindo (sinais de saturação).'); }
        return out;
      }
    },
    cpc: {
      need: ['spend', 'clicks'],
      run: function (v) {
        if (v.clicks === 0) return zero('Cliques');
        var r = v.spend / v.clicks;
        return { value: brl(r), lines: ['Com R$ 1.000 você compraria cerca de ' + fmt(1000 / r, 0) + ' cliques a esse custo.'] };
      }
    },
    bounce: {
      need: ['sess', 'nonEng'],
      run: function (v) {
        if (v.sess === 0) return zero('Total de sessões');
        if (v.nonEng > v.sess) return { error: 'As sessões sem engajamento não podem passar do total de sessões.' };
        var r = v.nonEng / v.sess * 100;
        return { value: pct(r), lines: ['Taxa de engajamento (o inverso): ' + pct(100 - r) + '.'] };
      }
    },
    conv: {
      need: ['conv', 'visits'],
      run: function (v) {
        if (v.visits === 0) return zero('Visitas, cliques ou leads');
        if (v.conv > v.visits) return { error: 'As conversões não podem ser maiores que a base (visitas, cliques ou leads).' };
        var r = v.conv / v.visits * 100;
        return { value: pct(r), lines: ['A cada 100 pessoas, cerca de ' + n1(r) + ' convertem.'] };
      }
    },
    cpl: {
      need: ['spend', 'leads'],
      run: function (v) {
        if (v.leads === 0) return zero('Leads gerados');
        var r = v.spend / v.leads;
        var out = { value: brl(r), lines: [] };
        if (has(v.qual)) {
          if (v.qual > v.leads) return { error: 'Os leads qualificados não podem passar do total de leads.' };
          if (v.qual === 0) { out.tone = 'bad'; out.lines.push('Nenhum lead qualificado no período: o CPL baixo não está virando oportunidade.'); }
          else {
            out.lines.push('Custo por lead qualificado: ' + brl(v.spend / v.qual) + '.');
            out.lines.push('Taxa de qualificação: ' + pct(v.qual / v.leads * 100, 1) + '.');
          }
        } else out.lines.push('Informe os leads qualificados para ver o custo do lead que realmente importa.');
        return out;
      }
    },
    cpa: {
      need: ['spend', 'conv'],
      run: function (v) {
        if (v.conv === 0) return zero('Conversões');
        var r = v.spend / v.conv;
        var out = { value: brl(r), lines: [] };
        if (has(v.profit)) {
          var d = v.profit - r;
          if (d > 0) { out.tone = 'good'; out.lines.push('Sobram ' + brl(d) + ' por conversão depois de pagar a mídia.'); }
          else if (d === 0) { out.tone = 'warn'; out.lines.push('Empate: a mídia consome todo o lucro da venda.'); }
          else { out.tone = 'bad'; out.lines.push('Prejuízo de ' + brl(-d) + ' por conversão: o CPA passou do lucro da venda.'); }
        } else out.lines.push('Informe o lucro por venda para saber se esse CPA é sustentável.');
        return out;
      }
    },
    roas: {
      need: ['rev', 'inv'],
      run: function (v) {
        if (v.inv === 0) return zero('Investimento em anúncios');
        var r = v.rev / v.inv;
        var out = { value: xx(r), lines: ['Cada R$ 1 investido em anúncios gerou ' + brl(r) + ' em receita.'] };
        if (has(v.margin)) {
          if (v.margin <= 0 || v.margin > 100) return { error: 'A margem bruta deve estar entre 0 e 100%.' };
          var be = 100 / v.margin;
          out.lines.push('ROAS de equilíbrio com essa margem: ' + xx(be) + '.');
          if (r > be) { out.tone = 'good'; out.lines.push('Acima do equilíbrio: a campanha paga a mídia e ainda deixa margem.'); }
          else if (r === be) { out.tone = 'warn'; out.lines.push('Exatamente no equilíbrio: a margem cobre só a mídia.'); }
          else { out.tone = 'bad'; out.lines.push('Abaixo do equilíbrio: a margem não cobre o custo da mídia.'); }
        } else out.lines.push('Informe a margem bruta para ver o ROAS mínimo para não ter prejuízo.');
        return out;
      }
    },
    roi: {
      need: ['rev', 'inv'],
      run: function (v) {
        var cost = v.inv + (has(v.other) ? v.other : 0);
        if (cost === 0) return zero('Investimento em mídia');
        var r = (v.rev - cost) / cost * 100;
        var out = { value: pct(r, 1), lines: ['Lucro: ' + brl(v.rev - cost) + ' sobre um custo de ' + brl(cost) + '.'] };
        out.tone = r > 0 ? 'good' : (r === 0 ? 'warn' : 'bad');
        out.lines.push(r > 0 ? 'Para cada R$ 1 gasto, voltaram R$ ' + fmt(v.rev / cost, 2) + '.' : 'O retorno não cobriu o investimento.');
        return out;
      }
    },
    eng: {
      need: ['base'],
      run: function (v) {
        var sum = (v.likes || 0) + (v.comments || 0) + (v.shares || 0) + (v.saves || 0);
        if (!has(v.likes) && !has(v.comments) && !has(v.shares) && !has(v.saves)) return null;
        if (v.base === 0) return zero('Base do cálculo');
        var nome = { alcance: 'alcance', seguidores: 'seguidores', impressoes: 'impressões' }[v.basis] || 'alcance';
        var r = sum / v.base * 100;
        return { value: pct(r), lines: ['Total de interações: ' + fmt(sum, 0) + ' sobre ' + fmt(v.base, 0) + ' (' + nome + ').', 'Compare só com resultados calculados sobre a mesma base.'] };
      }
    },
    cac: {
      need: ['inv', 'cust'],
      run: function (v) {
        if (v.cust === 0) return zero('Novos clientes');
        var r = v.inv / v.cust;
        return { value: brl(r), lines: ['Cada novo cliente custou ' + brl(r) + ' para ser conquistado.'] };
      }
    },
    ltv: {
      need: ['ticket', 'freq', 'years'],
      run: function (v) {
        var r = v.ticket * v.freq * v.years;
        var out = { value: brl(r), lines: [fmt(v.freq * v.years, 1) + ' compras de ' + brl(v.ticket) + ' ao longo da relação.'] };
        if (has(v.margin)) {
          if (v.margin <= 0 || v.margin > 100) return { error: 'A margem bruta deve estar entre 0 e 100%.' };
          out.lines.push('LTV sobre a margem (mais realista para comparar com o CAC): ' + brl(r * v.margin / 100) + '.');
        }
        return out;
      }
    },
    ltvcac: {
      need: ['ltv', 'cac'],
      run: function (v) {
        if (v.cac === 0) return zero('CAC');
        var r = v.ltv / v.cac;
        var out = { value: xx(r), lines: ['Cada R$ 1 gasto para conquistar um cliente retorna ' + brl(r) + ' ao longo da relação.'] };
        if (r < 1) { out.tone = 'bad'; out.lines.push('Abaixo de 1x: o cliente não paga o próprio custo de aquisição.'); }
        else if (r < 3) { out.tone = 'warn'; out.lines.push('Positivo, mas abaixo da regra prática de 3x. Vale melhorar retenção, ticket ou custo de aquisição.'); }
        else { out.tone = 'good'; out.lines.push('Na faixa de 3x ou mais, regra prática usada para indicar um modelo saudável.'); }
        return out;
      }
    }
  };

  var api = { F: F, num: num, fmt: fmt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  /* ---------- Interface ---------- */
  var d = document, w = window;
  w.dataLayer = w.dataLayer || [];
  function track(name, params) { var o = { event: name }; for (var k in params) o[k] = params[k]; w.dataLayer.push(o); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }

  /* Menu mobile */
  var burger = d.querySelector('.burger'), nav = d.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
  }

  /* WhatsApp + consentimento + GTM (igual ao restante do site) */
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-wa]');
    if (a) track('whatsapp_click', { section: a.dataset.wa, pagina: location.pathname });
  });
  var box = d.getElementById('consent');
  function loadGTM() {
    if (w.__gtm) return; w.__gtm = 1;
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var s = d.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-5H2NS7RF'; d.head.appendChild(s);
  }
  var choice = store('consent');
  if (choice === 'yes') loadGTM(); else if (choice !== 'no' && box) box.classList.add('show');
  if (box) box.addEventListener('click', function (e) {
    var b = e.target.closest('[data-consent]'); if (!b) return;
    store('consent', b.dataset.consent); box.classList.remove('show');
    if (b.dataset.consent === 'yes') loadGTM();
  });

  /* Calculadoras */
  var fired = {};
  function read(form) {
    var v = {}, bad = false;
    [].forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.tagName === 'SELECT') { v[el.name] = el.value; return; }
      var n = num(el.value);
      if (n !== null && isNaN(n)) { bad = true; el.setAttribute('aria-invalid', 'true'); } else el.removeAttribute('aria-invalid');
      v[el.name] = n;
    });
    return { v: v, bad: bad };
  }
  function paint(form, state, value, lines, tone) {
    var out = form.querySelector('.out');
    out.className = 'out ' + state + (tone ? ' ' + tone : '');
    out.querySelector('.val').textContent = value;
    var ul = out.querySelector('.lines'); ul.textContent = '';
    (lines || []).forEach(function (t) { var li = d.createElement('li'); li.textContent = t; ul.appendChild(li); });
  }
  function calc(form) {
    var key = form.dataset.kpi, def = F[key], r = read(form);
    if (r.bad) return paint(form, 'err', 'Confira os números', ['Digite apenas números positivos. Use vírgula para decimais (ex.: 1,5).']);
    var ready = def.need.every(function (n) { return has(r.v[n]); });
    if (!ready) return paint(form, 'empty', 'Preencha os campos', []);
    var res = def.run(r.v);
    if (!res) return paint(form, 'empty', 'Preencha os campos', []);
    if (res.error) return paint(form, 'err', 'Confira os números', [res.error]);
    paint(form, 'ok', res.value, res.lines, res.tone);
    if (!fired[key]) { fired[key] = 1; track('kpi_calculado', { kpi: key, pagina: location.pathname }); }
  }
  function toStr(n) { return typeof n === 'number' ? n.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : String(n); }

  [].forEach.call(d.querySelectorAll('form.calc'), function (form) {
    form.addEventListener('input', function () { calc(form); });
    form.addEventListener('change', function (e) {
      if (e.target.name === 'basis') {
        var lb = form.querySelector('[data-baselabel]');
        if (lb) lb.textContent = { alcance: 'Alcance do período', seguidores: 'Seguidores', impressoes: 'Impressões do período' }[e.target.value] || 'Alcance do período';
      }
      calc(form);
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); calc(form); });
    form.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'clear') {
        form.reset();
        var lb = form.querySelector('[data-baselabel]'); if (lb) lb.textContent = 'Alcance do período';
        [].forEach.call(form.elements, function (el) { el.removeAttribute('aria-invalid'); });
      }
      if (b.dataset.act === 'ex') {
        var ex = {}; try { ex = JSON.parse(form.dataset.ex || '{}'); } catch (err) {}
        form.reset();
        Object.keys(ex).forEach(function (k) { if (form.elements[k]) form.elements[k].value = toStr(ex[k]); });
        var sel = form.elements.basis; if (sel) sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      calc(form);
    });
  });

  /* Filtro por perfil */
  var btns = [].slice.call(d.querySelectorAll('.filters button')), cards = [].slice.call(d.querySelectorAll('.kpi'));
  var cnt = d.getElementById('fcount'), desc = d.getElementById('fdesc');
  function setFilter(f, push) {
    var shown = 0;
    btns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.filter === f ? 'true' : 'false'); if (b.dataset.filter === f && desc) desc.textContent = b.dataset.desc; });
    cards.forEach(function (c) {
      var ok = f === 'todos' || (' ' + c.dataset.cat + ' ').indexOf(' ' + f + ' ') > -1;
      c.hidden = !ok; if (ok) shown++;
    });
    if (cnt) cnt.textContent = 'Mostrando ' + shown + ' de ' + cards.length + ' indicadores';
    if (typeof syncToggle === 'function') syncToggle();
    if (push) {
      try { history.replaceState(null, '', f === 'todos' ? location.pathname : '?perfil=' + f); } catch (e) {}
      track('kpi_filtro', { perfil: f, pagina: location.pathname });
    }
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { setFilter(b.dataset.filter, true); }); });
  /* Expandir / recolher todos (somente os visíveis) */
  var tgl = d.getElementById('toggleAll');
  function syncToggle() {
    var vis = cards.filter(function (c) { return !c.hidden; });
    var all = vis.length > 0 && vis.every(function (c) { return c.open; });
    if (tgl) { tgl.textContent = all ? 'Recolher todos' : 'Expandir todos'; tgl.setAttribute('aria-pressed', all ? 'true' : 'false'); }
  }
  if (tgl) tgl.addEventListener('click', function () {
    var open = tgl.getAttribute('aria-pressed') !== 'true';
    cards.forEach(function (c) { if (!c.hidden) c.open = open; });
    syncToggle();
  });
  cards.forEach(function (c) {
    c.addEventListener('toggle', function () {
      syncToggle();
      if (c.open) track('kpi_aberto', { kpi: c.id, pagina: location.pathname });
    });
  });
  var p = 'todos';
  try { p = new URLSearchParams(location.search).get('perfil') || 'todos'; } catch (e) {}
  if (!btns.some(function (b) { return b.dataset.filter === p; })) p = 'todos';
  setFilter(p, false);
  syncToggle();
  var hid = (location.hash || '').slice(1), tg = hid && d.getElementById(hid);
  if (tg && tg.classList.contains('kpi')) { tg.hidden = false; tg.open = true; setTimeout(function () { tg.scrollIntoView(); }, 50); }
})(this);
