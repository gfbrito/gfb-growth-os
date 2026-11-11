import React, { useState } from 'react';
import {
  Info,
  Download,
  Film,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import type { OrganicPost } from './organic.types';

interface OrganicRankingProps {
  candidatosAnuncio: OrganicPost[];
  cortePercentil: number;
  top10: OrganicPost[];
  piores10: OrganicPost[];
  medianaPerfil: number;
  alcanceMinimo: number;
}

function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined) return '–';
  return val.toLocaleString('pt-BR');
}

export function OrganicRanking({
  candidatosAnuncio,
  cortePercentil,
  top10,
  piores10,
  medianaPerfil,
  alcanceMinimo,
}: OrganicRankingProps) {
  const [selectedCriterio, setSelectedCriterio] = useState<string>('engajamento');
  const [selectedFiltroPubs, setSelectedFiltroPubs] = useState<string>('todos');

  // Filter criteria options (Foto 7)
  const criterios = [
    { id: 'engajamento', label: 'Engajamento por alcance' },
    { id: 'salvamentos', label: 'Salvamentos por alcance' },
    { id: 'compartilhamentos', label: 'Compartilhamentos por alcance' },
    { id: 'salvos_compart', label: 'Salvos + compartilhados por mil alcançados' },
    { id: 'seguidores', label: 'Seguidores ganhos por mil alcançados' },
  ];

  const filtrosPubs = [
    { id: 'todos', label: 'Todos' },
    { id: 'organicos', label: 'Só orgânicos' },
    { id: 'anuncio', label: 'Usados em anúncio' },
  ];

  // Best of the period items
  const melhoresList = top10.length > 0 ? top10.slice(0, 9) : [];
  const candidatosList = candidatosAnuncio.length > 0 ? candidatosAnuncio.slice(0, 5) : [];

  const renderPostCard = (post: any, rankIdx?: number) => {
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
        style={{
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#0B0F19',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Media Thumbnail with Rank Badge (Foto 7) */}
        <div style={{ position: 'relative', height: '210px', background: '#020617', overflow: 'hidden' }}>
          <img
            src={post.mediaUrl || (post as any).thumbnailUrl || 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&auto=format&fit=crop&q=80'}
            alt="Thumbnail"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80';
            }}
          />

          {/* Top-left format badge */}
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

          {/* Top-right Rank Badge (Foto 7) */}
          {rankIdx !== undefined && (
            <span
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#10B981',
                color: '#022C16',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >
              #{rankIdx + 1}
            </span>
          )}
        </div>

        {/* Card Body */}
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

          {/* 2x2 Metrics Grid (Foto 7) */}
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Filter Controls (Foto 7 no Dark Theme) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Critério Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              CRITÉRIO
            </span>
            {criterios.map((c) => {
              const active = selectedCriterio === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCriterio(c.id)}
                  style={{
                    background: active ? 'rgba(16, 185, 129, 0.2)' : '#0B0F19',
                    border: active ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: active ? '#34D399' : '#94A3B8',
                    fontSize: '11.5px',
                    fontWeight: active ? 700 : 500,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Publicações Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              PUBLICAÇÕES
            </span>
            {filtrosPubs.map((f) => {
              const active = selectedFiltroPubs === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFiltroPubs(f.id)}
                  style={{
                    background: active ? 'rgba(16, 185, 129, 0.2)' : '#0B0F19',
                    border: active ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: active ? '#34D399' : '#94A3B8',
                    fontSize: '11.5px',
                    fontWeight: active ? 700 : 500,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
            <Info size={13} color="#64748B" />
          </div>
        </div>

        {/* Action: CSV */}
        <button
          onClick={() => alert('Exportando ranking em CSV...')}
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

      {/* SECTION 1: MELHORES DO PERÍODO (Foto 7) */}
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
              Melhores do período
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
            {melhoresList.length}
          </span>
        </div>

        <div style={{ padding: '18px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '14px',
            }}
          >
            {melhoresList.map((post, idx) => renderPostCard(post, idx))}
          </div>
        </div>
      </div>

      {/* SECTION 2: CANDIDATOS DO ORGÂNICO PARA ANÚNCIO (Foto 7) */}
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
              Candidatos do orgânico para anúncio
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
            {candidatosList.length}
          </span>
        </div>

        <div style={{ padding: '18px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '14px',
            }}
          >
            {candidatosList.map((post) => renderPostCard(post))}
          </div>

          <div style={{ marginTop: '14px', fontSize: '11px', color: '#64748B' }}>
            4 publicação(ões) abaixo do alcance mínimo ficaram de fora.
          </div>
        </div>
      </div>

      {/* Footer Disclaimer Note (Foto 7) */}
      <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
        Dados do Instagram · fuso da conta · os 2 dias mais recentes podem mudar (a Meta leva até 48 h para fechar)
      </div>
    </div>
  );
}

export default OrganicRanking;
