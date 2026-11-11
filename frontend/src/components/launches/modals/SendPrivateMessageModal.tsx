import React, { useState } from 'react';
import type { Launch, LaunchMessage } from '../launchTypes';
import { createPrivateMessage } from '../launchApi';
import { MessageComposer, type ComposerData } from '../shared/MessageComposer';
import { WhatsAppPreview } from '../shared/WhatsAppPreview';
import { X, Send, ShieldAlert, Sparkles } from 'lucide-react';

interface SendPrivateMessageModalProps {
  launch: Launch;
  totalActiveLeads: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SendPrivateMessageModal({
  launch,
  totalActiveLeads,
  isOpen,
  onClose,
  onSuccess,
}: SendPrivateMessageModalProps) {
  const [composerData, setComposerData] = useState<ComposerData>({
    type: 'TEXT',
    content: '{Olá|Oi|Opa} {primeiro_nome}! Vi que você está no grupo da {nome_lancamento}. Quer tirar alguma dúvida comigo?',
    delayMinSeconds: 15,
    delayMaxSeconds: 45,
  });

  const [audienceFilter, setAudienceFilter] = useState<'ALL_ACTIVE' | 'HOT_ONLY'>('ALL_ACTIVE');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (composerData.type === 'TEXT' && !composerData.content.trim()) {
      alert('Digite o texto da mensagem');
      return;
    }

    try {
      setSubmitting(true);
      await createPrivateMessage(launch.id, {
        type: composerData.type,
        content: composerData.content,
        mediaUrl: composerData.mediaUrl,
        caption: composerData.caption,
        delayMinSeconds: composerData.delayMinSeconds,
        delayMaxSeconds: composerData.delayMaxSeconds,
        status: 'SENDING',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao iniciar disparo privado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '1000px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Mensagem Privada aos Leads</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Disparo 1 a 1 para participantes ativos dos grupos do lançamento.
            </p>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Warning Banner */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.8rem',
            color: '#fde68a',
            marginBottom: '16px',
          }}
        >
          <ShieldAlert size={22} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Diretriz WhatsApp Anti-Ban:</strong> Mensagens no privado exigem Spintax humanizado e intervalos superiores a 15 segundos entre contatos para evitar risco de denúncia de spam.
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '24px' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>
                  Segmentação do Público
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setAudienceFilter('ALL_ACTIVE')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      background: audienceFilter === 'ALL_ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: audienceFilter === 'ALL_ACTIVE' ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                      color: audienceFilter === 'ALL_ACTIVE' ? 'var(--accent-green)' : 'var(--text-dim)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Todos os Ativos ({totalActiveLeads})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudienceFilter('HOT_ONLY')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      background: audienceFilter === 'HOT_ONLY' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: audienceFilter === 'HOT_ONLY' ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                      color: audienceFilter === 'HOT_ONLY' ? 'var(--accent-amber)' : 'var(--text-dim)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Apenas Leads Quentes (HOT)
                  </button>
                </div>
              </div>

              <MessageComposer
                initialData={composerData}
                onChange={(data) => setComposerData(data)}
                showDelays={true}
              />
            </div>

            {/* Right Column: Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Prévia da Conversa Privada
              </span>
              <WhatsAppPreview
                data={composerData}
                senderName="Equipe Oficial"
                groupName="Atendimento VIP"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Send size={15} /> {submitting ? 'Iniciando...' : 'Iniciar Disparo Privado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
