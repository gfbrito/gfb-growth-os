import React from 'react';
import {
  Users,
  Clock,
  MapPin,
  Sparkles,
  Percent,
} from 'lucide-react';
import type { DemographicData, OnlineFollowerHour } from './organic.types';

interface OrganicAudienceProps {
  demografia: DemographicData;
  onlineFollowers: OnlineFollowerHour[];
  melhorHorario: string;
  dicaHorario: string;
}

export function OrganicAudience({
  demografia,
  onlineFollowers,
  melhorHorario,
  dicaHorario,
}: OrganicAudienceProps) {
  const maxFollowersHour = Math.max(...onlineFollowers.map((o) => o.valor), 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* 1. HORÁRIOS DE PICO DE SEGUIDORES ONLINE (Seção 6.14) */}
      <div
        style={{
          background: '#0F1626',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '14px',
          padding: '22px 26px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(14, 165, 233, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38BDF8',
              }}
            >
              <Clock size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
                Horários de Audiência Online (24 Horas)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748B' }}>
                Volume de seguidores ativos no Instagram por hora do dia (horário de Brasília).
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.76rem',
              color: '#34D399',
              fontWeight: 700,
            }}
          >
            <Sparkles size={14} />
            Melhor Horário: {melhorHorario}
          </div>
        </div>

        {/* 24-hour visual bar chart */}
        <div
          style={{
            height: '140px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '3px',
            paddingTop: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {onlineFollowers.map((item) => {
            const hPct = Math.min(Math.round((item.valor / maxFollowersHour) * 100), 100);
            const isPeak = `${item.hora}:00` === melhorHorario;
            return (
              <div
                key={item.hora}
                title={`${item.hora}h: ${(item.valor ?? 0).toLocaleString('pt-BR')} seguidores online`}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${hPct}%`,
                    minHeight: '4px',
                    background: isPeak
                      ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(180deg, #0EA5E9 0%, #0369A1 100%)',
                    borderRadius: '2px 2px 0 0',
                    boxShadow: isPeak ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Hour markers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.68rem', color: '#64748B' }}>
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>

        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#94A3B8' }}>
          💡 {dicaHorario} Recomendamos agendar conteúdos e stories 30 minutos antes do pico para maximizar a retenção da primeira hora.
        </div>
      </div>

      {/* 2. DEMOGRAFIA: GÊNERO & FAIXA ETÁRIA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Gender Breakdown */}
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '14px',
            padding: '20px 24px',
          }}
        >
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>
            Distribuição por Gênero
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                <span style={{ color: '#F472B6', fontWeight: 600 }}>Mulheres ({demografia.genero.feminino}%)</span>
                <span style={{ color: '#60A5FA', fontWeight: 600 }}>Homens ({demografia.genero.masculino}%)</span>
              </div>
              <div style={{ height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${demografia.genero.feminino}%`, background: '#EC4899' }} />
                <div style={{ width: `${demografia.genero.masculino}%`, background: '#3B82F6' }} />
              </div>
            </div>

            {/* Age bracket pyramid */}
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '8px', fontWeight: 600 }}>
                Faixas Etárias Predominantes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {demografia.faixasEtarias.map((f) => (
                  <div key={f.faixa} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                    <span style={{ width: '50px', color: '#64748B' }}>{f.faixa}</span>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${f.mulher + f.homem}%`,
                          background: '#8B5CF6',
                        }}
                      />
                    </div>
                    <span style={{ width: '45px', textAlign: 'right', color: '#F1F5F9', fontWeight: 600 }}>
                      {f.mulher + f.homem}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Cities */}
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '14px',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <MapPin size={16} color="#0EA5E9" />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>
              Principais Cidades (Brasil)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {demografia.principaisCidades.map((c) => (
              <div key={c.cidade} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#E2E8F0' }}>{c.cidade} - {c.estado}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '90px', height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.percentual * 2.5}%`, background: '#0EA5E9' }} />
                  </div>
                  <span style={{ color: '#0EA5E9', fontWeight: 700, width: '35px', textAlign: 'right' }}>
                    {c.percentual}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganicAudience;

