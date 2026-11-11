import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, MapPin, Tag, Plus, Check } from 'lucide-react';
import type { Lead } from '../types/crm';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: Partial<Lead>) => Promise<void>;
  lead?: Lead | null;
  clientId?: string;
}

export function LeadFormModal({ isOpen, onClose, onSave, lead, clientId = '' }: LeadFormModalProps) {
  const isEditing = Boolean(lead);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [secondaryEmails, setSecondaryEmails] = useState<string[]>([]);
  const [secEmailInput, setSecEmailInput] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [temperature, setTemperature] = useState<'HOT' | 'WARM' | 'COLD' | 'INACTIVE'>('WARM');
  const [stage, setStage] = useState<'LEAD' | 'BUYER' | 'RECURRING' | 'VIP'>('LEAD');
  const [origin, setOrigin] = useState<'ORGANIC' | 'ADS' | 'INDICATION' | 'IMPORT' | 'MANUAL'>('MANUAL');
  const [whatsappOptOut, setWhatsappOptOut] = useState(false);

  // Address
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Custom Fields
  const [instagram, setInstagram] = useState('');
  const [nicho, setNicho] = useState('');
  const [faturamento, setFaturamento] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setName(lead.name || '');
      setEmail(lead.email || '');
      setSecondaryEmails(lead.secondaryEmails || []);
      setPhone(lead.phone || '');
      setCpf(lead.cpf || '');
      setBirthDate(lead.birthDate || '');
      setTemperature(lead.temperature || 'WARM');
      setStage(lead.stage || 'LEAD');
      setOrigin(lead.origin || 'MANUAL');
      setWhatsappOptOut(Boolean(lead.whatsappOptOut));

      setStreet(lead.address?.street || '');
      setNumber(lead.address?.number || '');
      setComplement(lead.address?.complement || '');
      setNeighborhood(lead.address?.neighborhood || '');
      setCity(lead.address?.city || '');
      setState(lead.address?.state || '');
      setZipCode(lead.address?.zipCode || '');

      setTags(lead.tags || []);
      setInstagram(String(lead.customFields?.instagram || ''));
      setNicho(String(lead.customFields?.nicho || ''));
      setFaturamento(String(lead.customFields?.faturamento || ''));
    } else {
      setName('');
      setEmail('');
      setSecondaryEmails([]);
      setPhone('');
      setCpf('');
      setBirthDate('');
      setTemperature('WARM');
      setStage('LEAD');
      setOrigin('MANUAL');
      setWhatsappOptOut(false);

      setStreet('');
      setNumber('');
      setComplement('');
      setNeighborhood('');
      setCity('');
      setState('');
      setZipCode('');

      setTags([]);
      setInstagram('');
      setNicho('');
      setFaturamento('');
    }
    setErrorMessage(null);
  }, [lead, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleAddSecondaryEmail = () => {
    if (!secEmailInput.trim()) return;
    if (!secondaryEmails.includes(secEmailInput.trim())) {
      setSecondaryEmails([...secondaryEmails, secEmailInput.trim()]);
    }
    setSecEmailInput('');
  };

  const handleRemoveSecondaryEmail = (em: string) => {
    setSecondaryEmails(secondaryEmails.filter((item) => item !== em));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Por favor, preencha os campos obrigatórios (Nome, E-mail e Telefone).');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const payload: Partial<Lead> = {
      clientId,
      name: name.trim(),
      email: email.trim(),
      secondaryEmails,
      phone: phone.trim(),
      cpf: cpf.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
      temperature,
      stage,
      origin,
      whatsappOptOut,
      tags,
      address: {
        street: street.trim() || undefined,
        number: number.trim() || undefined,
        complement: complement.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim().toUpperCase() || undefined,
        zipCode: zipCode.trim() || undefined,
      },
      customFields: {
        instagram: instagram.trim(),
        nicho: nicho.trim(),
        faturamento: faturamento.trim(),
      },
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar lead.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.95)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              {isEditing ? 'Editar Lead' : 'Novo Lead do CRM'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isEditing ? `Atualizando informações de ${lead?.name}` : 'Cadastre um novo contato na esteira de qualificação e vendas'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Section 1: Dados Principais */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} /> Dados Principais
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Dra. Camila Ribeiro"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  E-mail Principal *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="camila@exemplo.com"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  WhatsApp E.164 *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+55 11 98765-4321"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  CPF
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Data de Nascimento (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Origem do Contato
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value as any)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="MANUAL">Manual / Balcão</option>
                  <option value="ADS">Anúncios (Meta / Google)</option>
                  <option value="ORGANIC">Orgânico (Instagram / YouTube)</option>
                  <option value="INDICATION">Indicação</option>
                  <option value="IMPORT">Importação CSV</option>
                </select>
              </div>
            </div>

            {/* E-mails Secundários */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                E-mails Secundários
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="email"
                  value={secEmailInput}
                  onChange={(e) => setSecEmailInput(e.target.value)}
                  placeholder="Adicionar e-mail alternativo..."
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSecondaryEmail}
                  className="btn btn-secondary"
                  style={{ padding: '0 12px', fontSize: '0.75rem' }}
                >
                  <Plus size={14} /> Adicionar
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {secondaryEmails.map((em) => (
                  <span
                    key={em}
                    className="badge badge-cyan"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
                  >
                    {em}
                    <button
                      type="button"
                      onClick={() => handleRemoveSecondaryEmail(em)}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Temperatura & Qualificação */}
          <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '12px' }}>
              🔥 Temperatura & Estágio no Funil
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Temperatura
                </label>
                <select
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value as any)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="HOT">🔥 Quente</option>
                  <option value="WARM">⚡ Morno</option>
                  <option value="COLD">❄️ Frio</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Estágio
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="LEAD">Lead</option>
                  <option value="BUYER">Comprador</option>
                  <option value="RECURRING">Recorrente</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                <input
                  type="checkbox"
                  id="optout"
                  checked={whatsappOptOut}
                  onChange={(e) => setWhatsappOptOut(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-rose)' }}
                />
                <label htmlFor="optout" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Solicitou Opt-out do WhatsApp (Não enviar disparos)
                </label>
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginTop: '14px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                Tags de Segmentação
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Digite uma tag e pressione Adicionar..."
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn btn-secondary"
                  style={{ padding: '0 12px', fontSize: '0.75rem' }}
                >
                  <Plus size={14} /> Tag
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {tags.map((t) => (
                  <span
                    key={t}
                    className="badge badge-green"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Endereço */}
          <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} /> Endereço Completo
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  CEP
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="00000-000"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Logradouro / Rua
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Av. Paulista"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Número
                </label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="1000"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Complemento
                </label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto 42"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Bairro
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bela Vista"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Cidade
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="São Paulo"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  UF (Estado 2 Letras)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="SP"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Campos Customizados */}
          <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '12px' }}>
              ⚙️ Campos Customizados
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Instagram (@)
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@perfil"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Especialidade / Nicho
                </label>
                <input
                  type="text"
                  value={nicho}
                  onChange={(e) => setNicho(e.target.value)}
                  placeholder="Ex: Acupuntura Estética"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Faturamento Estimado
                </label>
                <input
                  type="text"
                  value={faturamento}
                  onChange={(e) => setFaturamento(e.target.value)}
                  placeholder="Ex: R$ 10k - 20k/mês"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
              style={{ padding: '8px 24px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Check size={16} />
              {isSaving ? 'Salvando...' : isEditing ? 'Atualizar Lead' : 'Cadastrar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
