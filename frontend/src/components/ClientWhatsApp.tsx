import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Flame,
  Radio,
  Copy,
  Check,
  ExternalLink,
  Search,
  Send,
  Sparkles,
  Languages,
  Mic,
  Paperclip,
  CheckCheck,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Lock,
  Unlock
} from 'lucide-react';

export function ClientWhatsApp() {
  const [waSubTab, setWaSubTab] = useState<'groups' | 'chat' | 'heater'>('groups');

  // Groups state
  const [groups, setGroups] = useState<any[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Chat state
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('chat_1');
  const [messageInput, setMessageInput] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [chatFilter, setChatFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  // Instances state
  const [instances, setInstances] = useState<any[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    fetch('/api/launches/groups')
      .then((res) => res.json())
      .then((data) => setGroups(data.groups || []))
      .catch((err) => console.error(err));

    fetch('/api/whatsapp/chats')
      .then((res) => res.json())
      .then((data) => setConversations(data.conversations || []))
      .catch((err) => console.error(err));

    fetch('/api/whatsapp/instances')
      .then((res) => res.json())
      .then((data) => setInstances(data.instances || []))
      .catch((err) => console.error(err));
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeChatId) || conversations[0];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/l/bruna-vip`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: 'AGENT',
      text: messageInput,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'DELIVERED',
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              messages: [...c.messages, newMsg],
              lastMessage: messageInput,
              lastMessageTime: newMsg.time,
            }
          : c
      )
    );

    fetch('/api/whatsapp/chats/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConversation.id, text: messageInput }),
    }).catch((err) => console.error(err));

    setMessageInput('');
  };

  const handleSuggestAiReply = () => {
    const aiSuggestion = 'Olá! O acesso às aulas já está liberado na plataforma. Quer que eu reenvie seu login?';
    setMessageInput(aiSuggestion);
  };

  const handleToggleGroup = (groupId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'RECEIVING' ? 'PAUSED' : 'RECEIVING';
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, status: nextStatus } : g))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub Tabs Bar */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
        {[
          { id: 'groups', label: 'Grupos VIP (Lançamentos)', icon: Users, badge: '26 Grupos' },
          { id: 'chat', label: 'Chat WhatsApp (Inbox Omnichannel)', icon: MessageSquare, badge: '3 Conversas' },
          { id: 'heater', label: 'Aquecedor & Anti-Ban SendGate', icon: Flame, badge: 'Score 84/100' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = waSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setWaSubTab(tab.id as any)}
              style={{
                background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
                borderRadius: '10px',
                padding: '8px 16px',
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} color={isActive ? 'var(--accent-cyan)' : 'currentColor'} />
              {tab.label}
              {tab.badge && (
                <span className={`badge ${isActive ? 'badge-cyan' : 'badge-green'}`} style={{ fontSize: '0.62rem' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: GRUPOS VIP (LANÇAMENTOS - PADRÃO GRUPOVIP) */}
      {/* ======================================================== */}
      {waSubTab === 'groups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Smart Link Box */}
          <div
            className="glass-panel"
            style={{
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-purple">LINK INTELIGENTE ROTATIVO</span>
                <span className="badge badge-green">Fila de criação automática ativa (90%)</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Bruna Ortiz VIP — Turma Outubro (Meteórico)</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Redireciona os leads automaticamente para o grupo com vaga disponível sem estourar o limite de 1.024 membros.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={handleCopyLink} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                {copiedLink ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                {copiedLink ? 'Copiado!' : 'Copiar Link /l/bruna-vip'}
              </button>
              <a href="/l/bruna-vip" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: '0.8rem', textDecoration: 'none' }}>
                Testar Redirecionamento <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* 4 Launch KPIs (padrão grupovip) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>LEADS RETIDOS (ATIVOS)</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)', margin: '4px 0' }}>4.258</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>de 4.766 no histórico</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TAXA DE RETENÇÃO</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', margin: '4px 0' }}>89,3%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Permanecem no grupo</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONVERSÃO DE CLIQUE</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-purple)', margin: '4px 0' }}>276,3%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>854 cliques no link público</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>GRUPOS GERENCIADOS</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: '4px 0' }}>26</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Alocação sequencial ativa</div>
            </div>
          </div>

          {/* Groups List Table */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Grupos WhatsApp Conectados (26)</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Capacidade máxima: 1.024 membros por grupo</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 16px' }}>NOME DO GRUPO</th>
                  <th style={{ padding: '12px 16px' }}>OCUPAÇÃO</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px' }}>LINK DE CONVITE</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {groups.slice(0, 8).map((grp) => (
                  <tr key={grp.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#fff' }}>{grp.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: grp.memberCount >= 1000 ? '#F59E0B' : 'var(--accent-green)' }}>
                          {grp.memberCount} / {grp.maxMembers}
                        </span>
                        <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${(grp.memberCount / grp.maxMembers) * 100}%`, height: '100%', background: grp.memberCount >= 1000 ? '#F59E0B' : '#10B981' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {grp.status === 'FULL' && <span className="badge badge-amber">Lotado (98%)</span>}
                      {grp.status === 'RECEIVING' && <span className="badge badge-green">Recebendo</span>}
                      {grp.status === 'PAUSED' && <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>Pausado</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                      {grp.inviteUrl}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleGroup(grp.id, grp.status)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      >
                        {grp.status === 'RECEIVING' ? 'Pausar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: CHAT OMNICHANNEL (3 COLUNAS - PADRÃO AQUECEDOR) */}
      {/* ======================================================== */}
      {waSubTab === 'chat' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr 300px',
            gap: '16px',
            height: '620px',
            background: 'rgba(11, 16, 29, 0.5)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          {/* COLUMN 1: CONVERSATIONS LIST */}
          <div style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 10px 6px 30px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setChatFilter('ALL')}
                  style={{
                    flex: 1,
                    background: chatFilter === 'ALL' ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px',
                    fontSize: '0.72rem',
                    color: chatFilter === 'ALL' ? '#fff' : 'var(--text-dim)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Pessoas
                </button>
                <button
                  onClick={() => setChatFilter('UNREAD')}
                  style={{
                    flex: 1,
                    background: chatFilter === 'UNREAD' ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px',
                    fontSize: '0.72rem',
                    color: chatFilter === 'UNREAD' ? '#fff' : 'var(--text-dim)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Só não lidas
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.map((conv) => {
                const isSelected = conv.id === activeChatId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveChatId(conv.id)}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                      background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                        {conv.contactName}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{conv.lastMessageTime}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.lastMessage}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                      <span className="badge badge-rose" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                        🔥 {conv.temperature}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Chip: {conv.chipKey}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2: ACTIVE CHAT & COMPOSER */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Chat Header */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{activeConversation?.contactName}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {activeConversation?.contactPhone} • Chip ativo: <span style={{ color: 'var(--accent-green)' }}>{activeConversation?.chipKey}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={handleSuggestAiReply} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>
                  <Sparkles size={12} color="var(--accent-cyan)" /> Sugerir Resposta IA
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeConversation?.messages.map((m: any) => {
                const isAgent = m.sender === 'AGENT';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isAgent ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      background: isAgent ? 'linear-gradient(135deg, #059669, #10B981)' : 'rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: isAgent ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      fontSize: '0.84rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >
                    <div>{m.text}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.65rem', opacity: 0.8 }}>
                      <span>{m.time}</span>
                      {isAgent && <CheckCheck size={12} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Composer */}
            <form onSubmit={handleSendMessage} style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <input
                type="text"
                placeholder="Digite uma mensagem (Shift+Enter para quebra de linha)..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }}>
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* COLUMN 3: CRM DETAILS PANEL */}
          <div style={{ borderLeft: '1px solid var(--border-subtle)', padding: '18px', overflowY: 'auto' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '14px' }}>Detalhes do Lead (CRM)</h4>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Fase do Funil</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{activeConversation?.stage}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Potencial de Fechamento</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                R$ {((Number(activeConversation?.potentialCents) || 49700) / 100).toLocaleString('pt-BR')}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '6px' }}>Tags do Contato</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {activeConversation?.tags?.map((t: string, i: number) => (
                  <span key={i} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Notas Internas</div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeConversation?.notes}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: AQUECEDOR ANTI-BAN SENDGATE */}
      {/* ======================================================== */}
      {waSubTab === 'heater' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Chips Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-green">Conectado · Ativo</span>
                <span className="badge badge-cyan">Chip Veterano</span>
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Atendimento Bruna Ortiz</h4>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
                Instância: aqc_bruna_01 (+55 11 99999-0002)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Score de Aquecimento</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-green)' }}>84 / 100</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Risco de Banimento</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>8% (Seguro)</div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Envios hoje: <strong>26 / 80</strong> (Teto dinâmico com coffee breaks de 30s)
              </div>
            </div>

            {/* Warning Chip Card */}
            <div className="glass-panel" style={{ padding: '22px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-amber">Desconectado</span>
                <span className="badge badge-rose">Em Risco · 60</span>
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Chip Suporte #02</h4>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
                Instância: aqc_bruna_02 (+55 64 9218-0233)
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                A sessão do WhatsApp caiu. Reconecte o QR Code para retomar o cronotipo de aquecimento.
              </p>

              <button onClick={() => setShowQrModal(true)} className="btn btn-primary" style={{ width: '100%', fontSize: '0.8rem' }}>
                <QrCode size={14} /> Reconectar com QR Code
              </button>
            </div>
          </div>

          {/* SendGate Engine Description Box */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--accent-green)" />
              O Que Torna o Motor SendGate Anti-Ban Único?
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Diferente de disparadores comuns que disparam de forma linear, o SendGate usa **jitter gaussiano (1.5s a 3.5s)**, pausas programadas (*coffee breaks* de 20 a 40 segundos a cada 25 mensagens) e uma rede **cross-tenant peer-to-peer**. Se o score de risco atingir 70%, o sistema entra em quarentena preventiva instantaneamente para nunca perder a esteira de atendimento.
            </p>
          </div>
        </div>
      )}

      {/* QR Code Reconnect Modal */}
      {showQrModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div className="glass-panel-elevated" style={{ width: '380px', padding: '28px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>Reconectar Instância WhatsApp</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Abra o WhatsApp no celular &gt; Dispositivos Conectados &gt; Conectar Dispositivo:
            </p>

            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px' }}>
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=WPP_GFB_AQC_RECONNECT_DEMO"
                alt="QR Code WhatsApp"
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--accent-green)', marginBottom: '18px' }}>
              ✓ Aguardando leitura do QR Code pelo WhatsApp...
            </div>

            <button className="btn btn-secondary" onClick={() => setShowQrModal(false)} style={{ width: '100%' }}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
