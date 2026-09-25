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
  Mic,
  Paperclip,
  CheckCheck,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Plus,
  Play,
  Pause,
  MapPin,
  Building2,
  Compass,
  Star,
  UserPlus,
  RefreshCw,
  PhoneCall,
  Power,
  CheckCircle2,
} from 'lucide-react';

export function ClientWhatsApp() {
  const [waSubTab, setWaSubTab] = useState<'groups' | 'chat' | 'heater' | 'warming' | 'radar'>('groups');

  // Groups state
  const [groups, setGroups] = useState<any[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Chat state
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('chat_1');
  const [messageInput, setMessageInput] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [chatFilter, setChatFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  // SendGate Spintax & Pacing Tester state
  const [spintaxInput, setSpintaxInput] = useState('{Olá|Oi|Tudo bem}, {nome}! Seu {acesso exclusivo|desconto especial} foi {liberado|ativado}.');
  const [spintaxResult, setSpintaxResult] = useState<any>(null);
  const [isTestingSpintax, setIsTestingSpintax] = useState(false);

  // Instances state
  const [instances, setInstances] = useState<any[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [activeInstanceKey, setActiveInstanceKey] = useState<string>('aqc_bruna_01');
  const [showAddInstanceModal, setShowAddInstanceModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstancePhone, setNewInstancePhone] = useState('');

  // Warming Network state
  const [warmingData, setWarmingData] = useState<any>(null);
  const [isWarmingStepping, setIsWarmingStepping] = useState(false);

  // LeadRadar state
  const [radarNiche, setRadarNiche] = useState('Acupuntura');
  const [radarLocation, setRadarLocation] = useState('São Paulo');
  const [radarOnlyWpp, setRadarOnlyWpp] = useState(true);
  const [radarResults, setRadarResults] = useState<any[]>([]);
  const [isSearchingRadar, setIsSearchingRadar] = useState(false);
  const [importedRadarIds, setImportedRadarIds] = useState<Set<string>>(new Set());
  const [radarFeedback, setRadarFeedback] = useState<string | null>(null);

  const loadData = () => {
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

    fetch('/api/whatsapp/warming')
      .then((res) => res.json())
      .then((data) => setWarmingData(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadData();
    handleSearchRadar();
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

  const handleTestSpintax = () => {
    setIsTestingSpintax(true);
    fetch('/api/whatsapp/sendgate/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: spintaxInput,
        leadName: 'Bruna',
        instanceKey: 'aqc_bruna_01',
      }),
    })
      .then((res) => res.json())
      .then((data) => setSpintaxResult(data))
      .catch((err) => console.error(err))
      .finally(() => setIsTestingSpintax(false));
  };

  // Instance QR Connect
  const handleOpenQrModal = (instanceKey: string) => {
    setActiveInstanceKey(instanceKey);
    fetch(`/api/whatsapp/connect/${instanceKey}`)
      .then((res) => res.json())
      .then((data) => {
        setQrCodeData(data.qrCodeBase64 || '');
        setShowQrModal(true);
      })
      .catch((err) => console.error(err));
  };

  // Toggle Instance status (Connected <-> Disconnected)
  const handleToggleInstanceStatus = (instanceKey: string) => {
    fetch(`/api/whatsapp/instances/${instanceKey}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then(() => {
        loadData();
      })
      .catch((err) => console.error(err));
  };

  // Create Instance
  const handleCreateInstance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim()) return;

    fetch('/api/whatsapp/instances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newInstanceName,
        phone: newInstancePhone || '+5511999990000',
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setShowAddInstanceModal(false);
        setNewInstanceName('');
        setNewInstancePhone('');
        loadData();
      })
      .catch((err) => console.error(err));
  };

  // Warming Network Actions
  const handleToggleWarmingPair = (pairId: string) => {
    fetch(`/api/whatsapp/warming/pairs/${pairId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then(() => {
        fetch('/api/whatsapp/warming')
          .then((r) => r.json())
          .then((d) => setWarmingData(d));
      });
  };

  const handleTriggerWarmStep = (pairId: string) => {
    setIsWarmingStepping(true);
    fetch(`/api/whatsapp/warming/pairs/${pairId}/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then(() => {
        fetch('/api/whatsapp/warming')
          .then((r) => r.json())
          .then((d) => setWarmingData(d));
      })
      .finally(() => setIsWarmingStepping(false));
  };

  // LeadRadar Actions
  const handleSearchRadar = () => {
    setIsSearchingRadar(true);
    fetch(`/api/whatsapp/leadradar?niche=${encodeURIComponent(radarNiche)}&location=${encodeURIComponent(radarLocation)}&onlyWithWhatsApp=${radarOnlyWpp}`)
      .then((res) => res.json())
      .then((data) => setRadarResults(data.results || []))
      .catch((err) => console.error(err))
      .finally(() => setIsSearchingRadar(false));
  };

  const handleImportRadarLead = (item: any) => {
    fetch('/api/whatsapp/leadradar/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'cli_bruna_ppp',
        items: [item],
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setImportedRadarIds((prev) => new Set([...prev, item.id]));
        setRadarFeedback(`Lead "${item.contactName || item.businessName}" importado para o CRM!`);
        setTimeout(() => setRadarFeedback(null), 3000);
      })
      .catch((err) => console.error(err));
  };

  const handleImportAllRadar = () => {
    const toImport = radarResults.filter((r) => !importedRadarIds.has(r.id) && !r.isImported);
    if (toImport.length === 0) return;

    fetch('/api/whatsapp/leadradar/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'cli_bruna_ppp',
        items: toImport,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        toImport.forEach((i) => setImportedRadarIds((prev) => new Set([...prev, i.id])));
        setRadarFeedback(`${data.importedCount} leads importados para o CRM com sucesso!`);
        setTimeout(() => setRadarFeedback(null), 3500);
      })
      .catch((err) => console.error(err));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub Tabs Bar */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', flexWrap: 'wrap' }}>
        {[
          { id: 'groups', label: 'Grupos VIP (Lançamentos)', icon: Users, badge: `${groups.length} Grupos` },
          { id: 'chat', label: 'Chat WhatsApp (Inbox)', icon: MessageSquare, badge: `${conversations.length} Conversas` },
          { id: 'heater', label: 'Chips & Anti-Ban SendGate', icon: Flame, badge: `${instances.length} Chips` },
          { id: 'warming', label: 'Aquecimento P2P (Warming Network)', icon: Radio, badge: 'P2P Ativo' },
          { id: 'radar', label: 'LeadRadar B2B', icon: Search, badge: 'Prospecção' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = waSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setWaSubTab(tab.id as any)}
              className={isActive ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <Icon size={16} />
              {tab.label}
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                }}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: GRUPOS VIP */}
      {waSubTab === 'groups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Rotating Link Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '6px' }}>Link Rotativo Ativo</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Lançamento: Imersão MTC Avançada</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  O link público distribui novos leads automaticamente para o grupo que possui vagas livres (&lt; 95% de ocupação).
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="/l/bruna-vip"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <ExternalLink size={14} /> Testar Redirecionamento
                </a>
                <button
                  onClick={handleCopyLink}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLink ? 'Copiado!' : 'Copiar Link /l/bruna-vip'}
                </button>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <code style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                https://grupovip.gfbdigital.com.br/l/bruna-vip
              </code>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                ● 26 grupos vinculados · 89.3% retenção
              </span>
            </div>
          </div>

          {/* Groups Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {groups.map((group) => {
              const isReceiving = group.status === 'RECEIVING';
              const percent = Math.round((group.memberCount / group.maxMembers) * 100);
              return (
                <div key={group.id} className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{group.name}</span>
                    <span className={isReceiving ? 'badge badge-green' : 'badge badge-amber'}>
                      {isReceiving ? 'Recebendo' : 'Pausado'}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                      <span>Membros</span>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{group.memberCount} / {group.maxMembers}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: percent > 90 ? 'var(--accent-rose)' : 'linear-gradient(90deg, #10B981, #06B6D4)',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Ocupação: {percent}%</span>
                    <button
                      onClick={() => handleToggleGroup(group.id, group.status)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      {isReceiving ? 'Pausar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: CHAT OMNICHANNEL */}
      {waSubTab === 'chat' && (
        <div className="glass-panel" style={{ height: '720px', display: 'grid', gridTemplateColumns: '320px 1fr 300px', overflow: 'hidden' }}>
          {/* COLUMN 1: CONVERSATIONS LIST */}
          <div style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Buscar conversa ou telefone..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 10px 8px 32px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setChatFilter('ALL')}
                  className={chatFilter === 'ALL' ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ flex: 1, padding: '4px 8px', fontSize: '0.72rem' }}
                >
                  Todas ({conversations.length})
                </button>
                <button
                  onClick={() => setChatFilter('UNREAD')}
                  className={chatFilter === 'UNREAD' ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ flex: 1, padding: '4px 8px', fontSize: '0.72rem' }}
                >
                  Não Lidas (1)
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
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{conv.contactName}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{conv.lastMessageTime}</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.lastMessage}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>{conv.chipKey}</span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>{conv.stage}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2: ACTIVE CHAT & COMPOSER */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{activeConversation?.contactName}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {activeConversation?.contactPhone} • Chip ativo: <span style={{ color: 'var(--accent-green)' }}>{activeConversation?.chipKey}</span>
                </div>
              </div>
              <button onClick={handleSuggestAiReply} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>
                <Sparkles size={12} color="var(--accent-cyan)" /> Sugerir Resposta IA
              </button>
            </div>

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

            <form onSubmit={handleSendMessage} style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <input
                type="text"
                placeholder="Digite uma mensagem com SendGate Anti-Ban..."
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
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '14px' }}>Ficha 360° do Lead</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Nome:</span>
                <div style={{ fontWeight: 700 }}>{activeConversation?.contactName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Telefone E.164:</span>
                <div>{activeConversation?.contactPhone}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Temperatura:</span>
                <div><span className="badge badge-green">QUENTE (Score 94)</span></div>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Tags de Origem:</span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span className="badge badge-cyan">utm:bruna_vip</span>
                  <span className="badge badge-green">Grupo VIP 03</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CHIPS & ANTI-BAN SENDGATE */}
      {waSubTab === 'heater' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Multi-Instância WhatsApp & Reputação Anti-Ban</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Controle o ciclo de vida dos seus números, conexão por QR Code e pausas preventivas automáticas.
              </p>
            </div>
            <button
              onClick={() => setShowAddInstanceModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Adicionar Nova Instância
            </button>
          </div>

          {/* Active Chips Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {instances.map((inst) => {
              const isConnected = inst.status === 'CONNECTED';
              return (
                <div
                  key={inst.id}
                  className="glass-panel"
                  style={{
                    padding: '22px',
                    border: isConnected ? '1px solid var(--border-subtle)' : '1px solid rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className={isConnected ? 'badge badge-green' : 'badge badge-amber'}>
                      {isConnected ? 'Conectado · Ativo' : inst.status}
                    </span>
                    <span className="badge badge-cyan">{inst.proxy || 'Proxy Residencial SP'}</span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{inst.name}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
                    Instância: {inst.instanceKey} ({inst.phone})
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Score de Aquecimento</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                        {inst.warmingScore} / 100
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Risco de Ban</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                        {inst.banRiskScore || 8}% (Seguro)
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Envios hoje: <strong>{inst.sentTodayCount || 26} / {inst.dailySendCap || 80}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!isConnected && (
                      <button
                        onClick={() => handleOpenQrModal(inst.instanceKey)}
                        className="btn btn-primary"
                        style={{ flex: 1, fontSize: '0.78rem' }}
                      >
                        <QrCode size={14} /> Ler QR Code
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleInstanceStatus(inst.instanceKey)}
                      className="btn btn-secondary"
                      style={{
                        flex: 1,
                        fontSize: '0.78rem',
                        color: isConnected ? 'var(--accent-amber)' : 'var(--accent-green)',
                      }}
                    >
                      <Power size={14} /> {isConnected ? 'Simular Queda' : 'Reconectar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SendGate Interactive Spintax & Gaussian Pacing Simulator */}
          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--accent-cyan)" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Simulador de Spintax & Pacing Anti-Ban SendGate</h4>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="badge badge-green">🟢 Horário Comercial: 08h-21h</span>
                <span className="badge badge-cyan">Gaussiano: 15s-45s</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Template com Spintax aninhado e variáveis:
              </label>
              <textarea
                value={spintaxInput}
                onChange={(e) => setSpintaxInput(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <button
              onClick={handleTestSpintax}
              disabled={isTestingSpintax}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', marginBottom: '14px' }}
            >
              <Sparkles size={14} /> {isTestingSpintax ? 'Processando Pacing...' : 'Testar Resolução & Jitter Gaussiano'}
            </button>

            {spintaxResult && (
              <div
                style={{
                  background: 'rgba(6, 182, 212, 0.06)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '0.78rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Variação Resolvida:</span>
                  <div style={{ color: 'var(--accent-green)', fontWeight: 700, marginTop: '2px', fontSize: '0.85rem' }}>
                    "{spintaxResult.parsedMessage}"
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '6px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Jitter Gaussiano</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      {spintaxResult.gaussianDelaySeconds} segundos
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Diagnóstico Anti-Ban</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
                      {spintaxResult.diagnostic}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: AQUECIMENTO P2P (WARMING NETWORK) */}
      {waSubTab === 'warming' && warmingData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Big numbers overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Pares P2P em Aquecimento</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                {warmingData.totalActivePairs} Ativos
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-green)', marginTop: '4px' }}>
                Troca contínua de textos, áudios e reações
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Mensagens Trocadas na Rede</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
                {warmingData.totalExchangedMessages} msgs
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Simulação de comportamento humano
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Score Médio de Reputação</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-green)' }}>
                {warmingData.averageReputationScore} / 100
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                Pronto para campanhas e lançamentos
              </div>
            </div>
          </div>

          {/* Pairs List */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={18} color="var(--accent-cyan)" />
              Pares de Aquecimento Ativos (Diálogos Pré-Programados)
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {warmingData.pairs.map((pair: any) => {
                const isActive = pair.status === 'ACTIVE';
                return (
                  <div
                    key={pair.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={isActive ? 'badge badge-green' : 'badge badge-amber'}>
                          {pair.status}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{pair.conversationTopic}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Dia {pair.dayInSchedule} de 14</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <strong>{pair.chipA}</strong> ({pair.phoneA}) ↔ <strong>{pair.chipB}</strong> ({pair.phoneB})
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Última interação: {pair.lastInteractionTime} • Total trocado: {pair.totalExchangedMessages} msgs
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleTriggerWarmStep(pair.id)}
                        disabled={isWarmingStepping || !isActive}
                        className="btn btn-primary"
                        style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Play size={13} /> Disparar Passo de Diálogo
                      </button>
                      <button
                        onClick={() => handleToggleWarmingPair(pair.id)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem' }}
                      >
                        {isActive ? <Pause size={13} /> : <Play size={13} />}
                        {isActive ? 'Pausar Par' : 'Ativar Par'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Recent Logs */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>Feed de Diálogos Naturais em Tempo Real</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {warmingData.recentLogs.map((log: any) => (
                <div
                  key={log.id}
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-cyan">{log.senderChip} → {log.receiverChip}</span>
                    <span style={{ color: '#fff' }}>{log.content}</span>
                  </div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: LEADRADAR B2B */}
      {waSubTab === 'radar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Search Header */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '14px' }}>
              <span className="badge badge-cyan" style={{ marginBottom: '6px' }}>Prospecção B2B Outbound</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>LeadRadar: Busca de Empresas & Enriquecimento WhatsApp</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Encontre clínicas, médicos e profissionais no OpenStreetMap com validação de número de WhatsApp para disparo seguro.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>Nicho / Especialidade</label>
                <input
                  type="text"
                  value={radarNiche}
                  onChange={(e) => setRadarNiche(e.target.value)}
                  placeholder="Ex: Acupuntura, Fisioterapia, Nutrologia"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>Cidade / Região</label>
                <input
                  type="text"
                  value={radarLocation}
                  onChange={(e) => setRadarLocation(e.target.value)}
                  placeholder="Ex: São Paulo, Curitiba, Belo Horizonte"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSearchRadar}
                  disabled={isSearchingRadar}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <Search size={15} /> {isSearchingRadar ? 'Varrendo Radar...' : 'Buscar no Radar'}
                </button>
                <button
                  onClick={handleImportAllRadar}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <UserPlus size={15} /> Importar Todos
                </button>
              </div>
            </div>

            {radarFeedback && (
              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-green)', borderRadius: '8px', color: 'var(--accent-green)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> {radarFeedback}
              </div>
            )}
          </div>

          {/* Results Table */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>Resultados Encontrados ({radarResults.length})</h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Geolocalização + Validação de WhatsApp Ativa</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {radarResults.map((item) => {
                const isImported = item.isImported || importedRadarIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{item.businessName}</span>
                        {item.hasWhatsApp && <span className="badge badge-green">✓ WhatsApp Válido</span>}
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Star size={12} fill="currentColor" /> {item.rating} ({item.reviewCount})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        Contato: <strong>{item.contactName}</strong> • {item.category}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {item.address}, {item.city} - {item.state} • {item.formattedPhone}
                      </div>
                    </div>

                    <div>
                      {isImported ? (
                        <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} /> Importado no CRM
                        </span>
                      ) : (
                        <button
                          onClick={() => handleImportRadarLead(item)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <UserPlus size={13} /> Importar para CRM
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>Conectar Instância WhatsApp</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Instância: <strong>{activeInstanceKey}</strong>. Abra o WhatsApp &gt; Dispositivos Conectados &gt; Conectar:
            </p>

            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px' }}>
              <img
                src={qrCodeData || 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=WPP_DEMO'}
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

      {/* Add Instance Modal */}
      {showAddInstanceModal && (
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
          onClick={() => setShowAddInstanceModal(false)}
        >
          <div className="glass-panel-elevated" style={{ width: '420px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>Nova Instância de WhatsApp</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Cadastre um novo número para esteira de atendimento ou aquecimento P2P.
            </p>

            <form onSubmit={handleCreateInstance} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>Nome do Chip / Instância</label>
                <input
                  type="text"
                  placeholder="Ex: Atendimento Suporte #03"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>Telefone Internacional (E.164)</label>
                <input
                  type="text"
                  placeholder="+55 11 98888-0003"
                  value={newInstancePhone}
                  onChange={(e) => setNewInstancePhone(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddInstanceModal(false)} style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Criar Instância
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
