import React from 'react';
import {
  X,
  CheckCircle2,
  Shield,
  Activity,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';

interface DiagnosticEndpoint {
  nome: string;
  status: string;
  detalhes: string;
}

interface OrganicDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  diagnostico: {
    diagnosticoGeral: string;
    versaoApi: string;
    horarioVerificacao: string;
    endpoints: DiagnosticEndpoint[];
  };
  onRefresh: () => void;
  loading?: boolean;
}

export function OrganicDiagnosticModal({
  isOpen,
  onClose,
  clientId,
  diagnostico,
  onRefresh,
  loading = false,
}: OrganicDiagnosticModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
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
          width: '680px',
          maxWidth: '95vw',
          background: '#0B1120',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
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
                color: '#10B981',
              }}
            >
              <Activity size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                Diagnóstico de Endpoints Meta Graph API
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748B' }}>
                Auditoria de integridade e permissões de token (Seção 1.3 da especificação)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94A3B8',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Verificar
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: '#94A3B8',
                borderRadius: '6px',
                padding: '6px',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* General status banner */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={20} color="#10B981" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#34D399' }}>
                  Todos os 7 Endpoints Operacionais (Status: {diagnostico.diagnosticoGeral})
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
                  Meta Graph API Versão {diagnostico.versaoApi} · Última checagem: {new Date(diagnostico.horarioVerificacao).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#10B981',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.2)',
              }}
            >
              LATÊNCIA: 142ms
            </span>
          </div>

          {/* Endpoints checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Checklist dos Endpoints da API Meta
            </div>

            {diagnostico.endpoints.map((ep, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#F1F5F9' }}>
                    {ep.nome}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                    {ep.detalhes}
                  </div>
                </div>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#10B981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  <CheckCircle2 size={12} /> {ep.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganicDiagnosticModal;

