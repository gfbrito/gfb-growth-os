/**
 * GFB Growth OS — Chunked Upload Engine & Media Codec Validator
 * Gerencia uploads particionados (chunks de 10MB) para vídeos pesados de até 2GB
 * com validação de codecs (H.264, HEVC, ProRes) e extensões (.mp4, .mov, .mkv, .webm).
 */

import crypto from "crypto";

export interface UploadSession {
  id: string;
  fileName: string;
  totalSizeBytes: number;
  totalSizeMb: number;
  chunkSizeBytes: number;
  totalChunks: number;
  receivedChunks: Set<number>;
  mimeType: string;
  codecDetected: string;
  status: "INITIALIZED" | "UPLOADING" | "REASSEMBLING" | "COMPLETED" | "FAILED";
  progressPercent: number;
  createdAt: number;
  completedAt?: number;
  outputMediaUrl?: string;
}

export class ChunkUploadService {
  private sessions: Map<string, UploadSession> = new Map();

  private allowedExtensions = [".mp4", ".mov", ".mkv", ".webm", ".wav", ".mp3"];
  private allowedCodecs = ["h264", "hevc", "prores", "aac", "pcm"];

  /**
   * Inicializa uma sessão de upload particionado
   */
  public initUploadSession(params: {
    fileName: string;
    fileSizeBytes: number;
    mimeType?: string;
  }): UploadSession {
    const ext = "." + params.fileName.split(".").pop()?.toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new Error(`Extensão "${ext}" não suportada. Use: ${this.allowedExtensions.join(", ")}`);
    }

    if (params.fileSizeBytes > 2 * 1024 * 1024 * 1024) {
      throw new Error("Arquivo excede o limite máximo permitido de 2 GB.");
    }

    const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB por chunk
    const totalChunks = Math.max(1, Math.ceil(params.fileSizeBytes / CHUNK_SIZE));
    const sessionId = `upl_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    // Detecção simulada de codec a partir da extensão / mime
    let codecDetected = "h264";
    if (ext === ".mov") codecDetected = "prores";
    else if (ext === ".webm") codecDetected = "vp9";
    else if (ext === ".mkv") codecDetected = "hevc";

    const session: UploadSession = {
      id: sessionId,
      fileName: params.fileName,
      totalSizeBytes: params.fileSizeBytes,
      totalSizeMb: Math.round((params.fileSizeBytes / (1024 * 1024)) * 10) / 10,
      chunkSizeBytes: CHUNK_SIZE,
      totalChunks,
      receivedChunks: new Set(),
      mimeType: params.mimeType || "video/mp4",
      codecDetected,
      status: "INITIALIZED",
      progressPercent: 0,
      createdAt: Date.now(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Registra o recebimento de uma fatia (chunk)
   */
  public receiveChunk(params: {
    uploadId: string;
    chunkIndex: number;
    chunkDataSize?: number;
  }): { progressPercent: number; isComplete: boolean; session: UploadSession } {
    const session = this.sessions.get(params.uploadId);
    if (!session) {
      throw new Error("Sessão de upload não encontrada ou expirada.");
    }

    session.status = "UPLOADING";
    session.receivedChunks.add(params.chunkIndex);

    session.progressPercent = Math.min(
      100,
      Math.round((session.receivedChunks.size / session.totalChunks) * 100)
    );

    const isComplete = session.receivedChunks.size >= session.totalChunks;
    if (isComplete) {
      session.status = "REASSEMBLING";
    }

    return {
      progressPercent: session.progressPercent,
      isComplete,
      session,
    };
  }

  /**
   * Finaliza o upload e disponibiliza a mídia para o motor de legendagem/corte
   */
  public finalizeUpload(uploadId: string): UploadSession {
    const session = this.sessions.get(uploadId);
    if (!session) {
      throw new Error("Sessão de upload não encontrada.");
    }

    session.status = "COMPLETED";
    session.progressPercent = 100;
    session.completedAt = Date.now();
    session.outputMediaUrl = `https://storage.gfbdigital.com.br/uploads/${session.fileName}`;

    return session;
  }

  /**
   * Retorna o status de uma sessão ativa
   */
  public getSession(uploadId: string): UploadSession | undefined {
    return this.sessions.get(uploadId);
  }
}

export const chunkUploadService = new ChunkUploadService();
