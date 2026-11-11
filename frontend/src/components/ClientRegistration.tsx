import React, { useState, useCallback, useEffect } from 'react';
import {
  Building2,
  User,
  FileText,
  Link2,
  Target,
  ChevronRight,
  ChevronLeft,
  Save,
  Plus,
  Phone,
  Mail,
  MapPin,
  Globe,
  Calendar,
  CreditCard,
  TrendingUp,
  Shield,
  CheckCircle2,
  Check,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

function InstagramIcon({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// ===========================
// Types
// ===========================
interface ClientFormData {
  // Tab 1: Dados cadastrais
  name: string;
  tradeName: string;
  documentType: 'CPF' | 'CNPJ';
  document: string;
  contactName: string;
  contactRole: string;
  whatsapp: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  segment: string;
  website: string;
  instagramHandle: string;
  businessType: string;
  status: string;
  managerId: string;
  origin: string;
  relationshipStartDate: string;

  // Tab 2: Contrato e financeiro
  contractTotalCents: number;
  billingType: string;
  billingDueDay: number;
  paymentMethod: string;
  billingEmail: string;
  billingNotes: string;
  contractStartDate: string;
  contractEndDate: string;
  contractDurationMonths: number | '';
  autoRenew: boolean;
  adjustmentIndex: string;
  adjustmentDate: string;
  contractSignatureStatus: string;
  cancellationReason: string;
  adBudgetCents: number;
  adBudgetPayer: string;

  // Tab 3: Integrations (meta token)
  metaToken: string;
  metaTokenValid: boolean;
  metaBusinessId?: string;
  metaPageId?: string;
  metaPageName?: string;
  metaIgAccountId?: string;
  selectedAdAccountIds: string[];
  selectedAdAccounts: Array<{
    id: string;
    accountId: string;
    name: string;
    currency?: string;
    accountStatus?: number;
  }>;
  selectedInstagramIds: string[];
  selectedInstagramAccounts: Array<{
    id: string;
    username: string;
    name?: string;
    pageName?: string;
    profilePictureUrl?: string;
  }>;

  // Tab 4: Metas
  mainObjective: string;
  monthlyLeadsGoal: number | '';
  targetCplCents: number | '';
  targetRoas: number | '';
  monthlyRevenueGoalCents: number;
  ltvCents: number | '';
  reportFrequency: string;
  reportChannel: string;
  internalNotes: string;
}

const DEFAULT_FORM: ClientFormData = {
  name: '',
  tradeName: '',
  documentType: 'CPF',
  document: '',
  contactName: '',
  contactRole: '',
  whatsapp: '',
  email: '',
  phone: '',
  addressStreet: '',
  addressNumber: '',
  addressComplement: '',
  addressNeighborhood: '',
  addressCity: '',
  addressState: '',
  addressZip: '',
  segment: '',
  website: '',
  instagramHandle: '',
  businessType: 'INFOPRODUTOR',
  status: 'ONBOARDING',
  managerId: '',
  origin: '',
  relationshipStartDate: '',
  contractTotalCents: 0,
  billingType: 'MENSAL',
  billingDueDay: 10,
  paymentMethod: 'PIX',
  billingEmail: '',
  billingNotes: '',
  contractStartDate: '',
  contractEndDate: '',
  contractDurationMonths: '',
  autoRenew: true,
  adjustmentIndex: '',
  adjustmentDate: '',
  contractSignatureStatus: 'RASCUNHO',
  cancellationReason: '',
  adBudgetCents: 0,
  adBudgetPayer: 'CLIENTE',
  metaToken: '',
  metaTokenValid: false,
  metaBusinessId: '',
  metaPageId: '',
  metaPageName: '',
  metaIgAccountId: '',
  selectedAdAccountIds: [],
  selectedAdAccounts: [],
  selectedInstagramIds: [],
  selectedInstagramAccounts: [],
  mainObjective: '',
  monthlyLeadsGoal: '',
  targetCplCents: '',
  targetRoas: '',
  monthlyRevenueGoalCents: 0,
  ltvCents: '',
  reportFrequency: 'MENSAL',
  reportChannel: 'WHATSAPP',
  internalNotes: '',
};

type TabId = 'dados' | 'contrato' | 'integracoes' | 'metas';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const TABS: TabDef[] = [
  { id: 'dados', label: 'Dados', icon: <User size={16} />, description: 'Informações cadastrais do cliente' },
  { id: 'contrato', label: 'Contrato', icon: <FileText size={16} />, description: 'Financeiro e termos contratuais' },
  { id: 'integracoes', label: 'Integrações', icon: <Link2 size={16} />, description: 'Conexões com Meta e plataformas' },
  { id: 'metas', label: 'Metas', icon: <Target size={16} />, description: 'Objetivos e acompanhamento' },
];

const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

// ===========================
// Helpers
// ===========================
function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseCurrencyInput(value: string): number {
  const clean = value.replace(/[^\d,]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

function formatCpfCnpj(value: string, type: 'CPF' | 'CNPJ'): string {
  const digits = value.replace(/\D/g, '');
  if (type === 'CPF') {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    .substring(0, 18);
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 14);
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15);
}

function formatCep(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
}

// ===========================
// Styled Components
// ===========================
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#0B0F19',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '8px',
  color: '#F8FAFC',
  fontSize: '0.88rem',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  outline: 'none',
};

const inputFocusStyle: React.CSSProperties = {
  borderColor: '#10B981',
  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.15)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: '#94A3B8',
  marginBottom: '6px',
  letterSpacing: '0.01em',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748B' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
  backgroundPosition: 'right 10px center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '18px 18px',
  paddingRight: '36px',
};

// ===========================
// Field Components
// ===========================
function Field({
  label,
  required,
  children,
  hint,
  span,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  span?: number;
}) {
  return (
    <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: '#F43F5E', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {hint && (
        <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '4px' }}>{hint}</div>
      )}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  disabled,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {icon && (
        <div
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#475569',
            pointerEvents: 'none',
          }}
        >
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle,
          ...(focused ? inputFocusStyle : {}),
          ...(icon ? { paddingLeft: '38px' } : {}),
          ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
        }}
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...selectStyle,
        ...(focused ? inputFocusStyle : {}),
        ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle,
        ...(focused ? inputFocusStyle : {}),
        resize: 'vertical' as const,
        minHeight: `${rows * 24 + 20}px`,
      }}
    />
  );
}

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 0',
        color: '#F8FAFC',
        fontSize: '0.85rem',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '22px',
          borderRadius: '11px',
          background: value ? '#10B981' : '#1E293B',
          border: `1px solid ${value ? '#10B981' : 'rgba(255,255,255,0.15)'}`,
          position: 'relative',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: '2px',
            left: value ? '20px' : '2px',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </div>
      <span style={{ fontWeight: 500 }}>{label}</span>
    </button>
  );
}

