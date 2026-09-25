import { Request, Response } from "express";
import { mediaEngineService } from "../../services/mediaEngineService.js";

export interface MockMediaJob {
  id: string;
  type: "CAPTION_REEL_916" | "AUDIO_EVENT_DIARIZATION";
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  title: string;
  progress: number;
  durationSeconds: number;
  outputVideoUrl?: string;
  transcriptSample?: Array<{
    speaker: string;
    timestamp: string;
    text: string;
    confidence: number;
  }>;
  createdAt: string;
}

const mockMediaJobs: MockMediaJob[] = [
  {
    id: "job_caption_01",
    type: "CAPTION_REEL_916",
    status: "COMPLETED",
    title: "Reels Criativo 03 - Como Blindar o CAPI.mp4",
    progress: 100,
    durationSeconds: 58.4,
    outputVideoUrl: "https://capi.gfbdigital.com.br/sample_output_reels_916.mp4",
    createdAt: "2026-09-25T08:30:00Z",
  },
  {
    id: "job_diarization_02",
    type: "AUDIO_EVENT_DIARIZATION",
    status: "COMPLETED",
    title: "Imersão Presencial São Paulo - Mesa de Som Turno 1 (3h40).wav",
    progress: 100,
    durationSeconds: 13240,
    transcriptSample: [
      {
        speaker: "Gisley Fernandes",
        timestamp: "00:12:31",
        text: "Agora vamos começar a próxima parte do encontro de tráfego avançado.",
        confidence: 0.94,
      },
      {
        speaker: "Bruna Ortiz",
        timestamp: "00:12:44",
        text: "Antes disso, eu queria fazer uma observação sobre a nossa oferta de abertura.",
        confidence: 0.91,
      },
      {
        speaker: "ORADOR_DESCONHECIDO_01",
        timestamp: "00:13:05",
        text: "Vocês poderiam explicar como o Pixel e o CAPI se conversam no WhatsApp?",
        confidence: 0.88,
      },
    ],
    createdAt: "2026-09-24T18:00:00Z",
  },
];

export async function listMediaJobs(req: Request, res: Response): Promise<void> {
  res.json({ jobs: mockMediaJobs });
}

export async function createCaptionJob(req: Request, res: Response): Promise<void> {
  const { title } = req.body;

  const newJob: MockMediaJob = {
    id: `job_cap_${Date.now()}`,
    type: "CAPTION_REEL_916",
    status: "PROCESSING",
    title: title || "Novo Vídeo Legendado 9:16.mp4",
    progress: 45,
    durationSeconds: 60,
    createdAt: new Date().toISOString(),
  };

  mockMediaJobs.unshift(newJob);

  // Simulate completion after 5 seconds
  setTimeout(() => {
    newJob.status = "COMPLETED";
    newJob.progress = 100;
    newJob.outputVideoUrl = "https://capi.gfbdigital.com.br/sample_ready.mp4";
  }, 4000);

  res.status(202).json({ job: newJob });
}

export async function listSpeakers(req: Request, res: Response): Promise<void> {
  res.json({ speakers: mediaEngineService.listSpeakers() });
}

export async function addSpeaker(req: Request, res: Response): Promise<void> {
  const { name, role } = req.body;
  if (!name) {
    res.status(400).json({ error: "Nome do orador é obrigatório" });
    return;
  }
  const speaker = mediaEngineService.registerSpeaker(name, role || "SPEAKER");
  res.status(201).json({ success: true, speaker });
}

export async function exportJobMarkdown(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const job = mockMediaJobs.find((j) => j.id === id);

  const diarization = mediaEngineService.diarizeLongAudio({
    audioTitle: job?.title || "Gravação Mesa de Som.wav",
    durationSeconds: job?.durationSeconds || 7200,
  });

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="ata_${id}.md"`);
  res.send(diarization.markdownExport);
}

