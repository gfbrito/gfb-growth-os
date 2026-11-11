import React, { useState, useEffect } from 'react';
import type { Launch } from '../launchTypes';
import { createLaunch, fetchConnectedInstances } from '../launchApi';
import { X, Rocket, Sparkles, Plus } from 'lucide-react';

interface LaunchCreateModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLaunch: Launch) => void;
}

export function LaunchCreateModal({
  clientId,
  isOpen,
  onClose,
  onSuccess,
}: LaunchCreateModalProps) {
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [instanceKey, setInstanceKey] = useState<string>('');
  const [instances, setInstances] = useState<any[]>([]);
  const [memberLimit, setMemberLimit] = useState<number>(1000);
  const [fillOrder, setFillOrder] = useState<'PROPORTIONAL' | 'SEQUENTIAL'>('PROPORTIONAL');
  const [autoCreateEnabled, setAutoCreateEnabled] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchConnectedInstances().then((instList) => {
        setInstances(instList);
        if (instList.length > 0 && !instanceKey) {
          setInstanceKey(instList[0].instanceKey);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    const generated = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const created = await createLaunch({
        name,
        slug: slug || undefined,
        description: description || undefined,
        clientId,
        instanceKey: instanceKey || 'aqc_bruna_01',
        memberLimitPerGroup: memberLimit,
        fillOrder,
        autoCreateEnabled,
        status: 'ACTIVE',
      });
      onSuccess(created);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar lançamento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }}>
      <div className="modal-card" style={{ maxWidth: '580px', width: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Rocket size={20} color="var(--accent-green)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Criar Novo Lançamento</h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
              Nome do Lançamento
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: Turma Novembro - Mestres do Tráfego"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
              Slug do Link Inteligente (/l/:slug)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="turma-novembro"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              required
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '2px', display: 'block' }}>
              Link de entrada: http://localhost:3000/l/{slug || 'slug-do-link'}
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
                  {i.name} ({i.phone || i.instanceKey})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                Limite por Grupo
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
                Preenchimento
              </label>
              <select
                className="input-field"
                value={fillOrder}
                onChange={(e) => setFillOrder(e.target.value as any)}
              >
                <option value="PROPORTIONAL">Proporcional</option>
                <option value="SEQUENTIAL">Sequencial</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
              Descrição / Objetivos (Opcional)
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Descreva o propósito da captação deste lançamento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> {submitting ? 'Criando...' : 'Criar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
