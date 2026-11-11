import React, { useState, useEffect } from 'react';
import type { Launch, LaunchGroup, LaunchParticipant } from '../launchTypes';
import {
  fetchLaunchGroups,
  syncGroups,
  updateGroup,
  removeGroup,
  fetchGroupParticipants,
} from '../launchApi';
import { CreateGroupsModal } from '../modals/CreateGroupsModal';
import { LinkGroupModal } from '../modals/LinkGroupModal';
import {
  Plus,
  Link2,
  RefreshCw,
  Users,
  Copy,
  ExternalLink,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
} from 'lucide-react';

interface GroupsTabProps {
  launch: Launch;
  onRefreshStats?: () => void;
}

export function GroupsTab({ launch, onRefreshStats }: GroupsTabProps) {
  const [groups, setGroups] = useState<LaunchGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isLinkOpen, setIsLinkOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Group participants drawer/expansion state
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<LaunchParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState<boolean>(false);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await fetchLaunchGroups(launch.id);
      setGroups(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [launch.id]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const updated = await syncGroups(launch.id);
      setGroups(updated);
      if (onRefreshStats) onRefreshStats();
    } catch (e: any) {
      alert(e.message || 'Erro ao sincronizar grupos');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleStatus = async (group: LaunchGroup) => {
    try {
      const nextStatus = group.status === 'RECEIVING' ? 'PAUSED' : 'RECEIVING';
      const updated = await updateGroup(launch.id, group.id, { status: nextStatus });
      setGroups((prev) => prev.map((g) => (g.id === group.id ? updated : g)));
    } catch (e: any) {
      alert(e.message || 'Erro ao atualizar status');
    }
  };

  const handleRemove = async (group: LaunchGroup) => {
    if (confirm(`Desvincular o grupo "${group.name}" deste lançamento? O grupo continuará existindo no WhatsApp.`)) {
      try {
        await removeGroup(launch.id, group.id);
        setGroups((prev) => prev.filter((g) => g.id !== group.id));
        if (expandedGroupId === group.id) setExpandedGroupId(null);
      } catch (e: any) {
        alert(e.message || 'Erro ao desvincular grupo');
      }
    }
  };

  const handleCopyInvite = (group: LaunchGroup) => {
    if (!group.inviteUrl) return;
    navigator.clipboard.writeText(group.inviteUrl);
    setCopiedId(group.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleExpand = async (groupId: string) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
      setParticipants([]);
    } else {
      setExpandedGroupId(groupId);
      setLoadingParticipants(true);
      try {
        const parts = await fetchGroupParticipants(launch.id, groupId);
        setParticipants(parts);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingParticipants(false);
      }
    }
  };

  const totalMembers = groups.reduce((acc, g) => acc + g.memberCount, 0);
  const totalCapacity = groups.reduce((acc, g) => acc + g.maxMembers, 0);
  const receivingCount = groups.filter((g) => g.status === 'RECEIVING').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Action Header */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Grupos Vinculados</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
              {groups.length} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 500 }}>({receivingCount} recebendo)</span>
            </div>
          </div>
          <div style={{ height: '32px', width: '1px', background: 'var(--border-subtle)' }} />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total de Membros</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-green)' }}>
              {totalMembers.toLocaleString('pt-BR')} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 500 }}>/ {totalCapacity.toLocaleString('pt-BR')} vagas</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
          <button
            onClick={() => setIsLinkOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <Link2 size={14} /> Vincular Existente
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <Plus size={14} /> Criar Grupos em Lote
          </button>
        </div>
      </div>

      {/* Groups List / Table */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando grupos do lançamento...
        </div>
      ) : groups.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Users size={36} color="var(--text-dim)" />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Nenhum grupo vinculado</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
            Crie grupos novos em lote ou vincule grupos já existentes do WhatsApp conectados na sua instância.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
              <Plus size={14} /> Criar Grupos
            </button>
            <button onClick={() => setIsLinkOpen(true)} className="btn btn-secondary">
              <Link2 size={14} /> Vincular Existente
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {groups.map((group, index) => {
            const isExpanded = expandedGroupId === group.id;
            const pct = Math.round((group.memberCount / group.maxMembers) * 100);
            const isReceiving = group.status === 'RECEIVING';

            return (
              <div
                key={group.id}
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: isReceiving ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  {/* Left: Position, Name, Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: 'var(--accent-cyan)',
                      }}
                    >
                      #{index + 1}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff' }}>{group.name}</span>
                        <span
                          className={
                            group.status === 'RECEIVING'
                              ? 'badge badge-green'
                              : group.status === 'FULL'
                              ? 'badge badge-purple'
                              : group.status === 'CLOSED'
                              ? 'badge badge-gray'
                              : 'badge badge-amber'
                          }
                          style={{ fontSize: '0.7rem' }}
                        >
                          {group.status === 'RECEIVING'
                            ? 'Recebendo'
                            : group.status === 'FULL'
                            ? 'Cheio'
                            : group.status === 'CLOSED'
                            ? 'Fechado'
                            : 'Pausado'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        JID: <code>{group.jid || (group as any).whatsappGroupId || 'N/A'}</code>
                      </div>
                    </div>
                  </div>

                  {/* Center: Capacity Bar */}
                  <div style={{ minWidth: '200px', flex: 1, maxWidth: '320px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>
                        {(group.memberCount ?? 0).toLocaleString('pt-BR')} / {(group.maxMembers ?? 0).toLocaleString('pt-BR')} membros
                      </span>
                      <strong style={{ color: pct > 90 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
                        {pct}%
                      </strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: pct > 90 ? 'var(--accent-rose)' : 'linear-gradient(90deg, #10B981, #06B6D4)',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {group.inviteUrl && (
                      <>
                        <button
                          onClick={() => handleCopyInvite(group)}
                          title="Copiar Link de Convite"
                          className="btn-icon"
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '6px' }}
                        >
                          {copiedId === group.id ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                        </button>
                        <a
                          href={group.inviteUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir no WhatsApp"
                          className="btn-icon"
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '6px', display: 'flex', alignItems: 'center' }}
                        >
                          <ExternalLink size={14} />
                        </a>
                      </>
                    )}

                    <button
                      onClick={() => handleToggleStatus(group)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {isReceiving ? (
                        <>
                          <ToggleRight size={14} color="var(--accent-green)" /> Pausar
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={14} color="var(--accent-amber)" /> Ativar
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleToggleExpand(group.id)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Users size={14} /> Participantes
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    <button
                      onClick={() => handleRemove(group)}
                      title="Desvincular Grupo"
                      className="btn-icon"
                      style={{ background: 'transparent', color: 'var(--accent-rose)', padding: '6px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Expanded Participants Drawer */}
                {isExpanded && (
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                        Participantes do Grupo ({participants.length})
                      </span>
                    </div>

                    {loadingParticipants ? (
                      <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        Carregando participantes...
                      </div>
                    ) : participants.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center', padding: '10px 0' }}>
                        Nenhum participante registrado ainda neste grupo.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textAlign: 'left' }}>
                              <th style={{ padding: '6px 8px' }}>Telefone</th>
                              <th style={{ padding: '6px 8px' }}>Nome</th>
                              <th style={{ padding: '6px 8px' }}>Status</th>
                              <th style={{ padding: '6px 8px' }}>Score</th>
                              <th style={{ padding: '6px 8px' }}>Entrada</th>
                            </tr>
                          </thead>
                          <tbody>
                            {participants.map((p) => (
                              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '8px', fontWeight: 600, color: '#fff' }}>{p.phone}</td>
                                <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{p.name || '—'}</td>
                                <td style={{ padding: '8px' }}>
                                  <span className={p.status === 'ACTIVE' ? 'badge badge-green' : 'badge badge-rose'} style={{ fontSize: '0.68rem' }}>
                                    {p.status === 'ACTIVE' ? 'Ativo' : 'Saiu'}
                                  </span>
                                </td>
                                <td style={{ padding: '8px', color: 'var(--accent-cyan)' }}>{p.engagementScore} pts</td>
                                <td style={{ padding: '8px', color: 'var(--text-dim)' }}>
                                  {new Date(p.joinedAt).toLocaleDateString('pt-BR')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateGroupsModal
        launch={launch}
        currentGroupCount={groups.length}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          loadGroups();
          if (onRefreshStats) onRefreshStats();
        }}
      />

      <LinkGroupModal
        launch={launch}
        isOpen={isLinkOpen}
        onClose={() => setIsLinkOpen(false)}
        onSuccess={() => {
          loadGroups();
          if (onRefreshStats) onRefreshStats();
        }}
      />
    </div>
  );
}
