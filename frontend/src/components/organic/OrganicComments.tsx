import React, { useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Heart,
  TrendingDown,
  Clock,
  Send,
  Search,
  Filter,
  Flame,
  Check,
} from 'lucide-react';
import type { OrganicComment } from './organic.types';

interface OrganicCommentsProps {
  comments: OrganicComment[];
  total: number;
  respondidos: number;
  pctRespondidos: number;
  pendentesLead: number;
  tempoMedioResposta: string;
  onResponderComentario: (commentId: string) => Promise<void>;
}

export function OrganicComments({
  comments,
  total,
  respondidos,
  pctRespondidos,
  pendentesLead,
  tempoMedioResposta,
  onResponderComentario,
}: OrganicCommentsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [apenasSemResposta, setApenasSemResposta] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  // Filtering
  let filtered = [...comments];

  if (selectedCategory !== 'TODOS') {
    filtered = filtered.filter((c) => c.categoria === selectedCategory);
  }

  if (apenasSemResposta) {
    filtered = filtered.filter((c) => !c.respondidoEm && !c.doPerfil);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (c) => c.texto.toLowerCase().includes(q) || c.usuario.toLowerCase().includes(q)
    );
  }

  const handleSendReply = async (commentId: string) => {
    await onResponderComentario(commentId);
    setReplyingId(null);
    setReplyText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. KPIs DE ATENDIMENTO A COMENTÁRIOS (Seção 3.10) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Total de Comentários</span>
            <MessageSquare size={16} color="#0EA5E9" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>
            {total}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
            {respondidos} respondidos no período
          </div>
        </div>

        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Taxa de Resposta</span>
            <CheckCircle2 size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>
            {pctRespondidos}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
            Meta da agência: 90%+
          </div>
        </div>

        <div
          style={{
            background: pendentesLead > 0 ? 'rgba(239, 68, 68, 0.08)' : '#0F1626',
            border: pendentesLead > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: pendentesLead > 0 ? '#F87171' : '#94A3B8', fontWeight: 600 }}>
              Pendentes com Intenção (Leads)
            </span>
            <Flame size={16} color={pendentesLead > 0 ? '#EF4444' : '#64748B'} />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: pendentesLead > 0 ? '#EF4444' : '#F8FAFC' }}>
            {pendentesLead}
          </div>
          <div style={{ fontSize: '0.72rem', color: pendentesLead > 0 ? '#FCA5A5' : '#64748B', marginTop: '4px' }}>
            {pendentesLead > 0 ? 'Oportunidades de venda sem resposta!' : 'Todos os leads respondidos'}
          </div>
        </div>

        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Tempo Médio de Resposta</span>
            <Clock size={16} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>
            {tempoMedioResposta}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
            Primeira resposta do direct/comentário
          </div>
        </div>
      </div>

      {/* 2. FILTROS E BUSCA */}
      <div
        style={{
          background: '#0F1626',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'TODOS', label: 'Todos' },
              { id: 'possivel_lead', label: '🔥 Possível Lead', color: '#EF4444' },
              { id: 'pergunta', label: '❓ Perguntas', color: '#0EA5E9' },
              { id: 'elogio', label: '❤️ Elogios', color: '#10B981' },
              { id: 'critica', label: '⚠️ Críticas', color: '#F59E0B' },
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '16px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: active ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: active ? 'rgba(14, 165, 233, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    color: active ? '#38BDF8' : '#94A3B8',
                    cursor: 'pointer',
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#CBD5E1', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={apenasSemResposta}
              onChange={(e) => setApenasSemResposta(e.target.checked)}
            />
            Apenas não respondidos
          </label>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            color="#64748B"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Buscar por usuário ou trecho do comentário..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              background: '#0B0F19',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.75rem',
            }}
          />
        </div>
      </div>

      {/* 3. LISTA DE COMENTÁRIOS E FILA DE RESPOSTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
            Nenhum comentário encontrado para os filtros selecionados.
          </div>
        ) : (
          filtered.map((c) => {
            const isLead = c.categoria === 'possivel_lead';
            const isPergunta = c.categoria === 'pergunta';
            const isElogio = c.categoria === 'elogio';
            const isCritica = c.categoria === 'critica';
            const isRespondido = !!c.respondidoEm;

            return (
              <div
                key={c.id}
                style={{
                  background: isLead && !isRespondido ? 'rgba(239, 68, 68, 0.05)' : '#0F1626',
                  border: isLead && !isRespondido ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#F1F5F9' }}>
                      @{c.usuario}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isLead
                          ? 'rgba(239, 68, 68, 0.18)'
                          : isPergunta
                          ? 'rgba(14, 165, 233, 0.18)'
                          : isElogio
                          ? 'rgba(16, 185, 129, 0.18)'
                          : isCritica
                          ? 'rgba(245, 158, 11, 0.18)'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: isLead
                          ? '#F87171'
                          : isPergunta
                          ? '#38BDF8'
                          : isElogio
                          ? '#34D399'
                          : isCritica
                          ? '#FBBF24'
                          : '#94A3B8',
                      }}
                    >
                      {isLead ? '🔥 LEAD' : isPergunta ? '❓ DÚVIDA' : isElogio ? '❤️ ELOGIO' : isCritica ? '⚠️ CRÍTICA' : 'NEUTRO'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', color: '#64748B' }}>
                    <span>{new Date(c.timestamp).toLocaleString('pt-BR')}</span>
                    {isRespondido ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 600 }}>
                        <Check size={12} /> Respondido
                      </span>
                    ) : (
                      <span style={{ color: '#F59E0B', fontWeight: 600 }}>Pendente</span>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#E2E8F0', lineHeight: 1.45 }}>
                  "{c.texto}"
                </div>

                {/* Reply section */}
                {!isRespondido && !c.doPerfil && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    {replyingId === c.id ? (
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <input
                          type="text"
                          placeholder="Digite a resposta do perfil..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            background: '#0B0F19',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.75rem',
                          }}
                        />
                        <button
                          onClick={() => handleSendReply(c.id)}
                          style={{
                            background: '#10B981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Send size={12} /> Enviar
                        </button>
                        <button
                          onClick={() => setReplyingId(null)}
                          style={{
                            background: 'transparent',
                            color: '#94A3B8',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setReplyingId(c.id)}
                          style={{
                            background: 'rgba(14, 165, 233, 0.15)',
                            color: '#38BDF8',
                            border: '1px solid rgba(14, 165, 233, 0.3)',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Send size={11} /> Responder
                        </button>
                        <button
                          onClick={() => handleSendReply(c.id)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#94A3B8',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                          }}
                        >
                          Marcar como respondido
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default OrganicComments;

