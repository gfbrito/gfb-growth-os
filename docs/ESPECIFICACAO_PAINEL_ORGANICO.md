Especificação — Painel Orgânico do Instagram

Documento de implementação. Descreve, passo a passo, como funciona a área "Orgânico" do painel em produção (Python/FastAPI + SQLite), para ser reimplementada em outro SaaS. A lógica, as chamadas à API e as regras de cálculo são independentes da stack: adapte nomes de tabela, linguagem e framework ao seu projeto, mas mantenha as regras — cada uma existe porque a API real se comporta de um jeito que a documentação não conta.

API usada: Instagram Graph API com login do Facebook (graph.facebook.com, versão v26.0), com o mesmo token de usuário do sistema que já lê a conta de anúncios.

---

0. O que o painel entrega

Para cada perfil profissional do Instagram conectado:

1. Visão geral: KPIs do período (alcance, views, interações, engajamento, seguidores, alcance fora da bolha, cliques na bio), gráficos diários, quebra por formato e uma caixa "O que fazer agora" com até 5 ações priorizadas.
2. Conteúdos: grade de todas as publicações com métricas, e o detalhe de cada uma com a curva de vida (como o alcance cresceu hora a hora/dia a dia) comparada com a média do perfil na mesma idade.
3. Ranking: melhores e piores posts por critério, e candidatos a virar anúncio.
4. Reels: retenção, % assistido, taxa de pulo, desempenho por faixa de duração.
5. Stories: sequência de cada dia com retenção e saídas.
6. Público: idade, gênero, país, cidade (seguidores × alcançados × engajados) e horários online.
7. Comentários: todos os comentários classificados automaticamente (possível lead, pergunta, elogio, crítica, outros), tempo de resposta, e uma fila do que está sem resposta.
8. Marcações: quem marcou o perfil.
9. Referências: acompanhamento de perfis concorrentes/inspiração.
10. Desempenho: taxa de acerto, por tema, por formato, por mês, constância (metas semanais), conversão do perfil e boletim mensal imprimível.
11. (Opcional) Automação de respostas a comentários por palavra-chave — implementada, mas desligada por padrão.

Princípio que vale para tudo: vazio não é zero. Métrica que a API não devolveu é gravada como NULL e mostrada como "–". Nunca preencha com 0.

---

1. Pré-requisitos

1.1 Conta e token

- Perfil do Instagram profissional (Business ou Creator) vinculado a uma Página do Facebook.
- Token de usuário (de preferência de longa duração ou de usuário do sistema) com as permissões:

┌──────────────────────────────────────────┬─────────────────────────────────────────────────┐
│                Permissão                 │                    Para quê                     │
├──────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ instagram_basic                          │ perfil e publicações                            │
├──────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ instagram_manage_insights                │ insights da conta, publicações e stories        │
├──────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ instagram_manage_comments                │ ler (e, na automação, responder) comentários    │
├──────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ pages_show_list                          │ listar as Páginas e achar o Instagram vinculado │
├──────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ pages_read_engagement                    │ ler a Página vinculada                          │
├──────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ instagram_manage_messages (só automação) │ resposta privada (direct) a um comentário       │
└──────────────────────────────────────────┴─────────────────────────────────────────────────┘

- Descobrir o ID do Instagram: GET /me/accounts?fields=id,name,instagram_business_account{id,username}. O instagram_business_account.id é o IG_USER_ID usado em todas as chamadas.
- Envie o token no cabeçalho Authorization: Bearer <token>, nunca na URL (a URL aparece em logs).

1.2 Configuração por conta

- IG_USER_ID, IG_USERNAME
- ACCOUNT_TIMEZONE (ex.: America/Sao_Paulo) — todos os "dias" do painel são no fuso da conta.

1.3 Ferramenta de diagnóstico (faça primeiro)

Implemente um comando "verificar Instagram" que chama cada endpoint/métrica usada abaixo e mostra: ok / vieram / vazias / falharam + motivo. A API muda entre versões e varia por perfil; esse comando é o que permite descobrir rapidamente o que quebrou.

---

2. Modelo de dados

Uma base (ou um schema/tenant) por conta do Instagram. Na nossa implementação, cada conta extra tem seu próprio arquivo SQLite com as mesmas tabelas; isso eliminou o risco de misturar números de contas diferentes sem precisar de uma coluna conta_id em 16 tabelas. Num SaaS multi-tenant com Postgres, o equivalente é conta_id em todas as tabelas + chave primária composta + filtro obrigatório (RLS ajuda).

-- retrato diário do perfil
ig_perfil_diario (data PK, followers_count, follows_count, media_count, coletado_em)

-- insights diários da conta, em formato longo: uma linha por (dia, métrica, fatia)
-- fatia = 'total' | 'mpt:FEED' | 'mpt:REELS' | 'mpt:STORY' | 'mpt:AD' | 'follow:FOLLOWER' | 'follow:NON_FOLLOWER'
--       | 'contato:<botão>' | 'mptf:<FORMATO>|<FOLLOWER|NON_FOLLOWER>'
ig_conta_diario (data, metrica, fatia, valor NULL, coletado_em, PK(data, metrica, fatia))

ig_seguidores_diario (data PK, novos, coletado_em)                 -- follower_count por dia
ig_online (data, hora 0-23, valor, PK(data, hora))                 -- online_followers

