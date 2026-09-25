/**
 * GFB Growth OS — P2P WhatsApp Warming Network Service (Aquecedor de Chips)
 * Realiza conversas autônomas entre instâncias para elevar a reputação dos números
 * antes de disparos em massa em lançamentos, simulando interações humanas reais
 * (mensagens de texto, áudios curtos simulados, reações e figurinhas).
 */

import { mockDb, MockWhatsAppInstance } from "./mockDb.js";
import { eventBus } from "./eventBus.js";

export interface WarmingPair {
  id: string;
  chipA: string; // instanceKey
  phoneA: string;
  chipB: string; // instanceKey
  phoneB: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  dayInSchedule: number;
  totalExchangedMessages: number;
  healthScoreA: number;
  healthScoreB: number;
  lastInteractionTime: string;
  conversationTopic: string;
}

export interface WarmingMessageLog {
  id: string;
  pairId: string;
  senderChip: string;
  senderPhone: string;
  receiverChip: string;
  receiverPhone: string;
  messageType: "TEXT" | "AUDIO_SIMULATION" | "REACTION" | "STICKER";
  content: string;
  timestamp: string;
}

class WarmingNetworkService {
  private warmingPairs: WarmingPair[] = [
    {
      id: "warm_pair_01",
      chipA: "aqc_bruna_01",
      phoneA: "+5511998877661",
      chipB: "aqc_bruna_02",
      phoneB: "+5511998877662",
      status: "ACTIVE",
      dayInSchedule: 5,
      totalExchangedMessages: 184,
      healthScoreA: 94,
      healthScoreB: 92,
      lastInteractionTime: "Há 4 minutos",
      conversationTopic: "Planejamento de Lançamento & Agenda",
    },
    {
      id: "warm_pair_02",
      chipA: "aqc_bruna_03",
      phoneA: "+5511998877663",
      chipB: "aqc_bruna_04",
      phoneB: "+556492180233",
      status: "PAUSED",
      dayInSchedule: 2,
      totalExchangedMessages: 28,
      healthScoreA: 78,
      healthScoreB: 45,
      lastInteractionTime: "Há 2 horas (Pausado por desconexão)",
      conversationTopic: "Perguntas Frequentes de Alunos",
    },
  ];

  private recentLogs: WarmingMessageLog[] = [
    {
      id: "log_01",
      pairId: "warm_pair_01",
      senderChip: "aqc_bruna_01",
      senderPhone: "+5511998877661",
      receiverChip: "aqc_bruna_02",
      receiverPhone: "+5511998877662",
      messageType: "TEXT",
      content: "Você conseguiu fechar a pauta da live de quinta-feira?",
      timestamp: "14:28:10",
    },
    {
      id: "log_02",
      pairId: "warm_pair_01",
      senderChip: "aqc_bruna_02",
      senderPhone: "+5511998877662",
      receiverChip: "aqc_bruna_01",
      receiverPhone: "+5511998877661",
      messageType: "AUDIO_SIMULATION",
      content: "🎙️ Áudio (0:14) — 'Sim, já enviei no grupo com o resumo dos tópicos'",
      timestamp: "14:28:45",
    },
    {
      id: "log_03",
      pairId: "warm_pair_01",
      senderChip: "aqc_bruna_01",
      senderPhone: "+5511998877661",
      receiverChip: "aqc_bruna_02",
      receiverPhone: "+5511998877662",
      messageType: "REACTION",
      content: "👍 Reagiu à mensagem",
      timestamp: "14:29:02",
    },
  ];

  private naturalDialogueTemplates = [
    {
      topic: "Agenda Médica & Consultório",
      exchanges: [
        { a: "Boa tarde, tudo bem? Você teria horário disponível para quinta à tarde?", b: "Olá! Tudo ótimo e você? Na quinta tenho às 14h30 ou 16h, qual fica melhor?" },
        { a: "Perfeito, as 16h fica excelente. O atendimento é na clínica da Av. Paulista?", b: "Isso mesmo! Já deixei agendado no sistema. Te envio a confirmação amanhã cedo." },
      ],
    },
    {
      topic: "Dúvidas sobre o Curso de MTC",
      exchanges: [
        { a: "Oi! Você já assistiu a aula sobre diagnóstico por pulso?", b: "Comecei ontem à noite! A parte sobre pulso superficial e profundo é muito prática." },
        { a: "Com certeza, amanhã vou aplicar com os pacientes no consultório.", b: "Depois me conta como foi a resposta clínica!" },
      ],
    },
  ];

