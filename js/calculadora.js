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
  function brlp(n, d) { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: d, maximumFractionDigits: d }); }
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
    /* ---------- Trade marketing ---------- */
    osa: {
      need: ['items', 'avail'],
      run: function (v) {
        if (v.items === 0) return zero('Itens auditados');
        if (v.avail > v.items) return { error: 'Os itens disponíveis não podem passar dos itens auditados.' };
        var r = v.avail / v.items * 100;
        return { value: pct(r), lines: ['Ruptura equivalente: ' + pct(100 - r) + ' dos itens estavam faltando na gôndola.', fmt(v.items - v.avail, 0) + ' de ' + fmt(v.items, 0) + ' itens sem disponibilidade.'] };
      }
    },
    ruptura: {
      need: ['audit', 'out'],
      run: function (v) {
        if (v.audit === 0) return zero('Itens auditados');
        if (v.out > v.audit) return { error: 'Os itens em ruptura não podem passar dos itens auditados.' };
        var r = v.out / v.audit * 100;
        var out = { value: pct(r), lines: ['OSA equivalente: ' + pct(100 - r) + '.'] };
        if (has(v.daily) && has(v.days)) {
          out.lines.push('Venda perdida estimada: ' + brl(v.out * v.daily * v.days) + ' (' + fmt(v.out, 0) + ' itens x ' + brl(v.daily) + ' por dia x ' + fmt(v.days, 0) + ' dia(s)).');
        } else out.lines.push('Informe a venda média diária por item e os dias em ruptura para estimar a venda perdida.');
        return out;
      }
    },
    mshare: {
      need: ['brand', 'market'],
      run: function (v) {
        if (v.market === 0) return zero('Vendas do mercado');
        if (v.brand > v.market) return { error: 'As vendas da marca não podem passar das vendas do mercado.' };
        var r = v.brand / v.market * 100;
        var out = { value: pct(r), lines: ['Cada R$ 100 vendidos na categoria, R$ ' + fmt(r, 2) + ' foram da sua marca.'] };
        if (has(v.prev)) {
          var d = r - v.prev;
          out.tone = d > 0 ? 'good' : (d < 0 ? 'bad' : 'warn');
          out.lines.push((d > 0 ? 'Ganho' : (d < 0 ? 'Perda' : 'Sem variação')) + ' de ' + fmt(Math.abs(d), 2) + ' ponto(s) percentual(is) frente ao período anterior.');
        } else out.lines.push('Informe o share do período anterior para ver se a marca ganhou ou perdeu espaço.');
        return out;
      }
    },
    shelf: {
      need: ['fac', 'total'],
      run: function (v) {
        if (v.total === 0) return zero('Total de frentes da categoria');
        if (v.fac > v.total) return { error: 'As frentes da marca não podem passar do total da categoria.' };
        var r = v.fac / v.total * 100;
        var out = { value: pct(r), lines: [fmt(v.fac, 0) + ' de ' + fmt(v.total, 0) + ' frentes na gôndola são da marca.'] };
        if (has(v.ms)) {
          var d = r - v.ms;
          if (d >= 0) { out.tone = 'good'; out.lines.push('Gôndola ' + fmt(d, 2) + ' p.p. acima do market share: espaço proporcional ou maior que a venda.'); }
          else { out.tone = 'warn'; out.lines.push('Gôndola ' + fmt(-d, 2) + ' p.p. abaixo do market share: pode haver espaço a negociar.'); }
        } else out.lines.push('Informe o market share para comparar o espaço de gôndola com a venda da marca.');
        return out;
      }
    },
    dist: {
      need: ['pdv', 'universe'],
      run: function (v) {
        if (v.universe === 0) return zero('Total de PDVs do universo');
        if (v.pdv > v.universe) return { error: 'Os PDVs com a marca não podem passar do universo.' };
        var r = v.pdv / v.universe * 100;
        return { value: pct(r), lines: ['A marca está presente em ' + fmt(v.pdv, 0) + ' de ' + fmt(v.universe, 0) + ' PDVs.', 'Oportunidade: ' + fmt(v.universe - v.pdv, 0) + ' PDVs do universo ainda não vendem a marca.'] };
      }
    },
    mpdv: {
      need: ['done', 'planned'],
      run: function (v) {
        if (v.planned === 0) return zero('PDVs planejados');
        if (v.done > v.planned) return { error: 'Os PDVs executados não podem passar dos planejados.' };
        var r = v.done / v.planned * 100;
        var out = { value: pct(r), lines: [fmt(v.planned - v.done, 0) + ' PDV(s) planejado(s) ficaram sem o material.'] };
        if (has(v.inv) && v.done > 0) out.lines.push('Custo por PDV executado: ' + brl(v.inv / v.done) + '.');
        return out;
      }
    },
    visitas: {
      need: ['done', 'planned'],
      run: function (v) {
        if (v.planned === 0) return zero('Visitas planejadas');
        var r = v.done / v.planned * 100;
        var out = { value: pct(r), lines: [fmt(v.done, 0) + ' de ' + fmt(v.planned, 0) + ' visitas planejadas foram realizadas.'] };
        if (v.done < v.planned) out.lines.push('Faltaram ' + fmt(v.planned - v.done, 0) + ' visita(s) para cumprir o roteiro.');
        if (has(v.days) && has(v.promo) && v.days > 0 && v.promo > 0) out.lines.push('Produtividade: ' + fmt(v.done / (v.days * v.promo), 1) + ' visita(s) por pessoa por dia.');
        return out;
      }
    },
    sellout: {
      need: ['units', 'price'],
      run: function (v) {
        var r = v.units * v.price;
        var out = { value: brl(r), lines: [fmt(v.units, 0) + ' unidade(s) vendida(s) ao consumidor final no ponto de venda.'] };
        if (has(v.sellin)) {
          if (v.sellin === 0) return zero('Sell-in');
          var st = v.units / v.sellin * 100;
          out.lines.push('Sell-through: ' + pct(st, 1) + ' do que foi enviado ao varejo já foi vendido ao consumidor.');
        } else out.lines.push('Informe o sell-in (vendas ao varejo) para calcular o sell-through.');
        return out;
      }
    },
    elast: {
      need: ['p0', 'p1', 'q0', 'q1'],
      run: function (v) {
        if (v.p0 === 0 || v.q0 === 0) return { error: 'Preço antes e quantidade antes precisam ser maiores que zero.' };
        var dp = (v.p1 - v.p0) / v.p0 * 100, dq = (v.q1 - v.q0) / v.q0 * 100;
        if (dp === 0) return { error: 'O preço precisa mudar para calcular a elasticidade.' };
        var e = dq / dp;
        var out = { value: fmt(e, 2), lines: ['Preço variou ' + pct(dp, 1) + ' e a quantidade vendida variou ' + pct(dq, 1) + '.'] };
        var a = Math.abs(e);
        out.lines.push(a > 1 ? 'Demanda elástica (|e| > 1): o consumidor reage forte ao preço.' : (a === 1 ? 'Elasticidade unitária: receita praticamente estável.' : 'Demanda inelástica (|e| < 1): o consumidor reage pouco ao preço.'));
        out.lines.push('Receita: ' + brl(v.p0 * v.q0) + ' antes e ' + brl(v.p1 * v.q1) + ' depois.');
        return out;
      }
    },
    lift: {
      need: ['base', 'promo'],
      run: function (v) {
        if (v.base === 0) return zero('Vendas sem promoção');
        var inc = v.promo - v.base, r = inc / v.base * 100;
        var out = { value: pct(r, 1), tone: r > 0 ? 'good' : (r === 0 ? 'warn' : 'bad'), lines: ['Venda incremental: ' + fmt(inc, 0) + ' (promoção ' + (inc >= 0 ? 'acima' : 'abaixo') + ' da base).'] };
        if (has(v.cost) && inc > 0) out.lines.push('Custo por unidade incremental: ' + brl(v.cost / inc) + ' (use vendas em unidades).');
        return out;
      }
    },
    /* ---------- Tráfego e social media ---------- */
    cpv: {
      need: ['spend', 'views'],
      run: function (v) {
        if (v.views === 0) return zero('Visualizações');
        var r = v.spend / v.views;
        return { value: brlp(r, 3), lines: ['A cada mil visualizações você paga ' + brl(r * 1000) + '.'] };
      }
    },
    vtr: {
      need: ['views', 'imp'],
      run: function (v) {
        if (v.imp === 0) return zero('Impressões');
        if (v.views > v.imp) return { error: 'As visualizações não podem passar das impressões.' };
        var r = v.views / v.imp * 100;
        return { value: pct(r), lines: [fmt(v.views, 0) + ' visualizações em ' + fmt(v.imp, 0) + ' impressões do vídeo.', 'Compare sempre com o mesmo critério de visualização (por exemplo, 3 segundos ou 15 segundos).'] };
      }
    },
    cpi: {
      need: ['spend', 'installs'],
      run: function (v) {
        if (v.installs === 0) return zero('Instalações');
        return { value: brl(v.spend / v.installs), lines: [fmt(v.installs, 0) + ' instalações com ' + brl(v.spend) + ' investidos.'] };
      }
    },
    alcance: {
      need: ['reach', 'followers'],
      run: function (v) {
        if (v.followers === 0) return zero('Seguidores');
        var r = v.reach / v.followers * 100;
        var out = { value: pct(r), lines: [fmt(v.reach, 0) + ' pessoas alcançadas para ' + fmt(v.followers, 0) + ' seguidores.'] };
        if (r > 100) out.lines.push('Acima de 100%: o conteúdo chegou a mais gente do que a sua base, ou seja, também a quem não segue.');
        return out;
      }
    },
    cresc: {
      need: ['start', 'end'],
      run: function (v) {
        if (v.start === 0) return zero('Seguidores no início');
        var d = v.end - v.start, r = d / v.start * 100;
        var out = { value: pct(r), tone: d > 0 ? 'good' : (d < 0 ? 'bad' : 'warn'), lines: ['Saldo de ' + (d >= 0 ? '+' : '-') + fmt(Math.abs(d), 0) + ' seguidores no período.'] };
        if (has(v.months) && v.months > 0) out.lines.push('Crescimento médio de ' + pct((Math.pow(v.end / v.start, 1 / v.months) - 1) * 100) + ' ao mês.');
        return out;
      }
    },
    sov: {
      need: ['brand', 'total'],
      run: function (v) {
        if (v.total === 0) return zero('Total de menções');
        if (v.brand > v.total) return { error: 'As menções da marca não podem passar do total do mercado.' };
        var r = v.brand / v.total * 100;
        var out = { value: pct(r), lines: ['De cada 100 menções ao setor, ' + fmt(r, 1) + ' são da sua marca.'] };
        if (has(v.ms)) {
          if (r >= v.ms) { out.tone = 'good'; out.lines.push('Share of voice acima do market share: regra prática que costuma anteceder ganho de participação.'); }
          else { out.tone = 'warn'; out.lines.push('Share of voice abaixo do market share: a marca fala menos do que vende e pode perder espaço.'); }
        } else out.lines.push('Informe o market share para comparar a voz da marca com a venda.');
        return out;
      }
    },
    resp: {
      need: ['answered', 'received'],
      run: function (v) {
        if (v.received === 0) return zero('Mensagens recebidas');
        if (v.answered > v.received) return { error: 'As mensagens respondidas não podem passar das recebidas.' };
        var r = v.answered / v.received * 100;
        return { value: pct(r), lines: [fmt(v.received - v.answered, 0) + ' mensagem(ns) ficaram sem resposta.'] };
      }
    },
    /* ---------- Vendas ---------- */
    ticket: {
      need: ['revenue', 'orders'],
      run: function (v) {
        if (v.orders === 0) return zero('Número de pedidos');
        return { value: brl(v.revenue / v.orders), lines: [brl(v.revenue) + ' em ' + fmt(v.orders, 0) + ' pedido(s).'] };
      }
    },
    recompra: {
      need: ['repeat', 'total'],
      run: function (v) {
        if (v.total === 0) return zero('Total de clientes');
        if (v.repeat > v.total) return { error: 'Os clientes que recompraram não podem passar do total de clientes.' };
        var r = v.repeat / v.total * 100;
        return { value: pct(r), lines: [fmt(v.repeat, 0) + ' de ' + fmt(v.total, 0) + ' clientes compraram mais de uma vez.'] };
      }
    },
    churn: {
      need: ['lost', 'start'],
      run: function (v) {
        if (v.start === 0) return zero('Clientes no início');
        if (v.lost > v.start) return { error: 'Os clientes perdidos não podem passar dos clientes do início do período.' };
        var r = v.lost / v.start * 100;
        var out = { value: pct(r), lines: ['Retenção no período: ' + pct(100 - r) + '.'] };
        if (r > 0) out.lines.push('Se esse churn for mensal, o cliente permanece em média ' + fmt(100 / r, 1) + ' mês(es).');
        return out;
      }
    },
    mrr: {
      need: ['customers', 'arpu'],
      run: function (v) {
        var r = v.customers * v.arpu;
        var out = { value: brl(r), lines: ['Receita anualizada (ARR): ' + brl(r * 12) + '.'] };
        if (has(v.churn)) out.lines.push('Com churn de ' + pct(v.churn) + ' ao mês, a receita em risco é de ' + brl(r * v.churn / 100) + ' por mês.');
        return out;
      }
    },
    payback: {
      need: ['cac', 'arpu'],
      run: function (v) {
        var m = has(v.margin) ? v.margin : 100;
        if (v.arpu === 0 || m === 0) return { error: 'A receita mensal por cliente e a margem precisam ser maiores que zero.' };
        if (m > 100) return { error: 'A margem não pode passar de 100%.' };
        var r = v.cac / (v.arpu * m / 100);
        var out = { value: fmt(r, 1) + ' meses', lines: ['Cada cliente devolve ' + brl(v.arpu * m / 100) + ' por mês de ' + (has(v.margin) ? 'lucro bruto' : 'receita') + '.'] };
        if (r <= 12) { out.tone = 'good'; out.lines.push('Até 12 meses: referência comum para considerar o retorno saudável em negócios recorrentes.'); }
        else if (r <= 18) { out.tone = 'warn'; out.lines.push('Entre 12 e 18 meses: exige caixa para sustentar o crescimento.'); }
        else { out.tone = 'bad'; out.lines.push('Acima de 18 meses: o custo de aquisição demora a se pagar.'); }
        return out;
      }
    },
    fechamento: {
      need: ['won', 'opps'],
      run: function (v) {
        if (v.opps === 0) return zero('Oportunidades');
        if (v.won > v.opps) return { error: 'As vendas fechadas não podem passar das oportunidades.' };
        var out = { value: pct(v.won / v.opps * 100), lines: [fmt(v.won, 0) + ' venda(s) de ' + fmt(v.opps, 0) + ' oportunidades.'] };
        if (has(v.leads) && v.leads > 0) {
          if (v.opps > v.leads) return { error: 'As oportunidades não podem passar do total de leads.' };
          out.lines.push('Do lead à venda: ' + pct(v.won / v.leads * 100) + ' (' + fmt(v.leads, 0) + ' leads).');
        }
        return out;
      }
    },
    /* ---------- Trade marketing (extras) ---------- */
    distw: {
      need: ['withb', 'total'],
      run: function (v) {
        if (v.total === 0) return zero('Venda total da categoria');
        if (v.withb > v.total) return { error: 'A venda dos PDVs com a marca não pode passar da venda total da categoria.' };
        var r = v.withb / v.total * 100;
        return { value: pct(r), lines: ['Os PDVs que vendem a marca respondem por ' + pct(r, 1) + ' da venda da categoria no universo.', 'Compare com a distribuição numérica: se a ponderada for maior, a marca está nas lojas mais importantes.'] };
      }
    },
    sellthru: {
      need: ['sold', 'received'],
      run: function (v) {
        if (v.received === 0) return zero('Unidades recebidas');
        var r = v.sold / v.received * 100;
        var out = { value: pct(r, 1), lines: [fmt(v.sold, 0) + ' vendidas de ' + fmt(v.received, 0) + ' recebidas pelo varejo.'] };
        if (r > 100) out.lines.push('Acima de 100%: o varejo vendeu também estoque anterior ao período.');
        return out;
      }
    },
    giro: {
      need: ['sales', 'stock'],
      run: function (v) {
        if (v.stock === 0) return zero('Estoque médio');
        var d = has(v.days) && v.days > 0 ? v.days : 30;
        var out = { value: xx(v.sales / v.stock), lines: ['O estoque foi renovado ' + fmt(v.sales / v.stock, 2) + ' vez(es) em ' + fmt(d, 0) + ' dia(s).'] };
        if (v.sales > 0) out.lines.push('Cobertura: ' + fmt(v.stock / (v.sales / d), 1) + ' dia(s) de venda no estoque.');
        else out.lines.push('Sem vendas no período, a cobertura não pode ser calculada.');
        return out;
      }
    },
    fill: {
      need: ['ordered', 'delivered'],
      run: function (v) {
        if (v.ordered === 0) return zero('Quantidade pedida');
        if (v.delivered > v.ordered) return { error: 'A quantidade entregue não pode passar da pedida.' };
        var r = v.delivered / v.ordered * 100;
        return { value: pct(r), lines: ['Faltaram ' + fmt(v.ordered - v.delivered, 0) + ' unidade(s) para atender o pedido completo.'] };
      }
    },
    plano: {
      need: ['ok', 'total'],
      run: function (v) {
        if (v.total === 0) return zero('Itens do planograma');
        if (v.ok > v.total) return { error: 'Os itens corretos não podem passar do total do planograma.' };
        return { value: pct(v.ok / v.total * 100), lines: [fmt(v.total - v.ok, 0) + ' item(ns) fora do lugar, da frente ou do preço combinado.'] };
      }
    },
    pstore: {
      need: ['pts', 'max'],
      run: function (v) {
        if (v.max === 0) return zero('Pontos possíveis');
        if (v.pts > v.max) return { error: 'Os pontos obtidos não podem passar dos pontos possíveis.' };
        var r = v.pts / v.max * 100;
        return { value: pct(r, 1), lines: [fmt(v.pts, 0) + ' de ' + fmt(v.max, 0) + ' pontos da auditoria.', 'Perdeu ' + fmt(v.max - v.pts, 0) + ' ponto(s): veja em quais critérios para priorizar a correção.'] };
      }
    },
    preco: {
      need: ['mine', 'comp'],
      run: function (v) {
        if (v.comp === 0) return zero('Preço do concorrente');
        var i = v.mine / v.comp * 100, d = i - 100;
        return { value: fmt(i, 1), lines: [d > 0 ? 'Seu preço está ' + pct(d, 1) + ' acima do concorrente (posicionamento premium).' : (d < 0 ? 'Seu preço está ' + pct(-d, 1) + ' abaixo do concorrente.' : 'Seu preço é igual ao do concorrente.'), 'Índice 100 = mesmo preço. Compare produtos equivalentes (mesmo tamanho e gramatura).'] };
      }
    },
    roipromo: {
      need: ['units', 'margin', 'cost'],
      run: function (v) {
        if (v.cost === 0) return zero('Custo da promoção');
        var profit = v.units * v.margin, r = (profit - v.cost) / v.cost * 100;
        return { value: pct(r, 1), tone: r > 0 ? 'good' : (r < 0 ? 'bad' : 'warn'), lines: ['Lucro incremental: ' + brl(profit) + ' para ' + brl(v.cost) + ' de custo.', 'Resultado líquido da promoção: ' + brl(profit - v.cost) + '.'] };
      }
    },
    canib: {
      need: ['gross', 'lost'],
      run: function (v) {
        if (v.gross === 0) return zero('Venda incremental do item promovido');
        var net = v.gross - v.lost, r = v.lost / v.gross * 100;
        return { value: pct(r, 1), tone: net < 0 ? 'bad' : (r > 30 ? 'warn' : 'good'), lines: ['Venda incremental líquida: ' + fmt(net, 0) + ' unidade(s) (' + fmt(v.gross, 0) + ' do item promovido menos ' + fmt(v.lost, 0) + ' perdidas em outros itens da marca).', net < 0 ? 'A promoção tirou mais venda dos seus outros produtos do que trouxe.' : 'Parte da venda extra veio de produtos da própria marca, não de consumo novo.'] };
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
