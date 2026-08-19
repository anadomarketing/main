# Rodada 2 — SEO, GEO, velocidade e padronização visual (18/08/2026)

Depois de confirmar que a nova seção de Cases estava no ar, fiz a auditoria completa de SEO/GEO/velocidade do site publicado e implementei todos os pontos que tinham ficado como "pendente" nela, além de padronizar tipografia, cores e tamanhos de fonte no site inteiro (não só nos Cases).

## SEO

- **Corrigido `<html lang="en">` → `<html lang="pt-BR">`** — o site é todo em português, mas declarava idioma inglês para buscadores e leitores de tela.
- **Title reescrito**: de "CV Ana D'avilla - Esp. em Marketing Digital" para "Ana D'avilla | Especialista em Tráfego Pago, PPC e CRM para Marcas e Agências" — mais descritivo e melhor para clique no Google.
- **Meta description reescrita**, citando especialidade, +10 anos de experiência e marcas atendidas (Ford, Toyota, Mitsubishi — todas já citadas no seu currículo/cases).
- **Meta robots, canonical e Open Graph/Twitter Card adicionados** — agora, ao compartilhar o link no WhatsApp/LinkedIn, aparece um preview com título, descrição e sua foto.
- **`robots.txt` e `sitemap.xml` criados** na raiz do site, apontando para `https://anadomkt.com.br/`.
- **Bug corrigido**: o botão "Baixar CV em PDF" tinha o link sem aspas no HTML (`href=https://...`), o que é HTML inválido e podia falhar em alguns navegadores. Corrigido — o link em si já apontava para o arquivo certo.
- **`alt` text adicionado** em todas as imagens que ainda não tinham (foto "Sobre mim", foto do menu lateral, fotos de depoimentos).

## GEO (otimização para respostas de IA)

- **Dados estruturados (schema.org) adicionados**: um bloco `Person` (nome, profissão, localização, redes) e um bloco `FAQPage`, para reforçar pra IA quem você é e o que você faz.
- **Nova seção "Perguntas Frequentes"** no site (acessível pelo menu), com 5 perguntas e respostas reais sobre atendimento a agências, ferramentas que você domina, atendimento fora de Goiânia, tempo de experiência e como falar com você. Todo o conteúdo é baseado no que já existe no seu currículo e nos cases — nada foi inventado.

## Velocidade

- **`width`/`height` adicionados em todas as imagens** (fotos, logos, avatares de depoimento) — evita que a página "pule" durante o carregamento (CLS).
- **Fotos otimizadas**: `sobremim.png` (167 KB) e `quemsou.png` (119 KB) foram convertidas para JPG/WebP com qualidade equivalente. A página agora carrega `sobremim.webp` (16 KB) e `quemsou.webp` (17 KB) em navegadores modernos, com fallback automático em JPG para os demais — mais de 85% de redução de peso, sem perda visível de qualidade (conferi lado a lado antes de aplicar).
- **`loading="lazy"` estendido** para as fotos de depoimento e demais imagens fora da primeira dobra.
- Tentei rodar o Google PageSpeed Insights para trazer uma nota 0–100, mas a API pública do Google recusou a chamada por limite de uso (erro 429) em todas as tentativas. Meu ambiente de teste também não tem acesso à internet externa, então não consigo simular o carregamento real com todos os scripts de terceiros (Bootstrap, Google Fonts etc.). Recomendo rodar você mesma em pagespeed.web.dev/report?url=https://anadomkt.com.br/ depois de publicar — se quiser, me manda o resultado que eu interpreto os números.

## Padronização de tipografia e cores (site inteiro)