ig_demografia (referencia, timeframe, metrica, breakdown, chave, valor, coletado_em,
               PK(referencia, timeframe, metrica, breakdown, chave))
  -- referencia = semana/mês a que o retrato se refere; timeframe = this_week|this_month

ig_midias (
  id PK, media_type, media_product_type, legenda, permalink, timestamp,
  like_count, comments_count, media_url, thumbnail_url,
  filhos_json,            -- filhos do carrossel
  colaboradores_json,     -- [{id, username, invite_status}]
  compartilhado_fb, duracao_s,           -- duração do Reel (lida do arquivo MP4, a API não informa)
  arquivo_id, miniatura_id,              -- cópia local da mídia (a URL da Meta expira)
  tema, tema_manual DEFAULT 0,
  ads_json,               -- IDs dos anúncios que usam este post
  proximo_retrato,        -- quando tirar o próximo retrato da curva de vida
  removida DEFAULT 0, atualizado_em)

-- curva de vida: cada retrato guarda todas as métricas do post naquele momento
ig_midia_retratos (midia_id, momento, idade_h, metrica, valor, PK(midia_id, momento, metrica))
ig_midia_ultimo   (midia_id, metrica, valor, momento, PK(midia_id, metrica))   -- último valor (leitura rápida)

ig_stories (id PK, media_type, timestamp, permalink, media_url, arquivo_id, miniatura_id,
            menos_de_5 DEFAULT 0, coleta_final_em, atualizado_em)
ig_story_retratos (story_id, momento, idade_h, metrica, valor, PK(story_id, momento, metrica))

ig_comentarios (
  id PK, midia_id, origem,             -- 'organico' | 'anuncio'
  ad_id, adset_id, campaign_id,        -- quando origem = anuncio
  pai_id,                              -- NULL = comentário de 1º nível; senão é resposta
  texto, usuario, usuario_id, timestamp, like_count,
  do_perfil DEFAULT 0,                 -- 1 se o autor é o próprio @
  respondido_em,                       -- timestamp da 1ª resposta do próprio @
  categoria,                           -- possivel_lead | pergunta | elogio | critica | outros
  coletado_em)

ig_marcacoes (id PK, usuario, permalink, timestamp, media_type, legenda, like_count, comments_count, coletado_em)
ig_ref_retratos (username, data, followers_count, media_count, PK(username, data))
ig_ref_midias (id PK, username, timestamp, media_type, permalink, like_count, comments_count, view_count, coletado_em)

ig_tarefas (nome PK, ultima, status, detalhes, erro_em)   -- estado do agendador
ig_falhas (escopo, metrica, motivo, quando, PK(escopo, metrica))   -- métricas recusadas pela API
estado (chave PK, valor)            -- ig_perfil, ig_uso, boletim:AAAA-MM...
preferencias (chave PK, valor JSON) -- termos de comentários, temas, metas, referências, mínimo do ranking
cache_api (chave PK, valor, expira_em)

-- automação (opcional)
automacao_regras (id PK, nome, ativa DEFAULT 0, palavras JSON, modo 'contem'|'exata',
                  publicacoes JSON NULL, resposta_publica, resposta_privada, ativa_desde, criada_em, atualizada_em)
automacao_execucoes (comentario_id PK, regra_id, midia_id, usuario, quando, publica_id, privada_ok, erro)

Índices mínimos: ig_comentarios(midia_id), ig_comentarios(origem, timestamp), ig_comentarios(pai_id), ig_midias(timestamp), ig_conta_diario(metrica, fatia, data).

---

3. Coleta — chamadas exatas à API

3.1 Helper insights() com fallback (obrigatório)

Toda leitura de insights passa por uma função que:
1. Chama GET /{objeto}/insights?metric=a,b,c&....
2. Se der certo, apaga de ig_falhas as métricas daquele escopo.
3. Se der erro (que não seja de token) e houver mais de uma métrica: tenta métrica a métrica. A que falhar vai para ig_falhas (escopo, metrica, motivo); as outras seguem.
4. Erro de token sobe imediatamente (para tudo).
5. Erro #10 em story não é falha: significa "menos de 5 visualizações" → grava menos_de_5=1.

Motivo: um breakdown incompatível ou uma métrica descontinuada derruba a chamada inteira com "An unknown error has occurred" (código 1) — sem o fallback você perde todas as métricas por causa de uma.

Leitura do valor:
- valor_total(item) = item.total_value.value; se não houver, o último item.values[-1].value; se o item não veio → NULL.
- valores_breakdown(item) = para cada total_value.breakdowns[].results[]: chave = dimension_values unidos por |, valor = value.

3.2 Perfil (diário)

GET /{ig}?fields=id,username,name,followers_count,follows_count,media_count,profile_picture_url → upsert em ig_perfil_diario com a data de hoje (fuso da conta).

3.3 Insights diários da conta

Para cada dia: janela 00:00–24:00 no fuso da conta, convertida para epoch (since, until). Parâmetros base: metric_type=total_value&period=day&since=..&until=...

Chamadas (cada grupo de breakdown numa chamada separada):

