import React, { useState } from 'react';
import {
  Info,
  Download,
  Film,
  Layers,
  Image as ImageIcon,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import type { OrganicPost } from './organic.types';

interface OrganicContentsProps {
  posts: OrganicPost[];
  medianaEngajamento: number;
  temas: string[];
}

function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined) return '–';
  return val.toLocaleString('pt-BR');
}

export function OrganicContents({ posts, medianaEngajamento, temas }: OrganicContentsProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>('TODOS');
  const [selectedTema, setSelectedTema] = useState<string>('TODOS');
  const [sortBy, setSortBy] = useState<'recent' | 'reach' | 'engajamento' | 'saved'>('recent');
  const [activePostDetail, setActivePostDetail] = useState<OrganicPost | null>(null);

  // Filter logic
  let filtered = [...posts];

  if (selectedFormat !== 'TODOS') {
    filtered = filtered.filter((p) => {
      const type = String(p.mediaProductType || (p as any).tipo || '');
      if (selectedFormat === 'REELS') return type === 'REELS';
      if (selectedFormat === 'CAROUSEL') return type === 'CAROUSEL' || type === 'CAROUSEL_ALBUM';
      if (selectedFormat === 'IMAGE' || selectedFormat === 'FEED') return type === 'IMAGE' || type === 'FEED';
      return true;
    });
  }

  if (selectedTema !== 'TODOS') {
    filtered = filtered.filter((p) => p.tema === selectedTema);
  }

  // Sort logic
  if (sortBy === 'reach') {
    filtered.sort((a, b) => (b.reach || (b as any).alcance || 0) - (a.reach || (a as any).alcance || 0));
  } else if (sortBy === 'engajamento') {
    filtered.sort((a, b) => (b.taxaEngajamento || 0) - (a.taxaEngajamento || 0));
  } else if (sortBy === 'saved') {
    filtered.sort((a, b) => (b.saved || (b as any).salvamentos || 0) - (a.saved || (a as any).salvamentos || 0));
  } else {
    filtered.sort((a, b) => new Date(b.timestamp || (b as any).publicadoEm || 0).getTime() - new Date(a.timestamp || (a as any).publicadoEm || 0).getTime());
  }

  // Unique themes
  const availableTemas = Array.from(
    new Set(
      posts
        .map((p) => p.tema)
        .filter((t): t is string => Boolean(t) && t !== '–' && t !== 'Geral')
    )
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Filter Bar (Foto 6 no Dark Theme) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Format Dropdown */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            style={{
              background: '#0B0F19',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#F1F5F9',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <option value="TODOS">Todos os formatos</option>
            <option value="REELS">Reels</option>
            <option value="FEED">Foto</option>
            <option value="CAROUSEL">Carrossel</option>
          </select>

          {/* Tema Dropdown */}
          <select
            value={selectedTema}
            onChange={(e) => setSelectedTema(e.target.value)}
            style={{
              background: '#0B0F19',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#F1F5F9',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <option value="TODOS">Todos os temas</option>
            {availableTemas.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              background: '#0B0F19',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#F1F5F9',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <option value="recent">Mais recentes</option>
            <option value="reach">Maior alcance</option>
            <option value="engajamento">Maior engajamento</option>
            <option value="saved">Mais salvos</option>
          </select>
        </div>

        {/* Action Button: CSV */}
        <button
          onClick={() => alert('Exportando conteúdos em CSV...')}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '12px',
            color: '#E2E8F0',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <Download size={13} />
          ↓ CSV
        </button>
      </div>

      {/* Publicações Section (Foto 6 no Dark Theme) */}
      <div
        style={{
          background: '#0F1626',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
              Publicações
            </span>
            <Info size={13} color="#94A3B8" />
          </div>
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            {filtered.length}
          </span>
        </div>

        {/* 5-Column Grid */}
        <div style={{ padding: '18px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '14px',
            }}
          >
            {filtered.map((post: any) => {
              const alc = post.reach ?? post.alcance ?? 0;
              const vws = post.views ?? 0;
              const ints = post.totalInteractions ?? post.interacoes ?? 0;
              const taxa = post.taxaEngajamento ?? Number((((ints || 0) / (alc || 1)) * 100).toFixed(1));
              const slv = post.saved ?? post.salvamentos ?? 0;
              const comp = post.shares ?? post.compartilhamentos ?? 0;
              const segs = post.follows ?? post.ganhoSeguidores ?? null;
              const tema = post.tema || '–';

              const isReels = post.mediaProductType === 'REELS' || post.tipo === 'REELS';
              const isCarousel = post.mediaProductType === 'CAROUSEL' || post.tipo === 'CAROUSEL';
              const formatLabel = isReels ? 'Reels' : isCarousel ? 'Carrossel' : 'Foto';

              const rawDate = post.timestamp || post.publicadoEm;
              const d = rawDate ? new Date(rawDate) : new Date();
              const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
              const hookText = post.caption || post.legenda || 'Publicação do Instagram';

              return (
                <div
                  key={post.id}
                  onClick={() => setActivePostDetail(post)}
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#0B0F19',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
                >
                  {/* Media Thumbnail */}
                  <div style={{ position: 'relative', height: '210px', background: '#020617', overflow: 'hidden' }}>
                    <img
                      src={post.mediaUrl || (post as any).thumbnailUrl || 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&auto=format&fit=crop&q=80'}
                      alt="Thumbnail"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Top-left Format Pill */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {formatLabel}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>
                      {formattedDate}
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#F8FAFC',
                        lineHeight: '1.3',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '28px',
                      }}
                    >
                      {hookText}
                    </div>

                    {/* 2x2 Metrics Grid (Foto 6) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px', marginTop: 'auto' }}>
                      <div>
                        <span style={{ color: '#64748B' }}>Alcance: </span>
                        <strong style={{ color: '#F1F5F9' }}>{formatNumber(alc)}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Views: </span>
                        <strong style={{ color: '#F1F5F9' }}>{formatNumber(vws)}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Interações: </span>
                        <strong style={{ color: '#F1F5F9' }}>{formatNumber(ints)}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Engajamento: </span>
                        <strong style={{ color: taxa >= 5 ? '#34D399' : '#FBBF24' }}>
                          {taxa.toFixed(1).replace('.', ',')}%
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Salvos: </span>
                        <strong style={{ color: '#F1F5F9' }}>{formatNumber(slv)} (0,0%)</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Compart.: </span>
                        <strong style={{ color: '#F1F5F9' }}>{formatNumber(comp)} (0,0%)</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Seguidores: </span>
                        <strong style={{ color: '#F1F5F9' }}>{formatNumber(segs)}</strong>
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#64748B' }}>Tema: </span>
                        <strong style={{ color: '#F1F5F9' }}>{tema}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Disclaimer Note (Foto 6) */}
      <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
        Dados do Instagram · fuso da conta · os 2 dias mais recentes podem mudar (a Meta leva até 48 h para fechar)
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {activePostDetail && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setActivePostDetail(null)}
        >
          <div
            style={{
              background: '#0F1626',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#F8FAFC' }}>
                Detalhes da Publicação
              </div>
              <button
                onClick={() => setActivePostDetail(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <img
                  src={activePostDetail.mediaUrl || (activePostDetail as any).thumbnailUrl}
                  alt="Post"
                  style={{ width: '120px', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5', marginBottom: '10px' }}>
                    {activePostDetail.caption || activePostDetail.legenda}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Tema: <strong style={{ color: '#F8FAFC' }}>{activePostDetail.tema || '–'}</strong>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Alcance</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>{formatNumber(activePostDetail.reach || (activePostDetail as any).alcance)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Views</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>{formatNumber(activePostDetail.views)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Interações</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>{formatNumber(activePostDetail.totalInteractions || (activePostDetail as any).interacoes)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Engajamento</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#34D399' }}>
                    {(activePostDetail.taxaEngajamento || 0).toFixed(1).replace('.', ',')}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganicContents;
