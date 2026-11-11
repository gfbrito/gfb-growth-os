import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Clock,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Info,
  DollarSign,
  Send,
  Lock,
} from 'lucide-react';

interface ConversionRulesViewProps {
  clientId?: string;
  userRole?: 'MASTER_AGENCY' | 'CLIENT_OWNER' | 'CLIENT_ATTENDANT';
}

const ALLOWED_MESSAGING_EVENTS = [
  'Purchase',
  'LeadSubmitted',
  'InitiateCheckout',
  'AddToCart',
  'ViewContent',
  'OrderCreated',
  'OrderShipped',
  'OrderDelivered',
  'OrderCanceled',
  'OrderReturned',
  'CartAbandoned',
  'QualifiedLead',
  'RatingProvided',
  'ReviewProvided',
];

export function ConversionRulesView({
  clientId = 'cli_sorriso_local',
  userRole = 'MASTER_AGENCY',
}: ConversionRulesViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'review' | 'audit' | 'simulator'>('rules');
  const [clientData, setClientData] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [railFilter, setRailFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [messageToast, setMessageToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal de Criação / Edição de Regra
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formStage, setFormStage] = useState('Novo Lead');
  const [formMetaEvent, setFormMetaEvent] = useState('QualifiedLead');
  const [formKeywords, setFormKeywords] = useState('');
  const [formAllowedSender, setFormAllowedSender] = useState<'LEAD' | 'ATTENDANT' | 'BOTH'>('BOTH');
  const [formDefaultValue, setFormDefaultValue] = useState('0');
  const [formExtractValue, setFormExtractValue] = useState(false);
  const [formClosesCycle, setFormClosesCycle] = useState(false);
  const [formRequiresConfirmation, setFormRequiresConfirmation] = useState(false);
  const [formIsPrimary, setFormIsPrimary] = useState(true);

  // Simulador
  const [simText, setSimText] = useState('Olá! Gostaria de um orçamento para o procedimento.');
  const [simSender, setSimSender] = useState<'LEAD' | 'ATTENDANT'>('LEAD');
  const [simPhone, setSimPhone] = useState('11999990001');
  const [simHasCtwa, setSimHasCtwa] = useState(true);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Permissões
  const isAgency = userRole === 'MASTER_AGENCY';
  const canEditRules = userRole === 'MASTER_AGENCY' || userRole === 'CLIENT_OWNER';
  const canApprove = userRole === 'MASTER_AGENCY' || userRole === 'CLIENT_OWNER';

  useEffect(() => {
    loadData();
  }, [clientId]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessageToast({ type, text });
    setTimeout(() => setMessageToast(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const tokenHeader = { 'X-User-Role': userRole, 'X-Client-Id': clientId };
      const [resRules, resReview, resAudit] = await Promise.all([
        fetch(`/api/crm/conversions/rules?clientId=${clientId}`, { headers: tokenHeader }).then((r) => r.json()),
        fetch(`/api/crm/conversions/review-queue?clientId=${clientId}`, { headers: tokenHeader }).then((r) => r.json()),
        fetch(`/api/crm/conversions/audit-logs?clientId=${clientId}`, { headers: tokenHeader }).then((r) => r.json()),
      ]);

      if (resRules.rules) setRules(resRules.rules);
      if (resRules.client) setClientData(resRules.client);
      if (resReview.items) setReviewQueue(resReview.items);
      if (resAudit.logs) setAuditLogs(resAudit.logs);
    } catch (err) {
      console.error('Erro ao carregar dados de conversão:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTracking = async () => {
    if (!canEditRules) return;
    const nextVal = !clientData?.conversionTrackingEnabled;
    try {
      const res = await fetch('/api/crm/conversions/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Role': userRole },
        body: JSON.stringify({ clientId, conversionTrackingEnabled: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        setClientData((prev: any) => ({ ...prev, conversionTrackingEnabled: nextVal }));
        showToast(`Rastreamento ${nextVal ? 'ativado' : 'desativado'} com sucesso!`);
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleToggleSimulation = async () => {
    if (!isAgency) {
      showToast('Apenas a agência (MASTER_AGENCY) pode alterar o Modo Simulação.', 'error');
      return;
    }
    const nextVal = !clientData?.simulationMode;
    try {
      const res = await fetch('/api/crm/conversions/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Role': userRole },
        body: JSON.stringify({ clientId, simulationMode: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        setClientData((prev: any) => ({ ...prev, simulationMode: nextVal }));
        showToast(`Modo Simulação ${nextVal ? 'ativado' : 'desativado'}!`);
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormName('');
    setFormStage('Novo Lead');
    setFormMetaEvent('LeadSubmitted');
    setFormKeywords('');
    setFormAllowedSender('LEAD');
    setFormDefaultValue('0');
    setFormExtractValue(false);
    setFormClosesCycle(false);
    setFormRequiresConfirmation(false);
    setFormIsPrimary(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: any) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormStage(rule.stage);
    setFormMetaEvent(rule.metaEvent);
    setFormKeywords((rule.keywords || []).join(', '));
    setFormAllowedSender(rule.allowedSender || 'BOTH');
    setFormDefaultValue(String(Number(rule.defaultValueCents || 0) / 100));
    setFormExtractValue(Boolean(rule.extractValueFromMessage));
    setFormClosesCycle(Boolean(rule.closesCycle));
    setFormRequiresConfirmation(Boolean(rule.requiresConfirmation));
    setFormIsPrimary(Boolean(rule.isPrimaryForStage));
    setIsModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditRules) return;

    if (formMetaEvent !== 'NONE' && !ALLOWED_MESSAGING_EVENTS.includes(formMetaEvent)) {
      showToast(`O evento '${formMetaEvent}' não é aceito no formato Meta Business Messaging.`, 'error');
      return;
    }

    // Trava de Purchase único
    if (formMetaEvent === 'Purchase') {
      const existing = rules.find((r) => r.metaEvent === 'Purchase' && r.id !== editingRule?.id);
      if (existing) {
        showToast('Só uma regra por funil pode mapear para Purchase.', 'error');
        return;
      }
    }

    const payload = {
      clientId,
      name: formName,
      stage: formStage,
      metaEvent: formMetaEvent,
      keywords: formKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      allowedSender: formAllowedSender,
      defaultValueCents: Math.round(parseFloat(formDefaultValue || '0') * 100),
      extractValueFromMessage: formExtractValue,
      closesCycle: formClosesCycle,
      requiresConfirmation: formRequiresConfirmation,
      isPrimaryForStage: formIsPrimary,
    };

    try {
      const url = editingRule ? `/api/crm/conversions/rules/${editingRule.id}` : '/api/crm/conversions/rules';
      const method = editingRule ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-User-Role': userRole },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar regra');

      showToast(editingRule ? 'Regra atualizada com sucesso!' : 'Regra criada com sucesso!');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!canEditRules) return;
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;
    try {
      const res = await fetch(`/api/crm/conversions/rules/${ruleId}`, {
        method: 'DELETE',
        headers: { 'X-User-Role': userRole },
      });
      if (res.ok) {
        showToast('Regra excluída');
        loadData();
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleApproveReview = async (item: any) => {
    if (!canApprove) return;
    try {
      const res = await fetch(`/api/crm/conversions/review-queue/${item.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Role': userRole },
        body: JSON.stringify({ valueCents: item.proposedValueCents }),
      });
      if (res.ok) {
        showToast('Item aprovado e conversão registrada com sucesso!');
        loadData();
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleRejectReview = async (item: any) => {
    try {
      const res = await fetch(`/api/crm/conversions/review-queue/${item.id}/reject`, {
        method: 'POST',
        headers: { 'X-User-Role': userRole },
      });
      if (res.ok) {
        showToast('Item rejeitado da fila de revisão.');
        loadData();
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleRunSimulator = async () => {
    setIsSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch('/api/whatsapp/inbound-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Role': userRole },
        body: JSON.stringify({
          clientId,
          phone: simPhone,
          contactName: 'Lead Simulação WhatsApp',
          messageText: simText,
          sender: simSender,
          rawWebhook: simHasCtwa ? { referral: { ctwa_clid: `sim_ctwa_${Date.now()}` } } : undefined,
        }),
      });
      const data = await res.json();
      setSimResult(data);
      showToast('Mensagem simulada com sucesso!');
      loadData(); // Atualiza logs de auditoria
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const isWabaConfigured = Boolean(clientData?.wabaAccountId && clientData?.wabaDatasetId);

  const filteredLogs = auditLogs.filter((l) => {
    if (railFilter === 'ALL') return true;
    return l.rail === railFilter;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Notification */}
      {messageToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            background: messageToast.type === 'success' ? '#059669' : '#dc2626',
            color: '#fff',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {messageToast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {messageToast.text}
        </div>
      )}

      {/* HEADER: Tipo de Negócio & Controles Globais */}
      <div
        style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Rastreamento de Conversões por Conversa de WhatsApp
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  background: clientData?.businessType === 'NEGOCIO_LOCAL' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: clientData?.businessType === 'NEGOCIO_LOCAL' ? '#4ade80' : '#818cf8',
                  border: `1px solid ${clientData?.businessType === 'NEGOCIO_LOCAL' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
                }}
              >
                {clientData?.businessType === 'NEGOCIO_LOCAL' ? '📍 NEGÓCIO LOCAL' : '📦 INFOPRODUTOR'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Leitura inteligente de mensagens, detecção de etapas do funil e envio direto à Meta CAPI via Business Messaging & Web.
            </p>
          </div>
        </div>

        {/* CONTROLES: Toggle de Rastreamento & Modo Simulação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Módulo Ativo/Desligado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Módulo de Gatilhos:</span>
            <button
              onClick={handleToggleTracking}
              disabled={!canEditRules}
              style={{
                background: clientData?.conversionTrackingEnabled ? '#10b981' : '#475569',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: canEditRules ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {clientData?.conversionTrackingEnabled ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {clientData?.conversionTrackingEnabled ? 'ATIVADO' : 'DESLIGADO'}
            </button>
          </div>

          {/* Modo Simulação (Restrito à Agência) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Modo Simulação:</span>
            <button
              onClick={handleToggleSimulation}
              disabled={!isAgency}
              title={!isAgency ? 'Apenas a agência (MASTER_AGENCY) pode desativar o modo simulação.' : ''}
              style={{
                background: clientData?.simulationMode ? '#eab308' : '#3b82f6',
                border: 'none',
                color: '#0f172a',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: isAgency ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {!isAgency && <Lock size={12} />}
              {clientData?.simulationMode ? 'LIGADO (SEGURO)' : 'PRODUÇÃO REAL'}
            </button>
          </div>
        </div>
      </div>

      {/* ALERTA DE CONFIGURAÇÃO PENDENTE DE TRILHO WABA */}
      {!isWabaConfigured && clientData?.conversionTrackingEnabled && (
        <div
          style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '12px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fef08a',
            fontSize: '0.85rem',
          }}
        >
          <AlertTriangle size={20} color="#eab308" />
          <div>
            <strong>Trilho WhatsApp Business não configurado:</strong> Conta WABA ou Dataset não cadastrados nas configurações do cliente. Eventos Click-to-WhatsApp (CTWA) serão registrados no log como &quot;trilho não configurado&quot; até que as credenciais sejam preenchidas pela agência.
          </div>
        </div>
      )}

      {/* SUB-ABAS INTERNAS */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', gap: '8px' }}>
        <button
          onClick={() => setActiveSubTab('rules')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'rules' ? '2px solid #06b6d4' : '2px solid transparent',
            color: activeSubTab === 'rules' ? '#38bdf8' : '#94a3b8',
            fontWeight: activeSubTab === 'rules' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Layers size={16} />
          Regras & Gatilhos ({rules.length})
        </button>

        <button
          onClick={() => setActiveSubTab('review')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'review' ? '2px solid #06b6d4' : '2px solid transparent',
            color: activeSubTab === 'review' ? '#38bdf8' : '#94a3b8',
            fontWeight: activeSubTab === 'review' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldAlert size={16} />
          Fila de Revisão Humana
          {reviewQueue.length > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.7rem',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 700,
              }}
            >
              {reviewQueue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'audit' ? '2px solid #06b6d4' : '2px solid transparent',
            color: activeSubTab === 'audit' ? '#38bdf8' : '#94a3b8',
            fontWeight: activeSubTab === 'audit' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Clock size={16} />
          Log de Auditoria ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveSubTab('simulator')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'simulator' ? '2px solid #06b6d4' : '2px solid transparent',
            color: activeSubTab === 'simulator' ? '#38bdf8' : '#94a3b8',
            fontWeight: activeSubTab === 'simulator' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Play size={16} />
          Simulador Interativo
        </button>
      </div>

      {/* ABA 1: REGRAS & GATILHOS */}
      {activeSubTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Travas Ativas: Máximo de 1 disparo por lead por ciclo • No máximo 1 Purchase por funil • Confirmação de valor obrigatória.
            </span>
            {canEditRules && (
              <button
                onClick={handleOpenCreateModal}
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                Nova Regra
              </button>
            )}
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px' }}>Nome da Regra</th>
                  <th style={{ padding: '12px 16px' }}>Etapa Vinculada</th>
                  <th style={{ padding: '12px 16px' }}>Evento Meta</th>
                  <th style={{ padding: '12px 16px' }}>Palavras-Chave (Pré-Filtro)</th>
                  <th style={{ padding: '12px 16px' }}>Emissor</th>
                  <th style={{ padding: '12px 16px' }}>Valor</th>
                  <th style={{ padding: '12px 16px' }}>Confirmação</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {rule.name}
                        {rule.isPrimaryForStage && (
                          <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>
                            PRINCIPAL
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                        {rule.stage}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: rule.metaEvent === 'Purchase' ? '#34d399' : rule.metaEvent === 'NONE' ? '#94a3b8' : '#38bdf8',
                        }}
                      >
                        {rule.metaEvent}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: '280px' }}>
                      {rule.keywords?.length === 0 ? (
                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>Primeiro contato (sem palavras)</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {rule.keywords.slice(0, 3).map((kw: string, i: number) => (
                            <span key={i} style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem' }}>
                              {kw}
                            </span>
                          ))}
                          {rule.keywords.length > 3 && (
                            <span style={{ color: '#64748b', fontSize: '0.72rem' }}>+{rule.keywords.length - 3}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                      {rule.allowedSender === 'LEAD' ? 'Apenas Lead' : rule.allowedSender === 'ATTENDANT' ? 'Apenas Atendente' : 'Ambos'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {rule.extractValueFromMessage ? (
                        <span style={{ color: '#38bdf8', fontSize: '0.78rem' }}>Extrai do chat</span>
                      ) : Number(rule.defaultValueCents || 0) > 0 ? (
                        `R$ ${(Number(rule.defaultValueCents) / 100).toFixed(2)}`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {rule.requiresConfirmation ? (
                        <span style={{ color: '#f59e0b', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldAlert size={12} /> Exige Aprovação
                        </span>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: '0.78rem' }}>Automático</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {canEditRules ? (
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEditModal(rule)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            title="Excluir"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Visualização</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 2: FILA DE REVISÃO HUMANA */}
      {activeSubTab === 'review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Itens retidos com indícios de venda ou baixa confiança da IA (&lt; 80%). Revise antes do disparo para garantir qualidade máxima na Meta.
          </div>

          {reviewQueue.length === 0 ? (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '12px',
                color: '#94a3b8',
              }}
            >
              <ShieldCheck size={36} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontWeight: 600, fontSize: '1rem', color: '#f8fafc' }}>Fila limpa!</p>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Nenhuma conversa retida aguardando revisão humana no momento.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reviewQueue.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, color: '#f8fafc' }}>{item.leadName}</span>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(234, 179, 8, 0.2)', color: '#fde047', padding: '2px 8px', borderRadius: '4px' }}>
                        Confiança IA: {Math.round(item.confidenceScore * 100)}%
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                        Evento proposto: <strong>{item.proposedEvent}</strong>
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                      &ldquo;{item.detectedText}&rdquo;
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Valor Detectado:</span>
                      <span style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
                        R$ {(Number(item.proposedValueCents || 0) / 100).toFixed(2)}
                      </span>
                    </div>

                    {canApprove && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApproveReview(item)}
                          style={{
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Aprovar Disparo
                        </button>
                        <button
                          onClick={() => handleRejectReview(item)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: LOG DE AUDITORIA */}
      {activeSubTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="#94a3b8" />
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Filtrar por trilho:</span>
              {(['ALL', 'BUSINESS_MESSAGING', 'WEB_REUSED', 'UNTRACKED'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRailFilter(r)}
                  style={{
                    background: railFilter === r ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                    color: railFilter === r ? '#0f172a' : '#cbd5e1',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {r === 'ALL' ? 'Todos' : r === 'BUSINESS_MESSAGING' ? 'Business Messaging' : r === 'WEB_REUSED' ? 'Web CAPI' : 'Sem Identificador'}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 14px' }}>Data / Hora</th>
                  <th style={{ padding: '12px 14px' }}>Lead</th>
                  <th style={{ padding: '12px 14px' }}>Evento</th>
                  <th style={{ padding: '12px 14px' }}>Valor</th>
                  <th style={{ padding: '12px 14px' }}>Trilho</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Motivo / Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      Nenhum evento registrado no log com o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#f1f5f9' }}>
                      <td style={{ padding: '12px 14px', color: '#94a3b8' }}>
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{log.leadName || log.leadId}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#38bdf8' }}>{log.event}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {Number(log.amountCents || 0) > 0 ? `R$ ${(Number(log.amountCents) / 100).toFixed(2)}` : '-'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            background:
                              log.rail === 'BUSINESS_MESSAGING'
                                ? 'rgba(34, 197, 94, 0.15)'
                                : log.rail === 'WEB_REUSED'
                                ? 'rgba(56, 189, 248, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            color:
                              log.rail === 'BUSINESS_MESSAGING'
                                ? '#4ade80'
                                : log.rail === 'WEB_REUSED'
                                ? '#38bdf8'
                                : '#f87171',
                          }}
                        >
                          {log.rail}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: log.status === 'DELIVERED' ? '#34d399' : log.status === 'ERROR' ? '#ef4444' : '#eab308',
                          }}
                        >
                          {log.status === 'DELIVERED' && (log.simulated ? 'SIMULADO' : 'ENTREGUE')}
                          {log.status === 'NOT_SENT' && 'NÃO ENVIADO'}
                          {log.status === 'ERROR' && 'ERRO'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#94a3b8', maxWidth: '320px' }}>
                        {log.reason || log.metaResponse?.message || 'Processado com sucesso'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 4: SIMULADOR INTERATIVO */}
      {activeSubTab === 'simulator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={18} color="#06b6d4" />
              Simulador de Mensagem de WhatsApp
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Teste como a detecção em duas camadas e o roteador respondem a diferentes gatilhos e origens em tempo real.
            </p>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Telefone do Lead</label>
              <input
                type="text"
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Quem enviou a mensagem?</label>
              <select
                value={simSender}
                onChange={(e) => setSimSender(e.target.value as any)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="LEAD">Lead (Cliente)</option>
                <option value="ATTENDANT">Atendente do WhatsApp</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Origem da Conversa (Anúncio)</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={simHasCtwa}
                  onChange={(e) => setSimHasCtwa(e.target.checked)}
                />
                Simular clique em anúncio Click-to-WhatsApp (injeta ctwa_clid)
              </label>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Texto da Mensagem</label>
              <textarea
                rows={3}
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem', resize: 'vertical' }}
              />
            </div>

            <button
              onClick={handleRunSimulator}
              disabled={isSimulating}
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSimulating ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              Disparar Mensagem de Teste
            </button>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>Resultado da Simulação</h3>
            {!simResult ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                Clique em &quot;Disparar Mensagem de Teste&quot; para visualizar o processamento e a decisão do roteador aqui.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                  <strong>Origem Detectada:</strong>{' '}
                  <span style={{ color: '#38bdf8' }}>{simResult.origin?.originType}</span>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                  <strong>Regras Avaliadas:</strong> {simResult.evaluationResults?.length || 0}
                </div>
                <pre
                  style={{
                    background: '#090d16',
                    padding: '12px',
                    borderRadius: '8px',
                    color: '#a5f3fc',
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                    maxHeight: '260px',
                  }}
                >
                  {JSON.stringify(simResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE REGRA */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              {editingRule ? 'Editar Regra de Conversão' : 'Nova Regra de Conversão WhatsApp'}
            </h3>

            <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Nome da Regra</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Lead Qualificado (Interesse em Procedimento)"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Etapa do Funil</label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                  >
                    {(clientData?.stages || ['Novo Lead', 'Em Atendimento', 'Qualificado', 'Proposta', 'Venda', 'Perdido']).map((st: string) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Evento Meta CAPI</label>
                  <select
                    value={formMetaEvent}
                    onChange={(e) => setFormMetaEvent(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="NONE">Não envia para a Meta (Apenas CRM)</option>
                    {ALLOWED_MESSAGING_EVENTS.map((ev) => (
                      <option key={ev} value={ev}>{ev}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Palavras-Chave de Pré-Filtro (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="orçamento, agendar, horário, preço (deixe vazio para 1ª mensagem)"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Quem pode disparar?</label>
                  <select
                    value={formAllowedSender}
                    onChange={(e) => setFormAllowedSender(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="BOTH">Ambos (Lead ou Atendente)</option>
                    <option value="LEAD">Apenas o Lead</option>
                    <option value="ATTENDANT">Apenas o Atendente</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Valor Padrão (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDefaultValue}
                    onChange={(e) => setFormDefaultValue(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formExtractValue}
                    onChange={(e) => setFormExtractValue(e.target.checked)}
                  />
                  Extrair valor monetário automaticamente do texto da mensagem
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formRequiresConfirmation}
                    onChange={(e) => setFormRequiresConfirmation(e.target.checked)}
                  />
                  Exigir confirmação humana antes de enviar à Meta (Fila de Revisão)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formClosesCycle}
                    onChange={(e) => setFormClosesCycle(e.target.checked)}
                  />
                  Encerra ciclo de atendimento do lead ao disparar
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formIsPrimary}
                    onChange={(e) => setFormIsPrimary(e.target.checked)}
                  />
                  Evento principal desta etapa (disparado ao mover o lead para cá)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Salvar Regra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
