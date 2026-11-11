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
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  Zap,
  Activity,
  Clock,
  Database,
  Globe,
  Smartphone,
  Tag,
  RefreshCw,
  Plus,
  Edit3,
  Download,
  Trash2,
  DollarSign,
  Flame,
  Sliders,
  Bell,
  Send,
  Copy,
  Check,
  Gift,
  Layers,
  ChevronLeft,
  Eye,
  X,
  Calendar,
  CheckCheck,
  Play,
  Pause,
  HelpCircle,
  Smile,
  Paperclip,
  Mic,
  TrendingUp,
} from 'lucide-react';
import type { CrmSubTab, Lead, SaleOrder, AutomationRule, SubscriptionItem, OperationalNotification } from '../types/crm';
import { LeadFormModal } from './LeadFormModal';
import { SaleModal } from './SaleModal';
import { ClientWhatsApp } from './ClientWhatsApp';
import { ConversionRulesView } from './ConversionRulesView';

interface ClientCrmProps {
  subTab?: CrmSubTab;
  onChangeSubTab?: (tab: CrmSubTab) => void;
  userRole?: 'MASTER_AGENCY' | 'CLIENT_OWNER' | 'CLIENT_ATTENDANT';
  clientId?: string;
  clientName?: string;
  onOpenChat?: (params: {
    leadId?: string;
    name: string;
    phone: string;
    prefillText?: string;
    returnTo?: { crmSubTab: CrmSubTab; leadId?: string };
  }) => void;
  initialSelectedLeadId?: string | null;
  onClearInitialLeadId?: () => void;
}

const subTabTitles: Record<CrmSubTab, { title: string; desc: string; tag: string }> = {
  leads: {
    title: 'Base de Leads & RFM',
    desc: 'Gestão de contatos qualificados, temperatura da base, pontuação RFM e histórico 360°.',
    tag: 'Base de Contatos',
  },
  products: {
    title: 'Produtos & Catálogo',
    desc: 'Infoprodutos cadastrados, planos de assinatura, preços e esteiras ativas.',
    tag: 'Catálogo',
  },
  sales: {
    title: 'Gestão de Vendas & Pedidos',
    desc: 'Monitoramento de pedidos aprovados, pendentes, ticket médio e canais de aquisição.',
    tag: 'Vendas',
  },
  recovery: {
    title: 'Recuperação de Vendas',
    desc: 'Carrinhos abandonados, PIX pendentes e recusas de cartão em tempo real.',
    tag: 'Anti-Abandono',
  },
  automations: {
    title: 'Automações & Réguas de Disparo',
    desc: 'Sequências automáticas por gatilho de checkout, carrinho abandonado e aniversário.',
    tag: 'Automações',
  },
  conversionRules: {
    title: 'Eventos & Gatilhos de WhatsApp',
    desc: 'Motor de conversões por conversa para negócios locais, classificação de etapas e CAPI Gateway.',
    tag: 'Gatilhos CAPI',
  },
  chat: {
    title: 'Inbox WhatsApp',
    desc: 'Atendimento e chat em tempo real conectado à esteira anti-ban.',
    tag: 'WhatsApp',
  },
  broadcasts: {
    title: 'Mensagens em Massa',
    desc: 'Campanhas segmentadas de disparo em lote com motor anti-ban SendGate.',
    tag: 'Disparos',
  },
  import: {
    title: 'Importador de CSV',
    desc: 'Importação assistida de contatos e histórico em 4 etapas guiadas.',
    tag: 'Importação',
  },
  subscriptions: {
    title: 'Assinaturas & Recorrência',
    desc: 'Gestão de assinantes, prazos de renovação e métricas de retenção.',
    tag: 'Recorrência',
  },
  notifications: {
    title: 'Notificações & Pendências',
    desc: 'Alertas operacionais do sistema, novos produtos detectados e webhooks.',
    tag: 'Alertas',
  },
  settings: {
    title: 'Configurações do CRM',
    desc: 'Regras de pontuação RFM, limites de temperatura, mapeamento de webhooks e campos customizados.',
    tag: 'Configurações',
  },
};