- **Cores fora do padrão substituídas** pelo azul de destaque do site (`#2176df`): um amarelo (`#f2c83b`) que aparecia no ícone do menu lateral e no fundo de uma camada interna (nunca visível, mas arriscado) e um coral (`rgba(255, 111, 97, ...)`) usado nas setas do carrossel de depoimentos.
- **CSS morto removido**: um bloco inteiro de estilos do antigo sistema de cases em imagem/lightbox (não usado desde a reconstrução dos Cases) e um bloco de estilos duplicado que tinha sido colado duas vezes por engano.
- **Tamanho de título unificado**: o nome de quem depõe nos "Depoimentos" estava em 18px; ajustei para 20px, igual aos demais subtítulos do site (Formação, Experiência, Certificações, Cases).
- **CSS da seção "Perguntas Frequentes" criada do zero**, seguindo o mesmo padrão visual das outras seções (mesmo espaçamento, cor de destaque nas perguntas, mesma tipografia).
- Adicionei também um bloco de variáveis (`:root`) no topo do CSS documentando a paleta oficial (azul de destaque, cor de título, cor de texto, cor de fundo escuro) — facilita manter tudo consistente em qualquer ajuste futuro.
- Testei o site inteiro (mobile 375px e desktop) depois de todas essas mudanças — menu, Cases, modal de case e a nova seção de FAQ — e está tudo funcionando normalmente.

# Como aplicar no GitHub (repositório anadomarketing/main, branch `site`)

1. Substitua `index.html` e `css/style.css` pelos arquivos deste zip.
2. Adicione `robots.txt` e `sitemap.xml` **na raiz do repositório** (mesmo nível do `index.html`) — são arquivos novos.
3. Envie os arquivos da pasta `img/` deste zip para dentro da pasta `img/` do repositório:
   - `logo-balishoes.png`, `logo-quadrante.png`, `logo-ford.png`, `logo-biostevi.png` (dos Cases — se você já subiu esses na rodada anterior, pode sobrescrever, são os mesmos).
   - `sobremim.jpg`, `sobremim.webp`, `quemsou.jpg`, `quemsou.webp` (novos, usados agora nas fotos "Sobre mim" e do menu lateral).
4. Se preferir aplicar como patch: `git apply mudancas.diff` na raiz do repositório (cobre `index.html` e `css/style.css`; os demais arquivos são novos/binários e precisam ser copiados manualmente).
5. Nenhum outro arquivo precisa mudar.

## Logos da Sigbol e Mitsubishi — ainda não incluídos

Você chegou a colar duas imagens de logo (Mitsubishi e Sigbol) no chat, mas elas só apareceram como visualização na conversa — não chegaram como arquivo aqui no meu ambiente, então não consegui salvá-las nos cases ainda. Se puder reenviar essas duas **como anexo (arquivo)**, em PNG ou SVG, eu aplico do mesmo jeito que fiz com os outros 4 logos e atualizo os cards (hoje eles mostram só as iniciais "SB" e "MT").

---

# Rodada 1 — Seção de Cases (registro anterior)

- **Seção de Cases reconstruída em código.** Nada de imagens de capa nem lightbox: cliente, segmento, período, desafio, estratégia e resultados agora são texto real no HTML — ficam visíveis para o Google e para IAs, e dá pra editar sem precisar redesenhar nada.
- **Removidos:** Magicramp e o case da Dra. Marcela Buchaim / Studio Tez (confirmado que é o mesmo case).
- **Mantidos, com números reais** (extraídos diretamente dos PDFs de dashboard que já estavam no seu repositório — nada foi inventado): **Bali Shoes** (Bali Hai), **Editora Quadrante**, **Abradif · Ford** e **Biostévi Pharma**.
- **2 cases novos adicionados**, com os dados que você enviou: **Sigbol — Cursos de Moda** e **Mitsubishi — TO**.
- **Link do PDF removido** de todos os cases, como você pediu — a seção agora é 100% independente de PDF.
- **Nome do case da Bali Shoes ajustado**: título "Bali Shoes", subtítulo "Bali Hai" (invertido conforme você confirmou).
- **Bug corrigido:** o card da Ford tinha uma tag HTML mal fechada no código antigo (`Meta e Google Ads/span` sem o `<`), o que podia bagunçar o layout. Já corrigido.
- Cada case tem um botão **"Ver case completo"** que abre uma janela (modal) com desafio/estratégia e todos os resultados detalhados.
- Agora são **6 cases** no total, em grade de 2 colunas no desktop e 1 coluna no mobile.
- **Logos dos clientes adicionados.** Para Bali Shoes, Editora Quadrante, Abradif·Ford e Biostévi Pharma, recortei o logo real de dentro das imagens de capa que já estavam no seu repositório (`img/case-*-capa.jpg`) — mesma marca que você já usava, só isolada. Ficaram salvos como `img/logo-balishoes.png`, `img/logo-quadrante.png`, `img/logo-ford.png` e `img/logo-biostevi.png`.

