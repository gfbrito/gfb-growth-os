import React, { useState } from 'react';
import type { Launch } from '../launchTypes';
import { enqueueGroups } from '../launchApi';
import { X, Plus, Sparkles, Layers } from 'lucide-react';

interface CreateGroupsModalProps {
  launch: Launch;
  currentGroupCount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateGroupsModal({
  launch,
  currentGroupCount,
  isOpen,
  onClose,
  onSuccess,
}: CreateGroupsModalProps) {
  const [count, setCount] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await enqueueGroups(launch.id, count);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar grupos');
    } finally {
      setLoading(false);
    }
  };

  const previewNames = Array.from({ length: count }).map((_, idx) => {
    const num = currentGroupCount + idx + 1;
    return (launch.groupNamePattern || '{nome} - Grupo {n}')
      .replace('{nome}', launch.name)
      .replace('{n}', String(num));
  });

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }}>
      <div className="modal-card" style={{ maxWidth: '520px', width: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--accent-green)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Criar Grupos em Lote</h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>
              Quantidade de Grupos a Criar
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 3, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCount(num)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    background: count === num ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: count === num ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                    color: count === num ? 'var(--accent-green)' : '#fff',
                    fontWeight: count === num ? 750 : 500,
                    cursor: 'pointer',
                  }}
                >
                  +{num}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={30}
              className="input-field"
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
              style={{ marginTop: '8px' }}
            />
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
              <Sparkles size={14} /> Prévia dos nomes que serão gerados:
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {previewNames.slice(0, 4).map((name, i) => (
                <li key={i}>{name}</li>
              ))}
              {previewNames.length > 4 && <li>... e mais {previewNames.length - 4} grupos</li>}
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> {loading ? 'Criando...' : `Criar ${count} Grupo(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
