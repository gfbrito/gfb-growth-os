import {
  CommentCategory,
  IgComentario,
  IgMidia,
  ActionBoxItem,
  OrganicPreferences,
} from "./organic.types.js";

// ==========================================
// 1. Preferências Padrão (Seções 6.1, 6.7, 6.8)
// ==========================================
export const DEFAULT_PREFERENCES: OrganicPreferences = {
  temas: [
    { nome: "Joias & Coleções", palavras: ["joia", "ouro", "prata", "anel", "brinco", "colar", "pingente", "diamante"] },
    { nome: "Bastidores & Criação", palavras: ["bastidores", "producao", "atelier", "criacao", "ourives", "processo"] },
    { nome: "Dicas de Estilo & Cuidados", palavras: ["dica", "cuidado", "limpar", "look", "combinar", "tamanho", "estilo"] },
    { nome: "Depoimentos & Clientes", palavras: ["cliente", "depoimento", "entrega", "unboxing", "presente", "noivado"] },
  ],
  termosLead: [
    "quanto custa", "valor", "preco", "orcamento", "contato", "whatsapp", "zap", "telefone",
    "como faco", "quero saber", "tenho interesse", "me chama", "chama no direct", "direct",
    "atendem", "consulta", "entrega", "frete", "comprar", "pedido", "link", "parcela",
    "me ajuda", "preciso de ajuda", "informacao", "info", "tamanho", "disponivel"
  ],
  termosCritica: [
    "golpe", "mentira", "pessimo", "horrivel", "nao funciona", "enganacao", "absurdo", "ruim", "fake", "picareta", "demora", "atraso", "defeito"
  ],
  termosPergunta: [
    "?", "como", "qual", "quando", "onde", "quanto", "pode", "posso", "sera que", "alguem sabe", "tem como", "enviam"
  ],
  termosElogio: [
    "parabens", "otimo", "excelente", "top", "show", "maravilh", "obrigad", "gratidao", "incrivel", "muito bom",
    "sensacional", "lindo", "linda", "perfeito", "perfeita", "amei", "apaixonada", "👏", "🙌", "❤", "🔥", "💪", "😍", "✨"
  ],
  metasSemanais: {
    feed: 2,
    reels: 3,
    carousel: 1,
    storiesPorDia: 3,
  },
  alcanceMinimoRanking: 100,
  referencias: [],
};

// ==========================================
// 2. Classificação de Comentários sem IA (Seção 6.1)
// ==========================================
export function normalizarTexto(txt: string): string {
  return txt
    .replace(/@\w+/g, "") // remove @menções
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, " ")
    .trim();
}

function contemTermo(textoNorm: string, textoOriginal: string, termo: string): boolean {
  const termoNorm = normalizarTexto(termo);

  // Se o termo não tem letras (emoji, "?" etc.), procura no texto original
  if (!/[a-z0-9]/i.test(termo)) {
    return textoOriginal.includes(termo);
  }

  // Termo curto (<= 2 letras), com espaço ou não alfanumérico -> busca por trecho
  if (termoNorm.length <= 2 || termoNorm.includes(" ") || /[^a-z0-9]/i.test(termoNorm)) {
    return textoNorm.includes(termoNorm);
  }

  // Palavra isolada -> início de palavra (\btermo)
  const regex = new RegExp(`\\b${termoNorm}`, "i");
  return regex.test(textoNorm);
}

