import React from 'react';
import {
  Target,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Percent,
  Calendar,
  Sparkles,
  MousePointerClick,
  Users,
} from 'lucide-react';

interface SemanasConstancia {
  semana: string;
  feed: number;
  reels: number;
  carrossel: number;
  stories: number;
  cumpriuTodas: boolean;
}

interface OrganicPerformanceProps {
  taxaAcertoPct: number;
  medianaEngajamento: number;
  metasSemanais: {
    postsFeed: number;
    reels: number;
    carrosseis: number;
    stories: number;
  };
  semanas: SemanasConstancia[];
  conversaoPerfil: {
    seguidoresPorMilAlcancados: number;
    cliquesBioPorMil: number;
  };
}

export function OrganicPerformance({
  taxaAcertoPct,
  medianaEngajamento,
  metasSemanais,
  semanas,
  conversaoPerfil,
}: OrganicPerformanceProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* 1. CARDS DE EFICIÊNCIA & TAXA DE ACERTO (Seção 6.6) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>Taxa de Acerto Global</span>
            <Target size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981' }}>
            {taxaAcertoPct}%
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#64748B' }}>
            Percentual de publicações que superaram a mediana de engajamento ({medianaEngajamento}%)
          </p>
        </div>

        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>Novos Seguidores / 1.000 Alcance</span>
            <Users size={18} color="#0EA5E9" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0EA5E9' }}>
            {conversaoPerfil.seguidoresPorMilAlcancados}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#64748B' }}>
            Eficiência de conversão de visitantes únicos em novos seguidores
          </p>
        </div>

        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>Cliques no Link / 1.000 Alcance</span>
            <MousePointerClick size={18} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8B5CF6' }}>
            {conversaoPerfil.cliquesBioPorMil}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#64748B' }}>
            Taxa de direcionamento para o WhatsApp / Catálogo da loja
          </p>
        </div>
      </div>

      {/* 2. SEMÁFORO DE METAS SEMANAIS & CONSTÂNCIA (Seção 6.8) */}
      <div
        style={{
          background: '#0F1626',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '14px',
          padding: '22px 26px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
              Semáforo de Metas Semanais (Constância Editorial)
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748B' }}>
              Metas acordadas: {metasSemanais.reels} Reels/sem, {metasSemanais.carrosseis} Carrossel/sem, {metasSemanais.postsFeed} Feed/sem, {metasSemanais.stories} Stories/sem.
            </p>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399',
            }}
          >
            3 de 4 Semanas no Alvo
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Semana</th>
                <th style={{ padding: '10px 12px' }}>Reels (Meta: {metasSemanais.reels})</th>
                <th style={{ padding: '10px 12px' }}>Carrossel (Meta: {metasSemanais.carrosseis})</th>
                <th style={{ padding: '10px 12px' }}>Feed Estático (Meta: {metasSemanais.postsFeed})</th>
                <th style={{ padding: '10px 12px' }}>Stories (Meta: {metasSemanais.stories})</th>
                <th style={{ padding: '10px 12px' }}>Status Geral</th>
              </tr>
            </thead>
            <tbody>
              {semanas.map((s) => (
                <tr key={s.semana} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#F1F5F9' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{s.semana}</td>
                  <td style={{ padding: '12px', color: s.reels >= metasSemanais.reels ? '#10B981' : '#F59E0B' }}>
                    {s.reels} / {metasSemanais.reels}
                  </td>
                  <td style={{ padding: '12px', color: s.carrossel >= metasSemanais.carrosseis ? '#10B981' : '#F59E0B' }}>
                    {s.carrossel} / {metasSemanais.carrosseis}
                  </td>
                  <td style={{ padding: '12px', color: s.feed >= metasSemanais.postsFeed ? '#10B981' : '#EF4444' }}>
                    {s.feed} / {metasSemanais.postsFeed}
                  </td>
                  <td style={{ padding: '12px', color: s.stories >= metasSemanais.stories ? '#10B981' : '#F59E0B' }}>
                    {s.stories} / {metasSemanais.stories}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {s.cumpriuTodas ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 700, fontSize: '0.75rem' }}>
                        <CheckCircle2 size={14} /> Cumprida
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#F59E0B', fontWeight: 700, fontSize: '0.75rem' }}>
                        <XCircle size={14} /> Parcial
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default OrganicPerformance;

