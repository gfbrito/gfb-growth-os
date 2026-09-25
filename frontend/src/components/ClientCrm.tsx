import React, { useState, useEffect } from 'react';
import {
  Users,
  ShoppingBag,
  RotateCcw,
  Upload,
  Search,
  Filter,
  CheckCircle,
  ExternalLink,
  MessageCircle,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export function ClientCrm() {
  const [crmSubTab, setCrmSubTab] = useState<'leads' | 'products' | 'recovery' | 'import'>('leads');

  // Leads State
  const [leads, setLeads] = useState<any[]>([]);
  const [searchLead, setSearchLead] = useState('');
  const [filterTemp, setFilterTemp] = useState<string>('ALL');
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Products State
  const [products, setProducts] = useState<any[]>([]);

  // Recovery State
  const [recoveryItems, setRecoveryItems] = useState<any[]>([]);
  const [recoveryFilter, setRecoveryFilter] = useState<'ALL' | 'ABANDONED_CART' | 'PAYMENT_REFUSED' | 'PENDING_PIX_BOLETO' | 'REFUND'>('ALL');

  // CSV Import Wizard State (4 Steps)
  const [importStep, setImportStep] = useState<1 | 2 | 3 | 4>(1);
  const [csvRawText, setCsvRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState({
    name: 'Nome',
    email: 'Email',
    phone: 'WhatsApp',
    product: 'Produto',
    amount: 'Valor',
    date: 'Data',
  });
  const [importSuccessResult, setImportSuccessResult] = useState<any>(null);

  // Fetch CRM initial data
  useEffect(() => {
    fetch('/api/crm/leads?clientId=cli_bruna_ppp')
      .then((res) => res.json())
      .then((data) => setLeads(data.leads || []))
      .catch((err) => console.error(err));

    fetch('/api/crm/products?clientId=cli_bruna_ppp')
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch((err) => console.error(err));

    fetch('/api/crm/recovery?clientId=cli_bruna_ppp')
      .then((res) => res.json())
      .then((data) => setRecoveryItems(data.recoveryItems || []))
      .catch((err) => console.error(err));
  }, []);

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchLead.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchLead.toLowerCase()) ||
      lead.phone.includes(searchLead);
    const matchesTemp = filterTemp === 'ALL' || lead.temperature === filterTemp;
    return matchesSearch && matchesTemp;
  });

  // Filter recovery
  const filteredRecovery = recoveryItems.filter((item) => {
    if (recoveryFilter === 'ALL') return true;
    return item.type === recoveryFilter;
  });

  // Handle Recovery Status Change
  const handleUpdateRecovery = (id: string, newStatus: string) => {
    setRecoveryItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    );
    fetch(`/api/crm/recovery/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).catch((err) => console.error(err));
  };

  // Sample CSV Loader for Quick Testing
  const handleLoadSampleCsv = () => {
    const sample = `Nome,Email,WhatsApp,Produto,Valor,Data
Marcos Vinicius Santos,marcos.santos@gmail.com,11991234567,Curso Online 10 pontos 50 soluções,97.00,2026-09-24T14:20:00Z
Luciana Ferreira Lima,luciana.lima@hotmail.com,21988776655,Método Diagnóstico 360°,497.00,2026-09-23T10:15:00Z
Carlos Alberto Nogueira,carlos.nogueira@uol.com.br,31977665544,Curso Online Craniopuntura,147.00,2026-09-22T09:30:00Z
Renata Albuquerque,renata.albuquerque@gmail.com,61999887766,Renovação Acupunturista Master,997.00,2026-09-21T16:45:00Z`;

    setCsvRawText(sample);
    processParsedRows(sample);
    setImportStep(2);
  };

  const processParsedRows = (raw: string) => {
    const lines = raw.trim().split('\n');
    if (lines.length <= 1) return;
    const header = lines[0].split(',').map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return {
        name: parts[0] || 'Cliente',
        email: parts[1] || '',
        phone: parts[2] || '',
        product: parts[3] || 'Curso',
        amount: parseFloat(parts[4]) || 97,
        date: parts[5] || new Date().toISOString(),
      };
    });
    setParsedRows(rows);
  };

  // Submit Import to Backend
  const handleCompleteImport = () => {
    fetch('/api/crm/import-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: parsedRows }),
    })
      .then((res) => res.json())
      .then((data) => {
        setImportSuccessResult(data);
        setImportStep(4);
        // Refresh leads list
        fetch('/api/crm/leads?clientId=cli_bruna_ppp')
          .then((r) => r.json())
          .then((d) => setLeads(d.leads || []));
      })
      .catch((err) => console.error(err));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* CRM Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '14px',
        }}
      >
        {[
          { id: 'leads', label: 'Base de Leads & RFM', icon: Users, badge: `${leads.length}` },
          { id: 'products', label: 'Produtos & Assinaturas', icon: ShoppingBag, badge: `${products.length}` },
          { id: 'recovery', label: 'Recuperação de Vendas', icon: RotateCcw, badge: 'R$ 92k+' },
          { id: 'import', label: '📥 Importar CSV Antigo', icon: Upload, badge: '4 Etapas' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = crmSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCrmSubTab(tab.id as any)}
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
      {/* SUB-TAB 1: BASE DE LEADS & RFM */}
      {/* ======================================================== */}
      {crmSubTab === 'leads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '480px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou WhatsApp..."
                  value={searchLead}
                  onChange={(e) => setSearchLead(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '9px 12px 9px 38px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Temperatura:</span>
              {['ALL', 'HOT', 'WARM', 'COLD'].map((temp) => (
                <button
                  key={temp}
                  onClick={() => setFilterTemp(temp)}
                  style={{
                    background: filterTemp === temp ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: filterTemp === temp ? '1px solid var(--border-highlight)' : '1px solid transparent',
                    color: filterTemp === temp ? '#fff' : 'var(--text-dim)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {temp === 'ALL' && 'Todos'}
                  {temp === 'HOT' && '🔥 Quentes'}
                  {temp === 'WARM' && '⚡ Mornos'}
                  {temp === 'COLD' && '❄️ Frios'}
                </button>
              ))}
            </div>
          </div>

          {/* Leads Table */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 16px' }}>CLIENTE</th>
                  <th style={{ padding: '12px 16px' }}>WHATSAPP</th>
                  <th style={{ padding: '12px 16px' }}>TEMPERATURA</th>
                  <th style={{ padding: '12px 16px' }}>ESTÁGIO</th>
                  <th style={{ padding: '12px 16px' }}>PONTOS RFM</th>
                  <th style={{ padding: '12px 16px' }}>TOTAL GASTO</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{lead.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{lead.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <MessageCircle size={13} />
                        {lead.phone}
                      </a>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {lead.temperature === 'HOT' && <span className="badge badge-rose">🔥 Quente</span>}
                      {lead.temperature === 'WARM' && <span className="badge badge-amber">⚡ Morno</span>}
                      {lead.temperature === 'COLD' && <span className="badge badge-cyan">❄️ Frio</span>}
                      {lead.temperature === 'INACTIVE' && <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>Inativo</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-purple">{lead.stage}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--accent-green)' }}>+{lead.rfmPoints} PTS</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ color: '#fff' }}>
                        R$ {lead.totalSpent?.toLocaleString('pt-BR') || (Number(lead.totalSpentCents) / 100).toLocaleString('pt-BR')}
                      </strong>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{lead.purchaseCount} pedidos</div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                      >
                        Ver Ficha
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
      {/* SUB-TAB 2: PRODUTOS & OFERTAS */}
      {/* ======================================================== */}
      {crmSubTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {products.map((p) => (
            <div key={p.id} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className={`badge ${p.isSubscription ? 'badge-purple' : 'badge-green'}`}>
                  {p.isSubscription ? 'ASSINATURA 365D' : 'PRODUTO DIGITAL'}
                </span>
                <span className="badge badge-cyan">{p.externalPlatform || 'KIWIFY'}</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px' }}>{p.name}</h4>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-green)', margin: '8px 0' }}>
                R$ {p.price?.toLocaleString('pt-BR') || (Number(p.priceCents) / 100).toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '14px' }}>
                {p.salesCount} vendas registradas nesta conta
              </div>
              {p.renewalLink && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Link de renovação: <span style={{ color: 'var(--accent-cyan)' }}>{p.renewalLink}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: CENTRAL DE RECUPERAÇÃO DE VENDAS */}
      {/* ======================================================== */}
      {crmSubTab === 'recovery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Recovery Overview KPI */}
          <div
            className="glass-panel"
            style={{
              padding: '18px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                POTENCIAL TOTAL EM RECUPERAÇÃO
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                R$ 92.963,14 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>(832 oportunidades mapeadas)</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'ALL', label: 'Todas' },
                { id: 'ABANDONED_CART', label: '🛒 Carrinhos' },
                { id: 'PAYMENT_REFUSED', label: '💳 Recusados' },
                { id: 'PENDING_PIX_BOLETO', label: '⚡ PIX / Boletos' },
                { id: 'REFUND', label: '🔄 Reembolsos' },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setRecoveryFilter(rf.id as any)}
                  style={{
                    background: recoveryFilter === rf.id ? 'var(--accent-amber)' : 'rgba(255,255,255,0.05)',
                    color: recoveryFilter === rf.id ? '#080C15' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recovery Table */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 16px' }}>CLIENTE</th>
                  <th style={{ padding: '12px 16px' }}>PRODUTO</th>
                  <th style={{ padding: '12px 16px' }}>VALOR RETIDO</th>
                  <th style={{ padding: '12px 16px' }}>TIPO</th>
                  <th style={{ padding: '12px 16px' }}>STATUS DE SEGUIMENTO</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>ABORDAGEM</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecovery.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{item.customerName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{item.customerPhone}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{item.productName}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ color: 'var(--accent-amber)' }}>
                        R$ {item.amount?.toLocaleString('pt-BR') || (Number(item.amountCents) / 100).toLocaleString('pt-BR')}
                      </strong>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {item.type === 'ABANDONED_CART' && <span className="badge badge-amber">🛒 Carrinho</span>}
                      {item.type === 'PAYMENT_REFUSED' && <span className="badge badge-rose">💳 Negado</span>}
                      {item.type === 'PENDING_PIX_BOLETO' && <span className="badge badge-cyan">⚡ PIX Pendente</span>}
                      {item.type === 'REFUND' && <span className="badge" style={{ background: 'rgba(255,255,255,0.08)' }}>🔄 Reembolso</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateRecovery(item.id, e.target.value)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="PENDING">🟡 Pendente</option>
                        <option value="CONTACTED">🔵 Em Contato</option>
                        <option value="RECOVERED">🟢 Recuperado</option>
                        <option value="LOST">🔴 Perdido</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <a
                        href={`https://wa.me/${item.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${item.customerName}, vi que seu pedido do ${item.productName} ficou pendente. Posso te ajudar a concluir?`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.72rem', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                      >
                        <MessageCircle size={13} />
                        Abordar no WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 4: 📥 IMPORTADOR CSV INTELIGENTE (4 ETAPAS) */}
      {/* ======================================================== */}
      {crmSubTab === 'import' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          {/* Wizard Step Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Importador de Vendas & Leads Antigos (CSV)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Carregue relatórios históricos da Kiwify, Hotmart, Eduzz ou ActiveCampaign com sanitização e pontuação automática de RFM.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {[
                { s: 1, label: '1. Upload' },
                { s: 2, label: '2. De-Para' },
                { s: 3, label: '3. Validação' },
                { s: 4, label: '4. Conclusão' },
              ].map((step) => (
                <div
                  key={step.s}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: importStep === step.s ? 'var(--accent-green)' : 'rgba(255, 255, 255, 0.04)',
                    color: importStep === step.s ? '#080C15' : 'var(--text-dim)',
                  }}
                >
                  {step.label}
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: UPLOAD */}
          {importStep === 1 && (
            <div>
              <div
                style={{
                  border: '2px dashed var(--border-highlight)',
                  borderRadius: '14px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.01)',
                  marginBottom: '20px',
                }}
              >
                <FileSpreadsheet size={42} color="var(--accent-cyan)" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                  Arraste seu arquivo .CSV aqui ou clique para selecionar
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                  Compatível com exportações padrão Kiwify, Hotmart, Eduzz, Stripe e planilhas personalizadas.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button
                    onClick={handleLoadSampleCsv}
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <Sparkles size={16} /> Carregar Planilha Exemplo Kiwify (4 Leads)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DE-PARA MAPEAMENTO VISUAL */}
          {importStep === 2 && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Confirme o Mapeamento de Colunas (De-Para)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  O sistema identificou automaticamente as colunas da sua planilha. Ajuste caso necessário:
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                {[
                  { key: 'name', label: 'Nome do Cliente' },
                  { key: 'email', label: 'E-mail Principal' },
                  { key: 'phone', label: 'Telefone / WhatsApp' },
                  { key: 'product', label: 'Nome do Produto' },
                  { key: 'amount', label: 'Valor Pago (R$)' },
                  { key: 'date', label: 'Data da Compra' },
                ].map((col) => (
                  <div key={col.key} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      {col.label}
                    </label>
                    <select
                      value={(columnMapping as any)[col.key]}
                      onChange={(e) => setColumnMapping({ ...columnMapping, [col.key]: e.target.value })}
                      style={{
                        width: '100%',
                        background: '#0F172A',
                        color: '#fff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '6px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <option value="Nome">Coluna: Nome</option>
                      <option value="Email">Coluna: Email</option>
                      <option value="WhatsApp">Coluna: WhatsApp</option>
                      <option value="Produto">Coluna: Produto</option>
                      <option value="Valor">Coluna: Valor</option>
                      <option value="Data">Coluna: Data</option>
                    </select>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => setImportStep(1)}>
                  Voltar
                </button>
                <button className="btn btn-primary" onClick={() => setImportStep(3)}>
                  Avançar para Pré-visualização <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDAÇÃO */}
          {importStep === 3 && (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Pré-visualização Sanitizada (+55 e Pontuação RFM)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Foram validadas <strong>{parsedRows.length} linhas</strong> com cálculo retroativo de RFM e formatação E.164:
                </p>
              </div>

              <div className="glass-panel" style={{ marginBottom: '20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-dim)' }}>
                      <th style={{ padding: '8px 12px' }}>Nome</th>
                      <th style={{ padding: '8px 12px' }}>E-mail</th>
                      <th style={{ padding: '8px 12px' }}>Telefone Sanitizado</th>
                      <th style={{ padding: '8px 12px' }}>Produto</th>
                      <th style={{ padding: '8px 12px' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.name}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>{r.email}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--accent-cyan)' }}>+55 {r.phone}</td>
                        <td style={{ padding: '8px 12px' }}>{r.product}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--accent-green)', fontWeight: 700 }}>R$ {r.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => setImportStep(2)}>
                  Voltar
                </button>
                <button className="btn btn-primary" onClick={handleCompleteImport}>
                  Confirmar e Injetar no CRM <CheckCircle size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUCESSO & CONCLUSÃO */}
          {importStep === 4 && (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  border: '2px solid var(--accent-green)',
                }}
              >
                <CheckCircle size={32} color="var(--accent-green)" />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>Importação Concluída com Sucesso!</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Foram inseridos <strong>{importSuccessResult?.importedLeads || 4} novos clientes</strong> e atualizados os pontos RFM e o feed de vendas.
              </p>

              <button
                className="btn btn-primary"
                onClick={() => {
                  setImportStep(1);
                  setCrmSubTab('leads');
                }}
              >
                Ver Base de Leads Atualizada
              </button>
            </div>
          )}
        </div>
      )}

      {/* Drawer: Ficha do Lead Selecionado */}
      {selectedLead && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 100,
          }}
          onClick={() => setSelectedLead(null)}
        >
          <div
            style={{
              width: '460px',
              height: '100%',
              background: '#0B101D',
              borderLeft: '1px solid var(--border-highlight)',
              padding: '24px',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Ficha do Cliente</h3>
              <button
                onClick={() => setSelectedLead(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #06B6D4, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                {selectedLead.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedLead.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{selectedLead.email}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>{selectedLead.phone}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Pontos RFM</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-green)' }}>+{selectedLead.rfmPoints} PTS</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Total Gasto</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                  R$ {selectedLead.totalSpent?.toLocaleString('pt-BR') || (Number(selectedLead.totalSpentCents) / 100).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Timeline & Histórico</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>💰 Venda Aprovada (Kiwify)</span>
                  <div style={{ color: 'var(--text-muted)' }}>Programa Primeira Página (PPP) • R$ 997,00</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px' }}>Origem: Anúncio Meta CAPI</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>📞 Contato WhatsApp</span>
                  <div style={{ color: 'var(--text-muted)' }}>Entrou no grupo VIP via link /l/bruna-vip</div>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', textDecoration: 'none' }}
            >
              <MessageCircle size={16} /> Iniciar Conversa no WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