export function classificarComentario(texto: string, prefs: OrganicPreferences = DEFAULT_PREFERENCES): CommentCategory {
  const norm = normalizarTexto(texto);

  // 1. Possível Lead (prioridade máxima)
  for (const termo of prefs.termosLead) {
    if (contemTermo(norm, texto, termo)) {
      return "possivel_lead";
    }
  }

  // 2. Crítica
  for (const termo of prefs.termosCritica) {
    if (contemTermo(norm, texto, termo)) {
      return "critica";
    }
  }

  // 3. Checagem de Pergunta vs Elogio:
  // Regra especial: Se começa com palavra de pergunta, mas NÃO tem "?" e casa com elogio ("Como é bom!") -> é elogio!
  const temInterrogacao = texto.includes("?");
  const comecaComPergunta = prefs.termosPergunta.some(p => {
    const pNorm = normalizarTexto(p);
    return pNorm !== "?" && norm.startsWith(pNorm);
  });

  const casaComElogio = prefs.termosElogio.some(t => contemTermo(norm, texto, t));

  if (comecaComPergunta && !temInterrogacao && casaComElogio) {
    return "elogio";
  }

  if (temInterrogacao || comecaComPergunta) {
    return "pergunta";
  }

  // 4. Elogio
  if (casaComElogio) {
    return "elogio";
  }

  return "outros";
}

// ==========================================
// 3. Verificação de Português de Portugal (Seção 9)
// ==========================================
const PT_PT_WORDS: Record<string, string> = {
  facto: "fato",
  equipa: "equipe",
  contacto: "contato",
  contactar: "contatar",
  telemovel: "celular",
  ecra: "tela",
  registo: "registro",
  rececao: "recepção",
  autocarro: "ônibus",
  rapariga: "moça",
  accao: "ação",
  projecto: "projeto",
  optimo: "ótimo",
};

