import React, { useState, useEffect } from 'react';
import type { Launch, LaunchWebhook, LaunchWebhookDelivery } from '../launchTypes';
import {
  updateLaunch,
  fetchWebhooks,
  testWebhook,
  fetchWebhookDeliveries,
} from '../launchApi';
import { WebhookModal } from '../modals/WebhookModal';
import {
  Share2,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Globe,
  Radio,
  Clock,
} from 'lucide-react';

interface IntegrationsTabProps {
  launch: Launch;
  onLaunchUpdated: (launch: Launch) => void;
}

export function IntegrationsTab({ launch, onLaunchUpdated }: IntegrationsTabProps) {
  const [pixelId, setPixelId] = useState<string>(launch.metaPixelId || '');
  const [gtmId, setGtmId] = useState<string>(launch.gtmContainerId || '');
  const [savingTracking, setSavingTracking] = useState<boolean>(false);
  const [trackingSuccess, setTrackingSuccess] = useState<boolean>(false);

  const [webhooks, setWebhooks] = useState<LaunchWebhook[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<LaunchWebhookDelivery[]>([]);

  const loadWebhooks = async () => {
    try {
      setLoadingWebhooks(true);
      const data = await fetchWebhooks(launch.id);
      setWebhooks(data);
      if (data.length > 0) {
        const deliveries = await fetchWebhookDeliveries(launch.id, data[0].id);
        setRecentDeliveries(deliveries);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  useEffect(() => {
    loadWebhooks();
  }, [launch.id]);

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingTracking(true);
      const updated = await updateLaunch(launch.id, {
        metaPixelId: pixelId || null,
        gtmContainerId: gtmId || null,
      });
      onLaunchUpdated(updated);
      setTrackingSuccess(true);
      setTimeout(() => setTrackingSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar tags');
    } finally {
      setSavingTracking(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      setTestingId(webhookId);
      const delivery = await testWebhook(launch.id, webhookId);
      setRecentDeliveries((prev) => [delivery, ...prev]);
      alert(`Webhook testado com sucesso! Resposta HTTP ${delivery.status}`);
    } catch (err: any) {
      alert(err.message || 'Erro ao testar webhook');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Tracking Tags Card (Meta Pixel & GTM) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="var(--accent-cyan)" />
            Rastreamento de Tráfego no Link Público (/l/{launch.slug})
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Os scripts configurados aqui são injetados automaticamente na tela intermediária antes do redirecionamento ao WhatsApp, disparando eventos nativos de PageView e Lead.
          </p>
        </div>

        <form onSubmit={handleSaveTracking} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
              Meta Pixel ID
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: 123456789012345"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
              Dispara <code>fbq(&apos;track&apos;, &apos;PageView&apos;)</code> e <code>fbq(&apos;track&apos;, &apos;Lead&apos;)</code>
            </span>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
              Google Tag Manager Container ID
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: GTM-XXXXXX"
              value={gtmId}
              onChange={(e) => setGtmId(e.target.value)}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
              Injeta contêiner global do GTM para GA4 / Ads
            </span>
          </div>

          <div>
            <button
              type="submit"
              disabled={savingTracking}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', fontSize: '0.84rem' }}
            >
              {trackingSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
              {savingTracking ? 'Salvando...' : trackingSuccess ? 'Salvo!' : 'Salvar Rastreamento'}
            </button>
          </div>
        </form>
      </div>

      {/* Outgoing Webhooks Section */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={18} color="var(--accent-green)" />
              Webhooks de Saída (Notificações em Tempo Real)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Notifique ferramentas externas (n8n, Make, Zapier, Webhooks personalizados) a cada novo lead ou saída de grupo.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <Plus size={14} /> Novo Webhook
          </button>
        </div>

        {/* Webhooks List */}
        {loadingWebhooks ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-dim)' }}>Carregando webhooks...</div>
        ) : webhooks.length === 0 ? (
          <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Nenhum webhook configurado para este lançamento.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 750, fontSize: '0.92rem', color: '#fff' }}>{wh.name}</span>
                    <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>Ativo</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                    <code>{wh.url}</code>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Eventos: {(wh.events || []).join(', ')}
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleTestWebhook(wh.id)}
                    disabled={testingId === wh.id}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 12px' }}
                  >
                    <Play size={13} />
                    {testingId === wh.id ? 'Disparando...' : 'Testar Envio'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Deliveries History */}
        {recentDeliveries.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Histórico de Entregas Recentes
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Evento</th>
                    <th style={{ padding: '6px 8px' }}>Status HTTP</th>
                    <th style={{ padding: '6px 8px' }}>Data / Hora</th>
                    <th style={{ padding: '6px 8px' }}>Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeliveries.slice(0, 5).map((del) => (
                    <tr key={del.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '8px', color: 'var(--accent-cyan)', fontWeight: 600 }}>{del.event}</td>
                      <td style={{ padding: '8px' }}>
                        <span className={del.status === 200 ? 'badge badge-green' : 'badge badge-rose'} style={{ fontSize: '0.65rem' }}>
                          {del.status} OK
                        </span>
                      </td>
                      <td style={{ padding: '8px', color: 'var(--text-dim)' }}>
                        {new Date(del.occurredAt).toLocaleTimeString('pt-BR')}
                      </td>
                      <td style={{ padding: '8px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {JSON.stringify(del.payload)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <WebhookModal
        launch={launch}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadWebhooks}
      />
    </div>
  );
}
