import React, { useState, useEffect } from 'react';
import type { Launch } from '../launchTypes';
import { updateLaunch, deleteLaunch, fetchConnectedInstances } from '../launchApi';
import {
  Settings,
  Save,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Smartphone,
  Layers,
  Bot,
  ShieldAlert,
} from 'lucide-react';

interface ConfigTabProps {
  launch: Launch;
  onLaunchUpdated: (launch: Launch) => void;
  onDeleted: () => void;
}

export function ConfigTab({ launch, onLaunchUpdated, onDeleted }: ConfigTabProps) {
  // Form state
  const [name, setName] = useState<string>(launch.name);
  const [slug, setSlug] = useState<string>(launch.slug);
  const [description, setDescription] = useState<string>(launch.description || '');
  const [logoUrl, setLogoUrl] = useState<string>(launch.logoUrl || '');
  const [instanceKey, setInstanceKey] = useState<string>(launch.instanceKey);

  const [memberLimit, setMemberLimit] = useState<number>(launch.memberLimitPerGroup);
  const [autoCreateEnabled, setAutoCreateEnabled] = useState<boolean>(launch.autoCreateEnabled);
  const [autoCreateThreshold, setAutoCreateThreshold] = useState<number>(launch.autoCreateThresholdPercent);
  const [fillOrder, setFillOrder] = useState<Launch['fillOrder']>(launch.fillOrder);
  const [groupNamePattern, setGroupNamePattern] = useState<string>(launch.groupNamePattern);
  const [groupDescription, setGroupDescription] = useState<string>(launch.groupDescription);

  const [aiEnabled, setAiEnabled] = useState<boolean>(launch.aiEnabled);
  const [aiSystemPrompt, setAiSystemPrompt] = useState<string>(launch.aiSystemPrompt || '');

  const [instances, setInstances] = useState<any[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Danger Zone delete state
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    fetchConnectedInstances().then((inst) => setInstances(inst));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await updateLaunch(launch.id, {
        name,
        slug,
        description,
        logoUrl: logoUrl || null,
        instanceKey,
        memberLimitPerGroup: memberLimit,
        autoCreateEnabled,
        autoCreateThresholdPercent: autoCreateThreshold,
        fillOrder,
        groupNamePattern,
        groupDescription,
        aiEnabled,
        aiSystemPrompt,
      });
      onLaunchUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmationText !== launch.name) {
      alert('Você deve digitar o nome exato do lançamento para confirmar');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteLaunch(launch.id, deleteConfirmationText);
      onDeleted();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir lançamento');
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Card 1: Informações Gerais */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <Settings size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Dados Básicos do Lançamento</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                Nome do Lançamento
              </label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                Slug Público (URL /l/:slug)
              </label>
              <input
                type="text"
                className="input-field"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '2px', display: 'block' }}>
                http://localhost:3000/l/{slug}
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                Instância do WhatsApp Responsável
              </label>
              <select
                className="input-field"
                value={instanceKey}
                onChange={(e) => setInstanceKey(e.target.value)}
              >
                {instances.map((i) => (
                  <option key={i.instanceKey} value={i.instanceKey}>
                    {i.name} ({i.phone || i.instanceKey}) — {i.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                URL do Logo (Opcional)
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
              Descrição Pública / Objetivos
            </label>
            <textarea
              className="input-field"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Card 2: Regras dos Grupos & Auto-Criação */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <Layers size={18} color="var(--accent-green)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Regras de Distribuição & Grupos</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                Capacidade Máxima por Grupo
              </label>
              <input
                type="number"
                min={50}
                max={1024}
                className="input-field"
                value={memberLimit}
                onChange={(e) => setMemberLimit(Number(e.target.value))}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                Ordem de Preenchimento
              </label>
              <select
                className="input-field"
                value={fillOrder}
                onChange={(e) => setFillOrder(e.target.value as any)}
              >
                <option value="PROPORTIONAL">Proporcional (Equilibra membros igualmente)</option>
                <option value="SEQUENTIAL">Sequencial (Enche grupo 1 até o limite, depois 2...)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                Padrão de Nome do Grupo
              </label>
              <input
                type="text"
                className="input-field"
                value={groupNamePattern}
                onChange={(e) => setGroupNamePattern(e.target.value)}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                Use <code>{'{nome}'}</code> e <code>{'{n}'}</code>
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#fff', cursor: 'pointer', fontWeight: 650 }}>
              <input
                type="checkbox"
                checked={autoCreateEnabled}
                onChange={(e) => setAutoCreateEnabled(e.target.checked)}
              />
              Ativar auto-criação de grupos pelo WhatsApp quando atingir ocupação crítica
            </label>

            {autoCreateEnabled && (
              <div style={{ paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Gera novo grupo automaticamente ao atingir:
                </span>
                <input
                  type="number"
                  min={50}
                  max={99}
                  className="input-field"
                  style={{ width: '80px', height: '32px' }}
                  value={autoCreateThreshold}
                  onChange={(e) => setAutoCreateThreshold(Number(e.target.value))}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>% das vagas</span>
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
              Descrição Padrão dos Grupos
            </label>
            <textarea
              className="input-field"
              rows={3}
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Card 3: IA do Lançamento */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <Bot size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Assistente de IA do Lançamento</h3>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#fff', cursor: 'pointer', fontWeight: 650 }}>
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
            />
            Ativar sugestões automáticas de IA na caixa de entrada
          </label>

          {aiEnabled && (
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                System Prompt / Persona da IA
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Ex: Você é a assistente oficial da Bruna Ortiz. Responda dúvidas sobre inscrições com cordialidade..."
                value={aiSystemPrompt}
                onChange={(e) => setAiSystemPrompt(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '0.9rem' }}
          >
            {savedSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saving ? 'Salvando...' : savedSuccess ? 'Configurações Salvas!' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      {/* Danger Zone: Exclusão com confirmação de digitação do nome exato (B6.5) */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          background: 'rgba(244, 63, 94, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} color="var(--accent-rose)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-rose)' }}>Zona de Perigo — Excluir Lançamento</h3>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Esta ação removerá permanentemente o lançamento e desvinculará todos os grupos. Os grupos reais no WhatsApp <strong>não</strong> serão apagados. Para confirmar a exclusão, digite o nome exato do lançamento abaixo:
        </p>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <code style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 700 }}>{launch.name}</code>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Digite o nome exato aqui..."
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            style={{ maxWidth: '380px' }}
          />

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteConfirmationText !== launch.name || isDeleting}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: deleteConfirmationText === launch.name ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255,255,255,0.02)',
              border: deleteConfirmationText === launch.name ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
              color: deleteConfirmationText === launch.name ? 'var(--accent-rose)' : 'var(--text-dim)',
              cursor: deleteConfirmationText === launch.name ? 'pointer' : 'not-allowed',
            }}
          >
            <Trash2 size={16} />
            {isDeleting ? 'Excluindo...' : 'Excluir Definitivamente'}
          </button>
        </div>
      </div>
    </div>
  );
}
