import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  IgMidia,
  IgStory,
  IgComentario,
  IgDemografiaItem,
  OrganicKpis,
  OrganicPreferences,
} from "./organic.types.js";
import {
  DEFAULT_PREFERENCES,
  classificarComentario,
  identificarCandidatosAnuncio,
  gerarAcoesOQueFazerAgora,
} from "./organic.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../../data");

export interface OrganicStoreData {
  clientId: string;
  igUserId: string;
  username: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  kpis: OrganicKpis;
  historicoDiario: Array<{
    data: string;
    alcance: number;
    interacoes: number;
    views: number;
    novosSeguidores: number;
    foraDaBolhaPct: number;
    podeMudar?: boolean; // últimos 2 dias (Regra 14.12)
  }>;
  midias: IgMidia[];
  stories: IgStory[];
  comentarios: IgComentario[];
  demografia: IgDemografiaItem[];
  onlineFollowers: Array<{ hora: number; valor: number }>;
  preferencias: OrganicPreferences;
  marcacoes?: Array<{
    id: string;
    username: string;
    caption: string;
    mediaType: string;
    permalink: string;
    timestamp: string;
    likeCount: number;
    commentsCount: number;
  }>;
  referencias?: Array<{
    id: string;
    username: string;
    nome: string;
    followersCount: number;
    crescimentoMensalPct: number;
    postsDestaque: Array<{
      id: string;
      caption: string;
      likes: number;
      comments: number;
      views: number;
      timestamp: string;
    }>;
  }>;
}

function getStoreFilePath(clientId: string, igUserId: string): string {
  return path.join(DATA_DIR, `organic_${clientId}_${igUserId}.json`);
}