## Números usados em cada case (fonte: PDFs de dashboard já existentes no seu repositório)

**Bali Shoes / Bali Hai** (Jan/23–Mai/23): Receita +140% (R$41.612 → R$100.123/mês) · Conversões +118% (166 → 362) · CPC -38% (R$0,44 → R$0,27) · ROI 10,27.

**Editora Quadrante** (Set/22–Mai/23): Vendas totais +20% no período · Black Friday +56% no volume de vendas · Cliques Meta Ads +189% · ROI 9,32.

**Abradif · Ford** (Jan/21–Dez/22): 14.099 leads · CPL -40% (chegando a R$47) · CPM R$20,33 · 27,5 milhões de impressões.

**Biostévi Pharma** (Dez/22–Abr/23): Receita geral +354% (R$4.164.439) · ROAS 13,69 (+424%) · Vendas +81,6% · Novos usuários +12%.

## Cases novos (dados que você enviou)

**Sigbol — Cursos de Moda** (Mai/25–Out/25 vs. Nov/24–Abr/25, Google Ads): +1.250 matrículas · 120 mil cliques (+85,1 mil) · 3,42 mil conversões (+1,25 mil) · CPA R$55 · CPC R$1,57 (redução de R$1,59) · CPM R$37 (redução de R$239) · crescimento de 46% no leilão · mais de 60% do tempo em 1ª posição.

**Mitsubishi — TO** (1 mês de campanha, Meta Ads + Google Ads): Investimento R$26.520 · 1.844.980 impressões · 16.946 cliques · 2.150 contatos (leads, telefonemas e "obter rota"), sendo 553 cadastros em formulário (+16,42%) · CPL R$31 (-14%) · taxa de qualificação ~18% (8pp acima da média de mercado).

# Limpeza opcional (não obrigatória)

Estes arquivos ficaram sem uso depois da remoção dos 2 cases antigos e da remoção dos links de PDF. Só apague se quiser economizar espaço no repositório:
- `img/case-magicramp-capa.jpg`, `img/case-magicramp.jpg`, `img/dashboard-magicramp.pdf`
- `img/case-dramarcela-capa.jpg`, `img/case-dramarcela.jpg`, `img/dashboard-dramarcela.pdf`
- `img/dashboard-bali.pdf`, `img/dashboard-quadrante.pdf`, `img/dashboard-ford.pdf`, `img/dashboard-biostevi.pdf`
- `img/sobremim.png`, `img/quemsou.png` (substituídos por `.jpg`/`.webp` nesta rodada — o site não referencia mais os `.png` originais)

# Para os próximos cases que você enviar

Mesmo formato que você já usou funciona muito bem: nome do cliente, segmento/o que a empresa faz, canais (Google/Meta Ads), período, 1–2 frases de resultado geral, e a lista de números com contexto (o que mudou, de quanto para quanto, e a variação %). Pode mandar em texto ou em PDF de dashboard — eu extraio os números direto de lá.

# O que ainda fica como proposta (não implementado)

Do relatório de modernização original, seguem como sugestão para quando quiser: seção específica "Para Agências", dark mode, blog/conteúdo. Posso implementar qualquer um assim que você confirmar prioridade.
