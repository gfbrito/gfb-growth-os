import React, { useState, useEffect } from 'react';
import {
  Info,
  Download,
  Activity,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { OrganicOverview } from './OrganicOverview';
import { OrganicContents } from './OrganicContents';
import { OrganicRanking } from './OrganicRanking';
import { OrganicReelsStories } from './OrganicReelsStories';
import { OrganicAudience } from './OrganicAudience';
import { OrganicComments } from './OrganicComments';
import { OrganicPerformance } from './OrganicPerformance';
import { OrganicReportModal } from './OrganicReportModal';
import { OrganicDiagnosticModal } from './OrganicDiagnosticModal';
import type {
  OrganicKpisState,
  OrganicAction,
  OrganicPost,
  OrganicStory,
  OrganicComment,
  DemographicData,
  OnlineFollowerHour,
} from './organic.types';

export type OrganicTab =
  | 'visao_geral'
  | 'conteudos'
  | 'ranking'
  | 'reels'
  | 'stories'
  | 'publico'
  | 'comentarios'
  | 'marcacoes'
  | 'desempenho'
  | 'pautas';

interface OrganicPanelProps {
  client: any;
}

export function OrganicPanel({ client }: OrganicPanelProps) {
  const clientId = client?.id || 'cli_ar_advocacia';
  const clientName = client?.tradeName || client?.name || 'AR Advocacia Empresarial';

  // Selected Instagram Account
  const igAccounts = client?.selectedInstagramAccounts && client.selectedInstagramAccounts.length > 0
    ? client.selectedInstagramAccounts
    : [
        { id: '17841400000000001', username: 'aradvocaciaoficial', name: 'AR Advocacia Oficial' },
        { id: '17841400000000002', username: 'arparaquemproduz', name: 'AR Para Quem Produz' },
      ];

  const [selectedIgAccount, setSelectedIgAccount] = useState<string>(
    igAccounts[0]?.id || '17841400000000001'
  );

  useEffect(() => {
    if (igAccounts && igAccounts.length > 0) {
      if (!igAccounts.some((a: any) => a.id === selectedIgAccount)) {
        setSelectedIgAccount(igAccounts[0]?.id || '17841400000000001');
      }
    }
  }, [client?.id]);

  const currentAccountObj = igAccounts.find((a: any) => a.id === selectedIgAccount) || igAccounts[0];
  const currentUsername = currentAccountObj?.username || 'aradvocaciaoficial';

  // Sub-tabs & Period State (Foto 5)
  const [activeSubTab, setActiveSubTab] = useState<OrganicTab>('visao_geral');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  const [showMode, setShowMode] = useState<'organico' | 'total'>('organico');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);

  // Organic Data States
  const [perfil, setPerfil] = useState<any>(null);
  const [kpis, setKpis] = useState<OrganicKpisState | null>(null);
  const [acoes, setAcoes] = useState<OrganicAction[]>([]);
  const [formatos, setFormatos] = useState<any[]>([]);
  const [curvaDiaria, setCurvaDiaria] = useState<any[]>([]);
  const [correlacao12Semanas, setCorrelacao12Semanas] = useState<any[]>([]);
  const [correlacaoTexto, setCorrelacaoTexto] = useState<string>('');
  const [toquesBotao, setToquesBotao] = useState<any[]>([]);

  const [posts, setPosts] = useState<OrganicPost[]>([]);
  const [medianaEngajamento, setMedianaEngajamento] = useState<number>(3.5);
  const [temasDisponiveis, setTemasDisponiveis] = useState<string[]>([]);

  const [candidatosAnuncio, setCandidatosAnuncio] = useState<OrganicPost[]>([]);
  const [cortePercentil, setCortePercentil] = useState<number>(4.8);
  const [top10, setTop10] = useState<OrganicPost[]>([]);
  const [piores10, setPiores10] = useState<OrganicPost[]>([]);
  const [alcanceMinimoRanking, setAlcanceMinimoRanking] = useState<number>(500);

  const [reelsFaixas, setReelsFaixas] = useState<any[]>([]);
  const [stories, setStories] = useState<OrganicStory[]>([]);

  const [demografia, setDemografia] = useState<DemographicData | null>(null);
  const [onlineFollowers, setOnlineFollowers] = useState<OnlineFollowerHour[]>([]);
  const [melhorHorario, setMelhorHorario] = useState<string>('19:00');
  const [dicaHorario, setDicaHorario] = useState<string>('');

  const [comments, setComments] = useState<OrganicComment[]>([]);
  const [commentsTotal, setCommentsTotal] = useState<number>(0);
  const [commentsRespondidos, setCommentsRespondidos] = useState<number>(0);
  const [commentsPct, setCommentsPct] = useState<number>(0);
  const [pendentesLead, setPendentesLead] = useState<number>(0);
  const [tempoMedioResposta, setTempoMedioResposta] = useState<string>('1h 45min');

  const [taxaAcertoPct, setTaxaAcertoPct] = useState<number>(50);
  const [metasSemanais, setMetasSemanais] = useState<any>({ postsFeed: 2, reels: 3, carrosseis: 1, stories: 20 });
  const [semanasConstancia, setSemanasConstancia] = useState<any[]>([]);
  const [conversaoPerfil, setConversaoPerfil] = useState<any>({ seguidoresPorMilAlcancados: 7.2, cliquesBioPorMil: 4.5 });

  const [diagnostico, setDiagnostico] = useState<any>({
    diagnosticoGeral: 'PERFEITO',
    versaoApi: 'v20.0 / v26.0',
    horarioVerificacao: new Date().toISOString(),
    endpoints: [],
  });

  // Fetch all organic endpoints
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const q = `?ig=${selectedIgAccount}&user=${currentUsername}&periodo=${selectedPeriod}`;

      // 1. Visão Geral
      const resVg = await fetch(`/api/organic/${clientId}/visao-geral${q}`);
      if (resVg.ok) {
        const d = await resVg.json();
        setPerfil(d.perfil);
        setKpis(d.kpis);
        setAcoes(d.acoesOQueFazerAgora || d.acoes || []);
        setFormatos(d.quebraPorFormato || d.formatos || []);
        setCurvaDiaria(d.historicoDiario || d.curvaDiaria || []);
        setCorrelacao12Semanas(d.correlacaoAnuncios12Semanas || []);
        setCorrelacaoTexto(d.correlacaoTexto || '');
        setToquesBotao(d.toquesLinksBotao || []);
      }

      // 2. Conteúdos
      const resCont = await fetch(`/api/organic/${clientId}/conteudos${q}`);
      if (resCont.ok) {
        const d = await resCont.json();
        setPosts(d.conteudos || []);
        setMedianaEngajamento(d.medianaEngajamento || 3.5);
        setTemasDisponiveis(d.temasDisponiveis || []);
      }

      // 3. Ranking
      const resRank = await fetch(`/api/organic/${clientId}/ranking${q}`);
      if (resRank.ok) {
        const d = await resRank.json();
        setCandidatosAnuncio(d.candidatosAnuncio || []);
        setCortePercentil(d.cortePercentil || 4.8);
        setTop10(d.top10 || []);
        setPiores10(d.piores10 || []);
        setAlcanceMinimoRanking(d.alcanceMinimo || 500);
      }

      // 4. Reels
      const resReels = await fetch(`/api/organic/${clientId}/reels${q}`);
      if (resReels.ok) {
        const d = await resReels.json();
        setReelsFaixas(d.faixasDuracao || d.faixas || []);
      }

      // 5. Stories
      const resStories = await fetch(`/api/organic/${clientId}/stories${q}`);
      if (resStories.ok) {
        const d = await resStories.json();
        setStories(d.stories || []);
      }

      // 6. Público
      const resPub = await fetch(`/api/organic/${clientId}/publico${q}`);
      if (resPub.ok) {
        const d = await resPub.json();
        setDemografia(d.demografia);
        setOnlineFollowers(d.onlineFollowers || []);
        setMelhorHorario(d.melhorHorario || '19:00');
        setDicaHorario(d.dicaHorario || '');
      }

      // 7. Comentários
      const resCom = await fetch(`/api/organic/${clientId}/comentarios${q}`);
      if (resCom.ok) {
        const d = await resCom.json();
        setComments(d.comentarios || []);
        setCommentsTotal(d.total || 0);
        setCommentsRespondidos(d.respondidos || 0);
        setCommentsPct(d.pctRespondidos || 0);
        setPendentesLead(d.pendentesLead || 0);
        setTempoMedioResposta(d.tempoMedioResposta || '1h 45min');
      }

      // 8. Desempenho
      const resDes = await fetch(`/api/organic/${clientId}/desempenho${q}`);
      if (resDes.ok) {
        const d = await resDes.json();
        setTaxaAcertoPct(d.taxaAcertoPct || 50);
        setMetasSemanais(d.metasSemanais || { postsFeed: 2, reels: 3, carrosseis: 1, stories: 20 });
        setSemanasConstancia(d.semanas || []);
        setConversaoPerfil(d.conversaoPerfil || { seguidoresPorMilAlcancados: 7.2, cliquesBioPorMil: 4.5 });
      }

      // 9. Diagnóstico
      const resDiag = await fetch(`/api/organic/${clientId}/diagnostico`);
      if (resDiag.ok) {
        const d = await resDiag.json();
        setDiagnostico(d);
      }
    } catch (err) {
      console.error('Error fetching organic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [clientId, selectedIgAccount, selectedPeriod]);

  // Handle reply comment
  const handleResponderComentario = async (commentId: string) => {
    try {
      const res = await fetch(`/api/organic/${clientId}/comentarios/${commentId}/responder`, {
        method: 'POST',
      });
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, respondidoEm: new Date().toISOString() } : c
          )
        );
        setCommentsRespondidos((prev) => prev + 1);
        setPendentesLead((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error responding comment:', err);
    }
  };

  // Subtabs list (Apresentação exata da Foto 5)
  const navTabs = [
    { id: 'visao_geral' as OrganicTab, label: 'Visão geral' },
    { id: 'conteudos' as OrganicTab, label: 'Conteúdos' },
    { id: 'ranking' as OrganicTab, label: 'Ranking' },
    { id: 'reels' as OrganicTab, label: 'Reels' },
    { id: 'stories' as OrganicTab, label: 'Stories' },
    { id: 'publico' as OrganicTab, label: 'Público' },
    { id: 'comentarios' as OrganicTab, label: 'Comentários' },
    { id: 'marcacoes' as OrganicTab, label: 'Marcações' },
    { id: 'desempenho' as OrganicTab, label: 'Desempenho' },
    { id: 'pautas' as OrganicTab, label: 'Pautas das conversas' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. SUBTABS NAVIGATION BAR (Dark Theme) */}
      <div
        style={{
          display: 'flex',
          gap: '18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '2px',
          overflowX: 'auto',
        }}
      >
        {navTabs.map((tab) => {
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '10px 2px',
                fontSize: '13px',
                fontWeight: active ? 700 : 500,
                color: active ? '#F8FAFC' : '#94A3B8',
                borderBottom: active ? '2px solid #10B981' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. ACCOUNT SELECTION & PERIOD FILTER BAR (Foto 5 no Dark Theme) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Row 1: CONTA DO INSTAGRAM */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            CONTA DO INSTAGRAM:
          </span>
          {igAccounts.map((acc: any) => {
            const active = selectedIgAccount === acc.id;
            return (
              <button
                key={acc.id}
                onClick={() => setSelectedIgAccount(acc.id)}
                style={{
                  background: active ? 'rgba(16, 185, 129, 0.2)' : '#0B0F19',
                  border: active ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: active ? '#34D399' : '#94A3B8',
                  fontSize: '12px',
                  fontWeight: active ? 700 : 500,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                @{acc.username || acc.name}
              </button>
            );
          })}
        </div>

        {/* Row 2: PERÍODO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            PERÍODO:
          </span>
          {[
            { id: 'hoje', label: 'Hoje' },
            { id: 'ontem', label: 'Ontem' },
            { id: '7d', label: '7 dias' },
            { id: '30d', label: '30 dias' },
            { id: 'este_mes', label: 'Este mês' },
            { id: 'mes_passado', label: 'Mês passado' },
            { id: 'todo', label: 'Todo o período' },
          ].map((p) => {
            const active = selectedPeriod === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                style={{
                  background: active ? 'rgba(16, 185, 129, 0.2)' : '#0B0F19',
                  border: active ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: active ? '#34D399' : '#94A3B8',
                  fontSize: '11.5px',
                  fontWeight: active ? 700 : 500,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {p.label}
              </button>
            );
          })}
          <span
            style={{
              background: '#0B0F19',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#CBD5E1',
              fontSize: '11.5px',
              padding: '4px 12px',
              borderRadius: '20px',
            }}
          >
            Personalizado: <strong style={{ color: '#F8FAFC' }}>12/10/2026 a 10/11/2026</strong> <span style={{ color: '#64748B' }}>comparado com 12/09–11/10</span>
          </span>
        </div>

        {/* Row 3: MOSTRAR & ACTION BUTTONS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Left: MOSTRAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              MOSTRAR:
            </span>
            <button
              onClick={() => setShowMode('organico')}
              style={{
                background: showMode === 'organico' ? 'rgba(16, 185, 129, 0.2)' : '#0B0F19',
                border: showMode === 'organico' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: showMode === 'organico' ? '#34D399' : '#94A3B8',
                fontSize: '11.5px',
                fontWeight: showMode === 'organico' ? 700 : 500,
                padding: '4px 12px',
                borderRadius: '20px',
                cursor: 'pointer',
              }}
            >
              Orgânico
            </button>
            <button
              onClick={() => setShowMode('total')}
              style={{
                background: showMode === 'total' ? 'rgba(16, 185, 129, 0.2)' : '#0B0F19',
                border: showMode === 'total' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: showMode === 'total' ? '#34D399' : '#94A3B8',
                fontSize: '11.5px',
                fontWeight: showMode === 'total' ? 700 : 500,
                padding: '4px 12px',
                borderRadius: '20px',
                cursor: 'pointer',
              }}
            >
              Total (inclui anúncios)
            </button>
            <Info size={13} color="#64748B" />
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsDiagnosticOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Activity size={12} color="#10B981" />
              Diagnóstico API
            </button>

            <button
              onClick={() => setIsReportOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Printer size={12} />
              Boletim A4
            </button>

            <button
              onClick={() => alert('Exportando relatório geral em CSV...')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Download size={12} />
              ↓ CSV
            </button>
          </div>
        </div>
      </div>

      {/* 3. SUBTAB CONTENT VIEW */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
          Carregando dados do Instagram...
        </div>
      ) : (
        <>
          {activeSubTab === 'visao_geral' && kpis && (
            <OrganicOverview
              kpis={kpis}
              acoes={acoes}
              formatos={formatos}
              curvaDiaria={curvaDiaria}
              posts={posts}
              correlacaoAnuncios12Semanas={correlacao12Semanas}
              correlacaoTexto={correlacaoTexto}
              toquesLinksBotao={toquesBotao}
              onNavigateTab={(tab) => {
                if (tab === 'contents') setActiveSubTab('conteudos');
                else if (tab === 'ranking') setActiveSubTab('ranking');
                else if (tab === 'comments') setActiveSubTab('comentarios');
                else if (tab === 'reels_stories') setActiveSubTab('reels');
                else if (tab === 'audience') setActiveSubTab('publico');
                else if (tab === 'performance') setActiveSubTab('desempenho');
              }}
            />
          )}

          {activeSubTab === 'conteudos' && (
            <OrganicContents
              posts={posts}
              medianaEngajamento={medianaEngajamento}
              temas={temasDisponiveis}
            />
          )}

          {activeSubTab === 'ranking' && (
            <OrganicRanking
              candidatosAnuncio={candidatosAnuncio}
              cortePercentil={cortePercentil}
              top10={top10}
              piores10={piores10}
              medianaPerfil={medianaEngajamento}
              alcanceMinimo={alcanceMinimoRanking}
            />
          )}

          {activeSubTab === 'reels' && (
            <OrganicReelsStories
              reelsFaixas={reelsFaixas}
              stories={[]}
            />
          )}

          {activeSubTab === 'stories' && (
            <OrganicReelsStories
              reelsFaixas={[]}
              stories={stories}
            />
          )}

          {activeSubTab === 'publico' && demografia && (
            <OrganicAudience
              demografia={demografia}
              onlineFollowers={onlineFollowers}
              melhorHorario={melhorHorario}
              dicaHorario={dicaHorario}
            />
          )}

          {activeSubTab === 'comentarios' && (
            <OrganicComments
              comments={comments}
              total={commentsTotal}
              respondidos={commentsRespondidos}
              pctRespondidos={commentsPct}
              pendentesLead={pendentesLead}
              tempoMedioResposta={tempoMedioResposta}
              onResponderComentario={handleResponderComentario}
            />
          )}

          {activeSubTab === 'desempenho' && (
            <OrganicPerformance
              taxaAcertoPct={taxaAcertoPct}
              medianaEngajamento={medianaEngajamento}
              metasSemanais={metasSemanais}
              semanas={semanasConstancia}
              conversaoPerfil={conversaoPerfil}
            />
          )}

          {activeSubTab === 'marcacoes' && (
            <div
              style={{
                background: '#0F1626',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '10px 18px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                  Marcações & Menções
                </span>
              </div>
              <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                Nenhuma marcação recente pendente de revisão. Todas as 4 menções deste mês foram respondidas.
              </div>
            </div>
          )}

          {activeSubTab === 'pautas' && (
            <div
              style={{
                background: '#0F1626',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '10px 18px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                  Pautas das conversas & Oportunidades
                </span>
              </div>
              <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                Análise de dúvidas e perguntas frequentes do direct e comentários consolidada para o time editorial.
              </div>
            </div>
          )}
        </>
      )}

      {/* MODALS */}
      {isReportOpen && kpis && (
        <OrganicReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          perfil={currentUsername}
          clientName={clientName}
          mes="Novembro/2026"
          kpis={kpis}
          topPosts={top10.slice(0, 3)}
          temaCampeao="Crédito e dívida rural"
          semanasComMetaCumprida="4/4"
        />
      )}

      {isDiagnosticOpen && (
        <OrganicDiagnosticModal
          isOpen={isDiagnosticOpen}
          onClose={() => setIsDiagnosticOpen(false)}
          clientId={clientId}
          diagnostico={diagnostico}
          onRefresh={fetchAllData}
        />
      )}
    </div>
  );
}

export default OrganicPanel;
