import React from 'react';
import { evaluateSpintax, type ComposerData } from './MessageComposer';
import { CheckCheck, Play, FileText, CheckCircle2, Circle } from 'lucide-react';

interface WhatsAppPreviewProps {
  data: ComposerData;
  senderName?: string;
  groupName?: string;
}

export function WhatsAppPreview({ data, senderName = 'GFB Digital', groupName = 'Grupo VIP' }: WhatsAppPreviewProps) {
  const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const previewText = evaluateSpintax(data.type === 'TEXT' ? data.content : data.caption || '');

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '380px',
        borderRadius: '16px',
        background: '#0c1317',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* WhatsApp Chat Header */}
      <div
        style={{
          background: '#202c33',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.85rem',
            color: '#fff',
          }}
        >
          {groupName.substring(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e9edef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {groupName}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#8696a0' }}>mensagens criptografadas</div>
        </div>
      </div>

      {/* Chat Body Wallpaper */}
      <div
        style={{
          background: '#0b141a',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '16px 16px',
          padding: '16px 12px',
          minHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: '12px',
        }}
      >
        {/* Outgoing Message Bubble */}
        <div
          style={{
            alignSelf: 'flex-end',
            maxWidth: '88%',
            background: '#005c4b',
            color: '#e9edef',
            borderRadius: '10px 0 10px 10px',
            padding: '8px 10px 6px 10px',
            position: 'relative',
            fontSize: '0.84rem',
            lineHeight: 1.4,
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          {/* Sender in group */}
          <div style={{ fontSize: '0.72rem', fontWeight: 750, color: '#53bdeb', marginBottom: '4px' }}>
            {senderName}
          </div>

          {/* Render based on type */}
          {data.type === 'IMAGE' && (
            <div style={{ marginBottom: '6px', borderRadius: '6px', overflow: 'hidden', background: '#092d25', maxHeight: '180px' }}>
              {data.mediaUrl ? (
                <img src={data.mediaUrl} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
              ) : (
                <div style={{ padding: '36px 0', textAlign: 'center', color: '#8696a0', fontSize: '0.78rem' }}>
                  [Foto / Imagem PNG]
                </div>
              )}
            </div>
          )}

          {data.type === 'VIDEO' && (
            <div
              style={{
                marginBottom: '6px',
                borderRadius: '6px',
                background: '#092d25',
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={18} fill="#fff" color="#fff" />
              </div>
            </div>
          )}

          {data.type === 'AUDIO' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', marginBottom: '4px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={14} fill="#000" color="#000" />
              </div>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>
                <div style={{ width: '35%', height: '100%', background: '#25D366', borderRadius: '2px' }} />
              </div>
              <span style={{ fontSize: '0.68rem', color: '#8696a0' }}>0:42</span>
            </div>
          )}

          {data.type === 'DOCUMENT' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.15)', padding: '8px', borderRadius: '6px', marginBottom: '6px' }}>
              <FileText size={22} color="#25D366" />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  documento-exclusivo.pdf
                </div>
                <div style={{ fontSize: '0.68rem', color: '#8696a0' }}>1.4 MB · PDF</div>
              </div>
            </div>
          )}

          {data.type === 'POLL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px' }}>
                {data.content || 'Pergunta da enquete'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#8696a0', marginBottom: '4px' }}>Selecione uma opção</div>
              {(data.pollOptions || []).map((opt, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                  }}
                >
                  <Circle size={14} color="#8696a0" />
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          )}

          {/* Text body if present */}
          {data.type !== 'POLL' && previewText && (
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.84rem' }}>
              {previewText}
            </div>
          )}

          {/* Timestamp and Double Checkmark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '4px',
              fontSize: '0.65rem',
              color: '#8696a0',
              marginTop: '4px',
            }}
          >
            <span>{timeStr}</span>
            <CheckCheck size={14} color="#53bdeb" />
          </div>
        </div>
      </div>
    </div>
  );
}
