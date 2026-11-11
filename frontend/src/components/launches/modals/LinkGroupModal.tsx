import React, { useState, useEffect } from 'react';
import type { Launch } from '../launchTypes';
import { linkExistingGroup, fetchLinkableGroups } from '../launchApi';
import { X, Link2, Plus, MessageSquare } from 'lucide-react';

interface LinkGroupModalProps {
  launch: Launch;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkGroupModal({ launch, isOpen, onClose, onSuccess }: LinkGroupModalProps) {
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState<boolean>(true);
  const [selectedJid, setSelectedJid] = useState<string>('');
  const [manualName, setManualName] = useState<string>('');
  const [manualInviteUrl, setManualInviteUrl] = useState<string>('');
  const [isManual, setIsManual] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingAvailable(true);
      fetchLinkableGroups(launch.id)
        .then((groups) => {
          setAvailableGroups(groups);
          if (groups.length > 0) {
            setSelectedJid(groups[0].jid);
            setManualName(groups[0].name);
            setManualInviteUrl(groups[0].inviteUrl || '');
          } else {
            setIsManual(true);
          }
        })
        .finally(() => setLoadingAvailable(false));
    }
  }, [isOpen, launch.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      let jid = selectedJid;
      let name = manualName;
      let inviteUrl = manualInviteUrl;

      if (!isManual) {
        const found = availableGroups.find((g) => g.jid === selectedJid);
        if (found) {
          name = found.name;
          inviteUrl = found.inviteUrl || '';
        }
      }

      if (!jid || !name) {
        alert('Por favor informe o JID e nome do grupo');
        return;
      }

      await linkExistingGroup(launch.id, { jid, name, inviteUrl });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao vincular grupo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }}>
      <div className="modal-card" style={{ maxWidth: '520px', width: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Vincular Grupo do WhatsApp</h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setIsManual(false)}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                background: !isManual ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                border: !isManual ? '1px solid var(--accent-cyan)' : 'none',
                color: !isManual ? 'var(--accent-cyan)' : 'var(--text-dim)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Grupos da Instância ({availableGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setIsManual(true)}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                background: isManual ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                border: isManual ? '1px solid var(--accent-cyan)' : 'none',
                color: isManual ? 'var(--accent-cyan)' : 'var(--text-dim)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Inserir Manualmente
            </button>
          </div>

          {!isManual ? (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>
                Selecione o Grupo Detectado
              </label>
              {loadingAvailable ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  Buscando grupos do WhatsApp...
                </div>
              ) : availableGroups.length === 0 ? (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  Nenhum grupo não vinculado detectado na instância. Alterne para &quot;Inserir Manualmente&quot;.
                </div>
              ) : (
                <select
                  className="input-field"
                  value={selectedJid}
                  onChange={(e) => {
                    setSelectedJid(e.target.value);
                    const found = availableGroups.find((g) => g.jid === e.target.value);
                    if (found) {
                      setManualName(found.name);
                      setManualInviteUrl(found.inviteUrl || '');
                    }
                  }}
                >
                  {availableGroups.map((g) => (
                    <option key={g.jid} value={g.jid}>
                      {g.name} ({g.memberCount} membros)
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                  Nome do Grupo
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Grupo VIP - Turma Outubro"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                  JID / ID do Grupo
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="1203630...@g.us"
                  value={selectedJid}
                  onChange={(e) => setSelectedJid(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                  Link de Convite do WhatsApp (Opcional)
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://chat.whatsapp.com/..."
                  value={manualInviteUrl}
                  onChange={(e) => setManualInviteUrl(e.target.value)}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link2 size={16} /> {submitting ? 'Vinculando...' : 'Vincular ao Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
