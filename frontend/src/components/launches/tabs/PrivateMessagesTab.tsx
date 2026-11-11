import React, { useState, useEffect } from 'react';
import type { Launch, LaunchMessage } from '../launchTypes';
import { fetchPrivateMessages } from '../launchApi';
import { SendPrivateMessageModal } from '../modals/SendPrivateMessageModal';
import {
  MessageSquare,
  Plus,
  ShieldAlert,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';

interface PrivateMessagesTabProps {
  launch: Launch;
}

export function PrivateMessagesTab({ launch }: PrivateMessagesTabProps) {
  const [messages, setMessages] = useState<LaunchMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await fetchPrivateMessages(launch.id);
      setMessages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [launch.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Safety Policy Card */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          background: 'rgba(245, 158, 11, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 750, color: '#fff' }}>Políticas de Disparo Privado (1 a 1)</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Dispare apenas para quem já entrou voluntariamente nos grupos. Delays inteligentes evitam bloqueios no chip.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
        >
          <Plus size={15} /> Nova Mensagem no Privado
        </button>
      </div>

      {/* Dispatches List */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando mensagens privadas...
        </div>
      ) : messages.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhum disparo no privado realizado para os leads deste lançamento.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="glass-panel"
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cyan)',
                  }}
                >
                  <MessageSquare size={16} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                      {msg.status === 'SENT' ? 'Enviada' : 'Em andamento'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Intervalo: {msg.delayMinSeconds}s a {msg.delayMaxSeconds}s
                    </span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                    {msg.content}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                {new Date(msg.createdAt).toLocaleDateString('pt-BR')}{' '}
                {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <SendPrivateMessageModal
        launch={launch}
        totalActiveLeads={launch.totalLeads || 0}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadMessages}
      />
    </div>
  );
}