┌──────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────┐
│                 Chamada                  │                                                                    Métricas                                                                    │              Fatia gravada               │
├──────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤
│ sem breakdown                            │ views, reach, accounts_engaged, total_interactions, likes, comments, shares, saves, replies, reposts, follows_and_unfollows,                   │ total                                    │
│                                          │ profile_links_taps                                                                                                                             │                                          │
├──────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤
│ breakdown=media_product_type             │ reach, views, total_interactions, likes, comments, saves, shares                                                                               │ mpt:FEED, mpt:REELS, mpt:STORY,          │
│                                          │                                                                                                                                                │ mpt:AD...                                │
├──────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤
│ breakdown=follow_type                    │ reach, follows_and_unfollows, views                                                                                                            │ follow:FOLLOWER, follow:NON_FOLLOWER     │
├──────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤
│ breakdown=contact_button_type            │ profile_links_taps                                                                                                                             │ contato:<tipo>                           │
├──────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤
│ breakdown=media_product_type,follow_type │ reach                                                                                                                                          │ mptf:<FORMATO>|<FOLLOWER/NON_FOLLOWER>   │
└──────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────┘

- views aceita follow_type; follower_type é recusado (#100) apesar de estar na documentação.
- O breakdown combinado media_product_type,follow_type funciona embora a doc não cite combinações.
- impressions foi descontinuada (v22+) — não chame.
- Na coleta diária, refaça (upsert) os últimos 3 dias: a Meta leva até 48 h para fechar os números.

3.4 Totais do período (alcance e contas engajadas)

Alcance e contas engajadas não se somam entre dias (a mesma pessoa conta várias vezes). Para períodos de até 30 dias, chame GET /{ig}/insights?metric=reach,accounts_engaged&metric_type=total_value&period=day&since=<início>&until=<fim> e também reach com breakdown=media_product_type para tirar a fatia AD. Cache: 15 min se o período inclui hoje, 12 h se é passado. Acima de 30 dias a API recusa ("There cannot be more than 30 days") → mostre a soma diária com o aviso "soma diária".

Use stale-while-revalidate: cache vencido → mostra o valor guardado e atualiza em segundo plano; falha da Meta numa chave → não tenta de novo por 1 minuto.

3.5 Seguidores e horários online (diário)

- metric=follower_count&period=day&since=-30d&until=hoje → ig_seguidores_diario (novos seguidores por dia; a Meta só informa para contas com 100+ seguidores).
- metric=online_followers&period=lifetime&since&until → ig_online (valor é um objeto {hora: qtd}). As horas vêm no fuso do Pacífico (inferido: os dias da API fecham às 07:00 UTC). Converta para o fuso da conta na exibição. Pode vir vazio para alguns perfis.

3.6 Demografia (diário)

Para cada breakdown ∈ {age, gender, city, country} × timeframe ∈ {this_week, this_month}:
GET /{ig}/insights?metric=follower_demographics,engaged_audience_demographics,reached_audience_demographics&period=lifetime&metric_type=total_value&breakdown=<bd>&timeframe=<tf>
- reached_audience_demographics não está documentada, mas funciona.
- Grave substituindo (DELETE + INSERT) o retrato daquela referência/timeframe/métrica/breakdown.

3.7 Publicações

GET /{ig}/media?fields=id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,media_url,thumbnail_url,children{id,media_type,media_url,thumbnail_url},collaborators,boost_ads_list&limit=50 (paginar tudo).
- Se collaborators der erro, repita sem ele.
- boost_ads_list.data[].ad_id → ads_json (post impulsionado).
- Post que sumiu da listagem → removida=1 (nunca apague: os comentários e métricas antigos continuam valendo).
- Baixe a mídia (imagem/vídeo/miniatura) para armazenamento próprio, deduplicado por SHA-256: a media_url da Meta expira. Para Reels, leia a duração do átomo mvhd do MP4 baixado (a API não informa).
- A /media pode devolver menos posts que o media_count (posts antigos, de antes de virar conta profissional, arquivados). Não há como pegar esses.

3.8 Curva de vida (retratos de cada publicação)

Cada publicação tem proximo_retrato. Quando agora >= proximo_retrato, tire um retrato:

┌──────────────────┬──────────────────────────┐
│  Idade do post   │ Intervalo entre retratos │
├──────────────────┼──────────────────────────┤
│ < 48 h           │ 1 hora                   │
├──────────────────┼──────────────────────────┤
│ 48 h – 30 dias   │ 1 dia                    │
├──────────────────┼──────────────────────────┤
│ 30 – 90 dias     │ 7 dias                   │
├──────────────────┼──────────────────────────┤
│ 90 dias – 2 anos │ 30 dias                  │
├──────────────────┼──────────────────────────┤
│ > 2 anos         │ para                     │
└──────────────────┴──────────────────────────┘

Próximo = agora + intervalo − 5 min (folga para o timer não perder a vez). Posts que já existiam na instalação ganham o primeiro retrato na carga inicial, na idade em que estão.

Métricas do retrato — GET /{midia}/insights?metric=... (sem período):
- Feed/carrossel: views, reach, likes, comments, saved, shares, reposts, total_interactions, profile_visits, follows, total_likes, total_comments, total_views
- Reels: views, reach, likes, comments, saved, shares, reposts, total_interactions, ig_reels_avg_watch_time, ig_reels_video_view_total_time, reels_skip_rate, total_likes, total_comments, total_views
- Reels compartilhado no Facebook: + crossposted_views, facebook_views
- Extra (feed): metric=profile_activity&breakdown=action_type → total e fatias (ex.: BIO_LINK_CLICKED)
- Filhos de carrossel não têm insights (#100): só baixe a mídia deles.
- total_* = orgânico + pago. Parte paga = total_x − x (likes, comments, views).

Grave cada métrica em ig_midia_retratos (midia_id, momento, idade_h, metrica, valor) e atualize ig_midia_ultimo.

3.9 Stories

- GET /{ig}/stories?fields=id,media_type,timestamp,permalink,media_url,thumbnail_url a cada hora (stories somem em 24 h; o que não for coletado no ar se perde).
- Baixe a mídia na primeira vez.
- Retrato a cada coleta: metric=views,reach,replies,shares,reposts,total_interactions,follows,profile_visits,link_clicks, mais metric=navigation&breakdown=story_navigation_action_type (TAP_FORWARD, TAP_BACK, TAP_EXIT, SWIPE_FORWARD) e metric=profile_activity&breakdown=action_type. Grave as fatias como navigation:TAP_EXIT etc.
- Quando o story passa de 22,5 h, essa coleta é a "quase final" (coleta_final_em).
- Valor de referência exibido = último retrato com idade ≤ 24,5 h.
- Erro #10 → menos_de_5=1, não é falha.

3.10 Comentários

GET /{midia}/comments?fields=id,text,timestamp,username,from{id,username},like_count,replies{id,text,timestamp,username,from{id,username},like_count}&limit=50
- Paginação para no primeiro comentário já salvo (vêm do mais novo para o mais antigo).
- Para cada comentário e cada resposta: do_perfil = (username == @ do perfil); se não for do perfil, categoria = classificar(texto) (seção 6.1). Resposta tem pai_id.
- Respondido = existe resposta filha cujo autor é o próprio @ → grave respondido_em no pai com o timestamp da primeira resposta do perfil.
- Respostas a comentários antigos não aparecem na paginação incremental: releia /{comentario}/replies dos comentários sem resposta dos últimos 7 dias (14 dias na coleta diária).
- Nunca logue o texto de comentários nem o token.

Comentários dos anúncios (origem='anuncio'): para os anúncios ativos ou com gasto nos últimos 90 dias, pegue o effective_instagram_media_id do criativo e colete os comentários dessa mídia. Se a mesma mídia serve vários anúncios, ligue ao de maior gasto. Se o anúncio usa um post do próprio perfil, ignore (os comentários já são orgânicos).

Cruzar posts com anúncios: um post está "usado em anúncio" se aparece em boost_ads_list ou se algum criativo tem effective_instagram_media_id/source_instagram_media_id igual ao ID do post. Grave em ads_json.

3.11 Marcações

GET /{ig}/tags?fields=id,username,permalink,timestamp,media_type,caption,like_count,comments_count (até 4 páginas) → ig_marcacoes.

3.12 Perfis de referência (concorrentes)

Lista editável (máx. 10). Para cada um, com 20 s de espaço entre perfis:
GET /{ig}?fields=business_discovery.username(<user>){username,followers_count,media_count,media.limit(25){id,timestamp,media_type,permalink,like_count,comments_count,view_count}} → ig_ref_retratos (seguidores por dia) e ig_ref_midias.

---

4. Agendador

Um único job, disparado a cada 15 min, decide o que rodar:

┌────────────┬──────────────────┬──────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Prioridade │      Tarefa      │          Frequência          │                                                                              O que faz                                                                               │
├────────────┼──────────────────┼──────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1          │ stories          │ 60 min                       │ 3.9                                                                                                                                                                  │
├────────────┼──────────────────┼──────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 2          │ comentários      │ 30 min                       │ 3.10 nos posts dos últimos 7 dias + anúncios dos últimos 7 dias + releitura de respostas (7 dias)                                                                    │
│            │ recentes         │                              │                                                                                                                                                                      │
├────────────┼──────────────────┼──────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3          │ publicações 48 h │ 60 min                       │ lista mídias (3.7), baixa as novas, retratos das que têm < 48 h (3.8)                                                                                                │
├────────────┼──────────────────┼──────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 4          │ diária           │ 1×/dia a partir das 01:30    │ perfil, últimos 3 dias da conta, seguidores, online, demografia, todos os retratos pendentes, comentários dos últimos 90 dias + anúncios 90 dias, releitura de       │
│            │                  │ (fuso da conta)              │ respostas (14 dias), marcações, cruzar com anúncios, aplicar temas, boletim do mês anterior se for dia 1                                                             │
├────────────┼──────────────────┼──────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 5          │ referências      │ 1×/dia a partir das 03:00    │ 3.12                                                                                                                                                                 │
└────────────┴──────────────────┴──────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

Orçamento de chamadas: leia o cabeçalho X-Business-Use-Case-Usage das respostas, pegue o maior % do tipo instagram e guarde com a hora. Regra:
- uso > 75% → só roda prioridades 1–3;
- uso > 90% → só roda a 1;
- valor com mais de 1 h é ignorado (janela móvel da Meta).

Resiliência:
- Uma tarefa com erro não move a "última execução" (senão a diária só tentaria amanhã); grava erro_em e é refeita 30 min depois.
- Erro num post, story ou dia não derruba a tarefa (registra e segue). Erro de token derruba tudo.
- Trava por conta (lock) para duas execuções não rodarem juntas; trava ocupada = saída "ocupado", não falha.
- Registre cada execução num sync_log (tipo, início, fim, status, detalhes); execução que morreu no meio vira "interrompido" na próxima.

---

5. Carga inicial

Ao conectar uma conta:
1. Perfil, publicações (com download das mídias) e um retrato de cada post na idade atual.
2. Insights diários da conta de trás para frente, dia a dia, até 2 anos, e parar após 30 dias seguidos sem nenhum dado (é o período antes da conta existir; sem essa regra gasta milhares de chamadas).
3. Respeitar o orçamento (esperar quando passar de 75%).
4. Comentários de todas as publicações, marcações, demografia, seguidores.
5. Rodar numa thread/fila em segundo plano com progresso visível na tela. Se falhar, tentar de novo a cada 6 h.

---

6. Regras de cálculo

6.1 Classificação de comentários (sem IA, por palavras)

Ordem de precedência: possível lead > crítica > pergunta > elogio > outros.

Normalização: remover @menções; minúsculas; sem acento (NFKD → ASCII); espaços colapsados.

Regras de casamento:
- Termo sem letras (emoji, "?"): procurar no texto original (a normalização ASCII apaga emojis).
- Termo curto (≤ 2 letras), com espaço ou não alfanumérico: casa por trecho.
- Palavra: casa pelo início de palavra (\btermo).
- Pergunta: "?" vale em qualquer lugar; as palavras de pergunta só contam no início do comentário. Se começa com palavra de pergunta, não tem "?" e casa com elogio → é elogio ("Como é bom!").

Listas padrão (editáveis por conta, com botão "reclassificar tudo"):
possivel_lead: quanto custa, valor, preco, orcamento, contato, whatsapp, zap, telefone, como faco, quero saber,
               tenho interesse, me chama, chama no direct, direct, atendem, consulta, advogado, processo, divida,
               prorrogacao, renegociar, meu caso, minha fazenda, me ajuda, preciso de ajuda, informacao, info
critica:       golpe, mentira, pessimo, horrivel, nao funciona, enganacao, absurdo, ruim, fake, picareta
pergunta:      ?, como, qual, quando, onde, quanto, pode, posso, sera que, alguem sabe, tem como
elogio:        parabens, otimo, excelente, top, show, maravilh, obrigad, gratidao, incrivel, muito bom,
               sensacional, 👏, 🙌, ❤, 🔥, 💪
(As listas de lead são do nicho do cliente — jurídico/agro. No SaaS, deixe cada cliente editar.)

6.2 Orgânico × total

- Visão Orgânico (padrão) = total − fatia mpt:AD, nas métricas que têm o breakdown media_product_type.
- Se naquele dia o recorte por formato não veio (nenhuma fatia mpt:), o orgânico do dia é NULL (não finja que o total é orgânico).
- Métricas sem esse breakdown (contas engajadas, % não seguidores) aparecem com o selo "inclui anúncios".
- Alcance orgânico é aproximado (a mesma pessoa pode ter visto anúncio e post) — diga isso no "i" do KPI.
- Seletor no topo: Orgânico | Total.

6.3 Métricas derivadas por publicação

- tx_engajamento = total_interactions ÷ reach × 100
- tx_salvamento = saved ÷ reach × 100; tx_compart = shares ÷ reach × 100
- utilidade = (saved + shares) ÷ reach × 1000
- seguidores por mil = follows ÷ reach × 1000
- Formato: REELS → "Reels"; CAROUSEL_ALBUM → "Carrossel"; VIDEO → "Vídeo"; senão "Foto".
- Reels: assistido_s = ig_reels_avg_watch_time / 1000; % assistido = assistido_s ÷ duracao_s × 100; tempo_total_h = ig_reels_video_view_total_time / 3.600.000; pulo = reels_skip_rate; % pago = (total_views − views) ÷ total_views × 100.
- "Dados ainda mudando" quando o post tem < 48 h.

6.4 Totais da conta no período

- Somáveis: soma diária da visão escolhida.
- ganhos = Σ follows_and_unfollows · follow:FOLLOWER; perdidos = Σ follow:NON_FOLLOWER; saldo = ganhos − perdidos.
- % alcance em não seguidores = Σ reach·NON_FOLLOWER ÷ (Σ NON_FOLLOWER + Σ FOLLOWER) × 100.
- engajamento = interações ÷ alcance × 100.
- Cliques no link da bio = Σ profile_activity · BIO_LINK_CLICKED das publicações do período (os toques em botões de contato vêm sempre 0 quando o perfil não tem botões; só mostre o card de botões se a soma > 0).
- Variação contra o período anterior de mesmo tamanho.
- "Todo o período" começa no 1º dia com reach > 0, não antes.

6.5 Comparação "na mesma idade"

- valor_na_idade(post, métrica, h) = último retrato com idade entre 80% e 110% de h.
- média_na_idade = média desse valor nos posts dos 90 dias anteriores (exclui o próprio). Post sem retrato nessa faixa não entra.
- Marcos exibidos: 6 h, 24 h, 7 dias, 30 dias. Com n < 3 posts na média, mostre "–".
- Se o primeiro retrato do post veio depois de 3 h de vida, avise "coletada a partir de X h".

6.6 Taxa de acerto e mediana

- Base: posts com alcance ≥ 50 e engajamento conhecido.
- Mediana do perfil = mediana do engajamento por alcance dessa base.
- Taxa de acerto = % dos posts (de um grupo) com engajamento acima da mediana do perfil. Grupo com < 3 posts válidos → "–".
- Nos cartões: engajamento verde acima da mediana, laranja abaixo.
- Não existe nota/índice composto. Cada sinal aparece com o próprio número e o "i" explica a conta (um índice composto foi feito e removido a pedido do cliente: ninguém entendia).

6.7 Temas

- Lista de temas {nome, palavras[]} editável. Tema do post = o que tiver mais ocorrências de palavras-chave na legenda (sem acento, minúsculas, hashtags removidas).
- Tema manual (tema_manual=1) nunca é sobrescrito. Na tela do post há um seletor de tema.
- Rodar na coleta diária para os posts sem tema manual.

6.8 Constância

- Semanas de segunda a domingo. Metas padrão (editáveis): FEED 2, REELS 3, CAROUSEL 1 por semana, STORIES 3 por dia.
- Por semana: contagem por formato, cumpriu/não cumpriu cada meta, dias sem publicar (só feed/carrossel/Reels), dias com stories na meta.
- Dias anteriores ao início da coleta de stories mostram "–" e não contam como meta não cumprida.
- ok da semana = todas as metas de posts cumpridas.

6.9 Conversão do perfil

- Seguidores por mil alcançados = ganhos ÷ alcance × 1000.
- Visita → seguidor = Σ follows ÷ Σ profile_visits (só posts de feed: os Reels não informam visitas).
- Contato por mil = (Σ profile_activity dos posts + Σ toques em botões) ÷ alcance × 1000.

6.10 Fora da bolha

Do breakdown mptf: (sem AD): % de alcance em não seguidores por mês e por formato (soma diária).

6.11 Reels por faixa de duração

Faixas: até 15 s, 15–30, 30–60, 60–90, > 90 s (limite de cima incluído). Por faixa: n, mediana de views, alcance e engajamento (para um viral não puxar a faixa), média do % assistido. Faixa com < 3 Reels → selo "pouca amostra". Reels sem duração só entram numa contagem à parte. Frase-resumo: mediana da taxa de pulo ("metade dos Reels perde X% ou mais nos 3 primeiros segundos"). Gráfico de dispersão duração × % assistido.

6.12 Stories

Agrupar por dia (fuso da conta), em ordem. Para cada story:
- saída = navigation:TAP_EXIT ÷ views × 100
- retenção = views ÷ views do 1º story do dia × 100
- Esconder saída/retenção/toques quando a Meta não devolveu.

6.13 Concentração do alcance

Mediana de alcance por post no período. Se 1 post responde por > 40% do alcance somado dos posts (com 2+ posts): "X% do alcance veio de 1 post →" com link.

6.14 Melhor horário

Média de online_followers por hora (convertida do Pacífico para o fuso da conta); hora de pico = melhor horário. Mapa de calor dia da semana × hora com o engajamento médio dos próprios posts publicados naquele horário.

---

7. Caixa "O que fazer agora" (Visão geral)

Até 5 itens, ordenados por prioridade, cada um com link para a tela certa. Não depende do período do topo (janelas fixas, explicadas no "i"). Sem nada → "Tudo em dia".

1. Comentários sem resposta (prio 1 se há possível lead, senão 2) → /organico/fila
   "Responder 3 possíveis leads e 2 perguntas nos comentários — o mais antigo espera há 2 dias".
2. Colaborações pendentes (prio 3): posts dos últimos 60 dias com colaborador invite_status=Pending.
3. Anúncios deixaram de rodar por este perfil (prio 3): alcance de anúncios no perfil (reach · mpt:AD) dos últimos 14 dias fechados < 10% da média semanal das 4 semanas anteriores, e essa média anterior ≥ 1.000/semana, e pelo menos 10 dias com dado nas 2 semanas recentes (coleta parada não é queda). "Desde" = dia seguinte ao último dia com alcance ≥ 10% da média diária anterior. Detalhe: seguidores novos por semana antes × agora.
4. Cadência atrasada (prio 4): pegue os últimos 21 dias com post (não posts — perfis publicam em rajada); mediana do intervalo entre esses dias; se dias desde o último > mediana → "Último post há N dias; o habitual é publicar a cada M dias · melhor horário ~19h". Mínimo 4 dias com post.
5. Candidatos a anúncio (prio 5): seção 8.
6. Dia de publicar (prio 6): se hoje é exatamente o dia da mediana → "Dia de publicar: melhor horário ~19h".

Rodapé da caixa: "N legendas dos últimos 90 dias com possível português de Portugal" (seção 9).

---

8. Candidatos do orgânico para anúncio (Ranking)

- Base: posts com alcance ≥ 50. Com < 5 posts na base, nada é sugerido.
- Corte = percentil 75 do engajamento por alcance (interpolação linear, igual ao PERCENTIL.INC).
- Entram posts dos últimos 90 dias, com alcance ≥ mínimo do ranking (padrão 100, editável), sem anúncio (ads_json vazio), e engajamento estritamente acima do corte (empate não conta). Ordenar por engajamento, mostrar 6.

Ranking: critério selecionável (engajamento, salvamentos, compartilhamentos — todos por alcance —, utilidade, seguidores ganhos por mil alcançados), filtro "Todos / Só orgânicos / Usados em anúncio", top 10 e piores 10 (só se houver > 10 válidos), lista dos abaixo do alcance mínimo.

---

9. Aviso de português de Portugal nas legendas (opcional, útil para público BR)

Lista curta comparada sem acento e por palavra inteira: facto→fato, equipa→equipe, contacto/contactar→contato/contatar, telemóvel→celular, utilizador→usuário, ecrã→tela, registo→registro, receção→recepção, autocarro→ônibus, rapariga→moça, acção→ação, projecto→projeto, óptimo→ótimo. Também "estar/andar + a + infinitivo" ("está a preparar" → "está preparando"), exceto quando a palavra após o "a" é substantivo ("a par", "a favor"). Ignore hashtags, @ e links. Não marque palavras válidas no Brasil (sítio, utilizar, perceber).

---

10. Telas

Navegação: área "Orgânico" com submenu. Período na URL (?periodo=7d|30d|mes|personalizado&de=&ate=), mantido ao trocar de aba. Seletor de conta (?ig=usuario, lembrado em cookie) quando houver mais de uma. Todo KPI tem um "i" explicando a conta. KPI estimado pela Meta (reach, views, total_interactions, accounts_engaged, reels_skip_rate, comments, ig_reels_video_view_total_time) leva um "*" e uma nota única no rodapé.

┌─────────────────┬─────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│      Tela       │            Rota             │                                                                                      Conteúdo                                                                                       │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                 │                             │ "O que fazer agora"; KPIs (Seguidores com ganhos/perdidos, Alcance com mediana por post e concentração, Views, Contas engajadas, Interações, Taxa de engajamento, % alcance em não  │
│ Visão geral     │ /organico                   │ seguidores, Cliques na bio), cada um com variação; gráfico diário alcance (barras) × interações (linha), últimos 2 dias em cor clara ("ainda podem mudar"); seguidores ganhos por   │
│                 │                             │ dia; seguidores novos × alcance de anúncios neste perfil (12 semanas, correlação de Pearson das semanas fechadas, mín. 6, com IC 95% por transformação z de Fisher — se o IC inclui │
│                 │                             │  zero: "não dá para concluir"; sempre "correlação não é causa"); tabela por formato (alcance, views, interações, engajamento, mediana por post com n, salvos, compartilhamentos)    │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Conteúdos       │ /organico/conteudos         │ Grade de cartões filtrável por formato, tema, "sem tema", "colaboração pendente"; cada cartão: miniatura, data, formato, alcance, engajamento (verde/laranja vs. mediana), selos    │
│                 │                             │ "usado em anúncio" (link para o anúncio), "colaboração pendente", "revisar legenda"                                                                                                 │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Detalhe do post │ /organico/conteudos/{id}    │ Mídia, legenda, link para o Instagram; todas as métricas com orgânico × pago; curva de vida (gráfico) + tabela de marcos 6 h/24 h/7 d/30 d vs. média do perfil (com n); seletor de  │
│                 │                             │ tema; colaboradores; avisos de PT-PT; comentários do post com categoria                                                                                                             │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Ranking         │ /organico/ranking           │ Seção 8                                                                                                                                                                             │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Reels           │ /organico/reels             │ Frase-resumo, tabela por faixa de duração, dispersão, tabela de cada Reel (views, views totais, % pago, alcance, % assistido, tempo médio, pulo, engajamento)                       │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Stories         │ /organico/stories           │ Por dia, a sequência com miniatura, views, alcance, saída, retenção, respostas, toques                                                                                              │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Público         │ /organico/publico           │ Idade e gênero em % (seguidores, alcançados, engajados) e "engaja X× mais que o alcançado" (% engajados ÷ % alcançados); países resumidos ("Brasil 99%" + 5 maiores); top 10        │
│                 │                             │ cidades + "ver todas"; horários online; mapa de calor de publicação. Esta tela ignora o período do topo (a demografia segue a janela da Meta)                                       │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Comentários     │ /organico/comentarios       │ Abre em "Só o que pede resposta" (pergunta + possível lead), chip "Todos", filtros por categoria/busca/só sem resposta; KPIs: total, % respondidos, mediana do tempo de resposta,   │
│                 │                             │ sem resposta +24 h, elogios sem resposta (em cinza); termos recorrentes; CSV                                                                                                        │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Fila            │ /organico/fila              │ Comentários orgânicos de 1º nível, pergunta/possível lead, sem respondido_em e sem resposta filha do perfil, post não removido; do mais antigo para o mais novo; janela 7/30/90     │
│                 │                             │ dias (padrão 30); tempo de espera; link para o post                                                                                                                                 │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Comentários de  │ /comentarios-anuncios       │ Mesma tela com origem='anuncio', com anúncio/campanha                                                                                                                               │
│ anúncios        │                             │                                                                                                                                                                                     │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Marcações       │ /organico/marcacoes         │ Uma linha por perfil que marcou (nº, curtidas, comentários, mais recente), lista completa recolhida, CSV                                                                            │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Referências     │ /organico/referencias       │ Seguidores e evolução de cada perfil de referência, últimos posts com curtidas/comentários/views. Some do menu sem perfis cadastrados                                               │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Desempenho      │ /organico/desempenho        │ Taxa de acerto e engajamento do período; por formato; por tema (ordenado por utilidade); por mês; taxa de acerto por mês × formato (com n); Reels por mês/tema (pulo, % assistido); │
│                 │                             │  conversão do perfil; fora da bolha; constância semana a semana; atendimento (número de sem resposta +24 h com link para a Fila); "N posts sem tema → Classificar agora"            │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                 │                             │ Mês × mês anterior: KPIs; 3 melhores (engajamento); 3 piores só entre os posts de alcance típico (entre P25 e P75 do alcance do mês, sem os 3 melhores; < 4 posts → nenhum pior);   │
│ Boletim         │ /organico/boletim/{AAAA-MM} │ "maior alcance do mês" à parte; tema que mais funcionou (só temas com 3+ posts, "Sem tema" não concorre); semanas com meta cumprida; seguidores no fim do mês. Variação com base <  │
│                 │                             │ 50 mostra "de X para Y" em vez de %. PDF via imprimir do navegador com CSS de impressão. No dia 1, a coleta diária grava o registro do mês anterior                                 │
├─────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Configurações   │ /configuracoes (bloco       │ Termos de classificação (+ reclassificar tudo), temas, metas de constância, alcance mínimo do ranking, perfis de referência, contas do Instagram (adicionar/remover)                │
│                 │ Orgânico)                   │                                                                                                                                                                                     │
└─────────────────┴─────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

---

11. Automação de comentários (opcional — vem desligada)

- Duas travas: chave geral AUTOMACAO_COMENTARIOS=false por padrão e o job de 1 em 1 minuto não habilitado. Sem regra ativa ou com a chave desligada, o job sai sem chamar a API.
- Polling de 1 min (webhook exige domínio com certificado válido): 1 chamada lendo comments_count de todas as publicações; só as publicações com contagem nova têm os comentários lidos. A primeira passada só registra as contagens.
- Regra: palavras (contém | exata), publicações (todas ou lista), resposta pública e/ou privada.
- Anti-excesso: só comentários posteriores a ativa_desde (religar não responde o atraso); PK comentario_id em automacao_execucoes = no máximo 1 resposta por comentário; ignora o próprio @; limite de respostas em 24 h configurável.
- Resposta pública: POST /{comentario}/replies?message=....
- Resposta privada: POST /{ig}/messages com recipient: {comment_id} usando o token da Página. Exige, no app do Instagram, "Permitir acesso às mensagens" em Ferramentas conectadas. Falha da privada não impede a pública; as duas vão para o histórico.

---

12. Webhooks (opcional, fase 2)

Rota pública /webhooks/meta que responde 404 até ser ativada. Valida a assinatura HMAC (X-Hub-Signature-256 com o App Secret) e descarta reenvios pelo hash do evento. Serve para comentários em tempo real; o polling acima continua como garantia.

---

13. Várias contas do Instagram

- Lista de contas disponíveis vem de me/accounts?fields=instagram_business_account{id,username}; ao adicionar, confira de novo na Meta.
- Cada conta tem dados, preferências (temas, termos, metas — copiados da principal ao adicionar), cache e trava próprios; o agendador roda uma conta após a outra.
- Conta nova faz a carga inicial sozinha no próximo ciclo.
- Remover tira do painel e mantém os dados.

---

14. Armadilhas da API (resumo)

1. follower_type é recusado; use follow_type.
2. Breakdown incompatível derruba a chamada inteira com erro código 1 → uma chamada por breakdown + fallback métrica a métrica.
3. Janela máxima de 30 dias entre since e until; histórico de 2 anos.
4. impressions descontinuada.
5. Filhos de carrossel não têm insights.
6. Story com < 5 views → erro #10 (não é falha).
7. /media pode devolver menos que media_count.
8. media_url expira → baixe e guarde.
9. Reels não informam duração → leia do MP4.
10. Reels não informam profile_visits.
11. online_followers vem no fuso do Pacífico e pode vir vazio.
12. Números dos últimos 2 dias ainda mudam → refaça 3 dias e mostre em cor clara.
13. Botões de contato vêm zerados se o perfil não tiver botões.
14. A fatia mpt:AD só existe nos dias com anúncio: dia com outras fatias mpt: e sem AD = 0 de anúncio; dia sem nenhuma fatia mpt: = desconhecido.
15. Respeite X-Business-Use-Case-Usage; nunca deixe chegar a 100%.

---

15. Ordem sugerida de implementação

1. Conexão: token, permissões, descoberta do IG_USER_ID, comando de diagnóstico (1.3).
2. Esquema (seção 2) e helper insights() com fallback (3.1).
3. Coleta diária da conta + perfil (3.2, 3.3) e tela Visão geral só com KPIs e gráficos.
4. Publicações + download de mídia + retratos (3.7, 3.8); telas Conteúdos e Detalhe com curva de vida.
5. Agendador com prioridades e orçamento (4); carga inicial (5).
6. Comentários + classificação + Fila (3.10, 6.1); tela Comentários.
7. Stories (3.9) e Reels (6.11).
8. Público (3.5, 3.6).
9. Desempenho, temas, constância, boletim (6.6–6.10).
10. "O que fazer agora", candidatos a anúncio, PT-PT (7, 8, 9).
11. Marcações, referências, várias contas.
12. Automação e webhooks (desligados).

Testes de aceitação mínimos

- Métrica ausente na resposta → NULL no banco e "–" na tela (nunca 0).
- Breakdown recusado → as outras métricas da chamada são gravadas e a recusada aparece em ig_falhas.
- Orgânico de um dia sem fatias mpt: → NULL; com fatias e sem AD → igual ao total.
- Classificação: "Como é bom!" → elogio; "Como faço para falar com vocês?" → possível lead; "👏👏" → elogio; "@fulano olha isso" → outros.
- Fila: comentário com resposta filha do perfil não entra, mesmo sem respondido_em.
- Cadência com 5 posts no mesmo dia conta 1 dia com post.
- Candidatos: com < 5 posts na base, lista vazia; empate no P75 não entra.
- Boletim com 3 posts: sem "piores".
- Tarefa diária com erro é refeita em 30 min e não marca a execução como feita.
- Uso da API em 80% → só roda stories, comentários e publicações 48 h; em 95% → só stories.



※ recap: Você quer reimplementar o painel Orgânico no seu SaaS, e a e
