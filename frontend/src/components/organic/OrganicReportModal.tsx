import React from 'react';
import {
  X,
  Printer,
  Sparkles,
  Trophy,
  CheckCircle2,
  Calendar,
  Layers,
  Users,
  Radio,
  Eye,
  Heart,
} from 'lucide-react';
import type { OrganicKpisState, OrganicPost } from './organic.types';

interface OrganicReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfil: string;
  clientName: string;
  mes: string;
  kpis: OrganicKpisState;
  topPosts: OrganicPost[];
  temaCampeao: string;
  semanasComMetaCumprida: string;
}

export function OrganicReportModal({
  isOpen,
  onClose,
  perfil,
  clientName,
  mes,
  kpis,
  topPosts,
  temaCampeao,
  semanasComMetaCumprida,
}: OrganicReportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '840px',
          maxWidth: '95vw',
          maxHeight: '92vh',
          background: '#0B1120',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Actions Bar (hidden when printing) */}
        <div
          className="no-print"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
              BOLETIM EXECUTIVO MENSAL
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{mes}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: '#10B981',
                color: '#fff',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Printer size={14} /> Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: '#94A3B8',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          id="boletim-imprimivel"
          style={{
            padding: '36px 40px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            color: '#F1F5F9',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid rgba(255, 255, 255, 0.1)', paddingBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: '#10B981', fontWeight: 800 }}>
                GFB DIGITAL · RELATÓRIO EXECUTIVO DE REDES SOCIAIS
              </div>
              <h1 style={{ margin: '6px 0 2px', fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
                Boletim Mensal Orgânico · {clientName}
              </h1>
              <div style={{ fontSize: '0.88rem', color: '#94A3B8' }}>
                Instagram: <strong style={{ color: '#38BDF8' }}>@{perfil}</strong> · Período de Análise: <strong>{mes}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Emissão Oficial</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0' }}>
                {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          {/* KPI Summary 4-Col */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              1. Indicadores Principais de Performance
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Alcance Total</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                  {kpis.alcance.valor ? kpis.alcance.valor.toLocaleString('pt-BR') : '–'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#10B981' }}>+{kpis.alcance.variacaoPct ?? 0}% vs anterior</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Visualizações</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#8B5CF6' }}>
                  {kpis.views.valor ? kpis.views.valor.toLocaleString('pt-BR') : '–'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#10B981' }}>+{kpis.views.variacaoPct ?? 0}% vs anterior</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Saldo de Seguidores</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10B981' }}>
                  +{kpis.seguidores.saldo}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{(kpis.seguidores?.total ?? 0).toLocaleString('pt-BR')} totais</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Taxa Mediana Engaj.</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38BDF8' }}>
                  {kpis.taxaEngajamento.valor}%
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Benchmark do nicho</div>
              </div>
            </div>
          </div>

          {/* Highlights & Top Content */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              2. Top 3 Publicações Campeãs do Mês
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topPosts.slice(0, 3).map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#F59E0B' }}>#{idx + 1}</span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                      {p.mediaProductType}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#E2E8F0', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.legenda}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.76rem' }}>
                    <span>Alcance: <strong style={{ color: '#fff' }}>{p.reach?.toLocaleString('pt-BR')}</strong></span>
                    <span>Taxa: <strong style={{ color: '#10B981' }}>{p.taxaEngajamento}%</strong></span>
                    <span>Salvos: <strong style={{ color: '#38BDF8' }}>{p.saved}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Takeaways */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', padding: '16px 20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#34D399', marginBottom: '6px' }}>
              3. Conclusão & Próximos Passos
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#CBD5E1', lineHeight: 1.6 }}>
              <li>
                <strong>Tema Campeão:</strong> {temaCampeao}. Manter 50% da grade com este direcionamento editorial.
              </li>
              <li>
                <strong>Constância Editorial:</strong> {semanasComMetaCumprida}. Cumprimento de metas acima de 75%.
              </li>
              <li>
                <strong>Validação para Tráfego:</strong> O post #1 atingiu o Percentil 75 e já foi encaminhado para a equipe de mídia paga impulsionar como Dark Post.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganicReportModal;

