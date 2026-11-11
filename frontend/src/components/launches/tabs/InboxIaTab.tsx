import React, { useState, useEffect } from 'react';
import type { Launch, LaunchInboxMessage } from '../launchTypes';
import {
  fetchLaunchInbox,
  sendInboxReply,
  rejectInboxReply,
  ignoreInboxReply,
  updateLaunch,
} from '../launchApi';
import {
  Bot,
  Send,
  XCircle,
  EyeOff,
  CheckCircle2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  Clock,
} from 'lucide-react';

interface InboxIaTabProps {
  launch: Launch;
  onLaunchUpdated: (launch: Launch) => void;
}

export function InboxIaTab({ launch, onLaunchUpdated }: InboxIaTabProps) {
  const [messages, setMessages] = useState<LaunchInboxMessage[]>([]);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'SENT' | 'REJECTED' | 'IGNORED'>('PENDING');
  const [loading, setLoading] = useState<boolean>(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);

  const loadInbox = async () => {
    try {
      setLoading(true);
      const data = await fetchLaunchInbox(launch.id, statusFilter);
      setMessages(data);
      // Initialize reply drafts
      const initialDrafts: Record<string, string> = {};
      data.forEach((m) => {
        initialDrafts[m.id] = m.suggestedReply || '';
      });
      setReplyDrafts(initialDrafts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, [launch.id, statusFilter]);

  const handleToggleAutoReply = async () => {
    try {
      const nextVal = !launch.aiAutoReply;
      const updated = await updateLaunch(launch.id, { aiAutoReply: nextVal });
      onLaunchUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar auto-resposta');
    }
  };

  const handleSend = async (msgId: string) => {
    try {
      setActingId(msgId);
      const text = replyDrafts[msgId];
      await sendInboxReply(launch.id, msgId, text);
      loadInbox();
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar resposta');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (msgId: string) => {
    try {
      setActingId(msgId);
      await rejectInboxReply(launch.id, msgId);
      loadInbox();
    } catch (err: any) {
      alert(err.message || 'Erro ao rejeitar sugestão');
    } finally {
      setActingId(null);
    }
  };

  const handleIgnore = async (msgId: string) => {
    try {
      setActingId(msgId);
      await ignoreInboxReply(launch.id, msgId);
      loadInbox();
    } catch (err: any) {
      alert(err.message || 'Erro ao ignorar');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & AI Controls */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
            }}
          >
            <Bot size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 750, color: '#fff' }}>Central de Atendimento IA</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              A IA analisa dúvidas frequentes nos grupos ou chat privado e sugere respostas prontas.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>Respostas Automáticas</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              {launch.aiAutoReply ? 'Envio automático ativado' : 'Aguardando aprovação manual'}
            </div>
          </div>
          <button
            onClick={handleToggleAutoReply}
            className="btn-icon"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {launch.aiAutoReply ? (
              <ToggleRight size={32} color="var(--accent-green)" />
            ) : (
              <ToggleLeft size={32} color="var(--text-dim)" />
            )}
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        {[
          { id: 'PENDING', label: 'Pendentes de Aprovação' },
          { id: 'SENT', label: 'Enviadas' },
          { id: 'REJECTED', label: 'Rejeitadas' },
          { id: 'IGNORED', label: 'Ignoradas' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: statusFilter === tab.id ? 700 : 500,
              background: statusFilter === tab.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: statusFilter === tab.id ? '#fff' : 'var(--text-dim)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages List */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando mensagens da caixa de entrada...
        </div>
      ) : messages.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhuma mensagem encontrada nesta pasta.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map((msg) => {
            const draft = replyDrafts[msg.id] ?? msg.suggestedReply ?? '';
            const isActing = actingId === msg.id;

            return (
              <div
                key={msg.id}
                className="glass-panel"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: msg.status === 'PENDING' ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid var(--border-subtle)',
                }}
              >
                {/* Header: Sender info & Received Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 750, fontSize: '0.92rem', color: '#fff' }}>
                      {msg.participantName || msg.participantPhone}
                    </span>
                    {msg.participantName && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>({msg.participantPhone})</span>
                    )}
                    <span className={msg.origin === 'GROUP' ? 'badge badge-purple' : 'badge badge-cyan'} style={{ fontSize: '0.68rem' }}>
                      {msg.origin === 'GROUP' ? 'No Grupo' : 'Privado'}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {new Date(msg.receivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Body */}
                <div
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    color: '#e2e8f0',
                    lineHeight: 1.4,
                  }}
                >
                  &ldquo;{msg.messageText}&rdquo;
                </div>

                {/* AI Suggestion Box */}
                <div
                  style={{
                    background: 'rgba(6, 182, 212, 0.05)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      <Sparkles size={14} /> Sugestão da IA
                    </div>
                    {msg.confidencePercent && (
                      <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                        {msg.confidencePercent}% confiança
                      </span>
                    )}
                  </div>

                  {msg.status === 'PENDING' ? (
                    <textarea
                      className="input-field"
                      rows={3}
                      value={draft}
                      onChange={(e) => setReplyDrafts({ ...replyDrafts, [msg.id]: e.target.value })}
                      style={{ fontSize: '0.84rem' }}
                    />
                  ) : (
                    <div style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                      {msg.replyText || msg.suggestedReply}
                    </div>
                  )}

                  {msg.status === 'PENDING' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <button
                        onClick={() => handleIgnore(msg.id)}
                        disabled={isActing}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <EyeOff size={13} /> Ignorar
                      </button>
                      <button
                        onClick={() => handleReject(msg.id)}
                        disabled={isActing}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-rose)' }}
                      >
                        <XCircle size={13} /> Rejeitar
                      </button>
                      <button
                        onClick={() => handleSend(msg.id)}
                        disabled={isActing}
                        className="btn btn-primary"
                        style={{ fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Send size={13} /> Enviar Resposta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