export function verificarPtPt(legenda: string): string[] {
  const avisos: string[] = [];
  const limpa = legenda
    .replace(/#\w+/g, "") // remove hashtags
    .replace(/@\w+/g, "") // remove @
    .replace(/https?:\/\/\S+/g, ""); // remove links

  const norm = normalizarTexto(limpa);

  for (const [ptPt, br] of Object.entries(PT_PT_WORDS)) {
    const regex = new RegExp(`\\b${ptPt}\\b`, "i");
    if (regex.test(norm)) {
      avisos.push(`"${ptPt}" → use "${br}"`);
    }
  }

  // "estar/andar + a + infinitivo" (ex: "está a preparar")
  const regexInfinitivo = /\b(esta|estao|estamos|estava|estavam|anda|andam|andava)\s+a\s+([a-z]+(?:ar|er|ir))\b/gi;
  let match;
  while ((match = regexInfinitivo.exec(norm)) !== null) {
    const verbo = match[1];
    const inf = match[2];
    if (inf !== "par" && inf !== "favor") {
      avisos.push(`"${match[0]}" → prefira gerúndio brasileiro ("${verbo} ${inf.slice(0, -2)}ando/endo")`);
    }
  }

  return avisos;
}

// ==========================================
// 4. Candidatos a Anúncio (Seção 8 - Percentil 75)
// ==========================================
export function calcularPercentil75(valores: number[]): number {
  if (valores.length === 0) return 0;
  const sorted = [...valores].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 1) return sorted[0];

  // PERCENTIL.INC: (n - 1) * 0.75
  const index = 0.75 * (n - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function identificarCandidatosAnuncio(
  midias: IgMidia[],
  minAlcance: number = 100
): { candidatos: IgMidia[]; cortePercentil: number } {
  // Base: posts com alcance >= 50
  const baseValida = midias.filter((m) => (m.reach ?? 0) >= 50);

  if (baseValida.length < 5) {
    return { candidatos: [], cortePercentil: 0 };
  }

  // Taxa de engajamento por alcance de cada post
  const taxas = baseValida.map((m) => ((m.totalInteractions ?? 0) / (m.reach || 1)) * 100);
  const corte = calcularPercentil75(taxas);

  const agora = Date.now();
  const limite90d = agora - 90 * 24 * 60 * 60 * 1000;

  // Elegíveis: últimos 90 dias, alcance >= minAlcance, sem anúncio, engajamento > corte
  const elegiveis = midias.filter((m) => {
    const ts = new Date(m.timestamp).getTime();
    const alcance = m.reach ?? 0;
    const taxa = ((m.totalInteractions ?? 0) / (alcance || 1)) * 100;
    const semAnuncio = !m.adsJson || m.adsJson.length === 0;

    return ts >= limite90d && alcance >= minAlcance && semAnuncio && taxa > corte;
  });

  // Ordena por engajamento decrescente e pega os 6 melhores
  elegiveis.sort((a, b) => {
    const taxaA = ((a.totalInteractions ?? 0) / (a.reach || 1)) * 100;
    const taxaB = ((b.totalInteractions ?? 0) / (b.reach || 1)) * 100;
    return taxaB - taxaA;
  });

  return {
    candidatos: elegiveis.slice(0, 6),
    cortePercentil: Number(corte.toFixed(2)),
  };
}

// ==========================================
// 5. Caixa "O Que Fazer Agora" (Seção 7)
// ==========================================
export function gerarAcoesOQueFazerAgora(
  comentarios: IgComentario[],
  midias: IgMidia[],
  candidatosAd: IgMidia[]
): ActionBoxItem[] {
  const acoes: ActionBoxItem[] = [];

  // 1. Comentários sem resposta
  const pendentes = comentarios.filter((c) => !c.respondidoEm && !c.doPerfil);
  const leadsSemResposta = pendentes.filter((c) => c.categoria === "possivel_lead");
  const perguntasSemResposta = pendentes.filter((c) => c.categoria === "pergunta");

  if (leadsSemResposta.length > 0 || perguntasSemResposta.length > 0) {
    const leadCount = leadsSemResposta.length;
    const pergCount = perguntasSemResposta.length;
    
    let desc = "Responder ";
    const partes: string[] = [];
    if (leadCount > 0) partes.push(`${leadCount} possível${leadCount > 1 ? "is" : ""} lead${leadCount > 1 ? "s" : ""}`);
    if (pergCount > 0) partes.push(`${pergCount} pergunta${pergCount > 1 ? "s" : ""}`);
    desc += partes.join(" e ") + " nos comentários da Fila";

    acoes.push({
      id: "acao_comentarios",
      prioridade: leadCount > 0 ? 1 : 2,
      titulo: leadCount > 0 ? "Oportunidades de Venda Pendentes" : "Perguntas de Seguidores sem Resposta",
      descricao: desc,
      rota: "comentarios",
      badge: `${leadCount + pergCount} pendentes`,
      tipo: "lead",
    });
  }

  // 2. Candidatos a anúncio
  if (candidatosAd.length > 0) {
    acoes.push({
      id: "acao_candidatos_ad",
      prioridade: 4,
      titulo: `${candidatosAd.length} Publicações Prontas para Virar Anúncio`,
      descricao: "Posts com engajamento acima do percentil 75 orgânico. Validados para tráfego pago.",
      rota: "ranking",
      badge: "Percentil 75+",
      tipo: "candidato_ad",
    });
  }

  // 3. Cadência de publicação
  if (midias.length >= 2) {
    const ordenadas = [...midias].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const ultimoPost = new Date(ordenadas[0].timestamp).getTime();
    const diasDesdeUltimo = Math.floor((Date.now() - ultimoPost) / (1000 * 60 * 60 * 24));

    if (diasDesdeUltimo >= 3) {
      acoes.push({
        id: "acao_cadencia",
        prioridade: 3,
        titulo: `Perfil sem novos posts há ${diasDesdeUltimo} dias`,
        descricao: "O algoritmo prioriza constância. Horário de maior audiência hoje: ~19h.",
        rota: "conteudos",
        badge: `${diasDesdeUltimo}d sem post`,
        tipo: "cadencia",
      });
    } else {
      acoes.push({
        id: "acao_dia_publicar",
        prioridade: 5,
        titulo: "Janela Ideal de Publicação Ativa",
        descricao: "Seu público tem pico de retenção no início da noite (~19h às 21h).",
        rota: "conteudos",
        tipo: "dia_publicar",
      });
    }
  }

  // Ordena por prioridade e pega até 5
  return acoes.sort((a, b) => a.prioridade - b.prioridade).slice(0, 5);
}

