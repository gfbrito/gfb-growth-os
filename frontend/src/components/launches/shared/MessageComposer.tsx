import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
  FileCheck,
  BarChart2,
  Sparkles,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Plus,
  Trash2,
  Clock,
} from 'lucide-react';

export interface ComposerData {
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'POLL';
  content: string;
  mediaUrl?: string;
  caption?: string;
  pollOptions?: string[];
  delayMinSeconds: number;
  delayMaxSeconds: number;
}

interface MessageComposerProps {
  initialData?: Partial<ComposerData>;
  onChange: (data: ComposerData) => void;
  showDelays?: boolean;
}

// Helper to evaluate Spintax {a|b|c}
export function evaluateSpintax(text: string): string {
  return text.replace(/\{([^{}]+)\}/g, (_, choices) => {
    const arr = choices.split('|');
    return arr[Math.floor(Math.random() * arr.length)];
  });
}

export function MessageComposer({ initialData, onChange, showDelays = true }: MessageComposerProps) {
  const [type, setType] = useState<ComposerData['type']>(initialData?.type || 'TEXT');
  const [content, setContent] = useState<string>(initialData?.content || '');
  const [mediaUrl, setMediaUrl] = useState<string>(initialData?.mediaUrl || '');
  const [caption, setCaption] = useState<string>(initialData?.caption || '');
  const [pollOptions, setPollOptions] = useState<string[]>(initialData?.pollOptions || ['Sim, com certeza!', 'Quero saber mais']);
  const [delayMin, setDelayMin] = useState<number>(initialData?.delayMinSeconds || 8);
  const [delayMax, setDelayMax] = useState<number>(initialData?.delayMaxSeconds || 25);
  const [spintaxSample, setSpintaxSample] = useState<string>('');

  const emit = (updated: Partial<ComposerData>) => {
    const next: ComposerData = {
      type: updated.type ?? type,
      content: updated.content ?? content,
      mediaUrl: updated.mediaUrl ?? mediaUrl,
      caption: updated.caption ?? caption,
      pollOptions: updated.pollOptions ?? pollOptions,
      delayMinSeconds: updated.delayMinSeconds ?? delayMin,
      delayMaxSeconds: updated.delayMaxSeconds ?? delayMax,
    };
    onChange(next);
  };

  const handleTypeSelect = (newType: ComposerData['type']) => {
    setType(newType);
    emit({ type: newType });
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    emit({ content: val });
  };

  const insertFormatting = (prefix: string, suffix: string) => {
    const textarea = document.getElementById('composer-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'texto'}${suffix}`;
    const nextContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(nextContent);
    emit({ content: nextContent });
  };

  const testSpintax = () => {
    const source = type === 'TEXT' ? content : (caption || content);
    setSpintaxSample(evaluateSpintax(source));
  };

  const addPollOption = () => {
    if (pollOptions.length < 5) {
      const next = [...pollOptions, `Opção ${pollOptions.length + 1}`];
      setPollOptions(next);
      emit({ pollOptions: next });
    }
  };

  const updatePollOption = (idx: number, val: string) => {
    const next = [...pollOptions];
    next[idx] = val;
    setPollOptions(next);
    emit({ pollOptions: next });
  };

  const removePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      const next = pollOptions.filter((_, i) => i !== idx);
      setPollOptions(next);
      emit({ pollOptions: next });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Type Selector */}
      <div>
        <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Tipo de Mensagem
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
          {[
            { id: 'TEXT', label: 'Texto', icon: FileText },
            { id: 'IMAGE', label: 'Imagem', icon: ImageIcon },
            { id: 'VIDEO', label: 'Vídeo', icon: VideoIcon },
            { id: 'AUDIO', label: 'Áudio PTT', icon: Mic },
            { id: 'DOCUMENT', label: 'Documento', icon: FileCheck },
            { id: 'POLL', label: 'Enquete', icon: BarChart2 },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = type === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTypeSelect(item.id as any)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 4px',
                  background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: isSelected ? 'var(--accent-green)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 700 : 500,
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Media URL for Image, Video, Audio, Document */}
      {type !== 'TEXT' && type !== 'POLL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            URL da Mídia ({type === 'IMAGE' ? 'JPEG/PNG' : type === 'VIDEO' ? 'MP4' : type === 'AUDIO' ? 'MP3/OGG' : 'PDF/DOCX'})
          </label>
          <input
            type="url"
            className="input-field"
            placeholder="https://..."
            value={mediaUrl}
            onChange={(e) => {
              setMediaUrl(e.target.value);
              emit({ mediaUrl: e.target.value });
            }}
          />
        </div>
      )}

      {/* Main Text Content / Caption */}
      {type !== 'POLL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              {type === 'TEXT' ? 'Mensagem' : 'Legenda (Opcional)'}
            </label>
            {/* Formatting Toolbar */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                title="Negrito (*texto*)"
                className="btn-icon"
                style={{ padding: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
              >
                <Bold size={13} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('_', '_')}
                title="Itálico (_texto_)"
                className="btn-icon"
                style={{ padding: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
              >
                <Italic size={13} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('~', '~')}
                title="Tachado (~texto~)"
                className="btn-icon"
                style={{ padding: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
              >
                <Strikethrough size={13} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('```', '```')}
                title="Monoespaçado"
                className="btn-icon"
                style={{ padding: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
              >
                <Code size={13} />
              </button>
            </div>
          </div>

          <textarea
            id="composer-textarea"
            className="input-field"
            rows={type === 'TEXT' ? 5 : 3}
            placeholder={
              type === 'TEXT'
                ? 'Digite a mensagem. Suporta Spintax: {Olá|Oi|Opa} time! Tudo bem?'
                : 'Adicione uma legenda para a mídia...'
            }
            value={type === 'TEXT' ? content : caption}
            onChange={(e) => {
              if (type === 'TEXT') {
                handleContentChange(e.target.value);
              } else {
                setCaption(e.target.value);
                emit({ caption: e.target.value });
              }
            }}
          />

          {/* Spintax Helper & Test */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Spintax inteligente: use <code>{'{opção 1|opção 2}'}</code> para variar disparos.
            </span>
            <button
              type="button"
              onClick={testSpintax}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              <Sparkles size={12} /> Testar Spintax
            </button>
          </div>

          {spintaxSample && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                fontSize: '0.78rem',
                color: '#e2e8f0',
              }}
            >
              <strong style={{ color: 'var(--accent-cyan)' }}>Variação gerada: </strong>
              {spintaxSample}
            </div>
          )}
        </div>
      )}

      {/* Poll Options */}
      {type === 'POLL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
              Pergunta da Enquete
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: Você vai participar da aula de hoje?"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Opções de Resposta</label>
              {pollOptions.length < 5 && (
                <button
                  type="button"
                  onClick={addPollOption}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    color: 'var(--accent-green)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={12} /> Adicionar Opção
                </button>
              )}
            </div>

            {pollOptions.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', minWidth: '18px' }}>{idx + 1}.</span>
                <input
                  type="text"
                  className="input-field"
                  value={opt}
                  onChange={(e) => updatePollOption(idx, e.target.value)}
                  placeholder={`Opção ${idx + 1}`}
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePollOption(idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anti-Ban Humanized Delay Range */}
      {showDelays && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Intervalo Anti-Ban (Humano)</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              {delayMin}s a {delayMax}s aleatório
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                <span>Mínimo</span>
                <span>{delayMin}s</span>
              </div>
              <input
                type="range"
                min="3"
                max="60"
                value={delayMin}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const newMin = Math.min(val, delayMax - 1);
                  setDelayMin(newMin);
                  emit({ delayMinSeconds: newMin });
                }}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                <span>Máximo</span>
                <span>{delayMax}s</span>
              </div>
              <input
                type="range"
                min="10"
                max="180"
                value={delayMax}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const newMax = Math.max(val, delayMin + 1);
                  setDelayMax(newMax);
                  emit({ delayMaxSeconds: newMax });
                }}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
