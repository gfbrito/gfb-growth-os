export interface OrganicKpi {
  valor: number | null;
  variacaoPct?: number | null;
  medianaPorPost?: number | null;
  topPostConcentracaoPct?: number | null;
  ganhos?: number;
  perdidos?: number;
  saldo?: number;
}

export interface OrganicKpisState {
  seguidores: { total: number; ganhos: number; perdidos: number; saldo: number; variacaoPct?: number | null };
  alcance: { valor: number | null; medianaPorPost: number | null; variacaoPct?: number | null; topPostConcentracaoPct?: number | null };
  views: { valor: number | null; variacaoPct?: number | null };
  contasEngajadas: { valor: number | null; variacaoPct?: number | null };
  interacoes: { valor: number | null; variacaoPct?: number | null };
  taxaEngajamento: { valor: number; variacaoPct?: number | null };
  pctNaoSeguidores?: { valor: number | null; variacaoPct?: number | null };
  foraDaBolhaPct?: { valor: number | null; variacaoPct?: number | null };
  cliquesBio: { valor: number | null; variacaoPct?: number | null };
}

export interface OrganicAction {
  id: string;
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  titulo: string;
  descricao: string;
  categoria: 'comentarios' | 'anuncios' | 'formato' | 'conteudo' | 'perfil';
  acaoLabel: string;
  acaoUrl?: string;
}

export interface OrganicPost {
  id: string;
  caption: string;
  legenda: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  mediaProductType: 'REELS' | 'FEED' | 'CAROUSEL' | 'STORY';
  mediaUrl: string;
  permalink: string;
  timestamp: string;
  reach: number | null;
  views: number | null;
  likes: number;
  comments: number;
  saved: number;
  shares: number;
  totalInteractions: number;
  taxaEngajamento?: number;
  engajamentoAcimaMediana?: boolean;
  tema?: string;
  usadoEmAnuncio?: boolean;
  adCampanhaNome?: string;
  avisosPtPt?: Array<{ termoEncontrado: string; sugestaoPtBr: string; contexto: string }>;
  tempoAssistidoMedioSegundos?: number;
  reelsSkipRate?: number;
  metricasTempo?: {
    h6: { reach: number; interactions: number };
    h24: { reach: number; interactions: number };
    d7: { reach: number; interactions: number };
    d30: { reach: number; interactions: number };
  };
}

export interface OrganicStory {
  id: string;
  timestamp: string;
  mediaUrl: string;
  views: number | null;
  exits: number | null;
  replies: number;
  tapsForward: number;
  tapsBack: number;
  ordemDia: number;
  taxaSaidaPct?: number;
  retencaoPct?: number;
}

export interface OrganicComment {
  id: string;
  postId: string;
  usuario: string;
  texto: string;
  timestamp: string;
  categoria: 'possivel_lead' | 'pergunta' | 'elogio' | 'critica' | 'neutro';
  categoriaConfianca: number;
  respondidoEm?: string;
  doPerfil?: boolean;
}

export interface DemographicData {
  faixasEtarias: Array<{ faixa: string; homem: number; mulher: number }>;
  principaisCidades: Array<{ cidade: string; estado: string; percentual: number }>;
  paises: Array<{ pais: string; percentual: number }>;
  genero: { feminino: number; masculino: number };
}

export interface OnlineFollowerHour {
  hora: number;
  valor: number;
}

