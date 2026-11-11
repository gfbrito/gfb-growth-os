import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Building2,
  Phone,
  Mail,
  TrendingUp,
  Shield,
  ChevronRight,
  RefreshCw,
  Circle,
} from 'lucide-react';

interface ClientSummary {
  id: string;
  name: string;
  tradeName?: string;
  slug: string;
  document?: string;
  documentType: string;
  status: string;
  segment?: string;
  whatsapp?: string;
  email?: string;
  managerId?: string;
  origin?: string;
  contractTotalCents: number;
  billingType: string;
  adBudgetCents: number;
  metaTokenValid: boolean;
  isActive: boolean;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ATIVO: { label: 'Ativo', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  PAUSADO: { label: 'Pausado', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  ONBOARDING: { label: 'Onboarding', color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.12)' },
  CANCELADO: { label: 'Cancelado', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.12)' },
};

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] || STATUS_MAP.ATIVO;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '0.72rem',
        fontWeight: 600,
        background: config.bg,
        color: config.color,
        letterSpacing: '0.02em',
      }}
    >
      <Circle size={6} fill={config.color} color={config.color} />
      {config.label}
    </span>
  );
}

function InstagramIcon({ size = 14, color = '#E1306C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

interface ClientListProps {
  onNewClient: () => void;
  onSelectClient: (client: ClientSummary) => void;
  onOpenOrganic?: (client: ClientSummary) => void;
}

export function ClientList({ onNewClient, onSelectClient, onOpenOrganic }: ClientListProps) {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filtered = clients.filter((c) => {
    const matchSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.document && c.document.includes(searchQuery)) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;

    return matchSearch && matchStatus;
  });

  // Summary stats
  const totalActive = clients.filter((c) => c.status === 'ATIVO').length;
  const totalOnboarding = clients.filter((c) => c.status === 'ONBOARDING').length;
  const totalRevenue = clients
    .filter((c) => c.status === 'ATIVO')
    .reduce((sum, c) => sum + c.contractTotalCents, 0);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0EA5E9',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#F8FAFC',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Clientes
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '2px 0 0' }}>
              {clients.length} {clients.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
            </p>
          </div>
        </div>

        <button
          onClick={onNewClient}
          style={{
            padding: '10px 22px',
            borderRadius: '8px',
            border: 'none',
            background: '#10B981',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 4px rgba(16, 185, 129, 0.25)',
            transition: 'all 0.15s',
          }}
        >
          <Plus size={16} />
          Novo Cliente
        </button>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: '#0E131F',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '18px 20px',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Clientes ativos
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
            {totalActive}
          </div>
        </div>
        <div
          style={{
            background: '#0E131F',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '18px 20px',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Em onboarding
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0EA5E9', marginTop: '4px' }}>
            {totalOnboarding}
          </div>
        </div>
        <div
          style={{
            background: '#0E131F',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '18px 20px',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Receita recorrente
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC', marginTop: '4px' }}>
            {formatCurrency(totalRevenue)}
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#475569',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, documento ou e-mail..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 42px',
              background: '#0B0F19',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '10px 14px',
            background: '#0B0F19',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            color: '#F8FAFC',
            fontSize: '0.85rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="ALL">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="PAUSADO">Pausado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        <button
          onClick={fetchClients}
          title="Atualizar lista"
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent',
            color: '#94A3B8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Clients Table */}
      <div
        style={{
          background: '#0E131F',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              color: '#64748B',
              fontSize: '0.9rem',
            }}
          >
            <RefreshCw
              size={24}
              style={{ marginBottom: '12px', animation: 'spin 1s linear infinite' }}
            />
            <br />
            Carregando clientes...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1px solid rgba(14, 165, 233, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                color: '#0EA5E9',
              }}
            >
              <Users size={26} />
            </div>
            <div style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '1rem', marginBottom: '6px' }}>
              {searchQuery || filterStatus !== 'ALL'
                ? 'Nenhum cliente encontrado'
                : 'Nenhum cliente cadastrado'}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '20px' }}>
              {searchQuery || filterStatus !== 'ALL'
                ? 'Tente alterar os filtros de busca'
                : 'Cadastre o primeiro cliente para começar'}
            </div>
            {!searchQuery && filterStatus === 'ALL' && (
              <button
                onClick={onNewClient}
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#10B981',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Plus size={16} />
                Cadastrar primeiro cliente
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 110px 130px 100px 90px 150px',
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <div>Cliente</div>
              <div>Status</div>
              <div>Contrato</div>
              <div>Meta API</div>
              <div>Cadastro</div>
              <div style={{ textAlign: 'right' }}>Ações</div>
            </div>

            {/* Table Rows */}
            {filtered.map((client) => (
              <div
                key={client.id}
                onClick={() => onOpenOrganic ? onOpenOrganic(client) : onSelectClient(client)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 110px 130px 100px 90px 150px',
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                {/* Client Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10B981',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      flexShrink: 0,
                    }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#F1F5F9', fontSize: '0.88rem' }}>
                      {client.tradeName || client.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '2px',
                      }}
                    >
                      {client.document && <span>{client.document}</span>}
                      {client.segment && (
                        <>
                          <span>·</span>
                          <span>{client.segment}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={client.status} />
                </div>

                {/* Contract */}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#F1F5F9' }}>
                    {client.contractTotalCents > 0
                      ? formatCurrency(client.contractTotalCents)
                      : '—'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {client.billingType === 'MENSAL'
                      ? '/mês'
                      : client.billingType === 'UNICO'
                      ? 'único'
                      : 'rec. + var.'}
                  </div>
                </div>

                {/* Meta */}
                <div>
                  {client.metaTokenValid ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: '#10B981',
                        fontWeight: 600,
                      }}
                    >
                      <Shield size={12} />
                      Conectado
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>—</span>
                  )}
                </div>

                {/* Date */}
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  {formatDate(client.createdAt)}
                </div>

                {/* Actions: Orgânico (IG) + Editar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onOpenOrganic ? onOpenOrganic(client) : onSelectClient(client)}
                    title="Acessar Painel Orgânico do Instagram"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: 'rgba(225, 48, 108, 0.15)',
                      border: '1px solid rgba(225, 48, 108, 0.3)',
                      color: '#F472B6',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <InstagramIcon size={12} color="#F472B6" />
                    Orgânico
                  </button>

                  <button
                    onClick={() => onSelectClient(client)}
                    title="Configurações do Cliente"
                    style={{
                      padding: '5px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#94A3B8',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
