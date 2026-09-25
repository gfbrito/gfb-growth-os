import React, { useState } from 'react';
import { AlertTriangle, X, QrCode } from 'lucide-react';

interface AlertBannerProps {
  onResolve?: () => void;
}

export function AlertBanner({ onResolve }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #D97706 0%, #B45309 100%)',
        color: '#FFFFFF',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.85rem',
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
        zIndex: 60,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertTriangle size={18} className="animate-bounce" />
        <span>
          <strong>Atenção:</strong> 1 chip desconectado da esteira de aquecimento — resolver: <code>+55 64 9218-0233</code>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onResolve}
          style={{
            background: '#FEF3C7',
            color: '#92400E',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 12px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <QrCode size={13} />
          Ver Chips & Reconectar
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
          }}
          title="Fechar aviso temporariamente"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