// ==========================================
// Gerador de Dados Iniciais Calibrados
// ==========================================
export function createSeedData(clientId: string, igUserId: string, username: string = "pasuri.joias"): OrganicStoreData {
  const agora = new Date();
  
  // 30 dias de histórico diário
  const historicoDiario: OrganicStoreData["historicoDiario"] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(agora);
    d.setDate(d.getDate() - i);
    const dataStr = d.toISOString().split("T")[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const baseAlcance = isWeekend ? 3200 : 2100;
    const alcance = Math.round(baseAlcance + (Math.sin(i * 0.8) * 800) + (i === 4 ? 3500 : 0));
    const interacoes = Math.round(alcance * 0.068 + Math.sin(i) * 35);
    const views = Math.round(alcance * 1.45);
    const novos = Math.round(18 + Math.sin(i * 1.2) * 12);
    const foraDaBolha = Math.round(52 + Math.cos(i * 0.5) * 18);

    historicoDiario.push({
      data: dataStr,
      alcance,
      interacoes,
      views,
      novosSeguidores: novos,
      foraDaBolhaPct: foraDaBolha,
      podeMudar: i <= 1, // últimos 2 dias com aviso "ainda podem mudar"
    });
  }

  // Mídias publicadas
  const midias: IgMidia[] = [
    {
      id: "med_101",
      mediaType: "VIDEO",
      mediaProductType: "REELS",
      legenda: "O segredo do brilho eterno: como cuidamos de cada elo de ouro 18k no nosso ateliê ✨ Qual o seu acabamento favorito? Comente EU QUERO para receber o catálogo completo no direct!",
      permalink: `https://instagram.com/p/CR101`,
      timestamp: new Date(agora.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      likeCount: 482,
      commentsCount: 39,
      mediaUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop",
      duracaoS: 28,
      tema: "Bastidores & Criação",
      temaManual: false,
      reach: 5840,
      views: 8920,
      saved: 312,
      shares: 184,
      totalInteractions: 1017,
      profileVisits: 142,
      follows: 48,
      avgWatchTimeMs: 16200,
      totalWatchTimeMs: 8920 * 16200,
      reelsSkipRate: 0.28,
    },
    {
      id: "med_102",
      mediaType: "CAROUSEL_ALBUM",
      mediaProductType: "CAROUSEL",
      legenda: "Guia definitivo: 4 combinações de anéis solitários que elevam qualquer visual 💎 Salve esse post para consultar na hora de montar sua composição!",
      permalink: `https://instagram.com/p/CR102`,
      timestamp: new Date(agora.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      likeCount: 389,
      commentsCount: 22,
      mediaUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop",
      tema: "Dicas de Estilo & Cuidados",
      reach: 4120,
      views: 5930,
      saved: 410,
      shares: 125,
      totalInteractions: 946,
      profileVisits: 98,
      follows: 34,
    },
    {
      id: "med_103",
      mediaType: "VIDEO",
      mediaProductType: "REELS",
      legenda: "Bastidores da nova coleção Esmeraldas Imperiais. Cada pedra natural foi selecionada a dedo. Quanto custa ter uma peça exclusiva? Responda no direct!",
      permalink: `https://instagram.com/p/CR103`,
      timestamp: new Date(agora.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      likeCount: 712,
      commentsCount: 64,
      mediaUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop",
      duracaoS: 18,
      tema: "Joias & Coleções",
      reach: 9400,
      views: 14800,
      saved: 580,
      shares: 340,
      totalInteractions: 1696,
      profileVisits: 310,
      follows: 92,
      avgWatchTimeMs: 13500,
      totalWatchTimeMs: 14800 * 13500,
      reelsSkipRate: 0.21,
    },
    {
      id: "med_104",
      mediaType: "IMAGE",
      mediaProductType: "FEED",
      legenda: "Detalhes que encantam. O brinco Gota Radiante em prata 925 com zircônias cravejadas manualmente. Disponível com frete grátis para todo o Brasil.",
      permalink: `https://instagram.com/p/CR104`,
      timestamp: new Date(agora.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      likeCount: 245,
      commentsCount: 14,
      mediaUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop",
      tema: "Joias & Coleções",
      reach: 2890,
      views: 3420,
      saved: 120,
      shares: 42,
      totalInteractions: 421,
      profileVisits: 45,
      follows: 11,
    },
    {
      id: "med_105",
      mediaType: "VIDEO",
      mediaProductType: "REELS",
      legenda: "Como limpar suas joias em casa em 2 minutos sem danificar o banho de ouro 💍 Dica de ouro que toda mulher precisa saber!",
      permalink: `https://instagram.com/p/CR105`,
      timestamp: new Date(agora.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      likeCount: 940,
      commentsCount: 78,
      mediaUrl: "https://images.unsplash.com/photo-1611591475819-7988358488e0?w=600&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1611591475819-7988358488e0?w=600&auto=format&fit=crop",
      duracaoS: 42,
      tema: "Dicas de Estilo & Cuidados",
      reach: 12400,
      views: 21800,
      saved: 1140,
      shares: 890,
      totalInteractions: 3048,
      profileVisits: 420,
      follows: 184,
      avgWatchTimeMs: 24000,
      totalWatchTimeMs: 21800 * 24000,
      reelsSkipRate: 0.19,
    },
    {
      id: "med_106",
      mediaType: "CAROUSEL_ALBUM",
      mediaProductType: "CAROUSEL",
      legenda: "A história do pedido de casamento da Marina e do Lucas com alianças feitas sob medida pelo nosso mestre ourives ❤️ Deslize para ver a reação!",
      permalink: `https://instagram.com/p/CR106`,
      timestamp: new Date(agora.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      likeCount: 520,
      commentsCount: 31,
      mediaUrl: "https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=600&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=600&auto=format&fit=crop",
      tema: "Depoimentos & Clientes",
      reach: 6300,
      views: 8400,
      saved: 380,
      shares: 110,
      totalInteractions: 1041,
      profileVisits: 140,
      follows: 51,
    },
  ];

  // Comentários classificados conforme a Seção 6.1
  const comentarios: IgComentario[] = [
    {
      id: "comm_001",
      midiaId: "med_103",
      midiaTitulo: "Bastidores da nova coleção Esmeraldas",
      origem: "organico",
      texto: "Qual o valor desse anel de esmeralda? Tem tamanho 16 disponível?",
      usuario: "mariana_souza_88",
      timestamp: new Date(agora.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      likeCount: 2,
      doPerfil: false,
      categoria: "possivel_lead",
    },
    {
      id: "comm_002",
      midiaId: "med_101",
      midiaTitulo: "O segredo do brilho eterno",
      origem: "organico",
      texto: "Quanto custa o colar com o pingente solitário? Vocês enviam para Curitiba?",
      usuario: "carla.albuquerque",
      timestamp: new Date(agora.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      likeCount: 1,
      doPerfil: false,
      categoria: "possivel_lead",
    },
    {
      id: "comm_003",
      midiaId: "med_105",
      midiaTitulo: "Como limpar suas joias em casa",
      origem: "organico",
      texto: "Essa dica serve para peças folheadas a ouro também ou só ouro maciço?",
      usuario: "fernanda.prado",
      timestamp: new Date(agora.getTime() - 11 * 60 * 60 * 1000).toISOString(),
      likeCount: 4,
      doPerfil: false,
      categoria: "pergunta",
    },
    {
      id: "comm_004",
      midiaId: "med_101",
      midiaTitulo: "O segredo do brilho eterno",
      origem: "organico",
      texto: "O acabamento de vocês é impecável! Recebi o meu colar ontem e amei demais 😍👏",
      usuario: "juliana_silveira",
      timestamp: new Date(agora.getTime() - 16 * 60 * 60 * 1000).toISOString(),
      likeCount: 6,
      doPerfil: false,
      categoria: "elogio",
      respondidoEm: new Date(agora.getTime() - 14 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "comm_005",
      midiaId: "med_105",
      midiaTitulo: "Como limpar suas joias em casa",
      origem: "organico",
      texto: "Como é bom aprender com quem realmente entende de ourivesaria!",
      usuario: "rodrigo.mello",
      timestamp: new Date(agora.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      likeCount: 3,
      doPerfil: false,
      categoria: "elogio", // Teste regra especial: "Como é bom!" com palavra de pergunta mas sem "?" e com elogio
    },
    {
      id: "comm_006",
      midiaId: "med_104",
      midiaTitulo: "Brinco Gota Radiante",
      origem: "organico",
      texto: "O meu pedido demorou 12 dias para chegar e a caixa veio um pouco amassada.",
      usuario: "patricia_leite",
      timestamp: new Date(agora.getTime() - 26 * 60 * 60 * 1000).toISOString(),
      likeCount: 0,
      doPerfil: false,
      categoria: "critica",
    },
  ];

  // Stories
  const stories: IgStory[] = [
    {
      id: "story_1",
      mediaType: "IMAGE",
      timestamp: new Date(agora.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      permalink: "https://instagram.com/stories/1",
      mediaUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop",
      views: 1240,
      reach: 1210,
      replies: 14,
      shares: 9,
      tapsForward: 940,
      tapsBack: 68,
      exits: 42,
    },
    {
      id: "story_2",
      mediaType: "VIDEO",
      timestamp: new Date(agora.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      permalink: "https://instagram.com/stories/2",
      mediaUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop",
      views: 1110,
      reach: 1080,
      replies: 28,
      shares: 15,
      tapsForward: 810,
      tapsBack: 92,
      exits: 64,
    },
    {
      id: "story_3",
      mediaType: "IMAGE",
      timestamp: new Date(agora.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      permalink: "https://instagram.com/stories/3",
      mediaUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop",
      views: 980,
      reach: 950,
      replies: 19,
      shares: 11,
      tapsForward: 720,
      tapsBack: 40,
      exits: 51,
      linkClicks: 38,
    },
  ];

  // Demografia
  const demografia: IgDemografiaItem[] = [
    { metrica: "follower_demographics", breakdown: "gender", chave: "F", valor: 78.4 },
    { metrica: "follower_demographics", breakdown: "gender", chave: "M", valor: 21.6 },
    { metrica: "follower_demographics", breakdown: "age", chave: "18-24", valor: 14.2 },
    { metrica: "follower_demographics", breakdown: "age", chave: "25-34", valor: 46.8 },
    { metrica: "follower_demographics", breakdown: "age", chave: "35-44", valor: 24.5 },
    { metrica: "follower_demographics", breakdown: "age", chave: "45-54", valor: 10.1 },
    { metrica: "follower_demographics", breakdown: "age", chave: "55+", valor: 4.4 },
    { metrica: "follower_demographics", breakdown: "city", chave: "São Paulo, SP", valor: 31.2 },
    { metrica: "follower_demographics", breakdown: "city", chave: "Rio de Janeiro, RJ", valor: 14.8 },
    { metrica: "follower_demographics", breakdown: "city", chave: "Belo Horizonte, MG", valor: 9.4 },
    { metrica: "follower_demographics", breakdown: "city", chave: "Curitiba, PR", valor: 7.6 },
    { metrica: "follower_demographics", breakdown: "city", chave: "Porto Alegre, RS", valor: 5.9 },
    { metrica: "follower_demographics", breakdown: "country", chave: "Brasil", valor: 98.2 },
    { metrica: "follower_demographics", breakdown: "country", chave: "Portugal", valor: 0.9 },
    { metrica: "follower_demographics", breakdown: "country", chave: "Estados Unidos", valor: 0.6 },
  ];

  // Horários online por hora (0 a 23)
  const onlineFollowers = [
    { hora: 0, valor: 840 }, { hora: 1, valor: 420 }, { hora: 2, valor: 210 }, { hora: 3, valor: 140 },
    { hora: 4, valor: 110 }, { hora: 5, valor: 190 }, { hora: 6, valor: 480 }, { hora: 7, valor: 950 },
    { hora: 8, valor: 1420 }, { hora: 9, valor: 1850 }, { hora: 10, valor: 2100 }, { hora: 11, valor: 2450 },
    { hora: 12, valor: 2900 }, { hora: 13, valor: 2750 }, { hora: 14, valor: 2600 }, { hora: 15, valor: 2840 },
    { hora: 16, valor: 3120 }, { hora: 17, valor: 3450 }, { hora: 18, valor: 4100 }, { hora: 19, valor: 4890 },
    { hora: 20, valor: 5120 }, { hora: 21, valor: 4780 }, { hora: 22, valor: 3600 }, { hora: 23, valor: 1980 },
  ];

  // KPIs consolidados
  const totalAlcance = historicoDiario.reduce((acc, h) => acc + h.alcance, 0);
  const totalInteracoes = historicoDiario.reduce((acc, h) => acc + h.interacoes, 0);
  const totalViews = historicoDiario.reduce((acc, h) => acc + h.views, 0);
  const totalGanhos = historicoDiario.reduce((acc, h) => acc + h.novosSeguidores, 0);
  const totalPerdidos = Math.round(totalGanhos * 0.28);

  const kpis: OrganicKpis = {
    seguidores: {
      total: 28450,
      ganhos: totalGanhos,
      perdidos: totalPerdidos,
      saldo: totalGanhos - totalPerdidos,
      variacaoPct: 14.8,
    },
    alcance: {
      valor: totalAlcance,
      medianaPorPost: 4120,
      variacaoPct: 22.4,
    },
    views: {
      valor: totalViews,
      variacaoPct: 31.2,
    },
    contasEngajadas: {
      valor: Math.round(totalAlcance * 0.12),
      variacaoPct: 18.9,
    },
    interacoes: {
      valor: totalInteracoes,
      variacaoPct: 19.5,
    },
    taxaEngajamento: {
      valor: Number(((totalInteracoes / totalAlcance) * 100).toFixed(2)),
      variacaoPct: 1.8,
    },
    foraDaBolhaPct: {
      valor: 64.2,
      variacaoPct: 8.5,
    },
    cliquesBio: {
      valor: 489,
      variacaoPct: 28.1,
    },
  };

  return {
    clientId,
    igUserId,
    username,
    followersCount: 28450,
    followsCount: 420,
    mediaCount: 184,
    kpis,
    historicoDiario,
    midias,
    stories,
    comentarios,
    demografia,
    onlineFollowers,
    preferencias: DEFAULT_PREFERENCES,
  };
}

export function getOrganicData(clientId: string, igUserId: string, username?: string): OrganicStoreData {
  const filePath = getStoreFilePath(clientId, igUserId);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Erro ao ler organic store:", err);
  }

  // Se não existir, gera dados calibrados e salva
  const seed = createSeedData(clientId, igUserId, username);
  saveOrganicData(clientId, igUserId, seed);
  return seed;
}

export function saveOrganicData(clientId: string, igUserId: string, data: OrganicStoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = getStoreFilePath(clientId, igUserId);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar organic store:", err);
  }
}

