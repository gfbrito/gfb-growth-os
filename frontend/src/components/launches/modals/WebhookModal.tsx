import React, { useState } from 'react';
import type { Launch, LaunchWebhook } from '../launchTypes';
import { createWebhook } from '../launchApi';
import { X, Webhook as WebhookIcon, Plus } from 'lucide-react';

interface WebhookModalProps {
  launch: Launch;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WebhookModal({ launch, isOpen, onClose, onSuccess }: WebhookModalProps) {
  const [name, setName] = useState<string>('Webhook Principal');
  const [url, setUrl] = useState<string>('');
  const [secretToken, setSecretToken] = useState<string>('');
  const [events, setEvents] = useState<string[]>([
    'lead.joined',
    'lead.left',
    'group.created',
    'group.full',
  ]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const allEvents = [
    { id: 'lead.joined', label: 'lead.joined — Novo lead entrou no grupo' },
    { id: 'lead.left', label: 'lead.left — Lead saiu do grupo' },
    { id: 'group.created', label: 'group.created — Novo grupo criado pela fila' },
    { id: 'group.full', label: 'group.full — Grupo atingiu limite' },
    { id: 'message.sent', label: 'message.sent — Mensagem disparada' },
  ];

  const toggleEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.startsWith('http')) {
      alert('URL inválida. Deve iniciar com https:// ou http://');
      return;
    }

    try {
      setSubmitting(true);
      await createWebhook(launch.id, {
        name,
        url,
        secretToken: secretToken || undefined,
        events,
        isActive: true,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar webhook');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }}>
      <div className="modal-card" style={{ maxWidth: '540px', width: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WebhookIcon size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Novo Webhook de Saída</h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
              Identificação do Webhook
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: n8n Lead Receiver / CRM Make"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
              URL de Destino (Endpoint HTTPS)
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://webhook.site/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
              Secret Token (Opcional - Header X-Growth-Secret)
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="seu-token-secreto"
              value={secretToken}
              onChange={(e) => setSecretToken(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px', display: 'block' }}>
              Eventos Assinados
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px' }}>
              {allEvents.map((ev) => (
                <label key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={events.includes(ev.id)}
                    onChange={() => toggleEvent(ev.id)}
                  />
                  <span>{ev.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} /> {submitting ? 'Salvando...' : 'Criar Webhook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