export function ClientCrm({
  subTab = 'leads',
  onChangeSubTab,
  userRole = 'MASTER_AGENCY',
  clientId = '',
  clientName = 'Cliente',
  onOpenChat,
  initialSelectedLeadId,
  onClearInitialLeadId,
}: ClientCrmProps) {
  const currentTab = subTab;

  // -------------------------------------------------------------
  // STATE: LEADS
  // -------------------------------------------------------------
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchLead, setSearchLead] = useState('');
  const [filterTemp, setFilterTemp] = useState<string>('ALL');
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [filterOrigin, setFilterOrigin] = useState<string>('ALL');
  const [leadPage, setLeadPage] = useState(1);
  const leadsPerPage = 10;

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadProfileData, setLeadProfileData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // -------------------------------------------------------------
  // STATE: SIMULADOR WEBHOOK
  // -------------------------------------------------------------
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  // -------------------------------------------------------------
  // STATE: PRODUCTS
  // -------------------------------------------------------------
  const [products, setProducts] = useState<any[]>([]);

  // -------------------------------------------------------------
  // STATE: SALES
  // -------------------------------------------------------------
  const [salesList, setSalesList] = useState<SaleOrder[]>([]);
  const [salesMetrics, setSalesMetrics] = useState({ totalRevenue: 0, totalCount: 0, averageTicket: 0, approvalRatePct: 0 });
  const [salePeriod, setSalePeriod] = useState<string>('ALL');
  const [saleStatusFilter, setSaleStatusFilter] = useState<string>('ALL');
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  // -------------------------------------------------------------
  // STATE: RECOVERY
  // -------------------------------------------------------------
  const [recoveryItems, setRecoveryItems] = useState<any[]>([]);
  const [recoveryFilter, setRecoveryFilter] = useState<'ALL' | 'ABANDONED_CART' | 'PAYMENT_REFUSED' | 'PENDING_PIX_BOLETO' | 'REFUND'>('ALL');

  // -------------------------------------------------------------
  // STATE: AUTOMATIONS
  // -------------------------------------------------------------
  const [automationsList, setAutomationsList] = useState<AutomationRule[]>([]);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState<boolean>(true);
  const [connectedChip, setConnectedChip] = useState<any>(null);
  const [birthdayResult, setBirthdayResult] = useState<any>(null);
  const [isCheckingBirthday, setIsCheckingBirthday] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationRule | null>(null);
  const [editDelay, setEditDelay] = useState<number>(0);
  const [editTemplate, setEditTemplate] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [automationSaveFeedback, setAutomationSaveFeedback] = useState<string | null>(null);
  const [isSavingAutomation, setIsSavingAutomation] = useState(false);

  // -------------------------------------------------------------
  // STATE: BROADCASTS
  // -------------------------------------------------------------
  const [broadcastTargetTemp, setBroadcastTargetTemp] = useState<string>('ALL');
  const [broadcastTargetStage, setBroadcastTargetStage] = useState<string>('ALL');
  const [broadcastMessage, setBroadcastMessage] = useState('{Olá|Oi|Tudo bem}, {primeiro_nome}! Temos uma condição exclusiva para você concluir o seu acesso.');
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);
  const [broadcastHistory, setBroadcastHistory] = useState([
    { id: 'bc_1', date: '2026-09-24 14:30', name: 'Oferta Relâmpago PPP VIP', segment: 'Quentes (Score > 80)', audience: 42, delivered: 42, converted: 12 },
    { id: 'bc_2', date: '2026-09-20 10:00', name: 'Lembrete de Abertura de Vagas', segment: 'Todos os Leads', audience: 180, delivered: 178, converted: 34 },
  ]);

  // -------------------------------------------------------------
  // STATE: SUBSCRIPTIONS
  // -------------------------------------------------------------
  const [subscriptionsList, setSubscriptionsList] = useState<SubscriptionItem[]>([]);
  const [subMetrics, setSubMetrics] = useState({ totalActive: 0, mrr: 0, renewalDueCount: 0, expiredCount: 0 });

  // -------------------------------------------------------------
  // STATE: NOTIFICATIONS
  // -------------------------------------------------------------
  const [notificationsList, setNotificationsList] = useState<OperationalNotification[]>([]);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'UNREAD' | 'CRITICAL'>('ALL');

  // -------------------------------------------------------------
  // STATE: SETTINGS
  // -------------------------------------------------------------
  const [crmSettings, setCrmSettings] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  // -------------------------------------------------------------
  // STATE: CSV IMPORT WIZARD (4 Steps)
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // LOAD DATA
  // -------------------------------------------------------------
  const reloadCrmData = () => {
    fetch(`/api/crm/leads?clientId=${clientId}`)
      .then((res) => res.json())
      .then((data) => setLeads(data.leads || []))
      .catch((err) => console.error(err));

    fetch(`/api/crm/sales?clientId=${clientId}&status=${saleStatusFilter}&period=${salePeriod}`)
      .then((res) => res.json())
      .then((data) => {
        setSalesList(data.sales || []);
        if (data.metrics) setSalesMetrics(data.metrics);
      })
      .catch((err) => console.error(err));

    fetch(`/api/crm/products?clientId=${clientId}`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch((err) => console.error(err));

    fetch(`/api/crm/recovery?clientId=${clientId}`)
      .then((res) => res.json())
      .then((data) => setRecoveryItems(data.recoveryItems || []))
      .catch((err) => console.error(err));

    fetch(`/api/crm/automations?clientId=${clientId}`)
      .then((res) => res.json())
      .then((data) => {
        setAutomationsList(data.automations || []);
        setIsWhatsAppConnected(Boolean(data.isWhatsAppConnected));
        setConnectedChip(data.connectedChip || null);
      })
      .catch((err) => console.error(err));

    fetch(`/api/crm/subscriptions?clientId=${clientId}`)
      .then((res) => res.json())
      .then((data) => {
        setSubscriptionsList(data.subscriptions || []);
        if (data.metrics) setSubMetrics(data.metrics);
      })
      .catch((err) => console.error(err));

    fetch(`/api/crm/notifications?clientId=${clientId}`)
      .then((res) => res.json())
      .then((data) => setNotificationsList(data.notifications || []))
      .catch((err) => console.error(err));

    fetch(`/api/crm/settings`)
      .then((res) => res.json())
      .then((data) => setCrmSettings(data.settings || null))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    reloadCrmData();
  }, [clientId, salePeriod, saleStatusFilter]);

  useEffect(() => {
    if (initialSelectedLeadId && leads.length > 0) {
      const found = leads.find((l) => l.id === initialSelectedLeadId);
      if (found) {
        handleOpenLeadProfile(found);
      }
    }
  }, [initialSelectedLeadId, leads]);

  // -------------------------------------------------------------
  // HANDLERS: LEADS & FICHA 360°
  // -------------------------------------------------------------
  const handleOpenLeadProfile = (lead: Lead) => {
    setSelectedLead(lead);
    setIsProfileLoading(true);
    fetch(`/api/crm/leads/${lead.id}/timeline`)
      .then((res) => res.json())
      .then((data) => setLeadProfileData(data.profile || null))
      .catch((err) => console.error(err))
      .finally(() => setIsProfileLoading(false));
  };

  const handleCloseLeadProfile = () => {
    setSelectedLead(null);
    setLeadProfileData(null);
    onClearInitialLeadId?.();
  };

  const handleSaveLead = async (leadData: Partial<Lead>) => {
    if (editingLead) {
      const res = await fetch(`/api/crm/leads/${editingLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar lead');
      }
    } else {
      const res = await fetch(`/api/crm/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao cadastrar lead');
      }
    }
    reloadCrmData();
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Deseja realmente remover este lead?')) return;
    try {
      await fetch(`/api/crm/leads/${id}`, { method: 'DELETE' });
      if (selectedLead?.id === id) {
        handleCloseLeadProfile();
      }
      reloadCrmData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportLeadsCsv = () => {
    const headers = ['ID', 'Nome', 'Email', 'Telefone', 'CPF', 'Nascimento', 'Temperatura', 'Estágio', 'RFM', 'Gasto Total (R$)', 'Origem', 'Tags'];
    const rows = filteredLeads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.email}"`,
      `"${l.phone}"`,
      `"${l.cpf || ''}"`,
      `"${l.birthDate || ''}"`,
      l.temperature,
      l.stage,
      l.rfmPoints,
      (Number(l.totalSpentCents) / 100).toFixed(2),
      l.origin || 'MANUAL',
      `"${(l.tags || []).join(', ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_export_${clientId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // HANDLERS: VENDAS
  // -------------------------------------------------------------
  const handleSaveSale = async (saleData: any) => {
    const res = await fetch('/api/crm/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao registrar venda');
    }
    reloadCrmData();
  };

  // -------------------------------------------------------------
  // HANDLERS: AUTOMAÇÕES
  // -------------------------------------------------------------
  const handleToggleAutomation = async (id: string, currentVal: boolean) => {
    try {
      await fetch(`/api/crm/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentVal }),
      });
      setAutomationsList(
        automationsList.map((a) => (a.id === id ? { ...a, isActive: !currentVal } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAutomationConfig = async (id: string, delayMinutes: number, templateMessage: string) => {
    try {
      await fetch(`/api/crm/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delayMinutes, templateMessage }),
      });
      alert('Automação atualizada com sucesso!');
      reloadCrmData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckBirthdays = async () => {
    setIsCheckingBirthday(true);
    try {
      const res = await fetch(`/api/crm/automations/birthday-check?clientId=${clientId}`);
      const data = await res.json();
      setBirthdayResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingBirthday(false);
    }
  };

  const handleOpenAutomationDetail = (auto: AutomationRule) => {
    setSelectedAutomation(auto);
    setEditDelay(auto.delayMinutes);
    setEditTemplate(auto.templateMessage);
    setEditIsActive(auto.isActive);
    setAutomationSaveFeedback(null);
  };

  const handleSaveAutomationDetail = async () => {
    if (!selectedAutomation) return;
    setIsSavingAutomation(true);
    try {
      const res = await fetch(`/api/crm/automations/${selectedAutomation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delayMinutes: editDelay,
          templateMessage: editTemplate,
          isActive: editIsActive,
        }),
      });
      if (res.ok) {
        setAutomationsList((prev) =>
          prev.map((a) =>
            a.id === selectedAutomation.id
              ? { ...a, delayMinutes: editDelay, templateMessage: editTemplate, isActive: editIsActive }
              : a
          )
        );
        setSelectedAutomation((prev) =>
          prev ? { ...prev, delayMinutes: editDelay, templateMessage: editTemplate, isActive: editIsActive } : null
        );
        setAutomationSaveFeedback('Alterações salvas com sucesso no motor de disparos!');
        setTimeout(() => setAutomationSaveFeedback(null), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingAutomation(false);
    }
  };

  const formatWhatsAppText = (text: string) => {
    if (!text) return null;
    const sample = text
      .replace(/{primeiro_nome}/gi, 'Camila')
      .replace(/{nome}/gi, 'Camila')
      .replace(/{produto}/gi, 'Programa Primeira Página (PPP)')
      .replace(/{valor}/gi, 'R$ 997,00')
      .replace(/{link}/gi, 'https://pay.kiwify.com.br/h89yK2?cupom=VIP10');

    const lines = sample.split('\n');

    const parseLine = (line: string): React.ReactNode[] => {
      const regex = /(\*[^*]+\*|_[^_]+_|~[^~]+~|https?:\/\/[^\s]+)/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        const raw = match[0];
        if (raw.startsWith('*') && raw.endsWith('*')) {
          parts.push(<strong key={match.index} style={{ fontWeight: 700, color: '#fff' }}>{raw.slice(1, -1)}</strong>);
        } else if (raw.startsWith('_') && raw.endsWith('_')) {
          parts.push(<em key={match.index} style={{ fontStyle: 'italic', color: '#e9edef' }}>{raw.slice(1, -1)}</em>);
        } else if (raw.startsWith('~') && raw.endsWith('~')) {
          parts.push(<del key={match.index} style={{ textDecoration: 'line-through', opacity: 0.75 }}>{raw.slice(1, -1)}</del>);
        } else if (raw.startsWith('http')) {
          parts.push(
            <a key={match.index} href={raw} target="_blank" rel="noreferrer" style={{ color: '#53bdeb', textDecoration: 'underline', wordBreak: 'break-all' }}>
              {raw}
            </a>
          );
        }
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return parts.length > 0 ? parts : [line];
    };

    return lines.map((l, idx) => (
      <React.Fragment key={idx}>
        {parseLine(l)}
        {idx < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const getTriggerMeta = (type: string) => {
    switch (type) {
      case 'ABANDONED_CART':
        return {
          label: 'Carrinho Abandonado',
          desc: 'Disparado quando o checkout é iniciado mas o pagamento não é finalizado',
          badgeColor: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.3)',
          icon: ShoppingBag,
        };
      case 'PENDING_PIX_BOLETO':
        return {
          label: 'Pix / Boleto Pendente',
          desc: 'Disparado para lembrar o cliente antes do vencimento do código Pix ou boleto',
          badgeColor: '#06B6D4',
          bg: 'rgba(6, 182, 212, 0.15)',
          border: 'rgba(6, 182, 212, 0.3)',
          icon: Clock,
        };
      case 'PAYMENT_REFUSED':
        return {
          label: 'Cartão Recusado',
          desc: 'Disparado quando o banco emissor recusa a cobrança no cartão de crédito',
          badgeColor: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.3)',
          icon: AlertCircle,
        };
      case 'NEW_LEAD':
        return {
          label: 'Novo Lead Cadastrado',
          desc: 'Disparado na entrada de novo lead por formulário ou página de captura',
          badgeColor: '#8B5CF6',
          bg: 'rgba(139, 92, 246, 0.15)',
          border: 'rgba(139, 92, 246, 0.3)',
          icon: Users,
        };
      case 'BIRTHDAY':
        return {
          label: 'Aniversário do Lead',
          desc: 'Disparado às 09:00 no dia do aniversário do cliente com cupom especial',
          badgeColor: '#EC4899',
          bg: 'rgba(236, 72, 153, 0.15)',
          border: 'rgba(236, 72, 153, 0.3)',
          icon: Gift,
        };
      default:
        return {
          label: type,
          desc: 'Gatilho operacional configurado no CRM',
          badgeColor: 'var(--accent-green)',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.3)',
          icon: Zap,
        };
    }
  };

  const formatAutomationDate = (dateStr?: string) => {
    if (!dateStr) return '15/03/2026';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: BROADCASTS
  // -------------------------------------------------------------
  const handleSendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    setBroadcastFeedback('Disparo iniciado com sucesso através do SendGate Anti-Ban com atraso gaussiano.');
    const newHistory = {
      id: `bc_${Date.now()}`,
      date: new Date().toLocaleString('pt-BR'),
      name: `Campanha Segmentada (${broadcastTargetTemp}/${broadcastTargetStage})`,
      segment: `${broadcastTargetTemp} · ${broadcastTargetStage}`,
      audience: broadcastTargetLeads.length,
      delivered: broadcastTargetLeads.length,
      converted: 0,
    };
    setBroadcastHistory([newHistory, ...broadcastHistory]);
    setTimeout(() => setBroadcastFeedback(null), 5000);
  };

  // -------------------------------------------------------------
  // HANDLERS: NOTIFICAÇÕES
  // -------------------------------------------------------------
  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/crm/notifications/${id}/read`, { method: 'PATCH' });
      setNotificationsList(
        notificationsList.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: CONFIGURAÇÕES
  // -------------------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crmSettings) return;
    try {
      const res = await fetch('/api/crm/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crmSettings),
      });
      if (res.ok) {
        setSettingsFeedback('Configurações do CRM salvas com sucesso!');
        setTimeout(() => setSettingsFeedback(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyText = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // -------------------------------------------------------------
  // HANDLERS: RECOVERY
  // -------------------------------------------------------------
  const handleUpdateRecovery = (id: string, newStatus: string) => {
    fetch(`/api/crm/recovery/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then(() => {
        setRecoveryItems(
          recoveryItems.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      })
      .catch((err) => console.error(err));
  };

  // -------------------------------------------------------------
  // HANDLERS: WEBHOOK SIMULATOR
  // -------------------------------------------------------------
  const handleRunSimulation = (eventType: 'PURCHASE' | 'CART_ABANDON') => {
    setIsSimulating(true);
    setSimulationStatus('Disparando Webhook simulado e cruzando Identity Graph...');
    fetch('/api/webhooks/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        eventType,
        email: selectedLead?.email || 'camila.ribeiro@gmail.com',
        phone: selectedLead?.phone || '+5511987654321',
        name: selectedLead?.name || 'Camila Ribeiro',
        productName: 'Programa Primeira Página (PPP)',
        amountCents: 99700,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setSimulationStatus(
          data.isIdentityMatched
            ? `✅ Sucesso! Cruzamento de identidade confirmado (Lead atualizado, CAPI disparado).`
            : `✅ Novo Lead criado na esteira com sucesso.`
        );
        reloadCrmData();
        if (selectedLead) {
          handleOpenLeadProfile(selectedLead);
        }
      })
      .catch((err) => {
        setSimulationStatus(`❌ Falha na simulação: ${err.message}`);
      })
      .finally(() => {
        setTimeout(() => {
          setIsSimulating(false);
          setSimulationStatus(null);
        }, 5000);
      });
  };

  // -------------------------------------------------------------
  // HANDLERS: IMPORT CSV
  // -------------------------------------------------------------
  const handleParseCsv = () => {
    if (!csvRawText.trim()) return;
    const lines = csvRawText.trim().split('\n');
    if (lines.length < 2) return;
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) => {
      const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = vals[idx] || '';
      });
      return obj;
    });
    setParsedRows(rows);
    setImportStep(2);
  };

  const handleExecuteImport = () => {
    setImportStep(3);
    const mapped = parsedRows.map((r) => ({
      name: r[columnMapping.name] || '',
      email: r[columnMapping.email] || '',
      phone: r[columnMapping.phone] || '',
      product: r[columnMapping.product] || '',
      amount: r[columnMapping.amount] || '',
      date: r[columnMapping.date] || '',
    }));

    fetch('/api/crm/import-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, rows: mapped }),
    })
      .then((res) => res.json())
      .then((data) => {
        setImportSuccessResult(data);
        setImportStep(4);
        reloadCrmData();
      })
      .catch((err) => {
        console.error(err);
        alert('Erro ao processar importação.');
        setImportStep(2);
      });
  };

  // -------------------------------------------------------------
  // COMPUTED: LEADS FILTERING & PAGINATION
  // -------------------------------------------------------------
  const filteredLeads = leads.filter((l) => {
    const matchTemp = filterTemp === 'ALL' || l.temperature === filterTemp;
    const matchStage = filterStage === 'ALL' || l.stage === filterStage;
    const matchOrigin = filterOrigin === 'ALL' || (l.origin || 'MANUAL') === filterOrigin;
    const q = searchLead.toLowerCase();
    const matchSearch =
      !searchLead ||
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.cpf && l.cpf.includes(q));
    return matchTemp && matchStage && matchOrigin && matchSearch;
  });

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage) || 1;
  const paginatedLeads = filteredLeads.slice((leadPage - 1) * leadsPerPage, leadPage * leadsPerPage);

  const broadcastTargetLeads = leads.filter((l) => {
    if (l.whatsappOptOut) return false;
    const matchTemp = broadcastTargetTemp === 'ALL' || l.temperature === broadcastTargetTemp;
    const matchStage = broadcastTargetStage === 'ALL' || l.stage === broadcastTargetStage;
    return matchTemp && matchStage;
  });

  const filteredRecovery = recoveryItems.filter((i) => {
    if (recoveryFilter === 'ALL') return true;
    return i.type === recoveryFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub-Screen Header */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {subTabTitles[currentTab]?.title || 'CRM'}
            </h2>
            <span className="badge badge-cyan" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
              {subTabTitles[currentTab]?.tag || 'CRM'}
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {subTabTitles[currentTab]?.desc || ''}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={reloadCrmData}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} />
            Atualizar Dados
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: BASE DE LEADS & RFM */}
      {/* ======================================================== */}
      {currentTab === 'leads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Real-Time Webhook Simulator Banner (Apenas MASTER_AGENCY) */}
          {userRole === 'MASTER_AGENCY' && (
            <>
              <div
                className="glass-panel"
                style={{
                  padding: '14px 20px',
                  background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(6, 182, 212, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    <Zap size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Simulador de Webhooks & Cruzamento de Leads em Tempo Real
                      <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>Identity Graph Ativo</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Teste em 1 clique o ciclo completo: Webhook Kiwify → Atualização de Lead → Fechamento de Recuperação → Meta CAPI.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleRunSimulation('PURCHASE')}
                    disabled={isSimulating}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                  >
                    ⚡ Simular Compra Aprovada
                  </button>
                  <button
                    onClick={() => handleRunSimulation('CART_ABANDON')}
                    disabled={isSimulating}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                  >
                    🛒 Simular Carrinho Abandonado
                  </button>
                </div>
              </div>

              {simulationStatus && (
                <div
                  style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Activity size={14} color="var(--accent-cyan)" />
                  {simulationStatus}
                </div>
              )}
            </>
          )}

          {/* Action & Filter Bar */}
          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '420px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail, telefone ou CPF..."
                  value={searchLead}
                  onChange={(e) => {
                    setSearchLead(e.target.value);
                    setLeadPage(1);
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px 8px 36px',
                    color: '#fff',
                    fontSize: '0.82rem',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleExportLeadsCsv}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '7px 14px' }}
                >
                  <Download size={14} /> Exportar CSV ({filteredLeads.length})
                </button>
                <button
                  onClick={() => {
                    setEditingLead(null);
                    setIsLeadModalOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '7px 16px' }}
                >
                  <Plus size={15} /> Novo Lead
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Temperatura */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Temperatura:</span>
                {['ALL', 'HOT', 'WARM', 'COLD'].map((temp) => (
                  <button
                    key={temp}
                    onClick={() => {
                      setFilterTemp(temp);
                      setLeadPage(1);
                    }}
                    style={{
                      background: filterTemp === temp ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: filterTemp === temp ? '1px solid var(--border-highlight)' : '1px solid transparent',
                      color: filterTemp === temp ? '#fff' : 'var(--text-dim)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
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

              {/* Estágio */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Estágio:</span>
                {['ALL', 'LEAD', 'BUYER', 'VIP'].map((stg) => (
                  <button
                    key={stg}
                    onClick={() => {
                      setFilterStage(stg);
                      setLeadPage(1);
                    }}
                    style={{
                      background: filterStage === stg ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: filterStage === stg ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                      color: filterStage === stg ? 'var(--accent-cyan)' : 'var(--text-dim)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {stg === 'ALL' && 'Todos'}
                    {stg === 'LEAD' && 'Lead'}
                    {stg === 'BUYER' && 'Comprador'}
                    {stg === 'VIP' && 'VIP'}
                  </button>
                ))}
              </div>

              {/* Origem */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Origem:</span>
                {['ALL', 'ADS', 'ORGANIC', 'INDICATION', 'MANUAL'].map((orig) => (
                  <button
                    key={orig}
                    onClick={() => {
                      setFilterOrigin(orig);
                      setLeadPage(1);
                    }}
                    style={{
                      background: filterOrigin === orig ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: filterOrigin === orig ? '1px solid var(--accent-green)' : '1px solid transparent',
                      color: filterOrigin === orig ? 'var(--accent-green)' : 'var(--text-dim)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {orig === 'ALL' && 'Todas'}
                    {orig === 'ADS' && 'Anúncios'}
                    {orig === 'ORGANIC' && 'Orgânico'}
                    {orig === 'INDICATION' && 'Indicação'}
                    {orig === 'MANUAL' && 'Manual'}
                  </button>
                ))}
              </div>
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
                  <th style={{ padding: '12px 16px' }}>ORIGEM</th>
                  <th style={{ padding: '12px 16px' }}>PONTOS RFM</th>
                  <th style={{ padding: '12px 16px' }}>TOTAL GASTO</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleOpenLeadProfile(lead)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{lead.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{lead.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {lead.phone ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChat?.({
                              leadId: lead.id,
                              name: lead.name,
                              phone: lead.phone,
                              returnTo: { crmSubTab: 'leads', leadId: lead.id },
                            });
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: 'var(--accent-cyan)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.82rem',
                          }}
                        >
                          <MessageCircle size={13} />
                          {lead.phone}
                        </button>
                      ) : (
                        <span
                          title="Lead sem WhatsApp cadastrado"
                          style={{ color: 'var(--text-dim)', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'not-allowed' }}
                        >
                          <MessageCircle size={13} /> Sem telefone
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {lead.temperature === 'HOT' && <span className="badge badge-rose">🔥 Quente</span>}
                      {lead.temperature === 'WARM' && <span className="badge badge-amber">⚡ Morno</span>}
                      {lead.temperature === 'COLD' && <span className="badge badge-cyan">❄️ Frio</span>}
                      {lead.temperature === 'INACTIVE' && <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>Inativo</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-green">{lead.stage}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        {lead.origin || 'MANUAL'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--accent-green)' }}>{lead.rfmPoints} pts</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, color: '#fff' }}>
                        R$ {Number(Number(lead.totalSpentCents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLead(lead);
                            setIsLeadModalOpen(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          title="Editar Lead"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLead(lead.id);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#f87171' }}
                          title="Remover Lead"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedLeads.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                      Nenhum lead encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: '12px 18px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-dim)',
                }}
              >
                <span>
                  Mostrando {(leadPage - 1) * leadsPerPage + 1} a {Math.min(leadPage * leadsPerPage, filteredLeads.length)} de {filteredLeads.length} leads
                </span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    disabled={leadPage <= 1}
                    onClick={() => setLeadPage((p) => Math.max(1, p - 1))}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <span style={{ padding: '0 8px', color: '#fff', fontWeight: 600 }}>
                    {leadPage} / {totalPages}
                  </span>
                  <button
                    disabled={leadPage >= totalPages}
                    onClick={() => setLeadPage((p) => Math.min(totalPages, p + 1))}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    Próxima <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: PRODUTOS & CATÁLOGO */}
      {/* ======================================================== */}
      {currentTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {products.map((prod) => (
              <div key={prod.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="badge badge-purple" style={{ marginBottom: '6px' }}>{prod.type}</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>{prod.name}</h3>
                  </div>
                  <span className={prod.status === 'ACTIVE' ? 'badge badge-green' : 'badge badge-amber'}>
                    {prod.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Preço Final</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                      R$ {prod.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Vendas Registradas</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{prod.salesCount} un</div>
                  </div>
                </div>

                {prod.externalPlatform && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Plataforma Checkout: <span className="badge badge-cyan">{prod.externalPlatform}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: GESTÃO DE VENDAS & PEDIDOS */}
      {/* ======================================================== */}
      {currentTab === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sales KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Faturamento Aprovado</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                R$ {salesMetrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {salesMetrics.totalCount} pedidos aprovados
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Ticket Médio</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                R$ {salesMetrics.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Média por compra
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Total de Pedidos</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
                {salesList.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Todas as plataformas
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Taxa de Aprovação</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {salesMetrics.approvalRatePct}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Conversão de checkout
              </div>
            </div>
          </div>

          {/* Filters & Action Bar */}
          <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Period */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Período:</span>
                {[
                  { id: 'ALL', label: 'Todos' },
                  { id: 'TODAY', label: 'Hoje' },
                  { id: '7D', label: '7 Dias' },
                  { id: '30D', label: '30 Dias' },
                  { id: 'THIS_MONTH', label: 'Este Mês' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSalePeriod(p.id)}
                    style={{
                      background: salePeriod === p.id ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: salePeriod === p.id ? '1px solid var(--border-highlight)' : '1px solid transparent',
                      color: salePeriod === p.id ? '#fff' : 'var(--text-dim)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Status:</span>
                {[
                  { id: 'ALL', label: 'Todos' },
                  { id: 'CONFIRMED', label: 'Aprovados' },
                  { id: 'PENDING', label: 'Pendentes' },
                  { id: 'REFUNDED', label: 'Reembolsados' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSaleStatusFilter(s.id)}
                    style={{
                      background: saleStatusFilter === s.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: saleStatusFilter === s.id ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                      color: saleStatusFilter === s.id ? 'var(--accent-cyan)' : 'var(--text-dim)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsSaleModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '7px 16px' }}
            >
              <Plus size={15} /> Nova Venda Manual / Balcão
            </button>
          </div>

          {/* Sales Table */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 16px' }}>DATA</th>
                  <th style={{ padding: '12px 16px' }}>CLIENTE</th>
                  <th style={{ padding: '12px 16px' }}>PRODUTO</th>
                  <th style={{ padding: '12px 16px' }}>VALOR</th>
                  <th style={{ padding: '12px 16px' }}>PLATAFORMA</th>
                  <th style={{ padding: '12px 16px' }}>ATRIBUIÇÃO</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {salesList.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')} {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{order.leadName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{order.leadEmail}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{order.productName}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--accent-green)' }}>
                      R$ {Number(Number(order.grossAmountCents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-purple">{order.platform}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.75rem' }}>
                      {order.isAttributedToAds ? (
                        <span className="badge badge-cyan">Meta CAPI ({order.adCampaignName || 'Ads'})</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Orgânico / Balcão</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {order.status === 'CONFIRMED' && <span className="badge badge-green">🟢 Aprovada</span>}
                      {order.status === 'PENDING' && <span className="badge badge-amber">🟡 Pendente</span>}
                      {order.status === 'REFUNDED' && <span className="badge badge-rose">🔴 Reembolsada</span>}
                      {order.status === 'CHARGEBACK' && <span className="badge badge-rose">⚠️ Chargeback</span>}
                    </td>
                  </tr>
                ))}
                {salesList.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                      Nenhuma venda registrada com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 4: RECUPERAÇÃO DE VENDAS */}
      {/* ======================================================== */}
      {currentTab === 'recovery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'ABANDONED_CART', label: '🛒 Carrinhos' },
                { id: 'PENDING_PIX_BOLETO', label: '⚡ PIX Pendente' },
                { id: 'PAYMENT_REFUSED', label: '💳 Recusados' },
                { id: 'REFUND', label: '🔄 Reembolsos' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setRecoveryFilter(f.id as any)}
                  className={recoveryFilter === f.id ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              Total recuperável:{' '}
              <strong style={{ color: 'var(--accent-green)' }}>
                R$ {(recoveryItems.reduce((acc, c) => acc + Number(c.amountCents), 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 16px' }}>CLIENTE</th>
                  <th style={{ padding: '12px 16px' }}>PRODUTO</th>
                  <th style={{ padding: '12px 16px' }}>VALOR</th>
                  <th style={{ padding: '12px 16px' }}>TIPO</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
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
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{item.productName}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--accent-amber)' }}>
                      R$ {(Number(item.amountCents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                      <button
                        type="button"
                        onClick={() => {
                          const firstName = item.customerName.split(' ')[0] || item.customerName;
                          const formattedValue = (Number(item.amountCents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          let text = '';
                          if (item.type === 'ABANDONED_CART') {
                            text = `Olá ${firstName}, vi que você deixou o ${item.productName} no carrinho. Posso te ajudar a concluir sua inscrição?`;
                          } else if (item.type === 'PENDING_PIX_BOLETO') {
                            text = `Olá ${firstName}, vi que seu pedido do ${item.productName} de R$ ${formattedValue} gerou um PIX/boleto pendente. Posso te enviar a chave ou tirar dúvidas?`;
                          } else if (item.type === 'PAYMENT_REFUSED') {
                            text = `Olá ${firstName}, notamos que o pagamento do ${item.productName} não foi aprovado. Gostaria de tentar outro método ou PIX parcelado?`;
                          } else {
                            text = `Olá ${firstName}, vi seu contato referente ao ${item.productName}. Como posso te ajudar hoje?`;
                          }

                          onOpenChat?.({
                            name: item.customerName,
                            phone: item.customerPhone,
                            prefillText: text,
                            returnTo: { crmSubTab: 'recovery' },
                          });
                        }}
                        disabled={!item.customerPhone}
                        title={!item.customerPhone ? 'Lead sem WhatsApp cadastrado' : undefined}
                        className="btn btn-secondary"
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          color: item.customerPhone ? '#10B981' : 'var(--text-dim)',
                          borderColor: item.customerPhone ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)',
                          cursor: item.customerPhone ? 'pointer' : 'not-allowed',
                          opacity: item.customerPhone ? 1 : 0.6,
                        }}
                      >
                        <MessageCircle size={13} />
                        Abordar no chat
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
      {/* SUB-TAB 5: AUTOMAÇÕES & RÉGUAS DE DISPARO */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* SUB-TAB 5: AUTOMAÇÕES & RÉGUAS DE DISPARO */}
      {/* ======================================================== */}
      {currentTab === 'automations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header & KPI Summary Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Réguas Configuradas
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                {automationsList.filter((a) => a.isActive).length}{' '}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                  / {automationsList.length} Ativas
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-green)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={12} /> Motor Anti-Ban Ativo
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total de Disparos
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                {automationsList.reduce((acc, a) => acc + (a.sentCount || 0), 0).toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Mensagens enviadas via SendGate
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Recuperações Concluídas
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: '4px' }}>
                {automationsList.reduce((acc, a) => acc + (a.convertedCount || 0), 0).toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Clientes recuperados após régua
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Taxa Média de Conversão
              </div>
              {(() => {
                const totalSent = automationsList.reduce((acc, a) => acc + (a.sentCount || 0), 0);
                const totalConv = automationsList.reduce((acc, a) => acc + (a.convertedCount || 0), 0);
                const rate = totalSent > 0 ? ((totalConv / totalSent) * 100).toFixed(1) : '0.0';
                return (
                  <>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#A78BFA', marginTop: '4px' }}>
                      {rate}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-green)', marginTop: '4px' }}>
                      +R$ {(totalConv * 997).toLocaleString('pt-BR')} recuperados
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* WhatsApp Status Alert & Birthday Check */}
          <div
            className="glass-panel"
            style={{
              padding: '14px 20px',
              border: isWhatsAppConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: isWhatsAppConnected ? 'var(--accent-green)' : 'var(--accent-rose)',
                  boxShadow: isWhatsAppConnected ? '0 0 10px #10B981' : '0 0 10px #EF4444',
                }}
              />
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
                  {isWhatsAppConnected ? 'Motor de Disparos Conectado' : 'Atenção: Nenhum Chip Conectado'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '8px' }}>
                  {isWhatsAppConnected
                    ? `Instância ativa: ${connectedChip?.name || clientName || 'Oficial'} (${connectedChip?.phone || '+55 11 99999-0001'}) · Anti-Ban SendGate ativo`
                    : 'Acesse o menu WhatsApp para conectar uma instância via QR Code.'}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckBirthdays}
              disabled={isCheckingBirthday}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '6px 12px' }}
            >
              <Gift size={14} color="var(--accent-cyan)" />
              {isCheckingBirthday ? 'Verificando...' : 'Testar Checagem de Aniversariantes de Hoje'}
            </button>
          </div>

          {/* Birthday Check Results */}
          {birthdayResult && (
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Gift size={16} /> Resultado da Verificação de Aniversariantes ({birthdayResult.total} encontrados hoje)
              </div>
              {birthdayResult.birthdayLeads.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {birthdayResult.birthdayLeads.map((bl: any) => (
                    <div key={bl.id} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                      <span>🎉 <strong>{bl.name}</strong> ({bl.phone})</span>
                      <span style={{ color: 'var(--text-dim)' }}>Nascimento: {bl.birthDate}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Nenhum lead faz aniversário na data de hoje ({new Date().toLocaleDateString('pt-BR')}).
                </div>
              )}
            </div>
          )}

          {/* Automations Comprehensive Table */}
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Lista de Automações & Réguas de Disparo
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
                  Clique em qualquer automação para visualizar métricas detalhadas, editar o template e ver a <strong>prévia da mensagem com formatação do WhatsApp</strong>.
                </p>
              </div>
              <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                {automationsList.length} Réguas
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Automação</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Gatilho</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Criação</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Delay</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Disparos / Conv.</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Taxa Conv.</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {automationsList.map((auto) => {
                    const triggerMeta = getTriggerMeta(auto.triggerType);
                    const TriggerIcon = triggerMeta.icon;
                    const convRate = auto.sentCount > 0 ? ((auto.convertedCount / auto.sentCount) * 100).toFixed(1) : '0.0';

                    return (
                      <tr
                        key={auto.id}
                        onClick={() => handleOpenAutomationDetail(auto)}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(6, 182, 212, 0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Title & Description */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: triggerMeta.bg,
                                border: `1px solid ${triggerMeta.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: triggerMeta.badgeColor,
                                flexShrink: 0,
                              }}
                            >
                              <TriggerIcon size={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
                                {auto.title}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', maxWidth: '340px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {auto.description || triggerMeta.desc}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Trigger Badge */}
                        <td style={{ padding: '14px 14px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: triggerMeta.bg,
                              color: triggerMeta.badgeColor,
                              border: `1px solid ${triggerMeta.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <TriggerIcon size={12} />
                            {triggerMeta.label}
                          </span>
                        </td>

                        {/* Creation Date */}
                        <td style={{ padding: '14px 14px', color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={13} color="var(--text-dim)" />
                            {formatAutomationDate(auto.createdAt)}
                          </div>
                        </td>

                        {/* Delay */}
                        <td style={{ padding: '14px 14px', whiteSpace: 'nowrap' }}>
                          <span
                            className="badge badge-gray"
                            style={{ fontSize: '0.72rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Clock size={11} />
                            {auto.delayMinutes === 0 ? 'Imediato' : `${auto.delayMinutes} min`}
                          </span>
                        </td>

                        {/* Sent / Converted */}
                        <td style={{ padding: '14px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                            {auto.sentCount} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>envios</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                            {auto.convertedCount} convertidos
                          </div>
                        </td>

                        {/* Conversion Rate */}
                        <td style={{ padding: '14px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ fontWeight: 800, color: '#A78BFA', fontSize: '0.85rem' }}>
                              {convRate}%
                            </div>
                            <TrendingUp size={12} color="#A78BFA" />
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td style={{ padding: '14px 14px', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAutomation(auto.id, auto.isActive);
                            }}
                            className={auto.isActive ? 'btn btn-primary' : 'btn btn-secondary'}
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.72rem',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontWeight: 700,
                            }}
                          >
                            {auto.isActive ? '🟢 Ativa' : '⚪ Pausada'}
                          </button>
                        </td>

                        {/* Action Details Button */}
                        <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAutomationDetail(auto);
                            }}
                            className="btn btn-secondary"
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.72rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <Eye size={13} color="var(--accent-cyan)" />
                            Prévia & Config
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ======================================================== */}
          {/* DETALHES DA AUTOMAÇÃO COM PRÉVIA FORMATADA DO WHATSAPP */}
          {/* ======================================================== */}
          {selectedAutomation && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.82)',
                backdropFilter: 'blur(10px)',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
              }}
              onClick={() => setSelectedAutomation(null)}
            >
              <div
                className="glass-panel"
                style={{
                  width: '100%',
                  maxWidth: '1060px',
                  maxHeight: '92vh',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
                  overflow: 'hidden',
                  background: '#0D1322',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Top Bar */}
                <div
                  style={{
                    padding: '16px 22px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {(() => {
                      const tMeta = getTriggerMeta(selectedAutomation.triggerType);
                      const Icon = tMeta.icon;
                      return (
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: tMeta.bg,
                            border: `1px solid ${tMeta.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: tMeta.badgeColor,
                          }}
                        >
                          <Icon size={18} />
                        </div>
                      );
                    })()}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                          {selectedAutomation.title}
                        </h3>
                        <span
                          className={`badge ${editIsActive ? 'badge-green' : 'badge-gray'}`}
                          style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                        >
                          {editIsActive ? '● Ativa no Motor' : '○ Pausada'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        Criada em {formatAutomationDate(selectedAutomation.createdAt)} · ID: {selectedAutomation.id}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedAutomation(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'var(--text-muted)',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Fechar"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Content: 2 Columns (Editor vs WhatsApp Live Preview) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.1fr 0.9fr',
                    gap: '24px',
                    padding: '24px',
                    overflowY: 'auto',
                    flex: 1,
                  }}
                >
                  {/* Left Column: Rules & Editor */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Performance Metrics Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Enviados</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                          {selectedAutomation.sentCount}
                        </div>
                      </div>
                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '12px' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--accent-green)', textTransform: 'uppercase' }}>Convertidos</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: '2px' }}>
                          {selectedAutomation.convertedCount}
                        </div>
                      </div>
                      <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '10px', padding: '12px' }}>
                        <div style={{ fontSize: '0.68rem', color: '#A78BFA', textTransform: 'uppercase' }}>Taxa Conversão</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#A78BFA', marginTop: '2px' }}>
                          {selectedAutomation.sentCount > 0
                            ? ((selectedAutomation.convertedCount / selectedAutomation.sentCount) * 100).toFixed(1)
                            : '0.0'}%
                        </div>
                      </div>
                    </div>

                    {/* Trigger Event Info */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                        Gatilho do Evento
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(() => {
                          const tMeta = getTriggerMeta(selectedAutomation.triggerType);
                          return (
                            <>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: tMeta.bg,
                                  color: tMeta.badgeColor,
                                  border: `1px solid ${tMeta.border}`,
                                }}
                              >
                                {tMeta.label}
                              </span>
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                {tMeta.desc}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Delay & Status Setting */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                          Delay de Disparo (Minutos)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editDelay}
                          onChange={(e) => setEditDelay(parseInt(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            padding: '9px 12px',
                            color: '#fff',
                            fontSize: '0.85rem',
                          }}
                        />
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                          0 = disparo imediato após o evento
                        </span>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                          Status da Régua
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditIsActive(!editIsActive)}
                          className={editIsActive ? 'btn btn-primary' : 'btn btn-secondary'}
                          style={{
                            width: '100%',
                            padding: '9px 14px',
                            fontSize: '0.82rem',
                            borderRadius: '8px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          {editIsActive ? '🟢 Régua Ativa no Motor' : '⚪ Régua Pausada'}
                        </button>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                          Pausada impede qualquer envio automático
                        </span>
                      </div>
                    </div>

                    {/* Template Editor */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                          Template da Mensagem WhatsApp
                        </label>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {editTemplate.length} caracteres
                        </span>
                      </div>

                      {/* Clickable Variable Tags */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        {[
                          { tag: '{primeiro_nome}', label: '+ {primeiro_nome}' },
                          { tag: '{produto}', label: '+ {produto}' },
                          { tag: '{valor}', label: '+ {valor}' },
                          { tag: '{link}', label: '+ {link}' },
                        ].map((v) => (
                          <button
                            key={v.tag}
                            type="button"
                            onClick={() => setEditTemplate((prev) => prev + ` ${v.tag}`)}
                            style={{
                              background: 'rgba(6, 182, 212, 0.12)',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              color: 'var(--accent-cyan)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={6}
                        value={editTemplate}
                        onChange={(e) => setEditTemplate(e.target.value)}
                        placeholder="Escreva a mensagem que o lead receberá..."
                        style={{
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          color: '#fff',
                          fontSize: '0.82rem',
                          lineHeight: '1.45',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                        }}
                      />

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                        💡 Formatação WhatsApp aceita: <code>*negrito*</code>, <code>_itálico_</code>, <code>~tachado~</code>. As quebras de linha são preservadas.
                      </div>
                    </div>

                    {/* Save Action Feedback */}
                    {automationSaveFeedback && (
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: 'var(--accent-green)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle size={14} /> {automationSaveFeedback}
                      </div>
                    )}

                    {/* Bottom Save Button */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
                      <button
                        onClick={handleSaveAutomationDetail}
                        disabled={isSavingAutomation}
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          padding: '10px 20px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        {isSavingAutomation ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                        {isSavingAutomation ? 'Salvando...' : 'Salvar Alterações na Régua'}
                      </button>

                      <button
                        onClick={() => setSelectedAutomation(null)}
                        className="btn btn-secondary"
                        style={{ padding: '10px 16px', fontSize: '0.85rem' }}
                      >
                        Fechar
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Realistic WhatsApp Phone Mockup Live Preview */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Smartphone size={14} color="var(--accent-green)" />
                      Prévia Formatada no WhatsApp (Tempo Real)
                    </div>

                    {/* WhatsApp Phone Mockup Card */}
                    <div
                      style={{
                        background: '#0B141A',
                        borderRadius: '14px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                        flex: 1,
                        minHeight: '440px',
                      }}
                    >
                      {/* WhatsApp Mock Header */}
                      <div
                        style={{
                          background: '#1F2C34',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clientName || 'Cliente')}`}
                            alt={clientName || 'Cliente'}
                            style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1px solid #10B981' }}
                          />
                          <div>
                            <div style={{ color: '#E9EDEF', fontSize: '0.82rem', fontWeight: 700, lineHeight: '1.2' }}>
                              {clientName || 'Atendimento Oficial'}
                            </div>
                            <div style={{ color: '#10B981', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                              online
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#8696A0' }}>
                          <Smartphone size={15} />
                          <MessageCircle size={15} />
                        </div>
                      </div>

                      {/* WhatsApp Mock Chat Area */}
                      <div
                        style={{
                          flex: 1,
                          padding: '18px 14px',
                          background: '#0B141A',
                          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                          backgroundSize: '16px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-start',
                          gap: '12px',
                          overflowY: 'auto',
                        }}
                      >
                        {/* Date Chip */}
                        <div style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              background: '#182229',
                              color: '#8696A0',
                              fontSize: '0.65rem',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontWeight: 600,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            }}
                          >
                            HOJE
                          </span>
                        </div>

                        {/* Outgoing Message Bubble (WhatsApp Green #005c4b) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                          <div
                            style={{
                              maxWidth: '85%',
                              background: '#005C4B',
                              color: '#E9EDEF',
                              borderRadius: '8px 8px 0 8px',
                              padding: '9px 12px 6px 12px',
                              fontSize: '0.82rem',
                              lineHeight: '1.45',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
                              position: 'relative',
                              wordBreak: 'break-word',
                            }}
                          >
                            {/* Formatted Text Content */}
                            <div>
                              {formatWhatsAppText(editTemplate) || (
                                <span style={{ opacity: 0.5, fontStyle: 'italic' }}>
                                  (Mensagem vazia)
                                </span>
                              )}
                            </div>

                            {/* Message Timestamp & Blue Double Check */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: '4px',
                                marginTop: '4px',
                                fontSize: '0.65rem',
                                color: '#8696A0',
                              }}
                            >
                              <span>10:42</span>
                              <CheckCheck size={14} color="#53BDEB" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp Mock Input Bar */}
                      <div
                        style={{
                          background: '#1F2C34',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <Smile size={18} color="#8696A0" />
                        <Paperclip size={18} color="#8696A0" />
                        <div
                          style={{
                            flex: 1,
                            background: '#2A3942',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            color: '#8696A0',
                            fontSize: '0.78rem',
                          }}
                        >
                          Mensagem
                        </div>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#00A884',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          <Mic size={16} />
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '10px', lineHeight: '1.4' }}>
                      ℹ️ <strong>Simulação em tempo real</strong>: As variáveis como <code>{'{primeiro_nome}'}</code> foram preenchidas com <code>Camila</code>, <code>{'{produto}'}</code> com <code>Programa Primeira Página</code> e <code>{'{valor}'}</code> com <code>R$ 997,00</code>.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 5B: EVENTOS E GATILHOS (NEGÓCIOS LOCAIS & CAPI) */}
      {/* ======================================================== */}
      {currentTab === 'conversionRules' && (
        <ConversionRulesView clientId={clientId} userRole={userRole} />
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 6: INBOX WHATSAPP (DIRETO, ZERO CLIQUES) */}
      {/* ======================================================== */}
      {currentTab === 'chat' && (
        <ClientWhatsApp
          subTab="chat"
          clientId={clientId}
          onNavigateToCrmLead={(leadId, targetSub) => onChangeSubTab?.(targetSub as any)}
        />
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 7: MENSAGENS EM MASSA (BROADCASTS) */}
      {/* ======================================================== */}
      {currentTab === 'broadcasts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
              Nova Campanha de Mensagens em Massa
            </h3>

            {/* Segmentação */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Temperatura Alvo
                </label>
                <select
                  value={broadcastTargetTemp}
                  onChange={(e) => setBroadcastTargetTemp(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="ALL">Todas as Temperaturas</option>
                  <option value="HOT">🔥 Somente Quentes (Score alto)</option>
                  <option value="WARM">⚡ Somente Mornos</option>
                  <option value="COLD">❄️ Somente Frios</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Estágio no Funil
                </label>
                <select
                  value={broadcastTargetStage}
                  onChange={(e) => setBroadcastTargetStage(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="ALL">Todos os Estágios</option>
                  <option value="LEAD">Leads (Ainda não compraram)</option>
                  <option value="BUYER">Compradores (Cross-sell)</option>
                  <option value="VIP">VIPs</option>
                </select>
              </div>
            </div>

            {/* Audience counter */}
            <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#fff' }}>
                🎯 Audiência Selecionada: <strong>{broadcastTargetLeads.length} leads qualificados</strong> (Opt-out excluídos)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                Tempo estimado de disparo seguro: ~{Math.ceil((broadcastTargetLeads.length * 30) / 60)} min
              </span>
            </div>

            {/* Message editor */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                Mensagem com Spintax Anti-Ban & Variáveis
              </label>
              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '0.85rem' }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Suporta spintax: <code>{'{Olá|Oi|Tudo bem}'}</code> e tags: <code>{'{primeiro_nome}'}</code>, <code>{'{email}'}</code>.
              </div>
            </div>

            {broadcastFeedback && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
                {broadcastFeedback}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                disabled={broadcastTargetLeads.length === 0}
                onClick={handleSendBroadcast}
                className="btn btn-primary"
                style={{ padding: '8px 22px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={15} /> Disparar para {broadcastTargetLeads.length} Leads
              </button>
            </div>
          </div>

          {/* Broadcast History */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '14px' }}>Histórico de Campanhas Anteriores</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '8px 12px' }}>DATA</th>
                  <th style={{ padding: '8px 12px' }}>CAMPANHA</th>
                  <th style={{ padding: '8px 12px' }}>SEGMENTAÇÃO</th>
                  <th style={{ padding: '8px 12px' }}>ENVIADOS</th>
                  <th style={{ padding: '8px 12px' }}>CONVERTIDOS</th>
                </tr>
              </thead>
              <tbody>
                {broadcastHistory.map((bh) => (
                  <tr key={bh.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--text-dim)' }}>{bh.date}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#fff' }}>{bh.name}</td>
                    <td style={{ padding: '10px 12px' }}><span className="badge badge-cyan">{bh.segment}</span></td>
                    <td style={{ padding: '10px 12px' }}>{bh.delivered} / {bh.audience}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--accent-green)', fontWeight: 700 }}>{bh.converted} vendas</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 8: IMPORTADOR CSV INTELIGENTE */}
      {/* ======================================================== */}
      {currentTab === 'import' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
            {[
              { num: 1, title: 'Upload CSV' },
              { num: 2, title: 'Mapeamento de Colunas' },
              { num: 3, title: 'Processando' },
              { num: 4, title: 'Concluído' },
            ].map((st) => (
              <div
                key={st.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: importStep === st.num ? 'var(--accent-cyan)' : importStep > st.num ? 'var(--accent-green)' : 'var(--text-dim)',
                  fontWeight: importStep === st.num ? 700 : 500,
                  fontSize: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: importStep === st.num ? 'var(--accent-cyan)' : importStep > st.num ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                  }}
                >
                  {importStep > st.num ? <Check size={14} /> : st.num}
                </div>
                {st.title}
              </div>
            ))}
          </div>

          {importStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Cole o conteúdo CSV bruto ou selecione as linhas exportadas da sua plataforma (Hotmart, Kiwify, Eduzz):
              </label>
              <textarea
                rows={8}
                value={csvRawText}
                onChange={(e) => setCsvRawText(e.target.value)}
                placeholder={'Nome,Email,WhatsApp,Produto,Valor,Data\nMaria Silva,maria@gmail.com,11999998888,Curso MTC,497.00,2026-09-25\nJoao Souza,joao@gmail.com,21988887777,Mentoria VIP,997.00,2026-09-24'}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  disabled={!csvRawText.trim()}
                  onClick={handleParseCsv}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                >
                  Avançar para Mapeamento →
                </button>
              </div>
            </div>
          )}

          {importStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Identificamos <strong>{parsedRows.length} linhas</strong>. Mapeie as colunas detectadas para os campos do GFB Growth OS:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                {Object.keys(columnMapping).map((key) => (
                  <div key={key}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', textTransform: 'capitalize' }}>
                      Campo {key}
                    </label>
                    <select
                      value={(columnMapping as any)[key]}
                      onChange={(e) => setColumnMapping({ ...columnMapping, [key]: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        color: '#fff',
                        fontSize: '0.8rem',
                      }}
                    >
                      {Object.keys(parsedRows[0] || {}).map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button onClick={() => setImportStep(1)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                  ← Voltar
                </button>
                <button onClick={handleExecuteImport} className="btn btn-primary" style={{ padding: '8px 24px', fontSize: '0.85rem' }}>
                  Iniciar Importação Segura
                </button>
              </div>
            </div>
          )}

          {importStep === 3 && (
            <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div className="spinning" style={{ width: '32px', height: '32px', border: '3px solid rgba(6,182,212,0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%' }} />
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>Cruzando Identity Graph e Processando Leads...</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Normalizando telefones E.164, calculando RFM e disparando eventos.</div>
            </div>
          )}

          {importStep === 4 && (
            <div style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
                <Check size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Importação Concluída com Sucesso!</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Foram processados <strong>{importSuccessResult?.importedLeads || 0} leads</strong> e vinculados com sucesso à base do cliente.
              </p>
              <button
                onClick={() => {
                  setImportStep(1);
                  setCsvRawText('');
                  onChangeSubTab?.('leads');
                }}
                className="btn btn-primary"
                style={{ padding: '8px 24px', fontSize: '0.85rem' }}
              >
                Ver Leads Atualizados no CRM →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 9: ASSINATURAS & RECORRÊNCIA */}
      {/* ======================================================== */}
      {currentTab === 'subscriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Subscriptions Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>MRR (Recorrência Mensal)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                R$ {subMetrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Base ativa com faturamento regular
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Assinantes Ativos</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {subMetrics.totalActive}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Alunos com acesso vigente
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Renovações em 7 Dias</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {subMetrics.renewalDueCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Oportunidades de contato proativo
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Expiradas / Canceladas</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171' }}>
                {subMetrics.expiredCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Alvos de recuperação de churn
              </div>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 16px' }}>CLIENTE</th>
                  <th style={{ padding: '12px 16px' }}>PLANO / PRODUTO</th>
                  <th style={{ padding: '12px 16px' }}>VALOR</th>
                  <th style={{ padding: '12px 16px' }}>TÉRMINO DO PERÍODO</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionsList.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{sub.customerName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{sub.customerPhone}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{sub.planName}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--accent-green)' }}>
                      R$ {(Number(sub.amountCents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {sub.currentPeriodEnd}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {sub.status === 'ACTIVE' && <span className="badge badge-green">🟢 Ativa</span>}
                      {sub.status === 'RENEWAL_DUE' && <span className="badge badge-amber">⚡ Renovação Próxima</span>}
                      {sub.status === 'EXPIRED' && <span className="badge badge-rose">🔴 Vencida</span>}
                      {sub.status === 'CANCELED' && <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>Cancelada</span>}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const firstName = sub.customerName.split(' ')[0];
                          const msg = `Olá ${firstName}, seu acesso ao ${sub.planName} vence em breve (${sub.currentPeriodEnd}). Deseja renovar com desconto de continuidade?`;
                          onOpenChat?.({
                            leadId: sub.leadId,
                            name: sub.customerName,
                            phone: sub.customerPhone,
                            prefillText: msg,
                            returnTo: { crmSubTab: 'subscriptions' },
                          });
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.72rem', color: 'var(--accent-cyan)' }}
                      >
                        <MessageCircle size={13} /> Abordar Renovação
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
      {/* SUB-TAB 10: NOTIFICAÇÕES & PENDÊNCIAS */}
      {/* ======================================================== */}
      {currentTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'ALL', label: 'Todas as Notificações' },
                { id: 'UNREAD', label: 'Não Lidas' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setNotifFilter(f.id as any)}
                  className={notifFilter === f.id ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notificationsList
              .filter((n) => (notifFilter === 'UNREAD' ? !n.isRead : true))
              .map((n) => (
                <div
                  key={n.id}
                  className="glass-panel"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: `3px solid ${n.severity === 'CRITICAL' ? 'var(--accent-rose)' : n.severity === 'WARNING' ? 'var(--accent-amber)' : 'var(--accent-cyan)'}`,
                    background: n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Bell size={18} color={n.severity === 'WARNING' ? 'var(--accent-amber)' : 'var(--accent-cyan)'} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {n.title}
                        {!n.isRead && <span className="badge badge-rose" style={{ fontSize: '0.62rem' }}>Nova</span>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>{n.message}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {new Date(n.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkNotificationRead(n.id)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                      >
                        Marcar como Lida
                      </button>
                    )}
                  </div>
                </div>
              ))}
            {notificationsList.length === 0 && (
              <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                Nenhuma notificação operacional pendente.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 11: CONFIGURAÇÕES DO CRM */}
      {/* ======================================================== */}
      {currentTab === 'settings' && crmSettings && (
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {settingsFeedback && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem' }}>
              {settingsFeedback}
            </div>
          )}

          {/* Section 1: RFM Weights */}
          <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              1. Pesos da Pontuação RFM (Recência, Frequência e Valor)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Peso da Recência (%)
                </label>
                <input
                  type="number"
                  value={crmSettings.rfmWeights.recency}
                  onChange={(e) => setCrmSettings({ ...crmSettings, rfmWeights: { ...crmSettings.rfmWeights, recency: parseInt(e.target.value) || 0 } })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Peso da Frequência (%)
                </label>
                <input
                  type="number"
                  value={crmSettings.rfmWeights.frequency}
                  onChange={(e) => setCrmSettings({ ...crmSettings, rfmWeights: { ...crmSettings.rfmWeights, frequency: parseInt(e.target.value) || 0 } })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Peso do Valor Monetário (%)
                </label>
                <input
                  type="number"
                  value={crmSettings.rfmWeights.monetary}
                  onChange={(e) => setCrmSettings({ ...crmSettings, rfmWeights: { ...crmSettings.rfmWeights, monetary: parseInt(e.target.value) || 0 } })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Temperature Days */}
          <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              2. Critérios de Temperatura da Base (Dias sem Interação)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Limite Morno (dias)
                </label>
                <input
                  type="number"
                  value={crmSettings.temperatureDays.warmDays}
                  onChange={(e) => setCrmSettings({ ...crmSettings, temperatureDays: { ...crmSettings.temperatureDays, warmDays: parseInt(e.target.value) || 0 } })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Limite Frio (dias)
                </label>
                <input
                  type="number"
                  value={crmSettings.temperatureDays.coldDays}
                  onChange={(e) => setCrmSettings({ ...crmSettings, temperatureDays: { ...crmSettings.temperatureDays, coldDays: parseInt(e.target.value) || 0 } })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Limite Inativo (dias)
                </label>
                <input
                  type="number"
                  value={crmSettings.temperatureDays.inactiveDays}
                  onChange={(e) => setCrmSettings({ ...crmSettings, temperatureDays: { ...crmSettings.temperatureDays, inactiveDays: parseInt(e.target.value) || 0 } })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Webhook Endpoints */}
          <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
              3. Webhooks de Pagamento & Plataformas Externas
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { name: 'Kiwify Webhook', key: 'kiwify', url: crmSettings.webhookEndpoints.kiwify },
                { name: 'Hotmart Webhook', key: 'hotmart', url: crmSettings.webhookEndpoints.hotmart },
                { name: 'Eduzz Webhook', key: 'eduzz', url: crmSettings.webhookEndpoints.eduzz },
              ].map((wh) => (
                <div key={wh.key} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#fff' }}>{wh.name}</div>
                    <code style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{wh.url}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(wh.url, wh.key)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedKey === wh.key ? <Check size={13} /> : <Copy size={13} />}
                    {copiedKey === wh.key ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 24px', fontSize: '0.85rem' }}>
              Salvar Todas as Configurações
            </button>
          </div>
        </form>
      )}

      {/* Drawer: Ficha 360° do Lead (Identity Graph) */}
      {selectedLead && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 100,
          }}
          onClick={handleCloseLeadProfile}
        >
          <div
            style={{
              width: '540px',
              maxWidth: '95vw',
              height: '100%',
              background: '#0B101D',
              borderLeft: '1px solid var(--border-highlight)',
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                    <ShieldCheck size={12} /> IDENTITY GRAPH UNIFICADO
                  </span>
                  <span className={`badge ${selectedLead.temperature === 'HOT' ? 'badge-rose' : selectedLead.temperature === 'WARM' ? 'badge-amber' : 'badge-cyan'}`}>
                    {selectedLead.temperature === 'HOT' ? '🔥 Quente' : selectedLead.temperature === 'WARM' ? '⚡ Morno' : '❄️ Frio'}
                  </span>
                  <span className="badge badge-purple">{selectedLead.stage}</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{selectedLead.name}</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{selectedLead.email}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingLead(selectedLead);
                    setIsLeadModalOpen(true);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                >
                  <Edit3 size={13} /> Editar
                </button>
                <button
                  onClick={handleCloseLeadProfile}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Lead Stats Card */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>RFM Score</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-green)' }}>{selectedLead.rfmPoints} pts</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Total Gasto</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                  R$ {(Number(selectedLead.totalSpentCents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Compras</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{selectedLead.purchaseCount} un</div>
              </div>
            </div>

            {/* Additional Info: Phone, CPF, BirthDate, Address */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Telefone / WhatsApp:</span>{' '}
                <strong style={{ color: 'var(--accent-cyan)' }}>{selectedLead.phone}</strong>
              </div>
              {selectedLead.cpf && (
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>CPF:</span> <span>{selectedLead.cpf}</span>
                </div>
              )}
              {selectedLead.birthDate && (
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Data de Nascimento:</span> <span>{selectedLead.birthDate}</span>
                </div>
              )}
              {selectedLead.address?.city && (
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Localização:</span>{' '}
                  <span>
                    {selectedLead.address.city} - {selectedLead.address.state || 'UF'}
                    {selectedLead.address.street && ` (${selectedLead.address.street}, ${selectedLead.address.number || 'S/N'})`}
                  </span>
                </div>
              )}
              {selectedLead.tags && selectedLead.tags.length > 0 && (
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Tags:</span>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                    {selectedLead.tags.map((t) => (
                      <span key={t} className="badge badge-green">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bloco 1: Rastreamento de Origem */}
            <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '14px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={15} /> Rastreamento de Origem do Lead
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    background: (selectedLead as any).ctwaClid
                      ? 'rgba(34, 197, 94, 0.2)'
                      : (selectedLead as any).fbc
                      ? 'rgba(56, 189, 248, 0.2)'
                      : 'rgba(148, 163, 184, 0.2)',
                    color: (selectedLead as any).ctwaClid
                      ? '#4ade80'
                      : (selectedLead as any).fbc
                      ? '#38bdf8'
                      : '#94a3b8',
                  }}
                >
                  {(selectedLead as any).originType || ((selectedLead as any).ctwaClid ? 'CLICK_TO_WHATSAPP' : 'UNTRACKED')}
                </span>
              </div>

              {(selectedLead as any).ctwaClid && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', color: '#cbd5e1' }}>
                  <div><strong>CTWA Click ID:</strong> <code style={{ color: '#a5f3fc' }}>{(selectedLead as any).ctwaClid}</code></div>
                  {(selectedLead as any).adId && <div><strong>ID do Anúncio:</strong> {(selectedLead as any).adId}</div>}
                  {(selectedLead as any).adTitle && <div><strong>Título:</strong> {(selectedLead as any).adTitle}</div>}
                  {(selectedLead as any).adBody && <div><strong>Corpo:</strong> {(selectedLead as any).adBody}</div>}
                </div>
              )}

              {(selectedLead as any).fbc && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', color: '#cbd5e1' }}>
                  <div><strong>Meta Click ID (_fbc):</strong> <code style={{ color: '#a5f3fc' }}>{(selectedLead as any).fbc}</code></div>
                  {(selectedLead as any).fbp && <div><strong>Meta Browser ID (_fbp):</strong> {(selectedLead as any).fbp}</div>}
                  {(selectedLead as any).clickTrackingCode && <div><strong>Código de Match:</strong> {(selectedLead as any).clickTrackingCode}</div>}
                </div>
              )}

              {!(selectedLead as any).ctwaClid && !(selectedLead as any).fbc && (
                <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                  Origem: <strong>Sem identificador</strong> (contato direto sem link rastreado).
                </div>
              )}
            </div>

            {/* Bloco 2: Eventos de Conversão CAPI */}
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '14px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={15} color="#eab308" /> Eventos de Conversão Disparados (Meta CAPI)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px' }}>
                  <div>
                    <strong style={{ color: '#38bdf8' }}>LeadSubmitted</strong>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Disparado na 1ª mensagem recebida</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 700 }}>ENTREGUE (Business Messaging)</span>
                </div>
                {selectedLead.purchaseCount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px' }}>
                    <div>
                      <strong style={{ color: '#34d399' }}>Purchase</strong>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Venda confirmada no WhatsApp</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 700 }}>ENTREGUE (CAPI)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Identity Graph Timeline */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} /> Linha do Tempo & Atribuição de Conversão
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {leadProfileData?.events?.length > 0 ? (
                  leadProfileData.events.map((event: any) => (
                    <div
                      key={event.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderLeft: '3px solid var(--accent-cyan)',
                        borderRadius: '0 8px 8px 0',
                        padding: '10px 14px',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#fff' }}>{event.title}</span>
                        <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>{event.type}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>{event.description}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                        {new Date(event.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                    {isProfileLoading ? 'Carregando eventos do Identity Graph...' : 'Sem eventos registrados ainda para este contato.'}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={!selectedLead.phone}
                title={!selectedLead.phone ? 'Lead sem WhatsApp cadastrado' : undefined}
                onClick={() => {
                  if (!selectedLead.phone) return;
                  onOpenChat?.({
                    leadId: selectedLead.id,
                    name: selectedLead.name,
                    phone: selectedLead.phone,
                    returnTo: { crmSubTab: currentTab, leadId: selectedLead.id },
                  });
                }}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  opacity: !selectedLead.phone ? 0.5 : 1,
                  cursor: !selectedLead.phone ? 'not-allowed' : 'pointer',
                }}
              >
                <MessageCircle size={15} /> Conversar no chat
              </button>

              <button
                onClick={() => handleRunSimulation('PURCHASE')}
                className="btn btn-secondary"
                title="Simular nova compra deste lead"
                style={{ fontSize: '0.75rem', padding: '0 12px' }}
              >
                ⚡ Testar Compra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Modals */}
      <LeadFormModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSave={handleSaveLead}
        lead={editingLead}
        clientId={clientId}
      />

      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSave={handleSaveSale}
        clientId={clientId}
      />
    </div>
  );
}
