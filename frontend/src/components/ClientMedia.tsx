import React, { useState } from 'react';
import {
  Video,
  Mic,
  Scissors,
  Sparkles,
  Download,
  Play,
  Pause,
  Upload,
  Clock,
  CheckCircle,
  Volume2,
  FileAudio,
  Check,
  RotateCcw
} from 'lucide-react';

export function ClientMedia() {
  const [mediaSubTab, setMediaSubTab] = useState<'caption' | 'transcriber'>('caption');

  // Video Captioner state
  const [reviewBeforeExport, setReviewBeforeExport] = useState(true);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [silenceBlocks, setSilenceBlocks] = useState([
    { id: 'sil_1', start: '00:04.2', end: '00:05.1', duration: '0.9s', cut: true },
    { id: 'sil_2', start: '00:18.6', end: '00:20.1', duration: '1.5s', cut: true },
    { id: 'sil_3', start: '00:32.4', end: '00:33.2', duration: '0.8s', cut: false },
    { id: 'sil_4', start: '00:45.0', end: '00:46.3', duration: '1.3s', cut: true },
  ]);

  const [captionLines, setCaptionLines] = useState([
    { id: 'cap_1', text: 'Como blindar o rastreamento no WhatsApp?', edited: false },
    { id: 'cap_2', text: 'Muitos gestores perdem vendas porque o pixel não recebe o token.', edited: false },
    { id: 'cap_3', text: 'Com o CAPI Gateway v3.0, a atribuição é 100% mantida.', edited: false },
  ]);

  // Chunked Upload Engine state
  const [isUploadingChunked, setIsUploadingChunked] = useState(false);
  const [chunkProgress, setChunkProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(30);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [processedVideos, setProcessedVideos] = useState([
    { name: 'criativo_escala_ppp_01_916.mp4', size: '24.2 MB', silences: '4 silêncios cortados', time: 'Hoje às 10:14' },
    { name: 'convite_grupo_vip_outubro_916.mp4', size: '18.6 MB', silences: '6 silêncios cortados', time: 'Ontem às 18:22' },
  ]);

  const handleSimulateChunkUpload = async () => {
    setIsUploadingChunked(true);
    setChunkProgress(0);
    setCurrentChunk(0);
    setUploadFeedback('Inicializando sessão particionada (300 MB em chunks de 10 MB)...');

    try {
      const initRes = await fetch('/api/media/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'Aula_Inaugural_Acupuntura_ProRes.mov',
          fileSizeBytes: 314572800,
          mimeType: 'video/quicktime',
        }),
      });
      const initData = await initRes.json();
      const uploadId = initData.session.id;
      const chunksCount = initData.session.totalChunks || 30;
      setTotalChunks(chunksCount);

      for (let i = 0; i < chunksCount; i++) {
        await new Promise((r) => setTimeout(r, 60));
        setCurrentChunk(i + 1);
        const percent = Math.round(((i + 1) / chunksCount) * 100);
        setChunkProgress(percent);
        setUploadFeedback(`Enviando chunk ${i + 1} de ${chunksCount} (10 MB cada) — Codec ProRes validado`);

        await fetch('/api/media/upload/chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadId,
            chunkIndex: i,
            chunkDataSize: 10485760,
          }),
        });
      }

      setUploadFeedback('Reagrupando fatias e enviando para o worker FFmpeg 9:16...');
      const compRes = await fetch('/api/media/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId }),
      });
      await compRes.json();

      setProcessedVideos((prev) => [
        {
          name: 'Aula_Inaugural_Acupuntura_ProRes_916.mp4',
          size: '300 MB',
          silences: '4 silêncios cortados • ProRes',
          time: 'Agora mesmo',
        },
        ...prev,
      ]);

      setUploadFeedback('Upload de 300 MB concluído e reenquadrado com sucesso!');
      setTimeout(() => {
        setIsUploadingChunked(false);
        setUploadFeedback(null);
      }, 3500);
    } catch (err: any) {
      setUploadFeedback(`Erro no upload: ${err.message}`);
      setIsUploadingChunked(false);
    }
  };

  const toggleSilenceCut = (id: string) => {
    setSilenceBlocks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, cut: !s.cut } : s))
    );
  };

  const handleEditCaption = (id: string, newText: string) => {
    setCaptionLines((prev) =>
      prev.map((c) => (c.id === id ? { ...c, text: newText, edited: true } : c))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub Tabs Bar */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
        {[
          { id: 'caption', label: 'Legenda Rápida 9:16 (Passagem Única)', icon: Video, badge: 'FFmpeg + Waveform' },
          { id: 'transcriber', label: 'Transcriber de Eventos (Mesa de Som)', icon: Mic, badge: 'Speaker Registry' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = mediaSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMediaSubTab(tab.id as any)}
              style={{
                background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                borderRadius: '10px',
                padding: '8px 16px',
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} color={isActive ? 'var(--accent-purple)' : 'currentColor'} />
              {tab.label}
              {tab.badge && (
                <span className={`badge ${isActive ? 'badge-purple' : 'badge-cyan'}`} style={{ fontSize: '0.62rem' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: LEGENDA RÁPIDA 9:16 (PADRÃO 150.230.73.107) */}
      {/* ======================================================== */}
      {mediaSubTab === 'caption' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
          {/* Smartphone 9:16 Mockup */}
          <div
            className="glass-panel"
            style={{
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '260px',
                height: '460px',
                background: '#040711',
                borderRadius: '36px',
                border: '4px solid #1E293B',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px 16px',
                overflow: 'hidden',
              }}
            >
              {/* Speaker Notch */}
              <div
                style={{
                  width: '60px',
                  height: '4px',
                  background: '#334155',
                  borderRadius: '2px',
                  margin: '0 auto',
                }}
              />

              {/* Animated Caption Demonstration */}
              <div style={{ textAlign: 'center', padding: '0 10px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.4 }}>
                  "Como blindar o{' '}
                  <span
                    style={{
                      color: '#10B981',
                      background: 'rgba(16, 185, 129, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    rastreamento
                  </span>{' '}
                  no WhatsApp?"
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                  palavra por palavra animada
                </div>
              </div>

              {/* Video Specs Tag */}
              <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                1080×1920 • 9:16 Vertical • 60 FPS
              </div>
            </div>
          </div>

          {/* Right Upload & Actions Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
                Legenda Rápida 9:16 (Passagem Única)
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                Envie um vídeo bruto e receba de volta reenquadrado verticalmente com fundo desfocado, corte de silêncios secos e destaque palavra por palavra.
              </p>

              {/* Dropzone & Chunk Upload Engine */}
              <div
                style={{
                  border: '2px dashed var(--border-highlight)',
                  borderRadius: '12px',
                  padding: '24px 20px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  marginBottom: '16px',
                }}
              >
                <Upload size={32} color="var(--accent-purple)" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
                  Solte o vídeo aqui ou clique para escolher
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
                  Formatos aceitos: mp4, mov, mkv ou webm — até 2 GB (Chunks de 10 MB)
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <span className="badge badge-purple">H.264 / AVC</span>
                  <span className="badge badge-cyan">HEVC / H.265</span>
                  <span className="badge badge-green">Apple ProRes</span>
                </div>

                {isUploadingChunked ? (
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
                        Enviando Chunks: {currentChunk} / {totalChunks}
                      </span>
                      <span style={{ fontWeight: 800, color: '#fff' }}>{chunkProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: `${chunkProgress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
                          borderRadius: '4px',
                          transition: 'width 0.1s ease',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{uploadFeedback}</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={handleSimulateChunkUpload}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={14} /> Simular Upload em Chunks (300 MB ProRes)
                    </button>
                    <button
                      onClick={() => setShowEditorModal(true)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <Scissors size={14} /> Abrir Editor Waveform
                    </button>
                  </div>
                )}
              </div>

              {/* Review Before Export Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Revisar antes de exportar</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Para numa tela de waveform para cortar silêncios e ajustar legendas antes de renderizar.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={reviewBeforeExport}
                  onChange={(e) => setReviewBeforeExport(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-green)' }}
                />
              </div>
            </div>

            {/* Ready Results Card */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '12px' }}>
                Vídeos Processados nesta Conta ({processedVideos.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {processedVideos.map((vid, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{vid.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {vid.size} • {vid.silences} • {vid.time}
                      </div>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.72rem' }}>
                      <Download size={13} /> Baixar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: TRANSCRIBER (MESA DE SOM & DIARIZAÇÃO) */}
      {/* ======================================================== */}
      {mediaSubTab === 'transcriber' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Diarização & Reconhecimento de Oradores</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Transcrição de áudios de mesa de som (2h a 4h) com identificação automática de oradores conhecidos (Speaker Registry).
                </p>
              </div>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>
                <Upload size={14} /> Subir Áudio WAV/MP3 (Mesa)
              </button>
            </div>

            {/* Speaker Registry Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Oradores Registrados (PyAnnote Voiceprints):</span>
              <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>🎙️ Gisley Fernandes (98%)</span>
              <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>🎙️ Bruna Ortiz (96%)</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>🎙️ Arthur Gestor (94%)</span>
              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontSize: '0.68rem' }}>
                🛡️ Rejeição de Ruído Ativa
              </span>
            </div>

            {/* Transcript Viewer */}
            <div
              style={{
                background: '#040711',
                borderRadius: '12px',
                padding: '18px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                lineHeight: 1.7,
                maxHeight: '380px',
                overflowY: 'auto',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                [00:12:31] Gisley Fernandes (Confiança: 98%):
              </div>
              <div style={{ color: '#fff', marginBottom: '12px' }}>
                "Iniciando a sessão de alinhamento estratégico do lançamento. Nossa esteira do CAPI está com 9.4 de pontuação."
              </div>

              <div style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
                [00:12:44] Bruna Ortiz (Confiança: 96%):
              </div>
              <div style={{ color: '#fff', marginBottom: '12px' }}>
                "Excelente. Os grupos do WhatsApp já estão recebendo leads pelo link /l/bruna-vip sem nenhum travamento."
              </div>

              <div style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
                [00:13:05] ORADOR_DESCONHECIDO_01 (Confiança: 58% - Rejeitado pelo Registry):
              </div>
              <div style={{ color: '#fff', marginBottom: '12px' }}>
                "Vocês poderiam explicar como o token de intenção impede que a pessoa perca a atribuição no checkout?"
              </div>

              <div style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                [00:13:22] Gisley Fernandes (Confiança: 98%):
              </div>
              <div style={{ color: '#fff' }}>
                "Exatamente por causa do parâmetro s2 anexado à Kiwify. Mesmo que o comprador abra em nova aba, o capi_idx permanece amarrado."
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
                onClick={() => {
                  fetch('/api/media/jobs/job_diarization_02/export')
                    .then((r) => r.text())
                    .then((text) => {
                      navigator.clipboard.writeText(text);
                      alert('Ata estruturada copiada para a área de transferência!');
                    });
                }}
              >
                Copiar Ata Completa (Markdown)
              </button>
              <a
                href="/api/media/jobs/job_diarization_02/export"
                target="_blank"
                download="ata_mesa_de_som.md"
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> Exportar Ata para n8n / Claude / GPT
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Editor de Revisão com Waveform Modal (padrão editor.html) */}
      {showEditorModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
          }}
          onClick={() => setShowEditorModal(false)}
        >
          <div
            className="glass-panel-elevated"
            style={{ width: '840px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Editor de Revisão Pré-Render (Waveform)</h3>
              <button
                onClick={() => setShowEditorModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Waveform Visualizer Mockup */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                FORMA DE ONDA DE ÁUDIO (WAVESURFER.JS) • DURAÇÃO: 00:58s
              </div>
              <div
                style={{
                  height: '70px',
                  background: '#040711',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '0 12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {Array.from({ length: 48 }, (_, i) => {
                  const h = Math.max(10, Math.sin(i * 0.4) * 45 + 10);
                  const isSilent = i > 12 && i < 16;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: isSilent ? '3px' : `${h}px`,
                        background: isSilent ? '#EF4444' : '#10B981',
                        borderRadius: '2px',
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Silence Candidates Track */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>
                Faixa de Silêncios Detectados (Clique para cortar ou manter):
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                {silenceBlocks.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleSilenceCut(s.id)}
                    style={{
                      background: s.cut ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${s.cut ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      padding: '8px 10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                      <strong>{s.duration}</strong>
                      <span className={`badge ${s.cut ? 'badge-rose' : 'badge'}`} style={{ fontSize: '0.62rem' }}>
                        {s.cut ? 'CORTAR' : 'MANTER'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {s.start} → {s.end}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Captions Editing Track */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>
                Faixa de Legendas (Edite o texto inline):
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {captionLines.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="text"
                      value={c.text}
                      onChange={(e) => handleEditCaption(c.id, e.target.value)}
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#fff',
                        fontSize: '0.82rem',
                      }}
                    />
                    {c.edited && <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Editado</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setShowEditorModal(false)}>
                Exportar sem Cortes
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  alert('Vídeo renderizado com cortes de silêncio aplicados e legendas em destaque!');
                  setShowEditorModal(false);
                }}
              >
                <Check size={16} /> Aprovar e Renderizar com Cortes FFmpeg
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