function CurrencyInput({
  value,
  onChange,
  placeholder,
}: {
  value: number;
  onChange: (cents: number) => void;
  placeholder?: string;
}) {
  const [displayVal, setDisplayVal] = useState(value > 0 ? (value / 100).toFixed(2).replace('.', ',') : '');
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#475569',
          fontSize: '0.85rem',
          fontWeight: 600,
          pointerEvents: 'none',
        }}
      >
        R$
      </div>
      <input
        type="text"
        value={displayVal}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d,]/g, '');
          setDisplayVal(raw);
          onChange(parseCurrencyInput(raw));
        }}
        placeholder={placeholder || '0,00'}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (value > 0) {
            setDisplayVal((value / 100).toFixed(2).replace('.', ','));
          }
        }}
        style={{
          ...inputStyle,
          paddingLeft: '42px',
          ...(focused ? inputFocusStyle : {}),
        }}
      />
    </div>
  );
}

// ===========================
// Section Component
// ===========================
function Section({
  title,
  icon,
  children,
  description,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10B981',
          }}
        >
          {icon}
        </div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
          {title}
        </h3>
      </div>
      {description && (
        <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 16px 38px' }}>
          {description}
        </p>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
          marginLeft: '38px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ===========================
// Tab Content Components
// ===========================
function TabDados({
  form,
  setForm,
}: {
  form: ClientFormData;
  setForm: React.Dispatch<React.SetStateAction<ClientFormData>>;
}) {
  const updateField = useCallback(
    <K extends keyof ClientFormData>(key: K, value: ClientFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [setForm]
  );

  return (
    <>
      <Section title="Identificação" icon={<Building2 size={14} />} description="Dados fundamentais para cadastro e emissão de NF">
        <Field label="Nome / Razão Social" required>
          <TextInput
            value={form.name}
            onChange={(v) => updateField('name', v)}
            placeholder="Ex: GFB Digital Marketing Ltda"
            icon={<Building2 size={15} />}
          />
        </Field>
        <Field label="Nome Fantasia">
          <TextInput
            value={form.tradeName}
            onChange={(v) => updateField('tradeName', v)}
            placeholder="Ex: GFB Digital"
          />
        </Field>
        <Field label="Tipo de Documento">
          <SelectInput
            value={form.documentType}
            onChange={(v) => updateField('documentType', v as 'CPF' | 'CNPJ')}
            options={[
              { value: 'CPF', label: 'CPF — Pessoa Física' },
              { value: 'CNPJ', label: 'CNPJ — Pessoa Jurídica' },
            ]}
          />
        </Field>
        <Field label={form.documentType === 'CPF' ? 'CPF' : 'CNPJ'}>
          <TextInput
            value={form.document}
            onChange={(v) => updateField('document', formatCpfCnpj(v, form.documentType))}
            placeholder={form.documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
            maxLength={form.documentType === 'CPF' ? 14 : 18}
          />
        </Field>
      </Section>

      <Section title="Contato" icon={<Phone size={14} />} description="Responsável e canais de comunicação">
        <Field label="Responsável / Contato">
          <TextInput
            value={form.contactName}
            onChange={(v) => updateField('contactName', v)}
            placeholder="Nome do responsável"
            icon={<User size={15} />}
          />
        </Field>
        <Field label="Cargo">
          <TextInput
            value={form.contactRole}
            onChange={(v) => updateField('contactRole', v)}
            placeholder="Ex: Sócio, CEO, Marketing"
          />
        </Field>
        <Field label="WhatsApp" required>
          <TextInput
            value={form.whatsapp}
            onChange={(v) => updateField('whatsapp', formatPhone(v))}
            placeholder="(00) 00000-0000"
            icon={<Phone size={15} />}
          />
        </Field>
        <Field label="E-mail">
          <TextInput
            value={form.email}
            onChange={(v) => updateField('email', v)}
            placeholder="contato@empresa.com"
            type="email"
            icon={<Mail size={15} />}
          />
        </Field>
        <Field label="Telefone fixo">
          <TextInput
            value={form.phone}
            onChange={(v) => updateField('phone', formatPhone(v))}
            placeholder="(00) 0000-0000"
          />
        </Field>
      </Section>

      <Section title="Endereço" icon={<MapPin size={14} />} description="Usado para NF e contrato">
        <Field label="CEP">
          <TextInput
            value={form.addressZip}
            onChange={(v) => updateField('addressZip', formatCep(v))}
            placeholder="00000-000"
          />
        </Field>
        <Field label="Rua / Logradouro" span={2}>
          <TextInput
            value={form.addressStreet}
            onChange={(v) => updateField('addressStreet', v)}
            placeholder="Av. Paulista"
          />
        </Field>
        <Field label="Número">
          <TextInput
            value={form.addressNumber}
            onChange={(v) => updateField('addressNumber', v)}
            placeholder="1000"
          />
        </Field>
        <Field label="Complemento">
          <TextInput
            value={form.addressComplement}
            onChange={(v) => updateField('addressComplement', v)}
            placeholder="Sala 301"
          />
        </Field>
        <Field label="Bairro">
          <TextInput
            value={form.addressNeighborhood}
            onChange={(v) => updateField('addressNeighborhood', v)}
            placeholder="Bela Vista"
          />
        </Field>
        <Field label="Cidade">
          <TextInput
            value={form.addressCity}
            onChange={(v) => updateField('addressCity', v)}
            placeholder="São Paulo"
          />
        </Field>
        <Field label="Estado">
          <SelectInput
            value={form.addressState}
            onChange={(v) => updateField('addressState', v)}
            options={[
              { value: '', label: 'Selecione...' },
              ...STATES.map((s) => ({ value: s, label: s })),
            ]}
          />
        </Field>
      </Section>

      <Section title="Perfil do cliente" icon={<Globe size={14} />} description="Segmento, presença online e classificação">
        <Field label="Segmento / Nicho">
          <TextInput
            value={form.segment}
            onChange={(v) => updateField('segment', v)}
            placeholder="Ex: Saúde, Educação, Varejo"
          />
        </Field>
        <Field label="Tipo de negócio">
          <SelectInput
            value={form.businessType}
            onChange={(v) => updateField('businessType', v)}
            options={[
              { value: 'INFOPRODUTOR', label: 'Infoprodutor' },
              { value: 'NEGOCIO_LOCAL', label: 'Negócio Local' },
              { value: 'ECOMMERCE', label: 'E-commerce' },
              { value: 'SAAS', label: 'SaaS' },
              { value: 'SERVICOS', label: 'Serviços' },
              { value: 'OUTRO', label: 'Outro' },
            ]}
          />
        </Field>
        <Field label="Site">
          <TextInput
            value={form.website}
            onChange={(v) => updateField('website', v)}
            placeholder="https://seusite.com.br"
            icon={<Globe size={15} />}
          />
        </Field>
        <Field label="Instagram">
          <TextInput
            value={form.instagramHandle}
            onChange={(v) => updateField('instagramHandle', v)}
            placeholder="@perfil"
            icon={<InstagramIcon size={15} />}
          />
        </Field>
        <Field label="Status">
          <SelectInput
            value={form.status}
            onChange={(v) => updateField('status', v)}
            options={[
              { value: 'ONBOARDING', label: 'Em onboarding' },
              { value: 'ATIVO', label: 'Ativo' },
              { value: 'PAUSADO', label: 'Pausado' },
              { value: 'CANCELADO', label: 'Cancelado' },
            ]}
          />
        </Field>
        <Field label="Origem do cliente">
          <SelectInput
            value={form.origin}
            onChange={(v) => updateField('origin', v)}
            options={[
              { value: '', label: 'Selecione...' },
              { value: 'INDICACAO', label: 'Indicação' },
              { value: 'TRAFEGO', label: 'Tráfego pago' },
              { value: 'ORGANICO', label: 'Orgânico' },
              { value: 'PROSPECCAO', label: 'Prospecção ativa' },
              { value: 'PARCEIRO', label: 'Parceiro' },
              { value: 'OUTRO', label: 'Outro' },
            ]}
          />
        </Field>
        <Field label="Data de início do relacionamento">
          <TextInput
            value={form.relationshipStartDate}
            onChange={(v) => updateField('relationshipStartDate', v)}
            type="date"
            icon={<Calendar size={15} />}
          />
        </Field>
      </Section>
    </>
  );
}

function TabContrato({
  form,
  setForm,
}: {
  form: ClientFormData;
  setForm: React.Dispatch<React.SetStateAction<ClientFormData>>;
}) {
  const updateField = useCallback(
    <K extends keyof ClientFormData>(key: K, value: ClientFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [setForm]
  );

  return (
    <>
      <Section title="Valores e cobrança" icon={<CreditCard size={14} />} description="Configurações financeiras do contrato">
        <Field label="Valor total do contrato">
          <CurrencyInput
            value={form.contractTotalCents}
            onChange={(v) => updateField('contractTotalCents', v)}
            placeholder="0,00"
          />
        </Field>
        <Field label="Tipo de cobrança">
          <SelectInput
            value={form.billingType}
            onChange={(v) => updateField('billingType', v)}
            options={[
              { value: 'MENSAL', label: 'Mensal fixo' },
              { value: 'UNICO', label: 'Pagamento único' },
              { value: 'RECORRENTE_VARIAVEL', label: 'Recorrente + variável' },
            ]}
          />
        </Field>
        <Field label="Dia de vencimento" hint="Dia do mês para emissão de cobrança">
          <TextInput
            value={String(form.billingDueDay)}
            onChange={(v) => {
              const n = parseInt(v, 10);
              if (!isNaN(n) && n >= 1 && n <= 31) updateField('billingDueDay', n);
              else if (v === '') updateField('billingDueDay', 1);
            }}
            type="number"
          />
        </Field>
        <Field label="Forma de pagamento">
          <SelectInput
            value={form.paymentMethod}
            onChange={(v) => updateField('paymentMethod', v)}
            options={[
              { value: 'PIX', label: 'PIX' },
              { value: 'BOLETO', label: 'Boleto bancário' },
              { value: 'CARTAO', label: 'Cartão de crédito' },
              { value: 'TRANSFERENCIA', label: 'Transferência bancária' },
            ]}
          />
        </Field>
        <Field label="E-mail de faturamento">
          <TextInput
            value={form.billingEmail}
            onChange={(v) => updateField('billingEmail', v)}
            placeholder="financeiro@empresa.com"
            icon={<Mail size={15} />}
            type="email"
          />
        </Field>
        <Field label="Observações de faturamento" span={2}>
          <TextArea
            value={form.billingNotes}
            onChange={(v) => updateField('billingNotes', v)}
            placeholder="Dados bancários, chave PIX, observações..."
            rows={2}
          />
        </Field>
      </Section>

      <Section title="Prazo e renovação" icon={<Calendar size={14} />} description="Datas do contrato e política de reajuste">
        <Field label="Início do contrato">
          <TextInput
            value={form.contractStartDate}
            onChange={(v) => updateField('contractStartDate', v)}
            type="date"
            icon={<Calendar size={15} />}
          />
        </Field>
        <Field label="Fim do contrato">
          <TextInput
            value={form.contractEndDate}
            onChange={(v) => updateField('contractEndDate', v)}
            type="date"
            icon={<Calendar size={15} />}
          />
        </Field>
        <Field label="Duração (meses)">
          <TextInput
            value={form.contractDurationMonths === '' ? '' : String(form.contractDurationMonths)}
            onChange={(v) => {
              if (v === '') updateField('contractDurationMonths', '');
              else {
                const n = parseInt(v, 10);
                if (!isNaN(n)) updateField('contractDurationMonths', n);
              }
            }}
            type="number"
            placeholder="12"
          />
        </Field>
        <Field label="Renovação automática">
          <Toggle
            value={form.autoRenew}
            onChange={(v) => updateField('autoRenew', v)}
            label={form.autoRenew ? 'Sim, renovar automaticamente' : 'Não renova automaticamente'}
          />
        </Field>
        <Field label="Índice de reajuste">
          <SelectInput
            value={form.adjustmentIndex}
            onChange={(v) => updateField('adjustmentIndex', v)}
            options={[
              { value: '', label: 'Sem reajuste' },
              { value: 'IGPM', label: 'IGP-M' },
              { value: 'IPCA', label: 'IPCA' },
              { value: 'INPC', label: 'INPC' },
              { value: 'FIXO', label: 'Percentual fixo' },
            ]}
          />
        </Field>
        <Field label="Data de reajuste">
          <TextInput
            value={form.adjustmentDate}
            onChange={(v) => updateField('adjustmentDate', v)}
            type="date"
          />
        </Field>
        <Field label="Status da assinatura">
          <SelectInput
            value={form.contractSignatureStatus}
            onChange={(v) => updateField('contractSignatureStatus', v)}
            options={[
              { value: 'RASCUNHO', label: 'Rascunho' },
              { value: 'ENVIADO', label: 'Enviado para assinatura' },
              { value: 'ASSINADO', label: 'Assinado' },
              { value: 'CANCELADO', label: 'Cancelado' },
            ]}
          />
        </Field>
      </Section>

      <Section title="Verba de anúncio" icon={<TrendingUp size={14} />} description="Investimento mensal em mídia paga">
        <Field label="Verba mensal de anúncios">
          <CurrencyInput
            value={form.adBudgetCents}
            onChange={(v) => updateField('adBudgetCents', v)}
            placeholder="0,00"
          />
        </Field>
        <Field label="Quem paga os anúncios?">
          <SelectInput
            value={form.adBudgetPayer}
            onChange={(v) => updateField('adBudgetPayer', v)}
            options={[
              { value: 'CLIENTE', label: 'Cliente paga diretamente' },
              { value: 'AGENCIA', label: 'Agência repassa' },
            ]}
          />
        </Field>
      </Section>
    </>
  );
}

function TabIntegracoes({
  form,
  setForm,
}: {
  form: ClientFormData;
  setForm: React.Dispatch<React.SetStateAction<ClientFormData>>;
}) {
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleValidateToken = async () => {
    if (!form.metaToken.trim()) return;
    setValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/clients/validate-meta-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: form.metaToken.trim() }),
      });
      const data = await res.json();
      setValidationResult(data);
      if (data.valid) {
        setForm((prev) => ({
          ...prev,
          metaTokenValid: true,
          metaBusinessId: data.businesses?.[0]?.id || prev.metaBusinessId,
        }));
      }
    } catch (err) {
      setValidationResult({ valid: false, error: 'Erro de conexão com o servidor' });
    } finally {
      setValidating(false);
    }
  };

  // Se o formulário já possui um token salvo (ex: ao editar cliente), valida automaticamente para carregar as contas
  useEffect(() => {
    if (form.metaToken && form.metaToken.trim() && !validationResult && !validating) {
      handleValidateToken();
    }
  }, [form.metaToken]);

  // Contas de anúncios disponíveis
  const adAccounts = validationResult?.adAccounts || [];

  // Contas de Instagram disponíveis (diretas ou via páginas)
  const instagramAccounts: Array<{
    id: string;
    username: string;
    name?: string;
    pageName?: string;
  }> =
    validationResult?.instagramAccounts?.length
      ? validationResult.instagramAccounts
      : (validationResult?.pages || [])
          .filter((p: any) => p.instagram_business_account?.id)
          .map((p: any) => ({
            id: p.instagram_business_account.id,
            username: p.instagram_business_account.username || p.name,
            name: p.instagram_business_account.name || p.name,
            pageName: p.name,
          }));

  const toggleAdAccount = (acc: any) => {
    const isSelected = form.selectedAdAccountIds.includes(acc.id);
    const nextIds = isSelected
      ? form.selectedAdAccountIds.filter((id) => id !== acc.id)
      : [...form.selectedAdAccountIds, acc.id];
    const nextAccounts = isSelected
      ? form.selectedAdAccounts.filter((a) => a.id !== acc.id)
      : [
          ...form.selectedAdAccounts,
          {
            id: acc.id,
            accountId: acc.accountId || acc.account_id || acc.id,
            name: acc.name,
            currency: acc.currency,
            accountStatus: acc.accountStatus || acc.account_status,
          },
        ];
    setForm((prev) => ({
      ...prev,
      selectedAdAccountIds: nextIds,
      selectedAdAccounts: nextAccounts,
    }));
  };

  const selectAllAdAccounts = () => {
    const allIds = adAccounts.map((a: any) => a.id);
    const allAccs = adAccounts.map((acc: any) => ({
      id: acc.id,
      accountId: acc.accountId || acc.account_id || acc.id,
      name: acc.name,
      currency: acc.currency,
      accountStatus: acc.accountStatus || acc.account_status,
    }));
    setForm((prev) => ({
      ...prev,
      selectedAdAccountIds: allIds,
      selectedAdAccounts: allAccs,
    }));
  };

  const deselectAllAdAccounts = () => {
    setForm((prev) => ({
      ...prev,
      selectedAdAccountIds: [],
      selectedAdAccounts: [],
    }));
  };

  const toggleInstagram = (ig: any) => {
    const isSelected = form.selectedInstagramIds.includes(ig.id);
    const nextIds = isSelected
      ? form.selectedInstagramIds.filter((id) => id !== ig.id)
      : [...form.selectedInstagramIds, ig.id];
    const nextAccounts = isSelected
      ? form.selectedInstagramAccounts.filter((a) => a.id !== ig.id)
      : [
          ...form.selectedInstagramAccounts,
          {
            id: ig.id,
            username: ig.username,
            name: ig.name,
            pageName: ig.pageName,
          },
        ];
    setForm((prev) => ({
      ...prev,
      selectedInstagramIds: nextIds,
      selectedInstagramAccounts: nextAccounts,
    }));
  };

  const selectAllInstagrams = () => {
    const allIds = instagramAccounts.map((ig: any) => ig.id);
    setForm((prev) => ({
      ...prev,
      selectedInstagramIds: allIds,
      selectedInstagramAccounts: instagramAccounts,
    }));
  };

  const deselectAllInstagrams = () => {
    setForm((prev) => ({
      ...prev,
      selectedInstagramIds: [],
      selectedInstagramAccounts: [],
    }));
  };

  return (
    <>
      <Section
        title="Token de acesso Meta"
        icon={<Shield size={14} />}
        description="Cole o token de longa duração ou do usuário do sistema da Meta para carregar contas de anúncios e perfis"
      >
        <Field
          label="Access Token"
          span={3}
          hint="O token é verificado em tempo real diretamente na Graph API da Meta"
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <TextInput
                value={form.metaToken}
                onChange={(v) => {
                  setForm((prev) => ({ ...prev, metaToken: v }));
                  setValidationResult(null);
                }}
                placeholder="EAAxxxxxxxxxxxxxxx..."
                icon={<Shield size={15} />}
              />
            </div>
            <button
              type="button"
              onClick={handleValidateToken}
              disabled={validating || !form.metaToken.trim()}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: form.metaToken.trim() ? '#10B981' : '#1E293B',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: form.metaToken.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: validating ? 0.7 : 1,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {validating ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Consultando Meta...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  {validationResult?.valid ? 'Atualizar Ativos' : 'Validar Token'}
                </>
              )}
            </button>
          </div>
        </Field>
      </Section>

      {/* Validation results / Asset selector */}
      {validationResult && (
        <div style={{ marginLeft: '38px', marginBottom: '24px' }}>
          {validationResult.valid ? (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.04)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              {/* Header Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '16px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={18} color="#10B981" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#10B981', fontSize: '0.95rem' }}>
                      Token Meta Conectado com Sucesso
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                      {validationResult.user?.name ? `Usuário: ${validationResult.user.name} · ` : ''}
                      Marque abaixo as contas e perfis que devem ser atribuídos a este cliente.
                    </div>
                  </div>
                </div>

                {validationResult.businesses?.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      background: 'rgba(14, 165, 233, 0.1)',
                      border: '1px solid rgba(14, 165, 233, 0.2)',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: '#0EA5E9',
                    }}
                  >
                    <Building2 size={13} />
                    <span>BM: {validationResult.businesses[0].name}</span>
                  </div>
                )}
              </div>

              {/* 1. SELEÇÃO DE CONTAS DE ANÚNCIO */}
              <div style={{ marginBottom: '28px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} color="#10B981" />
                    <span style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.92rem' }}>
                      1. Contas de Anúncios do Cliente
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background:
                          form.selectedAdAccountIds.length > 0
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(255, 255, 255, 0.08)',
                        color: form.selectedAdAccountIds.length > 0 ? '#10B981' : '#94A3B8',
                      }}
                    >
                      {form.selectedAdAccountIds.length} selecionada
                      {form.selectedAdAccountIds.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {adAccounts.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={selectAllAdAccounts}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#0EA5E9',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '2px 6px',
                        }}
                      >
                        Marcar todas
                      </button>
                      <span style={{ color: '#475569', fontSize: '0.75rem' }}>·</span>
                      <button
                        type="button"
                        onClick={deselectAllAdAccounts}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94A3B8',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '2px 6px',
                        }}
                      >
                        Desmarcar todas
                      </button>
                    </div>
                  )}
                </div>

                {adAccounts.length === 0 ? (
                  <div
                    style={{
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      color: '#94A3B8',
                      fontSize: '0.82rem',
                    }}
                  >
                    Nenhuma conta de anúncios encontrada vinculada a este token.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {adAccounts.map((acc: any) => {
                      const isSelected = form.selectedAdAccountIds.includes(acc.id);
                      return (
                        <div
                          key={acc.id}
                          onClick={() => toggleAdAccount(acc)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            background: isSelected
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected
                              ? '1px solid rgba(16, 185, 129, 0.45)'
                              : '1px solid rgba(255, 255, 255, 0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '5px',
                                border: isSelected ? '2px solid #10B981' : '2px solid #475569',
                                background: isSelected ? '#10B981' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s',
                                flexShrink: 0,
                              }}
                            >
                              {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: isSelected ? '#FFFFFF' : '#E2E8F0',
                                  fontSize: '0.88rem',
                                }}
                              >
                                {acc.name}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.74rem',
                                  color: '#94A3B8',
                                  marginTop: '2px',
                                  display: 'flex',
                                  gap: '8px',
                                }}
                              >
                                <span>ID: {acc.accountId || acc.account_id || acc.id}</span>
                                <span>·</span>
                                <span>Moeda: {acc.currency || 'BRL'}</span>
                                {acc.accountStatus === 1 && (
                                  <>
                                    <span>·</span>
                                    <span style={{ color: '#10B981' }}>Ativa</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: '12px',
                              background: isSelected
                                ? 'rgba(16, 185, 129, 0.25)'
                                : 'rgba(255, 255, 255, 0.05)',
                              color: isSelected ? '#10B981' : '#64748B',
                              transition: 'all 0.15s',
                            }}
                          >
                            {isSelected ? '✓ Marcada' : 'Marcar'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. SELEÇÃO DE CONTAS DE INSTAGRAM */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <InstagramIcon size={16} color="#E879F9" />
                    <span style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.92rem' }}>
                      2. Perfis do Instagram do Cliente
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background:
                          form.selectedInstagramIds.length > 0
                            ? 'rgba(232, 121, 249, 0.2)'
                            : 'rgba(255, 255, 255, 0.08)',
                        color: form.selectedInstagramIds.length > 0 ? '#E879F9' : '#94A3B8',
                      }}
                    >
                      {form.selectedInstagramIds.length} selecionado
                      {form.selectedInstagramIds.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {instagramAccounts.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={selectAllInstagrams}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#E879F9',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '2px 6px',
                        }}
                      >
                        Marcar todos
                      </button>
                      <span style={{ color: '#475569', fontSize: '0.75rem' }}>·</span>
                      <button
                        type="button"
                        onClick={deselectAllInstagrams}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94A3B8',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '2px 6px',
                        }}
                      >
                        Desmarcar todos
                      </button>
                    </div>
                  )}
                </div>

                {instagramAccounts.length === 0 ? (
                  <div
                    style={{
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      color: '#94A3B8',
                      fontSize: '0.82rem',
                    }}
                  >
                    Nenhum perfil de Instagram comercial encontrado vinculado a este token ou às Páginas do Facebook.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {instagramAccounts.map((ig: any) => {
                      const isSelected = form.selectedInstagramIds.includes(ig.id);
                      return (
                        <div
                          key={ig.id}
                          onClick={() => toggleInstagram(ig)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            background: isSelected
                              ? 'rgba(232, 121, 249, 0.12)'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected
                              ? '1px solid rgba(232, 121, 249, 0.45)'
                              : '1px solid rgba(255, 255, 255, 0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '5px',
                                border: isSelected ? '2px solid #E879F9' : '2px solid #475569',
                                background: isSelected ? '#E879F9' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s',
                                flexShrink: 0,
                              }}
                            >
                              {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  background: 'rgba(232, 121, 249, 0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <InstagramIcon size={18} color="#E879F9" />
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: isSelected ? '#FFFFFF' : '#E2E8F0',
                                    fontSize: '0.88rem',
                                  }}
                                >
                                  @{ig.username}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.74rem',
                                    color: '#94A3B8',
                                    marginTop: '2px',
                                    display: 'flex',
                                    gap: '8px',
                                  }}
                                >
                                  {ig.pageName && <span>Página: {ig.pageName}</span>}
                                  <span>·</span>
                                  <span>ID: {ig.id}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: '12px',
                              background: isSelected
                                ? 'rgba(232, 121, 249, 0.25)'
                                : 'rgba(255, 255, 255, 0.05)',
                              color: isSelected ? '#E879F9' : '#64748B',
                              transition: 'all 0.15s',
                            }}
                          >
                            {isSelected ? '✓ Marcado' : 'Marcar'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                borderRadius: '10px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertCircle size={18} color="#F43F5E" />
              <div>
                <div style={{ fontWeight: 600, color: '#F43F5E', fontSize: '0.88rem' }}>
                  Token inválido
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                  {validationResult.error || 'Verifique o token e tente novamente'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginLeft: '38px',
          background: 'rgba(14, 165, 233, 0.06)',
          border: '1px solid rgba(14, 165, 233, 0.15)',
          borderRadius: '10px',
          padding: '16px 20px',
          fontSize: '0.82rem',
          color: '#94A3B8',
          lineHeight: 1.6,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: '#0EA5E9',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Shield size={14} />
          Como funciona a segurança e o vínculo dos ativos
        </div>
        <ul style={{ paddingLeft: '18px', margin: 0 }}>
          <li>As contas de anúncio marcadas serão monitoradas pelo CAPI Gateway e pelo Dashboard de Tráfego</li>
          <li>Os perfis de Instagram selecionados alimentarão o Painel de Conteúdos Orgânicos</li>
          <li>O token é armazenado criptografado no servidor com renovação automática</li>
        </ul>
      </div>
    </>
  );
}