  /**
   * Retorna os pares de aquecimento ativos e estatísticas
   */
  public getWarmingStatus() {
    const totalActive = this.warmingPairs.filter((p) => p.status === "ACTIVE").length;
    const totalMessages = this.warmingPairs.reduce((acc, curr) => acc + curr.totalExchangedMessages, 0);
    const avgHealth = Math.round(
      this.warmingPairs.reduce((acc, curr) => acc + curr.healthScoreA + curr.healthScoreB, 0) /
        (this.warmingPairs.length * 2 || 1)
    );

    return {
      totalActivePairs: totalActive,
      totalExchangedMessages: totalMessages,
      averageReputationScore: avgHealth,
      pairs: this.warmingPairs,
      recentLogs: this.recentLogs.slice(0, 10),
    };
  }

  /**
   * Alterna status do par (ACTIVE / PAUSED)
   */
  public togglePairStatus(pairId: string, status?: "ACTIVE" | "PAUSED"): WarmingPair {
    const pair = this.warmingPairs.find((p) => p.id === pairId);
    if (!pair) {
      throw new Error("Par de aquecimento não encontrado");
    }

    pair.status = status || (pair.status === "ACTIVE" ? "PAUSED" : "ACTIVE");
    pair.lastInteractionTime = "Atualizado agora";

    eventBus.broadcast({
      type: "WARMING_STEP",
      payload: {
        action: "STATUS_CHANGED",
        pairId: pair.id,
        status: pair.status,
      },
    });

    return pair;
  }

  /**
   * Executa um passo do ciclo de aquecimento simulado entre chips
   */
  public triggerSimulatedWarmStep(pairId: string): WarmingMessageLog {
    const pair = this.warmingPairs.find((p) => p.id === pairId);
    if (!pair) throw new Error("Par não encontrado");

    const template = this.naturalDialogueTemplates[Math.floor(Math.random() * this.naturalDialogueTemplates.length)];
    const exchange = template.exchanges[Math.floor(Math.random() * template.exchanges.length)];

    const isFromA = Math.random() > 0.5;
    const sender = isFromA ? pair.chipA : pair.chipB;
    const senderPhone = isFromA ? pair.phoneA : pair.phoneB;
    const receiver = isFromA ? pair.chipB : pair.chipA;
    const receiverPhone = isFromA ? pair.phoneB : pair.phoneA;
    const text = isFromA ? exchange.a : exchange.b;

    const newLog: WarmingMessageLog = {
      id: `log_${Date.now()}`,
      pairId: pair.id,
      senderChip: sender,
      senderPhone,
      receiverChip: receiver,
      receiverPhone,
      messageType: Math.random() > 0.8 ? "AUDIO_SIMULATION" : "TEXT",
      content: text,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    pair.totalExchangedMessages += 1;
    pair.healthScoreA = Math.min(99, pair.healthScoreA + 1);
    pair.healthScoreB = Math.min(99, pair.healthScoreB + 1);
    pair.lastInteractionTime = "Agora mesmo";

    this.recentLogs.unshift(newLog);

    eventBus.broadcast({
      type: "WARMING_STEP",
      payload: newLog,
    });

    return newLog;
  }

  /**
   * Pausa automaticamente chips caso ocorra desconexão (Prevenção de Queima de Chip)
   */
  public handleChipDisconnect(instanceKey: string) {
    for (const pair of this.warmingPairs) {
      if (pair.chipA === instanceKey || pair.chipB === instanceKey) {
        pair.status = "PAUSED";
        pair.lastInteractionTime = `Pausado preventivamente (Chip ${instanceKey} offline)`;
      }
    }
  }
}

export const warmingNetworkService = new WarmingNetworkService();
