export type MediaProductType = "FEED" | "REELS" | "STORY" | "CAROUSEL" | "AD";
export type MediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
export type CommentCategory = "possivel_lead" | "pergunta" | "elogio" | "critica" | "outros";

export interface IgPerfilDiario {
  data: string; // YYYY-MM-DD
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  coletadoEm: string;
}

export interface IgContaDiarioMetric {
  data: string;
  metrica: string;
  fatia: string; // "total" | "mpt:FEED" | "mpt:REELS" | "mpt:STORY" | "mpt:AD" | "follow:FOLLOWER" | "follow:NON_FOLLOWER"
  valor: number | null;
}

export interface IgMidia {
  id: string;
  mediaType: MediaType;
  mediaProductType: MediaProductType;
  legenda: string;
  permalink: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
  mediaUrl: string;
  thumbnailUrl?: string;
  duracaoS?: number; // duração em segundos para Reels
  compartilhadoFb?: boolean;
  tema?: string;
  temaManual?: boolean;
  adsJson?: string[]; // IDs dos anúncios que usam o post
  removida?: boolean;
  
  // Métricas do último retrato (leitura rápida)
  reach?: number | null;
  views?: number | null;
  saved?: number | null;
  shares?: number | null;
  reposts?: number | null;
  totalInteractions?: number | null;
  profileVisits?: number | null;
  follows?: number | null;
  totalLikes?: number | null;
  totalComments?: number | null;
  totalViews?: number | null;
  
  // Métricas específicas de Reels
  avgWatchTimeMs?: number | null;
  totalWatchTimeMs?: number | null;
  reelsSkipRate?: number | null;
}

export interface IgMidiaRetrato {
  midiaId: string;
  momento: string;
  idadeH: number;
  metrica: string;
  valor: number;
}

export interface IgStory {
  id: string;
  mediaType: MediaType;
  timestamp: string;
  permalink: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  menosDe5?: boolean; // Erro #10 (menos de 5 visualizações)
  views?: number | null;
  reach?: number | null;
  replies?: number | null;
  shares?: number | null;
  reposts?: number | null;
  tapsForward?: number | null;
  tapsBack?: number | null;
  exits?: number | null;
  linkClicks?: number | null;
}

export interface IgComentario {
  id: string;
  midiaId: string;
  midiaTitulo?: string;
  midiaThumbnail?: string;
  origem: "organico" | "anuncio";
  paiId?: string | null;
  texto: string;
  usuario: string;
  usuarioId?: string;
  timestamp: string;
  likeCount: number;
  doPerfil: boolean;
  respondidoEm?: string | null;
  categoria: CommentCategory;
}

export interface IgDemografiaItem {
  metrica: "follower_demographics" | "engaged_audience_demographics" | "reached_audience_demographics";
  breakdown: "age" | "gender" | "city" | "country";
  chave: string; // Ex: "25-34", "F", "São Paulo, Brazil", "BR"
  valor: number;
}

export interface ActionBoxItem {
  id: string;
  prioridade: number; // 1 (mais alta) a 6
  titulo: string;
  descricao: string;
  rota: string;
  badge?: string;
  tipo: "lead" | "collab" | "ad_stopped" | "cadencia" | "candidato_ad" | "dia_publicar";
}

export interface OrganicKpis {
  seguidores: {
    total: number;
    ganhos: number;
    perdidos: number;
    saldo: number;
    variacaoPct?: number;
  };
  alcance: {
    valor: number;
    medianaPorPost: number;
    concentracaoAlerta?: string; // Ex: "48% do alcance veio de 1 post"
    variacaoPct?: number;
  };
  views: {
    valor: number;
    variacaoPct?: number;
  };
  contasEngajadas: {
    valor: number;
    variacaoPct?: number;
  };
  interacoes: {
    valor: number;
    variacaoPct?: number;
  };
  taxaEngajamento: {
    valor: number; // interações / alcance * 100
    variacaoPct?: number;
  };
  foraDaBolhaPct: {
    valor: number; // % não seguidores
    variacaoPct?: number;
  };
  cliquesBio: {
    valor: number;
    variacaoPct?: number;
  };
}

export interface OrganicThemeConfig {
  nome: string;
  palavras: string[];
}

export interface OrganicPreferences {
  temas: OrganicThemeConfig[];
  termosLead: string[];
  termosCritica: string[];
  termosPergunta: string[];
  termosElogio: string[];
  metasSemanais: {
    feed: number;
    reels: number;
    carousel: number;
    storiesPorDia: number;
  };
  alcanceMinimoRanking: number;
  referencias: string[];
}