function TabMetas({
  form,
  setForm,
}: {
  form: ClientFormData;
  setForm: React.Dispatch<React.SetStateAction<ClientFormData>>;
}) {
  const updateField = useCallback(
    <K extends keyof ClientFormData>(key: K, value: ClientFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [setForm]
  );

  return (
    <>
      <Section title="Objetivo principal" icon={<Target size={14} />} description="O que o cliente espera alcançar com a parceria">
        <Field label="Objetivo principal" span={3}>
          <TextArea
            value={form.mainObjective}
            onChange={(v) => updateField('mainObjective', v)}
            placeholder="Ex: Aumentar vendas do e-commerce em 40% no Q1, gerar 300 leads qualificados/mês..."
            rows={3}
          />
        </Field>
      </Section>

      <Section title="Metas mensais" icon={<TrendingUp size={14} />} description="Indicadores que a equipe vai acompanhar mês a mês">
        <Field label="Meta de leads/mês">
          <TextInput
            value={form.monthlyLeadsGoal === '' ? '' : String(form.monthlyLeadsGoal)}
            onChange={(v) => {
              if (v === '') updateField('monthlyLeadsGoal', '');
              else {
                const n = parseInt(v, 10);
                if (!isNaN(n)) updateField('monthlyLeadsGoal', n);
              }
            }}
            type="number"
            placeholder="200"
          />
        </Field>
        <Field label="CPL alvo">
          <CurrencyInput
            value={typeof form.targetCplCents === 'number' ? form.targetCplCents : 0}
            onChange={(v) => updateField('targetCplCents', v)}
            placeholder="0,00"
          />
        </Field>
        <Field label="ROAS alvo">
          <TextInput
            value={form.targetRoas === '' ? '' : String(form.targetRoas)}
            onChange={(v) => {
              if (v === '') updateField('targetRoas', '');
              else {
                const n = parseFloat(v);
                if (!isNaN(n)) updateField('targetRoas', n);
              }
            }}
            type="number"
            placeholder="4.5"
          />
        </Field>
        <Field label="Meta de receita/mês">
          <CurrencyInput
            value={form.monthlyRevenueGoalCents}
            onChange={(v) => updateField('monthlyRevenueGoalCents', v)}
            placeholder="0,00"
          />
        </Field>
        <Field label="LTV estimado">
          <CurrencyInput
            value={typeof form.ltvCents === 'number' ? form.ltvCents : 0}
            onChange={(v) => updateField('ltvCents', v)}
            placeholder="0,00"
          />
        </Field>
      </Section>

      <Section title="Reportes" icon={<FileText size={14} />} description="Frequência e canal de envio dos relatórios">
        <Field label="Frequência de relatório">
          <SelectInput
            value={form.reportFrequency}
            onChange={(v) => updateField('reportFrequency', v)}
            options={[
              { value: 'SEMANAL', label: 'Semanal' },
              { value: 'QUINZENAL', label: 'Quinzenal' },
              { value: 'MENSAL', label: 'Mensal' },
            ]}
          />
        </Field>
        <Field label="Canal de envio">
          <SelectInput
            value={form.reportChannel}
            onChange={(v) => updateField('reportChannel', v)}
            options={[
              { value: 'EMAIL', label: 'E-mail' },
              { value: 'WHATSAPP', label: 'WhatsApp' },
              { value: 'DASHBOARD', label: 'Dashboard' },
              { value: 'REUNIAO', label: 'Reunião presencial/online' },
            ]}
          />
        </Field>
      </Section>

      <Section title="Notas internas" icon={<FileText size={14} />} description="Anotações visíveis apenas para a equipe da agência">
        <Field label="Notas internas" span={3}>
          <TextArea
            value={form.internalNotes}
            onChange={(v) => updateField('internalNotes', v)}
            placeholder="Observações sobre o cliente, preferências, pontos de atenção..."
            rows={4}
          />
        </Field>
      </Section>
    </>
  );
}

// ===========================
// Main Component
// ===========================
interface ClientRegistrationProps {
  clientId?: string | null;
  onClientCreated?: (client: any) => void;
  onCancel?: () => void;
}

export function ClientRegistration({ clientId, onClientCreated, onCancel }: ClientRegistrationProps) {
  const isEditing = Boolean(clientId);
  const [activeTab, setActiveTab] = useState<TabId>('dados');
  const [form, setForm] = useState<ClientFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [loadingClient, setLoadingClient] = useState(Boolean(clientId));
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!clientId) {
      setForm(DEFAULT_FORM);
      setLoadingClient(false);
      return;
    }

    setLoadingClient(true);
    fetch(`/api/clients/${clientId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.client) {
          setForm((prev) => ({
            ...prev,
            ...data.client,
            selectedAdAccountIds: data.client.selectedAdAccountIds || [],
            selectedAdAccounts: data.client.selectedAdAccounts || [],
            selectedInstagramIds: data.client.selectedInstagramIds || [],
            selectedInstagramAccounts: data.client.selectedInstagramAccounts || [],
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingClient(false));
  }, [clientId]);

  const currentTabIndex = TABS.findIndex((t) => t.id === activeTab);

  const goToTab = (tab: TabId) => {
    setActiveTab(tab);
    setSaveResult(null);
  };

  const goNext = () => {
    if (currentTabIndex < TABS.length - 1) {
      goToTab(TABS[currentTabIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (currentTabIndex > 0) {
      goToTab(TABS[currentTabIndex - 1].id);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setSaveResult({ success: false, message: 'Nome do cliente é obrigatório' });
      setActiveTab('dados');
      return;
    }

    setSaving(true);
    setSaveResult(null);

    try {
      const url = isEditing ? `/api/clients/${clientId}` : '/api/clients';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSaveResult({
          success: true,
          message: data.message || (isEditing ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!'),
        });
        if (onClientCreated) {
          onClientCreated(data.client);
        }
      } else {
        setSaveResult({ success: false, message: data.error || 'Erro ao salvar cliente' });
      }
    } catch (err) {
      setSaveResult({ success: false, message: 'Erro de conexão com o servidor' });
    } finally {
      setSaving(false);
    }
  };

  // Tab completion hints
  const getTabProgress = (tabId: TabId): 'empty' | 'partial' | 'complete' => {
    switch (tabId) {
      case 'dados':
        if (!form.name) return 'empty';
        if (form.name && form.whatsapp && form.document) return 'complete';
        return 'partial';
      case 'contrato':
        if (!form.contractTotalCents && !form.contractStartDate) return 'empty';
        if (form.contractTotalCents && form.contractStartDate) return 'complete';
        return 'partial';
      case 'integracoes':
        if (!form.metaToken) return 'empty';
        return 'partial';
      case 'metas':
        if (!form.mainObjective && !form.monthlyLeadsGoal) return 'empty';
        if (form.mainObjective && form.monthlyLeadsGoal) return 'complete';
        return 'partial';
      default:
        return 'empty';
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: isEditing ? 'rgba(14, 165, 233, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: isEditing ? '1px solid rgba(14, 165, 233, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isEditing ? '#0EA5E9' : '#10B981',
              }}
            >
              {isEditing ? <Building2 size={22} /> : <Plus size={22} />}
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>
                {isEditing ? `Editar Cliente: ${form.name || '...'}` : 'Novo Cliente'}
              </h1>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '2px 0 0' }}>
                {isEditing
                  ? 'Atualize dados, contratos e selecione as contas de anúncio e Instagram vinculadas'
                  : 'Preencha os dados abaixo para cadastrar um novo cliente na agência'}
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                color: '#94A3B8',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <X size={14} />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          background: '#0B0F19',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '28px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {TABS.map((tab, idx) => {
          const isActive = tab.id === activeTab;
          const progress = getTabProgress(tab.id);

          return (
            <button
              key={tab.id}
              onClick={() => goToTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: isActive ? '#141B2C' : 'transparent',
                color: isActive ? '#F8FAFC' : '#64748B',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                position: 'relative',
              }}
            >
              {tab.icon}
              {tab.label}
              {progress === 'complete' && (
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10B981',
                    position: 'absolute',
                    top: '8px',
                    right: '10px',
                  }}
                />
              )}
              {progress === 'partial' && (
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#F59E0B',
                    position: 'absolute',
                    top: '8px',
                    right: '10px',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        style={{
          background: '#0E131F',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '28px',
          minHeight: '480px',
        }}
      >
        {/* Tab Description */}
        <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#475569' }}>
            <span style={{ color: '#10B981', fontWeight: 700 }}>
              {String(currentTabIndex + 1).padStart(2, '0')}
            </span>
            <span>/</span>
            <span>{String(TABS.length).padStart(2, '0')}</span>
            <span style={{ margin: '0 6px' }}>·</span>
            <span>{TABS[currentTabIndex].description}</span>
          </div>
        </div>

        {activeTab === 'dados' && <TabDados form={form} setForm={setForm} />}
        {activeTab === 'contrato' && <TabContrato form={form} setForm={setForm} />}
        {activeTab === 'integracoes' && <TabIntegracoes form={form} setForm={setForm} />}
        {activeTab === 'metas' && <TabMetas form={form} setForm={setForm} />}
      </div>

      {/* Save Result */}
      {saveResult && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 20px',
            borderRadius: '10px',
            background: saveResult.success
              ? 'rgba(16, 185, 129, 0.08)'
              : 'rgba(244, 63, 94, 0.08)',
            border: `1px solid ${
              saveResult.success
                ? 'rgba(16, 185, 129, 0.25)'
                : 'rgba(244, 63, 94, 0.25)'
            }`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
          }}
        >
          {saveResult.success ? (
            <CheckCircle2 size={18} color="#10B981" />
          ) : (
            <AlertCircle size={18} color="#F43F5E" />
          )}
          <span style={{ color: saveResult.success ? '#10B981' : '#F43F5E', fontWeight: 600 }}>
            {saveResult.message}
          </span>
        </div>
      )}

      {/* Bottom Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          onClick={goPrev}
          disabled={currentTabIndex === 0}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent',
            color: currentTabIndex === 0 ? '#334155' : '#94A3B8',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: currentTabIndex === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ChevronLeft size={16} />
          Anterior
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          {currentTabIndex < TABS.length - 1 ? (
            <button
              onClick={goNext}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#10B981',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 4px rgba(16, 185, 129, 0.25)',
              }}
            >
              Próximo
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 28px',
                borderRadius: '8px',
                border: 'none',
                background: saving ? '#065F46' : '#10B981',
                color: '#fff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 4px rgba(16, 185, 129, 0.25)',
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
